import type { CSSProperties } from 'react'

import {
  CURSOR_TINTS,
  previewCursorTint,
  useCursorColor,
} from '../hooks/useCursorColor'
import Icon from './Icon'
import './CursorTint.css'

/**
 * 光标配色控件：导航右上角那枚"指针图标 + 一排色板圆点"的玻璃胶囊。
 *
 * 三条交互设计：
 *  1. **悬停/聚焦即预览**：鼠标扫过某个色板，光标当场变成那个颜色，
 *     不用点下去试错（onPointerEnter / onFocus 走 previewCursorTint，
 *     只改 CSS 变量，不写 store、不落 localStorage）。
 *  2. **指针移出控件就还原**：还原成当前选中的那一个。
 *  3. **色板值走 var()**：真实颜色留在 tokens.css，这里只传变量名。
 *
 * 触屏与 reduced-motion 下由 CSS 直接隐藏 —— 那两种场合本站根本没有自定义光标。
 */
export default function CursorTint() {
  const { tint, setTint } = useCursorColor()

  return (
    <div
      className="curtint glass"
      role="group"
      aria-label="光标颜色"
      onPointerLeave={() => previewCursorTint(null)}
    >
      <Icon name="cursor" className="curtint__icon" />

      {CURSOR_TINTS.map((item) => {
        const on = item.id === tint
        return (
          <button
            key={item.id}
            type="button"
            className={on ? 'curtint__chip is-on' : 'curtint__chip'}
            style={{ '--swatch': item.cssVar || 'var(--accent)' } as CSSProperties}
            aria-pressed={on}
            aria-label={`光标颜色：${item.label}`}
            title={`光标颜色：${item.label}`}
            onPointerEnter={() => previewCursorTint(item.id)}
            onFocus={() => previewCursorTint(item.id)}
            onBlur={() => previewCursorTint(null)}
            onClick={() => setTint(item.id)}
          />
        )
      })}
    </div>
  )
}
