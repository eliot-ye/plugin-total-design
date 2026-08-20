---
name: tier-small
description: 小型系统复杂度 tier。3-10 文件，单团队。constraints 弱强制，system-audit 频率低。
user-invocable: false
---

# Tier: Small（小型系统）

## 判断依据

- 文件数：3–10
- 团队规模：单人或单团队
- 部署单元：1 个
- 系统层次：扁平，无明显分系统边界

## constraint 强度

强度本身见步骤 1 注入的表 1（若未注入,调 `field-assessment` 注入后再读）。本 tier 的注解已合并进 `field-assessment/references/strength-matrix.md` 的「表 1 注解」节,本文件不重复。

## system-audit 频率

见步骤 1 注入的表 3（tier-small：project scope 每完成 5 个 change，current-change 不要求）。本文件不重复定义频率数字。

## 特殊规则

### 1. 不强求重流程

小系统容易 over-engineering。profile × constraint 已经给小系统松绑，不要"因为 superpowers 这么说"就强行走全套 SDD。

### 2. 简单优先

任何"是不是该引入 X 工具"的决策，默认回答是"不引入"。小系统的美德是简单。

## 与其他 tier 的切换

- 文件数增长到 10+ → 切 `tier-medium`
- 系统开始有明显分系统 → 即使文件少，也考虑 `tier-medium`
