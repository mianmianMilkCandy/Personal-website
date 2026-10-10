import { useEffect, useRef } from 'react'

import './Ambience.css'

/**
 * 整页氛围光（"光"这一组动效的载体）。
 *
 * 四层，从远到近：
 *   .amb__far    远处的光带   —— 随滚动缓慢下移（视差最慢）
 *   .amb__near   近处的光带   —— 反向、更快（视差最快）→ 两者一起做出"穿行"的纵深
 *   .amb__swirl  旋流光       —— 锥形光带，**转角由滚动进度直接驱动**
 *   .amb__glow   指针氛围光   —— 跟随光标的一团柔光（只对精确指针 + 允许动效时启用）
 *
 * 为什么放在整页层而不是塞进各个面：
 *   1. 光要压在画面之上才有"打光"的感觉，而面内是不透明的画；放在面里就只是一块贴纸。
 *   2. 只需要**一个**滚动监听、一帧最多写 4 个值 —— 不必让九个面各写一遍。
 *
 * 性能纪律（与本项目其它动效一致）：
 *   · 只写 transform / 自定义属性，不写 left/top，不改尺寸 → 不触发重排；
 *   · 视口高度只在挂载与 resize 时量，**滚动帧里不做任何布局读数**；
 *   · rAF 节流：滚动与指针移动都只在有事件的那一帧画一次，没有常驻循环；
 *   · 光带用 repeating-linear-gradient + 大半径 blur，位移量取其周期 → 首尾无缝，
 *     不会出现"走到头突然跳一下"。
 */

/** 光带图案的纵向周期（px）。位移按这个数取模，所以循环点是无缝的。 */
const BAND_PERIOD = 300
/** 每滚过一面，旋流光转多少度。 */
const SWIRL_DEG_PER_FACE = 42

export default function Ambience() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fine = window.matchMedia('(pointer: fine)')
    let frame = 0
    /* 视口高度：**只在挂载与 resize 时量**。放在滚动帧里读就是读写交替。 */
    let vh = window.innerHeight
    let shuttling = false
    let px = 0
    let py = 0

    function write(): void {
      frame = 0
      const p = window.scrollY / vh
      // 光带位移取模 → 无缝循环；两个方向相反的位移做出纵深
      el!.style.setProperty('--amb-shift', `${((p * 210) % BAND_PERIOD).toFixed(1)}px`)
      el!.style.setProperty('--amb-deg', (p * SWIRL_DEG_PER_FACE).toFixed(2))
      // 正在换面的那一段（角度进度落在中段）点亮一点：这是"穿梭"的读数
      const f = p - Math.floor(p)
      const busy = motion.matches ? false : f > 0.16 && f < 0.84
      if (busy !== shuttling) {
        shuttling = busy
        el!.toggleAttribute('data-shuttle', busy)
      }
    }

    function schedule(): void {
      if (!frame) frame = requestAnimationFrame(write)
    }

    function onMove(e: PointerEvent): void {
      if (!fine.matches || motion.matches) return
      px = e.clientX
      py = e.clientY
      // 指针光直接写 transform（不经过 React state，也不做 lerp 循环）；
      // 柔化交给 CSS 的 transition —— 于是"拖尾"是浏览器在合成层上做的，零 JS 开销。
      const glow = el!.querySelector<HTMLElement>('.amb__glow')
      if (glow) glow.style.transform = `translate3d(${px}px, ${py}px, 0)`
    }

    function onResize(): void {
      vh = window.innerHeight
      schedule()
    }

    write()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onMove, { passive: true })
    motion.addEventListener('change', schedule)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      motion.removeEventListener('change', schedule)
    }
  }, [])

  return (
    <div className="amb" ref={root} aria-hidden="true">
      <div className="amb__far" />
      <div className="amb__near" />
      <div className="amb__swirl" />
      <div className="amb__glow" />
    </div>
  )
}
