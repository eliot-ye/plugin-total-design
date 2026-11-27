# total-design v1.21.0 发布说明

> 面向使用态用户：本次为**机械闭合 + 逃生阀 + 终局闸门版**——把 spec↔task↔test 升级为三向机械闭合（🟢 不再只是"测试存在且通过"）、纯重构新增 `skip_specs` 逃生阀、`td-apply` 补 change 级完成终局闸门。skill 数量、命令数量、references、hooks、td-* 契约流、四平台加载均不变，**无行为破坏性变更**（新增的均是对"假绿 / 形式主义 / 假完成"的机械防线，不改变既有判据口径）。

## 本版本是什么

1.21.0 是 **1.20.1 之后的 minor 版**。上一次 1.20.1 做的是 review 深度换轴后的一致性收尾；本版本做三件主线 + 若干加固 + 一处收尾 review 隔离加固：

- **Fixed — `td-apply` 步骤 6.3 收尾 review 不得以 scope-small 豁免隔离**：change-scope 只降查的维度数、不降隔离要求（两者正交），自评即降级须标 `reviewed-by: unisolated-self`；步骤 6.5 终局闸门补机械可检项（Verdict 行 + reviewed-by 行齐全，subagent 须有逐字回传原文支撑）；`requesting-review` 合理化表补「scope-small 保底可自评」一行；`td-archive` 步骤 2 复核 reviewed-by 行，无原文支撑视同编造 Verdict、阻塞 archive。堵住"顶着 subagent 名头、实为作者自评"的三处结构性缺口。
- **Added — spec ↔ task ↔ test 三向机械闭合**：`scenario-test-map-template` 覆盖账本此前只证"每个 scenario 有个测试"（覆盖存在性），不证"测试断言真的承接了 scenario 承诺"。本版本把 🟢 的判据从"存在且通过"提到三判据——断言承接场景承诺 / 可证伪 / 落点为行为非文本；并加「实现 task」列 + 双向无孤儿规则（scenario 无 task 承载、task 实现了未登记的 scenario 均为 blocking defect）。`td-propose` 步骤 6.c、`td-apply` 步骤 2/4/6.1/6.3、`td-archive` 步骤 3、`writing-plans` 的 `task-template.md`、`requesting-review` 的 Spec compliance 全链同步。**tier-small 把 task 侧核对降级为提醒（不阻塞），scenario 侧闭合与断言强度仍强制**——重量收窄到该收的 change 上。
- **Added — 纯重构逃生阀 `skip_specs`**：纯重构 change（行为不变的代码 / 重命名 / 纯 tooling / 纯 docs）此前被迫产 spec delta，属形式主义。现借 OpenSpec 原生 `.openspec.yaml` 顶层 `skip_specs: true`（v1.7.0+）免产 spec delta；下游 4 处账本判据统一为"applyRequires 含 specs 且未被跳过"。含同名陷阱警告：`openspec archive --skip-specs` 是另一套 CLI 机制，勿混用。
- **Added — `td-apply` 步骤 6.5 change 级完成终局闸门**：声明 change done 前逐条打勾贴证据，收尾 review 报告文件缺失即机械可检为"未做"；补「禁止替代」（不得用任务内修 bug 冒充收尾 review）与「如实报告」（未做的步骤须写明原因）两条纪律。堵住"假完成"这个隐蔽缺陷。
- **Added — `test-driven-development` GREEN 前装配链触发校验**：新增「理想路径陷阱」——手工调内部函数造绿只证函数理想路径，未证生产代码会在正确时机调用它；GREEN 前须 grep 生产调用方，零调用方 = 装配断链。GREEN 步骤绑定项目测试命令判据（项目套件定义 green，而非只跑你的测试文件）。
- **Added — `td-propose` 步骤 6.a 既有能力面清点**：避免造出与既有 capability 撞名 / 撞职责的重复项（含 tier/profile 分层豁免）。
- **Added — `td-explore` 候选方向追加具体草图**：每个方向给示例输入 → 输出 / 行为片段 / 伪代码，让用户点选而非二次推导。
- **Added（开发态）— 可执行 skill 质量断言 `tests/`**：把"skill 内不得引用 agent 指令文件作规则来源 / 开发态编辑指令泄漏"和"单 SKILL.md ≤16000 字符"两条最易腐烂的纸面规则变成 `pnpm test` 可跑防线，带负向测试。**开发态工具，不进 `skills/`、不随 plugin 分发、使用态不可见。**

## 行为变更表（升级用户感知差异）

| 环节 | 变更 | 感知 |
|---|---|---|
| scenario→test 覆盖账本 | 升级为三向闭合（+「实现 task」列 + 断言强度三判据 + 双向无孤儿） | 🟢 不再只是"测试存在且通过"，须断言承接场景承诺；scope-medium/large change 的 propose 阶段账本负担上升，但堵住"覆盖存在而断言弱"的假绿 |
| `tasks.md` 必填字段 | 新增「覆盖 scenario」（task 侧锚点，与账本反向引用） | 每 task 须标明它实现/验证哪些 scenario（不承载时标 N/A + 理由）；tier-medium/large 强制，tier-small 提醒不阻塞 |
| 纯重构 change | 新增 `skip_specs: true` 逃生阀，免产 spec delta | 行为不变的纯重构 / 纯 tooling / 纯 docs 不再被迫产 spec delta；下游账本判据统一加"且未被跳过"条件 |
| change 完成声明 | `td-apply` 步骤 6.5 终局闸门 + 如实报告纪律 | 声明 done 前须逐条贴证据，收尾 review 报告缺失即机械可检为"未做"；不得用任务内修 bug 冒充收尾 review |
| 收尾 review 隔离 | change-scope 只降维度数、不降隔离要求；reviewed-by 行成机械可检项 | scope-small 不再成为"自评冒充 subagent review"的缝隙；自评降级须标 `reviewed-by: unisolated-self` |
| TDD GREEN 判据 | 新增「理想路径陷阱」+ 绑定项目套件 | 手工调内部函数造绿不算绿——须 grep 生产调用方确认装配链已接；green 由项目套件界定，不只跑你的测试文件 |
| 探索候选方向 | 每个方向给具体草图 | 用户可点选具体示例而非推导抽象标签，降低探索轮次 |
| 仓库自身（开发态） | `tests/` 可执行断言挂 `pnpm test` | 仅维护者可见；使用态无感知，`skills/` 分发内容不含 `tests/` |

## 升级步骤

1. 更新 plugin 到 v1.21.0（四平台安装方式不变，见 `docs/user/install.md`）。
2. 无需迁移数据——`.td-state/` 与 `openspec/` 格式不变。
3. 无破坏性变更，可直接升级。已在用的 change 不受影响；新 change 从本版本起适用三向闭合与 `skip_specs` 判据。

## 完整变更列表

见 [CHANGELOG.md](CHANGELOG.md) 的 `[1.21.0]` 条目。

---

# total-design v1.20.1 发布说明（历史）

> 面向使用态用户：本次为**一致性修复版**——`requesting-review` 的降级标注强调从 tier 改绑 change-scope，消除 review 深度换轴后残留的双轴失调；另含三项开发态泄漏清理与判据单一事实源收敛。skill 数量、命令数量、references、hooks、td-* 契约流、四平台加载均不变，**无行为破坏性变更**。

## 本版本是什么

1.20.1 是 **1.20.0 的一致性收尾版**（patch）。1.20.0 把 review 深度收口到 change-scope 轴，但 `requesting-review` 第 2 节还留了一句按 tier 调降级标注强调——造出"深度按 change-scope、标注按 tier"的双轴失调。本版本把它拉回同一轴，并清理 1.20.0 大改后遗留的开发态语句。做四件事：

- **Fixed — `requesting-review` 降级标注强调改绑 change-scope**：原第 2 节按 tier 分档——scope-large change 在 tier-small 项目里自评降级只给常规标注（漏掉强提示），scope-small 在 tier-large 项目里那行自检反被要求显著标注（强调配错风险）。现改为 `scope-large` 自评降级须显著标注「置信度低于有隔离版本」、`scope-medium` / `scope-small` 常规标注；checkpoint review 是任务粒度、不持 change-scope 轴，降级一律常规标注。review 深度与降级标注回到同一收口轴。
- **Fixed — change-scope 判据单一事实源收敛**：`requesting-review` 第 5 节持查节映射、`td-propose` 步骤 7 持判据，两处口径统一，消除重复定义的潜在漂移；tier-large 相关字段表述与 `field-assessment` 表 1 强度矩阵对齐。
- **Fixed — 清除运行时资产中的开发态语句**：`SKILL.md` / `references/` 里面向仓库编辑者而非使用态 LLM 的语句（编辑指令、调用方清单、写作规范）逐条删除，保留冲突仲裁句与运行时指针。
- **Fixed — 删除 constraint references 顶部结构自述**：`constraints` 的 5 份局部规律 references 顶部「本文件是 X 的 references 变体」自述属开发态描述，已删——使用态 LLM 读取时只占上下文、不服务执行决策。

## 行为变更表（升级用户感知差异）

| 环节 | 变更 | 感知 |
|---|---|---|
| review 自评降级标注 | 强调分档由 change-scope 决定（`scope-large` 显著标注 / `scope-medium`·`scope-small` 常规），不再按 tier | scope-large change 在小项目里自评降级也会拿到「置信度低」强提示（此前被 tier-small 漏掉）；scope-small 在大项目里不再被误要求显著标注 |
| `constraints` references | 删除顶部结构自述 blockquote | 使用态 LLM 读取 5 份局部规律时少一段占上下文的仓库维护描述；规则内容不变 |
| 运行时资产开发态语句 | `SKILL.md` / `references/` 清除编辑指令、调用方清单、写作规范 | 使用态 LLM 不再被仓库维护约定干扰；冲突仲裁句与运行时指针保留 |

## 升级步骤

1. 更新 plugin 到 v1.20.1（四平台安装方式不变，见 `docs/user/install.md`）。
2. 无需迁移数据——`.td-state/` 与 `openspec/` 格式不变。
3. 无破坏性变更，可直接升级。

## 完整变更列表

见 [CHANGELOG.md](CHANGELOG.md) 的 `[1.20.1]` 条目。

---

# total-design v1.20.0 发布说明（历史）

> 面向使用态用户：本次为**纪律 gate 加固 + 方案 review 换轴 + 一处 skill 更名版**——新增 YAGNI 阶梯局部规律（`constraints` 第 6 份）、review 深度改由 change-scope 轴决定（与 tier 正交，堵住"大 change 进小系统只获轻量 review"的缺口）、行为层 `requesting-code-review` 更名 `requesting-review`（slash 手势 `/requesting-review`，**旧手势失效**）。命令数量、hook、td-* 契约流、四平台加载均不变。

## 本版本是什么

1.20.0 是 **方案 review 换轴 + 纪律 gate 加固 + skill 更名版**。上一次版本 1.19.0 改了 td-propose 触发器判据与用户呈现纪律；本版本做四件事：

- **Added — `constraints` 新增第 6 份局部规律 `yagni-ladder`（YAGNI 阶梯）**：六级决策阶梯（从"需要存在吗"到"最小实现"，命中即停）+ never-cut 负向清单（信任边界校验 / 防数据丢失 / 安全 / 可访问性 / 用户显式要求——永不裁剪）+ `shortcut:` 捷径标注。信号驱动触发——只在准备装新依赖、新建 helper·组件·抽象、写出超出验证字段所需能力、用户说别过度设计时查，普通实施不逐次过。
- **Added + Changed — 方案 review 深度改由 change-scope 轴决定，与 tier 正交**：tier 管项目级 constraint 强度，change-scope 管 change 级 review 深度。checklist 从架构单视角扩展为完整 proposal 审查（新增 A 需求对齐 / B 预期行为模型 / C 取舍可逆性 / D caller impact 四块）。堵住一个真实缺口：跨 3 分系统、触碰公共符号签名的大 change，落在一个 tier-small 项目里，此前只获得轻量 review，完备性与 caller impact 检查全被跳过。
- **Changed — 行为层 skill `requesting-code-review` 更名 `requesting-review`**：旧名"code"只覆盖第 6 节 change 级收尾 review，与第 5 节方案 review（审 proposal 文档而非代码）名实不符。slash 手势变为 `/requesting-review`；逻辑名引用、依赖图谱、DSH README 同步，`index.mjs` 无需改动（DSH 按目录扫描注册）。
- **Fixed — 四处纪律 gate 补「常见合理化」表 + 复现隔离绑定**：`td-apply` 绑定 `systematic-debugging`（测试失败先复现→隔离→定位根因，不隔离不上报）、Guardrails 加"任务内缺陷直修"；`executing-plans` / `requesting-review` / `verification-before-completion` 各补合理化反驳表；验证削减必须 `Ruling:` 记账并上报，不得静默砍成最小子集。

## 行为变更表（升级用户感知差异）

| 环节 | 变更 | 感知 |
|---|---|---|
| review skill 手势 | `requesting-code-review` → `requesting-review` | **直接敲旧手势的用户需改用 `/requesting-review`**（`/requesting-code-review` 不再注册）；agent 触发自动适配 |
| 方案 review 深度轴 | 深度由 change-scope（scope-small/medium/large）决定，与 tier 正交 | 跨分系统 / 命中变更点的大 change 在小项目里也会走全量 review（此前被 tier-small 跳过）；scope-small 降为 `td-propose` 步骤 7 一行自检 |
| caller impact 完备性 | 命中触发条件即必填分析节，不再前置 tier 判断 | tier-small 项目里的大 change 也会要求 caller impact 分析节，否则不算 apply-ready |
| change 级收尾 review | 深度按 scope 档位（scope-small 保底抽查，medium/large 按 `风险` 最高档） | 收尾 review 深度与 proposal review 同轴，大 change 收尾不再只保底抽查 |
| 实施中测试失败 | 失败原因不明先触发 `systematic-debugging` 复现→隔离→定位 | 失败不再"顺手一修"——隔离定位前不得修不得报；任务内缺陷直修不问用户 |
| 验证范围削减 | 必须留 `Ruling:` 记账并走必停通道上报 | 上下文压力大时不得静默把验证砍成子集——削减属范围变更，需用户裁决 |
| 完成声明 | 新增「红灯自行豁免」「park 掉自我怀疑」两条硬约束 | 见红灯不得用"我没碰那文件 / pre-existing"自行洗白；对"是否与我有关"的疑虑本身即红灯 |
| 过度工程 | 新增 `yagni-ladder` 信号触发 + `shortcut:` 标注 | 装新依赖 / 新建抽象前过六级阶梯，走了重路留 `shortcut:` 标注；never-cut 清单能力不走降级 |
| 小项目轻量改动 | README + `td-apply`/`td-init` 暴露轻量通道 | `tier-small` / `profile-maintenance` 时一次性脚本、原型、改配置不必走三步（机制已存在，补入口暴露） |

## 升级步骤

1. 更新 plugin 到 v1.20.0（四平台安装方式不变，见 `docs/user/install.md`）。
2. 无需迁移数据——`.td-state/` 与 `openspec/` 格式不变。
3. **手势更名**：若你或你的团队曾直接用 `/requesting-code-review` 手势调用 review，改用 `/requesting-review`；agent 自动触发不受影响。
4. 其余无破坏性变更，可直接升级。

## 完整变更列表

见 [CHANGELOG.md](CHANGELOG.md) 的 `[1.20.0]` 条目。

---

# total-design v1.19.0 发布说明（历史）

> 面向使用态用户：本次为**修复 + 内部打包重构 + 用户呈现纪律版**——`td-propose` 的全局约束核对从「无条件必做」降级为「仅当触及系统级接缝时触发」并改写为通用触发器判据（消除开发态泄漏与 SKILL 禁引用 AGENTS.md 硬违规），`system-engineering` 新增用户呈现纪律（序号标记不得只给序号而无内容），DSH 包装层目录迁移至 `extensions/dsh/`（用户无感知）。skill 数量、命令数量、references、hooks、td-* 契约流、四平台加载均不变。

## 本版本是什么

1.19.0 是 **td-propose 触发器判据修正 + 用户呈现纪律 + 打包布局整理版**。上一次版本 1.18.0 加固 code review 可信度与 todo.md 协作模型；本版本做三件事：

- **Fixed — `td-propose` 全局约束核对改写为通用触发器判据**：原步骤 6.a「全局约束核对」写死四类 app 私有约束（CSP 内联脚本 / `collectI18nBindings` 装配 / 包 spec 守护 / llm-core 依赖分层）且无条件必做。改为现场判读的通用约束面——**约束面由现场从当前项目的 baseline spec 与既有守护机制识别**（典型面：安全策略、装配/接线、包边界守护、依赖方向；哪些面真实存在、由什么机制背书，以本项目为准），非固定清单。触发条件降级为**仅当本 change 触及系统级接缝时触发**（跨边界注入、装配接线、包间依赖），对齐按需触发风格。同步删除 app 实现锚点与根 AGENTS.md 引用——消除开发态泄漏与 SKILL 禁引用 AGENTS.md 硬违规。
- **Changed — 用户呈现纪律（序号标记须带内容）**：`system-engineering` 新增「用户呈现纪律」节——向用户呈现说明文本、问题、change 提案时，凡出现序号标记（`表 1/2/3`、`步骤 N`、`第 N 类`、`a1/b1` 等）必须满足「定义已在上下文 / 内联内容 / 文字重述」其一；`constraints/references/human-in-loop.md` 收紧「需用户回复的条目标号规则」（标签必须带内容）；`td-explore` 步骤 6 补运行时指针。
- **Changed — DSH 包装层目录迁移至 `extensions/dsh/`**（内部打包重构，用户无感知）：`dsh/{index.mjs, cordis.patch.yml, README.md}` 移至 `extensions/dsh/`，内容零改动；同步 `package.json` 的 `dsh.bundle.patch` 路径、修复 `SKILLS_ROOT` 解析路径、更新 11 处文档引用。四平台安装方式不变。

## 行为变更表（升级用户感知差异）

| 环节 | 变更 | 感知 |
|---|---|---|
| `td-propose` 全局约束核对 | 从「无条件必做」降级为「仅当触及系统级接缝时触发」，约束面改为现场判读 | propose 时不再强制检查固定四类 app 约束；触及跨边界注入 / 装配接线 / 包间依赖时仍核对接缝放行 |
| 用户呈现纪律（序号标记） | 新增约束：序号标记必须「定义在上下文 / 内联内容 / 文字重述」其一 | agent 不再只给 `表 1` / `步骤 N` / `a1` 而无内容；用户回复标签时条目内容保证在可见上下文 |
| DSH 包装层目录 | `dsh/` → `extensions/dsh/` | 无用户感知（四平台安装方式不变） |

## 升级步骤

1. 更新 plugin 到 v1.19.0（四平台安装方式不变，见 `docs/user/install.md`）。
2. 无需迁移数据——`.td-state/` 与 `openspec/` 格式不变。
3. 无破坏性变更，可直接升级。

## 完整变更列表

见 [CHANGELOG.md](CHANGELOG.md) 的 `[1.19.0]` 条目。

---

# total-design v1.18.0 发布说明（历史）

> 面向使用态用户：本次为**修复 + 行为变更版**——code review 新增 `PENDING_RESULT` 锚点态与防编造 gate（杜绝 subagent 结论未回传时的编造），`todo.md` 改为本地 backlog 不纳入版本库。skill 数量、命令数量、references、hooks、td-* 契约流、四平台加载均不变。

## 本版本是什么

1.18.0 是 **review 可信度加固 + todo.md 协作模型修正版**。上一次版本 1.17.0 修复 td 工作流 6 处缺口；本版本围绕 code review 的真实可信度与 todo.md 的协作模型做三件事：

- **Added — `requesting-code-review` 新增 `PENDING_RESULT` Verdict 锚点态**：subagent 派发后其报告**尚未回传**到作者上下文时，唯一合法锚点为第四态 `PENDING_RESULT`（前三态 `APPROVED` / `APPROVED_WITH_CHANGES` / `MUST_FIX_CRITICAL` 不变）。下游（`td-apply` 步骤 6.3、`td-archive` 步骤 2）读 `PENDING_RESULT` 视为「review 未完成、不得进入实施」，等同阻塞。补齐「委派已发起」与「结论已到手」是两个独立事件——此前锚点只有三态，无法表达"结果在路上"。
- **Fixed — subagent review 防编造 gate**：写 `reviewed-by: subagent` 前必须逐字收到报告原文；结果未回传时段落如实写"委派已发起、结果未回传、结论待补"并等回传，不得用「派发了 review」冒充「已收到结论」。违反等同编造 Verdict——会向下游传递伪造结论、掩盖真问题（真实 subagent 可能判 critical 而被编造的 `APPROVED` 掩盖）。
- **Changed — `todo.md` 从「必须提交」改为「本地 backlog 不纳入版本库」**：`/td-init` 把 `todo.md` 写进 `openspec/.gitignore`，跨机器 / 跨人不通过 git 同步，各人待办池独立，消除 git 冲突面。三处同步（`todo-pool` / `td-init` / `docs/user/usage.md`）。

## 行为变更表（升级用户感知差异）

| 环节 | 变更 | 感知 |
|---|---|---|
| `requesting-code-review` Verdict 锚点 | 新增第四态 `PENDING_RESULT` | subagent 结果未回传时报告带 `PENDING_RESULT`，下游阻塞直至拿到真实结论或转自评 |
| `requesting-code-review` 隔离载体 | 补防编造 gate | 不得凭推测填归属 subagent 的结论；未回传必须标注"结论待补" |
| `todo.md` git 策略 | 从「必须提交」改为「本地不纳入版本库」 | `openspec/todo.md` 进 `.gitignore`，各人待办池独立，不再有 git 冲突面 |
| `/td-init` | 把 `todo.md` 写进 `openspec/.gitignore` | 新建项目 todo.md 天然不入库 |

## 升级步骤

1. 更新 plugin 到 v1.18.0（四平台安装方式不变，见 `docs/user/install.md`）。
2. 无需迁移数据——`.td-state/` 与 `openspec/` 格式不变。
3. **既有项目的 `todo.md` 若已被 git 跟踪**：本版本只改 `/td-init` 的写入逻辑，已 tracked 的文件不会自动 untrack。如需对齐新模型，手动 `git rm --cached openspec/todo.md` 并加进 `openspec/.gitignore`；不加也仍可用（只是继续走 git 同步）。

## 完整变更列表

见 [CHANGELOG.md](CHANGELOG.md) 的 `[1.18.0]` 条目。

---

# total-design v1.17.0 发布说明（历史）

> 面向使用态用户：本次为**修复版**，基于 td 工作流审核修复 6 处流程缺口——归档门禁收紧（change 级收尾 review 判 critical 时阻塞 archive）、review 报告落盘（跨会话 Verdict 不丢失）、消除 current-change audit 粒度矛盾、补估时字段。skill 数量、命令数量、references、hooks、td-* 契约流、四平台加载均不变。

1.17.0 是 **td 工作流审核修复版**。上一次版本 1.16.0 新增 DSH 第四平台支持；本版本基于对 td 工作流（explore → propose → apply → archive 主干）的审核，修复 6 处流程缺口：

- **Fixed — `td-apply` 6.4 tier-medium 粒度矛盾**：current-change audit 的 tier-medium 行改述为"由 `executing-plans` 步骤 1 承载，不在本步骤重复触发"——此前"6.1–6.3 都通过后"的完成判定阶段却声明"每个关键链任务完成时"的实施中粒度，构成矛盾。
- **Fixed — `requesting-code-review` 补 review 报告落盘规定**：第 3 节新增「报告落盘」——change 级收尾 review 落盘到 `openspec/changes/<name>/reviews/`、架构 review → `proposal.md` 末尾、checkpoint review → `tasks.md` 验证证据附注。下游读落盘文件而非会话记忆，跨会话后 Verdict 不丢失。
- **Changed — `td-archive` 步骤 2 归档门禁收紧**：新增 change 级收尾 review Verdict 检查——`MUST_FIX_CRITICAL` 或无 review 报告 → 阻塞 archive（此前可绕过 6.3 的 critical 判定直接归档）。升级感知：归档前若 6.3 判出 critical 或未做收尾 review，将被拦截，需先修复或补做。
- **Fixed — `td-propose` 步骤 7 tier-small 架构自检落点明确**："跳过架构 review：无实质新架构决策"记录到 `proposal.md` 影响评估节末尾，供 `td-apply` 步骤 4 复核读取。
- **Fixed — `executing-plans` 步骤 1 >2x 估时引用估时字段**：消除对未定义字段的依赖。
- **Added — `writing-plans/references/task-template.md` 新增可选 `估时` 字段**：作为 `executing-plans` >2x 判定的单一事实源；省略时该判定降级为"明显超出同类任务预期"，不构成硬触发。

见 [CHANGELOG.md](CHANGELOG.md) 的 `[1.17.0]` 条目。
