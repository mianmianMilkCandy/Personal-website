/* ============================================================================
   真机性能探针 —— 只在地址里带 `?perf=1` 时启用（生产构建里也可安全保留）
   ----------------------------------------------------------------------------
   为什么要它：站点的"卡顿"是**观感**问题，而无头 Chrome 走软件光栅、合成器还会
   空闲降频，测出来的长帧一半是夹具偏差（见 PERF-REVIEW-v2.md §4.2 与 U1/U2）。
   真正的判据只能来自用户的真机 + 真实 GPU，所以这里把测量做成一个开关：
   打开 `?perf=1` 滚一遍，控制台会打印一份可复制的报告。

   **关键设计：只有"持续掉帧"才提示，且指令不打架。**
   每一帧的耗时天然会在**滚动惯性结束、开始静止**时出现一个尖峰，真要"超过预算
   就提示"，会在每次停手时误报一次。所以判据是「5 秒滑动窗口里最长帧 > 1.5 帧
   预算」：一次性尖峰会自己滑出窗口，持续卡顿才会留下。

   它不参与任何渲染路径：没有 DOM、没有样式，只挂 3 个观察器 + 一条 rAF 计时，
   并且在 `?perf=1` 之外**连 rAF 都不注册**（本站的硬纪律：不得引入常驻循环）。
   ========================================================================== */

/** 一帧预算：连续掉帧才是问题，单帧尖峰不算。 */
const BUDGET_MS = 16.7
/** 持续掉帧的判据：这条窗口内最长的帧超过 1.5 帧预算。 */
const ROLL_MS = 5000
/** 窗口内保留多少帧 */
const MAX_FRAMES = 900

type Bucket = '静止' | '滚动/翻面' | '过渡中'

type LongTaskRecord = { start: number; dur: number; bucket: Bucket }

function fmt(n: number | null, digits = 1): string {
  return n === null ? '—' : n.toFixed(digits)
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null
  const i = Math.min(sorted.length - 1, Math.floor(sorted.length * p))
  return sorted[i]
}

/** 取当前活跃面的相位，用来把帧分到"滚动/翻面"或"过渡中"。 */
function activeFaceState(): { present: boolean; state: string } {
  const slot = document.querySelector('.cube__slot[data-face]:not([data-parked])')
  if (!slot) return { present: false, state: 'none' }
  return { present: true, state: slot.getAttribute('data-state') ?? 'none' }
}

/**
 * 一帧的"上下文"。判据只看**当前活跃面的相位**（`data-state`）：
 *   · `in`     = 有正文在场，即"滚动/翻面"过程中真正该流畅的那一段；
 *   · 其它值   = 处于 `CONTENT_EXIT_AT/ENTER_AT` 之间的过渡窗（面在转、正文已退）。
 * 这两个桶分开统计，才能回答"掉帧是发生在翻面中，还是发生在我已经停手之后"。
 */
function frameBucket(): Bucket {
  const face = activeFaceState()
  if (!face.present) return '静止'
  return face.state === 'in' ? '滚动/翻面' : '过渡中'
}

export function initPerfProbe(): void {
  const frames: { d: number; at: number; bucket: Bucket }[] = []
  const longTasks: LongTaskRecord[] = []
  const slowFrames: number[] = []
  /** 上一次"提示"的时间，避免持续卡顿时刷屏 */
  let lastNotice = 0
  let running = true
  let raf = 0
  let last = 0

  const onFrame = (t: number) => {
    if (!running) return
    if (last > 0) {
      const delta = t - last
      // 0 或负值是同一次回调重复触发，忽略
      if (delta > 0) {
        frames.push({ d: delta, at: t, bucket: frameBucket() })
        if (frames.length > MAX_FRAMES) frames.shift()
      }
    }
    last = t

    // 持续掉帧提示：滑动窗口内最长帧超预算 —— 单次尖峰会自己滑出去
    const since = t - ROLL_MS
    let worst = 0
    for (let i = frames.length - 1; i >= 0; i--) {
      const sample = frames[i]
      if (sample.at < since) break
      if (sample.d > worst) worst = sample.d
    }
    if (worst > BUDGET_MS * 1.5 && t - lastNotice > 4000) {
      lastNotice = t
      slowFrames.push(worst)
      // eslint-disable-next-line no-console
      console.warn(
        `[perf] 最近 ${ROLL_MS / 1000}s 内最长帧 ${fmt(worst)}ms（预算 ${BUDGET_MS}ms）` +
          ` —— 若这是持续现象，请滚完整页后复制 __perfProbe.report() 的输出`,
      )
    }

    raf = requestAnimationFrame(onFrame)
  }

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        longTasks.push({
          start: entry.startTime,
          dur: entry.duration,
          bucket: frameBucket(),
        })
      }
    }).observe({ entryTypes: ['longtask'] })
  } catch {
    /* 浏览器不支持 longtask 就跳过，不影响其余指标 */
  }

  let cls = 0
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // @ts-expect-error layout-shift 条目上的 hadRecentInput 不在标准类型里
        if (!entry.hadRecentInput) cls += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  } catch {
    /* 同上 */
  }

  /* LCP 必须用 observer 拿：`performance.getEntriesByType('largest-contentful-paint')`
     在 Chrome 里返回空数组（LCP 条目不进入那个 buffer），实测报告里一直是 "—"。
     用 buffered: true 可以把早于本探针注册的那一条补回来。 */
  let lcp = 0
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1]
      if (last) lcp = last.startTime
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  } catch {
    /* 同上 */
  }

  /** 生成一份纯文本报告：可直接整段复制粘给我。 */
  const report = () => {
    const sorted = [...frames].map((f) => f.d).sort((a, b) => a - b)
    const slow = sorted.filter((d) => d > BUDGET_MS * 1.5)
    const tasks = [...longTasks].sort((a, b) => b.dur - a.dur)
    /* 按上下文分开统计 —— 这一节才是"该往哪儿优化"的答案：
       掉帧集中在"过渡中"就说明是翻面的栅格化成本；集中在"滚动/翻面"就往
       合成层/遮罩上查；落在"静止"就是别的问题（脚本、GC、其它页面）。 */
    const byBucket = new Map<Bucket, number[]>()
    for (const f of frames) {
      const list = byBucket.get(f.bucket) ?? []
      list.push(f.d)
      byBucket.set(f.bucket, list)
    }
    const bucketLine = (name: Bucket) => {
      const list = (byBucket.get(name) ?? []).sort((a, b) => a - b)
      if (list.length === 0) return `  ${name.padEnd(10)} —`
      const worst = list[list.length - 1]
      const bad = list.filter((d) => d > BUDGET_MS * 1.5).length
      return (
        `  ${name.padEnd(10)} ${String(list.length).padStart(4)} 帧 · ` +
        `p50 ${fmt(percentile(list, 0.5))} / p95 ${fmt(percentile(list, 0.95))} / ` +
        `最长 ${fmt(worst)} ms · 掉帧 ${bad} 帧`
      )
    }
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const transferred = entries.reduce((sum, e) => sum + (e.transferSize || 0), 0)
    const fromCache = entries.filter((e) => e.transferSize === 0 && e.decodedBodySize > 0).length
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined

    const lines = [
      '=== 个人网站 · 真机性能报告（复制这一段即可）===',
      `UA            ${navigator.userAgent}`,
      `视口           ${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio}x`,
      `帧数/采样       ${sorted.length}`,
      `帧间隔 p50      ${fmt(percentile(sorted, 0.5))} ms`,
      `帧间隔 p95      ${fmt(percentile(sorted, 0.95))} ms`,
      `帧间隔 p99      ${fmt(percentile(sorted, 0.99))} ms`,
      `最长帧          ${fmt(sorted.length ? sorted[sorted.length - 1] : null)} ms`,
      `超 1.5 帧预算    ${slow.length} 帧（占 ${fmt(sorted.length ? (slow.length / sorted.length) * 100 : 0)}%）`,
      `持续掉帧提示     ${slowFrames.length} 次`,
      '掉帧按上下文 ——',
      bucketLine('滚动/翻面'),
      bucketLine('过渡中'),
      bucketLine('静止'),
      `长任务(>50ms)    ${tasks.length} 条，最长 ${fmt(tasks.length ? tasks[0].dur : null)} ms`,
      ...tasks.slice(0, 5).map((t) => `  · ${fmt(t.dur)}ms @${fmt(t.start / 1000, 1)}s [${t.bucket}]`),
      `CLS           ${cls.toFixed(5)}`,
      `LCP           ${lcp ? fmt(lcp) + ' ms' : '—'}`,
      nav
        ? `FCP/DCL/Load  ${fmt(nav.responseEnd)} / ${fmt(nav.domContentLoadedEventEnd)} / ${fmt(nav.loadEventEnd)} ms`
        : '',
      `资源           ${entries.length} 个，传输 ${(transferred / 1024).toFixed(1)} KB，命中缓存 ${fromCache} 个`,
      '=== 报告结束 ===',
    ].filter(Boolean)
    const text = lines.join('\n')
    // eslint-disable-next-line no-console
    console.log(text)
    return text
  }

  window.addEventListener('pagehide', () => {
    running = false
    if (raf) cancelAnimationFrame(raf)
  })

  raf = requestAnimationFrame(onFrame)

  /* 暴露在 window 上：控制台里执行 __perfProbe.report() 即可再打一份 */
  Object.defineProperty(window, '__perfProbe', {
    value: {
      report,
      reset: () => {
        frames.length = 0
        longTasks.length = 0
        slowFrames.length = 0
      },
    },
    configurable: true,
  })
}
