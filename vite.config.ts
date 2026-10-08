import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * 内容安全策略。
 *
 * 两个必须放行的东西，原因写在括号里（不是偷懒放宽）：
 *  · `script-src 'unsafe-inline'` —— index.html 里那段**同步**的主题引导脚本
 *    必须是内联的：改成外部文件会多一次阻塞式往返、并且会有主题闪烁（FOUC）。
 *    用 sha256 哈希锁定它则会在 Vite 改写内联脚本格式后静默失效，风险更大。
 *  · `style-src 'unsafe-inline'` —— React 的 style 属性（区块画作 --sec-art、
 *    项目卡 --tone-*、--swatch 等）都以内联样式注入，禁掉会直接掉版式。
 *
 * 真正起作用的是其余部分：把脚本/连接/图片/框架的**来源**收窄到本站
 * （外加字体 CDN 两个域），封掉 object / base / form / frame —— 即使
 * 将来有人在内容里注入了标记，也没有可用的外发通道。
 *
 * 通过 <meta http-equiv> 注入（而不是只依赖服务器头）是因为 GitHub Pages
 * 这类托管**无法自定义响应头**，meta 是那里唯一的落点。
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "img-src 'self' data:",
  "media-src 'self'",
  "font-src 'self' https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "form-action 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
].join('; ')

/**
 * 只在**生产构建**里注入 CSP：dev 模式下 Vite 的 HMR 走 ws 连接与注入脚本，
 * 提前套上 CSP 会把开发体验搞坏（而且开发环境本来就不是威胁模型的一部分）。
 */
function cspMetaPlugin(): Plugin {
  return {
    name: 'dsh:csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
            injectTo: 'head-prepend',
          },
        ],
      }
    },
  }
}

// base: './' —— 产物使用相对路径，可直接丢到任意子目录 / GitHub Pages / 对象存储，
// 也可用 `npm run preview` 或任意静态服务器直接预览，无需额外配置。
export default defineConfig({
  base: './',
  plugins: [react(), cspMetaPlugin()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 站点体量很小，直接内联 4KB 以下资源，减少请求数
    assetsInlineLimit: 4096,
    sourcemap: false,
  },
})
