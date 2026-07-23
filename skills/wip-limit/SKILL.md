---
name: wip-limit
description: 限制同时活跃的 change 数量。服务系统工程主基调第 4 条"开放的复杂巨系统不能并行硬解"。
user-invocable: false
---

# WIP 限制

## 服务的主基调原则

**系统工程主基调第 4 条：开放的复杂巨系统。** 复杂巨系统不能并行硬解。同时开太多 change，彼此的相互作用无法被 agent 同时持有——每个 change 都半途而废，整体性能下降。

## 规则

同时活跃的 change 数量上限：

| tier | WIP 上限 |
|---|---|
| `tier-small` | 3 |
| `tier-medium` | 2 |
| `tier-large` | 1 |

"活跃"定义：已经 `/td-propose` 但还没 `/td-archive` 的 change。

## 触发时机

- 用户想 `/td-propose` 一个新 change，但活跃 change 数已达上限
- 用户想同时推进多个 change

## 触发时 agent 应做的事

1. 报告当前活跃 change 列表 + WIP 上限
2. 提示用户："已达 WIP 上限。建议先 archive 或 finish 现有 change 再起新的。"
3. 不强制阻塞——这是纪律不是枷锁——但必须让用户意识到"你在并行硬解一个复杂系统"

## 不做的事

- 不自动 archive 用户的 change
- 不隐藏规则让用户"自由发挥"——自由发挥在复杂系统里就是失控
