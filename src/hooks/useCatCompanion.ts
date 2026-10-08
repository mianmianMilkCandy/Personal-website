import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'site-cat'

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== '0'
  } catch {
    return true
  }
}

/**
 * 猫咪跟随开关 —— 与主题同样的模块级外部 store，
 * 因为导航栏的开关和跟随组件本身要读同一个值。
 *
 * 默认**开启**（用户明确要的），但真正渲染前还会再过两道闸：
 * 指针必须是精确指针（鼠标），且不能是 prefers-reduced-motion。
 */
let enabled = readStored()
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): boolean {
  return enabled
}

export function setCatEnabled(next: boolean) {
  if (next === enabled) return
  enabled = next
  try {
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
  } catch {
    // 存不进去只影响下次访问
  }
  emit()
}

export function useCatEnabled() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const toggle = useCallback(() => setCatEnabled(!enabled), [])
  return { catEnabled: value, toggleCat: toggle }
}
