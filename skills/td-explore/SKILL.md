---
name: td-explore
description: 不带 stakes 的思考伙伴，写代码前先探索。OpenSpec 契约层入口。触发场景：用户说"想探索"、"explore"、"先想想"、"不确定要建什么"、"帮我想清楚 X"。
user-invocable: true
argument-hint: <topic or question>
aliases:
  atomcode: total-design:td-explore
  claude-code: total-design:td-explore
  cursor: td-explore
---

# td-explore

## 平台命名

本 skill 在不同平台下的调用名：

| 平台 | 调用名 |
|---|---|
| atomcode | `total-design:td-explore` |
| Claude Code | `total-design:td-explore` |
| Cursor / 其他 | `td-explore` |

本文 body 里引用其他 skill 时一律用**逻辑名**（如 `brainstorming`），由当前平台的加载器负责拼前缀。

不创建 change、不写 artifact，只是**探索**。在用户还不确定要建什么的时候，agent 帮用户想清楚。

## 服务的主基调原则

**系统工程主基调第 2 条：总体设计部。**

explore 是总体设计部在"想"的阶段的工作——不是分系统工程师直接动手，是先在系统全局立场上探索。

**系统工程主基调第 4 条：开放的复杂巨系统。**

explore 不简化还原问题，允许矛盾并存，这是对复杂巨系统的尊重。

## 输入

`$ARGUMENTS`：用户想探索的话题、问题、想法。

## 步骤

### 1. 读现有 context

- 读项目当前状态（git log、package.json、目录结构）
- 读相关已有 spec（在 `openspec/specs/` 下）
- 读相关已有 change（在 `openspec/changes/` 下）

### 2. 苏格拉底式对话

升级为"总体设计部"工作方式（见 `brainstorming` skill）：

- 不直接给方案，先问用户想达到什么
- 探索 2–3 个候选方向
- 对每个方向，问"如果选这个，系统整体会怎么变？"
- 不急着收敛，允许矛盾并存

### 3. 系统工程视角评估

对每个候选方向，评估：

- 影响哪些分系统
- 整体性能预期变化
- 是局部优化还是全局协调
- 局部优化对全局失调的风险

### 4. 输出探索结论

输出格式：

```markdown
## 探索：<topic>

### 当前理解
<用户问题的重新表述>

### 候选方向
1. <方向 A>
   - 系统工程影响：<...>
   - 优点：<...>
   - 缺点：<...>
2. <方向 B>
   ...

### 未解决的矛盾
- <矛盾 1>
- <矛盾 2>

### 建议的下一步
- 如果想正式推进：`/td-propose <change-name>`
- 如果还想再想：继续对话
```

## Guardrails

- 不创建任何 change 文件
- 不修改代码
- 对话中的想法允许矛盾，不急着自洽
- 如果用户想直接跳到 propose，提醒："explore 是为了想清楚建什么，跳过可能让你 propose 错方向。但你是 boss，你说跳就跳。"
