---
name: constraints
description: 局部约束层入口——防局部优化制造全局失调。
user-invocable: false
---

# 局部约束层（5 个局部规律的单一入口）

复杂巨系统（主基调第 4 条）不能并行硬解、不能局部优化、不能让分系统工程师各自拍板——这些硬约束由本 skill 的 5 个局部规律承载，各自由钱学森系统工程框架下的局部规律（Brooks / Goldratt / 精益 / 综合集成）支撑。

## 依赖技能

- `field-assessment`（判读 profile × tier 与注入 constraint 强度）
- `system-engineering`（主基调四条前提）

## 服务的主基调原则

本 skill 是**所有局部 constraint 的入口**——5 个子约束各服务主基调的不同条款（第 1、2、3、4 条），通过 references 下的 5 份变体文件承载执行规则。触发路径统一：**agent 命中任一子约束的触发场景 → 读本 skill 判读子约束 → 读对应 references/<name>.md 执行规则**。

## 子约束映射

判读命中触发场景后，按命中的子约束读对应 references 文件执行规则：

| 触发场景 | 子约束 | references 文件 | 服务主基调 |
|---|---|---|---|
| 加人手前 / 协调成本 / 并行多 subagent 加速 | `brooks-law` | `references/brooks-law.md` | 第 1 条（系统工程） |
| 关键链识别 / project buffer 保护 / 隐性 buffer 压缩 | `critical-buffer` | `references/critical-buffer.md` | 第 1、2 条 |
| 可逆决策延迟 / 分层决策 / 层次观 | `delay-decision` | `references/delay-decision.md` | 第 3 条 |
| 何时停下等用户 / 必停场景 / 强度叠加 | `human-in-loop` | `references/human-in-loop.md` | 第 2、3 条 |
| 活跃 change 上限 / WIP 硬约束 + override | `wip-limit` | `references/wip-limit.md` | 第 4 条 |

## 如何被引用

- 使用态 LLM 在会话中命中任一子约束的触发场景 → 读本 skill → 按子约束映射读对应 references 文件执行
- 约束强度（表 1 第 1–5 行）+ human-in-loop 场景加成（表 2）+ system-audit 频率（表 3）由 `field-assessment` 的「如何被引用」节读取策略注入（快车道或现判路径）
- 子约束之间互相引用的路径为 `references/<name>.md`（相对本 SKILL.md 所在目录）
- override 回路编排（`wip-limit` → `brooks-law` → `critical-buffer` → `human-in-loop` → 记录）由 `references/wip-limit.md` 单一持有
