import { useEffect, type RefObject } from 'react'

/**
 * 悬停触发的卡片交互：指针在卡面上移动时，把指针位置写成 `--mx` / `--my`（百分比），
 * 并顺带给出一个很轻的 3D 倾斜（`--tilt-x` / `--tilt-y`，上限 ±1.1°）。
 *
 * 三个刻意的做法：
 *  1. **不经过 React state**。每次 pointermove 都 setState 会把整棵项目列表重渲染一遍
 *     （一屏几十个节点），代价与收益完全不成比例；这里直接写元素上的自定义属性。
 *  2. **rAF 节流**：一帧最多写一次，指针事件再密也不会一帧写多次。
 *  3. **卡片矩形缓存**。`getBoundingClientRect()` 会迫使样式/布局结算，所以只在
 *     "悬停的卡片换了一张"时读一次，之后复用；滚动时清缓存重新量。
 *
 * 触屏与 prefers-reduced-motion 下直接不挂监听。
 */
export function useCardSpotlight(ref: RefObject<HTMLElement | null>, cardSelector = '.project'): void {
  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    let card: HTMLElement | null = null
    let rect: DOMRect | null = null
    let cx = 0
    let cy = 0

    function write(): void {
      frame = 0
      if (!card) return
      // 上限 ±1.1°：再大文字就会有可感的透视变形，读起来像在晃
      card.style.setProperty('--tilt-y', `${(((cx - 50) / 50) * 1.1).toFixed(2)}deg`)
      card.style.setProperty('--tilt-x', `${(((50 - cy) / 50) * 1.1).toFixed(2)}deg`)
      card.style.setProperty('--mx', `${cx.toFixed(1)}%`)
      card.style.setProperty('--my', `${cy.toFixed(1)}%`)
    }

    function clear(): void {
      if (!card) return
      card.removeAttribute('data-spot')
      card.style.removeProperty('--mx')
      card.style.removeProperty('--my')
      card.style.removeProperty('--tilt-x')
      card.style.removeProperty('--tilt-y')
      card = null
      rect = null
    }

    function onMove(e: PointerEvent): void {
      const hit = (e.target as HTMLElement | null)?.closest?.(cardSelector)
      if (!(hit instanceof HTMLElement)) {
        clear()
        return
      }
      if (hit !== card) {
        clear()
        card = hit
        rect = hit.getBoundingClientRect()   // 只在换卡片时量一次
        hit.setAttribute('data-spot', '')
      }
      if (!rect) return
      cx = ((e.clientX - rect.left) / rect.width) * 100
      cy = ((e.clientY - rect.top) / rect.height) * 100
      if (!frame) frame = requestAnimationFrame(write)
    }

    /** 滚动会改变卡片位置 —— 让缓存失效，下次移动时重新量。 */
    function onScroll(): void {
      rect = null
    }

    root.addEventListener('pointermove', onMove, { passive: true })
    root.addEventListener('pointerleave', clear, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', clear)
      window.removeEventListener('scroll', onScroll)
    }
  }, [ref, cardSelector])
}
