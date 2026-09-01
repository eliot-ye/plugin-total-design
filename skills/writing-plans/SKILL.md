---
name: writing-plans
description: 把工作拆成 bite-sized 任务，每个任务标注对分系统的影响。
user-invocable: false
---

# Writing Plans

## 依赖技能

- `constraints` 的 `references/critical-buffer.md`
- `constraints` 的 `references/delay-decision.md`
- `field-assessment`

## 服务的主基调原则

**主基调第 1 条：系统工程。** 每个任务不能只看自己，必须标注"这个局部动作影响哪些分系统"。

## 与 td-propose / td-apply 的边界

tasks.md 分两个阶段完成：

1. **`/td-propose` 阶段**：创建 tasks.md 骨架——任务序列 + 关键链标注 + project buffer（按 `constraints` 的 `references/critical-buffer.md` 的规则）。这是 proposal 的"实施计划"部分。
2. **`/td-apply` 阶段**：若 tasks.md 粒度还不够细，本 skill 再次触发细化。

关键链标注在 propose 阶段完成，apply 阶段只做校验和细化。

## 触发时机

- `/td-propose` 阶段：已有 spec，需要拆成 tasks.md 骨架（执行入口是 `/td-propose`，本 skill 由 propose 内部调用）
- `/td-apply` 阶段：tasks.md 已存在但粒度不够细（执行入口是 `/td-apply`，本 skill 由 apply 内部调用）

## 工作方式

### 1. 任务切分顺序：先按系统层次，再按时间粒度

钱学森系统工程强调"系统的层次结构"（主基调第 4 条「层次观」）。任务分解应按层次进行，而不是按时间粒度平面切分。

**切分顺序**：

1. **先按分系统边界切分**：对应 `td-reverse-spec` 的分系统切分。每个分系统一组任务。
2. **再按分系统内部的层次切分**：顶层架构 → 模块设计 → 实现细节。同一分系统内，顶层架构任务先于模块设计任务，模块设计任务先于实现细节任务。
3. **最后检查每个任务的时间粒度**：每个任务应该是 agent 一次能做完的粒度（2–5 分钟可完成）。粒度太大的任务继续按层次往下拆。

**反面例子**：

- ❌ "把所有 UI 改动放一组，所有 API 改动放一组"——按技术层切分，破坏了分系统边界。
- ✅ "auth 分系统：先改 token 验证模块，再改 session 模块；payment 分系统：先改订单模块，再改退款模块"——按分系统边界 + 分系统内部层次切分。

**子系统独立定 tier 时的切分规则**：当 `field-assessment` 识别流程允许子系统独立定 tier 时，本 skill 的任务切分按子系统层次分别拆——每个子系统一份子任务序列，子系统之间的依赖任务是跨子系统的关键链。执行规则见 `field-assessment` 的 `references/subsystem-tiering.md`。

### 2. 每个任务必填字段

字段模板与风险等级判定见 `references/task-template.md`（文件 / 风险 / 验证 / 分系统影响 / 依赖 五个字段 + high/medium/low 判定标准）。

每个任务必须带 `风险` 字段（high / medium / low）——`test-driven-development` 据此决定测试强度，`requesting-code-review` 据此决定 review 深度。

### 3. 标注关键链

用 `constraints` 的 `references/critical-buffer.md` 的规则，在 tasks.md 里标注关键链路径 + project buffer。

### 4. 不写"以后再说"

所有任务要么在 tasks.md 里，要么显式标 `[out of scope]`。"以后再说"是 plan 的腐烂开始。

### 5. task 只写 agent 能编程性执行的步骤

task 是 `executing-plans` 直接消费的条目，主体必须是 agent 能**编程性执行**的动作——写代码、跑测试、执行 CLI 命令、改配置等；非编程性动作（人工目测、用户验收、第三方审批等）不得作为独立 task。动作清单与降级规则见 `references/task-template.md` 的「任务主体约束」节（单一权威）。

`writing-plans` 生成 tasks.md 时按此约束过滤：非编程性动作不进入 task 列表，只落在 `验证` 字段。已存在的 tasks.md 若含此类历史遗留的独立 task，apply 阶段由用户自行决定保留为人工检查项还是降级，本 skill 不预设行为。

## 与其他 skill 的关系

- 与 `constraints` 的 `references/delay-decision.md` 配合：plan 里如果遇到可逆决策，标 `[延迟决策]` 而不是强行拍
- 与 `field-assessment` 配合：子系统独立定 tier 时的切分规则见上方「工作方式」节 1 的子系统段（权威在 `field-assessment` 的 `references/subsystem-tiering.md`）。

## 不做的事

- 不写"high-level plan"——plan 要细到 agent 能直接执行
- 不把所有任务都标"关键链"——关键链是最长路径，不是所有路径
