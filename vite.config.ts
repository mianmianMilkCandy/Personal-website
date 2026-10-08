import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' —— 产物使用相对路径，可直接丢到任意子目录 / GitHub Pages / 对象存储，
// 也可用 `npm run preview` 或任意静态服务器直接预览，无需额外配置。
export default defineConfig({
  base: './',
  plugins: [react()],
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
