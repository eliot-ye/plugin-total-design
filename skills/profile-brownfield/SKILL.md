---
name: profile-brownfield
description: 中途接手项目 profile。仓库已有可运行代码。reverse-spec 优先，TDD 只在新代码。
user-invocable: false
---

# Profile: Brownfield（中途接手）

## 触发条件

- 仓库已有可运行代码（不是脚手架）
- 没有线上用户或刚上线不久
- agent 第一次进仓库，且上述条件成立

## 默认激活的层

| 层 | 强度 |
|---|---|
| OpenSpec 契约层 | **极强**：先 reverse-spec，再 propose。没 reverse-spec 不准 propose 大改动。 |
| 行为层（skills） | **中**：TDD 只在新代码强制，避免"加测试就改坏老代码" |
| 工程管理约束层 | **强**：关键链诊断，找最薄弱环节 |

## 在各 tier 下的 constraint 强度

强度由 `field-assessment` 单一判定（表 1 / 表 2，见 `field-assessment/references/strength-matrix.md`）。本 profile 不再加成其余 4 个 constraint——强度由 tier 决定，profile 只决定流程侧重。

## 特殊规则

### 1. reverse-spec 优先

进仓库第一件事：`/td-reverse-spec`。建立 baseline spec。

没 reverse-spec 就 `/td-propose`，agent 会拦："你对现有系统还没建立认识，propose 大改动风险高。先 reverse-spec 吗？"

### 2. TDD 边界

- **新代码**：full TDD（RED-GREEN-REFACTOR）
- **重构老代码**：先加 characterization test（锁定现有行为），再重构
- **修老 bug**：用 systematic-debugging，回归测试是必须

### 3. 避免改坏老代码

改老代码前，触发 `human-in-loop`（tier-medium / tier-large 生效——表 2 的 brownfield 加成；tier-small 下表 2 为"—"，仅走 human-in-loop 基线第 1–5 类）：这块老代码你确定要动吗？有没有更小范围的改法？

## 与其他 profile 的切换

- 代码库上线 + 有真实用户流量 → 切 `profile-maintenance`
- reverse-spec 后发现代码库其实是"刚 init 的脚手架" → 切 `profile-greenfield`
