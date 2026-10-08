#!/usr/bin/env node
/**
 * 安全构建：**任何一步失败都不会动 dist/**。
 *
 * 为什么需要这个：Vite 默认 `emptyOutDir: true`，会在构建**开始时就清空 outDir**。
 * 于是「构建中途失败」的后果不是"没更新"，而是**把一个原本可用的 dist/ 变成空目录或半成品** ——
 * 既上不了线，也没有可回退的产物。这正是"无法回退但处理失败"的典型形态。
 *
 * 做法：构建到 `.build-staging/`，全部成功后才换入 dist/；
 * 换入过程本身也带还原（先把旧 dist 挪到 dist-prev，换入失败就把上一版挪回来）。
 *
 * 用法：`npm run build`
 */

import { spawnSync } from 'node:child_process'
import { existsSync, renameSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = process.cwd()
const STAGING = resolve(root, '.build-staging')
const DIST = resolve(root, 'dist')
const PREV = resolve(root, 'dist-prev')
const NODE = process.execPath

/**
 * stdio 故意用 'inherit' 而不是默认的 'pipe'：
 * DSH 沙箱禁止"带管道 stdio 起子进程"（EPERM），inherit 是那里唯一能跑通的形态；
 * 顺带让 tsc / vite 的彩色输出直达终端，不会被吃掉。
 */
function step(title, args) {
  console.log(`\n▸ ${title}`)
  const result = spawnSync(NODE, args, { cwd: root, stdio: 'inherit' })
  if (result.error) {
    console.error(`  ✗ 启动失败：${result.error.message}`)
    return false
  }
  if (result.status !== 0) {
    console.error(`  ✗ 退出码 ${result.status}`)
    return false
  }
  return true
}

function abort(message) {
  console.error(message)
  process.exit(1)
}

// ── ① 类型检查（纯 JS，不 spawn 子进程） ─────────────────────────────────
if (!step('类型检查 tsc -b', ['node_modules/typescript/bin/tsc', '-b'])) {
  abort('\n✗ 类型检查未通过 —— dist/ 未做任何改动，上一版产物仍然可用。')
}

// ── ② 清掉上一次可能残留的中间目录 ───────────────────────────────────────
rmSync(STAGING, { recursive: true, force: true })

// ── ③ 构建到中间目录（此时 dist 一根毫毛都没动） ────────────────────────
if (
  !step('构建到 .build-staging', [
    'node_modules/vite/bin/vite.js',
    'build',
    '--outDir',
    '.build-staging',
    '--emptyOutDir',
  ])
) {
  rmSync(STAGING, { recursive: true, force: true })
  abort('\n✗ 构建失败 —— dist/ 未做任何改动，上一版产物仍然可用。')
}

// 产物自检：有 index.html 才算是一次可用的构建
if (!existsSync(join(STAGING, 'index.html'))) {
  rmSync(STAGING, { recursive: true, force: true })
  abort('\n✗ 中间目录里没有 index.html —— 判定构建不可用，dist/ 未动。')
}

// ── ④ 换入：旧 dist → dist-prev，新产物 → dist；两条路径都可还原 ────────
console.log('\n▸ 换入 dist')
let movedPrev = false
try {
  if (existsSync(DIST)) {
    rmSync(PREV, { recursive: true, force: true })
    renameSync(DIST, PREV)
    movedPrev = true
  }
  renameSync(STAGING, DIST)
} catch (err) {
  console.error(`  ✗ 换入失败：${err.message}`)
  try {
    if (movedPrev && !existsSync(DIST)) {
      renameSync(PREV, DIST)
      console.error('  ↺ 已把上一版 dist/ 还原')
    }
  } catch (restoreErr) {
    console.error(`  ✗ 还原也失败：${restoreErr.message}`)
    console.error(`    上一版产物仍完整保留在 dist-prev/，手动改名回 dist 即可。`)
  }
  rmSync(STAGING, { recursive: true, force: true })
  process.exit(1)
}

// ── ⑤ 成功后才丢掉备份 ──────────────────────────────────────────────────
rmSync(PREV, { recursive: true, force: true })
console.log('\n✓ 构建完成，dist/ 已更新（任何一步失败都不会破坏上一版）')
