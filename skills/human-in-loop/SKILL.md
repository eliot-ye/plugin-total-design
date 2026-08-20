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
6. **WIP 硬约束 override**：本类由 `wip-limit` 的 override 流程触发（见 `wip-limit` 的「硬约束 + override 机制」节）。用户想并行硬解超过 wip-limit 上限的 change 时，本 skill 负责执行"显式确认风险"的回路。第 6 类不参与 profile × tier 强度叠加——它是 WIP 硬约束的 override 通道，与 profile/tier 强度无关。
7. **被 `/td-system-audit` 触发修复时**：audit 发现"局部最优但全局失调"问题时，触发本 skill 让用户（总体设计部）判断这是真全局失调还是可接受的局部优化。

### 强度叠加规则

以上 5 类是**通用基线**，所有 profile × tier 下都生效——这是"必须停"的下限。

`field-assessment` 表 1 第 5 行定义各 tier 的 human-in-loop **额外触发条件**（如 tier-medium 的"+ 公共契约变更"、tier-large 的"+ 总体设计文档审阅"）。表 2 定义各 profile 的**场景加成**（如 brownfield 的"+ 改老代码前"、maintenance 的"+ 生产环境改动前"）。

最终生效强度 = 通用基线 5 类 ∪ 表 1 tier 加成 ∪ 表 2 profile 加成。三者叠加，不替换。改老代码既算基线第 4 类"超 scope 影响"也被 brownfield 加成点名，叠加只是强调，不矛盾。

**第 6 类（WIP 硬约束 override）的叠加语义**：第 6 类是 `wip-limit` override 流程触发的，**不参与 profile × tier 叠加**——它是 WIP 硬约束的 override 通道，与 profile/tier 强度无关。但 override 流程里触发的 `brooks-law` / `critical-buffer` 评估，仍按当前 tier 强度执行。

### 不需要停下来的场景

1. 可逆决策的"先用最简单方案往前走"
2. 在已闭合的设计框架内的实施细节
3. verification 步骤（除非失败且 agent 不知如何修复）

## 触发机制

本 skill 不靠 hook 强制，靠 agent 自觉识别上述场景。当 agent 识别到上述 5 类场景时，**必须暂停**，用 `AskUserQuestion` 工具或等价机制问用户，**不得自行推进**。

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
