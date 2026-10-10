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
 *
 * 第二个参数给"会飘的天空"那张 alpha 遮罩（见 components/ArtSky.tsx）。
 * 传了就多给一个 `--sky-mask`；两个变量都是给 CSS 消费的，所以同样必须走
 * assetUrl。遮罩由 _repo/vid/skygen.py 从同一张画上按多边形 + 羽化生成。
 */
export function sectionArt(file: string, skyMask?: string): CSSProperties {
  const style: Record<string, string> = {
    '--sec-art': `url(${assetUrl(`media/${file}`)})`,
  }
  if (skyMask) style['--sky-mask'] = `url(${assetUrl(`media/${skyMask}`)})`
  return style as CSSProperties
}
