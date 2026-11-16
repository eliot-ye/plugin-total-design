# AGENTS.md — total-design

> 装上它，你的 agent 就有了一个总体设计部。

## 项目身份

这是一个 **code agent skill plugin**，不是一个应用项目，也不是一个代码项目。

- **产出形态**：一组 Markdown 文件（`SKILL.md` / 命令文件）+ 四处 manifest + 一个 DSH bundle 包装层（`extensions/dsh/`）
- **运行方式**：atomcode / Claude Code / Pi Agent / DeepSeek Harness (DSH) 各自加载同一份 `skills/`。平台加载机制、安装路径、hook 支持差异见 [docs/maintainer/platforms.md](docs/maintainer/platforms.md)
- **除 DSH 薄包装层外没有可执行代码**：`extensions/dsh/index.mjs` 是唯一新增的 JS——约 152 行，只把 `skills/*/SKILL.md` 注册进 DSH 的 skill 注册表，无业务逻辑（`hooks/td_state_sync.js` 是原有的状态兜底脚本，不属新增）；其余"逻辑"都是 Markdown 指令
- **内容消费者**：这是 code agent skill plugin，需要考虑 SKILL 是否符合 LLM 的理解

**文档地图**（单一事实源，本文不复制细节）：

| 想知道 | 读 |
|---|---|
| 怎么装、怎么用 | [README.md](README.md) → [docs/user/install.md](docs/user/install.md) / [docs/user/usage.md](docs/user/usage.md) |
| 四个平台怎么加载 | [docs/maintainer/platforms.md](docs/maintainer/platforms.md) |
| manifest 字段、一致性、发版 | [docs/maintainer/manifests.md](docs/maintainer/manifests.md) |
| SKILL / 命令编写细节 | [docs/maintainer/content-authoring.md](docs/maintainer/content-authoring.md) |
| 为什么这样设计、依赖图谱、评估维度 | [docs/explanation/architecture.md](docs/explanation/architecture.md) |
| 使用态 LLM 审核四维清单 | [docs/explanation/review-standard.md](docs/explanation/review-standard.md) |

## 依赖图谱与分析

**任何对本仓库 LLM 文件的更改——无论改 SKILL.md、命令文件、还是 AGENTS.md 本身——动笔前必须先完成下列分析步骤，全部执行完才能开始改动。跳过这一步直接改 = 把局部失调注入系统。**

理由：18 个 skill 之间是真实依赖网络（一个 SKILL.md 引用另一个 skill 的逻辑名，等于声明运行时调用关系）。改一个 skill 可能触发一连串语义变化——`field-assessment` 被引用最多，blast radius 最大。当前图谱快照见 [docs/explanation/architecture.md](docs/explanation/architecture.md#依赖图谱)。

### 分析步骤（必须按序执行，每步产出可见证据）

1. **枚举改动目标**
   - 列出本次要改的文件清单（精确到文件路径）。
   - 对每个文件，写明改的是 frontmatter、某节正文、还是整文件重写。

2. **扫描被改 skill 的直接引用**
   - 对每个被改的 SKILL.md，用 `grep -oE '`(全部 skill 逻辑名以 | 连接)`' <file>` 提取它引用的其他 skill。
   - 产出：每个被改 skill 的"出边列表"（它调用了谁）。

3. **扫描反向引用（谁引用了被改 skill）**
   - 对每个被改 skill 的逻辑名，在 `skills/` 全树下 grep 该逻辑名，找出所有引用它的 SKILL.md。
   - 产出：每个被改 skill 的"入边列表" = blast radius。

4. **画出完整依赖图谱**
   - 把步骤 2 + 3 的边合并成有向图：节点 = skill 逻辑名，边 = `引用者 → 被引用者`。
   - 必须包含本次改动涉及的所有 skill 及其一度邻居，**用文本邻接表或 ASCII 图呈现**，不能口头描述。
   - 标注"热点节点"（入边最多的被改 skill）。

5. **判断改动是否触及契约边界**
   - 被改 skill 是否被 td-* 契约层 skill 引用？若是，需显式声明"这会改变 X skill 的 Y 行为，影响 td-propose/td-apply/... 的 Z 步"。
   - 被改 skill 是否在 `field-assessment` 表 1/表 2/表 3 里被引为强度来源？若是，需声明对 profile × tier 单一事实源的影响范围。

6. **写一句话风险评估**
   - 格式："本次改动的 blast radius 是 N 个 skill，其中 M 个是契约层，最大风险是 ……"

### 执行顺序的硬约束

- 步骤 1–6 是**前置门**，必须先产出图谱和风险评估，再动笔。
- 步骤 4 的图谱是**强制产出物**——没有图谱不许动笔；图谱必须可被另一个 agent 独立验证。
- 完成后回到图谱验证"实际影响范围与预估一致"。

## 三层结构

约束层 / 行为层 / 契约层自上而下：

- **约束层（constraints）** —— 钱学森系统工程主基调 + Brooks / Goldratt / 精益局部规律；局部优化不能制造全局失调。
- **行为层（skills）** —— Superpowers 转译的 explore→plan→TDD→review→verify 强制流程；触发式，不靠人盯。
- **契约层（commands）** —— OpenSpec 转译的 propose→apply→archive artifact 流；agree before you build。

约束层是第零层，是另外两层立起来的前提。`constraints` skill 承载 5 份局部规律 references，每份必须显式声明它服务 `system-engineering` 主基调的哪一条。展开见 [docs/explanation/architecture.md](docs/explanation/architecture.md#三层结构)。

## 目录结构

```
total-design/
├── .claude-plugin/          ← Claude Code / atomcode 加载清单（搜索顺序 .atomcode-plugin → .claude-plugin）
│   ├── marketplace.json
│   └── plugin.json
├── README.md                ← 用户入口（安装矩阵、命令与 skill 清单）
├── AGENTS.md                ← 本文件：开发 agent 的 always-on 规则
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE
├── .gitignore
├── plugin.json              ← Agent Plugins 1.0.0 跨平台元数据
├── package.json             ← Pi Agent + DSH 共用（pi.* 与 dsh.bundle.patch）
│
├── skills/                  ← 18 个 skill（变体在 field-assessment/references/ 与 constraints/references/）
├── commands/                ← 8 个 command（仅 atomcode / Claude Code 加载）
├── extensions/pi-agent/     ← Pi extension（/td-* 桥 + session_shutdown 兜底）
├── extensions/dsh/          ← DSH bundle 包装层（patch + skill provider + 安装说明）
│   ├── index.mjs
│   ├── cordis.patch.yml
│   └── README.md
├── hooks/                   ← SessionEnd 状态兜底（仅 atomcode / Claude Code）
│   ├── hooks.json
│   └── td_state_sync.js
│
└── docs/                    ← 深水区文档（user / maintainer / explanation）
```

## 编辑规则

**SKILL 的编写视角应该以使用态的 LLM 为主。**

**首先完成 `## 依赖图谱与分析`，探索给出修改方案给用户确认，用户确认后才能进行编辑。**

### SKILL.md 编辑

**skills 目录内只能保留使用态文本；开发态文本说明可以写到 docs 目录内。**

每个 `SKILL.md` 必须有以下结构：

```markdown
---
name: <skill-name>
description: <一句话描述，会进 system prompt>
user-invocable: true | false
argument-hint: <参数提示>          ← 仅 user-invocable: true 的命令式 skill 需要
disable-model-invocation: true     ← 可选；禁止 agent 自动触发，与 user-invocable 兼容
---

# <Skill Title>

## 依赖技能       ← 如果 skill 依赖其他 skill 必须有此节

## 服务的主基调原则       ← 约束层 + 契约层 skill 必须有此节

<正文>
```

字段表、命名规则、目录 vs 扁平布局、各平台字段容忍度差异见 [docs/maintainer/content-authoring.md](docs/maintainer/content-authoring.md)。

**`## 依赖技能` 节的语义定义：**

此节列出的是 skill 在会话级**必须提前加载到上下文**的依赖技能。运行时按需触发/调用的技能**不列入此节**——它们在正文流程的特定步骤里按条件触发。

判定依据（与 `td-* 标准步骤 1` 的"预加载 vs 按需触发"分界一致）：

- **预加载（应列入）**：触发时立即需要其内容作为前提（如 `system-engineering` 主基调四条、`field-assessment` 的 profile×tier 识别 + 表 1/2/3 强度值）。
- **按需触发（不列入）**：在正文流程的特定步骤触发（如 td-apply 前置检查的 `wip-limit` 硬阻塞、td-apply 步骤 5 的 `brooks-law` 提醒、`requesting-code-review` 的架构 review）。正文引用处给出路径即可。

**constraint references 变体的列入判据**：references 变体本身不是 skill、不独立触发，随 `constraints` 入口读取；列入时按同一判据——正文执行逻辑需要以该变体规则作为判定前提 → 列入；只是固定步骤的检查点 → 不必列入，正文给出变体路径。

违反此定义 = 把运行时调用关系误当预加载关系，会造成使用态 LLM 误以为必须预加载，混淆分界。

**必须有 `## 服务的主基调原则` 一节的 skill：**

- 约束层 1 个 `constraints` skill（承载 5 份 references：`wip-limit` / `critical-buffer` / `brooks-law` / `delay-decision` / `human-in-loop`）——必须显式声明每份局部规律服务 `system-engineering` 的哪一条；5 份 references 各自也必须有此节
- 契约层 7 个 td-* skill —— 同上

`system-engineering` 自己是主基调本身，不需要这一节。行为层 / 配置层 skill 可选。

### SKILL 不可引用 AGENTS 文件

**任何 `SKILL.md` 的正文或 frontmatter 都不得引用 `AGENTS.md`、`CLAUDE.md`、`.atomcode.md` 等 agent 指令文件——无论是路径、文件名还是"见 AGENTS.md"之类的指向。**

理由：

- AGENTS.md 是给**本仓库开发 agent** 看的元指令，不是 plugin 的运行时资产；装了 plugin 的用户 agent 不会读它。
- SKILL.md 一旦出现 `AGENTS.md` 字样，等于把只对仓库内部生效的约定泄漏给下游 agent。
- 多平台扩展时（`.claude/` / `.codex/` 等），该路径不保证存在，引用会变成死链。

**对象性豁免（操作对象 ≠ 权威引用）**：当 skill 的职责就是操作**用户项目**的 agent 指令文件（如 `agents-md-hygiene`）时，文件名以操作对象身份出现是合法的。判据：该提及是当作规则来源（禁止），还是当作被处理的数据（允许）。对象性提及必须同时满足：① 指用户项目中的同名文件；② 不从该文件引入任何规则，只描述对它的操作。

执行细则：正文需要说明编辑规则时用一句话自包含描述；约束层 / 契约层 skill 的「服务的主基调原则」直接陈述服务哪一条，不指向 AGENTS.md；发现现有 SKILL.md 有引用视为 bug，转译时删掉。

### SKILL 与 references 禁止开发态语句

**运行时资产（`SKILL.md` + `references/`）不得包含面向仓库编辑者而非使用态 LLM 的语句。** 判据：这段文本是否服务使用态 LLM 的执行决策——不服务即为开发态泄漏，出现即删。三类典型形态：

- **编辑指令**："只改本文件""不重复定义数值""由三处合并而来"——约束的是改仓库的人怎么写文件。
- **调用方清单**："被三层防护的三处引用""`td-system-audit` / `executing-plans` 引用本文件"——依赖图文档；使用态 LLM 知道还有谁引用不改变其执行决策，且清单必然腐烂。
- **写作规范**："下游引用只指'表 X 的 Y 行'""不必在正文重复这条约定"——写作约定归开发文档，不进运行时资产。

**允许保留的相近形态**：冲突仲裁句（"与其它位置的强度表述冲突时以本表为准"）、运行时指针（"完整语义见 X 步骤，此处不重复"）、入口契约（"触发方：`td-explore` 步骤 7（已征得用户同意 → 执行）"）。

执行细则：改写时保留仲裁语义，只删编辑指令与调用方清单；"谁引用本文件"类信息写进 [docs/explanation/architecture.md](docs/explanation/architecture.md#依赖图谱)。

### 命令文件编辑

命令文件位于 `commands/`，文件名 = 命令名（扁平 kebab-case，无冒号）。

```markdown
---
name: <command-name>
description: <一句话描述>
args: none|option|required
---

# <command-name>

**立刻调用 `<command-name>` skill，参数 `$ARGUMENTS`。**
```

7 个命令文件（`td-propose` / `td-explore` / `td-apply` / `td-reverse-spec` / `td-archive` / `td-system-audit` / `td-init`）遵循这个极薄模板——命令只是 slash 入口，逻辑在同名 skill。

**例外：`td-list`**——只读命令（`openspec list`），无同名 skill，逻辑直接写在命令文件里，不遵循极薄模板。

命令文件仅 atomcode / Claude Code 加载；Pi / DSH 的命令入口由 extension 或 `/名称` 手势提供，见 [docs/maintainer/platforms.md](docs/maintainer/platforms.md)。

### Manifest 编辑

**一致性硬约束**：四处清单中描述本 plugin 的 `name` / `version` / `description` 必须完全一致（`marketplace.json` 取 `plugins[0]` 条目；其顶层 `name`/`description` 是 marketplace 自身身份，不必一致），version bump 时同步；`description` 保持纯 ASCII。

字段清单、合法 schema、Agent Plugins 1.0.0 约束、DSH 不新增清单的原因、自检命令见 [docs/maintainer/manifests.md](docs/maintainer/manifests.md)。

### 版本发布流程

**版本号是否 bump 是发布决策，不是改动的自动后果**——改 SKILL.md / 命令文件 / 文档不默认要求 bump；只有决定发布新版本时才 bump。

决定 bump 时，四处清单的 `version`、`CHANGELOG.md`（顶部新增当前版本条目）、`RELEASE_NOTES.md`（更新为当前版本说明）必须在**同一个逻辑变更**内完成，不允许只 bump 不更新发布文档。详细格式见 [docs/maintainer/manifests.md](docs/maintainer/manifests.md#发布流程version-bump-与发布文档同步)。

## 使用态 LLM 视角审核标准

**任何对本仓库内容资产（SKILL.md / 命令文件 / references）的审核——周期性自审、发布前审、修复前审——必须以使用态 LLM 的视角按四个维度检查，并产出可验证的审核报告。审核是改动的前置门。**

- **使用态 LLM 视角**是审核的前提：它只预先看到 description，正文触发后按需加载。先代入读取体验，再跑清单。
- **四维度**：① 逻辑冲突（强度单一事实源、权威流程单一编排、跨 skill 引用、数字一致性）② 语义重复 / 模糊 ③ 可精简（含仪式性内容）④ 开发态描述泄漏。
- **验收**：四维度全部跑完；"逻辑冲突"零残留、"开发态泄漏"零残留、"触发歧义"零残留；其余按类别修复后重跑确认。

完整检查清单、审核前置检查面、报告模板与防复发规则见 [docs/explanation/review-standard.md](docs/explanation/review-standard.md)。

## 设计原则

### 1. 钱学森系统工程主基调是第零层

所有 constraint 都在系统工程框架下生效。每条局部规律（Brooks / Goldratt / 精益）都要显式声明它服务主基调的哪一条。

### 2. profile × tier 二维配置

profile（greenfield / brownfield / maintenance）× tier（small / medium / large），以 `field-assessment` 的 references 变体文件形态存在，agent 现场判读后按需读取命中的 profile 一份 + tier 一份。

**冲突优先级**：profile 与 tier 强度冲突时**以 tier 为准**——tier 决定约束强度与流程重量，profile 只决定流程侧重，不改变强度。最终强度以 `field-assessment` 表 1/表 2/表 3 为单一事实源。

### 3. 触发式而非 hook 强制

skill 靠 agent 根据上下文判读触发，不靠 hook 强制。

**例外——状态持久化 hook**：`hooks/td_state_sync.js` 是唯一允许的 hook（`SessionEnd`），只在会话结束时从文件系统事实校正 `.td-state/` 状态文件，不做流程强制。各平台 hook 支持差异见 [docs/maintainer/platforms.md](docs/maintainer/platforms.md#总表)；哲学与状态机制见 [docs/explanation/architecture.md](docs/explanation/architecture.md#3-触发式而非-hook-强制)。

### 4. 不原样照搬 Superpowers / 不重新实现 OpenSpec CLI

转译而非搬运：方法论内核保留但去掉其 plugin / marketplace 引用；OpenSpec 的方法论转译为 slash command，CLI 功能仍调用外部 `openspec` 命令，不在命令文件里重实现。

### 5. 设计变更评估维度（动笔前的强制评估）

**任何为本 plugin 新增能力 / skill / 命令 / 流程分支的设计讨论，在拍板执行前必须产出「重量 / 价值 / 代价」三维度评估。** 这是「依赖图谱与分析」之后的第二道前置门：图谱回答"改动会波及谁"，本节回答"重量与净收益是否匹配"。

产出格式固定为五节：**重量（量化表，禁止定性）/ 价值（按场景分解，标注工程痛点 vs 生态对齐）/ 代价（分级）/ 风险不对称性（判定）/ 结论（做 / 不做 / 缩窄范围做）**。

各节的测量口径、价值来源判据、风险不对称性论证要求见 [docs/explanation/architecture.md](docs/explanation/architecture.md#5-设计变更评估维度)。

## 命名约定

- **skill 名**：kebab-case，无冒号
- **命令名**：`td-<verb>` 或 `td-<noun>`，扁平 kebab-case
- **文件名**：`SKILL.md`（目录式；本 plugin 18 个 skill 全部采用）或 `<name>.md`（扁平 legacy）
- **主基调 skill**：`system-engineering`，不单独触发（`user-invocable: false`）
- **skill body 内引用其他 skill 用逻辑名**（如 `constraints`、`field-assessment`），由当前平台的加载器拼前缀（atomcode 下为 `total-design:<name>`）——这是多平台扩展的关键设计。frontmatter 不写 `aliases`。子约束以 `constraints` 的 `references/<name>.md` 变体形式存在，引用时写逻辑名 + 变体路径

各平台的命名校验规则（atomcode 的字符集 / 长度限制等）见 [docs/maintainer/content-authoring.md](docs/maintainer/content-authoring.md#命名规则)。

### td-* skill 标准步骤 1

7 个 td-* skill 的 body 必须自包含书写此序列（SKILL.md 禁止引用 AGENTS.md）。此序列也定义"预加载 vs 按需触发"的分界。**只注入强度不做判断**：

1. **`system-engineering`** —— 主基调四条进入上下文。各 td-* skill 在这一条后补自己的注解。
2. **profile × tier 识别** —— 调用 `field-assessment` 的「识别流程」节，判读 `$_TD_PROFILE` / `$_TD_TIER`，把表 1 + 表 2 + 表 3（仅 archive/apply 需要）读入上下文。会话内缓存。
3. **其余 constraint**（`constraints` 承载的 5 个局部规律 references）—— 只把 `field-assessment` 的强度值读入上下文，**不在步骤 1 判断是否触发**。"是否触发"是步骤 2 的事。

## commit 风格

使用 conventional commits：

- `feat: add wip-limit skill`
- `fix: correct brooks-law trigger condition`
- `docs: update README installation steps`
- `refactor: reorganize constraints directory`

## 不做的事

- **不做 plugin 内的 spec 系统**：OpenSpec 本身是独立 CLI，本 plugin 转译方法论不重新实现 CLI
- **不做静态配置文件**：profile × tier 不用 yaml 配置，全部以 `field-assessment` skill（SKILL.md + references 变体）形态存在
- **不原样照搬 Superpowers 的 SKILL.md**：转译时去掉其 plugin 引用、marketplace 引用
- **不在 DSH 端重实现 commands / hook**：DSH 无 commands 目录加载、无 `hooks.json` 加载器；`/td-*` 由 user-invocable skill 的 `/名称` 手势承载

## 参考

- **OpenSpec**：https://github.com/Fission-AI/OpenSpec
- **Superpowers**：https://github.com/obra/superpowers
- **钱学森系统工程**：系统工程论《创建系统学》《工程控制论》
