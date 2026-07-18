---
name: td-reverse-spec
description: 中途接手项目专用：先 reverse-spec 已有代码，再 propose 改动。
argument-hint: <existing-codebase-path or empty for cwd>
---

本命令是 `td-reverse-spec` skill 的 slash 入口，逻辑全部维护在 skill 里。

**立刻调用 `use_skill` 工具，传入 skill 名 `td-reverse-spec`，参数 `$ARGUMENTS`。** 执行 skill 返回的指令正文即可，本文件不重复逻辑。
