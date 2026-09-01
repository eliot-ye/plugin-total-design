# total-design v1.7.0 发布说明

> 面向使用态用户：升级前请先读「⚠️ 行为变更」与「升级步骤」。

## 本版本是什么

1.7.0 是**探索阶段不落盘 + 工作流健壮性修复版**：

**核心变更**：`brainstorming` 取消落盘 spec——explore 阶段成果改为对话形式交付，不再写 spec 草稿；且流程内强制 `delay-decision` 检查，防止"未确认需求就跳入 `/td-propose`"。

**健壮性修复**：修复 td 工作流审核发现的一批问题——断链锚点、audit 频率口径、hook 清单语义、spec 校验兼容、gitignore 覆盖判定、config.yaml 引导分支。

**文档清理**：统一修辞风格、精简冗余描述、清理开发态语句、简化技能描述。

## 本次变更

### 核心变更：explore 不落盘 spec

- **`brainstorming` 删除第 5/6 步**（分段呈现 spec、保存 spec 文档）：explore 阶段成果以对话形式交付（保留在会话上下文），不再落盘 spec 草稿。用户要求落盘时提示走 `/td-propose`。
- **`td-propose` 步骤 6.a 输入源收敛**：由"brainstorming spec 草稿"改为"`td-explore` 候选方向评估"；greenfield explore 检查判据去掉对 brainstorming 落盘的引用。
- **流程内强制 delay-decision 检查**：`brainstorming` 完成候选方向评估后立即执行 `constraints` 的 `references/delay-decision.md` 检查——
  - **不可逆决策**（分系统边界 / 公共 API）：信息不足时不仓促闭合，在 `td-explore` 内继续收集信号，信息足够后由用户拍板再进 `/td-propose`。
  - **可逆决策**（实现方案）：按「延迟不等于拖延」处理，不构成进入 propose 的阻塞。

### 工作流健壮性修复

- **td-reverse-spec spec 产出格式对齐 openspec validate**：Requirement 含 SHALL 规范陈述，Purpose / Scenario 结构对齐官方校验器（消除 spec 校验兼容问题）。
- **td-archive project audit 阈值改整数倍口径**：`tier-small` / `tier-medium` 判定由"`count` ≥ 阈值"改为"`count` 为阈值的整数倍"（count 是累计值不重置，恰好每第 N 次 archive 触发一次建议），与累计计数器兼容。
- **td-system-audit**：频率触发（表 3）作用域限定，豁免信号触发与修复闭环重跑；步骤 2 补 `audits/.incomplete.log` 消费入口。
- **hook `td_state_sync`**：`audits/.incomplete.log` 改整文件重写（现状快照，自动去重 / 已解决项退出 / 已删除报告消失）；修复无待补条时的短路门控。
- **td-init gitignore 检查统一**：`openspec/.td-state/` 是否被覆盖改为"任一层 .gitignore 覆盖"（`git check-ignore -v` 实测）。
- **wip-limit 检测计数口径**：活跃 change 计数用 `openspec list`（`archive/` 不计入）。
- **config-context-guidance 补文件不存在分支**：`openspec/config.yaml` 不存在时先创建骨架再按空值流程走。
- **断链锚点修正**：`td-explore` Guardrails、`td-propose` critical-buffer「标注规范」、`td-apply` 6.3 audit 落盘句。

### 配置层快车道

- **`field-assessment` 快车道读取策略**：命中单一 profile/tier 变体时直接读命中份，跳过其余判读，减少读取开销。

## ⚠️ 行为变更

| 变更 | 1.6.0 旧行为 | 1.7.0 新行为 |
|---|---|---|
| explore 产物形态 | `brainstorming` 分段呈现并保存 spec 文档 | **对话形式交付，不落盘 spec**（需要落盘走 `/td-propose`） |
| propose 输入源 | 步骤 6.a 读 brainstorming spec 草稿 / td-explore 候选方向 | **仅读 td-explore 候选方向评估** |
| explore→propose 衔接 | brainstorming 收敛后直接可 propose | **流程内强制 delay-decision 检查**（不可逆决策信息不足不仓促闭合） |
| archive project audit 触发 | `count` ≥ 表 3 阈值 | **`count` 为阈值的整数倍**（每第 N 次 archive 触发一次建议） |
| reverse-spec spec 产出 | 结构未对齐校验器 | **Requirement 含 SHALL、Purpose/Scenario 结构对齐 openspec validate** |
| .incomplete.log 维护 | hook 增量追加 | **整文件重写（现状快照）**，自动去重与退出 |

**不改变的**：表 1/2/3 强度数值（`field-assessment` 单一事实源）、td-* artifact 流（propose → apply → archive）、WIP 硬约束 + override 机制、5 个子约束执行规则、`.td-state/` 持久化约定——零变更。

## 升级步骤

1. **bump 版本**：根目录 `plugin.json` + `.atomcode-plugin/plugin.json` + `marketplace.json` 的 `version` 同步改为 `1.7.0`（description 保持纯 ASCII）。
2. **重新发布/安装**：把仓库内容同步到 marketplace 安装副本（`~/.atomcode/plugins/marketplaces/total-design-marketplace/`）。
3. **重新 trust**：`atomcode plugin trust total-design` —— plugin 内容有变更，需重新 trust 确保新内容加载。
4. **验证**：
   - 安装副本 skills/ 与仓库 `diff -rq` 一致；三份清单（根目录 `plugin.json` / `.atomcode-plugin/plugin.json` / `marketplace.json`）版本号同为 1.7.0。
   - brainstorming 已无落盘步骤：`grep -c '保存 spec' skills/brainstorming/SKILL.md` → 0；且 `grep -l 'delay-decision' skills/brainstorming/SKILL.md` 有输出。
   - reverse-spec 产出格式对齐：`grep -l 'SHALL' skills/td-reverse-spec/SKILL.md` 有输出。
   - 逻辑名/命令名/路径/CLI 命令/环境变量不变：`constraints` / `field-assessment` / `/td-propose` / `openspec list` / `$_TD_TIER` 等。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.7.0] 条目。
