---
name: field-assessment
description: 现场判读 profile × tier 并注入 constraint 强度。
user-invocable: false
---

# 现场评估（profile × tier 判读 + 强度注入）

本 skill 是所有 profile / tier / 局部 constraint（`constraints` skill 的 references 变体文件）引用的**配置入口**：判读现场 profile × tier，把三张强度表的值注入会话上下文。

## 服务的主基调原则

**系统工程主基调第 4 条：开放的复杂巨系统。** 复杂巨系统不能套同一套 constraint 强度——必须按系统规模（tier）和现场状态（profile）分层对待。本 skill 是这个原则的工程化入口。

## 如何被引用

实际内容在 `references/` 下十一个文件：四个机制文件（识别流程 / 强度矩阵 / audit 频率 / 子系统独立定 tier）+ 七个流程/变体文件（config context 引导 + 3 profile + 3 tier，承载流程侧重与特殊规则）。每个 td-* skill 的"步骤 1"按以下读取策略判读并注入（重判策略权威在 `references/identification-flow.md`「### 4. 缓存判读结果」节）：

1. **先读缓存** — 读 `openspec/.td-state/profile-tier.yaml`。
2. **快车道（缓存命中）** — 文件存在，且本会话未命中任何一条重判触发（`/td-archive` 完成后 / `/td-system-audit` 发现 profile/tier 与实际不符 / 用户显式说"项目阶段变了"）→ 取缓存值为 `$_TD_PROFILE` / `$_TD_TIER`，**不读 `references/identification-flow.md` 全文**；只读 `references/strength-matrix.md` 全文（表 1 + 表 2，含两表的语义注记）与命中的 2 份变体文件（缓存值即变体文件名：`references/<$_TD_PROFILE>.md` + `references/<$_TD_TIER>.md`，如 `profile-maintenance.md` + `tier-large.md`）入上下文；缓存含 `subsystems` 条目 → 另读 `references/identification-flow.md`「### 5. 注入强度」节的"子系统独立定 tier 时的强度注入"段（按该段注入：按子系统分别注入强度，跨子系统依赖链按最高 tier 子系统处理）；archive / apply / system-audit 另读 `references/audit-frequency.md`（表 3）。
3. **现判路径（缓存缺失或重判触发）** — 读 `references/identification-flow.md` 全文，按其 1–5 节判读 `$_TD_PROFILE` / `$_TD_TIER`，按「### 4. 缓存判读结果」写缓存，再读 `references/strength-matrix.md` 全文（表 1 + 表 2）、命中的 2 份变体文件入上下文完成注入（archive / apply / system-audit 另读 `references/audit-frequency.md`（表 3））。
