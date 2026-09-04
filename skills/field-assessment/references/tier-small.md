# Tier: Small（小型系统）

本文件是 `field-assessment` tier 维度三变体之一。判读命中 `tier-small` 后读本文件（判据见 `identification-flow.md`「### 3. 判读 tier（三选一）」节，任一成立取最高）。

## system-audit 频率

见表 3 的 tier-small 行（表 3 见 `audit-frequency.md`）。

## 特殊规则

### 1. 不强求重流程

小系统容易 over-engineering。profile × constraint 已经给小系统松绑，不要"因为流程模板这么说"就强行走全套 SDD。

### 2. 简单优先

任何"是不是该引入 X 工具"的决策，默认回答是"不引入"。小系统的美德是简单。

## 与其他 tier 的切换

- 命中更高 tier 判据 → 切 `tier-medium`（变体文件 `tier-medium.md`）
- 判据（文件数 / 团队 / 部署单元 / 分系统边界）见 `identification-flow.md`「### 3. 判读 tier（三选一）」节（单一事实源）
