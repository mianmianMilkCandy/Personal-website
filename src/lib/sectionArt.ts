import type { CSSProperties } from 'react'

import { asset } from './asset'

/**
 * 把一个区块背景画作文件接成 CSS 变量，供 `.has-art::before` 消费。
 *
 * 不直接写在 CSS 里的原因：`public/` 下的资源路径要经过 Vite 的 base 处理，
 * 只有走 asset() 才能保证 base 改成子目录后依然正确。
 */
export function sectionArt(file: string): CSSProperties {
  return { '--sec-art': `url(${asset(`media/${file}`)})` } as CSSProperties
}
