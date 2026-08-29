# total-design

> 装上它，你的 agent 就有了一个总体设计部。

把 **OpenSpec**（契约层）+ **Superpowers**（行为层）+ **钱学森系统工程**（约束层主基调）封装成一个 atomcode plugin，让装了它的 agent 从"一个会打字很快的助手"变成"一个有工程纪律的协作者"。

---

## 为什么需要这个 plugin

AI coding agent 的失控不是"模型不够强"，是**没有工程纪律**：

- agent 一上来就写代码，不先想清楚要建什么
- agent 跳过测试，自称"完成"了其实没验证
- 同时开多个任务，每个都半途而废
- 局部最优但全局失调——改了一处，破坏了系统另一处的契约

这个 plugin 把纪律做成可装可拆的 plugin，让任何 atomcode 实例装上就有纪律。

---

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

**层级关系：** 约束层是第零层——是另外两层立起来的前提。行为层在约束层之上运行。契约层是行为层每一阶段产出的固化形态。

---

## 三大来源

| 来源 | 在本 plugin 中的角色 | 原项目 |
|---|---|---|
| **OpenSpec** | 契约层：propose → apply → archive 的 artifact 流 | https://github.com/Fission-AI/OpenSpec |
| **Superpowers** | 行为层：brainstorming → plan → TDD → review → verify 的强制流程 | https://github.com/obra/superpowers |
| **钱学森系统工程** | 约束层主基调：系统工程 / 总体设计部 / 综合集成 / 开放的复杂巨系统 | 《系统工程论》《创建系统学》 |

本 plugin **不原样照搬**任何来源——OpenSpec 转译成 atomcode 命令、Superpowers 转译成 skill 并去掉 marketplace 引用、钱学森思想做成所有局部约束的前提。

---

## 安装

### 前置要求

- [atomcode](https://github.com/atomcode) 已安装并运行
- OpenSpec CLI（契约层调用）：`npm install -g @fission-ai/openspec@latest`

### 通过 marketplace 安装

```bash
# 注册 marketplace
/plugin marketplace add <this-repo-url>

# 安装 plugin
/plugin install total-design
```

### 手动安装

```bash
git clone <this-repo-url> ~/.atomcode/plugins/total-design
# 重启 atomcode session
```

---

## 仓库结构

```
total-design/
├── .atomcode-plugin/       ← manifest 目录（atomcode + Claude Code 共用）
│   ├── marketplace.json
│   └── plugin.json
├── README.md
├── AGENTS.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE
│
├── skills/                 ← 28 个 skill，全部目录式 SKILL.md
│   ├── 约束层（6 个）
│   ├── 行为层（7 个，Superpowers 转译）
│   ├── 配置层（8 个，field-assessment + 3 profile + 3 tier + todo-pool 待办池格式）
│   └── 契约层（7 个 td-*，与下方 command 一一对应）
│
├── commands/               ← 8 个 slash 命令入口（7 个极薄，逻辑在同名 skill；td-list 只读无 skill）
│
└── hooks/                  ← 1 个 hook：状态持久化兜底（SessionEnd 事件）
    ├── hooks.json          ← hook 声明
    └── td_state_sync.py    ← 会话结束时从文件系统事实校正 .td-state/ 状态文件
```

### Hook（状态持久化兜底）

plugin 带一个 `SessionEnd` hook，会话结束时自动校正 `openspec/.td-state/` 的状态文件：

- `archive-counter.yaml` — 按 `openspec/changes/archive/` 目录事实重算 `count`（防 agent 漏写归档计数）
- `audit-history.yaml` — 为 `openspec/.td-state/audits/*.md` 补缺失的报告记录（已有记录不动）

它只做"防漏"的兜底，不做任何流程门禁——skill 的正常写入路径不受影响。

**Hook 需信任后才激活**：安装后第一次运行会提示有 hook 待授权，执行

```bash
atomcode plugin trust total-design
```

下次 session 生效。插件更新后若 hook 命令有变动，需重新 trust。

---

## 命令清单（契约层入口）

所有命令扁平 kebab-case，无冒号（atomcode 命名规则）。

| 命令 | 用途 | 对应 OpenSpec |
|---|---|---|
| `/td-init` | 初始化 td 工作流：检查 OpenSpec 结构 + 配置 .gitignore | 本 plugin 新增（仅用户触发） |
| `/td-propose` | 创建 change，生成 proposal/design/tasks artifact | `/opsx:propose` |
| `/td-explore` | 不带 stakes 的思考伙伴，写代码前先探索 | `/opsx:explore` |
| `/td-apply` | 实施任务，按 artifact 走 | `/opsx:apply` |
| `/td-reverse-spec` | 中途接手项目专用：先 reverse-spec 已有代码 | 本 plugin 新增 |
| `/td-archive` | 完成后归档 | `/opsx:archive` |
| `/td-system-audit` | 周期性对照系统工程主基调自检 | 本 plugin 新增 |
| `/td-list` | 列出所有未归档（活跃）的 change 态势 | 本 plugin 新增（只读） |

**新增命令的意义：**

- `/td-init`：初始化入口——检查 `openspec/` 结构是否就绪（没有则初始化：CLI 可用时跑 `openspec init`，不可用时代劳创建目录结构），配置 `.gitignore` 忽略可推导的 `.td-state/` 本地状态（根 `.gitignore` 已有条目则不动；否则在 `openspec/.gitignore` 创建/追加 `.td-state/`），从源头消灭多人协作的假冲突。**仅用户可触发**（`disable-model-invocation: true`），agent 不会自动调用。
- `/td-reverse-spec`：OpenSpec 假设你是 greenfield，但中途接手项目时直接 propose 大改动很危险。先 reverse-spec 已有代码，建立 baseline spec。
- `/td-system-audit`：钱学森"总体设计部"视角的工程化。周期性把 agent 当前的工作对照系统工程四条主基调过一遍，识别"局部优化制造全局失调"的风险。
- `/td-list`：只读查询入口，列活跃 change 态势（逻辑直接写在命令文件里，无同名 skill，故不遵循极薄模板）。

### skill 在 atomcode 下的实际调用名

atomcode 加载 plugin 时，会自动给 plugin 内的 skill 加 `<plugin-name>:` 前缀。本 plugin 的 `name` 是 `total-design`，所以 7 个 td-* skill 在 atomcode 下：

| skill 逻辑名 | atomcode 调用名 |
|---|---|
| `td-init` | `total-design:td-init` |
| `td-propose` | `total-design:td-propose` |
| `td-explore` | `total-design:td-explore` |
| `td-apply` | `total-design:td-apply` |
| `td-reverse-spec` | `total-design:td-reverse-spec` |
| `td-archive` | `total-design:td-archive` |
| `td-system-audit` | `total-design:td-system-audit` |

`/` 菜单里看到的是 `/total-design:td-apply` 这种带前缀的形式；`use_skill` 工具调用也要传带前缀的全名。skill 文件 frontmatter 的 `name` 字段保持纯合法字符（`a-zA-Z0-9-_/`，禁 `:`，禁首尾斜杠和 `//`，1–64 字符），前缀由 atomcode 加载时拼接。

本 plugin 的 skill body 和 command body 都按"逻辑名"的方式写：body 内引用其他 skill 用逻辑名（如 `wip-limit`、`human-in-loop`），由当前平台的加载器负责拼前缀（atomcode 下为 `total-design:<name>`）。这是为了预留本 plugin 未来扩展到非 atomcode 平台（Claude Code / Cursor / Codex）的能力——同一份 SKILL.md，不同平台用不同前缀。

### frontmatter 字段格式

atomcode 解析 frontmatter 用**连字符**键名（不是下划线）。本 plugin 所有 SKILL.md 和命令文件遵循这一规则：

| 字段 | 作用 |
|---|---|
| `name:` | skill/command 名（命令文件可省，stem 即名） |
| `description:` | 一句话描述，进 system prompt |
| `user-invocable:` | `true` = 出现在 `/` 菜单；`false` = agent 自动触发，不暴露 |
| `argument-hint:` | 命令参数提示，autocomplete 显示 |
| `disable-model-invocation:` | `true` = agent 不能自动触发 |
| `allowed-tools:` | 限制可用工具 |

**坑：** `user_invocable:` / `argument_hint:`（下划线）会被 atomcode 静默忽略，走默认值。必须用连字符。

---

## Skill 清单

28 个 skill，按调用方式分两组：

- **`user-invocable: true`**（14 个）：用户可在 `/` 菜单主动调；其中 `td-init` 还带 `disable-model-invocation: true`（仅用户可触发，agent 不能自动调用），其余 13 个也可被 agent 自动触发
  - 行为层 7 个（Superpowers 转译）
  - 契约层 7 个 td-*（与 7 个 td-* command 一一对应；`td-list` 只读命令无同名 skill）
- **`user-invocable: false`**（14 个）：agent 自动触发，不暴露在 `/` 菜单
  - 约束层 6 个（钱学森主基调 + 5 条局部规律）
  - 配置层 8 个（field-assessment + 3 profile + 3 tier + todo-pool 待办池格式）

### 约束层（钱学森系统工程主基调 + 局部规律）

| Skill | 作用 | 服务主基调 | user-invocable |
|---|---|---|---|
| `system-engineering` | 钱学森四条主基调，所有局部约束的前提 | — | false |
| `wip-limit` | 限制同时活跃的 change 数量 | 第 4 条：开放的复杂巨系统 | false |
| `critical-buffer` | 关键链缓冲保护 | 第 1 条：系统工程 + 第 2 条：总体设计部 | false |
| `brooks-law` | 加人手前的强制提醒 | 第 1 条：系统工程 | false |
| `delay-decision` | 可逆决策延迟闭合 | 第 3 条：从定性到定量的综合集成 | false |
| `human-in-loop` | 何时必须停下来等用户拍板 | 第 2 条 + 第 3 条 | false |

`system-engineering` 是主基调 skill，其他 5 个是局部规律 skill——每个局部规律 skill 都必须在正文开头有 `## 服务的主基调原则` 一节，显式 link 到 `system-engineering` 的某一条。

### 行为层（Superpowers 转译）

| Skill | 触发时机 | user-invocable |
|---|---|---|
| `brainstorming` | 在写代码之前；升级为"总体设计部"工作方式 | true |
| `writing-plans` | spec 收敛后，拆成 bite-sized 任务 | true |
| `executing-plans` | plan 就绪，开始批量执行 + human checkpoint | true |
| `test-driven-development` | 每个任务实施时；RED-GREEN-REFACTOR | true |
| `requesting-code-review` | 任务之间；critical issue 阻塞进度 | true |
| `systematic-debugging` | 测试失败 / 用户报 bug / 修复尝试失败 | true |
| `verification-before-completion` | 声明"完成"之前；evidence before assertions | true |

### 配置层（profile × tier 二维 + 待办池格式）

**矩阵单一事实源（`user-invocable: false`）：**

- `field-assessment` — profile × tier × constraint 强度矩阵的单一事实源；3 个 profile 和 3 个 tier skill 都引用本 skill，强度只在这里改

**profile 维度（仓库状态，全部 `user-invocable: false`）：**

- `profile-greenfield` — 零起步项目，full SDD
- `profile-brownfield` — 中途接手，reverse-spec 优先
- `profile-maintenance` — 上线维护，轻量 proposal，bug 走 systematic-debugging

**tier 维度（系统复杂度，全部 `user-invocable: false`）：**

- `tier-small` — 3–10 文件，单团队，constraints 弱强制
- `tier-medium` — 10–100 文件，多模块，constraints 中等强制
- `tier-large` — 100+ 文件 / 多团队 / 多仓库，constraints 强制，要求总体设计文档

**待办池格式（`user-invocable: false`）：**

- `todo-pool` — `openspec/todo.md` 待办池格式约定（主条目 + change 子项两级结构、优先级、勾选时机、git 策略）；`td-propose` / `td-explore` / `td-archive` / `td-system-audit` 读写该文件的格式单一事实源（见下方「TODO 待办池机制」一节）

两个维度都以 skill 形态存在，agent 根据现场判读激活哪一组。

### 契约层（7 个 td-* skill，与 7 个 td-* command 一一对应；`td-list` 是只读查询命令，无同名 skill）

每个 td-* skill 既是 skill（可被 `use_skill` 调用）又对应一个 slash command（`/td-*`），调用名由平台加载器按 plugin 名拼前缀（见上方"skill 在 atomcode 下的实际调用名"一节）。`td-init` 是唯一带 `disable-model-invocation: true` 的 td-* skill——只可用户触发，agent 不自动调用。

| Skill | 对应 command | 对应 OpenSpec | user-invocable |
|---|---|---|---|
| `td-init` | `/td-init` | 本 plugin 新增（初始化入口） | true（仅用户触发） |
| `td-propose` | `/td-propose` | `/opsx:propose` | true |
| `td-explore` | `/td-explore` | `/opsx:explore` | true |
| `td-apply` | `/td-apply` | `/opsx:apply` | true |
| `td-reverse-spec` | `/td-reverse-spec` | 本 plugin 新增 | true |
| `td-archive` | `/td-archive` | `/opsx:archive` | true |
| `td-system-audit` | `/td-system-audit` | 本 plugin 新增 | true |

---

## TODO 待办池机制

`openspec/todo.md` 是项目级待办池（backlog）：每条 `- [ ]` 主条目是一个潜在 change 的候选（可带 `[P0]/[P1]/[P2]` 优先级），活跃 change 才是 WIP——候选池可以无限多，`wip-limit` 只管活跃 change 数。主条目被 change 承接时，下面挂 `  - [ ] change: <name>` 子项（一个 change 一个子项）。机制贯穿四个 td-* skill：

| skill | 与 TODO 池的关系 |
|---|---|
| `td-propose` | 优先从池里挑未勾选主条目建 change（按优先级排序呈现），在主条目下新增 `  - [ ] change: <name>` 子项，可多 change 承接同一条主条目 |
| `td-archive` | 归档成功后触发 `todo-pool`「勾选子项」——勾选 `change: <name>` 子项；主条目下全部子项都勾选后主条目才勾选，子项永久保留（追溯档案） |
| `td-explore` | 读未勾选主条目作候选输入；探索出用户认可的新方向可落池（触发 `todo-pool`「落池条目」） |
| `td-system-audit` | 审计发现问题时询问用户是否把"建议的下一步动作"落池（触发 `todo-pool`「落池条目」） |

读写操作入口与条目格式见 `todo-pool`——格式在「格式约定」节，写操作在「落池条目」/「勾选子项」子流程节，单一事实源。

---

## 典型工作流

### 零起步项目

```
1. /td-explore "我想建一个 X"       ← 先探索
2. /td-propose add-x                ← 创建 change，生成 artifact
3. /td-apply add-x                  ← 按 tasks.md 实施，走 TDD
4. /td-system-audit                 ← 周期性自检
5. /td-archive add-x                ← 完成后归档
```

### 中途接手项目

```
1. /td-reverse-spec                 ← 先 reverse-spec 已有代码，建立 baseline
2. /td-explore "我想改 X"           ← 基于 baseline 探索
3. /td-propose modify-x             ← 创建 change
4. /td-apply modify-x               ← 实施，新代码走 TDD，老代码先加 characterization test
5. /td-archive modify-x             ← 归档
```

### 上线维护

```
1. 用户报 bug
2. systematic-debugging skill 触发  ← 4-phase root cause
3. /td-propose fix-bug-<name>       ← 轻量 proposal
4. /td-apply fix-bug-<name>         ← 修复 root cause，加回归测试
5. /td-archive fix-bug-<name>       ← 归档
```

---

## 多人协作与初始化建议

多人同时使用 td 工作流时，git 冲突只有两类，处理方式完全不同：

**假冲突（.td-state/ 状态文件）——用 .gitignore 从源头消灭。**

`openspec/.td-state/` 下所有状态文件（`profile-tier.yaml` / `archive-counter.yaml` / `audit-history.yaml` / `audits/`）都可以从文件系统事实推导（`archive/` 目录、`audits/*.md` 等），提交进 git 只会制造冲突——两人同时 archive / audit 时对同一份 YAML 读改写，git 要么报冲突、要么静默丢失数据。**初始化时运行 `/td-init` 一键配置**（检查 OpenSpec 结构 + 配置 .gitignore + 老项目迁移检查），或手动配置，冲突面直接归零（两种放置方式）：

```gitignore
# 方式 A：项目根 .gitignore
openspec/.td-state/
```

```gitignore
# 方式 B：openspec/.gitignore（嵌套规则，路径相对 openspec/ 目录，不误伤其他内容）
.td-state/
```

- 加 .gitignore 之后这些文件仍留在本地，plugin（含 `SessionEnd` hook）照常读写，只是不再进版本库。
- 若是在加 .gitignore 之前就已经提交过 `.td-state/` 的老项目，需要先执行一次 `git rm -r --cached openspec/.td-state/`，否则 git 会继续跟踪已入库的文件。

**真冲突（specs/ 主 spec 合并）——保留，交给总体设计部裁决。**

两个 change 同时改同一分系统的契约，归档时 `openspec/specs/` 合并会冲突。**这是 feature 不是 bug**——git 在告诉你两个 change 对系统行为有分歧，不能由 agent 自动挑选版本，`/td-archive` 检测到 `UU` 冲突时应触发 `human-in-loop` 让用户裁决。

**协作约定：**

- **一个 change 一个 owner**：不同 change 是独立目录，天然隔离；同一个人/分支上串行推进，不要两个人同时编辑同一个 change。
- **一个 change 对应一个分支 + PR**：官方推荐模式——`git switch -c <change-name>` → propose → apply → commit + PR → merge → archive（PR merge 后再 archive，主 spec 只跟着已合入的工作前进）。
- `openspec/config.yaml` / `openspec/specs/` / `openspec/changes/` 是共享事实源，**必须提交**，不要 ignore。
- **`openspec/todo.md` 是共享事实源，必须提交**——它是单文件，多人协作按**条目粒度人工协调**：同一时间只由一个人 propose / 勾选同一条目（不同条目互不冲突）；同一分支上 propose 挑候选、archive 勾选各自串行推进。

---

## 与钱学森系统工程的对应关系

| 钱学森主基调 | 在本 plugin 里的工程化体现 |
|---|---|
| **系统工程**（总体性能 ≠ 各部分之和） | 每个 constraint skill 显式声明服务这条主基调；proposal 必填"系统工程影响评估"节 |
| **总体设计部**（系统全局立场的群体） | `brainstorming` skill 升级为"总体设计部"工作方式；`/td-system-audit` 命令是周期性自检机制 |
| **从定性到定量的综合集成**（专家 + 数据 + 模型迭代） | proposal 里必须回答"这改动会影响哪些分系统、整体性能会怎么变"——这是综合集成在 artifact 层的体现 |
| **开放的复杂巨系统**（不简化还原，整体观 + 层次观） | profile × tier 二维配置——按系统规模分层对待 |

---

## 与西方工程管理那条线的根本差别

- **Brooks / Goldratt / 精益一脉** 是**从施工现场反推出来的纪律**——"人月是神话"、"瓶颈决定吞吐"，针对的是**已发生**的项目失控。
- **钱学森一脉** 是**从系统的本质前推出来的方法**——先承认对象是复杂系统，再设计应对复杂性的工作方式。针对的是**认识论层面的失控**：你以为你在做一个小问题，其实你在动一个巨系统。

本 plugin 不取代 Brooks / Goldratt / 精益，而是**让那些局部规律在系统工程主基调的前提下生效**。

---

## 贡献

见 [CONTRIBUTING.md](CONTRIBUTING.md)。

简单说：

- Fork + branch + PR
- 改 skill → 改 `skills/<name>/SKILL.md`
- 改命令 → 改 `commands/<name>.md`
- 改约束 → 必须有 `## 服务的主基调原则` 一节
- commit 用 conventional commits

---

## 行为准则

见 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

---

## License

[MIT](LICENSE) © total-design contributors

---

## 致谢

本 plugin 站在三个巨人的肩膀上：

- [**OpenSpec**（Fission-AI）](https://github.com/Fission-AI/OpenSpec)—— 契约层方法论来源
- [**Superpowers**（Jesse Vincent / obra）](https://github.com/obra/superpowers)—— 行为层方法论来源
- **钱学森的工程理论** —— 系统工程思想来源

没有他们的工作，这个 plugin 不会存在。
