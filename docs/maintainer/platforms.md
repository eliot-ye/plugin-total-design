# 平台加载机制

> **读者**：维护者——要新增平台、排查加载问题、或修改平台相关资产的人。
> **读完应能**：说清四个平台各自如何加载本 plugin、命令前缀与 hook 差异、新增一个平台要动哪些文件。

本 plugin 走「多 manifest 并存」策略，同一份 `skills/` 资产由各平台原生加载器各自识别，不依赖任何单一平台的扩展能力。

**事实来源**：atomcode 侧字段规则来自其源码 `crates/atomcode-core/src/plugin/manifest.rs` 与 `skill.rs`（Claude Code 对应字段一致）；DSH 侧来自 DSH 源码 0.2.1-rc.5 实读（`dsh-skill-filesystem` / `dsh-tool-skill` / `dsh-package-manifest` / `dsh-app-boot`）。

## 总表

| 平台 | 加载清单 | 分发方式 | 加载组件 | 命令前缀 | hook |
|---|---|---|---|---|---|
| atomcode | `.claude-plugin/plugin.json`（走 CC 兼容路径） | git marketplace（`/plugin marketplace add`） | skills + commands + hooks | `/td-propose` | `SessionEnd`，需 trust |
| Claude Code | `.claude-plugin/plugin.json` | git marketplace 或 `--plugin-dir` | skills + commands + hooks | `/total-design:td-propose` 或 `/td-propose` | `SessionEnd`，需 trust |
| Pi Agent | `package.json` 的 `pi.skills` + `pi.extensions` | `pi install git:<repo-url>` | skills + extension | `/td-propose` 或 `/skill:td-propose` | 无原生 hook，extension `session_shutdown` 兜底 |
| DeepSeek Harness (DSH) | `package.json` 的 `dsh.bundle.patch` → `extensions/dsh/cordis.patch.yml` | 插件页 / `dsh plugin add` / `plugin_manager install_bundle` | skills（provider 注册） | `/td-propose` | 无 |

## 共享与差异

- **共享**：仓库根的 `skills/`（18 个 skill）——各平台各自扫描，不需要副本或 symlink。
- **仅 atomcode / Claude Code**：`commands/`（8 个命令文件）通过 `.claude-plugin/plugin.json` 加载（Agent Plugins 1.0.0 v1 未定义 commands 组件）。
- **Pi**：无 commands 目录概念，`/td-*` 短命令由 `extensions/pi-agent/index.ts` 注册生成（7 个桥接同名 skill、`td-list` 原生实现 `openspec list`）。
- **DSH**：无 commands 目录加载，`/td-*` 由 user-invocable skill 的 `/名称` 手势承载（`td-list` 缺失）；无 hook。

## atomcode

- 加载器搜索顺序：`.atomcode-plugin` → `.claude-plugin`，本 plugin 只保留后者，走 CC 兼容路径。
- 手动安装路径：`~/.atomcode/plugins/total-design`。
- hook schema（与 Claude Code 兼容，官方文档核实）：

  ```json
  {
    "SessionEnd": [
      { "hooks": [{ "type": "command", "command": "...", "timeout": 30 }] }
    ]
  }
  ```

  `plugin.json` 的 `hooks` 字段接受路径字符串（本 plugin 用 `"./hooks/hooks.json"`）。事件名大小写不敏感（`SessionEnd` / `session_end` 等价）；hook 经 stdin 收 JSON、stdout 决定处理；命令串可用 `${ATOMCODE_PLUGIN_ROOT}` / `${CLAUDE_PLUGIN_ROOT}` 指向 plugin 安装目录。
- **Hook 需信任后才激活**：安装时不运行，`atomcode plugin trust total-design` 授权后下次 session 生效；插件更新后 hook 命令哈希变更会失效，需重新 trust。

## Claude Code

- 安装：`claude plugin marketplace add <repo>` + `claude plugin install total-design`，或 `claude --plugin-dir <repo-path>`（开发调试）。
- 命名空间：plugin namespace 自动附加，`/total-design:td-propose` 与 `/td-propose` 等价。
- hook：识别 `.claude-plugin/plugin.json` 的 `hooks` 字段，`hooks.json` 内 `${CLAUDE_PLUGIN_ROOT}` 有效；生效需按其 trust 机制授权。

## Pi Agent

- 安装：`pi install git:<repo-url>`。
- `package.json` 的 `pi.skills` 指向 `./skills`，`pi.extensions` 指向 `extensions/pi-agent/index.ts`。
- 无原生 hook 系统：extension 的 `session_shutdown` 回调复用 `hooks/td_state_sync.js` 导出的函数（同一事实源，不 fork 逻辑），会话结束时从文件系统事实校正 `.td-state/`；主路径状态仍由 td-archive / td-system-audit 正文步骤写入。

## DeepSeek Harness (DSH)

- bundle 形态：根 `package.json` 声明 `dsh.bundle.patch` → `extensions/dsh/cordis.patch.yml`；patch `insert` 一行 `total-design-skill-provider`，`name` 为相对本 patch 的 `./index.mjs`；`extensions/dsh/index.mjs` 通过 `ctx.skills.registerProvider` 注册 `skills/*/SKILL.md`。
- 安装：Web 插件页「添加插件」填绝对路径，或 `dsh plugin --profile <name> add <path>`，或 `plugin_manager install_bundle`（Creator 模式）。DSH 只读根 `package.json` 的 `dsh` 字段，不读其它 manifest。
- 不支持项：`commands/` 目录、`hooks.json` / `SessionEnd`、frontmatter `argument-hint`（被忽略）。
- 实现与限制详见 [dsh/README.md](../../extensions/dsh/README.md)。

## 新增一个平台时要动哪里

1. 本文「总表」加一行 + 新增该平台小节（加载清单、分发、组件、命令前缀、hook）。
2. [manifests.md](manifests.md)：若引入新清单文件，补职责表与一致性约束。
3. 仓库实现：对应的 manifest 字段 / 包装层（如 Pi 的 `pi.extensions`、DSH 的 `extensions/dsh/`）。
4. `README.md` 安装矩阵加一行；`docs/user/install.md` 加安装步骤。
5. `AGENTS.md`「项目身份」一句话提及，不复制细节。
