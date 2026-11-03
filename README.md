# total-design

> 装上它，你的 agent 就有了一个总体设计部。

把 **OpenSpec**（契约层）+ **Superpowers**（行为层）+ **钱学森系统工程**（约束层主基调）封装成一个 code agent skill plugin，让装了它的 agent 从"一个会打字很快的助手"变成"一个有工程纪律的协作者"。

支持 **atomcode / Claude Code / Pi Agent / DeepSeek Harness (DSH)**，符合 [Agent Plugins 1.0.0](https://agent-plugins.org/specification) 规范（其他遵循该标准的客户端可通过根 `plugin.json` 自动识别）。

---

## 为什么需要

AI coding agent 的失控不是"模型不够强"，是**没有工程纪律**：

- agent 一上来就写代码，不先想清楚要建什么
- agent 跳过测试，自称"完成"了其实没验证
- 同时开多个任务，每个都半途而废
- 局部最优但全局失调——改一处破坏系统另一处的契约

这个 plugin 把纪律做成可装可拆，装上就有。

---

## 三层结构

- **约束层（constraints）** — 钱学森系统工程主基调 + Brooks / Goldratt / 精益局部规律；局部优化不能制造全局失调
- **行为层（skills）** — explore → plan → TDD → review → verify 强制流程，触发式不靠人盯
- **契约层（commands）** — propose → apply → archive 的 artifact 流，agree before you build

约束层是第零层，是另外两层立起来的前提。

---

## 三大来源

| 来源 | 角色 | 出处 |
|---|---|---|
| **OpenSpec** | 契约层：propose → apply → archive | https://github.com/Fission-AI/OpenSpec |
| **Superpowers** | 行为层：explore → plan → TDD → review → verify | https://github.com/obra/superpowers |
| **钱学森系统工程** | 约束层主基调：系统工程 / 总体设计部 / 综合集成 / 开放的复杂巨系统 | 《系统工程论》《创建系统学》 |

不原样照搬：OpenSpec 转译成 code agent slash 命令、Superpowers 转译成 skill、钱学森做成局部约束的前提。

---

## 安装

**前置**：Node.js ≥20.19.0、OpenSpec CLI（`npm install -g @fission-ai/openspec@latest`）。DSH 端由 Harness 自带 Node 运行时。

| 平台 | 安装 |
|---|---|
| atomcode | `/plugin marketplace add <repo>` → `/plugin install total-design`（或 clone 到 `~/.atomcode/plugins/`） |
| Claude Code | `claude plugin marketplace add <repo>` → `claude plugin install total-design`（或 `--plugin-dir`） |
| Pi Agent | `pi install git:<repo-url>` |
| DeepSeek Harness (DSH) | 侧边栏「插件 → 添加插件」填仓库绝对路径，或 `dsh plugin --profile <name> add <path>` |

各平台的详细步骤、hook 授权（atomcode / Claude Code）、DSH 安装细节见 **[docs/user/install.md](docs/user/install.md)**。

---

## 文档

| 我是谁 / 我想做什么 | 读 |
|---|---|
| 用户：安装 | [docs/user/install.md](docs/user/install.md) |
| 用户：命令用法、各平台差异、常见问题 | [docs/user/usage.md](docs/user/usage.md) |
| 维护者：四个平台怎么加载、新增平台要动哪里 | [docs/maintainer/platforms.md](docs/maintainer/platforms.md) |
| 维护者：manifest 字段、一致性、发版流程 | [docs/maintainer/manifests.md](docs/maintainer/manifests.md) |
| 维护者：SKILL / 命令编写细节 | [docs/maintainer/content-authoring.md](docs/maintainer/content-authoring.md) |
| 维护者：架构、依赖图谱、设计评估维度 | [docs/explanation/architecture.md](docs/explanation/architecture.md) |
| 维护者：使用态 LLM 审核四维清单 | [docs/explanation/review-standard.md](docs/explanation/review-standard.md) |

历史设计文档在 [docs/archive](docs/archive) 与 [docs/feat](docs/feat)。开发 agent 的 always-on 规则见 [AGENTS.md](AGENTS.md)。

---

## 命令清单

8 个 slash 命令（各平台前缀差异见 [usage.md](docs/user/usage.md#命令前缀)）：

| 命令 | 用途 |
|---|---|
| `/td-init` | 初始化工作流：检查 OpenSpec 结构 + 配置 `.gitignore`（仅用户触发） |
| `/td-propose` | 创建 change，生成 proposal / design / tasks artifact |
| `/td-explore` | 写代码前的思考伙伴 |
| `/td-apply` | 按 artifact 实施任务 |
| `/td-reverse-spec` | 中途接手项目：先 reverse-spec 已有代码 |
| `/td-archive` | 完成后归档 |
| `/td-system-audit` | 周期性对照系统工程主基调自检 |
| `/td-list` | 列出所有活跃 change 态势（只读） |

各平台调用差异（Pi extension 桥、DSH 的 `/名称` 手势与缺失项）见 [usage.md · 平台差异](docs/user/usage.md#平台差异)。

---

## Skill 清单

18 个 skill 分布在四层：

| 层 | 数量 | 代表 |
|---|---|---|
| 约束层 | 2 | `system-engineering` 主基调 + `constraints` 承载 5 份局部规律 |
| 行为层 | 6 | writing-plans / executing-plans / test-driven-development / requesting-code-review / systematic-debugging / verification-before-completion |
| 配置层 | 3 | `field-assessment`（profile×tier 配置入口）+ `todo-pool`（`openspec/todo.md` 格式约定）+ `agents-md-hygiene`（用户项目 agent 指令文件编写规范） |
| 契约层 | 7 | 7 个 td-* skill，与 command 一一对应 |

除 7 个 td-* 外全部 `user-invocable: false`，由 agent 按上下文自动触发。

---

## 一次完整的工作流（零起步项目）

```
1. /td-explore "我想建一个 X"    ← 先探索
2. /td-propose add-x             ← 创建 change
3. /td-apply add-x               ← 按 tasks.md 实施
4. /td-system-audit              ← 周期性自检
5. /td-archive add-x             ← 归档
```

中途接手、修 bug、多人协作约定见 [docs/user/usage.md](docs/user/usage.md)。

---

## 贡献

见 [CONTRIBUTING.md](CONTRIBUTING.md)。平台规范与编写细则见 [docs/maintainer](docs/maintainer)。

## 行为准则

见 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

## License

[MIT](LICENSE) © total-design contributors

---

## 致谢

本 plugin 站在三个巨人的肩膀上：

- [**OpenSpec**（Fission-AI）](https://github.com/Fission-AI/OpenSpec)—— 契约层方法论来源
- [**Superpowers**（Jesse Vincent / obra）](https://github.com/obra/superpowers)—— 行为层方法论来源
- **钱学森的工程理论** —— 系统工程思想来源

没有他们的工作，这个 plugin 不会存在。
