---
name: td-propose
description: 创建 change，生成 proposal/design/tasks artifact。OpenSpec 契约层入口。触发场景：用户说"提一个 change"、"propose"、"开个新改动"、"建 proposal"、"想建 X 功能"。
user-invocable: true
argument-hint: <change-name or description>
---

# td-propose

OpenSpec 契约层入口。在写代码之前，让人和 AI 对"建什么、为什么这样建"达成契约。

## 服务的主基调原则

**系统工程主基调第 3 条：从定性到定量的综合集成。**

proposal 里的"系统工程影响评估"节是这个原则的工程化体现——agent 不只写"what"和"how"，必须写"这会对系统整体产生什么影响"，完成从定性到定量的综合集成。

## 输入

`$ARGUMENTS` 可以是：

- **kebab-case change 名**：如 `add-user-auth`
- **自然语言描述**：agent 从中推导 kebab-case 名
- **空**：用 `AskUserQuestion` 问用户"想做什么 change"

## 步骤

### 0. 激活主基调与配置层

每个 td-* skill 的步骤 0 执行同一序列，只注入强度不做判断：

1. **`system-engineering`** — 主基调四条进入上下文。propose 的每个判断都在主基调四条框架下做。
2. **profile × tier 识别** — 调用 `constraint-matrix` 的「识别流程」节，判读 `$_TD_PROFILE` / `$_TD_TIER`，并把表 1（5 个 constraint 强度）+ 表 2（human-in-loop 加成）读入上下文。会话内缓存，后续步骤直接引用。
3. **其余 constraint**（`wip-limit` / `human-in-loop` / `critical-buffer` 等）— 只把 `constraint-matrix` 的强度值读入上下文，**不在步骤 0 判断是否触发**。"是否触发"是步骤 1 的事，表 1 + 表 2 注入后判断 wip-limit / human-in-loop 是否触发。

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

#### greenfield 初始 spec 建立

若 `$_TD_PROFILE == profile-greenfield` 且 `openspec/specs/` 为空，第一个 change 的 proposal 还要建立初始 spec baseline——这是后续所有改动的影响评估依据。

#### proposal.md 必填节：系统工程影响评估

这是 total-design 对 OpenSpec proposal 模板的**新增要求**。proposal 里必须有一节：

```markdown
## 系统工程影响评估

（服务钱学森系统工程主基调第 3 条"从定性到定量的综合集成"）

- 影响哪些分系统：
- 整体性能预期变化：
- 这是局部优化还是全局协调：
- 如果是局部优化，对全局失调的风险：
```

没填这一节的 proposal 不算 apply-ready。

### 5. 循环直到所有 applyRequires artifact 完成

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
