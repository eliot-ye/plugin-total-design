---
name: critical-buffer
description: 关键链缓冲保护。服务系统工程主基调第 1 条"系统工程"和第 2 条"总体设计部"。
user-invocable: false
---

# 关键链缓冲保护

## 服务的主基调原则

**系统工程主基调第 1 条：系统工程。** 整体性能取决于瓶颈，不是平均值。

**系统工程主基调第 2 条：总体设计部。** 瓶颈识别必须站在系统全局立场，不能由分系统工程师各自判断。

来自 Goldratt 的约束理论（TOC）和关键链项目管理（CCPM）。前提是钱学森系统工程——没有总体设计部视角，瓶颈识别就会变成"各分系统都觉得自己是瓶颈"的扯皮。

## 规则

### 识别关键链

关键链是 tasks 序列里的**最长路径**——考虑资源约束后耗时最长的路径，不是任务最多的路径。

### 保护缓冲

关键链末端的 project buffer 和支流汇入点的 feeding buffer **不能被压缩**。

常见错误：
- "估计 2 小时，实际 1 小时就够了" → 压缩缓冲
- "可以并行做这几个任务" → 没识别资源冲突
- "打个 90% 的安全余量" → 余量被均匀分到每个任务，没有集中缓冲

### 隐性 buffer 压缩（WIP 超限时）

显性 buffer 压缩（用户直接要求"压缩估时"）由本 skill 的「保护缓冲」规则防御。但还有一种隐性 buffer 压缩：

**WIP 超限时的隐性 buffer 压缩**：当活跃 change 数超过 `wip-limit` 上限时，agent 的注意力是有限资源，N 个并行 change 分摊下来，每个 change 得到的关注度只有 1/N，相当于每个 change 的关键链 buffer 被"注意力分散"隐性压缩了。

这种隐性压缩不会在单个 change 的 `critical-buffer` 检测中被发现——每个 change 内部看起来关键链标注完整、buffer 比例合规。但跨 change 整合时，注意力分散导致的隐性 buffer 压缩会爆发为跨 change 全局失调。

**防御机制**：
- `wip-limit` 的硬阻塞 + override 机制是第一道防线（见 `wip-limit` 的「硬约束 + override 机制」节）。
- override 发生时，本 skill 应在 override 流程里被触发，评估"并行 N+1 个 change 对每个 change 关键链 buffer 的隐性压缩程度"。
- 评估输出到 override 确认记录里，作为后续 `/td-system-audit` project scope 的输入。

## 触发时机

- 用户在 `/td-propose` 或 `/td-apply` 时要求"加快进度"或"压缩估时"
- agent 自己生成 tasks.md 时
- 多个 change 在排队，用户想插队
- **被 `/td-system-audit` 触发修复时**：audit 发现"关键链缓冲被压缩"问题时，触发本 skill 重新规划 tasks。

## 触发时 agent 应做的事

1. 在 tasks.md 里显式标注关键链路径
2. 在关键链末端留 project buffer（比例按表 1 的 critical-buffer 行取值，按当前 tier；表 1 见 `field-assessment/references/strength-matrix.md`）
3. 拒绝把缓冲当"可压缩的余量"——它是系统吸收不确定性的容量
4. 当用户要求压缩时，先问："这是真瓶颈还是非瓶颈？非瓶颈压缩不影响整体性能。"

## 按 tier 调整

project buffer 比例按表 1 的 critical-buffer 行取值（按当前 tier）。

tier 越大，系统越复杂，不确定性越高，缓冲越厚。

### 层次观归位

当系统内部有明显的子系统边界时（`field-assessment` 识别流程允许子系统独立定 tier），本 skill 的关键链标注应**按子系统层次分别标注**——每个子系统有自己的关键链和 project buffer，子系统之间的依赖链是跨子系统的关键链。子系统独立定 tier 的执行规则见 `field-assessment` 的 `references/subsystem-tiering.md`。
