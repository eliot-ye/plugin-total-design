# total-design v1.14.3 发布说明

> 面向使用态用户：本次为**元数据回滚版**，无行为变更、无新增能力；升级只需 reinstall，无需重新信任 hook。

## 本版本是什么

1.14.3 是 **1.14.2 的元数据回滚版**：以 revert commit `ecc5aba` 撤销 1.14.2 对 8 个 `td-*` 命令文件补写 `user-invocable: false` 的 frontmatter 变更。skill / references / hooks / 四处 manifest 的 name / description / author 全部不变，仅 version bump。

**为什么发**：1.14.2 的意图是给命令文件补齐 AGENTS.md 提及的 `user-invocable` 字段，但 AGENTS.md「命令文件编辑」节的极薄模板字段集只有 `name` / `description` / `args` 三项——补写这一行反而让命令文件与模板产生字段集分叉。既然该字段既已存在又无运行时收益，且 1.14.2 tag 从未推送到远端（下游无消费记录），干净的做法是回滚这一行，让命令文件回到与 1.14.1 完全一致的状态。

## 改了什么

### 8 个 `td-*` 命令 frontmatter 删除 `user-invocable: false`

`commands/td-apply.md` / `td-archive.md` / `td-explore.md` / `td-init.md` / `td-list.md` / `td-propose.md` / `td-reverse-spec.md` / `td-system-audit.md` 8 个文件各删一行 `user-invocable: false`。8 个文件回到与 v1.14.1 tag 完全一致的状态。

保留字段：

- `disable-model-invocation: true` —— agent 不自动触发；
- `name` / `description` / `args` —— 与 AGENTS.md「命令文件编辑」节极薄模板字段集完全对齐。

## ⚠️ 行为变更

**无。**

| 项 | 1.14.1 | 1.14.2 | 1.14.3 |
|---|---|---|---|
| `commands/td-*.md` frontmatter | 无 `user-invocable` | 有 `user-invocable: false` | 无 `user-invocable` |
| 命令正文 / `args` 字段 / `description` | — | 未变更 | 未变更 |
| Skill 18 个 / Command 8 个 | — | 未变更 | 未变更 |
| Hooks / td-* 契约流 | — | 未变更 | 未变更 |
| 四处 manifest 的 name / description / author | — | 未变更 | 未变更 |

hook 命令串未变更（哈希不变），已 trust 的安装继续生效；不需要重新 trust。

## 升级步骤

1. **bump 版本**：四处清单的 `version` 已同步改为 `1.14.3`（根目录 `plugin.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / `package.json`，description 保持纯 ASCII 且四处完全一致）。
2. **运行时前置**：不变——Node.js ≥20.19.0；OpenSpec CLI ≥ 1.12。
3. **重新安装**（按平台）：
   - atomcode：`/plugin marketplace add <this-repo-url>` → `/plugin install total-design`
   - Claude Code：`claude plugin marketplace add <this-repo-url>` → `claude plugin install total-design`（或 `claude --plugin-dir <this-repo-path>`）
   - Pi Agent：`pi install git:<this-repo-url>`
4. **重新 trust**：**不需要**——本次 hook 命令串未变更（哈希不变），已 trust 的安装继续生效。全新安装按平台执行 `atomcode plugin trust total-design`。

## 发布范围说明

- 1.14.2 tag（`57e0b6b`）只在本地生成、**从未推送到远端**——下游无消费记录，`commands/td-*.md` 从未在远端以含 `user-invocable: false` 的形态存在。
- 1.14.3 是当前唯一应安装的版本；使用 1.14.1 的用户无需关注 1.14.2。

## 验证

- 四处清单版本号同为 1.14.3，description 四处逐字一致。
- 8 个 `commands/td-*.md` 的 frontmatter 均不含 `user-invocable`：`grep -l "^user-invocable:" commands/td-*.md` 应输出空。
- 8 个 `commands/td-*.md` 的 frontmatter 均含 `disable-model-invocation: true`：`grep -c "^disable-model-invocation: true" commands/td-*.md` 每个文件应输出 `1`。
- `commands/` 与 v1.14.1 完全一致：`git diff v1.14.1..HEAD -- commands/` 应为空。
- skill 数量（18）、命令数量（8）、hook 命令串、td-* 契约流行为均不变。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.14.3] 条目。
