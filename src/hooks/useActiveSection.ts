import { useEffect, useState } from 'react'

/**
 * 当前滚动到哪个区块（用于导航高亮）。
 *
 * 判据仍是"区块顶部越过导航线"（单页滚动下它是确定性的，不会像 observer
 * 回调只带变化条目那样抖），但**不在滚动帧里量布局**：
 *
 * 原始实现每帧读 4 次 `getBoundingClientRect()` + 一次
 * `document.documentElement.scrollHeight`。而同一个滚动帧里 lib/cube.ts 刚写完
 * 9 个面的 transform 与 --shade（都是让样式失效的写），紧接着的任何布局读数
 * 都会**逼浏览器当场重算整篇布局** —— 正是 Nav.tsx 里已经踩过并修掉的那个
 * "写 → 读"交替。这里照同一套路办：偏移与可滚动总高只在挂载 / 文档尺寸变化
 * 时量一次（ResizeObserver 盯住文档根 + resize 兜底），滚动帧里只做减法。
 *
 * 为什么可以缓存：这些目标都是 `.cube__track` 里绝对定位在固定 top 上的锚点
 * （见 Cube.tsx），文档内偏移只随视口高度变，不会被内容回流推走。
 *
 * ⚠️ `ids` 必须是稳定引用（模块级常量），否则 effect 会每帧重装。
 */
type Target = { id: string; top: number }

export function useActiveSection(ids: readonly string[], offset = 88): string {
  const [active, setActive] = useState<string>(ids[0] ?? '')

  useEffect(() => {
    let frame = 0
    /** 各目标在文档内的 y 偏移；量不到（元素不存在）记 NaN，逐帧跳过 */
    let targets: Target[] = []
    let maxScroll = 0

    /** 滚动帧里只读缓存 + `window.scrollY`（读滚动位置不触发布局） */
    const compute = () => {
      frame = 0
      const y = window.scrollY
      let current = ids[0] ?? ''

      for (const target of targets) {
        if (!Number.isFinite(target.top)) continue
        if (target.top - y - offset <= 0) current = target.id
      }

      // 触底时强制高亮最后一个区块：末屏往往较矮，否则永远轮不到它
      if (y >= maxScroll - 4) current = ids[ids.length - 1] ?? current

      setActive((prev) => (prev === current ? prev : current))
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(compute)
    }

    /** 唯一的布局读数发生在这里：挂载、resize、文档尺寸变化 */
    const measure = () => {
      const y = window.scrollY
      targets = ids.map((id) => {
        const el = document.getElementById(id)
        return { id, top: el ? el.getBoundingClientRect().top + y : Number.NaN }
      })
      maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      )
      compute()
    }

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)

    measure()
    resizeObserver?.observe(document.documentElement)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      resizeObserver?.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
    }
  }, [ids, offset])

  return active
}
