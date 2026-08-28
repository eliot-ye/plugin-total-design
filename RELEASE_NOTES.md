# total-design v1.5.0 发布说明

> 面向使用态用户：升级前请先读「⚠️ 行为变更」与「升级步骤」。

## 本版本是什么

1.5.0 是**单语化 + 行为层收紧版**：分两个阶段完成。

**阶段 1（单语化结构）**：1.4.0 的双语结构（英文根目录 + `zh-CN/` 中文副本）简化为单一中文版。根目录 `skills/` / `commands/` 的内容由中文版替换，`zh-CN/` 目录删除。

**阶段 2（行为层收紧）**：7 个行为层 skill 的 `user-invocable` 由 `true` 改为 `false`（消除触发歧义）；`writing-plans` 新增 task 编程性约束；`human-in-loop` 新增多章节回复编号规则；3 个 profile 的强度口径收紧。

阶段 1 + 阶段 2 的运行时行为语义（流程步骤、强度数值、artifact 流）——零变更。使用态从 1.4.0 直接升级到 1.5.0。

## 本次变更

### 阶段 1：单语化结构

- **删除英文副本**：根目录 `skills/` / `commands/` 下的英文版内容（39 + 8 文件）由 `zh-CN/` 下的中文版替换。
- **删除 `zh-CN/` 目录**：`zh-CN/skills/` 39 文件 + `zh-CN/commands/` 8 文件全部删除，中文版内容已移入根目录。
- **`plugin.json` 路径不变**：`skills: ["./skills"]` / `commands: ["./commands"]` 仍指向根目录，加载器加载的从英文版变为中文版。
- **AGENTS.md 精简**：目录结构节删除 `zh-CN/` 子目录；「双语对应与同步修改」节从 6 条硬约束缩减为单语说明 + 历史备注。

### 阶段 2：行为层收紧

- **user-invocable 收紧（7 skill）**：`brainstorming` / `executing-plans` / `requesting-code-review` / `systematic-debugging` / `test-driven-development` / `verification-before-completion` / `writing-plans` 的 `user-invocable` 由 `true` 改为 `false`。这些 skill 由流程编排触发（`td-explore` / `td-apply` 内部调用），不再作为独立 slash 入口，消除使用态 LLM 的触发歧义。
- **task 编程性约束**：`writing-plans` 新增「task 只写 agent 能编程性执行的步骤」——非编程性动作（人工目测、用户验收、第三方审批）不得作为独立 task，降级为 task 的 `验证` 字段；约束收敛到 `references/task-template.md` 的「任务主体约束」节为单一权威。
- **多章节回复编号规则**：`human-in-loop` 新增「需用户回复的条目标号规则」——报告/总结里多个需用户回复的章节不得共用同一套编号，改用带章节前缀的编号（`a1 / b1`）。`td-explore` 的探索总结模板与 `td-system-audit` 的 audit-report-template 同步应用。
- **profile 强度口径收紧**：3 个 profile（`profile-greenfield` / `profile-brownfield` / `profile-maintenance`）的「在各 tier 下的 constraint 强度」改为"约束强度由 tier 单一决定，本 profile 不叠加、不修改强度数值（`human-in-loop` 的表 2 profile 加成除外）"，消除此前各 profile 与 `field-assessment` 表 1 的强度口径模糊。
- **层次观归位收敛**：`tier-medium` 的层次观归位段改为引用 `field-assessment` 的 `references/subsystem-tiering.md`，不再逐字重复。
- **删除跨平台同步打回项**：`CONTRIBUTING.md` 删除"引入跨平台同步（`.claude/` / `.codex/` 等）"审查打回项——本 plugin 只针对 atomcode。

## ⚠️ 行为变更

| 变更 | 1.4.0 旧行为 | 1.5.0 新行为 |
|---|---|---|
| 加载语言 | 英文（根目录 skills/commands 为英文版） | **中文**（根目录 skills/commands 为中文版） |
| `zh-CN/` 目录 | 存在，结构镜像根目录 | **删除** |
| 双语同步负担 | 修改任一语言必须立即同步另一种语言 | **无**（单一语言） |
| skill frontmatter description | 英文 | 中文（触发词语义与 1.4.0 中文版一致） |
| 行为层 7 skill 触发方式 | `user-invocable: true`，可独立 slash 触发 | **`user-invocable: false`**，仅由流程编排触发（`td-explore` / `td-apply` 内部调用） |
| task 主体约束 | 无约束，非编程性动作可作为独立 task | **task 必须是 agent 能编程性执行的动作**，非编程性动作降级为 `验证` 字段 |
| 多章节回复编号 | 无规则，各章节可共用同一套编号 | **带章节前缀编号**（`a1 / b1`），避免用户回复时无法对应条目 |

**不改变的**：所有 skill 的运行时行为语义、流程步骤、强度数值、artifact 流、依赖关系——零变更。本次仅为语言版本切换 + 目录结构精简 + 触发歧义消除 + 编号规则统一。

## 升级步骤

1. **bump 版本**：`plugin.json` + `marketplace.json` 的 `version` 改为 `1.5.0`（description 保持纯 ASCII）。
2. **重新发布/安装**：把仓库内容同步到 marketplace 安装副本（`~/.atomcode/plugins/marketplaces/total-design-marketplace/`）。
3. **重新 trust**：`atomcode plugin trust total-design` —— plugin 内容有变更，需重新 trust 确保新内容加载。
4. **验证**：
   - 安装副本 skills/ 与仓库 `diff -rq` 一致；`plugin.json` 两边同为 1.5.0。
   - `zh-CN/` 目录不存在：`test ! -d zh-CN && echo "OK"`。
   - skill frontmatter description 为中文：`head -3 skills/system-engineering/SKILL.md` 应显示中文 description。
   - 7 个行为层 skill 的 `user-invocable` 均为 `false`：`grep -l 'user-invocable: true' skills/{brainstorming,executing-plans,requesting-code-review,systematic-debugging,test-driven-development,verification-before-completion,writing-plans}/SKILL.md` 应无输出。
   - `human-in-loop` 含编号规则：`grep '带章节前缀' skills/human-in-loop/SKILL.md` 应有输出。
   - 逻辑名/命令名/路径/CLI 命令/环境变量不变：`wip-limit` / `/td-propose` / `field-assessment/references/strength-matrix.md` / `openspec list` / `$_TD_TIER` 等。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.5.0] 条目。
