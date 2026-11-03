# 架构与设计原则

> **读者**：维护者——要理解"为什么这样设计"、改动前需要评估影响范围的人。
> **读完应能**：说清三层结构、画出 skill 依赖图、按五节评估一个设计改动。

## 三层结构

约束层 / 行为层 / 契约层自上而下：

- **约束层（constraints）** —— 钱学森系统工程主基调 + Brooks / Goldratt / 精益局部规律；每个局部动作从整体性能反推，局部优化不能制造全局失调。
- **行为层（skills）** —— Superpowers 转译的 explore → plan → TDD → review → verify 强制流程；触发式，不靠人盯。
- **契约层（commands）** —— OpenSpec 转译的 propose → apply → archive artifact 流；agree before you build。

约束层是第零层，是另外两层立起来的前提。`constraints` skill 承载 5 份局部规律 references（`wip-limit` / `critical-buffer` / `brooks-law` / `delay-decision` / `human-in-loop`），每份必须显式声明它服务 `system-engineering` 主基调的哪一条。

## 依赖图谱

18 个 skill 之间有真实调用关系（SKILL.md 引用另一个 skill 的逻辑名 = 运行时调用）。当前邻接表（`引用者 → 被引用者`）：

```
system-engineering → constraints, field-assessment, executing-plans, td-explore,
                     td-system-audit, verification-before-completion, systematic-debugging
td-explore → td-propose, td-archive, todo-pool, constraints, field-assessment, system-engineering
td-propose → td-apply, td-archive, td-reverse-spec, todo-pool, writing-plans,
             requesting-code-review, constraints, field-assessment, system-engineering, td-explore
td-apply   → 11 个下游（constraints, executing-plans, field-assessment, requesting-code-review,
             system-engineering, systematic-debugging, td-propose, td-system-audit,
             test-driven-development, verification-before-completion, writing-plans）
td-archive → constraints, field-assessment, system-engineering, td-propose, td-system-audit,
             todo-pool, verification-before-completion
td-reverse-spec → field-assessment, requesting-code-review, system-engineering,
                  td-propose, td-system-audit
td-system-audit → constraints, field-assessment, system-engineering, td-apply, td-archive,
                  td-propose, td-reverse-spec, todo-pool
requesting-code-review → constraints, executing-plans, td-apply, td-propose,
                         verification-before-completion, writing-plans
test-driven-development → constraints, field-assessment, system-engineering,
                          systematic-debugging, td-apply, writing-plans
executing-plans → constraints, field-assessment, requesting-code-review,
                  systematic-debugging, td-apply, td-system-audit
systematic-debugging → constraints, executing-plans, td-apply
verification-before-completion → constraints, requesting-code-review,
                                 systematic-debugging, td-apply
writing-plans → constraints, field-assessment, td-apply, td-propose, td-reverse-spec
todo-pool → constraints, td-archive, td-propose
field-assessment → constraints, td-archive, td-system-audit
constraints → field-assessment, system-engineering
agents-md-hygiene → td-propose
```

**热点节点**：`field-assessment`（入边最多，blast radius 最大）；其次是 `system-engineering` / `constraints` / `td-apply` / `td-propose`。

改动前必须按 [AGENTS.md](../../AGENTS.md)「依赖图谱与分析」六步重新计算图谱（上面这份是快照，一定会漂移）。

## 设计原则

### 1. 钱学森系统工程主基调是第零层

所有 constraint 都在系统工程框架下生效。每条局部规律（Brooks / Goldratt / 精益）都要显式声明它服务主基调的哪一条。

### 2. profile × tier 二维配置

- **profile**（仓库状态）：greenfield / brownfield / maintenance
- **tier**（系统复杂度）：small / medium / large

两个维度以 `field-assessment` 的 `references/` 变体文件形态存在（3 profile + 3 tier），agent 现场判读后按需读取命中的 profile 一份 + tier 一份（共 2 份）。

**冲突优先级**：profile 与 tier 强度冲突时**以 tier 为准**——tier 决定约束强度与流程重量（"不强求重流程"这类松绑优先），profile 只决定流程侧重（入口动作、TDD 边界、special rules），不改变强度。profile 的"默认激活的层"是默认值，最终强度以 `field-assessment` 表 1/表 2/表 3 为单一事实源。

### 3. 触发式而非 hook 强制

Superpowers 的"触发式"哲学保留：skill 靠 agent 根据上下文判读触发，不靠 hook 强制。

**例外——状态持久化 hook**：`hooks/td_state_sync.js` 是唯一允许的 hook（`SessionEnd` 事件）。它不做流程强制，只在会话结束时从文件系统事实校正 `.td-state/` 状态文件（`archive-counter.yaml` 按 `archive/` 目录重算、`audit-history.yaml` 补缺失报告记录）——这是"防 agent 漏写状态"的兜底，不是流程门禁。

实现用 Node（CJS + `node:` 内置模块，零依赖、零构建），与 OpenSpec CLI 的 Node 运行时一致。hook 脚本新增或改写前，必须先在临时 fixture 上对照旧实现逐字节比对产出（状态文件是持久数据，等价性不能靠读代码判断）。

各平台的 hook 支持差异见 [platforms.md](../maintainer/platforms.md#总表)。

### 4. 不原样照搬 Superpowers / 不重新实现 OpenSpec CLI

转译而非搬运：Superpowers 的方法论内核保留但去掉其 plugin / marketplace 引用；OpenSpec 的方法论转译为 slash command，CLI 功能仍调用外部 `openspec` 命令，不在命令文件里重实现。

### 5. 设计变更评估维度

**任何新增能力 / skill / 命令 / 流程分支的设计讨论，在拍板执行前必须产出「重量 / 价值 / 代价」三维度评估。** 这是「依赖图谱与分析」之后的第二道前置门：图谱回答"改动会波及谁"，本节回答"改动的重量与净收益是否匹配"。

#### 重量（量化，禁止定性）

| 维度 | 测量方式 |
|---|---|
| token 消耗 | `wc -m` 实测必读文件字符数 × tokenizer 系数（系数是假设，须标注） |
| LLM 调用次数 | 数"必须独立成轮"的环节 |
| 计算密度 | 每轮输入/输出规模（高密度轮 ≠ 低密度轮） |
| 生成 token 量 | 数"必须产出文本"的环节（wall-clock 主因） |
| 墙钟时间 | 由生成量换算，无实测基准标"估算" |

token 消耗、调用次数、时间三者方向常不一致，必须分开报。

#### 价值（按场景分解，禁止聚合值）

先回答**价值来源判据**："不做这项，agent 在真实编程项目里会犯什么可复现的错？"——答得出具体错误 = 工程导向价值；只有"社区其他 schema 都有" = 生态对齐价值，须降档，且单独不构成"做"的依据。逐项标注，防止哲学漂移（判据问句："引入这项后，'这是谁的思路'是否仍唯一？"）。

#### 代价（分级）

- **维护成本**：新增逻辑落在几个文件 / 几个位置，是否分散了本应集中的判定
- **失败路径成本**：判错时用户付什么代价，是否可恢复
- **使用态认知成本**：新增多少判定环节与失效回路（本 plugin 无测试框架、无 CI，全靠使用态 LLM 现场理解）

#### 风险不对称性

必须回答两个方向的判错代价是否对称、是否有界可恢复。安全性不来自"防线都对"，而来自判错代价有界；任一方向不可恢复（污染唯一数据源、破坏审计链），该省略一律否决。

#### 产出格式

五节结构：重量（量化表）/ 价值（分场景表）/ 代价（分级表）/ 风险不对称性（判定）/ 结论（做 / 不做 / 缩窄范围做 三选一）。

## 相关

- 审核流程与四维清单：[review-standard.md](review-standard.md)
- 平台差异与 manifest：[platforms.md](../maintainer/platforms.md) / [manifests.md](../maintainer/manifests.md)
