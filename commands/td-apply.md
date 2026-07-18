---
name: td-apply
description: 实施任务，按 artifact 走。OpenSpec 契约层入口。
argument-hint: <change-name>
---

# td-apply

## 平台命名

本命令对应的 skill 在不同平台下的调用名：

| 平台 | skill 调用名 |
|---|---|
| atomcode | `total-design:td-apply` |
| Claude Code | `total-design:td-apply` |
| Cursor / 其他 | `td-apply` |

本命令是 `td-apply` skill 的 slash 入口，逻辑全部维护在 skill 里。

**立刻调用 `use_skill` 工具，传入 skill 名 `total-design:td-apply`，参数 `$ARGUMENTS`。** 执行 skill 返回的指令正文即可，本文件不重复逻辑。
