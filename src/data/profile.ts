/* ============================================================================
   个人资料 · 唯一内容源
   ----------------------------------------------------------------------------
   ⚠️ 重要：工作区里的 `个人简介.txt` 是 0 字节（空文件），因此下面所有个人信息
   均为**占位占位符**，不是真实资料。请把每一项替换成你的真实信息。

   替换完一项，就把 UNFILLED 里对应的那行删掉；UNFILLED 清空后，
   开发模式下左下角的"占位内容"提示条会自动消失。
   ========================================================================== */

/** 尚未填充的字段清单 —— 仅开发模式展示，用于提醒替换占位内容。 */
export const UNFILLED: string[] = [
  '姓名 / 英文名（profile.name、profile.nameEn）',
  '职位与一句话定位（profile.tagline）',
  'Hero 大标题与专注领域（profile.heroGreeting、profile.focus）',
  '所在城市（profile.location）',
  '邮箱（profile.email）',
  '手机号（profile.phone）',
  'GitHub 与其它链接（profile.socials）',
  '个人简介正文（profile.bio）',
  '工作/项目经历时间线（profile.timeline）',
  '技能矩阵取值（profile.capabilities）',
  '头像照片（把图片放到 public/media/portrait.jpg）',
  '精选项目 2 / 3 的真实内容（src/data/projects.ts）',
]

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
  name: '你的名字',
  nameEn: 'YOUR NAME',

  /** 汉字与英文混排时的副标题，出现在 Hero 大标题下方 */
  role: '全栈开发工程师',
  roleEn: 'Full-Stack Engineer',

  /** Hero 的一句话主张：说清你解决什么问题，不要写"热爱编程" */
  tagline: '从数据库到像素，把想法做成能上线的产品。',

  /** Hero 大标题第一行；第二行固定渲染成「{name}的主页。」 */
  heroGreeting: '欢迎来到，',

  /** Hero 玻璃卡里的「专注」一栏 */
  focus: 'Web · Full-Stack · AI',

  /** Hero 右侧规格表：状态点会取 statusTone 的颜色 */
  status: '开放合作机会',
  statusTone: 'accent' as 'accent' | 'muted',
  location: '中国 · 城市待填',

  /* ── 联系方式 ─────────────────────────────────────────────────────── */
  email: 'you@example.com',
  phone: '+86 000 0000 0000',

  socials: [
    { label: 'GitHub', value: 'github.com/yourname', href: 'https://github.com/yourname' },
    { label: '微信', value: 'your-wechat-id', copy: 'your-wechat-id' },
    { label: '掘金 / 博客', value: 'blog.example.com', href: 'https://blog.example.com' },
  ] as SocialLink[],

  /** 简历 PDF 下载地址；把文件放到 public/ 下即可，如 './resume.pdf' */
  resumeUrl: '',

  /* ── 关于 ─────────────────────────────────────────────────────────── */
  /** 2–3 段。第一段讲你现在做什么，第二段讲能力边界，第三段讲偏好与协作方式。 */
  bio: [
    '这里应该是一段真实的自我介绍：你现在在做什么、擅长解决哪类问题、最近在打磨什么。占位文字先撑住版面节奏，方便你先看排版效果。',
    '第二段建议写能力边界：你独立负责过什么规模的事，前后端各自到什么深度，哪些是你敢接、哪些是你还在补的。写清楚边界比堆形容词更可信。',
    '第三段写协作与偏好：你怎么沟通、怎么拆任务、代码和文档的习惯。招聘方真正想知道的是"和你一起做事是什么体验"。',
  ],

  /** 头像：换成 public/media/portrait.jpg 后自动生效，无需改代码 */
  portrait: './media/portrait.jpg',
  /** 没有照片时展示的占位字母 */
  portraitFallback: 'ME',

  /* ── 经历时间线 ───────────────────────────────────────────────────── */
  timeline: [
    {
      period: '2024 — 至今',
      org: '公司 / 团队名称',
      role: '全栈开发工程师',
      detail: '负责的业务与系统、你主导的技术决策、可量化的结果（性能提升、成本下降、交付周期）。',
    },
    {
      period: '2022 — 2024',
      org: '公司 / 团队名称',
      role: '开发工程师',
      detail: '这一段的主要职责与产出。建议每条都带一个数字或一个具体系统名。',
    },
    {
      period: '2021 — 2022',
      org: '学校 / 机构名称',
      role: '学历 / 培训',
      detail: '专业方向，以及与目标岗位相关的课程、竞赛或毕业设计。',
    },
  ] as TimelineItem[],

  /* ── 技能矩阵 ─────────────────────────────────────────────────────── */
  /** 建议 4 组、每组 4–7 项，只写"能上手交付"的，不要罗列听过的东西。 */
  capabilities: [
    { group: '前端', items: ['React', 'TypeScript', 'Vite', 'Lit / Web Components', 'CSS 架构', 'Material 3'] },
    { group: '后端', items: ['Python', 'Node.js', 'REST API', 'SQL', '并发与异步'] },
    { group: '工程化', items: ['Git', 'PyInstaller', 'PowerShell 脚本', 'CI/CD', '性能剖析'] },
    { group: '桌面 / 客户端', items: ['pywebview', 'WebView2', '本地服务与 IPC'] },
  ] as Capability[],
}

export type Profile = typeof profile
