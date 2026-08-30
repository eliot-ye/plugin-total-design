# 架构 Review 检查清单（proposal 完成后、apply 前）

review 对象是 proposal 的分系统切分与设计决策，不是代码。此时改架构成本最低。

## 高内聚

- 每个分系统职责是否单一（一个分系统只做一件事）
- 分系统内部是否自包含（数据所有权清晰）
- 职责是否重复（两个分系统做同一件事 → 合并信号）

## 低耦合

- 分系统间接口是否最小化（只暴露必要契约，内部实现不外泄）
- 有无循环依赖（A ↔ B）
- 有无隐式依赖（共享数据库、共享配置、时序耦合）
- 一个改动是否牵动过多分系统（过度耦合信号）
- 命中 caller impact 触发条件时（触发条件与四类变更点定义见 `td-apply/references/change-point-classes.md`，单一事实源），proposal 是否附「caller impact 分析」节（变更点类别标注 + 高危标记 + 已知高危 caller，见 `td-propose` 步骤 6.c）

## 分级与阻塞

分级与阻塞语义由 `requesting-code-review` skill 第 5 节持有：架构 review 按该节的 critical / warning / nit 判定，critical **阻塞 apply**，先回 propose 改 proposal 再继续。

架构 review 的 critical 与 code review 的 critical 同样适用"不继续"规则——只是这里"不继续"意味着不进入任务实施。
