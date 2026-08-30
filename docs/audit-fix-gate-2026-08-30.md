# 前置门记录：配置层收拢 6→0（2026-08-30）

> 按 AGENTS.md「依赖图谱与分析」要求留档。本次改动：3 profile + 3 tier skill 并入 `field-assessment/references/` 变体文件，28→22 skill（版本号不动，bump 由用户发布时决定）。执行前经两轮审核：全仓使用态审核（发现 F1/F2/F4）+ 方案审核（发现 P1/P2/P3 并修正方案）。

## 步骤 1：改动目标枚举

| 文件 | 改动 |
|---|---|
| `skills/field-assessment/references/{profile-greenfield,profile-brownfield,profile-maintenance,tier-small,tier-medium,tier-large}.md` ×6 | 新建（由 6 个 SKILL.md 迁移改写：触发条件/判断依据节删除改引用判读表；表 3 数值内联删除改"见表 3 对应行"；兄弟切换改目录内指称；三个锚点「总体设计文档必填」「TDD 边界」「与其他 profile 的切换」逐字保留） |
| `skills/{6 个旧 skill 目录}` | 整目录删除 |
| `skills/field-assessment/SKILL.md` | 内容编排节（4→10 文件）+ 如何被引用节（补变体读取） |
| `skills/field-assessment/references/identification-flow.md` | 新增「### 变体文件」节；tier 判读表补"系统层次"列（收编原 tier 文件层次判据）；步骤 5 补"读命中变体文件"；:69 措辞（P2） |
| `skills/field-assessment/references/strength-matrix.md` | :33 "三个 tier skill 合并而来"→"tier 维度合并而来"（P2 同型） |
| `skills/field-assessment/references/audit-frequency.md` | :3 引用方列表修正（P2） |
| `skills/delay-decision/SKILL.md` | 依赖节 tier-large→field-assessment（F1）；:42 锚点改路径 |
| `skills/td-reverse-spec/SKILL.md` | :45 ×2 锚点改路径 |
| `skills/test-driven-development/SKILL.md` | :62 锚点改路径 |
| `skills/td-propose/SKILL.md` | :144 锚点改路径（P1 补） |
| `skills/td-apply/SKILL.md` | :50 锚点改路径（P1 补） |
| `README.md` / `AGENTS.md` | 计数 28→22、配置层结构描述、F2 修复（README user-invocable 14/14 失真→7/15） |
| `plugin.json` + `marketplace.json` / `CHANGELOG.md` / `RELEASE_NOTES.md` | **不动**——版本 bump 与发布文档更新由用户在发布时显式执行，不随重构自动捆绑 |
| 不动 | 全部 td-* 步骤序列、表 1/2/3 数值、`audit-frequency.md` 表 3、`subsystem-tiering.md`、hooks/、commands/、历史发布条目、`docs/audit-fix-gate-2026-08-26.md` |

## 步骤 2–3：出边 / 入边（改前实测）

出边（6 文件引用谁）：profile 互引 4 条 + tier 互引 3 条 → 迁移后变目录内相对指称；其余（field-assessment / human-in-loop / systematic-debugging / verification-before-completion / critical-buffer / wip-limit / td-propose / td-apply / td-system-audit）全部为值用法或已在迁移中保留。

入边（谁引用 6 个，skills/ 内 46 条）：指针式 8 处（改写清单见步骤 1，含 P1 补的 td-propose:144 / td-apply:50）；其余全部为维度值用法（`$_TD_PROFILE == profile-greenfield`、表行标签、"tier-large 强制"类表述）——**值不变，零改动**。skills/ 之外命中：README、AGENTS、发布文档（已列入清单）；commands/ 零命中。

## 步骤 4：改动子图

```
被删节点(6)：profile-{green,brown,maint}-field, tier-{small,medium,large}
热点：field-assessment（入边 20→14，仍为第一枢纽；6 个变体并入自身）
指针改写涉及：delay-decision / td-reverse-spec / test-driven-development / td-propose / td-apply
值用法零改动：brooks-law / executing-plans / human-in-loop / system-engineering /
             requesting-code-review / td-archive / td-system-audit / td-init / td-explore
```

## 步骤 5：契约边界判断

- 4 个契约层/行为层 skill 持指针式引用（td-propose / td-apply / td-reverse-spec / test-driven-development）——**显式声明**：仅锚点替换，行为零变化；td-propose 6.c 与 td-apply 步骤 2 的"tier-large 总体设计文档必填"双校验逻辑不动。
- 强度单一事实源：6 个源文件 1.5.0 后已无数值；本次进一步删除 tier 文件的表 3 内联数值副本（F4），单一事实源收敛更彻底。
- 顺带修正：delay-decision 依赖节按需误列预加载（F1），随收拢口径自动一致。

## 步骤 6：一句话风险评估

> blast radius = 删 6 skill + 改 16 文件，契约层 4 个 skill 全为锚点替换、行为零变化；最大残余风险"漏改 skill 名式指针"以全仓 grep 逐条分类 + 双形态锚点验证兜底（方案审核 P1 把已知指针从 6 处补全到 8 处，P3 修正验证器需同时索引 ## 标题与粗体段锚——前轮审核 6 处误报均源于只索引标题）。

## 方案审核修正项（执行时已并入）

| # | 缺陷 | 修正落点 |
|---|---|---|
| P1 | 指针清单漏 td-propose:144 / td-apply:50，blast radius 低估（契约层 2→4） | 步骤 1 清单已含，实际执行完成 |
| P2 | audit-frequency.md:3 "3 个 tier skill" 指称失实 | 已改"本目录下 tier 变体文件"；identification-flow:69 同批 |
| P3 | 锚点验证器只索引 ## 标题会误报（前轮 6 报 6 假） | 验证闸门改双形态（标题 + 粗体段锚），迁移锚点逐字保留 |

## 附：开发态语句清理（同日追加，使用态审核延伸）

方案审核后用户质询 `audit-frequency.md:3` 的"唯一事实源 + 调用方清单"句对使用态 LLM 无意义，全仓扫描（5 类模式 47 命中）人工分类后修复 8 文件 9 处：

- **删**：编辑指令（strength-matrix"改强度只改本文件"/"合并而来"、change-point-classes"只改本文件，三处引用方不复述"、tier-large 变体"本 skill 只声明…避免重复校验"——收拢遗留失实称谓）、调用方清单（audit-frequency 引用方列表、change-point-classes"被三层防护的三处引用"）、写作规范尾句（identification-flow 约定节尾、requesting-code-review / checklist / td-propose 的"不复述枚举"尾）。
- **保留并显式化**：全部冲突仲裁语义改写为"与其他位置冲突时以本文件/本节为准"。
- **立规**：AGENTS.md 新增「SKILL 与 references 禁止开发态语句」节（判据 + 三类禁止形态 + 三类允许形态），审核维度 4 增加对应检查项。
