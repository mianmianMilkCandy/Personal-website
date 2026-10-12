# 个人网站项目 · 全资料浏览总结（UI 设计 / 排版设计 / 遇到的问题 / 技术栈）

> **审查对象**：`C:\Users\Tatsumi\Desktop\Personal website`，分支 `main` @ `8fb795f`（工作树干净，110 个受版本控制的文件）。
> **资料范围**：全仓 6 份 Markdown 文档（README / DEVELOPMENT / CODE-REVIEW / PERF-REVIEW / PERF-REVIEW-v2 / UI-REVIEW，合计约 2600 行）、`src/` 全部 55 个源文件、19 个 CSS、4 份实测报告 JSON、`_repo/` 下 80+ 个自建验收脚本、`docs/` 20 张审查截图、git 的 17 次提交历史。
> **取证方式**：文档静态通读 + 源码逐行核对 + 实测脚本清单核对。**未做**：动态运行验证（本机沙箱跑不了无头 Chrome，见 §9 限制）、真机 GPU 复核。
> **置信度**：凡标注"实测"的数字均来自仓库内的报告/脚本输出记录；凡标注"注释"的是源码注释里的推导。

---

## 0. 一页速览

| 维度 | 结论 |
| --- | --- |
| 是什么 | 暗色→**晴空白昼**的个人简历 / 作品集纯静态站；整站是**一根 9 面棱柱**，滚动即绕视口水平中轴翻面 |
| 技术栈 | React 19.1 + TypeScript 5.9（strict）+ Vite 7；**运行时零第三方依赖**（无 UI 库 / 动画库 / 图标库）；原生 CSS + 设计令牌；无后端 |
| 体量（当前 `dist/` 实测） | JS **269.2 KB / gzip 86.75 KB**、CSS **45.9 KB / gzip 9.95 KB**、HTML 2.92 KB；首屏图 **371 + 238 KB**（两张 preload）≈ 609 KB |
| 设计方向 | 「**宫崎骏的晴天绘本 × 工程师的仪表盘**」：画面负责"童心"，控件负责"克制与可信" |
| UI 语法 | 半透明白纸分级 + 1px 发丝描边 + 小圆角 + 单一暖赭强调色只用在微观细节 + 玻璃只在"不转的地方" |
| 排版 | PC 优先、一屏一面（硬约束）；一行大标题 + 等宽大写元数据；全部值走 `tokens.css` |
| 综合评分 | 安全 96 / 性能 95 / 排版 98 → **综合 96.3 / 100**（第二轮评分卡口径） |
| 最贵的教训 | 3D 旋转舞台上**任何每帧重绘或重模糊**都会吃掉帧预算；**"没被验证过"是绝大多数缺陷的同一个病根** |

---

## 1. 项目定位与内容结构

### 1.1 定位

一个给招聘方看的**个人简历 / 作品集站点**：纯静态、无后端、无跟踪脚本、无 cookie、无表单。作者是"云绵绵甜奶糖"（Python 后端 / AI 应用开发）。内容全部来自真实简历，落在两个数据文件里。

### 1.2 整站 = 一根 9 面棱柱（这是全站最核心的结构决定）

`src/App.tsx` 的 `FACES` 数组就是页面表，**面数 = 数组长度**，每个 `id` 同时是锚点：

| # | 面 id | 组件 | 内容 |
| --- | --- | --- | --- |
| 1 | `#hero` | `<Hero />` | 首屏（整屏四角构图） |
| 2 | `#about` | `<About part="intro" />` | 抬头 + 能力贴纸 + 自述 |
| 3 | `#about-contact` | `<About part="contact" />` | 头像 + 邮箱 / GitHub / 微信 |
| 4 | `#about-story` | `<About part="story" />` | 经历时间线 |
| 5 | `#about-caps` | `<About part="caps" />` | 能力矩阵 |
| 6 | `#projects` | `<Projects part="index" />` | 项目索引面 |
| 7 | `#work-clean` | `<Projects part="clean" />` | 项目一：C 盘清理工具 |
| 8 | `#work-dca` | `<Projects part="dca" />` | 项目二：DeepCognitiveAgent |
| 9 | `#contact` | `<Closing />` | 收尾 / 联系 |

第 7、8 面由 `PROJECT_FACES.map()` 自动展开——**新增项目只改 3 处**（`projects.ts` 加数据、`Projects.tsx` 的 `PROJECT_FACES` 加一行、`type ProjectId` 加字面量），导航与几何自动跟上。

**为什么要分 9 面**（不是设计选择，是几何约束倒逼）：立方体的硬约束是**每个面恰好一屏高**，而原来的「关于我」≈3 屏、「精选项目」≈4 屏。于是按内容语义重新分页——**内容一条没删，只换每屏装多少**。项目区还多出一个"目录面"：一张项目卡实测 ≈1080px 高 > 一屏 900px，塞进去会被从底部硬切。

---

## 2. 技术栈

### 2.1 分层清单

| 层 | 选型 | 说明 |
| --- | --- | --- |
| 框架 | **React 19.1** + **TypeScript 5.9（strict）** | 三份 tsconfig（root / app / node） |
| 构建 | **Vite 7** | `base: './'`，产物可放任意子目录 / GitHub Pages / 对象存储 |
| 样式 | **原生 CSS + 设计令牌**，无 CSS 框架、无 CSS-in-JS | 视觉参数全部收敛在 `src/styles/tokens.css`（272 行） |
| 运行时依赖 | **零第三方** | 无 UI 库、无动画库、无图标库；20 枚图标全部手写内联 SVG |
| 动画 | 手写：CSS keyframes / transition + IntersectionObserver + rAF | 无 GSAP / Framer Motion |
| 3D | 纯 CSS `perspective` + `transform: rotateX` | 无 three.js / WebGL |
| 后端 | **无** | 纯静态；唯一"服务"是构建产物 |
| 测试 / CI | 无单测框架、无 CI；**替代品是 `_repo/` 下 80+ 个自建验收脚本** | 这是本项目最特别的一处工程实践 |

### 2.2 关键工程设施

- **安全构建**：`npm run build` 走 `scripts/build.mjs`——类型检查 → 构建到中间目录 → 自检 → 全部成功才换入 `dist/`，任何一步失败都不破坏上一版可用产物（详见 §7.3）。
- **安全策略两层**：构建期注入 meta CSP（GitHub Pages 无法自定义响应头，meta 是唯一落点）+ `public/_headers` 补全 `frame-ancestors`（规范明确忽略 meta 里的这条）、HSTS、nosniff、Referrer-Policy（`strict-origin-when-cross-origin`）、Permissions-Policy、COOP、X-Frame-Options（DENY）与缓存策略。
- **缓存策略**：`/assets/*` → `public, max-age=31536000, immutable`；`*.html` → `public, max-age=0, must-revalidate`（带内容哈希的产物可长期强缓存，换图 / 改文案后访客必须立刻看到新版本）。
- **性能纪律**：无常驻 rAF 动画循环；滚动帧内不读布局；翻面的面内不做 `backdrop-filter`；动画只走合成层（opacity / transform）；全量遵循 `prefers-reduced-motion`。**全库未使用 `content-visibility`**，等价手段是 `.cube__slot { contain: paint }`。
- **内容与代码分离**：改简历只动 `src/data/profile.ts`，改项目只动 `src/data/projects.ts`。

### 2.3 素材与体积

| 素材 | 规格 | 体积 |
| --- | --- | --- |
| `sky-plate.webp` | 2048×2746（AR 0.7458）连续背景底图（无列车） | **371 KB** |
| `sky-train.webp` | 1434×1296，带 alpha 的列车精灵（含水面倒影） | **238 KB** |
| `card-01/02.webp` | 900×506 两张项目卡画面 | 50 / 88 KB（惰性） |
| `portrait.jpg` | 4:5 · 900×1125 头像 | 141 KB |

首屏实际下载 ≈ **609 KB**（两张天空图在 `<head>` 里 preload，因为首屏 LCP 元素就是这块天空）。

> 两张背景素材**不是手工裁的**：由 `_repo/bg/build_assets.py` 从三张同源渲染图里分离出来，并把几何常量（`--sky-ar` / `--sky-hz` / 列车精灵位置与缩放原点）打到 stdout 与 `_repo/bg/out/meta.json`。**改了底图裁切就必须同步改 CSS 常量，否则列车与轨道错位。**

---

## 3. UI 设计

### 3.1 设计方向与三条纪律

方向是「**宫崎骏的晴天绘本 × 工程师的仪表盘**」。一整幅积雨云 + 地平线 + 镜面水，上面跑着一列火车；**画面负责"童心"，控件负责"克制与可信"**。

维持方向的三条纪律（写在 `tokens.css` 文件头）：

1. **表面分级 + 发丝描边**：表面走 `--ink-*` 语义层级，边界一律 `1px solid var(--line)`；不用大圆角、不用大投影。
2. **单一强调色，只用在微观细节**：`--accent`（暖赭 `#d9762f`，蓝天里唯一能跳出来的互补色）只允许出现在状态点、焦点环、激活下划线、hover 微光上，**永远不做大面积填色或渐变背景**。
3. **元数据用等宽字体**：所有编号、标签、数值走 `.mono`（JetBrains Mono，大写 + 字距）。

### 3.2 主题：**只剩一套**（这是本版最重要的 UI 结论）

2026-10 背景换成整幅高饱和晴空画之后，黄昏那套深靛蓝令牌压上去会把蓝天洗成灰紫色——**"换背景"和"保留暗色主题"在这一版是互斥的**。于是：

- `tokens.css` 里只剩 `:root` 一套令牌（`[data-theme='day']` 覆盖块已删）；
- 导航右上角的主题开关**撤掉**（它先后被换成"列车状态读数"胶囊，2026-10 又按要求整颗删掉——那枚胶囊只把 `<html data-train>` 复述一遍、不承担操作）；
- `localStorage` 里的旧值不再被读——用户上次存的 `'dusk'` 不会把页面变回深色；
- `index.html` 仍保留一段**内联同步**脚本写 `data-theme='day'`，防首屏闪色（改外链会多一次阻塞往返）。

> **同一件事的第二个后果**：对比度从此**由面板承担，而不是由文字色承担**。

### 3.3 高亮：连续背景层 SkyStage

**九个面共用同一个固定图层** `src/components/SkyStage.tsx`——这就是"每一页背景连续"的全部实现方式（翻面时背景纹丝不动，只有内容在换）。层序自下而上：

| 层 | 内容 | 行为 |
| --- | --- | --- |
| `.sky__base` | 底图（无列车） | **静止**，镜面水里的天光一个像素不动 |
| `.sky__drift > .sky__drift-inner` | 同一张底图只露地平线以上 | 30s 横向呼吸 ⇒ 云在飘（`skyDrift`，只平移不缩放） |
| `.sky__train > .sky__sprite` | 列车 + 它的水面倒影 | 沿钢轨**从右往左**巡航，悬停停车、按住可拖 |
| `.sky__haze` | 一层很淡的天光 | 按视口尺寸光栅 |

`.sky` 自带兜底渐变（图未解码时不闪白不闪黑）。交互：

| 动作 | 行为 |
| --- | --- |
| 悬停列车 | 指数减速停车（**制动 0.46s / 起步 2.1s**——火车松闸慢、刹车快） |
| 按住拖动 | 列车跟着指针沿轨道走，松手后从那儿继续巡航 |
| 拖拽范围 | 钳住列车中心 `xc ∈ 20%~82%`，整列车始终在画面内、在钢轨上 |
| 拖后误点 | 真的拖动过（>3px）之后会**吃掉紧随其后的那一次 click** |

- **巡航速度**：`LOOP_SECONDS = 40`（跑一圈 142% 场景宽）→ **3.55% 场景宽/秒 ≈ 57px/s @1600**（比上一版快 1.55 倍）。
- **命中判定是纯算术**（列车层 `pointer-events: none`，绝不能挡正文）：用已知场景几何 + 每帧位置直接算屏幕矩形。
- **构图唯一自由旋钮**：`--sky-hz-screen`（默认 80vh，矮屏 ≤840px 高改 84vh + `--train-scale: 0.44`）。

### 3.4 视觉语法清单

**表面分级**（六档不透明度，每档都有实测理由）：

| 对象 | 值 | 理由 |
| --- | --- | --- |
| 区块表面 `--surface-alt` | 52% 白 | 半透明，让固定背景层透出来 |
| 首屏玻璃卡 `.hero__card` | `color-mix(ink-700 62%)` | 卡落在右侧亮云（相对亮度可达 0.9），再透文字就掉到 2:1 |
| 项目卡 `.project` | `color-mix(ink-700 68%)` | 背后正好是列车那一带；50% 时正文只有 3.5:1 |
| 入场按钮 `.gate__btn` | 88% 实白 | 门后那片天本身是亮的，白玻璃压在亮天上等于没有形状 |
| 导航吸顶 | `--nav-glass` 76% | 压画面上时保持通透 |
| 玻璃面板 `.glass` | 66% + `blur(18px) saturate(140%)` | 参考站那种"悬浮卡片"质感 |

**反面纪律**：`.hero` 与 `.closing` **故意没有 background**——有了就是一整块不透明的面，背后那层连续背景会被整个盖掉。

**描边**：统一 1px，三档灰阶（16% / 26% / 38%）；承载在 `.hairline`、`.section-head` 下边线、折痕、表格式行分隔、卡头下边线、页脚上边线、吸顶导航下边线。全站的"精密感"几乎全靠它。

**圆角**：`--r-1 2px`（行内小控件）/ `--r-2 4px`（按钮、头像框）/ `--r-3 8px`（卡片、玻璃、贴纸）/ `--r-full 999px`（只给胶囊与圆点）。注释原话：**"大圆角是模板感的重灾区"**。

**玻璃质感的使用范围**（这是 UI 与性能的交叉点）：

- **允许**：固定导航 `.nav.is-stuck`（blur 16px）、入场幕屏 `.gate__btn`、`.glass`。理由：它们**在转动的舞台之外**。
- **面内一律禁止**（`.cube__slot .hero__card / .glass / .pill--quiet / .btn--ghost { backdrop-filter: none }`）。理由：面一直在转，带模糊的元素等于要求合成器**每帧**重采样背后内容并重做高斯模糊，还会把它踢出栅格缓存。

**手绘描边按钮**（`.pill--quiet` / `.btn--ghost`，用在卡片动作与首屏滚动按钮）：

- 底只用 12% 主题底色（真正的高透明度，底下的画能透上来）；
- 轮廓不用 `border`（那是机器画的直线），交给 `::before` 画一圈 1.5px 线，再套一个 SVG 湍流位移滤镜 `#sketch-line`（`feTurbulence` + `feDisplacementMap`，`scale="2.4"`）把线抖出"手画"的味道；
- **滤镜只作用在描边层上**，文字保持锐利——整块按钮加滤镜会把字也搅糊；
- ⚠️ **这一节必须留在 `base.css` 文件末尾**：放到前面会被 `.pill { background: var(--pill-bg) }` 按同特异度"后来者胜"覆盖掉。实测翻过一次车——胶囊底仍是实色白、文字已变浅色，按钮上的字直接看不见。

**点击光影**：文档级一个 `pointerdown` 委托（`src/lib/clickShine.ts`），算出点击点在按钮内的百分比写成 `--fx / --fy`，CSS 用 `radial-gradient(130px circle at var(--fx) var(--fy))` 让暖光从点击处散开，**描边同时亮成强调色**；动画放完由 `animationend` 自动摘类（不留 `setTimeout`）。键盘激活（`click.detail === 0`）没有坐标就从中心发光。

**其它装饰层**：颗粒层（160×160 SVG 湍流、`mix-blend-mode: multiply`、`opacity: 0.12`，压掉纯数字色的"塑料感"）、指针光（46vmax 径向渐变，随指针 transform + CSS transition 拖尾）、极淡横向工程网格、折痕（一条两端淡出的 1px 发丝线 + 一小段折影）、风里的落叶与花瓣。

**图标系统**：20 枚手写内联 SVG，零图片请求、零图标库，颜色走 `currentColor`。"可爱但不幼稚"的三条做法：圆头圆角 + 线宽 1.8；每枚带**一处强调色细节**（`.i-accent`）；优先装进 `.tile` 贴纸底（圆角方块 + 暖色微光 + 右上角小闪光），hover 轻轻歪 5°（幅度刻意压小）。**图标只做加速器**：所有图标旁都有文字标签，叙事文字（自述、经历、项目要点）**不做图标化**——那才是有招聘方真正读的东西。

### 3.5 交互与动效

| 功能 | 要点 |
| --- | --- |
| **动态光标** | 精确小点（承担"我指在哪"）+ 缓动细环（承担"手感"），悬停可点元素时环放大 1.9× 并填一层极淡强调色底 |
| **光标配色** | 导航右上角 6 色板胶囊，localStorage key `site-cursor-tint`；悬停即预览（只改 CSS 变量）、点击即持久化；默认"跟随主题" |
| **入场幕屏** | 首次访问者看「进入网站」幕屏；localStorage key `site-entered`；点击 / 任意键 / ESC / 点按钮都能进；`prefers-reduced-motion` 下直接跳过 |
| **进出场动画** | **每次换面都重播一遍**（不再是"只播一次"）；相位挂在槽位上，见 §4.4 |
| **数据内容** | 简历 / 项目 / 经历 / 技能全部来自 `profile.ts` + `projects.ts` 两个文件 |

**动态光标的三条"不能把用户的鼠标弄丢"的安全设计**（值得单独记）：

1. **原生光标只在第一次 `pointermove` 之后才隐藏**——挂载时就 `cursor: none` 会出现"原生没了、自定义也没定位"的一瞬。
2. **隐藏靠 JS 加上的 `html.has-cursor` 类**，不写死在 CSS 里——JS 没跑起来或组件报错时原生光标原样保留。
3. **只在精确指针 + 非 `prefers-reduced-motion` 下启用**——触屏没有光标；晕动敏感的用户不该被一个跟动的环追着。

---

## 4. 排版设计

### 4.1 首屏：整屏四角构图

恰好一屏，**中间留白全给画面**，四角分工：

| 位置 | 内容 |
| --- | --- |
| 左上（固定导航） | 点 + 字标（`NAME / ROLE`） |
| 右上（固定导航） | 光标配色胶囊 + 胶囊 CTA「联系我」 |
| **左下** | **大标题（一行：「{名字}的主页。」）** + 一句话主张 + 手绘高透明按钮行（`向下滚动进入` / `SCROLL DOWN`） |
| **右下** | 玻璃卡，标签 `WELCOME`（姓名 / 职位 / 坐标 / 专注），底色 62% 透明 |
| **最底边** | `SCENE 01 · 主题 · UTC+8 时钟`（网格第二行，横跨整行） |

实现上 `.hero__inner` 是 `grid-template-columns: minmax(0,1fr) minmax(280px,360px)` + `grid-template-rows: minmax(min-content, 1fr) auto`——第一行吃掉剩余高度（内容仍然底对齐），第二行就是钉在最底边的 SCENE 小字。

**三条关键约束**（改之前先看）：

1. **`--fs-hero` 是全局最敏感的旋钮**（现为 `clamp(2.1rem, 5.2vw, 6rem)`）。上限 6rem 的来由：标题是**一行**「{名字}的主页。」，8 个汉字 × 6rem = 768px，不超过左侧文案列（宽屏 ≈880px）；名字再长就会折行。下限从 2.9rem 降到 2.1rem 是因为 2.9rem 在 430px 宽下会让那一行横向溢出。
2. **一句话的 `max-width` 必须用 `em` 不能用 `ch`**：`ch` 是"0"的宽度，对中文只有半个字宽，`34ch` 会把 20 个字的标语硬折成两行。
3. **标题末尾的句号是全站唯一的彩色标点**（`.hero__title-dot`）。

### 4.2 一屏一面是硬约束

面高恰好 `100svh`、`.cube__slot` 是 `overflow: hidden`——**内容比一屏高就被从底部硬切，控制台零报错**。实测（1600×900，数字 = 最深的元素下沿越过面下沿多少 px）：

| 面 | 原始溢出 | 处置后 |
| --- | --- | --- |
| `about-story` | 36 | 0 |
| `work-clean` | 27 | 0 |
| `work-dca` | 60 | 0 |
| `contact` | 16（**假读数**） | 0（滚到那一面、等过渡走完再量就是 0） |
| 其余 5 面 | 0 | 0 |

> `contact` 那个 16 是**夹具在骗人**：页脚没包 `Reveal`，在"非当前面"上处于退场位姿（`translateY(16px)`）。**量面内几何一定要"滚过去再量"。**

**为了装进一屏做的四处排版调整**（2026-10 换背景后约束收紧过一次）：

1. 能力贴纸 4 列 → **5 列**（原来第 5 张单独占一行，白占 150px）；
2. 经历时间线 单栏 → **两栏**（710px → ~380px；单栏时 4 条经历高 710px，而给列车让完路后一屏只剩 66vh ≈ 594px）；
3. 自述 2 栏；
4. 区块留白与 `.section-head` 的 margin 各收一档。

**排版预算的来历**：`.cube__slot .face-body { padding-bottom: 34vh }` 把正文带压到视口上方 66vh（可用高度从 ~830px 掉到 ~560px），目的是**给背景里的列车让路**——地平线钉在 80vh，列车车体落在 58~80vh、倒影在 80~100vh，而面上内容默认居中的中心是 50vh，正好压在列车上。收掉 34vh 后内容中心移到约 33vh，正文带落在 5%~58%，与列车带刚好错开。

> ⚠️ **选择器必须带 `.cube__slot`**：同一条 padding 还有一条 `.cube__slot .section { padding-block: … }`（特异度 0,2,0）比 `.face-body`（0,1,0）高，会把 `padding-bottom` 整条盖掉。实测踩过——量出来九面的内容依旧居中在 450px，白改一轮。

### 4.3 字体分工与字号阶梯

| 角色 | 字体 | 负责什么 |
| --- | --- | --- |
| `--font-display` | **Inter Tight** | 大标题、区块标题、姓名、时间线机构、卡片名 |
| `--font-sans` | Inter Tight（正文档） | body 默认，所有未显式声明的正文与标签 |
| `--font-mono` | **JetBrains Mono** | 全部元数据：编号、标签、数值、按钮文字（大写 + 字距） |

字号阶梯（PC 优先，`clamp` 保证 1024px 以下不崩）：

```
--fs-hero  clamp(2.1rem, 5.2vw, 6rem)     --fs-body  1rem
--fs-h1    clamp(2.4rem, 4.4vw, 4.25rem)  --fs-sm    0.875rem
--fs-h2    clamp(1.6rem, 2.4vw, 2.5rem)   --fs-xs    0.8125rem
--fs-h3    1.25rem                        --fs-mono  0.75rem
--fs-lead  clamp(1.05rem, 1.25vw, 1.3rem)
```

**元数据排版约定**（全站统一的"科技感"语法单元）：

```css
.mono { font-family: var(--font-mono); font-size: var(--fs-mono);
        letter-spacing: 0.1em; text-transform: uppercase; color: var(--fg-3); }
```

字距按场景分级：`.section-head__idx` 0.08em → `.section-head__note` 0.06em → `.hero__scene` 0.14em → `.hero__scrollhint` **0.2em**（注释：*"参考站那行 SCROLL DOWN 是靠字距撑开的，不是靠加粗"*）。SCENE 小字还带 `font-variant-numeric: tabular-nums`（时钟跳动时数字不抖）。

### 4.4 动效排版

- **入场阶梯必须封顶**：`stagger(i, step = 70, max = 420)`——第 12 个元素若按 70ms 递增要等 840ms 才出现，用户早滚过去了，看起来像卡住。
- **出场统一 320ms 同步退场**（`--dur-2` + 0ms 延迟，不排队）；入场是 620ms（`--dur-3`）+ 阶梯延迟。
- **时序契约**：`transition-*` 取的是"变化**之后**"那份样式，所以 `[data-state='in']` 那条**不要写 `transition-duration`**，否则出场时序会把入场时序顶掉。
- **首帧要延一帧再写相位**：同一帧里既插进 DOM 又加状态，浏览器只算一次样式，元素会直接以最终状态出现、620ms 的入场直接没有。
- **阶段阈值**：`CONTENT_EXIT_AT = 0.25` / `CONTENT_ENTER_AT = 0.75`——出场在面转出约 22° 时开始、进场在面快转正（约 22°）时开始。**代价是中间那两个面都没有正文**（只剩画面与版面），这是刻意的：旋转中段本来就是几何过渡帧。
- **入场幕屏期间首屏相位保持 `out`**：幕屏卸载后广播 `site:entered`，首屏这才入场——否则整段动画都在门后面放完了。
- `prefers-reduced-motion: reduce` 下全部退化为直接显示。

### 4.5 令牌纪律与响应式

**组件里不许出现字面色值**——所有颜色、遮罩、玻璃层都必须走语义令牌，否则改主题 / 换背景必然错色。自检命令（**递归写法**）：

```powershell
Get-ChildItem src -Recurse -Filter *.css |
  Select-String -Pattern 'rgba?\(|#[0-9a-fA-F]{3,8}\b' |
  Where-Object { $_.Filename -ne 'tokens.css' }
```

只应命中 `@supports (-webkit-text-stroke: 1px #000)` 的两处探测串与 mask 里的 `#000`。

> 💡 别写成 `Select-String -Path src\**\*.css`：PowerShell 的 `**` 只当作**一层**目录，那个写法会漏掉 `src/App.css`（实测：13 个 CSS 文件里少扫 1 个）。

**断点清单**（PC 优先，窄屏逐级让位）：

| 断点 | 改了什么 |
| --- | --- |
| `max-height: 840px` | 地平线 80vh → 84vh、`--train-scale` 0.55 → 0.44、正文容器 `padding-bottom` 34vh → 26vh |
| `max-width: 1160px` | 能力贴纸 5 列 → 2 列；经历时间线两栏 → 单栏；头像降宽 |
| `max-width: 1100px` | 首屏单列：标题 → 玻璃卡 → SCENE 行，整体仍贴首屏底边 |
| `max-width: 1000px` | 导航中部链接隐藏；项目索引行 5 列 → 4 列（英文名让位）；项目卡双栏 → 单列、视觉带 230 → 180px |
| `max-width: 760px` | 导航去掉职位；CTA 收紧 |
| `max-width: 720px` | 时间线 / 能力行落成单列 |
| `max-width: 620px` | 光标配色胶囊隐藏（实测 430px 宽导航会溢出约 24px，让"联系"这个真动作入口留下） |
| `pointer: coarse` | 指针光、自定义光标、卡片聚光全部不启用 |
| `prefers-reduced-motion: reduce` | 11 个文件里逐个降级：全局压到 0.001ms、reveal 直接显示、云归零到中点、列车 park 到固定位、落叶整层不显示 |

---

## 5. 技术上的关键实现（按主题）

### 5.1 立方体舞台的几何模型

```
p = clamp(scrollY / h, 0, n-1)        // n = 面数，h = 100svh
k = floor(p)，f = p - k
e = easeStep(f)：两端各留 15% 驻留，90° 的转动压进中间 70%（smoothstep）
摆位：translateZ(-r) rotateX(t*90deg) translateZ(r)   // r = h/2
假光照：shade = shadeMax * (1 - cos(|t|·π/2))
```

- **中轴必须落在视口垂直正中**：只有落在正中，相邻两面在任意角度下的投影才刚好铺满视口。注释里的实测算例：**中轴放在 30% 处时，θ=90° 会在视口底部留下 20% 的空洞**。
- **开头的 `translateZ(-r)` 是必须的补偿**：面心本在 `translateZ(r)` 上，透视会放大 `d/(d-r)` 倍（**1600 透视 + 372 半径 ≈ 1.30×**）。退回 r 后正面恰在 z=0 平面，实测 `rotateX(0deg)`、`rect=0/744`，与分页前 1:1 一致。
- **背对镜头的面必须停用**（`isFrontFacing`）：相机在棱柱轴上，背对的面会被"从内侧"看到，也就是镜像的正文。**实测：静止时 `about-contact` 面是 626/118 的一条镜像带子。** 判据：`cos θ > r/(d+r)`（1600 透视 + 372 半径 → 79.1°，每步前后各约 12% 不画）。停用方式是 `data-parked` → `visibility: hidden`，顺带让它退出焦点与读屏顺序。

### 5.2 列车"压在轨道上"的模型（本项目最精细的一段工程）

底图里的钢轨**不是水平的**：着地线从画面左边的 **61.8%** 一路抬到右边的 **59.02%**（都是底图高度的百分比），跨度 2.8%。拿一个固定的 y 去压，必然一端悬空——**这就是"列车看着不在轨道上"的根因**。

三个量全部由"列车中心横坐标 `xc`"驱动：

```
y(xc) = contact(xc) − ORIGIN_Y                        把车轮着地行顶到轨面上
k(xc) = (contact(xc) − Y_EYE) / (contact(0) − Y_EYE)  由远及近的缩放（0.34 ~ 1）
o(xc) = 0.88 + 0.12·k                                 大气透视
```

`k` 不是拍脑袋：单点透视下地面点成像在 `y = y_eye + f·h/d`，而成像尺寸 ∝ `1/d`，两者合起来就是**尺寸 ∝ (y − y_eye)**。`Y_EYE = 57.70%` 同时满足"严格高于钢轨最远端 59.02%"与"落在画面远端岸线（55.7%~57.9%）"。方向 = 从右往左（画面右侧是远端，所以天然"由远及近"；精灵里车头朝左）。

**两个修掉的缺陷（都量过）**：

1. **缩放原点用错行 → 列车整体压低 16px。** 上一版把精灵里的**水面镜像轴**（`originPct` 47.3765%）当成了"车轮着地行"，而车轮真正压在轨面上的那一行在精灵内 **48.9969%**。差 1.62% 精灵高 = 0.765% 图高 = **1600×900 下 16px**，于是整列车陷进道砟，而且**近端（缩放最大处）比远端重**——正是"开到左边像脱轨"的根因。
2. **钢轨表用的是"逐列最暗行" → 系统性偏低 0.4~0.5%，还带一个假凸起。** 最暗的那一行是钢轨暗带的中心/道砟边，不是轨面；旧表在 x≈20% 处还有一个 +0.2% 的凸起（那里最暗的是草地与道砟边界），会让列车上下点动。新表由两路证据合成（精灵 alpha 每列的车体底边 + 底图钢轨暗带的**上沿**），两路在 x∈[15,75] 一致到 ±0.2% 以内。

**验收判据**（`node _repo/bg/train_check.mjs dist`，真实鼠标事件路径）：

```
车轮着地行 vs 着地线  最大偏差 0.2px（自洽性检查）
xc 序列              56.2 → 50.1 → 41.4 → 33.3 → 25.7 → 19.5 → 12.9  全程递减
拖拽钳位             左端停在 xc=20%
悬停                nav=hold，1.6s 内位移 0.94%（制动曲线生效）
```

> ⚠️ `train_check.mjs` 第 1 条是**自洽性检查**（读的与算的用同一套常量），它证明不了"车轮真的压在轨面上"。像素级判据要用 `node _repo/bg/train_freeze.mjs dist 0,8,14,20,26,41,60,78`——它用 `prefers-reduced-motion` 把 rAF 停掉，再把 `--tx/--ty/--tk` 写成该时刻 JS 会写的值（= 巡航时的同一套渲染，只是冻结），并画出着地线参考线截图。

### 5.3 性能工程（六条硬纪律）

1. **不得引入常驻动画循环。** 秒级时钟是独立叶子组件（`LocalClock.tsx`）；动态光标在收敛之后**会主动停掉 rAF**。判据：空闲 1 秒内**页面自己**申请的 rAF 应为 **0 次**（实测 0）。
2. **不要在文档根上写 `scroll-behavior: smooth`。** 它会给鼠标滚轮的每一格都套一层缓动追赶，还会与立方体的滚动驱动打架（旋转角读 `window.scrollY`，被缓动拖住时角度跟不上指针）。平滑滚动只留给锚点跳转。
3. **不要在滚动帧里读布局。** "写完样式马上读几何"会让浏览器当场重算整篇布局，每个滚动帧白付一次。所有几何量只在 mount / resize / ResizeObserver 回调里重量。
4. **面内不做 `backdrop-filter`**；不要 `transition` 那些会引起重绘的属性（`backdrop-filter` / `box-shadow` / `letter-spacing` / `clip-path` / `width`）。要"擦开"就用静态裁切 + `transform: scaleX`。
5. **不做"每帧重画一整层"的效果。** 原先的鼠标跟随聚光（全屏 `radial-gradient` + 每帧改 `--mx/--my`）已删除。
6. **面内内容必须一屏装得下**，而"装不下"是静默切掉。

**这些纪律直接改写了视觉决策**（这是本项目的特色）：

| 视觉做法 | 性能代价 | 结论 |
| --- | --- | --- |
| 面内玻璃模糊 | 合成器每帧重采样 + 重做高斯模糊，并把该层踢出栅格缓存 | 面内全部关掉，玻璃只留固定导航与幕屏 |
| 云层 `scale` 呼吸 | 对 1600×1424 的合成层做 scale 会让浏览器**逐帧按新缩放重栅格化** | 改成"盒子比场景宽 6%、只平移" |
| 项目卡用 `transition: clip-path` 擦开 | 每帧整层重新栅格化 | 改成外层静态裁切 + 内层 `scaleX` |
| 鼠标跟随聚光 | 全屏区域每次指针移动重绘 | 删除 |
| 视差写在父层 | 父层 `will-change` 把 2000px 大图连同 `filter` 一起拉去重栅格化 | 改成把 `--parallax` 写在 `<img>` 自己身上 |

**每帧只允许写一个自定义属性**（列车巡航）：

| 写法 | 主线程忙时（6 秒空闲） |
| --- | --- |
| 只写 `--tx` + 跨档写 `--ty`/`--tk`（现在） | **447 ms** |
| `--tx`/`--ty`/`--tk` 每帧都写 | 643 ms |
| 再多一个逐帧 `--to`（透明度） | 1166 ms |
| 直接写本元素的 inline `transform` | 1166 ms |
| 完全冻住 rAF（静态页基线） | 122 ms |

**成本与"每帧改几个属性"几乎成正比**，与"改了什么"无关；而**渲染**这一层几乎不要钱（把 `.sky__train` 整个 `display:none`，读数一模一样）。

### 5.4 构建、部署与安全

**安全构建**（`scripts/build.mjs`）：

```
① tsc -b                      失败 → 「✗ 类型检查未通过 —— dist/ 未做任何改动」 exit 1
② rmSync(.build-staging)      清掉上次可能残留的中间目录
③ vite build --outDir .build-staging --emptyOutDir
                              失败 → 删中间目录 + 「✗ 构建失败 —— dist/ 未做任何改动」 exit 1
                              自检 .build-staging/index.html 不存在 → 同样中止
④ dist → dist-prev，.build-staging → dist
                              换入失败 → 把 dist-prev 还原回 dist（并打印"已还原"）
                              还原也失败 → 明确告知"上一版完整保留在 dist-prev/，手动改名即可"
⑤ 成功后才 rmSync(dist-prev)  → 末行「✓ 构建完成，dist/ 已更新」
```

- 子进程用 `spawnSync(..., { stdio: 'inherit' })`——注释写明"**DSH 沙箱禁止'带管道 stdio 起子进程'（EPERM），inherit 是那里唯一能跑通的形态**"，顺带让 tsc / vite 的彩色输出直达终端。
- 调用的是 `node_modules/typescript/bin/tsc` 与 `node_modules/vite/bin/vite.js`（纯 JS 入口），而不是 `npx`。

Vite 默认 `emptyOutDir: true` 会**在构建开始时就清空 `dist/`**，于是"构建中途失败"的后果不是"没更新"，而是把一个原本可用的 `dist/` 变成空目录或半成品——这正是"处理失败且无法回退"的典型形态。脚本已实测证明：故意植入类型错误后 `dist/index.html` 的 hash 与 mtime 均未变化，且无残留中间目录。想绕过这层保护用 `npm run build:raw`（`tsc -b && vite build`）。

**安全策略两层，缺一不可**：

| 层 | 落点 | 为什么 |
| --- | --- | --- |
| meta CSP（生产构建自动注入，`head-prepend`） | `vite.config.ts` 的 `cspMetaPlugin()` | **GitHub Pages 无法自定义响应头**，meta 是那里唯一的落点；dev 模式不受影响（否则 HMR 的 ws 与注入脚本会被自己挡住） |
| `public/_headers`（完整响应头） | Netlify / Cloudflare Pages / 部分对象存储会读 | 补上 meta **做不到**的：`frame-ancestors`（规范明确忽略 meta 里的这条）、HSTS、nosniff、Referrer-Policy、Permissions-Policy、COOP、X-Frame-Options + 缓存策略（`/assets/*` immutable 一年、HTML must-revalidate） |

策略里必须放行的两项（原因写在注释里，不是偷懒）：`script-src 'unsafe-inline'`（主题引导脚本**必须**内联，改外链会多一次阻塞往返并造成主题闪烁；用 sha256 哈希锁定它则会在 Vite 改写内联脚本格式后静默失效，风险更大）、`style-src 'unsafe-inline'`（React 的 `style` 属性注入了 `--tone-*` / `--swatch` 等，禁掉会直接掉版式）。真正起作用的是其余部分：把脚本 / 连接 / 图片 / 框架的来源收窄到本站 + 字体 CDN，并封掉 object / base / form / frame。

**注入面实测**（第二轮，命令照抄）：

```
grep -rn "dangerouslySetInnerHTML|innerHTML|eval\(|new Function" src/   → 0 命中
grep -rn 'target="_blank"' src/                                        → 2 命中，2 处均带 rel="noreferrer noopener"
grep -rn "https?://" src/ | 域名去重   → 只有字体 CDN（w3.org 是 SVG 命名空间，非请求）
疑似密钥串扫描（AIza / sk- / ghp_ / PRIVATE KEY / Bearer）              → 0 命中
```

数据驱动 URL（`profile.ts` / `projects.ts` 的 `href`）**不需要**再加一层 `safeHref()`：React 19.3 原生把 `javascript:` 开头的 URL 替换成 `javascript:throw new Error('React has blocked a javascript: URL …')`（源码在 `node_modules/react-dom/cjs/react-dom-client.development.js`），再加是过度设计，只增加维护面。

**部署**：`base: './'`，`dist/` 可直接丢到 GitHub Pages / Vercel / Netlify / Cloudflare Pages / 对象存储 / Nginx，无需改 base。

---

## 6. 遇到的问题与解决方案

> 按"先症状后结论"排列，便于检索命中。分级沿用仓库自己的口径：**阻断** = 会导致数据丢失、安全事件或功能必然失效；**建议** = 真实缺陷但影响可控；**吹毛求疵** = 洁癖级。

### 6.1 阻断级（全部已修）

| # | 现象 | 根因 | 解法与判据 |
| --- | --- | --- | --- |
| B1 | 构建中途失败会**毁掉原本可用的 `dist/`**，且没有可回退副本 | Vite 默认 `emptyOutDir: true`，构建开始就清空 outDir | 新增 `scripts/build.mjs` 四步安全换入；判据：人为造失败后 `dist/index.html` 的 hash 与 mtime 均不变 |
| B2 | 整个项目**没有版本控制**，任何改动都不可回退（当时确实直接删了 1.52 MB 旧素材且无备份） | 从未 `git init` | `git init -b main` + 首次提交；配套加 `.gitattributes` 统一 LF（否则 Windows 编辑过的文件在 Linux CI 上整文件显示"已修改"，diff 失去可读性——而 diff 可读性是判断"该不该回退"的前提） |
| B3 | `index.html` 的 preload 指向**已删除**的图 → 每次加载一个必定 404 的预加载请求 | 换主视觉时漏改 preload | 改成两条按 media 匹配的 preload，与组件的 `<source media>` **逐字一致**；判据：产物里不再出现旧文件名、两条 media 字符串与组件一致 |
| B4 | 生产构建**完全没有 CSP**，仓库里也没有任何安全响应头配置 | 静态站最容易漏的一层 | 构建期注入 meta CSP + 新增 `public/_headers` |
| B5 | 动态光标**永久 60fps 空转**，用户一动不动也有回调在跑 | 收敛判据写成 `rx !== px`（严格浮点比较），而缓动是 `rx += dx * 0.16`，**永远落不到整数坐标上**，于是"还有位移"恒为真 | 加 `SNAP_EPSILON = 0.01` 容差；判据：空闲 1 秒内 rAF **120 → 0 次/秒** |
| B6 | 秒级时钟的 state 长在**首屏根组件**上 → 标题 / 标语 / 玻璃卡 / SCENE 行（40+ 元素与图标 SVG）**每秒整棵重渲染一次，且永远如此** | React 里最典型的"state 放太高" | state 收进 `LocalClock` 叶子组件，刻意渲染成**裸文本节点**（DOM 结构逐字一致，排版不变） |
| B7 | 首屏每次加载都发一个**必定 404** 的视频请求（`preload="metadata"` 会真的去拉） | 常量指向不存在的文件 | 默认空字符串 → 不渲染 `<video>`；判据：4xx 请求 3 → 2 个 |
| B8 | 9 面中有 **4 面内容被 `overflow: hidden` 静默裁切**，控制台零报错 | 面高恰好 100svh 而内容比一屏高 | 压留白 + 压卡片内边距；判据：逐面落定实测 36/27/60/16px → **全部 0** |
| B9 | `prefers-reduced-motion` 对路由的 WAAPI `animate()` 完全无效 | CSS 只重置了 `transition/animation-duration`，WAAPI 不受影响（注：这条属 `clean` 项目，见 §8 对照） | — |
| B10 | 入场幕屏声明了 `aria-modal="true"` 却**没有焦点隔离**，Tab 一步就落到"门背后"的导航链接上 | 只锁了 body 滚动 | 幕屏可见期间给 `main` / `header.nav` / `.skip-link` 加 `inert`，离开时按原状还原 |
| B11 | `--fg-4` 被当成正文色用（2.44–2.62:1，远低于 4.5:1），落点是页脚、`复制/已复制`、幕屏提示这些**真正要读的文字** | 令牌语义没定死 | 新规则"`--fg-4` 只给非文本（分隔符、滚动条、状态点）"，4 处文字改用 `--fg-3`，并把 `--fg-3` 提到在最亮表面上也达标 |
| B12 | 首屏最底边那行 `SCENE` 小字**等不到入场事件**，一直停在 `opacity: 0` | 全站共用的 `revealObserver` 用 `rootMargin: '0px 0px -12% 0px'` 把视口最下沿排除在交叉区外——那是为"滚动才播"设计的，而首屏不滚动。可复算：视口 800px 时有效根底边 = 704px，而 SCENE 行顶部在 769px，不相交 | `observeReveal` 增加"首屏自查"（连查 3 帧 + 700ms 复查），不改任何既有阈值 |

### 6.2 建议级（择要）

| 现象 | 根因 | 处置 |
| --- | --- | --- |
| 鼠标滚轮"像隔了一层棉花" | 文档根上写了 `scroll-behavior: smooth`，与立方体滚动驱动叠加 | 根上删除；新增 `lib/smoothAnchors.ts` 只在点击 `href="#…"` 时平滑 |
| 每个 `.reveal` 元素多付一次跨帧强制布局 | `revealObserver` 里挂着 `setTimeout(revealIfInView, 700)` 的轮询兜底，而它想兜的场景本就由 IntersectionObserver 自身回调覆盖 | 整段删除；首屏那批只保留挂载时 3 帧自查，并把上下两个判据合并成**一次** `getBoundingClientRect` |
| 滚动帧每帧重算整盘布局 | 同一帧刚写完 9 个面的 `transform` 与 `--shade`，紧接着读 `stage.clientHeight` | 高度只在 mount / resize 量（恒为 100svh）；`Nav` 的 `scrollHeight` 改用 `ResizeObserver(documentElement)` |
| 项目卡擦开动画每帧整层重栅格化 | 用 `transition: clip-path` | 改成"静态裁切 + 合成层位移"（`transform: scaleX`） |
| 三处 React `key` 取自**内容字符串**（段落前 16 字、要点、技术栈）→ 内容重复就撞 key | 误用内容当身份 | 改用下标（静态列表，下标是正确做法） |
| `Icon.tsx` 的 `pulse` 图标全站零引用 | 死代码 | 从 `IconName` 联合类型与 `GLYPHS` 中删除 |
| 首屏画作 WebP q78 是全站 LCP 最大单项成本 | 未标定过质量-体积曲线 | 降到 q68：258.3 → 207.6 KB（−19.6%），平均绝对误差 3.08/255，肉眼不可分辨；同时试过 AVIF，在同等体积下 PSNR 反而略低于 WebP，因此**没有**为它引入额外 `<source>` |
| `--seam-core` / `--seam-mid` 硬编码色值，与 `--ink-900` 重复 | 令牌层漏收 | 改为从 `--ink-900` 派生 |
| `.reveal` 上挂 `will-change`，而全站有 50+ 个 reveal 元素 | 每个都提一层白吃大量 GPU 显存 | 移除（入场只有一次性 620ms） |
| `backdrop-filter` 被写进 `transition` | 不该动的属性不该进 transition，否则每次吸顶/还原都起一条"模糊形成/消失"的合成动画 | 从 transition 里删除 |

### 6.3 那些"看起来通过、其实没在测"的验收陷阱（最值得复用的部分）

1. **`contrast_report.py` 会假通过**：截图缺失时它打的是「共 0 个文本元素，最坏比 < 要求 的有 0 个 / 全站最差：None」——长得像通过，其实没有数据。**必须确认表里有 9 行面数据。**
2. **夹具自己制造了假阳性**：性能探针最初写成在回调里再套一层 `requestAnimationFrame(tick)`，每次 tick 申请两帧——读数直接从 60 变成 120，"改前 121 / 改后 120"的对比因此两次数都是探针。
3. **溢出测量会读到退场位姿**：收尾页脚没包 `Reveal`，在"非当前面"上处于 `translateY(16px)`，静止在首屏量到的"溢出 16px"是假的。工具因此改成"滚到那一面、等过渡走完再量"（`--settle`）。
4. **入场幕屏没被跳过**：它盖住首屏（LCP 量到的是幕屏而不是首屏画），并且给 `body` 上 `overflow:hidden`，脚本化滚动**完全没生效**——测出来的"滚动流畅度"其实是静止页面的帧率。
5. **LCP 必须在滚动之前取值**：一旦滚到下面的区块，那些更大的画面会成为新的 LCP 候选。
6. **`--window-size=430,880` 实际拿到的是 500×760 的视口**——窗口尺寸和截图尺寸并不总是相等。
7. **`load` 事件触发时 React 往往还没挂载完**，滚动 / 事件都要延迟重试，否则会得到"永远是首屏、光标永远不出现"的假象。
8. **注入脚本在 `document-start` 阶段 `document.documentElement` 可能是 `null`**，直接 `observe()` 会抛异常并**打断整段注入脚本**，把 `__perf` / `__raf` 一起弄丢（表现为整轮测量返回 `undefined`）。
9. **`document.querySelectorAll` 结果的顺序**：`contrast.mjs` 用 p96（最亮处）口径算对比度——取元素矩形内背景像素的 96 分位，而不是平均值。

### 6.4 环境类问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `npm install` 报 `EPERM … npm-cache\_cacache\tmp\…` | DSH 沙箱禁止写工作区外的全局缓存 | `npm install --cache ./.npm-cache` |
| `npm install` 报 `EPERM … syscall: 'spawn'`（esbuild postinstall） | 沙箱禁止带管道 stdio 起子进程 | `npm install --ignore-scripts`（平台二进制由 optionalDependencies 提供） |
| `npm run build` 报 spawn EPERM | 同上，Vite 内部要起 esbuild 服务 | 在不受限的终端里跑，或放宽沙箱权限 |
| `npm run build` 报最后一步 rename **EPERM**，但脚本"正确回滚、也不报错" | **vite dev / vite preview 还开着**：dev 的 watcher 持有中间目录 `.build-staging`（Vite 只自动忽略 `build.outDir`，不忽略自定义中间目录），preview 持有 `dist` | 顺序必须是：停服务 → `npm run build`（看 `✓ 构建完成，dist/ 已更新`）→ 在 `dist/assets` 里搜新选择器确认 → 再起服务。另：从 PowerShell 手动 `Rename-Item dist` 能成功，**不能用它判断目录是否被占用** |
| 无头 Chrome 在沙箱里**起不来** | crashpad `OpenProcess: 拒绝访问(0x5)`、profile `Lock file can not be created`、mojo platform_channel Check failed | 需要放宽文件权限；应急预览可用 `python -m http.server 4173 --directory dist --bind 127.0.0.1`（**不拉子进程**，但注意它只提供 127.0.0.1/localhost，`[::1]` 不通，与 vite 的约定相反） |
| chroma 截图 / 视觉回归全绿但画面没有列车 | 列车层 `pointer-events: none`，命中判定是纯算术 | 改组件后必须**像素级**确认列车真的画出来了（`train_freeze.mjs`） |
| 对比度"怎么调都到不了 4.5:1" | 区块画最亮处背景相对亮度 L≈0.19，**任何文字颜色都到不了 4.5**（纯白也只有 4.0） | 结论：在非暗底上"提亮装饰背景 + 文字达标"无解；正确方向是压背景（scrim）+ 提亮文字两件事同时做。**这条结论在本项目推导过两次，别再重复推** |

### 6.5 缺陷统计（各报告口径）

| 报告 | 阻断 | 建议 | 吹毛求疵 | 备注 |
| --- | --- | --- | --- | --- |
| `CODE-REVIEW.md`（第一轮） | 3（全修） | 4（1 修 3 留） | 3 | 重点是"处理失败且无法回退"这一类缺陷 |
| `PERF-REVIEW.md`（第二轮） | 4（全修） | 5（全修） | 3 | + 8 项"未修附理由"；评分卡在本轮 |
| `PERF-REVIEW-v2.md`（第三轮，立方体之后） | 2（全修） | 7（全修） | 5 | + 5 项"未修/未验证附理由" |
| `UI-REVIEW.md`（视觉层） | 4（3 修 1 留） | 6（留作待办） | 4 | 三轮改版记录（首屏重排 → 透明度分级/手绘按钮 → 云层与遮罩） |

四份都明确标注了**未审 / 未验证范围**，不把"没测"写成"没问题"——这是这个项目文档质量最高的地方。

---

## 7. 验证体系（这个项目真正的"测试"）

没有单测框架、没有 CI，取而代之的是 `_repo/` 下 80+ 个**零第三方依赖**的自建脚本（Node 内置 http 服务 + 无头 Chrome + CDP）。

### 7.1 布局 / 排版类

| 脚本 | 回答什么问题 |
| --- | --- |
| `_repo/perf/measure.mjs` | 全站几何 + 计算样式快照（`--geom=<名>`）；**"排版有没有被改"的既定判据** |
| `_repo/perf/geom-diff.mjs` | 逐元素对账两份几何快照（须 0 差异） |
| `_repo/perf/overflow.mjs` | 哪一面被 `overflow: hidden` 切掉了什么（`--settle` 逐面滚过去等动画落定后测） |
| `_repo/perf/facecheck.mjs` | 逐面报溢出与余量（`node _repo/perf/facecheck.mjs <dist> <标签>`） |
| `_repo/perf/layout-ab.mjs` | A/B 两套 CSS 的版面差异 |
| `docs/perf/VERIFY-layout.txt` | 349 元素几何与计算样式全等的原始对账记录 |

### 7.2 性能 / 交互类

| 脚本 | 回答什么问题 |
| --- | --- |
| `_repo/perf/audit.mjs` | 空闲 rAF 归因 / 逐面滚动帧预算（p50·p95·max·>32ms 帧数，并归因到"跨面瞬间"还是"静止期"）/ 悬停帧率 / 长任务 / 控制台错误（**带 URL**）/ **交互自测**（面表、锚点、内容渲染、`stillHiddenInActiveFace`） |
| `_repo/perf/verify-probe.mjs` | 把站内 `?perf=1` 探针在无头 Chrome 里跑一遍，确认交给用户时可用（文本里出现 `undefined`/`NaN` 即失败） |
| `_repo/perf/inspect-html.mjs` | 核对 `dist/index.html` 的标题 / 描述 / preload 清单 / CSP，并报"是否残留 `/media/` 绝对路径" |
| `_repo/perf/geom-diff2.mjs` | 几何对账的**按身份配对**版（`key = 标签+类名+文本前 24 字`）——下标法在元素数量一变时会整体错位 |
| `_repo/perf/verify-changes.mjs` | 定点行为回归：① `.skip-link` 是否不再被 `smoothAnchors` 拦截、Tab 是否真落进 `<main>`；② 导航高亮在整条滚动轴上是否与基线逐点相同 |
| `_repo/perf/smoke.mjs` | 预览冒烟：控制台错误 / 失败请求 / 关键 DOM 就位 / **全站 id 唯一性**（回归判据）/ 立方体是否按预期揭示首屏 / 锚点落点 |
| `_repo/perf/loaded.mjs` | 停在首屏不滚动，看哪些图片资源已被拉取（决定 CSS 背景图会不会额外增加首屏成本） |
| `_repo/perf/jank-rank.mjs` | **卡顿归因排名**，并解决"排名可信度"：同一次加载内配置交错 + 每项重复取中位数 + 漂移指示；鼠标改走 CDP `Input.dispatchMouseEvent`（页面内 `dispatchEvent` 会绕过命中测试） |
| `_repo/bg/perfcost.mjs` | 列车每帧写样式的成本对比（`--idle` / `--count-writes` / `--freeze-raf` / `--off=<选择器>`） |
| `_repo/bg/layers.mjs` | 合成层账本：列出所有 composited layer 的尺寸与总面积（"要光栅多少像素"是构造性的） |
| `_repo/bg/speed_probe.mjs` | 实测巡航 %场景宽/秒 与 rAF 帧率 |
| `src/lib/perfProbe.ts` | **真机**数据采集：`http://…/index.html?perf=1` → `__perfProbe.report()`（帧间隔 p50/p95/p99、掉帧按 `滚动/翻面`·`过渡中`·`静止` 三桶、长任务、CLS/LCP/FCP/DCL/Load、资源体积与命中缓存数） |

### 7.3 背景 / 视觉类

| 脚本 | 回答什么问题 |
| --- | --- |
| `_repo/bg/train_check.mjs` | 列车方向 / 钳位 / 悬停（真实鼠标事件路径） |
| `_repo/bg/train_freeze.mjs` | **像素级**：冻结列车 + 画出着地线参考线截图 |
| `_repo/bg/contact_line.py` / `rail_edge.py` / `rail_truth.py` | 着地线的两路独立量法（精灵车体底边 / 钢轨暗带上沿） |
| `_repo/bg/contrast.mjs` + `contrast_report.py` | 真实背景像素上的对比度（p96 口径）；末行须为「最坏比 < 要求 的有 0 个」 |
| `_repo/bg/shoot.mjs` / `drift_check.py` | 云漂移动效验收（两条判据，见下）；`_repo/vid/skygen.py --mask` 是云层遮罩的**生成/重生成**命令（`mask_w=1024`、`feather=4`、边界自动贴合实景交界） |
| `_repo/bg/build_assets.py` | 从源渲染图分离底图 / 列车精灵，并导出几何常量 |

**动效验收必须两条都要**（只看第一条会完整漏过"做了但看不出来"）：

1. 实景区差异 >2 的像素为 **0**；
2. 定格 t=0 与 t=5s、天空区变化 >8/255 的像素占比 **> 0.5%**。

（背景：第一版只验了第 1 条，结果 `ease-in-out` + 端点对齐让开场前 5 秒天空几乎静止——实测变化像素占比只有约 0.1%，肉眼就是"没动"。）

### 7.4 实测数字

> ⚠️ **数字必须带时代标签**，三代不可直接比：**第二轮**（长区块 + `hero-cat` 首屏画）/ **第三轮**（9 面棱柱）/ **当前 HEAD `8fb795f`**（2026-10 换背景后的 SkyStage 连续天空）。下表是**第二轮**的口径（`PERF-REVIEW.md` §4.1，夹具 `_repo/perf/measure.mjs`，Slow 4G = 1.6Mbps / 150ms RTT，视口 1600×900，冷缓存，预置 `site-entered=1` 跳过幕屏）：

| 指标 | Slow 4G | 不限速 | 性质 |
| --- | --- | --- | --- |
| FCP | 4504 → **4180 ms**（−324） | 1464 → 1512 ms（噪声内） | 受带宽约束 |
| **LCP** | 4688 → **4348 ms**（−7.3%） | 1704 → 1736 ms（噪声内） | LCP 元素 = `h1.hero__title` |
| CLS | 0.0002 → **0.0002** | 0.0000 | **无回退** |
| 空闲 rAF | 120 → **0** 次/秒 | 同 | **决定性** |
| 首屏 WebP 传输 | 579.9 → **529.2 KB**（−50.7） | 同 | 确定性（**hero-cat 时代**，非当前产物） |
| 4xx 请求 | 3 → **2** 个 | 同 | 确定性 |
| 滚动帧间隔（整页 5868px） | p50 8.3 / p95 9.7–14 ms | 同 | >32ms 仅 0–5 帧 |

**第三轮（棱柱时代）的口径**：空闲 1 秒内**页面自身** rAF = **0 次/秒**（探针自身 121 次/秒，是夹具自己的测量循环）；滚动帧预算三趟 p50 稳定 **8.4ms**（≈120fps 档）、p95 33.5–66.7、max 133–183ms、>32ms 帧 27–41，长任务 0–1 条；悬停与滚动同档（p50 8.3–8.4）。

**归因（这一节推翻了作者自己最初的假设）**：

- **Google Fonts 不是瓶颈**：字体样式表 505ms 就取完了，而 FCP 在 4180ms。
- **真正的头号成本是"客户端渲染"**：首屏必须等 253.9 KB 的 JS 下载完并执行完才有第一个像素。若做预渲染 / SSG，Slow 4G 下 FCP 会落回 ~950ms 量级——这是架构级改动（构建期产出静态 HTML + hydration），**建议单独立项**。评分口径上：把"关键路径加载"按与预渲染方案对比来评会给 80–85、综合落到 92 左右；做了 SSG 该项可给 98、综合可达 98。
- **全屏颗粒层的 `mix-blend-mode` 被实测证伪**：成对 A/B 同档（FCP 952/960、LCP 1096/1096、帧间隔 p50 8.3 相同）→ 保留是正确的决定（诊断开关 `measure.mjs --nograin=true`）。
- **绝对数值偏悲观**：无头 Chrome 走**软件光栅**，首屏那个恒定 ~1.2s 的"加载完成 → 首次绘制"间隔与 259–305ms 的长帧（**脚本只占 12–32ms**）高度符合"全屏高斯模糊 + `backdrop-filter` + SVG 湍流滤镜在 CPU 上做首帧合成"的特征。**相对改进可信，绝对值真机应明显更好。**
- **首屏画质标定**（`_repo/img/tune_hero.py`，产物 `docs/perf/hero-q-compare.jpg`）：q78 = 258.3 KB（基准）→ **q68 = 207.6 KB（−19.6%），平均绝对误差 3.08/255、99 分位 17**；q64 只多省 3%，q56 开始出现可辨块状噪声。AVIF 在同等体积下 PSNR **反而略低于** WebP（188KB 处 33.72 vs 33.79 dB）→ 未引入额外 `<source>`。
- **`layers.mjs` / `perfcost.mjs` 的意义**：帧时间在本机 p50 能在 **8.6 ~ 81.7ms** 之间跳（机器噪声底 > 各层差异），所以"**要光栅 / 合成多少像素**"与"**每帧改几个属性**"这类构造性数字才是可靠的对账依据。

### 7.5 「排版一律不许改」的定量验证（用户硬约束，值得复用）

没有停在"我没改 CSS"这种自述上，而是做了三层对账：

1. **逐元素几何 + 计算样式**：元素数 349 = 349，页面尺寸 1600×6768 全等，计算样式差异 **0 / 349**；几何差异 2 / 349，且都是**动态光标的两个图层**（旧代码的常驻 rAF 让它们每帧被写到视口中心；新代码在指针未移动前根本不写 `transform`），两者都处于 `opacity: 0`，肉眼不可见。
2. **像素对账 + 噪声底**：同版本跨进程两次截图差异 **0 像素**（说明渲染是确定性的）；两版本交叉对比差异 9124 px / 2,070,000（0.44%），且只落在两处——首屏画作区（就是被重压的 WebP；**文字列差异像素为 0**）与三个装饰性描边大字的 1px 轮廓（几何与计算样式与基线全等，承载它的 CSS 产物与图片两侧逐字节相同 → 是 `-webkit-text-stroke` 的光栅差异，不是版式变化）。
3. **页面高度**：两侧均为 1600×6768，逐像素同一。

---

## 8. 项目里的"第二份资料"：`clean` 项目交接文档

`HANDOFF.md`（989 行）**不是本站的文档**，而是同一个人另一个项目（`github.com/mianmianMilkCandy/clean`，C 盘清理工具）的交接审查。它与本站共用工作目录，容易被误当成网站资料，这里做一次定位与去重说明：

- **技术栈完全不同**：Python 3 + `pywebview`（WebView2）+ 零框架 `http.server` + PyInstaller onefile；前端是 **Lit 3 + Web Components + Material 3**（不是 React），Vite 7 + TS 5.9。
- **它的核心价值是一份"缺陷密度极高"的负面教材**：阻断 9 项（P1–P5 后端/打包、F1–F4 前端）、建议 19 项、吹毛求疵 18 条。
- **最该记住的三条**（与本站的"纪律"形成鲜明对照）：
  1. **破坏性 API 零认证且可被跨站触发**：无鉴权、无 Origin/Host 白名单、`_read_json` 不校验 `Content-Type`（跨站可用 `text/plain` 发"简单请求"绕过 CORS 预检），而清理白名单里有不依赖用户名、可猜的固定路径。
  2. **唯一的保护闸是 fail-open 的**：`is_protected()` 在 `Path.resolve()` 抛 `OSError` 时返回"不受保护"——安全函数应当相反（不确定就当受保护并跳过）。
  3. **永久删除 + 目标包含用户真实文件**：`shutil.rmtree` / `unlink`（无回收站、无 dry-run），而"聊天缓存"里 `FileRecv` / `FileStorage\File` 是**接收目录不是缓存目录**；风险提示只存在于 CLI 的 `main()`，GUI 路径完全没有。
- **对本站的启示**：这类"没被验证过就不会被发现"的问题（`c-clean.spec` 里写死作者本机绝对路径、`DATA.mkdir` 缺 `parents=True`、保护闸 fail-open）与本站刻意建立的验收体系正好是同一个病根的两面——**本站的 80+ 个验收脚本就是为了不落进这个坑**。

---

## 9. 文档与代码的漂移（本次浏览新发现，建议核对后修正）

浏览时用源码逐行核对了文档与关键记忆，发现若干**文档/记忆写的数与代码实际值不一致**。以下以**代码为准**列出，供后续修正：

| # | 文档 / 记忆写法 | 代码实际 | 影响 |
| --- | --- | --- | --- |
| 1 | 项目关键记忆：矮屏（≤840px）`--train-scale: 0.34` | `Cube.css` 的 `@media (max-height: 840px)` 写的是 **0.44**（`0.34` 是 `SkyStage.tsx` 的 `K_MIN`，远端最小缩放，是另一个概念） | 容易把两个数混为一谈 |
| 2 | 项目关键记忆：`cloudDrift` 为 ±2.2% / scale 1.06，周期"首屏 26s" | `base.css` 实际是 **±3% / scale 1.074**；代码里只有 `skyDrift 30s`（整页背景）、`cloudDrift 11s`（项目卡）、`gateDrift 34s`（幕屏），**没有任何 26s**（26s 属于已删除的首屏云层） | 记忆是历史版本 |
| 3 | `art-scrim.css` 注释：地平线钉在 **78vh**，列车车体在 56~78vh；白纱"56% 之后开始退、70% 归零" | 实际生效 `--sky-hz-screen: **80vh**`（也是 `tokens.css` / `Cube.css` 的说法）；白纱梯度实际是峰值 68% 维持到 **52%**，`62%` 降到 34%、`70%` 降到 10%、`78%` 才 transparent | 注释头部是旧口径，梯度值才是实现 |
| 4 | `Cube.css` 注释引用 `.cube__slot .section { padding-block: 2.25rem }` | 同文件实际规则是 **1.5rem**（注释是旧值） | "特异度会盖掉 `.face-body`"的结论仍然成立 |
| 5 | `DEVELOPMENT.md` 写"首屏玻璃卡 72% 透明"（第三轮） | 当前 `Hero.css` 是 `color-mix(in srgb, var(--ink-700) **62%**)` | 以代码为准 |
| 6 | `README.md` 说"卡片 66% 透明度"（UI-REVIEW 第二轮）、"72% 透明"（第三轮）、"62%"（`Hero.css` 注释） | 同一处，当前实际 **62%** | 同一处三代数字 |
| 7 | `README.md` / `DEVELOPMENT.md` 的"目录结构"仍列 `Seam`、`--seam-*`、`.has-art::before` 等 | `Seam` 组件与令牌**保留但已不被引用**（只给"关闭 3D"的降级路径）；`.has-art::before` 的 mask 在 `.cube .has-art::before` 里被重置为 none | 属"保留的降级路径"，不是活跃路径 |
| 8 | 新增项目的改动面被写成"改两处" | 实际是**三处**：`projects.ts` + `PROJECT_FACES` + `Projects.tsx` 的 `type ProjectId` 联合类型 | 照"两处"改会漏掉类型 |
| 9 | `SkyStage.tsx` 文件头注释写了 `o(xc) = 0.88 + 0.12·k` 的大气透视 | 当前 `apply()` **没有实现** `--to` 透明度（只写 `--tx` 每帧、`--ty`/`--tk` 跨档） | 注释描述的是未实现的能力 |
| 10 | `About.tsx` 的注释与 JSX 注释都写"**四张**能力贴纸" | `profile.ts` 的 `capabilities` 有 **5 组**，`About.css` 的 `.about__highlights` 也是 `repeat(5, …)` | 纯注释滞后（与"4 列改 5 列"那次排版压缩同源） |

另有两处**跨文件同步风险点**（不是错误，但改一处必须改另一处）：

- `--sky-hz: 60.37873270211216%` 与 `SkyStage.css` 的 `--sky-hz-len: calc(0.6037873270211216 * …)` 是同一个数写了两遍。
- `_repo/bg/out/meta.json` 的几何常量 / `tokens.css` 的 `--sky-ar`·`--sky-hz` / `SkyStage.tsx` 的 `TRAIN.*` / `SkyStage.css` / `rail_overlay.py` 五处必须一致，注释已声明这个耦合。

---

## 10. 未验证范围（诚实清单）

- **未做动态运行验证**：本机沙箱下无头 Chrome 起不来（crashpad `OpenProcess: 拒绝访问(0x5)` + mojo `platform_check` 失败，实测复现），因此本轮**没有**产生新的截图与新数据；§7 的所有实测数字均引自仓库内的历史报告与脚本输出记录。
- **视觉证据的时效性**：`docs/ui-review/*.jpg`（20 张）是**"每个区块各压一张画"时代**的截图（画面里是黄昏主题与台阶上的猫），**不能代表当前形态**。当前形态的截图证据是 `_repo/bg/shots/`（2026-10-10）与 `_repo/bg/out/`——但它们只有背景合成层（天空 + 列车），**不含 UI 文字层**。
- **未验证**：真实设备触摸交互、Safari / Firefox 渲染差异（本机只有 Chrome 可无头截图）、屏幕阅读器实测、全量 Tab 序走查、axe / Lighthouse 跑分。
- **未验证**：真机 / 真实 GPU 复核（尝试 `--enable-gpu / --use-angle=d3d11 / --enable-gpu-rasterization` 未取到可信数据）；3D 舞台自身的每帧成本（9 个面各带一张全屏画的固有代价）。
- **Google Fonts 在本机取不到（离线）**，历史上所有截图与对比度都是**回退字体**下的结果；真机加载 Inter Tight / JetBrains Mono 后标题与元数据的字宽会有小幅变化。
- **未做 CSP 强制生效的故意违规测试**（只验证了策略解析无误且不破坏站点）。
- 本轮为**只读浏览 + 文档产出**，未新增代码验证；`_repo/tmp/shot.mjs`（临时截图驱动）与 `_repo/tmp/` 已 gitignore，不属交付物。

---

## 11. 一句话总结

这是一个**"个人作品，但按团队工程标准做验收"**的项目：视觉上靠"半透明白纸 + 发丝线 + 单一暖赭强调色"建立克制的高级感，结构上把整站压成一根 9 面棱柱并逼出"一屏一面"的排版预算纪律，工程上用手写的安全构建、两层安全头、零第三方运行时和 80+ 个自建验收脚本替代了测试与 CI。

而它最值得复用的不是任何一条 CSS 技巧，而是两条方法论：

1. **凡是"看不见"的东西都必须有可复算的判据**——排版不能用肉眼判断（逐元素几何对账）、动效不能只看"有没有差异"（还要看"动不动得出来"）、验收工具本身也会骗人（假通过、假读数、探针自造假阳性）。
2. **性能纪律一旦定下，就会反过来改写视觉决策**——面内不做模糊、云只平移不缩放、`clip-path` 换 `scaleX`、每帧只写一个自定义属性。这些不是"优化"，而是这套视觉得以成立的前提。

---

## 附：关联资料索引

| 想深入什么 | 看哪份资料 |
| --- | --- |
| 整站定位与技术栈速览 | `README.md` |
| 设计约定 / 令牌细节 / 构建回退 / 踩坑记录（最全的开发口径） | `DEVELOPMENT.md` |
| 第一轮代码审查（"处理失败且无法回退"专题） | `CODE-REVIEW.md` |
| 第二轮：代码审查 + 性能实测 + **评分卡**（安全/性能/排版分项口径） | `PERF-REVIEW.md` |
| 第三轮（立方体时代）：空闲 rAF、逐面裁切、滚动帧预算 | `PERF-REVIEW-v2.md` |
| 视觉层审查与三轮改版记录 + 截图方法学 | `UI-REVIEW.md` |
| 另一个项目（C 盘清理工具）的交接与缺陷清单 | `HANDOFF.md` |
| 令牌唯一来源 | `src/styles/tokens.css` |
| 排版基线（reset / 布局原语 / 按钮 / 动效） | `src/styles/base.css` |
| 正文白纱（可读性的主承载） | `src/styles/art-scrim.css` |
| 立方体舞台几何 + 面内硬纪律 + 实测溢出表 | `src/components/Cube.css` |
| 滚动驱动模型 | `src/lib/cube.ts` |
| 连续背景层实现 | `src/components/SkyStage.tsx` + `SkyStage.css` |
| 排版对账原始记录 | `docs/perf/VERIFY-layout.txt` |
| 实测原始数据 | `docs/perf/*.json` |
