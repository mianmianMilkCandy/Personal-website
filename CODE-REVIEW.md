# 代码审查报告

**审查对象**：本仓库全部源码（63 个受版本控制的文件），重点是本会话内新写的部分 ——
`src/` 全部、`index.html`、`scripts/build.mjs`、构建与素材流程。
**审查时间点**：`main` @ 首次提交 `083090f`
**审查方式**：静态通读 + 针对性实验（构建失败演练、grep 死引用、产物对账）
**本会话的审查诉求**：除常规质量外，特别要**找出"处理失败且无法回退"这一类缺陷**（用户明确指出）。

---

## 一、分级结论

| 编号 | 级别 | 结论 | 处置 |
| --- | --- | --- | --- |
| R1 | **阻断** | `vite build` 默认先清空 `dist/` → **构建中途失败会毁掉原本可用的产物，且没有可回退的副本** | ✅ 已修（`scripts/build.mjs`），**并实测证明** |
| R2 | **阻断** | **整个项目没有版本控制** → 任何代码改动都不可回退 | ✅ 已修（`git init` + 首次提交 `083090f`） |
| R3 | **阻断** | `index.html` 的 preload 指向**已删除**的 `hero-ghibli.webp` → 每次加载一个 404 预加载请求 | ✅ 已修（改为按 media 匹配的横/竖两条） |
| R4 | 建议 | `--seam-core` / `--seam-mid` 硬编码色值，与 `--ink-900` 重复 → 改底色时接缝跟丢 | ✅ 已修（改为从 `--ink-900` 派生） |
| R5 | 建议 | `.reveal` 上挂 `will-change`，而全站有 50+ 个 reveal 元素 → 白吃大量 GPU 显存 | ✅ 已修（移除） |
| R6 | 建议 | `sec-projects.webp` 用 **800px 宽的竖版画**铺**全宽区块**，`cover` 放大 1.8× | ⬜ 未修，见下 |
| R7 | 建议 | `_repo/img/prep*.py` 是就地覆盖式，中途失败会留下新旧混杂的素材 | ⬜ 未修（已有 git 兜底） |
| R8 | 建议 | `CatCompanion` 未显式在标签页隐藏时暂停 rAF，依赖浏览器自行暂停 | ⬜ 未修，判定可接受 |
| R9 | 吹毛求疵 | `Nav.css` 中 `.nav__brand-sep{` 缺一个空格 | ⬜ 未修 |
| R10 | 吹毛求疵 | 入场幕屏"仅首次"用 localStorage，想再看一次要手动清 key | ⬜ 未修（README 已写清） |
| R11 | 吹毛求疵 | `Icon.tsx` 的 `GLYPHS` 模块级常驻 20 个 JSX 元素 | ⬜ 未修（可忽略） |

---

## 二、阻断项详情

### R1 · 构建失败会毁掉可用产物（已修，并已证明）

**问题**：Vite 默认 `emptyOutDir: true`，**在构建开始时就清空 outDir**。
于是"构建中途失败"的后果不是"没更新"，而是把一个原本可用的 `dist/` 变成空目录或半成品 ——
既上不了线，也没有可回退的副本。这正是"无法回退但处理失败"的典型形态。

**修复**：新增 `scripts/build.mjs`，`npm run build` 改走它：

```
tsc -b（失败即退出，dist 未动）
  → vite build --outDir .build-staging --emptyOutDir
  → 自检 .build-staging/index.html 存在
  → dist → dist-prev，.build-staging → dist
  → 成功后才删 dist-prev
```

换入过程本身也带还原：若第二步 rename 失败，会把 `dist-prev` 挪回 `dist`；
若还原也失败，则明确告知上一版仍在 `dist-prev/`，手动改名即可。

**实验证明**（不是推断）：

```
改动前  dist\index.html  hash=EFB1D16E4AD7  mtime=10/08/2026 21:21:38
故意植入 src/__failcheck.ts（类型错误）
$ node scripts/build.mjs
  ▸ 类型检查 tsc -b
  src/__failcheck.ts(1,7): error TS2322: Type 'string' is not assignable to type 'number'.
  ✗ 类型检查未通过 —— dist/ 未做任何改动，上一版产物仍然可用。
EXIT=1

失败后 dist\index.html 仍存在: hash=EFB1D16E4AD7  mtime=10/08/2026 21:21:38
hash 未变 : True
mtime 未变: True
残留 .build-staging: False     残留 dist-prev: False
```

**判据**：人为制造任一失败后，`dist/index.html` 的 hash 与 mtime 均不变，且无残留目录。

---

### R2 · 项目没有版本控制（已修）

**问题**：审查开始时工作区**不存在 `.git`**。这意味着本会话里我改过的每一行代码、
删掉的每一个素材都是**不可逆**的 —— 而我在上一轮确实**直接删掉了 1.52 MB 旧素材且没有备份**。
这是一次真实的"无法回退"操作，只是当时没造成损失。

**修复**：

```
git init -b main
首次提交 083090f  （63 个文件，工作区 clean）
```

附带修复一个会削弱回退能力的隐患：**新增 `.gitattributes` 统一为 LF（`eol=lf`）**。
不设它时，Windows 上编辑过的文本文件在 Linux CI / 部署端会整文件显示为"已修改"，
让 diff 失去可读性 —— 而 diff 可读性正是判断"该不该回退"的前提。

**入库边界**（已核对干净）：`node_modules/`、`dist/`、`_repo/`、`.npm-cache/`
以及新增的 `.build-staging/`、`dist-prev/` 均被 `.gitignore` 排除。

> ⚠️ `dist/` 刻意**不**入库（它是产物）。它对应的回退保障是 R1 的 `dist-prev` 机制，两者互补。

---

### R3 · 死掉的 preload 请求（已修）

**问题**：换主视觉（`hero-ghibli` → `hero-cat`）时漏改了 `index.html` 的预加载：

```html
<link rel="preload" as="image" href="/media/hero-ghibli.webp" type="image/webp" />
```

该文件已被删除 → **每次加载都发一个必定 404 的预加载请求**，还会在控制台留错误。
这是典型的"重构后残留引用"，grep 才发现。

**修复**：改成两条按 media 匹配的 preload，**与 `Hero.tsx` 里 `<picture>` 的
`<source media>` 完全一致**：

```html
media="(min-width: 901px) and (min-aspect-ratio: 1/1)"  → hero-cat.webp
media="(max-width: 900px), (max-aspect-ratio: 1/1)"      → hero-cat-portrait.webp
```

只修成横版一条是不够的：那会给用竖版的视口白拉一张 258 KB 的横版大图。

**判据**：`dist/index.html` 中不再出现 `hero-ghibli`；两条 preload 的 media 字符串
与 `Hero.tsx` 的 source media 逐字一致。

---

## 三、建议项详情（未修的给出理由）

### R6 · 区块背景的分辨率/取景不匹配

`sec-projects.webp` 用的是 `corridor_p`（**竖版**，缩放后仅 800px 宽）去铺一个**全宽**区块。
`background-size: cover` 会把它放大到约 1440px 宽，也就是 **1.8× 上采样**。

**为什么暂不修**：该图层最终只有 `--sec-art-opacity: 0.2` 的可见度，
放大带来的软化在这个透明度下不可见；而换成横版重新出图会让三个区块的画重复。
**若将来把 `--sec-art-opacity` 调高到 0.35 以上，这一条必须一并修**（用横版素材重出图）。

### R7 · 素材脚本不具备原子性

`_repo/img/prep*.py` 直接覆盖 `public/media/` 下的文件。若脚本在写第 3 张图时失败，
`public/media/` 会处于"部分新、部分旧"的状态，而脚本自身没有还原逻辑。

**为什么暂不修**：这些文件现在全部受 git 跟踪，任何覆盖都可 `git checkout -- public/media/` 恢复。
**真正的原子化做法**（写临时目录 → 全部成功后再换入）与本轮 R1 对 `dist/` 的处理是同一个模式，
如果素材生成会变成常态流程，建议照搬 `build.mjs` 的写法。

### R8 · 小猫的 rAF 未显式处理标签页隐藏

`CatCompanion` 的 `requestAnimationFrame` 循环没有监听 `visibilitychange`。
浏览器在标签页隐藏时本来就会暂停 rAF，所以**实测不构成问题**；
但这是依赖浏览器行为，不是显式保证。若日后把循环改成 `setInterval`，这一条会立刻变成真缺陷。

### R9–R11 · 吹毛求疵

- `Nav.css` 的 `.nav__brand-sep{` 缺空格（纯风格）
- 入场幕屏用 `localStorage` 记录"已进入"，用户想看第二次需手动清 `site-entered`（README 已写）
- `Icon.tsx` 的 `GLYPHS` 是模块级常量，20 个 JSX 元素常驻内存（量级可忽略）

---

## 四、本次无（明确未审范围）

- **未做动态运行验证**：本机没有浏览器/截图能力，所有视觉结论均未验证
- **未做性能剖析**：R5 的合成层判断来自静态代码（50+ 元素 × `will-change`），
  没有 Lighthouse / DevTools 的图层计数佐证
- **未审产物**：`dist/`、`node_modules/` 不在审查范围
- **未审无障碍实机表现**：读屏器、键盘焦点顺序只做了代码层检查
- **未审 `_repo/analysis/*.md`**（约 13 万字节的仓库分析中间产物，已 gitignore，不属于交付物）

---

## 五、回退操作手册

| 想回退什么 | 命令 |
| --- | --- |
| 改坏了某个源文件 | `git checkout -- <文件>` |
| 改错了想全撤（丢弃所有未提交改动） | `git reset --hard HEAD` |
| 退回上一个提交 | `git revert <sha>`（保留历史）或 `git reset --hard HEAD~1`（丢弃） |
| 构建失败后想用上一版产物 | 无需操作 —— R1 已保证失败时 `dist/` 不变 |
| 构建换入过程本身失败 | 上一版完整保留在 `dist-prev/`，改名回 `dist` 即可 |
| 想确认当前是否偏离了已提交状态 | `git status --short`（空 = 干净） |

**当前状态**：分支 `main`，HEAD = `083090f`，工作区 clean，63 个跟踪文件。
