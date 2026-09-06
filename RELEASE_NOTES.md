# total-design v1.9.0 发布说明

> 面向使用态用户：升级前请先读「⚠️ 行为变更」与「升级步骤」。

## 本版本是什么

1.9.0 是 **review 完整性加固版**：补上 apply 流程收尾处的 code review 缺口——1.8.0 及之前，一个 change 里如果全是非关键链任务且执行顺利，这些任务可能一次 code review 都轮不到；全部 `[x]` 后的完成判定只有验证（全量测试 + 跨分系统边界），没有 review。

**核心变更**：`td-apply` 完成判定链由两层变三层——6.1 change-level 验证 + 6.2 系统级验证 + **6.3 change 级收尾 code review（新增，硬步骤）**，三层全过才算 done。收尾 review 先全绿拿验证证据，再对 change 整体做 review；工具优先、LLM 兜底。

## 本次变更

### td-apply 步骤 6.3：change 级收尾 code review（硬步骤）

- **触发时机**：两层验证（6.1 + 6.2）全部通过后、change 判 done 前。
- **review 对象**：本 change 的全部新增 / 修改代码（不是单个任务 diff）。
- **执行方式（工具优先，LLM 兜底）**：当前 agent 环境自带 code review 工具 → 优先调用；工具失败（不可用 / 报错 / 超时）或无工具 → LLM 人工 review（维度 / 分级 / 报告格式沿用 `requesting-code-review` 既有节）。
- **tier 分层**：`tier-small` 保底抽查（只查 Spec compliance + 安全红线——小 change 可能全程轮不到 checkpoint review，收尾是它唯一的 review 机会，不整体跳过）；`tier-medium` / `tier-large` 按 tasks.md 全部任务`风险`字段最高档取。
- **critical 阻塞**：review 判出 critical → change 不算 done，修复后重跑 6.1 change-level 验证（修复使既有验证证据失效），重跑通过且无 critical 才继续。
- **audit 顺移**：原 6.3 current-change audit 顺移为 6.4——audit 在 review 之后跑（review 干净了再做"实际 vs 预期"对照才有意义）；表 3（`field-assessment/references/audit-frequency.md`）与 `executing-plans` 的锚点同步 6.3 → 6.4。

### requesting-code-review 第 6 节：change 级收尾 review

- **与 checkpoint review 的分工**：checkpoint review（第 1–4 节）是任务粒度的增量检查；收尾 review 是 change 级的整体检查——跨任务接口衔接、模块拼装后的整体 Spec compliance。每个任务各自绿，拼起来仍可能失调（接口对不上、风格两套、边界互相踩）。
- **深度档位**：tier-medium / tier-large 按全部任务`风险`字段最高档；tier-small 按 `td-apply` 步骤 6.3 的保底抽查执行。
- **触发语义**：description 与「触发时机」节补 change 收尾场景（两层验证全绿后、判 done 前）。

## ⚠️ 行为变更

| 变更 | 1.8.0 旧行为 | 1.9.0 新行为 |
|---|---|---|
| apply 完成判定链 | 两层：6.1 change-level 验证 + 6.2 系统级验证，通过即 done | **三层**：+ 6.3 收尾 code review 无 critical 才算 done，之后才进 6.4 audit 与 archive |
| 小 change 的 review 覆盖 | 非关键链任务可能全程零 review | **tier-small 也有收尾保底抽查**（Spec compliance + 安全红线） |
| current-change audit 时点（tier-large） | 两层验证通过后即触发（原 6.3） | **收尾 review 通过后触发**（顺移为 6.4） |

**不改变的**：18 个 skill 的数量与目录结构、8 个命令文件、td-* artifact 流（propose → apply → archive）、表 1/2/3 强度数值（`field-assessment` 单一事实源，本次未动表 3 频率数字）、WIP 硬约束 + override 机制、5 个子约束执行规则、`requesting-code-review` 第 1–5 节（checkpoint review 与架构 review 语义不变，第 6 节为追加）、hook 脚本与触发时机、`.td-state/` 持久化约定——均不变。

## 升级步骤

1. **bump 版本**：四处清单的 `version` 已同步改为 `1.9.0`（根目录 `plugin.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / `package.json`，description 保持纯 ASCII 且四处完全一致）。
2. **运行时前置**：不变——Node.js ≥20.19.0（OpenSpec CLI 与 SessionEnd hook 共用）；OpenSpec CLI：`npm install -g @fission-ai/openspec@latest`。
3. **重新安装**（按平台）：
   - atomcode：`/plugin marketplace add <this-repo-url>` → `/plugin install total-design`
   - Claude Code：`claude plugin marketplace add <this-repo-url>` → `claude plugin install total-design`（或 `claude --plugin-dir <this-repo-path>`）
   - Pi Agent：`pi install git:<this-repo-url>`
4. **重新 trust**：本次 hook 命令串未变更（哈希不变），已 trust 的安装无需重新 trust；全新安装按平台执行 `atomcode plugin trust total-design`。
5. **验证**：
   - 四处清单版本号同为 1.9.0，description 四处逐字一致。
   - 收尾 review 步骤存在：`grep -n "6.3 change 级收尾 code review" skills/td-apply/SKILL.md` 有输出；audit 已顺移：`grep -n "6.4 current-change audit" skills/td-apply/SKILL.md` 有输出。
   - 执行语义节存在：`grep -n "### 6. change 级收尾 review" skills/requesting-code-review/SKILL.md` 有输出。
   - 锚点同步：`grep -rn "6.3" skills/field-assessment/references/audit-frequency.md` 无输出（表 3 已指向 6.4）；`grep -n "6.4" skills/executing-plans/SKILL.md` 有输出。
   - 逻辑名/命令名/路径/CLI 命令/环境变量不变：`requesting-code-review` / `/td-apply` / `openspec list` / `$_TD_TIER` 等。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.9.0] 条目。
