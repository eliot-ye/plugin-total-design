# total-design v1.13.0 发布说明

> 面向使用态用户：升级前请先读「⚠️ 行为变更」与「升级步骤」。

## 本版本是什么

1.13.0 是 **功能 + 文档版**：1 项新能力（td-explore frontier 轮次推进与事实/决策分工机制）+ 1 项开发态文档判据（AGENTS.md 审核标准维度 2 新增「结构性断言与仓库现状一致」）。td-* 契约流（propose → apply → archive）结构不变，表 1/2/3 强度数值不动，skill / command 数量不变（18 skill + 8 command）。

## 本次新增

### td-explore frontier 轮次推进与事实/决策分工

`skills/td-explore/SKILL.md` 步骤 4「头脑风暴」三处修改：

- **frontier 轮次推进**：需用户拍板的决策点不止一个时，每轮只抛**当前可达**的决策点全集——前提已确定、不需要猜测用户还没给出的答案的问题；答案依赖另一个本轮未决决策点的问题顺延到下一轮，用户回答后重算可达集。消除了逐个追问（轮次爆炸）与一次全抛（悬空问题）两类失败模式。
- **事实/决策分工**：事实类问题（仓库、spec、配置文件可查的）是 agent 自己的工作，先查仓库再带入对话；只有决策进 frontier 交给用户。自查进行中不阻塞——只有依赖其结论的决策点延后，frontier 其余问题照常抛出。
- **条目标号对齐**：每轮问题编号沿用 `human-in-loop` 的「需用户回复的条目标号规则」（章节前缀编号），保证用户回复可对应条目。

**降级出口**：需求基本清楚（仅 1-2 个决策点）时只有一轮，不套轮次仪式；与既有"不凑伪选项"红线一致，决策已闭合时正确输出仍是"没有需要你的决策点，直接继续推进"。

**契约零影响**：explore 产物形态（对话式候选方向评估）不变，`td-propose` 的 greenfield explore 检查（步骤 3）与产物合并（步骤 4 前置）逻辑不受影响。

### AGENTS.md 审核标准维度 2 新增判据（开发态）

「结构性断言与仓库现状一致」：正文/references 中的无条件结构断言（"N 个 skill""X 负责 Y""有 Z 层"）逐一对照仓库现状核对，过时的断言（实例：`audit-frequency.md` 的"3 个 tier skill"在 1.6.0 收拢后失实）= 冲突。grep 锚点验证只覆盖显式引用（"见 X 的「Y」节"），抓不住无锚点的结构断言——它们对使用态 LLM 无报错信号，腐烂只在下游行为出错时暴露，故需单独判据。仅影响开发态审核流程，运行时资产零改动。

## ⚠️ 行为变更

| 变更点 | 1.12.1 表现 | 1.13.0 行为 |
|---|---|---|
| td-explore 多决策点追问 | 逐个问或一次全抛（可能含悬空问题） | 每轮只抛前提已确定的可达决策点全集，附推荐默认值；依赖未决问题顺延下一轮 |
| td-explore 事实类问题 | 问之前先查仓库（顺序约束） | 显式分工：事实 agent 自查，仅决策交用户；自查进行中不阻塞其余问题 |
| td-explore 轮内编号 | 未显式约定 | 沿用 human-in-loop 章节前缀编号（如 `a1 / b1`） |

**不改变的**：td-* artifact 流（propose → apply → archive）、explore 产物形态与 Guardrails、"不凑伪选项"红线、表 1/2/3 强度数值、WIP 硬约束 + override 机制本体、hook 触发时机（SessionEnd 事件不变）、`.td-state/` 持久化约定、四处 manifest 的 name / description / author、skill / command 数量（18 skill + 8 command）。

## 升级步骤

1. **bump 版本**：四处清单的 `version` 已同步改为 `1.13.0`（根目录 `plugin.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / `package.json`，description 保持纯 ASCII 且四处完全一致）。
2. **运行时前置**：不变——Node.js ≥20.19.0（OpenSpec CLI 与 SessionEnd hook 共用）；OpenSpec CLI：`npm install -g @fission-ai/openspec@latest`。
3. **重新安装**（按平台）：
   - atomcode：`/plugin marketplace add <this-repo-url>` → `/plugin install total-design`
   - Claude Code：`claude plugin marketplace add <this-repo-url>` → `claude plugin install total-design`（或 `claude --plugin-dir <this-repo-path>`）
   - Pi Agent：`pi install git:<this-repo-url>`
4. **重新 trust**：本次 hook 命令串未变更（哈希不变），已 trust 的安装无需重新 trust；全新安装按平台执行 `atomcode plugin trust total-design`。
5. **验证**：
   - 四处清单版本号同为 1.13.0，description 四处逐字一致。
   - frontier 轮次机制存在：`grep -n "frontier 轮次推进" skills/td-explore/SKILL.md` 有输出。
   - 事实/决策分工存在：`grep -n "事实类问题（.*是 agent 自己的工作" skills/td-explore/SKILL.md` 有输出。
   - 条目标号衔接存在：`grep -n "每轮问题编号按" skills/td-explore/SKILL.md` 有输出。
   - skill 数量：`ls -d skills/*/ | wc -l` 输出 `18`。
   - 逻辑名/命令名/路径/CLI 命令/环境变量不变：`field-assessment` / `/td-propose` / `openspec list` / `$_TD_TIER` 等。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.13.0] 条目。
