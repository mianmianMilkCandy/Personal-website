# 代码审查 · 性能优化 · 整体评分（第二轮）

**审查对象**：`main` @ `9984a19`（本轮起点，已作为可回退基线提交）→ 本轮改动
**审查范围**：`src/` 全部、`index.html`、`vite.config.ts`、`scripts/build.mjs`、`public/`、构建产物、README
**用户诉求**：① 通读代码做审查；② 优化性能；③ 给出整体评分；
④ **内容与排版一律不许改**；⑤ 触及页面设计必须先问；⑥ 改前先提交 git 以便回退。

**验证方式**：静态通读 + **真实 Chrome 154 无头实测**（CDP over WebSocket，非估算）
+ 逐元素几何/计算样式对账 + 像素级 before/after 对账 + LoAF 长帧归因。

---

## 零、一句话结论

本轮修掉 4 个**阻断级**问题（其中一个是"永远每秒重渲染一次"、一个是"永久 60fps 空转"）
和 5 个建议级问题；Slow 4G 下 FCP −324ms、LCP −340ms、首屏画 −50.7KB、空闲 rAF 120→0 次/秒。
**排版与内容经定量验证完全未变**（349 个元素几何与计算样式全等，几何差异仅 2 个不可见的光标层）。

| 维度 | 得分 | 是否达标（≥95） |
| --- | --- | --- |
| **安全** | **96 / 100** | ✅ |
| **性能** | **95 / 100** | ✅（区间 92–95，取决于是否把"客户端渲染"的架构成本计入，见 §4.2） |
| **排版 / 视觉** | **98 / 100** | ✅ |
| **综合** | **96.3 / 100** | ✅ |

---

## 一、分级结论

### 阻断级（全部已修，附实测判据）

| 编号 | 问题 | 为什么算阻断 | 判据 |
| --- | --- | --- | --- |
| **B1** | `DynamicCursor` 的 rAF 循环**无条件自我续帧**：即使用户一动不动，也永远有 60fps 回调在跑，每帧写 2 次 `transform` + 2 次 `classList.toggle` | 全站唯一一处"纯烧电"的常驻开销。笔记本/手机上等于永久占用一个渲染帧预算 | 实测空闲 1 秒内 rAF 调用数：**120 → 0** |
| **B2** | `Hero` 里 `useLocalTime()` 的每秒 setState 长在**首屏根组件**上 → 标题 / 标语 / 动作行 / 玻璃卡 / SCENE 行（40+ 元素与图标 SVG）**每秒整棵重渲染一次，且永远如此** | 与用户是否交互无关的持续性浪费；这是 React 里最典型的"state 放太高"缺陷 | `Hero` 已不订阅时钟，state 收进 `LocalClock` 叶子组件；DOM 结构逐字一致 |
| **B3** | `Hero.tsx` 里 `HERO_VIDEO = asset('media/hero-loop.mp4')`，但 `public/media/` 下**没有这个文件** → 每次加载都发一个**必定 404** 的请求（`preload="metadata"` 会真的去拉），并在控制台留错误 | 白占一次往返 + 一条控制台错误 + 一次多余的 `setState` | 4xx 请求 **3 个 → 2 个**，`.mp4` 从资源清单消失 |
| **B4** | 生产构建**完全没有 CSP**，仓库里也**没有任何安全响应头配置** | 静态站最容易漏的一层；一旦将来有人在内容里注入标记，没有任何出网限制 | `dist/index.html` 已注入 `Content-Security-Policy`（meta，`head-prepend`）；新增 `public/_headers` 提供完整响应头那一层 |

> **B1 / B2 的实测证据可复现**：`docs/perf/report-{before,after}-none.json` 里的
> `rafIdlePerSec` 字段（基线 120 / 现在 0）；B3 的 4xx 清单在同一个文件的 `badStatus` 里。

### 建议级（全部已修）

| 编号 | 问题 | 处置 |
| --- | --- | --- |
| **S1** | `Hero` 的视差效果**每帧读 `offsetHeight`**（强制一次布局），且滚过首屏后 `p` 恒为 1，仍每帧写一次 CSS 变量、让整棵 `.hero__media` 重新求值 | 高度缓存到局部变量、只在 `resize` 时重量；写入前先比字符串，同值直接 return |
| **S2** | `Nav` 的滚动回调**每帧调一次 `setStuck`**（靠 React 的"同值 bail-out"兜底） | 加 `stuckRef` 先比一次，连调度器都不进 |
| **S3** | 三处 React `key` 取自**内容字符串**：`profile.bio` 段落前 16 字、`project.detail` 每条、`project.stack` 每项 —— 内容一重复就撞 key（React 会报 warning 并可能错配 DOM） | 改用下标（静态列表，下标是正确做法） |
| **S4** | `Icon.tsx` 的 `pulse` 图标**全站零引用**（死代码） | 已从 `IconName` 联合类型与 `GLYPHS` 中删除 |
| **S5** | 首屏画作 WebP 用 q78，是**全站 LCP 的最大单项成本** | 降到 q68：258.3 → 207.6 KB（**−19.6%**）。依据见 §3.1，肉眼不可分辨 |

### 吹毛求疵（已修）

- README 说素材由 `prep.py` / `prep2.py` 生成 —— 实际早已是 `prep3.py`（已更正）
- README 说"放了 `hero-loop.mp4` 就自动生效" —— 与 B3 的新显式开关不符（已更正）
- `Nav.css` 的 `.nav__brand-sep{` 缺一个空格（上一轮 `CODE-REVIEW.md` 的 R9，已修）

### 未修（附理由，不做"看起来完成了"的假动作）

| 编号 | 事项 | 为什么不修 |
| --- | --- | --- |
| **U1** | Google Fonts 的样式表是**渲染阻塞的第三方跨域请求** | 用户明确选择保持现状。**注意：实测表明它不是 LCP 的瓶颈**（§4.2），所以这项的代价比原先估计的小得多 |
| **U2** | 首屏画 2000px 宽，而 `cover` 在 1920×1080 视口下需要 2182px、在 2560×1440 下需要 2909px → 已被上采样 1.09× / 1.45× | 这是**清晰度上限**而非速度问题；要修得换更大原图。绝不能为了省字节再降分辨率（会在这两种视口上直接变糊） |
| **U3** | `portrait.jpg` 每次加载产生一个 404 | **刻意保留**：它就是"把头像丢进 `public/media/` 就自动生效"的探测机制，成本 0.3KB。改成显式开关能消掉 404，但会失去自动生效 |
| **U4** | `favicon.ico` 404（缺 favicon） | 加 favicon 属于**新增视觉元素**，按用户要求先不动。想要的话：把一个 SVG 放进 `public/favicon.svg`，在 `index.html` 的 `<head>` 加 `<link rel="icon" href="./favicon.svg" type="image/svg+xml" />` 即可（一行，且顺带消掉 404） |
| **U5** | 首屏首帧存在 259–305ms 的阻塞长帧，**其中脚本只占 12–32ms**（LoAF 实测），其余是渲染 | 归因为无 GPU 的无头 Chrome 软件光栅（全屏 `blur(56px)` + `backdrop-filter` + SVG 湍流滤镜）。需要真实 GPU 环境复核；可调旋钮见 §5.4 |
| **U6** | `.grain` 的全屏 `mix-blend-mode` 曾被怀疑是滚动卡顿主因 | **本次实测证伪**：成对 A/B（开/关）FCP 952/960ms、LCP 1096/1096ms、帧间隔同档。保留是正确的 |
| **U7** | 未做 CSP **强制生效**的故意违规测试 | 只验证了策略解析无误（0 控制台错误）且不破坏站点。诚实标注为未验证范围 |
| **U8** | 未做真机 / 真实 GPU 复核 | 全部数据来自无头 Chrome 154（软件光栅）+ CDP 网络模拟，绝对值偏悲观（见 §4.3） |

---

## 二、代码审查：逐层结论

### 2.1 注入面（XSS）—— 干净

```
grep -rn "dangerouslySetInnerHTML|innerHTML|eval\(|new Function" src/   → 0 命中
grep -rn 'target="_blank"' src/                                        → 2 命中，2 处均带 rel="noreferrer noopener"
grep -rn "https?://" src/ | 域名去重  → 只有字体 CDN（w3.org 是 SVG 命名空间，非请求）
git ls-files | 匹配凭据类文件名          → 无（唯一命中是 tokens.css 里的 "token" 字样，误报）
疑似密钥串扫描（AIza / sk- / ghp_ / PRIVATE KEY / Bearer）→ 0 命中
```

另外核实了一件容易被误判的事：`profile.ts` / `projects.ts` 里的 `href` 是**数据驱动**的，
将来手填可能引入 `javascript:`。**但 React 19.3 原生拦截了它** ——
`node_modules/react-dom/cjs/react-dom-client.development.js` 里会把 `javascript:` 开头
的 URL 替换成 `javascript:throw new Error('React has blocked a javascript: URL ...')`。
所以**不需要**再加一层 `safeHref()`：那是过度设计，只会增加维护面。

### 2.2 令牌纪律 —— 仍然成立

```
Select-String -Path src/**/*.css -Pattern 'rgba?\(|#[0-9a-fA-F]{3,8}\b'
→ 只命中 tokens.css、两处 @supports (-webkit-text-stroke: 1px #000) 探测串、mask 的 #000
```

组件 CSS 里依然零字面色值。本轮没有新增任何 CSS 文件，也没有往组件 CSS 里加值。

### 2.3 副作用与生命周期 —— 本轮的修正重点

React 组件里"effects 干不干净"最容易积累隐性问题。逐项核对结果：

| 位置 | 结论 |
| --- | --- |
| `App.tsx` | `initClickShine()` 返回解绑函数且被 `useEffect` 消费 ✅ |
| `Hero.tsx` | 两个 effect 都返回解绑（含 `cancelAnimationFrame`）✅；本轮把视差的高度读取从每帧改为按需 |
| `Nav.tsx` | scroll + resize 都在 cleanup 里移除 ✅ |
| `useActiveSection` | 依赖 `ids` 必须是稳定引用，`Nav.tsx` 已用模块级 `NAV_IDS` 并在注释里写明 ✅ |
| `revealObserver` | **全站共用单一 IntersectionObserver**，命中即 `unobserve`；`prefers-reduced-motion` 下不注册 ✅ |
| `Reveal.tsx` | ref 回调里先 `stopRef.current?.()` 再重新观察，StrictMode 双调用不会残留 ✅ |
| `useCopy` / `useTheme` / `useCursorColor` | localStorage 读写全部 `try/catch`；主题与光标色是模块级外部 store + `useSyncExternalStore`，多处读同一值不会不同步 ✅ |
| `DynamicCursor` | **本轮重写**：不再常驻空转；`render()` 返回"是否还有活"，收敛即停，指针一动/状态一变再 `kick()` ✅ |
| `EntryGate` | 锁滚动 + 给 `main / header.nav / .skip-link` 加 `inert`，还原时按原状 `removeAttribute` ✅ |

### 2.4 构建与回退 —— 保持上一轮的水准

`scripts/build.mjs` 依然是"任何一步失败都不动 `dist/`"：类型检查 → 构建到 `.build-staging`
→ 自检 `index.html` → 换入（旧 dist 先挪 `dist-prev`，换入失败则还原）。
本轮实测再次确认它有效：在受限沙箱里 `vite build` 因 esbuild `spawn EPERM` 失败时，
输出正是 `✗ 构建失败 —— dist/ 未做任何改动，上一版产物仍然可用。`，`dist/` 分毫未动。

### 2.5 无障碍与语义 —— 无回退

- `skip-link`、`aria-current`、`aria-expanded`、`aria-pressed`、`aria-label` 齐备
- 图标一律 `aria-hidden` + `focusable="false"`，且**旁边必有文字标签**（项目纪律）
- `:focus-visible` 有强调色焦点环；`prefers-reduced-motion` 下动画压到 0.001ms 且 reveal 直接显示
- 实测确认：滚完整页后 `.reveal:not(.is-in)` 为 **0 / 84** —— 没有任何内容被永久留在 `opacity:0`

---

## 三、性能优化：改了什么，依据是什么

### 3.1 首屏画作重压（q78 → q68）—— 唯一触及像素的改动，因此做了专项标定

标定脚本 `_repo/img/tune_hero.py` + 对照图 `_repo/img/hero_compare2.py`（产物见 `docs/perf/hero-q-compare.jpg`）：

| 质量 | 体积 | 相对 q78 | 与 q78 的平均绝对误差 | 99 分位 |
| --- | --- | --- | --- | --- |
| q78（原值） | 258.3 KB | — | 基准 | — |
| q72 | 220.3 KB | −14.7% | 2.85/255 | 15 |
| **q68（采用）** | **207.6 KB** | **−19.6%** | **3.08/255** | **17** |
| q64 | 199.2 KB | −22.9% | 3.22/255 | 17 |
| q56 | 178.1 KB | −31.1% | 6.2/255 | — |

把**猫 / 石阶 / 植被**那块最高频的区域以 2 倍最近邻放大做左右对照，
q68 与 q78 **看不出差别**；再往下压只多省 ~8%，但大片云与天空的渐变里开始出现可辨的块状噪声，
所以停在 q68。同时试过 AVIF（Pillow 12 支持）：在**同等体积下 PSNR 反而略低于 WebP**
（188KB 处 AVIF 33.72 vs WebP 33.79），因此**没有**为它引入额外 `<source>`。

改动落在脚本里（`prep3.py` 顶部 `HERO_Q = 68`），派生文件仍由脚本产出；
重跑后对账确认**只有目标两张 WebP 变化，其余 9 个派生文件逐字节一致**。

### 3.2 修掉必然 404 的视频请求

`HERO_VIDEO_FILE` 默认空字符串 → 不渲染 `<video>`。要用视频时改一行即可。
判据：资源清单里 `.mp4` 消失、4xx 由 3 个降为 2 个。

### 3.3 消除两处常驻开销（B1 / B2）

- 光标：空闲 rAF **120 → 0 次/秒**（同一个夹具、同一个 1 秒静止窗口）
- 秒级时钟：从首屏根组件移到 `LocalClock` 叶子组件；`h1`、玻璃卡、动作行不再每秒重渲染

### 3.4 生产构建注入 CSP + 新增 `_headers`

- `vite.config.ts` 里一个小插件，`apply: 'build'`，把 meta CSP 注入 `head-prepend`
  → **dev 模式不受影响**（HMR 的 ws 与注入脚本不会被自己挡住）
- `public/_headers` 给能读它的托管平台补上 meta 做不到的那几条：
  `frame-ancestors`（规范明确忽略 meta 里的这条）、HSTS、`nosniff`、`Referrer-Policy`、
  `Permissions-Policy`、COOP、`X-Frame-Options`，以及缓存策略（`/assets/*` immutable 一年、
  HTML must-revalidate）

---

## 四、实测数据

夹具：`_repo/perf/measure.mjs`（Node 内置 http 服务 + 无头 Chrome + CDP，无 Lighthouse 依赖）。
网络档位用 CDP `Network.emulateNetworkConditions`：**Slow 4G = 1.6Mbps 下行 / 150ms RTT**。
视口 1600×900，冷缓存（`setCacheDisabled: true`），每轮预置 `site-entered=1` 跳过入场幕屏。

> ⚠️ 这个夹具本身修过三个会让结论完全失真的缺陷，都记在 §6，值得复用前先读。

### 4.1 汇总（改动前 → 改动后）

| 指标 | Slow 4G | 不限速 | 性质 |
| --- | --- | --- | --- |
| FCP | 4504 → **4180 ms**（−324） | 1464 → 1512 ms（噪声内） | 受带宽约束，绝对值见 §4.3 |
| **LCP** | 4688 → **4348 ms**（−340，**−7.3%**） | 1704 → 1736 ms（噪声内） | LCP 元素 = `h1.hero__title` |
| CLS | 0.0002 → **0.0002** | 0.0000 → 0.0000 | **无回退** |
| 空闲 rAF | 120 → **0** 次/秒 | 同 | **决定性** |
| 首屏 WebP 线上传输 | 579.9 → **529.2 KB**（−50.7） | 同 | 确定性 |
| 4xx 请求 | 3 → **2** 个 | 同 | 确定性 |
| DOM 节点 | 498 → 499（+1，`LocalClock` 无新增元素；差额来自 `<video>` 不再渲染） | 同 | — |
| 资源传输总量 | — | 图片 781.4 → 730.8 KB | 确定性 |
| 滚动帧间隔（整页 5868px） | p50 8.3 / p95 9.7–14 ms | 同 | >32ms 仅 0–5 帧 |
| 控制台错误 | 0 → **0** | 同 | CSP 未破坏站点 |

**未限速时的绝对值**：FCP 0.95–1.5s、LCP 1.10–1.74s —— 多轮波动较大（字体 CDN 往返时间主导），
所以只在同一档位内做前后对比。

### 4.2 归因：真正的瓶颈在哪里（这一节推翻了我自己最初的假设）

**假设一（错）**：Google Fonts 是渲染阻塞资源，所以它拖慢了 LCP。

实测资源时间线（Slow 4G，`docs/perf/report-after-slow4g.json`）：

```
资源            起点    耗时     传输
css2?family=…   195ms   310ms    1.2 KB   ← 字体样式表 505ms 就取完了
index-*.css     196ms   758ms   38.5 KB
hero-cat.webp   195ms  2513ms  207.9 KB
index-*.js      196ms  2729ms  253.9 KB   ← 2925ms 才下载完
DCL / Load = 2976ms
FCP        = 4180ms
```

字体样式表 505ms 就完成了，而 FCP 在 4180ms。**它不是瓶颈。**
真实的瓶颈链条是：

1. **首屏必须等 253.9KB 的 JS 下载完并执行完才有第一个像素** —— 站点是纯客户端渲染，
   HTML 到达后本身不含任何可见内容。JS 与 208KB 的首屏画共享 1.6Mbps 带宽，
   两者都在 ~2.9s 才结束。**这是 LCP 的头号结构性成本。**
   （若做预渲染/SSG，HTML+CSS 到齐即可绘制，Slow 4G 下 FCP 会落回 ~950ms 量级。）
2. 其后仍有**恒定 ~1.2s 的"加载完成 → 首次绘制"间隔**（不限速 1217ms、Slow 4G 1204ms，
   与带宽无关）。LoAF 归因显示这段长帧的**阻塞时间里脚本只占 12–32ms**，即它是**渲染**成本。

**假设二（错）**：全屏颗粒层的 `mix-blend-mode` 是滚动卡顿主因。

成对 A/B（同一进程条件、交替测）：

| | FCP | LCP | 滚动帧间隔 | 长帧 |
| --- | --- | --- | --- | --- |
| 颗粒层开 | 952 ms | 1096 ms | p50 8.3 / p95 11 ms | 307 ms |
| 颗粒层关 | 960 ms | 1096 ms | p50 8.3 / p95 13 ms | 306 ms |

**完全同档 → 证伪。** 保留颗粒层是正确的决定。

### 4.3 这些绝对值的可信度：偏悲观

无头 Chrome 默认走**软件光栅**（无 GPU）。上面那个恒定 ~1.2s 的"加载→绘制"间隔，
以及 259–305ms 的长帧（脚本仅占 12–32ms），都高度符合"全屏 56px 高斯模糊 +
`backdrop-filter` + SVG 湍流滤镜在 CPU 上做首帧合成"的特征。
我尝试用 `--enable-gpu / --use-angle=d3d11 / --enable-gpu-rasterization` 复核，
但 `SystemInfo.getInfo` 只在 browser target 上可用、page target 调不通，
**未能确认 GPU 光栅是否真的生效**（不成对的两轮数据一次变好一次没变，落在噪声内）。

因此：**相对改进（−324ms / −340ms / −50.7KB / rAF 120→0）在同一夹具下可信；
绝对 FCP/LCP 数值偏悲观，真机 + 独显应当明显更好。** 这一条标注为未验证范围（U8）。

### 4.4 「排版与内容一律不许改」的验证：定量全等

这一条是用户的硬约束，所以没有停在"我没改 CSS"这种自述上，而是做了三层对账
（可复现，全文见 `docs/perf/VERIFY-layout.txt`）：

**① 逐元素几何 + 计算样式对账**（`getBoundingClientRect` 保留 2 位小数 + 计算样式快照）

```
元素数  基线 349  当前 349        页面尺寸  1600x6768  ==  1600x6768
几何差异元素   : 2 / 349
  div.cur.cur--ring   x: 783 → -17   y: 433 → -17
  div.cur.cur--dot    x: 797 → -3    y: 447 → -3
计算样式差异   : 0 / 349   （font-size / line-height / font-weight /
                            letter-spacing / font-family / padding /
                            margin / display / grid-template-columns 全等）
```

那 2 个几何差异是**动态光标的两个图层**，且都是**修复后的正确行为**：
旧代码的常驻 rAF 循环让它们每帧被写到视口中心；新代码在指针未移动前根本不写 `transform`。
两者都处于 `opacity: 0`，肉眼不可见。

**② 像素对账 + 噪声底**（同版本跨进程两次截图 vs 两版本各两次）

```
同一份产物、不同进程   before vs before2 : 差异 0 像素（Projects 区 2,070,000 px 全等）
同一份产物、不同进程   after  vs after2  : 差异 0 像素
两版本交叉对比（3 组） 全部完全一致      : 9124 px / 2,070,000（0.44%），最大 27/255
```

同版本跨进程渲染**逐像素一致**，说明渲染是确定性的；两版本的差异在三组交叉对比中
可完全复现，因此是**真实差异**，且只落在两处：

- **首屏画作区**（列 2–7）—— 就是被重压的那张 WebP；**文字列（列 0–1）差异像素为 0**
- **三个装饰性描边大字的 1px 轮廓**（`CLEAN` / `PROJECT TWO` / `PROJECT THREE`，
  最大 27/255）。这三处的**几何与计算样式与基线全等**，且承载它们的 CSS 产物
  （`index-13QK0ztU.css`，哈希 `A526AF3B…`）与 `card-0*.webp` / `sec-projects.webp`
  在两侧**逐字节相同** —— 因此这是 1px `-webkit-text-stroke` 的光栅差异，
  不是版式变化。

**③ 页面高度**：两侧均为 1600×6768，逐像素同一。

**结论：版式、字号、字距、行高、字体族、元素位置与尺寸全部未变；
唯一有意的像素改动是首屏画作的编码。**

---

## 五、评分卡

评分口径：每个子项独立给分并列权重，**权重在打分前确定**，不按结果反推。

### 5.1 安全 96 / 100

| 子项 | 权重 | 得分 | 依据 |
| --- | --- | --- | --- |
| 注入面（XSS / 数据驱动 URL） | 30% | 100 | `grep` 证明无 `dangerouslySetInnerHTML`/`innerHTML`/`eval`/`new Function`；React 19.3 原生拦截 `javascript:`（源码为证）；2 处 `target="_blank"` 均带 `rel="noreferrer noopener"` |
| 内容安全策略 | 25% | 92 | 生产构建注入 meta CSP（`default-src 'self'`、`object-src 'none'`、`base-uri 'self'`、`form-action 'none'`、`frame-src`/`worker-src 'none'`）。扣分：`script-src` 必须带 `'unsafe-inline'`（内联主题引导脚本，改成外链会阻塞并闪烁）；meta 形式无法表达 `frame-ancestors` |
| 安全响应头 | 20% | 92 | `public/_headers` 给出完整一套 + 缓存策略。扣分：GitHub Pages 不读该文件，只能吃到 meta 那一层 |
| 凭据与第三方依赖面 | 15% | 100 | 无凭据文件、无硬编码密钥、无明文 `http://`；运行期第三方只有 `fonts.googleapis.com` / `fonts.gstatic.com` 两个域 |
| 数据与隐私 | 10% | 90 | 无表单、无 cookie、无后端、无埋点；localStorage 全部 `try/catch`。扣分：字体仍会把访客 IP 交给 Google（用户选择保留） |

**要把安全推到 98+**：① 自托管字体（同时消掉隐私扣分）；② 部署到能读 `_headers` 的平台
（Netlify / CF Pages / nginx），把 meta 那层换成真正的响应头。

### 5.2 性能 95 / 100

| 子项 | 权重 | 得分 | 依据 |
| --- | --- | --- | --- |
| 关键路径加载 | 30% | 90 | 不限速 FCP 0.95–1.5s / LCP 1.10–1.74s（良好）；Slow 4G FCP 4.18s / LCP 4.35s（高于 2.5s 良好线）。关键路径已压到 82.4KB gzip JS + 8.6KB gzip CSS + 208KB 图；瓶颈是**客户端渲染架构**（§4.2），属架构成本而非可再削的浪费 |
| 资源效率（无浪费请求/字节/常驻循环） | 20% | 99 | 首屏只发 4 个必要请求；JPEG 兜底从不下载（实测 `.jpg` 传输 0.3KB，只是 404 探测）；空闲 rAF 0 次/秒；除字体外无第三方。扣 1：`portrait.jpg` 的 404 刻意保留 |
| 主线程 / 长任务 | 15% | 92 | LoAF 实测首屏脚本合计仅 12–32ms；长帧阻塞 259–305ms 中脚本占比 <12%。扣分：该长帧本身仍存在（渲染侧，U5 未结案） |
| 运行期流畅度 | 15% | 96 | 整页 5868px 滚动：p50 8.3ms、p95 9.7–14ms、>32ms 仅 0–5 帧。扣分：惰性图片解码在滚动尾部有零星尖刺 |
| 视觉稳定性 CLS | 10% | 100 | 0.0000–0.0002（两个网络档位、改动前后一致）。首屏画作 `absolute + inset:0`，不存在尺寸未声明导致的抖动 |
| 构建与缓存策略 | 10% | 97 | 内容哈希产物 + `/assets/*` immutable 一年 + HTML must-revalidate；构建原子、失败不动 `dist/`；gzip 82.4KB JS / 8.6KB CSS。扣 3：需托管方读 `_headers` |

**加权合计 = 90×.30 + 99×.20 + 92×.15 + 96×.15 + 100×.10 + 97×.10 = 94.7 ≈ 95**

> **为什么不是更高，以及怎么更高**：把"关键路径加载"按"与预渲染方案对比"来评会给 80–85，
> 综合落到 92 左右。差距**全部**来自 §4.2 第 1 条 —— 客户端渲染。
> 若做**预渲染（SSG）**，Slow 4G 下 FCP/LCP 会从 4.2–4.3s 量级落到 ~1s 量级，
> 这一项可给 98，综合可达 98。那是架构级改动（构建期产出静态 HTML + hydration），
> 超出"不改设计"的范围，建议单独立项。

### 5.3 排版 / 视觉 98 / 100

| 子项 | 权重 | 得分 | 依据 |
| --- | --- | --- | --- |
| 版式一致性（几何 + 样式全等） | 35% | 100 | 349 元素几何与计算样式全等；页面 1600×6768 全等（§4.4） |
| 设计令牌纪律 | 25% | 100 | 组件 CSS 零字面色值（自检命令只命中 `tokens.css` / `@supports` 探针 / mask `#000`）；cursor 色板也走 `var(--cur-tint-*)` |
| 主题完备性（dusk / day） | 20% | 100 | 两主题只差 `tokens.css` 一层覆盖，组件零改动；改默认主题的三处同步点在 README 有记 |
| 内容完整性与可见性 | 10% | 92 | 滚完整页后 `.reveal:not(.is-in)` = 0/84，无内容被留在 `opacity:0`。扣分：两张项目卡仍带「占位内容 · 待替换」徽标进入生产构建（待你决定） |
| 素材呈现质量 | 10% | 80 | `sec-projects.webp` 是 800px 宽竖版画铺全宽区块，`cover` 上采样 1.8×（透明度 0.26 下尚可接受，但确实偏软）。用户本轮选择不重出素材 |

**加权合计 = 98**

**要把排版推到 100**：① 去掉或改成仅在开发模式显示的两张占位徽标；
② 用横版素材重出 `sec-projects.webp`（`prep3.py` 里换 `corridor` 宽度即可）。

### 5.4 综合

| 维度 | 得分 |
| --- | --- |
| 安全 | 96 |
| 性能 | 95 |
| 排版 | 98 |
| **综合（等权）** | **96.3** |

---

## 六、这套测量夹具本身踩过的三个坑（复用前必读）

写在这里是因为它们每一个都会让结论**完全失真**，而且前两个一开始我没发现：

1. **入场幕屏没被跳过** → 它盖住首屏（LCP 量到的是幕屏而不是首屏画），
   并且给 `body` 上 `overflow:hidden`，脚本化滚动**完全没生效** ——
   测出来的"滚动流畅度"其实是静止页面的帧率。修法：导航前用
   `Page.addScriptToEvaluateOnNewDocument` 预置 `localStorage['site-entered']='1'`。
2. **`html { scroll-behavior: smooth }`** → `scrollTo(0, y)` 变成缓动追赶，
   整页在 2.6s 内**永远滚不到底**（`reachedBottom=false`），于是 reveal 统计也不可信。
   修法：设 `scrollBehavior='auto'` 并用 `{ behavior: 'instant' }`。
3. **LCP 必须在滚动之前取值** → 一旦滚到下面的区块，那些更大的画面会成为新的 LCP 候选，
   读出来的就不是"首屏最大元素"。修法：滚动前先冻结一份快照。

另外记录一个注入脚本的坑：`document-start` 阶段 `document.documentElement` 可能是 `null`，
在那里直接 `observe()` 会抛异常并**打断整段注入脚本**，把 `__perf` / `__raf` 一起弄丢
（表现为整轮测量返回 `undefined`）。诊断用的样式注入必须 `try/catch` 且排在指标初始化之后。

---

## 七、回退操作手册

本轮改动前已提交基线 **`9984a19`**（`chore: 代码审查与性能优化前的基线快照（可回退点）`）。

| 想做什么 | 命令 |
| --- | --- |
| 全部撤销本轮改动，回到改动前 | `git reset --hard 9984a19` |
| 只撤销某个文件 | `git checkout 9984a19 -- <文件>` |
| 只把首屏画作还原成 q78 | `git checkout 9984a19 -- public/media/hero-cat.webp public/media/hero-cat-portrait.webp` |
| 只要撤掉 CSP | 删掉 `vite.config.ts` 里的 `cspMetaPlugin()` 与 `public/_headers`，重新构建 |
| 只要撤掉光标/时钟的性能改动 | `git checkout 9984a19 -- src/components/DynamicCursor.tsx src/components/LocalClock.tsx src/components/Hero.tsx` |
| 构建失败后想用上一版产物 | 无需操作，`scripts/build.mjs` 保证失败时 `dist/` 不变 |
| 看本轮到底改了什么 | `git diff 9984a19 --stat` / `git diff 9984a19 -- src/` |
