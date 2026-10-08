import { useLocalTime } from '../hooks/useLocalTime'

/**
 * 秒级时钟的**叶子节点**。
 *
 * 为什么必须单独拆成一个组件：
 * 时钟每秒 setState 一次。这个 state 原先长在 Hero 上，于是整棵首屏子树
 * （标题 / 标语 / 动作行 / 玻璃卡 / SCENE 行，40+ 个元素与图标 SVG）
 * 会被 React **每秒重渲染一次，而且是永远每秒一次** —— 与用户是否交互无关。
 * 把 state 收进这一个文本节点里，每秒的开销就只剩下这一个节点。
 *
 * 刻意渲染成**裸文本节点**（不包 <span>）：与拆分前的 DOM 结构逐字一致，
 * 因此排版、字距、等宽数字全部不变。
 */
export default function LocalClock() {
  return useLocalTime()
}
