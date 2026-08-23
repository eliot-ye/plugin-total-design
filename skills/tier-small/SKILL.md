---
name: tier-small
description: 小型系统复杂度 tier。3-10 文件，单团队。constraints 弱强制，system-audit 频率低。
user-invocable: false
---

# Tier: Small（小型系统）

## 判断依据

文件数 / 团队规模 / 部署单元的判据见 `field-assessment` 的识别流程「### 3. 判读 tier」节（任一成立取最高）。

- 系统层次：扁平，无明显分系统边界

## system-audit 频率

见表 3 的 tier-small 行（project scope 每完成 5 个 change，current-change 不要求；表 3 见 `field-assessment/references/audit-frequency.md`）。

## 特殊规则

### 1. 不强求重流程

小系统容易 over-engineering。profile × constraint 已经给小系统松绑，不要"因为流程模板这么说"就强行走全套 SDD。

### 2. 简单优先

任何"是不是该引入 X 工具"的决策，默认回答是"不引入"。小系统的美德是简单。

## 与其他 tier 的切换

- 文件数增长到 10+ → 切 `tier-medium`
- 系统开始有明显分系统 → 即使文件少，也考虑 `tier-medium`
