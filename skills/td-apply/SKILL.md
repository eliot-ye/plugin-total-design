---
name: td-apply
description: 实施任务，按 artifact 走。触发场景：用户说"apply"、"实施"、"按 change 干"、"执行 tasks"、"开始执行"、"go"
user-invocable: true
argument-hint: <change-name>
---

# td-apply

按 change 的 tasks.md 实施。这是从"契约"走向"代码"的桥。

## 依赖技能

- `system-engineering`
- `field-assessment`

## 服务的主基调原则

**系统工程主基调第 1 条：系统工程。**

apply 不是"按任务清单打勾"，是"在系统全局立场上推进实施"。每个任务对系统整体的影响，必须由 agent 持续持有。

**核心论点归位**：步骤 6.2 系统级验证是"总体性能≠各部分之和"的最直接体现。执行语义见 `verification-before-completion` 第 6 节。

**系统工程主基调第 2 条：总体设计部。**

apply 过程中遇到的关键决策，agent 不自己拍板，触发 `constraints` 的 `references/human-in-loop.md` 让用户（总体设计部）拍。

**反馈控制回路归位**：apply 是控制执行 + 实时误差检测环节。

## 输入 - change 名。空则推导或问用户"想 apply 哪个 change"

`$ARGUMENTS`

## 步骤

### 1. 激活主基调与配置层

按下述三步序列激活主基调与配置层——只注入强度，不做触发判断：

1. **`system-engineering`** — 主基调四条进入上下文。
2. **profile × tier 识别** — 调 `field-assessment`，判读 `$_TD_PROFILE` / `$_TD_TIER`，读入表 1 + 表 2 + 表 3。会话内缓存。apply 期间**不主动触发 project-scope system-audit**，但按表 3 的 current-change scope 频率触发 current-change audit（见步骤 6.4）。
3. **其余 constraint** — 只把强度值读入上下文，不在本步判断——后续步骤据此判断 constraint 触发与 tasks 合规。

### 2. 前置检查

对照步骤 1 注入的强度与当前 change 状态，判断是否触发：

- **change 完整性**：artifact 是否齐全？proposal 是否有"系统工程影响评估"节？没有 → 不算 apply-ready，停下来问用户。"预期行为模型"字段缺失时**不阻塞**，降级提示："proposal 缺'预期行为模型'字段（旧 change 兼容），apply 时以步骤 6.2 实际行为验证为准；新 change 应回 `/td-propose` 步骤 6.c 补填。"——与 `td-archive` 步骤 3 的旧 change 兜底对称（propose 6.c 对新 change 仍强制必填，本处只放行存量旧 change）。
- **tier-large 总体设计文档必填**：若 `$_TD_TIER == tier-large`，检查 proposal 是否附了"总体设计文档"（见 `field-assessment` 的 `references/tier-large.md`「总体设计文档必填」节）。没这份文档 → **阻塞 apply**，提示用户回 `/td-propose` 补文档。与 `td-propose` 步骤 6.c 的检查在两处分别校验，避免漏检。
- **caller impact 分析节必填**：若 `$_TD_TIER` 为 `tier-medium` / `tier-large` 且 change 命中 caller impact 触发条件（条件与四类变更点定义见 `references/change-point-classes.md`），检查 proposal 是否附了「caller impact 分析」节（变更点类别标注 + 高危标记，见 `td-propose` 步骤 6.c）。缺项 → **不算 apply-ready**，提示用户回 `/td-propose` 步骤 6.c 补节。与 `td-propose` 步骤 6.c 的检查在两处分别校验，避免漏检——propose 6.c 漏执行时由本条兜底，后续步骤 4 实测子节不再重复此检查。
- **`constraints` 的 `references/wip-limit.md`（硬阻塞 + override，补拦）**：当前活跃 change 数已达上限？（apply 一个已达上限意味着 propose 阶段的 WIP 硬阻塞被 override 穿透，或 propose 阶段漏拦）。已达 → **阻塞本步骤，不执行步骤 3**，执行 `constraints` 的 `references/wip-limit.md` 的「硬约束 + override 机制」节（权威在该文件；override 通过后继续步骤 3）。
- **`constraints` 的 `references/critical-buffer.md`**：tasks.md 是否已标注关键链 + project buffer（比例按表 1 当前 tier 行；表 1 见 `field-assessment/references/strength-matrix.md`）？没有 → 触发 `writing-plans` 补上（关键链标注应在 propose 阶段完成，这里只补漏）。
- 其余 constraint（`constraints` 的 `references/brooks-law.md` / `references/delay-decision.md` / `references/human-in-loop.md`）在实施过程中按需触发，不在本步预判。

### 3. 读 change 的 artifact

按依赖顺序读：

1. `proposal.md`（what & why）
2. `design.md`（how）
3. `specs/` 下的 spec 文件
4. `tasks.md`（实施步骤）

### 4. 架构 review 复核 + caller impact 实测 + 触发行为层

**进入任务实施前，复核架构 review 结论**：`td-propose` 步骤 7 已完成架构 review 且无 critical 才放行 apply——本步骤只复核：proposal / design 在 propose 之后是否被改过？**未改动 → 沿用步骤 7 结论，继续执行下方「Caller Impact 实测」子节**；**有改动 → 重新触发 `requesting-code-review` 的架构 review**（对照 proposal 的"系统工程影响评估"节与 design.md，检查分系统切分与设计决策是否符合高内聚低耦合，检查清单见该 skill 的 `references/architecture-review-checklist.md`）。**架构级 critical 未修复 → 阻塞 apply**，提示用户回 `/td-propose` 步骤 6 改 proposal 再重新 review。

#### Caller Impact 实测（任务实施前的闸门）

**触发**：触发条件、四类变更点定义、边界裁定与已知盲区见 `references/change-point-classes.md`（单一事实源）；触发条件未命中 → 跳过本子节（不给小改动加流程开销）。

**执行（实测为主——caller 清单由引用搜索实测产出，不由人工预判清单充当）**：

1. 对 proposal 标注的每个变更点，用符号引用搜索 / 调用方追踪 / 文本 grep 类工具实测 caller，产出 caller 清单（file:line + 调用形式）。
2. 逐 caller 确认兼容（签名匹配 / 返回值未被消费 / 装配点已接 / 语义不变），记录确认结论。
3. 实测发现 proposal 未标注的 caller，或与已知 caller 的预判结论冲突 → 补做兼容确认，或经步骤 5 的 apply 全局必停通道上报「超出当前 change scope」——不得静默跳过。

**tier 分层**：tier-large = 硬闸门（无条件实测；caller 清单 + 逐 caller 结论未产出，不进入任务实施）；tier-medium = 信号触发（满足任一信号则强制实测：变更点属 ①③ 高危类 / proposal 对某已知 caller 标注"需适配" / 架构 review 对 caller 影响提出疑问；纯内部实现细节且无信号 → 可跳过并在 tasks.md 记录理由）；tier-small = 提醒（默认跳过）。caller 清单与结论记录到 tasks.md（对应任务的验证证据或单独附注）。

本子节是**事前**误差检测（不破坏既有 caller），实测确认过的 caller 清单同时是步骤 6.2 边界验证的边界输入；步骤 6.2 是**事后**误差检测（新行为是否正确）。分工不同，不重复。

架构 review 与 caller impact 实测均通过后，按 `tasks.md` 的任务序列实施。

#### 任务执行

**粒度不够细时先细化**：tasks.md 粒度不够 → 触发 `writing-plans` 细化任务序列。

**基本执行循环**（td-apply 自持，逐任务循环直至全部完成）：

1. 读任务的"验证"字段与"风险"字段
2. 触发 `test-driven-development`：先写失败测试，再写实现；**实现默认对齐既有代码风格与既有实现模式**（命名 / 模块组织 / 错误处理）——主基调第 1 条"局部动作从整体性能反推"，偏离需有 proposal 的遵循声明支撑
3. 触发 `verification-before-completion`：跑验证命令，拿到验证证据
4. 更新 tasks.md：`- [ ]` → `- [x]`，附验证证据

**复杂场景按需委托 `executing-plans`**：以下任一条件命中时，在基本执行循环的对应位置触发 `executing-plans` 的 checkpoint / 失败处理能力——td-apply 仍是执行主体，`executing-plans` 提供管理层能力（checkpoint 调度 + 失败处理回路），不接管基本执行循环：

- **关键链 checkpoint**：完成一个关键链任务时 → 触发 `executing-plans` 的 checkpoint（含 `requesting-code-review` 做 review，含与既有风格一致性检查）
- **任务执行失败**：触发 `executing-plans` 的失败处理（内含 `systematic-debugging` 4-phase 流程；失败 2 次以上触发 debug、3 次反思 plan）
- **current-change audit**（tier-medium）：每个关键链任务完成时随 checkpoint 触发，见步骤 6.4

条件不命中时全程走 td-apply 自持的基本执行循环，不加载 `executing-plans`。

### 5. 触发 apply 全局粒度的工程管理约束

本步骤触发 **apply 全局粒度**的工程管理约束：

- `constraints` 的 `references/brooks-law.md`：用户在 apply 期间想加人手 / 并行 subagent 加速时
- `constraints` 的 `references/delay-decision.md`：apply 期间遇到顶层架构层次的可逆决策时（与任务粒度的"实现细节可逆决策"不重叠）
- `constraints` 的 `references/human-in-loop.md`：apply 期间遇到"超出当前 change scope 的影响"等 apply 全局必停场景时（任务粒度的 checkpoint 必停由 executing-plans 负责）。步骤 6.2 边界验证失败时的"root cause 在 plan 之外 → 停下来问用户"也走本类 apply 全局必停通道。

#### 设计回写（实施中发现 artifact 有错）

实施途中发现 design / spec / proposal 与代码现实冲突（前提假设不成立、设计方案行不通、spec 漏了场景）——这属于 apply 全局必停场景，不允许 agent 自行绕过 artifact 继续写。执行序列：

1. **停下实施**，触发 `constraints` 的 `references/human-in-loop.md` 让用户拍板：(a) 回写 artifact（改完继续实施），还是 (b) 改代码迁就 artifact（仅限冲突确实属于实现细节时）。
2. 用户选回写 → 在本 change 内直接更新对应 artifact（design / spec delta；proposal 的"系统工程影响评估"节失实的一并修正），并在 tasks.md 记录"回写了 X，原因：<…>"。
3. **证据失效重跑**：回写使受影响任务的既有验证证据作废——按 `verification-before-completion` 的「之前测过」条重跑受影响任务的验证；回写波及分系统边界时，重跑步骤 6.2 对应边界的验证。重跑全绿后才继续实施。
4. 继续实施。

### 6. 完成判定

所有任务 `[x]` 后，做**两层最终验证**，两层都通过才算 done：

#### 6.1 change-level 验证

触发 `verification-before-completion` 做 change-level 最终验证（全量测试 / lint / build / type check）。

#### 6.2 系统级验证（跨分系统边界，硬步骤）

change-level 验证通过后，对照 `proposal.md` 的"系统工程影响评估"节列出的**受影响分系统**，逐条跑**跨分系统边界验证**——验证各分系统整合后的整体行为符合契约，而不只是每个任务局部绿。

"总体性能不等于各部分性能之和"（主基调第 1 条）——所有任务测试全绿不等于分系统整合正确。**执行语义由 `verification-before-completion` 第 6 节承载**（接口/契约测试、数据流传递、边界 mock 的具体做法在那里），本步骤只定义触发条件与 tier 分层强度（按步骤 1 注入的当前 tier）：

- `tier-small`：对受影响分系统边界跑冒烟级集成验证
- `tier-medium`：跑受影响边界的集成/契约测试
- `tier-large`：强制完整集成测试 + 契约测试，逐条对照"影响哪些分系统"清单

边界验证发现跨分系统问题 → 触发 `systematic-debugging` 找根因；若 root cause 在 plan 之外（proposal 的影响评估漏了分系统）→ 停下来问用户：是补 proposal 的评估还是改代码？

**层次观归位**：当 `field-assessment` 识别流程允许子系统独立定 tier 时，本步骤的跨分系统边界验证应**按子系统层次分别验证**——每个子系统按自己的 tier 强度验证，跨子系统的依赖链按"最高 tier 子系统"的强度处理（保守原则）。子系统独立定 tier 的执行规则见 `field-assessment` 的 `references/subsystem-tiering.md`。

#### 6.3 change 级收尾 code review（硬步骤）

两层验证（6.1 + 6.2）全部通过后，对本 change 的全部新增 / 修改代码做一次 change 级收尾 review——review 是完成判定链的最后阶段：先全绿拿验证证据，再对整体做 review。**执行语义由 `requesting-code-review` 的「change 级收尾 review」节承载**（review 对象、工具优先 / LLM 兜底的执行方式、与 checkpoint review 的分工在那里），本步骤只定义触发条件与 tier 分层强度：

- `tier-small`：保底抽查——只查 Spec compliance + 安全红线。小 change 可能全程轮不到 checkpoint review，收尾是它唯一的 review 机会，不整体跳过
- `tier-medium` / `tier-large`：review 深度按 tasks.md 全部任务 `风险` 字段的最高档取

review 判出 critical issue → **change 不算 done**，修复后重跑 6.1 change-level 验证（修复使既有验证证据失效，见 `verification-before-completion` 的「之前测过」条）；无 critical → 进入 6.4。

#### 6.4 current-change audit（按表 3 频率）

6.1–6.3 都通过后，对照表 3 的 **current-change scope** 频率决定是否触发 `td-system-audit current-change`（表 3 见 `field-assessment/references/audit-frequency.md`）：

- `tier-small`：不要求
- `tier-medium`：每个关键链任务完成时触发——该粒度由 `executing-plans` 的 checkpoint 负责（见该 skill 步骤 1）
- `tier-large`：每完成 1 个 change 触发——本步骤即触发点

触发即调用 `/td-system-audit current-change`，把本次 change 的"实际 vs 预期"对照主基调过一遍。

## Guardrails

- 不跳过任务，按 tasks.md 顺序
- 每个任务必须有验证证据，"我觉得改对了"不算
- 遇到 proposal 与实际代码冲突时，停下来问用户：是改 proposal 还是改代码？（执行序列见步骤 5 的「设计回写」）
