import './Seam.css'

type SeamProps = {
  /** 接缝的高度档位：区块之间用 md，首屏到正文用 lg */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * 区块接缝带。
 *
 * 整站每个区块背后都压着不同的画作，两张图直接相接会在交界处出现一条硬边
 * （明度/色相同时突变）。这条带子用「透明 → 半透明 → **不透明** → 半透明 → 透明」
 * 的纵向渐变把那条硬边盖掉：中间不透明的一段负责遮，两端负责融。
 *
 * 颜色全部走 --seam-* 令牌，所以两个主题各自成立。
 * 纯装饰，aria-hidden + pointer-events:none。
 */
export default function Seam({ size = 'md' }: SeamProps) {
  return <div className={`seam seam--${size}`} aria-hidden="true" />
}
