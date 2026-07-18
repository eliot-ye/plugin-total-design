---
name: test-driven-development
description: RED-GREEN-REFACTOR。删除先于测试写的代码。服务主基调第 1 条"系统工程"——测试是系统行为的契约。
user-invocable: true
---

# Test-Driven Development

## 服务的主基调原则

**主基调第 1 条：系统工程。** 测试不是"代码质量的副产物"，是系统行为的契约。没有契约，agent 写的代码就是"自说自话"。

## 触发时机

- 在 `executing-plans` 流程中，每个任务实施时
- 用户写代码（任何代码）之前
- 用户说"我先把代码写了，再加测试"——立即触发本 skill 阻止

## 工作方式

### RED：先写失败测试

1. 看任务的"验证"字段
2. 写一个测试，这个测试**当前会失败**（因为功能还没实现）
3. 跑测试，确认它**真的失败**了（不是 build 错误、不是别的失败）
4. 如果测试没失败，说明功能已经存在或测试写错了——停下来

### GREEN：写最小实现

1. 写让测试通过的**最小**代码
2. 不要"顺手"加额外功能——YAGNI
3. 跑测试，确认绿
4. 如果绿不了，回到 RED 调整测试，不要在 GREEN 里硬刚

### REFACTOR：重构

1. 测试绿之后，看代码能不能更干净
2. 重构时测试必须保持绿
3. 重构完跑全量测试，确认没破坏别的

## 硬约束

### 删除"先写代码再加测试"的产物

如果 agent 发现：

- 代码已经写了
- 但对应的测试不存在或后加

**删除代码，从 RED 重新开始。** 不是"补测试"，是"重来"。

这个规则看起来激进，但它防止了"测试只是为了配合已写代码"的腐烂。

### 不接受"这个没法测"

如果 agent 说"这个没法测"：

- UI 渲染？测 snapshot
- 副作用？mock 边界
- 随机性？注入种子
- 时空相关？注入时钟

"没法测"几乎总是"没想清楚契约"。

## 与其他 skill 的关系

- 与 `executing-plans` 配合：每个任务都走 TDD
- 与 `verification-before-completion` 配合：TDD 的 GREEN 是 task-level verification，verification-before-completion 是 change-level verification
- 与 `systematic-debugging` 配合：RED 失败时，如果失败原因不明确，触发 systematic-debugging

## 不做的事

- 不"先写 stub 测试占位，以后补"——这是延迟决策的滥用
- 不在 REFACTOR 阶段加新功能——REFACTOR 只改形状不改行为
