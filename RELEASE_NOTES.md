# total-design v1.11.0 发布说明

> 面向使用态用户：升级前请先读「⚠️ 行为变更」与「升级步骤」。

## 本版本是什么

1.11.0 是 **加固版**：四处能力补强 + 两处行为修复——specs↔tests 可追溯性闭环、review 隔离与机器可读 Verdict、artifact 术语纪律、caller 实测信号修复。无新增 / 删除 skill 或命令，结构不变（17 个 skill + 8 个 command），表 1/2/3 强度数值不动。

## 本次新增

### scenario→test 覆盖账本（specs↔tests 可追溯性闭环）

`applyRequires` 含 `specs` artifact 的 change，proposal 定型后须产出覆盖账本——把 specs/ 里每个 `#### Scenario:` 映射到一个具名测试。此前 td 三个粒度（任务 `验证` 字段 / change-level / 系统级）之间没有 scenario 粒度的可追溯性：一个 scenario 可以写得很具体、实施任务全绿，却从未被任何测试断言过，archive 复盘也发现不了这个空洞。

- **模板**：`td-propose/references/scenario-test-map-template.md`（新建）。
- **propose 侧**（`td-propose` 步骤 6.c 必填项）：unmapped scenario → 回 6.b 补测试意图，或显式标 `N/A` 并附等价机械校验项；tier-small 仅当 `applyRequires` 含 specs 且含可执行测试面时强制。
- **apply 侧**：步骤 2 补 apply-ready 前置检查（缺账本不算 apply-ready）；步骤 6.1 补账本审计——非 `N/A` 行全 🟢 且 `N/A` 行等价机械校验通过，缺 → blocking defect。
- **archive 侧**：步骤 3 复盘新增账本状态字段（全绿 / 有哪些 `N/A` 条目及理由）。

### Review 上下文隔离（requesting-code-review）

review 作者与被审对象同源时（同一 agent 写的代码 / proposal），不得在 authoring context 内内联自评。隔离载体按优先级：环境自带 code review 工具 > subagent（fresh-context）> 同上下文自评（降级）。降级是唯一硬约束所在：Verdict 锚点行须标注 `reviewed-by: unisolated-self`，不得无标注降级、不得跳过检查维度、不得编造 Verdict。tier 只影响标注强调程度（tier-large 须显著标注置信度低于有隔离版本），不决定能否降级——无 subagent 能力的平台不阻塞、不询问。review 过程只读，critical 的修复是作者动作。

### Verdict 机器可读锚点行（requesting-code-review）

review 报告 Verdict 节首行改为三态锚点（`APPROVED` / `APPROVED_WITH_CHANGES` / `MUST_FIX_CRITICAL`），第二行 `reviewed-by` 标注隔离状态；下游 `td-apply` 步骤 6.3 优先读锚点行，缺锚点行按 `MUST_FIX_CRITICAL` 保守处理，不静默放行。Verdict 前置验证：给出"可以继续"之前先触发 `verification-before-completion` 拿验证证据——Verdict 是完成声明，没有证据不成立。

### artifact 术语纪律（td-propose 步骤 6.b）

artifact 写作时沿用用户原词与既有 baseline spec 的既有术语，同一概念只用一个词——不另造同义词、不在中英之间随意切换，用户原词优先。降低术语漂移对 TDD 期望推导（从 spec 场景推导期望）与后续 change 检索的损害。

## ⚠️ 行为变更

| 变更点 | 1.10.1 表现 | 1.11.0 行为 |
|---|---|---|
| specs change 的 scenario 覆盖 | scenario 无测试映射要求，可能从未被任何测试断言 | `applyRequires` 含 specs → 必须有覆盖账本；apply 步骤 6.1 审计全绿才过 |
| review 隔离 | 收尾 review 兜底路径为同上下文自评，无标注要求 | subagent 可用必须隔离；降级须标 `reviewed-by: unisolated-self` |
| review Verdict | 自由文本，下游靠语义解析 | 三态锚点行 + `reviewed-by`；缺锚点行 = 保守按 `MUST_FIX_CRITICAL` |
| artifact 术语 | 无约束，同概念可多词并存 | 沿用用户原词 + baseline spec 术语，同一概念只用一个词 |
| tier-medium caller 实测触发 | 仅变更点属 ①③ 高危类时触发 | 命中四类变更点任一类即触发（见"本次修复"） |
| 架构 review「接口偏大」 | 语义模糊，凭语感判定 | 可判定判据（调用方需读懂内部实现才能用 → 信号），分级仍为 warning |

**不改变的**：skill 数与结构（17 skill + 8 command）、td-* artifact 流（propose → apply → archive）、表 1/2/3 强度数值（`field-assessment` 单一事实源）、WIP 硬约束 + override 机制、5 个子约束执行规则、hook 脚本与触发时机、`.td-state/` 持久化约定、四处 manifest 的 name / description / author——均不变。

## 本次修复

- **tier-medium caller 实测信号清单收窄**（`td-apply` 步骤 4）：原信号清单只含"变更点属 ①③ 高危类"，纯 ②（Protocol 方法变更）或 ④（返回值语义变更）的跨分系统 change 在 tier-medium 下可完全绕过 apply 侧实测——与 `change-point-classes.md`"命中触发条件即进入三层防护"的权威承诺矛盾。扩为"命中四类变更点任一类"，堵住行为空洞。
- **架构 review「接口偏大」判据可判定化**（`architecture-review-checklist.md`）：低耦合维度补可判定信号——调用方无需理解模块内部结构即可正确调用；需先读懂内部实现才能用 → 接口偏大信号。

## 升级步骤

1. **bump 版本**：四处清单的 `version` 已同步改为 `1.11.0`（根目录 `plugin.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / `package.json`，description 保持纯 ASCII 且四处完全一致）。
2. **运行时前置**：不变——Node.js ≥20.19.0（OpenSpec CLI 与 SessionEnd hook 共用）；OpenSpec CLI：`npm install -g @fission-ai/openspec@latest`。
3. **重新安装**（按平台）：
   - atomcode：`/plugin marketplace add <this-repo-url>` → `/plugin install total-design`
   - Claude Code：`claude plugin marketplace add <this-repo-url>` → `claude plugin install total-design`（或 `claude --plugin-dir <this-repo-path>`）
   - Pi Agent：`pi install git:<this-repo-url>`
4. **重新 trust**：本次 hook 命令串未变更（哈希不变），已 trust 的安装无需重新 trust；全新安装按平台执行 `atomcode plugin trust total-design`。
5. **验证**：
   - 四处清单版本号同为 1.11.0，description 四处逐字一致。
   - 覆盖账本模板存在：`ls skills/td-propose/references/scenario-test-map-template.md` 有输出。
   - 6.c 必填项存在：`grep -n "覆盖账本" skills/td-propose/SKILL.md` 有输出。
   - apply 侧审计存在：`grep -n "覆盖账本" skills/td-apply/SKILL.md` 有输出。
   - 隔离节存在：`grep -n "Review 上下文隔离" skills/requesting-code-review/SKILL.md` 有输出。
   - Verdict 锚点存在：`grep -n "MUST_FIX_CRITICAL" skills/requesting-code-review/SKILL.md` 有输出。
   - 术语纪律存在：`grep -n "术语纪律" skills/td-propose/SKILL.md` 有输出。
   - 接口判据存在：`grep -n "接口偏大信号" skills/requesting-code-review/references/architecture-review-checklist.md` 有输出。
   - skill 数与结构不变：`ls -d skills/*/ | wc -l` 输出 `17`。
   - 逻辑名/命令名/路径/CLI 命令/环境变量不变：`field-assessment` / `/td-propose` / `openspec list` / `$_TD_TIER` 等。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.11.0] 条目。
