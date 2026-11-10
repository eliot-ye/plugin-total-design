# 命令与用法

> **读者**：已经装好 total-design、想按平台正确调用 `/td-*` 的使用者。
> **读完应能**：知道本平台的命令前缀、8 个命令各自做什么、按典型工作流跑通一次。

## 命令前缀

| 平台 | 命令前缀 | 例 |
|---|---|---|
| atomcode | `/td-propose` | `/td-propose add-x` |
| Claude Code | `/total-design:td-propose` 或 `/td-propose`（plugin namespace 自动附加） | `/td-propose add-x` |
| Pi Agent | `/td-propose`（extension 桥接）或 `/skill:td-propose`（skill 本体） | `/td-propose add-x` |
| DeepSeek Harness (DSH) | `/td-propose`（user-invocable skill 的 `/名称` 手势） | `/td-propose add-x`（参数原样传入，无 `$ARGUMENTS` 替换） |

本文后续示例统一用 `/td-xxx` 简写，按你的平台加对应前缀即可。

## 8 个命令

| 命令 | 用途 |
|---|---|
| `/td-init` | 初始化工作流：检查 OpenSpec 结构 + 配置 `.gitignore`（**仅用户触发**） |
| `/td-propose` | 创建 change，生成 proposal / design / tasks artifact |
| `/td-explore` | 写代码前的思考伙伴；需求不清时的主入口 |
| `/td-apply` | 按 artifact 实施任务 |
| `/td-reverse-spec` | 中途接手项目：先 reverse-spec 已有代码 |
| `/td-archive` | 完成后归档，做复盘 |
| `/td-system-audit` | 周期性对照系统工程主基调自检 |
| `/td-list` | 列出所有活跃 change 态势（只读） |

`td-init` 是唯一仅用户可触发的命令；其余 6 个 `td-*` 命令也可被 agent 自动触发；`td-list` 只读、无同名 skill。

## 平台差异

### atomcode

`/td-*` 直接可用。hook 生效前需 `atomcode plugin trust total-design`（只影响 `.td-state/` 兜底）。

### Claude Code

插件命名空间自动附加，`/total-design:td-propose` 与 `/td-propose` 等价。

### Pi Agent

两种等价写法：`/skill:td-propose`（skill 本体）或 `/td-propose`（extension 桥接）。

extension 注册了 8 个 `/td-*` 短命令——7 个桥接到同名 skill，只读的 `/td-list` 无同名 skill、由 extension 原生实现（跑 `openspec list`）。因此 **Pi 端 `/td-list` 可用**。

### DeepSeek Harness (DSH)

没有 `commands/` 目录加载，7 个 `td-*` 命令由同名 user-invocable skill 的 `/名称` 手势等价承载：

- 参数原样留在消息里，**没有 `$ARGUMENTS` 替换**——`/td-apply add-x` 中的 `add-x` 只是文本
- `td-list` 无同名 skill，**DSH 下不可用**，直接跑 `openspec list` 代替

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

## 多人协作

**初始化**：先跑 `/td-init` 从源头配置 `.gitignore` 忽略 `openspec/.td-state/`——状态文件可从文件系统事实推导，提交进 git 只制造冲突。

**冲突裁决**：假冲突（`.td-state/` 状态文件）用 gitignore 从源头消除；真冲突（`openspec/specs/` 两 change 改同一分系统契约）是 feature——交给总体设计部（人）裁决，agent 不自动挑版本。

**协作约定**：一个 change 一个 owner、一个 change 一个分支 + PR；`openspec/specs/` / `openspec/config.yaml` / `openspec/changes/` 必须提交，不要 ignore。`openspec/todo.md` 是个人本地 backlog，不纳入版本库（`/td-init` 已把它写进 `openspec/.gitignore`），跨机器/跨人不通过 git 同步。

## 常见问题

| 现象 | 原因与处理 |
|---|---|
| `/td-propose` 找不到 | 确认已装好且新开会话；Claude Code 试 `/total-design:td-propose` |
| hook 不生效（`.td-state/` 没校正） | atomcode：`atomcode plugin trust total-design`；Claude Code：按其 trust 机制授权；Pi：检查 extension 是否加载；DSH：无 hook，属预期 |
| DSH 下 `/td-list` 不可用 | 无同名 skill，直接用 `openspec list` |
| DSH 下参数没被替换 | `/名称` 手势不做 `$ARGUMENTS` 替换，参数只是普通文本 |
| skill 没出现（DSH） | 确认 `total-design-skill-provider` 行已启用；`dsh --profile <name> --dump-config` 查看 |
| `references/` 文件读不到 | 相对路径按 skill 所在目录解析；先确认 skill 已加载（加载结果会给出 base directory） |
