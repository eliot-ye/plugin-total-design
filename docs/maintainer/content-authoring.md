# 内容编写规范（细节参考）

> **读者**：维护者——在写/改 SKILL.md、命令文件或 references 时查细节的人。
> **读完应能**：写出跨平台都可加载的 skill 与命令，知道各平台对 frontmatter 的容忍度差异。

**规则本身**（必备结构、依赖技能节语义、禁止项）以 [AGENTS.md](../../AGENTS.md)「编辑规则」为准；本文只补充字段、命名、路径等细节。

写完 SKILL.md / references 后可跑 `pnpm test` 自动校验两类最易腐烂的规则（开发态泄漏、skill 体积上限），口径与阈值见 [skill-tests.md](skill-tests.md)。

## Skill 目录布局

两种布局都支持：

- **目录式** `<name>/SKILL.md` —— 本 plugin 18 个 skill 全部采用；可带 `references/`、`scripts/`、`assets/` 资源子树
- **扁平** `<name>.md` —— legacy，不推荐新写

## frontmatter 字段

```yaml
---
name: <skill-name>            # 必填，kebab-case
description: <一句话描述>      # 必填，进 system prompt，是触发判断的唯一依据
user-invocable: true | false  # 可选；决定是否出现在用户命令面
argument-hint: <参数提示>      # 可选；命令式 skill 用（DSH 会忽略）
disable-model-invocation: true # 可选；禁止 agent 自动触发，仅允许显式调用
---
```

各平台的识别差异：

| 平台 | 必填字段 | 未知字段（如 `argument-hint`） | 备注 |
|---|---|---|---|
| atomcode | `name` / `description` | 忽略 | 下划线变体字段被静默忽略；命名规则见下 |
| Claude Code | `name` / `description` | 忽略 | 与 atomcode 走同一加载路径 |
| Pi Agent | `name` / `description` | 按 skill 加载器解析 | 由 `pi.skills` 扫描目录 |
| DSH | `name` / `description` | **静默忽略** | camelCase 旧键（`disableModelInvocation` 等）会导致整条 skill 被拒绝 |

## 命名规则

- skill 名 / 命令名：**kebab-case，无冒号**
- atomcode 校验：1–64 字符，合法字符 `a-zA-Z0-9-_/`，禁冒号、禁首尾斜杠、禁 `//`
- 命令名：`td-<verb>` 或 `td-<noun>`，扁平 kebab-case
- 文件名：`SKILL.md`（目录式）或 `<name>.md`（扁平 legacy）

## references 约定

- 放在 skill 目录下（如 `<skill>/references/<topic>.md`），随入口 skill 读取，不独立触发、不单独进目录。
- SKILL.md 正文引用时写相对路径（如 `references/wip-limit.md`），平台加载时会给出该 skill 的 base directory，模型据此解析。
- DSH / Claude Code 等平台**不会自动注入** references，正文要明确"何时读哪份"。

## 命令文件模板

`commands/<name>.md`（仅 atomcode / Claude Code 加载）：

```markdown
---
name: <command-name>
description: <一句话描述>
args: none|option|required
---

# <command-name>

**立刻调用 `<command-name>` skill，参数 `$ARGUMENTS`。**
```

- 7 个 `td-*` 命令都是极薄模板——逻辑在同名 skill，命令只是 slash 入口。
- 例外 `td-list`：只读的 `openspec list` 查询，无同名 skill，逻辑直接写在命令文件里。

## 按失败类型选规则句式

写 SKILL 正文里的纪律句（禁止 / 配方 / 模板槽位 / 条件句）时，**先判断要防的失败是哪一类**，再选句式——句式与失败类型错配会适得其反。四类基线失败与对应形式：

| 基线失败类型 | 该用的形式 | 不该用的形式 |
|---|---|---|
| 压力下违反规则（agent 知道却扛不住走捷径） | 禁止 + 「常见合理化」表 + red flags | 软引导（"prefer…" / "consider…"） |
| 照做但产出形状不对 | **正面配方 / 契约**：说清产出「是什么、分几部分、按什么顺序」 | 禁止清单 |
| 漏了该有的元素 | 模板里放 REQUIRED 字段 / 槽位 | 模板旁的散文提醒 |
| 行为该依赖某条件 | 挂在可观察谓词上的条件句 | 无条件规则 + 豁免从句 |

**两条硬规则**（针对句式的反模式，有实测支撑）：

- **塑造产出形状的问题，禁止句式会适得其反**——"don't X" 会被 agent 拿来讨价还价，产出比配方句式更多不想要的 X。要约束产出的形状，用正面配方说清"应该是什么样"，而不是罗列"不要什么样"。
- **不要 nuance 从句与无作用域豁免**：`Don't X unless it matters` 会重开谈判（"这次算不算 matters？"）；`This limit doesn't apply to code blocks` 这类豁免从句仍会压制 code blocks（作用域不清）——必须重构成规则根本够不到的形态，而不是加豁免。

**「常见合理化」表**：给最易被绕过的 gate（TDD 删除强制、完成前验证、review 不放行）配一张表，把 agent 会用的借口逐条列出并当场反驳。参照 `test-driven-development` 的「常见合理化」节格式。这是「压力下违反规则」类的专属武器——软引导压不住，只有把借口提前戳破才有效。

## 各平台差异速查

| 能力 | atomcode / Claude Code | Pi Agent | DSH |
|---|---|---|---|
| 命令文件 | 加载 `commands/` | extension 生成 `/td-*` | 不加载，`/名称` 手势 |
| 参数替换 | `$ARGUMENTS` | extension 桥接保留 | 无替换 |
| references | 相对 skill 目录 | 同左 | 同左（base directory 提示） |

平台加载机制全貌见 [platforms.md](platforms.md)。
