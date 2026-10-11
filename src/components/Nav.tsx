import { useEffect, useRef, useState } from 'react'

import { profile } from '../data/profile'
import { useActiveSection } from '../hooks/useActiveSection'
import CursorTint from './CursorTint'
import Icon from './Icon'
import './Nav.css'

/** 模块级常量：useActiveSection 依赖稳定引用，不要写成内联字面量。 */
const NAV_ITEMS = [
  { id: 'hero', label: '首页' },
  { id: 'about', label: '关于' },
  { id: 'projects', label: '项目' },
  { id: 'contact', label: '联系' },
] as const

const NAV_IDS = NAV_ITEMS.map((item) => item.id)

export default function Nav() {
  const [stuck, setStuck] = useState(false)
  const stuckRef = useRef(false)
  const progressRef = useRef<HTMLSpanElement>(null)
  const active = useActiveSection(NAV_IDS)

  // 吸顶状态 + 阅读进度：都用 rAF 节流，进度直接写 DOM，不引发重渲染
  useEffect(() => {
    let frame = 0
    /* 可滚动总高度只在挂载与文档尺寸变化时量一次。
       ⚠️ 不要每帧读 `documentElement.scrollHeight`：它会让浏览器**当场重算
       布局**（scrollHeight 依赖整棵文档的布局），而同一个滚动帧里立方体刚
       写完 9 个面的 transform —— 于是每个滚动帧都白白多一次整文档重排。
       用 ResizeObserver 盯住文档根，尺寸真的变了才重量（它本来就会在
       图片撑开、字体替换、窗口缩放时触发）。 */
    let maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    )

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    const measure = () => {
      maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      )
      onScroll()
    }

    const update = () => {
      frame = 0
      const y = window.scrollY

      // 用 ref 先比一次再 setState：原先每帧都调 setStuck（靠 React 的
      // "同值 bail-out" 兜底），仍然会走一遍调度器。这里连调度都省掉。
      const nextStuck = y > 24
      if (nextStuck !== stuckRef.current) {
        stuckRef.current = nextStuck
        setStuck(nextStuck)
      }

      const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, y / maxScroll)) : 0
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${ratio})`
      }
    }

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(measure)

    update()
    resizeObserver?.observe(document.documentElement)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      resizeObserver?.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <header className={stuck ? 'nav is-stuck' : 'nav'}>
      <nav className="nav__inner" aria-label="主导航">
        <a className="nav__brand" href="#hero">
          <span className="nav__brand-dot" aria-hidden="true" />
          <span className="nav__brand-text mono">
            {profile.nameEn}
            <span className="nav__brand-sep" aria-hidden="true">
              /
            </span>
            <span className="nav__brand-role">{profile.roleEn}</span>
          </span>
        </a>

        <ul className="nav__links">
          {NAV_ITEMS.map((item, i) => (
            <li key={item.id}>
              <a
                className={
                  active === item.id ? 'nav__link is-active' : 'nav__link'
                }
                href={`#${item.id}`}
                aria-current={active === item.id ? 'true' : undefined}
              >
                <span className="nav__link-index" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="nav__actions">
          {/* 光标配色控件：指针图标 + 一排色板圆点（悬停即预览、点击即生效） */}
          <CursorTint />

          {/* 这里原来挂着一枚玻璃控件簇（云图标 + Train · Run/Hold/Drag 读数
              + 两个状态点）。它只是把 SkyStage 写在 <html data-train> 上的状态
              复述一遍，不承担任何操作，2026-10 按要求撤掉 —— 列车状态改成
              **靠车本身**表达（悬停停车、按住可拖），右上角只留真正能点的控件。 */}

          <a className="pill nav__cta" href="#contact">
            联系我
            <Icon name="arrowRight" />
          </a>
        </div>
      </nav>

      <span ref={progressRef} className="nav__progress" aria-hidden="true" />
    </header>
  )
}
