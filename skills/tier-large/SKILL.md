---
name: tier-large
description: 大型系统复杂度 tier。100+ 文件 / 多团队 / 多仓库。constraints 强制，system-audit 周期性，要求总体设计文档。
user-invocable: false
---

# Tier: Large（大型系统）

## 判断依据

- 文件数：100+
- 团队规模：多团队
- 部署单元：多个
- 系统层次：多层嵌套的分系统，可能有跨仓库依赖

## constraint 强度

强度本身见步骤 1 注入的表 1（若未注入,调 `field-assessment` 注入后再读）。本 tier 的注解已合并进 `field-assessment/references/strength-matrix.md` 的「表 1 注解」节,本文件不重复。

## system-audit 频率

见步骤 1 注入的表 3（tier-large：current-change 每完成 1 个 change，project 每周一次）。本文件不重复定义频率数字。

## 特殊规则

### 1. 总体设计文档必填

large 系统的每个 change，proposal 里必须附"总体设计文档"：

- 这个改动在系统层次里的位置
- 影响的所有分系统
- 与最近 archive 的 change 的关系
- 是否触发跨分系统协调

没这份文档，不允许 `/td-apply`。

**执行层校验由 `td-propose` 步骤 7 和 `td-apply` 步骤 2 负责**：

- `td-propose` 步骤 7 的"artifact 必填项检查"应包含"tier-large 时总体设计文档必填"——缺文档 → 回步骤 6 补写，不能跳到步骤 8。
- `td-apply` 步骤 2 的"前置检查"应包含"tier-large 时总体设计文档必填"——缺文档 → 阻塞 apply，提示用户回 `/td-propose` 补文档。

本 skill 只声明"总体设计文档必填"的规则，执行层校验由 td-propose / td-apply 负责，避免在本 skill 重复校验逻辑。

### 2. WIP 限制

大系统并行硬解几乎必然制造失调。同一时刻至多允许的活跃 change 数按步骤 1 注入的表 1 的 wip-limit 行取值，本文件不重复数字。

如果用户坚持要并行，触发 `brooks-law` 强制提醒，并要求用户显式确认风险。

### 3. 关键链 buffer

大系统的不确定性最高——集成问题、跨团队协调、生产环境意外。buffer 比例按步骤 1 注入的表 1 的 critical-buffer 行取值，本文件不重复数字。buffer 不是"浪费"，是"必然需要的容量"。

### 4. 周期性 system-audit

大系统的"局部优化制造全局失调"风险最高。`project` scope audit 频率见表 3 的 tier-large project scope 行（表 3 由 td-* 步骤 1 注入会话上下文；若未注入，调 `field-assessment` 注入后再读）。本文件不重复定义频率数字。

audit 报告里特别关注：

- 最近是否有分系统在做"自己最优但损害邻居"的改动
- 关键链 buffer 是否被压缩
- 是否有"应该触发 human-in-loop 但没触发"的决策

**层次观归位**：当 `field-assessment` 识别流程允许子系统独立定 tier 时，project scope audit 应**按子系统层次分别审计**——每个子系统有自己的"局部优化制造全局失调"风险，跨子系统的依赖链是跨子系统的关键链。audit 报告里应区分"子系统内部失调"和"跨子系统边界失调"，后者按"最高 tier 子系统"的强度处理（保守原则）。

## 与其他 tier 的切换

- 系统简化到 100 文件以下 → 切 `tier-medium`
- 系统拆分成多个独立子系统 → 每个子系统独立定 tier
