import { useState } from 'react'

import { profile } from '../data/profile'
import { asset } from '../lib/asset'
import { sectionArt } from '../lib/sectionArt'
import { stagger } from '../lib/stagger'
import { useCopy } from '../hooks/useCopy'
import Icon, { socialIcon, type IconName } from './Icon'
import Reveal from './Reveal'
import SectionHead from './SectionHead'
import './About.css'

type ContactRow = {
  key: string
  label: string
  value: string
  icon: IconName
  href?: string
  copy?: string
}

/** 能力分组的图标：没命中就给一枚火花，不至于开天窗。 */
const CAP_ICON: Record<string, IconName> = {
  前端: 'code',
  后端: 'layers',
  工程化: 'tune',
  '桌面 / 客户端': 'desktop',
}

function capIcon(group: string): IconName {
  return CAP_ICON[group] ?? 'spark'
}

/** 模块级常量：内容静态，避免每次渲染重建数组 */
const CONTACT_ROWS: ContactRow[] = [
  {
    key: 'email',
    label: '邮箱',
    value: profile.email,
    icon: 'mail',
    href: `mailto:${profile.email}`,
    copy: profile.email,
  },
  {
    key: 'phone',
    label: '电话',
    value: profile.phone,
    icon: 'phone',
    href: `tel:${profile.phone.replace(/[^\d+]/g, '')}`,
    copy: profile.phone,
  },
  ...profile.socials.map((social) => ({
    key: social.label,
    label: social.label,
    value: social.value,
    icon: socialIcon(social.label),
    href: social.href,
    copy: social.copy,
  })),
]

const PORTRAIT_SRC = asset('media/portrait.jpg')

export default function About() {
  const [portraitOk, setPortraitOk] = useState(true)
  const { copiedKey, copy } = useCopy()

  return (
    <section id="about" className="section about has-art" style={sectionArt('sec-about.webp')}>
      <div className="shell">
        <SectionHead idx="02" title="关于我" note="Profile & Background" icon="cat" />

        {/* 图标概览：把下面那堆文字先翻译成四张"贴纸"，逐张入场 */}
        <div className="about__highlights">
          {profile.capabilities.map((cap, i) => (
            <Reveal
              className="about__highlight"
              key={cap.group}
              variant="scale"
              delay={stagger(i, 90)}
            >
              <span className="tile">
                <Icon name={capIcon(cap.group)} />
              </span>
              <span className="about__highlight-label">{cap.group}</span>
              <span className="about__highlight-note mono">
                {cap.items.slice(0, 3).join(' · ')}
              </span>
            </Reveal>
          ))}
        </div>

        <div className="about__top">
          <div className="about__aside">
            <Reveal variant="left">
              <figure className="portrait">
                <div className="portrait__frame">
                  {portraitOk ? (
                    <img
                      src={PORTRAIT_SRC}
                      alt={`${profile.name} 的照片`}
                      loading="lazy"
                      decoding="async"
                      onError={() => setPortraitOk(false)}
                    />
                  ) : (
                    <span className="portrait__fallback mono" aria-hidden="true">
                      {profile.portraitFallback}
                    </span>
                  )}
                  <span className="portrait__corner portrait__corner--tl" aria-hidden="true" />
                  <span className="portrait__corner portrait__corner--tr" aria-hidden="true" />
                  <span className="portrait__corner portrait__corner--bl" aria-hidden="true" />
                  <span className="portrait__corner portrait__corner--br" aria-hidden="true" />
                </div>
                <figcaption className="portrait__cap mono">
                  {profile.nameEn} · {profile.roleEn}
                </figcaption>
              </figure>
            </Reveal>

            <ul className="contact">
              {CONTACT_ROWS.map((row, i) => {
                const copyText = row.copy
                const done = copiedKey === row.key
                return (
                  <Reveal
                    as="li"
                    className="contact__row"
                    key={row.key}
                    variant="left"
                    delay={stagger(i, 60)}
                  >
                    <span className="tile tile--sm contact__icon" aria-hidden="true">
                      <Icon name={row.icon} />
                    </span>
                    <span className="contact__label mono">{row.label}</span>
                    {row.href ? (
                      <a className="contact__value" href={row.href}>
                        {row.value}
                      </a>
                    ) : (
                      <span className="contact__value">{row.value}</span>
                    )}
                    {copyText ? (
                      <button
                        type="button"
                        className={done ? 'contact__copy is-done' : 'contact__copy'}
                        onClick={() => void copy(copyText, row.key)}
                        aria-label={`复制${row.label}`}
                      >
                        {done ? '已复制' : '复制'}
                      </button>
                    ) : null}
                  </Reveal>
                )
              })}
            </ul>

            {profile.resumeUrl ? (
              <Reveal variant="fade">
                <a className="pill pill--quiet about__resume" href={profile.resumeUrl}>
                  <Icon name="doc" />
                  下载简历 PDF
                </a>
              </Reveal>
            ) : null}
          </div>

          <div className="about__bio">
            {profile.bio.map((paragraph, i) => (
              <Reveal as="p" key={paragraph.slice(0, 16)} delay={stagger(i, 110)}>
                {paragraph}
              </Reveal>
            ))}
          </div>
        </div>

        <div className="about__bottom">
          <div className="about__block">
            <Reveal as="h3" className="block__title mono" variant="fade">
              <Icon name="leaf" />
              经历 / Experience
            </Reveal>
            <ol className="timeline">
              {profile.timeline.map((item, i) => (
                <Reveal
                  as="li"
                  className="timeline__item"
                  key={`${item.period}-${item.org}`}
                  delay={stagger(i, 90)}
                >
                  <span className="timeline__period mono">{item.period}</span>
                  <div className="timeline__body">
                    <h4 className="timeline__org">{item.org}</h4>
                    <p className="timeline__role mono">{item.role}</p>
                    <p className="timeline__detail">{item.detail}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>

          <div className="about__block">
            <Reveal as="h3" className="block__title mono" variant="fade" delay={80}>
              <Icon name="layers" />
              能力 / Capabilities
            </Reveal>
            <dl className="caps">
              {profile.capabilities.map((cap, i) => (
                <Reveal
                  className="caps__row"
                  key={cap.group}
                  variant="right"
                  delay={stagger(i, 80)}
                >
                  <dt className="mono">
                    <Icon name={capIcon(cap.group)} />
                    {cap.group}
                  </dt>
                  <dd>
                    <ul className="caps__items">
                      {cap.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
