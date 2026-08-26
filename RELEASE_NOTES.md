# total-design v1.5.0 发布说明

> 面向使用态用户：升级前请先读「⚠️ 行为变更」与「升级步骤」。

## 本版本是什么

1.5.0 是**单语化结构版**：1.4.0 的双语结构（英文根目录 + `zh-CN/` 中文副本）简化为单一中文版。根目录 `skills/` / `commands/` 的内容由中文版替换，`zh-CN/` 目录删除。所有 skill 的运行时行为语义、流程步骤、强度数值、artifact 流——零变更。使用态从 1.4.0 直接升级到 1.5.0。

## 本次变更

- **删除英文副本**：根目录 `skills/` / `commands/` 下的英文版内容（39 + 8 文件）由 `zh-CN/` 下的中文版替换。
- **删除 `zh-CN/` 目录**：`zh-CN/skills/` 39 文件 + `zh-CN/commands/` 8 文件全部删除，中文版内容已移入根目录。
- **`plugin.json` 路径不变**：`skills: ["./skills"]` / `commands: ["./commands"]` 仍指向根目录，加载器加载的从英文版变为中文版。
- **AGENTS.md 精简**：目录结构节删除 `zh-CN/` 子目录；「双语对应与同步修改」节从 6 条硬约束缩减为单语说明 + 历史备注。
- **CONTRIBUTING.md 不动**：「中文 vs 英文」节原本就规定 skill 正文以中文为主，此节内容仍然适用。

## ⚠️ 行为变更

| 变更 | 1.4.0 旧行为 | 1.5.0 新行为 |
|---|---|---|
| 加载语言 | 英文（根目录 skills/commands 为英文版） | **中文**（根目录 skills/commands 为中文版） |
| `zh-CN/` 目录 | 存在，结构镜像根目录 | **删除** |
| 双语同步负担 | 修改任一语言必须立即同步另一种语言 | **无**（单一语言） |
| skill frontmatter description | 英文 | 中文（触发词语义与 1.4.0 中文版一致） |

**不改变的**：所有 skill 的运行时行为语义、流程步骤、强度数值、artifact 流、依赖关系——零变更。本次仅为语言版本切换 + 目录结构精简。

## 升级步骤

1. **bump 版本**：`plugin.json` + `marketplace.json` 的 `version` 改为 `1.5.0`（description 保持纯 ASCII）。
2. **重新发布/安装**：把仓库内容同步到 marketplace 安装副本（`~/.atomcode/plugins/marketplaces/total-design-marketplace/`）。
3. **重新 trust**：`atomcode plugin trust total-design` —— plugin 内容有变更，需重新 trust 确保新内容加载。
4. **验证**：
   - 安装副本 skills/ 与仓库 `diff -rq` 一致；`plugin.json` 两边同为 1.5.0。
   - `zh-CN/` 目录不存在：`test ! -d zh-CN && echo "OK"`。
   - skill frontmatter description 为中文：`head -3 skills/system-engineering/SKILL.md` 应显示中文 description。
   - 逻辑名/命令名/路径/CLI 命令/环境变量不变：`wip-limit` / `/td-propose` / `field-assessment/references/strength-matrix.md` / `openspec list` / `$_TD_TIER` 等。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.5.0] 条目。
