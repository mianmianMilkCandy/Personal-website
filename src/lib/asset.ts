/**
 * 把 public/ 下的资源路径拼成对部署位置无关的地址。
 * vite.config 里 base 为 './'，因此 BASE_URL 为 './'，产物可放任意子目录。
 */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

/**
 * 要写进 CSS 自定义属性、再由样式表里的 var() 消费的地址，必须先解析成**绝对地址**。
 *
 * 踩过的坑（区块背景画与整页氛围层同时中招，而且完全不报错、图层静默消失）：
 * 自定义属性里的 url() 是**在消费它的那张样式表里**解析相对路径的。
 * base 为 './' 时 asset() 给出 './media/x.webp'，被 `/assets/index-xxx.css`
 * 消费后就变成 `/assets/media/x.webp` → 404 → 画根本没画上去。
 * （dev 下同理：消费方是 `/src/styles/base.css`，会去找 `/src/styles/media/`。）
 *
 * 用 document.baseURI 先解析一次，dev / 根路径部署 / 子目录部署三种情况都成立。
 */
export function assetUrl(path: string): string {
  return new URL(asset(path), document.baseURI).href
}
