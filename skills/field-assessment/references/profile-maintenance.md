# Profile: Maintenance（上线维护）

本文件是 `field-assessment` profile 维度三变体之一。判读命中 `profile-maintenance` 后读本文件（判据见 `identification-flow.md`「### 2. 判读 profile（三选一，按优先级）」节）。

## 默认激活的层

| 层 | 强度 |
|---|---|
| OpenSpec 契约层 | **中**：proposal 轻量化，spec delta 小步走 |
| 行为层（skills） | **中**：新功能走 TDD，bug 走 systematic-debugging |
| 工程管理约束层 | **强**：瓶颈=部署/审查，缓冲留给回归测试 |

## 特殊规则

### 1. 生产环境改动前必触发 human-in-loop

涉及生产环境的改动（部署、迁移、权限、数据修改），agent **必须**停下来问用户。不得自行推进。这属 `constraints` 的 `references/human-in-loop.md` 通用基线第 3 类（生产环境影响），所有 profile × tier 生效（表 2 的 maintenance "+ 生产环境改动前"加成与基线重叠，只是强调，不改变强度）。

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
- 影响哪些分系统：<...>
- 整体性能预期变化：<...>
- 这是局部优化还是全局协调：<...>
- 如果是局部优化，对全局失调的风险：<...>
- 预期行为模型：<...>
```

字段与 `/td-propose` 步骤 6.c 的必填项一致（5 项全必填，字段名同步对齐）；"轻量"指篇幅与论述深度，**不减少必填字段**。没有"预期行为模型"的 proposal 不算 apply-ready。

## 与其他 profile 的切换

- 系统进入"大重构"阶段 → 临时切 `profile-brownfield`（变体文件 `profile-brownfield.md`；因为相当于重新接手）
- 刚上线还没用户 → 实际是 `profile-brownfield`（变体文件 `profile-brownfield.md`），不要急着切 maintenance
