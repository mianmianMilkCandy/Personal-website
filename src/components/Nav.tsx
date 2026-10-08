import { useEffect, useRef, useState } from 'react'

import { profile } from '../data/profile'
import { useActiveSection } from '../hooks/useActiveSection'
import { useCatEnabled } from '../hooks/useCatCompanion'
import { useTheme, THEME_LABEL } from '../hooks/useTheme'
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

/** 把主题包装成"场景"，对齐参考站右上角那枚控件簇的语义。 */
const SCENE_NO = { dusk: '01', day: '02' } as const

export default function Nav() {
  const [stuck, setStuck] = useState(false)
  const progressRef = useRef<HTMLSpanElement>(null)
  const active = useActiveSection(NAV_IDS)
  const { theme, toggleTheme } = useTheme()
  const { catEnabled, toggleCat } = useCatEnabled()

  // 吸顶状态 + 阅读进度：都用 rAF 节流，进度直接写 DOM，不引发重渲染
  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const y = window.scrollY
      setStuck((prev) => (prev === y > 24 ? prev : y > 24))

      const max = document.documentElement.scrollHeight - window.innerHeight
      const ratio = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${ratio})`
      }
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const nextLabel = theme === 'day' ? '黄昏' : '白昼'

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
          {/* 玻璃控件簇：参考站右上角那枚。这里装载"场景/主题"切换 */}
          <button
            type="button"
            className="nav__cluster glass"
            onClick={toggleTheme}
            title={`切换为${nextLabel}`}
            aria-label={`当前场景：${THEME_LABEL[theme]}，切换为${nextLabel}`}
          >
            <span className="nav__cluster-icon" aria-hidden="true">
              <Icon name={theme === 'day' ? 'spark' : 'cloud'} />
            </span>
            <span className="nav__cluster-text mono">
              Scene {SCENE_NO[theme]}
              <span className="nav__cluster-sep" aria-hidden="true">
                ·
              </span>
              <span className="nav__cluster-label">{THEME_LABEL[theme]}</span>
            </span>
            <span className="nav__cluster-dots" aria-hidden="true">
              <i className={theme === 'dusk' ? 'is-on' : undefined} />
              <i className={theme === 'day' ? 'is-on' : undefined} />
            </span>
          </button>

          {/* 跟随小猫的开关：给不想被一只猫跟着的人一条退路 */}
          <button
            type="button"
            className={catEnabled ? 'nav__cat is-on' : 'nav__cat'}
            onClick={toggleCat}
            aria-pressed={catEnabled}
            title={catEnabled ? '关闭跟随的小猫' : '开启跟随的小猫'}
          >
            <Icon name="cat" />
            <span className="sr-only">跟随的小猫</span>
          </button>

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
