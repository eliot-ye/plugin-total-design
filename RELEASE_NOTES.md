# total-design v1.10.0 发布说明

> 面向使用态用户：升级前请先读「⚠️ 行为变更」与「升级步骤」。

## 本版本是什么

1.10.0 是 **精简加固版**：token 成本下降 + 一批流程加固 + 结构收敛。

- **Token 优化**：指令侧冗余精简（21 文件 -83 行）、高频预加载段收敛（主基调四条展开、归位段、executing-plans body）——每次 propose+apply+archive 生命周期省约 700-900 token。
- **结构收敛**：brainstorming 内联进 `td-explore`，skill 数 18 → 17（无功能损失，显式调用入口消失）。
- **流程加固**：TDD 变异自检（测试可证伪性）、apply 设计回写（artifact 与代码现实冲突的执行序列）、td-archive CLI 加持（契约对照与归档完整性有命令背书）、td-explore 先查仓库再提问。

## 本次变更

### brainstorming 内联进 td-explore（skill 数 18 → 17）

提问提炼方法论成为 `td-explore` 的内建流程，探索质量不降；`/total-design:brainstorming` 显式调用入口消失，需求不清场景由 `/td-explore` 承接（其触发词已含"优先路由到这里"语义）。AGENTS.md / README / 各 SKILL.md 引用全部同步，运行时资产零残留。

### TDD 变异自检（test-driven-development）

high 风险测试全绿后做一次变异自检——临时翻转一处核心断言对应的产线逻辑（改返回值 / 破坏边界），确认测试集转红，然后还原；不转红 = 该断言什么都没保护，回测试设计步骤重写。medium / low 不做（成本收益不成立）。

### 设计回写（td-apply 步骤 5）

实施途中发现 design / spec / proposal 与代码现实冲突（前提假设不成立、方案行不通、spec 漏场景）→ 全局必停，不允许绕过 artifact 继续写。执行序列：停下 → `human-in-loop` 让用户拍板（回写 artifact / 改代码迁就，后者仅限实现细节冲突）→ 回写则更新 artifact 并在 tasks.md 记录 → 受影响任务的既有验证证据作废、重跑全绿后才继续。

### td-archive CLI 加持

- 步骤 3 契约对照：对照源 2 存在时用 `openspec show "<name>" --diff`（OpenSpec CLI ≥ v1.11）取本 change 对主 spec 的真实变更行，只审 diff 命中行是否触碰 baseline 契约 / 不变量。
- 步骤 4 归档完整性自证：sync 后跑 `openspec validate --archived`（≥ v1.9），由 CLI 校验归档 change 的 tasks.md 全部 `[x]`。
- 两个 flag 均带版本降级：CLI 版本不够 → 自动退回原流程（通读 delta 逐场景对照 / 步骤 2 前置检查单独承担），不阻塞 archive。

### td-explore「先查仓库再提问」

事实类问题（"现在 X 是怎么做的""有没有 Y 配置"）先在仓库自查（代码 / `openspec/specs/` / config / README），已有事实不问用户；确需提问时附基于现场证据的推荐默认值（"建议走 A，依据是 <信号>，可以吗"），不出裸问题；仓库证据与用户认知冲突时摆证据让用户裁决。

### 其他

- **wip-limit「常见合理化」对照表**：4 类 agent 自我说服（"就超一个""change 互不相关""先 override 回头立刻 archive""合并几个 change 一起过"）逐条给出现实反驳。
- **td-archive 步骤 3 复盘深度按 tier 分层**：tier-small 只对照 2 字段（实际影响分系统 + 预期行为模型验证），medium / large 保持 5 字段。
- **td-apply Guardrails 并行例外**：tasks.md 显式标注并行的任务不受「按顺序」约束。
- **行为层补齐**：writing-plans / test-driven-development / requesting-code-review / systematic-debugging 4 个 skill 补精简版「服务的主基调原则」节。
- **AGENTS.md**（仓库元文档，非运行时资产）：审核维度 3 新增「仪式性内容」检查线——方法论文本须绑定执行动作。

## ⚠️ 行为变更

| 变更 | 1.9.0 旧行为 | 1.10.0 新行为 |
|---|---|---|
| brainstorming 入口 | 独立 skill（18 个），可 `/total-design:brainstorming` 显式调用 | **内联进 td-explore**（17 个），显式入口消失；需求不清 → `/td-explore` |
| apply 中 artifact 与代码冲突 | Guardrails 仅一句"停下来问用户"，无执行序列 | **步骤 5「设计回写」完整序列**：必停 → 用户拍板 → 回写并记录 → 受影响验证重跑 |
| high 风险测试 | 全绿即通过，无可证伪性检查 | **变异自检**：翻转断言确认测试转红，不转红重写 |
| 契约对照（td-archive 步骤 3） | 通读 delta 全文逐场景对照 | CLI ≥ v1.11 用 `--diff` 只审真实变更行；低版本自动降级，不阻塞 |
| 归档完整性 | 步骤 2 前置检查人工承担 | CLI ≥ v1.9 加 `validate --archived` 命令自证；低版本跳过，不阻塞 |
| archive 复盘深度 | 三个 tier 均 5 字段对照 | tier-small 只对照 2 字段；medium / large 不变 |
| 上下文成本 | — | 每次 propose+apply+archive 生命周期省约 700-900 token |

**不改变的**：8 个命令文件、td-* artifact 流（propose → apply → archive）、表 1/2/3 强度数值（`field-assessment` 单一事实源）、WIP 硬约束 + override 机制、5 个子约束执行规则、`requesting-code-review` 第 1–6 节、hook 脚本与触发时机、`.td-state/` 持久化约定、四处 manifest 的 name / description / author——均不变。

## 升级步骤

1. **bump 版本**：四处清单的 `version` 已同步改为 `1.10.0`（根目录 `plugin.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / `package.json`，description 保持纯 ASCII 且四处完全一致）。
2. **运行时前置**：不变——Node.js ≥20.19.0（OpenSpec CLI 与 SessionEnd hook 共用）；OpenSpec CLI：`npm install -g @fission-ai/openspec@latest`。建议升到 ≥ v1.11 以获得 td-archive 契约对照的 `--diff` 加持（≥ v1.9 获得 `validate --archived`；更低版本自动降级，不阻塞流程）。
3. **重新安装**（按平台）：
   - atomcode：`/plugin marketplace add <this-repo-url>` → `/plugin install total-design`
   - Claude Code：`claude plugin marketplace add <this-repo-url>` → `claude plugin install total-design`（或 `claude --plugin-dir <this-repo-path>`）
   - Pi Agent：`pi install git:<this-repo-url>`
4. **重新 trust**：本次 hook 命令串未变更（哈希不变），已 trust 的安装无需重新 trust；全新安装按平台执行 `atomcode plugin trust total-design`。
5. **验证**：
   - 四处清单版本号同为 1.10.0，description 四处逐字一致。
   - skill 数与结构：`ls -d skills/*/ | wc -l` 输出 `17`；`ls skills/brainstorming` 无输出。
   - brainstorming 零残留：`grep -rn brainstorming skills/ commands/` 无输出。
   - 加固节存在：`grep -n "变异自检" skills/test-driven-development/SKILL.md`、`grep -n "设计回写" skills/td-apply/SKILL.md`、`grep -n "先查仓库再提问" skills/td-explore/SKILL.md`、`grep -n "常见合理化" skills/constraints/references/wip-limit.md` 均有输出。
   - CLI 加持节存在：`grep -n "openspec show" skills/td-archive/SKILL.md`、`grep -n "validate --archived" skills/td-archive/SKILL.md` 均有输出。
   - 逻辑名/命令名/路径/CLI 命令/环境变量不变：`field-assessment` / `/td-explore` / `openspec list` / `$_TD_TIER` 等。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.10.0] 条目。
