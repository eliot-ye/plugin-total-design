---
name: test-driven-development
description: RED-GREEN-REFACTOR，删除先于测试写的代码。服务主基调第 1 条——测试是系统行为的契约。触发场景：用户写任何代码之前；说"我先把代码写了，再加测试"时立即阻止。
user-invocable: false
---

# Test-Driven Development

## 依赖技能

- `field-assessment`
- `constraints` 的 `references/human-in-loop.md`
- `system-engineering`

## 服务的主基调原则

**主基调第 1 条：系统工程。** 测试不是"代码质量的副产物"，是系统行为的契约。没有契约，agent 写的代码就是"自说自话"。

**契约的层次性**：TDD 的 RED-GREEN-REFACTOR 是**分系统层次**的契约（单个任务的行为契约）。但本工作流里还有**系统整体层次**的契约——已 archive 的 change sync 到 `openspec/specs/` 的主 spec 契约。当 TDD 的"删除代码"强制与已 archive 的 spec 契约冲突时，**系统整体层次契约优先**：先触发 `constraints` 的 `references/human-in-loop.md` 让用户决定是改 spec 契约还是保留代码，而不是直接删除代码破坏已 archive 的 spec 契约。

## 触发时机

- 在 `executing-plans` 流程中，每个任务实施时（执行入口是 `/td-apply`，本 skill 由 executing-plans 内部按任务粒度调用，不独立触发）
- 用户写代码（任何代码）之前
- 用户说"我先把代码写了，再加测试"——立即触发本 skill 阻止

## 工作方式

### RED：先写失败测试

1. 看任务的"验证"字段与**风险等级**（high / medium / low，由 `writing-plans` 标注；任务无风险标注时——独立触发、无 tasks.md 上下文——按 medium 处理）
2. 按风险等级决定测试强度：
   - **high**（核心路径 / 跨多个分系统 / 数据一致性 / 安全 / 不可逆）：完整边界用例集（正常路径 + 边界 + 异常）
   - **medium**（常规功能）：正常路径 + 关键边界
   - **low**（机械改动）：冒烟级验证即可
3. 写一个测试，这个测试**当前会失败**（因为功能还没实现）
4. 跑测试，确认它**真的失败**了（不是 build 错误、不是别的失败）
5. 如果测试没失败，说明功能已经存在或测试写错了——停下来

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

如果 agent 发现代码已经写了但对应测试不存在或后加：**删除代码，从 RED 重新开始。** 不是"补测试"，是"重来"。

这个规则看起来激进，但它防止了"测试只是为了配合已写代码"的腐烂。

**例外（brownfield 老代码）：** 本规则只适用于**当前 change 新写的代码**。接手项目时已存在的老代码本来就没测试，强制删除会摧毁系统——老代码走 brownfield 的路径（见 `field-assessment` 的 `references/profile-brownfield.md`「TDD 边界」节）：先加 characterization test 锁定现有行为，再重构。

**例外 2（已 archive 的 spec 契约冲突）：** 当 TDD 的"删除代码"强制会破坏已 archive 的 change sync 到 `openspec/specs/` 的主 spec 契约时，**不直接删除**——先触发 `constraints` 的 `references/human-in-loop.md` 让用户决定：(a) 改 spec 契约（重新 propose 修改主 spec），还是 (b) 保留代码（放弃本次 TDD 的删除强制，记录为"已知契约偏离"）。这是"系统整体层次契约优先于分系统层次 TDD 强制"的执行规则。

### 不接受"这个没法测"

如果 agent 说"这个没法测"：

- UI 渲染？测 snapshot
- 副作用？mock 边界
- 随机性？注入种子
- 时空相关？注入时钟

"没法测"几乎总是"没想清楚契约"。

## 与其他 skill 的关系

- 与 `systematic-debugging` 配合：RED 失败时，如果失败原因不明确，触发 systematic-debugging
- 与 `td-archive` 配合：TDD 的 RED-GREEN-REFACTOR 是分系统层次的契约；archive 的"实际 vs 预期"复盘是系统整体层次的契约验证。两者是"模型载体"在分系统层次和系统整体层次的互补（见 `system-engineering` 的「主基调四条」第 3 条「模型载体」节）。

## 不做的事

- 不"先写 stub 测试占位，以后补"——这是延迟决策的滥用
- 不在 REFACTOR 阶段加新功能——REFACTOR 只改形状不改行为
