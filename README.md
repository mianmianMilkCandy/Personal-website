# 个人主页 · 全栈开发工程师

暗色系、PC 优先的个人简历 / 作品集站点。React 19 + Vite 7 + TypeScript，纯静态，
无后端、无运行时依赖、无跟踪脚本。

---

## 快速开始

```bash
npm install        # 首次
npm run dev        # 开发预览 → http://localhost:5173
npm run build      # 产出 dist/
npm run preview    # 本地预览构建产物
```

> 如果 `npm install` 报 `EPERM`，多半是环境限制而非项目问题，见文末「已知环境问题」。

## 页面结构

| 序号 | 区块 | 锚点 | 说明 |
| --- | --- | --- | --- |
| 01 | 首屏 Hero | `#hero` | 四角构图：左上字标 / 右上光标配色+玻璃控件簇 / 左下大标题+手绘按钮 / 右下玻璃卡（WELCOME）/ 底边 SCENE 行 |
| 02 | 关于我 | `#about` | 人物介绍、联系方式、经历时间线、能力矩阵 |
| 03 | 精选项目 | `#projects` | 大卡片，每张含视觉带 / 正文 / 指标 / 技术栈 |
| 04 | 收尾页 | `#contact` | 整屏留白收尾，只留「发邮件」一个动作 |

## 目录结构

```
├── index.html
├── vite.config.ts          base: './'，产物可放任意子目录
├── tsconfig*.json          strict 模式，三份配置（root / app / node）
├── .gitattributes          统一 LF，避免跨平台整文件 diff
├── CODE-REVIEW.md          代码审查报告（分级 + 证据 + 未审范围）
├── scripts/
│   └── build.mjs           安全构建：失败不破坏上一版 dist/
├── public/
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
    │   ├── asset.ts        资源路径拼装
    │   ├── stagger.ts      阶梯延迟（必须封顶，否则后面的元素像卡住）
    │   └── revealObserver.ts  全站共用的单一 IntersectionObserver
    ├── hooks/
    │   ├── useActiveSection.ts  导航高亮
    │   ├── useLocalTime.ts      每秒时钟
    │   └── useCopy.ts           复制到剪贴板 + 反馈
    └── components/         每个组件自带同名 .css
        ├── Nav / Hero / About / Projects / Closing
        ├── Icon              手写内联 SVG 图标集（+ 贴纸底 .tile）
        ├── EntryGate         首次访问的入场幕屏
        ├── SectionHead      全站统一区块抬头
        ├── Reveal           滚动入场包装器
        └── DevNotice        仅 DEV 显示的占位内容清单
```

## 需要你填的内容

个人信息全部集中在 **`src/data/profile.ts`**，项目内容在 **`src/data/projects.ts`**。
工作区里的 `个人简介.txt` 是空文件，所以当前所有个人字段都是占位符。

开发模式下左下角会有一个「占位内容 N 项」的提示条，点开就是待填清单；
每填完一项，就把 `profile.ts` 顶部 `UNFILLED` 数组里对应的那行删掉，
清空后提示条自动消失（生产构建里本就不存在）。

素材只需按文件名丢进 `public/media/`，**不用改代码**：

| 文件名 | 用途 | 规格 / 体积 |
| --- | --- | --- |
| `hero-cat.webp` / `.jpg` | **横版首屏画作**（台阶上的猫，宽屏用） | 2.02:1 · 258 KB / 354 KB |
| `hero-cat-portrait.webp` / `.jpg` | **竖版首屏画作**（同一张图的竖取景，猫居中） | 0.67:1 · 202 KB / 272 KB |
| `ambient-portrait.webp` | **整页氛围层**小图 | 160px 预糊 · **1.7 KB** |
| `ambient-blur.webp` | 入场幕屏背景小图 | 160px 预糊 · **0.7 KB** |
| `sec-about.webp` | 「关于我」区块背后的画（回廊·横） | 1000px · 81 KB |
| `sec-projects.webp` | 「精选项目」区块背后的画（回廊·竖） | 800px · 142 KB |
| `sec-closing.webp` | 收尾页背后的画（临海石台·竖，回廊尽头看海） | 800px · 95 KB |
| `card-01/02/03.webp` | 三张项目卡的画面 | 900×506 · 50 / 88 / 63 KB（惰性加载） |
| `portrait.jpg` | 关于区块头像 | ⬜ 待补 · 4:5 竖构图，≥ 900×1125 |
| `hero-loop.mp4` | 首屏背景**视频**（可选增强） | ⬜ 可选 · 1920×1080，8–15 秒循环，**≤ 4 MB** |

**首屏实际下载量** = 横版 WebP 258 KB + 氛围层 1.7 KB ≈ **260 KB**
（竖屏 202 KB；JPEG 只在浏览器不支持 WebP 时才拉）。
区块画作与卡片画面都是滚动到才加载。

> ⚠️ **区块画作与卡片画面的质量压得比首屏低得多**（q56 / q64），
> 因为它们最终只有 ~20% 可见度或被色调薄膜盖住 —— 细节根本看不见。
> 这一条把三张区块背景从 549 KB 压到了 318 KB，是纯赚。
> **但首屏那张千万别照做**，它是全屏可见的，必须保持 q78。

**响应式画作**由 `<picture>` 的媒体查询完成，每个断点都配 WebP + JPEG 两条：

```
(max-width: 900px) 或 (max-aspect-ratio: 1/1)  →  竖版
其余                                            →  横版
```

非 WebP 浏览器会跳过 `type` 不匹配的那条，落到**同取景的 JPEG**上，
而不是掉回横版被硬裁 —— 这是这份 fallback 链的关键。

所有素材都由 `_repo/img/prep.py`（横版 + 氛围层）与 `_repo/img/prep2.py`
（竖版 + 卡片裁切件）生成，换图时重跑即可。

**图层优先级**：背景图永远是底 → 视频若存在则播起来后淡入盖住图 → 两者都失败才出 CSS 动态底。
所以「没放视频」不是缺失，只是没有那层增强。

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

## 区块画作与接缝带

整站**每个区块背后压的都是不同的画**（都由 `--sec-art` 传入，见 `src/lib/sectionArt.ts`）：

| 区块 | 画作 |
| --- | --- |
| 首屏 `#hero` | 台阶上的猫（横/竖两版，按视口切换）—— 原图 7 |
| 关于我 `#about` | 回廊（横）—— 原图 5 |
| 精选项目 `#projects` | 回廊（竖）—— 原图 6 |
| 收尾 `#contact` | 临海石台（竖）—— 原图 4 |

原图副本在 `_repo/img/src/`（已 gitignore），派生脚本是 `_repo/img/prep3.py`：
**换图 → 把新图丢进 `_repo/img/src/` 并改脚本顶部的 `SRC` → 重跑**，
不要手改 `public/media/` 里的派生文件。图 1（横版临海石台）保留在脚本里作备用。

**两个关键技术点**：

1. **画必须淡到只当"纸纹"**。走独立图层（`.has-art::before`）而不是 `background`，
   就是为了能用 `--sec-art-opacity`（dusk 0.2 / day 0.26）控制可见度。
   直接当背景用会让正文完全读不清。
2. **两张画直接相接会出现硬边**（明度与色相同时突变）。`src/components/Seam.tsx`
   用「透明 → 半透明 → **不透明** → 半透明 → 透明」的五段纵向渐变把交界盖掉：
   中间那段不透明负责遮，两端负责融。颜色走 `--seam-*` 令牌，两个主题各自成立。

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

## 进场动画（全站）

- **统一的包装器**：`src/components/Reveal.tsx`，`variant` 支持
  `up | left | right | fade | scale`，`delay` 控制阶梯。只做位移 / 透明度 / 极轻缩放，
  全部走合成层，不触发重排。
- **阶梯必须封顶**：`src/lib/stagger.ts` 的 `stagger(i, step, max)` ——
  第 12 个元素若按 70ms 递增要等 840ms 才出现，用户早滚过去了，看起来像卡住。
- **单一观察器**：全站共用 `src/lib/revealObserver.ts` 里那一个 `IntersectionObserver`，
  命中即解绑，不给每个元素各建一个。
- **覆盖范围**：区块抬头的三部分（编号/标题/注释各自入场）、四张能力贴纸、
  头像、每一行联系方式、自述每段、每条经历、每行能力、每张项目卡、每条项目要点、
  每个指标、每个技术标签、收尾页的每个社交链接。
- **`prefers-reduced-motion: reduce`** 下全部退化为直接显示，且**不注册观察器**。

新增需要入场动画的元素，包一层 `<Reveal>` 即可；同组用 `stagger(i)` 生成延迟。

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

- 全部入场动效只做 `opacity` + `translateY`，并遵循 `prefers-reduced-motion: reduce`
  （该设置下直接显示，不注册观察器）。
- 键盘可用：跳转主内容链接、`:focus-visible` 强调色焦点环、复制按钮带 `aria-label`、
  导航当前项带 `aria-current`。
- 滚动监听全部用 rAF 节流，进度条与聚光直接写 DOM 属性，不触发逐帧重渲染。
- 项目卡的视觉带与首屏降级底仍是纯 CSS 生成；全站**只有首屏那一张背景图**是图片请求
  （WebP 优先 + JPEG 兜底 + `rel=preload`），且视频是可选增强。全站无第三方 JS。

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

见 **[CODE-REVIEW.md](CODE-REVIEW.md)**：按 阻断 / 建议 / 吹毛求疵 分级，
含每条问题的证据、处置与理由，以及明确标注的**未审范围**。

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
