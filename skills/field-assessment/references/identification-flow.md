# 识别流程 + 持久化层

本文件定义 profile/tier 的现场判读流程与 `.td-state/` 持久化约定。每个 td-* skill 的"步骤 1"调用本流程。

## 识别流程

agent 按以下顺序判读，把结果写入工作上下文（变量名建议 `$_TD_PROFILE` / `$_TD_TIER`），后续步骤据此查表 1 / 表 2 / 表 3 的强度（见 `strength-matrix.md`）。

### 1. 读持久化缓存

读 `openspec/.td-state/profile-tier.yaml`。若文件存在且无重判触发（见"### 4. 缓存判读结果"），直接用缓存值，跳到"### 5. 注入强度"。若文件不存在，按"### 2"+"### 3"现判——**本步骤只读不写**，写入职责在"### 4. 缓存判读结果"。文件格式见本文件下方「### profile-tier.yaml 模板」节。

### 2. 判读 profile（三选一，按优先级）

| 优先级 | profile | 判据（全部成立） |
|---|---|---|
| 1 | `profile-maintenance` | 仓库已上线 **且** 有真实用户流量 **且** 有 CI/CD 配置 |
| 2 | `profile-brownfield` | 仓库已有可运行代码（非脚手架）**且** 不满足 maintenance 判据 |
| 3 | `profile-greenfield` | 仓库刚 init / 只有脚手架 / 文件数 < 10 且无业务逻辑 |

判据冲突时按优先级取高的。判据不明确 → 触发 `human-in-loop`，问用户"这是新项目、接手项目、还是上线维护？"。

### 3. 判读 tier（三选一）

| tier | 判据（任一成立即取该 tier，取最高） | 系统层次 |
|---|---|---|
| `tier-large` | 文件数 100+ **或** 多团队 **或** 多仓库 **或** 多部署单元 | 多层嵌套的分系统，可能有跨仓库依赖 |
| `tier-medium` | 文件数 10–100 **或** 单团队多人 **或** 1–3 个部署单元 | 有明显的模块/分系统边界 |
| `tier-small` | 文件数 3–10 **或** 单人/单团队 **或** 1 个部署单元 | 扁平，无明显分系统边界 |

系统有"明显分系统边界"即使文件少，也升级到 `tier-medium`。系统拆成多个独立子系统 → 每个子系统独立定 tier（见 `subsystem-tiering.md`）。

**子系统独立定 tier 的触发**：当「### 2. 判读 profile」识别出 `profile-brownfield` 或 `profile-maintenance`，且 `td-reverse-spec` 步骤 3 已识别出"有明显分系统边界"时，触发子系统独立定 tier。每个子系统按本节判据独立定 tier，结果写入 `openspec/.td-state/profile-tier.yaml` 的 `subsystem-<name>` 条目。

**层次观归位**：本节的 tier 判据是平面维度（文件数、团队规模、部署单元）。子系统独立定 tier 机制把这个平面维度扩展为层次维度——承认复杂巨系统是多层级嵌套结构（主基调第 4 条「层次观」），不同层次的子系统需要分层对待。这不是"tier 判据失效"，而是"tier 判据在每个子系统层次上分别生效"。

### 4. 缓存判读结果

判读结果写入 `openspec/.td-state/profile-tier.yaml` 持久化，跨会话保留。触发重新判读的时机（命中即执行下述"重判策略"）：

- `/td-archive` 完成后（项目状态可能变化）—— archive 步骤 5.1 已负责触发重判
- `/td-system-audit` 发现 profile/tier 与实际不符
- 用户显式说"项目阶段变了"

**重判策略**（td-archive 5.1 / td-system-audit / 用户显式触发都适用）：

1. 读 `profile-tier.yaml` 缓存值（文件不存在 → 视为空缓存，跳到步骤 2 现判）。
2. 重跑「### 2. 判读 profile（三选一，按优先级）」+「### 3. 判读 tier（三选一）」得到新判读结果。
3. 新判读与缓存对比：
   - **一致** → 更新 `judged_at` 时间戳（保持 profile/tier 不变），不提示用户。
   - **不一致** → 覆盖写 `profile-tier.yaml` 为新结果，同步更新 `judge_reason` 字段为新判据（如"greenfield 走到 maintenance,因为已上线 + 有 CI/CD"），由调用方（如 td-archive 5.1）提示用户"项目状态已从 `<old>` 变为 `<new>`"。

重判**不"删缓存文件"**——是"读缓存 → 重判 → 比对 → 按比对结果写回"。

### 5. 注入强度

判读完成后，agent 把表 1（5 个 constraint 在当前 tier 下的强度）+ 表 2（当前 profile 的 human-in-loop 加成）+ 表 3（system-audit 频率）读入上下文，同时按命中的 profile 与 tier 各读一份本目录下的变体文件（共 2 份，见下方「### 变体文件」节）。后续步骤引用这些强度值与变体规则，不再回查本 skill。

**子系统独立定 tier 时的强度注入**：当 `profile-tier.yaml` 含 `subsystems` 条目时，注入强度应**按子系统分别注入**——每个子系统有自己的表 1 / 表 2 强度。跨子系统的依赖链按"最高 tier 子系统"的强度处理（保守原则）。后续步骤引用强度时，需区分"当前操作作用于哪个子系统"。

### 变体文件（profile / tier 的流程侧重与特殊规则）

判读完成后，按命中的 profile 与 tier 各读一份本目录下的变体文件（共 2 份）：

| 维度 | 变体文件 |
|---|---|
| profile | `profile-greenfield.md` / `profile-brownfield.md` / `profile-maintenance.md` |
| tier | `tier-small.md` / `tier-medium.md` / `tier-large.md` |

变体文件承载**流程侧重与特殊规则**——profile 决定入口动作 / TDD 边界 / proposal 重量，tier 决定松绑或加码类特殊规则。constraint 强度数值不在变体文件定义：profile 只决定流程侧重、不叠加表 1 强度，唯一例外是表 2 的 human-in-loop 加成（见 `strength-matrix.md`）；强度单一事实源始终在表 1 / 表 2 / 表 3。

### 下游引用强度的约定

下游 skill 引用表 1 / 表 2 / 表 3 的强度值时，遵循同一约定：

- **强度值由 td-* skill 的"步骤 1"注入会话上下文**——通过 `field-assessment` 的识别流程完成注入。
- **若强度未注入**（如跳过步骤 1、或会话上下文被清理），调 `field-assessment` 识别流程注入后再读。
- **变体文件规则由步骤 1 一并注入**——按命中的 profile 与 tier 各读一份（共 2 份）。若变体文件规则未注入，按步骤 1 判读的 `$_TD_PROFILE` / `$_TD_TIER` 直接读本目录下对应变体文件；不重复定义规则。
- **单一事实源**：强度数值只在 `strength-matrix.md`（表 1 + 表 2）和 `audit-frequency.md`（表 3）定义；与其他位置的强度表述冲突时，以这两处为准。

## 持久化层（.td-state/）

profile/tier 判读结果持久化到 `openspec/.td-state/profile-tier.yaml`。文件由 agent 首次运行识别流程时按需创建，不预置。

### 约定路径

```
openspec/.td-state/
├── profile-tier.yaml        ← field-assessment 维护：profile/tier 判读缓存 + 触发重判的时间戳
├── archive-counter.yaml     ← td-archive 维护：累计归档计数（system-audit 频率触发用）
├── audit-history.yaml       ← td-system-audit 维护：audit 时间戳序列
└── audits/                  ← td-system-audit 维护：每次完整 audit 报告
```

### 文件模板

`profile-tier.yaml` 模板见下方「### profile-tier.yaml 模板」节（识别流程直接读写它，强绑定）。其余持久化文件（archive-counter / audit-history）的模板各自归维护方：

- `archive-counter.yaml` 模板 → `td-archive` 的 `references/archive-counter-template.md`
- `audit-history.yaml` 模板 → `td-system-audit` 的 `references/audit-history-template.md`

### profile-tier.yaml 模板

```yaml
profile: <profile-greenfield | profile-brownfield | profile-maintenance>
tier: <tier-small | tier-medium | tier-large>
judged_at: <ISO8601 时间戳>
judge_reason: <一句话判据，如"已上线 + 有 CI/CD → maintenance；文件 120 个 → large">
# 子系统独立定 tier（可选，仅当系统内部有明显分系统边界时）
subsystems:
  - name: <subsystem-A>
    tier: <tier-small | tier-medium | tier-large>
    judge_reason: <一句话判据>
  - name: <subsystem-B>
    tier: <tier-small | tier-medium | tier-large>
    judge_reason: <一句话判据>
```

**文件不存在时的行为**：agent 调用识别流程时，若 `openspec/.td-state/profile-tier.yaml` 不存在，按下方"### 2. 判读 profile"+"### 3. 判读 tier"现判，判完后创建文件并写入结果。若文件已存在，优先读文件，不重判——除非命中"触发重新判读"的时机。
