---
name: td-init
description: 初始化 total-design 工作流：检查 OpenSpec 结构 + 配置 .gitignore 防多人协作假冲突。触发场景：用户说"初始化"、"td init"、"开始用 td"、"搭 td 工作流"、"加 .gitignore"。
user-invocable: true
disable-model-invocation: true
argument-hint: (无参数)
---

# td-init

初始化 total-design 工作流的一次性入口。保证两件事就绪：**OpenSpec 契约层结构**（specs / changes）和**多人协作的 git 边界**（`.td-state/` 不进版本库）。

## 依赖技能

- `system-engineering`
- `constraint-matrix`

## 服务的主基调原则

**系统工程主基调第 1 条：系统工程。**

init 是"把系统的工作方式先立起来"——先有 specs 基线、change 目录、git 边界，后续每个局部动作才有从整体性能反推的立足点。没有框架就开工，是"局部动作制造全局失调"的第一个来源。

**系统工程主基调第 2 条：总体设计部。**

多人协作的 git 边界（`.td-state/` 可推导状态不进版本库）是总体设计部视角的工程决策：状态能从文件系统事实推导，就不该让 git 冲突假装它很重要。

## 步骤

### 1. 激活主基调与配置层

激活主基调与配置层。只注入强度不做判断，按下述三步序列执行：

1. **`system-engineering`** — 主基调四条进入上下文。init 是"把系统的工作方式先立起来"。
2. **profile × tier 识别** — 执行 `constraint-matrix` 的「识别流程」节，判读 `$_TD_PROFILE` / `$_TD_TIER`。greenfield 项目（仓库空或只有脚手架）通常判为 `profile-greenfield`；init 阶段 profile/tier 可能还没建立 `.td-state/` 缓存，按"文件不存在现判"处理。
3. **其余 constraint** — 只把强度值读入上下文，不在本步判断是否触发。

### 2. 检查 OpenSpec 结构

检查 `openspec/` 目录是否存在：

- **不存在** → 初始化 OpenSpec 契约层：
  1. 检查 `openspec` CLI 是否可用（`openspec --version`）。
  2. **CLI 不可用 → 代劳创建基础结构**（不阻塞初始化，用文件工具创建目录）：
     - `openspec/specs/` — 主 spec 目录
     - `openspec/changes/` — 活跃 change 目录
     - `openspec/changes/archive/` — 归档 change 目录
     - 提示用户："`openspec` CLI 未安装，已代劳创建基础结构。后续 `/td-propose` / `/td-apply` / `/td-archive` 依赖 CLI，建议安装 `npm install -g @fission-ai/openspec@latest`。"
  3. **CLI 可用 → 运行 `openspec init`** 建立基础结构（与代劳方案产物一致，CLI 就绪时用官方路径更稳）。
- **已存在** → 跳过，继续步骤 3。

### 3. 配置 .gitignore（核心步骤）

检查项目根 `.gitignore` 是否已包含 `openspec/.td-state/`：

- **已包含** → 跳过，提示"已配置"。
- **未包含** → 在 `openspec/.gitignore` 创建/追加以下片段（不碰根 `.gitignore`；嵌套 gitignore 的路径相对 `openspec/` 目录，规则只作用于 openspec 子树，不会误伤根目录其他内容）：

```gitignore
# total-design 本地状态：全部可从文件系统事实推导，不进版本库
.td-state/
```

  - `openspec/.gitignore` 不存在 → 创建该文件并写入
  - 已存在 → 追加（不覆盖已有内容）；若已包含 `.td-state/` 条目 → 跳过（幂等）

**为什么**：`.td-state/` 下所有状态文件（`profile-tier.yaml` / `archive-counter.yaml` / `audit-history.yaml` / `audits/`）都能从文件系统事实推导（`archive/` 目录、`audits/*.md` 等），提交进 git 只会制造假冲突——两人同时 archive / audit 时对同一份 YAML 读改写，git 报冲突或静默丢失。忽略后冲突面归零，文件仍留在本地，plugin（含 `SessionEnd` hook）照常读写。

**必须提交、不要 ignore， 文件可以不存在**：`openspec/config.yaml`（团队共享 context）、`openspec/specs/`（主 spec）、`openspec/changes/`（change 资产）、`openspec/todo.md`。

### 4. 老项目迁移检查

用 `git ls-files` 检查 `.td-state/` 是否已被 git 跟踪（加 .gitignore 之前就提交过的老项目）：

```bash
git ls-files openspec/.td-state/
```

- **有输出** → 提示用户执行一次取消跟踪（**必须先征得用户确认**，这是破坏性 git 操作）：

```bash
git rm -r --cached openspec/.td-state/
```

  `.td-state/` 文件仍留在本地（plugin 正常读写），只是不再进版本库。确认后执行，并建议提交这次变更。
- **无输出** → 跳过。

### 5. 首次引导填 config.yaml context

与 `td-propose` 步骤 2 同一引导流程：读 `openspec/config.yaml` 的 `context` 字段；若为空或模板默认值，一次问完 tech stack / conventions / domain 三个问题，答案写入 `context` 字段。用户跳过 → 保持空，不阻塞。init 阶段问一次，后续 td-propose / td-explore 都能读到，避免重复打扰。

### 6. 完成输出

输出初始化结果：

- OpenSpec 结构：就绪（新建 / 已有）
- `.gitignore`：根目录已有 / openspec/.gitignore 已创建或追加 / 无需
- 老项目迁移：已完成 / 无需 / 待用户确认
- config context：已填写 / 跳过

## Guardrails

- **不覆盖**已有 `.gitignore` / `openspec/.gitignore` 内容，只追加
- `git rm --cached` 是破坏性 git 操作，**必须用户确认后**才执行
- 不修改 `openspec/specs/`、`openspec/changes/` 下的任何内容
- CLI 不可用时代劳创建**目录结构**即可——不创建/不伪造 artifact、spec、change 内容（那是 td-propose / td-reverse-spec 的职责）；CLI 可用时优先用 `openspec init`
- 可重复执行：幂等，已配置的项跳过
