import type { CSSProperties } from 'react'

import './WindLeaves.css'

/**
 * 风里的落叶与花瓣（"起风了"的可见线索）。九页都有。
 *
 * 为什么不直接让画里那丛爬藤摆动：那是一份**有缝**的图案（叶子之间是天空与石墙），
 * 把"同一张画"的位移副本叠上去，叶缝里会同时出现两层 —— 实测只要 0.6°（叶尖 2.9px）
 * 就能看出叶子变厚/重影，1.2° 就是明显的双叶（对照图 docs/ui-review/20）。
 * 那招只适用于**实心**图层（天空、水面），所以这里改成"加新内容"：
 * 几片被风带走的东西。零重影风险，素材为零（CSS 形状），全程只有 transform。
 *
 * 几个刻意的取舍：
 *  · **参数全部写死，不用随机数**。一是验收要定格对比，随机数会让每次跑出来的画面
 *    都不一样；二是刷新一次位置就变会更像 bug 而不是风。
 *  · 只做两条飞行轨迹（A/B）交替：风是一个方向，所有东西走同向的斜线才像风；
 *    靠不同的起始高度、时长、相位避免看出"同一套动作"。
 *  · 用 vw/vh 而不是百分比做位移：transform 里的百分比是相对**元素自身**尺寸的
 *    （13px 的叶子写 110% 只走 14px），要跨屏就得用视口单位。
 *  · 颜色只引令牌（--accent / --petal），所以两个主题各自成立。
 */

/** 一片"被风带走的东西"：起始高度 / 尺寸 / 周期 / 相位（负值 = 开场就已经在飞）/ 透明度 */
type Bit = { top: string; size: number; dur: number; delay: number; o: number }

/** 落叶。暖金（--accent），比花瓣快一点、翻面小一点。 */
const LEAVES: Bit[] = [
  { top: '14%', size: 15, dur: 21, delay: -2, o: 0.62 },
  { top: '34%', size: 11, dur: 17, delay: -9, o: 0.5 },
  { top: '55%', size: 16, dur: 26, delay: -14, o: 0.55 },
  { top: '74%', size: 12, dur: 19, delay: -5, o: 0.48 },
]

/** 花瓣。粉（--petal），更慢更飘，翻面幅度更大（走 petalFlutter）。 */
const PETALS: Bit[] = [
  { top: '20%', size: 12, dur: 28, delay: -4, o: 0.58 },
  { top: '42%', size: 9, dur: 24, delay: -13, o: 0.46 },
  { top: '63%', size: 13, dur: 32, delay: -21, o: 0.52 },
  { top: '83%', size: 10, dur: 26, delay: -8, o: 0.44 },
]

function render(bits: Bit[], kind: 'leaf' | 'petal') {
  return bits.map((bit, i) => (
    <span
      key={`${kind}-${i}`}
      className={`wind__bit wind__bit--${kind}${i % 2 ? ' wind__bit--b' : ''}`}
      style={
        {
          '--bit-top': bit.top,
          '--bit-size': `${bit.size}px`,
          '--bit-dur': `${bit.dur}s`,
          '--bit-delay': `${bit.delay}s`,
          '--bit-o': bit.o,
        } as CSSProperties
      }
    >
      <span className="wind__bit-inner" />
    </span>
  ))
}

export default function WindLeaves() {
  return (
    <div className="wind" aria-hidden="true">
      {render(LEAVES, 'leaf')}
      {render(PETALS, 'petal')}
    </div>
  )
}
