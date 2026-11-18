---
name: executing-plans
description: 复杂场景管理层：checkpoint 调度与失败处理。
user-invocable: false
---

# Executing Plans

## 依赖技能

- `field-assessment`（表 3 current-change 触发归属）
- `constraints` 的 `references/human-in-loop.md`（checkpoint 必停判据 + `Ruling:` 验证削减记账）
- `verification-before-completion`（验证边界核对——判"能否宣布完成"的依据）

## 触发时机

由 `td-apply` 步骤 4 在复杂场景下按需调用（关键链 checkpoint / 失败处理）。本 skill 不独立触发，不接管基本执行循环。current-change audit 随 checkpoint 触发，tier 分层与归属见 `field-assessment/references/audit-frequency.md` 表 3——本 skill 负责 tier-medium（每个关键链任务完成时），tier-large 由 td-apply 步骤 6.4 负责。

## 工作方式

### 1. Human checkpoint

在以下时机停下来问用户：完成一个关键链任务 / 命中 `constraints` 的 `references/human-in-loop.md` 必停场景 / 任务实际耗时 >2x 估时（**估时取任务模板的 `估时` 字段**，定义见 `writing-plans/references/task-template.md`「`估时` 字段」条；省略该字段时降级为"任务实际耗时明显超出同类任务预期"，不构成硬触发）。

checkpoint 格式：

```
## Checkpoint <N>
### 完成的任务
- [x] <task> — 验证：<test output>
### 验证边界
- 已验证且绿：<…>
- 未验证 / 待跑：<…>
- 被削减（如有）：<砍了什么 — 为什么 — 补跑条件>（`Ruling:` 记账，见 `constraints` 的 `references/human-in-loop.md`）
### 下一步 / 需要你拍板的
- <task> / <decision>
继续吗？
```

**验证边界核对**：checkpoint 必须显式区分"已验证且绿 / 未验证待跑 / 被削减"三类——这条边界是 `verification-before-completion` 判"能否宣布完成"的依据。实施中若因上下文压力或工作量把原定验证范围砍成子集，属**范围变更**：就地留 `Ruling:` 记账 + 走 `td-apply` 步骤 5 的 apply 全局必停通道上报用户裁决，不得静默降级成"最小子集"了事。长任务（多任务 / 接近 compaction）此项必做，短任务可略。

checkpoint 时做 `requesting-code-review`（含与既有风格一致性检查）。

**current-change audit**：完成一个关键链任务时，按表 3 的 current-change scope 频率触发 `/td-system-audit current-change`

### 2. 失败处理

1. 触发 `systematic-debugging`：4-phase root cause
2. root cause 在 plan 之外 → 停下来问用户
3. 不"硬刚"——失败次数阈值分两个层面、各自持有：**同一任务失败 2 次 → 触发 `systematic-debugging`（阈值归该 skill 的「触发时机」节）；3 次 → 反思 plan（回到 checkpoint 询问用户，阈值归本节）**

## 常见合理化

| 合理化（agent 对自己说的话） | 现实 |
|---|---|
| "关键链任务做完了，但用户正忙，跳过 checkpoint" | checkpoint 是硬门不是礼貌询问——做完关键链任务就停，用户忙是用户的事，门不因忙而消失 |
| "这个 checkpoint 内容不多，合并到下一个一起问" | 每个关键链任务完成是一个独立门，合并=让用户失去中途纠偏的机会 |
| "任务失败 2 次了，再试一次说不定就过" | 2 次失败=触发 `systematic-debugging` 找根因，不是再蛮干一次（阈值归该 skill）——3 次才回来反思 plan |
| "失败原因我大概知道，不用走 4-phase" | "大概知道"是猜——4-phase 是防猜的，走 `systematic-debugging` |
| "checkpoint 时 review 太重了，这任务风险低" | checkpoint review 深度由任务风险字段决定（见 `requesting-code-review` 第 1 节），低风险本就轻——不是跳过的理由 |
| "估时超了但我觉得能追回来，不停" | 实际 >2x 估时是硬触发（见步骤 1），"能追回来"是赌——停下让总体设计部看到偏差 |
