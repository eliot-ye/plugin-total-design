# total-design v1.12.0 发布说明

> 面向使用态用户：升级前请先读「⚠️ 行为变更」与「升级步骤」。

## 本版本是什么

1.12.0 是 **新增 + 收敛版**：一处新 skill（`agents-md-hygiene`，17→18）+ review/audit 判级证据约束 + WIP 连续 override 检测，外加一轮使用态审核的全面收敛（约 30 个文件，强度表述统一改引用式、重复定义归权、依赖节错列修正）。td-* 契约流（propose → apply → archive）结构不变，表 1/2/3 强度数值不动。

## 本次新增

### agents-md-hygiene skill（配置层，17→18）

指令文件（AGENTS.md / CLAUDE.md / `.atomcode.md` 等）编写规范：主指令文件体量上限、写入前判重与三选一归属判定、超限拆分指针化按需加载、与 `openspec/specs` 的单一事实源联动（含无 openspec 结构的降级路径），附增改/瘦身子流程。`user-invocable: false`，由 agent 判读触发。

### review / audit 判级须证据指位（requesting-code-review + td-system-audit）

- **review 侧**：非 OK 判定必须给出证据位置（文件:行号或 artifact 指位）；无证据的 critical 自动降级为"待验证疑点"，走 `human-in-loop` 显式路由用户求证，agent 不替用户拍板。报告 Issues 上限 5 条。
- **audit 侧**：报告模板对照清单改三态判定（符合 / 违反 / 存疑），违反须指证据位置，新增存疑列；`td-system-audit` 步骤 6 新增存疑路由——存疑发现不进修复表，先向用户求证，确认成立才触发修复。

### WIP 连续 override 检测（constraints/references/wip-limit.md）

WIP 超限提示时若检测到已有 change 的 `proposal.md` 记录过 override，额外提示"已连续 override，WIP 硬约束正在失效"——防止 override 滥用。

## ⚠️ 行为变更

| 变更点 | 1.11.0 表现 | 1.12.0 行为 |
|---|---|---|
| review 非 OK 判定 | 无证据强制要求，critical 可凭语感判出 | 非 OK 判定必给证据指位；无证据 critical 降为待验证疑点走 human-in-loop |
| review 报告 Issues | 无上限 | 上限 5 条 |
| audit 对照清单 | 二态（符合/违反） | 三态（符合/违反/存疑），违反须指证据位置；存疑先问用户不进修复表 |
| WIP 连续 override | 仅单次超限提示，无连续检测 | 检测到已有 change 记录过 override → 提示"WIP 硬约束正在失效" |
| 约束强度表述 | 部分文件正文写死数值/强度断言 | 统一引用式——按 `field-assessment` 表 1/表 2/表 3 取值（数值本身未变） |
| 失败次数阈值 | 多文件各写 2 次/3 次 | 收敛至 `systematic-debugging` 单一权威（数值未变） |
| skill 数量 | 17 skill + 8 command | 18 skill + 8 command |

**不改变的**：td-* artifact 流（propose → apply → archive）、表 1/2/3 强度数值（只改表述方式为引用式，数值单一事实源未动）、WIP 硬约束 + override 机制本体、hook 脚本与触发时机、`.td-state/` 持久化约定、四处 manifest 的 name / description / author——均不变。

## 本次收敛（使用态审核）

约 30 个文件按使用态 LLM 视角四维度审核收敛：删除 tier 变体文件头部零信息量 audit 频率指针节；tier-large 层次观纯复述段收敛为指向 `subsystem-tiering.md` 的一行指针；`td-explore` 步骤 4 评估维度收敛为指向步骤 5；TDD / writing-plans 依赖技能节移除按需触发项（预加载 vs 按需触发分界对齐）；`constraints`「如何被引用」节收敛为指向子约束映射表；subsystem-tiering 持久化表述与 yaml 模板口径对齐。完整列表见 CHANGELOG 的 [1.12.0] 条目。

## 升级步骤

1. **bump 版本**：四处清单的 `version` 已同步改为 `1.12.0`（根目录 `plugin.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / `package.json`，description 保持纯 ASCII 且四处完全一致）。
2. **运行时前置**：不变——Node.js ≥20.19.0（OpenSpec CLI 与 SessionEnd hook 共用）；OpenSpec CLI：`npm install -g @fission-ai/openspec@latest`。
3. **重新安装**（按平台）：
   - atomcode：`/plugin marketplace add <this-repo-url>` → `/plugin install total-design`
   - Claude Code：`claude plugin marketplace add <this-repo-url>` → `claude plugin install total-design`（或 `claude --plugin-dir <this-repo-path>`）
   - Pi Agent：`pi install git:<this-repo-url>`
4. **重新 trust**：本次 hook 命令串未变更（哈希不变），已 trust 的安装无需重新 trust；全新安装按平台执行 `atomcode plugin trust total-design`。
5. **验证**：
   - 四处清单版本号同为 1.12.0，description 四处逐字一致。
   - 新 skill 存在：`ls skills/agents-md-hygiene/SKILL.md` 有输出。
   - skill 数量：`ls -d skills/*/ | wc -l` 输出 `18`。
   - 证据指位约束存在：`grep -n "证据" skills/requesting-code-review/SKILL.md` 有输出。
   - audit 存疑路由存在：`grep -n "存疑路由" skills/td-system-audit/SKILL.md` 有输出。
   - 连续 override 检测存在：`grep -n "连续 override" skills/constraints/references/wip-limit.md` 有输出。
   - 逻辑名/命令名/路径/CLI 命令/环境变量不变：`field-assessment` / `/td-propose` / `openspec list` / `$_TD_TIER` 等。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.12.0] 条目。
