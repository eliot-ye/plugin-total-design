# 设计讨论：td-propose 轻量通道——任务粒度维度

> 状态：设计讨论稿（v3 修订版），未进入执行阶段。本文先后吸收两轮审核结论：2026-09-11 首版审核（F1–F7，v2 修复）与 2026-09-11 对 v2 的审核（D1–D6，本版修复）。D1–D6 修复完成后，两轮审核的"逻辑冲突"与"语义模糊"类别均归零，方案达到定稿条件。执行仍需按 AGENTS.md 依赖图谱门获得用户显式确认。

## 问题陈述

用户场景：maintenance / small 仓库修一行配置、改一句文案、修一个单文件 bug、写一个一次性脚本。当前设计的流程重量与任务重量无关——profile（仓库状态）× tier（系统复杂度）都是**项目级**判读维度，配置层不存在**任务粒度**维度（`subsystem-tiering.md` 的"子系统独立定 tier"也是按子系统规模，不是按任务）。结果：再琐碎的改动也走完整 propose 骨架 + 架构 review。

方案目标：在 td-propose / td-apply / td-archive 内嵌一条**轻量通道**——减论述深度与 review 环节，不减 artifact 数量、不降 constraint 强度。不开新 skill、不加新命令、不动 OpenSpec 骨架。

## 首版方案的审核结论（本版修复依据）

| 编号 | 严重度 | 问题 | 本版修复 |
|---|---|---|---|
| F1 | 致命 | "Caller Impact 实测兜底"是死代码——实测子节自身触发条件（"触发条件未命中 → 跳过本子节"）与轻量判据第 2 条（不命中四类变更点）互斥，轻量 change 按定义不会触发实测，宣称的安全网根本不运行 | 修订 1 |
| F2 | 高 | 判据 3"无跨分系统影响（'影响哪些分系统'只有一个）"引用 proposal 6.c 的产物字段，但判读放在步骤 3——判读时点读不到判据所需内容 | 修订 2 |
| F3 | 高 | 轻量 proposal 模板引用 `profile-maintenance.md`，但该文件自述"判读命中 profile-maintenance 后读本文件"——greenfield / brownfield 仓库读它与其作用域声明冲突 | 修订 3 |
| F4 | 中 | 轻量标记失效机制三处复述，无权威持有者 | 修订 4 |
| F5 | 低 | 轻量标记字符串两种口径（"+ 判读理由" 时有时无） | 修订 5 |
| F6 | 低 | td-apply 跳过 tier-large 总体设计文档检查是死逻辑（tier-large 已被步骤 3 排除，正常数据流下永不发生） | 修订 6 |
| F7 | 低 | "跳过 caller impact 必填节"复述判据 2 的必然结果 | 修订 6 |

## v2 审核结论（D1–D6，本版修复依据）

审核方式：锚点核对（td-propose 步骤 3/6/7、td-apply 步骤 2/4 现状）+ 依赖图谱重扫（skills/ 与 commands/ 全树）+ 判据事实源核对（change-point-classes / human-in-loop / strength-matrix）+ 使用态 LLM 视角四维度。F1–F7 修复逐项核验全部有效；以下为本轮新发现问题。

| 编号 | 严重度 | 问题 | 本版修复 |
|---|---|---|---|
| D1 | 高 | 轻量强制实测条款与 `change-point-classes.md` 的仲裁句冲突——该文件头声明"其他位置的表述与本文件冲突时，以本文件为准"，其触发条件节写明"单分系统 + 无四类变更点 → 三层均不触发"；轻量 change 按判据 2+4 定义恰好命中该情形，只写入 td-apply SKILL.md 的强制条款会被权威文件判负，安全网再次死代码（F1 同构） | 修订 7 |
| D2 | 中 | apply 侧失效动作缺"标记同步失效"——定判失守侧写了"proposal 更新标记为常规"，apply 侧失效回路只写"回全流程 + 补架构 review"，标记残留会话中断后重跑 `/td-apply` 时被步骤 2 前置检查再次读到，轻量放行被穿透 | 修订 8 |
| D3 | 中 | 轻量判据 1 含"单文件 bug 修复"，与 `profile-maintenance.md` 特殊规则 2（bug 必走 systematic-debugging 4-phase + 回归测试）构成双指令源，"不放松清单"未声明行为层触发是否豁免，使用态 LLM 无仲裁依据 | 修订 9 |
| D4 | 中 | "轻量模板 5 字段与常规 proposal 必填字段完全对齐"失实——常规 6.c 必填节实有 6 个 bullet，轻量模板缺第 6 项"与既有架构/风格的遵循关系"（该项挂接 human-in-loop 偏离确认触发）；`profile-maintenance.md`「### 4」说明段声称的"字段与 6.c 一致（5 项）"本身即错，迁移"一字不改"会把错误声明带进新权威文件 | 修订 10 |
| D5 | 低 | 模板迁移边界未定——profile-maintenance §4 的说明段（字段对齐声明、"不算 apply-ready"句）随迁与否未说明，两边都留 = 定义点分裂 | 修订 3（边界补全） |
| D6 | 低 | v2 文档依赖图谱邻接表入边计数失实（td-propose 记 8 实测 20 文件、td-apply 记 14 实测 18 文件），风险结论不变但图谱须更正 | 图谱节重写 |

## 修订要点

### 修订 1（对应 F1）：轻量 change 强制执行 Caller Impact 实测

轻量判据排除了四类变更点 → 按 `td-apply` 现有触发条件实测会被跳过。因此轻量通道必须把实测从"信号触发"改为"**强制执行**"：

> `td-apply` 步骤 4「Caller Impact 实测」子节新增一句：**轻量通道 change 不受本子节触发条件限制，无条件实测**——实测是轻量判据的事后验证。实测发现 proposal 未标注的 caller、或与预判冲突 → 轻量标记就地失效，失效动作见下方失效机制条款（回全流程 + 补架构 review + 标记同步失效，权威持有地在本子节）。

同时在该子节触发条件段补显式例外说明："触发条件未命中 → 跳过本子节（不给小改动加流程开销）；**轻量通道 change 例外，见下方强制实测条款**"——豁免与例外同段相邻，不留矛盾。

安全模型由此完整：判据是**事前预判**（可错），强制实测是**事后验证**（兜底），预判错 ≠ 事故，实测拦住。

### 修订 2（对应 F2）：初判 / 定判两段式

判读拆成两个时点，各自只引用当时存在的内容：

- **初判（td-propose 步骤 3 前置检查）**：只用可从用户输入与现场立即判断的判据——
  1. 改动触及单点：配置项 / 文案 / 单文件 bug 修复 / 一次性脚本
  2. 按用户描述与现场快查，预判不命中四类变更点（完整实测在 apply，此处是预判不是豁免）
  3. 用户明示走轻量，或经 agent 提议后**确认**（跳过架构 review 是真实决策点，不由 agent 自行拍板——触发 `constraints` 的 `references/human-in-loop.md`）

  初判通过 → 按"轻量路径"起草，proposal 注明轻量标记（格式见修订 5）。

- **定判（td-propose 6.c 影响评估落笔后）**：校验落笔后的真实内容——
  4. "影响哪些分系统"只有一个（跨分系统影响为零）
  5. 复核判据 2：正式判定不命中四类变更点任何一类

  定判任一失守 → **回常规流程**（补架构 review 等），proposal 更新标记为常规（删除「轻量通道：已确认」blockquote 行）；已写的轻量 proposal **就地扩写**——轻量 6 字段与常规 6.c 必填 bullet 同名同序（见修订 10），扩写只增论述不换字段，且 openspec artifact 已创建，重建会抖动 change 目录与 ID。初判通过但定判失守不算失败——是两段式设计的正常回路。

`$_TD_TIER == tier-large` 时不适用轻量通道（总体设计文档必填不豁免）——初判即排除，不留到定判。

### 修订 3（对应 F3）：轻量模板迁出 profile 文件

新建 `skills/field-assessment/references/lightweight-proposal.md`，承载轻量 proposal 模板（内容 = 现 `profile-maintenance.md`「### 4. 轻量 proposal」节迁移而来），文件自述改为 profile 无关：

> 本文件是轻量 proposal 模板的单一权威，与 profile 无关——任何 profile × tier 下走轻量通道的 change 都读本模板。

**迁移边界（对应 D5）**：模板代码块 + 执行语义说明（字段对齐声明、"没有'预期行为模型'的 proposal 不算 apply-ready"句）**随迁**，且按修订 10 改写为 6 字段口径；profile-maintenance §4 只留**指针 + maintenance 场景说明**（"maintenance 的 proposal 默认可用本模板"），不留任何模板正文或字段数声明——定义点净数量保持 1 处。

- `profile-maintenance.md`「### 4. 轻量 proposal」节改写为运行时指针：指向 `lightweight-proposal.md`，保留 maintenance 场景说明（"maintenance 的 proposal 默认可用本模板"），不重复模板正文
- `td-propose` 轻量分支引用 `lightweight-proposal.md`
- **模板内容按修订 10 调整**——6 必填字段全保留（新增第 6 项"与既有架构/风格的遵循关系"），"预期行为模型"不省（它是 td-apply 步骤 6.2 系统级验证与 td-archive 步骤 3 复盘的对照锚点）；"轻量"指论述篇幅，不减少必填字段
- 迁移代价：maintenance profile 的 propose 多一跳读取（读 profile 变体 → 读模板文件），可接受

### 修订 4（对应 F4）：失效机制权威收敛

轻量标记失效的编排**只在 td-apply 步骤 4（实测发生地）完整持有**——失效条件、失效动作（回全流程 + 补架构 review + 标记同步失效，最后一条由修订 8 补全）、放行恢复条件都在那里定义。其余位置只写运行时指针：

- td-propose 步骤 3 / 步骤 7：一句话——"标记失效机制见 `td-apply` 步骤 4"
- td-apply 步骤 2：一句话——"轻量放行细则见步骤 4"

### 修订 5（对应 F5）：标记格式统一为单一字符串

proposal 内的轻量标记固定为：

```markdown
> 轻量通道：已确认（判读理由：<一句话>）
```

- td-propose 写入此格式；td-apply 两处匹配此格式——全文唯一口径
- 标记是人类可读的 blockquote 行，不是 HTML 注释——用户打开 proposal 能直接看到"跳过 review"这个决策及其理由

### 修订 6（对应 F6 / F7）：删死逻辑与复述

- **删** td-apply 步骤 2"跳过 tier-large 总体设计文档检查"——tier-large 在初判即被排除，正常数据流下该跳过永不发生，不为不可能场景加处理
- **删** td-propose 步骤 6"跳过 caller impact 必填节"复述——判据 2 成立时该节本来不触发必填；轻量分支只写"6.c 必填项检查照常执行，定判失守即回常规流程"

### 修订 7（对应 D1）：轻量实测例外由权威文件自己持有

改动目标清单**新增 `skills/td-apply/references/change-point-classes.md`**——不在 td-apply SKILL.md 正文对抗该文件的仲裁句（"其他位置的表述与本文件冲突时，以本文件为准"），而是在其「触发条件」节内补轻量通道例外条款：

> 轻量通道 change 例外：三层防护中的 **apply 侧实测层**对轻量 change 强制执行（无条件实测，失效机制见 `td-apply` 步骤 4），本节"三层均不触发"不适用于轻量 change 的实测层；前馈层（propose 侧预判标注）与校验层（架构 review 校验）维持不触发——架构 review 在轻量通道被跳过是通道定义本身。

例外只针对实测层：轻量 change 的 caller 实测是判据的事后验证，必须运行；前馈与校验两层对应的论述与 review 正是轻量通道要减的对象。

### 修订 8（对应 D2）：apply 侧失效动作补标记同步失效

td-apply 步骤 4 的失效动作（修订 1 定义，权威持有地）在"回全流程 + 先补架构 review 再放行"之外**补一条：proposal 轻量标记就地改写为常规**（删除「轻量通道：已确认」blockquote 行）。与定判失守侧（修订 2"proposal 更新标记为常规"）对称——两侧失效回路都保证磁盘上的标记不残留，会话中断后重跑 `/td-apply` 时步骤 2 前置检查不会读到失效标记再次轻量放行。

### 修订 9（对应 D3）：行为层触发不豁免

轻量通道**只减 propose 侧论述深度与架构 review 环节，不减 apply 侧行为层触发**：

- `test-driven-development` / `verification-before-completion` 照常触发，强度不降
- bug 类轻量 change（判据 1"单文件 bug 修复"）仍走 `systematic-debugging` 4-phase——`profile-maintenance` 特殊规则 2 与轻量通道不冲突：轻量减的是 propose 论述与 review，不是 debug 流程

写入两处：本设计「不放松清单」补一行（见下）；执行时写入 td-propose 轻量分支正文一句话（"轻量不豁免 apply 侧行为层触发，bug 类 change 仍走 systematic-debugging"）。

### 修订 10（对应 D4）：轻量模板补第 6 项必填，字段数声明修正

- `lightweight-proposal.md` 模板在"预期行为模型"之后**补第 6 项**：「与既有架构/风格的遵循关系」——单点改动写"遵循，无偏离"一行即可；该项挂接 human-in-loop 偏离确认触发，缺它则轻量 change 偏离架构时失去确认触发点
- 迁移时**不"一字不改"**：`profile-maintenance.md` §4 说明段声称的"字段与 6.c 必填项一致（5 项全必填）"是错误声明（常规 6.c 实有 6 个 bullet），随迁说明段必须改写为 6 项口径
- 就地扩写路径（定判失守 → 常规）的定义随之明确：轻量 6 字段与常规 6 bullet 同名同序，扩写只增论述不换字段
- 「不放松清单」的"proposal 5 必填字段"行同步改为 6 必填字段

## 修订后的完整流程（td-propose 侧）

```
步骤 3 前置检查（新增初判子项）
  ├─ 判据 1/2/3（初判版）全部命中 + 用户确认
  │    → 轻量路径：proposal 注明「轻量通道：已确认（判读理由：<…>）」
  └─ 任一不命中 → 常规流程（现有逻辑不变）

步骤 6 循环创建 artifact
  ├─ 轻量路径：proposal 用 lightweight-proposal.md 模板（6 字段全保留，见修订 10）
  │    tasks 收为单任务 + 单行关键链/buffer 标注（比例按表 1 当前 tier 行）
  │    6.c 检查照常执行 → 定判（判据 4/5）任一失守 → 回常规流程（就地扩写）
  └─ openspec artifact 数量不减：applyRequires 全部创建

步骤 7 架构 review
  ├─ 轻量路径且定判通过 → 跳过（标记已在 proposal 内）
  └─ 常规 → 现有 review 逻辑不变

步骤 8 validate 照常
```

## td-apply 侧改动

- 步骤 2 前置检查新增一行（指针 + 放行）："proposal 含「轻量通道：已确认」标记 → 走轻量放行，细则与失效机制见步骤 4"
- 步骤 4 两处：
  - 架构 review 复核前加轻量例外（跳过复核，但实测不豁免）
  - Caller Impact 实测子节：触发条件段补显式例外 + 轻量 change 强制实测条款 + 失效机制（回全流程 + 补架构 review + **标记同步失效**——失效机制的权威持有地，见修订 8）
- `references/change-point-classes.md`「触发条件」节补轻量通道例外条款（实测层对轻量 change 强制执行，见修订 7）——不在 SKILL.md 正文对抗该文件的仲裁句

## 不放松清单（轻量通道的红线）

| 项 | 处置 |
|---|---|
| artifact 数量 | 不减——applyRequires 全部创建（轻量减论述深度，不减契约结构） |
| proposal 6 必填字段 | 全保留（含第 6 项"与既有架构/风格的遵循关系"），"预期行为模型"不省 |
| WIP 上限 / human-in-loop 基线 1–5 类 / buffer 比例 | 照表 1/2 全额生效——轻量不降 constraint 强度 |
| Caller Impact 实测 | 轻量 change 反而**强制**（首版缺陷已修；例外条款由 `change-point-classes.md` 权威持有，修订 7） |
| apply 侧行为层触发 | **不豁免**——TDD / verification-before-completion 照常，bug 类轻量 change 仍走 systematic-debugging 4-phase（修订 9） |
| 用户确认 | 初判第 3 条，不可由 agent 单方面判定 |

## 依赖图谱与分析（执行时的前置门产出，执行前需重新校验）

### 改动目标（v3：6 个文件）

| 文件 | 改动 |
|---|---|
| `skills/field-assessment/references/lightweight-proposal.md` | **新建**——模板从 profile-maintenance 迁入（按修订 10 扩为 6 字段） |
| `skills/field-assessment/references/profile-maintenance.md` | 「### 4. 轻量 proposal」节改写为指针（迁移边界见修订 3/D5） |
| `skills/td-propose/SKILL.md` | 步骤 3 初判子项、步骤 6 轻量分支、步骤 7 跳过条件、Guardrails 两条 |
| `skills/td-apply/SKILL.md` | 步骤 2 一行指针、步骤 4 轻量例外 + 强制实测条款 + 失效机制（含标记同步失效） |
| `skills/td-apply/references/change-point-classes.md` | 「触发条件」节补轻量通道例外条款（修订 7/D1——实测层例外由权威文件自己持有） |
| `README.md` | 典型工作流补「琐碎改动（轻量通道）」段 |

不改动：表 1/2/3（strength-matrix / audit-frequency）、constraints 全部、td-archive（已有 tier-small 轻量复盘 + "预期行为模型"缺失兜底，天然兼容）、td-propose / td-apply 的 frontmatter description（轻量是内部分支，不产生触发词变化）。

### 出边 / 入边（2026-09-11 实测扫描，执行前需重跑）

```
出边：
td-propose → system-engineering, field-assessment, constraints, todo-pool,
             writing-plans, requesting-code-review, td-explore, td-apply, td-archive
td-apply   → system-engineering, field-assessment, constraints, writing-plans,
             executing-plans, test-driven-development, requesting-code-review,
             verification-before-completion, systematic-debugging, td-propose

入边（blast radius，v3 按全树实测更正）：
td-propose ← td-apply, td-archive, td-explore, td-init, td-system-audit,
             td-reverse-spec(+references/reverse-spec-report.md), todo-pool,
             writing-plans, requesting-code-review(+references/),
             config-context-guidance, profile-brownfield, profile-greenfield,
             profile-maintenance, constraints 的 critical-buffer / delay-decision /
             wip-limit, commands/td-propose.md, commands/td-list.md   ← 20 个文件
td-apply   ← td-propose, td-init, td-system-audit, writing-plans,
             executing-plans, requesting-code-review(+references/),
             verification-before-completion, test-driven-development,
             systematic-debugging, change-point-classes.md,
             subsystem-tiering.md, audit-frequency.md, tier-large.md,
             brooks-law.md, critical-buffer.md, wip-limit.md,
             commands/td-apply.md  ← 18 个文件
```

新增入边均为"触发指引 / 兜底说明"性质引用（如 tier-large.md 的"没这份文档不允许 /td-apply"、brooks-law.md 的"用户在 /td-apply 时要求并行"），不持有被改步骤的内部语义，无需同步修改；change-point-classes.md 是唯一例外——它持有轻量通道需修改的权威语义（三层防护触发条件），已入改动目标清单。

### 邻接表（`*` = 本次改动触碰）

```
td-propose*(改) → td-apply, td-archive, td-explore, todo-pool, writing-plans,
                  requesting-code-review, constraints, field-assessment,
                  system-engineering
td-apply*(改)   → td-propose, writing-plans, executing-plans,
                  test-driven-development, verification-before-completion,
                  requesting-code-review, systematic-debugging, constraints,
                  field-assessment, system-engineering
change-point-classes*(改) ← td-propose（步骤 6.c 引用四类定义）, td-apply 步骤 4,
                  architecture-review-checklist.md（校验层引用）
profile-maintenance*(改) ← field-assessment 变体机制（快车道按判读命中读取）
lightweight-proposal*(新建) ← td-propose, profile-maintenance（指针）

⭐ 热点：td-apply（入边 18 个文件，全场最高）、td-propose（入边 20 个文件）——
   两个热点均被触碰，且其权威变体 change-point-classes.md 也被触碰（修订 7），
   这是本方案最大的固有风险；field-assessment 的表 1/2/3 单一事实源不触及。
```

### 契约边界声明

- td-propose / td-apply 均为契约层 skill：本方案改变 td-propose 步骤 3/6/7 与 td-apply 步骤 2/4 的运行时语义——**两处必须同一逻辑变更内改完**（td-apply 步骤 4 的放行前提依赖 td-propose 步骤 7 的标记写入，单向缺口会导致 apply 卡死或漏拦）
- 不触及配置层单一事实源：模板迁移只动 profile 变体的非表格节，表 1/2/3 不动
- 不新增 proposal 必填字段定义点：模板权威迁至 `lightweight-proposal.md`，td-propose 只引用（定义点净数量不变：profile-maintenance 的模板定义 → 新文件，仍是 1 处）

### 风险评估（一句话，v3 更正）

本次改动的 blast radius 是 2 个契约层 skill（td-propose / td-apply，实测合计 38 个入边文件）+ td-apply 的权威变体 change-point-classes.md + field-assessment 的 1 个变体文件与 1 个新 references 文件，共 6 个文件，最大风险是轻量判据过宽导致架构 review 被系统性绕过——由"初判三重判据 + 用户显式确认 + 定判复核 + apply 强制实测失效回路"四层防线控制，其中实测失效回路的例外条款必须由 change-point-classes.md 权威文件自己持有，不可写入 SKILL.md 正文对抗其仲裁句（F1/D1 两次教训）。

## 与主基调的关系

| 主基调条 | 关系 |
|---|---|
| 第 1 条：系统工程 | 轻量不减验证与 constraint 强度——减的是论述摩擦，不是整体性能的保障环节 |
| 第 2 条：总体设计部 | 走不走轻量由用户拍板（初判第 3 条）；判据判错由实测拦截并回全流程 |
| 第 3 条：综合集成 | "预期行为模型"字段轻量下不省——定量锚点在最小 change 上也保留 |
| 第 4 条：开放的复杂巨系统 | 任务粒度维度补齐配置层的层次性——项目维度（profile×tier）与任务维度正交叠加，不互相替代 |

## 开放问题（2026-09-11 已全部拍板）

1. **判据 1 采用枚举清单**（保留配置项/文案/单文件修复/一次性脚本四类）——枚举是初判加速器，判据 3 的用户确认本身已是交互式环节，纯交互式与"减摩擦"目标自相矛盾；枚举漏掉的非常规改动走常规流程，宁漏不放，误判风险由定判（判据 4/5）与 apply 强制实测兜底。
2. **轻量 tasks 不加 task-template 豁免条款**——`task-template.md` 必填字段（文件/风险/验证/分系统影响/依赖）在单任务场景照填无负担（依赖=无，分系统影响=那一个分系统，与定判判据 4 互证）；轻量减的是任务数量，不是任务字段。若实测后确有负担再补豁免。
3. **定判失守后就地扩写**——轻量模板 6 字段（含"预期行为模型"，v3 按修订 10 补第 6 项）与常规 proposal 6.c 必填 bullet 同名同序，扩写只增论述不换结构；且 openspec artifact 已创建，重建会造成 change 目录/ID 抖动、tasks 可能部分失效。执行时此结论写入 td-propose 定判失守分支。
