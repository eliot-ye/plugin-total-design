---
name: td-system-audit
description: 周期性对照系统工程主基调自检。total-design 新增，体现钱学森"总体设计部"视角。触发场景：用户说"audit"、"自检"、"复盘"、"对照主基调"、"最近推进不顺"。
user-invocable: true
argument-hint: "<scope: current-change | project>  (可选, 默认 current-change)"
---

# td-system-audit

钱学森"总体设计部"视角的工程化体现。周期性把 agent 当前的工作对照系统工程四条主基调过一遍，识别"局部优化制造全局失调"的风险。

## 依赖技能

- `system-engineering`
- `constraint-matrix`

## 服务的主基调原则

**系统工程主基调第 2 条：总体设计部。**

本命令本身就是总体设计部的工程化体现——周期性自检是总体设计部的核心职责。

**系统工程主基调第 1 条：系统工程。**

audit 的对照标准是主基调四条，不是"代码质量"或"进度"——这是系统工程视角的审计，不是项目管理视角的审计。

## 输入 - audit 的范围。空则默认 `current-change`

- `current-change`：审计当前活跃的 change
- `project`：审计整个项目的工作方式

#### 内容

`$ARGUMENTS`

## 触发时机

system-audit 不是只在用户显式调用时才跑。agent 应在以下时机主动建议 audit：

- **频率触发**：对照 `constraint-matrix` 表 3 的 system-audit 频率（按当前 tier 的 project scope / current-change scope 阈值）。频率事实源在表 3，本 skill 不重写——`td-archive` 步骤 4.2 已维护"累计 archive 计数器"，达阈值即建议。
- **信号触发**：
  - 用户表达"感觉最近推进不顺利"时
  - 关键链缓冲被多次压缩后

## 步骤

### 0. 激活主基调与配置层

**加载技能 `system-engineering` `constraint-matrix`**

- `system-engineering`：主基调四条进入上下文。audit 的对照标准就是主基调四条，没有主基调框架，audit 会退化成"代码质量审查"。
- 执行 `constraint-matrix` 的 `## 识别流程`
- 表 3（system-audit 频率）必须读入——audit 频率是否达标，查表 3。

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

- [ ] agent 是否在"自己拍板应该由用户拍的事"？（违反 → 触发 `human-in-loop`）
- [ ] 是否有"分系统工程师视角"压过"总体设计部视角"的地方？

#### 主基调 3：从定性到定量的综合集成

- [ ] design.md 里的决策是从定性到定量迭代出来的，还是凭感觉拍的？
- [ ] 可逆决策是否被过早闭合？（违反 → 触发 `delay-decision`）
- [ ] archive 时是否做了"实际 vs 预期"复盘？

#### 主基调 4：开放的复杂巨系统

- [ ] 当前 profile/tier 配置是否符合项目实际？
- [ ] 有没有把"复杂巨系统"当"简单系统"硬解？（比如同时开太多 change、压缩关键链缓冲）

### 3. 输出审计报告

报告同时输出到对话和落盘。落盘路径：`openspec/.td-state/audits/<YYYYMMDD-HHMMSS>-<scope>.md`。目录由本步骤首次运行时按需创建。

落盘后，同步更新 `openspec/.td-state/audit-history.yaml`：追加一条本次 audit 的记录。文件格式见 `constraint-matrix` 的「持久化层」节，文件由本步骤首次运行时按需创建。

**null 语义**：`audit-history.yaml` 不存在 → 本步骤创建文件并写入首条记录；`audits/` 目录不存在 → 同步创建。

报告模板：

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

### 4. 触发修复

对每个严重问题，触发对应的 constraint skill 修复：

- 关键链缓冲被压缩 → 触发 `critical-buffer`，重新规划 tasks
- agent 自己拍板了 → 触发 `human-in-loop`，回去问用户
- 可逆决策被过早闭合 → 触发 `delay-decision`，重新打开决策

### 5. 修复后重跑 audit 闭环

严重问题修复完成后，**重跑同一 scope 的 audit**，确认：

- 之前的严重问题已消除
- 修复动作没引入新的"局部优化制造全局失调"

重跑最多 3 次。3 次后仍有严重问题 → 触发 `human-in-loop`，让用户介入决定如何处理（继续修复、调整 scope、或接受残留风险）。

不重跑 = 闭环没合，问题可能换形式回来。

## Guardrails

- audit 不是"挑刺找骂"，是"总体设计部的周期性自检"——语气要建设性
- audit 报告必须包含"建议的下一步动作"，不只是"你这里错了"
- 不要 audit 太频繁——每个 change 一次足够，过多会变成形式主义
