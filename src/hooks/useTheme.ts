/**
 * 主题：**只有一套**（晴空白昼）。
 *
 * 原先这里是 dusk / day 两套 + 一个外部状态订阅（useSyncExternalStore）+
 * 开关。2026-10 背景换成整幅晴空画之后，黄昏那套深靛蓝令牌会把高饱和的
 * 蓝天洗成灰紫 —— "换背景"和"保留暗色主题"这一版里是互斥的，于是：
 *   · 令牌层只剩 :root 一套（见 styles/tokens.css）；
 *   · 开关从导航里撤掉，那个位置改成"列车状态"读数（与新的背景动效同源）；
 *   · localStorage 里的旧值不再被读 —— 用户上次存的 'dusk' 不会再把页面
 *     变回深色（这一段保留在这里，是为了说清"为什么不必再存主题"）。
 *
 * 仍然保留模块级副作用：把 data-theme 与 theme-color 写上去。index.html 的
 * 内联脚本也会写一份（那一段负责"样式生效前就定下来"，防首屏闪色），
 * 这里负责补齐 meta。
 */

export type Theme = 'day'

export const THEME: Theme = 'day'
/** 场景读数用的中文标签（导航与首屏 SCENE 行共用）。 */
export const THEME_LABEL: Record<Theme, string> = { day: '晴空' }
/** 与背景天光同色系的浏览器 UI 配色（地址栏 / 状态栏）。 */
const THEME_COLOR = '#8fc3e6'

function applyTheme() {
  document.documentElement.dataset.theme = THEME
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLOR)
}

applyTheme()

/** 供无 React 的场合读取当前值。 */
export function getTheme(): Theme {
  return THEME
}

export function useTheme(): Theme {
  return THEME
}
