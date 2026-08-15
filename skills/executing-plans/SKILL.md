---
name: executing-plans
description: 批量执行任务，带 human checkpoint。服务主基调第 2 条"总体设计部"。
user-invocable: true
---

# Executing Plans

## 服务的主基调原则

**主基调第 2 条：总体设计部。** 执行不是"闷头干"，是"分系统工程师（agent）干一段，总体设计部（用户）checkpoint 一次"。

## 触发时机

- plan 已经写好（`writing-plans` 完成）
- 用户说"开始执行" / "go"

## 工作方式

### 1. 按 tasks.md 顺序执行

不跳任务，不并行（除非 plan 里显式标了并行）。

### 2. 每个任务执行流程

1. 触发 `test-driven-development`：先写失败测试
2. 写实现
3. 跑测试，确认绿
4. 触发 `verification-before-completion`：跑验证命令
5. 更新 tasks.md：`- [ ]` → `- [x]`，加验证证据

### 3. Human checkpoint

在以下时机停下来问用户：

- 完成一个关键链任务
- 遇到 `human-in-loop` skill 的 5 类必停场景
- 任务实际耗时显著超过估时（>2x）

**current-change audit 触发**：对照 `constraint-matrix` 表 3 的 current-change scope 频率——tier-medium 每个关键链任务完成时，随本 checkpoint 触发 `/td-system-audit current-change`（tier-small 不要求，tier-large 由 td-apply 步骤 7.3 负责，本处不重复）。

checkpoint 格式：

```
## Checkpoint <N>

### 完成的任务
- [x] <task A> — 验证：<test output>
- [x] <task B> — 验证：<test output>

### 下一步
- <task C>
- <task D>

### 需要你拍板的
- <decision 1>
- <decision 2>

继续吗？
```

### 4. 失败处理

任务执行失败时：

1. 触发 `systematic-debugging`：4-phase root cause
2. 如果 root cause 在 plan 之外，停下来问用户
3. 不"硬刚"——失败 3 次就停下来反思 plan

## 与其他 skill 的关系

- 与 `requesting-code-review` 配合：checkpoint 时做 review
