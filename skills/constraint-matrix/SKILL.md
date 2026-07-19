---
name: constraint-matrix
description: profile × tier × constraint 强度矩阵的单一事实源。3 个 profile 和 3 个 tier skill 引用本 skill，强度只在这里改。
user-invocable: false
---

# Constraint 强度矩阵（单一事实源）

本 skill 是所有 profile / tier skill 引用的**唯一事实源**。改强度只改本 skill，不要在 3 个 profile 文件和 3 个 tier 文件里各自重写——那些文件只描述"判断依据"和"特殊规则"，强度本身查本 skill。

## 服务的主基调原则

**系统工程主基调第 4 条：开放的复杂巨系统。** 复杂巨系统不能套同一套 constraint 强度——必须按系统规模（tier）和现场状态（profile）分层对待。本矩阵是这个原则的工程化体现。

## 表 1：5 个 constraint 在 3 个 tier 下的强度

| constraint | tier-small | tier-medium | tier-large |
|---|---|---|---|
| `wip-limit` | 上限 3 | 上限 2 | 上限 1 |
| `critical-buffer` | 20% project buffer | 35% project buffer | 50% project buffer |
| `brooks-law` | 不强制 | 提醒 | 强制 |
| `delay-decision` | 强 | 强 | 强 |
| `human-in-loop` | 仅不可逆决策 | + 公共契约变更 | + 总体设计文档审阅 |

## 表 2：3 个 profile 在 human-in-loop 上的额外触发条件

| profile | tier-small | tier-medium | tier-large |
|---|---|---|---|
| `profile-greenfield` | 仅不可逆决策 | + 公共契约变更 | + 总体设计文档审阅 |
| `profile-brownfield` | 仅不可逆决策 | + 改老代码前 | + 总体设计文档必填 |
| `profile-maintenance` | 仅不可逆决策 | + 生产环境改动前 | + 所有 constraint 强制 + system-audit 周期性 |

profile 决定 human-in-loop 的"场景加成"，tier 决定其余 4 个 constraint 的强度。两者正交叠加。

## 表 3：system-audit 频率

| tier | project scope | current-change scope |
|---|---|---|
| `tier-small` | 每完成 5 个 change | 不要求 |
| `tier-medium` | 每完成 3 个 change | 每个关键链任务完成时 |
| `tier-large` | 每周一次 | 每完成 1 个 change |

## 如何被引用

3 个 profile skill（`profile-greenfield` / `profile-brownfield` / `profile-maintenance`）和 3 个 tier skill（`tier-small` / `tier-medium` / `tier-large`）在"## 在各 tier 下的 constraint 强度"或"## constraint 强度"小节引用本 skill 的表 1 与表 2，并补充本 profile / tier 的特殊加成。

agent 在激活任意 constraint skill 时，应同时查本 skill 确认当前 profile × tier 下的强度。
