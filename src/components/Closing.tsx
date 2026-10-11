import { profile } from '../data/profile'
import { stagger } from '../lib/stagger'
import { useCopy } from '../hooks/useCopy'
import Icon, { socialIcon } from './Icon'
import Reveal from './Reveal'
import WindLeaves from './WindLeaves'
import './Closing.css'

export default function Closing() {
  const { copiedKey, copy } = useCopy()
  const year = new Date().getFullYear()
  const mailCopied = copiedKey === 'closing-mail'

  return (
    /* ⚠️ 同 Hero.tsx：这个区块**故意不写 `id="contact"`** —— 锚点 id 由
       Cube.tsx 的定位锚点独占。这一屏在 `position: fixed` 的 .cube__stage 里，
       自己带 id 只会造成重复 id，并让 getElementById 的结果取决于 DOM 顺序。 */
    <section className="closing has-art">
      <div className="closing__glow" aria-hidden="true" />

      {/* 风里的落叶：与首屏同一处置 —— 放在**氛围层之后**，否则会被压白到看不见。
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
