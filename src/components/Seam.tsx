import './Seam.css'

type SeamProps = {
  /** 接缝的高度档位：区块之间用 md，首屏到正文用 lg */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * 区块交界处的折痕。
 *
 * 整站每个区块背后都压着不同的画作。区块之间的过渡**不是由这个元素承担的**
 * —— 它交给画自己：每张画两端用 mask 淡出/淡入（.has-art::before，见 base.css），
 * 于是两张画交叉时中间只剩背景，不存在谁盖住谁的硬接缝。
 *
 * 这个元素只负责"折痕"：一条两端淡出的 1px 发丝线 + 下方一小段折影，
 * 给交界一个"折过一次"的理由。lg 档（首屏→正文）额外用一块不透明的
 * --seam-ramp 接住首屏底部那层近黑，否则会露出更亮的整页背景。
 *
 * 为什么不直接做 3D 翻页/滚立方体：那个方案要求每个区块恰好一屏高（面必须
 * 等尺寸），而本站的 #about / #projects 都是内容撑高的长区块，一个面装不下；
 * 硬做只能砍内容或劫持滚动。折痕能在平面内给出同样的"交界有理由"效果，
 * 且零 JS、零滚动改动、reduced-motion 不需要分支。
 *
 * 颜色全部走 --seam-* 令牌，所以两个主题各自成立。
 * 纯装饰，aria-hidden + pointer-events:none。
 */
export default function Seam({ size = 'md' }: SeamProps) {
  return <div className={`seam seam--${size}`} aria-hidden="true" />
}
