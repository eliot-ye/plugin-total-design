# Tier: Medium（中型系统）

本文件是 `field-assessment` tier 维度三变体之一。识别流程判读命中 `tier-medium` 后读本文件（判据见 `identification-flow.md`「### 3. 判读 tier（三选一）」节，任一成立取最高）。

## system-audit 频率

见表 3 的 tier-medium 行（表 3 见 `audit-frequency.md`）。

## 特殊规则

### 1. 分系统边界显式化

medium 系统的常见问题是"分系统边界模糊"。在 reverse-spec 时，把分系统边界画出来，作为后续改动的影响评估依据。

**层次观归位**：分系统边界显式化是主基调第 4 条「层次观」在 tier-medium 的工程化——medium 系统已出现模块/分系统边界，不同层次需要分层对待。系统内分系统也可能各自存在子系统层次，该机制的完整语义见 `subsystem-tiering.md`，此处不重复。

### 2. 公共契约变更属 human-in-loop 基线第 1 类

medium 系统里，API 形状、数据库 schema、配置格式这些"公共契约"开始有跨分系统影响。改这些前必触发 `human-in-loop`——这属该 skill 的通用基线第 1 类（公共契约变更），所有 profile × tier 生效（表 1 注解明确"不重复列为 tier 加成"），本处不再视为 medium 独有加成。

### 3. 关键链诊断

medium 系统的关键链通常不是单任务序列，而是"分系统 A 改 → 等分系统 B 改 → 集成测试"。识别这条链，buffer 留在集成测试上。

## 与其他 tier 的切换

- 文件数增长到 100+ → 切 `tier-large`（变体文件 `tier-large.md`）
- 系统简化到 10 文件以下 → 切 `tier-small`（变体文件 `tier-small.md`）
