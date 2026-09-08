---
name: executing-plans
description: 批量执行任务，带 human checkpoint。
user-invocable: false
---

# Executing Plans

## 依赖技能

- `field-assessment`（表 3 current-change 触发归属）
- `constraints` 的 `references/human-in-loop.md`（checkpoint 必停判据）

## 触发时机

由 `td-apply` 步骤 4 在复杂场景下按需调用（关键链 checkpoint / 失败处理）。本 skill 不独立触发，不接管基本执行循环。current-change audit 随 checkpoint 触发，tier 分层与归属见 `field-assessment/references/audit-frequency.md` 表 3——本 skill 负责 tier-medium（每个关键链任务完成时），tier-large 由 td-apply 步骤 6.4 负责。

## 工作方式

### 1. Human checkpoint

在以下时机停下来问用户：完成一个关键链任务 / 命中 `constraints` 的 `references/human-in-loop.md` 必停场景 / 任务实际耗时 >2x 估时。

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

checkpoint 时做 `requesting-code-review`（含与既有风格一致性检查）。

### 2. 失败处理

1. 触发 `systematic-debugging`：4-phase root cause
2. root cause 在 plan 之外 → 停下来问用户
3. 不"硬刚"——失败 3 次反思 plan（2 次触发 debug、3 次反思，阈值见 `systematic-debugging` 触发时机）
