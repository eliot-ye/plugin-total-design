---
name: writing-plans
description: 把工作拆成 bite-sized 任务，每个任务标注对分系统的影响。服务主基调第 1 条"系统工程"。
user-invocable: true
---

# Writing Plans

## 服务的主基调原则

**主基调第 1 条：系统工程。** 每个任务不能只看自己，必须标注"这个局部动作影响哪些分系统"。

## 与 td-propose / td-apply 的边界

tasks.md 分两个阶段完成:

1. **`/td-propose` 阶段**:创建 tasks.md 骨架——任务序列 + 关键链标注 + project buffer（按 `critical-buffer` skill 的规则）。这是 proposal 的"实施计划"部分。
2. **`/td-apply` 阶段**:若 tasks.md 粒度还不够细，本 skill 再次触发细化。

关键链标注在 propose 阶段完成，apply 阶段只做校验和细化。

## 触发时机

- `/td-propose` 阶段：已有 spec，需要拆成 tasks.md 骨架
- `/td-apply` 阶段：tasks.md 已存在但粒度不够细

## 工作方式

### 1. 任务粒度：2–5 分钟可完成

每个任务应该是 agent 一次能做完的粒度。粒度太大的任务先拆。

### 2. 每个任务必填字段

字段模板与风险等级判定见本 skill 的 `references/task-template.md`（文件 / 风险 / 验证 / 分系统影响 / 依赖 五个字段 + high/medium/low 判定标准）。

每个任务必须带 `风险` 字段（high / medium / low）——`test-driven-development` 据此决定测试强度，`requesting-code-review` 据此决定 review 深度。

### 3. 标注关键链

用 `critical-buffer` skill 的规则，在 tasks.md 里标注关键链路径 + project buffer。

### 4. 不写"以后再说"

所有任务要么在 tasks.md 里，要么显式标 `[out of scope]`。"以后再说"是 plan 的腐烂开始。

## 与其他 skill 的关系

- 与 `executing-plans` 配合：plan 是 input
- 与 `critical-buffer` 配合：plan 里要标注关键链 + buffer
- 与 `delay-decision` 配合：plan 里如果遇到可逆决策，标 `[延迟决策]` 而不是强行拍

## 不做的事

- 不写"high-level plan"——plan 要细到 agent 能直接执行
- 不把所有任务都标"关键链"——关键链是最长路径，不是所有路径
