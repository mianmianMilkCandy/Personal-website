import {
  createElement,
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react'

import { observeReveal } from '../lib/revealObserver'

/** 入场方向。全都只做"位移 + 透明度"，保证走合成层不触发重排。 */
export type RevealVariant = 'up' | 'left' | 'right' | 'fade' | 'scale'

type RevealProps = {
  children: ReactNode
  /** 渲染成什么标签，用于保留语义（section / article / li / p …） */
  as?: ElementType
  /** 阶梯延迟（毫秒），同组用 stagger() 生成 */
  delay?: number
  /** 入场方向，默认 from-bottom */
  variant?: RevealVariant
  className?: string
  id?: string
}

/**
 * 滚动入场包装器。
 * 用 createElement 而不是 <Tag>，避免 ElementType 联合类型在 JSX 里的
 * props/ref 推断问题。
 */
export default function Reveal({
  children,
  as = 'div',
  delay = 0,
  variant = 'up',
  className,
  id,
}: RevealProps) {
  const stopRef = useRef<(() => void) | null>(null)

  const setRef = useCallback((node: HTMLElement | null) => {
    // 先解绑上一个节点：StrictMode 双调用 / 重新挂载时不会残留观察
    stopRef.current?.()
    stopRef.current = node ? observeReveal(node) : null
  }, [])

  useEffect(
    () => () => {
      stopRef.current?.()
      stopRef.current = null
    },
    [],
  )

  const style =
    delay > 0 ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined

  return createElement(
    as,
    {
      ref: setRef,
      id,
      'data-reveal': variant,
      className: className ? `reveal ${className}` : 'reveal',
      style,
    },
    children,
  )
}
