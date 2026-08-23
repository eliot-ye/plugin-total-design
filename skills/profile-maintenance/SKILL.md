---
name: profile-maintenance
description: 上线维护项目 profile。仓库已上线，有真实用户。轻量 proposal，bug 走 systematic-debugging。
user-invocable: false
---

# Profile: Maintenance（上线维护）

## 触发条件

- 仓库已上线，有真实用户流量
- 有 CI/CD 配置
- 最近 git log 有"hotfix" / "rollback" / "prod" 等字样

## 默认激活的层

| 层 | 强度 |
|---|---|
| OpenSpec 契约层 | **中**：proposal 轻量化，spec delta 小步走 |
| 行为层（skills） | **中**：新功能走 TDD，bug 走 systematic-debugging |
| 工程管理约束层 | **强**：瓶颈=部署/审查，缓冲留给回归测试 |

## 在各 tier 下的 constraint 强度

强度由 `field-assessment` 单一判定（表 1 / 表 2，见 `field-assessment/references/strength-matrix.md`）。本 profile 不再加成其余 4 个 constraint——强度由 tier 决定，profile 只决定流程侧重。

## 特殊规则

### 1. 生产环境改动前必触发 human-in-loop

涉及生产环境的改动（部署、迁移、权限、数据修改），agent **必须**停下来问用户。不得自行推进。这属 `human-in-loop` 通用基线第 3 类（生产环境影响），所有 profile × tier 生效（表 2 的 maintenance "+ 生产环境改动前"加成与基线重叠，只是强调，不改变强度）。

### 2. bug 走 systematic-debugging

线上 bug 修复流程：

1. `systematic-debugging` 4-phase 找 root cause
2. 修复 root cause，不修症状
3. 加回归测试
4. `verification-before-completion` 跑全量测试
5. commit message 注明 root cause

### 3. critical-buffer 的应用

maintenance 现场的瓶颈通常是：

- 部署 pipeline（能不能快速安全上线）
- 代码审查（review 周期长）

buffer 留给瓶颈——不要让"看起来很快"的 hotfix 压缩了审查 buffer。

### 4. 轻量 proposal

maintenance 不需要 greenfield 那么重的 proposal。proposal 可以短到：

```markdown
## Proposal: <change name>

### 问题
<一两句话>

### 改动
<一两句话>

### 系统工程影响评估
- 影响的分系统：<...>
- 整体性能变化：<...>
- 局部 vs 全局：<...>
```

但"系统工程影响评估"节**不能省**。

## 与其他 profile 的切换

- 系统进入"大重构"阶段 → 临时切 `profile-brownfield`（因为相当于重新接手）
- 刚上线还没用户 → 实际是 `profile-brownfield`，不要急着切 maintenance
