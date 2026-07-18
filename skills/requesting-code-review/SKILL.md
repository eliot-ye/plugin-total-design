---
name: requesting-code-review
description: 任务之间的 review，critical issue 阻塞进度。服务主基调第 2 条"总体设计部"——review 是总体设计部对分系统工作的检查。
user-invocable: true
---

# Requesting Code Review

## 服务的主基调原则

**主基调第 2 条：总体设计部。** review 不是"找 bug"，是"总体设计部对分系统工程师的工作做系统全局检查"——这个改动符合系统总体设计吗？它制造了新的失调吗？

## 触发时机

- `executing-plans` 的 checkpoint 时机
- 每完成一个关键链任务
- 用户显式要求 review

## 工作方式

### 1. Review 维度

对被 review 的代码，从两个维度看：

#### Spec compliance（契约符合度）

- 代码实现了 tasks.md 里的任务吗？
- 代码符合 design.md 里的设计决策吗？
- 代码违反了 proposal 的"系统工程影响评估"里说的边界吗？

#### Code quality（代码质量）

- 命名清晰吗？
- 重复代码（DRY）？
- 函数长度 / 复杂度？
- 错误处理完整吗？
- 测试覆盖了边界情况吗？

### 2. Issue 分级

| 严重度 | 含义 | 处理 |
|---|---|---|
| **critical** | 违反 spec / 严重 bug / 安全问题 | **阻塞**，必须修复才能继续 |
| **warning** | 代码质量问题、次要 bug | 应修复，可延后 |
| **nit** | 风格、命名 | 可忽略 |

### 3. Review 报告

```markdown
## Code Review：<task name>

### Spec Compliance
- [ ] 实现符合 tasks.md
- [ ] 实现符合 design.md
- [ ] 实现符合 proposal 系统工程影响评估边界

### Code Quality
- 命名：<OK / 问题>
- DRY：<OK / 问题>
- 错误处理：<OK / 问题>
- 测试覆盖：<OK / 问题>

### Issues

1. **[critical]** <issue>
   - 位置：<file:line>
   - 建议：<fix>

2. **[warning]** <issue>
   ...

### Verdict
<可以继续 / 必须先修 critical>
```

### 4. Critical 阻塞

如果有 critical issue：

1. **不继续下一个任务**
2. 立即修复 critical issue
3. 修复后重新 review

warning 不阻塞，但要记录在 tasks.md 的"已知问题"里。

## 与其他 skill 的关系

- 与 `executing-plans` 配合：checkpoint 时触发 review
- 与 `human-in-loop` 配合：critical issue 是 agent 自己能修就修，修不了触发 human-in-loop
- 与 `verification-before-completion` 配合：review 是 verification 的一部分

## 不做的事

- 不做"鼓励式 review"——"看起来不错！"不是 review
- 不把所有问题都标 critical——分级是纪律
- 不在 review 里改代码——review 是判断，改是执行
