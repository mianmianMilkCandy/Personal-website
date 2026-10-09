import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './styles/tokens.css'
import './styles/base.css'
import App from './App'
import { initPerfProbe } from './lib/perfProbe'

/* 真机性能探针：只在地址里带 ?perf=1 时启用（零渲染影响，见 lib/perfProbe.ts）。
   不带这个参数时连 rAF 都不注册 —— 本站纪律：不得引入常驻循环。 */
if (new URLSearchParams(window.location.search).get('perf') === '1') {
  initPerfProbe()
}

const container = document.getElementById('root')
if (!container) throw new Error('找不到挂载节点 #root')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
