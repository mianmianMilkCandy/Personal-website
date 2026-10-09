import type { CSSProperties, ReactNode } from 'react'

import { projects, type Project } from '../data/projects'
import { asset } from '../lib/asset'
import { sectionArt } from '../lib/sectionArt'
import { stagger } from '../lib/stagger'
import Icon, { type IconName } from './Icon'
import Reveal from './Reveal'
import SectionHead from './SectionHead'
import './Projects.css'

/** 按指标名猜图标，保持 data/projects.ts 是纯数据。 */
function metricIcon(label: string): IconName {
  if (label.includes('体') || label.includes('大小')) return 'doc'
  if (label.includes('语言') || label.includes('地区')) return 'globe'
  if (label.includes('镜像') || label.includes('源')) return 'cloud'
  if (label.includes('时间') || label.includes('周期')) return 'clock'
  if (label.includes('量') || label.includes('数')) return 'target'
  return 'spark'
}

const PROJECTS_ART = sectionArt('sec-projects.webp')

function Face({ children }: { children: ReactNode }) {
  return (
    <section
      className="section section--alt projects has-art face-body"
      style={PROJECTS_ART}
    >
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
          画作让每张卡有真实质感，薄膜保证标题在任何画面上都读得清。 */}
      <div className="project__visual" style={tone} aria-hidden="true">
        {project.art ? (
          <img
            className="project__art"
            src={asset(`media/${project.art}`)}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <span className="project__visual-veil" />
        <span className="project__visual-grid" />
        <span className="project__visual-name">{project.nameEn}</span>
        {project.placeholder ? (
          <span className="project__badge mono">占位内容 · 待替换</span>
        ) : null}
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
 * 项目区拆成三个面（见 App.tsx 的面表）：一个项目一个面。
 * 三个面共用同一张画，标题行只出现在第一面。
 */
export type ProjectsPart = 'first' | 'second' | 'third'

export default function Projects({ part }: { part: ProjectsPart }) {
  const index = part === 'first' ? 0 : part === 'second' ? 1 : 2
  const project = projects[index]
  if (!project) return null

  return (
    <Face>
      {part === 'first' ? (
        <SectionHead idx="03" title="精选项目" note="Selected Work" icon="spark" />
      ) : null}
      <ol className="projects__list projects__list--solo">
        <Card project={project} index={index} />
      </ol>
    </Face>
  )
}
