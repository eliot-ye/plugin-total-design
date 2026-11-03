# total-design v1.16.0 发布说明

> 面向使用态用户：本次为**功能版**，新增第四个平台支持（DeepSeek Harness / DSH）与 Pi extension 的原生 `td-list` + 会话结束状态同步，并重组文档为按读者分层的 `docs/` 结构；skill 数量、references、hooks、td-* 契约流不变。

## 本版本是什么

1.16.0 是 **DSH 平台支持 + Pi 状态同步 + 文档重组版**。上一次版本 1.15.0 补齐了 code review 工具对接规范；本版本在此基础上：

- **Added — DSH 平台支持（第四平台）**：新增 `dsh/` 包装层——`dsh/index.mjs`（ESM、零运行时依赖，152 行）把 `skills/*/SKILL.md` 的 18 个 skill 经 `ctx.skills.registerProvider` 注册进 DSH 会话目录；`dsh/cordis.patch.yml`（bundle 补丁层）insert 一行 `{id: total-design-skill-provider, name: ./index.mjs}`；根 `package.json` 新增 `dsh.bundle.patch` 字段指向该 patch。DSH 是第四个支持的平台（atomcode / Claude Code / Pi Agent / DSH）。**平台支持矩阵**：atomcode / Claude Code 走 `.claude-plugin/plugin.json`，Pi 走 `package.json` 的 `pi` 字段，DSH 走 `package.json` 的 `dsh` 字段；`skills/`、`commands/`、`hooks/`、根 `plugin.json`、`.claude-plugin/` 全部零改动，既有平台加载现状不受影响。
- **Added — Pi extension 原生 `td-list`**：`extensions/pi-agent/index.ts` 由纯桥接扩展为「桥接 + 原生实现」——`td-list` 无同名 skill，不走 `/skill:` 桥接，直接跑 `openspec list` 把真实结果交给 agent 格式化为态势表；失败不崩溃会话（提示确认 OpenSpec CLI）。
- **Added — Pi 会话结束状态同步**：`session_shutdown` 时复用 `hooks/td_state_sync.js` 导出的纯函数（不复制逻辑，与 atomcode / Claude Code 的 SessionEnd hook 同一单一事实源）校正 `openspec/.td-state/*`。
- **Changed — 文档按读者分层重组**：README / AGENTS.md 的维护细节拆入 `docs/`——`docs/user/install.md`、`docs/user/usage.md`、`docs/maintainer/platforms.md`、`docs/maintainer/manifests.md`、`docs/maintainer/content-authoring.md`、`docs/explanation/architecture.md`、`docs/explanation/review-standard.md`。README 精简为入口（安装矩阵表、命令清单、工作流），AGENTS.md 精简为开发 agent 的 always-on 规则（含「文档地图」单一事实源指针）。
- **Changed — audit 触发时机收拢**：`td-system-audit` 的「触发时机」节删除，改由 `executing-plans` 步骤 1 的「current-change audit」触发点 + `td-archive` 步骤 5.2（project scope 频率计数）单一持有；`constraints/references/critical-buffer.md` 同步删除「触发时机」节。
- **Fixed — 关键链任务 review 触发关系澄清**：`requesting-code-review` 触发时机节改述——每完成一个关键链任务 → 触发 checkpoint（`executing-plans` 步骤 1）→ checkpoint 时做本 review，不是独立于 checkpoint 的触发点。
- **Fixed — `td-propose` 设计决策可逆性检查补触发指针**：步骤 6.a 新增条——propose 阶段新出现的设计决策若用户犹豫或写"先选 A 以后再改"，触发 `constraints/references/delay-decision.md`。
- **Fixed — audit / archive 触发词去重**：`td-archive` description 补「复盘」，`td-system-audit` description 移除「复盘」——audit 是周期自检、archive 是完成后复盘，触发边界由 description 词区分。
- **Fixed — `td-system-audit` 触发时机收拢后的两处悬空引用**：refactor 删除「触发时机」节后正文仍留两处 `「触发时机」` 指针（步骤 1 与 Guardrails）指向已删节；改为指向新单一持有者（`td-archive` 步骤 5.2 project scope 频率计数 / `executing-plans` 步骤 1 current-change 按关键链任务粒度触发 / 使用态 LLM 判读 description 与 `executing-plans` 步骤 1 的信号触发），消除断链。

skill 数量（18）、命令数量（8）、references、hooks、td-* 契约流（propose → apply → archive）、`commands/td-*.md` 目录、`.claude-plugin/`、root `plugin.json`、`hooks/td_state_sync.js` 全部不变。

## 改了什么

### `dsh/`（新增目录）

1. **`dsh/index.mjs`**：DSH skill provider（ESM、零运行时依赖，152 行）——从 `../skills/*/SKILL.md` 读取 18 个 skill，经 `ctx.skills.registerProvider` 注册进会话目录；`BUNDLED_SKILL_RANK = 600` 内联，镜像 `@deepseek-ai/dsh-skill-office` 的 provider 形态保证加载契约一致；frontmatter 解析严格化（legacy camelCase 键拒绝、布尔 spellings 全兼容）。
2. **`dsh/cordis.patch.yml`**：bundle 补丁层——insert 一行 `{id: total-design-skill-provider, name: ./index.mjs}`；`name` 相对本 patch 文件路径，无需改根 `package.json` 的 `main`/`exports`。
3. **`dsh/README.md`**：安装说明（Web 插件页 / `dsh plugin` CLI / `plugin_manager` 工具）与已知限制（`commands/*.md` 不扫描、`hooks/` 无加载器、`argument-hint` 被忽略、`td-propose`/`td-apply` 超 ~8192 字符惯例可能被压缩、分发即分发可执行代码）。

### `extensions/pi-agent/index.ts`

1. 桥接 7 个 `td-*` 命令（`td-init`/`td-propose`/`td-explore`/`td-apply`/`td-reverse-spec`/`td-archive`/`td-system-audit`）→ `/skill:<name>`；`expandPromptTemplates: true` 显式开启 + `deliverAs` 按 idle 状态指定。
2. 原生注册 `td-list`：直接跑 `openspec list`，失败不崩溃会话，结果交给 agent 格式化为态势表。
3. `session_shutdown` 状态同步：复用 `hooks/td_state_sync.js` 导出的纯函数校正 `.td-state/*`。
4. 真实类型标注（`ExtensionCommandContext`）+ `ATOMCODE_PLUGIN_ROOT` env 注入（供 hook 读 audit 报告模板）。

### `package.json`

`dsh.bundle.patch` 字段新增（`./dsh/cordis.patch.yml`），`pi` 字段不变。

### `skills/`

1. **`skills/td-system-audit/SKILL.md`**：删除「触发时机」节（频率触发 + 信号触发），description 移除「复盘」。
2. **`skills/executing-plans/SKILL.md`**：步骤 1 补「current-change audit」——完成一个关键链任务时按表 3 的 current-change scope 频率触发 `/td-system-audit current-change`。
3. **`skills/requesting-code-review/SKILL.md`**：触发时机节改述——关键链任务完成 → 触发 checkpoint（`executing-plans` 步骤 1）→ checkpoint 时做本 review，不是独立触发点。
4. **`skills/td-propose/SKILL.md`**：步骤 6.a 新增「设计决策可逆性检查」条（delay-decision 触发指针）。
5. **`skills/td-archive/SKILL.md`**：description 补「复盘」触发词。
6. **`skills/constraints/references/critical-buffer.md`**：删除「触发时机」节。

### `docs/`（新增目录）与 `README.md` / `AGENTS.md`

按读者分层重组：`docs/user/`（install / usage）、`docs/maintainer/`（platforms / manifests / content-authoring）、`docs/explanation/`（architecture / review-standard）；README / AGENTS.md 精简为入口。`docs/archive/` 与 `docs/feat/` 保留历史设计文档。

## ⚠️ 行为变更

| 项 | 1.15.0 | 1.16.0 |
|---|---|---|
| 支持平台 | atomcode / Claude Code / Pi Agent | **+ DeepSeek Harness (DSH)**（第四平台，`dsh/` 包装层） |
| Pi `td-list` | 无（`td-list` 在 Pi 下缺失，需 bash 跑 `openspec list`） | 原生实现（`openspec list`，失败不崩溃会话） |
| Pi `.td-state/` 校正 | 无（正文步骤直接写入，不依赖 hook） | `session_shutdown` 复用 `hooks/td_state_sync.js` 校正 |
| audit 触发时机 | 分散于 `td-system-audit` 正文 + `td-archive` 步骤 5.2 | 收拢为 `executing-plans` 步骤 1（current-change audit）+ `td-archive` 步骤 5.2（project scope）单一持有 |
| 关键链任务 review 触发 | 「每完成一个关键链任务」独立触发点 | 关键链任务完成 → 触发 checkpoint → checkpoint 时做 review（非独立触发点） |
| `td-propose` 设计决策可逆性检查 | 探索阶段检查过，propose 阶段无显式指针 | 步骤 6.a 补 delay-decision 触发指针 |
| audit / archive 触发词 | 两者 description 都含「复盘」 | `td-archive` 含「复盘」，`td-system-audit` 移除（audit = 周期自检，archive = 完成后复盘） |
| 文档结构 | README / AGENTS.md 内嵌维护细节 | 按读者分层拆入 `docs/`（user / maintainer / explanation） |
| Skill 18 个 / Command 8 个 | — | 未变更 |
| Hooks / td-* 契约流 | — | 未变更 |
| 四处 manifest 的 name / description / author | — | 未变更（仅 version bump 1.15.0 → 1.16.0） |

hook 命令串未变更（`hooks/td_state_sync.js` 零改动），已 trust 的安装继续生效；不需要重新 trust。

## 升级步骤

1. **bump 版本**：四处清单的 `version` 已同步改为 `1.16.0`（根目录 `plugin.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / `package.json`，description 保持纯 ASCII 且四处完全一致）。
2. **运行时前置**：不变——Node.js ≥20.19.0；OpenSpec CLI ≥ 1.12。DSH 端由 Harness 自带 Node 运行时。
3. **重新安装**（按平台）：
   - atomcode：`/plugin marketplace add <this-repo-url>` → `/plugin install total-design`
   - Claude Code：`claude plugin marketplace add <this-repo-url>` → `claude plugin install total-design`（或 `claude --plugin-dir <this-repo-path>`）
   - Pi Agent：`pi install git:<this-repo-url>`
   - **DeepSeek Harness (DSH)**：侧边栏「插件 → 添加插件」填仓库绝对路径（如 `/Users/eliot/my/plugin-total-design`），启用 `total-design-skill-provider` 行；或 `dsh plugin --profile <name> add <path>`。
4. **重新 trust**：**不需要**——本次 hook 命令串未变更（哈希不变），已 trust 的安装继续生效。全新安装按平台执行 `atomcode plugin trust total-design`。

## 验证

- 四处清单版本号同为 1.16.0，description 四处逐字一致：`grep -h '"version"' plugin.json .claude-plugin/plugin.json .claude-plugin/marketplace.json package.json | sort -u` 应只输出 `"version": "1.16.0"` 一种形态。
- `dsh/index.mjs` 存在且注册 18 个 skill：`ls dsh/` 应含 `index.mjs` / `cordis.patch.yml` / `README.md`；`grep -c "SKILL.md" dsh/index.mjs` 应 ≥ 1。
- `package.json` 含 `dsh.bundle.patch`：`grep -n '"dsh"' package.json` 应命中；`grep -n 'cordis.patch.yml' package.json` 应命中。
- `extensions/pi-agent/index.ts` 含 `td-list` 原生实现：`grep -n 'td-list' extensions/pi-agent/index.ts` 应命中；含状态同步：`grep -n 'session_shutdown' extensions/pi-agent/index.ts` 应命中。
- `skills/td-system-audit/SKILL.md` 无「触发时机」节：`grep -n "触发时机" skills/td-system-audit/SKILL.md` 应无输出；`skills/executing-plans/SKILL.md` 含「current-change audit」：`grep -n "current-change audit" skills/executing-plans/SKILL.md` 应命中。
- `skills/requesting-code-review/SKILL.md` 含 checkpoint 触发关系澄清：`grep -n "不是独立于 checkpoint" skills/requesting-code-review/SKILL.md` 应命中。
- `skills/td-propose/SKILL.md` 步骤 6.a 含「设计决策可逆性检查」：`grep -n "设计决策可逆性检查" skills/td-propose/SKILL.md` 应命中。
- `skills/td-archive/SKILL.md` description 含「复盘」：`grep -n '"复盘"' skills/td-archive/SKILL.md` 应命中；`skills/td-system-audit/SKILL.md` description 不含「复盘」：`grep -n '复盘' skills/td-system-audit/SKILL.md | head -1` 应无输出。
- `docs/` 分层结构存在：`ls docs/user docs/maintainer docs/explanation` 各应非空。
- skill 数量（18）、命令文件数量（8）、hook 命令串、td-* 契约流行为均不变。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.16.0] 条目。
