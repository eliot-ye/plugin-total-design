# total-design v1.10.1 发布说明

> 面向使用态用户：升级前请先读「⚠️ 行为修正」与「升级步骤」。

## 本版本是什么

1.10.1 是 **修复版**：三处缺陷修复——触发列表去重 + propose 入口堵漏 + 待办池防污染。无新增 / 删除 skill 或命令，结构不变（17 个 skill + 8 个 command）。

- **触发列表去重**：td-* 命令与同名 skill 双重注册进 agent 触发列表——命令文件本是极薄 slash 入口，自动触发语义应由 skill 单一承载；修复后命令移出触发列表，slash 显式调用不受影响。
- **propose 堵漏**：tasks.md 必填项补「任务主体约束」，非编程性动作（人工 UAT 走查类）不再混进任务清单。
- **待办池防污染**：审计落池前先做候选资格判定，"已完成 change 的验收步骤"不再被当成 backlog 候选落进 `openspec/todo.md`。

## 本次修复

### td-* 命令与同名 skill 双重注册进触发列表（8 个命令文件）

缺陷：命令 description 与同名 skill 的 frontmatter description 同时进 agent 触发列表，同一逻辑名双重注册——agent 触发时命中两份等价指令，且命令侧枚举的触发场景与 skill 侧是两套口径。

修复：`/td-propose` / `/td-explore` / `/td-apply` / `/td-archive` / `/td-reverse-spec` / `/td-system-audit` / `/td-init` / `/td-list` 的 frontmatter 用 `disable-model-invocation: true` 替换 `argument-hint` 字段，命令移出自动触发列表；description 精简为一句核心描述，移除触发场景枚举与尾句句号。触发判断收敛到同名 skill 的 frontmatter description（单一承载），命令只是 slash 入口。

### td-propose 步骤 6.c 补「任务主体约束」必填项

tasks.md 必填项由「关键链标注 + project buffer」扩为「关键链标注、project buffer、任务主体约束」：每条 task 主体必须是 agent 能**编程性执行**的动作（写代码 / 跑测试 / 执行 CLI / 改配置等），非编程性动作（人工目测 / 用户验收 / 第三方审批 / 人工回归测试等）不得作为独立 task，必须降级为该 task 的 `验证` 字段。权威定义引用 `writing-plans/references/task-template.md`「任务主体约束」节。根因：propose 触发时 `writing-plans` 不进 system prompt（`user-invocable: false`），约束存在但未被预加载——使用态 LLM 填 OpenSpec 空 template 时按先验补出"手工 UAT 走查"类 task。本次只堵 propose 入口，`td-apply` 步骤 2 对称校验未同步（历史 tasks.md 走 apply 不被拦）。

### 审计落池候选资格判定（todo-pool + td-system-audit）

`todo-pool`「落池条目」子流程新增候选资格权威判定：落池条目必须是 **backlog 候选——想做、用户认可、但暂不排期的开发工作**。两类不落池：已交付内容的验收/验证手段（代码已写、测试已过——落池会把"已完成 change 的验收步骤"当成"未排期的开发工作"，污染候选池）、不可改写为可验证结果的问题陈述。`td-system-audit` 步骤 5 改为引用式前置判断：判定不适用 → 直接跳过，不向用户提出落池询问。

## ⚠️ 行为修正

| 缺陷 | 1.10.0 表现 | 1.10.1 修正 |
|---|---|---|
| 命令与 skill 双重注册触发列表 | agent 可按上下文自动触发命令文件，与同名 skill 重复命中 | 命令文件 `disable-model-invocation`：仅用户显式 `/td-*` 调用；agent 自动触发走同名 skill |
| 命令 description 与 skill 触发词两套口径 | 命令 description 含触发场景枚举、尾句带句号 | 一句核心描述；触发场景只在 skill frontmatter description |
| tasks.md 混入非编程性 task（td-propose 6.c） | 只查关键链标注 + buffer，人工 UAT 走查类 task 可能混入 | 必查任务主体约束：非编程性动作降级为 task 的 `验证` 字段，回 6.b 补写 |
| 审计落池污染待办池（td-system-audit 步骤 5） | 报告"建议的下一步动作"整体询问是否落池 | 先做候选资格判定；不适用直接跳过，不询问 |

**不改变的**：skill 数与结构（17 skill + 8 command）、td-* artifact 流（propose → apply → archive）、表 1/2/3 强度数值（`field-assessment` 单一事实源）、WIP 硬约束 + override 机制、5 个子约束执行规则、`requesting-code-review` 各节、hook 脚本与触发时机、`.td-state/` 持久化约定、四处 manifest 的 name / description / author——均不变。

## 升级步骤

1. **bump 版本**：四处清单的 `version` 已同步改为 `1.10.1`（根目录 `plugin.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / `package.json`，description 保持纯 ASCII 且四处完全一致）。
2. **运行时前置**：不变——Node.js ≥20.19.0（OpenSpec CLI 与 SessionEnd hook 共用）；OpenSpec CLI：`npm install -g @fission-ai/openspec@latest`。
3. **重新安装**（按平台）：
   - atomcode：`/plugin marketplace add <this-repo-url>` → `/plugin install total-design`
   - Claude Code：`claude plugin marketplace add <this-repo-url>` → `claude plugin install total-design`（或 `claude --plugin-dir <this-repo-path>`）
   - Pi Agent：`pi install git:<this-repo-url>`
4. **重新 trust**：本次 hook 命令串未变更（哈希不变），已 trust 的安装无需重新 trust；全新安装按平台执行 `atomcode plugin trust total-design`。
5. **验证**：
   - 四处清单版本号同为 1.10.1，description 四处逐字一致。
   - 触发列表去重：`grep -l "disable-model-invocation" commands/*.md | wc -l` 输出 `8`；`grep -rn "argument-hint" commands/` 无输出。
   - 任务主体约束存在：`grep -n "任务主体约束" skills/td-propose/SKILL.md` 有输出。
   - 候选资格判定存在：`grep -n "候选资格判定" skills/todo-pool/SKILL.md`、`grep -n "候选资格" skills/td-system-audit/SKILL.md` 均有输出。
   - skill 数与结构不变：`ls -d skills/*/ | wc -l` 输出 `17`。
   - 逻辑名/命令名/路径/CLI 命令/环境变量不变：`field-assessment` / `/td-propose` / `openspec list` / `$_TD_TIER` 等。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.10.1] 条目。
