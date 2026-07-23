---
name: td-apply
description: 实施任务，按 artifact 走。OpenSpec 契约层入口。触发场景：用户说"apply"、"实施"、"开始写代码"、"按 change 干"、"执行 tasks"。
user-invocable: true
argument-hint: <change-name>
---

# td-apply

按 change 的 tasks.md 实施。这是从"契约"走向"代码"的桥。

## 服务的主基调原则

**系统工程主基调第 1 条：系统工程。**

apply 不是"按任务清单打勾"，是"在系统全局立场上推进实施"。每个任务对系统整体的影响，必须由 agent 持续持有。

**系统工程主基调第 2 条：总体设计部。**

apply 过程中遇到的关键决策，agent 不自己拍板，触发 `human-in-loop` 让用户（总体设计部）拍。

## 输入

`$ARGUMENTS`：change 名。空则用 `AskUserQuestion` 问用户"想 apply 哪个 change"。

## 步骤

### 0. 激活主基调与配置层

每个 td-* skill 的步骤 0 执行同一序列，只注入强度不做判断：

1. **`system-engineering`** — 主基调四条进入上下文。apply 是"在系统全局立场上推进实施"，没有主基调框架就会退化为"按任务清单打勾"。
2. **profile × tier 识别** — 调用 `constraint-matrix` 的「识别流程」节，判读 `$_TD_PROFILE` / `$_TD_TIER`，并把表 1（5 个 constraint 强度）+ 表 2（human-in-loop 加成）+ 表 3（system-audit 频率）读入上下文。会话内缓存，后续步骤直接引用。
3. **其余 constraint**（`wip-limit` / `human-in-loop` / `critical-buffer` 等）— 只把 `constraint-matrix` 的强度值读入上下文，**不在步骤 0 判断是否触发**。"是否触发"是步骤 1 的事，是否触发 / tasks 是否合规的判断在步骤 1 进行。

### 1. 前置检查

对照步骤 0 注入的强度与当前 change 状态，判断是否触发：

- **change 完整性**：artifact 是否齐全？proposal 是否有"系统工程影响评估"节？没有 → 不算 apply-ready，停下来问用户。
- **`wip-limit`**：当前活跃 change 数已达上限？（apply 一个已达上限意味着 propose 阶段没拦，这里补拦）
- **`critical-buffer`**：tasks.md 里是否标注关键链？是否留了 project buffer（按步骤 0 注入的当前 tier 比例）？没有 → 触发 `writing-plans` 补上（关键链标注应在 propose 阶段完成，这里只补漏）。
- 其余 constraint（brooks-law / delay-decision / human-in-loop）在实施过程中按需触发，不在本步预判。

### 2. 读 change 的 artifact

按依赖顺序读：

1. `proposal.md`（what & why）
2. `design.md`（how）
3. `specs/` 下的 spec 文件
4. `tasks.md`（实施步骤）

### 3. 触发 Superpowers 行为层

按 `tasks.md` 的任务序列实施。行为层 skill 嵌套触发，不是平铺：

1. **`writing-plans`**（若 tasks.md 粒度不够细）：细化任务序列
2. **`executing-plans`**（按任务序列执行，内部嵌套触发以下 skill）：
   - **`test-driven-development`**：每个任务先写失败测试，再写实现
   - **`requesting-code-review`**：checkpoint 时做 review
   - **`verification-before-completion`**：每个任务完成前必须跑验证命令

`executing-plans` 是行为层执行的核心入口，TDD / review / verify 在 `executing-plans` 内部按任务粒度嵌套触发。

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
