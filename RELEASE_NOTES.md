# total-design v1.8.0 发布说明

> 面向使用态用户：升级前请先读「⚠️ 行为变更」与「升级步骤」。

## 本版本是什么

1.8.0 是**多平台发布版**：同一份 `skills/` 资产同时被 atomcode、Claude Code、Pi Agent 三个平台原生加载，不再依赖任何单一平台的扩展能力。

**核心变更**：加载清单由 `.atomcode-plugin/` 迁移到 `.claude-plugin/`（atomcode 加载器搜索顺序 `.atomcode-plugin → .claude-plugin`，本 plugin 走 Claude Code 兼容路径），新增根目录 `package.json` 服务 Pi Agent。

**同步加固**：`requesting-code-review` 新增 Security 维度与风险驱动的 review 深度分档；`td-system-audit` 补「baseline spec 与代码漂移 → td-reverse-spec」定向刷新闭环；`td-propose` / `td-explore` / `td-apply` 补「遵循既有架构与代码风格」约束链。

## 本次变更

### 多平台发布

- **加载清单迁移**：`.atomcode-plugin/plugin.json` → `.claude-plugin/plugin.json`，`.atomcode-plugin/marketplace.json` → `.claude-plugin/marketplace.json`。atomcode 加载器搜索顺序为 `.atomcode-plugin → .claude-plugin`，本 plugin 只保留后者，走 CC 兼容路径；Claude Code 端原生识别。
- **新增根目录 `package.json`**（Pi Agent）：`pi.skills` 指向 `./skills`，`pi install git:<repo-url>` 安装。Pi 无命令系统，skill 调用格式为 `/skill:td-xxx`。
- **四处 manifest 一致性**：根 `plugin.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / `package.json` 的 `name` / `version` / `description` 完全一致（description 保持纯 ASCII）。根 `plugin.json` 声明 Agent Plugins 1.0.0 conformance（`$schema` 字段），任何遵循该标准的客户端可通过它识别并加载 `skills/` 目录。
- **三平台共享一份 `skills/`**：18 个 skill，无副本无 symlink，各平台各自扫描。`commands/`（8 个命令文件）仅 atomcode / Claude Code 加载。

### review 能力补强

- **Security 维度**：`requesting-code-review` 新增安全维度检查项——注入面（命令 / 路径 / SQL / 反序列化）、凭证与权限（硬编码凭证、凭证进日志、鉴权被绕过）、外部输入校验、敏感数据暴露或泄漏。
- **风险驱动的 review 深度分档**：按 tasks.md 任务的 `风险` 字段（high / medium / low）分档——**high** 全查四个维度（安全维度必查）、**medium** 查 Spec compliance / Code quality / Code consistency 三维度 + 安全维度只查红线、**low** 抽查 Spec compliance、**无 `风险` 字段的独立 review 请求**按 medium 处理。落点 `writing-plans` 的「风险 → review 深度」契约。

### baseline 漂移定向刷新闭环

- **`td-system-audit` 步骤 6 映射表**：新增「baseline spec 与代码漂移（主基调 3 对齐检查确认）→ `td-reverse-spec`」行。
- **`td-reverse-spec` 第二入口契约**：除「中途接手」首次建立 baseline 外，承接 audit 检出的漂移分系统做定向刷新——只对漂移分系统执行反推（分系统边界也已变化时先重走边界识别），用新反推结果**覆盖更新**其 `openspec/specs/<subsystem>/spec.md`；该分系统有未归档 change 触及时先完成 archive 再刷新，避免与 archive sync 双写冲突。
- **`references/audit-report-template.md` 主基调 3 清单**：新增 baseline 对齐检查项与漂移信号判定——任一信号命中即抽查对应分系统：该分系统存在绕过 td 工作流的代码提交（热修、他人提交）；archive 复盘记录过模型偏差；用户反馈「文档与代码行为不一致」。

### 既有架构与代码风格遵循约束

- **`td-explore` 步骤 3**：读项目状态时同时识别既有架构风格与代码约定（分系统边界 / 命名 / 模块组织 / 错误处理模式），作为候选方向的隐性约束——不遵循的方向必须显式标注「偏离既有架构/风格」及理由。
- **`td-propose` 影响评估**：新增「与既有架构/风格的遵循关系」必填字段——偏离既有架构或风格（重构老架构、引入新模式）需写明偏离点与理由，并触发 `human-in-loop` 让用户确认。
- **`td-apply` 步骤 4**：TDD 实现默认对齐既有代码风格与实现模式（命名 / 模块组织 / 错误处理），偏离需有 proposal 的遵循声明支撑。
- **`requesting-code-review`**：新增 Code consistency 维度与报告字段，沿用既有实现模式还是另起一套，偏离但未在 proposal 写明 → warning。

### tier 判据三档互斥化

`field-assessment` 识别流程 §3 的 tier 判据从重叠区间改为互斥区间，消除「100 个文件的系统同时命中 medium 与 large」的判定歧义：

| tier | 1.7.1 判据（区间重叠） | 1.8.0 判据（互斥） |
|---|---|---|
| `tier-large` | 文件数 100+ 或 多团队 或 多仓库 或 多部署单元 | 源码文件 200+ 或 多团队 或 多仓库 或 部署单元 4+（或存在跨部署单元依赖） |
| `tier-medium` | 文件数 10–100 或 单团队多人 或 1–3 个部署单元 | 源码文件 20–199 或 单团队多人 或 部署单元 2–3 |
| `tier-small` | 文件数 3–10 或 单人/单团队 或 1 个部署单元 | 源码文件 <20 或 单人 或 1 个部署单元 |

补计数口径注：**源码文件 = 手写代码文件 + 测试源文件**；排除 vendor / 生成代码 / lock 文件 / 纯静态资源 / 文档与 CI 配置。判据不明确时（如文件少但单文件巨大且紧耦合、计数口径难以取舍）触发 `human-in-loop` 问用户系统的规模与复杂度（与 profile 判读的兜底对称）。三份 tier 变体的「与其他 tier 的切换」阈值统一改为指向 §3 的判据指针（单一事实源）。

### hook 运行时改 Node

`hooks/td_state_sync.py` 替换为 `hooks/td_state_sync.js`——Node ≥20.19.0，CJS + `node:` 内置模块，零依赖零构建，与 OpenSpec CLI 共用同一运行时。`hooks.json` 的命令串改用 `${CLAUDE_PLUGIN_ROOT}`（atomcode 官方示例的写法，`${ATOMCODE_PLUGIN_ROOT}` 为等价别名）。**hook 触发时机与校正逻辑不变**——仍是 SessionEnd 事件兜底（`archive-counter.yaml` 按 `archive/` 目录重算、`audit-history.yaml` 补缺失报告记录），非流程门禁。

## ⚠️ 行为变更

| 变更 | 1.7.1 旧行为 | 1.8.0 新行为 |
|---|---|---|
| 支持的平台 | atomcode 单平台（`.atomcode-plugin/`） | **atomcode + Claude Code + Pi Agent**（多 manifest 并存） |
| review 维度 | 两维度（Spec compliance / Code quality） | **四维度**（+ Security + Code consistency）；深度按任务的 `风险` 字段分档 |
| tier 判据 | 文件数 100+ / 10–100 / 3–10（区间重叠） | **源码文件 200+ / 20–199 / <20（互斥）**；部署单元 4+ / 2–3 / 1 |
| hook 运行时 | Python（`td_state_sync.py`） | **Node ≥20.19.0**（`td_state_sync.js`） |
| audit 修复映射 | 5 类严重问题 → constraint | **6 类**（+ baseline spec 与代码漂移 → `td-reverse-spec`） |
| 既有架构风格 | 无约束，方向由候选评估决定 | **隐性约束**：默认遵循，偏离需在 proposal 写明并让用户确认 |
| explore 缓冲压缩信号 | 「被多次压缩后」 | **压缩 2 次以上**（与 `systematic-debugging` 阈值口径对齐） |

**不改变的**：18 个 skill 的数量与目录结构、8 个命令文件、td-* artifact 流（propose → apply → archive）、表 1/2/3 强度数值（`field-assessment` 单一事实源）、WIP 硬约束 + override 机制、5 个子约束执行规则、`.td-state/` 持久化约定、human-in-loop 第 1–5 类必停基线、hook 的 SessionEnd 触发时机与校正逻辑——均不变。

## 升级步骤

1. **bump 版本**：四处清单的 `version` 已同步改为 `1.8.0`（根目录 `plugin.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / `package.json`，description 保持纯 ASCII 且四处完全一致）。
2. **运行时前置**：确认 Node.js ≥20.19.0（OpenSpec CLI 与 SessionEnd hook 共用同一运行时）；OpenSpec CLI：`npm install -g @fission-ai/openspec@latest`。**不再需要 Python**。
3. **重新安装**（按平台）：
   - atomcode：`/plugin marketplace add <this-repo-url>` → `/plugin install total-design`
   - Claude Code：`claude plugin marketplace add <this-repo-url>` → `claude plugin install total-design`（或 `claude --plugin-dir <this-repo-path>`）
   - Pi Agent：`pi install git:<this-repo-url>`
4. **重新 trust**：`atomcode plugin trust total-design` —— plugin 内容有变更（hook 命令串改动），需重新 trust 确保新内容加载。
5. **验证**：
   - 安装副本 skills/ 与仓库 `diff -rq` 一致；四处清单版本号同为 1.8.0，description 四处逐字一致。
   - hook 脚本为 Node 版：`ls hooks/td_state_sync.js` 存在、`hooks/td_state_sync.py` 不存在；`hooks/hooks.json` 的命令串含 `${CLAUDE_PLUGIN_ROOT}`。
   - tier 判据互斥：`grep -n "200+" skills/field-assessment/references/identification-flow.md` 有输出；三份 tier 变体的「与其他 tier 的切换」节引用 `identification-flow.md` 单一事实源。
   - review 四维：`grep -c "^#### " skills/requesting-code-review/SKILL.md` = 4（Spec compliance / Security / Code quality / Code consistency）。
   - baseline 漂移闭环：`td-system-audit` 步骤 6 映射表含「baseline spec 与代码漂移」行；`td-reverse-spec` 含「入口契约（第二入口：漂移定向刷新）」节。
   - 逻辑名/命令名/路径/CLI 命令/环境变量不变：`constraints` / `field-assessment` / `/td-explore` / `/td-propose` / `openspec list` / `$_TD_TIER` 等。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.8.0] 条目。
