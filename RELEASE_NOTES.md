# total-design v1.3.1 发布说明

> 面向使用态用户：升级前请先读「⚠️ 行为变更」与「升级步骤」。

## 本版本是什么

1.3.1 是 1.3.0 的**内容审核修复版**：不新增命令、不改变行为语义，修复"使用态 LLM 视角"审核发现的三类问题。1.3.0 的架构重构与流程硬化内容全部保留。

## 本次修复

- **消除平台工具名泄漏**：`td-propose` 正文不再写死平台工具名（`request_user_input` → 平台无关的"询问用户机制"）。
- **补齐依赖技能节**：`critical-buffer` / `brooks-law` / `delay-decision` / `human-in-loop` 新增「依赖技能」节，`wip-limit` 补列 `field-assessment`——依赖技能节与正文实际引用一致。
- **收敛重复段落**：3 个 profile 的「在各 tier 下的 constraint 强度」节由三处逐字重复收敛为引用式，统一锚定 `field-assessment` 的「下游引用强度的约定」节。

## ⚠️ 行为变更

1.3.1 无新增行为变更。1.3.0 引入的以下行为变更仍然适用：

| 变更 | 旧行为 | 新行为 |
|---|---|---|
| WIP 超限 | 提示一下，不强制 | **硬阻塞** + override 流程（override 时触发 brooks-law / critical-buffer / human-in-loop 提醒） |
| 用户说"开始执行" / "go" | 直接触发 executing-plans | 应走 `/td-apply`（执行入口统一） |
| proposal 必填字段 | "系统工程影响评估"节 | 节内新增 **"预期行为模型"** 字段（旧 change 缺字段不阻塞，apply 时降级处理） |
| tier-large apply | — | proposal 必须附**总体设计文档**（4 个必填字段），缺则阻塞 apply |
| 架构 review | apply 时做 | propose 阶段就做（步骤 7），apply 只复核是否改过 |

## 升级步骤

1. **bump 版本**：`plugin.json` + `marketplace.json` 的 `version` 改为 `1.3.1`（description 保持纯 ASCII）。
2. **重新发布/安装**：把仓库内容同步到 marketplace 安装副本（`~/.atomcode/plugins/marketplaces/total-design-marketplace/`）。
3. **重新 trust**：`atomcode plugin trust total-design` —— hook 命令哈希已变更，不重新 trust 则 `SessionEnd` 状态兜底不激活。
4. **验证**：安装副本 skills/ 与仓库 `diff -rq` 一致；`plugin.json` 两边同为 1.3.1。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.3.1] 条目。
