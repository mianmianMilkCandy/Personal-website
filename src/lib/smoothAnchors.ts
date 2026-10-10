/* ============================================================================
   平滑锚点跳转（只给「点击站内锚点」这一种场景）
   ----------------------------------------------------------------------------
   为什么要有这个模块：`html { scroll-behavior: smooth }` 会作用在**所有**滚动
   上 —— 鼠标滚轮的每一格都被浏览器套成一段缓动追赶，页面立刻"像隔了一层棉花"，
   而且它会和 `lib/cube.ts` 打架：立方体的旋转角读的是 `window.scrollY`，
   被缓动拖住时角度跟不上指针，观感就是"滚了却没动/动得发飘"。

   所以全局那一条已经删掉，改成只有点击 `href="#xxx"` 时显式调用
   `scrollIntoView({ behavior: 'smooth' })`：
     · 滚轮 / 触控板 / 键盘 → 原生瞬时滚动（跟手，立方体角度逐帧对齐）；
     · 导航链接 / 首屏 CTA / 收尾「回到顶部」→ 仍然是平滑过渡。
   系统开了"减少动态效果"时连这一种也不做缓动，直接瞬时到位。

   实现是**文档级一个委托监听**（和 lib/clickShine.ts 同一套路），
   所以给新按钮加平滑锚点不用改任何组件。

   ⚠️ 唯一的例外是 `.skip-link`（"跳到主内容"）—— 理由见 onClick 里那段注释。
   ========================================================================== */

/** `#a%20b` 这类百分号编码要解回来；解不开（畸形编码会抛 URIError）就放弃接管，
 *  让浏览器用原生行为处理，绝不因为一个坏链接把点击整条打死。 */
function decodeHash(hash: string): string {
  const raw = hash.slice(1)
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

/** 平滑滚动的时长上限由浏览器决定，这里只负责挑出"该平滑的那一次点击"。 */
export function initSmoothAnchors(): () => void {
  const reduce = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const onClick = (event: MouseEvent) => {
    // 只处理不带修饰键的左键单击：中键新标签页、Ctrl/Cmd 新窗口等一律放行
    if (event.defaultPrevented || event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    const target = event.target
    if (!(target instanceof Element)) return
    const anchor = target.closest('a[href^="#"]')
    if (!(anchor instanceof HTMLAnchorElement)) return
    if (anchor.target && anchor.target !== '_self') return

    /* 跳转链接**不接管**：它的契约不是"平滑滚过去"，而是"把键盘焦点送进主内容"。
       顺序焦点起点只有**原生锚点跳转**会挪动；一旦 preventDefault，焦点还留在
       链接自己身上 —— 此时按 Tab 会落到紧随其后的导航链接上，这个控件对键盘
       用户等于完全没生效（WCAG 2.4.1 要的就是"能绕过重复内容"）。
       放行给浏览器：它只做一次瞬时跳转（本站本来也没有全局 scroll-behavior），
       换来的是一条真正可用的绕过路径。 */
    if (anchor.classList.contains('skip-link')) return

    const id = decodeHash(anchor.hash)
    if (!id) return
    const destination = document.getElementById(id)
    if (!destination) return

    event.preventDefault()
    destination.scrollIntoView({
      behavior: reduce() ? 'auto' : 'smooth',
      block: 'start',
    })
    /* 把锚点写进地址栏：原生锚点跳转本来就会做这件事，拦下默认行为之后
       得自己补上，否则刷新/分享链接会丢掉位置。replaceState 不新增历史记录，
       与"点了一下锚点"的语义一致。 */
    history.replaceState(null, '', `#${id}`)
  }

  document.addEventListener('click', onClick)
  return () => document.removeEventListener('click', onClick)
}
