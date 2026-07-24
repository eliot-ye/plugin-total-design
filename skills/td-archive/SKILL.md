---
name: td-archive
description: 完成后归档。OpenSpec 契约层入口。触发场景：用户说"archive"、"归档"、"收工"、"这个 change 完成了"、"结项"。
user-invocable: true
argument-hint: <change-name>
---

# td-archive

change 完成后归档。归档不是删除，是把"已完成的学习"沉淀下来。

## 依赖技能

- `system-engineering`
- `constraint-matrix`

## 服务的主基调原则

**系统工程主基调第 3 条：从定性到定量的综合集成。**

archive 不是"打完勾收工"，是"完成一次从预期到实际的综合集成循环"。archive 前对"实际 vs 预期"的复盘，是这个循环的闭合。

**系统工程主基调第 2 条：总体设计部。**

archive 后触发 profile 重新评估——这是总体设计部的职责：项目状态变化了，工作方式要跟着调整。

## 输入

`$ARGUMENTS`：要 archive 的 change 名。空则用 `AskUserQuestion` 问用户。

## 步骤

### 0. 激活主基调与配置层

**加载技能 `system-engineering` `constraint-matrix`**

- 执行 `constraint-matrix` 的 `## 识别流程`
- 表 1 + 表 2 + 表 3 全部读入——步骤 1 据此判断是否触发 / tasks 是否合规。

### 1. 前置检查

- 所有 tasks.md 里的任务都 `[x]` 了吗？
- `verification-before-completion` 跑过了吗？

### 2. 强制"实际 vs 预期"复盘（硬步骤）

archive 之前**必须**在 change 里补一节"实际系统工程影响 vs 预期"——对照 proposal 的"系统工程影响评估"节，记录：

- 预期影响的分系统 vs 实际影响的分系统
- 预期整体性能变化 vs 实际变化
- 预期之外的副作用（这是后续 `/td-system-audit` 的输入）

没这一节，archive 拒绝继续。这是 `/td-system-audit` "实际 vs 预期"审计的数据来源——闭环必须闭合。

### 3. archive（含 sync）

```bash
openspec archive "<name>"
```

`openspec archive` 会做两件事：
1. 把 change 从 `openspec/changes/` 移到 `openspec/changes/archive/`
2. 自动把 change 产生的 spec delta sync 到主 spec

如果只想归档不同步 specs（infra / doc-only change），加 `--skip-specs`。

### 4. archive 后接力动作

archive 是契约层的"闭合点"，必须触发三个后续接力（顺序执行）：

#### 4.1 profile/tier 重新判读

archive 完一个 change 后，项目的 profile 可能变化（比如 greenfield 走到 maintenance，或 brownfield 进入大重构）。**强制重新调用 `constraint-matrix` 的「识别流程」节**，重新判读 `$_TD_PROFILE` / `$_TD_TIER`。

如果新判读结果与步骤 0 缓存的不同：

- 更新会话缓存为新 profile/tier
- 用 `AskUserQuestion` 提示用户："项目状态已从 `<old-profile>` × `<old-tier>` 变为 `<new-profile>` × `<new-tier>`。后续 constraint 强度按新配置走。"

判读结果与缓存一致 → 跳过提示，不骚扰用户。

#### 4.2 system-audit 频率触发检查

archive 是"完成一个 change"的事件，正好对照 `constraint-matrix` 表 3 的 system-audit 频率。

**持久化计数器**：每次 archive 完成后，读 `openspec/.td-state/archive-counter.yaml`，把 `count` +1，写回文件。文件格式见 `constraint-matrix` 的「持久化层」节，文件由本步骤首次运行时按需创建。

计数达到当前 tier 的阈值（tier-small 5 个 / tier-medium 3 个，查 `archive-counter.yaml` 的 `count`），或距上次 project-scope audit 已满一周（tier-large，查 `openspec/.td-state/audit-history.yaml` 最近一条 `scope: project` 记录的 `timestamp`）→ **主动建议**用户跑 `/td-system-audit project`，不是强制，是"按主基调第 2 条总体设计部职责，该周期性自检了"。

判定优先级：tier-large 走时间驱动（audit-history.yaml），不查 archive-counter 的 count；tier-small / tier-medium 走 count 驱动（archive-counter.yaml），不查时间。单一事实源——count 在 archive-counter，project-audit 时间戳在 audit-history，不交叉。

**null 语义**：`audit-history.yaml` 不存在，或存在但无 `scope: project` 记录 → 视为"从未跑过 project audit"，tier-large 直接建议跑 `/td-system-audit project`。`archive-counter.yaml` 不存在 → 视为 `count: 0`，按当前 archive 事件 +1 后再判阈值（tier-small/medium）。两个文件均由本步骤首次运行时按需创建。

#### 4.3 WIP 释放检查

归档后，活跃 change 数减少。如果之前有因 WIP 限制阻塞的新 change，提示用户："WIP 释放了（当前活跃 `<n>` / 上限 `<limit>`），可以 `/td-propose` 之前想做的 X 了。"

## Guardrails

- **归档后只读**：`openspec/changes/archive/` 下的文件永远不修改
- archive 前必须验证 change 完整性（所有任务 done、所有 artifact 存在）
- 不要 archive 一个还在进行中的 change——如果有未完成任务，先问用户是继续完成还是放弃
