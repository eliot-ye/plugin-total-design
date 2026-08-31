# Profile: Greenfield（零起步）

本文件是 `field-assessment` profile 维度三变体之一。判读命中 `profile-greenfield` 后读本文件（判据见 `identification-flow.md`「### 2. 判读 profile（三选一，按优先级）」节）。

## 默认激活的层

| 层 | 强度 |
|---|---|
| OpenSpec 契约层 | **强**：proposal 先行，必须填"系统工程影响评估" |
| 行为层（skills） | **强**：full SDD，brainstorming → writing-plans → TDD → review → verify 全走 |
| 工程管理约束层 | **中**：WIP 限制启动，brooks-law 提醒，delay-decision 强 |

## 特殊规则

### 1. 先 `/td-explore` 再 `/td-propose`

greenfield 最容易犯的错是"我想到了就建"。explore 至少探索 2 个候选方向，再 propose。

### 2. 初始 spec 建立

第一个 `/td-propose` 不只是建 change，还要建立 `openspec/specs/` 下的初始 spec。这是 baseline。

### 3. 避免"完美架构"陷阱

greenfield 容易陷入"先把架构设计完美"。用 `constraints` 的 `references/delay-decision.md`——可逆决策先往简单走，等信息足够再回头。

### 4. tier 松绑优先

本 profile 的"行为层强：full SDD"与 tier-small 的"不强求重流程"冲突时，**以 tier 为准**——tier 决定约束强度与流程重量，profile 只决定流程侧重（greenfield 侧重 explore→propose 的完整路径，不改变各 tier 的强度）。greenfield × small 时流程从简，greenfield × medium/large 时再走全套 SDD。

## 与其他 profile 的切换

- 项目有了可运行代码 + 真实用户 → 切 `profile-maintenance`（变体文件 `profile-maintenance.md`）
- 项目代码量超过脚手架但还没上线 → 切 `profile-brownfield`（变体文件 `profile-brownfield.md`；但这个场景少见，通常是直接从 greenfield 到 maintenance）
