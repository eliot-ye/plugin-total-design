---
name: writing-plans
description: 把工作拆成 bite-sized 任务，每个任务标注对分系统的影响。服务主基调第 1 条"系统工程"。
user-invocable: true
---

# Writing Plans

## 服务的主基调原则

**主基调第 1 条：系统工程。** 每个任务不能只看自己，必须标注"这个局部动作影响哪些分系统"。

## 触发时机

- `/td-propose` 之后、`/td-apply` 之前
- 已有 spec，需要拆成可执行任务

## 工作方式

### 1. 任务粒度：2–5 分钟可完成

每个任务应该是 agent 一次能做完的粒度。粒度太大的任务先拆。

### 2. 每个任务必填字段

```markdown
- [ ] <task description>
  - 文件：<exact file paths>
  - 验证：<how to verify this task is done>
  - 分系统影响：<which subsystems this touches>
  - 依赖：<other tasks that must complete first>
```

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
