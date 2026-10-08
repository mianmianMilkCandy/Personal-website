import { useEffect, useRef, useState } from 'react'

import { useCatEnabled } from '../hooks/useCatCompanion'
import './CatCompanion.css'

/** 猫比光标偏移这么多，免得糊在指针上挡住点击目标 */
const OFFSET_X = 52
const OFFSET_Y = 34
/** 尺寸，用于边界夹取 */
const SIZE = 64

/**
 * 跟随光标的猫。
 *
 * 三个必须说清的实现取舍：
 *
 * 1. **它是手绘 SVG，不是从背景图里抠出来的那只。** 背景里的猫是位图的一部分，
 *    没有分割模型就抠不干净（会带一圈石阶）。所以这里重画了同一只橘白猫
 *    （同配色：橘 #E9A25B / 白胸 / 绿眼），保证视觉上是"同一只"。
 * 2. **位置与缩放全部直接写 DOM**，不进 React state —— 否则每帧一次重渲染，
 *    长页面上会明显掉帧。
 * 3. **只在精确指针 + 允许动效时启用。** 触屏上没有"光标"，硬跟随只会变成
 *    一只乱跳的猫挡住内容；`prefers-reduced-motion` 下直接不渲染。
 *    用户也可以从导航栏把它关掉（记在 localStorage）。
 */
export default function CatCompanion() {
  const { catEnabled } = useCatEnabled()
  const catRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setAllowed(fine && !reduce)
  }, [])

  useEffect(() => {
    if (!catEnabled || !allowed) return
    const cat = catRef.current
    const body = bodyRef.current
    if (!cat || !body) return

    // 初始落在右下角，避免首帧从 (0,0) 飞过来
    let tx = window.innerWidth - 200
    let ty = window.innerHeight - 220
    let x = tx
    let y = ty
    let vx = 0
    let vy = 0
    let facing = -1
    let hopPhase = 0
    let boost = 0
    let frame = 0

    const onMove = (e: PointerEvent) => {
      tx = e.clientX + OFFSET_X
      ty = e.clientY + OFFSET_Y
    }

    // 点击时来一次大跳，算是对交互的回应
    const onClick = () => {
      boost = 1
    }

    const tick = () => {
      // 弹簧趋近目标
      vx += (tx - x) * 0.08
      vy += (ty - y) * 0.08
      vx *= 0.78
      vy *= 0.78
      x += vx
      y += vy

      const speed = Math.hypot(vx, vy)
      const sp = Math.min(1, speed / 20)

      // 只在水平方向有实际速度时才转身，避免静止抖动
      if (Math.abs(vx) > 0.7) facing = vx > 0 ? 1 : -1

      // 蹦跳：相位随速度加快，弧高与速度成正比；boost 是点击后的余韵
      hopPhase += 0.14 + sp * 0.22
      boost *= 0.92
      const arc = Math.abs(Math.sin(hopPhase)) * (sp + boost)
      const hop = Math.min(30, arc * 26)

      // 起跳拉伸、落地压扁 —— 这一下是"活起来"的关键
      const squash = 1 + 0.13 * Math.cos(hopPhase) * (sp + boost)

      // 边界夹取，别让猫跑出视口
      const cx = Math.min(Math.max(x, 8), window.innerWidth - SIZE - 8)
      const cy = Math.min(Math.max(y, 8), window.innerHeight - SIZE - 8)

      cat.style.transform = `translate3d(${cx.toFixed(1)}px, ${(cy - hop).toFixed(1)}px, 0)`
      body.style.transform = `scaleX(${facing}) scaleY(${squash.toFixed(3)})`

      frame = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onClick, { passive: true })
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onClick)
    }
  }, [catEnabled, allowed])

  if (!catEnabled || !allowed) return null

  return (
    <div className="cat" ref={catRef} aria-hidden="true">
      <div className="cat__body" ref={bodyRef}>
        <svg viewBox="0 0 64 64" className="cat__svg">
          {/* 尾巴：单独一组，让它自己摆 */}
          <g className="cat__tail">
            <path
              d="M17 47C9.5 45.5 5.2 38 7.6 28.4c.5-2 3.4-2.2 4.2-.3C14.6 35 18.4 41.6 22 45.4Z"
              fill="#E9A25B"
            />
            <path
              d="M9.4 30.4c-.7 3.4 0 6.6 1.8 9.2"
              stroke="#C97C36"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* 身体 */}
          <path
            d="M15.6 57c0-11.4 7.4-19.4 17.4-19.4S50.4 45.6 50.4 57Z"
            fill="#E9A25B"
          />
          {/* 白胸 */}
          <ellipse cx="33" cy="50" rx="8.6" ry="9.4" fill="#FBF6EE" />
          {/* 身体条纹 */}
          <g stroke="#C97C36" strokeWidth="1.8" strokeLinecap="round" fill="none">
            <path d="M20.5 44.5c-1.5 2-2.2 4-2.4 6" />
            <path d="M45.5 44.5c1.5 2 2.2 4 2.4 6" />
          </g>
          {/* 前爪 */}
          <ellipse cx="27.4" cy="56" rx="4.4" ry="2.6" fill="#FBF6EE" />
          <ellipse cx="38.6" cy="56" rx="4.4" ry="2.6" fill="#FBF6EE" />

          {/* 耳朵 */}
          <path d="M22.4 15.6 21.4 5.8c-.1-.9.9-1.5 1.7-1.1l8.4 4.6Z" fill="#E9A25B" />
          <path d="M43.6 15.6l1-9.8c.1-.9-.9-1.5-1.7-1.1l-8.4 4.6Z" fill="#E9A25B" />
          <path d="M24.2 13.6l-.6-5.2 4.6 2.6Z" fill="#E58C8C" />
          <path d="M41.8 13.6l.6-5.2-4.6 2.6Z" fill="#E58C8C" />

          {/* 头 */}
          <ellipse cx="33" cy="24" rx="13.4" ry="12.2" fill="#E9A25B" />
          {/* 头顶条纹 */}
          <g stroke="#C97C36" strokeWidth="1.7" strokeLinecap="round" fill="none">
            <path d="M28.6 13.4c.4 1.6.4 2.8 0 4" />
            <path d="M33 12.6c.4 1.8.4 3.2 0 4.6" />
            <path d="M37.4 13.4c-.4 1.6-.4 2.8 0 4" />
          </g>
          {/* 白色口鼻 */}
          <ellipse cx="33" cy="29.4" rx="7.2" ry="5.4" fill="#FBF6EE" />

          {/* 眼睛（会眨） */}
          <g className="cat__eyes">
            <ellipse cx="27.6" cy="23.4" rx="2.9" ry="3.2" fill="#3E7A4E" />
            <ellipse cx="38.4" cy="23.4" rx="2.9" ry="3.2" fill="#3E7A4E" />
            <ellipse cx="27.6" cy="23.4" rx="1.2" ry="2.6" fill="#20301F" />
            <ellipse cx="38.4" cy="23.4" rx="1.2" ry="2.6" fill="#20301F" />
            <circle cx="26.6" cy="22.1" r=".85" fill="#FFFFFF" />
            <circle cx="37.4" cy="22.1" r=".85" fill="#FFFFFF" />
          </g>

          {/* 鼻子与嘴 */}
          <path d="M33 27.6l-1.5 1.4h3Z" fill="#E58C8C" />
          <path
            d="M33 29v1.4M33 30.4c-.9 0-1.5-.5-2.1-1.1M33 30.4c.9 0 1.5-.5 2.1-1.1"
            stroke="#C97C36"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
          />

          {/* 胡须 */}
          <g stroke="#FBF6EE" strokeWidth="1" strokeLinecap="round" opacity=".85">
            <path d="M25.6 28.4 18.6 26.6M25.6 30.2l-7.2 1M40.4 28.4l7-1.8M40.4 30.2l7.2 1" />
          </g>
        </svg>
      </div>
    </div>
  )
}
