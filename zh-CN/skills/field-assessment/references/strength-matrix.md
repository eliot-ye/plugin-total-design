# 强度矩阵（单一事实源）

本文件是表 1 + 表 2 的单一事实源，下游 skill 通过 `field-assessment` 识别流程读入（见 `identification-flow.md` 的「### 5. 注入强度」节）。改强度只改本文件。

## 表 1：5 个 constraint 在 3 个 tier 下的强度

| constraint | tier-small | tier-medium | tier-large |
|---|---|---|---|
| `wip-limit` | 上限 5 | 上限 4 | 上限 3 |
| `critical-buffer` | 20% project buffer | 35% project buffer | 50% project buffer |
| `brooks-law` | 不强制 | 提醒 | 强制 |
| `delay-decision` | 强 | 强 | 强 |
| `human-in-loop` | — | — | + 总体设计文档审阅 |

### 表 1 第 5 行（human-in-loop）语义说明

**表 1 第 5 行是叠加在 `human-in-loop` skill 的第 1–5 类通用基线之上的 tier 额外触发条件，不是绝对强度值。** 第 1–5 类通用基线在所有 profile × tier 下都生效——这是"必须停"的下限。

- tier-small"—"：无额外 tier 触发条件，仅用第 1–5 类通用基线。
- tier-medium"—"：无额外 tier 触发条件，仅用第 1–5 类通用基线（"公共契约变更"属基线第 1 类，所有 tier 生效，不在此重复列为 tier 加成）。
- tier-large"+ 总体设计文档审阅"：基线之外，总体设计文档需要审阅时额外触发 human-in-loop。

### 表 1 critical-buffer 行计算基准

**project buffer = 关键链总估时 × 表 1 critical-buffer 行比例**（按当前 tier）。不是单个任务估时的累加，不是项目总工期的比例。

**feeding buffer**：支流汇入点的 feeding buffer 比例 = **支流链估时 × 表 1 critical-buffer 行同 tier 比例**。feeding buffer 与 project buffer 用同一比例，只是计算基准换成支流链估时。

tier-small 20% project buffer 偏低于 CCPM 标准（通常 30%）。tier-small 保留 20% 是基于小系统低不确定性的假设；如果 tier-small 项目实际有高不确定性（如新技术栈、不熟悉的 domain），agent 应主动建议提升 buffer 比例到 30%。

### 表 1 注解（3 tier × 5 constraint）

本表是三个 tier skill 的「constraint 强度」注解合并而来，避免三处重复。

| constraint | tier-small 注解 | tier-medium 注解 | tier-large 注解 |
|---|---|---|---|
| `wip-limit` | 小系统允许稍微并行 | 中系统并行开始有协调成本 | 大系统并行硬解 = 失控 |
| `critical-buffer` | 不确定性较低 | 不确定性中等 | 不确定性最高 |
| `brooks-law` | 小团队加人手影响有限，不强制 | 中团队加人手要考虑 onboarding，提醒 | 大系统加人手几乎必然拖慢，强制 |
| `delay-decision` | 表 1 说"强"（三个 tier 都强）。小系统回滚成本低，更该延迟——这是"强"在小系统的具体含义 | 强 | 强（仅模块层以下延迟；顶层架构进 tier-large 总体设计文档，不靠延迟决策处理） |
| `human-in-loop` | —（无额外 tier 触发条件，仅用 human-in-loop skill 的第 1–5 类通用基线） | —（同 tier-small；公共契约变更属基线第 1 类，不重复列为 tier 加成） | + 总体设计文档审阅 |

## 表 2：profile 在 human-in-loop 上的场景加成

表 2 只列 **profile 独有**的场景加成——tier 基线的额外触发条件已在表 1 第 5 行定义，自动叠加，不在表 2 重复。

| profile | tier-small | tier-medium | tier-large |
|---|---|---|---|
| `profile-brownfield` | — | + 改老代码前 | + 改老代码前 |
| `profile-maintenance` | — | + 生产环境改动前 | — |

`profile-greenfield` 无超出 tier 基线的独有场景加成（其强度即表 1 第 5 行的 tier 基线），不单列。

"—" 表示该格无 profile 场景加成，仅用表 1 第 5 行的 tier 基线。2 个有加成的 profile 在 tier-small 下都没有超出 tier 基线的加成。

最终 human-in-loop 强度 = `human-in-loop` skill 的第 1–5 类通用基线 ∪ 表 1 第 5 行 tier 加成 ∪ 表 2 profile 场景加成。三者叠加，不替换。

### 表 2 profile-maintenance × tier-large 说明

maintenance × large 下的强度由 tier-large 表 1 行决定（wip-limit 上限 3 / critical-buffer 50% / brooks-law 强制 / delay-decision 强 / human-in-loop + 总体设计文档审阅）。profile-maintenance 只决定流程侧重（轻量 proposal + 生产稳定性），不改变这些强度。

system-audit 周期性由表 3（`audit-frequency.md`）决定，不在表 2 范围内。

表 3（system-audit 频率）见 `audit-frequency.md`——audit 频率的共现方与 constraint 强度不同，独立成文件。
