---
name: td-list
description: 列出所有未归档的变更。触发场景：用户说"列一下 change"、"有哪些 in flight"、"未归档"、"现在在做什么"。
argument-hint: (无参数)
args: none
---

# td-list

列出当前所有未归档（活跃）的 change。

## 步骤

### 1. 列出未归档变更

```bash
openspec list
```

`openspec list` 只列 `openspec/changes/` 下的活跃 change，已 archive（移到 `openspec/changes/archive/`）的不会出现——这就是"未归档"的语义边界。

### 2. 输出态势

把 list 结果呈现给用户，大致结构：

```markdown
## 未归档变更（活跃 change）

| change | tasks 状态 | 最近更新 |
|---|---|---|
| <name> | <done>/<total> 或 "No tasks" | <relative time> |
```

如果 `openspec list` 输出为空（无活跃 change），提示"当前没有未归档变更"，建议下一步：`/td-propose` 开新 change，或 `/td-system-audit project` 做一次全局自检。

## Guardrails

- 本命令只读——不创建、不修改、不 archive 任何 change
- 不评估 change 质量（那是 `/td-system-audit` 的活），只列态势
