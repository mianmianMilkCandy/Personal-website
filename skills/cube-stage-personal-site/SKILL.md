---
name: cube-stage-personal-site
description: 复刻/续写「9 面棱柱舞台个人站」（晴空绘本 × 工程师仪表盘）的完整技能。当用户要构建、修改、复刻此类纯静态 React 个人主页/作品集，或要沿用该站的设计语言（设计令牌、连续天空背景、3D 翻面、手绘描边）时使用。
---

# 立方体舞台个人站（Cube-Stage Personal Site）

把「晴空绘本 × 工程师的仪表盘」风格的 9 面棱柱个人站从零复刻或续写。
线上实例：https://personal-website-dqm.pages.dev/

## 何时使用

- 要构建 / 续写 / 复刻此类纯静态个人主页、作品集站点
- 要在其他项目沿用该站的设计语言（令牌驱动、发丝描边、连续背景、CSS 3D 翻面）
- 用户提到「立方体舞台 / 棱柱 / 9 面 / SkyStage / 晴空绘本」等关键词

## 总纲

整站 = 一根 9 面棱柱的九个侧面，滚动即绕视口水平中轴翻面；九个面共用同一幅连续晴天背景（积雨云 + 地平线 + 镜面水 + 巡航列车），翻面时背景不动。**画面负责端正，控件负责克制。**

技术栈：React 19 + TypeScript(strict) + Vite 7，运行时零第三方依赖，原生 CSS + 设计令牌，无后端。

## 步骤

### 1. 项目骨架

```
index.html              入口（内联主题引导脚本 + 背景图 preload）
vite.config.ts          base: './'；构建期注入 meta CSP
scripts/build.mjs       安全构建：tsc → 中间目录 → 自检 → 全成才换入 dist/
public/_headers         HSTS/nosniff/Referrer-Policy/COOP/缓存策略
src/App.tsx             FACES 数组即页面表（面数 = 数组长度，id 即锚点）
src/components/         Cube 舞台 / SkyStage 连续天空 / 各区块 + 同名 CSS
src/data/               profile.ts · projects.ts（全部站点内容数据）
src/styles/tokens.css   全部设计令牌（唯一视觉参数来源）
```

- 新增项目面只改 3 处：projects.ts 加数据、PROJECT_FACES 加一行、ProjectId 加字面量。
- 内容与代码分离：改简历只动 profile.ts。

### 2. 设计令牌纪律（tokens.css）

- 组件只许消费语义令牌（--ink-*、--line、--fg*、--accent…），禁止字面色值。
- 表面分级：--surface-alt 52% 白（半透明透出背景）/ 项目卡 68% / 入场按钮 88% 实白 / 吸顶导航 76% / 玻璃面板 66% + blur(18px)。
- 描边统一 1px 三档灰阶（rgba(20,56,88,.16/.26/.38)）。
- 圆角：2px / 4px / 8px / 999px 只给胶囊圆点。**大圆角是模板感重灾区。**
- 强调色暖橙 #d9762f 只用在状态点、焦点环、激活下划线、hover 微光；永远不大面积填色。
- 主题只有一套（白昼）：换整幅晴空画后深色主题互斥；对比度由面板（白纱 + 实白卡片）承担，不由文字色承担。

### 3. 3D 立方体舞台

- 纯 CSS perspective + rotateX；滚动量 → 旋转角，相邻两面在视口正中成 90°。
- 一屏一面硬约束：面高 100svh、.cube__slot overflow:hidden；排版预算按实测净空压缩。
- 面的锚点 id 只由舞台定位独占，面内 section 不得再写 id。
- 面内排版预算：正文带压到视口上方 66vh（.cube__slot .face-body padding-bottom: 34vh）；面内选择器必须带 .cube__slot 前缀防特异度覆盖。
- 每次翻面重播进出场：入场阶梯延迟封顶，出场统一 320ms。

### 4. 连续背景层 SkyStage

- 一个固定层四层合成：底图（静止）/ 云漂移（30s 横向呼吸）/ 列车精灵（40s 巡航一圈 142% 场景宽，悬停制动 0.46s、起步 2.1s，可拖拽）/ 淡天光。
- 几何常量与底图 meta.json 绑定：--sky-ar、--sky-hz、列车精灵百分比；换底图必须同步改。
- 列车位置单位是 px（内部换算），无单位 transform 会被静默丢弃。
- 列车命中判定是纯算术（层 pointer-events:none）。
- 云漂移 keyframes：恒等变换放中点、linear、infinite alternate；覆盖 scale ≥ 1 + 2×|位移|。

### 5. 交互细节

- 动态光标：精确小点 + 缓动细环，悬停可点元素放大 1.9×；原生光标只在首次 pointermove 后隐藏；隐藏靠 html.has-cursor 类；只在精确指针 + 非 reduced-motion 下启用。
- 手绘描边按钮：::before 画 1.5px 线套 SVG feTurbulence+feDisplacementMap 滤镜（scale 2.4）抖出手画感；滤镜只作用描边层；该段必须留在 base.css 末尾（防同特异度覆盖）。
- 点击光影：文档级 pointerdown 委托写 --fx/--fy，radial-gradient 暖光从点击处散开，animationend 摘类。
- 入场幕屏：localStorage 去重，任意键/点击进入；reduced-motion 直接跳过。
- 图标：手写内联 SVG（圆头、线宽 1.8、每枚一处强调色细节）；图标旁必有文字标签，叙事文字不图标化。

### 6. 性能与验收纪律

- 无常驻 rAF；滚动帧内不读布局；面内禁 backdrop-filter；动画只走 opacity/transform；用 contain: paint 代替 content-visibility。
- 安全构建：停 vite dev/preview → npm run build（看"✓ 构建完成"）→ dist/assets 搜新选择器确认。
- 动效验收要加像素级断言（定格两帧比较，防"做了但看不出来"）。
- 对比度验收：contrast 脚本跑分，最坏比不达标数须为 0。

## 坑（实测踩过）

- vite dev/preview 不停就 build → 最后一步 rename EPERM，dist 静默停旧版，易误判成功。
- 装饰层推到负 z-index 会跑到画后面（等于没生效）。
- 一句话 max-width 用 em 不用 ch（ch 对中文只有半个字宽）。
- --fs-hero 一行标题的上限由"最宽名字 × 字号 ≤ 列宽"倒推。
- 非 .cube__slot 前缀的面内选择器会被 .cube__slot .section 的 padding-block 简写盖掉。

## 产出标准

- 纯静态产物可直接托管任意静态平台；改令牌一个文件即可换肤。
- 全站体积参考：JS gzip ≈ 87KB、CSS gzip ≈ 10KB、首屏两图 preload ≈ 609KB。
