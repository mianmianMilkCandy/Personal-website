# 个人主页 · 云绵绵甜奶糖（Python 后端 / AI 应用开发）

暗色系、PC 优先的个人简历 / 作品集站点。React 19 + Vite 7 + TypeScript，纯静态，
无后端、无运行时依赖、无跟踪脚本。整站是一根 9 面棱柱，滚动即翻面。

---

## 快速开始

```bash
npm install        # 首次
npm run dev        # 开发预览 → http://localhost:5173
npm run build      # 产出 dist/
npm run preview    # 本地预览构建产物
```

**只想看效果（不碰 node）**：构建产物是纯静态的，任意静态服务都能起：

```powershell
python -m http.server 5174 --bind 127.0.0.1 --directory dist
# → http://127.0.0.1:5174
```

> 如果 `npm install` 报 `EPERM`，多半是环境限制而非项目问题，见文末「已知环境问题」。

## 页面结构

整站是**一根棱柱的 9 个侧面**（面表在 `src/App.tsx` 的 `FACES`，面数由数组长度决定）：

| 面 id（= 锚点） | 区块 | 说明 |
| --- | --- | --- |
| `#hero` | 首屏 | 整屏四角构图：左上字标 / 右上光标配色+玻璃控件簇 / 左下大标题+手绘按钮 / 右下玻璃卡（WELCOME）/ 底边 SCENE 行 |
| `#about` | 关于我 · 概览 | 六张能力贴纸 + 自述三段 |
| `#about-contact` | 关于我 · 联系 | 头像（`public/media/portrait.jpg`，缺图时回落成「云」字）+ 邮箱 / GitHub / 微信三行（手机号按作者要求不上站） |
| `#about-story` | 关于我 · 经历 | 时间线：两个项目 + 两项软件著作权 + 在读本科 |
| `#about-caps` | 关于我 · 能力 | 六组技能矩阵 |
| `#projects` | 精选项目 · 目录 | 索引面：列出每个项目（编号 / 名称 / 周期），点击落到对应详情面 |
| `#work-clean` | 项目一 · clean | C 盘清理工具（大卡片：视觉带 / 正文 / 指标 / 技术栈） |
| `#work-dca` | 项目二 · DeepCognitiveAgent | AI 学习与推理项目集 |
| `#contact` | 收尾页 | 整屏留白收尾，只留「发邮件」一个动作 |

> **为什么项目区要单独有一个"目录面"**：一张项目详情卡实测约 1080px 高，
> 而面高恰好一屏（常见 900px）且面是 `overflow: hidden` —— 两张卡塞进同一面
> 会被从底部硬切。所以一面只放一张卡，动手前先读 `Cube.css` 里
> 「一屏装不下 = 内容被静默切掉」那一节的实测数字。

## 目录结构

```
├── index.html
├── vite.config.ts          base: './'，产物可放任意子目录；构建期注入 meta CSP
├── tsconfig*.json          strict 模式，三份配置（root / app / node）
├── .gitattributes          统一 LF，避免跨平台整文件 diff
├── CODE-REVIEW.md          第一轮代码审查（分级 + 证据 + 未审范围）
├── PERF-REVIEW.md          第二轮：代码审查 + 性能实测 + 整体评分
├── UI-REVIEW.md            视觉层审查与截图核对
├── docs/perf/              实测原始数据（JSON）与版面/像素对账记录
├── scripts/
│   └── build.mjs           安全构建：失败不破坏上一版 dist/
├── public/
│   ├── _headers            完整安全响应头 + 缓存策略（能读它的托管平台生效）
│   └── media/              ← 全部画作素材（见上方素材表）
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── styles/
    │   ├── tokens.css      ← 设计令牌，改配色/字号/间距只动这里
    │   └── base.css        reset + 布局原语 + 按钮 + 入场动效
    ├── data/
    │   ├── profile.ts      ← 个人信息（姓名、联系方式、经历、能力）
    │   └── projects.ts     ← 项目内容
    ├── lib/
    │   ├── asset.ts        资源路径拼装（asset / assetUrl 的区别见文件注释）
    │   ├── clickShine.ts   按钮点击光影（文档级事件委托）
    │   ├── smoothAnchors.ts 平滑滚动只给锚点跳转（滚轮保持原生瞬时）
    │   ├── cube.ts         立方体舞台驱动：滚动 → 旋转角 + 面内相位
    │   ├── sectionArt.ts   区块背景画 → --sec-art
    │   ├── stagger.ts      阶梯延迟（必须封顶，否则后面的元素像卡住）
    │   └── revealObserver.ts  全站共用的单一 IntersectionObserver
    ├── hooks/
    │   ├── useActiveSection.ts  导航高亮
    │   ├── useLocalTime.ts      每秒时钟（只允许被 LocalClock 使用）
    │   ├── useTheme.ts          主题（模块级外部 store）
    │   ├── useCursorColor.ts    光标配色（同上）
    │   └── useCopy.ts           复制到剪贴板 + 反馈
    └── components/         每个组件自带同名 .css
        ├── Cube              立方体舞台（track 提供滚动距离 + fixed 舞台 + 9 个面）
        ├── Nav / Hero / About / Projects / Closing
        ├── LocalClock        秒级时钟的叶子节点（防止首屏每秒重渲染）
        ├── DynamicCursor     动态光标（收敛后主动停 rAF）
        ├── CursorTint        导航里的光标配色控件
        ├── Icon              手写内联 SVG 图标集（+ 贴纸底 .tile）
        ├── EntryGate         首次访问的入场幕屏
        ├── SectionHead      全站统一区块抬头
        ├── Reveal           滚动入场包装器
        └── DevNotice        仅 DEV 显示的占位内容清单
```

## 需要你填的内容

> **后期改简历 / 简介 / 经历 / 技能 / 联系方式，只需要动两个文件 —— 不用碰任何组件：**

| 想改什么 | 改哪个文件 | 对应字段 |
| --- | --- | --- |
| 姓名、英文名、职位、一句话定位 | **`src/data/profile.ts`** | `name` / `nameEn` / `role` / `roleEn` / `tagline` |
| 首屏大标题、专注领域、所在城市 | 同上 | `heroGreeting`（当前未使用）/ `focus` / `location` |
| 邮箱、电话、GitHub / 微信 | 同上 | `email` / `phone` / `socials[]` |
| 简历 PDF 下载按钮 | 同上 | `resumeUrl`（把 PDF 丢进 `public/`，填 `'./resume.pdf'`；留空则按钮不出现） |
| 「关于我」正文（2–3 段） | 同上 | `bio[]` |
| 工作 / 项目经历时间线 | 同上 | `timeline[]`（`period` / `org` / `role` / `detail`） |
| 技能矩阵（能力 / Capabilities） | 同上 | `capabilities[]`（`group` + `items[]`） |
| 精选项目卡片（含要点、指标、技术栈、链接） | **`src/data/projects.ts`** | `projects[]`，同时要在 `src/components/Projects.tsx` 的 `PROJECT_FACES` 里补一行（面 id ↔ 数组下标），`App.tsx` 的 `FACES` 会自动展开 |
| 头像照片 | 不用改代码 | 把图片存成 `public/media/portrait.jpg` 即自动生效，失败时回落到 `portraitFallback` 字母（现为「云」） |

**当前资料状态**：真实信息已全部填入（云绵绵甜奶糖的简历），头像也已就位。仍带自动回落的两项：

- **手机号** —— 按作者要求**不上站**。`profile.phone` 是空字符串，关于区那行会被
  `About.tsx` 里的 `.filter()` 整行剔掉，所以页面上不会出现「电话 / —」的死条目；
  哪天想放上去，填上 `profile.phone` 那一行就自动回来。
- **简历 PDF** —— `resumeUrl` 留空，按钮不渲染。

**头像已就位**：`public/media/portrait.jpg`（4:5，900×1125，141 KB）。
换图直接覆盖这个文件即可，不用改代码；想换回字母占位就删掉它
（`About.tsx` 的 `<img onError>` 会回落到 `profile.portraitFallback`，现为「云」）。

`profile.ts` 顶部的 `UNFILLED` 数组**已清空** —— 开发模式左下角那条
「占位内容 N 项」提示条随之消失（`App.tsx` 判的是 `UNFILLED.length > 0`）。

素材只需按文件名丢进 `public/media/`，**不用改代码**：

| 文件名 | 用途 | 规格 / 体积 |
| --- | --- | --- |
| `hero-cat.webp` / `.jpg` | **横版首屏画作**（台阶上的猫，宽屏用） | 2.02:1 · 208 KB / 354 KB |
| `hero-cat-portrait.webp` / `.jpg` | **竖版首屏画作**（同一张图的竖取景，猫居中） | 0.67:1 · 164 KB / 272 KB |
| `ambient-portrait.webp` | **整页氛围层**小图 | 160px 预糊 · **1.7 KB** |
| `ambient-blur.webp` | 入场幕屏背景小图 | 160px 预糊 · **0.7 KB** |
| `sec-about.webp` | 「关于我」区块背后的画（回廊·横） | 1000px · 81 KB |
| `sec-projects.webp` | 「精选项目」区块背后的画（回廊·竖） | 800px · 142 KB |
| `sec-closing.webp` | 收尾页背后的画（临海石台·竖，回廊尽头看海） | 800px · 95 KB |
| `card-01/02.webp` | 两张项目卡的画面（分别对应 clean 与 DeepCognitiveAgent） | 900×506 · 50 / 88 KB（惰性加载） |
| `card-03.webp` | **已不再引用**（原第三张占位卡已删除）；文件留着备用，删除安全 | 900×506 · 63 KB |
| `portrait.jpg` | 关于区块头像（已就位） | 4:5 · 900×1125 · 141 KB（原图 940×940 方图，居中偏左裁成 4:5 再缩放） |
| `hero-loop.mp4` | 首屏背景**视频**（可选增强） | ⬜ 可选 · 1920×1080，8–15 秒循环，**≤ 4 MB** |

**首屏实际下载量** = 横版 WebP 208 KB + 氛围层 1.7 KB ≈ **210 KB**
（竖屏 164 KB；JPEG 只在浏览器不支持 WebP 时才拉）。
区块画作与卡片画面都是滚动到才加载。

> ⚠️ **区块画作与卡片画面的质量压得比首屏低得多**（q56 / q64），
> 因为它们最终只有 ~20% 可见度或被色调薄膜盖住 —— 细节根本看不见。
> 这一条把三张区块背景从 549 KB 压到了 318 KB，是纯赚。
> **但首屏那张不能照这个档位做**，它是全屏可见的。

> **首屏那张 WebP 现在用 q68（原为 q78）**，依据是一次实测标定：
> q78 → 258 KB / q68 → 208 KB（−19.6%），两者在最高频的猫 / 石阶区域
> 以 2 倍最近邻放大对照看不出差别（平均绝对误差 3.1/255，99 分位 17/255）。
> 再往下压（q56）只多省 7%，但大片云与天空的渐变里开始出现可辨的块状噪声。
> **这张画是 LCP 的主要成本，也是唯一值得单独调质量档的文件**；
> 上限不要低于 68 —— 它会被 `cover` 放大 1.1~1.45 倍铺满视口，压缩噪声会一起放大。

**响应式画作**由 `<picture>` 的媒体查询完成，每个断点都配 WebP + JPEG 两条：

```
(max-width: 900px) 或 (max-aspect-ratio: 1/1)  →  竖版
其余                                            →  横版
```

非 WebP 浏览器会跳过 `type` 不匹配的那条，落到**同取景的 JPEG**上，
而不是掉回横版被硬裁 —— 这是这份 fallback 链的关键。

所有素材都由 `_repo/img/prep3.py` 生成（首屏横/竖版、三个区块背景、三张卡片画面、
整页氛围层；`prep.py` / `prep2.py` 是前两轮的旧脚本，已被 prep3 取代），
换图时重跑即可。首屏两张 WebP 的质量档是脚本顶部的 `HERO_Q`。

**图层优先级**：背景图永远是底 → 视频若存在则播起来后淡入盖住图 → 两者都失败才出 CSS 动态底。
所以「没放视频」不是缺失，只是没有那层增强。

> ⚠️ 视频是**显式开关**，不是"放了文件就自动生效"：
> `Hero.tsx` 顶部的 `HERO_VIDEO_FILE` 默认为空字符串，此时**根本不渲染 `<video>`**。
> 原因是不存在该文件时，浏览器仍会为它发一次必定 404 的请求
> （`preload="metadata"` 也会真的去拉），白占一次往返并在控制台留错误。
> 要用视频：把文件放进 `public/media/`，再把 `HERO_VIDEO_FILE` 改成 `'media/hero-loop.mp4'`。

视频转码参考（可选）：

```bash
ffmpeg -i input.mp4 -t 12 -an \
  -vf "scale=1920:-2,fps=30" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 30 \
  -movflags +faststart hero-loop.mp4
```

`-an` 去掉音轨（背景视频不需要声音，也避免自动播放被浏览器拦截）；
`+faststart` 把元数据前置，实现边下边播。

> 注：`public/` 下的所有文件都会原样发布到线上，所以别把内部说明文档放在那里。
> 换掉背景图时记得同步删掉旧的 `hero-ghibli.*`，否则会一起发布。

## 设计约定（改样式前请先读）

方向是「**宫崎骏的黄昏绘本 × 工程师的仪表盘**」：
画面负责"童心"，控件（发丝线、等宽元数据、编号）负责"克制与可信"。靠三条纪律维持：

1. **近黑分级 + 发丝描边**。底色不用纯黑，靠 `--ink-1000 … --ink-500` 分级造深度；
   边界一律 `1px solid var(--line)`。不用大圆角、不用大投影。
2. **单一强调色，且只用在微观细节**。`--accent` 只允许出现在状态点、焦点环、
   激活下划线、hover 微光上，**永远不做大面积填色或渐变背景**。
3. **元数据用等宽字体**。所有编号、标签、数值走 `.mono`（JetBrains Mono，大写 + 字距）。

> ⚠️ **组件里不许出现字面色值**。所有颜色、遮罩、玻璃层都必须走语义令牌，
> 否则切主题（`dusk` ↔ `day`）必然错色。自检命令（**递归写法**）：
> ```powershell
> Get-ChildItem src -Recurse -Filter *.css |
>   Select-String -Pattern 'rgba?\(|#[0-9a-fA-F]{3,8}\b' |
>   Where-Object { $_.Filename -ne 'tokens.css' }
> ```
> 只应命中 `@supports (-webkit-text-stroke: 1px #000)` 与 `mask-image` 里的 `#000`。
>
> 💡 别写成 `Select-String -Path src\**\*.css`：PowerShell 的 `**` 只当作**一层**目录，
> 那个写法会漏掉 `src/App.css`（本轮审查实测：13 个 CSS 文件里少扫 1 个）。

## 主题（dusk / day）

两套主题只差 `tokens.css` 里的一层令牌覆盖，**组件一行都不用改**。

| 主题 | 基底 | 强调色 | 画面处理 | 定位 |
| --- | --- | --- | --- | --- |
| `dusk`（默认） | 深靛蓝 `#0a1220` | 黄昏金光 `#f0b357` | 轻微压暗，左侧加渐深 scrim 供文字落脚 | 保住"暗色克制"，画面亮部留给右侧 |
| `day` | 奶油纸 `#f8f1e2` | 天青蓝 `#2f7fb8` | 提亮增饱和，画面全亮 | 彻底的绘本/童心 |

导航右上角有切换开关，选择记在 `localStorage`。

- **改默认主题**：`src/hooks/useTheme.ts` 里的 `DEFAULT_THEME`，
  以及 `index.html` 内联脚本里的两处 `'dusk'`（三处要一致）。
- **防闪烁**：`index.html` 里那段内联同步脚本在样式生效前就把 `data-theme` 写到 `<html>` 上，
  所以不存在"先闪一下另一个主题"。**别把它改成模块**（模块是延迟执行的）。
- **新增主题**：只需在 `tokens.css` 里加一个 `[data-theme='xxx']` 覆盖块。

### 改配色

只动 `src/styles/tokens.css`。切换强调色改这几个值（`dusk` 与 `day` 各一套）：

```css
--accent: #f0b357;          /* 强调色本体：按钮填充、指示器 */
--accent-hover: #f7c877;
--accent-deep: #c2862c;
--accent-glow: rgba(240, 179, 87, 0.16);   /* 微光 / 辉光 */
--accent-line: rgba(240, 179, 87, 0.38);   /* 强调色描边 */
--accent-text: #f8cf8c;     /* 深底上的可读文字色 */
```

### 背景图调色与首屏合成

首屏的观感由三个令牌控制，都在 `tokens.css` 里：

```css
--hero-img-filter: saturate(1.08) contrast(1.04) brightness(0.88);  /* 图片自身调色 */
--hero-scrim: linear-gradient(100deg, ...);   /* 左深右透：文字落脚在暗面 */
--hero-veil: linear-gradient(180deg, ...);    /* 上下压暗：与导航/底栏衔接 */
```

**构图约定**：这张画的信息密度在右侧（石屋、花盆、三只猫），所以
首屏文字一律左对齐、压制在左半侧；`object-position: 62% 46%` 保证右侧亮部完整可见。
换图时如果主体在左边，要把 `--hero-scrim` 的方向和 `object-position` 一起改。

### 水印

原图右下角有「即梦AI」水印，已在预处理时**连底部一起裁掉**（1080 → 923，成 2.08:1）。
预处理脚本留在 `_repo/img/prep.py`（该目录已 gitignore），换图时可以复用它的取色与裁切逻辑。

## 首屏版式（整屏，版式对齐参考站）

**恰好一屏**，四角分工，中间留白全给画面：

| 位置 | 内容 | 实现 |
| --- | --- | --- |
| 左上（固定导航） | 点 + 字标（`NAME / ROLE`） | `Nav.tsx` 的 `.nav__brand` |
| 右上（固定导航） | 光标配色胶囊 + 玻璃控件簇（SCENE 场景/主题切换）+ 胶囊 CTA | `Nav.tsx` 的 `.nav__cluster` |
| **左下** | **大标题（一行：「{名字}的主页。」）** + 一句话 + 手绘高透明按钮行（`向下滚动进入` / `Scroll Down`） | `Hero.tsx` 的 `.hero__lead` |
| **右下** | 玻璃卡，标签是 `WELCOME`（姓名 / 职位 / 坐标 / 专注），底色 72% 透明 | `Hero.tsx` 的 `.hero__card` |
| **最底边** | `SCENE 01 · 主题 · UTC+8 时钟`（网格第二行，横跨整行） | `Hero.tsx` 的 `.hero__scene-row` |

正文（关于我 / 项目 / 联系）从滚动之后开始，中间由 `<Seam size="lg" />` 过渡。

> 版式演进记录：先做过「两屏海报结构」（第一屏只有标题，PROFILE 卡推到第二屏），
> 后按"最上方主页排版参考我给的图片"改回**整屏四角构图**；再按用户反馈删掉
> 标题上方的眉标、删掉标题第一行「欢迎来到，」（那层意思挪到卡片的 `WELCOME` 标签上），
> 并把 `SCENE` 行从正文流里提到首屏最底边。

三条关键约束：

1. **大标题字号 `--fs-hero` 是全局最敏感的旋钮**（现为 `clamp(2.1rem, 5.2vw, 6rem)`）。
   参考站其实只有约 2.5vw，是按"更凸显标题"的要求放大的；上限 6rem 的来由是
   **一行 8 个汉字 × 6rem = 768px 不超过左侧文案列（宽屏 ≈880px）**，名字再长就会折行。
2. **标题末尾的句号是唯一的彩色标点**（`.hero__title-dot`）。
3. **`.hero__media` 只能覆盖首屏那一屏**，不能让画面铺满整个 `.hero` —— 否则容器纵横比一高，
   `object-fit: cover` 会把 2.08:1 的横画切成一条竖缝。

**这张画（台阶上的猫）的取景依据**：实测左三分之一是石阶（亮度 88.7）、
右侧是亮云海（170.6），所以文字压左侧几乎不需要额外加暗，`object-position: 50% 45%`。

## 立方体舞台（当前形态）与接缝折痕（降级形态）

> **2026-10-09 起，整站不再是"一叠长区块"，而是"一根棱柱的九个侧面"。**
> 页面结构、几何约束与调参旋钮见 `src/lib/cube.ts` 顶部说明与 `src/components/Cube.css`；
> 面表在 `src/App.tsx` 的 `FACES`。滚动量 → 绕视口水平中轴的旋转角，相邻两面在
> 视口正中成 90° 棱。**面高必须恰好一个视口高**，所以四个内容撑高的版块被重新
> 分页成 9 个一屏一面的"屏"（内容一条没删）。

整站**每个章节背后压的都是不同的画**（都由 `--sec-art` 传入，见 `src/lib/sectionArt.ts`）：

| 章节 | 画作 |
| --- | --- |
| 首屏 `#hero` | 台阶上的猫（横/竖两版，按视口切换）—— 原图 7 |
| 关于我（4 面）`#about` | 回廊（横）—— 原图 5 |
| 项目目录 + 两个项目（3 面）`#projects` | 回廊（竖）—— 原图 6 |
| 收尾 `#contact` | 临海石台（竖）—— 原图 4 |

原图副本在 `_repo/img/src/`（已 gitignore），派生脚本是 `_repo/img/prep3.py`：
**换图 → 把新图丢进 `_repo/img/src/` 并改脚本顶部的 `SRC` → 重跑**，
不要手改 `public/media/` 里的派生文件。图 1（横版临海石台）保留在脚本里作备用。

### 两条面内硬纪律（都踩过，别再犯）

**① 面内一律不做 `backdrop-filter`。** 面一直在转，带模糊的元素等于要求合成器
每一帧重新采样它背后的整片内容并重做高斯模糊，还会把这一层踢出栅格缓存。
所以玻璃质感只留在**不转的地方**：固定导航（`.nav.is-stuck`）与入场幕屏。
面内的 `.hero__card` / `.pill--quiet` / `.btn--ghost` / `.glass` 由 `Cube.css` 里
那一条统一关掉模糊。想要模糊回来就删掉那一条，代价是翻面掉帧。

**② 面内内容必须一屏装得下，而"装不下"不会报错。** `.cube__slot` 是
`overflow: hidden`，超出的部分被静默从底部切掉。`Cube.css` 里那组压过的
`--sp-*` 与 `.timeline__item` / `.project__visual` / `.closing__*` 的间距，
是 `_repo/perf/overflow.mjs` **逐面量出来的**（原始溢出 36 / 27 / 60 / 16 px
→ 现在全部 0）。加内容之后请重跑那个脚本，不要凭肉眼判断。

> `Seam.tsx` / `--seam-*` 令牌**保留但已不被引用**：它们是"关掉 3D"时的降级落点
> （棱柱承担过渡之后，折痕就没有存在的理由了）。下面这一段仍然成立，供降级时使用。

**两个关键技术点**：

1. **画必须淡到只当"纸纹"**。走独立图层（`.has-art::before`）而不是 `background`，
   就是为了能用 `--sec-art-opacity`（dusk 0.2 / day 0.26）控制可见度。
   直接当背景用会让正文完全读不清。
2. **交界处不要用"遮盖带"**。原先 `Seam` 是「透明 → 半透明 → **不透明** →
   半透明 → 透明」的五段渐变，想把两张画的硬边盖住；逐行量截图后发现它自己
   就是"不协调"的来源：两端透明会露出更亮的 `.page-bg`（dusk 0.3 的不透明度
   把底色从 17 抬到 48.7），中段又是不透明的 `ink-900`（18.3），而两侧分别
   是首屏底 15.2 与关于区 52.6 —— 于是交界成了「暗 → 亮线 → 更暗 → 亮线 →
   中亮」的条码，而且接缝是整页纵向节奏里唯一一块不透明表面。

   现在的分工是：

   - **过渡交给画自己**：`.has-art::before` 两端用 `mask-image` 按 `--art-fade`
     淡出/淡入，两张画"淡出 → 淡入"地交叉，中间只剩背景，不存在谁盖谁。
   - **`Seam` 只画折痕**：一条两端淡出的 1px 发丝线（`--seam-line`）+ 下方
     一小段折影（`--seam-shadow`，dusk 0.24 / day 0.18 —— 0.5 会在暗底上砸出
     一道 -45 的硬降，等于换了个新横条）。`lg` 档（首屏→正文）额外用不透明的
     `--seam-ramp` 接住首屏底部那层暗。
   - **`--seam-ramp` 直接复用 `--hero-bottom`**（= 首屏 `--hero-veil` 的终点），
     同一个令牌、两处消费，所以交界落差恒为 `(1-α)×(两侧底色之差)` ≈ 1，
     不随主题或画作漂移。**不要**再给折痕单独猜一个色去配首屏底。
   - **首屏那张画也必须压住底部**：`--hero-veil` 在 86% 处要有一站 0.86，
     否则画底（亮云、植物）会留下一条"画面到此为止"的切边 —— 实测只留
     「透明@54% → 0.94@100%」时 sd 仍有 33（有结构），加上 0.86@86% 后降到 1.5。
   - **区块表面色也要两端淡出**（`.section--alt`、`.closing` 的顶端）：
     表面色在区块边界处阶跃本身就是硬边（58% 的近黑压下来有 -18 的落差）。
     淡出端用 `--surface-*-0`（相对颜色语法做的零透明版本），并配一条纯色兜底。

新增区块时，记得在 `App.tsx` 的区块之间插一条 `<Seam />`，并给区块加 `has-art` 类
与 `style={sectionArt('xxx.webp')}`。

> 注意 `.has-art > *` **没有**用通配符抬 z-index —— 那会误伤 `.closing__glow`
> 这类负 z-index 的装饰层。只显式列了 `.shell` / `.closing__inner` / `.closing__foot`。

## 动态鼠标光标（`src/components/DynamicCursor.tsx`）

一个精确的小点 + 一个缓动跟随的细环：点在指针上不缓动（承担"我到底指在哪"），
环滞后跟过来（承担"手感"），悬停到可点元素时环放大 1.9× 并填一层极淡的强调色底。

**三条安全设计**，都关系到"不能把用户的鼠标弄丢"：

1. **原生光标只在第一次 `pointermove` 之后才隐藏。** 如果挂载时就 `cursor: none`，
   而用户还没动过鼠标，就会出现"原生没了、自定义也没定位"的一瞬 —— 看起来像光标丢了。
2. **隐藏靠 `html.has-cursor` 这个由 JS 加上的类，不写死在 CSS 里。**
   JS 没跑起来或组件报错时，原生光标原样保留，不会出现"页面上没有鼠标"。
3. **只在精确指针 + 非 `prefers-reduced-motion` 下启用。** 触屏没有光标；
   晕动敏感的用户不该被一个跟动的环追着。

位置与缩放全部 rAF 直接写 DOM，不进 React state（否则每帧一次重渲染）。
`z-index: 95` 必须是全站最高层 —— 光标被任何东西盖住都会瞬间显得"坏了"。

> 演进记录：这里原本是「跟随光标的小猫」（手绘橘白猫 SVG，蹦跳/压扁/摆尾/眨眼，
> 导航栏带开关）。按要求**改为动态光标**，小猫相关组件与开关已全部移除；
> 图标集里的 `cat` 图标保留（首屏 PROFILE 标签与 GitHub 社交图标仍在用）。

## 进出场动画（全站，可重复）

> **2026-10-09 起，动画是"每次换面都重播一遍"的进出场，不再是"只播一次的入场"。**
> 页面在这里就是立方体的面（`App.tsx` 的 `FACES`），所以"页面变动" = 面的转进与转出。
**一、面内内容的相位由立方体驱动（这是主路径）**

`src/lib/cube.ts` 每个滚动帧推导一次，把结果写在**槽位**上：

| `data-state` | 含义 | CSS 侧（`Cube.css`） |
| --- | --- | --- |
| `in` | 这一面正对镜头 | `.cube__slot[data-state='in'] .reveal { opacity: 1; transform: none }` |
| `out` | 正在转走 / 还没转进来 | 退回起始位姿；时序换成 `--dur-2` + 0ms |

- **为什么挂在槽位上、不逐个元素挂**：舞台是 `position: fixed`，元素级的
  `IntersectionObserver` 会在首帧把九个面同时判成"在视口里"；而且它看不见
  "这一面转走了"。槽位状态一次写入，面内**所有**内容（含没包 `Reveal` 的那几处）一起响应。
- **阈值**：`CONTENT_EXIT_AT = 0.25` / `CONTENT_ENTER_AT = 0.75`（见 `lib/cube.ts` 顶部）。
  出场在面转出约 22° 时开始、进场在面快转正（约 22°）时开始，于是 620ms 的入场
  正好落在"面落定"这段。**代价是中间那两个面都没有正文**（只剩画面与版面）——
  停在半步中间就是"两个空面"，这是刻意的：旋转中段本来就是几何过渡帧。
  想让正文一直留着，把两个阈值都往 0.5 推。
- **时序契约**（改 CSS 前必读）：`transition-*` 取的是"变化**之后**"那份样式，所以
  入场用 `.reveal` 自己的 `--dur-3`（620ms）+ `--reveal-delay`（阶梯），
  出场用 `[data-state='out']` 给的 `--dur-2`（320ms）+ 0ms（同时退场，不排队）。
  **`[data-state='in']` 那条不要写 `transition-duration`**，否则出场时序会把入场顶掉。
- **首帧要延一帧再写相位**：同一帧里既插进 DOM 又加状态，浏览器只算一次样式，
  元素会直接以最终状态出现、620ms 的入场直接没有。
- **入场幕屏**：幕屏还在（`.gate` 在 DOM 里）时首屏相位保持 `out`；幕屏卸载后
  广播一次 `site:entered`（`EntryGate.tsx`），首屏这才入场 —— 否则整段动画都在
  门后面放完了。判据：点门前 `hero st=out rev=0/4`，点门后 `hero st=in rev=4/4`。

**二、没包 `Reveal` 的那几处（各自吃相位，选择器都以 `.cube__slot` 开头）**

| 元素 | 进场 | 出场 |
| --- | --- | --- |
| 首屏画 `.hero__media`（`Hero.css`） | `animation: heroCurtain`：从 35% 亮度 + 推近 → 全亮归位，延迟 100ms | 压回 35% + 推近（**不淡到 0**） |
| 卡片抬头 `.project__head` | 从上方 8px 落下，延迟 60ms | 退回 |
| 卡片视觉带 `.project__visual-wipe` | `transform: scaleX(0 → 1)`（外层静态裁切）从左往右擦开 | 反向擦掉 |
| 收尾页脚 `.closing__foot` | 上浮 16px，延迟 260ms | 退回 |

- 首屏画**故意用 `animation` 而不是 `transition`**：要能重播（类名每次重新匹配都会
  从头播），而 `from` 的位姿与基态完全一致所以重播不跳变。
- 首屏画**故意不淡到 0**：其它面的画（`--sec-art`）在转走时是留在面上的，只有它是
  DOM 里的真图层；淡到 0 会让脊线位置的上半屏变成一块纯黑（实测截图确认过）。
- 这几条以 `.cube__slot` 开头是有意的：**拆掉 3D 走降级路径时它们不匹配任何元素**，
  首屏画与页脚自动回到"始终可见"，不会黑屏。

**三、不在立方体里的 `.reveal`（降级路径）**

`src/lib/revealObserver.ts` 里那一个 `IntersectionObserver` 仍然管这种元素，
而且**两个方向都管**：进视口加 `is-in`、离开视口摘掉 `is-in` 并挂 `is-out`
（`base.css` 的 `.reveal.is-out` 把出场换成 320ms + 不排队）。
立方体里的元素直接跳过观察器（交给上面的槽位相位）。

> **这里原先还挂着一个 `setTimeout(revealIfInView, 700)` 兜底，2026-10-09 已删除。**
> 它是一次"睡 700ms 再统一量一遍"的轮询：每个元素都要多付一次跨帧的强制布局，
> 而它想兜住的场景（字体/图片把元素挤进视口）本来就由 IntersectionObserver
> 自己的回调覆盖 —— 观察器只在"相交状态变化"时回调，布局变化引起的也算。
> 首屏那批元素仍由挂载时的 3 帧几何检查处理（每个元素一次 `getBoundingClientRect`，
> 同时读上下两个判据，不分两次读）。

> `is-out` 是**独立一个类**，不要图省事写成 `.reveal:not(.is-in)` —— 立方体里的
> `.reveal` 从来没有 `is-in`（相位挂在槽位上），`not(.is-in)` 会把五十多个元素的
> 入场时序一起降成 320ms 并丢掉阶梯延迟。这个坑踩过一次。

**四、通用的三条**

- **统一的包装器**：`src/components/Reveal.tsx`，`variant` 支持
  `up | left | right | fade | scale`，`delay` 控制阶梯。只做位移 / 透明度 / 极轻缩放，
  全部走合成层，不触发重排。
- **阶梯必须封顶**：`src/lib/stagger.ts` 的 `stagger(i, step, max)` ——
  第 12 个元素若按 70ms 递增要等 840ms 才出现，用户早滚过去了，看起来像卡住。
- **覆盖范围**：区块抬头的三部分（编号/标题/注释各自入场）、四张能力贴纸、
  头像、每一行联系方式、自述每段、每条经历、每行能力、每张项目卡、每条项目要点、
  每个指标、每个技术标签、收尾页的每个社交链接。
- **`prefers-reduced-motion: reduce`** 下全部退化为直接显示；`.cube__slot .reveal`
  也进那条覆盖（它们在立方体里没有 `is-in`），且不注册观察器。

新增需要进出场动画的元素，包一层 `<Reveal>` 即可；同组用 `stagger(i)` 生成延迟。
想让它**在面外时也参与**（像首屏画那样），就不包 `Reveal`，直接在自己的 CSS 里
写 `.cube__slot .xxx` / `.cube__slot[data-state='in'] .xxx` 两条。

> 目前**没有**做"切主题时重播一遍"：主题切换（SCENE 01/02）不改相位，所以内容不会
> 闪一下再回来。要加就在 `useTheme` 的切换处广播一个事件、由 `cube.ts` 重跑一次
> 当前面的相位（需要先无过渡地退回 `out`、强制一次样式计算，再写 `in`）。

## 图标系统（`src/components/Icon.tsx`）

需求是"把文字多的内容换成能概括的、形象的、可爱的漫画风图标"。做法：

- **全部手写内联 SVG**，零图片请求、零图标库依赖，颜色走 `currentColor` 自动跟随主题。
- **可爱但不幼稚**的三条做法：圆头圆角 + 线宽 1.8；每枚图标带一处**强调色细节**
  （`.i-accent`，跟着主题变色）；优先装进 `.tile` 贴纸底（圆角方块 + 暖色微光 + 右上角小闪光），
  hover 时轻轻歪 5°（幅度刻意压小）。
- **图标只做加速器，不做唯一信息载体**：所有图标旁边都有文字标签，
  不做纯图标无标签的导航 —— 为了可爱牺牲可读性是亏的。

图标用在：区块抬头编号、联系方式（邮箱/电话/微信/GitHub）、能力分组、
项目指标、收尾页社交链接、首屏 SCENE 标签与动作按钮。

> **哪些文字没有被图标化，以及为什么**：自述正文、经历描述、项目要点这三处是**叙事内容**，
> 是招聘方真正读的东西。把它们换成图标会让"你做过什么"变得无法传达 ——
> 所以图标只用来概括**标签类与枚举类**内容，叙事文字保持文字。
> 新增图标：在 `Icon.tsx` 的 `GLYPHS` 里加一条路径 + 在 `IconName` 联合类型里加个名字即可。

## 入场幕屏（`src/components/EntryGate.tsx`）

参考站第二张图那种"进入网站 / ENTER SITE"的模糊幕屏。

**必须说清的代价**：这是全站唯一"多一次点击才看到内容"的设计。对求职简历站来说，
它天然是转化杀手。所以做了三层缓解：

1. **只对首次访问者显示**（`localStorage` 记 `site-entered`）；
2. 点击 / 任意键 / ESC / 点按钮都能进；
3. `prefers-reduced-motion: reduce` 时**直接跳过**，不挡路。

**彻底关掉**：删掉 `src/App.tsx` 里的 `<EntryGate />` 一行即可，其余代码不依赖它。
背景复用整页氛围层那张 **0.7 KB** 的小图（它本来就是糊的），所以这层几乎不增加下载量。

## 无障碍与性能

- 全部入场动效只做 `opacity` + `translateY` / `scale`，并遵循 `prefers-reduced-motion: reduce`
  （该设置下直接显示，不注册观察器，锚点跳转也不做缓动）。
- 键盘可用：跳转主内容链接、`:focus-visible` 强调色焦点环、复制按钮带 `aria-label`、
  导航当前项带 `aria-current`。
- 滚动监听全部用 rAF 节流，进度条与视差直接写 DOM 属性，不触发逐帧重渲染。
- 项目卡的视觉带与首屏降级底仍是纯 CSS 生成；全站**只有首屏那一张背景图**是图片请求
  （WebP 优先 + JPEG 兜底 + `rel=preload`），且视频是可选增强。全站无第三方 JS。

### 六条性能硬纪律（2026-10-09 第三轮定下）
1. **不得引入常驻动画循环。** 秒级时钟是独立叶子组件（`LocalClock.tsx`）；
   动态光标在"环追上点、缩放收敛"之后**会主动停掉 rAF**（`render()` 的返回值决定
   是否续帧）。判据：空闲 1 秒内**页面自己**申请的 rAF 应为 **0** 次（实测 0，
   改之前是 121 次/秒）。
   > ⚠️ 收敛判据里**不能写 `rx !== px` 这种严格比较**：缓动是浮点乘法，永远不会
   > 正好落在整数坐标上，循环就永远停不下来。必须带容差（`SNAP_EPSILON`）。
2. **不要在文档根上写 `scroll-behavior: smooth`。** 它会给鼠标滚轮的每一格都套一层
   缓动追赶，还会和 `lib/cube.ts` 的滚动驱动打架（旋转角读 `window.scrollY`，
   被缓动拖住时角度跟不上指针）。平滑滚动只留给锚点跳转 —— `lib/smoothAnchors.ts`
   用文档级委托在点击 `href="#…"` 时显式 `scrollIntoView({behavior:'smooth'})`。
3. **不要在滚动帧里读布局。** `lib/cube.ts` 不每帧读 `stage.clientHeight`、
   `Nav.tsx` 不每帧读 `documentElement.scrollHeight`（两者的值都缓存起来，
   只在 resize / ResizeObserver 回调里重量）。"写完样式马上读几何"会让浏览器
   当场重算整篇布局，每个滚动帧白付一次。
4. **面内不做 `backdrop-filter`**（理由与范围见 `Cube.css`）；**不要 `transition`
   那些会引起重绘的属性**：`backdrop-filter` / `box-shadow` / `letter-spacing` /
   `clip-path` / `width`。要"擦开"就用静态裁切 + `transform: scaleX`
   （`.project__visual-wipe` 就是这么改的）。
5. **不做"每帧重画一整层"的效果**。原先的鼠标跟随聚光
   （`.hero__spotlight`：全屏 `radial-gradient` + 每帧改 `--mx/--my`）与首屏视差
   都踩在这条上 —— 前者已删除，后者改成把 `--parallax` 写在 `<img>` 自己身上
   （只动它自己的合成层，不牵连父层与 2000px 大图的重栅格化）。
6. **面内内容必须一屏装得下**，而"装不下"是静默切掉（见上文那两条硬纪律）。

### 实测工具（都在 `_repo/perf/`，已 gitignore，仅本地）

| 脚本 | 回答什么问题 |
| --- | --- |
| `audit.mjs` | 空闲 rAF 归因 / 逐面滚动帧预算（p50·p95·max·>32ms 帧数，并归因到"跨面瞬间"还是"静止期"）/ 悬停帧率 / 长任务 / 控制台错误（**带 URL**）/ **交互自测**（面表、锚点、主题切换、内容渲染、占位徽标） |
| `overflow.mjs` | 哪一面被 `overflow: hidden` 切掉了什么（`--try` 可先在真实页面里试候选 CSS 再改源码，`--settle` 逐面滚过去等动画落定后测，避免读到退场位姿的假溢出） |
| `verify-probe.mjs` | 把下面那个 `?perf=1` 探针在无头 Chrome 里跑一遍，确认它交给用户时是可用的（含预加载地址可解析性） |
| `inspect-html.mjs` | 核对 `dist/index.html` 的标题 / 描述 / 预加载地址 / CSP |

前三者都支持 `--url=http://127.0.0.1:5174`：**直接打已经起来的预览服务**，量的就是
用户浏览器要访问的那一份产物（含生产 CSP 与相对 base），而不是夹具起的副本。
全部是"Node 内置 http 服务 + 无头 Chrome + CDP"，无第三方依赖，需要放宽沙箱权限
（理由同"已知环境问题"）。结果写 `.shots/`，不落进项目。

### 真机数据采集：`?perf=1`（`src/lib/perfProbe.ts`）

无头 Chrome 走软件光栅、合成器还会空闲降频，所以夹具里的滚动长帧**不能代表真机**
（见 PERF-REVIEW-v2.md 的 U1/U2）。真机判据改用站内自带的探针：

```
http://127.0.0.1:5174/index.html?perf=1     ← 只有带这个参数才启用
```

滚完整页 → 控制台执行 `__perfProbe.report()`（或直接看它自动打印的那份），得到：

- 帧间隔 p50 / p95 / p99 / 最长帧 / 超 1.5 帧预算的占比；
- **掉帧按上下文分开统计**（`滚动/翻面` / `过渡中` / `静止`）—— 这一节直接回答
  "该往哪儿优化"：集中在"过渡中"就是翻面的栅格化成本，落在"静止"就不是 3D 的问题；
- 长任务条数与最长值、CLS、LCP、FCP/DCL/Load、资源体积与缓存命中。

设计要点两条：**只有"持续掉帧"才提示**（判据是 5 秒滑动窗口内最长帧超预算，
一次性尖峰会自己滑出窗口 —— 否则每次停手都会误报一次）；**不带 `?perf=1` 时连
rAF 都不注册**（本站纪律：不得引入常驻循环）。

- **实测数据与评分见 [PERF-REVIEW.md](PERF-REVIEW.md)**（第二轮：FCP/LCP/CLS/长帧归因/
  逐元素几何对账）与 **[PERF-REVIEW-v2.md](PERF-REVIEW-v2.md)**（第三轮：立方体时代的
  空转 rAF、逐面内容裁切、滚动帧预算与已排除的误差来源）。

## 安全响应头与 CSP

安全策略分两层，缺一不可：

**① meta CSP（生产构建自动注入）** —— `vite.config.ts` 里的 `cspMetaPlugin()`
只在 `apply: 'build'` 时把 `Content-Security-Policy` 注入 `<head>` 最前面。
dev 模式不受影响（Vite 的 HMR 走 ws 连接与注入脚本，提前套 CSP 会把开发体验搞坏）。
走 meta 的原因是 **GitHub Pages 无法自定义响应头**，meta 是那里唯一的落点。

**② `public/_headers`（完整响应头）** —— Netlify / Cloudflare Pages / 部分对象存储
会读这个文件，它补上 meta **做不到**的那几条：`frame-ancestors`（规范明确忽略 meta 里的
这条）、HSTS、`nosniff`、`Referrer-Policy`、`Permissions-Policy`、COOP、`X-Frame-Options`，
以及缓存策略（`/assets/*` immutable 一年、HTML must-revalidate）。
文件顶部注释里有等价的 nginx 写法。

> 策略里必须放行的两项，原因写在 `vite.config.ts` 的注释里，不是偷懒：
> `script-src 'unsafe-inline'`（`index.html` 里那段**同步**主题引导脚本必须是内联的，
> 改外链会多一次阻塞往返并造成主题闪烁）、
> `style-src 'unsafe-inline'`（React 的 `style` 属性注入了 `--sec-art` / `--tone-*` /
> `--swatch`，禁掉会直接掉版式）。真正起作用的是其余部分：把脚本、连接、图片、
> 框架的来源收窄到本站 + 字体 CDN，并封掉 object / base / form / frame。

> ⚠️ `public/` 下的文件会原样发布。`_headers` 被不完全支持的托管方当作普通文件下载
> 是无害的（2 KB 文本），但**不要**把内部文档放进 `public/`。

## 安全构建与回退（重要）

### `npm run build` 不会毁掉上一版产物

Vite 默认 `emptyOutDir: true`，会**在构建开始时就清空 `dist/`**。
于是"构建中途失败"的后果不是"没更新"，而是**把一个原本可用的 `dist/` 变成空目录或半成品** ——
既上不了线，也没有可回退的副本。

所以 `npm run build` 走的是 `scripts/build.mjs`：

```
tsc -b                       失败 → 退出，dist 未动
  → vite build --outDir .build-staging
                             失败 → 删掉中间目录，dist 未动
  → 自检 .build-staging/index.html 存在
  → dist → dist-prev，.build-staging → dist
                             换入失败 → 把 dist-prev 还原回 dist
  → 成功后才删 dist-prev
```

**已实测证明**：故意植入一个类型错误后跑 `npm run build` → 退出码 1，
而 `dist/index.html` 的 **hash 与 mtime 均未变化**，且没有残留中间目录。

- 想绕过这层保护（直接构建进 dist）用 `npm run build:raw`
- `.build-staging/` 与 `dist-prev/` 已加入 `.gitignore`

### 代码回退走 git

仓库已初始化（分支 `main`）。**`dist/` 刻意不入库**（它是产物），
它的回退保障是上面的 `dist-prev` 机制，两者互补。

| 想回退什么 | 命令 |
| --- | --- |
| 改坏了某个源文件 | `git checkout -- <文件>` |
| 丢弃所有未提交改动 | `git reset --hard HEAD` |
| 退回上一个提交 | `git revert <sha>`（留历史）／`git reset --hard HEAD~1`（不留） |
| 确认当前是否偏离已提交状态 | `git status --short`（空 = 干净） |

`.gitattributes` 已统一为 LF（`eol=lf`）：不设它时，Windows 上编辑过的文本文件
在 Linux CI / 部署端会整文件显示为"已修改"，让 diff 失去可读性 ——
而 diff 可读性正是判断"该不该回退"的前提。

### 代码审查

- **[CODE-REVIEW.md](CODE-REVIEW.md)** —— 第一轮：按 阻断 / 建议 / 吹毛求疵 分级，
  重点是"处理失败且无法回退"这一类缺陷。
- **[PERF-REVIEW.md](PERF-REVIEW.md)** —— 第二轮：代码审查 + 性能实测 + 整体评分
  （安全 / 性能 / 排版三项分项与加权口径），含"排版是否被改动"的逐元素几何对账。
- **[PERF-REVIEW-v2.md](PERF-REVIEW-v2.md)** —— 第三轮（立方体舞台之后）：真实资料
  入站、占位卡清理、空转 rAF 归因、**逐面内容裁切实测与修复**、滚动帧预算，
  以及明确排除的误差来源（无头软件光栅 / 合成器降频）。
- **[UI-REVIEW.md](UI-REVIEW.md)** —— 视觉层审查与截图核对。

四份都明确标注了**未审 / 未验证范围**，不把"没测"写成"没问题"。

## 部署

`vite.config.ts` 里 `base: './'`，`dist/` 可直接丢到任意位置：

- **GitHub Pages**：推送 `dist/` 到 `gh-pages` 分支即可，无需改 base。
- **Vercel / Netlify / Cloudflare Pages**：构建命令 `npm run build`，输出目录 `dist`。
- **对象存储 / Nginx**：整个 `dist/` 上传即可。

## 已知环境问题（非项目缺陷）

在 DSH 沙箱内执行 `npm install` / `npm run *` 可能遇到 `EPERM`：

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `EPERM ... npm-cache\_cacache\tmp\...` | 沙箱禁止写工作区外的全局缓存 | `npm install --cache ./.npm-cache` |
| `EPERM ... syscall: 'spawn'`（esbuild postinstall） | 沙箱禁止带管道 stdio 起子进程 | `npm install --ignore-scripts`（esbuild 平台二进制由 optionalDependencies 提供，跳过 postinstall 仍可用） |
| `npm run build` 报 spawn EPERM | 同上，Vite 内部要起 esbuild 服务 | 在**你自己的终端**里跑即可，或放宽沙箱权限 |

在自己机器上这些都不需要，直接 `npm install && npm run dev`。
