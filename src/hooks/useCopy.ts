import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 复制到剪贴板 + 短暂的"已复制"反馈。
 *
 * navigator.clipboard 只在安全上下文（https / localhost / file 视浏览器而定）
 * 可用，因此保留 execCommand 兜底；两条路都失败时静默返回，
 * 由调用方决定是否提示用户手动复制。
 */
export function useCopy(resetMs = 1600) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  const copy = useCallback(
    async (text: string, key?: string) => {
      const id = key ?? text
      let ok = false
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text)
          ok = true
        } else {
          ok = legacyCopy(text)
        }
      } catch {
        ok = legacyCopy(text)
      }
      if (!ok) return false

      setCopiedKey(id)
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setCopiedKey(null), resetMs)
      return true
    },
    [resetMs],
  )

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    },
    [],
  )

  return { copiedKey, copy }
}

function legacyCopy(text: string): boolean {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
