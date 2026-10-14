# total-design v1.14.4 发布说明

> 面向使用态用户：本次为**能力补齐版**，为 Pi Agent 补齐与 atomcode / Claude Code 一致的 `/td-*` slash 命令入口；skill / references / hooks / 契约流全部不变。

## 本版本是什么

1.14.4 是 **Pi Agent slash 命令桥补齐版**：此前 Pi Agent 加载本 plugin 后只能以 `/skill:td-propose` 这类长前缀触发 8 个 td-* skill；atomcode / Claude Code 侧则是直接 `/td-propose`。1.14.4 通过 Pi extension 机制在 Pi 侧注册同名 8 个短命令，`/td-<verb> <args>` 会转发到 `/skill:td-<verb> <args>`，跨平台 slash 体验收敛为一致形态。

skill / references / hooks / 契约流（propose → apply → archive）/ `commands/td-*.md` 目录、atomcode 与 Claude Code 加载路径、四处 manifest 的 name / description / author 全部不变，仅 Pi 侧多出一个 extension 入口 + version bump。

## 改了什么

### 新增 `extensions/pi-agent/index.ts`

71 行的 Pi extension 入口，`export default` 接收 Pi 注入的 `pi` 对象，调用 `pi.registerCommand` 注册 8 个短命令，每个命令的 `handler` 用 `pi.sendUserMessage` 把 `/td-<verb> <args>` 转成 `/skill:td-<verb> <args>` 再发回主会话——skill 加载与执行仍走 Pi 原生的 `pi.skills` 路径，extension 只负责命令名映射。

8 个命令与既有 `commands/td-*.md` 目录一一对齐：

| 短命令 | 转发目标 |
|---|---|
| `/td-init` | `/skill:td-init` |
| `/td-propose` | `/skill:td-propose` |
| `/td-explore` | `/skill:td-explore` |
| `/td-apply` | `/skill:td-apply` |
| `/td-reverse-spec` | `/skill:td-reverse-spec` |
| `/td-archive` | `/skill:td-archive` |
| `/td-system-audit` | `/skill:td-system-audit` |
| `/td-list` | `/skill:td-list` |

### 修改 `package.json`

`pi.extensions` 数组新增 `"./extensions/pi-agent/index.ts"`，与既有 `pi.skills` 并存——`pi.skills` 继续加载 18 个 skill，`pi.extensions` 只承载命令注册逻辑，两者职责正交，不产生重复加载或覆盖。

## ⚠️ 行为变更

| 项 | 1.14.3 | 1.14.4 |
|---|---|---|
| Pi Agent slash 入口 | 仅 `/skill:td-*` 长前缀 | `/td-*` 短前缀（与 atomcode / Claude Code 一致），`/skill:td-*` 仍可用 |
| atomcode / Claude Code slash 入口 | `/td-*` | 不变 |
| Skill 18 个 / Command 8 个 | — | 未变更 |
| Hooks / td-* 契约流 | — | 未变更 |
| `commands/td-*.md` 目录 | — | 未变更 |
| 四处 manifest 的 name / description / author | — | 未变更 |
| hook 命令串 | — | 未变更（哈希不变） |

hook 命令串未变更，已 trust 的安装继续生效；不需要重新 trust。

## 升级步骤

1. **bump 版本**：四处清单的 `version` 已同步改为 `1.14.4`（根目录 `plugin.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / `package.json`，description 保持纯 ASCII 且四处完全一致）。
2. **运行时前置**：不变——Node.js ≥20.19.0；OpenSpec CLI ≥ 1.12。
3. **重新安装**（按平台）：
   - atomcode：`/plugin marketplace add <this-repo-url>` → `/plugin install total-design`
   - Claude Code：`claude plugin marketplace add <this-repo-url>` → `claude plugin install total-design`（或 `claude --plugin-dir <this-repo-path>`）
   - Pi Agent：`pi install git:<this-repo-url>`
4. **重新 trust**：**不需要**——本次 hook 命令串未变更（哈希不变），已 trust 的安装继续生效。全新安装按平台执行 `atomcode plugin trust total-design`。

## 验证

- 四处清单版本号同为 1.14.4，description 四处逐字一致：`grep -h '"version"' plugin.json .claude-plugin/plugin.json .claude-plugin/marketplace.json package.json | sort -u` 应只输出 `"version": "1.14.4"` 一种形态（`marketplace.json` 与根目录 `plugin.json` / `.claude-plugin/plugin.json` / `package.json` 各含一个）。
- `package.json` 的 `pi.extensions` 与 `pi.skills` 字段并存，`pi.extensions` 指向 `./extensions/pi-agent/index.ts`：`jq '.pi' package.json`。
- `extensions/pi-agent/index.ts` 存在且注册 8 个 `td-*` 命令：`grep -c 'td-' extensions/pi-agent/index.ts` 应 ≥ 8。
- `commands/` 与 1.14.3 完全一致：`git diff v1.14.3..HEAD -- commands/` 应为空。
- skill 数量（18）、命令文件数量（8）、hook 命令串、td-* 契约流行为均不变。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.14.4] 条目。
