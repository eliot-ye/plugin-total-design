---
name: td-archive
description: 完成后归档。OpenSpec 契约层入口。触发场景：用户说"archive"、"归档"、"收工"、"这个 change 完成了"、"结项"。
user-invocable: true
argument-hint: <change-name>
aliases:
  atomcode: total-design:td-archive
  claude-code: total-design:td-archive
  cursor: td-archive
---

# td-archive

## 平台命名

本 skill 在不同平台下的调用名：

| 平台 | 调用名 |
|---|---|
| atomcode | `total-design:td-archive` |
| Claude Code | `total-design:td-archive` |
| Cursor / 其他 | `td-archive` |

本文 body 里引用其他 skill 时一律用**逻辑名**（如 `wip-limit`、`human-in-loop`），由当前平台的加载器负责拼前缀。

change 完成后归档。归档不是删除，是把"已完成的学习"沉淀下来。

## 服务的主基调原则

**系统工程主基调第 3 条：从定性到定量的综合集成。**

archive 不是"打完勾收工"，是"完成一次从预期到实际的综合集成循环"。archive 前对"实际 vs 预期"的复盘，是这个循环的闭合。

**系统工程主基调第 2 条：总体设计部。**

archive 后触发 profile 重新评估——这是总体设计部的职责：项目状态变化了，工作方式要跟着调整。

## 输入

`$ARGUMENTS`：要 archive 的 change 名。空则用 `AskUserQuestion` 问用户。

## 步骤

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

### 4. 触发 profile/tier 重新评估

archive 完一个 change 后，项目的 profile 可能变化（比如 greenfield 走到 maintenance）。提示用户：

> "已完成 change `<name>` 的 archive。项目状态可能变化，建议重新评估 profile（当前：`<current-profile>`）。要重新评估吗？"

如果要，触发 profile 识别 skill。

### 4. 检查 WIP 是否释放

归档后，活跃 change 数减少。如果之前有因 WIP 限制阻塞的新 change，提示用户："WIP 释放了，可以 `/td-propose` 之前想做的 X 了。"

## Guardrails

- **归档后只读**：`openspec/changes/archive/` 下的文件永远不修改
- archive 前必须验证 change 完整性（所有任务 done、所有 artifact 存在）
- 不要 archive 一个还在进行中的 change——如果有未完成任务，先问用户是继续完成还是放弃
