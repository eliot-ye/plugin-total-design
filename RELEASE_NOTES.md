# total-design v1.14.2 发布说明

> 面向使用态用户：本次为**元数据补齐版**，无行为变更、无新增能力；升级只需 reinstall，无需重新信任 hook。

## 本版本是什么

1.14.2 是 **命令元数据一致性补齐版**：为 `commands/td-*.md` 的 8 个命令文件补写 `user-invocable: false` frontmatter 字段。skill / command 正文 / references / hooks / 四处 manifest 的 name / description / author 全部不变，仅 version bump。

**为什么发**：AGENTS.md「命令文件编辑」条声明的命令文件 frontmatter 字段集包含 `name` / `description` / `args` / `user-invocable` / `disable-model-invocation`——此前 8 个 `td-*` 命令文件只声明了 `disable-model-invocation: true`，未同步补写 `user-invocable: false`。这是一致性遗漏（同一语义、另一字段），不影响 agent 加载行为或 slash 触发路径，但每次审核都会重复出现"补一下"的 diff，属典型"必须发版才能收口"的元数据债。

## 补了什么

### 8 个 `td-*` 命令 frontmatter 补写 `user-invocable: false`

`commands/td-apply.md` / `td-archive.md` / `td-explore.md` / `td-init.md` / `td-list.md` / `td-propose.md` / `td-reverse-spec.md` / `td-system-audit.md` 8 个文件，各在 `disable-model-invocation: true` 之后补一行 `user-invocable: false`。

两条字段并列形成完整的入口契约声明：

- `disable-model-invocation: true` —— agent 不自动触发；
- `user-invocable: false` —— 非 user 显式调用入口，仅 slash 命令可达。

## ⚠️ 行为变更

**无。** skill / command 正文 / references / hooks / 四处 manifest 的 name / description / author 均不变；`args` 字段、`description` 字段、命令正文、args 提示、agent 加载顺序、slash 触发路径、契约流（propose → apply → archive）全部零影响。

hook 命令串未变更（哈希不变），已 trust 的安装继续生效；不需要重新 trust。

## 升级步骤

1. **bump 版本**：四处清单的 `version` 已同步改为 `1.14.2`（根目录 `plugin.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / `package.json`，description 保持纯 ASCII 且四处完全一致）。
2. **运行时前置**：不变——Node.js ≥20.19.0；OpenSpec CLI ≥ 1.12。
3. **重新安装**（按平台）：
   - atomcode：`/plugin marketplace add <this-repo-url>` → `/plugin install total-design`
   - Claude Code：`claude plugin marketplace add <this-repo-url>` → `claude plugin install total-design`（或 `claude --plugin-dir <this-repo-path>`）
   - Pi Agent：`pi install git:<this-repo-url>`
4. **重新 trust**：**不需要**——本次 hook 命令串未变更（哈希不变），已 trust 的安装继续生效。全新安装按平台执行 `atomcode plugin trust total-design`。

## 验证

- 四处清单版本号同为 1.14.2，description 四处逐字一致。
- 8 个 `commands/td-*.md` 的 frontmatter 均含 `user-invocable: false`：`grep -l "^user-invocable: false" commands/td-*.md | wc -l` 应输出 `8`。
- 8 个 `commands/td-*.md` 的 frontmatter 均含 `disable-model-invocation: true`：`grep -l "^disable-model-invocation: true" commands/td-*.md | wc -l` 应输出 `8`。
- 命令正文与 `args` 字段未变：`git diff v1.14.1..v1.14.2 -- commands/` 每文件 diff 应只有 +1 行 `user-invocable: false`。
- skill 数量、命令数量、hook 命令串、td-* 契约流行为不变。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.14.2] 条目。
