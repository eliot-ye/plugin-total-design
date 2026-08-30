# AGENTS.md — total-design

> 装上它，你的 agent 就有了一个总体设计部。

## 项目身份

这是一个 **atomcode plugin**，不是一个应用项目，也不是一个代码项目。

- **产出形态**：一组 Markdown 文件（`SKILL.md` / 命令文件）+ 一个 `plugin.json` manifest（.atomcode-plugin/plugin.json）
- **运行方式**：用户通过 atomcode marketplace 安装本 plugin，装上后 agent 自动加载 skills 和 commands
- **没有可执行代码**：所有"逻辑"都是 Markdown 指令，由 agent 读取并执行
- **内容消费者**：这是 code agent skill plugin，需要考虑 SKILL 是否符合 LLM 的理解

## 依赖图谱与分析

**任何对本仓库LLM文件的更改——无论改 SKILL.md、命令文件、还是 AGENTS.md 本身——动笔前必须先完成下列分析步骤，全部执行完才能开始用户要求的改动。跳过这一步直接改 = 把局部失调注入系统。**

理由：本 plugin 的 18 个 skill 之间是真实依赖网络（一个 SKILL.md 引用另一个 skill 的逻辑名，等于声明运行时调用关系）。改一个 skill 可能触发一连串 skill 的语义变化——`field-assessment` 被引用最多，它的改动 blast radius 最大。不先摸清依赖就改，等于在总体设计部不知情的情况下动了分系统。

### 分析步骤（必须按序执行，每步产出可见证据）

1. **枚举改动目标**
   - 列出本次要改的文件清单（精确到文件路径）。
   - 对每个文件，写明改的是 frontmatter、某节正文、还是整文件重写。

2. **扫描被改 skill 的直接引用**
   - 对每个被改的 SKILL.md，用 `grep -oE '`(全部 skill 逻辑名以 | 连接)`' <file>` 提取它引用的其他 skill。
   - 产出：每个被改 skill 的"出边列表"（它调用了谁）。

3. **扫描反向引用（谁引用了被改 skill）**
   - 对每个被改 skill 的逻辑名，在 `skills/` 全树下 grep 该逻辑名，找出所有引用它的 SKILL.md。
   - 产出：每个被改 skill 的"入边列表"（谁调用了它）= blast radius。

4. **画出完整依赖图谱**
   - 把步骤 2 + 步骤 3 的边合并成有向图：节点 = skill 逻辑名，边 = `引用者 → 被引用者`。
   - 图谱必须包含本次改动涉及的所有 skill 及其一度邻居，**用文本邻接表或 ASCII 图呈现，不能用口头描述代替**。
   - 标注本次改动的"热点节点"（入边最多的被改 skill = blast radius 最大）。

5. **判断改动是否触及契约边界**
   - 检查被改 skill 是否被 td-* 契约层 skill 引用——若是，改动可能影响 OpenSpec artifact 流的运行时语义，需在改动前显式声明"这会改变 X skill 的 Y 行为，影响 td-propose/td-apply/... 的 Z 步"。
   - 检查被改 skill 是否在 `field-assessment` 的表 1/表 2/表 3 里被引用为强度来源——若是，改动可能改变 profile × tier 配置层的单一事实源，需声明影响范围。

6. **写一句话风险评估**
   - 基于图谱和契约边界判断，写明："本次改动的 blast radius 是 N 个 skill，其中 M 个是契约层，最大风险是 ……"

### 执行顺序的硬约束

- 步骤 1–6 是**前置门**，不是"改完再补"的文档。必须先产出图谱和风险评估，再开始 edit_file / write_file。
- 步骤 4 的图谱是**强制产出物**——没有图谱不许动笔。图谱可以用文本邻接表（`A → B, C` 一行一节点）或 ASCII 有向图，但必须有可被另一个 agent 独立验证的结构。
- 完成步骤 6 后，agent 才能开始用户要求的改动，并在改动完成后回到图谱验证"实际影响范围与预估一致"。

## 三层结构

```
┌─────────────────────────────────────────────────────────────┐
│  约束层（constraints）                                      │
│  钱学森系统工程主基调 + Brooks/Goldratt/精益局部规律        │
│  ← 每个局部动作从整体性能反推；局部优化不能制造全局失调    │
├─────────────────────────────────────────────────────────────┤
│  行为层（skills）                                           │
│  Superpowers 转译：brainstorming→plan→TDD→review→verify     │
│  ← 强制流程，触发式不靠人盯                                 │
├─────────────────────────────────────────────────────────────┤
│  契约层（commands）                                         │
│  OpenSpec 转译：propose→apply→archive 的 artifact 流        │
│  ← agree before you build，人和 AI 先对齐建什么             │
└─────────────────────────────────────────────────────────────┘
```

约束层是第零层——是另外两层立起来的前提。`constraints` skill 承载 5 份局部规律 references，每份 references 必须显式声明它服务钱学森系统工程主基调的哪一条。

## 目录结构

```
total-design/
├── .atomcode-plugin/
│   ├── marketplace.json
│   └── plugin.json
├── README.md
├── AGENTS.md                ← 本文件
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE
├── .gitignore
│
├── skills/                  ← 18 个 skill（profile/tier 变体在 field-assessment/references/ 下；5 个局部规律变体在 constraints/references/ 下）
├── commands/                ← 8 个 command
│
└── hooks/                   ← 1 个 hook：状态持久化兜底（SessionEnd 事件）
    ├── hooks.json           ← hook 声明（plugin.json 的 "hooks" 字段指向本文件）
    └── td_state_sync.py     ← 会话结束时从文件系统事实校正 .td-state/ 状态文件
```

## 编辑规则

**SKILL 的编写视角应该以使用态的LLM为主。**

**首先完成 `## 依赖图谱与分析`，探索给出修改方案给用户确认，用户确认后才能进行编辑**

### SKILL.md 编辑

**skills 目录内只能保留使用态文本；开发态文本说明可以写到 docs 目录内**

每个 `SKILL.md` 必须有以下结构：

```markdown
---
name: <skill-name>
description: <一句话描述，会进 system prompt>
user-invocable: true | false
argument-hint: <参数提示>          ← 仅 user-invocable: true 的命令式 skill 需要
disable-model-invocation: true     ← 可选；禁止 agent 自动触发，与 user-invocable: true 兼容（前者禁自动，后者允许显式调用）。本字段合法性待 atomcode 官方文档确认；若 loader 不识别，本字段会被忽略，不影响 user-invocable 语义
---

# <Skill Title>

## 依赖技能       ← 如果 skill 依赖其他 skill 必须有此节

## 服务的主基调原则       ← 约束层 + 契约层 skill 必须有此节

<正文>
```

**`## 依赖技能` 节的语义定义：**

此节列出的是 skill 在会话级**必须提前加载到上下文**的依赖技能（即使用态 LLM 触发本 skill 时，需要已在上下文中的技能）。运行时按需触发/调用的技能**不列入此节**——它们在正文流程的特定步骤里按条件触发，不属于预加载。

判定依据（参考 `td-* 标准步骤 1` 的"预加载 vs 按需触发"分界）：

- **预加载（应列入）**：skill 触发时立即需要其内容在上下文中作为前提（如 `system-engineering` 主基调四条、`field-assessment` 的 profile×tier 识别 + 表 1/2/3 强度值）。
- **按需触发（不列入）**：在正文流程的特定步骤触发（如 td-apply / td-propose 前置检查流程的 `wip-limit` 硬阻塞检查、td-apply 步骤 5 流程的 `brooks-law` 提醒、`requesting-code-review` 的架构 review、`executing-plans` 的任务执行）。这些的触发时机由正文流程逻辑决定，正文引用处给出路径，依赖节不必列入。

**constraint references 变体文件的列入判据**：constraint references 变体（如 `constraints` 的 `references/human-in-loop.md`）本身不是 skill、不独立触发，随 `constraints` 入口读取；列入 `## 依赖技能` 节时按此判据——本 skill 的正文执行逻辑在触发时需要以该变体的规则作为判定前提（如 TDD 正文需用 `human-in-loop` 的必停场景判定 spec 契约冲突、`writing-plans` 需用 `critical-buffer` 的标注规范）→ 列入；约束检查只是正文流程固定步骤的检查点（如 td-apply 步骤 2 前置检查的 WIP 硬阻塞）→ 不必列入，正文引用处给出变体路径即可。

违反此定义 = 把运行时调用关系误当预加载关系列入依赖节，会造成使用态 LLM 在触发本 skill 时误以为必须预加载这些技能，混淆"预加载 vs 按需触发"的分界。

**必须有 `## 服务的主基调原则` 一节的 skill：**

- 约束层 1 个 `constraints` skill（承载 5 个局部规律 references：`wip-limit` / `critical-buffer` / `brooks-law` / `delay-decision` / `human-in-loop`）—— `constraints` skill 必须显式声明它承载的每个局部规律服务 `system-engineering` 主基调的哪一条；5 份 references 各自也必须有 `## 服务的主基调原则` 一节
- 契约层 7 个 td-* skill —— 同上

`system-engineering` 自己是主基调本身，不需要这一节。行为层 / 配置层 skill 可选这一节，但写了更清晰。

### SKILL 不可引用 AGENTS 文件

**任何 `SKILL.md` 的正文或 frontmatter 都不得引用 `AGENTS.md`、`CLAUDE.md`、`.atomcode.md` 等 agent 指令文件——无论是路径、文件名还是"见 AGENTS.md"之类的指向。**

理由：

- AGENTS.md 是给**本仓库的开发 agent** 看的元指令，不是 plugin 的运行时资产。装上 plugin 的用户 agent 不会读这个仓库的 AGENTS.md。
- SKILL.md 一旦出现 `AGENTS.md` 字样，等于把一份只对仓库内部生效的约定泄漏给下游 agent，造成歧义。
- 多平台扩展时（同步到 `.claude/` / `.codex/` 等），AGENTS.md 路径不保证存在，引用会变成死链。

执行细则：

1. SKILL.md 正文需要说明编辑规则时，改用一句话自包含描述，不写"见 AGENTS.md"。
2. 约束层 / 契约层 skill 的 `## 服务的主基调原则` 一节，直接陈述它服务钱学森系统工程主基调的哪一条，不指向 AGENTS.md。
3. 若发现现有 SKILL.md 里有对 AGENTS.md 的引用，视为 bug，转译时删掉。

### SKILL 与 references 禁止开发态语句

**运行时资产（`SKILL.md` 正文/frontmatter + `references/`）不得包含面向仓库编辑者而非使用态 LLM 的语句。** 判据：这段文本是否服务使用态 LLM 的执行决策——不服务即为开发态泄漏，出现即删。三类典型形态：

- **编辑指令**："只改本文件""不重复定义数值""由三处合并而来""避免重复校验逻辑"——约束的是改仓库的人怎么写文件。
- **调用方清单**："被三层防护的三处引用""`td-system-audit` / `executing-plans` 引用本文件"——依赖图文档。使用态 LLM 是被某个调用方指引来的，知道还有谁引用不改变其执行决策；且清单必然随结构演化腐烂（实例：`audit-frequency.md` 的"3 个 tier skill"在 1.6.0 收拢后即失实）。
- **写作规范**："下游引用只指'表 X 的 Y 行'""不必在正文重复这条约定""本节是约定的单一锚点"——写作约定归 AGENTS.md / docs 门记录，不进运行时资产。

**允许保留的相近形态**（勿误删）：

- **冲突仲裁句**："与其他位置的强度表述冲突时，以本表为准"——服务运行时判定谁说了算。
- **运行时指针**："完整语义见 X 步骤，此处不重复"——告诉 LLM 这里没有展开、去哪读。
- **入口契约**："触发方：`td-explore` 步骤 7（调用方已征得用户同意 → 执行）"——子流程的执行条件输入。

执行细则：改写时保留仲裁语义，只删编辑指令与调用方清单；"谁引用本文件"类信息写进 docs 门记录或本文件的依赖图谱节。

### 命令文件编辑

命令文件位于 `commands/`，文件名 = 命令名（扁平 kebab-case，无冒号，atomcode 规则）。

每个命令文件必须有 frontmatter：

```markdown
---
name: <command-name>
description: <一句话描述>
args: none|option|required
---

# <command-name>

**立刻调用 `<command-name>` skill，参数 `$ARGUMENTS`。**       ← 如果 args 是 none，可以不需要下半句
```

7 个命令文件 (`td-propose` / `td-explore` / `td-apply` / `td-reverse-spec` / `td-archive` / `td-system-audit` / `td-init`) 都遵循这个极薄模板——命令只是 slash 入口，真正的逻辑在同名 skill (`skills/<td-*>/SKILL.md`) 里。这样同一份逻辑既能被 slash command 触发，也能被 agent 自动触发。

**例外：`td-list`**——只读命令（`openspec list` 列活跃 change），无同名 skill，逻辑直接写在命令文件里，不遵循极薄模板。它不需要被 agent 自动触发（只是查询入口），故不为其建 skill。

### plugin.json 编辑

manifest 文件位于 `.atomcode-plugin/plugin.json`，被 atomcode 使用。

- 只接受 JSON（不接受 YAML）
- 合法字段：`name` / `version` / `description` / `skills` / `commands` / `hooks`
- **`skills` / `commands` 字段是路径数组**，本 plugin 用 `["./skills"]` / `["./commands"]`，加载器会自动递归发现所有 `SKILL.md` 和命令文件
- **没有 `constraints` / `profiles` / `tiers` 字段**——这些必须以 skill 形态存在

### 版本发布流程（version bump 与发布文档同步）

**任何 `version` 变更（`plugin.json` + `marketplace.json` 同步 bump）必须与 CHANGELOG.md、RELEASE_NOTES.md 的更新在同一个逻辑变更内完成**——不允许只 bump 版本不更新发布文档。三者版本号必须一致（版本号只在 `plugin.json` + `marketplace.json` 两处定义，description 保持纯 ASCII）。

- **CHANGELOG.md**：按 Keep a Changelog 格式在文件顶部新增当前版本条目（最新在上），按 Fixed / Changed / Docs 等类别记录；历史条目只读，不修改（过时的"发布提示"类临时标注可更新为已结清状态，但不改动已发布的变更记录）。
- **RELEASE_NOTES.md**：更新为当前版本发布说明——本版本定位（新增/修复/重构版）、行为变更表（升级用户感知的差异）、升级步骤（bump 版本号同步）、完整变更列表指向 CHANGELOG 对应条目。

## 使用态 LLM 视角审核标准

**任何对本仓库内容资产（SKILL.md / 命令文件 / references）的审核——周期性自审、发布前审、修复前审——必须以使用态 LLM 的视角按下列四个维度检查，并产出可验证的审核报告。** 审核是改动的前置门：发现问题按类别整理，进入「依赖图谱与分析」门禁后修复。

**"使用态 LLM 视角"是审核的前提，不是四个维度之一**：审核者必须先代入使用态 LLM 的读取体验，再跑四维度清单。使用态 LLM 指装了本 plugin 的 agent——它**只预先看到每个 skill 的 frontmatter description**（进 system prompt，是它判断何时触发的唯一依据），**正文在触发后按需加载**，工作流从 slash 命令进入。因此每个检查都要问"使用态 LLM 读到这段文本会怎么理解、会触发哪个 skill、孤立加载能否执行、会不会断链"，**而不是问"这段文本是否符合仓库内部规范"**。四维度是检查工具，不是审核本身——先有视角，再跑工具；只跑清单不代入视角 = 开发态审核，不是使用态审核。

### 审核前置

1. 审核对象 = 使用态 LLM 实际会读到的文本：frontmatter + 正文 + references/ + 命令文件。
2. **使用态 LLM 视角的具体检查面**（四维度之前先跑，发现即修）：
   - **触发语义**：description 触发词是否清晰、无歧义、不与其他 skill 重叠冲突？重叠场景下使用态 LLM 会触发哪个 skill（如 brainstorming 与 td-explore 都管"需求不清"）？`user-invocable` / `disable-model-invocation` 语义是否正确（决定自动触发 vs 显式调用）？
   - **正文自包含性**：正文孤立加载能否执行？"见 X 的「Y」节"类引用的锚点是否真实存在（grep 验证）？依赖技能节与正文实际引用一致（不漏列/多列）？
   - **入口链**：slash 命令 → 同名 skill 转发是否无缝（命令文件"立刻调用"目标存在）？只读命令例外（td-list）是否清晰？

### 维度 1：逻辑冲突

- **强度单一事实源一致性**：constraint / tier / profile skill 正文的强度表述（"必须强制""上限 N""X% buffer""显式确认才继续"）是否与 `field-assessment` 表 1 / 表 2 / 表 3 一致？正文写死数值或无条件强度断言而表 1 是另一套 = 冲突；修正方向：正文改引用式（"按表 1 的 X 行取值"）或补 tier 分支。
- **权威流程单一编排**：同一流程（如 WIP override 回路）是否只由一个 references 持有编排（`constraints/references/wip-limit.md`）？其他 skill 描述时必须"指向权威"，复述简化版漏环节 = 冲突。
- **跨 skill 触发/引用一致性**：skill 的「触发时机」与权威触发方（如 `td-system-audit` 步骤 6 映射表）互相匹配？依赖技能节与正文实际引用一致（不漏列/多列）？
- **数字一致性**：跨 skill 同一概念的数字（"失败 2 次 vs 3 次""每完成 N 个 change"）口径统一或显式说明关系？

### 维度 2：语义重复 / 模糊

- **同一事实多处定义**：强度、频率、流程、概念（"模型载体""核心论点归位"）多处重复定义时，一处为权威，其余应为引用/强调，不能各自展开到无法判断谁为准。
- **无条件 vs 分层限定**：profile / tier 的"特殊规则"带分层限定；正文无条件断言 vs 表 2 的 tier 列限定 = 模糊。
- **示例与表格不一致**：正文举例（如 `constraints/references/human-in-loop.md` 的 profile 加成举例）与表 2 实际单元格一致（含 tier 限定）。
- **重复段落**：多文件逐字重复的段落（如 3 profile 的「在各 tier 下的 constraint 强度」节、3 tier 的「判断依据」节）收敛为单一权威 + 引用。

### 维度 3：可精简

- 同一概念在两个以上 skill 各写完整解释（《工程控制论》归位段、config.yaml 引导流程）→ 收敛为"权威在 X，此处引用"。
- 同一文件内重复节（如 `constraints/references/critical-buffer.md` 的「按 tier 调整」与「规则」节）→ 合并。
- 每段文本应服务使用态 LLM 的执行决策；纯概念/背景重复可删或移往一处。

### 维度 4：开发态描述内容

出现即视为泄漏：

- **AGENTS 文件引用**：SKILL.md 出现 `AGENTS.md` / `CLAUDE.md` / `.atomcode.md`（见「SKILL 不可引用 AGENTS 文件」）。
- **开发态语句**：正文/references 出现编辑指令（"只改本文件"类）、调用方清单（"被 X 引用"类）、写作规范（"下游引用只指…"类）——判据、允许形态与执行细则见「SKILL 与 references 禁止开发态语句」节。
- **Superpowers 残留**：Superpowers 技能名（如 `dispatching-parallel-agents`）、"Superpowers" 字样、其 plugin/marketplace 引用。
- **Claude Code 工具名**：正文写死 `AskUserQuestion` / `TodoWrite` 等平台工具名 → 改平台无关表述（"询问用户"/"任务跟踪工具"）。
- **平台命名表 / plugin 前缀**：body 残留平台命名表、`total-design:<name>` 调用名、marketplace 路径。

### 审核产出物与验收标准

- 审核报告必须含：审核对象版本标注、**使用态 LLM 视角检查面结果（触发语义 / 自包含性 / 入口链）**、四维度检查结果（每项通过/违反 + 文件:行号:原文）、按类别整理的问题清单、一句话风险评估。
- **验收标准（闭环收敛判据）**：使用态 LLM 视角检查面 + 四维度全部跑完；"逻辑冲突"零残留、"开发态描述内容"零残留、"触发歧义"零残留；"语义重复/模糊"与"可精简"按类别修复后重跑确认。不满足则"审核→修复"循环不收敛，问题必然换形式回来。
- **防复发**：修复按类别做、不按实例做；可脚本化的检查项（禁用词表等）固化进文档供每次审核复用；每次审核先自问"我代入使用态 LLM 的读取体验了吗"，没代入就先别跑清单。

## 设计原则

### 1. 钱学森系统工程主基调是第零层

所有 constraint 都在系统工程框架下生效。每条局部规律（Brooks / Goldratt / 精益）都要显式声明它服务主基调的哪一条。

### 2. profile × tier 二维配置

- **profile**（仓库状态）：greenfield / brownfield / maintenance
- **tier**（系统复杂度）：small / medium / large

两个维度以 `field-assessment` 的 `references/` 变体文件形态存在（3 profile + 3 tier），agent 现场判读后按需读取命中的 profile 一份 + tier 一份（共 2 份）。

**冲突优先级**：profile 与 tier 强度冲突时，**以 tier 为准**——tier 决定约束强度与流程重量（"不强求重流程"这类松绑优先），profile 只决定流程侧重（入口动作、TDD 边界、special rules），不改变强度。profile 的"默认激活的层"强度描述是默认值，最终强度以 `field-assessment` 表 1/表 2/表 3 为单一事实源。

### 3. 触发式而非 hook 强制

Superpowers 的"触发式"哲学保留：skill 靠 agent 根据上下文判读触发，不靠 hook 强制。

**例外——状态持久化 hook**：`hooks/td_state_sync.py` 是唯一允许的 hook（`SessionEnd` 事件）。它不做任何流程强制，只在会话结束时从文件系统事实校正 `.td-state/` 状态文件（`archive-counter.yaml` 按 `archive/` 目录重算、`audit-history.yaml` 补缺失报告记录）——这是"防 agent 漏写状态"的兜底，不是流程门禁，与触发式哲学不冲突。

atomcode hooks schema（与 Claude Code 兼容，官方文档核实）：plugin.json 的 `hooks` 字段接受路径字符串（本 plugin 用 `"./hooks/hooks.json"`），文件内为 `{ "<Event>": [{ "hooks": [{ "type": "command", "command": "...", "timeout": <s> }] }] }`。事件名大小写不敏感（`SessionEnd` / `session_end` 等价）。hook 经 stdin 收 JSON、stdout 决定处理；命令串可用 `${ATOMCODE_PLUGIN_ROOT}` / `${CLAUDE_PLUGIN_ROOT}` 环境变量指向 plugin 安装目录。**Hook 需信任后才激活**：安装时告知不运行，`atomcode plugin trust <name>` 授权后下次 session 生效；插件更新后 hook 命令哈希变更会失效，需重新 trust。

### 4. 不原样照搬 Superpowers

转译时去掉 Superpowers 自己的 plugin 引用、marketplace 引用，只保留方法论内核。每个 skill 加 `## 服务的主基调原则` 一节。

### 5. 不重新实现 OpenSpec CLI

本 plugin 转译 OpenSpec 的方法论到 atomcode，不重新实现 OpenSpec 的 CLI。命令调用 `openspec` CLI 工具。

## 命名约定

- **skill 名**：kebab-case，无冒号（atomcode `validate_skill_name` 规则）
- **命令名**：`td-<verb>` 或 `td-<noun>`，扁平 kebab-case
- **文件名**：`SKILL.md`（目录式；本 plugin 18 个 skill 全部采用此形态）或 `<name>.md`（扁平 legacy）
- **主基调 skill**：`system-engineering`，是所有局部约束的前提，不单独触发（`user-invocable: false`）
- **skill body 内引用其他 skill 用逻辑名**（如 `constraints`、`field-assessment`），由当前平台的加载器负责拼前缀（atomcode 下为 `total-design:<name>`）——这是预留多平台扩展的关键设计。skill frontmatter 不写 `aliases`，调用名一律由平台加载器按 plugin 名拼接。子约束（如 `wip-limit` / `human-in-loop` / `critical-buffer` / `brooks-law` / `delay-decision`）作为 `constraints` 的 `references/<name>.md` 变体文件存在，body 内引用时写 `constraints` 的 `references/<name>.md`（逻辑名 + 变体路径）

### td-* skill 共享片段

7 个 td-* skill 的 body 里曾经各自重复"平台命名表""逻辑名说明""步骤 1 激活主基调与配置层"。这三段按本节规范**自包含书写**——因为 SKILL.md 禁止引用 AGENTS.md（见上方"SKILL 不可引用 AGENTS 文件"），td-* skill 的 body 不能"指向本节"，必须把规范内容写进各自文件。本节是给本仓库开发 agent 的统一规范，不是运行时资产：

**平台命名**：7 个 td-* skill 在不同平台下的调用名由当前平台的加载器按 plugin 名拼前缀（atomcode 下为 `total-design:<name>`），不写入 frontmatter。body 不再放平台命名表，引用其他 skill 一律用逻辑名，由当前平台加载器负责拼前缀。

**td-* 标准步骤 1**（每个 td-* skill 的"### 1. 激活主基调与配置层"都按此序列自包含书写，只注入强度不做判断）：

1. **`system-engineering`** — 主基调四条进入上下文。各 td-* skill 在这一条后补自己的注解（如"reverse-spec 是总体设计部在接手阶段的工作"）。
2. **profile × tier 识别** — 调用 `field-assessment` 的「识别流程」节，判读 `$_TD_PROFILE` / `$_TD_TIER`，并把表 1（5 个 constraint 强度）+ 表 2（human-in-loop 加成）+ 表 3（system-audit 频率，仅 archive/apply 需要）读入上下文。会话内缓存，后续步骤直接引用。
3. **其余 constraint**（通过 `constraints` skill 承载的 5 个局部规律 references：`wip-limit` / `human-in-loop` / `critical-buffer` / `brooks-law` / `delay-decision`）— 只把 `field-assessment` 的强度值读入上下文，**不在步骤 1 判断是否触发**。"是否触发"是步骤 2 的事。

## commit 风格

使用 conventional commits：

- `feat: add wip-limit skill`
- `fix: correct brooks-law trigger condition`
- `docs: update README installation steps`
- `refactor: reorganize constraints directory`

## 不做的事

- **不做 plugin 内的 spec 系统**：OpenSpec 本身是独立 CLI，本 plugin 转译方法论不重新实现 CLI
- **不做静态配置文件**：profile × tier 不用 yaml 配置，判读流程与变体规则全部以 `field-assessment` skill（SKILL.md + references/ 机制与变体文件）形态存在
- **不原样照搬 Superpowers 的 SKILL.md**：转译时去掉 Superpowers 自己的 plugin 引用、marketplace 引用

## 参考

- **OpenSpec**：https://github.com/Fission-AI/OpenSpec
- **Superpowers**：https://github.com/obra/superpowers
- **钱学森系统工程**：系统工程论《创建系统学》《工程控制论》
