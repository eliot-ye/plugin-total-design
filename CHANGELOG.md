# Changelog

本文件记录 total-design plugin 的版本变更。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循 [SemVer](https://semver.org/lang/zh-CN/)。

## [1.5.0] - 2026-08-27

### Changed（行为变更）

- **删除英文副本，中文版移入根目录成为唯一版本**：1.4.0 的双语结构（英文根目录 + `zh-CN/` 中文副本）简化为单一中文版。根目录 `skills/` / `commands/` 的内容由中文版替换，`zh-CN/` 目录删除。`plugin.json` 的 `skills` / `commands` 路径不变（仍为 `["./skills"]` / `["./commands"]`），加载器加载的从英文版变为中文版。
- **AGENTS.md 双语同步节精简**：「双语对应与同步修改」节从 6 条硬约束 + 双语开发流程缩减为单语说明 + 历史备注。目录结构节删除 `zh-CN/` 子目录。
- **CONTRIBUTING.md 双语指南保留**：「中文 vs 英文」节原本就规定 skill 正文以中文为主，此节内容仍然适用（code / command / filename 保持英文），不动。
- **user-invocable 收紧（行为层 7 skill）**：`brainstorming` / `executing-plans` / `requesting-code-review` / `systematic-debugging` / `test-driven-development` / `verification-before-completion` / `writing-plans` 的 `user-invocable` 由 `true` 改为 `false`。这些 skill 由流程编排触发（`td-explore` / `td-apply` 内部调用），不再作为独立 slash 入口，消除使用态 LLM 的触发歧义。
- **task 编程性约束**：`writing-plans` 新增「task 只写 agent 能编程性执行的步骤」——task 主体必须是 agent 能编程性执行的动作（写代码、跑测试、执行 CLI 命令、改配置等）；非编程性动作（人工目测、用户验收、第三方审批等）不得作为独立 task，降级为该 task 的 `验证` 字段补充说明。约束收敛到 `references/task-template.md` 的「任务主体约束」节为单一权威。
- **多章节回复编号规则**：`human-in-loop` 新增「需用户回复的条目标号规则」——呈现内容同时含多个需用户回复的章节时（如报告里的"未解决的问题"与"建议的下一步"），各章节内条目标号不得共用同一套编号，改为带章节前缀的编号（`a1 / b1`）。`td-explore` 的探索总结模板与 `td-system-audit` 的 `references/audit-report-template.md` 同步应用（编号前缀示例 `a` = 发现的问题，`b` = 建议的下一步动作）。
- **profile 强度口径收紧**：3 个 profile（`profile-greenfield` / `profile-brownfield` / `profile-maintenance`）的「在各 tier 下的 constraint 强度」改为"约束强度由 tier 单一决定，本 profile 不叠加、不修改强度数值（`human-in-loop` 的表 2 profile 加成除外）"，强度取值引用 `field-assessment` 的「下游引用强度的约定」节，不再逐字重复——消除各 profile 与 `field-assessment` 表 1 的强度口径模糊。
- **层次观归位收敛**：`tier-medium` 的层次观归位段改为引用 `field-assessment` 的 `references/subsystem-tiering.md`，不再逐字重复子系统分层机制说明。
- **删除跨平台同步打回项**：`CONTRIBUTING.md` 删除"引入跨平台同步（`.claude/` / `.codex/` 等）——本 plugin 只针对 atomcode"审查打回项。

### Removed

- 删除 `zh-CN/` 目录（`zh-CN/skills/` 39 文件 + `zh-CN/commands/` 8 文件）。中文版内容已移入根目录 `skills/` + `commands/`。
- 删除根目录 `skills/` + `commands/` 下的英文版内容（39 + 8 文件），由中文版替换。

### Docs

- AGENTS.md 目录结构节、skills/commands 内容编排节更新为单语中文。
- AGENTS.md 补充「`## 依赖技能` 节的语义定义」——预加载 vs 按需触发分界（预加载应列入依赖节，运行时按需触发不列入），判定依据参考 `td-* 标准步骤 1`。
- RELEASE_NOTES.md 更新为 1.5.0 版本发布说明（单语化结构 + 行为层收紧两个阶段）。
- 历史条目（1.4.0 及更早）保留不动，其中对双语结构的描述属于历史记录。

## [1.4.0] - 2026-08-26

### Changed（行为变更）

- **双语化结构**：本 plugin 从单一中文版重构为**英文（默认加载）+ 中文（zh-CN 对应副本）**的双语结构。根目录 `skills/` / `commands/` 为英文版（`plugin.json` 默认指向），`zh-CN/skills/` / `zh-CN/commands/` 为中文版，两套结构 1:1 镜像。
- **默认加载语言切换为英文**：`plugin.json` 的 `skills: ["./skills"]` / `commands: ["./commands"]` 现指向英文版。国际化友好，非中文环境 agent 直接读英文 frontmatter description 触发。
- **AGENTS.md 新增「双语对应与同步修改」节**：作为编辑规则的硬约束子节，规定文件清单 1:1 对应、frontmatter 逻辑字段逐字符一致、正文结构对应、逻辑名/命令名/路径/CLI 命令/环境变量跨语言不变、修改任一语言必须立即同步另一种语言、翻译漂移校验命令。
- **AGENTS.md 目录结构节更新**：反映 `zh-CN/` 子目录的新结构，补充 skills/commands 内容编排说明（英文默认 + 中文对应）。
- **依赖节定义澄清（B1）**：`## 依赖技能` = 会话级**预加载清单**，运行时按需触发的技能不应列入。5 个 td-* 依赖节恢复为仅 `system-engineering` + `field-assessment`（`td-explore` 原有的 `brainstorming` 同属运行时激活，一并移除）。依据 `td-* 标准步骤 1` 的"预加载 vs 按需触发"分界。

### Fixed

- **锚点引用修正（A1）**：统一 en 侧 3 处对 `tier-large` 文档节标题的引用写法（`delay-decision` / `td-apply` / `td-propose`），文档名 overall → general，命中实际标题 "General design document is mandatory"。
- **td-system-audit 反向触发注释（A2）**：en+zh 两处 :99 注释修正，`human-in-loop` 位置描述从错误的"触发时机"节改为"正文已反向声明（见其场景 7）"。
- **依赖节头统一（A3）**：en 侧 14 个 SKILL.md 的依赖节标题统一为 `## Dependent Skills`（消除 `## Dependencies` / `## Dependency Skills` / `## Dependent Skills` 三种变体；zh 侧 `## 依赖技能` 已统一，不动）。
- **argument-hint 双语逐字符一致（B2）**：4 对 argument-hint 统一为 en 写法（`td-init` 的 `(无参数)`→`(no arguments)`，`td-system-audit` 的 `(可选, 默认 current-change)`→`(optional, default current-change)`；含对应命令文件）。
- **field-assessment 格式补全（C1）**：en `field-assessment:16` 补 `## How It Is Referenced` 前缺空行（与 zh 侧对齐）。
- **命令术语一致性（C3）**：`commands/td-system-audit.md` description 修正 `baseline`→`keynote principles`、`total design department`→`general design department`，对齐 project 术语；同时修复命令文件 argument-hint 破坏（去引号+冒号改等号，破坏 YAML frontmatter）。

### Docs

- **双语同步硬约束**：违反文件清单 1:1 对应、frontmatter 逻辑字段不一致、正文结构不对应、跨语言不变量漂移、只改一种语言不同步另一种 = bug。校验命令：`diff <(cd skills && find . | sort) <(cd zh-CN/skills && find . | sort)` 应无输出。
- **翻译漂移校验**：`grep -c '\`<logical-name>\`' skills/` vs `zh-CN/skills/`，每个逻辑名计数应一致。计数不一致 = 某一方漏改/多改 = bug。
- **commit 风格补充**：双语同步提交时 commit message 应体现 en + zh-CN（如 `fix: correct wip-limit override flow (en + zh-CN)`）。
- **新增 `docs/audit-fix-gate-2026-08-26.md`**：记录使用态 LLM 视角审核修复的依赖图谱与分析前置门（步骤 1–6，含 16 个被改 skill 的出边、全 27 节点的依赖图谱邻接表、blast radius 与风险评估）。
- **B1 回退说明**：docs 文件头部与步骤 1 表格、步骤 5/6 风险段均标注 B1 已回退。

## [1.3.1] - 2026-08-23

### Fixed

- **消除平台工具名泄漏**：td-propose 移除正文中的 `request_user_input` 平台工具名，改为平台无关的"询问用户机制"表述（使用态 LLM 视角审核维度 4 修复）。
- **补齐依赖技能节**：critical-buffer / brooks-law / delay-decision / human-in-loop 新增「依赖技能」节，wip-limit 依赖节补列 `field-assessment`——依赖技能节与正文实际引用一致（维度 1 修复）。
- **收敛 profile 重复段落**：3 个 profile 的「在各 tier 下的 constraint 强度」节由三处逐字重复收敛为引用式，统一锚定 `field-assessment` 识别流程的「下游引用强度的约定」节（维度 2/3 修复）。

### Changed

- 版本 bump 至 1.3.1：`plugin.json` + `marketplace.json` 同步（1.3.0 条目中的发布欠账已结清）。
- `marketplace.json` 移除指向 claude-code-marketplace 的 `$schema` 引用（多平台扩展准备）。

## [1.3.0] - 2026-08-23

### Changed（行为变更）

- **wip-limit 升级为硬约束**：从"提示不强制"改为"硬阻塞 + override 机制"。`/td-propose` 与 `/td-apply` 前置检查达上限即阻塞，用户显式 override 时经 `brooks-law` → `critical-buffer` → `human-in-loop`（第 6 类）回路放行；连续 override 会升级提醒防止滥用。
- **配置层重构**：`constraint-matrix` 拆分为 `field-assessment`，表 1/2/3 收敛到四个 references（识别流程 / 强度矩阵 / audit 频率 / 子系统分层）。tier / profile skill 只保留判据与流程侧重，强度数字单一事实源化（改强度只改 `strength-matrix.md`）。
- **"预期行为模型"字段**：proposal 必填，贯通 `/td-apply` 步骤 7.2 系统级验证与 `/td-archive` 步骤 3"模型验证"复盘，形成 propose→apply→archive 闭环。
- **td-propose 步骤重排**：步骤 6 改为 6.a–6.d 循环体（创建→必填检查→循环判定），新增步骤 7 架构 review（critical 阻塞，warning 记录，nit 忽略）。
- **td-apply 强化**：tier-large 总体设计文档必填校验、步骤 4 架构 review 复核（未改沿用 propose 结论，改了才重审）、步骤 5 明确 apply 全局粒度约束、步骤 7.2 跨分系统边界验证执行序列、7.3 current-change audit。
- **td-archive 复盘升级**：步骤 3 改为"实际 vs 预期"对照表 + "模型验证"字段 + baseline 对照源（有则用、缺则降级）；新增归档后 Purpose TBD 残留检查（housekeeping）。
- **子系统独立定 tier（层次观）**：`field-assessment` 识别流程允许子系统独立定 tier，`profile-tier.yaml` 支持 `subsystems` 条目，跨子系统依赖按"最高 tier 子系统"保守处理。
- **反馈控制回路归位**：`system-engineering` 新增「反馈控制回路」节，各 skill 显式声明自己在 propose（前馈）/ apply（控制执行）/ archive（事后校正）回路中的位置。
- **executing-plans 触发路由收窄**：执行入口统一走 `/td-apply`，用户说"开始执行"/"go"应走 `/td-apply`；current-change audit 按 tier 归属分工（medium → executing-plans 步骤 3，large → td-apply 步骤 7.3）。

### Fixed

- td-apply 步骤 2：旧 change（proposal 缺"预期行为模型"字段）不再被阻塞，降级为提示（与 td-archive 步骤 3 兜底对称；新 change 仍由 td-propose 步骤 6.c 强制必填）。
- 解除 `writing-plans` ↔ `test-driven-development` 循环依赖（真实依赖方向为 tdd → writing-plans）。
- hook 报告完整性 marker 单一事实源化：`td_state_sync.py` 从 audit 报告模板「报告模板」代码块动态读取标题，消除模板标题与 hook 硬编码字符串的隐式耦合。
- 修正步骤号错引、表 1 强度冗余与依赖技能节缺失。

### Docs

- 依赖图谱与分析门（改动前置流程）、SKILL 编写视角以使用态 LLM 为主、SKILL 不可引用 AGENTS 文件规则。
- 各 skill 按使用态视角精简语义重复与模糊表述。

## [1.2.0] - 2026-08-15

- **feat**: 新增 `openspec/todo.md` 待办池机制（propose 从池中按优先级挑选候选 change）。
- **refactor**: 规范化 constraint-matrix 表引用；补全 td-propose 架构 review。

## [1.1.1] - 2026-08-15

- **feat**: 新增 `td-init` skill，初始化 total-design 工作流（检查 OpenSpec 结构 + 配置 .gitignore 防多人协作假冲突）。
- **docs**: 更新 README 多人协作指南。

## [1.1.0] - 2026-08-15

- **feat**: 新增 SessionEnd 状态持久化 hook（`hooks/td_state_sync.py`），会话结束时从文件系统事实校正 `.td-state/`。
- **feat**: 新增架构 review 与任务风险分级（high/medium/low），验证扩展为 change-level + 系统级跨分系统两级。
- **feat**: 审核修复契约层接线，约束强度收口并拆分 references 精简 skill。
- **refactor**: 补充 skill 描述触发场景；删除"与其他 skill 的关系"中与正文重复的纯概念条目。

## [1.0.0] - 2026-08-12

- 初始发布：OpenSpec 契约层（7 个 td-* command/skill）+ Superpowers 行为层转译 + 钱学森系统工程主基调约束层。
- **feat**: `td-list` 命令（列出未归档 change）；统一 td-* skill 步骤编号为 1-based。
- **chore**: 放宽各 tier 的 WIP 上限。
