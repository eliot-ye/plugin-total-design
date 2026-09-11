# 设计讨论：autonomous 模式——离线批量执行已确认的 change

> 状态：设计讨论稿，未进入执行阶段。迭代稳定后再执行。

## 问题陈述

用户场景：人在场时逐个 propose 并确认多个 change（A、B、C），然后离开。agent 在无人现场时按提案顺序自动执行 apply → archive → commit 循环。

当前设计不支持此场景。根因不在 WIP 限制，而在 **apply 过程中的人在回路（human-in-loop）停点**——propose 再完善也不能完全消除 apply 中的未知情况，而当前设计在那些情况下一律停下来等用户。

## 设计约束（用户给定）

**autonomous 模式下，proposal 阶段就要处理所有应该人拍板的决策，否则该 change 不可作为 autonomous 模式下的选择。**

安全模型由此根本改变：agent 只在已确认框架内执行实现细节，框架外一律回退。不再有"agent 替人做系统级决策"的分支。

### 决策早闭合的普遍性

上述约束对 autonomous 模式是必要的（人不在场，无法临场闭合），但**对 human-in-loop 模式同样成立**——这不是"两种模式各有哲学"，而是 `delay-decision` 的判据在两种条件下的推论：

`delay-decision` 的核心是"可逆延迟、不可逆闭合"。7 类必停场景里，第 1 类（公共契约）、第 2 类（不可逆决策）、第 3 类（生产环境影响）都是不可逆或近似不可逆的——按 `delay-decision` 应当早闭合，而不是延迟到 apply 阶段触发时才问人。当前 human-in-loop 模式下这三类的决策被延迟到 apply 阶段触发时闭合，恰恰违反 `delay-decision` 的延迟前提（可逆性）。

因此本设计把 7 类决策清单作为 proposal 的新增必填节，两种模式都填——不是 autonomous 模式对 human-in-loop 的特殊化，而是修复两种模式下都存在的一个错位：不可逆决策本应早闭合。autonomous 模式额外要求的是**清单必须填完才允许编排**（因为编排后无法中途问人），human-in-loop 模式下清单同样必须填完才能 propose 通过，但填不完美时可现场补。

`delay-decision` 本身并未被废除——可逆决策（如方案选型）仍可延迟到 apply 阶段闭合。本设计只要求不可逆/近似不可逆决策（第 1-3 类）早闭合，与 `delay-decision` 的判据一致。

## 与主基调的关系

零摩擦。

| 主基调条 | 关系 |
|---|---|
| 第 1 条：系统工程 | apply 仍在系统全局立场上推进，不因离线而降级 |
| 第 2 条：总体设计部 | 决策权始终在人，只是行使时机从 apply 前移到 propose——人在 propose 拍板所有系统级决策，apply 不再临场问人 |
| 第 3 条：综合集成 | 7 类编号清单强制逐类显式确认（`[已确认]` / `[不适用]` / `[不覆盖]` 三态），避免 apply 阶段凭 agent 判断临场补拍 |
| 第 4 条：开放的复杂巨系统 | autonomous 模式下 agent 不并行硬解系统级问题，只在已确认框架内做实现 |

## 核心机制

### 1. `.td-state/autonomy.yaml`——运行策略配置

```yaml
# openspec/.td-state/autonomy.yaml
mode: human-in-loop    # human-in-loop | autonomous
set_at: <ISO8601>
set_reason: <一句话，如"批量执行已确认的 change，人不在场">   # 纯意图记录，编排者不消费；用于人回来时理解上次为何切 autonomous
```

- `human-in-loop`（默认）：当前行为，所有 human-in-loop 必停场景照常停。
- `autonomous`：必停场景不停下来等用户，改为"在已确认决策清单范围内按确认结论执行 / 超出范围回退"。
- 文件不存在 → 视为 `human-in-loop`（向后兼容）。
- 文件按需创建：`td-init` 不主动创建；`/td-autonomous-run` 首次触发时检测到文件不存在，引导用户确认后创建（见第 8 节 skill 行为步骤 0）。

#### 放在 `.td-state/` 的理由

`.td-state/` 现有三个文件（`archive-counter.yaml` / `audit-history.yaml` / `profile-tier.yaml`）全部满足"可从文件系统事实推导"的契约。本设计新增两个文件后，`.td-state/` 语义从「全部可推导」扩展为三类：

| 类别 | 文件 | 可从文件系统推导 | 写入方 |
|---|---|---|---|
| 可推导 | archive-counter.yaml / audit-history.yaml / profile-tier.yaml | ✅ | hook 校正 / skill 写入 |
| 用户偏好 | autonomy.yaml | ❌ | 用户手动改（首次创建由编排者引导） |
| agent 行为记录 | autonomy-log.yaml | ❌ | 编排者写入；hook 可补漏记 completed |

三类都满足 gitignore 的第二条腿——**per-machine / 不该跨人共享**：两个人的自治策略不同，提交进 git 只会制造冲突；autonomy-log 是 agent 在**这台机器上**的行为记录，跨人共享同样无意义。gitignore 理由不变，扩展的是"per-machine"的语义边界——从"可推导状态"扩到"per-machine 的一切非团队共享状态"。

hook 契约的影响：现有 `td_state_sync.js` 只碰可推导类；本设计 hook 新增对 autonomy-log.yaml 的补漏（补漏条件是 `archive/YYYY-MM-DD-<change-name>/` 目录 + 对应 commit 两个文件系统事实同时成立，见第 9 节）。autonomy.yaml 用户偏好类 hook 不碰——用户改文件是用户的事。

不放 `openspec/config.yaml`（团队共享文件，autonomy 相关状态是 per-machine 的）。不靠环境变量（不持久，"设好就走人"场景下每次开 session 要重设）。不靠 `field-assessment` 判读（自治模式不是可观察事实，无静态配置文件）。

### 2. 已确认决策清单——proposal 新节（跨模式）

两种模式的 propose 阶段共享同一份已确认决策清单，作为 proposal.md 的新增必填节。清单承载 7 类必停场景的显式覆盖结论、前置依赖声明、caller impact 实测结果——这些是设计信息，与运行态无关，属契约产物（归档后只读）。

autonomy 模式的运行态信息（运行记录）另立 `autonomy-manifest.md`，apply 阶段创建，与清单分离。

#### 文件位置

```
openspec/changes/<change-name>/
├── proposal.md            ← 含「前置依赖」+「已确认决策清单」+「caller impact 实测」三节（两种模式都写）
├── design.md
├── tasks.md
└── autonomy-manifest.md   ← autonomous 模式专用，apply 阶段创建（只承载运行记录）
```

`autonomy-manifest.md` 不再作为 propose 阶段的产物，也不作为 change 级的"是否需要批量执行"标记——是否批量执行由 `autonomy.yaml` 的 mode + `/td-autonomous-run` 调用表达，编排者不再检查该文件的存在性。human-in-loop 模式下不创建此文件。

#### proposal 新节结构（两种模式都写）

```markdown
## 前置依赖

- [无依赖] 本 change 不依赖其他 change 的完成
- [依赖 <change-a>] 需 <change-a> 已完成并 commit 后方可执行

**环检测**：写入本节前必须做环检测——本 change 依赖图中不允许出现循环（本 change → 依赖 A → … → 本 change），包括经由其他 change 间接成环。检测到环 → 先与用户确认依赖链修正（通常是拆分 change 或改依赖方向）。环由非本轮待执行队列中的 change 参与时同样阻止——否则编排者会在运行时因依赖未满足挂起，且挂起链闭合即循环依赖。

## 已确认决策清单（对照 human-in-loop 7 类必停场景）

### 第 1 类：公共契约变更
- [已确认] API 变更：<具体变更 + 确认结论>
- [已确认] schema 变更：<具体变更 + 确认结论>
- [不适用] 配置文件格式：无变更

### 第 2 类：不可逆决策
- [已确认] <决策内容 + 结论>
- [不适用] 无不可逆决策

### 第 3 类：生产环境影响
- [已确认] <生产环境影响 + 确认结论>
- [不适用] 无生产环境影响

### 第 4 类：超 scope 影响
- [已确认] 分系统切分：<来自 design.md>
- [已确认] 超 scope 可能性：<排除依据>

### 第 5 类：agent 置信度低
- [已确认] 不确定性已消除：<design.md 兜底依据>
- [不适用] 无遗留不确定性

### 第 6 类：WIP override
- [不适用] autonomous 模式下 WIP 检查不生效，本类结构上不可能触发
- human-in-loop 模式下由 `wip-limit` override 流程触发，不在本清单覆盖

### 第 7 类：audit 触发
- [不覆盖] audit 触发一律回退当前 change（autonomous 模式），`reason` 标注 audit 触发第 7 类（人工审查用）；不由本清单覆盖

## caller impact 实测（propose 阶段完成，跨模式）
- [已实测] caller 清单：<file:line + 兼容结论>
- [无未知 caller] 实测未发现 proposal 未标注的 caller
```

#### autonomy-manifest.md 结构（autonomous 模式专用，apply 阶段创建）

```markdown
# Autonomy Manifest — <change-name>

## 运行记录（td-apply 追加）

| 时间 | 步骤 | 事件 | 决策来源 |
|---|---|---|---|
| <ISO8601> | 步骤 5 | 沿用 proposal 已确认：API 变更按方案 A | proposal「已确认决策清单」第 1 类 |
| <ISO8601> | 步骤 4 | caller impact 复核通过，无新增 caller | proposal「caller impact 实测」 |
| <ISO8601> | 步骤 5 | ⚠️ 回退：proposal 前提假设不成立（库 X API Y 不存在） | 超出已确认范围 |
```

**归档 gate 的唯一事实源**：是否可归档不写在 manifest 内——由 `.td-state/autonomy-log.yaml` 的 `action` 字段（`completed` / `rolled-back`）承担。编排流程里 td-apply 判定回退后不会进入 td-archive，autonomy-log 是编排者与跨 session 恢复共同读取的进度链；人手动补跑 td-archive 时同样通过读 autonomy-log 判断该 change 的 action，无需在 manifest 内维护独立的归档判定字段。

#### 设计理由

清单进 proposal 而非独立文件，运行记录仍独立成文件，原因：

1. **契约 vs 运行态的边界**：清单是设计信息（归档后只读），运行记录是运行态信息（td-apply 追加）。两者读写模式不同——清单混进 manifest 会破坏 proposal 的只读性，运行记录混进 proposal 会污染契约产物。
2. **清单跨模式，运行态 autonomous 专用**：清单对 human-in-loop 与 autonomous 两种模式都有效（决策早闭合对两者都更优），运行记录只在 autonomous 模式下有意义（human-in-loop 下人在场，无需记录运行轨迹）。按这个边界切，而不是按"模式"切。
3. **manifest 不再是 propose 阶段产物**：清单迁出后 manifest 只剩运行记录，propose 阶段创建它等于创建空文件。改为 apply 阶段创建，生命周期与运行记录的产生同步。
4. **失败日志的 change 侧锚点**：td-apply 在 autonomous 模式下回退时，在本文件的"运行记录"表追加回退条目（与 `.td-state/autonomy-log.yaml` 的全局日志对应——后者是跨 change 的全局视图，本文件是 change 内局部视图）。

#### caller impact 实测前移（跨模式）

这是最大的流程变化。当前 td-propose 步骤 6.c 的 caller impact 分析是"前馈定位"（类别标注 + 高危标记），完整 caller 实测在 td-apply 步骤 4。实测前移对两种模式都成立——human-in-loop 模式下 apply 阶段发现未知 caller 会中断流程（停下问人），autonomous 模式下则直接回退；两种模式都付出了"前馈定位白做"的代价。

propose 阶段做实测，结果写入 proposal.md 的「caller impact 实测」节（跨模式必填，不区分 tier）。**tier-small 例外取消**：当前 tier-small 在 human-in-loop 模式下可跳过 caller 实测，本设计下 tier-small 也必须实测——理由见上方设计约束节"决策早闭合的普遍性"段。

apply 阶段改为"只复核不新增"，复核语义含两部分：① 无新增 caller（propose 阶段未标注的 caller 在 apply 阶段被实测发现）；② 已标注 caller 的兼容结论在当前基线可复现（前序 change 若改变了已标注 caller 的行为，本 change 的实测必须能重现 propose 阶段标注的兼容结论；无法复现 → 视同"新 caller"）。两部分中任一部分失败 → autonomous 模式回退当前 change（在运行记录表追加回退条目）；human-in-loop 模式下仍走 human-in-loop 第 4 类必停场景（停下问用户），与当前行为一致。

**staleness 缓解**：批量执行时前序 change 会改变代码基线，导致后续 change 的 proposal caller 实测过时。缓解分两层——

1. **proposal 的"前置依赖"节**（本节上方模板）：声明本 change 依赖哪些 change 已完成并 commit，编排者按依赖序执行，跳过依赖未满足的 change，减少基线漂移。
2. **scope 边界的判定权仍在人**：proposal 第 4 类的 scope 边界是 propose 阶段人拍板的结论。apply 阶段"只复核不新增"不放宽这条边界——新 caller 无论是否看起来合理，autonomous 模式下回退当前 change，human-in-loop 模式下停下问用户；判定是补 proposal 还是调整 scope 的权始终在人。

第一层减少 staleness 发生概率，第二层不放宽判定权。不引入"apply 阶段按 scope 自动放行新 caller"的分支——那会把"人拍板 scope 边界"前移回 apply，与设计约束矛盾。

### 3. apply 阶段行为变更

autonomous 模式下，td-apply 步骤 5 的 human-in-loop 触发逻辑变为：

```
触发 human-in-loop 必停场景时：
  → 查 proposal.md「已确认决策清单」节是否显式覆盖了该类场景
    → 显式覆盖（有对应的 [已确认] 条目）→ 按确认结论执行，在 autonomy-manifest.md 运行记录表记录"沿用 proposal 清单确认"
    → 未显式覆盖 → 走残留场景处理（见第 5 节）
```

**判定规则**：proposal「已确认决策清单」节的 7 类与 human-in-loop 的 7 类必停场景一一对应——第 1-5 类由清单显式覆盖（标 `[已确认]` 或 `[不适用]`），第 6 类（WIP override）标 `[不适用]`（autonomous 模式下 WIP 检查不生效，结构上不可能触发），第 7 类（audit 触发）标 `[不覆盖]`（一律回退，`reason` 标注 audit 触发第 7 类）。运行时触发的 human-in-loop 场景能明确对应到第 1-5 类且标 `[已确认]` 时，按该类条目的结论执行；无法对应、或对应到的条目标的是 `[不适用]` 但实际触发了、或触发第 7 类 → 走残留场景处理（见第 5 节），一律回退。

**"实现细节"的边界**：agent 可自主的范围仅限于——TDD 的红绿重构循环、代码风格对齐既有实现、测试策略调整、内部模块实现细节。这些不属于 human-in-loop 7 类必停场景，autonomous 模式下照常自主执行。一旦触碰 7 类中任何一类的实际触发条件 → 走上面的 proposal 清单查询逻辑。

不再有"自治处理本该人拍板的决策"这个分支。agent 不替人做系统级决策，只做实现细节。

### 4. 两种模式下的 LLM 思考差异

两种模式的**执行动作**差异在第 3 节已列出（同一份 proposal 清单，未覆盖时分叉为「停下问」vs「回退」）。本节列出更深的差异——**LLM 的思考结构**在两种模式下是不同的。

#### 阶段级动作差异

| 阶段 | human-in-loop | autonomous |
|---|---|---|
| propose 产物 | proposal 新节（前置依赖 + 已确认决策清单 + caller impact 实测，跨模式共享） | 同左，额外要求"清单必须填完才允许编排" |
| 7 类触发时 | 停下 → 生成选项 + 列影响 + 给推荐 + 明确等待 | 查清单 → 命中则执行 / 未覆盖则回退 |
| 完成判定 | 4 层验证（6.1/6.2/6.3/6.4） | 同左 |
| archive | 手动 `/td-archive` | 编排者自动触发 |
| commit | 手动，逐个询问 | 步骤 0 显式授权一次，循环内不再询问 |
| 循环驱动 | 无循环，单 change 单次结束 | `td-autonomous-run` 设 goal → agent native loop |
| 进度持久化 | `tasks.md` 单 change | 加 `autonomy-log.yaml` 跨 change |

#### 7 类触发时的分支差异（唯一的语义差异）

7 类场景触发时，两种模式走**同一份 proposal 清单**，只在"未覆盖时"分叉：

| 触发场景 | human-in-loop | autonomous |
|---|---|---|
| 清单命中 `[已确认]` | 按结论执行 | 按结论执行 + 写运行记录 |
| 清单 `[不适用]` 但实际触发 | 停下问用户 | 回退 |
| 清单未覆盖 / 无法对应 | 停下问用户 | 回退 |
| 第 7 类 audit 触发 | 停下问用户 | 回退 + `reason` 标注 |

其他所有环节（propose 产物、清单内容、caller 实测、4 层验证、warning 延后处理）完全一致。

#### LLM 思考差异（核心）

**1. 停下等 vs 立即决策**

`human-in-loop.md` 第 46-50 行「触发时 agent 应做的事」定义了 LLM 在 human-in-loop 模式下的思考产出：描述状态 → 列选项 + 影响 → 给推荐 + 理由 → 明确等待。

autonomous 下这四步**全部消失**——没有"列选项"（人不在场，无人接收），没有"给推荐"（无接收方），没有"明确等待"（无人可等）。取而代之的是一个更机械的判断：查清单 → 命中则执行 / 未覆盖则回退。

具体例子——遇到"proposal 前提假设不成立"：

| | human-in-loop 下 LLM 的思考 | autonomous 下 LLM 的思考 |
|---|---|---|
| 第 1 步 | 描述状态：库 X 的 API Y 不存在 | 描述状态（可选，写运行记录表） |
| 第 2 步 | 列选项：(a) 回写 artifact 改设计；(b) 改代码迁就 artifact | 检查清单是否覆盖此场景 |
| 第 3 步 | 给推荐：建议 (a)，因为设计方案本身有问题 | 清单未覆盖 → 走残留场景 |
| 第 4 步 | 明确等待用户回复 | 执行 `git stash push -u ...` 回退，写 `rolled-back`，继续下一个 |

**2. 思考的"延伸边界"不同**

- **human-in-loop**：LLM 的思考可以延伸到"用户会怎么选"——它必须生成多个选项、评估各自后果、给出推荐，本质是在**预演用户的决策空间**。思考包含"如果用户不同意我怎么办"的分支。
- **autonomous**：LLM 的思考收敛到"是否命中清单 / 是否该回退"这个二值判断。它不预演用户的决策空间——**用户的决策在 propose 阶段已经闭合了**。

**3. 修复策略的思考差异**

code review 判 critical 时（详见第 5 节"code review critical 的处理"）：

- **human-in-loop**：LLM 可以**修改性修复**（重写逻辑、换实现方案）——用户在场，可以评估"这个新方案是否值得冒这个险"。LLM 的思考包含"这个修改会不会引入新问题"的评估。
- **autonomous**：LLM 只能**删减性修复一次**（只删被 review 判 critical 的具体改动，不重写）。因为修改性修复可能引入新 critical，而没人现场拍板"是否值得冒这个险"。LLM 的思考被限制在"删掉哪部分"这个机械判断里。

**4. 认知过载的转移（最根本的差异）**

- **human-in-loop**：认知负载在 **apply 阶段的人** 这边——人要在多个决策点持续在场、持续判断、持续回复。LLM 的工作是"生成选项 + 列影响 + 给推荐"，帮助用户降低判断成本。
- **autonomous**：认知负载在 **propose 阶段的人** 这边——人必须在 propose 阶段一次性把所有决策都闭合（填完 7 类清单），否则 apply 阶段会因"未覆盖"回退。LLM 的工作从"帮助用户决策"转为"按已决策执行 + 遇到未覆盖立即回退"。

**autonomous 模式下 LLM 不再是"决策助手"，而是"决策执行器 + 决策越界检测器"**。它的思考模式从"生成决策空间"收敛为"查已决策表 + 触发越界告警"。

### 5. 残留场景——回退

即使 propose 阶段排尽所有已知决策点，apply 仍可能遇到**不可预测的运行时冲突**。一律**回退**（撤销代码改动，写 `rolled-back`，编排者继续下一个 change）：

| 场景 | 当前行为 | autonomous 模式行为 |
|---|---|---|
| proposal 前提假设不成立（设计回写场景） | 停下问用户：回写 artifact 还是改代码 | **回退**，写日志，继续下一个 |
| 测试失败 2 次以上，根因在 plan 之外 | 停下问用户 | **回退**，写日志，继续下一个 |
| caller impact 复核发现 propose 未标注的 caller | 全局必停上报 | **回退**，写日志，继续下一个 |
| 架构 review 判 critical | 阻塞，回 propose 改 | **回退**，写日志，继续下一个 |
| 收尾 code review 判 critical | 阻塞，修复后重跑验证 | **只做删减性修复一次 → 重跑 code review；仍 critical 则回退**（不允许修改性修复——修改可能引入新 critical；见下方"code review critical 的处理"），写日志，继续下一个 |
| 收尾 code review 判 warning | 记录到 proposal，可延后 | **记录延后，不自动修复**（与 human-in-loop 模式一致，见下方"code review warning 的处理"） |
| td-system-audit 触发 human-in-loop 第 7 类 | 停下问用户 | **回退**，写日志，继续下一个（`reason` 标注 audit 触发第 7 类，人工审查用） |

**回退机制**：`git stash push -u -m "rollback <change-name>" -- . ':(exclude)openspec/changes/<change-name>/**'` 撤销本 change 的代码改动（含未跟踪的源码文件），保留 artifact（proposal / design / tasks / autonomy-manifest）不删。stash 保留改动在栈中可恢复——人回来后 `git stash pop` 救回、`git stash drop` 放弃。

**命令单一事实源**：本节是回退命令的设计权威，落地时命令原文与读写规则一并固化到 `td-apply/references/autonomy-template.md`（见文件表），td-apply 与 td-autonomous-run 两个 skill 都通过该 references 路径引用——不在 SKILL.md 里各自复制命令文本（避免两份漂移）。

不用 `git checkout <file>`：那是不可恢复的减法操作，autonomous 模式下 agent 在无人现场执行没有第二次机会。stash 同样是丢弃工作树改动，但保留恢复路径——回退是必要的（critical 代码留在工作树会污染后续 change 的基线），但恢复权必须留给人。

**`-u` 与 `:(exclude)` 的必要性**（隔离 scratch repo 实测）：不加 `-u` 时未跟踪的新增源码（如 `brand-new.js`）留在工作树，下一个 change 从"脏基线"开始；加 `-u` 不加 `:(exclude)` 时 artifact（`openspec/changes/<name>/`）一起被清走，违反"保留 artifact"约定；两者同时加 = 工作树干净 + artifact 保留。

回退的 change 写入 `autonomy-log.yaml`，人回来后处理。

#### code review critical 的处理

收尾 code review 判 critical 时，agent **只做删减性修复一次**（不做修改性修复），随后重跑 change-level 验证（6.1）+ 收尾 code review（6.3）：

1. **删减性修复**：仅删除/回退被 review 判为 critical 的具体改动（等价于部分回退），不重写业务逻辑。
2. **不允许修改性修复**：修改性改动（重写逻辑、换实现方案）可能引入新的 critical，autonomous 模式下无人现场拍板"是否值得冒这个险"。
3. 重跑 code review 仍 critical → 走第 5 节回退机制，`git stash push -u -m "rollback <change-name>" -- . ':(exclude)openspec/changes/<change-name>/**'` 撤销全部代码改动，编排者继续下一个 change。
4. 架构 review critical 不在此列——架构 review 在 apply 前就跑完了（`td-propose` 步骤 7 或 `requesting-code-review` 的架构 review），架构 review 判 critical 是"apply 不开始"，不是"apply 中途回退"；本场景表里的"架构 review 判 critical"行特指 apply 阶段被触发的架构 review 复审（如 td-apply 步骤 5 触发的架构 review）。

**与 warning 的处理对比**：critical 是"agent 立即处理"（删减性修复一次 → 重跑 → 仍 critical 则回退），warning 是"延后人工处理"（记录延后不修）——两者的处理路径与 human-in-loop 模式的语义分工一致，autonomous 模式只改变"停下问人"这一动作（改成回退或延后），不改变 warning/critical 的语义分层。

#### code review warning 的处理

autonomous 模式下 warning **不自动修复**——与 human-in-loop 模式一致（记录到 proposal，延后处理）：

1. 收尾 code review 判出 warning → 记录到 `autonomy-manifest.md` 运行记录表，标"warning 延后人工处理"，继续归档流程（warning 不阻塞归档）。
2. critical 不在此列——架构 review critical 或收尾 code review critical → 走第 5 节回退机制（命令形式与日志写入均以第 5 节为单一事实源），编排者继续下一个 change。

**不自动修复的理由**：修 warning 可能引入新问题（新引入的改动又可能被判 critical），autonomous 模式下无人现场拍板"是否值得冒这个险"。保守策略下：warning 是延后项（人回来处理），critical 是回退项（agent 立即处理）——两者的处理路径与 human-in-loop 模式的语义分工一致，autonomous 模式只改变"停下问人"这一动作（改成回退或延后），不改变 warning/critical 的语义分层。

### 6. `.td-state/autonomy-log.yaml`——进度与失败日志

```yaml
# openspec/.td-state/autonomy-log.yaml（autonomous 模式专用）
entries:
  - timestamp: <ISO8601>
    change: <change-name>
    action: completed        # completed | rolled-back
    summary: <一句话结果，如"3 个任务全绿，caller impact 复核通过，已 commit">
  - timestamp: <ISO8601>
    change: <change-name>
    action: rolled-back
    reason: <前提假设不成立 / 测试失败 2 次以上根因在 plan 外 / 新 caller / 架构 review critical / 收尾 code review critical / audit 触发第 7 类>
    detail: <失败摘要>
    stash_ref: <git stash list 的引用，如 "stash@{0}">
```

`completed` 条目在 change 成功 archive + commit 后写入；`rolled-back` 条目在 change 因不可预测的运行时冲突被回退时写入（前提假设不成立 / 测试失败 2 次以上根因在 plan 外 / 新 caller / review critical / audit 触发第 7 类），并记录 `stash_ref` 指向撤销代码所在的 stash（人回来 `git stash list` 可对照定位）。audit 触发时 `reason` 字段显式标注"audit 触发第 7 类"，人回来时能识别批次级问题（如 profile/tier 误判导致整批走偏）。两种条目共同构成进度链——编排者和跨 session 恢复都靠读这个文件决定"从哪续跑"。

比上一轮设计更简单——不需要 `auto_resolution` 字段，也不设 `paused` action：autonomous 模式下 agent 不做系统级自治决策，也不做批次级停止信号（批次级停止只在 `git add -A` 前置不变式违反时发生，属于编排者基线检查、不写入本文件）。

### 7. WIP 限制的交互

autonomous 模式下 WIP 限制**直接不生效**。

理由：WIP 约束的是**人同时并行处理的 change 数**（防认知过载 / Brooks 定律），autonomous 模式下 agent 是**顺序执行**——一个 change 走完 apply → archive → commit 才做下一个，不存在"同时并行"的语义。propose 阶段人还在场时 WIP 已生效过（控制了同时创建的 change 数），到 autonomous apply 阶段再用 WIP 卡等于拿一个人的认知约束去限制一个顺序执行的 agent。

这也消除了 human-in-loop 第 6 类（WIP override）在 autonomous 模式下的触发可能——WIP 检查被跳过，override 回路结构上不可能进入，不存在"未覆盖"的歧义。

### 8. 编排 skill——`td-autonomous-run`

#### 为什么需要编排者

当前所有 td-* skill 都是单次执行语义：td-apply 做完一个 change 就结束，td-archive 归档完就结束。没有一个 skill 负责"按优先级逐个驱动 apply → archive → commit 循环"。autonomous 模式的核心场景——"人走了，agent 自己跑完一批"——需要这个编排者。

#### 设计原则：skill 不实现循环

skill 不包 `while (changes remain)` 循环。三层结构各司其职：

| 层 | 机制 | 职责 |
|---|---|---|
| **session 内循环** | agent native session loop | 在单个 session 内逐 change 驱动 apply → archive → commit |
| **进度持久化** | `autonomy-log.yaml`（`completed` / `rolled-back` 条目） | 记录每个 change 的处理结果，跨 session 续跑依据 |
| **跨 session 恢复** | 用户重新触发 `/td-autonomous-run` 或 `/loop /td-autonomous-run` + `schedule_wakeup` | session 断了之后恢复循环 |

理由：

1. agent 的 native session loop 已经是循环——用户给一个 goal，agent 会持续工作直到 goal 达成或被打断。skill 再包循环是重复语义。
2. 符合本 plugin 的触发式哲学——skill 只设定 goal + per-change 协议，循环由 agent 自然驱动迭代，不靠 hook 或显式循环强制。
3. `/loop` 是可选增强层——skill 本身不依赖 `/loop`，小批量单 session 够用；大批量用户自行选 `/loop` 包装。
4. resume 检查点是已有状态文件——`tasks.md`（change 内进度）+ `autonomy-log.yaml`（跨 change 进度），不需要新 checkpoint 机制。

#### skill 行为

```
td-autonomous-run:
  0. 检查 .td-state/autonomy.yaml 是否存在：
     - 不存在 → 提示"当前未配置自治模式。继续将创建 autonomy.yaml 并切换到 autonomous 模式：此后每个 change 在 archive 成功且无失败记录时将自动 commit（相当于批量 commit 授权，可随时改 mode 字段中止）。确认继续？"→ 用户确认后创建文件（mode: autonomous；set_at = 当前时间；set_reason = 用户一句话说明或默认"批量执行已确认的 change，人不在场"）
     - 存在但 mode != autonomous → 提示"当前是 human-in-loop 模式，无需编排"
  1. 读 autonomy.yaml 确认 mode == autonomous
  2. 读 openspec/todo.md 拿优先级序列（P0 → P1 → P2；格式规则见 `todo-pool` 的「格式约定」节）
  3. 读 autonomy-log.yaml，排除已处理的 change（completed 跳过，rolled-back 跳过不重试）
  4. 读 openspec list 拿活跃 change 列表，交叉匹配 todo.md 序列 → 确定待执行队列
  5. 检查每个待执行 change 的 proposal「前置依赖」节：依赖的 change 必须都在 autonomy-log.yaml 的 completed 条目里（不在 → 跳过，等依赖满足后再触发；依赖被 rolled-back → 跳过并在 goal 里提示"N 个 change 因依赖未满足挂起"）。**兜底环检测**：编排者按依赖关系构造待执行队列时若发现挂起链闭合（如 A 依赖 B、B 依赖 A，或经由更多 change 的间接链），在 goal 里显式标记"疑似循环依赖：<change 列表>"——propose 阶段的环检测是唯一阻止点（本 skill 不负责阻止，只负责识别和报告），标记后这些 change 保持挂起、不自动修复
  6. 设 goal: "按优先级处理剩余依赖满足的 change，每个走 td-apply → td-archive → commit，直到全部完成或剩余待执行为空"
  7. agent native loop 驱动迭代；**每个 change 开始前重读 `autonomy.yaml` 的 mode**——若已被改为 `human-in-loop` 则停止本批次（"随时中止"靠这条循环内重读生效，不等当前 change 跑完）
```

每个 change 结束时，编排者按结果写 `autonomy-log.yaml`：
- 全部验证通过 + archive + commit 成功 → `completed`
- 前提假设不成立 / 测试失败 2 次以上根因在 plan 外 / 新 caller / 架构 review critical / 收尾 code review critical / audit 触发第 7 类 → `rolled-back`（含 `reason` / `detail` / `stash_ref`，代码按第 5 节回退机制 `git stash push -u -m "rollback <change-name>" -- . ':(exclude)openspec/changes/<change-name>/**'` 撤销，编排者继续下一个；audit 触发时 `reason` 显式标注"audit 触发第 7 类"）

#### commit 落脚点

**commit 授权机制**：步骤 0 创建 `autonomy.yaml` 时的显式确认即 commit 授权——提示文本明确告知"每个 change 在 archive 成功且无失败记录后将自动 commit"，用户确认后才切换到 autonomous 模式。后续编排循环内的 commit 不再逐个询问，用户可通过修改 `autonomy.yaml` 的 `mode` 字段随时中止。

编排者在每个 change 成功 archive 后执行 commit：

```
archive 成功 →
  读 autonomy-log.yaml 该 change 的 action:
    无条目 / 有失败记录 → 不 commit（等人工处理）
    completed → git add -A && git commit（conventional commits 格式，co-authored trailer）
```

**`git add -A` 的前置不变式**：本 change 的产出跨越源码改动、`openspec/changes/archive/YYYY-MM-DD-<change-name>/`、`openspec/specs/`（sync）、`openspec/todo.md`（勾选），无法用固定路径列表表达，故用 `git add -A`。安全性靠不变式保证——**commit 时工作树只含本 change 的改动**。该不变式由三条机制守住：① 编排者顺序执行，上一个 change commit 完成后工作树已干净，本 change 从干净基线开始；② 回退按第 5 节回退机制清空工作树（含未跟踪源码），不残留；③ 编排者在 commit 前读 `git status --porcelain`，若发现不属于本 change 的改动路径（例如前序 session 中断残留的其他 change 文件）→ 停止整个批次（不写 autonomy-log，因为这不是"change 失败"、是"批次基线被污染"——写一条 rolled-back 会误导人以为该 change 有问题），提示人处理后再续跑。

commit 消息模板（SKILL.md 自包含书写，不引用本仓库的 AGENTS.md）：

```
<type>: <change-name> — <proposal 的一句话描述>

<body(可选，尽量精简)>

Co-Authored-By: AtomCode (<model>) <noreply@atomgit.com>
```

`<type>` 用 conventional commits 类型（`feat` / `fix` / `refactor` / `docs` / `chore` / …）；`<model>` 用当前实际运行的模型标识。trailer 前留空行，用 HEREDOC 提交以保留换行。

#### 两种使用模式

**不用 `/loop`（简单模式，适合 2-3 个 change）**：
```
用户: /td-autonomous-run
  → skill 设 goal
  → agent session loop 驱动: apply A → archive A → commit A → apply B → ...
  → session 断了 → 进度存盘
  → 用户回来重新触发 /td-autonomous-run → 从断点续跑
```

**用 `/loop`（跨 session 模式，适合大批量）**：
```
用户: /loop /td-autonomous-run
  → 同上，但 schedule_wakeup 在 session 断后自动恢复
  → 每次被唤醒时读 autonomy-log.yaml 续跑
  → 全部完成 / 剩余待执行为空 / mode 被改为 human-in-loop 时，skill 结束，/loop 无续跑目标自然停止
```

### 9. session 边界——跨 session 续跑

autonomous 模式意味着用户不在场，但 agent session 有边界（上下文满、超时、平台重启）。需要明确续跑机制。

#### resume 粒度

| 断点位置 | resume 依据 | 行为 |
|---|---|---|
| change 之间（上个已 archive + commit） | `autonomy-log.yaml` 的 `completed` 条目 | 跳过已完成的，从下一个开始 |
| change 内（apply 做到一半） | `tasks.md` 的 `[x]` / `[ ]` 标记 + `autonomy-manifest.md` 运行记录 | 从未完成的 task 继续 |
| 回退的 change | `autonomy-log.yaml` 的 `rolled-back` 条目 | 跳过，不重试（人回来处理） |

#### SessionEnd hook 的职责边界

现有 `td_state_sync.js`（SessionEnd hook）校正 `archive-counter.yaml` 和 `audit-history.yaml`。autonomous 模式下需要补一项：

- 校正 `autonomy-log.yaml`：检查 `openspec/changes/archive/` 下存在日期前缀的本 change 目录（`YYYY-MM-DD-<change-name>/`） **且** 有对应 commit 但 `autonomy-log.yaml` 缺 `completed` 条目的 change → 补写 `completed`（archive 可能被 session 中断跳过了，但归档事实已成立）。"对应 commit" 的判定：`git log --all --format=%s` 中存在包含 `<change-name>` 的提交——commit 消息模板的 subject 固定含 `<change-name>`，故可 grep 定位；两个文件系统事实同时成立才补写。
- **不**用 `tasks.md` 全 `[x]` 作为补写条件——tasks 全打勾不等于 change 完成，td-apply 步骤 6 的四层验证（6.1 change-level / 6.2 系统级 / 6.3 收尾 code review / 6.4 audit）都在 tasks 之后跑，session 完全可能在 tasks 全 `[x]` 后、验证未跑完时中断。用 tasks 全 `[x]` 补写 `completed` 会让编排者跳过一个未通过最终验证的 change，违反 hook「只补文件系统事实已成立但状态文件漏记的条目，不创造新事实」的约束。
- 不补写 `rolled-back`——回退是 agent 主动行为，hook 不代劳判定。

hook 补项的等价性要求与现有校正逻辑一致：只补"文件系统事实已成立但状态文件漏记"的条目，不创造新事实。`archive/` 目录 + commit 是两个文件系统可验证的事实，同时成立才补写；tasks 全 `[x]` 是事实但不足以推导「change 完成」。

## 需要改动的文件

| 文件 | 改动 | 热点 |
|---|---|---|
| **AGENTS.md** | `.td-state/` 语义扩展为三类（可推导 / 用户偏好 autonomy.yaml / agent 行为记录 autonomy-log.yaml）；gitignore 理由仍成立（per-machine 第二条腿）；设计原则加 autonomous 模式说明；hook 契约补 autonomy-log 补漏项 | |
| **human-in-loop.md** | 新增顶层节「autonomous 模式下的触发路径」——集中说明"触发场景识别不变，但触发后走查 proposal「已确认决策清单」节 → 执行 / 回退的分支"。**位置说明**：不分散加到现有「触发机制」「触发时 agent 应做的事」「不需要停下来的场景」三节（会让三节的语义分裂），而是新增顶层节分离"识别"与"分支"两条逻辑——使用态 LLM 读到"命中第 1-5 类" → 知道去查 proposal 的「已确认决策清单」节。 | 🔥 约束层核心，被 td-apply / td-propose / td-system-audit 引用 |
| **td-propose SKILL.md** | 步骤 6.c 加 proposal 新必填节：「前置依赖」+「已确认决策清单」+「caller impact 实测」（三节跨模式，human-in-loop 与 autonomous 都写，不区分 tier）；写入「前置依赖」节前做环检测（阻止循环依赖写入）；不再创建 `autonomy-manifest.md` | 🔥 契约层核心 |
| **td-apply SKILL.md** | 步骤 1 加读 autonomy.yaml + proposal 的「已确认决策清单」/「caller impact 实测」两节（不再读 autonomy-manifest.md）；autonomous 模式下**创建** `autonomy-manifest.md`（只含运行记录表）；步骤 4 caller impact 改为"只复核不新增"（复核含"无新增 caller" + "已标注 caller 的兼容结论在当前基线可复现"两部分，复核依据读 proposal 的「caller impact 实测」节）；步骤 5 human-in-loop 触发逻辑改为"proposal 清单显式覆盖→执行 / 未覆盖→按第 5 节回退"；步骤 6.3 code review warning 记录延后不自动修（与 human-in-loop 模式一致，critical 才回退）；回退时在 autonomy-manifest.md 运行记录表追加条目 + 在 autonomy-log.yaml 追加全局条目 | |
| **td-archive SKILL.md** | 步骤 4 读 `.td-state/autonomy-log.yaml` 判断该 change 的 action：`rolled-back` → 不归档（提示人工处理）；步骤 5 加检测 autonomy-log.yaml 的 rolled-back 条目并提示处理。**不检测 autonomy-manifest.md 的存在性**（manifest 不再作为 autonomous-ready 标记） | |
| **td-autonomous-run SKILL.md** | **新建**：编排 skill。步骤 0 检查 autonomy.yaml 是否存在（不存在则引导用户确认创建 + commit 授权）→ 读 openspec/todo.md 拿优先级 → 读 autonomy-log.yaml 排除已处理 → 读 openspec list 交叉匹配 → 读 proposal「前置依赖」节检查依赖满足 → 设 goal → agent native loop 驱动。每个 change archive 成功后执行 commit。**不再检查 autonomy-manifest.md 的存在性**（autonomous-ready 概念已作废） | 新增 skill |
| **td-autonomous-run description 建议** | frontmatter description 需明确「批量执行」+「依赖满足」两个触发关键词，与 `td-apply`（单个 change 的实施）语义正交——建议：「批量执行已确认的 change，按 todo.md 优先级走 apply → archive → commit 循环；仅在 `.td-state/autonomy.yaml` mode 为 autonomous 时生效。」 | |
| **td-autonomous-run 命令文件** | **新建**：`commands/td-autonomous-run.md`，极薄模板转发同名 skill | 新增命令 |
| **identification-flow.md** | 持久化层目录树加 autonomy.yaml + autonomy-log.yaml | |
| **td-apply/references/autonomy-template.md** | 新建：autonomy.yaml + autonomy-log.yaml + autonomy-manifest.md 三个文件模板与读写规则 + 回退命令原文（第 5 节命令的单一事实源）。**归属说明**：td-apply 是运行时的创建与追加方（autonomous 模式下创建 manifest、回退时向 manifest 运行记录表 + autonomy-log 追加条目）+ 回退命令的执行方，故由 td-apply 的 references 目录承担模板所有权；其他 skill（td-propose 写 proposal 新节、td-autonomous-run 读取与编排、td-archive 检查）通过 `td-apply` 的 `references/autonomy-template.md` 路径引用——不在各自 SKILL.md 里复制模板文本 | |
| **wip-limit.md** | 加 autonomous 模式说明：autonomous 模式下 WIP 检查不生效（不 override、不阻塞），仅 human-in-loop 模式生效 | |
| **hooks/td_state_sync.js** | SessionEnd 校正补一项：检查有 `archive/YYYY-MM-DD-<change-name>/` 目录且对应 commit 存在但 autonomy-log.yaml 缺 `completed` 条目的 change → 补写（不用 tasks.md 全 `[x]` 判定） | |

blast radius：11 个文件（8 个改 + 3 个新建：td-autonomous-run SKILL.md / td-autonomous-run 命令文件 / td-apply/references/autonomy-template.md）。热点节点：human-in-loop.md（入边最多）、td-propose（契约层入口）。

## 风险评估

**blast radius 11 个文件（8 个改 + 3 个新建），其中 2 个是约束/契约层核心。**

| 风险 | 严重度 | 缓解 |
|---|---|---|
| caller impact 实测前移增加 proposal 工作量 | 中 | 只在 autonomous 模式下要求，human-in-loop 模式不变 |
| autonomous 模式下 apply 遇到不可预测冲突 | 低（设计如此） | 一律回退并写日志、撤销代码改动，编排者继续下一个 change；audit 触发时 `reason` 标注第 7 类，人回来能识别批次级问题 |
| 用户忘记切回 human-in-loop 模式 | 中 | td-archive 步骤 5 检测 autonomy-log.yaml 有 rolled-back 条目时提示"有 N 个 change 需人工处理，建议切回 human-in-loop 处理" |
| `.td-state/` 语义从"全部可推导"变为"可推导 + 用户偏好 + agent 行为记录"三类 | 低 | gitignore 理由仍成立（per-machine 第二条腿），AGENTS.md 补充说明；hook 契约明确 autonomy.yaml 用户偏好类不碰、autonomy-log.yaml 只补漏 completed |
| session 中断时 change 内进度未落盘 | 中 | tasks.md 的 `[x]` 标记是渐进写盘的；SessionEnd hook 只在 `archive/` 目录 + commit 双事实成立时补写 `completed`，不用 tasks 全 `[x]` 判定 |
| 回退后改动丢失、人回来无法救回 | 低 | 回退用 `git stash push` 而非 `git checkout`，改动留在 stash 栈可 `pop` 救回；`autonomy-log.yaml` 记录 `stash_ref` 便于人回来定位 |
| 批量执行中前序 change 改变基线导致 proposal caller 实测过时 | 中 | proposal 加「前置依赖」节，编排者按依赖序执行减少漂移；apply 阶段"只复核不新增"不放宽 scope 边界，新 caller 一律回退 |
| 编排 skill 的 goal 语义不被所有 agent 平台支持 | 低 | skill 用自然语言设 goal，不依赖平台特有 API；`/loop` 是可选增强 |
| autonomous 模式下自动 commit 违反"用户未确认不 commit" | 低 | 步骤 0 创建 autonomy.yaml 时显式提示"将自动 commit"并等待用户确认；用户可随时修改 mode 字段中止；只 commit 无失败记录的 change |

## 已决结论（开放问题闭环）

1. **autonomy.yaml 的创建与切换**：初次创建由 `/td-autonomous-run` 步骤 0 引导（含 commit 授权确认，见第 8 节），文件不存在时该命令检测到后创建；切换到 human-in-loop 靠手动改 `autonomy.yaml` 的 `mode` 字段（极简，不需要新命令）+ td-archive 检测到 `autonomy-log.yaml` 有 rolled-back 条目时主动提示"有 N 个 change 需人工处理，建议切回 human-in-loop 处理"。

2. **已确认决策清单的验证**：客观上无法保证清单"排尽"所有决策点——残留的未知决策点会在 apply 阶段触发回退。这是可接受的：清单的价值不在于"保证排尽"，而在于"强迫 propose 阶段系统性过一遍 human-in-loop 的 7 类场景"。proposal 清单按 7 类编号与 human-in-loop 的 7 类必停场景一一对应：第 1-5 类显式覆盖（`[已确认]` / `[不适用]`），第 6 类（WIP override）标 `[不适用]`（autonomous 模式下 WIP 不生效，结构上不可能触发），第 7 类（audit 触发）标 `[不覆盖]`（一律回退，`reason` 标注第 7 类）。不使用"6 类穷举"表述——第 6、7 类不在清单覆盖范围内。

3. **autonomous 模式下 commit 策略**：commit 放在编排者 `td-autonomous-run` 里。commit 授权通过步骤 0 的显式确认获得——首次触发时提示"每个 change 在 archive 成功且无失败记录后将自动 commit"，用户确认后才切换到 autonomous 模式。后续循环内不再逐个询问，用户可通过修改 `autonomy.yaml` 的 `mode` 字段随时中止。有失败记录的 change 不 commit。commit 消息用 conventional commits 格式 + co-authored trailer。

4. **提案产出的统一**：7 类决策清单 + 前置依赖 + caller impact 实测三节进入 proposal.md，两种模式都写——不再有"autonomous-ready"这个概念区分 change 是否适合批量执行。`autonomy-manifest.md` 只在 autonomous 模式下由 td-apply 创建，只承载运行记录，不再作为 propose 阶段产物或 autonomous-ready 标记。是否批量执行由 `autonomy.yaml` 的 mode + `/td-autonomous-run` 调用表达，编排者不再检查 manifest 的存在性。

5. **多个待执行 change 的顺序**：按 `openspec/todo.md` 优先级（P0 → P1 → P2），与 td-propose 挑候选一致。不再按"是否 autonomous-ready"筛选——所有 change 都经过同一份 proposal 新节，无筛选差异。

6. **循环驱动者**：新增编排 skill `td-autonomous-run`（+ 同名命令文件）。skill 不实现循环——设 goal + per-change 协议，agent native session loop 驱动迭代。`/loop` 是可选跨 session 增强层。

7. **session 边界**：`autonomy-log.yaml` 只有 `completed` / `rolled-back` 两种 action，跨 session 续跑靠读进度链。resume 粒度三档：change 之间跳已完成、change 内按 tasks.md `[x]` 续跑、回退的跳过不重试。SessionEnd hook 补写漏记的 `completed` 条目，判定条件是 `archive/YYYY-MM-DD-<change-name>/` 目录存在且对应 commit 存在（不用 tasks.md 全 `[x]`——tasks 全打勾不等于 change 完成，td-apply 步骤 6 的四层验证在 tasks 之后跑）。

8. **"范围内 vs 超出范围"判定**：proposal「已确认决策清单」节的 7 类与 human-in-loop 的 7 类必停场景一一对应——第 1-5 类由清单显式覆盖（`[已确认]` / `[不适用]`），第 6 类标 `[不适用]`、第 7 类标 `[不覆盖]`。运行时触发的 human-in-loop 场景能对应到第 1-5 类且标 `[已确认]` → 按结论执行；无法对应、或对应到 `[不适用]` 但实际触发了、或触发第 7 类 → 走残留场景处理，一律回退。"实现细节"的边界明确：TDD 红绿重构、代码风格对齐、测试策略调整、内部模块实现——这些不属于 7 类必停场景，autonomous 模式下照常自主。

9. **code review critical / warning 的处理**：critical 与 warning 分两条路径，语义分层与 human-in-loop 模式一致（详见第 5 节"code review critical 的处理"与"code review warning 的处理"两个子节）——
    - **critical（收尾 code review）**：agent 做**删减性修复一次**（只删/回退被 review 判 critical 的具体改动，不重写业务逻辑），重跑 change-level 验证 + code review；仍 critical → **回退当前 change**（`git stash push -u -m "rollback <change-name>" -- . ':(exclude)openspec/changes/<change-name>/**'` 撤销代码改动含未跟踪源码，保留 artifact 不删，命令形式与第 5 节回退机制一致），写 `rolled-back` 条目（含 `stash_ref`），编排者继续下一个 change。不允许修改性修复——修改可能引入新 critical。
    - **架构 review critical**：不在此列（apply 前就跑完了），架构 review 判 critical 是"apply 不开始"，不是"apply 中途回退"。
    - **warning**：记录延后不自动修复（与 human-in-loop 模式一致），warning 不阻塞归档——修 warning 可能引入 critical，autonomous 模式下无人拍板"是否值得冒这个险"。
    - 不用 `git checkout`——那是不可恢复操作，autonomous 模式下 agent 无人现场确认没有第二次机会；stash 保留恢复路径，人回来后 `git stash pop` 救回改 proposal 重来或 `git stash drop` 放弃。

10. **td-system-audit 在 autonomous 模式下**：audit 照常跑，但 audit 触发 human-in-loop（第 7 类）时一律回退当前 change，`reason` 显式标注"audit 触发第 7 类"——audit 发现的问题可能就是"agent 做了不该做的事"，写日志让人回来审查。

11. **前置依赖**：`proposal.md` 加「前置依赖」节（跨模式，见「核心机制」第 2 节），声明本 change 依赖哪些 change 已完成并 commit。编排者跳过依赖未满足的 change，缓解批量执行中前序 change 改变基线导致的 caller 实测过时。apply 阶段仍"只复核不新增"——不放宽 scope 边界，新 caller autonomous 模式下一律回退、human-in-loop 模式下停下问用户，判定是补 proposal 还是调整 scope 的权始终在人。

12. **WIP 在 autonomous 模式下直接不生效**：WIP 约束的是人同时并行处理的 change 数（防认知过载 / Brooks 定律），autonomous 模式是顺序执行（一个 change 走完 apply → archive → commit 才做下一个），不存在"同时并行"语义。propose 阶段人还在场时 WIP 已生效过。这消除了 human-in-loop 第 6 类（WIP override）在 autonomous 模式下的触发可能。

13. **循环依赖检测**：propose 阶段做**唯一阻止点**——写入 proposal「前置依赖」节前做环检测，检测到循环依赖（含经由其他 change 间接成环）→ 不写入，先与用户确认依赖链修正。编排者 `td-autonomous-run` 步骤 5 做**兜底识别**：构造待执行队列时若发现挂起链闭合 → 在 goal 里显式标记"疑似循环依赖：<change 列表>"，标记后保持挂起、不自动修复。两层职责分离：propose 阻止写入、编排者识别并报告残留。

14. **manifest 是 autonomous 模式专用**：`autonomy-manifest.md` 只在 autonomous 模式下由 td-apply 创建，只承载运行记录（决策清单 + 前置依赖 + caller 实测已迁到 proposal.md，跨模式共享）。其价值前提是"人不在 apply 现场"——human-in-loop 下人在场，无需记录运行轨迹。归档 gate 归 autonomy-log（不在 manifest 内），同样以"人不在场"为价值前提。原「文件存在即等于该 change 是 autonomous-ready」的判定不变式已消失——autonomous-ready 概念随清单迁移 proposal 而作废，是否批量执行改由 `autonomy.yaml` 的 mode + `/td-autonomous-run` 调用表达，manifest 不再承担"是否需要批量执行"的标记职责。
