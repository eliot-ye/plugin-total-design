---
name: brainstorming
description: 总体设计部工作方式——站在系统全局立场，提问提炼 spec。
user-invocable: false
---

# Brainstorming — 总体设计部工作方式

## 依赖技能

- `system-engineering`
- `constraints` 的 `references/delay-decision.md`

## 服务的主基调原则

**主基调第 2 条：总体设计部。** brainstorming 不是分系统工程师"问用户要需求"，是总体设计部在"想"的阶段工作——站在系统全局立场，多视角反复迭代。

**主基调第 3 条：从定性到定量的综合集成。** 专家（用户）的定性判断 + agent 对代码的定量分析 + 候选方案的模型 → 反复迭代 → 上升到可执行的 spec。

这里"模型"是钱学森综合集成方法里的关键载体——把定性判断上升到定量认识的桥梁（见 `system-engineering` 的「主基调四条」第 3 条「模型载体」节）。brainstorming 阶段的"候选方案"就是预期模型的雏形；落到 `/td-propose` 的"系统工程影响评估"节后，成为正式预期模型；`/td-archive` 的"实际 vs 预期"复盘是模型验证。brainstorming 必须持有"我在建预期模型的雏形"这个判断，不能把候选方案当成纯讨论。

## 触发时机

- 在 `/td-explore` 流程中被激活（`td-explore` 步骤 4 调用本 skill 的方法论；执行入口是 `/td-explore`，本 skill 不独立触发）
- 在 `/td-propose` 之前（explore 产出的候选方向评估是 propose 步骤 6.a 的输入）

## 工作方式

### 1. 不直接给方案，先问"想达到什么"

错误开场："我建议你这样做……"
正确开场："你想达到什么？现在为什么不行？"

### 2. 候选方向探索

不要只给一个方向，但也不为凑数量硬凑。**列出候选方向，对每个做下列评估**：

- 系统工程影响（影响哪些分系统、整体性能怎么变）
- 优点 / 缺点
- 可逆性（是 two-way door 还是 one-way door）

决策已闭合、无新信息时不凑方向——正确输出是"没有需要你的决策点"，而不是为凑格式生成伪选项（对齐 `constraints` 的 `references/human-in-loop.md` 的"不对所有动作都问一下"红线）。

### 3. 对每个方向，问"如果选这个，系统整体会怎么变？"

这是总体设计部视角的关键问题。分系统工程师只看"我这个分系统怎么改"，总体设计部看"这个改动会让整个系统变成什么样子"。

### 4. 允许矛盾，不急着自洽——但矛盾是反复迭代的输入，不是终点

用户在不同时刻可能说矛盾的话（"要快"又"要稳"）。不要强行调和，把矛盾记下来，让用户看到：

> "你说要快，又说要稳。这两个在你的项目里是矛盾的吗？还是你心里有一个'快且稳'的路径？"

钱学森综合集成方法里，"允许矛盾"是"反复迭代上升到定量认识"的**起点**，不是**终点**（主基调第 3 条）。正确的工作方式是：允许矛盾并存（复杂巨系统不能简化还原，主基调第 4 条），把矛盾作为反复迭代的输入，最终通过综合集成循环（brainstorming → propose → apply → archive）在 archive 的"实际 vs 预期"复盘里被消除。如果 archive 时矛盾仍在，触发 `constraints` 的 `references/human-in-loop.md` 让用户拍板。

"不急着自洽"不等于"永远不自洽"——前者是"信息不足时不要强行闭合"，后者是放弃综合集成。

这与 `constraints` 的 `references/delay-decision.md` 的"可逆决策延迟"是同一原则的两个侧面（权威在 delay-decision）：本 skill 在总体设计部立场允许矛盾并存、不强行闭合 spec。两者在 brainstorming 阶段同时生效——遇到可逆决策时调 `constraints` 的 `references/delay-decision.md`，遇到矛盾时按本节处理。**在完成候选方向评估后，立即执行 `constraints` 的 `references/delay-decision.md` 检查**，判定与处理路径见该文件的「示例：brainstorming 场景」节。
