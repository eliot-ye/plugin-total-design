---
name: td-system-audit
description: 周期性对照系统工程主基调自检。total-design 新增，体现钱学森"总体设计部"视角。触发场景：用户说"audit"、"自检"、"复盘"、"对照主基调"、"最近推进不顺"。
user-invocable: true
argument-hint: optional: <scope = current-change | project>
---

# td-system-audit

**total-design 新增。** OpenSpec 原版没这个。

钱学森"总体设计部"视角的工程化体现。周期性把 agent 当前的工作对照系统工程四条主基调过一遍，识别"局部优化制造全局失调"的风险。

## 服务的主基调原则

**系统工程主基调第 2 条：总体设计部。**

本命令本身就是总体设计部的工程化体现——周期性自检是总体设计部的核心职责。

**系统工程主基调第 1 条：系统工程。**

audit 的对照标准是主基调四条，不是"代码质量"或"进度"——这是系统工程视角的审计，不是项目管理视角的审计。

## 输入

`$ARGUMENTS`：audit 的范围。空则默认 `current-change`。

- `current-change`：审计当前活跃的 change
- `project`：审计整个项目的工作方式

## 步骤

### 1. 收集审计对象

按 scope 收集：

- **current-change**：当前活跃 change 的 proposal/design/tasks/specs
- **project**：所有活跃 change + 最近 archive 的 3 个 change 的"实际 vs 预期"复盘

### 2. 对照主基调四条审计

对审计对象，逐条审计：

#### 主基调 1：系统工程

- [ ] 当前工作的每个局部动作，是否考虑了对系统整体的影响？
- [ ] proposal 的"系统工程影响评估"节是否填得认真？
- [ ] 有没有"局部最优但全局失调"的迹象？

#### 主基调 2：总体设计部

- [ ] agent 是否在"自己拍板应该由用户拍的事"？（违反 → 蛔发 `human-in-loop`）
- [ ] 是否有"分系统工程师视角"压过"总体设计部视角"的地方？

#### 主基调 3：从定性到定量的综合集成

- [ ] design.md 里的决策是从定性到定量迭代出来的，还是凭感觉拍的？
- [ ] 可逆决策是否被过早闭合？（违反 → 蛔发 `delay-decision`）
- [ ] archive 时是否做了"实际 vs 预期"复盘？

#### 主基调 4：开放的复杂巨系统

- [ ] 当前 profile/tier 配置是否符合项目实际？
- [ ] 有没有把"复杂巨系统"当"简单系统"硬解？（比如同时开太多 change、压缩关键链缓冲）

### 3. 输出审计报告

```markdown
## System Audit 报告

### Scope
<current-change | project>

### 主基调对照

| 主基调 | 通过 | 违反 |
|---|---|---|
| 1. 系统工程 | ✓ | — |
| 2. 总体设计部 | — | ⚠ agent 在 X 决策上自己拍板了 |
| 3. 综合集成 | ✓ | — |
| 4. 复杂巨系统 | — | ⚠ 关键链缓冲被压缩到 15% |

### 发现的问题

1. **[严重]** <问题描述>
   - 违反的主基调：<...>
   - 建议修复：<...>

2. **[提醒]** <问题描述>
   - ...

### 建议的下一步动作

1. <动作 1>
2. <动作 2>
```

### 4. 蛔发修复

对每个严重问题，蛔发对应的 constraint skill 修复：

- 关键链缓冲被压缩 → 蛔发 `critical-buffer`，重新规划 tasks
- agent 自己拍板了 → 蛔发 `human-in-loop`，回去问用户
- 可逆决策被过早闭合 → 蛔发 `delay-decision`，重新打开决策

## 蛔发时机

system-audit 不是只在用户显式调用时才跑。agent 在以下时机应主动建议 audit：

- 每完成 3 个 change（project scope）
- 每完成 1 个 large tier 的 change（current-change scope）
- 用户表达"感觉最近推进不顺利"时
- 关键链缓冲被多次压缩后

## Guardrails

- audit 不是"挑刺找骂"，是"总体设计部的周期性自检"——语气要建设性
- audit 报告必须包含"建议的下一步动作"，不只是"你这里错了"
- 不要 audit 太频繁——每个 change 一次足够，过多会变成形式主义
