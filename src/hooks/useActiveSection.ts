import { useEffect, useState } from 'react'

/**
 * 当前滚动到哪个区块（用于导航高亮）。
 *
 * 用 rAF 节流的 scroll 计算而不是 IntersectionObserver 比例：
 * 单页长滚动下"区块顶部越过导航线"这一判据是确定性的，不会有
 * observer 回调只带变化条目而导致的高亮抖动。
 *
 * ⚠️ `ids` 必须是稳定引用（模块级常量），否则 effect 会每帧重装。
 */
export function useActiveSection(ids: readonly string[], offset = 88): string {
  const [active, setActive] = useState<string>(ids[0] ?? '')

  useEffect(() => {
    let frame = 0

    const compute = () => {
      frame = 0
      let current = ids[0] ?? ''

      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top - offset <= 0) current = id
      }

      // 触底时强制高亮最后一个区块：末屏往往较矮，否则永远轮不到它
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4
      if (atBottom) current = ids[ids.length - 1] ?? current

      setActive((prev) => (prev === current ? prev : current))
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(compute)
    }

    compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ids, offset])

  return active
}
