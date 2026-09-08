# WIP 限制

> 本文件与同目录的 `brooks-law.md` / `critical-buffer.md` / `delay-decision.md` / `human-in-loop.md` 是平级兄弟文件，正文中出现的裸逻辑名均指同目录对应变体文件。

## 服务的主基调原则

**系统工程主基调第 4 条：开放的复杂巨系统。** 复杂巨系统不能并行硬解。同时开太多 change，彼此的相互作用无法被 agent 同时持有——每个 change 都半途而废，整体性能下降。

"不能并行硬解"是硬约束，不是建议——违反即系统失调。但钱学森系统工程也尊重"触发式而非强制"哲学：硬约束默认阻塞，用户显式 override 时松绑，override 时触发额外强制提醒。

## 规则

同时活跃的 change 数量上限按当前 tier 查表 1 的 wip-limit 行取值（表 1 见 `field-assessment/references/strength-matrix.md`）。

"活跃"定义：已经 `/td-propose` 但还没 `/td-archive` 的 change。

### 硬约束 + override 机制

WIP 上限是硬约束，违反必须有控制流后果。执行规则：

1. **检测**：`/td-propose` 或 `/td-apply` 在前置检查时，读当前活跃 change 数与 wip-limit 上限对比。计数用 `openspec list`（只列活跃 change，`archive/` 目录下的不计入——与上文的"活跃"定义一致）。
2. **未达上限**：继续执行。
3. **已达上限（默认硬阻塞）**：
   - 阻塞当前 `/td-propose` 或 `/td-apply`，不执行后续步骤。
   - 告诉用户："tier-XXX 下 WIP 上限是 N，当前活跃 N 个。并行硬解复杂巨系统会制造全局失调（主基调第 4 条）。"
   - 给出两个选项：(a) 先 `/td-archive` 一个再 propose/apply；(b) 显式 override。
   - 等待用户决策。
4. **override 流程（用户选 override 时）**——本文件是 override 回路的单一编排点，子步序列如下：

   a. 触发 `brooks-law` 强制提醒（加人手前的协调成本反思）。
   b. 触发 `critical-buffer` 评估（并行 change 对关键链 buffer 的影响，见同目录 `critical-buffer.md` 的「隐性 buffer 压缩」节）。
   c. 调 `human-in-loop` 第 6 类执行"显式确认风险"回路（`human-in-loop` 在本回路里只做"描述风险 + 列选项 + 等用户确认"，序列由本节编排）。
   d. 用户确认后，在 change 的 `proposal.md` 里记录"override WIP 上限，用户已确认风险"——作为后续 `/td-system-audit` 的输入。同一步骤 a 中 `brooks-law` 的加人手确认由 `brooks-law` 自行落点（`design.md` 作为"已知风险"，非 override 场景的加人手确认）；override 场景的 WIP 确认由本文件落点（`proposal.md`）——两处落点不冲突。
   e. 才继续执行后续步骤。

### 常见合理化

| 合理化（agent 对自己说的话） | 现实 |
|---|---|
| "就超一个，用户赶进度" | 一次 override 就让硬约束变软——约束力在于每次超限都有控制流后果，豁免一次 = 建立先例（「触发时机」节的二次 override 提醒正是为连续 override 准备的） |
| "这些 change 互不相关，不会互相干扰" | "相互作用无法同时持有"不依赖主观相关性——上下文切换成本、buffer 消耗、冲突窗口都是客观存在（主基调第 4 条） |
| "先 override 完成这个，回头立刻 archive" | "立刻"没有控制流保证——override 记录进 `proposal.md`，就是给 `/td-system-audit` 留下回检证据（override 流程 d 步） |
| "合并几个 change 一起过，效率更高" | 并行装配 = 多条关键链抢同一个 project buffer，协调成本随并行数超线性增长（同目录 `brooks-law.md`） |

## 触发时机

- 用户想 `/td-propose` 一个新 change，但活跃 change 数已达上限
- 用户想同时推进多个 change
- **override 后的二次检测**：用户对某次 WIP 超限显式 override 后，下一次 `/td-propose` 或 `/td-apply` 再次检测到 WIP 超限时，本文件应在 override 流程里额外提示"上次已 override 一次，连续 override 会让 WIP 硬约束彻底失效"——防止 override 滥用。
- **被 `/td-system-audit` 触发修复时**：audit 发现"同时开太多 change（WIP 超限）"问题时，触发本文件的「硬约束 + override 机制」节（触发方：`td-system-audit` 步骤 6），阻塞下一个 `/td-propose` 或 `/td-apply`，直到用户 archive 一个或显式 override。

## 触发时 agent 应做的事

执行 `## 规则` 节的「硬约束 + override 机制」（权威流程在该节）。

## 不做的事

- 不自动 archive 用户的 change
