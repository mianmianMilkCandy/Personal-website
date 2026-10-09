/* ============================================================================
   立方体舞台驱动（滚动 → 旋转角）
   ----------------------------------------------------------------------------
   几何：面高 H = 舞台高 = 100svh，棱柱半径 r = H / 2，中轴落在**视口垂直中心**。

   中轴位置不是随手选的：只有它落在视口正中，相邻两面在任意角度下的投影才
   刚好铺满视口 —— θ=0 时正面恰好占满；θ=45° 时两面各覆盖一半、在中线相交；
   θ=90° 时下一面恰好占满。中轴偏一点，端点处就会露出背景（试算过：中轴放在
   30% 处时，θ=90° 会在视口底部留下 20% 的空洞）。

   任意时刻只有「当前面 k」和「下一面 k+1」被摆进 3D：
     面 k    rotateX(+e·90°)  translateZ(r)   → 绕中轴向上转出
     面 k+1  rotateX((e-1)·90°) translateZ(r) → 自下方转入正面
   其余面打 data-parked（visibility: hidden）：省合成，也顺带让它们退出
   焦点与读屏顺序。

   角度曲线：默认每步两端各留 15% 驻留（EASE_DWELL），90° 的转动压进中间
   70%。把 EASE_DWELL 改成 0 就是纯线性 —— 滚动 = 匀速旋转，任何时刻都在
   斜面上（观感最"立方体"，但几乎没有可读窗口）。
   ========================================================================== */

import { revealCubeFace } from './revealObserver'

/** 每步两端的驻留比例；0 = 纯线性。 */
const EASE_DWELL = 0.15

/** 假光照上限的兜底值（正本是 tokens.css 的 --cube-shade-max）。 */
const SHADE_FALLBACK = 0.22

export type CubeOptions = {
  stage: HTMLElement
  slots: HTMLElement[]
}

/** 把一步内的进度 f∈[0,1] 映射成角度进度：两端驻留、中间 smoothstep。 */
function easeStep(f: number): number {
  const a = EASE_DWELL
  if (f <= a) return 0
  if (f >= 1 - a) return 1
  const t = (f - a) / (1 - 2 * a)
  return t * t * (3 - 2 * t)
}

export function initCube({ stage, slots }: CubeOptions): () => void {
  const n = slots.length
  if (n < 2) return () => {}

  let frame = 0
  let h = stage.clientHeight || window.innerHeight
  let shadeMax = readShadeMax()
  let persp = readPerspective()
  let reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const revealed = new Set<number>()

  function readShadeMax(): number {
    const raw = getComputedStyle(stage).getPropertyValue('--cube-shade-max').trim()
    const value = Number.parseFloat(raw)
    return Number.isFinite(value) ? value : SHADE_FALLBACK
  }

  /** 透视距离（px，正本是 tokens.css 的 --cube-perspective）。 */
  function readPerspective(): number {
    const value = Number.parseFloat(getComputedStyle(stage).perspective)
    return Number.isFinite(value) && value > 0 ? value : 1600
  }

  /**
   * 这一面是否正对镜头。
   *
   * 相机在棱柱**轴上**（即视口中心），所以背对镜头的面会被"从内侧"看到 ——
   * 也就是以镜像出现的正文（实测：静止时 about-contact 面是 626/118 的一条
   * 镜像带子）。物理上不该看见，所以直接停用。
   *
   * 判据与浏览器的 backface 判定同源：法线与"指向相机"的夹角。
   * 推导：法线 n=(0,−sinθ,cosθ)，面心到相机 c=(0, r·sinθ, d−r·cosθ+r)，
   * n·c = cosθ·(d+r) − r > 0 ⟺ cosθ > r/(d+r)。
   * 1600 透视 + 372 半径 → 阈值 79.1°，也就是每步的前后各约 12% 不画。
   */
  function isFrontFacing(t: number): boolean {
    const r = h / 2
    return Math.cos((t * Math.PI) / 2) > r / (persp + r)
  }

  /** t ∈ [-1, 1]：0 = 正对镜头，±1 = 与镜头成 90°（侧棱位置）。 */
  function place(i: number, t: number): void {
    if (!isFrontFacing(t)) {
      park(i)
      return
    }
    const slot = slots[i]
    const r = h / 2
    slot.removeAttribute('data-parked')
    // 开头那个 translateZ(-r) 是**必须的补偿**：面的中心本来落在 translateZ(r)
    // 上，透视会把正对镜头的面放大 d/(d-r) 倍（1600 透视 + 372 半径 ≈ 1.30×），
    // 于是静止状态的内容被裁掉两边。整体先退回 r 之后，正面恰好在 z=0 平面上：
    // 实测平放时 rotateX(0deg)、rect=0/744，与分页前的观感 1:1 一致；
    // 而 θ=45° 时两面仍然各自越出视口、无缝铺满。
    slot.style.transform =
      `translateZ(${-r}px) rotateX(${t * 90}deg) translateZ(${r}px)`
    // 假光照：正对镜头 0，转到 90° 时到上限。两面在 e=0.5 时同亮度——
    // 这是凸棱在正面受光下的必然结果，也是"体积感"的来源。
    const shade = shadeMax * (1 - Math.cos((Math.abs(t) * Math.PI) / 2))
    slot.style.setProperty('--shade', shade.toFixed(4))
    if (!revealed.has(i)) {
      revealed.add(i)
      revealCubeFace(slot)
    }
  }

  function park(i: number): void {
    const slot = slots[i]
    if (slot.hasAttribute('data-parked')) return
    slot.setAttribute('data-parked', '')
    slot.style.transform = ''
    slot.style.setProperty('--shade', '0')
  }

  function update(): void {
    frame = 0
    const p = Math.min(n - 1, Math.max(0, window.scrollY / h))
    const k = Math.min(n - 2, Math.floor(p))
    const f = p - k
    // 减少动态效果时不做连续旋转，直接吸附到最近的正面
    const e = reduce ? (f < 0.5 ? 0 : 1) : easeStep(f)

    place(k, e)
    place(k + 1, e - 1)
    for (let i = 0; i < n; i++) {
      if (i !== k && i !== k + 1) park(i)
    }
  }

  function schedule(): void {
    if (!frame) frame = requestAnimationFrame(update)
  }

  function onResize(): void {
    h = stage.clientHeight || window.innerHeight
    shadeMax = readShadeMax()
    persp = readPerspective()
    schedule()
  }

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  function onMotionChange(): void {
    reduce = motionQuery.matches
    schedule()
  }

  // 首帧必须在绘制前落位：否则九个面会先同时可见、闪一下
  update()

  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', onResize)
  motionQuery.addEventListener('change', onMotionChange)

  return () => {
    if (frame) cancelAnimationFrame(frame)
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', onResize)
    motionQuery.removeEventListener('change', onMotionChange)
  }
}
