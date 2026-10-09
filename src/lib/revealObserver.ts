/* ============================================================================
   全站共用的单一 IntersectionObserver —— 只管"不在立方体里"的 .reveal
   ----------------------------------------------------------------------------
   每个 .reveal 元素各建一个 observer 会在长页面上白白产生几十个观察器。
   这里用模块级单例：所有元素注册到同一个观察器。

   **进出场各一次是可重复的**：进入视口 → 加 is-in（入场，带自己的阶梯延迟）；
   离开视口 → 摘掉 is-in、挂上 is-out（出场，更快且不排队，见 base.css 的
   .reveal.is-out）。于是同一个元素每次滚回来都会重播一次。

   立方体舞台里的元素不走这里 —— 它们由所在面（.cube__slot）的 data-state
   驱动，理由见 observeReveal 里的注释。
   ========================================================================== */

const IN_CLASS = 'is-in'
const OUT_CLASS = 'is-out'

/** 立方体舞台的面：面内内容的相位由 lib/cube.ts 写在这个属性上 */
const CUBE_SLOT = '.cube__slot'

let observer: IntersectionObserver | null = null

function getObserver(): IntersectionObserver {
  if (observer) return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target
        if (entry.isIntersecting) {
          el.classList.remove(OUT_CLASS)
          el.classList.add(IN_CLASS)
        } else {
          // 只在"已经进过场"之后才按出场处理：一直没露过面的元素本来就
          // 停在起始位姿上，不需要再挂一次出场状态。
          if (!el.classList.contains(IN_CLASS)) continue
          el.classList.remove(IN_CLASS)
          el.classList.add(OUT_CLASS)
        }
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
    el.classList.add(IN_CLASS)
    return () => {}
  }

  /* --------------------------------------------------------------------------
     立方体舞台里的元素交给面来管，不走观察器
     --------------------------------------------------------------------------
     舞台是 position: fixed 的，面只做 3D 变换、不在文档流里移动 —— 观察器会在
     首帧把**所有**面都判成"在视口里"，于是九个面的内容同时播入场。

     更要紧的是"可重复"：观察器看不见"这一面转走了"，而转走与转进是立方体
     自己的滚动几何，只有驱动知道。所以相位（进/出）由 lib/cube.ts 每帧推导，
     写到 .cube__slot[data-state] 上，CSS 侧见 Cube.css 的那一节。
     ------------------------------------------------------------------------ */
  if (el.closest(CUBE_SLOT)) return () => {}

  const obs = getObserver()
  obs.observe(el)

  /* --------------------------------------------------------------------------
     首屏已经在视口里的元素，不交给观察器判入场。
     --------------------------------------------------------------------------
     原因：rootMargin 的下边距 -12% 是给"滚动才播"设计的，它把视口最下沿
     那条带子排除在交叉区之外 —— 而首屏是不滚动的，落在那条带子里的元素
     （首屏最底边的 SCENE 小字、矮视口下的玻璃卡）会永远停在 opacity:0，
     看起来就像"控件没渲染出来"。

     首帧的布局还会变（字体替换、iframe 尺寸、图片撑开），所以连查几帧。
     这里是**唯一**需要主动量几何的地方，而且是每个元素各量一次、最多量
     3 帧，所以写成一次 getBoundingClientRect 读两个判据（原来分两次读，
     等于把首帧的强制布局翻倍）。

     ⚠️ 这里原先还挂着一个 `setTimeout(revealIfInView, 700)` 兜底 —— 那是
     一次"睡 700ms 再统一量一遍"的轮询：它要多付一次跨帧的强制布局，
     而它想兜住的场景（字体/图片把元素挤进视口）已经由 IntersectionObserver
     自己的回调覆盖（观察器只在"相交状态发生变化"时回调，无论那次变化是滚动
     引起的还是布局引起的）。已删除。 */
  let frames = 3
  const revealIfInView = () => {
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.remove(OUT_CLASS)
      el.classList.add(IN_CLASS)
      return
    }
    if (--frames > 0) requestAnimationFrame(revealIfInView)
  }
  requestAnimationFrame(revealIfInView)

  return () => {
    obs.unobserve(el)
  }
}
