# HANDOFF · `clean`（C 盘清理工具）项目交接文档

> **仓库**：`github.com/mianmianMilkCandy/clean`
> **定位**：约 20 MB 的 Windows 桌面清理工具，PyInstaller 单文件分发，Material 3 界面
> **本文档基础**：对仓库全部源文件、打包脚本、安装/卸载脚本、三语手册、Release 元数据与
> 8 次提交历史的静态阅读（未做动态运行验证）。所有结论都标注了证据位置。
> **写作时间点**：`main` @ `f5dad95`

---

## 0. 怎么读这份文档

| 你想做的事 | 直接看 |
| --- | --- |
| 快速接手 / 了解这是什么 | §1 §2 |
| 改代码前必须知道的架构约束 | §3 §4 |
| **别踩我已经踩过的坑** | §5（按严重度排序，重点） |
| 知道哪些地方是硬伤、优先级怎么排 | §6 §8 §9 |
| 知道这份文档哪些结论不可靠 | §10 |

第一条建议：**先读 §5 的 [阻断] 三项，再动任何一行删除逻辑。**

---

## 1. 项目速览

一个给普通 Windows 用户用的"C 盘瘦身"工具：扫描系统临时文件、浏览器缓存、微信/QQ 聊天缓存，
列出体积并一键清空。界面是 Material 3 Web UI 装在原生窗口里，最终打成一个 exe。

**体量事实**

| 项 | 值 | 证据 |
| --- | --- | --- |
| 安装包 | 21,381,232 B ≈ **20.39 MB** | Release asset `c-clean.exe` |
| 仓库体积 | **5,724 KB** | GitHub API `size` |
| 其中源码 | 约 230 KB | 逐文件累加 |
| 提交数 | **8** | `/commits?per_page=100` |
| 作者 | 1 人（`云绵绵甜奶糖` / 账号 `mianmianMilkCandy`） | commit author |
| Release | 2 个（`v1.0.0`、`v2.0.0`），各 24 次下载 | `/releases` |
| 许可证 | LICENSE 存在（1075 B） | 仓库根 |
| 测试 / CI / lint | **全部没有** | 无 workflow、无 test 目录 |
| 依赖清单 | **没有 `requirements.txt`**（HTTP 404） | 依赖只写在 `install.ps1` 的 pip 行里 |

**生命周期**（这条时间线解释了后面很多现象）

```
2026-09-09 12:44  仓库创建
2026-09-09 12:53  v1.0.0 发布   ← 建仓后 9 分 38 秒，一次性提交整个应用（+8314/−0）
2026-09-09 12:44–14:23  99 分钟内 6 次提交（密集冲刺）
2026-09-09 → 09-18  静默 9 天
2026-09-18 04:48  单次提交 = v2.0.0（pushed_at == published_at）
```

**读法**：这不是"持续迭代"出来的项目，而是**先把本地做完，再一次性推上 GitHub**，
然后在 99 分钟里补齐文档与安装体验。所以：代码质量像一个人独立完成的成品，
而工程规范（CI、版本号一致性、spec 文件维护）停留在"只有我一个人用"的阶段。

---

## 2. 技术栈全貌

### 2.1 后端（Python）

```
语言           Python 3（语法下限 3.9；install.ps1 自称要求 3.10+）
第三方依赖      pywebview、pyinstaller、pillow  —— 三者均【未锁定版本】
标准库          http.server、json、shutil、smtplib、socket、threading、
                email、os、pathlib、random、time、webbrowser
Web 框架        无（零框架，纯 http.server）
打包            PyInstaller（onefile）
```

**"零框架 + 纯标准库"是刻意选择**，也是"约 20 MB"能成立的直接原因——省掉了整个
Flask/FastAPI + 依赖树的体积。代价是路由、JSON 解析、静态文件服务、错误处理全部手写
（见 §5 的安全问题几乎都源于此）。

### 2.2 前端（Web UI）

```json
"dependencies": {
  "@material/material-color-utilities": "^0.4.0",
  "@material/web": "^2.5.0",
  "lit": "^3.3.3"
},
"devDependencies": { "typescript": "^5.9.0", "vite": "^7.0.0" }
```

`package.json` 里是范围，`package-lock.json` 解析出的**实际版本**：

| 包 | 声明 | 实际解析 |
| --- | --- | --- |
| `lit` | ^3.3.3 | **3.3.3**（lit-element 4.2.2 / lit-html 3.3.3 / @lit/reactive-element 2.1.2） |
| `@material/web` | ^2.5.0 | **2.5.0** |
| `@material/material-color-utilities` | ^0.4.0 | **0.4.0** |
| `typescript` | ^5.9.0 | **5.9.3** |
| `vite` | ^7.0.0 | **7.3.6**（rollup 4.63.1 / esbuild 0.28.2 / postcss 8.5.28） |

- **Lit 3 + Web Components**（不是 React）——与作者技术栈一致，组件是原生自定义元素。
  9 个 `@customElement`，`<cleaner-app>` 单宿主，无原生 DOM 混搭
- **@material/web** 提供 Material 3 组件，**material-color-utilities** 做动态取色
- 构建 `tsc --noEmit && vite build`；`vite.config.ts`：`base:'./'`、dev 5173、
  `proxy['/api'] → 127.0.0.1:8765`、`target:'es2022'`、`sourcemap:false`
- TS 开了 `strict: true` + `experimentalDecorators: true` +
  `useDefineForClassFields: false`（后两个是 Lit 必需，**开对了**）；
  但**把 `noUnusedLocals` / `noUnusedParameters` 明写为 `false`**
  → 死代码无人发现（后果见 §5-F9）。全文几乎无 `any` 滥用
- **无 test / lint 脚本，无 `.github`（全量树证实无 CI）**
- 构建产物 `webapp/dist` **已提交进仓库**，但历史里从未被任何提交改动过（见 §4.1）

**资产体积**（按 tree 精确字节，这是项目最反直觉的一处）

| 文件 | 字节 | 占 dist |
| --- | --- | --- |
| `material-symbols-rounded.woff2` | **5,373,444** | **90.4%** |
| `roboto-1..9.woff2` | 231,060 | 3.9% |
| `index-*.js` | 328,463 | 5.5% |
| `index-*.css` | 12,465 | 0.2% |
| **dist 合计** | **5,946,119 ≈ 5.67 MiB** | 字体占 **94.3%** |

一份全权重、全图标集的图标字体撑起了整个产物的 90%，而**实际只用到约 28 个字形**。

### 2.3 分发（PowerShell）

```
install-github.ps1   v2.0.0，12743 B，主安装器（纯 ASCII + base64 中文）
install.ps1          7309 B，源码模式安装（含 pip 依赖安装）
uninstall-github.ps1 5344 B，联网卸载
uninstall.ps1        1563 B，旧版卸载
```

---

## 3. 系统架构

### 3.1 进程与线程模型

```
┌─ c-clean.exe (onefile) ──────────────────────────────────────────┐
│  启动时自解压到 %TEMP%\_MEIxxxxx\                                │
│                                                                  │
│  主线程      pywebview UI（gui='edgechromium'，WebView2）         │
│  ├─ 线程 A   http.server serve_forever()          [daemon]        │
│  ├─ 线程 B   ThreadingHTTPServer：每个请求一条线程  [daemon]       │
│  └─ 线程 C   扫描 worker（scan_junk_progress）      [daemon]       │
│                                                                  │
│  HTTP 服务：桌面模式 create_server(port=0) → 随机空闲端口         │
│             server.py 模式               → 固定 127.0.0.1:8765   │
│  前端：从 sys._MEIPASS/webapp/dist 读取（SPA 回退 index.html）     │
└──────────────────────────────────────────────────────────────────┘
```

**分层**（这是项目最干净的部分）：

```
查找文件.py     纯逻辑：目录白名单、大小统计、删除实现、进度回调
                ↑ 同时被 CLI（python 查找文件.py）和 HTTP 服务复用
server.py       路由 + JSON 序列化 + 静态文件服务，把删除委托给查找文件.py
desktop.py      pywebview 窗口 + WebView2 检测/安装 + 启动服务 + 等待就绪
webapp/         Lit 前端，通过相对路径 BASE='' 调 API（不硬编码端口 ✅）
```

**IPC 契约是对齐的**：`api.ts` 的 7 个方法与 `server.py` 的 7 条路由逐字段对应，
`types.ts` 与后端返回结构一致。这是项目里做得最好的一处工程纪律。

### 3.2 关键设计决策与它们的后果

| 决策 | 好处 | 代价 |
| --- | --- | --- |
| `port=0` 随机端口 | 不冲突、不硬编码 | 无法被外部工具稳定调试 |
| HTTP/1.0（未设 `protocol_version`） | 简单 | 无 keep-alive，每请求新建连接 |
| 前端相对 `BASE=''` | 端口变了也不用改代码 | ——（这条是对的） |
| 删除逻辑复用同一份代码 | CLI 与 GUI 行为一致 | 也意味着 **CLI 的危险行为原样进了 GUI** |
| onefile 打包 | 单文件分发 | 自解压目录落在清理目标 `%TEMP%` 里（§5-P3） |

---

## 4. 工作流程

### 4.1 从提交历史重建的开发流程

```
本地开发 → webapp 里 npm run build → 把 dist 拷进仓库（一次性）
        → 本地 pyinstaller 打包 → 手动上传 exe 到 GitHub Release
        → 写 install/uninstall 脚本 → 补三语手册 → 提交
```

**提交风格**：前缀确实用了约定式提交（`feat:` ×2、`fix:` ×1、`docs:` ×4），
但正文是一行密集中文 + 英文 token 混排，无 scope、无 issue 引用。
文档紧跟代码（卸载脚本 14:28 → 文档 14:31），说明作者是"改完立刻补文档"的习惯。

**一条重要观察**：`webapp/**` 在整个历史里**从未被任何提交改动过**。
前端 bundle 在第一次提交就进来了，之后再没动。所以"dist 入库"不是"每次构建都提交产物"
的坏习惯，而是**一次性的刻意 vendoring**（为了让纯 Python 构建也能跑）。
这个判断很重要——它把这条从"噪音"降级为"一个可以接受但有代价的选择"。

### 4.2 安装链路（这是全项目质量最高的部分）

```
用户粘贴一行 PowerShell
  ↓ ① 脚本获取：三源容错，TimeoutSec 20，首个成功即用
     jsdelivr → ghfast.top → raw.githubusercontent
     【注意】脚本从 @main 拉取，不固定版本、不校验
  ↓ ② install-github.ps1 (v2.0.0)
     停止旧进程 → 4 镜像各发 256KB Range 请求测速 → 择最快
     → curl.exe 下载 → 校验（体积 ≥15MB + MZ 头 + SHA-256）
     → 装到 %LOCALAPPDATA%\Programs\c-drive-cleaner
     → 写用户 PATH → 建开始菜单快捷方式 → 检测/装 WebView2 → 启动
```

- **无需管理员权限**（per-user 安装）——这点做得对
- **镜像只是加速器**，exe 本体是第一方 GitHub Release asset
- SHA-256 与 GitHub 的 asset digest **对得上**（`92e3d186…33c43`，21,381,232 B）——已交叉验证
- 任一可选步骤失败都不致命（fail-closed 到"打印手动下载地址"）

### 4.3 卸载链路（明显弱于安装）

- 只有 `irm | iex` 一行命令，或源码模式脚本 —— **没有本地卸载器**
- **没有写进"添加/删除程序"**（什么都没注册）
- ⇒ **离线用户无法干净卸载**，且 `%LOCALAPPDATA%\c-drive-cleaner`（用户数据）会残留
- 反讽的是：新卸载脚本的 PATH 清理写得很细（处理尾部 `\`、大小写、`REG_EXPAND_SZ`），
  而**旧** `uninstall.ps1` 用精确匹配、可能漏掉条目；两代脚本已经漂移

### 4.4 发布与更新

- **无自动更新**：`$AppVersion='2.0.0'` 只是个横幅字符串，从不参与比较
- 更新 = 重新跑一遍安装器（原地覆盖可用）
- v1 用 `releases/latest`，v2 **改成硬编码 `/download/v2.0.0/`** ← 这个改动埋了雷，见 §5-P10

---

## 5. 踩过的坑（本文档的核心）

> 分级：**[阻断]** = 会导致数据丢失、安全事件或功能必然失效，动代码前必须处理；
> **[建议]** = 真实缺陷但影响可控；**[吹毛求疵]** = 洁癖级。

### [阻断] P1 · 破坏性 API 零认证，且可被跨站触发

**现象**：任何本机进程（以及潜在的任何网页）都能让这个程序删目录，不需要任何凭据。

**证据**：

```python
# server.py
httpd = ThreadingHTTPServer((HOST, port), Handler)   # 无 token / Origin / Host 校验
length = int(self.headers.get('Content-Length') or 0) # _read_json 只看长度
```

**根因**：
1. 完全没有鉴权层，也没有 `Origin` / `Host` 白名单
2. `_read_json` **不校验 `Content-Type`** → 跨站可以用 `text/plain` 发"简单请求"
   （不触发 CORS 预检）POST JSON，直接打到 `/api/clean`
3. 清理白名单里有**不依赖用户名、可猜**的固定路径：
   `%WINDIR%\Temp`、`%WINDIR%\Prefetch`、`%WINDIR%\SoftwareDistribution\Download`、`%WINDIR%\Windows.old`
4. 手册还鼓励"以管理员身份运行" → 提权后这些路径的破坏力升级为系统级

**建议**（按性价比排序）：
1. 启动时生成随机 token，写进 `_MEIPASS` 外的临时文件或直接注入前端；所有 `/api/*` 校验它
2. 校验 `Content-Type: application/json`（挡掉"简单请求"这条跨站路径）
3. 校验 `Origin`/`Host` 属于本机

> **已核实的一点好消息**：`HOST = '127.0.0.1'`，`create_server` 也是
> `ThreadingHTTPServer((HOST, port), Handler)` —— **主服务本来就没有暴露到局域网**，
> 所以攻击面是"本机其它进程 + 本机浏览器里的页面"，不是"同网段任何人"。
> （真正绑 `0.0.0.0` 的是 `share.py`，见 P13。）
>
> 另外**不能把浏览器当防线**：所谓"浏览器会拦网页打 127.0.0.1"取决于
> Chrome 的 PNA/LNA 策略版本，而**本机进程的攻击路径完全不依赖这个前提**。

---

### [阻断] P2 · 删除不可逆，而且目标包含用户的真实文件

**现象**：清理走的是永久删除，没有回收站、没有 dry-run；而"聊天缓存"里包含用户**接收到的文件**。

**证据**（`查找文件.py`，我已逐行核对）：

```python
# 删除实现：全仓唯一的删除路径，无 send2trash
if item.is_dir() and not item.is_symlink():
    shutil.rmtree(item)
else:
    item.unlink()

# 微信：FileStorage/File
[('FileStorage','Image'), ('FileStorage','Video'),
 ('FileStorage','File'), ('FileStorage','Cache')]

# QQ：FileRecv
[('Image',), ('Video',), ('FileRecv',), ('Cache',)]

# 作者自己是知道的 —— 但这句只在 CLI 里
print("注意：微信 File、QQ FileRecv 目录包含聊天接收的文件，清理后无法恢复。")

# 唯一的黑名单：只有 4 项，不含微信/QQ 目录
BLOCKED_PATHS = [WIN_DIR/'System32', ProgramFiles, ProgramFiles(x86), WIN_DIR/'Installer']
```

**根因**：
- 用了 `shutil.rmtree` / `unlink`（永久删除）而不是 `send2trash`（回收站）
- 把"聊天文件"和"缓存"混在同一类目标里，且 `FileRecv` / `FileStorage\File` 是**接收目录不是缓存目录**
- 风险提示只存在于 CLI 的 `main()`，**GUI 路径完全没有这条提示**
- 手册宣称"默认未勾选即自动保护"——**那不是后端机制**，后端唯一的保护就是那 4 条黑名单

**验证判据**：全文搜索 `send2trash` → 0 命中；搜索 dry-run / 演习开关 → 0 命中。

**建议**：
1. 默认改用 `send2trash`（或至少提供开关），让删除可撤销
2. **把 `FileRecv` 和 `FileStorage\File` 从白名单移除**，或改为默认不勾选 + 显式二次确认
3. 把黑名单扩到微信/QQ 数据根目录，而不是只靠"默认不勾选"
4. 加 dry-run：先列出"将删除的 N 个文件、共 X MB"，用户确认后才真删

---

### [阻断] P3 · 程序会删掉自己正在用的文件

**现象**：清理完 C 盘后刷新界面可能变白屏。

**根因链**：
```
PyInstaller onefile → 自解压到 %TEMP%\_MEIxxxxx\
前端 assets 正从 sys._MEIPASS/webapp/dist 提供
而 %TEMP% 是 SYSTEM_JUNK 的第 1 项（"用户临时文件夹", TEMP_DIR）
→ 已加载但未被占用的 js/css/woff2 被 unlink
→ 刷新/reload 时 404 → 白窗
```

**加重因素**：字体 `material-symbols-rounded.woff2` 单个 **5.37 MB**，
它是"先加载但可能未被锁定"的大目标。

**判断**：自解压目录落在清理目标内是**结构性缺陷**，不是概率问题；
是否立刻白屏取决于文件是否仍被 WebView2 持有句柄（这一点属**推断**，未实测）。

**建议**：
1. 打包时设 `runtime_tmpdir` 到 `%LOCALAPPDATA%\c-drive-cleaner\run`（脱离 `%TEMP%`）
2. 或清理时显式排除 `sys._MEIPASS` 及其父目录
3. 或改用 onedir 打包（体积大些，但没有自解压目录）
4. 前端 assets 改为内联或用 `data:`/自定义协议，彻底不落盘

---

### [阻断] P4 · 反馈功能在全新安装上必然 500

**现象**：新装用户提交反馈永远失败。

**证据**：

```python
DATA = _data_root / 'data'        # %LOCALAPPDATA%\c-drive-cleaner\data
def save_feedback(payload):
    DATA.mkdir(exist_ok=True)     # ← 缺 parents=True
```

**根因**：`%LOCALAPPDATA%\c-drive-cleaner\` 这一级**没人创建**——
安装器只建了 `%LOCALAPPDATA%\Programs\c-drive-cleaner`（**另一个目录**）。
父目录不存在 → `FileNotFoundError` → 被 `except OSError` 兜成 500。

**建议**：`DATA.mkdir(parents=True, exist_ok=True)`。
**验证判据**：清掉 `%LOCALAPPDATA%\c-drive-cleaner` 后提交反馈应成功。

---

### [阻断] P5 · 唯一的保护闸是 fail-open 的

**现象**：`is_protected()` 在异常时返回"不受保护"，也就是**出错就当可删**。

**证据**（原文）：

```python
def is_protected(path: Path) -> bool:
    try:
        resolved = path.resolve()
    except OSError:
        return False              # ← 解析失败 = 判定"不受保护" = 可删
    for blocked in BLOCKED_PATHS:
        try:
            if resolved.is_relative_to(blocked.resolve()):
                return True
        except OSError:
            continue              # ← 黑名单静默失效
    return False
```

**根因**：安全函数应当是 fail-closed（不确定就当作受保护并跳过），这里恰好相反。
`Path.resolve()` 在权限受限、路径过长、被占用时都可能抛 `OSError`。

**建议**：两处 `except OSError` 都改成 `return True` / 把该条黑名单视为命中，
并在跳过时记录日志（而不是静默）。

---

### [建议] P6 · `System32\LogFiles` 被扫描、被计数、被展示，但永远删不掉

**现象**：界面上看到"系统日志 X MB"，清理后体积不变。

**根因**：两个列表互相矛盾。

```python
SYSTEM_JUNK  含  WIN_DIR / 'System32' / 'LogFiles'   # 待清理
BLOCKED_PATHS 含 WIN_DIR / 'System32'                 # 保护（前缀包含子目录）
→ is_relative_to 恒为 True → clean_directory_contents 直接 return -1
```

而 `docs/manual_zh-CN.md` §5.3 还写着"已提权后：这些目录可以正常清理"——**提权无效**，
因为拦截发生在路径判断层，与权限无关。

**建议**：要么从 `SYSTEM_JUNK` 移除该项，要么把黑名单细化到 `System32` 下的具体子目录，
不要出现"既扫描又永远拒绝"的死项。同时修正手册那句话。

---

### [建议] P7 · 删除失败被伪装成"成功"

**现象**：文件占用严重时，界面报"清理完成，释放 0.00 MB"，看起来像成功了。

**证据**：

```python
# 逐项失败只 print —— 而 console=False 时 sys.stdout 为 None，print 是空操作
except OSError as e:
    print(f"    跳过 {item.name}: {e}")

return max(0, size_before - get_directory_size(path))   # 全删失败 → 返回 0

# 调用方：只有 -1（受保护）才算失败
if freed >= 0:
    total_freed += freed
    print(f"    成功，释放 {freed / MB:.2f} MB")
```

**根因**：把"删了 0 字节"和"成功删了 0 字节"混为一谈；失败信息写去了一个不存在的 stdout。

**另外**：`shutil.rmtree(item)` 未传 `onerror`，遇到只读文件会**抛异常中止整个子树**，
而 `except OSError` 捕获后只打印——剩下的同级文件也不会被处理。

**建议**：
- 返回值区分"删除成功但确实为空"/"有文件删失败"（返回 `(freed, failed_count)`）
- 失败信息走日志文件或返回给前端，别依赖 stdout
- `shutil.rmtree(item, onerror=handler)`，把只读文件当"跳过"而非"中止"

---

### [建议] P8 · 假进度条 + 没有取消接口

**证据**：

```python
def scan_junk_progress(callback=ProgressCallback, min_seconds=12.0):
    step_delay = (min_seconds / total) if total else 0
    ...
    if step_delay > 0:
        time.sleep(step_delay * random.uniform(0.7, 1.3))   # 空目录也睡
```

**根因**：为了让"扫描"看起来像在干活，人为把总时长拉到约 12 秒；
进度百分比按**目录个数**而不是**字节数**算。也就是说：8 个目录各自大小差 1000 倍，
进度条也会均匀走完 —— 进度与真实工作量无关。

**取消**：路由表里**没有 cancel 端点**，扫描 worker 内部也无中断点，
手册自己承认"返回不会打断扫描"。

**建议**：按字节加权算进度；把 `min_seconds` 改成真实测量的产物（或干脆去掉人为延时）；
加一个 `POST /api/cancel` 并用 `threading.Event` 在扫描循环里检查。

---

### [建议] P9 · 共享状态竞态与资源无上限

- `_last_scan` 的**读侧无锁**，与写侧并发可读到半成品
- `scan_junk_payload` 在锁内跑整整 12 秒扫描 → 期间其他请求排队；
  而白名单为空时 `/api/clean` 会**隐式触发一次重扫**
- `socket.setdefaulttimeout(120)` 是**进程级全局副作用**，会影响所有 socket
- 请求体**无大小上限**；线程**无上限** → 空闲连接可占住线程 120 秒

**建议**：读侧加锁或用不可变快照；把扫描移出临界区；请求体限制（如 1 MB）；
`ThreadingHTTPServer` 换成带 `ThreadPoolExecutor` 上限的实现；去掉全局 socket 超时。

---

### [建议] P10 · 手写哈希 + 版本锁定 URL = 自伤式中断

**现象**：一旦上传新 exe 覆盖同一版本 URL，**4 个镜像会"全部失败"**，
用户看到的是 `所有下载源均下载失败！请检查网络后重试`。

**根因**：
```powershell
$ExeUrl      = ".../releases/download/v2.0.0/c-clean.exe"   # 版本硬编码
$ExpectedSha = '92E3D186…33C43'                              # 手工复制，无生成器、无 CI 校验
```
哈希是手抄的。版本升级时忘了同步 → 哈希永不匹配 → 表现为"网络问题"，
而 README 的排错表还把它写成"`校验失败自动换源` 正常容错行为"，
于是文档给出的解法（重试）**永远不可能生效**。

**建议**：从 GitHub Release API 的 asset `digest` 字段生成 `$ExpectedSha`；
URL 改回 `releases/latest` 或与哈希一起纳入发布脚本；加一个发布 CI 做一致性检查。

---

### [建议] P11 · 未签名 + 最危险的那个脚本反而不校验

- exe **无 Authenticode 签名**（`codesign_identity=None`），所有提交 `verified:false`
  → SmartScreen "未知发布者"拦截，信任锚完全落在 GitHub 账号上
- **不对称**：`install-github.ps1` **从 `@main` 拉取且不校验**（`irm | iex` 直接执行），
  而 exe 却是 pin + 哈希的
  → **权限更大的那个（脚本=RCE）反而没有完整性保护**，仓库账号被攻破即静默 RCE

**建议**：给 exe 签名（或至少把 SHA-256 与安装命令一起公开发布）；
脚本也固定 tag 并校验哈希，或让脚本只做"下载+校验+执行 exe"，把逻辑收进已签名的 exe。

---

### [建议] P12 · 打包与构建的三处硬伤

1. **`c-clean.spec` 里写死了作者本机绝对路径**（我已核对原文）：
   ```python
   ['c:/Users/Tatsumi/Desktop/c盘清理/desktop.py']
   datas=[('c:/Users/Tatsumi/Desktop/c盘清理/webapp/dist', 'webapp/dist')]
   icon=['c:/Users/Tatsumi/Desktop/c盘清理/assets_appicon.ico']
   ```
   ⇒ 换任何一台机器 `pyinstaller c-clean.spec` 立刻 `FileNotFoundError`；
   同时**泄露了作者用户名和本地目录名**（且本地目录名 `c盘清理` ≠ 仓库名 `clean`）。
   它从第一次提交就在，9 天没人发现 —— 因为 `install.ps1` 走的是**CLI 参数**
   （相对 `$PSScriptRoot`）构建，**从不读这个 spec**。所以它既没被用也没被验证。

2. **`webapp/dist` 入库 + 构建判断过窄**：`install.ps1` 只在 `index.html` 缺失时才 build
   ⇒ **改了 `src/` 也不会重建前端**，产物会悄悄过期。

3. **版本号三处不一致**：`/api/health` 报 `2.0.0`、`package.json` 是 `1.0.0`、
   安装器是 `2.0.0`。

**建议**：删掉或修好 spec（用 `$PSScriptRoot` 相对路径 + 在 CI 里验证它能构建）；
把 `dist` 移出仓库并让安装器总是 build（或改为构建期产物）；
版本号单一来源（如 `version.py` 被三处引用）。

---

### [建议] P13 · `share.py` —— 全项目最危险的文件

它与主程序无关（一个"分享给别人下载"的临时 HTTP 服务），但问题密度最高：

- 监听 `0.0.0.0:9000`（**全网可达**）且**无任何鉴权**
- 把请求头 `Host` 直接拼进一段**将被 `iex` 执行的 PowerShell**：
  `$src = 'http://{host}/c-clean.exe'` —— 单引号可逃逸 → **远程命令注入**
- **下载的 exe 无任何哈希校验**

反差极大：同一个作者的 `install-github.ps1` 有 SHA-256 + PE 头 + 最小体积 + 4 镜像测速。

**建议**：删除该文件，或改绑 `127.0.0.1`、校验 `Host` 白名单、用 `[uri]::EscapeString`
转义、并加上哈希校验。

---

### [建议] P14 · GBK / 编码

作者在 PowerShell 侧打了一场漂亮的编码战（见 §7），但 Python 侧还有遗留：

- Python 从不 `sys.stdout.reconfigure(encoding='utf-8')`
- 源码/CLI 模式下 `print(f"    跳过 {item.name}: {e}")` 遇到当前代码页无法编码的字符
  （中文用户名 + 特殊字符）会抛 **`UnicodeEncodeError`** —— 它**不是 `OSError`，接不住**
  → 整个 `/api/clean` 请求 500 中止

**好消息**：HTTP/JSON 数据路径的 UTF-8 处理是**正确一致**的，问题只在控制台输出。

**建议**：进程启动时 `sys.stdout.reconfigure(encoding='utf-8', errors='replace')`，
或把 `print` 换成 logging 并显式指定编码。

---

### [建议] P15 · WebView2 处理：`desktop.py` 对，安装脚本不对

- `desktop.py` 有**正确推理**：查注册表（3 个键，含 Evergreen GUID 与 WOW6432Node）
  → 缺失则征求同意后静默安装 → 60 秒轮询等待 → `_wait_for_server`
  → 显式 `gui='edgechromium'` **禁止静默降级到 MSHTML**（这一条很专业，避免白屏）
- 但 PowerShell 安装器 `Start-Process -Wait` 后**直接打印"WebView2 运行时安装完成"，不重新校验**
  → 可能在实际缺失的情况下宣称成功

**建议**：安装脚本复用同一份注册表检测函数（现在检测逻辑重复了 3 处），
装完后重新校验再打印结果。

---

### [建议] P16 · 提权缺口与"绝不触碰"的自相矛盾

- 安装**不需要管理员**（对），但程序**最想清理的目标恰恰需要管理员**
  （手册承认"未提权时部分系统目录会被跳过"）
- 而程序**没有在 manifest 里请求提权** → 默认双击的清理能力低于 README 给人的预期
- 黑名单（System32 / Program Files ×2 / Installer）**不覆盖**
  `SoftwareDistribution\Download` 和 `Prefetch`，而程序**确实会删它们**
- 手册说受保护路径"若用户执意清理，可以自行勾选"，与 README 的"绝不触碰"直接冲突

**建议**：统一对外表述；要么加 manifest 请求提权，要么在 UI 明确标注"需以管理员运行才能清理系统项"。

---

## 5-B. 前端（`webapp/`）

> 与后端的关系：前端在"破坏性操作的风险控制"这件事上**比后端想得更周全**（见本节末尾"做得好"），
> 但异步生命周期与可观测性几乎全线缺失。这一节的编号用 F*。

### [阻断] F1 · 轮询没有"完成只处理一次"守卫 → 可能重复跳转

**证据**（`scan-screen.ts`）：

```ts
this.pollTimer = window.setInterval(() => void this.pollProgress(), 400)  // 不等上一轮结束
// stopPolling() 只清"未来"的定时器，在途请求不可取消
if (p.state === 'done' && p.result) {
  this.stopPolling()
  router.navigate('clean', ...)      // ← 没有 if (!this.scanning) return 守卫
}
```

**根因**：服务端 `state` 会**保持 `done` 直到下一次 start**，于是两个在途轮询响应都会看到 `done`
→ `navigate('clean')` 执行两次 → 重复 `pushState` + 两组动画并发。

**关键线索**：`router.ts` 里已经有一个 `animating` 标志，但**只写不读** ——
它本来正是用来挡住重复导航的。把它接上就是最小修复。

**建议**：轮询改成 `setTimeout` 链（上一轮结束再排下一轮）；完成分支先置 `scanning=false` 再导航；
把 `animating` 接进路由。

---

### [阻断] F2 · 轮询失败静默 + 无退避 → 可能永久卡死

**证据**：

```ts
} catch { /* 网络闪断时继续轮询 */ }        // 不退避 / 不计数 / 不超时 / 不改 UI
const TIMEOUT = 0                            // api.ts，且零引用
```

**后果**：服务中途消失时以 **2.5 req/s 永久请求**，界面停在"正在扫描… x%"，
而底部 FAB `?disabled=${this.scanning}` 的"前往清理垃圾"**永远点不动**，唯一出路是"返回"。

**建议**：失败计数 + 指数退避 + 上限后转入 error 状态并恢复 UI 可用性。

---

### [阻断] F3 · `AbortController` 是死的（既无超时也无取消）

**证据**（`api.ts`）：

```ts
const controller = new AbortController()
... signal: init?.signal ?? controller.signal
```

- `init?.signal` 对全部 **7 个方法**恒为 `undefined`（没有任何调用方传 signal）
- `controller.abort()` **全文零调用**
- `TIMEOUT` 常量**零引用** → 注释写"不设超时"，实际是**没写超时**

**建议**：真正接上 `AbortSignal.timeout(ms)`，并让调用方按需 abort。

---

### [阻断] F4 · `checkServer()` 一个 try 包两个请求 → 误报"服务未运行"

**证据**（`app.ts`）：

```ts
await api.health()
appState.diskUsage = await api.diskUsage()   // 同一个 try
```

`/api/disk-usage` 在拿不到容量时返回 500（`server.py` 的
`self._error('无法获取磁盘容量信息…', 500)`）→ 整个 try 失败 → `serverOnline = false`
→ 首页弹出"本地清理服务未运行：**请执行 `python server.py`**"。

**后果**：exe 用户根本没有 `server.py`、也没有控制台 —— **给出了一条无法执行的指引**。

**建议**：拆成两个独立错误边界；只要 `/api/health` 通过就算"在线"。

---

### [建议] F5 · 磁盘容量可能长期停在 `--`

`scan-screen` / `clean-screen` 的 `render()` 直读 `appState.diskUsage`，
但订阅回调只赋值 `this.scan = appState.scan`；`app.ts` 两次 `notifyState()` 时
`scan` 都是 `null → null` → **Lit 的引用比较判定"没变化" → 不重渲染**。
`home-screen` 的 `serverChecked` 同属死状态（`render` 从不读它，"检查中"加载态设计了但没实现）。

**建议**：订阅时把 render 会读到的字段全部复制过来，或把状态换成不可变快照。

---

### [建议] F6 · 4 个屏幕常驻，隐藏后仍在跑

`app.ts` 里 4 屏都是静态 eager import 且**常驻挂载**，靠 `visibility` 切换；
而 `visibility: hidden` **不会触发 `disconnectedCallback`**
→ 扫描中离开屏幕后，`loading-indicator` 的 RAF 仍以 60fps 跑三角计算，400ms 轮询继续。

**建议**：用 `screen-active` 事件暂停/恢复 RAF 与轮询。

---

### [建议] F7 · 前端运行时错误零可观测 —— 这是"白窗"的另一半

`c-clean.spec` 里 `console=False` + 无 devtools + 前端**没有**
`window.onerror` / `unhandledrejection`。而 `app.ts` 有：

```ts
query('home') as HTMLElement   // 若为 null，紧随的 el.style.visibility 抛 TypeError
```

→ 路由初始化中断，**现象与"WebView2 缺失"完全一样，无法区分**。

**建议**：加 `window.onerror` 兜底面板（直接把错误文本画到页面上），
去掉 `as HTMLElement` 断言改运行时判空。这一条能省掉未来大量的"白屏"排错时间。

---

### [建议] F8 · 无障碍系统性缺失

| # | 问题 |
| --- | --- |
| ① | **`prefers-reduced-motion` 对路由的 WAAPI `animate()` 完全无效**（`base.css` 只重置了 CSS 的 `transition/animation-duration`）→ 460ms 整屏滑动照播 |
| ② | 所有 `md-icon` 没有 `aria-hidden` → 读屏器把 `chevron_right` / `delete_sweep` 当文本念出来 |
| ③ | 4 屏顶栏都有 `<md-icon-button slot="leading" aria-label="应用图标">` 且**没有任何 `@click`** → 可聚焦的假按钮 |
| ④ | `role="button"` 只处理 Enter，不处理 Space |
| ⑤ | 没有 `:focus-visible` 样式 |
| ⑥ | 路由切换不移动焦点、不播报 |
| ⑦ | `guide-overlay` 有 `role="dialog"` 但无焦点陷阱、无 ESC 关闭 |

**建议**：一次性清扫（把 reduced-motion 判定接进 router、补 `aria-hidden`、删假按钮、
补 Space 键、加 `:focus-visible`、路由后聚焦标题）。

---

### [建议] F9 · 死代码 15 处（因为 `noUnusedLocals` 被关掉了）

最值得注意的几条：

- **`theme.ts::setAccentColor()` 零调用** → **动态配色在 exe 里根本不可达**
  （窗口 URL 不带查询串、无设置页、系统强调色通路恒 `null`）
  ⇒ `@material/material-color-utilities` 目前是**死重量**
- `api.ts::TIMEOUT`；`router.ts::animating`（只写不读，恰好是修 F1 的钥匙）
- `state.ts::appState.scanning`（**写 6 次读 0 次**）
- `app-bar.ts::scrolled`（4 屏无一设置它 → "滚动变色"整块样式是死的）
- **`db.listFeedback()` + `feedback` store：写进去的反馈没有任何 UI 能读**；
  而且提交失败时提示"已保存在浏览器中"，紧接着却 `await db.clearDraft()`
  → **文案承诺与代码行为相反**
- `clean-screen` 里的 `: this.scan ? emptyState : emptyState`（两个分支同一个值）

---

### [建议] F10 · 类目文案有三个真相源

后端 `CATEGORY_LABELS` 已经返回了 `categoryLabel`，但前端 4 个 screen **从不读取它**，
而 `scan-screen` 自己写 `'系统及通用'`、`clean-screen` 写 `'微信聊天缓存'`
→ **同一类目两套文案**。以后改文案必然漏改一处。

**建议**：统一读后端的 `categoryLabel`。

---

### [建议] F11 · 路由双向压栈 → back 语义错乱 + 栈无限增长

所有"回主页"都用 `navigate('home')`（`pushState`，**不是** `back`/`replace`）；
`clean` 页按钮文案写"返回清理页面"但实际执行 `navigate('scan')`
→ 之后 `scan` 页的"返回"= `history.back()` 会回到 **clean**。
刷新后 `active` 硬编码 `{ screen: 'home' }`，与 `history.state` 不一致。

**建议**：区分"前进"与"返回"两种导航语义，返回用 `history.back()` 或 `replaceState`。

---

### [建议] F12 · 资产体积与缓存策略互相放大

- **图标字体一个文件占 dist 的 90.4%**，而只用到约 28 个字形 → **子集化可省约 90%**
- 9 个 Roboto 子集共 231,060 B，但**都没有 CJK `unicode-range`** → 中文落 Microsoft YaHei，
  实际只有 `roboto-9`（43 KB）会命中，**其余 188 KB 永远不会被用到**
- 而 YaHei **没有 Medium 字重** → `font-weight: 500` 的中文层级实际上是平的（设计意图落空）
- 图标字体用 `font-display: block` + ligature → 加载期空白，**失败时直接显示
  `local_shipping` 字面文本**
- **最要命的一条**：`server.py::_static` 统一发 `Cache-Control: no-cache`
  且**没有 ETag / Last-Modified** → 连带内容哈希名的静态资源也**每次启动整包重下 5.67 MiB**

**建议**：子集化图标字体 → 删掉不命中的 Roboto 子集 → 给静态资源加 ETag / 长缓存
（带哈希名的资源可 `immutable, max-age=31536000`）。

---

### [吹毛求疵]（前端）

- 4 屏各抄一份 `:host / .toolbar-row / .stage / .container-frame` 的 CSS；
  4 屏逐字重复 `<app-bar heading="C盘垃圾清理">`，**而这正是 `app-bar` 的默认值**
- 容器宽度基准 1048 / 1036 / 996 无注释
- `scan-screen` 里三处**硬编码 Blue RGB**（`rgba(4,30,73,.12)` 等）
  → 动态配色一旦启用就色彩错配
- 魔法数字（460 / 4200 / 400 / 2800 / 620 / 72）未 token 化
- `package.json` 无 `engines`（Vite 7 需要 Node `^20.19 || >=22.12`）
- `home-screen` / `clean-screen` 把占位默认值 `heading="确认/取消"` 当正文用了
- 确认框文案："真的不需要清理电脑垃圾文件返回到主页面吗？"

### 前端做得好、不要动

1. **零 XSS**：无 `innerHTML` / `unsafeHTML` / `eval`，所有插值经 lit-html 转义
2. **破坏性操作的风险工程是对的**：`clean-screen` 默认只勾 `browser` +
   匹配 `/缓存|Cache|Temp|Prefetch|Download/`，注释明写"聊天记录相关默认不勾选以免误删"，
   清理前明确告知"无法恢复"，后端另有白名单 + `is_protected` 二道防线
   —— 说明作者**确实想过"别删用户的东西"**，只是后端那层没做到（对照 §5-P2）
3. `tokens.css` 里那条"自定义属性沿继承链进 Shadow DOM、`md-*` 选择器不穿透"
   的踩坑注释，**判断正确**
4. `app-snackbar` / `loading-indicator` 的 `disconnectedCallback` 清理正确
   （反例：screen 的 `screen-active` 监听、feedback 的 `draftTimer` / 620ms timer、
   `db.tx` 出错时缺 `db.close()` —— 这三处是真实泄漏点）
5. 自研 `pushState` 路由 + WAAPI 过渡，**正/反向动画都实现了**

---

### [吹毛求疵]

| 位置 | 问题 |
| --- | --- |
| `api.ts` | `const TIMEOUT = 0` 是死代码，`AbortController` 永不 abort —— 叫"无超时"其实是**没写超时** |
| `server.py` `_static` | 用 `str(target).startswith(str(DIST))` 字符串前缀比较 → `dist-backup` 目录可被读到 |
| `查找文件.py` | 微信/QQ 路径硬编码 `%USERPROFILE%\Documents` → **OneDrive 重定向后失效** |
| 全局 | `Path.unlink()` 无长路径（`\\?\`）支持 |
| 仓库元数据 | `description: "Automatic garbage collection"` 过于泛化；`topics: []`；`homepage: null` |
| 仓库语言 | 显示 **TypeScript**（因为 dist 入库），实际主体是 Python |
| 署名 | 手册致谢 `杜宏熙 / Du Hongxi`，LICENSE 与提交是 `云绵绵甜奶糖`，账号是 `mianmianMilkCandy` —— 三处不一致 |
| `install.ps1` | 步骤编号重复（`# 6` 后又是 `# 6.5`） |
| `uninstall-github.ps1` | 删目录失败两次后仍打印"程序目录不存在（可能尚未安装）"—— 误导 |
| `.gitignore` | 忽略了 PyInstaller 中间目录（`build-app/`、`build-work/`）但**没忽略 `dist/`** |
| 缺失 | 无 `requirements.txt`、无测试、无 CI、无 CHANGELOG（Release 说明充当变更日志） |

---

## 6. 代码审查结论汇总

**审查对象**：`main` @ `f5dad95` 全仓库静态代码 —— `desktop.py`、`server.py`、
`查找文件.py`、`share.py`、`webapp/src/**`、`c-clean.spec`、`install*.ps1`、
`uninstall*.ps1`、三语手册、README、仓库与 Release 元数据、8 次提交历史。

**分级统计**：**阻断 9 项**（P1–P5 后端/打包、F1–F4 前端）、**建议 19 项**（P6–P16、F5–F12）、
**吹毛求疵 18 条**（后端 11 + 前端 7）。

**最该先做的五件事**（性价比从高到低）

1. **改 `is_protected` 为 fail-closed**（P5）—— 只改 2 处 `except`，收益巨大
2. **把 `FileRecv` / `FileStorage\File` 移出白名单 + 引入回收站或 dry-run**（P2）——
   直接消除"删掉用户聊天文件"这一类不可挽回的事故
3. **删掉或修好 `c-clean.spec`，补上 `DATA.mkdir(parents=True)`**（P12 / P4）——
   两个都是一行改动，确定性极高
4. **`api.ts` 真接上超时/取消 + 轮询加"完成只一次"守卫与失败退避**（F1–F3）——
   一次解决"重复跳转 / 永久卡死 / 误报离线"三个用户可见的坏体验
5. **加 `window.onerror` 兜底面板**（F7）—— 让"白屏"从此可归因，
   这一条会显著降低你未来所有的排错成本

**本次无**：无动态验证（未实际运行程序、未做内存/句柄观测）、无安全渗透测试、
未审 `webapp/dist/assets/*.js`（328 KB 压缩产物）的实际内容、
未在 Windows + Python ≤3.11 上实测 junction/符号链接在 `shutil.rmtree` 与 `os.walk` 下的行为。

---

## 7. 优点（值得保留的工程决策）

1. **分层干净、零复制**：`查找文件.py` 是所有删除逻辑的唯一实现，CLI 与 GUI 共用。
2. **后端零框架依赖**：纯标准库 + pywebview，是"约 20 MB"成立的根因。
3. **前后端契约逐字段对齐**：`api.ts` 7 方法 ↔ `server.py` 7 路由，`types.ts` 与返回结构一致。
   这是全项目最好的工程纪律。
4. **端口不硬编码**：`port=0`（桌面模式）+ 前端相对 `BASE=''`，两边配合正确。
5. **白屏三根因全部处理**：注册表检测 WebView2 + 同意后静默安装 + 显式
   `gui='edgechromium'` 禁止降级 + `_wait_for_server` 等待就绪。这是踩过坑才会有的一套。
6. **安装脚本质量很高**：4 镜像 256KB Range 测速择优、SHA-256 + PE 头 + 体积三重校验、
   失败 fail-closed 并打印手动下载地址、per-user 无需管理员、原地升级可用。
7. **编码问题被真正解决**：提交 `08310fc` —— `fix: install-github.ps1 改为纯 ASCII，
   中文改为运行时 base64 解码，修复 irm 管道乱码与快捷方式创建失败`。
   根因是 PowerShell 5.1 把管道字节按 ISO-8859-1 解码，UTF-8 脚本经 `irm|iex` 后
   产生乱码并**导致 `CreateShortcut` 失败**。解法（全 ASCII 文件 +
   `[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String(...))`）是正确且彻底的。
   代价是文件不可 grep、不可 review。
8. **三语文档**（简中/英/日）+ 一张"现象→原因→解决"的现场排错表 —— 对终端用户很友好。
9. **卸载脚本的 PATH 清理很细**：处理尾部 `\`、大小写、`REG_EXPAND_SZ` 类型，且幂等。
10. **每个可选步骤都是非致命的**：任一步失败都不会让用户卡在半装状态。

---

## 8. 缺点与风险

| 类别 | 问题 | 后果 |
| --- | --- | --- |
| **数据安全** | 永久删除 + 目标含用户接收文件 + 无 dry-run（P2） | **不可挽回的用户数据丢失** |
| **安全** | 删除 API 零认证且可跨站触发（P1） | 本机进程/网页可触发删目录 |
| **安全** | `share.py` 命令注入 + 无哈希（P13） | 远程代码执行 |
| **安全** | exe 未签名；威力更大的 `@main` 脚本反而不校验（P11） | SmartScreen 拦截 + 供应链攻击面 |
| **正确性** | 保护闸 fail-open（P5）；删除失败报成功（P7） | 安全与可信度同时受损 |
| **正确性** | 程序删自己（P3）；反馈必 500（P4） | 白屏 / 功能不可用 |
| **工程规范** | 无测试、无 CI、无 lint、无 `requirements.txt`、无 CHANGELOG | 改一行都可能静默破坏（P12 就是这么活下来的） |
| **可维护性** | `c-clean.spec` 绝对路径；两代安装/卸载脚本漂移；版本号三处不一致 | 换机不可构建；行为不一致 |
| **仓库卫生** | 5.37 MB 字体存了两份；仓库 5.7 MB 而源码仅 230 KB | 克隆缓慢（约为源码的 25 倍） |
| **性能** | 人为 12 秒假进度（P8）；HTTP/1.0 无 keep-alive | 用户体验与吞吐都受损 |
| **性能** | dist 5.67 MiB 里 94% 是字体，且静态资源无 ETag 且 `no-cache`（F12） | **每次启动整包重下 5.67 MiB**，而实际只用了 28 个字形 |
| **异步正确性** | 超时/取消/退避/完成守卫四项全缺（F1–F3） | 重复跳转、永久卡死、陈旧 UI、后台偷跑 |
| **可观测性** | `console=False` + 无 devtools + 前端无 `window.onerror`（F7） | "白屏"无法归因，与 WebView2 缺失无法区分 |
| **无障碍** | reduced-motion 对 WAAPI 失效、图标无 `aria-hidden`、假按钮（F8） | 键盘/读屏用户基本不可用 |
| **分发** | 无自动更新；离线无法卸载；不在添加/删除程序里 | 用户难以干净移除 |
| **文档一致性** | 手册"绝不触碰"与"可自行勾选"冲突；§5.3 关于提权的说明是错的 | 用户预期错位 |

---

## 9. 如果继续维护：建议的修复顺序

**第一批（安全与数据完整性，低成本高收益）**
1. `is_protected` 改 fail-closed（2 行）
2. `FileRecv` / `FileStorage\File` 移出白名单 + 加 dry-run 或回收站
3. `DATA.mkdir(parents=True, exist_ok=True)`
4. 删除或加固 `share.py`
5. `/api/*` 加 token + `Content-Type` 校验

**第二批（正确性与可构建性）**
6. 修 `c-clean.spec` 用相对路径，并在 CI 里验证它能构建
7. `/api/clean` 返回值区分"成功但为空"与"有失败"
8. 自解压目录迁出 `%TEMP%`（或清理时排除 `_MEIPASS`）
9. `System32\LogFiles` 死项处理 + 修手册 §5.3
10. 版本号单一来源
11. `api.ts` 真接上超时/取消；轮询加"完成只一次"守卫、失败退避（F1–F3）
12. `checkServer()` 拆分错误边界，别把 500 当成"服务未运行"（F4）
13. 加 `window.onerror` 兜底面板 + 去掉 `as HTMLElement` 断言（F7）

**第三批（工程化与体验，能防止前面所有问题复发）**
14. 加 `requirements.txt` 并锁版本
15. 加最小测试集：**重点测 `is_protected`、白名单构造、删除返回值、轮询完成守卫**
16. 加 CI：构建 + 测试 + **重新构建 dist 后做 diff/版本戳比对**（否则产物会继续静默陈旧）+ 哈希一致性检查
17. 补 `POST /api/cancel`、进度按字节加权
18. 加本地卸载器 + 注册进"添加/删除程序"
19. 图标字体子集化 + 删掉永不命中的 Roboto 子集 + 静态资源加 ETag/长缓存（F12，
    **这一条同时改善启动速度与首次加载的 5.67 MiB**）
20. 无障碍一次性清扫（F8）

---

## 10. 本文件的不确定性声明

**已第一手逐行核对过的部分**（这些不是转述，是我自己读原文确认的）：

| 结论 | 出处 |
| --- | --- |
| `BLOCKED_PATHS` 只有 4 项；`qq_caches()` 含 `('FileRecv',)`；微信含 `('FileStorage','File')`；删除只有 `shutil.rmtree` / `unlink`；`is_protected` fail-open；`scan_junk_progress(min_seconds=12.0)` 人为延时 | `查找文件.py` 全文 |
| `_read_json` 只读 `Content-Length`；`DATA.mkdir(exist_ok=True)` **确实缺 `parents=True`**；`socket.setdefaulttimeout(120)`；`_last_scan` 读侧无锁；`scan_junk_payload` 在锁内跑 12 秒；**路由表无 cancel**；`/api/health` 报 `2.0.0`；`_static` 用字符串 `startswith` 做路径约束 | `server.py` 全文 |
| `c-clean.spec` 里三条绝对路径 | `c-clean.spec` 原文 |

**未验证（不要当成结论用）**
- **未做任何动态验证**：没有运行程序、没有实测删除、没有观测句柄与内存
- **P3 的即时后果属推断**：自解压目录在清理目标内是**代码事实**；
  但"刷新立刻 404"取决于 WebView2 是否仍持有文件句柄，未实测
- **junction / 符号链接**在 `shutil.rmtree` 与 `os.walk` 下的行为未在
  Windows + Python ≤3.11 实测（代码里对**直接子项**有 `not item.is_symlink()` 防护，
  但 `os.walk` 的 `followlinks` 与深层 junction 未验证）
- **浏览器侧对 `127.0.0.1` 的拦截强度**随 Chrome PNA/LNA 版本变化；
  但 P1 的**本机进程攻击路径不依赖**这个前提
- 未读 `webapp/src/screens/*.ts` 的交互细节之外的**压缩产物** `webapp/dist/assets/*.js`（328 KB）
- **前端一节（F1–F12）来自一次完整的静态通读，但没有像 P 系列那样被第二遍独立复核** ——
  引用到的代码片段与文件位置都可对账，但若你要把 F 系列当作改动依据，
  建议先按文中给的"判据"自己复现一遍
- 一次对抗性复核（专门去证伪 P1–P8）**已启动但未跑完就被终止**，因此不要把它当作"已复核"的背书

**抓取过程中的坑（供复核者复用）**
- GitHub tree API 单次返回会被截断（本次首次抓取在 20000 字符处被切，
  因此**漏掉了 `查找文件.py`、`webapp/src/types.ts`、`vite.config.ts`**）
- `argo_fetch` 会把 `.py` 当 HTML 解析并**静默截断**（报 `truncated:false` 却少内容）
  → 必须用 **blob size 与抓取字符数对账**，或改用 `web_fetch` 抓 raw 文件

**关键文件核对清单**（复核时按此逐项对账体积）

| 文件 | 大小 (B) |
| --- | --- |
| `查找文件.py` | 10650 |
| `server.py` | 14048 |
| `desktop.py` | 6929 |
| `share.py` | 8150 |
| `install-github.ps1` | 12743 |
| `install.ps1` | 7309 |
| `uninstall-github.ps1` | 5344 |
| `uninstall.ps1` | 1563 |
| `c-clean.spec` | 834 |
| `README.md` | 5971 |
| `webapp/dist/assets/index-*.js` | 328463 |
| `webapp/dist/assets/material-symbols-rounded-*.woff2` | 5373444 |

---

## 11. 一句话总结

**这是一个"个人成品感很强、工程化程度很低"的项目**：分层、契约、安装体验、
编码排错这些"看得见的工程"做得很扎实（甚至超出个人项目平均水平），
但**没有测试、没有 CI、没有依赖锁**导致一整类"没被验证过就不会被发现"的问题长期存活 ——
`c-clean.spec` 的绝对路径、`DATA.mkdir` 缺 `parents`、保护闸 fail-open 都是同一个病根。
而最需要严肃对待的是 **P1/P2**：一个把"删除用户真实文件"这件事做得既不可逆、又几乎没有防线。
