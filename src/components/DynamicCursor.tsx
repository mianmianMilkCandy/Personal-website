import { useEffect, useRef, useState } from 'react'

import './DynamicCursor.css'

/** 环形光标的跟随缓动系数：越小越"拖"，0.16 大约是跟手但不僵硬的甜点 */
const RING_EASE = 0.16
/** 位移大于它才算"还在走"（同时决定缓动何时切到吸附） */
const EASE_STEP = 0.05
/** 吸附容差：小于它就直接对齐，且**不再续帧**（见 render() 里的说明） */
const SNAP_EPSILON = 0.01
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
    /** 首次落位 / 状态刚变过：下一帧必须写一次，即使此刻没有位移 */
    let force = false
    /** 上一帧写进 DOM 的类状态，用来跳过无意义的 classList 调用 */
    let wasActive = false
    let wasPressed = false

    const onMove = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
      if (!moved) {
        // 首次移动：环直接落位（避免从屏幕中心飞过来），此刻才隐藏原生光标
        moved = true
        rx = px
        ry = py
        document.documentElement.classList.add('has-cursor')
        dot.style.opacity = '1'
        ring.style.opacity = '1'
        force = true
      }
      kick()
    }

    const onOver = (e: PointerEvent) => {
      /* 已经是最大态就不必再问"这个元素能不能点"了 —— isInteractive 里那次
         `closest()` 是沿 DOM 向上的遍历，而 pointerover 在指针扫过页面时
         是**每个元素都触发一次**的（长列表、卡片、图标密集的地方很密）。
         先短路掉最常见的情形（在正文上移动），再看提示态要不要变。 */
      if (hoverScale > 1) {
        if (isInteractive(e.target)) return
        hoverScale = 1
        kick()
        return
      }
      if (!isInteractive(e.target)) return
      hoverScale = HOVER_SCALE
      kick()
    }

    const onDown = () => {
      if (pressed) return
      pressed = true
      kick()
    }
    const onUp = () => {
      if (!pressed) return
      pressed = false
      kick()
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

    /**
     * 一帧的渲染。返回 true 表示"还有位移没走完，需要下一帧"。
     *
     * 关键点：这个循环**不是常驻的**。原先 tick 无条件 rAF 自我续帧，
     * 于是即使用户一动不动，也永远有 60fps 的回调在跑、每帧写两次 transform
     * 与两次 classList —— 全站唯一一处"纯烧电"的开销。现在环追上点、
     * 缩放也收敛之后循环就停；下一次 pointermove / 状态变化再 kick 起来。
     * 视觉结果完全一致：停下来的那一帧已经把终值写进 DOM 了。
     */
    const render = () => {
      let moving = false

      const dx = px - rx
      const dy = py - ry
      if (Math.abs(dx) > EASE_STEP || Math.abs(dy) > EASE_STEP) {
        rx += dx * RING_EASE
        ry += dy * RING_EASE
        moving = true
      } else if (rx !== px || ry !== py) {
        /* 收敛：吸附到精确位置。
           ⚠️ 判据必须带容差（`rx !== px` 这种严格比较会**永远为真**）：
           `rx += dx * 0.16` 是浮点乘法，落不到整数坐标上 —— 比如 px=800、
           rx=799.9999999999999 时，"差值还剩多少"已经小于 EASE_STEP，
           而"rx 与 px 严格不等"仍然成立。此时若把 moving 置为 true，
           rAF 循环就永远停不下来，全站多出一个恒定 60fps 的空转
           （实测：空闲 rAF 121 次/秒，且 DOM 值其实早已不再变化）。
           容差取 0.01px：远小于肉眼可辨的位移，也不可能是"还没走完"。 */
        if (Math.abs(dx) > SNAP_EPSILON || Math.abs(dy) > SNAP_EPSILON) {
          rx = px
          ry = py
          moving = true
        } else {
          // 已经足够近：静默对齐，且**不算作"还在动"**，让循环停下
          rx = px
          ry = py
        }
      }

      const target = hoverScale * (pressed ? PRESS_SCALE : 1)
      const ds = target - scale
      if (Math.abs(ds) > 0.002) {
        scale += ds * 0.2
        moving = true
      } else if (scale !== target) {
        scale = target
        moving = true
      }

      // 点的位置永远精确在指针上；环走缓动。
      // force 覆盖"首次落位"这一帧：那时没有位移、也没有缩放变化，
      // 但两个 transform 必须先写一次，否则光标会僵在视口左上角。
      if (moving || force) {
        dot.style.transform = `translate3d(${px}px, ${py}px, 0)`
        ring.style.transform = `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`
        force = false
      }

      const isActive = hoverScale > 1
      if (isActive !== wasActive) {
        ring.classList.toggle('is-active', isActive)
        wasActive = isActive
      }
      if (pressed !== wasPressed) {
        ring.classList.toggle('is-pressed', pressed)
        wasPressed = pressed
      }

      return moving
    }

    const tick = () => {
      frame = render() ? requestAnimationFrame(tick) : 0
    }

    /** 唤醒渲染循环（已经在跑就什么都不做） */
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    document.addEventListener('pointerenter', onEnter)
    kick()

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
