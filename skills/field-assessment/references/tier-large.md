# Tier: Large（大型系统）

本文件是 `field-assessment` tier 维度三变体之一。识别流程判读命中 `tier-large` 后读本文件（判据见 `identification-flow.md`「### 3. 判读 tier（三选一）」节，任一成立取最高）。

## system-audit 频率

见表 3 的 tier-large 行（表 3 见 `audit-frequency.md`）。

## 特殊规则

### 1. 总体设计文档必填

large 系统的每个 change，proposal 里必须附"总体设计文档"：

- 这个改动在系统层次里的位置
- 影响的所有分系统
- 与最近 archive 的 change 的关系
- 是否触发跨分系统协调

没这份文档，不允许 `/td-apply`。

**执行层校验由 `td-propose` 步骤 6.c 和 `td-apply` 步骤 2 负责**：

- `td-propose` 步骤 6.c 的"必填项检查"应包含"tier-large 时总体设计文档必填"——缺文档 → 回 6.b 补写，不能进入 6.d。
- `td-apply` 步骤 2 的"前置检查"应包含"tier-large 时总体设计文档必填"——缺文档 → 阻塞 apply，提示用户回 `/td-propose` 补文档。

### 2. WIP 限制

大系统并行硬解几乎必然制造失调。同一时刻至多允许的活跃 change 数按表 1 的 wip-limit 行取值（表 1 见 `strength-matrix.md`）。

如果用户坚持要并行，执行 `wip-limit` 的「硬约束 + override 机制」——override 回路编排由 `wip-limit` 单一持有（brooks-law 提醒 → critical-buffer 评估 → human-in-loop 第 6 类确认 → 记录），本处不重复简化版。

### 3. 关键链 buffer

大系统的不确定性最高——集成问题、跨团队协调、生产环境意外。buffer 比例按表 1 的 critical-buffer 行取值。buffer 不是"浪费"，是"必然需要的容量"。

### 4. 周期性 system-audit

大系统的"局部优化制造全局失调"风险最高。`project` scope audit 频率见表 3 的 tier-large project scope 行（表 3 见 `audit-frequency.md`）。

audit 报告里特别关注：

- 最近是否有分系统在做"自己最优但损害邻居"的改动
- 关键链 buffer 是否被压缩
- 是否有"应该触发 human-in-loop 但没触发"的决策

**层次观归位**：当识别流程允许子系统独立定 tier 时，project scope audit 按子系统层次分别审计（分层审计的完整语义见 `td-system-audit` 步骤 2，此处不重复）——执行规则见 `subsystem-tiering.md`。

## 与其他 tier 的切换

- 系统简化到 100 文件以下 → 切 `tier-medium`（变体文件 `tier-medium.md`）
- 系统拆分成多个独立子系统 → 每个子系统独立定 tier（见 `subsystem-tiering.md`）
