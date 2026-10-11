import { useEffect, useRef } from 'react'

import './Ambience.css'

/**
 * 整页氛围光 —— 现在只剩**指针光**一层。
 *
 * ⚠️ 2026-10 卡顿优化时砍掉了原来的另外三层（远光带 / 近光带 / 旋流光）。
 * 它们是"深靛蓝黄昏"那一版的产物，成本与收益在这一版里严重倒挂：
 *
 *   · 两条光带是 `inset: -320px -10%`（≈1.2 屏宽 × 1.7 屏高）的元素 + `blur(72px)`；
 *   · 旋流光是一个 **190vmax 的锥形渐变**（1600×900 下直径约 3000px，
 *     光栅面积 ≈ 9 Mpx）+ `blur(58px)`，而且它的旋转角由**滚动进度逐帧**
 *     写入（`--amb-deg`）—— 一个 9 Mpx 的模糊层每帧换角度，是这一页最贵的
 *     单件事；
 *   · 三层都带 `mix-blend-mode`，压在**一直在动的**天空之上，等于要求合成器
 *     每帧把整屏重新混合一次。
 *   它们加起来的视觉贡献却是"一层几乎看不见的色调"：实测把 `.amb` 整层关掉，
 *   首屏只有 12% 的像素变化 >8/255，而且关掉之后云的层次反而更干净。
 *
 * 留下的指针光是一层 46vmax 的径向渐变 + transform（拖尾交给 CSS transition），
 * 面积小、跟手、且是这一版里唯一还说得通的"光"。
 */

export default function Ambience() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fine = window.matchMedia('(pointer: fine)')
    /* 视口尺寸只在这里用（不用来算位置），保留一个函数方便以后扩展；
       指针事件里不做任何布局读数。 */
    let px = 0
    let py = 0
    let frame = 0

    function write(): void {
      frame = 0
      const glow = el!.querySelector<HTMLElement>('.amb__glow')
      if (glow) glow.style.transform = `translate3d(${px}px, ${py}px, 0)`
    }

    function onMove(e: PointerEvent): void {
      if (!fine.matches || motion.matches) return
      px = e.clientX
      py = e.clientY
      /* rAF 节流：一帧最多写一次 —— 指针事件可以到 1000Hz，
         不节流的话每次移动都要写一次 style。 */
      if (!frame) frame = requestAnimationFrame(write)
    }

    function onResize(): void {
      px = window.innerWidth / 2
      py = window.innerHeight * 0.42
      if (!frame) frame = requestAnimationFrame(write)
    }

    onResize()
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div className="amb" ref={root} aria-hidden="true">
      <div className="amb__glow" />
    </div>
  )
}
