/* ============================================================================
   全站共用的单一 IntersectionObserver
   ----------------------------------------------------------------------------
   每个 .reveal 元素各建一个 observer 会在长页面上白白产生几十个观察器。
   这里用模块级单例：所有元素注册到同一个观察器，命中后立刻 unobserve，
   不产生持续回调开销。

   除了观察器，observeReveal 还会自查一次"这个元素是不是本来就在首屏里" ——
   观察器的 rootMargin 排除了视口下沿 12%，不滚动的那部分内容会永远等不到
   交叉事件。细节见 observeReveal 里的注释。
   ========================================================================== */

const REVEALED_CLASS = 'is-in'

let observer: IntersectionObserver | null = null

/* ----------------------------------------------------------------------------
   立方体舞台里的元素不走观察器
   ----------------------------------------------------------------------------
   舞台是 position: fixed 的，面只做 3D 变换、不在文档流里移动 ——
   观察器会在首帧把**所有**面都判成"在视口里"，于是九个面的入场动画同时播。
   所以：面里的元素改成登记到该面的队列，由立方体驱动在"这一面进场时"揭示。
   ========================================================================== */

const cubeQueues = new WeakMap<Element, Set<Element>>()

/** 由立方体驱动调用：把某个面里登记过的元素一次性揭示。 */
export function revealCubeFace(slot: Element): void {
  const queue = cubeQueues.get(slot)
  if (!queue) return
  for (const el of queue) el.classList.add(REVEALED_CLASS)
  queue.clear()
}

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

  // 在立方体舞台里：登记到所属面的队列，等驱动把这一面转进来时再揭示
  const slot = el.closest('.cube__slot')
  if (slot) {
    let queue = cubeQueues.get(slot)
    if (!queue) {
      queue = new Set()
      cubeQueues.set(slot, queue)
    }
    queue.add(el)
    return () => {
      queue?.delete(el)
    }
  }

  const obs = getObserver()
  obs.observe(el)

  // 首屏已经在视口里的元素，不交给观察器判入场。
  // 原因：rootMargin 的下边距 -12% 是给"滚动才播"设计的，它把视口最下沿
  // 那条带子排除在交叉区之外 —— 而首屏是不滚动的，落在那条带子里的元素
  // （首屏最底边的 SCENE 小字、矮视口下的玻璃卡）会永远停在 opacity:0，
  // 看起来就像"控件没渲染出来"。
  //
  // 首帧的布局还会变（字体替换、iframe 尺寸、图片撑开），所以连查几帧，
  // 再补一次定时复查；命中任意一次就播入场，阶梯延迟照旧生效。
  let frames = 3
  const revealIfInView = () => {
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add(REVEALED_CLASS)
      return
    }
    if (--frames > 0) requestAnimationFrame(revealIfInView)
  }
  requestAnimationFrame(revealIfInView)
  const retry = window.setTimeout(revealIfInView, 700)

  return () => {
    window.clearTimeout(retry)
    obs.unobserve(el)
  }
}
