# UI 审查与首屏改版 · 2026-10-08

> 本次做了两件事：**按参考图重排首屏**（含新增"光标配色"功能），以及对全站 UI 做一遍
> **分级审查 + 命名/令牌/无障碍整理**。审查对象是 `src/` 全部样式与组件、`index.html`。
> 视觉证据见 `docs/ui-review/`（均为本机 Chrome 无头截图的 JPEG 副本）。

---

## 一、首屏：与参考图的逐项对账

参考图（ryota.top 首屏）的元素清单与本站落地情况：

| 参考图元素 | 本站实现 | 状态 |
|---|---|---|
| 左上「● RUAN / STUDIO」小字标 | Nav 字标（点 + `nameEn / roleEn`），`--nav-h` 72→60px | ✅ 已有，本次收小 |
| 右上两枚玻璃小胶囊（图标+滑块、四点） | 控件簇「☁ SCENE 01 + 两点」+ **新增**「指针图标 + 6 个光标色板点」 | ✅ 新增一枚 |
| 左下两行大标题 | `欢迎来到，` / `{名字}的主页。`（强调色句号） | ✅ 已有 |
| 标题下方一枚白色胶囊 + `SCROLL DOWN` | `向下滚动进入 ↓` 胶囊 + `SCROLL DOWN`（字距 0.2em） | ✅ 已有，本次收小 |
| 左下沉底小字 `SCENE 01 · IDLE LOOP` | `SCENE 01 · 黄昏 · UTC+8 21:52:30`（钉在首屏最底边） | ✅ **本次新增位置** |
| 右下玻璃 PROFILE 卡 | 玻璃卡：PROFILE / 名字 / 职位 / 坐标 + 专注 | ✅ 已有（第二轮起改为 66% 透明度，并删掉状态行） |
| 画面中央留白不压字 | 猫在中偏左、标题压在下半部（见"已知差异 5"） | ⚠️ 部分 |

### 改了什么

1. **删掉标题上方的眉标**（`Full-Stack Engineer / YOUR NAME` 那一行）。
   理由有两条：它与导航左上角的字标**信息完全重复**；"标题上方再加一个小标签"
   本身就是要避免的模板感来源。删掉之后首屏从"三层信息"收敛成两层。
   （这道眉标原本挂着一个状态点脉冲动画 `dotPulse`；第二轮把卡片里的状态行也删掉后，
   这道动画整条退役，Hero.css 里的 `.hero__dot` / `dotPulse` 已一并清理。）
2. **删掉首屏里第二枚胶囊**（`联系我`）。参考图只有一枚实心胶囊；联系入口保留在
   导航右上角常驻，窄屏也不隐藏。
3. **`SCENE` 小字从正文流里提出来，钉到首屏最底边**（网格第二行、横跨整行）。
   布局改成 `grid-template-rows: minmax(min-content, 1fr) auto`：第一行吃掉剩余高度、
   内容仍然底对齐，第二行就是这条小字。留白关系与参考图一致（胶囊行约在 87% 高度、
   SCENE 行约在 96%）。
4. **一句话主张留在标题下方**（参考图把这类句子放在 PROFILE 卡里）。这是刻意保留的
   差异：它是全站唯一的"主张"文案，压成 12px 的一行比塞进规格卡更合理。
   不想要的话删 `Hero.tsx` 里的 `<p className="hero__tagline">` 即可。

### 硬约束（改之前先看这三条）

- **`--fs-hero` 的上限 6rem 是被"两行"反推出来的**：第二行固定是「{名字}的主页。」，
  8 个汉字 × 6rem = 768px，正好不超过左侧文案列（宽屏 ≈880px）。再大一个字就折成三行，
  左下角立刻散掉（第一版 7rem 就是这么炸的，见 `docs/ui-review/01`）。
  下限从 2.9rem 降到 2.1rem 是因为 2.9rem 在 430px 宽下会让那一行横向溢出。
- **一句话的 `max-width` 必须用 `em` 不能用 `ch`**：`ch` 是"0"的宽度，对中文只有半个字宽，
  `34ch` 会把 20 个字的标语硬折成两行。
- **`.hero__media` 只能覆盖 `.hero__screen` 那一屏**，别让画面铺满整个 `.hero` —— 容器纵横比一高，
  `object-fit: cover` 会把 2.08:1 的横画切成一条竖缝。（本版首屏是单屏 + 底边小字，未动这条。）

---

## 二、控件缩小清单（用户要求"图标按键尽量缩小"）

| 位置 | 之前 | 现在 | 依据 |
|---|---|---|---|
| `--nav-h`（顶栏高） | 72px | **60px** | 参考图顶栏是一条贴边的细线；同时带动 `scroll-padding-top` 与 About 的吸顶偏移 |
| 导航控件簇内边距 | `.5rem .85rem` | `.34rem .7rem` | 目标高度 ≈34px（参考图同款） |
| 控件簇图标 | 1.05rem | **0.85rem** | |
| 控件簇指示点 | 5px | **4px** | |
| 控件簇文案 | `Scene 01 · 黄昏` | `Scene 01`（主题名进 `title`/`aria-label`） | 场景名在首屏 SCENE 行仍有 |
| 导航 CTA 内边距 | `.7rem 1.15rem` | `.55rem 1.05rem` | 约 40px，兼顾触控 |
| 全站 `.pill`（胶囊） | `.95rem 1.5rem`，图标 1.1em | **`.74rem 1.2rem`**，图标 **1em** | 高度 52→46px，与参考图那颗白胶囊等量；≥44px 触控底线 |
| PROFILE 卡图标 | 1.15 / 0.95rem | **0.95 / 0.8rem** | |
| PROFILE 卡内边距 | `--sp-6` | `--sp-5` | 卡整体更紧凑 |
| SCENE 行的 spark 图标 | 有 | **去掉** | 参考图那行只有文字，加图标就多一层噪音 |

新增的"光标配色"胶囊：12px 圆点、命中区用伪元素外扩到 18px、总高约 34px，
与控件簇同高。触屏（`pointer: coarse`）、`prefers-reduced-motion`、≤620px 窗口三种情况
由 CSS 整条隐藏（那三种场合本来就没有自定义光标，或导航放不下）。

---

## 三、新增功能：让用户改光标颜色

| 文件 | 作用 |
|---|---|
| `src/hooks/useCursorColor.ts` | 模块级外部 store（与 `useTheme` 同款写法）：读写 `localStorage['site-cursor-tint']`、把选中值写成 `<html>` 上的内联 `--cur-color`、并暴露"悬停预览" |
| `src/components/CursorTint.tsx` / `.css` | 导航右上角那枚胶囊：指针图标 + 6 个色板圆点 |
| `src/styles/tokens.css` | 色板令牌 `--cur-tint-amber/jade/azure/sakura/ink` + 默认 `--cur-color: var(--accent)` |
| `src/components/DynamicCursor.css` | 光标的点/环从写死的 `--accent` 改为 `--cur-color`（透明度用 `color-mix`） |

**行为设计（三条）**

1. **悬停即预览**：鼠标扫过某个色板，光标当场变那个颜色，不用点下去试错。
   实现上只改 CSS 变量，不写 store、不落 `localStorage`；指针移出控件即还原成已选色。
   键盘 Tab 时 `onFocus` 同样预览。
2. **点击即持久化**，下次进来直接是用户选的颜色（模块加载时就写变量，光标首次出现前已就绪）。
3. **默认"跟随主题"**：`--cur-color: var(--accent)`，切 dusk/day 时光标自己跟着变色。
   色板的**字面色值只写在 `tokens.css`**，TS 里只存 `var(--cur-tint-*)` 字符串，
   所以项目的令牌自检命令继续通过；`--cur-tint-ink` 在白昼主题被覆写成近黑
   （奶白在奶油纸上等于看不见）。

**可访问性**：容器 `role="group" aria-label="光标颜色"`，每个色板是 `<button>` 且
带 `aria-pressed` + `aria-label`/`title`，12px 圆点用 `::after` 把命中区外扩到 18px。

---

## 四、审查结论（分级）

### 阻断级 · 本次已修

1. **`--fg-4` 被当成正文色用（2.44–2.62:1，远低于 4.5:1）**
   落点是页脚、`复制/已复制`、入场幕屏提示、头像占位字母这些**真正要读的文字**。
   处置：新规则"`--fg-4` 只给非文本（分隔符、滚动条、状态点）"，
   把 4 处文字改用 `--fg-3`（`Closing.css` ×2、`EntryGate.css` ×1、`About.css` ×1），
   同时把 `--fg-3` 提到在**最亮的那个表面**上也达标：

   | 组合 | 之前 | 现在 |
   |---|---|---|
   | dusk `--fg-3` on `--ink-900` | 4.76 | **5.70**（`#948d80`） |
   | dusk `--fg-3` on `--ink-700`（项目卡） | 3.94 ❌ | **4.71 ✅** |
   | day `--fg-3` on `--ink-900` | 3.76 ❌ | **5.10**（`#6f6553`） |
   | day `--fg-3` on `--ink-700` | 4.16 ❌ | **5.64 ✅** |
   | day `--fg-3` on `--ink-800` | 3.54 ❌ | **4.80 ✅** |

2. **首屏最底边那行 `SCENE` 小字等不到入场事件**
   根因：全站共用的 `revealObserver` 用了 `rootMargin: '0px 0px -12% 0px'`，
   把视口最下沿 12% 排除在交叉区之外 —— 那是为"滚动才播"设计的，
   而首屏不滚动，落在那条带子里的元素（钉在最底边的 SCENE 行、矮视口下的玻璃卡）
   按定义交不出 `threshold 0.08` 的交叉，会一直停在 `opacity: 0`。
   实测坐标可复算：视口 800px 时有效根底边 = 800 − 12% × 800 = 704px，
   而 SCENE 行的顶部在 769px —— 不相交。
   处置：`observeReveal` 增加"首屏自查"（连查 3 帧 + 700ms 复查，命中就播入场），
   不改任何既有阈值与其它元素的入场行为。
   证据：修复后夹具读出 `.hero__scene-row op=1 in=Y`，截图里那行小字正常显示。
   ⚠️ 诚实说明：修复前那张同位置截图里它确实没出现，但我的截图夹具用的是
   **虚拟时钟**（字体加载失败会引发一次迟到的重排，可能让它意外落进交叉区），
   所以这一条以**上面的代码推导为主证**、截图只作辅证。

3. **入场幕屏声明了 `aria-modal="true"` 却没有焦点隔离**
   幕屏只锁了 `body` 滚动，Tab 一步就落到"门背后"的导航链接上，而焦点在视觉上完全看不见。
   处置：幕屏可见期间给 `main` / `header.nav` / `.skip-link` 加 `inert`，离开时按原状还原。

4. **（未修，因为该规则全站未使用）白昼主题主按钮文字 3.59:1**
   `.btn--primary` 用 `--ink-1000` 当文字色，在 dusk（近黑 on 金）是 10.6:1，
   在 day（奶油白 on 天青蓝）只有 3.59:1。`base.css` 里这条规则目前**没有任何调用方**
   （全站只用了 `.btn--ghost`）。真要启用时把背景换成 `--accent-deep #1f5f8f`
   即可拿到 6.41:1（数字已实测）。

### 建议级 · 未修，留作待办

1. **白昼主题首屏偏"漂白"**：`--hero-scrim` 左侧 0.95 的奶油纸把画面左半压得几乎看不见，
   而 PROFILE 卡又落在画面亮部。本次只把 day 的 `--glass-bg` 从 0.56 提到 **0.72**
   （`docs/ui-review/02` 里卡片文字明显比改前清楚）。要更彻底就得重新调 day 的 scrim 曲线。
2. **`Closing.css` 短视口可能裁掉页脚**：`.closing{min-height:100svh;overflow:hidden}` +
   上下各 6rem 内边距，1280×600 一类的横屏笔电上"回到顶部"可能被裁且滚不到。
   建议改 `overflow:clip` 或把裁切交给 `.closing__glow` 的父层。
3. **`src/data/projects.ts` 里 `tone: ['#62e0d0', …]` 用数据绕过了令牌层**：
   自检命令只扫 CSS 所以报"合规"，但组件层确实出现了字面色值（切主题必错色的入口）。
   建议 tone 也进 `tokens.css`，数据里只存令牌名。
4. **占位徽标被 `aria-hidden` 吃掉**：`Projects.tsx` 里 `.project__visual` 整体
   `aria-hidden="true"`，其中的「占位内容 · 待替换」对辅助技术完全不可见，
   而这恰好是读者最该知道的状态。建议移出该容器或给 h3 加 `aria-describedby`。
5. **字号阶梯有五处跳出令牌**：最刺眼的是 `.contact__copy{font-size:0.625rem}`（10px，
   全站最小可点文本）。建议新增 `--fs-2xs: 0.6875rem` 并让 10px 那处回到 `--fs-mono`。
6. **`DevNotice.tsx` 没有自己的 CSS 文件**，样式实际引用 `App.css` 的 `.devnote*`，
   组件一旦被复用就裸奔。建议搬进 `src/components/DevNotice.css` 并 import；
   同时给 `aria-expanded` 补 `aria-controls`（展开列表无 id、无 `role="region"`）。

### 吹毛求疵

- `.project__badge` 用 `1px dashed`，与全站"发丝实线"的语法不一致。
- `.closing__title-line--ghost` 的描边用 `--line-3`，在白昼主题对奶油纸只有 ≈3.0:1（大字勉强过）。
- 滚动条 thumb：dusk 1.75:1、day 1.40:1，装饰件不强制 1.4.11，但 day 下几乎看不见。
- `*{scrollbar-width:thin}` 打在通配选择器上，会把所有可滚动子容器一起改。

### 已检查且判定没问题（摘要）

- **对比度**：`--fg` 13.5–17.2 / `--fg-2` 6.5–9.5 / `--accent-text` 5.6–13.4 /
  胶囊 13.4–14.2（`--pill-fg` on `--pill-bg`）/ `::selection` 10.6 / 焦点环 ≥3:1，全部达标。
- **令牌纪律**：自检命令命中项只有 `tokens.css` 全文、两处 `@supports(-webkit-text-stroke:1px #000)`
  探测串、两处 mask 的 `#000` —— 允许范围之内，组件 CSS 无漏网字面色值。
- **标题层级**：H1（首屏）→ H2（区块抬头 / 收尾）→ H3 → H4，无跳级、无多 H1。
- **图片**：全部有 alt 或 `aria-hidden`；`loading="lazy"` / `decoding="async"` / 首屏
  `fetchPriority="high"` 齐备；`aspect-ratio` 与 `min-height` 已留盒，无 CLS 风险。
- **动效**：只动 `opacity`/`transform`，无 layout thrash；`prefers-reduced-motion` 下
  observer 不注册、内联无动画、入场幕屏直接跳过。
- **键盘**：全局 `:focus-visible`（2px 强调色 + offset 3px）覆盖全部真实交互元素，
  无一组件私自 `outline:none`；跳转链接与锚点目标都存在。
- **响应式断点**：全站 5 组布局断点互不冲突，无孤儿断点；`--nav-h` 的 4 处消费都无需按断点重算。

### 遗留未审

- 真实设备上的触摸交互、Safari/Firefox 渲染差异（本机只有 Chrome/Edge 可无头截图）。
- 屏幕阅读器实测、全量 Tab 序走查、axe/Lighthouse 跑分。
- Google Fonts 在本机取不到（离线），所有截图与对比度都是**回退字体**下的结果；
  真机加载 Inter Tight / JetBrains Mono 后标题与元数据的字宽会有小幅变化。
- 入场幕屏（`EntryGate`）的最终视觉（它的入场动画在我这套截图里只走到一半）。

---

## 五、验证方式与结果

| 检查 | 命令 | 结果 |
|---|---|---|
| 类型检查 | `node node_modules/typescript/bin/tsc -b` | **exit 0**，无输出 |
| 生产构建 | `node node_modules/vite/bin/vite.js build` | ✅ `index.html 2.43 kB` / `CSS 38.33 kB (gzip 8.46)` / `JS 258.33 kB (gzip 81.93)` |
| 令牌纪律 | `Select-String -Path src\**\*.css -Pattern 'rgba?\(\|#[0-9a-fA-F]{3,8}\b'` | 仅命中允许项（见上） |
| 设计检测器 | `impeccable detect --json <15 个改动文件>` | `[]`（零发现） |
| 对比度 | Python 相对亮度计算 | 见"阻断级 1"表格 |
| 视觉回归 | Chrome 无头（`--headless=new` + `--virtual-time-budget`）+ 同源 iframe 夹具 | 6 张证据图见 `docs/ui-review/` |

**截图方法学（下次要复现时看这里）**：直接用 `--screenshot` 打开站点会踩两个坑 ——
① 首次访问会被入场幕屏挡住；② 自定义光标要等第一次 `pointermove` 才出现。
所以用一个**同源 iframe 夹具**：先在 `localStorage` 里写好 `site-entered` /
`site-theme` / `site-cursor-tint`，再向 iframe 派发合成 `pointermove`，顺便把
关键元素的 `getBoundingClientRect` 与计算样式画在左上角。
另外两个坑：`load` 事件触发时 React 往往还没挂载完（滚动/事件都要延迟重试，
否则会得到"永远是首屏、光标永远不出现"的假象）；`--window-size=430,880` 实际拿到的是
500×760 的视口 —— 窗口尺寸和截图尺寸并不总是相等。

---

## 六、与参考图的已知差异 / 可调旋钮

| # | 差异 | 旋钮 |
|---|---|---|
| 1 | 标题比参考站大约一倍（参考站 ≈2.5vw，本站 5.2vw 上限 6rem） | `tokens.css` 的 `--fs-hero`（降下来更接近参考站的"大留白"气质，但这是你之前明确要求放大的） |
| 2 | 保留了导航右上角的「联系我」CTA（参考图没有） | 删 `Nav.tsx` 里那个 `<a className="pill nav__cta">` |
| 3 | 保留了标题下方的一行"主张"（参考图把这类句子放卡片里） | 删 `Hero.tsx` 里的 `<p className="hero__tagline">` |
| 4 | 保留了导航中部的四个锚点链接（参考图没有） | 删 `Nav.tsx` 的 `nav__links` 列表 |
| 5 | 背景画里的猫在中偏左，标题压在下半部、猫头在标题上方；参考图的主体在正中且不被压字 | 该图 2000×990 在 16:9 视口下**横向裁切自由度只有 218px**，`object-position` 调到头也移不出文案区；要彻底解决得重新裁一版把猫放到右 2/3 |
| 6 | 白昼主题首屏左半画面被 scrim 压白 | `tokens.css` 的 `--hero-scrim` / `--hero-veil`（见"建议级 1"） |

---

## 七、本次改动文件

```
新增  src/hooks/useCursorColor.ts            光标配色的模块级 store
新增  src/components/CursorTint.tsx/.css     导航里的光标配色胶囊
新增  docs/ui-review/*.jpg                   审查视觉证据（6 张）
改   src/components/Hero.tsx/.css            首屏版式重排（删眉标与第二枚胶囊、SCENE 行钉底）
改   src/components/Nav.tsx/.css             接入光标配色胶囊 + 控件簇/CTA 收小
改   src/components/DynamicCursor.css        光标颜色改走 --cur-color + color-mix
改   src/components/Icon.tsx/.css            新增 cursor 图标；删一行死声明 font-size
改   src/lib/revealObserver.ts               首屏元素自查（修"底边元素永不入场"）
改   src/components/EntryGate.tsx            幕屏期间给背景加 inert
改   src/components/About.css / Closing.css / EntryGate.css   --fg-4 正文用法改 --fg-3
改   src/styles/tokens.css                   光标色板、--nav-h 60、--fs-hero 双向收敛、--fg-3 提亮、day 玻璃加深
改   src/styles/base.css                     胶囊尺寸收小、图标 1em
```

> 未提交 git。当前分支 `main`，上一个提交是 `f856840 feat: 移除跟随小猫，改为动态鼠标光标`。
>
> 另：本仓库还没有 `PRODUCT.md` / `DESIGN.md`（设计意图目前只散落在各文件的头注释里）。
> 如果希望这套"宫崎骏绘本 × 工程师仪表盘"的世界观有单一权威文档、后续改动有依据，
> 可以跑一次 `/impeccable init` 把产品事实与设计约定固化下来。

---

# 第二轮：用户反馈后的三处改动

## 九、这轮改了什么

### 1. PROFILE 卡改成"看得见画"的玻璃（透明度 60% 以上）

`.hero__card` 的背景不再是继承 `.glass` 的 `--glass-bg`，而是从主题底色派生：

```css
background: var(--glass-bg);                                   /* 兜底 */
background: color-mix(in srgb, var(--ink-900) 34%, transparent); /* 生效 */
border-color: var(--line-3);                                    /* 底更透了，边得稍微硬一点 */
```

- **实测透明度 66%**（夹具读出 `bg=color(srgb 0.0392157 0.0705862 0.12549 / 0.34)`），两套主题一致。
- 为什么不用 `--glass-bg` 乘系数：那个令牌在两套主题里的 alpha 本来就不一样（dusk 0.46 / day 0.72，
  后者是第一轮为了白昼可读性提上去的），乘系数会让白昼主题反而更实。
- 模糊保持 `--glass-blur`（18px）不动：它把背后的画揉开，文字才不会踩在云朵细节上。
- **怎么调**：把那行的 `34%` 改成 `50%` 就是 50% 透明，改成 `70%` 就是只透 30%。

### 2. 删掉「开放合作机会」那一行

`Hero.tsx` 里 `hero__card-status` 整段删除，`Hero.css` 里对应的 `.hero__card-status`、
`.hero__dot`、`[data-tone]` 与 `@keyframes dotPulse` 一并清掉（全站再无引用）。
`profile.status` / `statusTone` 的数据**保留**在 `src/data/profile.ts` 里并加了注释：
要放回来就恢复那两段。卡片高度从 268px 降到 219px。

### 3. 主页往下的背景画：换成用户指定的四张，并**修好了一直没生效的图层**

用户给的 4/5/6/7 四张图正好是整站画面（图7 首屏猫、图5 关于·回廊横、图6 项目·回廊竖、
图4 收尾·临海石台竖）。其中**图4 一直没被用上**（`prep3.py` 里定义了 `terrace_p` 却从未 load），
这轮把它接进收尾区块，替掉原来那张用户没列进来的横版临海石台（图1 保留在脚本里作备用）：

| 区块 | 画作 | 原图 |
|---|---|---|
| 首屏 | `hero-cat.*`（横/竖两版） | 图 7 |
| 关于我 | `sec-about.webp` | 图 5 |
| 精选项目 | `sec-projects.webp` | 图 6 |
| 收尾 | `sec-closing.webp`（800×1255，95 KB） | **图 4**（原先是不在此列的图 1） |

原图副本这轮补进了 `_repo/img/src/`（此前只存在于会话级附件缓存里，附件一清就再也生成不出来），
`prep3.py` 改成「优先读仓库副本、缺失才回落附件」，于是**换图可以重跑了**。

#### ⚠️ 顺带查出一个一直存在的真 bug：区块背景画与整页氛围层从来没画出来过

**现象**：三个区块背后、整页氛围层，全都没有画 —— 页面下半部分是纯色板。
用夹具读计算样式拿到的铁证：

```
::before op=0.32 size=cover pos=50% 50%
::before bg=url("http://127.0.0.1:5174/assets/media/sec-closing.webp")   ← 404
probe   /media/sec-closing.webp loaded 800x1255                          ← 文件明明在
```

**根因**：`--sec-art` 是在 JS 里以**内联样式**写上去的，值是 `./media/x.webp`（相对地址）；
而消费它的 `background-image: var(--sec-art)` 写在 **base.css** 里。CSS 规范规定
**自定义属性里的 `url()` 以"消费它的那张样式表"为基准解析**，于是相对地址落到了
`/assets/media/…`（生产）与 `/src/styles/media/…`（开发）上 —— 两边都是 404，
图层静默消失，控制台连个错都没有。触发条件是 `vite.config` 里的 `base: './'`
（改成相对路径是为了产物能放任意子目录），只要用相对地址就会中招。

**解法**：新增 `assetUrl()`（`new URL(asset(p), document.baseURI).href`），
凡是"要写进 CSS 变量、由样式表里的 var() 消费"的地址都改用它。
`sectionArt()` 与 `App.tsx` 的整页氛围层两处都已切换。

**判据**：修复后同一夹具读出 `bg=url("http://127.0.0.1:5174/media/sec-closing.webp")`；
截图体积从 231 KB（纯色）涨到 1.38 MB（有画），三个区块与整页氛围层全部显形。

#### 收尾区块的画作可见度单独提了一档

`.closing` 是全站唯一"整屏大字 + 几个链接、没有正文段落"的区块，所以把它的
`--sec-art-opacity` 单独提到 dusk 0.32 / day 0.4（其它区块维持 0.2 / 0.26）。
仍然觉得淡或太抢，就改 `Closing.css` 里那两行。

## 十、第二轮验证

| 检查 | 结果 |
|---|---|
| `tsc -b` | exit 0 |
| `vite build` | ✅ `CSS 38.05 kB (gzip 8.39)` / `JS 258.19 kB (gzip 81.88)` |
| 玻璃卡计算样式 | `bg=color(srgb … / 0.34)` → 66% 透明 ✅ |
| 区块画作 | 计算 URL 绝对地址正确；截图体积 231 KB → 1.38 MB ✅ |
| 视觉证据 | `docs/ui-review/01–08`（首屏黄昏/白昼、光标配色、窄屏、关于·回廊、项目、收尾黄昏/白昼） |

**新引入的两个可调旋钮**（都只有一行）：`Hero.css` 里卡片的 `34%` 透明度、
`Closing.css` 里收尾区块的 `--sec-art-opacity`。
**遗留**：全站 `--page-bg-opacity`（dusk 0.3 / day 0.48）也是这轮才第一次真正生效的，
白昼主题因此比以前"雾"一些 —— 觉得过头就把 day 那档降到 0.3 量级。
真机触控、Safari/Firefox、屏幕阅读器仍未实测（本机只有 Chrome 能无头截图）。

---

# 第三轮：透明度分级、删标题首行、手绘按钮 + 点击光影

## 十一、这轮改了什么

### 1. 透明度按"框的层级"分了三档

| 对象 | 透明度 | 实现位置 |
|---|---|---|
| 首屏 PROFILE 卡 | **72% 透明**（alpha 0.28） | `Hero.css` 的 `.hero__card`（`color-mix(in srgb, var(--ink-900) 28%, transparent)`） |
| 项目卡（"深色底的框"） | **50% 透明**（alpha 0.5） | `Projects.css` 的 `.project`（`color-mix(in srgb, var(--ink-700) 50%, transparent)`） |
| 区块大面（关于/项目的底色层、收尾整屏） | 从 0.82 / 0.92 降到 **0.58 / 0.72** | `tokens.css` 的 `--surface-alt` / `--surface-deep`（两套主题同值） |

实测（夹具读计算样式）：卡片 `…/ 0.28`、项目卡 `…/ 0.5`、手绘按钮底 `…/ 0.12`。

### 2. 首屏标题与卡片标签

- 删掉标题第一行「欢迎来到，」→ 标题变成一行「{你的名字}的主页。」（`.hero__title-line` 也随之删除）。
- 那层"欢迎"的意思挪到卡片标签：`PROFILE` → **`WELCOME`**（配猫图标不变，`.mono` 自动大写）。
- `profile.heroGreeting` 数据保留并注明怎么恢复（`src/data/profile.ts`）。

> 这一条我按你的原话执行了：卡片在语义上本来是"规格卡"，标签写 WELCOME 之后
> 它更像一张欢迎贴纸。想回退就是 `Hero.tsx` 里那一个词。

### 3. 高透明度 + 手绘线条按钮（全部卡片按钮 + 首屏滚动按钮）

落点是既有的两个"次级"变体，没有新增类名：
`.pill--quiet`（首屏滚动按钮、收尾复制邮箱、关于的简历）与 `.btn--ghost`（项目卡的仓库/发布按钮）。

- **底**：只用 12% 的主题底色（`color-mix(in srgb, var(--ink-900) 12%, transparent)`）——真正的高透明度。
- **轮廓**：不用 `border`（那是机器画的直线），交给 `::before` 画一圈 1.5px 线，
  再套一个 SVG 湍流位移滤镜 `#sketch-line`（`feTurbulence` + `feDisplacementMap`，
  定义在 `App.tsx`）把线抖出"手画"的味道。
  **滤镜只作用在描边层上**，文字保持锐利 —— 整块按钮加滤镜会把字也搅糊。
  `border-radius: inherit` 让胶囊与小圆角方形按钮共用同一套。
- **⚠️ 一处必须记住的顺序**：这一节样式必须放在 `base.css` **文件末尾**。
  放到前面会被 `.pill { background: var(--pill-bg) }` 覆盖（同特异度、后来者胜）——
  实测过一次翻车：胶囊底仍是实色白、文字已经变浅色，按钮上的字直接看不见。

### 4. 点击光影（"光影效果"）

`src/lib/clickShine.ts`（文档级一个监听器，`App.tsx` 里 `useEffect(() => initClickShine(), [])`）：

- `pointerdown` 时算出点击点在按钮内的百分比，写成 `--fx/--fy`，再加 `.is-shine` 类；
- CSS 用 `radial-gradient(130px circle at var(--fx) var(--fy), …)` 让一层暖光从点击处散开，
  同时手绘描边亮成强调色；动画放完由 `animationend` 自动摘类（不留 `setTimeout`）。
- 键盘激活（Enter / 空格，`click.detail === 0`）没有坐标，就从中心发光。
- `prefers-reduced-motion` 下全局规则把动画压到 0.001ms，等于这条光影自动静音。

**为什么用事件委托而不是逐组件加 onClick**：按钮散在 5 个组件里，逐个加会把装饰效果
混进业务回调，而且要拿坐标、要能连点重播。集中在一个监听器里，组件一行都不用改。

## 十二、第三轮验证

| 检查 | 结果 |
|---|---|
| `tsc -b` | exit 0 |
| `vite build` | ✅ `CSS 39.08 kB (gzip 8.59)` / `JS 259.45 kB (gzip 82.28)` |
| 卡片 / 项目卡 / 按钮底 | `…/ 0.28`、`…/ 0.5`、`…/ 0.12`（夹具实测） ✅ |
| 手绘线 | `::before line=rgba(255,255,255,0.24) filter=url("#sketch-line")` ✅ |
| 点击光影 | 见 `docs/ui-review/09-button-shine-frozen.jpg`（把动画定格在最亮那帧拍下） |
| 视觉证据 | `docs/ui-review/01–09` 已按本轮重新生成 |

截图核对的读法（也给以后用）：`?shine=1` 会把光影层强制 `opacity: 1` 定住，
否则 620ms 的动画在截图里抓不到；`?art=1` 把区块画作可见度拉到 1，
用来区分"图层没画"和"太淡看不见"；`?debug=1` 把关键元素的计算样式画在左上角。

**可调旋钮（都在一行里）**：卡片透明度 `Hero.css:28%`、项目卡 `Projects.css:50%`、
按钮底 `base.css:12%`、区块大面 `tokens.css` 的 `--surface-alt/--surface-deep`、
手绘线的"抖动量" `App.tsx` 里 `feDisplacementMap` 的 `scale="2.4"`、线的粗细 `base.css` 的 `1.5px`。

**遗留**：白昼主题下 28% 的卡片几乎是"幽灵面板"（文字仍清晰，但面板本身很淡）——
这是 70%+ 透明度的必然结果，需要你主观确认；Safari/Firefox 的 SVG 滤镜表现未实测。
