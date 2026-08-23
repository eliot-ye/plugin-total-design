---
name: human-in-loop
description: 何时必须停下来等用户拍板。服务系统工程主基调第 2 条"总体设计部"和第 3 条"综合集成"。
user-invocable: false
---

# 人在回路

## 服务的主基调原则

**系统工程主基调第 2 条：总体设计部。** 巨系统里有些判断必须留给总体设计部，不能由分系统工程师（agent）自己决定。

**系统工程主基调第 3 条：综合集成。** 定性判断 + 数据 + 模型 → 反复迭代。人是定性判断的来源，机器是数据和模型的处理者，二者必须结合。

## 规则

### 必须停下来等用户拍板的场景

1. **公共契约变更**：API 形状、数据库 schema、配置文件格式、对外承诺的行为
2. **不可逆决策**（见 `delay-decision` skill）
3. **生产环境影响**：部署、迁移、权限变更、数据修改
4. **超出当前 change scope 的影响**：改动会波及 change 之外的代码或系统
5. **agent 自己的置信度低**：agent 不确定方案是否对齐用户意图时
6. **WIP 硬约束 override**：由 `wip-limit` 的 override 流程触发（见 `wip-limit` 的「硬约束 + override 机制」节第 4 步）。本 skill 在 override 回路里负责"描述风险 + 列选项 + 等用户确认"，回路编排由 `wip-limit` 单一持有。
7. **被 `/td-system-audit` 触发修复时**：audit 发现"局部最优但全局失调"或"agent 自己拍板了本应问用户的事"问题时，触发本 skill 让用户（总体设计部）判断这是真全局失调还是可接受的局部优化（对应 `td-system-audit` 步骤 6 的问题→修复映射表）。

### 强度叠加规则

以上第 1–5 类是**通用基线**，所有 profile × tier 下都生效——这是"必须停"的下限。

`field-assessment` 表 1 第 5 行定义各 tier 的 human-in-loop **额外触发条件**（如 tier-large 的"+ 总体设计文档审阅"；tier-small / tier-medium 无额外条件）。表 2 定义各 profile 的**场景加成**（如 brownfield 的"+ 改老代码前"、maintenance 的"+ 生产环境改动前"）。

最终生效强度 = 第 1–5 类通用基线 **+** 表 1 tier 加成 **+** 表 2 profile 加成，三者叠加都生效，不替换。表 2 的 profile 加成与基线场景重叠时（如 brownfield"改老代码前"与基线第 4 类超 scope 场景、maintenance"生产环境改动前"与基线第 3 类），叠加只是强调，不矛盾。

**第 6、7 类的叠加语义**：第 6 类（WIP override）和第 7 类（audit 触发修复）是**特定流程的触发通道**，**不参与 profile × tier 叠加**——它们分别由 `wip-limit` override 流程和 `/td-system-audit` 触发，与 profile/tier 强度无关。但 override 流程里触发的 `brooks-law` / `critical-buffer` 评估，仍按当前 tier 强度执行。

### 不需要停下来的场景

1. 可逆决策的"先用最简单方案往前走"
2. 在已闭合的设计框架内的实施细节
3. verification 步骤（除非失败且 agent 不知如何修复）

## 触发机制

本 skill 不靠 hook 强制，靠 agent 自觉识别上述场景。当 agent 识别到上述第 1–5 类场景时，**必须暂停**，用 `AskUserQuestion` 工具或等价机制问用户，**不得自行推进**。

## 触发时 agent 应做的事

1. 描述当前状态："我正在做 X，遇到了 Y 决策点"
2. 列出选项 + 每个选项的影响
3. 给出 agent 的推荐 + 推荐理由
4. 明确等待："请决定，我等你回复再继续"

## 不做的事

- 不对所有动作都"问一下"——那是骚扰，不是人在回路
- 不在用户明确授权"自己往前走"后还反复停下来——用户授权过的范围，agent 自主推进

## 与其他 skill 的关系

- 与 `delay-decision` 配合：可逆决策延迟，但延迟期内触及不可逆点时，本 skill 触发
- 与 `brooks-law` 配合：用户考虑"加人手"时，brooks-law 提醒，本 skill 要求用户显式确认
- 与 `wip-limit` 配合：用户想并行硬解超过 wip-limit 上限的 change 时，wip-limit 硬阻塞，本 skill 在 override 流程里要求用户显式确认风险（第 6 类）。
