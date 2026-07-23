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

## 表 2：3 个 profile 在 human-in-loop 上的场景加成

| profile | tier-small | tier-medium | tier-large |
|---|---|---|---|
| `profile-greenfield` | — | + 公共契约变更 | + 总体设计文档审阅 |
| `profile-brownfield` | — | + 改老代码前 | + 总体设计文档必填 |
| `profile-maintenance` | — | + 生产环境改动前 | + 所有 constraint 强制 + system-audit 周期性 |

"—" 表示该格无 profile 场景加成，仅用表 1 第 5 行的 tier 基线。3 个 profile 在 tier-small 下都没有超出 tier 基线的加成。

最终 human-in-loop 强度 = `human-in-loop` skill 的 5 类通用基线 ∪ 表 1 第 5 行 tier 加成 ∪ 表 2 profile 场景加成。三者叠加，不替换。

## 表 3：system-audit 频率

| tier | project scope | current-change scope |
|---|---|---|
| `tier-small` | 每完成 5 个 change | 不要求 |
| `tier-medium` | 每完成 3 个 change | 每个关键链任务完成时 |
| `tier-large` | 每周一次 | 每完成 1 个 change |

## 如何被引用

3 个 profile skill（`profile-greenfield` / `profile-brownfield` / `profile-maintenance`）和 3 个 tier skill（`tier-small` / `tier-medium` / `tier-large`）在"## 在各 tier 下的 constraint 强度"或"## constraint 强度"小节引用本 skill 的表 1 与表 2，并补充本 profile / tier 的特殊加成。

agent 在激活任意 constraint skill 时，应同时查本 skill 确认当前 profile × tier 下的强度。

## 识别流程（profile × tier 单一入口）

每个 td-* skill 的"步骤 0"调用本节。agent 按以下顺序判读，把结果写入工作上下文（变量名建议 `$_TD_PROFILE` / `$_TD_TIER`），后续步骤据此查表 1 / 表 2 / 表 3 的强度。

### 1. 判读 profile（三选一，按优先级）

| 优先级 | profile | 判据（全部成立） |
|---|---|---|
| 1 | `profile-maintenance` | 仓库已上线 **且** 有真实用户流量 **且** 有 CI/CD 配置 |
| 2 | `profile-brownfield` | 仓库已有可运行代码（非脚手架）**且** 不满足 maintenance 判据 |
| 3 | `profile-greenfield` | 仓库刚 init / 只有脚手架 / 文件数 < 10 且无业务逻辑 |

判据冲突时按优先级取高的。判据不明确 → 触发 `human-in-loop`，问用户"这是新项目、接手项目、还是上线维护？"。

### 2. 判读 tier（三选一）

| tier | 判据（任一成立即取该 tier，取最高） |
|---|---|
| `tier-large` | 文件数 100+ **或** 多团队 **或** 多仓库 **或** 多部署单元 |
| `tier-medium` | 文件数 10–100 **或** 单团队多人 **或** 1–3 个部署单元 |
| `tier-small` | 文件数 3–10 **或** 单人/单团队 **或** 1 个部署单元 |

系统有"明显分系统边界"即使文件少，也升级到 `tier-medium`。系统拆成多个独立子系统 → 每个子系统独立定 tier。

### 3. 缓存判读结果

判读结果在工作会话内缓存，不每次步骤 0 都重判。触发重新判读的时机：

- `/td-archive` 完成后（项目状态可能变化）
- `/td-system-audit` 发现 profile/tier 与实际不符
- 用户显式说"项目阶段变了"

### 4. 注入强度

判读完成后，agent 把表 1（5 个 constraint 在当前 tier 下的强度）+ 表 2（当前 profile 的 human-in-loop 加成）+ 表 3（system-audit 频率）读入上下文。后续步骤引用这些强度值，不再回查本 skill。
