import type { CSSProperties } from 'react'

import './WindLeaves.css'

/**
 * 风里的落叶（"起风了"的可见线索）。
 *
 * 为什么不直接让画里那丛爬藤摆动：那是一份**有缝**的图案（叶子之间是天空与石墙），
 * 把"同一张画"的位移副本叠上去，叶缝里会同时出现两层 —— 实测只要 0.6°（叶尖 2.9px）
 * 就能看出叶子变厚/重影，1.2° 就是明显的双叶（对照图 docs/ui-review/20）。
 * 那招只适用于**实心**图层（天空、水面），所以这里改成"加新内容"：
 * 几片被风吹过画面的落叶。零重影风险，素材为零（CSS 形状），全程只有 transform。
 *
 * 几个刻意的取舍：
 *  · **参数全部写死，不用随机数**。一是验收要定格对比，随机数会让每次跑出来的画面
 *    都不一样；二是刷新一次叶子就换个位置会更像 bug 而不是风。
 *  · 只做两个飞行轨迹（A/B）交替：风是一个方向，所有叶子走同向的斜线才像风；
 *    给每片叶子不同的起始高度、时长、相位，避免看出"同一套动作"。
 *  · 用 vw/vh 而不是百分比做位移：transform 里的百分比是相对**元素自身**尺寸的
 *    （13px 的叶子写 110% 只走 14px），要跨屏就得用视口单位。
 *  · 颜色只引令牌（--fg），所以两个主题各自成立；叶片本身用 `border-radius: 0 100% 0 100%`
 *    的方块做出"叶子"的轮廓，不引任何图片。
 */

/** 每片叶子：起始高度 / 尺寸 / 周期 / 相位（负值 = 开场就已经在飞） / 透明度 */
const LEAVES: { top: string; size: number; dur: number; delay: number; o: number }[] = [
  { top: '14%', size: 15, dur: 21, delay: -2, o: 0.62 },
  { top: '26%', size: 11, dur: 17, delay: -9, o: 0.5 },
  { top: '38%', size: 17, dur: 26, delay: -14, o: 0.56 },
  { top: '52%', size: 12, dur: 15, delay: -5, o: 0.46 },
  { top: '66%', size: 14, dur: 23, delay: -18, o: 0.54 },
]

export default function WindLeaves() {
  return (
    <div className="wind" aria-hidden="true">
      {LEAVES.map((leaf, i) => (
        <span
          key={i}
          className={i % 2 ? 'wind__leaf wind__leaf--b' : 'wind__leaf'}
          style={
            {
              '--leaf-top': leaf.top,
              '--leaf-size': `${leaf.size}px`,
              '--leaf-dur': `${leaf.dur}s`,
              '--leaf-delay': `${leaf.delay}s`,
              '--leaf-o': leaf.o,
            } as CSSProperties
          }
        >
          <span className="wind__leaf-inner" />
        </span>
      ))}
    </div>
  )
}
