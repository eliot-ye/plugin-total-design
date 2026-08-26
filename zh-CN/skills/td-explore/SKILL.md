---
name: td-explore
description: 不带 stakes 的思考伙伴，写代码前先探索。OpenSpec 契约层入口，需求不清时的主入口。触发场景：用户说"想探索"、"explore"、"先想想"、"不确定要建什么"、"帮我想清楚 X"。用户想 build/fix/重构但需求不清时，优先路由到这里；brainstorming 在本流程内被激活。
user-invocable: true
argument-hint: <topic or question>
---

# td-explore

不创建 change、不写 artifact，只是**探索**。在用户还不确定要建什么的时候，agent 帮用户想清楚。

## 依赖技能

- `system-engineering`
- `field-assessment`
- `brainstorming`

## 服务的主基调原则

**系统工程主基调第 2 条：总体设计部。**

explore 是总体设计部在"想"的阶段的工作——不是分系统工程师直接动手，是先在系统全局立场上探索。

**系统工程主基调第 4 条：开放的复杂巨系统。**

explore 不简化还原问题，允许矛盾并存，这是对复杂巨系统的尊重。

**《工程控制论》反馈控制回路归位**：explore 是前馈控制准备环节（为 propose 的控制目标收集先验信息、降低预测误差）。

## 输入 - 用户想探索的话题、问题、想法

**探索范围限定在本项目内。**

#### 内容

`$ARGUMENTS`

## 步骤

### 1. 激活主基调与配置层

激活主基调与配置层。只注入强度不做判断，按下述三步序列执行：

1. **`system-engineering`** — 主基调四条进入上下文。
2. **profile × tier 识别** — 调 `field-assessment`，判读 `$_TD_PROFILE` / `$_TD_TIER`，读入表 1 + 表 2。profile 决定 explore 的侧重点（greenfield 重候选方向，brownfield 重"动老代码的影响"，maintenance 重"生产稳定性"）。
3. **其余 constraint** — 只把强度值读入上下文，不在本步判断是否触发。

### 2. 读现场背景（config.yaml context）

与 `td-propose` 步骤 2 同一引导流程：读 `openspec/config.yaml` 的 `context` 字段作为探索现场背景；若为空或模板默认值，一次问完 tech stack / conventions / domain 三个问题，答案写入 `context` 字段。一次性投入，后续 td-propose / td-explore 都能读到。用户跳过 → 保持空，继续步骤 3（不阻塞）。

### 3. 读现有 context

- 读项目当前状态（git log、package.json、目录结构）
- 读相关已有 spec（在 `openspec/specs/` 下）
- 读相关已有 change（在 `openspec/changes/` 下）
- 读 `openspec/todo.md` 的未勾选条目（`- [ ]`）——这是项目级候选池，作为探索的候选方向输入；文件不存在 → 跳过，视为空池

### 4. 头脑风暴

调用 `brainstorming` skill 的 1–4 步工作方式——**不执行** brainstorming 的第 5–6 步（分段确认、保存 spec 文档）：explore 阶段不落盘 spec，成果以对话形式交付（见步骤 6）。若用户要求把探索结果落盘为 spec 草稿，提示走 `/td-propose`（brainstorming 的保存步骤在那里执行）。

**产物要求**：explore 阶段必须产出**至少 2 个候选方向**，每个标注系统工程影响（影响哪些分系统 / 整体性能预期变化 / 可逆性）。产物留在会话上下文里（explore 不落盘 spec，见步骤 6 的 Guardrails）。`/td-propose` 步骤 3 的"greenfield explore 检查"会读会话历史判定是否已有 ≥2 个候选方向——少于 2 个时 propose 阶段会拦下来要求先 explore。

**与 `delay-decision` 的连接**：explore 阶段"不落盘 spec"本质上是延迟决策——不闭合 spec，等更多信息再 propose。当用户想"赶紧 propose 闭合 spec"时，触发 `delay-decision` 提醒："explore 不落盘 spec 是延迟决策的体现，信息不足时强行闭合会损失信息（主基调第 3 条综合集成）。"这与 `td-propose` 步骤 3 的"greenfield explore 检查"协同——greenfield 项目先 explore 再 propose。

### 5. 系统工程视角评估

对每个候选方向，评估：

- 影响哪些分系统
- 整体性能预期变化
- 是局部优化还是全局协调
- 局部优化对全局失调的风险

评估侧重按步骤 1 判读的 `$_TD_PROFILE` 调整：

- `profile-greenfield`：重候选方向的**取舍与可逆性**——没有存量约束，方向选错成本低，但要用 `delay-decision` 避免"想到了就建"和"先把架构设计完美"两个陷阱
- `profile-brownfield`：重**动老代码的影响**——候选方向会触碰哪些存量分系统、改动范围能否最小化、是否触发公共契约变更（对照 `human-in-loop` 的必停场景）
- `profile-maintenance`：重**生产稳定性**——候选方向对线上契约、部署 pipeline、回归测试的影响，是否需要在生产环境改动前停下问用户

### 6. 总结给用户看

把你帮用户理清的内容自然地呈现出来，让用户清楚你对问题的理解、你发现了哪些选项、还卡在哪里。大致结构供参考，根据实际对话调整，不用拘泥：

- **当前理解**：复述用户问题，确认理解对了
- **候选方向**：每个方向标注系统影响
- **未解决的矛盾**：对话中暴露的冲突点
- **建议的下一步**：通向 propose 或继续探索

### 7. 探索成果落池（可选）

探索产生了用户认可、但暂不立即 propose 的新方向时，建议写入 `openspec/todo.md` 的待办节（条目为 `- [ ] 一句话描述`，格式见 `td-propose` 的 `references/todo-format.md`）。文件不存在 → 问用户是否创建（探索产出是新池的第一个候选）。这是"想到了先记下来，别急着建 change"——记入池不占 WIP，等 `td-propose` 时从池里挑。用户拒绝落池 → 跳过，不强制。

## Guardrails

- 不创建任何 change 文件
- 不修改代码
- 对话中的想法允许矛盾，不急着自洽
- 如果用户想直接跳到 propose，提醒："explore 是为了想清楚建什么，跳过可能让你 propose 错方向。但你是 boss，你说跳就跳。"
