import { useRef, type CSSProperties, type ReactNode } from 'react'

import { projects, type Project } from '../data/projects'
import { useCardSpotlight } from '../hooks/useCardSpotlight'
import { asset, assetUrl } from '../lib/asset'
import { stagger } from '../lib/stagger'
import WindLeaves from './WindLeaves'
import Icon, { type IconName } from './Icon'
import Reveal from './Reveal'
import SectionHead from './SectionHead'
import './Projects.css'

/**
 * 卡片视觉带里那层"会飘的天空"要的两个 CSS 变量。
 *
 * 两个都由 CSS 消费（背景图 + 遮罩），所以必须走 assetUrl 解析成绝对地址 ——
 * 相对地址会以消费它的那张样式表为基准解析而 404（见 lib/asset.ts）。
 *
 * 复用同一张卡片画不会增加首屏成本：这两张 card-*.webp 在立方体舞台里
 * **本来就会在首屏被拉取**（九个面都在 fixed 舞台的视口里，`loading="lazy"`
 * 在架构上失效 —— 实测停首屏 6 秒、未滚动，card-01/02 各 50/88 KB 已在资源清单里）。
 */
function cardSky(art: string, skyMask: string): CSSProperties {
  return {
    '--card-art': `url(${assetUrl(`media/${art}`)})`,
    '--sky-mask': `url(${assetUrl(`media/${skyMask}`)})`,
  } as CSSProperties
}

/** 按指标名猜图标，保持 data/projects.ts 是纯数据。 */
function metricIcon(label: string): IconName {
  if (label.includes('体') || label.includes('大小')) return 'doc'
  if (label.includes('语言') || label.includes('地区')) return 'globe'
  if (label.includes('镜像') || label.includes('源')) return 'cloud'
  if (label.includes('时间') || label.includes('周期')) return 'clock'
  if (label.includes('量') || label.includes('数')) return 'target'
  return 'spark'
}

/**
 * 索引面与详情面共用同一个"载体"。
 *
 * ⚠️ 2026-10 起 `.section--alt`（52% 实白底）**不再挂在面上**：它会把整屏
 * 铺白，连续背景与列车就看不见了。正文的可读性改由两件更"局部"的东西承担：
 *   · `.has-art::after` 的正文本白纱（上下两端淡出，画面在上下缘仍透得出来）；
 *   · 卡片自己那块实白底（.project 的 --ink-700）。
 * 卡片的配图（card-01/02.webp + 各自的天空遮罩）**保持原样**。
 */
function Face({ children }: { children: ReactNode }) {
  return (
    <section className="section projects has-art face-body">
      <WindLeaves />
      <div className="shell">{children}</div>
    </section>
  )
}

function Card({ project, index }: { project: Project; index: number }) {
  const tone = {
    '--tone-a': project.tone[0],
    '--tone-b': project.tone[1],
  } as CSSProperties

  return (
    <Reveal as="li" className="project" variant="scale" delay={stagger(index, 90)}>
      <div className="project__head">
        <span className="project__index mono">{project.index}</span>
        <span className="project__period mono">{project.period}</span>
      </div>

      {/* 视觉带：画作裁切件打底 + 项目色调薄膜 + 网格 + 描边大字。
          画作让每张卡有真实质感，薄膜保证标题在任何画面上都读得清。
          `.project__visual-wipe` 这层是**动画层**：进场从左往右擦开的动作
          放在它身上（transform，纯合成），而裁切（clip-path / overflow）
          留在静态的 `.project__visual` 上 —— 见 Projects.css 里那一节的说明。 */}
      <div className="project__visual" style={tone} aria-hidden="true">
        <div className="project__visual-wipe">
          {project.art ? (
            <img
              className="project__art"
              src={asset(`media/${project.art}`)}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : null}
          {/* 会飘的天空：同一张画再画一层，只用遮罩露出天空区再缓慢位移 ——
              实景（石廊/门/花盆/猫）仍是基座 <img> 的像素。原理见 base.css 的 cloudDrift。 */}
          {project.art && project.artSky ? (
            <div
              className="project__sky"
              style={cardSky(project.art, project.artSky)}
              aria-hidden="true"
            >
              <div className="project__sky-drift" />
            </div>
          ) : null}
          <span className="project__visual-veil" />
          <span className="project__visual-grid" />
          <span className="project__visual-name">{project.nameEn}</span>
        </div>
      </div>

      <div className="project__body">
        <div className="project__intro">
          <Reveal as="h3" className="project__name" variant="fade">
            {project.name}
          </Reveal>
          <Reveal as="p" className="project__name-en mono" variant="fade" delay={70}>
            {project.role}
          </Reveal>
          <Reveal as="p" className="project__summary lead" delay={120}>
            {project.summary}
          </Reveal>

          {project.links && project.links.length > 0 ? (
            <div className="project__links">
              {project.links.map((link, li) => (
                <Reveal
                  as="span"
                  key={link.href}
                  variant="fade"
                  delay={stagger(li, 70, 210)}
                >
                  <a
                    className="btn btn--ghost"
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {link.label}
                    <span className="btn__arrow" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>

        <div className="project__facts">
          <ul className="project__detail">
            {/* 用下标做 key：要点文案可能出现重复句子，用文案当 key 会撞 */}
            {project.detail.map((line, di) => (
              <Reveal as="li" key={di} delay={stagger(di, 65, 300)}>
                {line}
              </Reveal>
            ))}
          </ul>

          {project.metrics && project.metrics.length > 0 ? (
            <dl className="project__metrics">
              {project.metrics.map((metric, mi) => (
                <Reveal
                  className="project__metric"
                  key={metric.label}
                  variant="scale"
                  delay={stagger(mi, 80, 240)}
                >
                  <dt className="mono">
                    <Icon name={metricIcon(metric.label)} />
                    {metric.label}
                  </dt>
                  <dd>{metric.value}</dd>
                </Reveal>
              ))}
            </dl>
          ) : null}

          <ul className="project__stack">
            {/* 同上：技术栈里重复出现同一项时下标更稳 */}
            {project.stack.map((tech, si) => (
              <Reveal
                as="li"
                key={si}
                variant="fade"
                delay={stagger(si, 45, 270)}
              >
                {tech}
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </Reveal>
  )
}

/**
 * 项目区拆成「索引面 + 一面一个项目」（见 App.tsx 的面表）。
 *
 * 为什么要有索引面：项目卡在本机实测量出来是 **≈ 1080px 高**（抬头 + 视觉带
 * + 六条要点 + 指标 + 技术栈），而面高 = 100svh（常见 900px）且 `.cube__slot`
 * 是 `overflow: hidden` —— 卡放不下就会被从底部硬切，最后几条要点与技术栈
 * 直接看不见。所以：
 *   · 索引面只放抬头 + 每张卡的名字与一年范围，永远装得进一屏；
 *   · 详情面一屏只放一张卡，卡内的要点数量由数据侧控制（3–5 条）。
 * 两处共用同一张 `--sec-art`，所以从索引滑到详情画不换，只是一次翻面。
 */
type ProjectId = 'clean' | 'dca'

export type ProjectsPart = 'index' | ProjectId

/** 面的 id 后缀（= 锚点 `#work-<id>`）与 projects.ts 下标的唯一对应关系。
 *  App.tsx 的 FACES 也用它生成，所以新增项目只改 projects.ts + 这里一行。 */
export const PROJECT_FACES: { id: ProjectId; index: number }[] = [
  { id: 'clean', index: 0 },
  { id: 'dca', index: 1 },
]

function Index() {
  return (
    <Face>
      <SectionHead idx="03" title="精选项目" note="Selected Work" icon="spark" />

      <ol className="projects__index">
        {PROJECT_FACES.map((face, i) => {
          const project = projects[face.index]
          if (!project) return null
          return (
            <Reveal
              as="li"
              className="projects__index-row"
              key={face.id}
              delay={stagger(i, 90)}
            >
              <a href={`#work-${face.id}`}>
                <span className="projects__index-no mono">{project.index}</span>
                <span className="projects__index-name">{project.name}</span>
                <span className="projects__index-en mono">{project.nameEn}</span>
                <span className="projects__index-period mono">{project.period}</span>
                <Icon name="arrowDown" className="projects__index-arrow" />
              </a>
            </Reveal>
          )
        })}
      </ol>
    </Face>
  )
}

export default function Projects({ part }: { part: ProjectsPart }) {
  // 悬停触发的卡片交互（指针跟光斑 + 轻微倾斜）。必须在 early return 之前
  // 调用 —— 否则切换 part 时 hook 数量会变（React 的规则）。
  const listRef = useRef<HTMLOListElement>(null)
  useCardSpotlight(listRef)

  if (part === 'index') return <Index />

  const index = PROJECT_FACES.find((face) => face.id === part)?.index ?? -1
  const project = projects[index]
  if (!project) return null

  return (
    <Face>
      <ol className="projects__list projects__list--solo" ref={listRef}>
        <Card project={project} index={index} />
      </ol>
    </Face>
  )
}
