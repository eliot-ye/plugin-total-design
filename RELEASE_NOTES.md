# total-design v1.4.0 发布说明

> 面向使用态用户：升级前请先读「⚠️ 行为变更」与「升级步骤」。

## 本版本是什么

1.4.0 是**双语化结构重构版**：本 plugin 从单一中文版重构为**英文（默认加载）+ 中文（zh-CN 对应副本）**的双语结构。根目录 `skills/` / `commands/` 为英文版（`plugin.json` 默认指向），`zh-CN/skills/` / `zh-CN/commands/` 为中文版，两套结构 1:1 镜像。

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

## ⚠️ 行为变更

| 变更 | 旧行为 | 新行为 |
|---|---|---|
| 默认加载语言 | 中文（单一版本） | **英文**（根目录 skills/commands 为英文版，plugin.json 默认指向） |
| 中文版位置 | 根目录 skills/commands | `zh-CN/skills/` + `zh-CN/commands/`（结构镜像根目录） |
| 双语同步 | 无（单一语言） | **硬约束**：修改任一语言必须立即同步另一种语言，违反 = bug |

1.3.0/1.3.1 引入的以下行为变更仍然适用（语义不变，仅语言切换）：

| 变更 | 旧行为 | 新行为 |
|---|---|---|
| WIP 超限 | 提示一下，不强制 | **硬阻塞** + override 流程（override 时触发 brooks-law / critical-buffer / human-in-loop 提醒） |
| 用户说"开始执行" / "go" | 直接触发 executing-plans | 应走 `/td-apply`（执行入口统一） |
| proposal 必填字段 | "系统工程影响评估"节 | 节内新增 **"预期行为模型"** 字段（旧 change 缺字段不阻塞，apply 时降级处理） |
| tier-large apply | — | proposal 必须附**总体设计文档**（4 个必填字段），缺则阻塞 apply |
| 架构 review | apply 时做 | propose 阶段就做（步骤 7），apply 只复核是否改过 |

## 升级步骤

1. **bump 版本**：`plugin.json` + `marketplace.json` 的 `version` 改为 `1.4.0`（description 保持纯 ASCII）。
2. **重新发布/安装**：把仓库内容同步到 marketplace 安装副本（`~/.atomcode/plugins/marketplaces/total-design-marketplace/`）。
3. **重新 trust**：`atomcode plugin trust total-design` —— hook 命令哈希未变更，但 plugin 内容大改，建议重新 trust 确保新内容加载。
4. **验证**：
   - 安装副本 skills/ 与仓库 `diff -rq` 一致；`plugin.json` 两边同为 1.4.0。
   - 双语一致性校验：`diff <(cd skills && find . | sort) <(cd zh-CN/skills && find . | sort)` 应无输出；`diff <(cd commands && find . | sort) <(cd zh-CN/commands && find . | sort)` 应无输出。
   - 逻辑名 grep 计数对比：每个 skill 逻辑名在 `skills/` 与 `zh-CN/skills/` 的引用计数应一致。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.4.0] 条目。
