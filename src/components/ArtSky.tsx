import './ArtSky.css'

/**
 * 区块的"会飘的天空"层（关于 / 精选项目 / 收尾三个区块共用）。
 *
 * 原理与首屏那一套完全一致，完整说明在 Hero.css 与 base.css 的 cloudDrift 注释里：
 * 把**同一张区块画**再画一层，只用 alpha 遮罩露出天空区（`.cube__slot` 外的天空
 * 一律不遮，因为遮罩就是按那张画生成的），再让整层做缓慢的位移 + 轻微放大。
 * 于是天空里的云在飘，而石墙、木檐、绿植、海面始终是基座那张原图的像素。
 *
 * 为什么单独抽成一个组件：三个区块都要同一套东西，而遮罩文件名与 `--sec-art`
 * 一样由调用方通过 style 传进来（`sectionArt(art, skyMask)`），所以这里不接 props。
 *
 * 调用的前提：父级 `.has-art` 上要有 `--sec-art`（基座画）与 `--sky-mask`（遮罩）
 * 两个变量 —— 两个都必须经 assetUrl 解析成绝对地址，理由见 lib/asset.ts。
 */
export default function ArtSky() {
  return (
    <div className="art-sky" aria-hidden="true">
      <div className="art-sky__drift" />
    </div>
  )
}
