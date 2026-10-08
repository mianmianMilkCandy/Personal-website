import Icon, { type IconName } from './Icon'
import Reveal from './Reveal'

type SectionHeadProps = {
  /** 区块编号，如 "02" */
  idx: string
  /** 中文主标题 */
  title: string
  /** 右上角等宽注释，通常是英文标签 */
  note: string
  /** 编号旁边的小图标：让每个区块一眼能被认出来 */
  icon?: IconName
}

/**
 * 全站统一的区块抬头。
 * 三部分各自入场（编号 → 标题 → 注释），比整块一起出现更有节奏。
 */
export default function SectionHead({ idx, title, note, icon }: SectionHeadProps) {
  return (
    <div className="section-head">
      <Reveal as="span" className="section-head__idx" variant="fade">
        {icon ? <Icon name={icon} /> : null}
        {idx}
      </Reveal>
      <Reveal as="h2" className="section-head__title" delay={70}>
        {title}
      </Reveal>
      <Reveal as="span" className="section-head__note" variant="fade" delay={150}>
        {note}
      </Reveal>
    </div>
  )
}
