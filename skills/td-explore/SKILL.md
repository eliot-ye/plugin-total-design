---
name: td-explore
description: 不带 stakes 的思考伙伴，写代码前先探索。OpenSpec 契约层入口。触发场景：用户说"想探索"、"explore"、"先想想"、"不确定要建什么"、"帮我想清楚 X"。
user-invocable: true
argument-hint: <topic or question>
---

# td-explore

不创建 change、不写 artifact，只是**探索**。在用户还不确定要建什么的时候，agent 帮用户想清楚。

## 服务的主基调原则

**系统工程主基调第 2 条：总体设计部。**

explore 是总体设计部在"想"的阶段的工作——不是分系统工程师直接动手，是先在系统全局立场上探索。

**系统工程主基调第 4 条：开放的复杂巨系统。**

explore 不简化还原问题，允许矛盾并存，这是对复杂巨系统的尊重。

## 输入

`$ARGUMENTS`：用户想探索的话题、问题、想法。

## 步骤

### 0. 激活主基调与配置层

每个 td-* skill 的步骤 0 执行同一序列，只注入强度不做判断：

1. **`system-engineering`** — 主基调四条进入上下文。explore 不写 artifact、不动代码，constraint 强度对其直接影响较小。
2. **profile × tier 识别** — 调用 `constraint-matrix` 的「识别流程」节，判读 `$_TD_PROFILE` / `$_TD_TIER`，并把表 1（5 个 constraint 强度）+ 表 2（human-in-loop 加成）读入上下文。会话内缓存，后续步骤直接引用。profile 决定 explore 的侧重点（greenfield 重候选方向，brownfield 重"动老代码的影响"，maintenance 重"生产稳定性"），所以 profile/tier 仍需在步骤 0 判读完成。
3. **其余 constraint**（`wip-limit` / `human-in-loop` / `critical-buffer` 等）— 只把 `constraint-matrix` 的强度值读入上下文，**不在步骤 0 判断是否触发**。"是否触发"是步骤 1 的事。

### 1. 读现有 context

- 读项目当前状态（git log、package.json、目录结构）
- 读相关已有 spec（在 `openspec/specs/` 下）
- 读相关已有 change（在 `openspec/changes/` 下）

### 2. 苏格拉底式对话

调用 `brainstorming` skill 的 1–4 步工作方式（不直接给方案 / 探索 2–3 个候选 / 对每个方向问"系统整体会怎么变" / 允许矛盾并存），不在此重述。explore 与 brainstorming 的差别只在产物：brainstorming 收敛成 spec 文档，explore 不写文档只输出探索结论（步骤 4）。

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
