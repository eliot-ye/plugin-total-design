# total-design

> 装上它，你的 agent 就有了一个总体设计部。

把 **OpenSpec**（契约层）+ **Superpowers**（行为层）+ **钱学森系统工程**（约束层主基调）封装成一个 code agent skill plugin，让装了它的 agent 从"一个会打字很快的助手"变成"一个有工程纪律的协作者"。支持 atomcode / Claude Code / Pi Agent，符合 [Agent Plugins 1.0.0](https://agent-plugins.org/specification) 规范（其他遵循该标准的客户端可通过根 `plugin.json` 自动识别）。详见 [AGENTS.md](AGENTS.md) 「支持的 code agent」。

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

**前置：** Node.js ≥20.19.0（OpenSpec CLI 与 SessionEnd hook 共用同一运行时）；OpenSpec CLI：`npm install -g @fission-ai/openspec@latest`

**选择你使用的 code agent：**

### atomcode

```bash
/plugin marketplace add <this-repo-url>
/plugin install total-design
```

或手动安装：

```bash
git clone <this-repo-url> ~/.atomcode/plugins/total-design
# 重启 atomcode session
```

**信任 SessionEnd hook**（仅 atomcode）：安装后首次运行会提示 hook 待授权，执行

```bash
atomcode plugin trust total-design
```

### Claude Code

```bash
claude plugin marketplace add <this-repo-url>
claude plugin install total-design
```

或用 `--plugin-dir` 直接指向本仓库目录（开发调试用）：

```bash
claude --plugin-dir <this-repo-path>
```

**hook 说明**：Claude Code 端会识别 `.claude-plugin/plugin.json` 的 `hooks` 字段，`hooks.json` 内的 `${CLAUDE_PLUGIN_ROOT}` 环境变量在 Claude Code 端有效；如需 hook 生效需按 Claude Code 的 trust 机制单独授权。

### Pi Agent

```bash
pi install git:<this-repo-url>
```

Pi 通过仓库根目录 `package.json` 的 `pi.skills` 字段加载 skills 目录。skill 在 Pi 里的调用格式是 `/skill:td-propose`（不是 `/td-propose`，见下方「命令格式」）。

**hook 说明**：Pi 无 hook 系统，需 TS extension 自建；本 plugin 未提供 Pi extension——Pi 端状态文件由 td-archive / td-system-audit 的正文步骤直接写入，不依赖 hook。

---

## 命令格式（各平台前缀差异）

| 平台 | 命令前缀 | 例 |
|---|---|---|
| atomcode | `/td-propose` | `/td-propose add-x` |
| Claude Code | `/total-design:td-propose` 或 `/td-propose`（plugin namespace 已自动附加） | `/td-propose add-x` |
| Pi Agent | `/skill:td-propose` | `/skill:td-propose add-x` |

后续章节的工作流示例统一用 `/td-xxx` 简写——按你使用的平台在开头加对应前缀即可。

---

## 命令清单

8 个 slash 命令，扁平 kebab-case：

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

`td-init` 是唯一仅用户可触发的命令；其余 6 个 td-* command 也可被 agent 自动触发；`td-list` 只读、无同名 skill。

---

## Skill 清单

17 个 skill 分布在四层：

| 层 | 数量 | 代表 |
|---|---|---|
| 约束层 | 2 | `system-engineering` 主基调 + `constraints` 承载 5 份局部规律 |
| 行为层 | 6 | writing-plans / executing-plans / test-driven-development / requesting-code-review / systematic-debugging / verification-before-completion |
| 配置层 | 2 | `field-assessment`（profile×tier 配置入口）+ `todo-pool`（`openspec/todo.md` 格式约定） |
| 契约层 | 7 | 7 个 td-* skill，与 command 一一对应 |

除 7 个 td-* 外全部 `user-invocable: false`，由 agent 按上下文自动触发。详细规则见 [CONTRIBUTING.md](CONTRIBUTING.md) 与 [AGENTS.md](AGENTS.md)。

---

## 典型工作流

**零起步项目：**

```
1. /td-explore "我想建一个 X"    ← 先探索
2. /td-propose add-x             ← 创建 change
3. /td-apply add-x               ← 按 tasks.md 实施
4. /td-system-audit              ← 周期性自检
5. /td-archive add-x             ← 归档
```

**中途接手项目：**

```
1. /td-reverse-spec              ← 建立 baseline
2. /td-explore "我想改 X"        ← 基于 baseline 探索
3. /td-propose modify-x          ← 创建 change
4. /td-apply modify-x            ← 实施
5. /td-archive modify-x          ← 归档
```

**上线维护（修 bug）：**

```
1. /td-propose fix-bug-<name>    ← 轻量 proposal
2. /td-apply fix-bug-<name>      ← 修复 + 回归测试
3. /td-archive fix-bug-<name>    ← 归档
```

---

## 多人协作

**初始化：** 先跑 `/td-init` 从源头配置 `.gitignore` 忽略 `openspec/.td-state/`——状态文件可从文件系统事实推导，提交进 git 只制造冲突。

**冲突裁决：** 假冲突（`.td-state/` 状态文件）用 gitignore 从源头消除；真冲突（`openspec/specs/` 两 change 改同一分系统契约）是 feature——交给总体设计部（人）裁决，agent 不自动挑版本。

**协作约定：** 一个 change 一个 owner、一个 change 一个分支 + PR；`openspec/specs/` / `openspec/config.yaml` / `openspec/changes/` / `openspec/todo.md` 必须提交，不要 ignore。

---

## 贡献

见 [CONTRIBUTING.md](CONTRIBUTING.md)。

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
