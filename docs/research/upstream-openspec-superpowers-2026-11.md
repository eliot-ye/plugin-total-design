# 上游调研：OpenSpec 与 Superpowers（2026-11-26）

> **性质**：调研备忘，非运行时资产。给「是否借鉴上游更新」提供证据基础，本身不改变任何 skill 行为。
> **基线**：total-design v1.20.1（18 skill + 8 command）。
> **结论口径**：所有建议**均未落地**，需各自过「依赖图谱分析 + 重量/价值/代价五节评估」前置门后才可动笔。

## 上游快照

| 上游 | 当前版本 | 近期节奏 | 与本 plugin 的关系 |
|---|---|---|---|
| OpenSpec | v2.2.0 (2026-11-24) | 近 12 个月约 40 个 release | 契约层 td-* 的方法论来源 |
| Superpowers | v7.0.2 (2026-11-03) | v6.2 → v7.0.2，活跃开发 | 行为层 skill 的方法论来源 |

---

## 一、OpenSpec 关键变化（转译契约层的对照面）

来源：<https://github.com/Fission-AI/OpenSpec/releases>

| 变化 | 版本 | 对本 plugin 的意义 |
|---|---|---|
| `/openspec` 路由 skill（语义分派 12 个 workflow skill） | v2.2.0 | 命令入口的组织方式参考 |
| skill 装 `.agents/skills/`、删 `/opsx:*` 命令 | v2.0.0 | 与本 plugin「多平台加载同一份 skills/」同向 |
| **schema / artifact 状态机**（done/ready/blocked/skipped） | v1.x | artifact 依赖可查询 |
| **`skip_specs: true`** 逃生阀（纯重构/文档免 spec delta） | v1.7.0 | td-propose/archive 的逃生阀 |
| **proposal Capabilities 清点纪律**（先 `list --specs` 再 `show`） | v2.x | 跨能力契约重叠（#2292） |
| Stores（跨 repo spec，beta） | v1.5.0 | beta，暂不跟进 |

**社区高频痛点**：skill（Markdown）↔ CLI（结构化输出）契约一致性（#2166 apply skill 忽略 warnings / #2289 sync-specs 覆盖 ADDED）。

---

## 二、Superpowers 关键变化（转译行为层的对照面）

来源：<https://github.com/obra/superpowers> + 作者博客 <https://blog.fsck.com>

| 变化 | 版本 | 对本 plugin 的意义 |
|---|---|---|
| **正向指令学说**（实证：组合型禁令反而更差） | v6.2 规格文档 | 直击「可精简/触发歧义」审核维度 |
| **ceremony scales to task**（spike/bounded/arch 自动判读） | v6.3.0 | 与 profile × tier 同构，可补运行时判请求体量 |
| **TDD green 收严**（验证范围 ≠ 交付范围） | v7.0.x | test-driven-development / verification-before-completion |
| **brainstorming「ask why first + 给草图选项」** | v7.0.1 (#2530) | 对应 td-explore |
| **diagnosing-superpowers**（会话跑偏→证据化诊断） | v6.4 | td-system-audit 的会话级粒度补充 |
| review 预烘焙证据包 + 合并审查轴（−50% 时间 −60% token） | v6 | requesting-review 降本（需权衡是否引第二轴） |

---

## 三、借鉴建议清单（按优先级，含核对状态）

### P0

**1. 正向指令学说 → 落地 `docs/maintainer/content-authoring.md` + 全 skill 审核**
- 证据：实证规格测得「对模型自己要产出内容下禁令」→ 4.4 条 spec 被重打，比无指导(3.6)更差；改正向 recipe → 3.0 零方差。五条判据可直接抄。
- 价值来源：工程导向（不做→使用态 LLM 真被禁令带偏）。
- 状态：**待做**。blast radius 大（field-assessment 热点），须先出图谱。

### 已覆盖，无需动

**#2166 类 skill↔CLI warnings 契约**
- 核对结论：本 plugin 对 CLI `warning`/`--json` 输出处理已完善——`td-archive` 步骤 4 明确"命中与否以输出中的 warning 为准，不看退出码"（正是 OpenSpec #2166 踩的坑）。且架构上 validate 归 `td-propose`/`td-archive` 把关，`td-apply` 不直接调 CLI 校验。
- 状态：**当前结构下风险低，不构成改动项**。

### P1

| 借鉴点 | 落点 | 状态 |
|---|---|---|
| ceremony scales to task（运行时判请求体量） | field-assessment tier 判读 | 待评估 |
| 验证范围 ≠ 交付范围（TDD green 收严） | test-driven-development / verification-before-completion | 待评估 |
| brainstorming「ask why first + 草图选项」 | td-explore | 待评估 |
| proposal Capabilities 清点纪律 | td-propose | 待评估 |

### P2 / 观察

- `skip_specs: true` 逃生阀 → td-propose/archive（待确认现有流程是否已覆盖）
- review 预烘焙证据包 → requesting-review（缩窄：只借鉴喂 diff 包降本）
- diagnosing 式会话级复盘 → td-system-audit 补粒度
- Stores(beta) → 仅文档说明透传

### 不建议跟进

- 跨 harness manifest 矩阵（痛点已被「多平台加载同一份 skills/」消化）
- toolsmith 独立 plugin 模式（与「除 DSH 薄包装层无 JS」相悖）
- 自定义 schema 校验 #2242（CLI 侧职责，本 plugin 不重实现）

---

## 四、建议落地切分

若推进，分两个独立 change，各自过前置门：

1. **content-authoring 正向指令改写**（借鉴 P0 #1）——docs + 全 skill 审核重写，blast radius 大，先出图谱。
2. **契约层 proposal 清点纪律**（借鉴 P1 #6）——td-propose 强化 Capabilities 清点，范围收敛、低风险。

---

## 主要来源

- OpenSpec releases：<https://github.com/Fission-AI/OpenSpec/releases>
- OpenSpec schema：<https://github.com/Fission-AI/OpenSpec/blob/main/schemas/spec-driven/schema.yaml>
- OpenSpec issue #2166 / #2289 / #2242 / #2292
- Superpowers repo：<https://github.com/obra/superpowers>
- Superpowers 正向指令规格：<https://raw.githubusercontent.com/obra/superpowers/main/docs/superpowers/specs/2026-06-10-positive-instruction-redesign-design.md>
- 博客：<https://blog.fsck.com/2026/10/09/what-a-year/> · <https://blog.fsck.com/2026/09/21/superpowers-6.4/> · <https://blog.fsck.com/2026/06/15/Superpowers-6/>