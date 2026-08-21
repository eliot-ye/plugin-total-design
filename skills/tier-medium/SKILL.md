---
name: tier-medium
description: 中型系统复杂度 tier。10-100 文件，多模块。constraints 中等强制，system-audit 每个重大改动后。
user-invocable: false
---

# Tier: Medium（中型系统）

## 判断依据

文件数 / 团队规模 / 部署单元的判据见 `field-assessment` 的识别流程「### 3. 判读 tier」节（任一成立取最高）。

- 系统层次：有明显的模块/分系统边界

## system-audit 频率

见表 3 的 tier-medium 行（project scope 每完成 3 个 change，current-change 每个关键链任务完成时；表 3 见 `field-assessment/references/audit-frequency.md`）。

## 特殊规则

### 1. 分系统边界显式化

medium 系统的常见问题是"分系统边界模糊"。在 reverse-spec 时，把分系统边界画出来，作为后续改动的影响评估依据。

**层次观归位**：分系统边界显式化是主基调第 4 条「层次观」在 tier-medium 的工程化——承认 medium 系统是多层级嵌套结构（顶层架构 → 模块设计 → 实现细节），不同层次需要分层对待。当 `field-assessment` 识别流程允许子系统独立定 tier 时，medium 系统的每个分系统也可能有自己的子系统层次。

### 2. 公共契约变更触发 human-in-loop

medium 系统里，API 形状、数据库 schema、配置格式这些"公共契约"开始有跨分系统影响。改这些前必触发 human-in-loop。

### 3. 关键链诊断

medium 系统的关键链通常不是单任务序列，而是"分系统 A 改 → 等分系统 B 改 → 集成测试"。识别这条链，buffer 留在集成测试上。

## 与其他 tier 的切换

- 文件数增长到 100+ → 切 `tier-large`
- 系统简化到 10 文件以下 → 切 `tier-small`
