import { useEffect, useRef, useState } from 'react'

import { profile } from '../data/profile'
import { asset } from '../lib/asset'
import { useTheme, THEME_LABEL } from '../hooks/useTheme'
import Icon from './Icon'
import LocalClock from './LocalClock'
import Reveal from './Reveal'
import './Hero.css'

const ART_WEBP = asset('media/hero-cat.webp')
const ART_JPG = asset('media/hero-cat.jpg')
const ART_PORTRAIT_WEBP = asset('media/hero-cat-portrait.webp')
const ART_PORTRAIT_JPG = asset('media/hero-cat-portrait.jpg')

/**
 * 可选循环视频的文件名（相对 public/media/）。
 *
 * 留空 = 站内没有视频，此时**根本不渲染 <video>**。
 * 原因：public/media/ 下没有这个文件时，浏览器仍会为一个必定 404 的地址
 * 发请求（preload="metadata" 也会真的去拉一次），白占一次往返、
 * 在控制台留一条错误，还会让 React 多一次 setState。
 *
 * 要启用：把视频放到 public/media/ 下，然后把这行改成 'media/hero-loop.mp4'。
 */
const HERO_VIDEO_FILE: string = ''
const HERO_VIDEO = HERO_VIDEO_FILE ? asset(HERO_VIDEO_FILE) : null

export default function Hero() {
  const [imgOk, setImgOk] = useState(true)
  const [videoOk, setVideoOk] = useState(true)
  const [videoReady, setVideoReady] = useState(false)

  const mediaRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  /* --------------------------------------------------------------------------
     首屏的视差：把 `--parallax` 写到**图片自己**身上，而不是父层
     --------------------------------------------------------------------------
     父层写了 `will-change: transform`（提升为独立合成层）时，再逐帧改它的
     子元素 `--parallax` 会把这个 2000px 宽、还带一层 `filter` 调色的 <img>
     一起拉进重栅格化 —— 卷积滤镜 + 大图重绘是滚动里最贵的一种帧。改成直接
     给 <img> 写自定义属性：变化的只有它自己的 transform（走合成器），
     父层与其它合成层不再被牵连。

     幅度仍是 8%（`max` 里的那个系数），只在滚过首屏这一屏的范围内线性变化；
     滚出首屏后 p 恒为 1，值不再变、也就不再有任何写入。
     ------------------------------------------------------------------------ */
  useEffect(() => {
    const media = mediaRef.current
    if (!media) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    // 首屏高度是 min-height:100svh 撑的，只在 resize 时重量（不每帧读 offsetHeight）
    let heroHeight = media.offsetHeight || window.innerHeight || 1
    // 上一帧写进去的值：同值直接 return，不碰 DOM
    let last = ''

    const update = () => {
      frame = 0
      const p = Math.min(1, Math.max(0, window.scrollY / heroHeight))
      const next = `${(p * 8).toFixed(2)}%`
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
    <section id="hero" className="hero">
      <div className="hero__media" ref={mediaRef} aria-hidden="true">
        {imgOk ? (
          <picture>
            {/* 窄屏/竖屏换竖版取景；每个断点都配 WebP + JPEG 两条，
                非 WebP 浏览器会落到同取景的 JPEG，而不是掉回横版被硬裁 */}
            <source
              media="(max-width: 900px)"
              srcSet={ART_PORTRAIT_WEBP}
              type="image/webp"
            />
            <source media="(max-width: 900px)" srcSet={ART_PORTRAIT_JPG} />
            <source
              media="(max-aspect-ratio: 1/1)"
              srcSet={ART_PORTRAIT_WEBP}
              type="image/webp"
            />
            <source media="(max-aspect-ratio: 1/1)" srcSet={ART_PORTRAIT_JPG} />
            <source srcSet={ART_WEBP} type="image/webp" />
            <img
              className="hero__image"
              src={ART_JPG}
              alt=""
              decoding="async"
              fetchPriority="high"
              onError={() => setImgOk(false)}
            />
          </picture>
        ) : null}

        {HERO_VIDEO && videoOk ? (
          <video
            className={videoReady ? 'hero__video is-ready' : 'hero__video'}
            src={HERO_VIDEO}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoOk(false)}
          />
        ) : null}

        {/* 画面兜底：没有视频时只看图片是否可用；有视频时两者都坏了才用 CSS 渐变兜底 */}
        {!imgOk && (!HERO_VIDEO || !videoOk) ? <div className="hero__fallback" /> : null}

        <div className="hero__scrim" />
        <div className="hero__veil" />
        <div className="hero__vignette" />
        <div className="hero__grid" />
      </div>

      {/* 版式对齐参考站：左下文案块（大标题 + 胶囊动作行）+ 底部 SCENE 小字
          + 右下玻璃卡。眉标那一行（职位/英文名）已删除 —— 它与导航左上角的
          字标重复，且"标题上方再加一个小标签"正是要避免的廉价感来源。 */}
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
          {/* 标签从 Profile 改成 Welcome：原来标题里那行「欢迎来到，」
              按用户要求删掉，只把"欢迎"这层意思挪到这个英文标签上。 */}
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

        {/* 参考站左下角那行小字：压在首屏最底边，承载真实信息（场景 / 主题 / 时间）。
            时钟是独立叶子组件 —— 每秒只重渲染这一个文本节点，见 LocalClock.tsx。 */}
        <Reveal className="hero__scene-row" variant="fade" delay={240}>
          <p className="hero__scene mono">
            SCENE 01 · {THEME_LABEL[theme]} · UTC+8 <LocalClock />
          </p>
        </Reveal>
      </div>
    </section>
  )
}
