# Changelog

本文件记录 total-design plugin 的版本变更。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循 [SemVer](https://semver.org/lang/zh-CN/)。

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

- 依赖图谱与分析门（改动前置流程）、dev 态与使用态分叉说明、SKILL 编写视角以使用态 LLM 为主、SKILL 不可引用 AGENTS 文件规则。
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
