# total-design v1.15.0 发布说明

> 面向使用态用户：本次为**功能版**，为 `requesting-code-review` 补齐环境自带 code review 工具的对接规范与判定判据（P0–P3 严重度映射 + 噪声抑制 + Impact plan 预处理），并修复探索产出事实性约束、矛盾处置责任链、兜底路径复验判据三处问题；skill 数量、references、hooks、契约流、manifest 元数据全部不变。

## 本版本是什么

1.15.0 是 **code review 工具对接规范版 + 探索/矛盾/复验三处修复版**。上一次版本 1.14.5 修正了架构 review 的隔离载体判据；本版本在此基础上：

- **Added — code review 工具对接**：`requesting-code-review` 第 3 节新增「严重度映射」——环境自带 code review 工具返回的 P0/P1/P2/P3 映射到本 skill 的 critical/warning/nit 分级（映射由使用态 LLM 完成，工具输出不是分级最终裁定）；同节新增「噪声抑制」——可判定的 actionable suggestion 最多 warning、纯偏好命名/格式化/import 顺序/纯风格项不列入 Issues（留给 formatter / linter）。第 6 节工具优先路径补「Impact plan 预处理」（工具支持从 diff 生成结构化探索计划时，先取计划作为 reviewer 探索入口，把无依赖的 `read_file` / `grep` / `ast_grep` 调用并发发出）与「可选透传参数」（`rules_dir` / `max_rounds` / `max_duration` 类工具原生能力按需透传，tier 强度上限作为范围输入）。
- **Fixed — 探索产出事实性约束**：`td-explore` 原「先查仓库再提问」升级为「先验证为事实（提问与产出都适用）」——探索产出里的陈述（候选方向优缺点、系统工程影响评估、对现状的判断）同样必须先验证为事实再陈述，分两层（仓库内可查 / 外部世界客观事实须联网验证），验证过的带证据来源，验证不到的明确标为假设。
- **Fixed — 矛盾处置责任链补齐**：`td-explore` 步骤 3 矛盾迭代终点点名 `td-propose` 步骤 6.a；`td-propose` 步骤 6.a 新增「矛盾承接」条（描述义务，非拍板门）；`td-archive` 步骤 3 复盘新增「需求权衡处置」字段（仍矛盾 → human-in-loop 交还用户处置）。
- **Fixed — 兜底路径复验判据收严**：LLM 人工 review 的逐 finding 复验由「重新打开对应文件与行确认问题真实存在」收严为「问题真实存在于被改代码本身 + 触发条件可由 diff 与周边代码推出；指不出对应行区间或说不出触发条件的候选 → 剔除，不进报告」。
- **Fixed — 明确可显式调用**：`requesting-code-review` 与 `systematic-debugging` 的 frontmatter `user-invocable` 由 `false` 改为 `true`（用户显式要求 review / debug 时作为独立入口可调用）。

skill 数量（18）、命令数量（8）、references、hooks、td-* 契约流（propose → apply → archive）、`commands/td-*.md` 目录、`extensions/pi-agent/index.ts`、atomcode / Claude Code / Pi Agent 加载路径、四处 manifest 的 name / description / author 全部不变，仅 6 个 SKILL.md 内部文本 + version bump。

## 改了什么

### `skills/requesting-code-review/SKILL.md`

1. **第 3 节「Review 报告」**：新增「噪声抑制」与「严重度映射」两条（+13 -2）。
2. **第 6 节 change 级收尾 review 执行方式**：工具优先路径补「Impact plan 预处理」与「可选透传参数」；LLM 兜底路径逐 finding 复验判据收严。
3. **frontmatter**：`user-invocable: false` → `true`。

### `skills/td-explore/SKILL.md`

步骤 2 / 3 与「先查仓库再提问」段改写——步骤 3 矛盾迭代终点点名 `td-propose` 步骤 6.a；「先查仓库再提问」升级为「先验证为事实（提问与产出都适用）」两层约束（+8 -3）。

### `skills/td-propose/SKILL.md`

步骤 6.a「系统工程影响评估」新增「矛盾承接」条（+1 -0）。

### `skills/td-archive/SKILL.md`

步骤 3 复盘新增「需求权衡处置」字段（+1 -0）。

### `skills/td-system-audit/SKILL.md`

新增「价值前提」节——审计输入三个源头全部由 propose→apply→archive 循环沉淀，零散使用 td 时审计产出是合规性检查而非项目健康检查（+10 -0）。

### `skills/systematic-debugging/SKILL.md`

frontmatter：`user-invocable: false` → `true`（+1 -1）。

## ⚠️ 行为变更

| 项 | 1.14.5 | 1.15.0 |
|---|---|---|
| code review 工具输出 → 本 skill 分级 | 未定义映射 | P0/P1 → critical（阻塞），P2 → warning（可延后），P3 → nit 或 warning（按具体影响判级）；映射由使用态 LLM 完成 |
| 工具优先路径（第 6 节） | 直接调用工具 | 补 Impact plan 预处理（工具支持时取结构化探索计划并发探索）+ 可选透传参数（`rules_dir` / `max_rounds` / `max_duration` 类） |
| LLM 兜底逐 finding 复验 | 重新打开文件与行确认问题存在 | 收严为「问题在被改代码本身 + 触发条件可由 diff 推出；指不出行区间或触发条件 → 剔除」 |
| 探索产出的事实性约束 | 只约束"先查仓库再提问"（提问侧） | 升级为「先验证为事实（提问与产出都适用）」，产出侧陈述同样须验证为事实 + 带证据来源 / 标假设 |
| 矛盾处置责任链 | explore → archive（archive 时矛盾 → human-in-loop），propose 承接环节缺失 | explore 点名 propose → propose 6.a 承接（描述义务）→ archive 复盘「需求权衡处置」字段收口 |
| `requesting-code-review` / `systematic-debugging` 可显式调用 | `user-invocable: false`（仅流程编排触发） | `user-invocable: true`（用户显式要求 review / debug 时可独立调用） |
| 架构 review 隔离载体（1.14.5 引入） | — | 未变更 |
| Skill 18 个 / Command 8 个 | — | 未变更 |
| Hooks / td-* 契约流 | — | 未变更 |
| `commands/td-*.md` / `extensions/pi-agent/index.ts` | — | 未变更 |
| 四处 manifest 的 name / description / author | — | 未变更 |
| hook 命令串 | — | 未变更（哈希不变） |

hook 命令串未变更，已 trust 的安装继续生效；不需要重新 trust。

## 升级步骤

1. **bump 版本**：四处清单的 `version` 已同步改为 `1.15.0`（根目录 `plugin.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / `package.json`，description 保持纯 ASCII 且四处完全一致）。
2. **运行时前置**：不变——Node.js ≥20.19.0；OpenSpec CLI ≥ 1.12。
3. **重新安装**（按平台）：
   - atomcode：`/plugin marketplace add <this-repo-url>` → `/plugin install total-design`
   - Claude Code：`claude plugin marketplace add <this-repo-url>` → `claude plugin install total-design`（或 `claude --plugin-dir <this-repo-path>`）
   - Pi Agent：`pi install git:<this-repo-url>`
4. **重新 trust**：**不需要**——本次 hook 命令串未变更（哈希不变），已 trust 的安装继续生效。全新安装按平台执行 `atomcode plugin trust total-design`。

## 验证

- 四处清单版本号同为 1.15.0，description 四处逐字一致：`grep -h '"version"' plugin.json .claude-plugin/plugin.json .claude-plugin/marketplace.json package.json | sort -u` 应只输出 `"version": "1.15.0"` 一种形态。
- `skills/requesting-code-review/SKILL.md` 第 3 节带严重度映射表：`grep -n "严重度映射" skills/requesting-code-review/SKILL.md` 应命中第 3 节；`grep -n "噪声抑制" skills/requesting-code-review/SKILL.md` 应命中同节。
- `skills/requesting-code-review/SKILL.md` 第 6 节带 Impact plan 预处理：`grep -n "Impact plan" skills/requesting-code-review/SKILL.md` 应命中第 6 节；LLM 兜底复验判据收严：`grep -n "指不出对应行区间" skills/requesting-code-review/SKILL.md` 应命中。
- `skills/td-explore/SKILL.md` 含「先验证为事实」两层约束：`grep -n "先验证为事实" skills/td-explore/SKILL.md` 应命中。
- `skills/td-propose/SKILL.md` 步骤 6.a 含「矛盾承接」：`grep -n "矛盾承接" skills/td-propose/SKILL.md` 应命中。
- `skills/td-archive/SKILL.md` 步骤 3 含「需求权衡处置」：`grep -n "需求权衡处置" skills/td-archive/SKILL.md` 应命中。
- `skills/td-system-audit/SKILL.md` 含「价值前提」节：`grep -n "价值前提" skills/td-system-audit/SKILL.md` 应命中。
- `requesting-code-review` / `systematic-debugging` frontmatter `user-invocable: true`：`grep -n "user-invocable: true" skills/requesting-code-review/SKILL.md skills/systematic-debugging/SKILL.md` 应各命中 1 处。
- skill 数量（18）、命令文件数量（8）、hook 命令串、td-* 契约流行为均不变。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.15.0] 条目。
