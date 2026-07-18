---
name: td-reverse-spec
description: 中途接手项目专用：先 reverse-spec 已有代码，再 propose 改动。触发场景：用户说"接手项目"、"reverse spec"、"反推 spec"、"看现有代码"、"刚接手这个库"。
user-invocable: true
argument-hint: <existing-codebase-path or empty for cwd>
aliases:
  atomcode: total-design:td-reverse-spec
  claude-code: total-design:td-reverse-spec
  cursor: td-reverse-spec
---

# td-reverse-spec

## 平台命名

本 skill 在不同平台下的调用名：

| 平台 | 调用名 |
|---|---|
| atomcode | `total-design:td-reverse-spec` |
| Claude Code | `total-design:td-reverse-spec` |
| Cursor / 其他 | `td-reverse-spec` |

本文 body 里引用其他 skill 时一律用**逻辑名**（如 `profile-brownfield`），由当前平台的加载器负责拼前缀。

**中途接手项目专用。** OpenSpec 原版没这个，是 total-design 新增的。

中途接手已有代码库时，直接 `/td-propose` 改动很危险——你不知道现有代码在 spec 层是什么样子。reverse-spec 先从代码反推 spec，建立 baseline，再在 baseline 上 propose 改动。

## 服务的主基调原则

**系统工程主基调第 2 条：总体设计部。**

reverse-spec 是总体设计部在"接手"阶段的工作——先建立系统全局视图，再决定动哪里。

**系统工程主基调第 4 条：开放的复杂巨系统。**

不简化还原，而是先识别层次（分系统切分），再在每个层次上建立认识。

## 输入

`$ARGUMENTS`：要 reverse-spec 的代码库路径。空则用当前工作目录。

## 步骤

### 1. 识别代码库状态

扫描目标代码库：

- 文件数、代码行数
- 主要目录结构
- 有无 `tests/`、CI 配置、`package.json` 等
- 最近 git 提交频率

判断属于哪种 profile（`profile-greenfield` / `profile-brownfield` / `profile-maintenance`）。中途接手通常触发 `profile-brownfield`。

### 2. 分系统切分

站在总体设计部视角，把代码库切成几个分系统（subsystem）。切分依据：

- 目录边界
- 模块依赖图
- 部署单元
- 数据所有权边界

不要过细——目标是识别"分系统"级别，不是"文件"级别。通常 3–8 个分系统。

### 3. 对每个分系统 reverse-spec

读分系统的代码，反推 spec：

- 这个分系统对外提供的契约是什么？（API、数据格式、事件）
- 这个分系统依赖哪些其他分系统？
- 这个分系统的关键不变量是什么？
- 这个分系统的已知缺陷 / 技术债？

输出到 `openspec/specs/<subsystem-name>/spec.md`。

### 4. 识别分系统间接口

把分系统之间的依赖关系画成图。识别：

- 接口的稳定性（哪些是公共契约，哪些是内部实现）
- 循环依赖
- 隐式依赖（共享数据库、共享配置）

### 5. 输出 reverse-spec 报告

```markdown
## Reverse-Spec 报告：<codebase>

### 识别的分系统
1. <subsystem A> - <职责>
2. <subsystem B> - <职责>
...

### 分系统间接口图
<ASCII 图或 mermaid>

### 各分系统 spec
- <subsystem A>: openspec/specs/<A>/spec.md
- <subsystem B>: openspec/specs/<B>/spec.md
...

### 已知风险 / 技术债
- <风险 1>
- <风险 2>

### 建议的下一步
- 如果想改某个分系统：`/td-propose <change-name>`
- 如果某个分系统 spec 太复杂：先 `/td-explore` 那个分系统
```

## Guardrails

- **不修改原代码**——reverse-spec 只读不写（除了写 spec 文件）
- 不要 reverse-spec 全部分系统到完美——目标是建立 baseline，不是写教科书
- 优先 reverse-spec 你**接下来要改**的那个分系统，其他分系统粗粒度即可

## 与其他命令的关系

- reverse-spec 之后，`/td-propose` 会更准确——因为有了 baseline spec，proposal 的"系统工程影响评估"节才有依据
- reverse-spec 的输出（`openspec/specs/` 下的 spec 文件）会被后续 `/td-apply` 引用
