import { profile } from '../data/profile'
import { sectionArt } from '../lib/sectionArt'
import { stagger } from '../lib/stagger'
import { useCopy } from '../hooks/useCopy'
import ArtSky from './ArtSky'
import Icon, { socialIcon } from './Icon'
import Reveal from './Reveal'
import WindLeaves from './WindLeaves'
import './Closing.css'

/**
 * 区块画 + 天空遮罩。遮罩由 CSS 消费，所以 sectionArt 内部走的是 assetUrl
 * （绝对地址）—— 理由见 lib/asset.ts。遮罩是"白=天空、透明=实景"的 alpha PNG，
 * 约 10 KB，由 _repo/vid/skygen.py 生成；天空层本身复用 `--sec-art` 那张画。
 */
const CLOSING_STYLE = sectionArt('sec-closing.webp', 'sky-sec-closing.png')

export default function Closing() {
  const { copiedKey, copy } = useCopy()
  const year = new Date().getFullYear()
  const mailCopied = copiedKey === 'closing-mail'

  return (
    /* ⚠️ 同 Hero.tsx：这个区块**故意不写 `id="contact"`** —— 锚点 id 由
       Cube.tsx 的定位锚点独占。这一屏在 `position: fixed` 的 .cube__stage 里，
       自己带 id 只会造成重复 id，并让 getElementById 的结果取决于 DOM 顺序。 */
    <section
      className="closing has-art"
      style={CLOSING_STYLE}
    >
      {/* 会飘的天空层：只有天空在动，木檐与石廊一个像素不动。
          必须放在 .closing__glow 之前 —— 辉光要压在天空上（与它原先压在原画上一致）。
          原理与参数见 ArtSky.tsx / ArtSky.css。 */}
      <ArtSky />

      <div className="closing__glow" aria-hidden="true" />

      {/* 风里的落叶：与首屏同一处置 —— 放在**氛围层之后**，否则会被压暗到看不见。
          理由见 WindLeaves.tsx / Hero.tsx 的注释。 */}
      <WindLeaves />

      <div className="closing__inner">
        <Reveal>
          <p className="closing__eyebrow mono">
            <Icon name="star" />
            04 / Contact
          </p>
          <h2 className="closing__title">
            <span className="closing__title-line">一起做点</span>
            <span className="closing__title-line closing__title-line--ghost">
              真正能用的东西
            </span>
          </h2>
        </Reveal>

        <Reveal delay={80}>
          <p className="closing__lead lead">
            有岗位、有项目，或者只是想聊聊技术，都可以直接找我。邮件我基本当天回。
          </p>
        </Reveal>

        <Reveal className="closing__actions" delay={140}>
          <a className="closing__mail" href={`mailto:${profile.email}`}>
            <Icon name="mail" className="closing__mail-icon" />
            {profile.email}
          </a>
          <button
            type="button"
            className={
              mailCopied ? 'pill pill--quiet is-done' : 'pill pill--quiet'
            }
            onClick={() => void copy(profile.email, 'closing-mail')}
          >
            {mailCopied ? '已复制' : '复制邮箱'}
          </button>
        </Reveal>

        <Reveal delay={200}>
          <ul className="closing__socials">
          {profile.socials.map((social, i) => (
            <Reveal
              as="li"
              key={social.label}
              variant="scale"
              delay={stagger(i, 80)}
            >
              {social.href ? (
                <a href={social.href} target="_blank" rel="noreferrer noopener">
                  <span className="tile tile--sm closing__social-tile" aria-hidden="true">
                    <Icon name={socialIcon(social.label)} />
                  </span>
                  {social.label}
                  <Icon name="arrowRight" className="closing__social-arrow" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    void copy(social.copy ?? social.value, social.label)
                  }
                >
                  <span className="tile tile--sm closing__social-tile" aria-hidden="true">
                    <Icon name={socialIcon(social.label)} />
                  </span>
                  {social.label}
                  <span className="closing__social-state mono">
                    {copiedKey === social.label ? '已复制' : '复制'}
                  </span>
                </button>
              )}
            </Reveal>
          ))}
        </ul>
        </Reveal>
      </div>

      <footer className="closing__foot">
        <div className="closing__foot-inner">
          <p className="mono">
            © {year} {profile.name}
          </p>
          <p className="mono">React · Vite · TypeScript</p>
          <a className="closing__top mono" href="#hero">
            回到顶部 ↑
          </a>
        </div>
      </footer>
    </section>
  )
}
