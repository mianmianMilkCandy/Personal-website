import { useEffect, useRef } from 'react'

import { profile } from '../data/profile'
import { THEME_LABEL } from '../hooks/useTheme'
import Icon from './Icon'
import LocalClock from './LocalClock'
import Reveal from './Reveal'
import WindLeaves from './WindLeaves'
import './Hero.css'

/**
 * 首屏。
 *
 * ⚠️ 2026-10 起这里**不再有自己的画**。
 * 原来这一面背后是一张「台阶上的猫」竖/横两版 <picture>，外加一层同画的
 * 云遮罩。背景需求改成"九个面共用同一张连续晴空、上面跑一列火车"之后，
 * 首屏这张画就成了唯一还在"跟着面转"的东西 —— 它一转，连续性就断了。
 * 所以画、clound 遮罩、视频槽位、视差、以及它们那一堆取景对齐纪律
 * **整块删除**；首屏现在只剩"合成层"（scrim / veil / 暗角 / 网格）与内容。
 * 真正的画面由 App.tsx 里的 <SkyStage /> 固定在所有面之后承载。
 *
 * 保留的是"幕布"相位：面不在场时把这几层合成压暗一点、面转正时重新点亮
 * （见 Hero.css 的 heroCurtain）。它现在压的是白纱而不是画，所以观感从
 * "画面退到后面"变成"这一屏的雾气浓淡"—— 与背景连续这件事不冲突。
 */

/** 首屏不需要额外的行内变量了；这个常量留着，方便以后加"只给首屏"的取值。 */
const HERO_STYLE = undefined

export default function Hero() {
  const mediaRef = useRef<HTMLDivElement>(null)

  /* --------------------------------------------------------------------------
     首屏的滚动相位：逐帧把 `--parallax` 写到 .hero__media
     --------------------------------------------------------------------------
     以前它驱动的是那张画的位移（8% 视差）。画删掉之后这个变量改由**合成层**
     消费：白纱与暗角随滚动极轻微地加厚，做出"离开首屏时雾气收拢"的过渡，
     而背景本身纹丝不动（连续性优先）。
     仍然只写 transform / opacity 的输入值，且滚出首屏后 p 恒为 1、值不再变。
     ------------------------------------------------------------------------ */
  useEffect(() => {
    const media = mediaRef.current
    if (!media) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    let heroHeight = media.offsetHeight || window.innerHeight || 1
    let last = ''

    const update = () => {
      frame = 0
      const p = Math.min(1, Math.max(0, window.scrollY / heroHeight))
      const next = (p * 8).toFixed(2)
      if (next === last) return
      last = next
      media.style.setProperty('--parallax', next)
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    const onResize = () => {
      heroHeight = media.offsetHeight || window.innerHeight || 1
      onScroll()
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    /* ⚠️ 这里**故意不写 `id="hero"`**：锚点 id 由 Cube.tsx 里那颗定位锚点独占
       （它在 .cube__track 的绝对定位 top 上）。这一面在 `position: fixed` 的
       .cube__stage 里，文档内位置对滚动没有意义 —— 两个元素抢同一个 id 时
       getElementById 只会返回文档序在前的那个，深链与导航高亮全靠这个巧合。
       重排 Cube 的 DOM 就会静默失准，所以不要把这个 id 加回来。 */
    <section className="hero" style={HERO_STYLE}>
      <div className="hero__media" ref={mediaRef} aria-hidden="true">
        <div className="hero__scrim" />
        <div className="hero__veil" />
        <div className="hero__vignette" />
        <div className="hero__grid" />

        {/* 风里的落叶 —— 故意放在**所有氛围层之后**：叶子是"近处"的东西，不该被
            scrim / veil / vignette 那几层当远景压白，否则在亮云上根本看不见。
            为什么不直接让画里的爬藤摆：见 WindLeaves.tsx 顶部说明。 */}
        <WindLeaves />
      </div>

      {/* 版式对齐参考站：左下文案块（大标题 + 胶囊动作行）+ 底部 SCENE 小字
          + 右下玻璃卡。背景由左下渐白换成了"整屏可读"，所以玻璃卡的底气
          加强到 62% 实白（见 Hero.css 的 .hero__card）。 */}
      <div className="hero__inner">
        <div className="hero__lead">
          <Reveal variant="up">
            <h1 className="hero__title">
              {profile.name}的主页
              <span className="hero__title-dot">。</span>
            </h1>

            <p className="hero__tagline">{profile.tagline}</p>
          </Reveal>

          <Reveal variant="up" delay={120}>
            <div className="hero__actions">
              {/* 首屏这枚动作按钮按用户要求改成高透明度 + 手绘描边（= .pill--quiet 那套） */}
              <a className="pill pill--quiet" href="#projects">
                向下滚动进入
                <Icon name="arrowDown" />
              </a>
              <a className="hero__scrollhint" href="#about">
                <span className="mono">Scroll Down</span>
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal as="aside" className="hero__card glass" variant="scale" delay={180}>
          <p className="hero__card-label mono">
            <Icon name="cat" className="hero__card-label-icon" />
            Welcome
          </p>
          <p className="hero__card-name">{profile.name}</p>
          <p className="hero__card-role">{profile.role}</p>

          <dl className="hero__card-meta">
            <div className="hero__card-item">
              <dt className="mono">
                <Icon name="pin" />
                坐标
              </dt>
              <dd>{profile.location}</dd>
            </div>
            <div className="hero__card-item">
              <dt className="mono">
                <Icon name="target" />
                专注
              </dt>
              <dd>{profile.focus}</dd>
            </div>
          </dl>
        </Reveal>

        {/* 参考站左下角那行小字：压在首屏最底边，承载真实信息（场景 / 时间）。
            时钟是独立叶子组件 —— 每秒只重渲染这一个文本节点，见 LocalClock.tsx。 */}
        <Reveal className="hero__scene-row" variant="fade" delay={240}>
          <p className="hero__scene mono">
            SCENE 01 · {THEME_LABEL.day} · UTC+8 <LocalClock />
          </p>
        </Reveal>
      </div>
    </section>
  )
}
