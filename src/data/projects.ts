/* ============================================================================
   精选项目数据
   ----------------------------------------------------------------------------
   两张卡片都是**真实信息**，来源：对 github.com/mianmianMilkCandy 两个仓库的
   实际阅读（README + 源码结构 + 打包脚本）与作者本人的项目分析文档。

   原第三张卡（PROJECT THREE）是结构完整的占位卡片，按作者要求**已删除** ——
   只有两个真实项目时留着一张"待填"卡反而是负分。
   再加项目：往下面的数组里 push 一条，并在 `src/App.tsx` 的 FACES 里补一个
   `<Projects part="…" />` 面即可（面的数量是动态的，见 Cube.tsx）。
   ========================================================================== */

export type ProjectLink = { label: string; href: string }

export type ProjectMetric = { label: string; value: string }

export type Project = {
  /** 卡片左上角的序号，如 "01" */
  index: string
  name: string
  nameEn: string
  period: string
  /** 你的角色。写清"独立完成"还是"负责某模块"，这是可信度关键 */
  role: string
  /** 一句话概述，用于卡片首屏 */
  summary: string
  /** 3–5 条要点：做了什么 + 难在哪 + 结果。避免堆技术名词 */
  detail: string[]
  stack: string[]
  metrics?: ProjectMetric[]
  links?: ProjectLink[]
  /** 卡片视觉基调：两个色相用于生成极低饱和的网格光晕 */
  tone: [string, string]
  /** 卡片视觉带用的画作裁切件（public/media 下的文件名）；缺省则只用 CSS 生成 */
  art?: string
}

export const projects: Project[] = [
  {
    index: '01',
    name: 'C 盘清理工具',
    nameEn: 'clean',
    period: '2025 — 2026',
    role: '独立开发 · 后端引擎 / 前端 / 打包发布',
    summary:
      '约 20 MB 的 Windows 桌面清理工具：安全扫描并清理系统缓存、浏览器缓存与微信 / QQ 聊天缓存。',
    detail: [
      '主导 Python 内嵌 HTTP 服务与垃圾扫描 / 清理引擎，后台线程执行并逐目录上报实时进度，四类缓存（系统 / 浏览器 / 微信 / QQ）的路径全部自适应识别。',
      '三重安全防护：受保护目录黑名单（System32、Program Files 等绝不触碰）、单个文件删除失败自动跳过不中断整体流程、删除微信 / QQ 文件前弹警示。',
      '用 Python + pywebview 把 Web 前端装进原生窗口，复用 Web 技术栈做桌面 UI，同时保持单文件分发能力；前端基于 Lit + @material/web 实现 Material 3 界面。',
      'PyInstaller 打成单文件 exe，目标机器无需安装 Python；WebView2 作为系统共享组件复用，不重复打包运行时。',
      '安装脚本内置多镜像容错（jsDelivr / ghfast / raw.githubusercontent），先并发测速再择优下载，SHA-256 校验失败自动换源；卸载脚本幂等可重复执行。',
      '简体中文 / English / 日本語 三语使用手册，降低非中文用户的上手门槛。',
    ],
    stack: ['Python', 'pywebview', 'Edge WebView2', 'Lit 3', 'TypeScript', 'Material 3', 'Vite', 'PyInstaller', 'PowerShell'],
    metrics: [
      { label: '分发包体', value: '≈ 20 MB' },
      { label: '文档语言', value: '3 种' },
      { label: '下载镜像', value: '3 源容错' },
    ],
    links: [
      { label: 'GitHub 仓库', href: 'https://github.com/mianmianMilkCandy/clean' },
      { label: 'Releases', href: 'https://github.com/mianmianMilkCandy/clean/releases' },
    ],
    tone: ['#62e0d0', '#3b82f6'],
    art: 'card-01.webp',
  },
  {
    index: '02',
    name: 'AI 学习与推理项目集',
    nameEn: 'DeepCognitiveAgent',
    period: '2025 — 2026',
    role: '独立开发（AI 协作完成）',
    summary:
      '两大方向、5 个 Python 模块：上层用大模型 API + 向量数据库做生产级对话与搜索，底层算法零第三方依赖从零实现。',
    detail: [
      'MemoryChatbot（深度记忆聊天机器人）：ChromaDB 持久化向量库 + OpenAI API，实现文档学习、检索增强对话（RAG）、LLM 事实核查、记忆去重与冲突替换、知识导入导出 —— 本地知识库能力的直接落地。',
      'WebSearchCrawler（联网搜索爬虫）：Bing / Brave / DuckDuckGo / Wikipedia 多引擎并发与顺序故障转移，aiohttp 异步抓取 + 信号量限流与重试，SimHash（海明距离 ≤ 3）去重，按「语义相似度 0.7 : 来源权威性 0.3」加权排序。',
      'DeepReasoner（通用推理引擎）：以 Problem / ThoughtNode 抽象问题框架，支持 DFS / BFS / A* / MCTS 四种搜索策略，内置汉诺塔、狼羊白菜过河、24 点三个示例。',
      'SelfLearningNet + ReflectiveMind（底层算法）：零第三方依赖手写矩阵运算、前向 / 反向传播与 MC Dropout 不确定性估计；三元组知识库实现数值推理、传递推理、反向矛盾检测与元认知复盘。',
      '工程约束：底层算法模块只用 Python 标准库，便于逐行读原理；上层模块的向量库、异步爬虫、动态渲染（Playwright 兜底）都通过 AI 协作编码 + 联合调试完成。',
    ],
    stack: ['Python', 'ChromaDB', 'OpenAI API', 'aiohttp', 'trafilatura', 'sentence-transformers', 'Playwright', 'asyncio'],
    metrics: [
      { label: '核心模块', value: '5 个' },
      { label: '搜索策略', value: '4 种' },
      { label: '底层依赖', value: '仅标准库' },
    ],
    links: [
      {
        label: 'GitHub 仓库',
        href: 'https://github.com/mianmianMilkCandy/DeepCognitiveAgent',
      },
    ],
    tone: ['#a78bfa', '#3b82f6'],
    art: 'card-02.webp',
  },
]
