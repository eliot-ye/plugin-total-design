---
name: field-assessment
description: 现场判读 profile × tier 并注入 constraint 强度。执行任意局部 constraint（`constraints` skill 的 references 变体）时，应同时查本 skill 确认当前 profile × tier 下的强度
user-invocable: false
---

# 现场评估（profile × tier 判读 + 强度注入）

本 skill 是所有 profile / tier / 局部 constraint（`constraints` skill 的 references 变体文件）引用的**配置入口**：判读现场 profile × tier，把三张强度表的值注入会话上下文。

## 服务的主基调原则

**系统工程主基调第 4 条：开放的复杂巨系统。** 复杂巨系统不能套同一套 constraint 强度——必须按系统规模（tier）和现场状态（profile）分层对待。本 skill 是这个原则的工程化入口。

## 内容编排

本 skill 是配置入口，实际内容在 `references/` 下十一个文件：四个机制文件（识别流程 / 强度矩阵 / audit 频率 / 子系统独立定 tier）+ 七个流程/变体文件（config context 引导 + 3 profile + 3 tier，承载流程侧重与特殊规则）。下游 skill 通过 `field-assessment` 的识别流程读机制文件，判读命中后只读对应的那一份变体文件。

## 如何被引用

每个 td-* skill 的"步骤 1"调用本 skill 的识别流程（`references/identification-flow.md`），判读 `$_TD_PROFILE` / `$_TD_TIER`，并把表 1 + 表 2（+ 表 3，archive / apply / system-audit 需要）读入上下文。判读命中后，同时读入对应变体文件的特殊规则（见 `references/identification-flow.md` 的「### 变体文件」节）。
