/* ============================================================================
   个人资料 · 唯一内容源
   ----------------------------------------------------------------------------
   本文件的全部内容来自用户的真实简历（云绵绵甜奶糖 · 个人简历），
   不是占位内容。要改简历只动这里，不用碰任何组件。

   仍然留白 / 待补的两项（都有自动回落机制，不填也能正常上线）：
     · 手机号 —— 按用户要求**不上站**（邮箱 + 微信 + GitHub 已够用）；
     · 简历 PDF —— resumeUrl 留空则按钮不出现。

   头像已就位：`public/media/portrait.jpg`（4:5，900×1125）。
   ========================================================================== */

/**
 * 尚未填充的字段清单 —— 仅开发模式展示，用于提醒替换占位内容。
 * 已清空：头像补上之后，开发模式左下角那条提示会自动消失
 * （App.tsx 里判的是 `UNFILLED.length > 0`）。
 */
export const UNFILLED: string[] = []

export type SocialLink = {
  /** 展示名，如 GitHub */
  label: string
  /** 展示值，如 github.com/xxx */
  value: string
  /** 可点击跳转地址；纯展示型留空 */
  href?: string
  /** 可一键复制的文本；与 href 二选一或并存 */
  copy?: string
}

export type TimelineItem = {
  /** 展示用的时间区间，如 "2023 — 至今" */
  period: string
  /** 组织 / 项目名 */
  org: string
  /** 角色 */
  role: string
  /** 一两句，聚焦"做了什么 + 结果" */
  detail: string
}

export type Capability = {
  /** 分组名，如 前端 */
  group: string
  /** 该组下的技术项 */
  items: string[]
}

export const profile = {
  /* ── 身份 ─────────────────────────────────────────────────────────── */
  name: '云绵绵甜奶糖',
  nameEn: 'MIANMIAN MILK CANDY',

  /** 汉字与英文混排时的副标题，出现在 Hero 大标题下方 */
  role: 'Python 后端 / AI 应用开发',
  roleEn: 'Python Backend · AI Application',

  /** Hero 的一句话主张：说清你解决什么问题，不要写"热爱编程" */
  tagline: '以 AI 协作开发驱动落地：从需求拆解、编码排错，到打包分发与安装运维，独立交付完整产品。',

  /** 首屏欢迎语。2026-10 起首屏标题只用一行「{name}的主页。」，
      这句"欢迎来到，"按用户要求删掉了 —— 那层意思挪到了首屏玻璃卡的
      WELCOME 标签上（Hero.tsx 里硬编码的那个英文标签）。
      数据留着：要恢复标题第一行就在 Hero.tsx 的 h1 里加回来。 */
  heroGreeting: '欢迎来到，',

  /** Hero 玻璃卡里的「专注」一栏 */
  focus: 'Python · RAG 知识库 · AI 协作开发',

  /** 合作状态。首屏玻璃卡目前不显示这一行（用户要求删掉）；
      数据留着：要放回卡片就恢复 Hero.tsx 里 `hero__card-status` 那段和 Hero.css 里对应的状态点样式。 */
  status: '求职中 · Python 后端 / AI 应用开发',
  statusTone: 'accent' as 'accent' | 'muted',
  location: '中国 · 广东',

  /* ── 联系方式 ─────────────────────────────────────────────────────── */
  email: '3909103136@qq.com',
  /** 手机号按用户要求不上站（简历里也没提供）。这一栏留着是为了
      About.tsx 能原样渲染「电话」那一行 —— 一旦填了值它就会自动出现。 */
  phone: '',

  /** 顺序即展示顺序（关于区与收尾页都按这个顺序渲染） */
  socials: [
    {
      label: 'GitHub',
      value: 'github.com/mianmianMilkCandy',
      href: 'https://github.com/mianmianMilkCandy',
      copy: 'github.com/mianmianMilkCandy',
    },
    {
      label: '微信',
      value: 'mianmianMilkcandy',
      copy: 'mianmianMilkcandy',
    },
  ] as SocialLink[],

  /** 简历 PDF 下载地址；把文件放到 public/ 下即可，如 './resume.pdf'。
      留空 → 关于区那个「下载简历 PDF」按钮不渲染。 */
  resumeUrl: '',

  /* ── 关于 ─────────────────────────────────────────────────────────── */
  /** 2–3 段。第一段讲你现在做什么，第二段讲能力边界，第三段讲偏好与协作方式。 */
  bio: [
    'Python 后端开发者，具备 MySQL、Django 基础，能独立完成后端服务与数据处理逻辑的开发。目前是全日制本科在读的应届毕业生，求职方向是 Python 后端开发与 AI 应用开发。',
    '最突出的优势是「AI 协作开发 + 本地知识库搭建」：熟练用 AI 编程助手做需求拆解、技术选型、代码生成与排错调试，并擅长基于向量数据库搭建本地知识库（RAG）。做法不是复制 AI 生成的代码，而是把需求讲清楚、把生成结果审下来、把问题定位到根因 —— 也因此能在较短时间内跨过陌生技术栈，独立交付完整产品。',
    '对不熟悉的领域，我靠「AI 协作 + 知识库」扎实补齐，而不是停在 demo：项目都走完了从需求分析、编码、测试到打包（PyInstaller）、一键安装分发、卸载运维的完整闭环，并且全部在 GitHub 开源，可以逐行看。',
  ],

  /** 头像：换成 public/media/portrait.jpg 后自动生效，无需改代码 */
  portrait: './media/portrait.jpg',
  /** 没有照片时展示的占位字（取名字里的一个字，比 "ME" 更像本人在场） */
  portraitFallback: '云',

  /* ── 经历时间线 ───────────────────────────────────────────────────── */
  timeline: [
    {
      period: '2025 — 至今',
      org: 'C 盘清理工具（clean）',
      role: '独立开发 · 架构 / 后端 / 前端 / 打包发布',
      detail:
        '主导 Python 内嵌 HTTP 服务与垃圾扫描 / 清理引擎，覆盖系统、Chrome / Edge / Firefox、微信、QQ 四类缓存的路径自适应扫描；用 pywebview + Edge WebView2 做桌面壳，PyInstaller 打成约 20 MB 单文件 exe。',
    },
    {
      period: '2025 — 至今',
      org: 'DeepCognitiveAgent · AI 学习与推理项目集',
      role: '独立开发（AI 协作完成）',
      detail:
        '5 个 Python 模块：基于 ChromaDB + OpenAI API 的深度记忆聊天机器人（RAG / 事实核查 / 记忆去重）、多引擎异步搜索爬虫（Bing / Brave / DuckDuckGo / Wikipedia 并发与故障转移）、通用推理引擎（DFS / BFS / A* / MCTS）、纯标准库神经网络与自我反思心智模型。',
    },
    {
      period: '2026',
      org: '计算机软件著作权 · 2 项',
      role: '著作权人（原始取得 · 全部权利）',
      detail:
        '《社区地慧眼地震风险感知与避险引导软件》V1.0（登记号 2026SR0354008，软著登字第 17568289 号）；《明眸全域施工安全监测系统》V1.0（登记号 2026SR0448309，软著登字第 17662590 号）。',
    },
    {
      period: '在读',
      org: '全日制本科',
      role: '在读应届毕业生 · 中国 · 广东',
      detail:
        '在校期间以自学 + AI 协作为主推进技术栈（Python 后端、数据库、本地知识库），并独立完成上述软著与开源项目。',
    },
  ] as TimelineItem[],

  /* ── 技能矩阵 ─────────────────────────────────────────────────────── */
  /** 建议 4 组、每组 4–7 项，只写"能上手交付"的，不要罗列听过的东西。 */
  capabilities: [
    {
      group: 'Python 后端',
      items: ['Python', 'Django', 'MySQL', 'REST / 内嵌 HTTP 服务', '多线程 / 异步编程'],
    },
    {
      group: 'AI 应用开发',
      items: [
        'AI 协作开发',
        'Prompt 与需求拆解',
        '代码审查与排错',
        '技术选型调研',
        'OpenAI API',
      ],
    },
    {
      group: '本地知识库 / RAG',
      items: [
        'ChromaDB',
        'Embedding 与语义分块',
        '检索增强生成',
        'tiktoken',
        'python-dotenv',
      ],
    },
    {
      group: '数据与爬虫',
      items: ['aiohttp', 'BeautifulSoup4', 'trafilatura', 'SimHash 去重', 'Playwright'],
    },
    {
      group: '工程与交付',
      items: [
        'Git / GitHub',
        'Lit / TypeScript / Vite',
        'pywebview · Edge WebView2',
        'PyInstaller 单文件打包',
        'PowerShell 安装 / 卸载脚本',
      ],
    },
  ] as Capability[],
}

export type Profile = typeof profile
