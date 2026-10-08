import { useState } from 'react'

import { UNFILLED } from '../data/profile'

/**
 * 仅开发模式显示的占位内容清单。
 * 作用：让"哪些信息还没填"这件事在页面上可见，而不是等你一个个去翻代码。
 * 填完 UNFILLED 后此提示自动消失；生产构建里被 tree-shake 掉。
 */
export default function DevNotice() {
  const [open, setOpen] = useState(false)

  return (
    <aside className={open ? 'devnote is-open' : 'devnote'}>
      <button
        type="button"
        className="devnote__toggle mono"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="devnote__dot" aria-hidden="true" />
        占位内容 {UNFILLED.length} 项
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>

      {open ? (
        <ul className="devnote__list">
          {UNFILLED.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </aside>
  )
}
