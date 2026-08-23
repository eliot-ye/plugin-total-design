# total-design v1.3.0 发布说明

> 面向使用态用户：升级前请先读「⚠️ 行为变更」与「升级步骤」。

## 本版本是什么

1.3.0 是一次**内部架构重构 + 流程硬化**版本：不新增命令，但改变了多个 skill 的运行语义。核心是四件事：

1. **配置层单一事实源化**：`constraint-matrix` 拆分为 `field-assessment`，三张强度表（表 1/2/3）收敛到四个 references 文件。以后改强度只改一处，tier/profile skill 只保留判据。
2. **wip-limit 从"软提示"变"硬约束"**：同时活跃 change 数超上限时，`/td-propose` 与 `/td-apply` 会**阻塞**，必须 archive 一个或显式 override。
3. **闭环贯通**：proposal 新增必填"预期行为模型"字段，贯通 apply 系统级验证与 archive"实际 vs 预期"复盘——综合集成从口号变成可执行的 artifact 字段。
4. **层次观归位**：支持子系统独立定 tier，跨子系统依赖按最高 tier 保守处理。

## ⚠️ 行为变更（升级后你会感受到的差异）

| 变更 | 旧行为 | 新行为 |
|---|---|---|
| WIP 超限 | 提示一下，不强制 | **硬阻塞** + override 流程（override 时触发 brooks-law / critical-buffer / human-in-loop 提醒） |
| 用户说"开始执行" / "go" | 直接触发 executing-plans | 应走 `/td-apply`（执行入口统一） |
| proposal 必填字段 | "系统工程影响评估"节 | 节内新增 **"预期行为模型"** 字段（旧 change 缺字段不阻塞，apply 时降级处理） |
| tier-large apply | — | proposal 必须附**总体设计文档**（4 个必填字段），缺则阻塞 apply |
| 架构 review | apply 时做 | propose 阶段就做（步骤 7），apply 只复核是否改过 |

## 升级步骤

1. **bump 版本**：`plugin.json` + `marketplace.json` 的 `version` 改为 `1.3.0`（description 保持纯 ASCII）。
2. **重新发布/安装**：把仓库内容同步到 marketplace 安装副本（`~/.atomcode/plugins/marketplaces/total-design-marketplace/`）。
3. **重新 trust**：`atomcode plugin trust total-design` —— hook 命令哈希已变更，不重新 trust 则 `SessionEnd` 状态兜底不激活。
4. **验证**：安装副本 skills/ 与仓库 `diff -rq` 一致；`plugin.json` 两边同为 1.3.0。

## 本次修复

- td-apply 不再误卡旧 change（缺"预期行为模型"字段降级不阻塞，与 td-archive 兜底对称）。
- 解除 `writing-plans` ↔ `test-driven-development` 循环依赖。
- hook 报告完整性 marker 从模板动态读取，消除模板标题与脚本硬编码的隐式耦合。
- 修正步骤号错引、表 1 强度冗余、依赖技能节缺失。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.3.0] 条目。
