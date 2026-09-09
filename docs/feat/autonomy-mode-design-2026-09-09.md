# 设计讨论：autonomous 模式——离线批量执行已确认的 change

> 状态：设计讨论稿，未进入执行阶段。迭代稳定后再执行。

## 问题陈述

用户场景：人在场时逐个 propose 并确认多个 change（A、B、C），然后离开。agent 在无人现场时按提案顺序自动执行 apply → archive → commit 循环。

当前设计不支持此场景。根因不在 WIP 限制，而在 **apply 过程中的人在回路（human-in-loop）停点**——propose 再完善也不能完全消除 apply 中的未知情况，而当前设计在那些情况下一律停下来等用户。

## 设计约束（用户给定）

**autonomous 模式下，proposal 阶段就要处理所有应该人拍板的决策，否则该 change 不可作为 autonomous 模式下的选择。**

这条约束定义了核心概念——**autonomous-ready change**：只有 propose 阶段把所有需要人拍板的决策全部处理完的 change，才允许在 autonomous 模式下执行。

安全模型由此根本改变：agent 只在已确认框架内执行实现细节，框架外一律暂停。不再有"agent 替人做系统级决策"的分支。

## 与主基调的关系

零摩擦。

| 主基调条 | 关系 |
|---|---|
| 第 1 条：系统工程 | apply 仍在系统全局立场上推进，不因离线而降级 |
| 第 2 条：总体设计部 | 决策权不下放给 agent，只行使时机从 apply 前移到 propose——人仍拍所有系统级决策 |
| 第 3 条：综合集成 | propose 阶段的"已确认决策清单"是更完整的从定性到定量——决策更前置、更结构化 |
| 第 4 条：开放的复杂巨系统 | autonomous 模式下 agent 不并行硬解系统级问题，只在已确认框架内做实现 |

## 核心机制

### 1. `.td-state/autonomy.yaml`——运行策略配置

```yaml
# openspec/.td-state/autonomy.yaml
mode: human-in-loop    # human-in-loop | autonomous
set_at: <ISO8601>
set_reason: <一句话，如"批量执行已确认的 change，人不在场">
```

- `human-in-loop`（默认）：当前行为，所有 human-in-loop 必停场景照常停。
- `autonomous`：必停场景不停下来等用户，改为"在已确认决策清单范围内按确认结论执行 / 超出范围暂停当前 change"。
- 文件不存在 → 视为 `human-in-loop`（向后兼容）。
- 文件按需创建（用户第一次设模式时），`td-init` 不主动创建。

#### 放在 `.td-state/` 的理由

`.td-state/` 现有四个文件全部满足"可从文件系统事实推导"的契约。`autonomy.yaml` 是用户偏好，**不可推导**——这踩断了第一条腿。但 gitignore 仍成立，理由是第二条腿：**per-user 偏好不该跨人共享**。两个人的自治策略不同，提交进 git 只会制造冲突。

| 理由 | 现有四个文件 | autonomy.yaml |
|---|---|---|
| 可从文件系统推导 | ✅ | ❌（用户偏好） |
| per-machine / 不该跨人共享 | ✅ | ✅ |

不放 `openspec/config.yaml`（团队共享文件，自治策略是 per-user 的）。不靠环境变量（不持久，"设好就走人"场景下每次开 session 要重设）。不靠 `field-assessment` 判读（AGENTS.md 规定"无静态配置文件"，自治模式不是可观察事实）。

### 2. 独立文件——已确认决策清单

autonomous-ready change 需要一个独立文件记录已确认决策清单及 autonomous 模式相关的运行记录。该文件在 change 目录下创建（与 proposal.md / design.md / tasks.md 同级），由 td-propose 在 autonomous 模式下创建，由 td-apply 在 autonomous 模式下追加运行记录。

#### 文件位置

```
openspec/changes/<change-name>/
├── proposal.md
├── design.md
├── tasks.md
└── autonomy-manifest.md    ← autonomous 模式专用，仅 autonomous 模式下创建
```

human-in-loop 模式下不创建此文件（零开销）。文件存在即等于该 change 是 autonomous-ready。

#### 文件结构

```markdown
# Autonomy Manifest — <change-name>

## 已确认决策清单

### 公共契约变更（human-in-loop 第 1 类）
- [已确认] API 变更：<具体变更 + 确认结论>
- [已确认] schema 变更：<具体变更 + 确认结论>
- [不适用] 配置文件格式：无变更

### 不可逆决策（第 2 类）
- [已确认] <决策内容 + 结论>
- [不适用] 无不可逆决策

### 生产环境影响（第 3 类）
- [已确认] 无生产环境影响 / <影响 + 确认结论>

### scope 边界（第 4 类）
- [已确认] 分系统切分：<来自 design.md>
- [已确认] 超 scope 可能性：<排除依据>

### agent 置信度（第 5 类）
- [已确认] 不确定性已消除：<design.md 兜底依据>
- [不适用] 无遗留不确定性

### caller impact 实测（前移，propose 阶段完成）
- [已实测] caller 清单：<file:line + 兼容结论>
- [无未知 caller] 实测未发现 proposal 未标注的 caller

## 运行记录（td-apply 追加，autonomous 模式下）

| 时间 | 步骤 | 事件 | 决策来源 |
|---|---|---|---|
| <ISO8601> | 步骤 5 | 沿用 proposal 已确认：API 变更按方案 A | autonomy-manifest 第 1 类 |
| <ISO8601> | 步骤 4 | caller impact 复核通过，无新增 caller | autonomy-manifest caller 实测 |
| <ISO8601> | 步骤 5 | ⚠️ 暂停：proposal 前提假设不成立（库 X API Y 不存在） | 超出已确认范围 |

## 归档判定

- [ ] 可归档（全部任务完成，无暂停记录）
- [ ] 不可归档（有暂停记录，需人工处理）
```

#### 设计理由

独立文件而非 proposal 内嵌节，原因：

1. **生命周期不同**：proposal 是契约产物（归档后进 archive/ 只读），autonomy-manifest 是运行时记录（td-apply 追加运行记录、归档判定），两者读写模式不同。
2. **human-in-loop 模式零开销**：autonomous 模式才创建此文件，human-in-loop 模式下 proposal 不需要额外的节——两种模式对 proposal 的影响完全隔离。
3. **阻塞日志的 change 侧锚点**：td-apply 在 autonomous 模式下暂停时，在本文件的"运行记录"表追加暂停条目（与 `.td-state/autonomy-log.yaml` 的全局日志对应——后者是跨 change 的全局视图，本文件是 change 内局部视图）。

#### caller impact 实测前移

这是最大的流程变化。当前 td-propose 步骤 6.c 的 caller impact 分析是"前馈定位"（类别标注 + 高危标记），完整 caller 实测在 td-apply 步骤 4。autonomous-ready 要求实测前移——否则 apply 阶段发现未知 caller 时，人不在场无法拍板。

propose 阶段做实测，结果写入 `autonomy-manifest.md` 的 caller impact 节。apply 阶段改为"只复核不新增"：复核时发现 propose 阶段未标注的 caller → 暂停（不自治处理），在运行记录表追加暂停条目。

### 3. apply 阶段行为变更

autonomous 模式下，td-apply 步骤 5 的 human-in-loop 触发逻辑变为：

```
触发 human-in-loop 必停场景时：
  → 查 autonomy-manifest.md 是否显式覆盖了该类场景
    → 显式覆盖（有对应的 [已确认] 条目）→ 按确认结论执行，在运行记录表记录"沿用 manifest 确认"
    → 未显式覆盖 → 暂停当前 change，写阻塞日志，编排者继续下一个 change
```

**判定规则**：manifest 的 6 类清单是穷举式的——每一类要么标 `[已确认]`（有结论），要么标 `[不适用]`（明确排除）。运行时触发的 human-in-loop 场景能明确对应到某一类时，按该类条目的结论执行；无法对应、或对应到的条目标的是 `[不适用]` 但实际触发了 → 暂停。

**"实现细节"的边界**：agent 可自主的范围仅限于——TDD 的红绿重构循环、代码风格对齐既有实现、测试策略调整、内部模块实现细节。这些不属于 human-in-loop 6 类必停场景，autonomous 模式下照常自主执行。一旦触碰 6 类中任何一类的实际触发条件 → 走上面的 manifest 查询逻辑。

不再有"自治处理本该人拍板的决策"这个分支。agent 不替人做系统级决策，只做实现细节。

### 4. 仍会暂停的残留场景

即使 propose 阶段排尽所有已知决策点，apply 仍可能遇到**不可预测的运行时冲突**——这些一律暂停，不自治：

| 场景 | 当前行为 | autonomous 模式行为 |
|---|---|---|
| proposal 前提假设不成立（设计回写场景） | 停下问用户：回写 artifact 还是改代码 | **回退当前 change**，写日志，继续下一个 |
| 测试失败 2 次以上，根因在 plan 之外 | 停下问用户 | **回退当前 change**，写日志，继续下一个 |
| caller impact 复核发现 propose 未标注的 caller | 全局必停上报 | **回退当前 change**，写日志，继续下一个 |
| 架构 review 判 critical | 阻塞，回 propose 改 | **回退当前 change**，写日志，继续下一个 |
| 收尾 code review 判 critical | 阻塞，修复后重跑验证 | **修一次 → 重跑 code review，继续判 critical 则回退当前 change**，写日志，继续下一个 |
| 收尾 code review 判 warning | 记录到 proposal，可延后 | **修一次 → 重跑 code review**（最多 1 轮，仍 warning → 记录延后，继续） |
| td-system-audit 触发 human-in-loop 第 7 类 | 停下问用户 | **暂停**，写阻塞日志（audit 发现的问题就是"agent 可能做了不该做的事"，暂停让人审查是对的） |

暂停的 change 和回退的 change 都写入 `autonomy-log.yaml`，人回来后处理。

#### code review warning 的处理

autonomous 模式下没有人来"延后处理"warning，但全自动修复可能引入新问题。折中策略：

1. 收尾 code review 判出 warning → agent 尝试修复一次（按 review 给出的建议）。
2. 修复后重跑 change-level 验证（6.1）+ 收尾 code review（6.3）。
3. 仍 warning → 记录到 `autonomy-manifest.md` 运行记录表，标"warning 未消除，延后人工处理"，继续归档流程（warning 不阻塞归档，与 human-in-loop 模式一致）。
4. critical 不在此列——架构 review critical 或收尾 code review critical → 回退当前 change（`git checkout` 撤销本 change 的代码改动，保留 artifact 不删），在 `autonomy-log.yaml` 写 `rolled-back` 条目，编排者继续下一个 change。人回来后看日志决定是改 proposal 重来还是放弃。

### 5. `.td-state/autonomy-log.yaml`——进度与阻塞日志

```yaml
# openspec/.td-state/autonomy-log.yaml（autonomous 模式专用）
entries:
  - timestamp: <ISO8601>
    change: <change-name>
    action: completed        # completed | paused | rolled-back
    summary: <一句话结果，如"3 个任务全绿，caller impact 复核通过，已 commit">
  - timestamp: <ISO8601>
    change: <change-name>
    action: paused
    blocked_at: <步骤名>
    reason: <触发了哪类必停场景 + 为什么超出 manifest 已确认范围>
    context: <决策点上下文摘要>
  - timestamp: <ISO8601>
    change: <change-name>
    action: rolled-back
    reason: <架构 review critical / 收尾 code review critical>
    detail: <critical issue 摘要>
```

`completed` 条目在 change 成功 archive + commit 后写入；`paused` 条目在 change 因不可预测冲突暂停时写入；`rolled-back` 条目在 change 因 review critical 被回退时写入。三种条目共同构成进度链——编排者和跨 session 恢复都靠读这个文件决定"从哪续跑"。`paused` 和 `rolled-back` 的 change 都跳过不重试，人回来后处理。

比上一轮设计更简单——不需要 `auto_resolution` 字段，因为 autonomous 模式下 agent 不做系统级自治决策，只暂停。

### 6. WIP 限制的交互

autonomous 模式下 WIP 超限**不走 override 回路**（override 需要人确认，人不在）——直接跳过该 change，继续下一个。人在 propose 阶段就应控制活跃 change 数不超限。

### 7. 编排 skill——`td-autonomous-run`

#### 为什么需要编排者

当前所有 td-* skill 都是单次执行语义：td-apply 做完一个 change 就结束，td-archive 归档完就结束。没有一个 skill 负责"按优先级逐个驱动 apply → archive → commit 循环"。autonomous 模式的核心场景——"人走了，agent 自己跑完一批"——需要这个编排者。

#### 设计原则：skill 不实现循环

skill 不包 `while (changes remain)` 循环。三层结构各司其职：

| 层 | 机制 | 职责 |
|---|---|---|
| **session 内循环** | agent native session loop | 在单个 session 内逐 change 驱动 apply → archive → commit |
| **进度持久化** | `autonomy-log.yaml`（`completed` / `paused` 条目） | 记录每个 change 的处理结果，跨 session 续跑依据 |
| **跨 session 恢复** | 用户重新触发 `/td-autonomous-run` 或 `/loop /td-autonomous-run` + `schedule_wakeup` | session 断了之后恢复循环 |

理由：

1. agent 的 native session loop 已经是循环——用户给一个 goal，agent 会持续工作直到 goal 达成或被打断。skill 再包循环是重复语义。
2. 符合 AGENTS.md 的触发式哲学——skill 设定 goal + per-change 协议，agent loop 自然驱动迭代。
3. `/loop` 是可选增强层——skill 本身不依赖 `/loop`，小批量单 session 够用；大批量用户自行选 `/loop` 包装。
4. resume 检查点是已有状态文件——`tasks.md`（change 内进度）+ `autonomy-log.yaml`（跨 change 进度），不需要新 checkpoint 机制。

#### skill 行为

```
td-autonomous-run:
  1. 读 autonomy.yaml 确认 mode == autonomous（否则提示"当前是 human-in-loop 模式，无需编排"）
  2. 读 todo.md 拿优先级序列（P0 → P1 → P2）
  3. 读 autonomy-log.yaml，排除已处理的 change（completed 跳过，paused 跳过不重试）
  4. 读 openspec list 拿活跃 change 列表，交叉匹配 todo.md 序列 → 确定待执行队列
  5. 检查每个待执行 change 是否有 autonomy-manifest.md（没有 → 跳过，该 change 非 autonomous-ready）
  6. 设 goal: "按优先级处理剩余 autonomous-ready change，每个走 td-apply → td-archive → commit，全部完成或全部暂停时结束"
  7. agent native loop 驱动迭代
```

#### commit 落脚点

编排者在每个 change 成功 archive 后执行 commit：

```
archive 成功 →
  读 autonomy-manifest.md 归档判定:
    有暂停记录 → 不 commit（等人工处理）
    无暂停记录 → git add -A && git commit（conventional commits 格式，co-authored trailer）
```

commit 消息模板：如果 AGENTS.md 有相关描述，则使用 AGENTS.md 的描述； 有相关skill，可以直接使用；否则使用以下模板

```
<type>: <change-name> — <proposal 的一句话描述>
- <body(可选，尽量精简)>
```

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
  → 全部完成或全部暂停时，skill 结束，/loop 无续跑目标自然停止
```

### 8. session 边界——跨 session 续跑

autonomous 模式意味着用户不在场，但 agent session 有边界（上下文满、超时、平台重启）。需要明确续跑机制。

#### resume 粒度

| 断点位置 | resume 依据 | 行为 |
|---|---|---|
| change 之间（上个已 archive + commit） | `autonomy-log.yaml` 的 `completed` 条目 | 跳过已完成的，从下一个开始 |
| change 内（apply 做到一半） | `tasks.md` 的 `[x]` / `[ ]` 标记 + `autonomy-manifest.md` 运行记录 | 从未完成的 task 继续 |
| 暂停的 change | `autonomy-log.yaml` 的 `paused` 条目 | 跳过，不重试（人回来处理） |

#### SessionEnd hook 的职责边界

现有 `td_state_sync.js`（SessionEnd hook）校正 `archive-counter.yaml` 和 `audit-history.yaml`。autonomous 模式下需要补一项：

- 校正 `autonomy-log.yaml`：检查当前正在 apply 的 change 是否有 `tasks.md` 全 `[x]` 但 `autonomy-log.yaml` 没有对应 `completed` 条目 → 补写 `completed`（archive 可能被 session 中断跳过了，但任务实际全完成了）。
- 不补写 `paused`——暂停是 agent 主动行为，hook 不代劳判定。

hook 补项的等价性要求与现有校正逻辑一致：只补"文件系统事实已成立但状态文件漏记"的条目，不创造新事实。

## 需要改动的文件

| 文件 | 改动 | 热点 |
|---|---|---|
| **AGENTS.md** | `.td-state/` 语义扩展（加 per-user 偏好）；设计原则加 autonomous 模式说明 | |
| **human-in-loop.md** | 触发机制节加 autonomous 模式分支：范围内按已确认决策执行，范围外暂停 | 🔥 约束层核心，被 td-apply / td-propose / td-system-audit 引用 |
| **td-propose SKILL.md** | 步骤 3 加 autonomy 检查 + autonomous-ready 判定（`autonomy-manifest.md` 是否存在）；步骤 6.c 在 autonomous 模式下创建 `autonomy-manifest.md` 并填入已确认决策清单；caller impact 实测前移 | 🔥 契约层核心 |
| **td-apply SKILL.md** | 步骤 1 加读 autonomy.yaml + autonomy-manifest.md；步骤 4 caller impact 改为"只复核不新增"；步骤 5 human-in-loop 触发逻辑改为"显式覆盖→执行 / 未覆盖→暂停"；步骤 6.3 code review warning 加"修一次→重跑"循环；暂停时在 autonomy-manifest.md 运行记录表追加条目 + 在 autonomy-log.yaml 追加全局条目 | |
| **td-archive SKILL.md** | 步骤 4 归档时检查 autonomy-manifest.md 的归档判定：有暂停记录 → 不归档（提示人工处理）；步骤 5 加检测 autonomy-log.yaml 暂停条目并提示切回 human-in-loop | |
| **td-autonomous-run SKILL.md** | **新建**：编排 skill。读 autonomy.yaml 确认模式 → 读 todo.md 拿优先级 → 读 autonomy-log.yaml 排除已处理 → 读 openspec list 交叉匹配 → 检查 autonomy-manifest.md 存在性 → 设 goal → agent native loop 驱动。每个 change archive 成功后执行 commit。 | 新增 skill |
| **td-autonomous-run 命令文件** | **新建**：`commands/td-autonomous-run.md`，极薄模板转发同名 skill | 新增命令 |
| **identification-flow.md** | 持久化层目录树加 autonomy.yaml + autonomy-log.yaml | |
| **td-apply/references/autonomy-template.md** | 新建：autonomy.yaml + autonomy-log.yaml + autonomy-manifest.md 三个文件模板与读写规则 | |
| **wip-limit.md** | 加 autonomous 模式说明：WIP 超限不 override，直接跳过 | |
| **hooks/td_state_sync.js** | SessionEnd 校正补一项：检查 tasks.md 全 `[x]` 但 autonomy-log.yaml 缺 `completed` 条目的 change → 补写 | |

blast radius：11 个文件（其中 2 个新建 + 1 个命令文件新建）。热点节点：human-in-loop.md（入边最多）、td-propose（契约层入口）。

## 风险评估

**blast radius 11 个文件（9 个改 + 2 个新建 skill/命令 + 1 个 hook 补项），其中 2 个是约束/契约层核心。**

| 风险 | 严重度 | 缓解 |
|---|---|---|
| caller impact 实测前移增加 proposal 工作量 | 中 | 只在 autonomous 模式下要求，human-in-loop 模式不变 |
| autonomous 模式下 apply 遇到不可预测冲突仍会暂停 | 低（设计如此） | 阻塞日志让人回来后能定位处理；暂停不等于失败 |
| 用户忘记切回 human-in-loop 模式 | 中 | td-archive 步骤 5 检测 autonomy-log.yaml 有 paused 条目时提示"有 N 个 change 因 autonomous 模式暂停，建议切回 human-in-loop 处理" |
| `.td-state/` 语义从"全部可推导"变为"可推导 + per-user 偏好" | 低 | gitignore 理由仍成立（第二条腿），在 AGENTS.md 补充说明 |
| session 中断时 change 内进度未落盘 | 中 | tasks.md 的 `[x]` 标记是渐进写盘的；SessionEnd hook 补写 `completed` 条目兜底 |
| 编排 skill 的 goal 语义不被所有 agent 平台支持 | 低 | skill 用自然语言设 goal，不依赖平台特有 API；`/loop` 是可选增强 |
| autonomous 模式下自动 commit 违反"用户未确认不 commit" | 中 | 用户设 autonomous 模式 = 预授权 commit；只 commit 无暂停记录的 change；暂停的不 commit |

## 已决结论（开放问题闭环）

1. **autonomous 模式如何切换回 human-in-loop**：手动改 `autonomy.yaml`（极简，不需要新命令）+ td-archive 检测到 `autonomy-log.yaml` 有暂停条目时主动提示"有 N 个 change 因 autonomous 模式暂停，建议切回 human-in-loop 处理"。

2. **已确认决策清单的验证**：客观上无法保证清单"排尽"所有决策点——残留的未知决策点会在 apply 阶段触发暂停。这是可接受的：清单的价值不在于"保证排尽"，而在于"强迫 propose 阶段系统性过一遍 human-in-loop 的 6 类场景"。

3. **autonomous 模式下 commit 策略**：commit 放在编排者 `td-autonomous-run` 里。每个 change archive 成功且 `autonomy-manifest.md` 无暂停记录 → 自动 commit（用户通过设 autonomous 模式预授权）；暂停的 change 不 commit。commit 消息用 conventional commits 格式 + co-authored trailer。

4. **autonomous-ready 标记**：用独立文件 `autonomy-manifest.md` 承载已确认决策清单和运行记录（见「核心机制」第 2 节）。文件存在即等于该 change 是 autonomous-ready，不额外加 frontmatter 字段。

5. **多个 autonomous-ready change 的执行顺序**：按 `openspec/todo.md` 优先级（P0 → P1 → P2），与 td-propose 挑候选一致。

6. **循环驱动者**：新增编排 skill `td-autonomous-run`（+ 同名命令文件）。skill 不实现循环——设 goal + per-change 协议，agent native session loop 驱动迭代。`/loop` 是可选跨 session 增强层。

7. **session 边界**：`autonomy-log.yaml` 加 `completed` 条目（不只 `paused`），跨 session 续跑靠读进度链。resume 粒度三档：change 之间跳已完成、change 内按 tasks.md `[x]` 续跑、暂停的跳过不重试。SessionEnd hook 补写漏记的 `completed` 条目。

8. **"范围内 vs 超出范围"判定**：manifest 的 6 类清单是穷举式的——每类标 `[已确认]` 或 `[不适用]`。运行时触发的 human-in-loop 场景能对应到某类且该类标 `[已确认]` → 按结论执行；无法对应、或对应到 `[不适用]` 但实际触发了 → 暂停。"实现细节"的边界明确：TDD 红绿重构、代码风格对齐、测试策略调整、内部模块实现——这些不属于 6 类必停场景，autonomous 模式下照常自主。

9. **code review critical / warning 的处理**：critical（架构 review 或收尾 code review）→ **回退当前 change**（`git checkout` 撤销代码改动，保留 artifact），写 `rolled-back` 条目，编排者继续下一个 change，人回来后决定改 proposal 重来还是放弃。warning → 修一次 → 重跑 code review（最多 1 轮），仍 warning → 记录到 manifest 运行记录表延后人工处理，不阻塞归档。

10. **td-system-audit 在 autonomous 模式下**：audit 照常跑，但 audit 触发 human-in-loop（第 7 类）时一律暂停——audit 发现的问题就是"agent 可能做了不该做的事"，暂停让人回来审查是对的。
