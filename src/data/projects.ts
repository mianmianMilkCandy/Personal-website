/* ============================================================================
   精选项目数据
   ----------------------------------------------------------------------------
   01 号项目 `clean` 的内容来自对 github.com/mianmianMilkCandy/clean 仓库的实际
   阅读（README + 源码结构 + 打包脚本），属于**真实信息**。
   02 / 03 是结构完整的占位卡片（placeholder: true），UI 上会打上占位标签，
   等你给真实项目内容后替换。
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
  /** true = 内容未填充，UI 显示占位标签 */
  placeholder?: boolean
}

export const projects: Project[] = [
  {
    index: '01',
    name: 'C 盘清理工具',
    nameEn: 'clean',
    period: '2025',
    role: '独立开发 · 架构 / 前端 / 后端 / 打包发布',
    summary:
      '约 20 MB 的 Windows 桌面清理工具：安全扫描并清理系统缓存、浏览器缓存与微信 / QQ 聊天缓存。',
    detail: [
      '用 Python + pywebview 把 Web 前端装进原生窗口，复用 Web 技术栈做桌面 UI，同时保持单文件分发能力。',
      '前端基于 Lit + @material/web 实现 Material 3 界面，并用 material-color-utilities 做动态取色，主题随壁纸走。',
      'PyInstaller 打成单文件 exe，目标机器无需安装 Python；WebView2 作为系统共享组件复用，不重复打包运行时。',
      '安装脚本内置多镜像容错（jsdelivr / ghfast / raw.githubusercontent），先并发测速再择优下载，校验失败自动换源。',
      '卸载脚本保证幂等：停止进程 → 删安装目录 → 清理用户 PATH → 删除开始菜单快捷方式，重复执行无副作用。',
      '文档与 README 提供简体中文 / English / 日本語 三语版本，降低非中文用户的上手门槛。',
    ],
    stack: ['Python', 'pywebview', 'Lit', 'Material 3', 'TypeScript', 'Vite', 'PyInstaller', 'PowerShell'],
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
    name: '项目名称待填',
    nameEn: 'PROJECT TWO',
    period: '20XX',
    role: '你的角色待填',
    summary:
      '一句话说清这个项目解决什么问题、给谁用、你做出了什么关键判断。占位文案只用于验证排版。',
    detail: [
      '第一条：背景与约束 —— 为什么要做它，当时的技术或业务限制是什么。',
      '第二条：你的关键动作 —— 你主导了哪个决策，为什么这样选，替代方案是什么。',
      '第三条：可验证的结果 —— 性能、稳定性、成本、用户量，任意一个带数字的结论。',
    ],
    stack: ['技术栈', '待填', '待填'],
    metrics: [{ label: '指标名', value: '数值' }],
    links: [],
    tone: ['#a78bfa', '#3b82f6'],
    art: 'card-02.webp',
    placeholder: true,
  },
  {
    index: '03',
    name: '项目名称待填',
    nameEn: 'PROJECT THREE',
    period: '20XX',
    role: '你的角色待填',
    summary:
      '同样是一句话概述。若暂时只有两个项目，把这张卡片删掉即可，版式不会塌。',
    detail: [
      '第一条：背景与约束。',
      '第二条：你的关键动作与取舍理由。',
      '第三条：可验证的结果。',
    ],
    stack: ['技术栈', '待填', '待填'],
    metrics: [{ label: '指标名', value: '数值' }],
    links: [],
    tone: ['#f0b27a', '#e05c5c'],
    art: 'card-03.webp',
    placeholder: true,
  },
]
