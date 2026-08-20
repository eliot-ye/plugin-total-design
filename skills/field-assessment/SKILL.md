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

本 skill 的正文是编排层，实际内容在 `references/` 下四个文件：

| 文件 | 内容 | 被谁读 |
|---|---|---|
| `references/strength-matrix.md` | 表 1（5 constraint × 3 tier 强度）+ 表 2（profile × human-in-loop 加成） | 读 constraint 强度的 skill |
| `references/audit-frequency.md` | 表 3（system-audit 频率） | 读 audit 频率的 skill（td-system-audit / executing-plans / 3 tier） |
| `references/identification-flow.md` | 识别流程（读缓存→判 profile→判 tier→缓存→注入强度）+ 持久化层路径 + profile-tier.yaml 模板 | 每个 td-* skill 的步骤 1 |
| `references/subsystem-tiering.md` | 子系统独立定 tier 机制（层次观归位） | 处理子系统分层强度的 skill |

## 如何被引用

agent 在激活任意 constraint skill 时，应同时查本 skill 确认当前 profile × tier 下的强度。

每个 td-* skill 的"步骤 1"调用本 skill 的识别流程（`references/identification-flow.md`），判读 `$_TD_PROFILE` / `$_TD_TIER`，并把表 1 + 表 2（+ 表 3，仅 archive/apply 需要）读入上下文。会话内缓存，后续步骤直接引用。
