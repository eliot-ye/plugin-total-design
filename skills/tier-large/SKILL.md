---
name: tier-large
description: 大型系统复杂度 tier。100+ 文件 / 多团队 / 多仓库。constraints 强制，system-audit 周期性，要求总体设计文档。
user-invocable: false
---

# Tier: Large（大型系统）

## 判断依据

- 文件数：100+
- 团队规模：多团队
- 部署单元：多个
- 系统层次：多层嵌套的分系统，可能有跨仓库依赖

## constraint 强度

强度本身见 `constraint-matrix` skill 的表 1。本 tier 的注解：

- `wip-limit`：大系统并行硬解 = 失控
- `critical-buffer`：不确定性最高
- `brooks-law`：大系统加人手几乎必然拖慢，强制
- `delay-decision`：强
- `human-in-loop`：+ 总体设计文档审阅

## system-audit 频率

- 每完成 1 个 change 跑 `current-change` scope
- 每周跑一次 `project` scope（大系统需要周期性总体设计部审视）

## 特殊规则

### 1. 总体设计文档必填

large 系统的每个 change，proposal 里必须附"总体设计文档"：

- 这个改动在系统层次里的位置
- 影响的所有分系统
- 与最近 archive 的 change 的关系
- 是否触发跨分系统协调

没这份文档，不允许 `/td-apply`。

### 2. WIP 限制 = 3

大系统并行硬解几乎必然制造失调。同一时刻至多允许 3 个活跃 change。

如果用户坚持要并行，触发 `brooks-law` 强制提醒，并要求用户显式确认风险。

### 3. 关键链 buffer = 50%

大系统的不确定性最高——集成问题、跨团队协调、生产环境意外。50% buffer 不是"浪费"，是"必然需要的容量"。

### 4. 周期性 system-audit

大系统的"局部优化制造全局失调"风险最高。每周一次 `project` scope audit 是底线。

audit 报告里特别关注：

- 最近是否有分系统在做"自己最优但损害邻居"的改动
- 关键链 buffer 是否被压缩
- 是否有"应该触发 human-in-loop 但没触发"的决策

## 与其他 tier 的切换

- 系统简化到 100 文件以下 → 切 `tier-medium`
- 系统拆分成多个独立子系统 → 每个子系统独立定 tier
