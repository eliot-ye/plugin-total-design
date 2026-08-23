---
name: td-apply
description: 实施任务，按 artifact 走。OpenSpec 契约层入口。触发场景：用户说"apply"、"实施"、"开始写代码"、"按 change 干"、"执行 tasks"、"开始执行"、"go"。执行入口统一走本 skill，行为层 executing-plans 由本流程内部调用。
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

**核心论点归位——"总体性能不等于各部分性能之和"**：步骤 7.2 的"系统级验证（跨分系统边界，硬步骤）"是核心论点最直接的体现。钱学森在《创建系统学》里明确说："系统的总体性能不等于各部分性能之和；关键是整体协调。"本工作流把这个论点工程化为：所有任务测试全绿只证明每个分系统局部正确，不能证明分系统整合后整体行为符合契约——所以 `td-apply` 步骤 7.2 必须做跨分系统边界验证。步骤 7.2 定义触发条件与 tier 分层强度，执行语义在 `verification-before-completion` 第 6 节。

**系统工程主基调第 2 条：总体设计部。**

apply 过程中遇到的关键决策，agent 不自己拍板，触发 `human-in-loop` 让用户（总体设计部）拍。

**《工程控制论》反馈控制回路归位**：apply 是控制执行 + 实时误差检测环节（TDD 契约级、verification 系统级）。

## 输入 - change 名。空则推导或问用户"想 apply 哪个 change"

`$ARGUMENTS`

## 步骤

### 1. 激活主基调与配置层

激活主基调与配置层。只注入强度不做判断，按下述三步序列执行：

1. **`system-engineering`** — 主基调四条进入上下文。apply 不是"按任务清单打勾"，是"在系统全局立场上推进实施"。
2. **profile × tier 识别** — 调 `field-assessment`，判读 `$_TD_PROFILE` / `$_TD_TIER`，读入表 1 + 表 2 + 表 3。会话内缓存，后续步骤直接引用。apply 期间**不主动触发 project-scope system-audit**，但按表 3 的 current-change scope 频率触发 current-change audit（见步骤 7.3）。
3. **其余 constraint** — 只把强度值读入上下文，不在本步判断是否触发——后续步骤据此判断是否触发 / tasks 是否合规。

### 2. 前置检查

对照步骤 1 注入的强度与当前 change 状态，判断是否触发：

- **change 完整性**：artifact 是否齐全？proposal 是否有"系统工程影响评估"节？没有 → 不算 apply-ready，停下来问用户。"预期行为模型"字段缺失时**不阻塞**，降级提示："proposal 缺'预期行为模型'字段（旧 change 兼容），apply 时以步骤 7.2 实际行为验证为准；新 change 应回 `/td-propose` 步骤 6.c 补填。"——与 `td-archive` 步骤 3 的旧 change 兜底对称（propose 6.c 对新 change 仍强制必填，本处只放行存量旧 change，不削弱 propose 侧约束）。
- **tier-large 总体设计文档必填**：若 `$_TD_TIER == tier-large`，检查 proposal 是否附了"总体设计文档"（见 `tier-large` 的「总体设计文档必填」节）。没这份文档 → **阻塞 apply**，提示用户回 `/td-propose` 补文档。与 `td-propose` 步骤 6.c 的检查在两处分别校验，避免漏检。
- **`wip-limit`（硬阻塞 + override，补拦）**：当前活跃 change 数已达上限？（apply 一个已达上限意味着 propose 阶段的 WIP 硬阻塞被 override 穿透，或 propose 阶段漏拦）。**阻塞本步骤，不执行步骤 3**，执行 `wip-limit` 的「硬约束 + override 机制」节（权威描述在该 skill；override 通过后继续步骤 3）。propose 与 apply 两处都必须执行硬阻塞 + override 机制。
- **`critical-buffer`**：tasks.md 里是否标注关键链？是否留了 project buffer（按当前 tier 比例，查表 1 的 critical-buffer 行；表 1 见 `field-assessment/references/strength-matrix.md`）？没有 → 触发 `writing-plans` 补上（关键链标注应在 propose 阶段完成，这里只补漏）。
- 其余 constraint（brooks-law / delay-decision / human-in-loop）在实施过程中按需触发，不在本步预判。

### 3. 读 change 的 artifact

按依赖顺序读：

1. `proposal.md`（what & why）
2. `design.md`（how）
3. `specs/` 下的 spec 文件
4. `tasks.md`（实施步骤）

### 4. 架构 review 复核 + 触发行为层

**进入任务实施前，复核架构 review 结论**：`td-propose` 步骤 7 已完成架构 review 且无 critical 才放行 apply——本步骤只复核：proposal / design 在 propose 之后是否被改过？**未改动 → 沿用步骤 7 结论，直接进入任务实施**；**有改动 → 重新触发 `requesting-code-review` 的架构 review**（对照 proposal 的"系统工程影响评估"节与 design.md，检查分系统切分与设计决策是否符合高内聚低耦合，检查清单见该 skill 的 `references/architecture-review-checklist.md`）。**架构级 critical 未修复 → 阻塞 apply**，提示用户回 `/td-propose` 步骤 6 改 proposal 再重新 review。

架构 review 通过后，按 `tasks.md` 的任务序列实施。行为层触发序列：

1. **`writing-plans`**（若 tasks.md 粒度不够细）：细化任务序列
2. **`executing-plans`**（按任务序列执行，内部按任务粒度嵌套触发以下 skill）：
   - **`test-driven-development`**：每个任务先写失败测试，再写实现
   - **`requesting-code-review`**：checkpoint 时做 review
   - **`verification-before-completion`**：每个任务完成前必须跑验证命令

`executing-plans` 是行为层执行的核心入口，TDD / review / verify 在 `executing-plans` 内部按任务粒度嵌套触发。executing-plans 内部触发的 human-in-loop / systematic-debugging 是**任务粒度**的（如 checkpoint 必停、RED 失败），与本步骤 5 的 apply 全局粒度触发不重复。

### 5. 触发 apply 全局粒度的工程管理约束

步骤 4 的 executing-plans 内部已触发任务粒度的 human-in-loop / systematic-debugging（如 checkpoint 必停、RED 失败）。本步骤触发的是 **apply 全局粒度**的约束，不与任务粒度重复：

- `brooks-law`：用户在 apply 期间想加人手 / 并行 subagent 加速时
- `delay-decision`：apply 期间遇到顶层架构层次的可逆决策时（与任务粒度的"实现细节可逆决策"不重叠）
- `human-in-loop`：apply 期间遇到"超出当前 change scope 的影响"等 apply 全局必停场景时（任务粒度的 checkpoint 必停由 executing-plans 负责）。步骤 7.2 边界验证失败时的"root cause 在 plan 之外 → 停下来问用户"也走本类 apply 全局必停通道。

### 6. 更新 tasks.md

每完成一个任务：

- 把 `- [ ]` 改成 `- [x]`
- 在任务后面加验证证据链接（测试输出、命令结果）

### 7. 完成判定

所有任务 `[x]` 后，做**两层最终验证**，两层都通过才算 done：

#### 7.1 change-level 验证

触发 `verification-before-completion` 做 change-level 最终验证（全量测试 / lint / build / type check）。

#### 7.2 系统级验证（跨分系统边界，硬步骤）

**执行序列**：读 proposal 的"系统工程影响评估"节列出受影响分系统 → 按 tier 强度逐条跑跨分系统边界验证 → 发现问题触发 `systematic-debugging` 找根因 → root cause 在 plan 之外则停下来问用户。

change-level 验证通过后，对照 `proposal.md` 的"系统工程影响评估"节列出的**受影响分系统**，逐条跑**跨分系统边界验证**——验证各分系统整合后的整体行为符合契约，而不只是每个任务局部绿。

"总体性能不等于各部分性能之和"（主基调第 1 条）——所有任务测试全绿不等于分系统整合正确。**执行语义由 `verification-before-completion` 第 6 节承载**（接口/契约测试、数据流传递、边界 mock 的具体做法在那里），本步骤只定义触发条件与 tier 分层强度（按步骤 1 注入的当前 tier）：

- `tier-small`：对受影响分系统边界跑冒烟级集成验证
- `tier-medium`：跑受影响边界的集成/契约测试
- `tier-large`：强制完整集成测试 + 契约测试，逐条对照"影响哪些分系统"清单

边界验证发现跨分系统问题 → 触发 `systematic-debugging` 找根因；若 root cause 在 plan 之外（proposal 的影响评估漏了分系统）→ 停下来问用户：是补 proposal 的评估还是改代码？

**层次观归位**：当 `field-assessment` 识别流程允许子系统独立定 tier 时，本步骤的跨分系统边界验证应**按子系统层次分别验证**——每个子系统按自己的 tier 强度验证，跨子系统的依赖链按"最高 tier 子系统"的强度处理（保守原则）。子系统独立定 tier 的执行规则见 `field-assessment` 的 `references/subsystem-tiering.md`。

#### 7.3 current-change audit（按表 3 频率）

两层验证通过后，对照表 3 的 **current-change scope** 频率决定是否触发 `td-system-audit current-change`（表 3 见 `field-assessment/references/audit-frequency.md`）：

- `tier-small`：不要求
- `tier-medium`：每个关键链任务完成时触发——该粒度由 `executing-plans` 的 checkpoint 负责（见该 skill 步骤 3），此处不再重复
- `tier-large`：每完成 1 个 change 触发——本步骤即触发点

触发即调用 `/td-system-audit current-change`，把本次 change 的"实际 vs 预期"对照主基调过一遍。audit 报告落盘 `openspec/.td-state/audits/`，更新 `audit-history.yaml`。

## Guardrails

- 不跳过任务，按 tasks.md 顺序
- 每个任务必须有验证证据，"我觉得改对了"不算
- 遇到 proposal 与实际代码冲突时，停下来问用户：是改 proposal 还是改代码？
