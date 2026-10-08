import { useCallback, useSyncExternalStore } from 'react'

/**
 * 自定义光标的配色。
 *
 * 和 useTheme 一样是**模块级外部状态**：导航里的色板控件与 DynamicCursor
 * 读的是同一个值，而且光标颜色必须在"鼠标一动就出现"之前就绪 ——
 * 各自 useState 会出现"点了一个色板，光标还是旧颜色"的不同步。
 *
 * 关键设计：色板里**不放字面色值**，只放 `var(--cur-tint-*)` 或空串。
 * 真正的颜色留在 tokens.css 的令牌层，于是：
 *   · 组件 CSS 依旧零字面色值（项目的自检命令继续通过）；
 *   · day 主题要换颜色时只改令牌，这里一行都不用动；
 *   · 空串 = 不写内联变量，回落到 `--cur-color: var(--accent)`，
 *     也就是"跟随主题"——切主题时光标自动跟着走。
 */
export type CursorTintId = 'theme' | 'amber' | 'jade' | 'azure' | 'sakura' | 'ink'

export type CursorTint = {
  id: CursorTintId
  /** 给 title / aria-label 用的中文名 */
  label: string
  /** 写进 --cur-color 的值；空串表示跟随主题（删掉内联值） */
  cssVar: string
}

export const CURSOR_TINTS: CursorTint[] = [
  { id: 'theme', label: '跟随主题', cssVar: '' },
  { id: 'amber', label: '黄昏金', cssVar: 'var(--cur-tint-amber)' },
  { id: 'jade', label: '苔绿', cssVar: 'var(--cur-tint-jade)' },
  { id: 'azure', label: '天青', cssVar: 'var(--cur-tint-azure)' },
  { id: 'sakura', label: '樱粉', cssVar: 'var(--cur-tint-sakura)' },
  { id: 'ink', label: '墨白', cssVar: 'var(--cur-tint-ink)' },
]

const STORAGE_KEY = 'site-cursor-tint'
const DEFAULT_TINT: CursorTintId = 'theme'

function findTint(id: unknown): CursorTint {
  return (
    CURSOR_TINTS.find((tint) => tint.id === id) ??
    CURSOR_TINTS.find((tint) => tint.id === DEFAULT_TINT)!
  )
}

function readStoredTint(): CursorTintId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (CURSOR_TINTS.some((tint) => tint.id === raw)) return raw as CursorTintId
  } catch {
    // 隐私模式 / 禁用 storage：静默回落到跟随主题
  }
  return DEFAULT_TINT
}

let currentTint: CursorTintId = readStoredTint()
const listeners = new Set<() => void>()

/** 把某个色板写进 <html> 的内联 --cur-color（空串 = 删除内联值） */
function writeTint(id: CursorTintId) {
  const { cssVar } = findTint(id)
  const root = document.documentElement
  if (cssVar) root.style.setProperty('--cur-color', cssVar)
  else root.style.removeProperty('--cur-color')
}

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): CursorTintId {
  return currentTint
}

export function setCursorTint(next: CursorTintId) {
  if (next === currentTint) return
  currentTint = next
  writeTint(next)
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // 存不进去不影响本次会话
  }
  emit()
}

/**
 * 悬停/聚焦色板时的实时预览：直接改 CSS 变量，不动 store、不写 localStorage。
 * 传 null 表示恢复成当前选中的那个。
 */
export function previewCursorTint(id: CursorTintId | null) {
  writeTint(id ?? currentTint)
}

// 模块加载时对齐一次（光标首次出现前就已是用户选的颜色）
writeTint(currentTint)

export function useCursorColor() {
  const tint = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const setTint = useCallback((next: CursorTintId) => {
    setCursorTint(next)
  }, [])

  return { tint, setTint }
}
