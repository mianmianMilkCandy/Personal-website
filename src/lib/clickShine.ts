/**
 * 点击光影：给所有 `.pill` / `.btn` 补一层"从点击处散开的光"。
 *
 * 为什么用事件委托，而不是在每个组件里加 onClick：
 * 全站按钮散在 Hero / Nav / Projects / Closing / About 五个组件里，逐个加会把
 * "装饰效果"混进业务回调；而这条效果有两条硬要求 ——
 *   ① 要知道点击落在按钮的哪个位置（光从那儿散开）；
 *   ② 连点同一个按钮必须能重播。
 * 集中在文档级一个监听器里更好维护，也不用改任何组件的签名。
 *
 * 实现：加 `.is-shine` 类 → CSS 动画（base.css 的 clickShine）→ 动画结束由
 * `animationend` 自动摘类。不引入 setTimeout，所以快速连点、组件卸载都不会留下
 * 悬空回调。`prefers-reduced-motion` 下全局规则把动画压到 0.001ms，
 * 等于这条光影自动静音（类照旧会被摘掉，不会残留）。
 */

const SHINE_CLASS = 'is-shine'
const SELECTOR = '.pill, .btn'

function play(el: Element, xRatio: number, yRatio: number) {
  const node = el as HTMLElement
  node.style.setProperty('--fx', `${(xRatio * 100).toFixed(2)}%`)
  node.style.setProperty('--fy', `${(yRatio * 100).toFixed(2)}%`)

  // 先摘类再读一次布局：不读的话浏览器会把"摘了又加"合并成一次，连点不重播
  node.classList.remove(SHINE_CLASS)
  void node.offsetWidth
  node.classList.add(SHINE_CLASS)
}

/**
 * 挂上监听；返回解绑函数（组件卸载时必须调用）。
 */
export function initClickShine(): () => void {
  const onPointerDown = (event: PointerEvent) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const el = target.closest(SELECTOR)
    if (!el) return

    const rect = el.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    play(
      el,
      (event.clientX - rect.left) / rect.width,
      (event.clientY - rect.top) / rect.height,
    )
  }

  // 键盘激活（Enter / 空格）没有坐标，从中心发光。
  // click 事件的 detail === 0 就是"不是鼠标点出来的"。
  const onClick = (event: MouseEvent) => {
    if (event.detail !== 0) return
    const target = event.target
    if (!(target instanceof Element)) return
    const el = target.closest(SELECTOR)
    if (el) play(el, 0.5, 0.5)
  }

  const onAnimationEnd = (event: AnimationEvent) => {
    const target = event.target
    if (target instanceof Element && target.classList.contains(SHINE_CLASS)) {
      target.classList.remove(SHINE_CLASS)
    }
  }

  document.addEventListener('pointerdown', onPointerDown, { passive: true })
  document.addEventListener('click', onClick)
  document.addEventListener('animationend', onAnimationEnd)

  return () => {
    document.removeEventListener('pointerdown', onPointerDown)
    document.removeEventListener('click', onClick)
    document.removeEventListener('animationend', onAnimationEnd)
  }
}
