import type { CSSProperties } from 'react'

import About from './components/About'
import CatCompanion from './components/CatCompanion'
import Closing from './components/Closing'
import DevNotice from './components/DevNotice'
import EntryGate from './components/EntryGate'
import Hero from './components/Hero'
import Nav from './components/Nav'
import Projects from './components/Projects'
import Seam from './components/Seam'
import { UNFILLED } from './data/profile'
import { asset } from './lib/asset'
import './App.css'

/**
 * 整页氛围层用竖版那张画 —— 竖构图铺在滚动长页上比横版自然。
 * 素材是一张 160px 的糊图（2 KB），不是首屏原图（会白拉 283 KB）。
 */
const pageBgStyle = {
  '--page-bg-image': `url(${asset('media/ambient-portrait.webp')})`,
} as CSSProperties

export default function App() {
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

      {/* 入场幕屏：只对首次访问者显示，见 EntryGate.tsx 顶部说明 */}
      <EntryGate />

      {/* 跟随光标的猫：只在精确指针 + 允许动效时渲染，导航栏可关 */}
      <CatCompanion />

      {import.meta.env.DEV && UNFILLED.length > 0 ? <DevNotice /> : null}
    </>
  )
}
