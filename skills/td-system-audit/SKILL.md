---
name: td-system-audit
description: 周期性对照系统工程主基调自检。触发场景：用户说"audit"、"自检"、"复盘"、"最近推进不顺"。
user-invocable: true
argument-hint: "<scope: current-change | project>  (optional, default current-change)"
---

# td-system-audit

钱学森"总体设计部"视角的工程化体现。周期性把 agent 当前的工作对照系统工程四条主基调过一遍，识别"局部优化制造全局失调"的风险。

## 依赖技能

- `system-engineering`
- `field-assessment`

## 服务的主基调原则

**系统工程主基调第 2 条：总体设计部。**

本命令本身就是总体设计部的工程化体现——周期性自检是总体设计部的核心职责。

**系统工程主基调第 1 条：系统工程。**

audit 的对照标准是主基调四条，不是"代码质量"或"进度"——这是系统工程视角的审计，不是项目管理视角的审计。

**《工程控制论》反馈控制回路归位**：步骤 7"修复后重跑 audit 闭环"是反馈控制回路的具体形态（完整回路见 `system-engineering` 的「反馈控制回路」节）。

## 输入 - audit 的范围。空则默认 `current-change`

- `current-change`：审计当前活跃的 change
- `project`：审计整个项目的工作方式

#### 内容

`$ARGUMENTS`

## 触发时机

system-audit 不是只在用户显式调用时才跑。agent 应在以下时机主动建议 audit：

- **频率触发**：对照表 3（system-audit 频率，按当前 tier 的 project scope / current-change scope 阈值；表 3 见 `field-assessment/references/audit-frequency.md`）。频率事实源在表 3，本 skill 不重写——`td-archive` 步骤 5.2 已维护"累计 archive 计数器"，达阈值即建议。
- **信号触发**：
  - 用户表达"感觉最近推进不顺利"时
  - 关键链缓冲被压缩 2 次以上

## 步骤

### 1. 激活主基调与配置层

按下述三步序列激活主基调与配置层——只注入强度，不做触发判断：

1. **`system-engineering`** — 主基调四条进入上下文。
2. **profile × tier 识别** — 调 `field-assessment`，判读 `$_TD_PROFILE` / `$_TD_TIER`，读入表 1 + 表 2 + 表 3。会话内缓存。读表 3 是为了 audit 报告里能引用"本次 audit 距上次 project scope audit 间隔 X 个 change"，频率达阈值的判定由 `td-archive` 步骤 5.2 负责（那里维护 `archive-counter.yaml` 并达阈值判定）。
3. **其余 constraint** — 只把强度值读入上下文，不在本步判断。

### 2. 收集审计对象

按 scope 收集：

- **current-change**：当前活跃 change 的 proposal/design/tasks/specs
- **project**：所有活跃 change + 最近 archive 的 3 个 change 的"实际 vs 预期"复盘，**并纳入 `openspec/specs/` 下的主 spec baseline**——这是 reverse-spec / archive sync 沉淀下来的分系统契约与不变量，作为 audit 对照"局部改动是否破坏既有分系统契约"的锚点，同时是主基调 3 清单"baseline 对齐检查"的检查对象（漂移信号与判定见 `references/audit-report-template.md`）。`openspec/specs/` 为空（项目从未 reverse-spec、也未 archive 过任何 change）→ 跳过 baseline 锚点，仅审计活跃 change 与最近 archive 复盘。
  - **不完整报告兜底**：读 `openspec/.td-state/audits/.incomplete.log`（SessionEnd hook 为"内容不完整、未进 audit-history"的报告写的清单，文件由 hook 按需创建）。存在且有内容 → 把这些报告列入审计报告的"发现的问题"，询问用户是补写完整报告还是删除——不完整报告不进 audit-history，属审计数据缺口。

**层次观归位**：当 `field-assessment` 识别流程允许子系统独立定 tier 时，project scope audit 应**按子系统层次分别审计**，audit 报告里区分"子系统内部失调"和"跨子系统边界失调"——后者按"最高 tier 子系统"的强度处理（保守原则）。执行规则见 `field-assessment` 的 `references/subsystem-tiering.md`。

### 3. 对照主基调四条审计

对审计对象，逐条审计。逐条检查清单见 `references/audit-report-template.md` 的「主基调对照清单」节——按四条主基调逐条打勾，违反项标注并触发对应 constraint 修复（`constraints` 的 references 变体文件，见步骤 6）。

### 4. 输出审计报告

报告同时输出到对话和落盘。落盘路径：`openspec/.td-state/audits/<YYYYMMDD-HHMMSS>-<scope>.md`。

报告按 `references/audit-report-template.md` 的「报告模板」节输出（Scope + 主基调对照表 + 发现的问题 + 建议的下一步动作）。

落盘后，同步更新 `openspec/.td-state/audit-history.yaml`：追加一条本次 audit 的记录。文件格式见 `references/audit-history-template.md`。

**null 语义**：`audit-history.yaml` 不存在 → 本步骤创建文件并写入首条记录；`audits/` 目录不存在 → 同步创建。

### 5. 问题落池（可选）

审计报告输出后，对报告里"建议的下一步动作"（尤其是非严重问题、暂不立即修复的后续事项），询问用户："要不要把这些记进 `openspec/todo.md` 待办池？"——落池 = 记为 backlog 候选，等 `/td-propose` 时从池里挑，不占 WIP。

- 用户同意 → 触发 `todo-pool` 的「落池条目」子流程。
- 用户拒绝 → 跳过，不强制。

### 6. 触发修复

对每个严重问题，按下表触发修复（constraint 类问题走 `constraints` 的 references 变体文件）：

| 严重问题类型 | 触发的 constraint（`constraints` 的 references 变体） |
|---|---|
| 关键链缓冲被压缩 | `constraints` 的 `references/critical-buffer.md`（重新规划 tasks） |
| agent 自己拍板了 | `constraints` 的 `references/human-in-loop.md`（回去问用户） |
| 可逆决策被过早闭合 | `constraints` 的 `references/delay-decision.md`（重新打开决策） |
| 同时开太多 change（WIP 超限） | `constraints` 的 `references/wip-limit.md` 的「硬约束 + override 机制」（阻塞下一个 `/td-propose` 或 `/td-apply`，直到用户 archive 一个或显式 override） |
| 局部最优但全局失调 | `constraints` 的 `references/human-in-loop.md`（让总体设计部判断）。本工作流没有专门的"全局失调"constraint——这个判断必须由总体设计部做，不能由 agent 自己拍板（主基调第 2 条） |
| baseline spec 与代码漂移（主基调 3 对齐检查确认） | `td-reverse-spec`（对漂移分系统定向刷新，覆盖更新其 `openspec/specs/<subsystem>/spec.md`；该分系统有未归档 change 触及时先完成 archive 再刷新，避免与 archive sync 双写冲突） |

### 7. 修复后重跑 audit 闭环

严重问题修复完成后，**重跑同一 scope 的 audit**，确认：

- 之前的严重问题已消除
- 修复动作没引入新的"局部优化制造全局失调"

重跑最多 3 次。3 次后仍有严重问题 → 触发 `constraints` 的 `references/human-in-loop.md`，让用户介入决定如何处理（继续修复、调整 scope、或接受残留风险）。

不重跑 = 闭环没合，问题可能换形式回来。

## Guardrails

- audit 的定位是"总体设计部的周期性自检"，不是找错问责——语气要建设性
- audit 报告必须包含"建议的下一步动作"，不只是"你这里错了"
- 频率触发的 audit 不要超出表 3 频率（表 3 见 `field-assessment/references/audit-frequency.md`，tier-medium 的 current-change 按关键链任务粒度触发是合法频率）；「触发时机」的信号触发与步骤 7 的修复闭环重跑不受此限——过频会变成形式主义
