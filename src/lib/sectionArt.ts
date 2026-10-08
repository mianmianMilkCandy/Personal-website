import type { CSSProperties } from 'react'

import { assetUrl } from './asset'

/**
 * 把一个区块背景画作文件接成 CSS 变量，供 `.has-art::before` 消费。
 *
 * 不直接写在 CSS 里的原因：`public/` 下的资源路径要经过 Vite 的 base 处理，
 * 只有走 asset 才能保证 base 改成子目录后依然正确。
 *
 * 必须用 assetUrl（绝对地址）而不是 asset：这个值最终是被 base.css 里的
 * `background-image: var(--sec-art)` 消费的，相对地址会以那张样式表为基准解析，
 * 落到 /assets/media/... 上 404。详见 asset.ts 里的说明。
 */
export function sectionArt(file: string): CSSProperties {
  return { '--sec-art': `url(${assetUrl(`media/${file}`)})` } as CSSProperties
}
