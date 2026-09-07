---
name: requesting-code-review
description: 架构 review 与任务间代码 review。critical issue 阻塞进度。触发场景：propose 完成后/apply 前；关键链任务 / checkpoint 时；用户要求 review 时。
user-invocable: false
---

# Requesting Code Review

## 触发时机

- **`td-propose` 完成后、`td-apply` 动手前（架构 review）**——proposal 刚定型，进入实施前先检查分系统切分与设计决策，此时改架构成本最低
- `executing-plans` 的 checkpoint 时机
- 每完成一个关键链任务
- **`td-apply` 步骤 6.3 的 change 级收尾**——两层验证（change-level + 系统级）全绿后、change 判 done 前（触发条件与 tier 分层强度见该步骤，执行语义见本 skill 第 6 节）
- 用户显式要求 review

## 工作方式

### 1. Review 维度

review 深度由 tasks.md 对应任务的 `风险` 字段决定（风险判据见 `writing-plans` 任务模板）：

- **high** → 全查下方四个维度（安全维度必查）
- **medium** → 查 Spec compliance / Code quality / Code consistency 三维度；安全维度只查红线（硬编码凭证、关闭鉴权等）
- **low** → 抽查 Spec compliance
- 无 `风险` 字段（无 tasks.md 的独立 review 请求）→ 按 medium

#### Spec compliance（契约符合度）

- 代码实现了 tasks.md 里的任务吗？
- 代码符合 design.md 里的设计决策吗？
- 代码违反了 proposal 的"系统工程影响评估"里说的边界吗？

#### Security（安全）

- 注入面：命令 / 路径 / SQL / 反序列化？
- 权限与凭证：硬编码凭证、凭证进日志、鉴权被绕过？
- 外部输入有校验吗？
- 敏感数据（个人信息 / 业务数据）暴露或泄漏？

#### Code quality（代码质量）

- 命名清晰吗？
- 重复代码（DRY）？
- 函数长度 / 复杂度？
- 错误处理完整吗？
- 测试覆盖了边界情况吗？

#### Code consistency（与既有风格一致性）

- 新代码与项目既有代码风格 / 命名 / 模块组织一致吗？
- 沿用了既有实现模式，还是另起一套？
- 偏离既有风格但 proposal 的"与既有架构/风格的遵循关系"未写明 → warning（字段定义见 `td-propose` 步骤 6.c）

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

### Security
- <OK / 问题 / 不适用（low 风险）>

### Code Quality
- 命名：<OK / 问题>
- DRY：<OK / 问题>
- 错误处理：<OK / 问题>
- 测试覆盖：<OK / 问题>

### Code Consistency
- 与既有风格一致性：<OK / 问题>
- 实现模式沿用：<OK / 另起一套>

### Issues

1. **[critical]** <issue>
   - 位置：<file:line>
   - 建议：<fix>

2. **[warning]** <issue>
   ...

### Verdict
<可以继续 / 必须先修 critical>
```

**Verdict 前置验证**：给出“可以继续”的 Verdict 之前，先触发 `verification-before-completion` 跑验证命令拿到证据——Verdict 是完成声明，没有验证证据的“可以继续”不成立。

### 4. Critical 阻塞

如果有 critical issue：

1. **不继续下一个任务**
2. 立即修复 critical issue
3. 修复后重新 review

warning 不阻塞，但要记录在 tasks.md 的"已知问题"里。

### 5. 架构 review（proposal 完成后、apply 前）

review 对象不是代码，是 proposal 的分系统切分与设计决策。此时改架构成本最低。

检查清单（高内聚 / 低耦合）见 `references/architecture-review-checklist.md`。分级与阻塞语义如下（与 code review 共用；其他位置的分级表述以本节为准）：

- **critical**：坏的分系统切分 / 循环依赖 / 隐式依赖 / 触发了 caller impact 分析但 proposal 缺「caller impact 分析」节或缺变更点类别标注与高危标记（仅 tier-small 降为 warning）——**阻塞 apply**，先回 propose 改 proposal 再继续
- **warning**：接口偏大、职责偏散——记录到 proposal，可延后
- **nit**：命名等——可忽略

架构 review 的 critical 与 code review 的 critical 同样适用"不继续"规则——只是这里"不继续"意味着不进入任务实施。

### 6. change 级收尾 review

`td-apply` 完成判定链的最后阶段：先全绿拿验证证据（6.1 + 6.2），再对整体做 review。触发条件与 tier 分层强度由 `td-apply` 步骤 6.3 持有，本节只定义执行语义。

**与 checkpoint review 的分工**：checkpoint review（第 1–4 节）是任务粒度的增量检查；本节是 change 级的整体检查——跨任务接口衔接、模块拼装后的整体 Spec compliance。每个任务各自绿，拼起来仍可能失调（接口对不上、风格两套、边界互相踩）。

**review 对象**：本 change 的全部新增 / 修改代码（不是单个任务的 diff）。

**执行方式（工具优先，LLM 兜底）**：

1. 当前 agent 环境自带 code review 工具 → 优先调用，把上方 review 对象与深度档位作为范围输入
2. 工具 review 失败（不可用 / 报错 / 超时）或环境无 review 工具 → LLM 人工 review：按第 1 节维度、第 2 节分级、第 3 节报告格式执行（报告标题用 change 名）

**深度档位**：tier-medium / tier-large 按 tasks.md 全部任务 `风险` 字段的**最高档**取——收尾 review 的对象是整体，不逐任务各取各档；tier-small 按 `td-apply` 步骤 6.3 的保底抽查执行。

**critical 阻塞**：沿用第 4 节——修复后重跑 `verification-before-completion`（修复使既有验证证据失效，见其「之前测过」条），重跑通过且无 critical，change 才算 done。

## 与其他 skill 的关系

- 与 `constraints` 的 `references/human-in-loop.md` 配合：critical issue 是 agent 自己能修就修，修不了触发 human-in-loop
