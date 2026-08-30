---
name: executing-plans
description: 批量执行任务，带 human checkpoint。服务主基调第 2 条。触发场景：`td-apply` 流程内按 tasks.md 序列实施时（执行入口是 `/td-apply`，本 skill 由 apply 内部调用；用户直接说"开始执行"/"go" 应走 `/td-apply`）——关键链任务后停下来 checkpoint。
user-invocable: false
---

# Executing Plans

## 依赖技能

- `field-assessment`
- `constraints` 的 `references/human-in-loop.md`
- `requesting-code-review`
- `systematic-debugging`
- `test-driven-development`
- `verification-before-completion`

## 服务的主基调原则

**主基调第 2 条：总体设计部。** 执行不是"闷头干"，是"分系统工程师（agent）干一段，总体设计部（用户）checkpoint 一次"。

**《工程控制论》反馈控制回路归位**：任务执行流程是契约级误差检测 + 校正回路，Human checkpoint 是总体设计部级误差检测 + 校正。

## 触发时机

- plan 已经写好（`writing-plans` 完成）
- 用户说"开始执行" / "go"
- **current-change audit 触发**（随本 skill 的 Human checkpoint 触发）：tier 分层与触发归属见 `field-assessment/references/audit-frequency.md` 的「current-change scope 的触发 skill 归属」表（表 3）——本 skill 只负责 `tier-medium`（每个关键链任务完成时触发），`tier-small` 不要求，`tier-large` 由 `td-apply` 步骤 7.3 负责，本处不重复。

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

### 4. 失败处理

任务执行失败时：

1. 触发 `systematic-debugging`：4-phase root cause
2. 如果 root cause 在 plan 之外，停下来问用户
3. 不"硬刚"——失败 3 次就停下来反思 plan（2 次触发 `systematic-debugging`、3 次反思 plan，两个阈值见 `systematic-debugging` 触发时机）

## 与其他 skill 的关系

- 与 `requesting-code-review` 配合：checkpoint 时做 review
