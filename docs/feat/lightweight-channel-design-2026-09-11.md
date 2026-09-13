# 设计讨论：td-propose 轻量通道——任务粒度维度

> 状态：设计讨论稿（v4 修订版），未进入执行阶段。本文先后吸收三轮审核/讨论结论：2026-09-11 首版审核（F1–F7，v2 修复）、2026-09-11 对 v2 的审核（D1–D6，v3 修复）、2026-09-12 对 v3 的讨论与全面核验（D7–D10、E1–E7、N1–N2，本版修复）。第三轮结束后，"逻辑冲突"与"语义模糊"类别连续归零，方案达到定稿条件。执行仍需按 AGENTS.md 依赖图谱门获得用户显式确认（本稿图谱节是执行时重扫的基线，执行前需重新校验）。

## 问题陈述

用户场景：maintenance / small 仓库修一行配置、改一句文案、修一个单文件 bug、写一个一次性脚本。当前设计的流程重量与任务重量无关——profile（仓库状态）× tier（系统复杂度）都是**项目级**判读维度，配置层不存在**任务粒度**维度（`subsystem-tiering.md` 的"子系统独立定 tier"也是按子系统规模，不是按任务）。结果：再琐碎的改动也走完整 propose 骨架 + 架构 review。

方案目标：在 td-propose / td-apply 内嵌一条**轻量通道**——减论述深度与 review 环节，不减 artifact 数量、不降 constraint 强度。不开新 skill、不加新命令、不动 OpenSpec 骨架、不改 td-archive（第三轮已实证天然兼容：tier-small 2 字段复盘与"预期行为模型"缺失兜底对轻量 change 均适用）。

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

## v3 后讨论结论（D7–D10、E1–E7、N1–N2，本版修复依据）

讨论方式：v3 全部锚点复核（td-propose 步骤 3/6.c/7、td-apply 步骤 2/4/6.4、td-archive 步骤 3、executing-plans、td-system-audit 及其报告模板、audit-frequency、profile-maintenance、change-point-classes、README、hooks、commands/ 全树"轻量"grep）+ 使用态 LLM 按字面执行视角逐段推演。全部结论经用户逐项拍板；F1 家族四例（判据互斥 / 权威仲裁 / 数据接线 / 频率归属）在本轮全部识别并堵上。

| 编号 | 严重度 | 问题 | 本版修复 |
|---|---|---|---|
| D7 | 中 | 轻量单任务 change（tasks 收为单任务，且其唯一任务按规模标注关键链）在任一 tier 都会命中 td-apply 步骤 4 的"完成关键链任务 → checkpoint（含 review）"——checkpoint review 与 6.3 收尾 review 对同一份代码重复执行，checkpoint 还带空问句（"继续吗？"之后没有下一步）；tier-medium 下通道收益被吃掉一半 | 修订 11 |
| D7 落点 | 中 | tier-medium 的 current-change audit 触发点挂在 checkpoint 上（表 3 归属表）；checkpoint 不走后，td-apply 6.4 现文"该粒度由 executing-plans 的 checkpoint 负责"指向一个不存在的 checkpoint，audit 漏跑 | 修订 11 |
| D8 | 中 | 定判判据 4"影响哪些分系统只有一个"与判据 1 枚举自相矛盾——README / CI / `.gitignore` 类**零分系统**改动按字面定判失守回常规补架构 review，恰是通道要消灭的场景；权威文件 change-point-classes 的触发补集本就是 ≤1（"≥2 才触发"），"只有一个"是比权威更严的误写 | 修订 2 |
| D9 | 中 | 修订 1 条款"不受本子节触发条件限制"只覆盖触发段——td-apply 步骤 4 还有第二个独立限制文本"tier 分层段"（"tier-small = 提醒（默认跳过）"），轻量 tier-small 按字面仍跳过实测，F1 以 tier 粒度复活 | 修订 1 |
| D10 | 中 | 初判在步骤 3 的插入位置未定——若排在 profile 门（greenfield explore / brownfield reverse-spec）之前，轻量确认按字面跳过 explore 门（"greenfield 最容易犯'想到了就建'"），且定判只查判据 4/5 不复查门禁，救不回来 | 修订 2 |
| E1 | 中 | 失效触发只有实测一根线：实施中发现超 scope 时步骤 5 必停只问用户、不说标记失效（用户说"改吧"后按轻量继续，前提已破）；设计回写修正影响评估后无重跑定判条款，且 D7 去掉 checkpoint review 后 tier-small 只剩 6.3 保底抽查（不查架构），架构 review 漏环 | 修订 4 |
| E2 | 中 | 定判判据 5"复核不命中四类"没有落笔锚点——轻量 proposal 无 caller impact 节，复核只存在于对话，上下文压缩后无持久记录，apply 强制实测也失去对照的预判文本；且 td-propose 6.c"触发命中时必填"与 tier 分层行"medium/large 必填"本身两读（存量问题） | 修订 10 |
| E3 | 高 | 强制实测在轻量语境下无输入、无失效判据（F1 家族第 3 例）——实测输入是"proposal 标注的变更点"，轻量 proposal 标注数为 0 → 空转；失效判据"发现未标注的 caller"在零标注下要么过敏（任何 caller 都算未标注）要么失灵（LLM 自行脑补语义） | 修订 1 |
| E5 | 高 | 修订 11 若只把 audit 触发句写进 td-apply 6.4，与 audit-frequency.md 的仲裁句（"与其他位置出现的频率表述冲突时，以本表为准"）及其归属表 tier-medium 行字面冲突——权威判负，audit 漏跑（D1 同构第 4 例） | 修订 11 |
| E6 | 低 | README「上线维护」工作流的"← 轻量 proposal"注释（指 maintenance 模板）与新增「轻量通道」段同页碰撞——两个"轻量"指代不同物 | 修订 12 |
| E7 | 低 | 风险评估自认最大风险是"判据过宽系统性绕过架构 review"，project audit 却无对应检查项 | 拍板：**不加**——四层防线已覆盖，audit 通用项（局部最优但全局失调）间接兜底，不为纵深增强扩清单 |
| N1 | 低 | 定判失守"就地扩写只增论述"对锚点行不成立——判据 5 失守即模板里"无四类变更点"已成假话，扩写必须改写它 | 修订 2 / 修订 10 |
| N2 | 低 | 6.c 存量两读波及 tier-medium 轻量——按"medium 必填"读法，轻量 change 会被要求整节 caller impact | 修订 10 |

**核验结论**（本轮实测，全部通过）：常规 6.c 必填实有 6 bullet（D4 依据成立）；profile-maintenance §4 自称"5 项全必填"确为错（59 行原文）；change-point-classes 仲裁句与"三层均不触发"原文在（D1 依据成立）；修订 1 挂载点含触发段与 tier 分层段**两个独立限制文本**（D9 依据成立）；td-archive tier-small 2 字段复盘 + "预期行为模型"缺失兜底在——"天然兼容"成立；strength-matrix.md 62 行"轻量 proposal"指 maintenance 流程侧重，模板迁出后语义仍成立。**无交互面实证**：td-system-audit 对照清单只查"影响评估是否认真（含预期行为模型）"，该字段轻量保留，审计链不断；hooks/td_state_sync.js 纯文件系统事实校正，轻量 change 走相同归档与审计路径；commands/ 8 文件"轻量|lightweight"零命中；表 3 频率数值在单任务下语义等价（关键链任务完成时点与 change 完成时点重合）。

## 修订要点

### 修订 1（对应 F1 / D9 / E3）：轻量 change 强制执行 Caller Impact 实测

轻量判据排除了四类变更点 → 按 `td-apply` 现有触发条件实测会被跳过。因此轻量通道必须把实测从"信号触发"改为"**强制执行**"。v4 补两处收口：

> `td-apply` 步骤 4「Caller Impact 实测」子节新增轻量条款：**轻量通道 change 不受本子节触发条件与 tier 分层限制，三档 tier 一律无条件实测**——该子节有两个独立限制文本：触发段（"触发条件未命中 → 跳过本子节"）与 tier 分层段（"tier-small = 提醒（默认跳过）"）。D9：条款只写"触发条件"时，轻量 tier-small 按字面仍走 tier 分层段的"默认跳过"，F1 以 tier 粒度复活——条款必须同时点名两者。

> **轻量 change 的实测语义单独定义**（E3，F1 家族第 3 例：常规实测的输入是"proposal 标注的变更点"，轻量 proposal 标注数为 0，按常规语义实测空转；失效判据"发现未标注的 caller"在零标注下要么过敏（任何 caller 都算未标注）要么失灵（LLM 自行脑补语义））：
>
> - **输入** = 判据 1 锚定的单点（那个文件 / 配置项 / 脚本）及其消费面——实测时点在任务实施前，无 diff 可依，只能锚定单点本身；
> - **动作** = 对该单点做四类变更点暴露检查 + 引用快查（谁消费它）；
> - **失效判据** = 实际暴露出四类任一变更点、或消费面明显超出"单点"预判 → 走失效机制（权威持有地在本子节，见修订 4）；
> - **确认无** → "实测确认无四类变更点"记录到 tasks.md 验证证据。

同时在该子节触发条件段补显式例外说明："触发条件未命中 → 跳过本子节（不给小改动加流程开销）；**轻量通道 change 例外，见下方轻量条款**"——豁免与例外同段相邻，不留矛盾。

安全模型由此完整：判据是**事前预判**（可错），强制实测是**事后验证**（兜底），预判错 ≠ 事故，实测拦住。

### 修订 2（对应 F2 / D10 / D8 / N1）：初判 / 定判两段式

判读拆成两个时点，各自只引用当时存在的内容：

- **初判（td-propose 步骤 3 前置检查）**：只用可从用户输入与现场立即判断的判据——
  1. 改动触及单点：配置项 / 文案 / 单文件 bug 修复 / 一次性脚本
  2. 按用户描述与现场快查，预判不命中四类变更点（完整实测在 apply，此处是预判不是豁免）
  3. 用户明示走轻量，或经 agent 提议后**确认**（跳过架构 review 是真实决策点，不由 agent 自行拍板——触发 `constraints` 的 `references/human-in-loop.md`）

  **初判是步骤 3 的末位子项**（D10）：步骤 3 的全部既有前置门（WIP 硬阻塞 / human-in-loop 清晰度 / TODO 池 / brownfield reverse-spec / greenfield explore）先走完，才判轻量——**轻量不豁免步骤 3 任何既有前置门**。初判若排在 profile 门之前，"加一行 .gitignore"类改动恰好命中判据 1 枚举，greenfield explore 门会被轻量确认按字面跳过，且定判只查判据 4/5、不复查门禁，救不回来。

  初判通过 → 按"轻量路径"起草，proposal 注明轻量标记（格式见修订 5）。

- **定判（td-propose 6.c 影响评估落笔后）**：校验落笔后的真实内容——
  4. "影响哪些分系统"**至多一个（含零）**，跨分系统影响为零（D8：仓库根文档 / CI / `.gitignore` 类改动允许零分系统——判据 1 枚举收了文案类，"只有一个"会把它误判回常规补架构 review，与通道目标自相矛盾；且权威文件 change-point-classes 的触发条件是"受影响分系统 ≥ 2 才触发"，其补集本就是 ≤1，"至多一个（含零）"是对齐权威而非放宽）
  5. 复核判据 2：正式判定不命中四类变更点任何一类——**复核结论落笔为 proposal 内的持久锚点行**（"变更点清单：无四类变更点（判断依据：<一句话>）"，模板见修订 10）：复核只存在于对话会被上下文压缩裁剪，apply 侧强制实测也需要这一行作为对照的预判文本

  定判任一失守 → **回常规流程**（补架构 review 等），proposal 更新标记为常规（删除「轻量通道：已确认」blockquote 行）；已写的轻量 proposal **就地扩写**——轻量 6 字段与常规 6.c 必填 bullet 同名同序（见修订 10），扩写只增论述不换字段，且 openspec artifact 已创建，重建会抖动 change 目录与 ID。**唯一例外是锚点行**（N1）：判据 5 失守即模板里"无四类变更点"已成假话，扩写时该行**按定判结论改写**为真实变更点清单（随扩写并入 caller impact 节），"只增论述"对它不成立。初判通过但定判失守不算失败——是两段式设计的正常回路。

`$_TD_TIER == tier-large` 时不适用轻量通道（总体设计文档必填不豁免）——初判即排除，不留到定判。

### 修订 3（对应 F3）：轻量模板迁出 profile 文件

新建 `skills/field-assessment/references/lightweight-proposal.md`，承载轻量 proposal 模板（内容 = 现 `profile-maintenance.md`「### 4. 轻量 proposal」节迁移而来），文件自述改为 profile 无关：

> 本文件是轻量 proposal 模板的单一权威，与 profile 无关——任何 profile × tier 下走轻量通道的 change 都读本模板。

**迁移边界（对应 D5）**：模板代码块 + 执行语义说明（字段对齐声明、"没有'预期行为模型'的 proposal 不算 apply-ready"句）**随迁**，且按修订 10 改写为 6 字段口径；profile-maintenance §4 只留**指针 + maintenance 场景说明**（"maintenance 的 proposal 默认可用本模板"），不留任何模板正文或字段数声明——定义点净数量保持 1 处。

- `profile-maintenance.md`「### 4. 轻量 proposal」节改写为运行时指针：指向 `lightweight-proposal.md`，保留 maintenance 场景说明（"maintenance 的 proposal 默认可用本模板"），不重复模板正文
- `td-propose` 轻量分支引用 `lightweight-proposal.md`
- **模板内容按修订 10 调整**——6 必填字段全保留（新增第 6 项"与既有架构/风格的遵循关系"），"预期行为模型"不省（它是 td-apply 步骤 6.2 系统级验证与 td-archive 步骤 3 复盘的对照锚点）；"轻量"指论述篇幅，不减少必填字段
- 迁移代价：maintenance profile 的 propose 多一跳读取（读 profile 变体 → 读模板文件），可接受

### 修订 4（对应 F4 / E1）：失效机制权威收敛 + 三项失效触发

轻量标记失效的编排**只在 td-apply 步骤 4（实测发生地）完整持有**——失效条件、失效动作、放行恢复条件都在那里定义。其余位置只写运行时指针：

- td-propose 步骤 3 / 步骤 7：一句话——"标记失效机制见 `td-apply` 步骤 4"
- td-apply 步骤 2：一句话——"轻量放行细则见步骤 4"

**失效触发条件扩为三项**（E1：v3 初稿只有第 1 项单线触发，两个实施场景下轻量前提已破却不触发失效）：

1. **apply 侧实测异常**（修订 1 条款，原有）：暴露四类变更点、或消费面明显超单点预判 → 失效（轻量专用实测语义见修订 1）
2. **步骤 5「超出 change scope」必停确认收尾时**——用户确认扩大 scope 继续改（"那就改吧"类答复）→ 轻量标记同步失效，转全流程；确认不扩大 → 标记维持。缺口形态：必停只问用户不说标记失效，用户放行后按轻量继续，单点前提已破
3. **设计回写修正"系统工程影响评估"后，重跑定判判据 4/5，失守即失效**——回写序列只修正评估内容，无重查轻量前提的条款；且 D7 去掉 checkpoint review 后 tier-small 只剩 6.3 保底抽查（不查架构），架构 review 漏环，重跑定判是精确补位

**失效动作执行序列三步化**（v3 初稿只有"回全流程 + 补架构 review"八个字，无可执行序列）：

1. proposal 删除轻量标记行 + 按实测发现补写 caller impact 节（轻量情形即把锚点行按定判结论改写为真实清单，与 N1 扩写同一操作）
2. 补做架构 review——**review 对象 = 更新后的 proposal**，其结论即最新 review 基准：会话中断后重跑 `/td-apply` 的步骤 4 复核以此为基准（否则复核以"步骤 7 已 review"为前提，轻量下该前提不成立，只多冗余 review、基准不明）
3. 无 critical → 按全流程继续 apply；有 critical → 阻塞，回 `/td-propose` 步骤 6 改 proposal 后重新 review

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

### 修订 10（对应 D4 / E2 / N2）：轻量模板补第 6 项必填与锚点行，字段数声明修正

- `lightweight-proposal.md` 模板在"预期行为模型"之后**补第 6 项**：「与既有架构/风格的遵循关系」——单点改动写"遵循，无偏离"一行即可；该项挂接 human-in-loop 偏离确认触发，缺它则轻量 change 偏离架构时失去确认触发点
- **模板补持久锚点行**（E2）：模板固定含"变更点清单：无四类变更点（判断依据：<一句话>）"一行——它是定判判据 5 复核结论的落笔锚点（只存在于对话会被上下文压缩裁剪）、apply 侧强制实测的对照预判文本、N2 的隔离手段：**锚点行即轻量形态的变更点标注，不要求整节 caller impact 出现**——6.c 存量两读（节标题"触发命中时必填" vs tier 分层行"medium/large 必填"）不得波及 tier-medium 轻量模板，存量问题本身不在本设计范围内修
- 迁移时**不"一字不改"**：`profile-maintenance.md` §4 说明段声称的"字段与 6.c 必填项一致（5 项全必填）"是错误声明（常规 6.c 实有 6 个 bullet），随迁说明段必须改写为 6 项口径
- 就地扩写路径（定判失守 → 常规）的定义随之明确：轻量 6 字段与常规 6 bullet 同名同序，扩写只增论述不换字段——**锚点行是唯一改写例外**（N1，见修订 2）
- 「不放松清单」的"proposal 5 必填字段"行同步改为 6 必填字段（含锚点行）

### 修订 11（对应 D7 / E5）：轻量单任务不委托 checkpoint，audit 触发例外由表 3 权威持有

**checkpoint 去重**：轻量 tasks 收为单任务，且唯一任务按规模标注关键链 → 按 td-apply 步骤 4 现文，完成该任务即命中"关键链 checkpoint"（含 `requesting-code-review` review + "继续吗？"问句）。对单任务 change：checkpoint review 与步骤 6.3 收尾 review 的对象完全重合（同一份代码）——收尾 review 保留（6.3 现文本就预设了"小 change 可能全程轮不到 checkpoint review，收尾是它唯一的 review 机会"），checkpoint 不再委托；"继续吗？"在唯一任务完成后是空问句（后面没有下一步）。**失败处理与 human-in-loop 必停不豁免**——executing-plans 在 td-apply 定位为管理层能力，与修订 9"行为层触发不豁免"同一分层。写入处：td-propose 轻量分支一句话（"轻量单任务 change 的基本执行循环不委托 executing-plans 的 checkpoint 调度——失败处理与必停不豁免"）+ td-apply 步骤 4 复杂场景段对应一句；executing-plans 自身不加指针。

**current-change audit 触发（E5，D1 同构第 4 例）**：tier-medium 的 current-change audit 触发点挂在 checkpoint 上（表 3 归属表：tier-medium → `executing-plans` 步骤 1）。checkpoint 不走后，td-apply 6.4 现文"该粒度由 executing-plans 的 checkpoint 负责"指向不存在的 checkpoint——audit 漏跑。例外不能只写进 td-apply 6.4：`audit-frequency.md` 头部有仲裁句（"与其他位置出现的频率表述冲突时，以本表为准"），其归属表 tier-medium 行明写"executing-plans 步骤 1"——单侧写入会被权威判负（与 D1 同构）。因此：

- `audit-frequency.md`「current-change scope 的触发 skill 归属」表后**补例外注**（权威自己持有，与修订 7 同构）："轻量单任务 change（未走 checkpoint）→ 触发位置为 `td-apply` 步骤 6.4（change 完成时点，与'关键链任务完成时点'在单任务下重合，频率数值语义不变）"——表 3 频率数值全部不动，只补归属例外
- td-apply 6.4 补运行时触发句："轻量单任务 change（未走 checkpoint）→ 本步骤触发"——6.4 是权威文件点名的合法判定位置（该文件头部即写"td-apply 步骤 6.4 判定 current-change audit 触发时读本表"）

改动目标清单由此 **6 → 7 文件**：`skills/field-assessment/references/audit-frequency.md` 入列；v3"不改动：表 1/2/3"声明同步修订为"频率数值不动，归属表补轻量例外注"。

### 修订 12（对应 E6）：README 轻量概念消歧

README「上线维护（修 bug）」工作流的"← 轻量 proposal"注释指 profile-maintenance §4 模板；本方案新增「琐碎改动（轻量通道）」段引入第二个"轻量"概念（通道 vs 模板）——同页两个"轻量"指代不同物。消歧：

- "轻量 proposal"注释改"轻量模板"
- 「轻量通道」概念只在新增段出现；新增段写明两者关系——轻量通道的 change 用轻量模板起草；maintenance 的常规 change 也可用轻量模板（模板使用 ≠ 通道放行，放行唯一判据是「轻量通道：已确认」标记）

## 修订后的完整流程（td-propose 侧）

```markdown
步骤 3 前置检查（轻量初判为末位子项——既有门全走完后才判，见修订 2/D10）
  ├─ 判据 1/2/3（初判版）全部命中 + 用户确认
  │    → 轻量路径：proposal 注明「轻量通道：已确认（判读理由：<…>）」
  └─ 任一不命中 → 常规流程（现有逻辑不变）

步骤 6 循环创建 artifact
  ├─ 轻量路径：proposal 用 lightweight-proposal.md 模板（6 必填字段 + 变更点锚点行全保留，见修订 10）
  │    tasks 收为单任务 + 单行关键链/buffer 标注（比例按表 1 当前 tier 行）
  │    6.c 检查照常执行 → 定判（判据 4/5）任一失守 → 回常规流程（就地扩写；锚点行按定判结论改写，见修订 2/N1）
  └─ openspec artifact 数量不减：applyRequires 全部创建

步骤 7 架构 review
  ├─ 轻量路径且定判通过 → 跳过（标记已在 proposal 内）
  └─ 常规 → 现有 review 逻辑不变

步骤 8 validate 照常
```

## td-apply 侧改动

- 步骤 2 前置检查新增一行（指针 + 放行）："proposal 含「轻量通道：已确认」标记 → 走轻量放行，细则与失效机制见步骤 4"——附半句"模板使用 ≠ 通道放行"：maintenance 常规 change 用轻量模板不构成轻量，放行唯一判据是本标记（见修订 12）
- 步骤 4 三处：
  - 架构 review 复核前加轻量例外（跳过复核，但实测不豁免）
  - Caller Impact 实测子节：触发条件段补显式例外 + 轻量条款（**同时覆盖触发段与 tier 分层段**，修订 1/D9）+ 轻量专用实测语义（输入 = 判据 1 锚定单点 + 消费面，修订 1/E3）+ 失效机制（**三项触发 + 三步序列**，修订 4/E1——失效机制的权威持有地；标记同步失效见修订 8）
  - 复杂场景段补一句：轻量单任务 change 不委托 executing-plans 的 checkpoint 调度——失败处理与 human-in-loop 必停不豁免（修订 11/D7）
- 步骤 6.4 补一句："轻量单任务 change（未走 checkpoint）→ 本步骤触发 current-change audit"（修订 11；权威侧例外注见 audit-frequency.md 归属表，E5）
- `references/change-point-classes.md`「触发条件」节补轻量通道例外条款（实测层对轻量 change 强制执行，见修订 7）——不在 SKILL.md 正文对抗该文件的仲裁句

## 不放松清单（轻量通道的红线）

| 项 | 处置 |
|---|---|
| artifact 数量 | 不减——applyRequires 全部创建（轻量减论述深度，不减契约结构） |
| proposal 6 必填字段 | 全保留（含第 6 项"与既有架构/风格的遵循关系"），"预期行为模型"不省；**变更点锚点行**固定在模板内（修订 10/E2） |
| WIP 上限 / human-in-loop 基线 1–5 类 / buffer 比例 | 照表 1/2 全额生效——轻量不降 constraint 强度 |
| Caller Impact 实测 | 轻量 change 反而**强制**——三档 tier 一律实测（修订 1/D9），实测语义按轻量专用定义（修订 1/E3）；例外条款由 `change-point-classes.md` 权威持有（修订 7） |
| change 级收尾 review（6.3） | 保留——checkpoint 去重（修订 11）只减重复 review，收尾 review 仍是单任务 change 的 review 防线（tier-small 保底抽查也保留） |
| apply 侧行为层触发 | **不豁免**——TDD / verification-before-completion 照常，bug 类轻量 change 仍走 systematic-debugging 4-phase（修订 9）；checkpoint 去重只调管理层委托，失败处理与 human-in-loop 必停不豁免（修订 11） |
| 用户确认 | 初判第 3 条，不可由 agent 单方面判定；轻量不豁免步骤 3 任何既有前置门（修订 2/D10） |

## 依赖图谱与分析（执行时的前置门产出，执行前需重新校验）

### 改动目标（v4：7 个文件）

| 文件 | 改动 |
|---|---|
| `skills/field-assessment/references/lightweight-proposal.md` | **新建**——模板从 profile-maintenance 迁入（按修订 10：6 必填字段 + 变更点锚点行） |
| `skills/field-assessment/references/profile-maintenance.md` | 「### 4. 轻量 proposal」节改写为指针（迁移边界见修订 3/D5） |
| `skills/td-propose/SKILL.md` | 步骤 3 末位初判子项（修订 2/D10）、步骤 6 轻量分支、步骤 7 跳过条件、Guardrails 两条（轻量标记须用户显式确认不得自判写入；轻量分支也必须创建全部 applyRequires artifact） |
| `skills/td-apply/SKILL.md` | 步骤 2 指针 + "模板使用 ≠ 通道放行"半句、步骤 4 轻量条款（双限制覆盖 + 轻量专用实测语义 + 三项失效触发 + 三步失效序列）、复杂场景段 checkpoint 去重句、步骤 6.4 轻量触发句（修订 1/4/8/11） |
| `skills/td-apply/references/change-point-classes.md` | 「触发条件」节补轻量通道例外条款（修订 7/D1——实测层例外由权威文件自己持有） |
| `skills/field-assessment/references/audit-frequency.md` | 「current-change scope 的触发 skill 归属」表后补轻量单任务例外注（修订 11/E5——**频率数值全部不动**，只补归属例外） |
| `README.md` | 典型工作流补「琐碎改动（轻量通道）」段 + "轻量 proposal"注释改"轻量模板"消歧（修订 12/E6） |

不改动：strength-matrix（表 1/2，强度单一事实源）、audit-frequency 的频率数值（只补归属例外注，修订 11）、constraints 全部、td-archive（第三轮已实证天然兼容：tier-small 2 字段复盘 + "预期行为模型"缺失兜底对轻量 change 均适用）、executing-plans / td-system-audit 及其 references（D7 不加指针；E7 拍板不加轻量使用率检查项）、hooks/（第三轮实证无交互）、commands/ 全部（第三轮 grep "轻量|lightweight" 零命中）、td-propose / td-apply 的 frontmatter description（轻量是内部分支，不产生触发词变化）。

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

新增入边均为"触发指引 / 兜底说明"性质引用（如 tier-large.md 的"没这份文档不允许 /td-apply"、brooks-law.md 的"用户在 /td-apply 时要求并行"），不持有被改步骤的内部语义，无需同步修改。两个例外——**change-point-classes.md 与 audit-frequency.md**，各持有轻量通道需修改的权威语义（三层防护触发条件 / current-change audit 触发归属），均已入改动目标清单（修订 7 / 修订 11）。

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
audit-frequency*(改) ← field-assessment（快车道/现判路径读表 3）, td-archive 步骤 5.2,
                  td-apply 步骤 6.4, executing-plans, td-system-audit（触发时机 + Guardrails）,
                  tier-small / tier-medium / tier-large（表 3 频率行指针）,
                  identification-flow（判读指引）  ← 10 个运行时文件，全为指针式引用，
                  例外注入权威自身后无需同步（2026-09-12 grep 实测）
profile-maintenance*(改) ← field-assessment 变体机制（快车道按判读命中读取）
lightweight-proposal*(新建) ← td-propose, profile-maintenance（指针）

⭐ 热点：td-apply（入边 18 个文件，全场最高）、td-propose（入边 20 个文件）——
   两个热点均被触碰，且两个权威变体 change-point-classes.md / audit-frequency.md
   也被触碰（修订 7/11），这是本方案最大的固有风险；field-assessment 的表 1/2
   强度单一事实源不触及，audit-frequency 频率数值不动（只补归属例外注）。
```

### 契约边界声明

- td-propose / td-apply 均为契约层 skill：本方案改变 td-propose 步骤 3/6/7 与 td-apply 步骤 2/4/6.4 的运行时语义——**两处必须同一逻辑变更内改完**（td-apply 步骤 4 的放行前提依赖 td-propose 步骤 7 的标记写入，单向缺口会导致 apply 卡死或漏拦）
- 不触及强度单一事实源：模板迁移只动 profile 变体的非表格节，表 1/2（strength-matrix）不动；audit-frequency 频率数值不动，只在归属表补例外注（修订 11/E5）
- 不新增 proposal 必填字段定义点：模板权威迁至 `lightweight-proposal.md`，td-propose 只引用（定义点净数量不变：profile-maintenance 的模板定义 → 新文件，仍是 1 处）
- 轻量例外条款一律由权威文件自己持有：实测例外在 change-point-classes.md（修订 7）、audit 触发例外在 audit-frequency.md（修订 11）——不写入 SKILL.md 正文对抗仲裁句

### 风险评估（一句话，v4 更正）

本次改动的 blast radius 是 2 个契约层 skill（td-propose / td-apply，实测合计 38 个入边文件）+ 两个权威变体（td-apply 的 change-point-classes.md、field-assessment 的 audit-frequency.md）+ field-assessment 的 1 个 profile 变体与 1 个新 references 文件 + README，共 7 个文件，最大风险是轻量判据过宽导致架构 review 被系统性绕过——由"初判三重判据 + 用户显式确认 + 定判复核 + apply 强制实测失效回路"四层防线控制，其中两类例外条款必须由权威文件自己持有（实测例外在 change-point-classes.md、audit 触发例外在 audit-frequency.md），不可写入 SKILL.md 正文对抗仲裁句——F1 / D1 / E5 三次教训、四例同构（判据互斥 / 权威仲裁 / 数据接线 / 频率归属）。

## 与主基调的关系

| 主基调条 | 关系 |
|---|---|
| 第 1 条：系统工程 | 轻量不减验证与 constraint 强度——减的是论述摩擦，不是整体性能的保障环节 |
| 第 2 条：总体设计部 | 走不走轻量由用户拍板（初判第 3 条）；判据判错由实测拦截并回全流程 |
| 第 3 条：综合集成 | "预期行为模型"字段轻量下不省——定量锚点在最小 change 上也保留 |
| 第 4 条：开放的复杂巨系统 | 任务粒度维度补齐配置层的层次性——项目维度（profile×tier）与任务维度正交叠加，不互相替代 |

## 开放问题（2026-09-11 拍板三项；2026-09-12 第三轮 D7–D10 / E1–E7 / N1–N2 已全部拍板，见「v3 后讨论结论」节；无遗留开放项）

1. **判据 1 采用枚举清单**（保留配置项/文案/单文件修复/一次性脚本四类）——枚举是初判加速器，判据 3 的用户确认本身已是交互式环节，纯交互式与"减摩擦"目标自相矛盾；枚举漏掉的非常规改动走常规流程，宁漏不放，误判风险由定判（判据 4/5）与 apply 强制实测兜底。
2. **轻量 tasks 不加 task-template 豁免条款**——`task-template.md` 必填字段（文件/风险/验证/分系统影响/依赖）在单任务场景照填无负担（依赖=无，分系统影响=那一个分系统，与定判判据 4 互证）；轻量减的是任务数量，不是任务字段。若实测后确有负担再补豁免。
3. **定判失守后就地扩写**——轻量模板 6 字段（含"预期行为模型"，v3 按修订 10 补第 6 项）与常规 proposal 6.c 必填 bullet 同名同序，扩写只增论述不换结构；且 openspec artifact 已创建，重建会造成 change 目录/ID 抖动、tasks 可能部分失效。执行时此结论写入 td-propose 定判失守分支。
