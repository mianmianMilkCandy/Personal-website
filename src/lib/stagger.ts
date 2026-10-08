/**
 * 阶梯延迟：同组元素依次入场。
 *
 * 必须封顶：第 12 个元素若按 70ms 递增就要等 840ms 才出现，
 * 用户早就滚过去了 —— 看起来像卡住而不是像动画。
 */
export function stagger(index: number, step = 70, max = 420): number {
  return Math.min(index * step, max)
}
