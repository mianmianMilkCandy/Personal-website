import { useCallback, useEffect, useRef, useState } from 'react'

import { profile } from '../data/profile'
import { asset } from '../lib/asset'
import './EntryGate.css'

/** 记录"已经进过站"，避免每次访问都挡一层。 */
const GATE_KEY = 'site-entered'
/** 复用整页氛围层那张 0.7 KB 小图当幕屏背景（它本来就是糊的）。 */
const GATE_BG = asset('media/ambient-blur.webp')

function shouldShowGate(): boolean {
  // 系统要求减少动效 → 直接跳过这层纯装饰的幕屏，不让它挡路
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    return localStorage.getItem(GATE_KEY) !== '1'
  } catch {
    // storage 不可用时宁可不显示，也不要把用户永久挡在外面
    return false
  }
}

/** 幕屏灰显后的淡出时长：正本是 tokens.css 的 `--dur-gate`，
 *  这里只在读不到变量时兜底（所以 CSS 里的值与它保持一致）。 */
const GATE_FADE_FALLBACK = 620

/** 读 `--dur-gate`（px 之外的带单位时长要自己剥掉单位）。 */
function gateFadeMs(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--dur-gate')
    .trim()
  const ms = Number.parseFloat(raw)
  if (!Number.isFinite(ms)) return GATE_FADE_FALLBACK
  return raw.endsWith('ms') ? ms : ms * 1000
}

/**
 * 入场幕屏（对齐参考站第二张图）。
 *
 * 这是全站唯一的"仪式感"设计，代价是**多一次点击才看到内容**。
 * 三点缓解：① 只对首次访问者显示；② 点击 / 任意键 / ESC 都能进；
 * ③ 尊重 prefers-reduced-motion，直接跳过。
 * 如果哪天要彻底关掉，把 App.tsx 里的 <EntryGate /> 删掉即可。
 */
export default function EntryGate() {
  const [visible, setVisible] = useState(shouldShowGate)
  const [leaving, setLeaving] = useState(false)
  /** 这一趟到底有没有出现过幕屏 —— 决定要不要广播"门开了"（见下面那个 effect） */
  const wasShownRef = useRef(visible)

  const enter = useCallback(() => {
    setLeaving((already) => {
      if (already) return already
      try {
        localStorage.setItem(GATE_KEY, '1')
      } catch {
        // 存不进去也放行，本次会话内不再显示
      }
      return true
    })
  }, [])

  // 幕屏消失：等淡出动画**真的走完**再卸载。
  // 延时取自 tokens.css 的 --dur-gate（与 .gate.is-leaving 的 transition 同一个
  // 令牌），而不是写死 620 —— 以后调那个时长时两边不会脱钩。
  useEffect(() => {
    if (!leaving) return
    const id = window.setTimeout(() => setVisible(false), gateFadeMs())
    return () => window.clearTimeout(id)
  }, [leaving])

  /* 门真正卸载之后广播一次 —— 立方体在幕屏期间会把首屏的入场压住
     （见 lib/cube.ts 的 gateHold），收到这个事件才放行，于是那 620ms 的
     入场动画发生在门开之后，而不是门后面。
     用 ref 记住"这一趟开过门"：没开过门（回头客 / 减少动效）就不广播，
     免得平白多播一次；StrictMode 的双跑也不会误触发（那时 visible 还是 true）。 */
  useEffect(() => {
    if (visible || !wasShownRef.current) return
    wasShownRef.current = false
    window.dispatchEvent(new Event('site:entered'))
  }, [visible])

  // 幕屏期间：锁滚动 + 把背景设为 inert。
  // 只锁 body 滚动是不够的 —— 幕屏声明了 role="dialog" aria-modal="true"，
  // 那就得真的做到"焦点不会跑到门背后"：否则 Tab 一步就落到背后的导航链接上，
  // 而那时焦点在视觉上完全看不见（门盖住了那一层）。
  useEffect(() => {
    if (!visible) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const background = Array.from(
      document.querySelectorAll<HTMLElement>('main, header.nav, .skip-link'),
    )
    const wasInert = background.map((el) => el.hasAttribute('inert'))
    background.forEach((el) => el.setAttribute('inert', ''))

    return () => {
      document.body.style.overflow = previous
      background.forEach((el, i) => {
        if (!wasInert[i]) el.removeAttribute('inert')
      })
    }
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        enter()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, enter])

  if (!visible) return null

  return (
    <div
      className={leaving ? 'gate is-leaving' : 'gate'}
      role="dialog"
      aria-modal="true"
      aria-label="进入网站"
    >
      <div
        className="gate__bg"
        style={{ backgroundImage: `url(${GATE_BG})` }}
        aria-hidden="true"
      />
      <div className="gate__scrim" aria-hidden="true" />

      <div className="gate__inner">
        <p className="gate__label mono">
          {profile.nameEn}
          <span className="gate__sep" aria-hidden="true">
            /
          </span>
          {profile.roleEn}
        </p>

        <button type="button" className="gate__btn" onClick={enter} autoFocus>
          <span className="gate__btn-cn">进入网站</span>
          <span className="gate__btn-en mono">Enter Site</span>
        </button>

        <p className="gate__hint mono">点击、按任意键或 ESC 进入</p>
      </div>
    </div>
  )
}
