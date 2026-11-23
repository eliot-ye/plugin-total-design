# 架构 Review 检查清单（proposal 完成后、apply 前）

本清单审的是**方案整体**，不只分系统切分。查哪些节由 **change-scope** 收口（判据与收口表见 `requesting-code-review` skill 第 5 节，单一事实源）——本文件每节标题标注其适用 scope。

**本清单不查 tasks 层**：关键链标注 / project buffer / 任务主体约束属 `writing-plans` 域，由 `td-apply` 步骤 2 前置检查兜底，不在本 review 重复。

## 高内聚（scope-medium / scope-large）

- 每个分系统职责是否单一（一个分系统只做一件事）
- 分系统内部是否自包含（数据所有权清晰）
- 职责是否重复（两个分系统做同一件事 → 合并信号）

## 低耦合（scope-medium / scope-large）

- 分系统间接口是否最小化（只暴露必要契约，内部实现不外泄）——判据：调用方无需理解模块内部结构即可正确调用；调用方需先读懂内部实现才能用 → 接口偏大信号
- 有无循环依赖（A ↔ B）
- 有无隐式依赖（共享数据库、共享配置、时序耦合）
- 一个改动是否牵动过多分系统（过度耦合信号）
- 命中 caller impact 触发条件时（触发条件与四类变更点定义见 `td-apply/references/change-point-classes.md`，单一事实源），proposal 是否附「caller impact 分析」节（变更点类别标注 + 高危标记 + 已知高危 caller，见 `td-propose` 步骤 6.c）

## A. 需求与 scope 对齐（scope-medium / scope-large）

- **核心需求覆盖**：proposal 的"预期行为模型"是否回应了本 change 的原始需求？列出需求点 → 逐条在 proposal 找对应——缺对应 = 漏需求信号
- **scope creep**：是否有"预期行为模型"里描述的行为**原始需求没提**（agent 自作主张加的）？→ 每条多出来的行为须有"假设"字段背书；无背书 = scope creep 信号
- **scenario→test 账本完备性**（`applyRequires` 含 `specs` 时）：每个 `#### Scenario:` 都映射到具名测试？unmapped 项是否给了 `N/A` + 机械校验项或理由？——缺 = 不 apply-ready
- **假设字段滥用**："假设"字段是否把**该问用户的**（scope / security / privacy 级）当合理默认推定了？判据：合理默认只适用于数据保留 / 性能目标 / 错误处理 / 认证 / 集成模式等可按行业惯例推定的项；scope 级模糊点必须走澄清——写成假设 = 逃逸澄清信号

## B. 预期行为模型质量（scope-medium / scope-large）

"预期行为模型"与"整体性能预期变化"两字段按下述判据逐条判，不满足 = 信号（字段定义见 `td-propose` 步骤 6.c 四判据）：

- **可测量**：有具体数字（时间 / 百分比 / 计数 / 速率 / 状态转移）？反例"性能更好"；正例"100 条记录规模下 < 500ms"
- **技术无关**：从用户 / 系统外部视角描述，不提框架 / DB / 中间件？反例"API < 200ms"（实现视角）；正例"用户看到响应无需等待"
- **用户视角**：描述可观察行为 / 状态 / 结果，非内部指标？反例"缓存命中率 > 80%"；正例"10 分钟内重复访问 < 1s 响应"
- **可验证**：能写成"输入 X → 期望输出 Y"？反例"更稳定"；正例"24h 压测错误率 < 0.1%"
- **整体性能预期变化字段**：是否也满足可测量？纯结构调整是否按降级路径填"无行为变化，见 caller impact 分析节"？为凑判据生成伪量化字段 = 信号
- **可 archive 对照性**：这两字段能否承接 archive 的"实际 vs 预期"复盘？判据：archive 时能拿实际行为对照判"验证 / 未验证 / 需修模型"——写得太虚导致 archive 无法对照 = 信号

## C. 设计取舍与可逆性（scope-large）

判据对齐 `constraints` 的 `references/delay-decision.md`「区分两类决策」表：

- **不可逆决策标注**：删数据 / 改公共契约 / 换框架 / 丢兼容性——是否触发 `constraints` 的 `references/human-in-loop.md`？不可逆类必须停
- **"以后再改"审视**：design 写"先选 A 以后再改" → 真可逆吗？判据：改的成本（是否要迁移数据 / 改所有 caller / 破兼容）——成本高 = 实际不可逆 = 信号
- **偏离既有架构的合理性**："系统工程影响评估"里"与既有架构/风格的遵循关系"若写了偏离点 → 偏离理由是否成立？是否已让用户确认？——无理由或未确认 = 信号
- **矛盾承接描述**：若 explore 阶段有未决矛盾 → proposal 是否显式写了"需求权衡 + 设计侧处置（两全 / 取舍+理由 / 留待 archive）"？——缺 = 信号
- **tier-large 总体设计文档 3 字段**（`$_TD_TIER == tier-large` 时）：系统层次位置 / 与最近 archive change 的关系 / 是否触发跨分系统协调——是否都填了实质内容？——缺 = 不 apply-ready

## D. caller impact / 变更点完备性（scope-large）

四类变更点定义与边界裁定见 `td-apply/references/change-point-classes.md`（单一事实源）。本节逐类核对 proposal「caller impact 分析」节的标注是否完备：

- **① 公共符号签名**：参数列表 / sync-async / 异常契约有变？→ 标注了没？
- **② Protocol / 接口方法**：抽象方法签名或语义有变？→ 标注了没？
- **③ 装配点**：构造调用 / DI / bootstrap / bypass 有变？**含纯新增定义点**（无既有 caller 不豁免）？→ 标注了没？
- **④ 数据流 / 返回值语义**：返回值 shape / 字段含义 / 落库行为有变？→ 标注了没？
- **高危标记**：①③ 类是否都标"高危"？这是 propose 阶段的 go/no-go 决策点
- **已知 caller**：高危变更点是否列了 file:line + 预判结论（兼容 / 需适配 / 不消费）？——本项只查"确定已知的高危 caller 有没有漏列"；完整 caller 清单由 `td-apply` 步骤 4 实测兜底，不在 proposal 阶段要求全量
- **跨包同语义锚点**（③ 类特判）：同一语义在多分系统各自定义 → 是否列全定义点（file:line）+ 附一致性依据（同源传参 或 同锚一致性测试）？

## 分级与阻塞

分级与阻塞语义由 `requesting-code-review` skill 第 5 节持有：架构 review 按该节的 critical / warning / nit 判定，critical **阻塞 apply**，先回 propose 改 proposal 再继续——"不继续"即不进入任务实施。
