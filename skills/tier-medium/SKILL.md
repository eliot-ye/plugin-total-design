---
name: tier-medium
description: 中型系统复杂度 tier。10-100 文件，多模块。constraints 中等强制，system-audit 每个重大改动后。
user-invocable: false
---

# Tier: Medium（中型系统）

## 判断依据

- 文件数：10–100
- 团队规模：单团队多人
- 部署单元：1–3 个
- 系统层次：有明显的模块/分系统边界

## constraint 强度

强度本身见 `constraint-matrix` skill 的表 1。本 tier 的特殊说明：

- `wip-limit` 上限 2：中系统并行开始有协调成本
- `critical-buffer` 35% project buffer：不确定性中等
- `brooks-law` 提醒：中团队加人手要考虑 onboarding
- `delay-decision` 强
- `human-in-loop` + 公共契约变更

## system-audit 频率

- 每完成 3 个 change 跑一次 `project` scope
- 每个关键链任务完成时跑 `current-change` scope

## 特殊规则

### 1. 分系统边界显式化

medium 系统的常见问题是"分系统边界模糊"。在 reverse-spec 时，把分系统边界画出来，作为后续改动的影响评估依据。

### 2. 公共契约变更触发 human-in-loop

medium 系统里，API 形状、数据库 schema、配置格式这些"公共契约"开始有跨分系统影响。改这些前必触发 human-in-loop。

### 3. 关键链诊断

medium 系统的关键链通常不是单任务序列，而是"分系统 A 改 → 等分系统 B 改 → 集成测试"。识别这条链，buffer 留在集成测试上。

## 与其他 tier 的切换

- 文件数增长到 100+ → 切 `tier-large`
- 系统简化到 10 文件以下 → 切 `tier-small`
