# total-design v1.12.1 发布说明

> 面向使用态用户：升级前请先读「⚠️ 行为变更」与「升级步骤」。

## 本版本是什么

1.12.1 是 **修复 + 收敛版**：4 类修复（td-reverse-spec 锚点断链、profile-maintenance 模板漏必填字段、5 处开发态调用方清单泄漏、协议格式分叉与流程约定缺口）+ 2 处加固（td-propose 三处填法约束、4 个 td-* SKILL.md 仪式性归位段清理）。td-* 契约流（propose → apply → archive）结构不变，表 1/2/3 强度数值不动，skill / command 数量不变（18 skill + 8 command）。

## 本次修复

### td-reverse-spec 「入口契约」锚点断链

原「入口契约」形态是加粗强调句（非标题节），`td-system-audit` 步骤 6 的映射表按节名「入口契约」检索时无法定位；改为 `## 入口契约` 标题节，明确列出第一入口（首次建立 baseline）与第二入口（漂移定向刷新）两条契约。

### profile-maintenance 轻量 proposal 模板漏必填字段

`field-assessment/references/profile-maintenance.md` 特殊规则 4 的「轻量 proposal」模板列 5 项字段，比 `td-propose` 步骤 6.c 的必填节少「与既有架构/风格的遵循关系」第 6 项；补上第 6 项并同步说明文字（5 项 → 6 项）。此前使用态 LLM 按 profile-maintenance 模板填写 maintenance 项目的轻量 proposal 时，会漏填第 6 项字段——`requesting-code-review` 第 1 节「Code consistency」维度（"偏离既有风格但 proposal 未写明 → warning"）失去数据源。

### 开发态调用方清单泄漏进 references

5 处「触发方：X 步骤 Y」括注按 AGENTS.md「SKILL 与 references 禁止开发态语句」判据清理——这类清单形态是「依赖图文档」，使用态 LLM 是被某个调用方指引来的、知道还有谁引用不改变其执行决策，且清单必然随结构演化腐烂：

- `todo-pool` 两处触发方 → 改为「入口契约」执行条件（保留"用户同意 → 执行 / 拒绝 → 跳过"的执行前提，删除调用方身份清单）
- `audit-frequency.md` 表头段与末尾段 → 删除 `td-archive 步骤 5.2 / executing-plans 步骤 1 / td-apply 步骤 6.4` 调用方清单，改为功能性表述
- `constraints/references/wip-limit.md` 与 `human-in-loop.md` → 「（触发方：td-system-audit 步骤 6）」括注删除（触发场景本身保留）

按风险不对称性判据保留 `audit-frequency.md` 表 3 tier-medium 行的 `executing-plans 步骤 1` 触发 skill 列——删除会造成 tier-medium current-change audit 触发归属死链（不可恢复），保留可恢复。

### 协议格式分叉与流程约定缺口

- `audit-history-template.md`：timestamp 必须带时区偏移、report 路径必须带 `audits/` 前缀、追加前判重
- `hooks/td_state_sync.js`：hook 补记格式对齐模板约定（本地时间补时区后缀 + `audits/` 前缀），fixture 双环境比对验证产出等价
- `td-archive` 步骤 3：复盘节落点统一为 `proposal.md`，消除 tasks.md/proposal 分叉
- `td-propose/references/scenario-test-map-template.md`：账本产出加两项机械校验（测试文件路径存在性 + scenario 名称与 spec 逐字一致）
- `td-apply/references/change-point-classes.md`：caller 实测锚核对补双类断言约定（`contains` 子串锚 + `toBe` 精确锚，任一缺漏均漏检）
- `requesting-code-review`：LLM 兜底 review 加逐 finding 复验要求（对照代码实证后进报告，实施者自审场景下记忆性误报率最高）

## 本次加固

### td-propose 三处 spec 填写约束

借鉴 Spec Kit 的 specify / checklist 模板可判定判据，给 `td-propose` SKILL.md 三处内容规范加固——全部为「填法约束」，不新增必填项集合、不改字段定义、不新增 apply-ready 判据、不新增 artifact / 命令 / 依赖：

- **步骤 3 human-in-loop 触发项下**：新增澄清量化约束（≤3 问 + 优先级 scope > security/privacy > UX > 技术细节 + 5 类合理默认不追问 + 4 条跳过条件）
- **步骤 6.c「系统工程影响评估」字段列表后**：新增「预期行为模型」与「整体性能预期变化」四判据（可测量 / 技术无关 / 用户视角 / 可验证）+ 不适用降级路径（不为了凑判据生成伪量化字段）
- **Guardrails 末尾**：新增整节 N/A vs 行级 N/A 处理规则（"大多数不适用 → 删节 + 开头一行说明"判据）

### 仪式性「归位」段清理

删除 4 个 td-* SKILL.md 的纯标签「反馈控制回路归位 / 核心论点归位 / 前馈控制准备环节」段——只贴原则标签、不写约束本 skill 的哪个动作，按 AGENTS.md「设计变更评估维度」节仪式性内容判定线判定为仪式性 → 删除。`system-engineering` 的「反馈控制回路」节作为根节点保留（仍是唯一归位锚点，下游 skill 触发闭环时按该节叙述归位）。

## ⚠️ 行为变更

| 变更点 | 1.12.0 表现 | 1.12.1 行为 |
|---|---|---|
| profile-maintenance 轻量 proposal | 模板列 5 项字段 | 模板列 6 项字段（补「与既有架构/风格的遵循关系」） |
| td-reverse-spec 「入口契约」形态 | 加粗强调句（非节） | `## 入口契约` 标题节 |
| td-propose 澄清量化 | 无量化约束 | ≤3 问 + 优先级 + 合理默认不追问 + 跳过条件 |
| td-propose 「系统工程影响评估」两字段 | 无填写判据 | 四判据（可测量 / 技术无关 / 用户视角 / 可验证）+ 不适用降级 |
| td-propose proposal N/A 处理 | 无整节/行级区分 | 整节 N/A 删节 + 开头一行说明；行级 N/A 附机械校验项 |
| audit-history 追加前 | 无判重与格式约定 | 判重 + timestamp 带时区 + report 带 `audits/` 前缀 |
| td-archive 复盘节落点 | tasks.md / proposal 分叉 | 统一为 proposal.md |
| scenario→test 账本产出 | 无机械校验 | 路径存在性 + scenario 名称逐字一致 两项机械校验 |
| caller 实测锚核对 | 单类断言 | 双类断言（`contains` 子串 + `toBe` 精确） |
| LLM 兜底 review | 凭实施记忆写 finding | 逐 finding 复验（对照代码实证） |
| td-* SKILL.md 「归位」段 | 4 处纯标签归位段 | 删除（`system-engineering` 归位节作为唯一锚点保留） |

**不改变的**：td-* artifact 流（propose → apply → archive）、表 1/2/3 强度数值、WIP 硬约束 + override 机制本体、hook 触发时机（SessionEnd 事件不变）、`.td-state/` 持久化约定、四处 manifest 的 name / description / author、skill / command 数量（18 skill + 8 command）。

## 升级步骤

1. **bump 版本**：四处清单的 `version` 已同步改为 `1.12.1`（根目录 `plugin.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / `package.json`，description 保持纯 ASCII 且四处完全一致）。
2. **运行时前置**：不变——Node.js ≥20.19.0（OpenSpec CLI 与 SessionEnd hook 共用）；OpenSpec CLI：`npm install -g @fission-ai/openspec@latest`。
3. **重新安装**（按平台）：
   - atomcode：`/plugin marketplace add <this-repo-url>` → `/plugin install total-design`
   - Claude Code：`claude plugin marketplace add <this-repo-url>` → `claude plugin install total-design`（或 `claude --plugin-dir <this-repo-path>`）
   - Pi Agent：`pi install git:<this-repo-url>`
4. **重新 trust**：本次 hook 命令串未变更（哈希不变），已 trust 的安装无需重新 trust；全新安装按平台执行 `atomcode plugin trust total-design`。
5. **验证**：
   - 四处清单版本号同为 1.12.1，description 四处逐字一致。
   - td-reverse-spec 有 `## 入口契约` 标题节：`grep -n "^## 入口契约" skills/td-reverse-spec/SKILL.md` 有输出。
   - profile-maintenance 模板含第 6 项：`grep -n "与既有架构/风格的遵循关系" skills/field-assessment/references/profile-maintenance.md` 有输出。
   - td-propose 三处填法约束存在：`grep -nE "可测量|整节 N/A|澄清量化" skills/td-propose/SKILL.md` 有输出。
   - 开发态调用方清单零残留：`grep -rnE "触发方：\`?[a-z-]+\`? ?步骤" skills/` 无输出。
   - skill 数量：`ls -d skills/*/ | wc -l` 输出 `18`。
   - 逻辑名/命令名/路径/CLI 命令/环境变量不变：`field-assessment` / `/td-propose` / `openspec list` / `$_TD_TIER` 等。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.12.1] 条目。
