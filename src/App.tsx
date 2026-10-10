import { useEffect, type CSSProperties } from 'react'

import About from './components/About'
import Ambience from './components/Ambience'
import Closing from './components/Closing'
import Cube, { type CubeFace } from './components/Cube'
import DevNotice from './components/DevNotice'
import DynamicCursor from './components/DynamicCursor'
import EntryGate from './components/EntryGate'
import Hero from './components/Hero'
import Nav from './components/Nav'
import Projects, { PROJECT_FACES } from './components/Projects'
import { UNFILLED } from './data/profile'
import { assetUrl } from './lib/asset'
import { initClickShine } from './lib/clickShine'
import { initSmoothAnchors } from './lib/smoothAnchors'
import './App.css'
import './styles/art-scrim.css'
import './styles/interactions.css'

/**
 * 整页氛围层用竖版那张画 —— 竖构图铺在滚动长页上比横版自然。
 * 素材是一张 160px 的糊图（2 KB），不是首屏原图（会白拉 283 KB）。
 * 这里必须用 assetUrl（绝对地址）：它由 App.css 的 var(--page-bg-image) 消费，
 * 相对地址会以样式表所在目录为基准解析而 404。
 */
const pageBgStyle = {
  '--page-bg-image': `url(${assetUrl('media/ambient-portrait.webp')})`,
} as CSSProperties

/**
 * 面表 —— 整站就是这根棱柱的若干个侧面（面数 = 数组长度，动态）。
 *
 * 为什么从原来的四个版块变成 9 个面：立方体滚动的几何硬约束是**每个面恰好
 * 一屏高**（见 lib/cube.ts），而原来的「关于我」「精选项目」都是内容撑高的
 * 长区块（关于区 ≈ 3 屏、项目区 ≈ 4 屏）。所以按内容语义重新分页 ——
 * 内容一条没删，只是换了每屏装多少。
 *
 * id 同时是锚点：导航与深链（#about / #projects / #contact）直接落在面上，
 * 所以 Nav 与 useActiveSection 一行都不用改。
 *
 * 精选项目是**一面一个项目**：projects.ts 里有几条，这里就补几个面。
 * 新增项目时只改这两处（数据 + 面表），导航与几何都会自动跟上。
 */
const FACES: CubeFace[] = [
  { id: 'hero', node: <Hero /> },
  { id: 'about', node: <About part="intro" /> },
  { id: 'about-contact', node: <About part="contact" /> },
  { id: 'about-story', node: <About part="story" /> },
  { id: 'about-caps', node: <About part="caps" /> },
  { id: 'projects', node: <Projects part="index" /> },
  /* 一面一个项目：面的数量跟着 projects.ts 走，不手写 */
  ...PROJECT_FACES.map((face) => ({
    id: `work-${face.id}`,
    node: <Projects part={face.id} />,
  })),
  { id: 'contact', node: <Closing /> },
]

export default function App() {
  // 全站按钮的点击光影：文档级一个监听器，见 src/lib/clickShine.ts
  useEffect(() => initClickShine(), [])

  // 平滑滚动只留给锚点跳转，滚轮保持原生瞬时（见 lib/smoothAnchors.ts）
  useEffect(() => initSmoothAnchors(), [])

  return (
    <>
      <a className="skip-link mono" href="#main">
        跳到主内容
      </a>

      <Nav />

      <main id="main">
        {/* 交界不再用遮盖带也不再画折痕：相邻两面本身就成 90° 棱，
            过渡由棱承担。Seam 组件与其令牌保留给"关闭 3D"的降级路径。 */}
        <Cube faces={FACES} />
      </main>

      {/* 整页氛围光（远/近光带 + 旋流光 + 指针光）。压在面之上、导航之下 ——
          于是它像"打在画面上的光"，既不挡交互，也洗不掉导航文字。见 Ambience.tsx */}
      <Ambience />

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
