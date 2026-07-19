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

## 命令清单（契约层入口）

所有命令扁平 kebab-case，无冒号（atomcode 命名规则）。

| 命令 | 用途 | 对应 OpenSpec |
|---|---|---|
| `/td-propose` | 创建 change，生成 proposal/design/tasks artifact | `/opsx:propose` |
| `/td-explore` | 不带 stakes 的思考伙伴，写代码前先探索 | `/opsx:explore` |
| `/td-apply` | 实施任务，按 artifact 走 | `/opsx:apply` |
| `/td-reverse-spec` | 中途接手项目专用：先 reverse-spec 已有代码 | 本 plugin 新增 |
| `/td-archive` | 完成后归档 | `/opsx:archive` |
| `/td-system-audit` | 周期性对照系统工程主基调自检 | 本 plugin 新增 |

**新增的两个命令意义：**

- `/td-reverse-spec`：OpenSpec 假设你是 greenfield，但中途接手项目时直接 propose 大改动很危险。先 reverse-spec 已有代码，建立 baseline spec。
- `/td-system-audit`：钱学森"总体设计部"视角的工程化。周期性把 agent 当前的工作对照系统工程四条主基调过一遍，识别"局部优化制造全局失调"的风险。

### skill 在 atomcode 下的实际调用名

atomcode 加载 plugin 时，会自动给 plugin 内的 skill 加 `<plugin-name>:` 前缀。本 plugin 的 `name` 是 `total-design`，所以 6 个 td-* skill 在 atomcode 下：

| skill 逻辑名 | atomcode 调用名 |
|---|---|
| `td-propose` | `total-design:td-propose` |
| `td-explore` | `total-design:td-explore` |
| `td-apply` | `total-design:td-apply` |
| `td-reverse-spec` | `total-design:td-reverse-spec` |
| `td-archive` | `total-design:td-archive` |
| `td-system-audit` | `total-design:td-system-audit` |

`/` 菜单里看到的是 `/total-design:td-apply` 这种带前缀的形式；`use_skill` 工具调用也要传带前缀的全名。skill 文件 frontmatter 的 `name` 字段保持纯 `[a-z0-9_-]`（atomcode 校验规则，不允许 `:`），前缀由 atomcode 加载时拼接。

本 plugin 的 skill body 和 command body 都按"逻辑名 + 平台命名小节"的方式写：body 内引用其他 skill 用逻辑名（如 `wip-limit`、`human-in-loop`），由当前平台的加载器负责拼前缀；每个文件顶部有 `## 平台命名` 小节列出各平台下的实际调用名。这是为了预留本 plugin 未来扩展到非 atomcode 平台（Claude Code / Cursor / Codex）的能力——同一份 SKILL.md，不同平台用不同前缀。

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

19 个 skill，按调用方式分两组：

- **`user-invocable: true`**（7 个，行为层）：用户可在 `/` 菜单主动调，也可被 agent 自动触发
- **`user-invocable: false`**（12 个，约束层 + 配置层）：agent 自动触发，不暴露在 `/` 菜单

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

### 配置层（profile × tier 二维）

**profile 维度（仓库状态，全部 `user-invocable: false`）：**

- `profile-greenfield` — 零起步项目，full SDD
- `profile-brownfield` — 中途接手，reverse-spec 优先
- `profile-maintenance` — 上线维护，轻量 proposal，bug 走 systematic-debugging

**tier 维度（系统复杂度，全部 `user-invocable: false`）：**

- `tier-small` — 3–10 文件，单团队，constraints 弱强制
- `tier-medium` — 10–100 文件，多模块，constraints 中等强制
- `tier-large` — 100+ 文件 / 多团队 / 多仓库，constraints 强制，要求总体设计文档

两个维度都以 skill 形态存在，agent 根据现场判读激活哪一组。

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

## 设计文档

完整设计沉淀见 `thoughts/total-design.md`（在源 thinking 仓库里），覆盖：

- 定位（客户 + 三种进场现场 + 价值主张）
- 三层结构详解
- 钱学森系统工程主基调四条
- profile × tier × constraint 强度矩阵
- atomcode plugin 规范事实清单（来自源码）
- 4 阶段实现路径
- 开放问题

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
