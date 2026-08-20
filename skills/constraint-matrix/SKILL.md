---
name: constraint-matrix
description: 激活任意 constraint skill 时，应同时查本 skill 确认当前 profile × tier 下的强度
user-invocable: false
---

# Constraint 强度矩阵（单一事实源）

本 skill 是所有 profile / tier skill 引用的**唯一事实源**。

## 服务的主基调原则

**系统工程主基调第 4 条：开放的复杂巨系统。** 复杂巨系统不能套同一套 constraint 强度——必须按系统规模（tier）和现场状态（profile）分层对待。本矩阵是这个原则的工程化体现。

## 表 1：5 个 constraint 在 3 个 tier 下的强度

| constraint | tier-small | tier-medium | tier-large |
|---|---|---|---|
| `wip-limit` | 上限 5 | 上限 4 | 上限 3 |
| `critical-buffer` | 20% project buffer | 35% project buffer | 50% project buffer |
| `brooks-law` | 不强制 | 提醒 | 强制 |
| `delay-decision` | 强 | 强 | 强 |
| `human-in-loop` | 仅不可逆决策 | + 公共契约变更 | + 总体设计文档审阅 |

### 子系统独立定 tier（层次观归位，主基调第 4 条）

表 1 的 tier-small / tier-medium / tier-large 是**平面**维度，没有处理"系统内部的层次性"。钱学森系统工程强调"系统的层次结构"（主基调第 4 条「层次观」），复杂巨系统是多层级嵌套结构——一个 tier-large 的多仓库系统，每个仓库可能是 tier-small；一个 tier-large 的微服务系统，每个微服务可能是 tier-medium。

**子系统独立定 tier 机制**：

- **触发条件**：`td-reverse-spec` 步骤 3「分系统切分」识别出"有明显分系统边界"时，或 `td-init` / `/td-system-audit` project scope 发现"系统层次跨 tier 边界"时。
- **执行规则**：每个子系统独立按表 1 的 tier 判据定 tier。跨子系统的依赖链按"最高 tier 子系统"的强度处理（保守原则——按最复杂的子系统对待跨子系统边界）。
- **持久化**：`openspec/.td-state/profile-tier.yaml` 支持多子系统条目（每个子系统一条 `subsystem-<name>` 记录），文件模板见 `references/file-templates.md`。
- **与 `td-apply` 步骤 7.2 的协同**：跨分系统边界验证的 tier 分层强度，按"受影响分系统中最高 tier"处理——避免"tier-small 子系统和 tier-large 子系统之间的边界只用冒烟级集成验证"的疏漏。

这不是把"一个 tier-large 的关键链"拆成"多个 tier-small 的关键链"——而是承认复杂巨系统是多层级嵌套结构，不同层次的子系统需要分层对待。

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

**子系统独立定 tier 时的频率**：当系统内部有子系统独立定 tier 时，project scope audit 频率按"最高 tier 子系统"处理（保守原则），current-change scope audit 频率按"当前 change 所跨子系统中最高 tier"处理。

## 如何被引用

agent 在激活任意 constraint skill 时，应同时查本 skill 确认当前 profile × tier 下的强度。

## 持久化层（.td-state/）

profile/tier 判读结果持久化到 `openspec/.td-state/profile-tier.yaml`。文件由 agent 首次运行识别流程时按需创建，不预置。

### 约定路径

```
openspec/.td-state/
├── profile-tier.yaml        ← 本 skill 维护：profile/tier 判读缓存 + 触发重判的时间戳
├── archive-counter.yaml     ← td-archive 维护：累计归档计数（system-audit 频率触发用）
├── audit-history.yaml       ← td-system-audit 维护：audit 时间戳序列
├── critical-buffer.yaml     ← critical-buffer 维护：关键链缓冲消耗
└── audits/                  ← td-system-audit 维护：每次完整 audit 报告
```

### 文件模板

各文件的 YAML 模板见本 skill 的 `references/file-templates.md`（profile-tier / archive-counter / audit-history 三份）。本文件不重复模板内容，引用该文件即可。

**文件不存在时的行为**：agent 调用识别流程时，若 `openspec/.td-state/profile-tier.yaml` 不存在，按下方"### 2. 判读 profile"+"### 3. 判读 tier"现判，判完后创建文件并写入结果。若文件已存在，优先读文件，不重判——除非命中"触发重新判读"的时机。

## 识别流程

每个 td-* skill 的"步骤 1"调用本节。agent 按以下顺序判读，把结果写入工作上下文（变量名建议 `$_TD_PROFILE` / `$_TD_TIER`），后续步骤据此查表 1 / 表 2 / 表 3 的强度。

### 1. 读持久化缓存

读 `openspec/.td-state/profile-tier.yaml`。若文件存在且无重判触发（见"### 4. 缓存判读结果"），直接用缓存值，跳到"### 5. 注入强度"。若文件不存在，按"### 2"+"### 3"现判——**本步骤只读不写**，写入职责在"### 4. 缓存判读结果"。文件格式见上方"持久化层"节。

### 2. 判读 profile（三选一，按优先级）

| 优先级 | profile | 判据（全部成立） |
|---|---|---|
| 1 | `profile-maintenance` | 仓库已上线 **且** 有真实用户流量 **且** 有 CI/CD 配置 |
| 2 | `profile-brownfield` | 仓库已有可运行代码（非脚手架）**且** 不满足 maintenance 判据 |
| 3 | `profile-greenfield` | 仓库刚 init / 只有脚手架 / 文件数 < 10 且无业务逻辑 |

判据冲突时按优先级取高的。判据不明确 → 触发 `human-in-loop`，问用户"这是新项目、接手项目、还是上线维护？"。

### 3. 判读 tier（三选一）

| tier | 判据（任一成立即取该 tier，取最高） |
|---|---|
| `tier-large` | 文件数 100+ **或** 多团队 **或** 多仓库 **或** 多部署单元 |
| `tier-medium` | 文件数 10–100 **或** 单团队多人 **或** 1–3 个部署单元 |
| `tier-small` | 文件数 3–10 **或** 单人/单团队 **或** 1 个部署单元 |

系统有"明显分系统边界"即使文件少，也升级到 `tier-medium`。系统拆成多个独立子系统 → 每个子系统独立定 tier。

**子系统独立定 tier 的触发**：当「### 2. 判读 profile」识别出 `profile-brownfield` 或 `profile-maintenance`，且 `td-reverse-spec` 步骤 3 已识别出"有明显分系统边界"时，触发子系统独立定 tier。每个子系统按本节判据独立定 tier，结果写入 `openspec/.td-state/profile-tier.yaml` 的 `subsystem-<name>` 条目。

**层次观归位**：本节的 tier 判据是平面维度（文件数、团队规模、部署单元）。子系统独立定 tier 机制把这个平面维度扩展为层次维度——承认复杂巨系统是多层级嵌套结构（主基调第 4 条「层次观」），不同层次的子系统需要分层对待。这不是"tier 判据失效"，而是"tier 判据在每个子系统层次上分别生效"。

### 4. 缓存判读结果

判读结果写入 `openspec/.td-state/profile-tier.yaml` 持久化，跨会话保留。触发重新判读的时机（命中即删除 profile-tier.yaml 的缓存值、重跑"### 2"+"### 3"）：

- `/td-archive` 完成后（项目状态可能变化）—— archive 步骤 5.1 已负责触发重判
- `/td-system-audit` 发现 profile/tier 与实际不符
- 用户显式说"项目阶段变了"

### 5. 注入强度

判读完成后，agent 把表 1（5 个 constraint 在当前 tier 下的强度）+ 表 2（当前 profile 的 human-in-loop 加成）+ 表 3（system-audit 频率）读入上下文。后续步骤引用这些强度值，不再回查本 skill。

**子系统独立定 tier 时的强度注入**：当 `profile-tier.yaml` 含 `subsystems` 条目时，注入强度应**按子系统分别注入**——每个子系统有自己的表 1 / 表 2 强度。跨子系统的依赖链按"最高 tier 子系统"的强度处理（保守原则）。后续步骤引用强度时，需区分"当前操作作用于哪个子系统"。
