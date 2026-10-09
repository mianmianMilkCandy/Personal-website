import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react'

import { initCube } from '../lib/cube'
import './Cube.css'

export type CubeFace = {
  /** 面的 id，同时作为锚点（导航与深链直接用 #id 落面） */
  id: string
  node: ReactNode
}

/**
 * 立方体舞台。
 *
 * 页面不再是"一叠长区块"，而是"一根棱柱的侧面"：
 *   .cube__track 提供 面数 × 100svh 的滚动距离（唯一的文档流元素）
 *   .cube__stage 是固定在视口里的 100svh 窗口
 *   每个 .cube__slot 是一个面，由 lib/cube.ts 按滚动逐帧摆到 3D 位置上
 *
 * 面高 = 100svh 是几何硬约束（见 lib/cube.ts 顶部说明），所以每面的内容
 * 必须自己装进一屏 —— 这也是"面化"这件事的全部代价。
 */
export default function Cube({ faces }: { faces: CubeFace[] }) {
  const stageRef = useRef<HTMLDivElement>(null)

  // 用 layout effect：静止状态必须在首次绘制之前落位，
  // 否则九个面会先同时可见、闪一帧再各就各位。
  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const slots = Array.from(stage.querySelectorAll<HTMLElement>('.cube__slot'))
    return initCube({ stage, slots })
  }, [faces])

  return (
    <div className="cube">
      <div
        className="cube__track"
        style={{ '--face-count': faces.length } as CSSProperties}
      >
        {faces.map((face, i) => (
          <span
            key={face.id}
            id={face.id}
            className="cube__anchor"
            aria-hidden="true"
            style={{ top: `calc(${i} * 100svh + var(--nav-h))` }}
          />
        ))}
      </div>

      <div className="cube__stage" ref={stageRef}>
        {faces.map((face) => (
          <div
            key={face.id}
            className="cube__slot"
            data-face={face.id}
            data-parked=""
          >
            {face.node}
          </div>
        ))}
      </div>
    </div>
  )
}
