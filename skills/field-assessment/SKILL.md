---
name: field-assessment
description: 现场判读 profile × tier 并注入 constraint 强度。激活任意 constraint skill 时，应同时查本 skill 确认当前 profile × tier 下的强度
user-invocable: false
---

# 现场评估（profile × tier 判读 + 强度注入）

本 skill 是所有 profile / tier / constraint skill 引用的**配置入口**：判读现场 profile × tier，把三张强度表的值注入会话上下文。

## 服务的主基调原则

**系统工程主基调第 4 条：开放的复杂巨系统。** 复杂巨系统不能套同一套 constraint 强度——必须按系统规模（tier）和现场状态（profile）分层对待。本 skill 是这个原则的工程化入口。

## 内容编排

本 skill 的正文是编排层，实际内容在 `references/` 下四个文件（强度矩阵 / audit 频率 / 识别流程 / 子系统独立定 tier）。下游 skill 通过 `field-assessment` 的识别流程读这四个文件。

## 如何被引用

每个 td-* skill 的"步骤 1"调用本 skill 的识别流程（`references/identification-flow.md`），判读 `$_TD_PROFILE` / `$_TD_TIER`，并把表 1 + 表 2（+ 表 3，仅 archive/apply 需要）读入上下文。
