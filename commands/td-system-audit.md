---
name: td-system-audit
description: 周期性对照系统工程主基调自检。total-design 新增命令，体现钱学森"总体设计部"视角。
argument-hint: <scope = current-change | project>
---

# td-system-audit

## 平台命名

本命令对应的 skill 在不同平台下的调用名：

| 平台 | skill 调用名 |
|---|---|
| atomcode | `total-design:td-system-audit` |
| Claude Code | `total-design:td-system-audit` |
| Cursor / 其他 | `td-system-audit` |

本命令是 `td-system-audit` skill 的 slash 入口，逻辑全部维护在 skill 里。

**立刻调用 `use_skill` 工具，传入 skill 名 `total-design:td-system-audit`，参数 `$ARGUMENTS`。** 执行 skill 返回的指令正文即可，本文件不重复逻辑。
