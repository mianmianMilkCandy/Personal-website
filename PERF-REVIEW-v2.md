# 性能审查 · 第三轮（立方体舞台之后）

**起点**：`main` @ `bde20a4`（面内进出场动画那一版，工作树干净，可直接 `git checkout bde20a4 -- <文件>` 回退）
**本轮诉求（用户原话）**：① 把三份简历资料填进网站；② 浏览一遍项目、**优化卡顿**；
③ **不要出现预埋 sleep**；④ 删掉「掘金 / 博客」（用户没有这个）；
⑤ 资料里没给的内容先问，别自己编。
**验证方式**：无头 Chrome 154 + CDP 实测（自建夹具 `_repo/perf/audit.mjs`、
`_repo/perf/overflow.mjs`，零第三方依赖），逐面几何对账 + 交互自测 + 帧预算。

> ⚠️ 这一轮与第二轮（`PERF-REVIEW.md`）**不可直接比数值**：第二轮之后整站从"一叠长
> 区块"改成了"一根棱柱的 9 个侧面"，页面的渲染模型已经换了一代。

---

## 零、一句话结论

本轮修掉 **2 个阻断级**（指针收敛判据恒真导致的常驻空转；9 面中有 4 面内容被静默裁切）
和 **7 个建议级**性能问题，并完成真实资料入站与占位内容清理。
可判定的改进：**空闲 rAF 页面自身 0 次/秒**（修复后实测，归因见 §4.1）、
**每面内容裁切 36/27/60/16px → 全部 0**、**滚动帧脚本长任务 0–1 条**、交互自测 18 项全绿。

| 维度 | 结论 |
| --- | --- |
| 性能 | 空闲开销归零；滚动 p50 8.4ms（120fps 档），长帧集中在跨面瞬间与无头合成器降频（见 §4） |
| 内容 | 手机号不上站、博客项删除、占位卡与占位徽标清零、软著两项入站 |
| 排版 | 只有"面内留白压紧 + 项目卡视觉带 230→196px"两处主动改动，其余为渲染路径改写（观感等价，见 §3.4） |

---

## 一、分级结论

### 阻断级（全部已修，附实测判据）

| 编号 | 问题 | 为什么算阻断 | 判据（实测） |
| --- | --- | --- | --- |
| **B1** | `DynamicCursor` 的收敛判据写成 `rx !== px`（严格浮点比较）：缓动是 `rx += dx * 0.16`，**永远落不到整数坐标上**，于是 "还有位移" 恒为真、rAF 循环永远续帧 | 指针每次移动之后，会多跑约 20–30 个"其实已经不动"的帧才停（≈0.3–0.5 秒的纯空转）；而本站指针几乎一直在动，等于**长期挂着一个 60fps 回调**。改前/改后各用探针量过：**0 → 0**（见 §4.1 的说明：修复后才是可信读数） | 修复后空闲 1 秒内**页面自身**申请的 rAF = **0 次/秒**（按回调源码归因）；修复前那段"已经收敛却还在跑"的窗口在 `--enable-gpu` 之外的条件下必然存在（纯算术可证） |
| **B2** | 面上 `overflow: hidden` + 面高恰好 100svh，而 4 个面的内容比一屏高 → **被从底部硬切**，控制台零报错 | 用户**看不见**最后一条经历 / 项目要点 / 技术栈与页脚；这正是"项目经历填进去却像是没填"的成因 | 逐面落定实测（`overflow.mjs --settle`）：`about-story 36px` / `work-clean 27px` / `work-dca 60px` / `contact 16px` → 修复后**全部 0** |

> **B2 的定位过程值得复述**：第一次量出 `contact 溢出 16px` 是**假读数** ——
> 收尾页脚没包 `Reveal`，在"非当前面"上处于退场位姿（`translateY(16px)`）。
> 静止在首屏去量，读到的就是这个偏移。所以工具改成了"滚到那一面、等过渡走完再量"
> （`--settle`），四个真溢出里只有三个是真的，另一个是工具自己在骗人。

### 建议级（全部已修）

| 编号 | 问题 | 处置 | 判据 |
| --- | --- | --- | --- |
| **S1** | `base.css` 在文档根上写 `scroll-behavior: smooth` —— 鼠标滚轮的每一格都变成缓动追赶，而且会与 `lib/cube.ts` 打架（旋转角读 `window.scrollY`，被缓动拖住时角度跟不上指针） | 根上删除；新增 `lib/smoothAnchors.ts`，**只在点击 `href="#…"`** 时 `scrollIntoView({behavior:'smooth'})`，并补写地址栏 hash | `getComputedStyle(html).scrollBehavior === 'auto'`；锚点点击后 `location.hash === '#contact'`、落点 7199（面起点 7200 − 1） |
| **S2** | `revealObserver.ts` 里 `setTimeout(revealIfInView, 700)` 的"睡 700ms 再统一量一遍"轮询：每个元素多付一次跨帧强制布局，而它想兜的场景本就由 IntersectionObserver 自身回调覆盖 | 整段删除；首屏那批只保留挂载时的 3 帧几何检查，并把上下两个判据合并成**一次** `getBoundingClientRect` | 全站无 700ms 级别的 `setTimeout`（除 `EntryGate` 与 CSS 同长的 620ms 卸载）；滚完整页后当前面 `stillHiddenInActiveFace = 0` |
| **S3** | `lib/cube.ts` 每个滚动帧读 `stage.clientHeight`（布局读数），而同一帧刚写完 9 个面的 `transform` 与 `--shade` —— 读写交替迫使浏览器每帧重算整盘布局 | 高度只在 mount 与 `resize` 时量（值恒为 100svh） | 见 §3.3；滚动帧内不再有强制布局读 |
| **S4** | `Nav.tsx` 每个滚动帧读 `documentElement.scrollHeight`（整文档布局依赖） | 缓存为 `maxScroll`，改用 `ResizeObserver(documentElement)` 在尺寸真变时重量 | 同上 |
| **S5** | 面内 4 类元素带 `backdrop-filter`（`.hero__card` / `.glass` / `.pill--quiet` / `.btn--ghost`）：面一直在转，等于要求合成器**每帧**重采样背后内容并重跑高斯模糊，还会把它们踢出栅格缓存 | `Cube.css` 统一在面内关掉；**固定导航与入场幕屏保留模糊**（它们不在转动的舞台上） | `getComputedStyle` 实测：`heroCard / pill / nav(初始) = none`；结构上 `.nav.is-stuck` 仍带 `blur(16px)` |
| **S6** | 项目卡视觉带用 `transition: clip-path` 擦开 —— 每帧整层重新栅格化 | 改成"静态裁切 + 合成层位移"：外层 `overflow` 裁切不动，内层 `.project__visual-wipe` 只做 `transform: scaleX(0→1)` | 观感一致（从左边铺开）；动画属性只剩 `transform` / `opacity` |
| **S7** | 首屏两处"每帧重画一整层"：鼠标跟随聚光（全屏 `radial-gradient` + 每帧改 `--mx/--my`）与视差写在父层（父层的 `will-change` 会把 2000px 大图连同其 `filter` 一起拉去重栅格化） | 聚光**删除**；视差改为把 `--parallax` 写在 `<img>` 自己身上（只动它自己的合成层） | `document.querySelector('.hero__spotlight') === null`；视差仍生效（`--parallax` 仍在 `<img>` 上） |

### 吹毛求疵（已修）

- `base.css` 的 `text-rendering: optimizeLegibility` 删除（对每个文本节点强制算字距与连字，中文长文本尤其贵；实测 `textRendering === 'auto'`）
- `Nav.css` 把 `backdrop-filter` 写进 `transition` 删除（不该动的属性不该进 transition，否则每次吸顶/还原都起一条"模糊形成/消失"的合成动画）
- `tokens.css` 的 `--page-bg-blur` 56px → 28px（源图本身只有 160px 宽且已预糊，56px 属于重复劳动，而它是固定铺满视口的一层）
- `.project__badge`（占位徽标）与 `Project.placeholder` 字段连同第三张占位卡一起删除；`socials` 里「掘金 / 博客」与 `Icon.tsx` 里对应那条死映射一并删除
- `App.tsx` 的面表改为由 `PROJECT_FACES` 展开（新增项目只改两处，不再手写锚点）

### 未修 / 未验证（附理由）

| 编号 | 事项 | 为什么不修 / 怎么标 |
| --- | --- | --- |
| **U1** | 滚动长帧（p95 33–67ms、max 100–183ms）里的**栅格化成本** | 无头 Chrome 走**软件光栅**（无 GPU），本站又恰是"全屏 3D 旋转 + 多层遮罩"的形态，这档读数偏悲观。试过 `--gpu --use-angle=d3d11 --enable-gpu-rasterization`，Chrome 直接卡死不返回，**未能取到 GPU 档数据** → 标注为未验证 |
| **U2** | 长帧的另一半是**无头合成器在空闲降频** | 归因证据：每次跨面滚动后都打时间戳，长帧里"贴近滚动瞬间（<80ms）"与"散落在静止期（≥80ms）"几乎各占一半，且 `longtask` 计数为 0–1 —— 静止期本不该有栅格化工作。**结论是夹具偏差，但没有真机数据可证伪**，故不写成"已解决" |
| **U3** | 3D 舞台本身的每帧成本（9 个面各带一张全屏画 + mask + 网格遮罩） | 这是当前设计形态的固有代价。真要再降一档，选项是：给 `prefers-reduced-motion` 或低端设备提供"平面分页"降级路径（`cube.ts` 已经有 `reduce` 分支吸附、`Seam` 与 `--seam-*` 令牌也保留着）。**未实施**：那是一次结构性改动，超出"优化卡顿"的范围 |
| **U4** | 真机 / 真实 GPU 复核 | 本机沙箱下无法稳定启动带 GPU 的无头 Chrome（同 U1）。**要用户在自己浏览器里用 DevTools → Performance 录一段滚动**才能定论；操作方法见 §5 |
| **U5** | `portrait.jpg` 与 `favicon.ico` 的 404（两条，控制台可复现） | 刻意保留：前者是"把图丢进 `public/media/` 就自动生效"的探测机制；后者是缺图标。两者都不影响渲染 |

---

## 二、资料入站（按用户逐项确认的结果）

| 事项 | 用户选择 | 落点 |
| --- | --- | --- |
| 第三张占位项目卡 | **删除** | `projects.ts` 只留 clean 与 DeepCognitiveAgent（真实内容来自两份项目分析文档）；`Project.placeholder` 与 `.project__badge` 一并删除 |
| 手机号（简历未提供） | **不上站** | `profile.phone = ''`，`About.tsx` 的 `CONTACT_ROWS` 加 `filter` 剔掉空值行 —— 不会出现「电话 / —」死条目；填上值即自动回来 |
| 教育背景（简历只写"全日制本科在读应届"） | **只写现有的** | 时间线写「在读 / 全日制本科 / 在读应届毕业生 · 中国 · 广东」，不编学校与专业 |
| 头像 / 简历 PDF | **都先留空** | 头像回落成「云」字；`resumeUrl` 留空则按钮不渲染。**都没编造** |
| 额外内容 | **只加两项软件著作权** | 经历时间线新增一条：《社区地慧眼…》2026SR0354008、《明眸全域施工安全监测系统…》2026SR0448309（含登记日期，可面试时提供证书原件） |

真实信息全部来自：`云绵绵甜奶糖-个人简历.md`、`clean-项目分析.md`、`DeepCognitiveAgent-项目分析.md`。

**为让 9 个面各装一屏，项目区新增了一个"目录面"**（`#projects`）：一屏列出所有项目
（编号 / 名称 / 英文名 / 周期，点击落到详情面），详情面一屏一张卡。
理由是一张卡实测约 1080px，比一屏高（B2）。

---

## 三、改了什么（按文件）

### 3.1 数据层

- `src/data/profile.ts`：姓名/英文名/职位/主张/专注/坐标/邮箱/社交（GitHub + 微信）/自述三段/
  时间线四条/能力六组，`UNFILLED` 只剩头像一项。
- `src/data/projects.ts`：两张真实项目卡；`stack` 收敛到 8–9 项、要点 5–6 条（面高约束）。
- `src/components/Projects.tsx`：新增 `PROJECT_FACES`（面 id ↔ 数组下标的唯一映射）与索引面。

### 3.2 渲染路径（性能）

| 文件 | 改动 |
| --- | --- |
| `styles/base.css` | 删 `scroll-behavior: smooth`、`text-rendering: optimizeLegibility` |
| `lib/smoothAnchors.ts`（新） | 文档级委托：只有点击锚点才平滑滚动；补 `history.replaceState`；`prefers-reduced-motion` 下瞬时；畸形 `%` 编码有 try/catch 兜底 |
| `lib/cube.ts` | 滚动帧内不再读 `stage.clientHeight`（含原因注释） |
| `lib/revealObserver.ts` | 删除 700ms 轮询兜底；合并两次几何读为一次 |
| `components/DynamicCursor.tsx` | 收敛判据加 `SNAP_EPSILON` 容差（B1）；`pointerover` 先短路再 `closest()`（原先是每个元素都做一次 DOM 向上遍历） |
| `components/DynamicCursor.css` | `will-change` 从父层移到环（父层提升会让两个子元素共用一层）；小点不再提升 |
| `components/Cube.css` | 面内关掉 `backdrop-filter`（含原因）；面内留白与卡内间距按实测压紧 |
| `components/Nav.tsx` | `scrollHeight` 缓存 + `ResizeObserver`；`Nav.css` 去掉 `backdrop-filter` 过渡 |
| `components/Hero.tsx` / `Hero.css` | 删除鼠标聚光与其 CSS；视差改写到 `<img>` 自身；`will-change` 只留必要处 |
| `components/Projects.css` | `clip-path` 过渡改为 `.project__visual-wipe` 的 `transform` |
| `styles/tokens.css` | `--page-bg-blur` 56 → 28px |

### 3.3 关于"不要在滚动帧里读布局"

浏览器把"样式失效"与"布局失效"分开记账。`slot.style.transform = …` 只让**布局**失效；
紧接着读 `clientHeight` / `scrollHeight` / `getBoundingClientRect()` 会让它**当场重算**。
滚动帧里"写 9 个面 → 读一次高度"就是每个帧白白多一次整盘布局重算 —— 面内又是网格 +
弹性盒的整屏内容，一次不便宜。修法是：**能算/能缓存的几何，就不要在帧里读**。

### 3.4 关于"排版是否被动过"（诚实清单）

本轮**主动**改动的视觉只有两处：

1. **面内留白压紧**：`--sp-7/8/9/10` 与 `.timeline__item` / `.project__body` / `.closing__*`
   的间距（数值见 `Cube.css`，逐条由实测反推）。
2. **项目卡视觉带 230 → 196px**：把 `work-dca` 从 16px 溢出压到 0 的必要代价。

其余改动都是渲染路径改写（`clip-path`→`transform`、父层视差→自身视差、面内去模糊、
根上删平滑滚动），**目标是观感等价**。三处可能与"原来"有主观差异：
面内玻璃不再"揉开"背景（`.hero__card` 与手绘按钮）、鼠标聚光消失、项目卡画作矮 34px。
这三处都在本轮对话里向用户说明过。

---

## 四、实测数据

夹具：`_repo/perf/audit.mjs`（Node 内置 http 服务 + 无头 Chrome + CDP，零依赖）。
视口 1600×900，`localStorage['site-entered']=1` 跳过入场幕屏，冷启动每趟重新导航。

### 4.1 空闲开销

```
空闲 1 秒内 requestAnimationFrame 申请次数（修复后，按回调源码归因）
  页面自身：  0 次/秒
  探针自身：121 次/秒（夹具的测量循环，与被测页面无关）
归因方式：临时包一层 requestAnimationFrame，按回调源码前 60 字符分类
  → 唯一来源是探针自己 `(t) => rec(t)`
```

> **这里必须说清一次测量翻车**：探针最初写成在回调里再套一层
> `requestAnimationFrame(tick)`，每次 tick 申请两帧 —— 读数直接从 60 变成 120，
> **探针自己制造了假阳性**。第一版"改前 121 / 改后 120"的对比因此是错的（两次数
> 都是探针）。修正探针后才拿到"页面自身 0 次/秒"这个**可信**读数。
>
> 修复**前**的页面自身读数没有用修正后的探针取到，所以不写"121 → 0"这种对比。
> B1 成立靠的是算术：`rx += (px - rx) * 0.16` 永不等于整数 `px`，旧判据 `rx !== px`
> 于是在收敛后仍然为真。这也是为什么修法必须是**加容差**而不是"再快一点收"。

### 4.2 滚动帧预算（三趟冷启动，软件光栅）

| 趟 | p50 | p95 | max | >32ms 帧 | 帧数 | 长任务 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 8.4 | 66.7 | 183.4 | 41 | 257 | 0 |
| 2 | 8.4 | 33.5 | 149.9 | 27 | 336 | 1 |
| 3 | 8.4 | 49.9 | 133.3 | 28 | 320 | 1 |

- **p50 稳定在 8.4ms**（≈120fps 档），说明绝大多数帧有充足余量。
- 长帧归因（每次跨面滚动打时间戳）：贴近滚动瞬间 4–6 个、静止期 6–8 个。
  **静止期出现长帧 + 长任务为 0** 指向无头合成器降频，而不是页面的计算/栅格工作。
- 悬停（合成 `pointermove` 扫过标题与按钮）：p50 8.3–8.4、p95 33.4、max 66.6 —— 与滚动同档，
  说明"动鼠标就掉帧"的旧形态（全屏聚光重绘）已经消失。

### 4.3 逐面内容裁切（B2 的判据）

| 面 | 原始溢出 | 只压留白 | 压留白 + 压卡片 | 落定后（最终） |
| --- | --- | --- | --- | --- |
| `about-story` | 36 | 0 | 0 | **0** |
| `work-clean` | 27 | 0 | 0 | **0** |
| `work-dca` | 60 | 16 | 0 | **0** |
| `contact` | 16（假读数） | 16 | 16 | **0** |
| 其余 5 面 | 0 | 0 | 0 | **0** |

### 4.4 交互自测（18 项，全绿）

```
面表            hero / about / about-contact / about-story / about-caps /
                projects / work-clean / work-dca / contact   （9 面）
导航锚点        4 条 href 全部有落点
项目卡          2 张，名字 = C 盘清理工具 / AI 学习与推理项目集；占位徽标 0 个
索引面          2 行 → #work-clean / #work-dca
联系信息        邮箱 / GitHub / 微信；无「电话」行、无「博客 / 掘金」行
锚点跳转        hash=#contact，scrollY=7199（期望 7140–7200 区间）
主题切换        dusk → day → dusk，data-theme 真的变、且能切回
回到顶部        scrollY = 0
首屏文案        标题「云绵绵甜奶糖的主页。」/ 卡片名 / 职位 / SCENE 行齐全
当前面 reveal   stillHiddenInActiveFace = 0（没有任何内容被永久留在 opacity:0）
控制台          仅 2 条 404（portrait.jpg 与 favicon.ico，均为刻意保留，见 U5）
```

---

## 五、用户可自行复核的操作（不依赖我这边的夹具）

1. 打开网站，**按住鼠标不动 5 秒**：任务管理器里该标签页的 CPU 应接近 0
   （页面自身不再申请任何 rAF；指针停止移动后没有任何续帧）。
2. 开 DevTools → Performance，点录制，**用滚轮连续滚完整页**，停止：
   - **Main 轨道不应出现长任务**（自测为 0–1 条）；
   - **Frames 轨道**里掉帧应集中在"翻面那一瞬"，静止时不掉帧；
   - 若掉帧是**持续**的，把 `Cube.css` 里"面内一律不做 backdrop-filter"那一节
     与 `.project__visual` 的裁切再看一眼，或者把 3D 降级路径打开（见 README 的
     降级说明）后复测 —— 这样能区分"3D 形态的固有成本"与"某个具体效果"。
3. 想直接关掉 3D 舞台做 A/B：把 `App.tsx` 里的 `<Cube faces={FACES} />` 换成按序
   渲染 `FACES` 的普通分页（`Seam` 组件与 `--seam-*` 令牌就是为这条降级路径留的）。

---

## 六、回退操作手册

| 想做什么 | 命令 |
| --- | --- |
| 全部撤销本轮改动 | `git checkout bde20a4 -- src README.md` |
| 只撤销某个文件 | `git checkout bde20a4 -- <文件>` |
| 只把面内模糊放回来（接受翻面掉帧） | 删掉 `Cube.css` 里 `.cube__slot .hero__card, … { backdrop-filter: none }` 那一条 |
| 只把项目卡视觉带还原成 230px | 删掉 `Cube.css` 里的 `.cube__slot .project__visual { min-height: 196px }`（会让 `work-dca` 溢出 16px） |
| 只把滚轮的平滑滚动放回来 | 在 `base.css` 的 `html` 里加回 `scroll-behavior: smooth`（会重新引入 S1 的症状） |
| 只想看本轮到底改了哪些文件 | `git status --short` / `git diff bde20a4 --stat` |
