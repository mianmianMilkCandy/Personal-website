/* ============================================================================
   全站共用的单一 IntersectionObserver
   ----------------------------------------------------------------------------
   每个 .reveal 元素各建一个 observer 会在长页面上白白产生几十个观察器。
   这里用模块级单例：所有元素注册到同一个观察器，命中后立刻 unobserve，
   不产生持续回调开销。
   ========================================================================== */

const REVEALED_CLASS = 'is-in'

let observer: IntersectionObserver | null = null

function getObserver(): IntersectionObserver {
  if (observer) return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add(REVEALED_CLASS)
        // 只播一次，命中即解绑
        observer?.unobserve(entry.target)
      }
    },
    {
      // 元素露出约 12% 时触发，比阈值 0 更"稳"，不会在边缘抖动
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.08,
    },
  )
  return observer
}

/** 开始观察；返回解绑函数（必须调用，否则重挂载会残留观察）。 */
export function observeReveal(el: Element): () => void {
  // 系统开启"减少动态效果"时不做动画，直接置为已显示状态
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.classList.add(REVEALED_CLASS)
    return () => {}
  }
  const obs = getObserver()
  obs.observe(el)
  return () => obs.unobserve(el)
}
