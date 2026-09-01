---
name: td-propose
description: 创建 change，生成 proposal/design/tasks artifact。OpenSpec 契约层入口。触发场景：用户说"提一个 change"、"propose"、"开个新改动"、"建 proposal"、"想建 X 功能"。
user-invocable: true
argument-hint: <change-name or description>
---

# td-propose

OpenSpec 契约层入口。在写代码之前，让人和 AI 对"建什么、为什么这样建"达成契约。

## 依赖技能

- `system-engineering`
- `field-assessment`

## 服务的主基调原则

**系统工程主基调第 3 条：从定性到定量的综合集成。**

proposal 里的"系统工程影响评估"节是这个原则的工程化体现——agent 不只写"what"和"how"，必须写"这会对系统整体产生什么影响"，完成从定性到定量的综合集成。其中"预期行为模型"字段是综合集成的"模型"载体（见 `system-engineering` 的「主基调四条」第 3 条「模型载体」节）。

**《工程控制论》反馈控制回路归位**：propose 是前馈控制环节（建立控制目标，完整回路见 `system-engineering` 的「反馈控制回路」节）。

## 输入

#### 可以是：

- **kebab-case change 名**：如 `add-user-auth`
- **自然语言描述**：agent 从中推导 kebab-case 名
- **空**：用询问用户机制问用户"想做什么 change"

#### 内容

`$ARGUMENTS`

## 步骤

### 1. 激活主基调与配置层

激活主基调与配置层。只注入强度不做判断，按下述三步序列执行：

1. **`system-engineering`** — 主基调四条进入上下文。propose 的每个判断都在主基调四条框架下做。
2. **profile × tier 识别** — 调 `field-assessment`，判读 `$_TD_PROFILE` / `$_TD_TIER`，读入表 1（5 个 constraint 强度）+ 表 2（human-in-loop 加成）。会话内缓存，后续步骤直接引用。
3. **其余 constraint** — 只把强度值读入上下文，不在本步判断是否触发——后续步骤据此判断 wip-limit / human-in-loop 是否触发。

### 2. 读现场背景（config.yaml context）

执行 `field-assessment` 的 `references/config-context-guidance.md` 的引导流程，读 `openspec/config.yaml` 的 `context` 字段（tech stack、conventions、domain knowledge 等），作为后续 proposal/design 的现场背景（空则引导填写，用户跳过不阻塞，完整流程见该文件）。这部分背景信息会直接进入 proposal 的"系统工程影响评估"节的判断依据。

### 3. 触发前置检查

对照步骤 1 注入的强度与当前 change 状态，判断是否触发：

- `constraints` 的 `references/wip-limit.md`（硬阻塞 + override）：当前活跃 change 数已达上限？已达 → **阻塞本步骤，不执行步骤 4**，执行 `constraints` 的 `references/wip-limit.md` 的「硬约束 + override 机制」节（权威描述在该 skill；override 通过后继续步骤 4）。
- `constraints` 的 `references/human-in-loop.md`：用户描述是否清晰到可以 propose？不清楚 → 用询问用户机制问"想做什么 change"。
- **TODO 池检查**：读 `openspec/todo.md`（不存在 → 跳过本子项，视为空池，不主动创建文件）。todo.md 的主条目/change 子项/优先级/分节规则见 `todo-pool` 的「格式约定」节。
  - 列出全部**未勾选**（`- [ ]`）主条目作为候选池，**按优先级排序呈现**（P0 → P1 → P2，未标注视为 P2）。
  - 若输入内容为空或用户没有明确 change 描述 → 询问用户让用户从候选池挑一个条目（或"不挑了，直接描述新 change"）。用户挑中某条目 → change 名从条目语义推导。
  - 用户已给明确描述 → 检查候选池里是否有语义重合的主条目，有则提示用户"TODO 池里已有近似条目，要不要基于它 propose？"——同一条主条目可以承接多个 change（每个 change 一个子项追加），不算重复建 change。
  - 候选池是 backlog（可以无限多），活跃 change 才是 WIP——池里有候选不构成阻塞，只有活跃 change 数触发 `constraints` 的 `references/wip-limit.md`。
- **brownfield reverse-spec 检查**（`$_TD_PROFILE` 为单值，与下方 greenfield 检查互斥，仅命中其一）：若 `$_TD_PROFILE == profile-brownfield`，检查 `openspec/specs/` 下是否已有相关分系统的 baseline spec。没有 → 触发 `constraints` 的 `references/human-in-loop.md`，提示用户"你对现有系统还没建立认识，propose 大改动风险高。先 `/td-reverse-spec` 吗？"——用户同意后执行 `/td-reverse-spec` 建立 baseline，完成后回到本步骤继续 propose。
- **greenfield explore 检查**（同上互斥，仅命中其一）：若 `$_TD_PROFILE == profile-greenfield` 且 `openspec/specs/` 为空（还没建立初始 spec），检查会话内是否已做过探索。判据：会话历史里是否出现过 `/td-explore` 调用，且产物里含**至少 2 个候选方向**（每个候选方向标注系统工程影响，见 `td-explore` 步骤 4 的产物要求）。没有 → 触发 `constraints` 的 `references/human-in-loop.md`，提示用户"greenfield 最容易犯的错是'想到了就建'。先 `/td-explore` 至少探索 2 个候选方向再 propose 吗？"——用户同意后执行 `/td-explore`，完成后回到本步骤继续 propose。

### 4. 创建 change 目录

```bash
openspec new change "<name>"
```

**若本 change 来自 TODO 池条目**（步骤 3 挑中的）：创建后回写 `openspec/todo.md`，在该主条目下**新增一个 change 子项**（格式见 `todo-pool` 的「格式约定」节「条目格式」条）。**不勾选主条目**——勾选是 `td-archive` 的职责（走 `todo-pool` 的「勾选子项」子流程），且要等主条目下全部 change 子项归档后才勾。change 子项是 archive 时定位对应条目的锚点。

**关联方向是 todo.md → change 子项**（todo.md 侧标记"这个 change 来自我"）——change 资产不得引用 TODO 池（规则见 Guardrails「提案不引用 TODO 池」）。

### 5. 获取 artifact 构建顺序

```bash
openspec status --change "<name>" --json
```

解析 JSON 拿到 `applyRequires`、`artifacts`、`planningHome`、`changeRoot`、`artifactPaths`、`actionContext`。

### 6. 循环创建 artifact（含必填项检查）

用任务跟踪工具跟踪进度。循环体对每个 artifact 执行下述四子步，全部 `applyRequires` artifact 走完且必填项全过才进入步骤 7。

**6.a 合并会话内已有探索产物**：若本次会话已产出 `td-explore` 的候选方向评估（对话形式交付），把其中的候选方向取舍与"系统工程影响"评估合并进 proposal 骨架，作为 6.c 必填项的输入。没有产物则跳过，直接从 template 构建。

**6.b 创建 artifact**：

```bash
openspec instructions <artifact-id> --change "<name>" --json
```

- 读 `template` 作为结构
- 应用 `context` 和 `rules` 作为约束——**不要把它们复制进 artifact 文件**
- 读已完成的依赖 artifact 作为 context
- 写到 `resolvedOutputPath`

greenfield 特例：若 `$_TD_PROFILE == profile-greenfield` 且 `openspec/specs/` 为空，第一个 change 的 proposal 还要建立初始 spec baseline——这是后续所有改动的影响评估依据。

**6.c 必填项检查**（每个 artifact 写完后立即做，缺项 → 回 6.b 补写，不进 6.d）：

- **proposal.md 必填节：系统工程影响评估**

```markdown
## 系统工程影响评估

（服务钱学森系统工程主基调第 3 条"从定性到定量的综合集成"——专家判断 + 数据 + 模型反复迭代上升到定量认识）

- 影响哪些分系统：
- 整体性能预期变化：
- 这是局部优化还是全局协调：
- 如果是局部优化，对全局失调的风险：
- 预期行为模型：这个改动的预期系统行为是什么？用什么数据/测试验证这个预期？（这是综合集成的"模型"载体——见 `system-engineering` 的「主基调四条」第 3 条「模型载体」节）
```

没填这一节的 proposal 不算 apply-ready。

**"预期行为模型"字段的执行语义**：

- 这个字段是 `/td-archive` 步骤 3"实际 vs 预期"复盘的对照锚点之一——archive 时要回答"预期行为模型是否被实际行为验证？如果没有，模型需要怎么修正？"
- 这个字段也是 `/td-apply` 步骤 6.2 系统级验证的输入——系统级验证要验证"预期行为模型"是否在跨分系统整合后仍然成立。

- **proposal.md 必填：tier-large 总体设计文档**

若 `$_TD_TIER == tier-large`，proposal 里必须附"总体设计文档"，4 个必填字段：

1. 这个改动在系统层次里的位置
2. 影响的所有分系统
3. 与最近 archive 的 change 的关系
4. 是否触发跨分系统协调

（字段定义的单一事实源见 `field-assessment` 的 `references/tier-large.md`「总体设计文档必填」节）

没这份文档，proposal 不算 apply-ready。

- **proposal.md 必填节：caller impact 分析**（触发命中时必填）

四类变更点定义、触发条件与边界裁定见 `td-apply/references/change-point-classes.md`（单一事实源）。触发条件命中时 proposal 须附此节：

```markdown
## caller impact 分析

- 变更点清单：逐条列出，标注属于四类中的哪类（无 → 写"无四类变更点"并说明判断依据）
- 高危标记：涉及 ①③ 类（公共符号 / 装配点）的变更点标"高危"——这是 propose 阶段的 go/no-go 决策点，由用户确认是否值得动公共契约
- 已知 caller：只列确定已知的高危 caller（file:line + 预判结论：兼容 / 需适配 / caller 不消费返回值）——完整 caller 清单不由本节承担，由 `td-apply` 步骤 4 的引用搜索实测产出
```

本节是前馈定位（类别标注 + 高危 go/no-go），不追求完整 caller 清单——人工预判清单不可靠，完整清单由 `td-apply` 步骤 4 实测产出并兜底；实测发现本节未标注的 caller，或与预判结论冲突 → 补做兼容确认，或按 apply 全局必停通道上报。

tier 分层：tier-small 可跳过（提醒性质，跳过时在 proposal 注明）；tier-medium / tier-large 必填（必填的是变更点类别标注 + 高危标记，负担轻）——缺项的 proposal 不算 apply-ready。

- **tasks.md 必填：关键链标注与 project buffer**

tasks.md 必须：

- 标注关键链（critical chain）：哪条任务序列是项目的关键路径
- 留 project buffer：按当前 tier 比例（查表 1 的 critical-buffer 行，会话内已缓存；表 1 见 `field-assessment/references/strength-matrix.md`）

粒度不够 → 触发 `writing-plans` 细化；标注不明 → 参考 `constraints` 的 `references/critical-buffer.md` 的「识别关键链」节。

**6.d 循环判定**：

```bash
openspec status --change "<name>" --json
```

检查每个 `applyRequires` 里的 artifact ID 是否 `status: "done"`。未完成 → 回 6.b 处理下一个；全完成且必填项全过 → 进步骤 7。

### 7. 架构 review（proposal 定型后）

所有 artifact 创建完成后，**进入实施前先做架构 review**。

调 `requesting-code-review` 的架构 review（见该 skill 第 5 节），review 对象是 proposal 的分系统切分与设计决策，检查清单见该 skill 的 `references/architecture-review-checklist.md`。

分级定义见 `requesting-code-review` 第 5 节（critical / warning / nit）。本步骤只持有阻塞后回路：架构 review 判为 critical → 阻塞，回步骤 6 改 proposal 再重新 review；warning → 记录到 proposal，可延后；nit → 可忽略。

架构 review 通过（无 critical）才进入步骤 8。

### 8. 显示最终状态

先跑一次官方校验，确认 artifact 集合无结构性问题：

```bash
openspec validate --all --json
```

解析 JSON 输出：**本 change** 的校验问题 → 回步骤 6 修复对应 artifact 后重跑；其他既有 change 的问题 → 提示用户，不阻塞本流程。通过后显示最终状态：

```bash
openspec status --change "<name>"
```

输出：

- Change 名 + 位置
- 创建的 artifact 列表 + 简述
- 架构 review 结果：通过 / 有 warning（已记录）
- "All artifacts created! Ready for implementation."
- "Run `/td-apply` to start implementing."

## Guardrails

- 创建所有 `applyRequires` 要求的 artifact，不能跳过
- 永远先读依赖 artifact 再创建新 artifact
- `context` 和 `rules` 是给你的约束，不是文件内容
- 写完每个 artifact 后验证文件存在
- 如果 change name 已存在，问用户是 continue 还是 new
- **提案不引用 TODO 池**：proposal/design/tasks 等 change 资产**不得出现**对 `openspec/todo.md` 的引用（路径、条目描述、优先级、子项标注）——TODO 池信息只存在于 todo.md，backlog 是候选层，change 资产是契约层，两层分层隔离。TODO 池条目只通过主条目下的 change 子项建立关联，不进入 artifact 正文。
