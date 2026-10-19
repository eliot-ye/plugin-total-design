# total-design v1.14.5 发布说明

> 面向使用态用户：本次为**修复版**，修正 `requesting-code-review` 架构 review 的隔离载体判据——避免使用态 LLM 在架构 review 场景误试 code review 工具（工具跑不出本 skill 定义的检查语义）；skill 数量、references、hooks、契约流、manifest 元数据全部不变。

## 本版本是什么

1.14.5 是 **`requesting-code-review` 架构 review 隔离载体判据修正版**：1.14.4 及更早版本里，第 2 节「Review 上下文隔离」的三档优先级第一档是「环境自带的 code review 工具」，未界定适用范围；第 5 节架构 review 静默继承通用优先级。使用态 LLM 在架构 review 场景（`td-propose` 步骤 7 触发）会先试第一档工具，但架构 review 的检查清单是 `references/architecture-review-checklist.md` 定义的高内聚 / 低耦合 / 循环依赖 / 隐式依赖——完全在 code review 工具 reviewer 内置的维度（代码 correctness / security / reliability）之外，工具跑不出本 skill 定义的检查语义。

1.14.5 把跳过第一档的判据锚到"本 skill 定义的 review 维度是否落在工具 reviewer 内置覆盖范围内"，并在第 5 节架构 review 新增「隔离载体」锚定句：优先级从 subagent 起。第 6 节 change 级收尾 review 不受影响——review 对象是 working tree 里的真实代码 diff，维度语义与工具匹配，「工具优先」保留。

skill 数量（18）、命令数量（8）、references、hooks、td-* 契约流（propose → apply → archive）、`commands/td-*.md` 目录、`extensions/pi-agent/index.ts`、atomcode / Claude Code / Pi Agent 加载路径、四处 manifest 的 name / description / author 全部不变，仅 SKILL.md 内部两处文本 + version bump。

## 改了什么

### 修改 `skills/requesting-code-review/SKILL.md`

两处编辑（+3 -1）：

1. **第 2 节「Review 上下文隔离」第一档加适配范围限定**：
   - 判据从"（无界定）"→ "本 skill 定义的 review 维度就是工具 reviewer 内置覆盖的维度时适用"
   - 明确架构 review 场景（本 skill 第 5 节）的检查清单超出工具 reviewer 覆盖范围，跳过此档从第 2 档 subagent 起

2. **第 5 节「架构 review」新增「隔离载体」锚定句**：
   - 优先级从 subagent 起，跳过第 2 节第一档
   - 判据锚到"架构检查清单超出工具 reviewer 覆盖范围"，不列举具体工具维度值——避免工具维度演进导致 SKILL.md 里的断言失真

第 6 节 change 级收尾 review 的「工具优先，LLM 兜底」执行方式未改动。

## ⚠️ 行为变更

| 项 | 1.14.4 | 1.14.5 |
|---|---|---|
| 架构 review（`td-propose` 步骤 7 触发）的隔离载体 | 静默继承第 2 节三档优先级，使用态 LLM 会先试 code review 工具 | 显式从 subagent 起，跳过 code review 工具第一档 |
| code review（checkpoint / change 级收尾）的隔离载体 | 三档优先级（工具 > subagent > 同上下文） | 不变 |
| 第 2 节第一档适用判据 | 未界定 | 「本 skill 定义的 review 维度是否落在工具 reviewer 内置覆盖范围内」 |
| 第 3 节 Verdict 锚点 / `reviewed-by:` 标注语义 | — | 未变更 |
| 第 4 节 critical 阻塞 / 第 5 节阻塞 apply / 第 6 节收尾 review 语义 | — | 未变更 |
| Skill 18 个 / Command 8 个 | — | 未变更 |
| Hooks / td-* 契约流 | — | 未变更 |
| `commands/td-*.md` / `extensions/pi-agent/index.ts` | — | 未变更 |
| 四处 manifest 的 name / description / author | — | 未变更 |
| hook 命令串 | — | 未变更（哈希不变） |

hook 命令串未变更，已 trust 的安装继续生效；不需要重新 trust。

## 升级步骤

1. **bump 版本**：四处清单的 `version` 已同步改为 `1.14.5`（根目录 `plugin.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / `package.json`，description 保持纯 ASCII 且四处完全一致）。
2. **运行时前置**：不变——Node.js ≥20.19.0；OpenSpec CLI ≥ 1.12。
3. **重新安装**（按平台）：
   - atomcode：`/plugin marketplace add <this-repo-url>` → `/plugin install total-design`
   - Claude Code：`claude plugin marketplace add <this-repo-url>` → `claude plugin install total-design`（或 `claude --plugin-dir <this-repo-path>`）
   - Pi Agent：`pi install git:<this-repo-url>`
4. **重新 trust**：**不需要**——本次 hook 命令串未变更（哈希不变），已 trust 的安装继续生效。全新安装按平台执行 `atomcode plugin trust total-design`。

## 验证

- 四处清单版本号同为 1.14.5，description 四处逐字一致：`grep -h '"version"' plugin.json .claude-plugin/plugin.json .claude-plugin/marketplace.json package.json | sort -u` 应只输出 `"version": "1.14.5"` 一种形态。
- `skills/requesting-code-review/SKILL.md` 第 2 节第一档带明确适用判据：`grep -n "本 skill 定义的 review 维度" skills/requesting-code-review/SKILL.md` 应命中第 2 节第一档行。
- `skills/requesting-code-review/SKILL.md` 第 5 节新增「隔离载体」锚定句：`grep -n "跳过第 2 节第一档" skills/requesting-code-review/SKILL.md` 应命中两处（第 2 节第一档末句 + 第 5 节隔离载体锚定句）。
- 第 6 节「工具优先，LLM 兜底」未改动：`grep -n "工具优先" skills/requesting-code-review/SKILL.md` 应仍命中第 6 节。
- skill 数量（18）、命令文件数量（8）、hook 命令串、td-* 契约流行为均不变。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.14.5] 条目。
