import { useCallback, useSyncExternalStore } from 'react'

export type Theme = 'dusk' | 'day'

const STORAGE_KEY = 'site-theme'
/** 默认「黄昏」：既保住画面的宫崎骏感，又维持暗色与克制。 */
const DEFAULT_THEME: Theme = 'dusk'

function isTheme(value: unknown): value is Theme {
  return value === 'dusk' || value === 'day'
}

function readStoredTheme(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (isTheme(raw)) return raw
  } catch {
    // 隐私模式 / 禁用 storage：静默回落到默认主题
  }
  return DEFAULT_THEME
}

/**
 * 主题是**模块级外部状态**，不是组件局部 state。
 *
 * 原因：导航栏的开关、首屏的 SCENE 标签、入场幕屏都要读同一个值，
 * 各自 useState 会立刻不同步（点开关只有导航自己变）。
 * 所以走 useSyncExternalStore，单一数据源 + 订阅。
 */
let currentTheme: Theme = readStoredTheme()
const listeners = new Set<() => void>()

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  // 同步浏览器 UI 配色（移动端地址栏 / 状态栏）
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', theme === 'day' ? '#f8f1e2' : '#0a1220')
  }
}

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): Theme {
  return currentTheme
}

export function setTheme(next: Theme) {
  if (next === currentTheme) return
  currentTheme = next
  applyTheme(next)
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // 存不进去不影响本次会话
  }
  emit()
}

// 模块加载时对齐一次（index.html 的内联脚本已经写过 dataset，这里补齐 meta）
applyTheme(currentTheme)

export const THEME_LABEL: Record<Theme, string> = { dusk: '黄昏', day: '白昼' }

/** 供无 React 的场合（如入场幕屏的按钮）读取当前值。 */
export function getTheme(): Theme {
  return currentTheme
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme === 'day' ? 'dusk' : 'day')
  }, [])

  return { theme, toggleTheme }
}
