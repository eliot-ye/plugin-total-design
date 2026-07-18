---
description: 实施任务，按 artifact 走。OpenSpec 契约层入口。
argument-hint: <change-name>
---

# /td-apply

按 change 的 tasks.md 实施。这是从"契约"走向"代码"的桥。

## 输入

`$ARGUMENTS`：change 名。空则用 `AskUserQuestion` 问用户"想 apply 哪个 change"。

## 步骤

### 1. 前置检查

- 触发 `wip-limit`：当前活跃 change 是否已达上限？
- 触发 `human-in-loop`：change 的 proposal 是否有"系统工程影响评估"节？没有 → 不算 apply-ready，停下来问用户。
- 触发 `critical-buffer`：tasks.md 里是否标注关键链？是否留了 project buffer？没有 → 先补上。

### 2. 读 change 的 artifact

按依赖顺序读：

1. `proposal.md`（what & why）
2. `design.md`（how）
3. `specs/` 下的 spec 文件
4. `tasks.md`（实施步骤）

### 3. 触发 Superpowers 行为层

按 `tasks.md` 的任务序列实施。每个任务触发：

- **`writing-plans`**：如果 tasks.md 还不够细（agent 觉得任务粒度太大），先细化
- **`test-driven-development`**：每个任务先写失败测试，再写实现
- **`executing-plans`** 或 `subagent-driven-development`：按任务序列执行
- **`requesting-code-review`**：任务之间做 review
- **`verification-before-completion`**：每个任务完成前必须跑验证命令

### 4. 触发工程管理约束

实施过程中，按需触发：

- `brooks-law`：用户想加人手 / 并行 subagent 时
- `delay-decision`：遇到可逆决策时
- `human-in-loop`：遇到 5 类必停场景时（见该 skill）

### 5. 更新 tasks.md

每完成一个任务：

- 把 `- [ ]` 改成 `- [x]`
- 在任务后面加验证证据链接（测试输出、命令结果）

### 6. 完成判定

所有任务 `[x]` 后，触发 `verification-before-completion` 做最终验证。验证通过才算 done。

## Guardrails

- 不跳过任务，按 tasks.md 顺序
- 每个任务必须有验证证据，"我觉得改对了"不算
- 遇到 proposal 与实际代码冲突时，停下来问用户：是改 proposal 还是改代码？

## 服务的主基调原则

**系统工程主基调第 1 条：系统工程。**

apply 不是"按任务清单打钩"，是"在系统全局立场上推进实施"。每个任务对系统整体的影响，必须由 agent 持续持有。

**系统工程主基调第 2 条：总体设计部。**

apply 过程中遇到的关键决策，agent 不自己拍板，触发 `human-in-loop` 让用户（总体设计部）拍。
