import { useEffect, useRef, type CSSProperties } from 'react'

import { assetUrl } from '../lib/asset'
import './SkyStage.css'

/**
 * 连续背景层：一整幅「积雨云 + 地平线 + 镜面水」，外加一列在上面跑的火车。
 *
 * 为什么是**一个固定的整页层**而不是每个面各配一张画：
 * 需求是"每一页的背景是同一张图、连续的"。九个面在立方体舞台里是 3D 侧壁，
 * 各自配画的话翻面时画面会跟着面一起转走 —— 那正是"每页一张图"的观感。
 * 放在面**之后**的固定层上，翻面时背景纹丝不动、只有内容在换，才是连续的。
 *
 * 图层自下而上（都在 .sky 这一个 pointer-events: none 的固定层里）：
 *   .sky__base   底图（无列车）—— 静止，镜面水里的天光一个像素不动
 *   .sky__drift  同一张底图、只露出地平线以上，缓慢横向呼吸 → 云在飘
 *   .sky__train  列车 + 它的水面倒影，沿量出来的钢轨**从右往左**开
 *   .sky__haze   一层很淡的天光，把画面统一到"晴天的空气"里
 *
 * ── 列车怎么"压在轨道上"（2026-10 第三轮修正）
 * 底图里的钢轨**不是水平的**：它从画面左边的 61.8%（底图高度百分比）一路抬到
 * 右边的 59.0%，跨度 2.8%。拿一个固定的 y 去压，必然一端悬空 —— 这就是"列车
 * 看着不在轨道上"的根因。
 *
 * 现在有三个量，全部由「列车中心的横坐标 xc」驱动：
 *
 *   y(xc)  = contact(xc) − ORIGIN_Y   把精灵的**车轮着地行**（= 缩放原点 = 车轮
 *                                     压在轨面上的那一行）顶到钢轨上 → 车轮永远
 *                                     踩在轨面上
 *   k(xc)  = (contact(xc) − Y_EYE)/(contact(0) − Y_EYE)   由远及近的缩放（0.34~1）
 *   o(xc)  = 0.88 + 0.12·k            远处的车被空气洗淡一点（大气透视）
 *
 * k 的式子不是拍脑袋：单点透视下地面点成像在 y = y_eye + f·h/d，而物体的
 * 成像尺寸 ∝ 1/d。两者合起来就是 **尺寸 ∝ (y − y_eye)** —— 所以"离视平线越远
 * 的越大"是投影的必然结果，而不是美术偏好。Y_EYE 取 57.70%，它同时满足：
 * 严格高于钢轨最远端（59.02%），且落在画面远端岸线的位置上（55.7%~57.9%）。
 * 于是 xc 从 0 走到 100 时尺寸比是 1 : 0.32（被 K_MIN 夹到 0.34；画面上实际
 * 用到的区间 ≈ 1 : 0.5）。
 *
 * ⚠️⚠️ **原点必须取"车轮着地行"，不是"镜像轴"**。这是 2026-10 第三轮修掉的一个
 * 实打实的缺陷：上一版把精灵里的镜像轴（= 水面地平线 HZ，在精灵内 47.3765%）
 * 当成了着地行，而源渲染里车轮真正踩在轨面上的那一行在精灵内 **48.9969%**。
 * 两者差 1.62% 精灵高 = 0.765% 图高 = **1600×900 下 16px**，于是列车被整体
 * 压低 16px（近端缩放最大处最明显）—— 现象就是"列车陷进道砟里 / 像脱轨"，
 * 而且画面左侧比右侧更重（左侧 k≈1、缩放最大）。量法见 _repo/bg/contact_line.py：
 * 精灵 alpha 每列的"车体底边"就是源渲染 A 的着地行（列车本来就压在轨上）。
 *
 * 方向：**从右往左**。精灵里的车头朝左，所以这样开才是"车头在前"；
 * 而画面右侧是远端（钢轨收敛处）、左侧是近端 —— 于是它天然就是"由远及近"。
 *
 * ⚠️ 缩放烘进盒子的宽高（CSS 的 --train-scale = 近端最大尺寸），逐帧只改
 * transform 的 scale（--train-k ≤ 1）。这样合成层的纹理永远够用、只会被缩小，
 * 不会被放大糊掉，也不会每帧重新光栅化成一个新尺寸。
 *
 * ── 交互
 *   · 悬停：指针压到车体上 → 指数减速停车（制动 0.46s / 起步 2.1s）
 *   · 拖拽：在车体上按下并拖动 → 列车跟着指针走，松手后从那儿继续巡航。
 *     拖拽范围**钳在轨道可见段内**（xc ∈ 20%~82%），整列车始终留在画面里、
 *     也始终在钢轨上。真的拖动过之后会吃掉紧随其后的那一次 click，
 *     免得"拖着拖着"意外点开列车背后的链接。
 *
 * 命中判定为什么自己做、而不是靠 DOM 事件：列车层是 pointer-events: none
 * （绝不能挡住正文的点击与框选），而且列车一直在动。用已知的场景几何 +
 * 每帧的位置直接算屏幕矩形，比挂一个跟着动的命中盒更准，也不会在列车
 * 经过文字时把文字变成不可点。
 */

const SKY_STYLE = {
  '--sky-plate': `url(${assetUrl('media/sky-plate.webp')})`,
  '--sky-train-img': `url(${assetUrl('media/sky-train.webp')})`,
} as CSSProperties

/** 场景（= 底图）的宽高比，必须与 _repo/bg/build_assets.py 的 meta.json 一致 */
const SKY_AR = 0.7458120903131829

/** 列车精灵相对场景的位置与尺寸（百分比，来自 meta.json） */
const TRAIN = {
  left: 6.0546875,
  top: 38.018936635105604,
  width: 70.01953125,
  height: 47.1959213401311,
  /**
   * 精灵里的**车轮着地行**（0–1）—— 缩放原点，保证缩放时车轮仍压在同一条钢轨上。
   *
   * ⚠️ 它不是 meta.json 里的 `originPct`（47.3765%）：那个是**水面镜像轴** HZ，
   * 只负责"精灵与底图逐像素对齐"，与车轮压在哪儿无关。这里用的是 `contactPct`
   * （= 源渲染 A 里列车自己压出来的着地行），量法见 _repo/bg/contact_line.py；
   * build_assets.py 每次导出精灵时会顺手把这个值算进 meta.json。
   */
  origin: 0.489969,
}

/**
 * 着地行在底图里的绝对位置（底图高度%）。由 top + origin×height 推出，别手写。
 * 值 ≈ 61.1435%。
 */
const ORIGIN_Y = TRAIN.top + TRAIN.origin * TRAIN.height

/**
 * 列车中心相对位移量 x 的固定偏移（底图宽度百分比）。
 * = leftBaked + widthBaked/2，把 --train-scale 代进去会约掉：
 *   6.0546875 + (1−s)·70.0195/2 + 70.0195·s/2 ≡ 41.0645
 * 所以它与缩放无关，轨道取样、命中判定、拖拽钳位都用它。
 */
const CENTER_OFF = TRAIN.left + TRAIN.width / 2

/**
 * 着地线：**车轮压在轨面上的那一行**（底图宽度% → 底图高度%）。
 *
 * ⚠️ 这张表的量法与 2026-10 第二轮不同，别再改回"逐列最暗行"：
 *   · 旧表（62.491 → 59.3）逐列找最暗行，系统性**偏低 0.4~0.5%**（最暗的那一行
 *     是钢轨暗带的中心/道砟边，不是轨面），而且在 x≈20% 处有一个 +0.2% 的假
 *     凸起（那里最暗的是草地与道砟边界）→ 列车左端偏低、还会上下点动。
 *   · 新表由两路证据合成（脚本 _repo/bg/contact_line.py 与 rail_edge.py）：
 *     ① 精灵 alpha 每列的"车体底边"= 源渲染 A 里列车自己的着地行（列车本来
 *        就压在轨面上，这是最硬的证据）；
 *     ② 底图里钢轨暗带的**上沿**（细暗线检测 + 逐列亮度剖面人工核对）。
 *     两路在 x∈[15,75] 一致到 ±0.2% 以内。
 * 改这张表要连带看：SkyStage.css 的 top 表达式、命中判定（用 railY 算着地行）。
 */
const RAIL_X = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
const RAIL_Y = [
  61.8, 61.5, 61.32, 61.18, 61.0, 60.78, 60.42, 60.14, 59.78, 59.42, 59.02,
]
/** 视平线（底图高度的百分比）。取值依据见文件顶部那段推导。 */
const Y_EYE = 57.7
/** 归一化缩放的上下限：0.34 是"远端最小"，1 是"近端 = 烘焙尺寸" */
const K_MIN = 0.34
const K_MAX = 1

/** 把 x 处钢轨的 y 插出来（分段线性，两端夹住） */
function railY(x: number): number {
  const last = RAIL_X.length - 1
  if (x <= RAIL_X[0]) return RAIL_Y[0]
  if (x >= RAIL_X[last]) return RAIL_Y[last]
  let i = 0
  while (i < last && RAIL_X[i + 1] < x) i++
  const t = (x - RAIL_X[i]) / (RAIL_X[i + 1] - RAIL_X[i])
  return RAIL_Y[i] + t * (RAIL_Y[i + 1] - RAIL_Y[i])
}

/**
 * 巡航速度：走完一整圈（场景宽度百分比）要多少秒。
 * 2026-10 第三轮从 62s 提到 40s（= 3.55% 场景宽/秒，1600 视口下 ≈ 57px/s，
 * 比原来快 1.55 倍）。再快下去的问题不是"看不清"，而是 30fps 的写样式节流
 * （WRITE_MS）会让位移开始出现台阶感 —— 57px/s 下每次写样式走 1.9px，还够用。
 */
const LOOP_SECONDS = 40
/** 巡航区间：右侧完全进场之前 → 左侧完全出场之后。方向 = **从右往左**。 */
const RUN_TO = 80
const RUN_FROM = -62
/** 首次落位：中偏右，于是开场就能看到它"由远及近"地开过来 */
const START_X = 30

/** 制动 / 起步的时间常数（秒） */
const BRAKE_TAU = 0.46
const RESTART_TAU = 2.1
/** 速度小于它（%/秒）就算停稳 */
const EPS_V = 0.02
/** 命中判定的宽容边（px）：列车在动，指针要能"够得着" */
const HIT_PAD = 16
/**
 * 写 DOM 的最小间隔（ms）≈ 30fps。
 *
 * 物理积分照常按真实 dt 跑（所以速度、制动曲线不受影响），但**写样式**这一
 * 步只在够一帧的时候做。理由：列车在画面上的速度是 3.55% 场景宽/秒
 * （1600 视口下 57px/s），30fps 下每帧走 1.9px —— 对这么慢的目标，
 * 120fps 与 30fps 肉眼完全分不出，而"每帧改样式"的主线程成本是按次数算的
 * （见 apply 上面那段实测数据）。这一条把常驻开销直接压到 1/4。
 */
const WRITE_MS = 33
/** 拖拽范围：钳住**列车中心**在轨道可见段内（保证整列车不被推出画面） */
const DRAG_XC_MIN = 20
const DRAG_XC_MAX = 82
const DRAG_MIN = DRAG_XC_MIN - CENTER_OFF
const DRAG_MAX = DRAG_XC_MAX - CENTER_OFF
/** 拖拽位移超过它才算"真的拖过"，之后吃掉那一次 click */
const DRAG_SLOP = 3
/** reduced-motion 下列车停在这个位置（场景宽度百分比） */
const PARKED_X = 8

export default function SkyStage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const trainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const scene = sceneRef.current
    const train = trainRef.current
    if (!root || !scene || !train) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fine = window.matchMedia('(pointer: fine)')

    /* ── 几何：只在挂载与 resize 时量 ─────────────────────────────────────── */
    let sceneW = 0
    let sceneH = 0
    let sceneL = 0
    let sceneT = 0
    /** 烘焙缩放（= CSS 的 --train-scale，近端最大尺寸）。只在挂载 / resize 时读。 */
    let kMax = 0.55

    const measure = () => {
      const r = scene.getBoundingClientRect()
      sceneW = r.width
      sceneH = r.height
      sceneL = r.left
      sceneT = r.top
      const raw = Number.parseFloat(
        getComputedStyle(train).getPropertyValue('--train-scale'),
      )
      if (Number.isFinite(raw) && raw > 0.05) kMax = raw
    }

    const runSpan = RUN_TO - RUN_FROM
    const cruise = runSpan / LOOP_SECONDS

    /* ── 每帧要写的量（内部单位：场景百分比 / 倍率）───────────────────────── */
    let x = START_X
    let v = -cruise // 负号 = 从右往左
    /** 当前帧的归一化缩放（命中判定与拖拽都要用，所以留成变量） */
    let k = 1

    /**
     * 由 x 推出「位移 + 缩放」。
     *
     * ⚠️⚠️ 这里有一条**量出来的**性能纪律，别顺手"简化"：
     *   · 每帧只改**一个**自定义属性（--tx，横向位移 = 运动本身）；
     *   · --ty / --tk 只在跨过一档阈值时才写（阈值都远小于一个像素 / 一个
     *     可辨尺寸，见下面 apply 里的注释）；
     *   · **不要**给这一层加逐帧变化的 opacity。
     * 实测（6 秒空闲的主线程忙时，1600×900，见 _repo/bg/perfcost.mjs --idle）：
     *     只写 --tx（+ 偶尔 --ty/--tk）      447 ms
     *     --tx/--ty/--tk 每帧都写            643 ms
     *     再多一个逐帧 --to（透明度）        1166 ms
     *     直接写本元素的 inline transform     1166 ms
     *     完全冻住 rAF（静态页基线）          122 ms
     * 成本与"每帧改几个属性"几乎成正比。而**渲染**这一层本身几乎不要钱：
     * 把 .sky__train 整个 display:none 掉，读数一模一样（792 vs 743）。
     */
    const K_STEP = 250
    let lastY = 1e9
    let lastK = -1
    const apply = (xPct: number) => {
      const xc = xPct + CENTER_OFF
      const ry = railY(xc)
      // 纵向：把车轮着地行顶到钢轨上（dy 一整趟只走 ~51px）
      const dy = ((ry - ORIGIN_Y) / 100) * sceneH
      // 透视：尺寸 ∝ 离视平线的距离
      k = Math.min(K_MAX, Math.max(K_MIN, (ry - Y_EYE) / (RAIL_Y[0] - Y_EYE)))

      // 横向位移：每帧写，它是运动本身
      root.style.setProperty('--tx', `${((xPct / 100) * sceneW).toFixed(2)}px`)
      // 纵向：0.25px 一档（≈0.1s 一次），肉眼不可能分辨
      if (Math.abs(dy - lastY) >= 0.25) {
        lastY = dy
        root.style.setProperty('--ty', `${dy.toFixed(2)}px`)
      }
      // 缩放：1/250 一档（≈0.26s 一次），一次跳变约 2.5px（500px 宽的车）
      const kq = Math.round(k * K_STEP) / K_STEP
      if (kq !== lastK) {
        lastK = kq
        root.style.setProperty('--tk', kq.toFixed(3))
      }
    }

    let px = -1e4
    let py = -1e4
    let held = false
    let dragging = false
    /** 按下时指针落在车体上的哪一点（相对列车 x 的百分比），松手前不变 */
    let grabOffset = 0
    let dragMoved = false
    let suppressClick = false
    let frame = 0
    let last = 0
    let wasHeld = false
    let wasDrag = false

    /** 列车精灵（缩放后的）屏幕矩形，外扩 HIT_PAD */
    const hitRect = () => {
      const w = TRAIN.width * kMax * k * (sceneW / 100)
      const h = TRAIN.height * kMax * k * (sceneH / 100)
      const cx = sceneL + ((x + CENTER_OFF) * sceneW) / 100
      // 着地行 = 场景里的钢轨那一行（apply 已把它顶到 railY）
      const originY = sceneT + (railY(x + CENTER_OFF) * sceneH) / 100
      return {
        cx,
        top: originY - h * TRAIN.origin - HIT_PAD,
        bottom: originY + h * (1 - TRAIN.origin) + HIT_PAD,
        halfW: w / 2 + HIT_PAD,
      }
    }

    const insideTrain = () => {
      if (!fine.matches) return false
      const r = hitRect()
      return px >= r.cx - r.halfW && px <= r.cx + r.halfW && py >= r.top && py <= r.bottom
    }

    const setFlags = () => {
      if (held !== wasHeld) {
        wasHeld = held
        root.toggleAttribute('data-held', held)
      }
      if (dragging !== wasDrag) {
        wasDrag = dragging
        root.toggleAttribute('data-drag', dragging)
      }
      const next = dragging ? 'drag' : held ? 'hold' : 'run'
      if (document.documentElement.dataset.train !== next) {
        document.documentElement.dataset.train = next
      }
    }

    let lastWrite = 0
    const tick = (now: number) => {
      frame = 0
      // dt 夹住：切标签页回来时 dt 可能是好几秒，别让列车瞬移
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000))
      last = now

      if (dragging) {
        /* 拖拽：列车跟着指针，速度清零。
           grabOffset 是按下那一刻"指针 − 列车 x"，于是抓着车头还是车尾
           都不会让车体跳到指针底下。钳位到 DRAG_MIN..DRAG_MAX —— 到边界时
           列车就停在边界上，这本身就是"不许脱轨 / 不许出画"的反馈。 */
        const pointerPct = ((px - sceneL) / sceneW) * 100
        const next = Math.min(DRAG_MAX, Math.max(DRAG_MIN, pointerPct - grabOffset))
        if (Math.abs(next - x) > DRAG_SLOP / sceneW * 100) dragMoved = true
        x = next
        v = 0
      } else {
        const inside = insideTrain()
        if (inside !== held) {
          held = inside
          setFlags()
        }
        /* 速度：指数逼近目标速度。制动比起步快，所以两支各给一个时间常数。 */
        const target = held ? 0 : -cruise
        v += (target - v) * (1 - Math.exp(-dt / (target < v ? RESTART_TAU : BRAKE_TAU)))
        if (Math.abs(target - v) < EPS_V) v = target
        x += v * dt
        // 从右往左：越过左端就回到右端重新进场
        if (x < RUN_FROM) x += runSpan
        if (x > RUN_TO) x -= runSpan
      }

      // 物理每帧都算（速度曲线才准），写样式按 WRITE_MS 节流
      if (now - lastWrite >= WRITE_MS) {
        lastWrite = now
        apply(x)
      }

      // 停稳且仍悬停 / 正在拖拽 → 停帧，等 pointermove 唤醒
      const idle = (held && v === 0) || dragging
      if (!idle) frame = requestAnimationFrame(tick)
    }

    const schedule = () => {
      if (reduce.matches || frame) return
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }

    const onDown = (e: PointerEvent) => {
      if (!fine.matches || reduce.matches) return
      px = e.clientX
      py = e.clientY
      if (!insideTrain()) return
      /* 抓住列车：阻止默认行为（拖选文字 / 原生拖拽），并把指针捕获到目标上
         —— 不加捕获时指针滑出窗口再松开，pointerup 有可能收不到。 */
      e.preventDefault()
      dragging = true
      dragMoved = false
      grabOffset = ((e.clientX - sceneL) / sceneW) * 100 - x
      try {
        ;(e.target as Element | null)?.setPointerCapture?.(e.pointerId)
      } catch {
        /* 拿不到捕获不影响拖动，窗口级的 pointermove/up 照样能收到 */
      }
      setFlags()
      schedule()
    }

    const onMove = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
      schedule()
    }

    const onUp = () => {
      if (!dragging) return
      dragging = false
      suppressClick = dragMoved
      setFlags()
      schedule()
    }

    /* 拖着列车经过某个链接再松手时，浏览器仍会在那个链接上补一次 click ——
       那不是用户想要的，吃掉它（一次）。 */
    const onClickCapture = (e: MouseEvent) => {
      if (!suppressClick) return
      suppressClick = false
      e.preventDefault()
      e.stopPropagation()
    }

    const onResize = () => {
      measure()
      schedule()
    }

    const onVisibility = () => {
      if (document.hidden) {
        if (frame) cancelAnimationFrame(frame)
        frame = 0
      } else {
        schedule()
      }
    }

    const park = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      apply(PARKED_X)
    }

    const onReduce = () => {
      if (reduce.matches) park()
      else schedule()
    }

    measure()
    if (reduce.matches) {
      park()
    } else {
      apply(x)
      schedule()
    }

    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('click', onClickCapture, true)
    reduce.addEventListener('change', onReduce)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('click', onClickCapture, true)
      reduce.removeEventListener('change', onReduce)
    }
  }, [])

  return (
    <div className="sky" ref={rootRef} style={SKY_STYLE} aria-hidden="true">
      {/* 场景盒：手动复刻 background-size: cover 的那套映射，于是内部所有子层
          都能用「场景百分比」定位 —— 列车与底图因此永远共用一个坐标系，
          换视口尺寸也不会错位（这是"列车压在同一条轨道上"的全部依据）。 */}
      <div
        className="sky__scene"
        ref={sceneRef}
        style={{ '--sky-ar': SKY_AR } as CSSProperties}
      >
        <div className="sky__base" />
        {/* 云层两层：外层是取景窗口（只做视口里看得见的那段天空），
            内层是真正在动的底图副本（只平移、不缩放 —— 理由见 SkyStage.css）。 */}
        <div className="sky__drift">
          <div className="sky__drift-inner" />
        </div>
        {/* 列车是**两层**：外层管位移 / 缩放 / 透明度（每帧写 --train-x/-y/-k/-o），
            内层管悬停沉降。缩放烘进外层的盒子宽高里（理由见 SkyStage.css），
            逐帧只动 transform 的 scale，所以纹理永远不会被放大糊掉。 */}
        <div className="sky__train" ref={trainRef}>
          <div className="sky__sprite" />
        </div>
      </div>
      <div className="sky__haze" />
    </div>
  )
}
