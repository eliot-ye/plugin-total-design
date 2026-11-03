# 安装

> **读者**：要把 total-design 装进自己 code agent 的使用者。
> **读完应能**：在所选平台装好、确认 skill 与 `/td-*` 可用、知道 hook 是否需要授权。

## 前置

- **Node.js ≥20.19.0** —— OpenSpec CLI 与 SessionEnd hook 共用同一运行时；DSH 端由 Harness 自带 Node 运行时，无需另装
- **OpenSpec CLI** —— `npm install -g @fission-ai/openspec@latest`
- **git** —— 从仓库安装时需要

## 选择你的 code agent

| 平台 | 安装方式 |
|---|---|
| [atomcode](#atomcode) | git marketplace 或手动 clone |
| [Claude Code](#claude-code) | git marketplace 或 `--plugin-dir` |
| [Pi Agent](#pi-agent) | `pi install git:<repo-url>` |
| [DeepSeek Harness (DSH)](#deepseek-harness-dsh) | Web 插件页 / `dsh plugin add` / `plugin_manager install_bundle` |

---

## atomcode

```bash
/plugin marketplace add <this-repo-url>
/plugin install total-design
```

或手动安装：

```bash
git clone <this-repo-url> ~/.atomcode/plugins/total-design
# 重启 atomcode session
```

**信任 SessionEnd hook**（仅 atomcode）：安装后首次运行会提示 hook 待授权，执行

```bash
atomcode plugin trust total-design
```

不授权时 skills / commands 仍可用，只有会话结束时的 `.td-state/` 状态兜底不生效。

---

## Claude Code

```bash
claude plugin marketplace add <this-repo-url>
claude plugin install total-design
```

开发调试时可用 `--plugin-dir` 直接指向本仓库目录：

```bash
claude --plugin-dir <this-repo-path>
```

**hook 说明**：Claude Code 识别 `.claude-plugin/plugin.json` 的 `hooks` 字段，`hooks.json` 内的 `${CLAUDE_PLUGIN_ROOT}` 在此端有效；hook 生效需按 Claude Code 的 trust 机制单独授权。

---

## Pi Agent

```bash
pi install git:<this-repo-url>
```

Pi 通过根 `package.json` 的 `pi.skills` 加载 skills 目录，通过 `pi.extensions` 加载 `extensions/pi-agent/index.ts`（Pi 无原生 hook 系统，用 TS extension 自建 slash 命令桥）。

**hook 等价物**：extension 的 `session_shutdown` 回调复用 `hooks/td_state_sync.js` 导出的函数（同一事实源，不 fork 逻辑），会话结束时从文件系统事实校正 `.td-state/`；主路径状态仍由 td-archive / td-system-audit 正文步骤直接写入。

调用格式与命令差异见 [usage.md · Pi Agent](../user/usage.md#pi-agent)。

---

## DeepSeek Harness (DSH)

在 Harness 侧边栏 **插件** 页点 **添加插件**，填入本仓库的**绝对路径**，启用 `total-design-skill-provider` 后重启或等 HMR 生效：

```text
插件页 → 添加插件 → /absolute/path/to/plugin-total-design → 启用 → 重启
```

或用 CLI（非 desktop profile）：

```bash
dsh plugin --profile <name> add /absolute/path/to/plugin-total-design
dsh --profile <name> --dump-config   # 确认 total-design-skill-provider 行已插入
```

DSH 通过根 `package.json` 的 `dsh` 字段识别本 plugin。机制与已知限制见 [platforms.md · DSH](../maintainer/platforms.md#deepseek-harness-dsh) 与 [dsh/README.md](../../dsh/README.md)。

**hook 说明**：DSH 没有 `hooks.json` / `SessionEnd` 加载器，`hooks/` 仅对 atomcode / Claude Code 生效；DSH 下 `.td-state/` 校正只由 td-archive / td-system-audit 正文步骤承担。

---

## 装完怎么确认

1. 打开新会话，确认 agent 能看到 18 个 skill（约束层 2 + 行为层 6 + 配置层 3 + 契约层 7）。
2. 输入 `/td-propose`（各平台前缀差异见 [usage.md](../user/usage.md#命令前缀)），能触发即安装成功。
3. 需要 hook 兜底的平台，确认已按上文授权。

## 下一步

- [命令与用法](../user/usage.md) —— 各平台调用差异、8 个命令、典型工作流
- [平台加载机制](../maintainer/platforms.md) —— 维护者视角：四个平台分别怎么加载本 plugin
