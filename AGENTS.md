# AGENTS.md — total-design

> 装上它，你的 agent 就有了一个总体设计部。

## 项目身份

这是一个 **atomcode plugin**，不是一个应用项目，也不是一个代码项目。

- **产出形态**：一组 Markdown 文件（`SKILL.md` / 命令文件）+ 一个 `plugin.json` manifest + 一个 `.hooks.json`（项目级 hooks，atomcode 标准文件名）
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
├── plugin.json              ← atomcode manifest
├── README.md
├── AGENTS.md                ← 本文件
├── CONTRIBUTING.md
├── LICENSE
├── .hooks.json             ← 项目级 hooks（atomcode 读 <project>/.hooks.json）
│
├── skills/
│   ├── system-engineering/ ← 钱学森主基调（约束层入口）
│   ├── wip-limit/           ← 工程管理 5 条局部规则
│   ├── critical-buffer/
│   ├── brooks-law/
│   ├── delay-decision/
│   ├── human-in-loop/
│   ├── brainstorming/       ← Superpowers 7 个行为层 skill
│   ├── writing-plans/
│   ├── executing-plans/
│   ├── test-driven-development/
│   ├── requesting-code-review/
│   ├── systematic-debugging/
│   ├── verification-before-completion/
│   ├── profile-greenfield/  ← 3 个现场 profile
│   ├── profile-brownfield/
│   ├── profile-maintenance/
│   ├── tier-small/          ← 3 个系统复杂度 tier
│   ├── tier-medium/
│   └── tier-large/
│
└── commands/                ← 6 个 slash 命令
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
user_invocable: true | false
---

# <Skill Title>

## 服务的主基调原则       ← 约束层 skill 必须有此节

<正文>
```

**约束层 skill（`wip-limit` / `critical-buffer` / `brooks-law` / `delay-decision` / `human-in-loop`）必须在正文开头有 `## 服务的主基调原则` 一节**，显式 link 到 `system-engineering` 主基调 skill 的某一条。否则它就是漂浮的操作规则，立不起来。

### 命令文件编辑

命令文件位于 `commands/`，文件名 = 命令名（扁平 kebab-case，无冒号，atomcode 规则）。

每个命令文件必须有 frontmatter：

```markdown
---
description: <一句话描述>
argument_hint: <参数提示>
---

# /<command-name>

<正文>
```

### plugin.json 编辑

- 只接受 JSON（不接受 YAML）
- 合法字段：`name` / `version` / `description` / `skills` / `commands`
- **`description` 字段必须纯 ASCII**——atomcode TUI plugin manager（`crates/atomcode-tuix/src/modals/plugin_manager.rs:1148`）按字节下标 57 切 description 做 UI 一行截断，没用 `is_char_boundary` 保护；若含中日韩多字节字符且下标 57 落在字符内部，Rust 切片直接 panic 让 atomcode 崩。中文描述放 README.md / AGENTS.md，不进 plugin.json。
- **不要写 `hooks` 字段指向外部 JSON 文件路径**——atomcode 把 `hooks` 字段反序列化成 `HooksField` enum，只接受内联对象/对象列表，写字符串路径（如 `"./hooks.json"`）会让 atomcode 反序列化失败直接崩。hooks 装载走另一条路：atomcode 直接读 `~/.atomcode/hooks.json`（全局）和 `<project>/.hooks.json`（项目级），不经 manifest 引。
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

`.hooks.json` 第一版只是提醒，不阻塞。是否升级为强制要实测。atomcode hooks schema：外层 `{"hooks": {<name>: {...}}}`，事件名蛇形（`pre_tool_use` / `post_tool_use` / `session_start` / `session_end` / `user_prompt_submit`），字段 `command` / `matcher` / `timeout_ms` / `event`。不是 Claude Code 的 `PreToolUse` 大驼峰 + 嵌套 `hooks` 数组 + `timeout`。

### 4. 不原样照搬 Superpowers

转译时去掉 Superpowers 自己的 plugin 引用、marketplace 引用，只保留方法论内核。每个 skill 加 `## 服务的主基调原则` 一节。

### 5. 不重新实现 OpenSpec CLI

本 plugin 转译 OpenSpec 的方法论到 atomcode，不重新实现 OpenSpec 的 CLI。命令调用 `openspec` CLI 工具。

## 命名约定

- **skill 名**：kebab-case，无冒号（atomcode `validate_skill_name` 规则）
- **命令名**：`td-<verb>` 或 `td-<noun>`，扁平 kebab-case
- **文件名**：`SKILL.md`（目录式）或 `<name>.md`（扁平 legacy）
- **主基调 skill**：`system-engineering`，是所有局部约束的前提，不单独触发（`user-invocable: false`）

## commit 风格

使用 conventional commits：

- `feat: add wip-limit skill`
- `fix: correct brooks-law trigger condition`
- `docs: update README installation steps`
- `refactor: reorganize constraints directory`

## 不做的事

- **不做 multi-platform 同步**：plugin 只针对 atomcode，不同步到 `.claude/` / `.codex/` 等其他平台
- **不做 plugin 内的 spec 系统**：OpenSpec 本身是独立 CLI，本 plugin 转译方法论不重新实现 CLI
- **不做静态配置文件**：profile × tier 不用 yaml 配置，全做成 skill
- **不原样照搬 Superpowers 的 SKILL.md**：转译时去掉 Superpowers 自己的 plugin 引用、marketplace 引用

## 开放问题

1. **system-audit 的周期**：按时间 / 事件 / 规模？当前文档给了"每 N 个 change"的规则，但没实测
2. **profile/tier 的自动识别**：agent 第一次进仓库时，怎么自动判读 profile 和 tier？需要实测
3. **hooks 的边界**：钱学森主基调的"强制"用 hook 实现时，会不会让 agent 太受限反而难用？需要实测
4. **profile 切换**：项目从 greenfield 走到 maintenance 时，profile 怎么平滑切换？

## 参考

- **设计文档**：`thoughts/total-design.md`（在源 thinking 仓库里）
- **OpenSpec**：https://github.com/Fission-AI/OpenSpec
- **Superpowers**：https://github.com/obra/superpowers
- **钱学森系统工程**：《系统工程论》《创建系统学》
