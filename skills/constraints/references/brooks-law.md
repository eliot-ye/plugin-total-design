# Brooks 定律提醒

> 本文件与同目录的 `critical-buffer.md` / `delay-decision.md` / `human-in-loop.md` / `wip-limit.md` 是平级兄弟文件，正文中出现的裸逻辑名均指同目录对应变体文件。

## 服务的主基调原则

**系统工程主基调第 1 条：系统工程。** 总体性能 ≠ 各部分之和；协调成本随人数呈 O(n²) 增长。

Brooks 在《人月神话》里说："向一个进度落后的项目加人手，只会让它更落后。"这条规律的前提是钱学森系统工程——软件项目是复杂系统，总体性能不等于各工程师贡献之和。

## 规则

当用户想"加人手"（招人、加 agent、并行多 subagent）来加快进度时，agent 触发本文件提醒三件事（强度按表 1 的 brooks-law 行：tier-small 不强制——轻提示即可；tier-medium 提醒；tier-large 强制；表 1 见 `field-assessment/references/strength-matrix.md`）：

1. **协调成本**：新人 onboarding 时间 + 现有成员沟通开销增加
2. **可并行性**：这个任务真的可并行吗？还是它的关键链是串行的？（参考同目录 `critical-buffer.md`）
3. **替代方案**：加人手之前，是否试过"减少 WIP"、"缩小范围"、"延迟非关键决策"？

## 触发时机

- 用户说"再招一个"/"加个 agent"/"并行多开几个 subagent"
- `/td-apply` 时用户要求并行多个 subagent 加速
- change 的 tasks.md 里出现"多人协作"或"并行"字样
- **WIP override 时被 `wip-limit` 触发**：用户对 WIP 超限显式 override 时，`wip-limit` 的 override 流程会触发本文件做强制提醒（见同目录 `wip-limit.md` 的「硬约束 + override 机制」节）。

## 触发时 agent 应做的事

1. 引用 Brooks 定律原文意思
2. 列出三个反思问题（上面 1/2/3）
3. 让用户**显式确认**："我已经考虑过协调成本，仍要加人手"——才继续（tier-small 不强制，提示即可；tier-medium 建议确认；tier-large 必须确认）
4. 如果用户确认，记录到 change 的 design.md 里，作为"已知风险"

## 不做的事

- 不一刀切"禁止加人手"——Brooks 定律有边界条件（任务真的可并行、新人 onboarding 时间够、项目还有足够时间吸收 onboarding 成本）
- 但这些边界条件需要用户显式论证，不能默认成立
