import { useEffect, useRef, useState } from 'react'

import { profile } from '../data/profile'
import { asset } from '../lib/asset'
import { useLocalTime } from '../hooks/useLocalTime'
import { useTheme, THEME_LABEL } from '../hooks/useTheme'
import Icon from './Icon'
import Reveal from './Reveal'
import './Hero.css'

const ART_WEBP = asset('media/hero-cat.webp')
const ART_JPG = asset('media/hero-cat.jpg')
const ART_PORTRAIT_WEBP = asset('media/hero-cat-portrait.webp')
const ART_PORTRAIT_JPG = asset('media/hero-cat-portrait.jpg')
const HERO_VIDEO = asset('media/hero-loop.mp4')

export default function Hero() {
  const [imgOk, setImgOk] = useState(true)
  const [videoOk, setVideoOk] = useState(true)
  const [videoReady, setVideoReady] = useState(false)

  const heroRef = useRef<HTMLElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)
  const clock = useLocalTime()
  const { theme } = useTheme()

  // ① 鼠标跟随聚光：直接写 CSS 变量，避免每帧 setState 引发重渲染
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    let x = 0
    let y = 0

    const apply = () => {
      frame = 0
      hero.style.setProperty('--mx', `${x}px`)
      hero.style.setProperty('--my', `${y}px`)
    }

    const onMove = (e: PointerEvent) => {
      const rect = hero.getBoundingClientRect()
      x = e.clientX - rect.left
      y = e.clientY - rect.top
      if (!frame) frame = requestAnimationFrame(apply)
    }

    hero.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      hero.removeEventListener('pointermove', onMove)
    }
  }, [])

  // ② 轻微视差：背景慢于前景（幅度压到 8%）
  useEffect(() => {
    const hero = heroRef.current
    const media = mediaRef.current
    if (!hero || !media) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0

    const update = () => {
      frame = 0
      const h = hero.offsetHeight || 1
      const p = Math.min(1, Math.max(0, window.scrollY / h))
      media.style.setProperty('--parallax', `${(p * 8).toFixed(2)}%`)
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <section id="hero" className="hero" ref={heroRef}>
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

        {videoOk ? (
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

        {!imgOk && !videoOk ? <div className="hero__fallback" /> : null}

        <div className="hero__scrim" />
        <div className="hero__veil" />
        <div className="hero__vignette" />
        <div className="hero__grid" />
        <div className="hero__spotlight" />
      </div>

      {/* 版式对齐参考站：左下文案块 + 右下玻璃卡 + 左下角 SCENE 小字 */}
      <div className="hero__inner">
        <div className="hero__lead">
          <Reveal variant="up">
            <p className="hero__eyebrow mono">
              <span
                className="hero__dot"
                data-tone={profile.statusTone}
                aria-hidden="true"
              />
              {profile.roleEn}
              <span className="hero__slash" aria-hidden="true">
                /
              </span>
              {profile.nameEn}
            </p>

            <h1 className="hero__title">
              <span className="hero__title-line">{profile.heroGreeting}</span>
              <span className="hero__title-line">
                {profile.name}的主页
                <span className="hero__title-dot">。</span>
              </span>
            </h1>

            <p className="hero__tagline lead">{profile.tagline}</p>
          </Reveal>

          <Reveal variant="up" delay={120}>
            <div className="hero__actions">
              <a className="pill" href="#projects">
                向下滚动进入
                <Icon name="arrowDown" />
              </a>
              <a className="pill pill--quiet" href="#contact">
                联系我
                <Icon name="mail" />
              </a>
              <a className="hero__scrollhint" href="#about">
                <span className="mono">Scroll Down</span>
              </a>
            </div>
          </Reveal>

          <Reveal variant="fade" delay={240}>
            <p className="hero__scene mono">
              <Icon name="spark" className="hero__scene-icon" />
              SCENE 01 · {THEME_LABEL[theme]} · UTC+8 {clock}
            </p>
          </Reveal>
        </div>

        <Reveal as="aside" className="hero__card glass" variant="scale" delay={180}>
          <p className="hero__card-label mono">
            <Icon name="cat" className="hero__card-label-icon" />
            Profile
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

          <p className="hero__card-status mono">
            <span
              className="hero__dot"
              data-tone={profile.statusTone}
              aria-hidden="true"
            />
            {profile.status}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
