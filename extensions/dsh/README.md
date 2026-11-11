# total-design for DeepSeek Harness (DSH)

本目录把 total-design 包装为 DSH 插件（Cordis bundle），让 DSH 用户能像装
atomcode / Claude Code / Pi 插件一样把它装进自己的 profile。

只改动/新增本目录与根 `package.json` 的 `dsh` 字段；`skills/`、`commands/`、
`hooks/`、根 `plugin.json`、`.claude-plugin/`、`AGENTS.md` 均保持不变，
atomcode / Claude Code / Pi 的加载现状不受影响。

## 这是什么

- `index.mjs` —— DSH skill provider（ESM、零运行时依赖）。从 `../../skills/*/SKILL.md`
  读取 18 个 skill，经 `ctx.skills.registerProvider` 注册进会话目录。
- `cordis.patch.yml` —— bundle 补丁层：insert 一行 `{id: total-design-skill-provider, name: ./index.mjs}`。
  `name` 是相对本 patch 文件的路径，因此无需改根 `package.json` 的 `main`/`exports`。
- 本文件 —— 安装说明与已知限制。

## 安装

### 方式一：Web 插件页（Desktop profile 唯一可用入口）

1. 打开 Harness → 侧边栏 **插件** 页。
2. **添加插件**，填入本仓库的**绝对路径**（例如 `/Users/eliot/my/plugin-total-design`）。
3. 启用 `total-design-skill-provider` 行；重启或等待 HMR 生效。

### 方式二：`dsh plugin` CLI（非 desktop profile）

```bash
dsh plugin --profile <name> add /absolute/path/to/plugin-total-design
dsh --profile <name> --dump-config   # 确认 total-design-skill-provider 行已插入
```

### 方式三：`plugin_manager` 工具（Creator 模式）

```text
plugin_manager install_bundle target: /absolute/path/to/plugin-total-design
```

安装后 18 个 skill 会出现在会话目录；`user-invocable: true` 的 skill
（7 个 `td-*` + `requesting-code-review` + `systematic-debugging`）可用
`/td-propose`、`/td-apply` 这类 `/名称` 手势直接调用。

## 已知限制（DSH 下）

- **`commands/*.md` 不被扫描** —— DSH 的 `/` 命令只由插件编程注册。7 个
  `td-*` 命令由同名 user-invocable skill 的手势天然等价，无需移植；
  **`td-list`（`openspec list` 查询）没有同名 skill，在 DSH 下缺失**，
  需要时可用 bash 直接跑 `openspec list`。
- **`hooks/`（SessionEnd）无对应加载器** —— DSH 没有 Claude Code 式
  `hooks.json`/`SessionEnd`；`.td-state/` 的状态校正在 DSH 下需改写为
  Cordis 插件事件订阅（未提供，属后续工作）。
- **`argument-hint` 被忽略** —— DSH 只认 `name`/`description`/
  `whenToUse`/`metadata`/`disable-model-invocation`/`user-invocable`；
  `argument-hint` 属未知字段，被静默丢弃，不影响加载。
- **`td-propose`（约 10.2k 字符）与 `td-apply`（约 8.3k 字符）超过 DSH
  官方 skill 的 ~8192 字符惯例** —— 仅在压缩压力触发时
  `tool-result-pruner`（默认前 4096 + 后 1024）可能裁剪正文中段；
  无压力时不受影响。需要时建议压缩这两篇。
- **分发即分发可执行代码** —— DSH 插件是宿主进程内的 JS，不受工作区
  沙箱限制；本仓库由此从「纯 Markdown 插件」变成「含薄 JS 的插件」。

## 一致性

- 根 `package.json` 的 `dsh.bundle.patch` 指向本目录 `cordis.patch.yml`。
- DSH 只读根 `package.json` 的 `dsh` 字段；根 `plugin.json`（Agent Plugins
  1.0.0）、`.claude-plugin/plugin.json`、`pi` 字段对 DSH 均不生效。
