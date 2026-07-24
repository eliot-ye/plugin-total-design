# AGENTS.md — total-design

> 装上它，你的 agent 就有了一个总体设计部。

## 项目身份

这是一个 **atomcode plugin**，不是一个应用项目，也不是一个代码项目。

- **产出形态**：一组 Markdown 文件（`SKILL.md` / 命令文件）+ 一个 `plugin.json` manifest（.claude-plugin/plugin.json）
- **运行方式**：用户通过 atomcode marketplace 安装本 plugin，装上后 agent 自动加载 skills 和 commands
- **没有可执行代码**：所有"逻辑"都是 Markdown 指令，由 agent 读取并执行

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

约束层是第零层——是另外两层立起来的前提。每个 constraint skill 必须显式声明它服务钱学森系统工程主基调的哪一条。

## 目录结构

```
total-design/
├── .claude-plugin/         ← Claude Code marketplace 兼容目录
│   ├── marketplace.json
│   └── plugin.json          ← manifest（atomcode 与 Claude Code 共用同一份）
├── README.md
├── AGENTS.md                ← 本文件
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE
├── .gitignore
│
├── skills/                  ← 26 个 skill，全部目录式（每个目录下是 SKILL.md）
│   │
│   ├── 约束层（6 个）
│   │   ├── system-engineering/ ← 钱学森主基调；user-invocable: false
│   │   ├── wip-limit/          ← 5 条局部规律，每个都服务主基调某一条
│   │   ├── critical-buffer/   （各目录下均有 SKILL.md，下同）
│   │   ├── brooks-law/
│   │   ├── delay-decision/
│   │   └── human-in-loop/
│   │
│   ├── 行为层（7 个，Superpowers 转译）
│   │   ├── brainstorming/
│   │   ├── writing-plans/
│   │   ├── executing-plans/
│   │   ├── test-driven-development/
│   │   ├── requesting-code-review/
│   │   ├── systematic-debugging/
│   │   └── verification-before-completion/
│   │
│   ├── 配置层（7 个）
│   │   ├── constraint-matrix/  ← profile × tier × constraint 强度矩阵的单一事实源；user-invocable: false
│   │   ├── profile-greenfield/ ← 3 个现场 profile，user-invocable: false
│   │   ├── profile-brownfield/
│   │   ├── profile-maintenance/
│   │   ├── tier-small/         ← 3 个系统复杂度 tier，user-invocable: false
│   │   ├── tier-medium/
│   │   └── tier-large/
│   │
│   └── 契约层 skill（6 个，与下方 command 一一对应）
│       ├── td-propose/
│       ├── td-explore/
│       ├── td-apply/
│       ├── td-reverse-spec/
│       ├── td-archive/
│       └── td-system-audit/
│
└── commands/                ← 6 个 slash 命令入口（极薄，逻辑全在同名 skill 里）
    ├── td-propose.md
    ├── td-explore.md
    ├── td-apply.md
    ├── td-reverse-spec.md
    ├── td-archive.md
    └── td-system-audit.md
```

## 编辑规则

### SKILL.md 编辑

每个 `SKILL.md` 必须有以下结构：

```markdown
---
name: <skill-name>
description: <一句话描述，会进 system prompt>
user-invocable: true | false
argument-hint: <参数提示>          ← 仅 user-invocable: true 的命令式 skill 需要
---

# <Skill Title>

## 服务的主基调原则       ← 约束层 + 契约层 skill 必须有此节

<正文>
```

**必须有 `## 服务的主基调原则` 一节的 skill：**

- 约束层 5 个局部规律（`wip-limit` / `critical-buffer` / `brooks-law` / `delay-decision` / `human-in-loop`）—— 显式 link 到 `system-engineering` 主基调的某一条
- 契约层 6 个 td-* skill —— 同上

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

### 命令文件编辑

命令文件位于 `commands/`，文件名 = 命令名（扁平 kebab-case，无冒号，atomcode 规则）。

每个命令文件必须有 frontmatter：

```markdown
---
name: <command-name>
description: <一句话描述>
argument-hint: <参数提示>
args: none|option|required
---

# <command-name>

**立刻调用 `<command-name>` skill，参数 `$ARGUMENTS`。**
```

6 个命令文件 (`td-propose` / `td-explore` / `td-apply` / `td-reverse-spec` / `td-archive` / `td-system-audit`) 都遵循这个极薄模板——命令只是 slash 入口，真正的逻辑在同名 skill (`skills/<td-*>/SKILL.md`) 里。这样同一份逻辑既能被 slash command 触发，也能被 agent 自动触发。

### plugin.json 编辑

manifest 文件位于 `.claude-plugin/plugin.json`，被 atomcode 和 Claude Code marketplace 共用。

- 只接受 JSON（不接受 YAML）
- 合法字段：`name` / `version` / `description` / `skills` / `commands` / `hooks`
- **`skills` / `commands` 字段是路径数组**，本 plugin 用 `["./skills"]` / `["./commands"]`，加载器会自动递归发现所有 `SKILL.md` 和命令文件
- **没有 `constraints` / `profiles` / `tiers` 字段**——这些必须以 skill 形态存在

## 设计原则

### 1. 钱学森系统工程主基调是第零层

所有 constraint 都在系统工程框架下生效。每条局部规律（Brooks / Goldratt / 精益）都要显式声明它服务主基调的哪一条。

### 2. profile × tier 二维配置

- **profile**（仓库状态）：greenfield / brownfield / maintenance
- **tier**（系统复杂度）：small / medium / large

两个维度都以 skill 形态存在，agent 根据现场判读激活哪一组。

### 3. 触发式而非 hook 强制

Superpowers 的"触发式"哲学保留：skill 靠 agent 根据上下文判读触发，不靠 hook 强制。

atomcode hooks schema（备用参考）：外层 `{"hooks": {<name>: {...}}}`，事件名蛇形（`pre_tool_use` / `post_tool_use` / `session_start` / `session_end` / `user_prompt_submit`），字段 `command` / `matcher` / `timeout_ms` / `event`。不是 Claude Code 的 `PreToolUse` 大驼峰 + 嵌套 `hooks` 数组 + `timeout`。

### 4. 不原样照搬 Superpowers

转译时去掉 Superpowers 自己的 plugin 引用、marketplace 引用，只保留方法论内核。每个 skill 加 `## 服务的主基调原则` 一节。

### 5. 不重新实现 OpenSpec CLI

本 plugin 转译 OpenSpec 的方法论到 atomcode，不重新实现 OpenSpec 的 CLI。命令调用 `openspec` CLI 工具。

## 命名约定

- **skill 名**：kebab-case，无冒号（atomcode `validate_skill_name` 规则）
- **命令名**：`td-<verb>` 或 `td-<noun>`，扁平 kebab-case
- **文件名**：`SKILL.md`（目录式；本 plugin 26 个 skill 全部采用此形态）或 `<name>.md`（扁平 legacy）
- **主基调 skill**：`system-engineering`，是所有局部约束的前提，不单独触发（`user-invocable: false`）
- **多平台调用名**：6 个契约层 td-* skill 在 frontmatter 里写 `aliases` 映射：
  - `atomcode: total-design:<name>`
  - `claude-code: total-design:<name>`
  - `cursor: <name>`（无前缀）
- **skill body 内引用其他 skill 用逻辑名**（如 `wip-limit`、`human-in-loop`），由当前平台的加载器负责拼前缀——这是预留多平台扩展的关键设计

### td-* skill 共享片段

6 个 td-* skill 的 body 里曾经各自重复"平台命名表""逻辑名说明""步骤 0 激活主基调与配置层"。这三段已抽为共享片段，td-* skill 的 body 不再重写，改为一句指向本节：

**平台命名**：6 个 td-* skill 在不同平台下的调用名见各自 frontmatter 的 `aliases` 字段（atomcode / claude-code / cursor 三套）。body 不再放平台命名表，引用其他 skill 一律用逻辑名，由当前平台加载器负责拼前缀。

**td-* 标准步骤 0**（每个 td-* skill 的"### 0. 激活主基调与配置层"都执行同一序列，只注入强度不做判断）：

1. **`system-engineering`** — 主基调四条进入上下文。各 td-* skill 在这一条后补自己的注解（如"reverse-spec 是总体设计部在接手阶段的工作"）。
2. **profile × tier 识别** — 调用 `constraint-matrix` 的「识别流程」节，判读 `$_TD_PROFILE` / `$_TD_TIER`，并把表 1（5 个 constraint 强度）+ 表 2（human-in-loop 加成）+ 表 3（system-audit 频率，仅 archive/apply 需要）读入上下文。会话内缓存，后续步骤直接引用。
3. **其余 constraint**（`wip-limit` / `human-in-loop` / `critical-buffer` 等）— 只把 `constraint-matrix` 的强度值读入上下文，**不在步骤 0 判断是否触发**。"是否触发"是步骤 1 的事。

## commit 风格

使用 conventional commits：

- `feat: add wip-limit skill`
- `fix: correct brooks-law trigger condition`
- `docs: update README installation steps`
- `refactor: reorganize constraints directory`

## 不做的事

- **不做 plugin 内的 spec 系统**：OpenSpec 本身是独立 CLI，本 plugin 转译方法论不重新实现 CLI
- **不做静态配置文件**：profile × tier 不用 yaml 配置，全做成 skill
- **不原样照搬 Superpowers 的 SKILL.md**：转译时去掉 Superpowers 自己的 plugin 引用、marketplace 引用

## 参考

- **OpenSpec**：https://github.com/Fission-AI/OpenSpec
- **Superpowers**：https://github.com/obra/superpowers
- **钱学森系统工程**：系统工程论《创建系统学》《工程控制论》
