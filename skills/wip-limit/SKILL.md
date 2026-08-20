---
name: wip-limit
description: 限制同时活跃的 change 数量。服务系统工程主基调第 4 条"开放的复杂巨系统不能并行硬解"。
user-invocable: false
---

# WIP 限制

## 服务的主基调原则

**系统工程主基调第 4 条：开放的复杂巨系统。** 复杂巨系统不能并行硬解。同时开太多 change，彼此的相互作用无法被 agent 同时持有——每个 change 都半途而废，整体性能下降。

"不能并行硬解"是硬约束，不是建议——违反即系统失调。但钱学森系统工程也尊重"触发式而非强制"哲学：硬约束默认阻塞，用户显式 override 时松绑，override 时触发额外强制提醒。

## 规则

同时活跃的 change 数量上限按当前 tier 查表 1 的 wip-limit 行取值（表 1 见 `field-assessment/references/strength-matrix.md`）。本 skill 不重复定义数字。

"活跃"定义：已经 `/td-propose` 但还没 `/td-archive` 的 change。

### 硬约束 + override 机制

WIP 上限是硬约束，违反必须有控制流后果。执行规则：

1. **检测**：`/td-propose` 或 `/td-apply` 在前置检查时，读当前活跃 change 数与 wip-limit 上限对比。
2. **未达上限**：继续执行。
3. **已达上限（默认硬阻塞）**：
   - 阻塞当前 `/td-propose` 或 `/td-apply`，不执行后续步骤。
   - 告诉用户："tier-XXX 下 WIP 上限是 N，当前活跃 N 个。并行硬解复杂巨系统会制造全局失调（主基调第 4 条）。"
   - 给出两个选项：(a) 先 `/td-archive` 一个再 propose/apply；(b) 显式 override。
   - 等待用户决策。
4. **override 流程（用户选 override 时）**：
   - 触发 `brooks-law` 强制提醒（加人手前的协调成本反思）。
   - 触发 `critical-buffer` 评估（并行 change 对关键链 buffer 的影响，见 `critical-buffer` 的「隐性 buffer 压缩」节）。
   - 触发 `human-in-loop` 第 6 类（WIP 硬约束 override）——本 skill 是第 6 类的唯一触发源，由 `human-in-loop` 负责执行"显式确认风险"的回路。
   - 用户确认后，在 change 的 `proposal.md` 里记录"override WIP 上限，用户已确认风险"——作为后续 `/td-system-audit` 的输入。
   - 才继续执行后续步骤。

### 不做的事

- 不"提示一下就放行"——这是把硬约束降级为软约束，违反主基调第 4 条"不能并行硬解"的硬约束语义。
- 不"一刀切禁止"——硬约束 + override 机制保留触发式哲学，用户显式 override 时松绑。

## 触发时机

- 用户想 `/td-propose` 一个新 change，但活跃 change 数已达上限
- 用户想同时推进多个 change
- **override 后的二次检测**：用户对某次 WIP 超限显式 override 后，下一次 `/td-propose` 或 `/td-apply` 再次检测到 WIP 超限时，本 skill 应在 override 流程里额外提示"上次已 override 一次，连续 override 会让 WIP 硬约束彻底失效"——防止 override 滥用。
- **被 `/td-system-audit` 触发修复时**：audit 发现"同时开太多 change（WIP 超限）"问题时，触发本 skill 的「硬约束 + override 机制」节，阻塞下一个 `/td-propose` 或 `/td-apply`，直到用户 archive 一个或显式 override。

## 触发时 agent 应做的事

按 `## 规则` 节的「硬约束 + override 机制」执行。具体动作：

1. 报告当前活跃 change 列表 + WIP 上限 + 当前 tier
2. 阻塞当前 `/td-propose` 或 `/td-apply`，不执行后续步骤
3. 给出两个选项：(a) 先 `/td-archive` 一个再 propose/apply；(b) 显式 override
4. 等待用户决策
5. 用户选 override → 进入 override 流程（触发 brooks-law + critical-buffer 评估 + 要求显式确认）
6. override 确认完成 → 继续执行后续步骤

## 不做的事

- 不自动 archive 用户的 change
- 不隐藏规则让用户"自由发挥"——自由发挥在复杂系统里就是失控
- 不"提示一下就放行"——硬约束必须阻塞或要求 override，"提示放行"等于把硬约束降级为软约束
- 不让 override 滥用——连续 override 时升级提醒强度（见 `## 触发时机` 节的"override 后的二次检测"）
