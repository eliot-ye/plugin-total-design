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

- **频率触发**：对照表 3(system-audit 频率,按当前 tier 的 project scope / current-change scope 阈值)。表 3 由 td-* 步骤 1 注入会话上下文;若未注入,调 `constraint-matrix` 注入后再读。频率事实源在 `constraint-matrix` 表 3,本 skill 不重写——`td-archive` 步骤 5.2 已维护"累计 archive 计数器",达阈值即建议。
- **信号触发**：
  - 用户表达"感觉最近推进不顺利"时
  - 关键链缓冲被多次压缩后

## 步骤

### 1. 激活主基调与配置层

激活主基调与配置层。只注入强度不做判断，按下述三步序列执行：

1. **`system-engineering`** — 主基调四条进入上下文。audit 的对照标准就是主基调四条，没有主基调框架，audit 会退化成"代码质量审查"。
2. **profile × tier 识别** — 调 `constraint-matrix`，判读 `$_TD_PROFILE` / `$_TD_TIER`，读入表 1 + 表 2 + 表 3（audit 频率是否达标，查表 3）。会话内缓存，后续步骤直接引用。
3. **其余 constraint** — 只把强度值读入上下文，不在本步判断是否触发。

### 2. 收集审计对象

按 scope 收集：

- **current-change**：当前活跃 change 的 proposal/design/tasks/specs
- **project**：所有活跃 change + 最近 archive 的 3 个 change 的"实际 vs 预期"复盘，**并纳入 `openspec/specs/` 下的主 spec baseline**——这是 reverse-spec / archive sync 沉淀下来的分系统契约与不变量，作为 audit 对照"局部改动是否破坏既有分系统契约"的锚点。`openspec/specs/` 为空（项目从未 reverse-spec、也未 archive 过任何 change）→ 跳过 baseline 锚点，仅审计活跃 change 与最近 archive 复盘。

### 3. 对照主基调四条审计

对审计对象，逐条审计。逐条检查清单见本 skill 的 `references/audit-report-template.md` 的「主基调对照清单」节——按四条主基调逐条打勾，违反项标注并触发对应 constraint skill（见步骤 6）。

### 4. 输出审计报告

报告同时输出到对话和落盘。落盘路径：`openspec/.td-state/audits/<YYYYMMDD-HHMMSS>-<scope>.md`。目录由本步骤首次运行时按需创建。

报告按本 skill 的 `references/audit-report-template.md` 的「报告模板」节输出（Scope + 主基调对照表 + 发现的问题 + 建议的下一步动作）。

落盘后，同步更新 `openspec/.td-state/audit-history.yaml`：追加一条本次 audit 的记录。文件格式见 `constraint-matrix` 的 `references/file-templates.md`，文件由本步骤首次运行时按需创建。

**null 语义**：`audit-history.yaml` 不存在 → 本步骤创建文件并写入首条记录；`audits/` 目录不存在 → 同步创建。

### 5. 问题落池（可选）

审计报告输出后，对报告里"建议的下一步动作"（尤其是非严重问题、暂不立即修复的后续事项），询问用户："要不要把这些记进 `openspec/todo.md` 待办池？"——落池 = 记为 backlog 候选，等 `/td-propose` 时从池里挑，不占 WIP。

- 用户同意 → 按 `td-propose` 的 `references/todo-format.md` 格式，把条目写入 `openspec/todo.md` 待办节（`- [ ] 一句话描述`；文件不存在 → 创建）。
- 用户拒绝 → 跳过，不强制。

### 6. 触发修复

对每个严重问题，触发对应的 constraint skill 修复：

- 关键链缓冲被压缩 → 触发 `critical-buffer`，重新规划 tasks
- agent 自己拍板了 → 触发 `human-in-loop`，回去问用户
- 可逆决策被过早闭合 → 触发 `delay-decision`，重新打开决策

### 7. 修复后重跑 audit 闭环

严重问题修复完成后，**重跑同一 scope 的 audit**，确认：

- 之前的严重问题已消除
- 修复动作没引入新的"局部优化制造全局失调"

重跑最多 3 次。3 次后仍有严重问题 → 触发 `human-in-loop`，让用户介入决定如何处理（继续修复、调整 scope、或接受残留风险）。

不重跑 = 闭环没合，问题可能换形式回来。

## Guardrails

- audit 不是"挑刺找骂"，是"总体设计部的周期性自检"——语气要建设性
- audit 报告必须包含"建议的下一步动作"，不只是"你这里错了"
- 不要 audit 太频繁——每个 change 一次足够，过多会变成形式主义
