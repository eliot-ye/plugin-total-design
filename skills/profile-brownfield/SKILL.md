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
| Superpowers 行为层 | **中**：TDD 只在新代码强制，避免"加测试就改坏老代码" |
| 工程管理约束层 | **强**：关键链诊断，找最薄弱环节 |

## 在各 tier 下的 constraint 强度

强度本身见 `field-assessment` skill 的表 1（5 个 constraint 在 3 个 tier 下的强度）与表 2（3 个 profile 在 human-in-loop 上的场景加成）。

**profile-brownfield 在表 2 的加成**：

| profile | tier-small | tier-medium | tier-large |
|---|---|---|---|
| `profile-brownfield` | — | + 改老代码前 | + 总体设计文档必填 |

"—" 表示该格无 profile 场景加成，仅用表 1 第 5 行的 tier 基线。3 个 profile 在 tier-small 下都没有超出 tier 基线的加成。

**profile-brownfield 不再加成其余 4 个 constraint**（`wip-limit` / `critical-buffer` / `brooks-law` / `delay-decision`）——强度由 tier 决定。profile 只决定流程侧重（brownfield 侧重 reverse-spec→propose 的接手路径），不改变各 tier 的强度。

## 特殊规则

### 1. reverse-spec 优先

进仓库第一件事：`/td-reverse-spec`。建立 baseline spec。

没 reverse-spec 就 `/td-propose`，agent 会拦："你对现有系统还没建立认识，propose 大改动风险高。先 reverse-spec 吗？"

### 2. TDD 边界

- **新代码**：full TDD（RED-GREEN-REFACTOR）
- **重构老代码**：先加 characterization test（锁定现有行为），再重构
- **修老 bug**：用 systematic-debugging，回归测试是必须

### 3. 避免改坏老代码

改老代码前，触发 `human-in-loop`：这块老代码你确定要动吗？有没有更小范围的改法？

## 与其他 profile 的切换

- 代码库上线 + 有真实用户流量 → 切 `profile-maintenance`
- reverse-spec 后发现代码库其实是"刚 init 的脚手架" → 切 `profile-greenfield`
