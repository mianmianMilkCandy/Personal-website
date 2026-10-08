import { useEffect, type CSSProperties } from 'react'

import About from './components/About'
import Closing from './components/Closing'
import DevNotice from './components/DevNotice'
import DynamicCursor from './components/DynamicCursor'
import EntryGate from './components/EntryGate'
import Hero from './components/Hero'
import Nav from './components/Nav'
import Projects from './components/Projects'
import Seam from './components/Seam'
import { UNFILLED } from './data/profile'
import { assetUrl } from './lib/asset'
import { initClickShine } from './lib/clickShine'
import './App.css'

/**
 * 整页氛围层用竖版那张画 —— 竖构图铺在滚动长页上比横版自然。
 * 素材是一张 160px 的糊图（2 KB），不是首屏原图（会白拉 283 KB）。
 * 这里必须用 assetUrl（绝对地址）：它由 App.css 的 var(--page-bg-image) 消费，
 * 相对地址会以样式表所在目录为基准解析而 404。
 */
const pageBgStyle = {
  '--page-bg-image': `url(${assetUrl('media/ambient-portrait.webp')})`,
} as CSSProperties

export default function App() {
  // 全站按钮的点击光影：文档级一个监听器，见 src/lib/clickShine.ts
  useEffect(() => initClickShine(), [])

  return (
    <>
      <a className="skip-link mono" href="#main">
        跳到主内容
      </a>

      <Nav />

      <main id="main">
        <Hero />
        {/* 每个区块背后都是不同的画，直接相接会出现硬边 ——
            接缝带用「透明 → 半透明 → 不透明 → 半透明 → 透明」把交界盖掉 */}
        <Seam size="lg" />
        <About />
        <Seam />
        <Projects />
        <Seam />
        <Closing />
      </main>

      {/* 氛围层与颗粒层都固定定位、pointer-events 关闭，绝不拦截交互 */}
      <div className="page-bg" style={pageBgStyle} aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      {/* 手绘描边按钮用的湍流位移滤镜（base.css 里的 `filter: url(#sketch-line)`）。
          只作用在按钮的 ::before 描边层上，所以文字不会被搅糊。 */}
      <svg className="sketch-defs" aria-hidden="true" focusable="false">
        <defs>
          <filter id="sketch-line" x="-12%" y="-60%" width="124%" height="220%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.028"
              numOctaves="2"
              seed="7"
              result="sketchNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="sketchNoise"
              scale="2.4"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* 入场幕屏：只对首次访问者显示，见 EntryGate.tsx 顶部说明 */}
      <EntryGate />

      {/* 动态鼠标光标：只在精确指针 + 允许动效时启用 */}
      <DynamicCursor />

      {import.meta.env.DEV && UNFILLED.length > 0 ? <DevNotice /> : null}
    </>
  )
}
