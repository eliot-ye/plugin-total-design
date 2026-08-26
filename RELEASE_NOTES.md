# total-design v1.4.0 发布说明

> 面向使用态用户：升级前请先读「⚠️ 行为变更」与「升级步骤」。

## 本版本是什么

1.4.0 是**双语化结构重构 + 使用态 LLM 视角审核修复版**：本 plugin 从单一中文版重构为**英文（默认加载）+ 中文（zh-CN 对应副本）**的双语结构，并基于四维度审核（逻辑冲突 / 语义重复 / 可精简 / 开发态描述残留）修复 6 类自包含性与双语一致性问题。使用态从 1.3.1 直接升级到 1.4.0。

## 本次重构

- **双语结构**：英文版在根目录 `skills/` + `commands/`（默认加载入口），中文版在 `zh-CN/skills/` + `zh-CN/commands/`（结构镜像根目录）。`plugin.json` 的 `skills` / `commands` 字段指向 `["./skills"]` / `["./commands"]`，加载器默认加载英文版。
- **AGENTS.md 新增「双语对应与同步修改」节**：作为编辑规则的硬约束子节，规定：
  - 文件清单 1:1 对应（校验命令：`diff <(cd skills && find . | sort) <(cd zh-CN/skills && find . | sort)` 应无输出）。
  - frontmatter 逻辑字段（`name` / `user-invocable` / `args` / `argument-hint`）逐字符一致。
  - 正文结构对应（中文版有 `## 服务的主基调原则` 节，英文版必须有对应 `## Served Keynote Principle(s)` 节）。
  - 跨语言不变量（逻辑名 / 命令名 / 路径 / CLI 命令 / 环境变量）逐字符一致。
  - **修改任一语言，必须立即同步另一种语言**——只改一种语言 = 制造双语失调 = bug。
  - 翻译漂移校验：逻辑名 grep 计数对比（`grep -c '\`<logical-name>\`' skills/` vs `zh-CN/skills/`），每个逻辑名计数应一致。
- **AGENTS.md 目录结构节更新**：反映 `zh-CN/` 子目录的新结构，补充 skills/commands 内容编排说明（英文默认 + 中文对应）。

## 本次审核修复

基于使用态 LLM 视角对 dev 态源的四维度审核，修复 6 类问题（不改变任何 skill 的运行时行为语义）：

- **锚点引用修正（A1）**：en 侧 3 处对 `tier-large` 文档节标题的引用写法统一（`delay-decision` / `td-apply` / `td-propose`），文档名 overall → general，命中实际标题 "General design document is mandatory"。zh 侧 3 处锚点原本正确，不动。
- **td-system-audit 反向触发注释（A2）**：en+zh 两处 :99 注释修正，`human-in-loop` 反向声明的位置从错误的"触发时机"节改为"正文已反向声明（见其场景 7）"。
- **依赖节头统一（A3）**：en 侧 14 个 SKILL.md 的依赖节标题统一为 `## Dependent Skills`（消除 `## Dependencies` / `## Dependency Skills` / `## Dependent Skills` 三种变体）。zh 侧 `## 依赖技能` 已统一，不动。
- **argument-hint 双语逐字符一致（B2）**：4 对 argument-hint 统一为 en 写法——`td-init` 的 `(无参数)`→`(no arguments)`，`td-system-audit` 的 `(可选, 默认 current-change)`→`(optional, default current-change)`（含对应命令文件）。满足 AGENTS.md「双语对应硬约束 #2：argument-hint 两套必须逐字符一致」。
- **field-assessment 格式补全（C1）**：en `field-assessment:16` 补 `## How It Is Referenced` 前缺空行（与 zh 侧对齐）。
- **命令术语一致性（C3）**：`commands/td-system-audit.md` description 修正 `baseline`→`keynote principles`、`total design department`→`general design department`，对齐 project 统一术语；同时修复命令文件 argument-hint 破坏（此前被错误去掉引号+冒号改等号，破坏 YAML frontmatter 解析）。

## ⚠️ 行为变更

| 变更 | 旧行为 | 新行为 |
|---|---|---|
| 默认加载语言 | 中文（单一版本） | **英文**（根目录 skills/commands 为英文版，plugin.json 默认指向） |
| 中文版位置 | 根目录 skills/commands | `zh-CN/skills/` + `zh-CN/commands/`（结构镜像根目录） |
| 双语同步 | 无（单一语言） | **硬约束**：修改任一语言必须立即同步另一种语言，违反 = bug |
| `## 依赖技能` 节定义 | 混合列入预加载 + 运行时触发技能 | **仅预加载清单**（`system-engineering` + `field-assessment`），运行时按需触发的技能不再列入 |
| 5 个 td-* 依赖节 | `td-explore` 含 `brainstorming`；其余 4 个仅 `system-engineering` + `field-assessment` | 全部 5 个仅 `system-engineering` + `field-assessment`（`td-explore` 的 `brainstorming` 属运行时激活，移除） |
| en 依赖节标题 | 三种变体（`## Dependencies` / `## Dependency Skills` / `## Dependent Skills`） | 统一为 `## Dependent Skills`（14 文件） |
| argument-hint（zh） | en/zh 不一致（`(no arguments)` vs `(无参数)` 等） | en/zh 逐字符一致（统一 en 写法） |

1.3.0/1.3.1 引入的以下行为变更仍然适用（语义不变，仅语言切换）：

| 变更 | 旧行为 | 新行为 |
|---|---|---|
| WIP 超限 | 提示一下，不强制 | **硬阻塞** + override 流程（override 时触发 brooks-law / critical-buffer / human-in-loop 提醒） |
| 用户说"开始执行" / "go" | 直接触发 executing-plans | 应走 `/td-apply`（执行入口统一） |
| proposal 必填字段 | "系统工程影响评估"节 | 节内新增 **"预期行为模型"** 字段（旧 change 缺字段不阻塞，apply 时降级处理） |
| tier-large apply | — | proposal 必须附**总体设计文档**（4 个必填字段），缺则阻塞 apply |
| 架构 review | apply 时做 | propose 阶段就做（步骤 7），apply 只复核是否改过 |

**不改变的**：所有 skill 的运行时行为语义、流程步骤、强度数值、artifact 流——审核修复仅为文本一致性收敛。

## 升级步骤

1. **bump 版本**：`plugin.json` + `marketplace.json` 的 `version` 改为 `1.4.0`（description 保持纯 ASCII）。
2. **重新发布/安装**：把仓库内容同步到 marketplace 安装副本（`~/.atomcode/plugins/marketplaces/total-design-marketplace/`）。
3. **重新 trust**：`atomcode plugin trust total-design` —— plugin 内容有变更，需重新 trust 确保新内容加载。
4. **验证**：
   - 安装副本 skills/ 与仓库 `diff -rq` 一致；`plugin.json` 两边同为 1.4.0。
   - 双语一致性校验：`diff <(cd skills && find . | sort) <(cd zh-CN/skills && find . | sort)` 应无输出；`diff <(cd commands && find . | sort) <(cd zh-CN/commands && find . | sort)` 应无输出。
   - argument-hint en/zh 逐字符一致：`td-init` / `td-system-audit` 的 skill + 命令文件 4 对 argument-hint 全部匹配。
   - 依赖节头统一：en 侧 19 个有依赖节的 SKILL.md 全部为 `## Dependent Skills`。
   - 锚点命中：`grep -r 'General design document is mandatory' skills/` 应在 `tier-large` 标题 + 3 处引用共 4 处匹配。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.4.0] 条目。
