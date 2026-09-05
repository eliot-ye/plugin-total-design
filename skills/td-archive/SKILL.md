---
name: td-archive
description: 完成后归档。触发场景：用户说"archive"、"wrap up"、"close out"、"这个 change 完成了"。
user-invocable: true
argument-hint: <change-name>
---

# td-archive

change 完成后归档。归档不是删除，是把"已完成的学习"沉淀下来。

## 依赖技能

- `system-engineering`
- `field-assessment`

## 服务的主基调原则

**系统工程主基调第 3 条：从定性到定量的综合集成。**

archive 不是"打完勾收工"，是"完成一次从预期到实际的综合集成循环"。archive 前对"实际 vs 预期"的复盘，是这个循环的闭合。

**系统工程主基调第 2 条：总体设计部。**

archive 后触发 profile 重新评估——这是总体设计部的职责：项目状态变化了，工作方式要跟着调整。

**《工程控制论》反馈控制回路归位**：archive 是事后误差检测 + 校正环节（完整回路见 `system-engineering` 的「反馈控制回路」节）。

## 输入 - 要 archive 的 change 名。空则推导或问用户。

`$ARGUMENTS`

## 步骤

### 1. 激活主基调与配置层

激活主基调与配置层。只注入强度不做判断，按下述三步序列执行：

1. **`system-engineering`** — 主基调四条进入上下文。
2. **profile × tier 识别** — 调 `field-assessment`，判读 `$_TD_PROFILE` / `$_TD_TIER`，读入表 1 + 表 2 + 表 3（archive 需要表 3 判定 system-audit 频率触发）。会话内缓存，后续步骤直接引用。
3. **其余 constraint** — 只把强度值读入上下文，不在本步判断是否触发——后续步骤据此判断是否触发 / tasks 是否合规。

### 2. 前置检查

- 所有 tasks.md 里的任务都 `[x]` 了吗？
- `verification-before-completion` 跑过了吗？——含 change-level + 系统级（跨分系统边界，proposal 标注了受影响分系统时）两层验证，缺一层不算完成。

### 3. 强制"实际 vs 预期"复盘（硬步骤）

archive 之前**必须**在 change 里补一节"实际系统工程影响 vs 预期"——对照 proposal 的"系统工程影响评估"节（含"预期行为模型"字段），按下表逐字段复盘：

| proposal 侧（预期） | archive 侧（实际） |
|---|---|
| 影响哪些分系统 | 实际影响的分系统 |
| 整体性能预期变化 | 实际整体性能变化 |
| 这是局部优化还是全局协调 | 实际是局部优化还是全局协调 |
| 如果是局部优化，对全局失调的风险 | 局部优化的实际全局影响（主基调第 1 条事后回检） |
| 预期行为模型 | 模型验证（实际行为是否验证预期模型） |

补充字段（表格未覆盖的复盘项）：

- 预期之外的副作用（这是后续 `/td-system-audit` 的输入）

**模型验证**字段的展开：

- 如果验证通过 → 模型成立，记录"预期行为模型已验证"。
- 如果验证失败 → 模型需要修正，记录"预期行为模型与实际偏差：<偏差描述>，模型修正建议：<...>"。这是综合集成循环的闭合动作——把"这次发现的偏差"转化为"下一个 propose 的预测模型修正"（见 `system-engineering` 的「反馈控制回路」节）。
- 如果 proposal 没填"预期行为模型"字段（旧 change 兼容）→ 跳过本字段，仅用前三个字段做复盘。本兜底仅兼容旧版本产生的旧 change；新 change 的 proposal 必填此字段（`td-propose` 步骤 6.c），理论上不应走到本分支。

复盘的对照源有两个，按"有则用、缺则降级"原则叠加：

1. **proposal 的"系统工程影响评估"节** —— 永远存在（propose 必填项），是"预期"侧的主锚点。
2. **`openspec/specs/` 下的主 spec baseline** —— 若该 change 改动的分系统在 `openspec/specs/<subsystem>/spec.md` 有 reverse-spec 或前序 archive sync 沉淀的 baseline，把 baseline 作为"改之前真实状态"的对照源之一，复盘要回答"change 的 spec delta 是否破坏了 baseline 声明的契约 / 不变量"。**baseline 不存在**（greenfield 首个 change、或该分系统从未被 reverse-spec）→ 跳过本对照源，仅用 proposal 自述做复盘，不阻塞 archive。

没这一节，archive 拒绝继续。这是 `/td-system-audit` "实际 vs 预期"审计的数据来源——闭环必须闭合。

### 4. archive（含 sync）

```bash
openspec archive "<name>" --yes
```

`--yes` 跳过 CLI 确认提示——agent 运行环境通常非交互（stdin 关闭），无法应答确认，不加此 flag 命令会在改动任何东西前 exit 1。CLI 侧的确认语义（任务完成、spec 更新）已由本 skill 步骤 2/3 的门禁承担。

`openspec archive` 会做两件事：
1. 把 change 从 `openspec/changes/<name>` 移到 `openspec/changes/archive/YYYY-MM-DD-<name>/`（按归档日期落子目录）
2. 自动把 change 产生的 spec delta sync 到主 spec

**归档成功后 TODO 子项勾选**：触发 `todo-pool` 的「勾选子项」子流程（传入本次归档的 change 名）。

**Purpose TBD housekeeping 检查**：`openspec archive` sync 主 spec 时，新生成的主 spec `## Purpose` 节会保留 td-archive 模板默认值 `TBD - created by archiving change <name>. Update Purpose after archive.`——这是已知的 sync 副作用，不能让 TBD 残留到下一次 audit。sync 完成后立即按 `references/purpose-tbd-housekeeping.md` 执行子流程（读涉及主 spec → grep `^TBD - created by archiving` → 命中则本步骤内补写一句话 Purpose → 再次 grep 确认无残留）。

### 5. archive 后接力动作

archive 是契约层的"闭合点"，必须触发三个后续接力（顺序执行）：

#### 5.1 profile/tier 重新判读

archive 完一个 change 后，项目的 profile 可能变化（greenfield 走到 maintenance，或 brownfield 进入大重构）。**强制重新调用 `field-assessment` 的 `references/identification-flow.md`「识别流程」节**，重新判读 `$_TD_PROFILE` / `$_TD_TIER`。重判策略见 `field-assessment` 的 `references/identification-flow.md`「### 4. 缓存判读结果」节的"重判策略"段——读到该段执行，本节不重复。

如果新判读结果与步骤 1 缓存的不同：

- 更新会话缓存为新 profile/tier
- 提示用户："项目状态已从 `<old-profile>` × `<old-tier>` 变为 `<new-profile>` × `<new-tier>`。后续 constraint 强度按新配置走。"

判读结果与缓存一致 → 跳过提示，不打扰用户。

#### 5.2 system-audit 频率触发检查

archive 是"完成一个 change"的事件，正好对照表 3（system-audit 频率，见 `field-assessment/references/audit-frequency.md`）。

**持久化计数器**：每次 archive 完成后，读 `openspec/.td-state/archive-counter.yaml`，把 `count` +1，写回文件。文件格式见 `references/archive-counter-template.md`，文件由本步骤首次运行时按需创建。

**达阈值判定**（频率数字一律查表 3 的 project scope 列）：

| tier | 驱动源 | 判定方式 | 文件不存在时 |
|---|---|---|---|
| `tier-small` / `tier-medium` | count 驱动 | `archive-counter.yaml` 的 `count` 为表 3 阈值的**整数倍**（count 是累计值不重置，恰好每第 N 次 archive 触发一次建议） | 视为 `count: 0`，本事件 +1 后再判 |
| `tier-large` | 时间驱动 | `audit-history.yaml` 最近一条 `scope: project` 的 `timestamp` 距今 ≥ 表 3 阈值（数值见 `field-assessment` 的 `references/audit-frequency.md` 的 project scope 列） | 视为从未跑过 project audit，直接判达阈值 |

达阈值 → **主动建议**用户跑 `/td-system-audit project`，不是强制，是"按主基调第 2 条总体设计部职责，该周期性自检了"。两个文件均由本步骤首次运行时按需创建。

#### 5.3 WIP 释放检查

归档后，活跃 change 数减少。如果之前有因 WIP 限制阻塞的新 change，提示用户："WIP 释放了（当前活跃 `<n>` / 上限 `<limit>`），可以 `/td-propose` 之前想做的 X 了。"

## Guardrails

- **归档后只读**：`openspec/changes/archive/` 下的文件永远不修改
- archive 前必须验证 change 完整性（所有任务 done、所有 artifact 存在）
- 不要 archive 一个还在进行中的 change——如果有未完成任务，先问用户是继续完成还是放弃
