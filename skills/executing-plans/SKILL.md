---
name: executing-plans
description: 批量执行任务，带 human checkpoint。
user-invocable: false
---

# Executing Plans

## 依赖技能

- `field-assessment`（判读 profile × tier 与表 3 current-change 触发归属）
- `constraints` 的 `references/human-in-loop.md`（checkpoint 必停判据）

## 触发时机

- 由 `td-apply` 步骤 4 在复杂场景下按需调用（关键链 checkpoint / 失败处理）——执行入口统一走 `/td-apply`，本 skill 不独立触发，不接管基本执行循环
- **current-change audit 触发**（随本 skill 的 checkpoint 触发）：tier 分层与触发归属见 `field-assessment/references/audit-frequency.md` 的「current-change scope 的触发 skill 归属」表（表 3）——本 skill 只负责 `tier-medium`（每个关键链任务完成时触发），`tier-small` 不要求，`tier-large` 由 `td-apply` 步骤 6.4 负责。

## 工作方式

### 1. Human checkpoint

在以下时机停下来问用户：

- 完成一个关键链任务
- 遇到 `constraints` 的 `references/human-in-loop.md` 的必停场景（第 1–5 类通用基线 + tier/profile 加成）
- 任务实际耗时显著超过估时（>2x）

**current-change audit**：随本 checkpoint 触发，频率与 tier 分层见上方「触发时机」节的 current-change audit 条目。

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

任务执行失败时：

1. 触发 `systematic-debugging`：4-phase root cause
2. 如果 root cause 在 plan 之外，停下来问用户
3. 不"硬刚"——失败 3 次就停下来反思 plan（2 次触发 `systematic-debugging`、3 次反思 plan，两个阈值见 `systematic-debugging` 触发时机）

## 与其他 skill 的关系

- 与 `requesting-code-review` 配合：checkpoint 时做 review
