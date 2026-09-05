---
name: td-explore
description: 不带 stakes 的思考伙伴，需求不清时的主入口。触发场景：用户说"探索"、"explore"、"先想想"、"帮我想清楚 X"。用户想 build/fix/重构但需求不清时，优先路由到这里
user-invocable: true
argument-hint: <topic or question>
---

# td-explore

不创建 change、不写 artifact，只是**探索**。在用户还不确定要建什么的时候，agent 帮用户想清楚。

## 依赖技能

- `system-engineering`
- `field-assessment`

## 服务的主基调原则

**系统工程主基调第 2 条：总体设计部。**

explore 是总体设计部在"想"的阶段的工作——不是分系统工程师直接动手，是先在系统全局立场上探索。

**系统工程主基调第 4 条：开放的复杂巨系统。**

explore 不简化还原问题，允许矛盾并存，这是对复杂巨系统的尊重。

**《工程控制论》反馈控制回路归位**：explore 是前馈控制准备环节（完整回路见 `system-engineering` 的「反馈控制回路」节）。

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

执行 `field-assessment` 的 `references/config-context-guidance.md` 的引导流程，读 `openspec/config.yaml` 的 `context` 字段作为探索现场背景（空则引导填写，用户跳过不阻塞，完整流程见该文件）。

### 3. 读现有 context

- 读项目当前状态（git log、项目清单文件如 package.json / Cargo.toml、目录结构），**同时识别既有架构风格与代码约定**（分系统边界、命名、模块组织、错误处理模式）
- 读相关已有 spec（在 `openspec/specs/` 下）
- 读相关已有 change（在 `openspec/changes/` 下）
- 读 `openspec/todo.md` 的未勾选条目（`- [ ]`）——这是项目级候选池，作为探索的候选方向输入；文件不存在 → 跳过，视为空池

识别出的既有架构与代码约定是候选方向的**隐性约束**：探索出的方向默认遵循既有架构与代码风格（主基调第 1 条"局部动作从整体性能反推"）；不遵循的方向必须显式标注"偏离既有架构/风格"及其理由。

### 4. 头脑风暴

调用 `brainstorming` skill 的工作方式：explore 阶段不落盘 spec，成果以对话形式交付（见步骤 6）。若用户要求把探索结果落盘为 spec 草稿，提示走 `/td-propose`。

**产物要求**：explore 阶段**按需产出候选方向**，每个标注系统工程影响与可逆性（完整评估维度见步骤 5）。产物留在会话上下文里（explore 不落盘 spec，见文末 Guardrails）。**决策已闭合、无新信息时不凑方向**——现场判读已无新的候选维度、用户已授权继续时，正确输出是一句话"没有需要你的决策点，直接继续推进"，而不是为凑格式生成伪选项（对齐 `constraints` 的 `references/human-in-loop.md` 的"不对所有动作都问一下"红线）。`/td-propose` 步骤 3 的"greenfield explore 检查"会读会话历史判定是否已做过充分探索（判据见 `td-propose` 步骤 3）。

**与 `constraints` 的 `references/delay-decision.md` 的连接**：explore 阶段"不落盘 spec"本质上是延迟决策（语义与触发提醒见该文件「触发时机」节的"与 `td-explore` 的连接"条）。这与 `td-propose` 步骤 3 的"greenfield explore 检查"协同——greenfield 项目先 explore 再 propose。

### 5. 系统工程视角评估

对每个候选方向，评估（步骤 4 标注的深化）：

- 影响哪些分系统
- 整体性能预期变化
- 是局部优化还是全局协调
- 局部优化对全局失调的风险
- 可逆性（two-way door / one-way door）——`constraints` 的 `references/delay-decision.md` 检查的输入

评估侧重按步骤 1 判读的 `$_TD_PROFILE` 调整（各 profile 的特殊规则与流程侧重见 `field-assessment` 的对应变体文件：`profile-greenfield` → `references/profile-greenfield.md`、`profile-brownfield` → `references/profile-brownfield.md`、`profile-maintenance` → `references/profile-maintenance.md`）：

- `profile-greenfield`：重候选方向的**取舍与可逆性**——没有存量约束，方向选错成本低，但要用 `constraints` 的 `references/delay-decision.md` 避免"想到了就建"和"先把架构设计完美"两个陷阱
- `profile-brownfield`：重**动老代码的影响**——候选方向会触碰哪些存量分系统、改动范围能否最小化、是否触发公共契约变更（对照 `constraints` 的 `references/human-in-loop.md` 的必停场景）
- `profile-maintenance`：重**生产稳定性**——候选方向对线上契约、部署 pipeline、回归测试的影响，是否需要在生产环境改动前停下问用户

### 6. 总结给用户看

把你帮用户理清的内容自然地呈现出来，让用户清楚你对问题的理解、你发现了哪些选项、还卡在哪里。下面结构供参考，可根据实际对话调整（**「条目标号规则」除外，见下节**）：

- **当前理解**：复述用户问题，确认理解对了
- **候选方向**：每个方向标注系统影响
- **未解决的矛盾**：对话中暴露的冲突点
- **建议的下一步**：通向 propose 或继续探索

**条目标号规则**：以上小节中，凡**需要用户回复**的章节（通常是"候选方向"与"建议的下一步"），各章节内条目标号按 `constraints` 的 `references/human-in-loop.md` 的「需用户回复的条目标号规则」执行——带章节前缀编号（如 `a1 / b1`），避免用户回复时无法对应条目。

### 7. 探索成果落池（可选）

探索产生了用户认可、但暂不立即 propose 的新方向时，询问用户："要不要把探索出的候选方向记进 `openspec/todo.md` 待办池？"——落池 = 记为 backlog 候选，等 `/td-propose` 时从池里挑，不占 WIP。这是"想到了先记下来，别急着建 change"。

用户同意 → 触发 `todo-pool` 的「落池条目」子流程；用户拒绝 → 跳过，不强制。

## Guardrails

- 不创建任何 change 文件
- 不修改代码
- 对话中的想法允许矛盾，不急着自洽
- 如果用户想直接跳到 propose，提醒："explore 是为了想清楚建什么，跳过可能让你 propose 错方向。但你是 boss，你说跳就跳。"
