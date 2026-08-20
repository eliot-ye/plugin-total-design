# 强度矩阵（单一事实源）

本文件是所有 profile / tier / constraint skill 引用的**唯一事实源**。两张表定义 profile × tier × constraint 的强度配置。改强度只改本文件。

## 表 1：5 个 constraint 在 3 个 tier 下的强度

| constraint | tier-small | tier-medium | tier-large |
|---|---|---|---|
| `wip-limit` | 上限 5 | 上限 4 | 上限 3 |
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

表 3（system-audit 频率）见 `audit-frequency.md`——audit 频率的共现方与 constraint 强度不同，独立成文件。
