---
name: td-explore
description: 不带 stakes 的思考伙伴，写代码前先探索。OpenSpec 契约层入口。触发场景：用户说"想探索"、"explore"、"先想想"、"不确定要建什么"、"帮我想清楚 X"。
user-invocable: true
argument-hint: <topic or question>
---

# td-explore

不创建 change、不写 artifact，只是**探索**。在用户还不确定要建什么的时候，agent 帮用户想清楚。

## 依赖技能

- `system-engineering`
- `constraint-matrix`

## 服务的主基调原则

**系统工程主基调第 2 条：总体设计部。**

explore 是总体设计部在"想"的阶段的工作——不是分系统工程师直接动手，是先在系统全局立场上探索。

**系统工程主基调第 4 条：开放的复杂巨系统。**

explore 不简化还原问题，允许矛盾并存，这是对复杂巨系统的尊重。

## 输入 - 用户想探索的话题、问题、想法

**用户输入内容的对象是本项目，禁止溢出范围**

#### 内容

`$ARGUMENTS`

## 步骤

### 1. 激活主基调与配置层

**加载技能 `system-engineering` `constraint-matrix`**

- 执行 `constraint-matrix` 的 `## 识别流程`
- explore 不写 artifact、不动代码，constraint 强度对其直接影响较小。
- profile 决定 explore 的侧重点（greenfield 重候选方向，brownfield 重"动老代码的影响"，maintenance 重"生产稳定性"），所以 profile/tier 仍需在步骤 1 判读完成。

### 2. 读现场背景（config.yaml context）

与 `td-propose` 步骤 2 同一引导流程：读 `openspec/config.yaml` 的 `context` 字段作为探索现场背景；若为空或模板默认值，一次问完 tech stack / conventions / domain 三个问题，答案写入 `context` 字段。一次性投入，后续 td-propose / td-explore 都能读到。用户跳过 → 保持空，继续步骤 3（不阻塞）。

### 3. 读现有 context

- 读项目当前状态（git log、package.json、目录结构）
- 读相关已有 spec（在 `openspec/specs/` 下）
- 读相关已有 change（在 `openspec/changes/` 下）

### 4. 头脑风暴

调用 `brainstorming` skill 的 1–4 步工作方式

### 5. 系统工程视角评估

对每个候选方向，评估：

- 影响哪些分系统
- 整体性能预期变化
- 是局部优化还是全局协调
- 局部优化对全局失调的风险

### 6. 总结给用户看

把你帮用户理清的内容自然地呈现出来，让用户清楚你对问题的理解、你发现了哪些选项、还卡在哪里。大致结构供参考，根据实际对话调整，不用拘泥：

- **当前理解**：复述用户问题，确认理解对了
- **候选方向**：每个方向标注系统影响
- **未解决的矛盾**：对话中暴露的冲突点
- **建议的下一步**：通向 propose 或继续探索

## Guardrails

- 不创建任何 change 文件
- 不修改代码
- 对话中的想法允许矛盾，不急着自洽
- 如果用户想直接跳到 propose，提醒："explore 是为了想清楚建什么，跳过可能让你 propose 错方向。但你是 boss，你说跳就跳。"
