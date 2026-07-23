---
name: verification-before-completion
description: 声明完成前必须跑验证命令。evidence before assertions always。服务主基调第 3 条"综合集成"——声明完成是从定量回到定性。
user-invocable: true
---

# Verification Before Completion

## 服务的主基调原则

**主基调第 3 条：从定性到定量的综合集成。** 声明"完成"是从定量（验证证据）回到定性（"它好了"）的综合。没有定量证据的定性声明，是幻觉。

**主基调第 1 条：系统工程。** "完成"不是"我写完了"，是"系统行为符合契约"。契约符合度必须用证据证明，不能用感觉断言。

## 触发时机

- agent 即将声称"任务完成" / "bug 修复" / "测试通过" / "可以 commit 了"
- 任何"我搞定了"类的声明之前
- `executing-plans` 里任务标记 `[x]` 之前
- `requesting-code-review` 给出"可以继续"之前

## 工作方式

### 1. 列出验证命令

对每个"完成"声明，先列出**具体的验证命令**：

- 跑测试：`<test command>`
- 跑 linter：`<lint command>`
- 跑 build：`<build command>`
- 跑 type check：`<type check command>`

### 2. 实际跑这些命令

不是"我觉得会过"，是**实际执行**，拿到输出。

### 3. 检查输出

- 退出码是 0 吗？
- 输出里有 warning / error 吗？
- 测试覆盖了应该测的场景吗？

### 4. 给出 evidence-based 声明

错误声明："任务完成了。"
正确声明："任务完成。跑了 `pytest tests/test_auth.py`，12 个测试全绿。跑了 `mypy`，没 type error。"

### 5. 如果验证失败

**不要**：
- 立即"修一下"再跑——先理解为什么失败
- 声明"基本完成，就差这点"——要么完成，要么没完成
- 跳过失败的验证，先 commit——commit 失败的代码是污染

**要**：
- 触发 `systematic-debugging` 走 4-phase 流程
- 如果修不了，触发 `human-in-loop` 停下来问用户

## 硬约束

### 不接受"目测通过"

UI 改动也要验证：snapshot test、E2E test、至少手动截图对比。"我看了一下觉得对"不是验证。

### 不接受"应该没问题"

"我没改那块代码，应该没问题"——这是经典翻车点。跑全量测试，确认真的没问题。

### 不接受"之前测过"

"这个测试我之前跑过"——代码变了，之前的测试结果就失效。重跑。

## 与其他 skill 的关系

- 与 `test-driven-development` 配合：TDD 的 GREEN 是 task-level，本 skill 是 change-level
- 与 `systematic-debugging` 配合：verification 失败时，触发 systematic-debugging
- 与 `executing-plans` 配合：task 标 `[x]` 前必须 verification
