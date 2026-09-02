# total-design v1.7.1 发布说明

> 面向使用态用户：升级前请先读「⚠️ 行为变更」与「升级步骤」。

## 本版本是什么

1.7.1 是**探索流程伪决策点修复版**：

**核心修复**：修复 apply 前"机械性 reconcile 造成的打断"——`td-explore` / `brainstorming` 等不再硬性要求产出"N 个候选方向"，决策已闭合、无新信息时正确输出是"没有需要你的决策点，直接继续推进"，而非为凑格式生成伪选项。

**判定固化**：`human-in-loop` 明确"必停基线优先，直接推进是补集"的放行判定——放行需同时满足"未命中必停基线 + 用户已授权继续 + 在已闭合决策框架内"。

## 本次变更

### 核心修复：去掉候选方向硬性数量要求

- **`td-explore` 步骤 4 产物要求**：从"必须产出至少 2 个候选方向"改为按需产出；决策已闭合、无新信息时，正确输出一句话"没有需要你的决策点，直接继续推进"，不再为凑格式生成伪选项。
- **`brainstorming` 步骤 2**：从"给 2–3 个候选方向"改为按需给出，不凑数量。
- **`delay-decision.md`**：删"2–3 个候选方案 / 方向"硬性数字，"同时保留候选方案的 runnable 示例"、"产生候选方向后"按需处理。
- **`profile-greenfield.md` 特殊规则 1**：从"explore 至少探索 2 个候选方向"改为"先 `/td-explore` 探索充分再 propose"。
- **`td-propose` 步骤 3 greenfield explore 检查**：判据从"产物含 ≥2 候选方向"改为"会话内已做过充分探索（出现过 `/td-explore` 调用且完成探索对话）"。

### 判定固化：必停基线优先，直接推进是补集

- **`human-in-loop` 不需要停下来的场景节**：新增判定优先级——第 1–5 类必停基线（+ tier/profile 加成）是必须停的下限，命中即停，**不因"无新信息"而跳过**；只有必停场景全部未命中且无新增关键决策点时，才适用"直接推进"。放行充分前提：未命中必停基线 **且** 用户已授权继续 **且** 在已闭合决策框架内。

## ⚠️ 行为变更

| 变更 | 1.7.0 旧行为 | 1.7.1 新行为 |
|---|---|---|
| explore 候选方向数量 | `td-explore` / `brainstorming` 硬性要求"至少 2 个" / "2–3 个" | **按需产出，不设数量下限**；无新信息时不凑方向 |
| 无新信息的默认动作 | 为凑格式生成伪选项打断用户 | **输出"没有需要你的决策点，直接继续推进"** |
| greenfield explore 检查判据 | 会话产物含"≥2 候选方向" | **会话内已做过充分探索**（不依赖数量） |
| human-in-loop 放行判定 | 未显式定义"无新信息"与必停基线的优先级 | **必停基线优先，直接推进是补集**；放行需三项前提同时满足 |

**不改变的**：表 1/2/3 强度数值（`field-assessment` 单一事实源）、td-* artifact 流（propose → apply → archive）、WIP 硬约束 + override 机制、5 个子约束执行规则、`.td-state/` 持久化约定、human-in-loop 第 1–5 类必停基线本身（零删减，仅固化优先级）——均不变。

## 升级步骤

1. **bump 版本**：三处清单的 `version` 已同步改为 `1.7.1`（根目录 `plugin.json` / `.atomcode-plugin/plugin.json` / `marketplace.json`，description 保持纯 ASCII）。
2. **重新发布/安装**：把仓库内容同步到 marketplace 安装副本（`~/.atomcode/plugins/marketplaces/total-design-marketplace/`）。
3. **重新 trust**：`atomcode plugin trust total-design` —— plugin 内容有变更，需重新 trust 确保新内容加载。
4. **验证**：
   - 安装副本 skills/ 与仓库 `diff -rq` 一致；三份清单版本号同为 1.7.1。
   - 候选方向无硬性数字残留：`grep -rE '至少 [0-9]|2–3 个候选|≥2 个候选' skills/` → 0。
   - human-in-loop 含判定优先级：`grep -l '必停基线优先，直接推进是补集' skills/constraints/references/human-in-loop.md` 有输出。
   - 必停基线本身未删减：`human-in-loop.md` 的"必须停下来等用户拍板的场景"第 1–5 类仍完整（公共契约 / 不可逆 / 生产环境 / 超 scope / 置信度低）。
   - 逻辑名/命令名/路径/CLI 命令/环境变量不变：`constraints` / `field-assessment` / `/td-explore` / `/td-propose` / `openspec list` / `$_TD_TIER` 等。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.7.1] 条目。