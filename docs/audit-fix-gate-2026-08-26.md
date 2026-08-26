# 依赖图谱与分析 —— 审核修复前置门（2026-08-26）

> 本文件是开发态产物（AGENTS.md「编辑规则」：开发态文本可写入 docs 目录）。
> 对应修复：使用态 LLM 视角审核报告问题 A1 / A2 / A3 / B2 / C1 / C3。
> B1 已回退：用户纠正"## 依赖技能 = 预加载清单，运行时按需触发的技能不应列入"，故 5 个 td-* 依赖节恢复为仅 `system-engineering` + `field-assessment`（td-explore 原有的 `brainstorming` 同属运行时激活，一并移除）。

## 步骤 1：枚举改动目标（24 文件，全部为局部改动，无整文件重写）

| 文件 | 改动性质 |
|---|---|
| en `skills/td-apply/SKILL.md` | 正文 :50 锚点/文档名（A1） |
| en `skills/td-propose/SKILL.md` | 正文 :144 锚点（A1） |
| en `skills/td-archive/SKILL.md` | 仅依赖节节头（A3） |
| en `skills/td-system-audit/SKILL.md` | :99 注释（A2）+ 依赖节节头（A3） |
| en `skills/td-explore/SKILL.md` | 仅依赖节节头（A3） |
| en 9 文件（`td-init` / `td-reverse-spec` / `executing-plans` / `verification-before-completion` / `test-driven-development` / `brainstorming` / `writing-plans` / `requesting-code-review` / `systematic-debugging`） | 仅依赖节节头（A3） |
| en 9 文件约束层/行为层（`brooks-law` / `critical-buffer` / `delay-decision` / `human-in-loop` / `wip-limit` + 上述重叠） | 节头已正确的 5 个约束层（brooks-law / critical-buffer / delay-decision / human-in-loop / wip-limit）不改节头；`delay-decision` 另改 :43 锚点（A1） |
| en `skills/field-assessment/SKILL.md` | :18 前补空行（C1） |
| en `commands/td-system-audit.md` | frontmatter description 两处用词（C3） |
| zh 5 文件（`td-apply` / `td-propose` / `td-archive` / `td-system-audit` / `td-explore` 的 SKILL.md） | 依赖节节头（A3，与 en 同步）；`td-system-audit` 另改 :99 注释（A2） |
| zh `skills/td-init/SKILL.md` + zh `commands/td-init.md` + zh `commands/td-list.md` | frontmatter argument-hint（B2） |

A3 节头统一范围 = en 14 文件：7 个 `## Dependencies`（td-* 全 7 个）→ `## Dependent Skills`；7 个 `## Dependency Skills`（brainstorming / executing-plans / requesting-code-review / systematic-debugging / test-driven-development / verification-before-completion / writing-plans）→ `## Dependent Skills`。zh 侧 `## 依赖技能` 已统一，不动。

## 步骤 2：被改 skill 的出边（en 正文引用扫描，`grep -oE '<27 逻辑名>'` 提取）

```
brainstorming            → delay-decision human-in-loop system-engineering td-archive td-explore td-propose
critical-buffer          → field-assessment td-apply td-propose td-system-audit wip-limit
delay-decision           → td-explore td-propose td-system-audit tier-large tier-medium tier-small
executing-plans          → field-assessment human-in-loop requesting-code-review systematic-debugging td-apply test-driven-development tier-large tier-medium tier-small verification-before-completion writing-plans
field-assessment         → （无）
requesting-code-review   → executing-plans human-in-loop td-apply td-propose
systematic-debugging     → executing-plans human-in-loop
td-apply                 → brooks-law critical-buffer delay-decision executing-plans field-assessment human-in-loop requesting-code-review system-engineering systematic-debugging td-archive td-propose td-system-audit test-driven-development tier-large tier-medium tier-small verification-before-completion wip-limit writing-plans
td-archive               → field-assessment system-engineering td-propose td-system-audit tier-large tier-medium tier-small verification-before-completion
td-explore               → brainstorming delay-decision field-assessment human-in-loop profile-brownfield profile-greenfield profile-maintenance system-engineering td-propose
td-init                  → field-assessment profile-greenfield system-engineering td-apply td-archive td-explore td-propose td-reverse-spec
td-propose               → brainstorming critical-buffer field-assessment human-in-loop profile-brownfield profile-greenfield requesting-code-review system-engineering td-apply td-archive td-explore td-reverse-spec tier-large wip-limit writing-plans
td-reverse-spec          → field-assessment profile-brownfield profile-greenfield profile-maintenance requesting-code-review system-engineering td-apply td-archive td-propose td-system-audit
td-system-audit          → critical-buffer delay-decision field-assessment human-in-loop system-engineering td-apply td-archive td-propose wip-limit
test-driven-development  → executing-plans human-in-loop profile-brownfield system-engineering systematic-debugging td-archive writing-plans
verification-before-completion → executing-plans human-in-loop requesting-code-review systematic-debugging td-apply
writing-plans            → critical-buffer delay-decision field-assessment requesting-code-review td-apply td-propose td-reverse-spec test-driven-development
```

（16 个被改 en skill；`system-engineering` 为被引用节点，自身无改动。）

## 步骤 3：反向引用（入边 = blast radius，`grep -rl '\`<逻辑名>\`' skills zh-CN/skills`，剔除自身）

| 被改 skill | 入边（引用它的文件，en 侧；zh 侧同构镜像） |
|---|---|
| td-apply | executing-plans, requesting-code-review, td-propose, tier-large, verification-before-completion, +references×3（audit-frequency / subsystem-tiering / architecture-review-checklist） |
| td-propose | requesting-code-review, td-apply, td-archive, td-explore, td-init, td-system-audit, tier-large, +references×2（todo-format） |
| td-archive | field-assessment/references×2, td-apply, td-propose, td-system-audit, test-driven-development, +references×3（archive-counter-template / purpose-tbd-housekeeping / todo-format） |
| td-system-audit | field-assessment/references×2, human-in-loop, system-engineering, tier-large, +references×2（audit-history-template / archive-counter-template / todo-format） |
| td-explore | brainstorming, delay-decision, td-propose, +references×1（todo-format） |
| td-init | field-assessment/references×1（subsystem-tiering） |
| td-reverse-spec | writing-plans, +references×2（identification-flow / subsystem-tiering） |
| delay-decision | brainstorming, human-in-loop, td-apply, td-explore, td-system-audit, writing-plans, +references×2（strength-matrix / audit-report-template） |
| field-assessment | brooks-law, critical-buffer, executing-plans, human-in-loop, profile×3, system-engineering, td-apply, td-archive, td-explore, td-init, td-propose, td-reverse-spec, td-system-audit, tier×3, wip-limit, writing-plans（全树枢纽） |
| brainstorming | system-engineering, td-explore, td-propose |
| writing-plans | executing-plans, td-apply, td-propose, test-driven-development |
| executing-plans | field-assessment/references×1, requesting-code-review, system-engineering, systematic-debugging, td-apply, test-driven-development, verification-before-completion |
| test-driven-development | executing-plans, td-apply, writing-plans, +references×1（task-template） |
| requesting-code-review | executing-plans, td-apply, td-propose, td-reverse-spec, verification-before-completion, writing-plans, +references×2 |
| systematic-debugging | executing-plans, profile-maintenance, system-engineering, td-apply, test-driven-development, verification-before-completion |
| verification-before-completion | executing-plans, profile-maintenance, system-engineering, td-apply, td-archive |

## 步骤 4：完整依赖图谱（节点 = skill 逻辑名，边 = 引用者 → 被引用者；含全部 27 节点）

```
brainstorming            → delay-decision, human-in-loop, system-engineering, td-archive, td-explore, td-propose
brooks-law               → critical-buffer, field-assessment, td-apply, tier-large, tier-medium, tier-small, wip-limit
critical-buffer          → field-assessment, td-apply, td-propose, td-system-audit, wip-limit
delay-decision           → td-explore, td-propose, td-system-audit, tier-large, tier-medium, tier-small
executing-plans          → field-assessment, human-in-loop, requesting-code-review, systematic-debugging, td-apply, test-driven-development, tier-large, tier-medium, tier-small, verification-before-completion, writing-plans
field-assessment         → （无出边；27 节点中入边最多的枢纽：16 个 skill + 10 个 references 文件直接引用）
human-in-loop            → brooks-law, critical-buffer, delay-decision, field-assessment, td-system-audit, tier-large, tier-medium, tier-small, wip-limit
profile-brownfield       → field-assessment, human-in-loop, profile-greenfield, profile-maintenance, systematic-debugging, td-propose, td-reverse-spec, tier-large, tier-medium, tier-small
profile-greenfield       → brainstorming, brooks-law, delay-decision, field-assessment, profile-brownfield, profile-maintenance, td-explore, td-propose, tier-small, writing-plans
profile-maintenance      → critical-buffer, field-assessment, human-in-loop, profile-brownfield, systematic-debugging, verification-before-completion
requesting-code-review   → executing-plans, human-in-loop, td-apply, td-propose
system-engineering       → brainstorming, executing-plans, field-assessment, systematic-debugging, td-system-audit, tier-large, verification-before-completion
systematic-debugging     → executing-plans, human-in-loop
td-apply                 → brooks-law, critical-buffer, delay-decision, executing-plans, field-assessment, human-in-loop, requesting-code-review, system-engineering, systematic-debugging, td-archive, td-propose, td-system-audit, test-driven-development, tier-large, tier-medium, tier-small, verification-before-completion, wip-limit, writing-plans
td-archive               → field-assessment, system-engineering, td-propose, td-system-audit, tier-large, tier-medium, tier-small, verification-before-completion
td-explore               → brainstorming, delay-decision, field-assessment, human-in-loop, profile-brownfield, profile-greenfield, profile-maintenance, system-engineering, td-propose
td-init                  → field-assessment, profile-greenfield, system-engineering, td-apply, td-archive, td-explore, td-propose, td-reverse-spec
td-propose               → brainstorming, critical-buffer, field-assessment, human-in-loop, profile-brownfield, profile-greenfield, requesting-code-review, system-engineering, td-apply, td-archive, td-explore, td-reverse-spec, tier-large, wip-limit, writing-plans
td-reverse-spec          → field-assessment, profile-brownfield, profile-greenfield, profile-maintenance, requesting-code-review, system-engineering, td-apply, td-archive, td-propose, td-system-audit
td-system-audit          → critical-buffer, delay-decision, field-assessment, human-in-loop, system-engineering, td-apply, td-archive, td-propose, wip-limit
test-driven-development  → executing-plans, human-in-loop, profile-brownfield, system-engineering, systematic-debugging, td-archive, writing-plans
tier-large               → brooks-law, critical-buffer, field-assessment, human-in-loop, td-apply, td-propose, td-system-audit, tier-medium, wip-limit
tier-medium              → field-assessment, human-in-loop, tier-large, tier-small
tier-small               → field-assessment, tier-medium
verification-before-completion → executing-plans, human-in-loop, requesting-code-review, systematic-debugging, td-apply
wip-limit                → brooks-law, critical-buffer, field-assessment, human-in-loop, td-apply, td-archive, td-propose, td-system-audit
writing-plans            → critical-buffer, delay-decision, field-assessment, requesting-code-review, td-apply, td-propose, td-reverse-spec, test-driven-development
```

**热点节点**（本次被改 skill 中入边最多）：
- `field-assessment`：入边覆盖全树（16 skill + 10 references），最大 blast radius；本次仅补一个空行（C1），**零语义变化**。
- `td-system-audit`：入边 4 skill + 2 references（契约层）；本次改 :99 注释 + 依赖节节头统一（A3）。
- `td-apply` / `td-propose`：各入边 6 skill + 若干 references（契约层）；本次改正文锚点（A1）+ 节头统一（A3）。

## 步骤 5：契约边界判断

1. **td-* 契约层引用检查**：被改的 7 个 td-* 全部是契约层 skill 本身（不是被引用方）。本次改动**不改变**任何 OpenSpec artifact 流语义：
   - A1 仅统一 3 处对 `tier-large` 既有节标题的引用写法（标题本身不动）；
   - A2 仅修正一句"反向声明位置"的说明注释（映射表 5 行内容不动）;
   - A3 / B2 / C1 / C3 为标题/元数据/格式，不触及 artifact 流。
   - B1（已回退）：原计划在依赖节补列运行时触发技能，用户纠正"## 依赖技能 = 预加载清单，运行时按需触发的技能不应列入"，故 5 个 td-* 依赖节恢复为仅 `system-engineering` + `field-assessment`。
   - 无"改变 X skill 的 Y 行为"情形。
2. **field-assessment 表 1/表 2/表 3 强度来源检查**：被改 skill 中有 3 个在表 1/表 2/表 3 被引用为强度来源（`wip-limit` / `human-in-loop` / `td-system-audit` 在 strength-matrix / audit-frequency 中被引用）。本次对这 3 者的改动为：`wip-limit` 仅节头（A3）、`human-in-loop` 无改动（不在 24 文件内）、`td-system-audit` 注释 + 节头统一（A2/A3）。**表 1/表 2/表 3 的强度数值与 profile×tier 配置语义零变化**。

## 步骤 6：一句话风险评估

**本次改动的 blast radius 是 16 个 en skill + 10 个 zh skill（24 文件），其中契约层 td-* 7 个（en 侧）/7 个（zh 侧）受影响最大**——它们被 6+ 个行为层/约束层 skill 入边引用；但所有改动均为"统一引用写法/元数据/格式"，不改变任何 skill 的运行时行为语义，最大风险是 A1 若锚点串替换遗漏会留下 en 侧 3 处断链（已逐处 grep 确认唯一，可全量替换），修复后需重跑锚点验证闭环。
