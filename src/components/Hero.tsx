import { useEffect, useRef, useState, type CSSProperties } from 'react'

import { profile } from '../data/profile'
import { asset, assetUrl } from '../lib/asset'
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
 * 动态云层要的三样东西**全部由 CSS 消费**（背景图 + 两张遮罩），
 * 所以必须走 assetUrl（解析成绝对地址）：相对地址会以消费它的那张样式表为基准
 * 解析而 404 —— 这个坑在本站已经踩过一次（见 lib/asset.ts）。
 *
 * 天空遮罩是"白=天空、透明=实景"的 alpha PNG，由 _repo/vid/skygen.py 从同一张画上
 * 按多边形 + 羽化生成，只有 7 KB 左右；云层本身复用上面那张已经加载过的画，
 * 所以开这个效果**不会**给首屏增加一张大图的负担。
 *
 * ⚠️ 遮罩与 <picture> 的取景必须同源：遮罩的尺寸/位置要和 object-fit /
 * object-position 一一对应（含窄屏那一套），否则遮罩会静默错位。
 */
const CLOUD_STYLE = {
  '--hero-art': `url(${assetUrl('media/hero-cat.webp')})`,
  '--sky-mask': `url(${assetUrl('media/sky-hero-cat.png')})`,
  '--sky-mask-portrait': `url(${assetUrl('media/sky-hero-cat-portrait.png')})`,
} as CSSProperties

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
     首屏的视差：逐帧把 `--parallax` 写到 .hero__media 这一层（而不是 <img>）
     --------------------------------------------------------------------------
     变量挂在外层容器上、由内部的 <img> / <video> 各自用 `var(--parallax)` 消费：
     自定义属性会继承，所以两个消费者拿到的都是同一个值 —— 若直接写在 <img> 上，
     <video> 那条路径就拿不到（而视频是有可能出现的，见 HERO_VIDEO_FILE）。

     真正要守住的是"变化只落在 transform 上"：`--parallax` 只被
     translate3d 的 y 分量消费，于是这层位移走合成器，不会牵连父层的
     will-change 合成层，也不会让那张 2000px 宽、还带一层 filter 调色的
     <img> 被拉进重栅格化。父层写的 9 个面 transform 与它无关。

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
    /* ⚠️ 这里**故意不写 `id="hero"`**：锚点 id 由 Cube.tsx 里那颗定位锚点独占
       （它在 .cube__track 的绝对定位 top 上）。这一面在 `position: fixed` 的
       .cube__stage 里，文档内位置对滚动没有意义 —— 两个元素抢同一个 id 时
       getElementById 只会返回文档序在前的那个，深链与导航高亮全靠这个巧合。
       重排 Cube 的 DOM 就会静默失准，所以不要把这个 id 加回来。 */
    <section className="hero">
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

        {/* 动态云层：天空区用同一张画的位移副本缓慢飘移，台阶与猫一个像素不动。
            原理与参数见 Hero.css 那一节。只在图片可用时挂 —— 图挂了这里也只是一张空底。
            位置：在 <picture> 之后、<video> 与各层遮罩之前，所以视频存在时会盖住它。 */}
        {imgOk ? (
          <div className="hero__clouds" style={CLOUD_STYLE} aria-hidden="true">
            <div className="hero__clouds-drift" />
          </div>
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
