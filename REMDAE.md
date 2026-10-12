# REMDAE.md — 个人网站项目 AI 提示词（UI / 技术栈 / 外观设计）

> 用途：把本项目的全部设计决策压缩成可直接投喂给 AI（代码生成 / 设计复刻 / 风格迁移）的提示词。
> 适用场景：让 AI 从零复刻本站、在别的项目里沿用同一套设计语言、或作为续作的 style guide。
> 线上实例：https://personal-website-dqm.pages.dev/

---

## 一句话总纲（System Prompt 开头先放这段）

```
你是一位前端设计工程师。请构建一个"晴空绘本 × 工程师的仪表盘"风格的个人主页/作品集
纯静态站点：整站是一根 9 面棱柱的九个侧面，滚动即绕视口水平中轴翻面；
九个面共用同一幅连续的晴天背景（积雨云 + 地平线 + 镜面水 + 一列巡航的火车），
翻面时背景纹丝不动，只有内容在换。画面负责"端正"，控件负责"克制与可修"。
技术栈 React 19 + TypeScript(strict) + Vite 7，运行时零第三方依赖，
原生 CSS + 设计令牌，无后端、无 UI 库、无动画库、无图标库。
```

---

## 1. 技术栈提示词

```
- 框架：React 19.1 + TypeScript 5.9（strict，三份 tsconfig：root / app / node）
- 构建：Vite 7，base: './'，产物可放任意子目录 / Pages / 对象存储
- 安全构建：npm run build 走 scripts/build.mjs —— 类型检查 → 构建到中间目录
  → 全部成功才换入 dist/，任何一步失败都不破坏上一版可用产物
- 安全策略：构建期向 index.html 注入 meta CSP；public/_headers 补
  HSTS / nosniff / Referrer-Policy / Permissions-Policy / COOP / X-Frame-Options
- 缓存：/assets/* 一年 immutable（内容哈希产物）；*.html must-revalidate
- 样式：原生 CSS，零 CSS 框架、零 CSS-in-JS；所有视觉参数收敛在 src/styles/tokens.css
- 运行时依赖：零。图标 20 枚全部手写内联 SVG；动画手写
  （CSS keyframes / transition + IntersectionObserver + rAF）；
  3D 用纯 CSS perspective + transform: rotateX（无 three.js / WebGL）
- 性能纪律：无常驻 rAF 循环；滚动帧内不读布局；面内禁 backdrop-filter；
  动画只走合成层（opacity / transform）；全量遵守 prefers-reduced-motion；
  用 .cube__slot { contain: paint } 代替 content-visibility
- 内容与代码分离：改简历只动 src/data/profile.ts，改项目只动 src/data/projects.ts
```

## 2. UI 设计语言提示词

```
设计方向：「宫崎骏的晴天绘本 × 工程师的仪表盘」。
三条铁律：
1. 表面分级 + 发丝描边：表面走 --ink-* 半透明白纸语义层级，边界一律
   1px solid var(--line)；不用大圆角、不用大投影。
2. 单一强调色只用在微观细节：暖橙 #d9762f 是蓝天里唯一能跳出来的互补色，
   只允许出现在状态点、焦点环、激活下划线、hover 微光上；
   永远不做大面积填色或渐变背景。
3. 元数据用等宽字体：所有编号、标签、数值走 JetBrains Mono，
   大写 + 字距（uppercase + letter-spacing）。

主题：只有一套（恒为白昼）。背景换成整幅高饱和晴空画后，深色主题会把画洗成
灰紫色——"换背景"与"保留暗色主题"互斥。对比度由面板承担，不由文字色承担：
正文带白纱（.has-art::after）+ 实白卡片，文字色只需在已足够亮的表面上过 4.5:1。

表面分级（六档不透明度，每档都有实测理由）：
- 区块表面 --surface-alt: 52% 白（半透明，让固定背景层透出来）
- 首屏玻璃卡 62% / 项目卡 68%（color-mix 白）/ 入场按钮 88% 实白
- 吸顶导航 76% 白 / 玻璃面板 66% 白 + blur(18px) saturate(140%)

描边：统一 1px，三档灰阶（16% / 26% / 38%）。
圆角：--r-1 2px（行内小控件）/ --r-2 4px（按钮、头像框）/
--r-3 8px（卡片、贴纸）/ --r-full 只给胶囊与圆点。大圆角是模板感的重灾区。

玻璃质感的使用范围（UI 与性能的交叉点）：
- 允许：吸顶导航、入场幕屏、.glass —— 它们在转动的舞台之外
- 面内一律禁止 backdrop-filter：面一直在转，带模糊的元素等于要求合成器
  每帧重采样背后内容并重做高斯模糊，还会把它踢出栅格缓存

手绘描边按钮：底只用 12% 主题底色；轮辋不用 border，交叠 ::before 画一圈
1.5px 线再套 SVG 湍流位移滤镜（feTurbulence + feDisplacementMap, scale 2.4）
把线抖出"手画"味；滤镜只作用在描边层，文字保持锋利。
该节必须留在 base.css 文件末尾（否则被 .pill 同特异度后到者覆盖）。

图标系统：手写内联 SVG，圆头圆角 + 线宽 1.8；每枚带一处强调色细节；
优先装进暖色贴纸底。图标只是加速器：图标旁都有文字标签，
叙事文字不做图标化。

点击光影：文档级 pointerdown 委托，写入 --fx/--fy 百分比，CSS 用
radial-gradient(130px circle at var(--fx) var(--fy)) 让暖光从点击处散开，
描边同时亮成强调色；animationend 自动摘类，不用 setTimeout。
```

## 3. 结构与布局提示词（9 面棱柱舞台）

```
整站 = 一根 CSS 3D 棱柱的 9 个侧面（src/App.tsx 的 FACES 数组即页面表，
面数 = 数组长度，每个 id 同时是锚点）：
#hero / #about / #about-contact / #about-story / #about-caps /
#projects / #work-clean / #work-dca / #contact

- 滚动量 → 绕视口水平中轴的旋转角，相邻两面在视口正中成 90° 棱
- 每次翻面，面内内容重播一遍进出场动画（相位挂在槽位上）
- 一屏一面是硬约束：面高恰 100svh，.cube__slot overflow:hidden ——
  内容比一屏高就会被静默裁切，排版预算按实测净空数字压缩，不凭肉眼
- 新增项目只改 3 处：projects.ts 加数据、PROJECT_FACES 加一行、
  ProjectId 类型加字面量；导航与几何自动跟上
- 为什么是 9 面：立方体硬约束是"每个面恰好一屏高"，
  内容按语义重新分页凑出来的（内容一条没删，只换每屏装多少）

首屏整屏四角构图，中间留白全给画面：
左上 logo+字标 / 右上 光标配色胶囊+CTA / 左下 一行大标题
「{名字}的主页。」+ 一句话主张 + 手绘高透明按钮 / 右下 玻璃卡（WELCOME）
/ 最底边 SCENE 01 · 主题 · UTC+8 时钟 一行横跨整行

排版细节的实测约束：
- --fs-hero: clamp(2.1rem, 5.2vw, 6rem)，上限 6rem 是因为标题必须一行
  （8 汉字 × 6rem = 768px，宽屏列宽 ~880px），名字再长就会折行
- 一句话的 max-width 用 em 不能用 ch（ch 对中文只有半个字宽）
- 标题末尾的句号是全站唯一的彩色标点（--accent）
- 字体分工：Inter Tight 承担标题与正文；JetBrains Mono 承担全部元数据
- 面内排版预算：正文带压到视口上方 66vh，给列车让路；
  写面内选择器必须带 .cube__slot 前缀，否则被按特异度盖掉
```

## 4. 连续背景层 SkyStage（外观设计的核心）

```
九个面共用同一个固定层 src/components/SkyStage.tsx —— 这就是
"每一页背景连续"的全部实现方式。层序自下而上：
1. .sky__base        底图（无列车），静止
2. .sky__drift       同一张底图只露地平线以上，30s 横向呼吸 → 云在飘
3. .sky__train       列车 + 水面倒影精灵，沿钢轨从右往左巡航，
                     悬停减速停车（制动 0.46s / 起步 2.1s），按住可拖拽改位
4. .sky__haze        一层很淡的天光

- 巡航速度：跑一圈 142% 场景宽 / 40s ≈ 3.55% 场景宽/秒
- 命中判定是纯算术（列车层 pointer-events:none，绝不挡正文）
- 几何三常量必须与底图 meta.json 一致：--sky-ar 0.7458、--sky-hz 60.38%、
  列车精灵 left/top/width/height/origin 百分比；换了底图裁切就必须同步改 CSS 常量
- 列车位置单位是 px（内部按场景百分比换算）——
  无单位写法会让整条 transform 被静默丢弃
- 构图唯一自由旋钮：--sky-hz-screen（默认 80vh；矮屏 ≤840px 高改 84vh）
- 底图素材由脚本从渲染图分离生成（371KB 底图 + 238KB 带 alpha 列车精灵），
  两张图在 <head> preload（首屏 LCP 就是这块天空）
- 面内禁止 background：有了一整块不透明的面，背后连续背景会被整个盖掉
```

## 5. 动效纪律提示词

```
- 云的漂移 keyframes：恒等变换必须放在中点（0%/-2.2% scale1.06 →
  50% 恒等 → 100%/+2.2%），缓动 linear、infinite alternate；
  用 ease-in-out 或把恒等放起点会让开场十几秒几乎不动
- 覆盖约束：scale ≥ 1 + 2×|位移|，余量不足会在遮罩边缘露一条错位底图
- 每次换面重播进出场：入场阶梯延迟封顶（避免后面的元素像卡帧），
  出场统一 320ms 同步退场
- 动态光标三条安全设计：
  1. 原生光标只在第一次 pointermove 之后才隐藏（挂载就 cursor:none
     会出现"原生没了、自定义没定位"的一瞬）
  2. 隐藏靠 JS 加的 html.has-cursor 类，不写死 CSS —— JS 挂了原生光标原样保留
  3. 只在精确指针 + 非 prefers-reduced-motion 下启用
- 入场幕屏：localStorage 去重，点击 / 任意键 / ESC 均可进入；
  prefers-reduced-motion 下直接跳过
- 验收习惯：动效"做了但看不出来"必须用像素级断言抓住
  （定格两帧比较，天空区变化 >8/255 的像素占比 > 0.5%）
```

## 6. 负面清单（禁止项，直接抄进 prompt）

```
- 不用大圆角、大投影、大面积渐变背景、大面积强调色填色
- 面内不用 backdrop-filter / content-visibility
- 不引入任何运行时第三方依赖（UI / 动画 / 图标库都不要）
- 组件里禁止字面色值，只许消费 tokens.css 的语义令牌
- 3D 舞台上不做任何每帧重绘或重模糊
- 叙事文字不做图标化；图标旁必有文字标签
- .hero / .closing 不写 background
- 换底图裁切不同步改 CSS 几何常量 = 列车与轨道错位
```

## 7. 建议的完整使用方式

把本文件整体作为 system prompt 或第一条用户消息，并附上：

```
请严格按照上述设计语言与工程纪律，复刻/续写该个人站。
所有内容数据放进 src/data/profile.ts 与 projects.ts；
所有视觉参数只写进 src/styles/tokens.css；
每个面恰好一屏高；改完用 npm run build 走安全构建。
```
