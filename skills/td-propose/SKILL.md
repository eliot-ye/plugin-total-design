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
- `constraint-matrix`

## 服务的主基调原则

**系统工程主基调第 3 条：从定性到定量的综合集成。**

proposal 里的"系统工程影响评估"节是这个原则的工程化体现——agent 不只写"what"和"how"，必须写"这会对系统整体产生什么影响"，完成从定性到定量的综合集成。

## 输入

#### 可以是：

- **kebab-case change 名**：如 `add-user-auth`
- **自然语言描述**：agent 从中推导 kebab-case 名
- **空**：用 `AskUserQuestion` 问用户"想做什么 change"

#### 内容

`$ARGUMENTS`

## 步骤

### 0. 激活主基调与配置层

**加载技能 `system-engineering` `constraint-matrix`**

- 执行 `constraint-matrix` 的 `## 识别流程`
- propose 的每个判断都在主基调四条框架下做。
- 表 1（5 个 constraint 强度）+ 表 2（human-in-loop 加成）必须读入——步骤 1 据此判断 wip-limit / human-in-loop 是否触发。

### 0.5 读现场背景（config.yaml context）

读 `openspec/config.yaml` 的 `context` 字段（tech stack、conventions、domain knowledge 等），作为后续 proposal/design 的现场背景。这部分背景信息会直接进入 proposal 的"系统工程影响评估"节的判断依据。

**首次运行引导填**：若 `context` 字段为空、被注释、或仍是模板默认值，问用户两到三个关键问题（tech stack / conventions / domain），拿到答案后写入 `openspec/config.yaml` 的 `context` 字段。这是一次性投入——后续所有 td-propose / td-explore 都能读到。

引导问题示例：

- "项目的主要 tech stack 是？"（如 TypeScript / Rust / Python / 混合）
- "团队遵守的 conventions 有？"（如 conventional commits / 代码风格指南 / PR 模板）
- "项目所在的 domain 是？"（如 e-commerce / infra / 内部工具）

用户答完 → 写入 config.yaml → 继续步骤 1。用户跳过 → 保持空，继续步骤 1（不阻塞）。

### 1. 触发前置检查

对照步骤 0 注入的强度与当前 change 状态，判断是否触发：

- `wip-limit`：当前活跃 change 数已达上限？已达 → 报告列表 + 提示"先 archive 或 finish 现有 change 再起新的"，但不强制阻塞。
- `human-in-loop`：用户描述是否清晰到可以 propose？不清楚 → 用 `AskUserQuestion` 问"想做什么 change"。
- **brownfield reverse-spec 检查**：若 `$_TD_PROFILE == profile-brownfield`，检查 `openspec/specs/` 下是否已有相关分系统的 baseline spec。没有 → 触发 `human-in-loop`，提示用户"你对现有系统还没建立认识，propose 大改动风险高。先 `/td-reverse-spec` 吗？"——用户同意后执行 `/td-reverse-spec` 建立 baseline，完成后回到本步骤继续 propose。

### 2. 创建 change 目录

```bash
openspec new change "<name>"
```

### 3. 获取 artifact 构建顺序

```bash
openspec status --change "<name>" --json
```

解析 JSON 拿到 `applyRequires`、`artifacts`、`planningHome`、`changeRoot`、`artifactPaths`、`actionContext`。

### 4. 按依赖顺序创建 artifact

用 `TodoWrite` 工具跟踪进度。每个 artifact：

```bash
openspec instructions <artifact-id> --change "<name>" --json
```

- 读 `template` 作为结构
- 应用 `context` 和 `rules` 作为约束——**不要把它们复制进 artifact 文件**
- 读已完成的依赖 artifact 作为 context
- 写到 `resolvedOutputPath`

greenfield 特例：若 `$_TD_PROFILE == profile-greenfield` 且 `openspec/specs/` 为空，第一个 change 的 proposal 还要建立初始 spec baseline——这是后续所有改动的影响评估依据。

### 5. artifact 必填项检查

每个 artifact 写完后，对照 total-design 对 OpenSpec 模板的**新增要求**做必填项检查。缺项 → 回步骤 4 补写,不能跳到步骤 6。

#### proposal.md 必填节：系统工程影响评估

```markdown
## 系统工程影响评估

（服务钱学森系统工程主基调第 3 条"从定性到定量的综合集成"）

- 影响哪些分系统：
- 整体性能预期变化：
- 这是局部优化还是全局协调：
- 如果是局部优化，对全局失调的风险：
```

没填这一节的 proposal 不算 apply-ready。

#### tasks.md 必填：关键链标注与 project buffer

tasks.md 必须：

- 标注关键链（critical chain）：哪条任务序列是项目的关键路径
- 留 project buffer：按步骤 0 注入的当前 tier 比例（tier-small 20% / tier-medium 35% / tier-large 50%）

粒度不够 → 触发 `writing-plans` 细化；标注不明 → 参考 `critical-buffer` skill 的标注规范。

### 6. 循环直到所有 applyRequires artifact 完成

每创建完一个 artifact：

```bash
openspec status --change "<name>" --json
```

检查每个 `applyRequires` 里的 artifact ID 是否 `status: "done"`。

### 6. 显示最终状态

```bash
openspec status --change "<name>"
```

输出：

- Change 名 + 位置
- 创建的 artifact 列表 + 简述
- "All artifacts created! Ready for implementation."
- "Run `/td-apply` to start implementing."

## Guardrails

- 创建所有 `applyRequires` 要求的 artifact，不能跳过
- 永远先读依赖 artifact 再创建新 artifact
- `context` 和 `rules` 是给你的约束，不是文件内容
- 写完每个 artifact 后验证文件存在
- 如果 change name 已存在，问用户是 continue 还是 new
