import type { ReactNode } from 'react'

import './Icon.css'

/**
 * 手绘风内联图标集（无任何图片请求、无图标库依赖）。
 *
 * 走"可爱漫画"路线的三条做法：
 *  1. 一律圆头圆角（stroke-linecap/linejoin: round），线宽 1.8 —— 比常规线条图标更"胖"一点；
 *  2. 每枚图标带一处**强调色细节**（`.i-accent`），跟着主题变色，不做死板单色；
 *  3. 出现时优先装在 `.tile` 贴纸底里（圆角方块 + 暖色微光），而不是裸线条。
 *
 * 语义优先：图标只做"更快认出来"的加速器，含义始终由旁边的文字兜底 ——
 * 所以不做纯图标无标签的导航，避免为了可爱牺牲可读性。
 */
export type IconName =
  | 'mail'
  | 'phone'
  | 'wechat'
  | 'cat'
  | 'globe'
  | 'pin'
  | 'clock'
  | 'spark'
  | 'cloud'
  | 'code'
  | 'layers'
  | 'tune'
  | 'desktop'
  | 'leaf'
  | 'doc'
  | 'target'
  | 'star'
  | 'cursor'
  | 'arrowRight'
  | 'arrowDown'

const GLYPHS: Record<IconName, ReactNode> = {
  mail: (
    <>
      <rect x="2.6" y="5" width="18.8" height="14" rx="3.6" />
      <path d="M4.4 8 11 12.6a1.8 1.8 0 0 0 2.1 0L19.7 8" />
      <path className="i-accent" d="M19.4 3.1c.3 1.3.8 1.8 2.1 2.1-1.3.3-1.8.8-2.1 2.1-.3-1.3-.8-1.8-2.1-2.1 1.3-.3 1.8-.8 2.1-2.1Z" />
    </>
  ),
  phone: (
    <>
      <path d="M5.4 3.8h3l1.4 3.6-2 1.3a11.6 11.6 0 0 0 5.2 5.2l1.3-2 3.6 1.4v3a2.6 2.6 0 0 1-2.9 2.6A15.4 15.4 0 0 1 2.8 6.7a2.6 2.6 0 0 1 2.6-2.9Z" />
      <path className="i-accent" d="M15.6 3.6a5.4 5.4 0 0 1 4.8 4.8M16.4 7a2.6 2.6 0 0 1 1.8 1.8" />
    </>
  ),
  wechat: (
    <>
      <path d="M9.5 4.2c3.5 0 6.3 2.2 6.3 4.9S13 14 9.5 14c-.6 0-1.2-.1-1.8-.2l-2.9 1.4.7-2.2a4.8 4.8 0 0 1-2.3-3.9c0-2.7 2.8-4.9 6.3-4.9Z" />
      <circle cx="7.4" cy="8.6" r=".95" fill="currentColor" stroke="none" />
      <circle cx="11.7" cy="8.6" r=".95" fill="currentColor" stroke="none" />
      <path className="i-accent" d="M15.4 10.3c2.9 0 5.2 1.8 5.2 4.1 0 1.2-.6 2.3-1.6 3l.5 1.8-2.4-1.1c-.5.1-1.1.2-1.7.2-2.2 0-4.1-1.1-4.8-2.6" />
    </>
  ),
  cat: (
    <>
      <path d="M5.6 9.4 5.1 4.6l3.8 2.3a8.9 8.9 0 0 1 6.2 0l3.8-2.3-.5 4.8" />
      <path d="M4.5 13.6a7.5 7.5 0 1 0 15 0 7.5 7.5 0 0 0-15 0Z" />
      <circle cx="9.4" cy="13.1" r=".9" fill="currentColor" stroke="none" />
      <circle cx="14.6" cy="13.1" r=".9" fill="currentColor" stroke="none" />
      <path className="i-accent" d="M10.5 16.3c.9.7 2.1.7 3 0" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.6 12h16.8" />
      <path d="M12 3.4c2.4 2.5 3.6 5.4 3.6 8.6S14.4 18.1 12 20.6c-2.4-2.5-3.6-5.4-3.6-8.6S9.6 5.9 12 3.4Z" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21c4.1-4.3 6.1-7.6 6.1-10.1a6.1 6.1 0 1 0-12.2 0C5.9 13.4 7.9 16.7 12 21Z" />
      <circle className="i-accent" cx="12" cy="10.8" r="2.3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path className="i-accent" d="M12 7.1V12l3.5 2.1" />
    </>
  ),
  spark: (
    <path d="M12 3.4c.7 4.1 2.6 6 6.7 6.7-4.1.7-6 2.6-6.7 6.7-.7-4.1-2.6-6-6.7-6.7 4.1-.7 6-2.6 6.7-6.7Z" />
  ),
  cloud: (
    <>
      <path d="M7.5 18.4h9.1a3.9 3.9 0 0 0 .5-7.7 5.5 5.5 0 0 0-10.5 1 3.4 3.4 0 0 0 .9 6.7Z" />
      <path className="i-accent" d="M12.6 13.4c.3 1.2.9 1.8 2.1 2.1-1.2.3-1.8.9-2.1 2.1-.3-1.2-.9-1.8-2.1-2.1 1.2-.3 1.8-.9 2.1-2.1Z" />
    </>
  ),
  code: (
    <>
      <path d="M8.7 7.3 4 12l4.7 4.7" />
      <path d="M15.3 7.3 20 12l-4.7 4.7" />
      <path className="i-accent" d="M13.4 4.8l-2.8 14.4" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.4 3.5 8 12 12.6 20.5 8 12 3.4Z" />
      <path className="i-accent" d="M3.5 12.6 12 17.2l8.5-4.6" />
    </>
  ),
  tune: (
    <>
      <path d="M4.6 7.6h8.2M18.2 7.6h1.2M4.6 16.4h1.2M10.2 16.4h9.2" />
      <circle className="i-accent" cx="15.4" cy="7.6" r="2.2" />
      <circle className="i-accent" cx="7.8" cy="16.4" r="2.2" />
    </>
  ),
  desktop: (
    <>
      <rect x="2.8" y="4.3" width="18.4" height="12.4" rx="2.7" />
      <path d="M9.2 20.3h5.6M12 16.7v3.6" />
      <path className="i-accent" d="M6.4 12.6l2.1-3 1.9 2.4 1.7-2.6 2.3 3.2" />
    </>
  ),
  leaf: (
    <>
      <path d="M20.4 3.6C10.9 3.6 4.5 7.3 4.5 14.4c0 2.6 1 4.5 2.6 5.6 7 1 13.3-6.8 13.3-16.4Z" />
      <path className="i-accent" d="M6.5 19.7C9.7 14.5 13.7 10.9 18 8.5" />
    </>
  ),
  doc: (
    <>
      <path d="M13.4 3.4H7.5A2.4 2.4 0 0 0 5.1 5.8v12.4a2.4 2.4 0 0 0 2.4 2.4h9a2.4 2.4 0 0 0 2.4-2.4V8.8l-5.5-5.4Z" />
      <path d="M13.3 3.6v5.1h5.2" />
      <path className="i-accent" d="M12 11.9v4.7M9.8 14.4 12 16.6l2.2-2.2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle className="i-accent" cx="12" cy="12" r="4.1" />
      <circle cx="12" cy="12" r="1.05" fill="currentColor" stroke="none" />
    </>
  ),
  star: (
    <path d="M12 3.7l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 17l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.7Z" />
  ),
  /* 鼠标指针：给"光标颜色"控件一个能一眼认出的图标 */
  cursor: (
    <>
      <path d="M6.6 4.3v14.2l3.6-3.7 2.1 4.9 2.5-1.1-2.1-4.8 5.1-.6L6.6 4.3Z" />
      <path className="i-accent" d="M6.6 4.3v14.2l3.6-3.7" />
    </>
  ),
  arrowRight: (
    <path d="M4.6 12h14.2M13.2 6.4 18.8 12l-5.6 5.6" />
  ),
  arrowDown: (
    <path d="M12 4.6v14.2M6.4 13.2 12 18.8l5.6-5.6" />
  ),
}

/** 按标签猜图标：改 profile.socials / 联系方式文案时不用同步改映射。 */
export function socialIcon(label: string): IconName {
  const l = label.toLowerCase()
  if (l.includes('github')) return 'cat'
  if (l.includes('微信') || l.includes('wechat')) return 'wechat'
  if (l.includes('电话') || l.includes('tel')) return 'phone'
  if (l.includes('邮') || l.includes('mail')) return 'mail'
  /* 备注：原先这里还有一条「博客 / 掘金 / blog → leaf」的映射。
     作者没有博客，profile.socials 里那一项已删除（2026-10-09），
     所以这条死分支也一起删了，不留"看起来还支持"的假接口。 */
  return 'globe'
}

type IconProps = {
  name: IconName
  /** 只影响尺寸/对齐，颜色一律走 currentColor 以便跟随主题 */
  className?: string
}

export default function Icon({ name, className }: IconProps) {
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[name]}
    </svg>
  )
}
