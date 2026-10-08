import { useEffect, useRef, useState } from 'react'

import './DynamicCursor.css'

/** 环形光标的跟随缓动系数：越小越"拖"，0.16 大约是跟手但不僵硬的甜点 */
const RING_EASE = 0.16
/** 悬停在可点元素上时环放大到多少 */
const HOVER_SCALE = 1.9
/** 按下时缩到多少 */
const PRESS_SCALE = 0.72

const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, .tile'

function isInteractive(node: EventTarget | null): boolean {
  return node instanceof Element && node.closest(INTERACTIVE) !== null
}

/**
 * 动态鼠标光标：一个精确的小点 + 一个缓动跟随的细环。
 *
 * 三条安全设计（都关系到"不能把用户的鼠标弄丢"）：
 *
 * 1. **原生光标只在第一次 pointermove 之后才隐藏。** 如果在挂载时就 `cursor: none`，
 *    而用户还没动过鼠标，就会出现"原生没了、自定义也没定位"的瞬间 —— 看起来像光标丢了。
 * 2. **隐藏靠 `html.has-cursor` 这个 JS 加上的类，而不是写死在 CSS 里。**
 *    这样 JS 没跑起来 / 组件报错时，原生光标原样保留，不会出现"页面上没有鼠标"。
 * 3. **只在精确指针 + 非 reduced-motion 下启用。** 触屏没有光标；晕动敏感用户不该被跟动的环追着。
 *
 * 位置与缩放全部 rAF 直接写 DOM，不进 React state（否则每帧一次重渲染）。
 */
export default function DynamicCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setEnabled(fine && !reduce)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let px = window.innerWidth / 2
    let py = window.innerHeight / 2
    let rx = px
    let ry = py
    let scale = 1
    let hoverScale = 1
    let pressed = false
    let moved = false
    let frame = 0

    const onMove = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
      if (moved) return
      // 首次移动：环直接落位（避免从屏幕中心飞过来），此刻才隐藏原生光标
      moved = true
      rx = px
      ry = py
      document.documentElement.classList.add('has-cursor')
      dot.style.opacity = '1'
      ring.style.opacity = '1'
    }

    const onOver = (e: PointerEvent) => {
      hoverScale = isInteractive(e.target) ? HOVER_SCALE : 1
    }

    const onDown = () => {
      pressed = true
    }
    const onUp = () => {
      pressed = false
    }

    // 指针离开窗口 / 切到别的应用时把自定义光标藏起来，别让它僵在原地
    const onLeave = () => {
      dot.style.opacity = '0'
      ring.style.opacity = '0'
    }
    const onEnter = () => {
      if (!moved) return
      dot.style.opacity = '1'
      ring.style.opacity = '1'
    }

    const tick = () => {
      // 环缓动追点；点永远精确在指针上
      rx += (px - rx) * RING_EASE
      ry += (py - ry) * RING_EASE

      const target = hoverScale * (pressed ? PRESS_SCALE : 1)
      scale += (target - scale) * 0.2

      dot.style.transform = `translate3d(${px}px, ${py}px, 0)`
      ring.style.transform = `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`
      ring.classList.toggle('is-active', hoverScale > 1)
      ring.classList.toggle('is-pressed', pressed)

      frame = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    document.addEventListener('pointerenter', onEnter)
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('pointerenter', onEnter)
      document.documentElement.classList.remove('has-cursor')
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div aria-hidden="true">
      <div className="cur cur--ring" ref={ringRef} />
      <div className="cur cur--dot" ref={dotRef} />
    </div>
  )
}
