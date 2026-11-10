# total-design v1.18.0 发布说明

> 面向使用态用户：本次为**修复 + 行为变更版**——code review 新增 `PENDING_RESULT` 锚点态与防编造 gate（杜绝 subagent 结论未回传时的编造），`todo.md` 改为本地 backlog 不纳入版本库。skill 数量、命令数量、references、hooks、td-* 契约流、四平台加载均不变。

## 本版本是什么

1.18.0 是 **review 可信度加固 + todo.md 协作模型修正版**。上一次版本 1.17.0 修复 td 工作流 6 处缺口；本版本围绕 code review 的真实可信度与 todo.md 的协作模型做三件事：

- **Added — `requesting-code-review` 新增 `PENDING_RESULT` Verdict 锚点态**：subagent 派发后其报告**尚未回传**到作者上下文时，唯一合法锚点为第四态 `PENDING_RESULT`（前三态 `APPROVED` / `APPROVED_WITH_CHANGES` / `MUST_FIX_CRITICAL` 不变）。下游（`td-apply` 步骤 6.3、`td-archive` 步骤 2）读 `PENDING_RESULT` 视为「review 未完成、不得进入实施」，等同阻塞。补齐「委派已发起」与「结论已到手」是两个独立事件——此前锚点只有三态，无法表达"结果在路上"。
- **Fixed — subagent review 防编造 gate**：写 `reviewed-by: subagent` 前必须逐字收到报告原文；结果未回传时段落如实写"委派已发起、结果未回传、结论待补"并等回传，不得用「派发了 review」冒充「已收到结论」。违反等同编造 Verdict——会向下游传递伪造结论、掩盖真问题（真实 subagent 可能判 critical 而被编造的 `APPROVED` 掩盖）。
- **Changed — `todo.md` 从「必须提交」改为「本地 backlog 不纳入版本库」**：`/td-init` 把 `todo.md` 写进 `openspec/.gitignore`，跨机器 / 跨人不通过 git 同步，各人待办池独立，消除 git 冲突面。三处同步（`todo-pool` / `td-init` / `docs/user/usage.md`）。

## 行为变更表（升级用户感知差异）

| 环节 | 变更 | 感知 |
|---|---|---|
| `requesting-code-review` Verdict 锚点 | 新增第四态 `PENDING_RESULT` | subagent 结果未回传时报告带 `PENDING_RESULT`，下游阻塞直至拿到真实结论或转自评 |
| `requesting-code-review` 隔离载体 | 补防编造 gate | 不得凭推测填归属 subagent 的结论；未回传必须标注"结论待补" |
| `todo.md` git 策略 | 从「必须提交」改为「本地不纳入版本库」 | `openspec/todo.md` 进 `.gitignore`，各人待办池独立，不再有 git 冲突面 |
| `/td-init` | 把 `todo.md` 写进 `openspec/.gitignore` | 新建项目 todo.md 天然不入库 |

## 升级步骤

1. 更新 plugin 到 v1.18.0（四平台安装方式不变，见 `docs/user/install.md`）。
2. 无需迁移数据——`.td-state/` 与 `openspec/` 格式不变。
3. **既有项目的 `todo.md` 若已被 git 跟踪**：本版本只改 `/td-init` 的写入逻辑，已 tracked 的文件不会自动 untrack。如需对齐新模型，手动 `git rm --cached openspec/todo.md` 并加进 `openspec/.gitignore`；不加也仍可用（只是继续走 git 同步）。

## 完整变更列表

见 [CHANGELOG.md](CHANGELOG.md) 的 `[1.18.0]` 条目。

---

# total-design v1.17.0 发布说明（历史）

> 面向使用态用户：本次为**修复版**，基于 td 工作流审核修复 6 处流程缺口——归档门禁收紧（change 级收尾 review 判 critical 时阻塞 archive）、review 报告落盘（跨会话 Verdict 不丢失）、消除 current-change audit 粒度矛盾、补估时字段。skill 数量、命令数量、references、hooks、td-* 契约流、四平台加载均不变。

1.17.0 是 **td 工作流审核修复版**。上一次版本 1.16.0 新增 DSH 第四平台支持；本版本基于对 td 工作流（explore → propose → apply → archive 主干）的审核，修复 6 处流程缺口：

- **Fixed — `td-apply` 6.4 tier-medium 粒度矛盾**：current-change audit 的 tier-medium 行改述为"由 `executing-plans` 步骤 1 承载，不在本步骤重复触发"——此前"6.1–6.3 都通过后"的完成判定阶段却声明"每个关键链任务完成时"的实施中粒度，构成矛盾。
- **Fixed — `requesting-code-review` 补 review 报告落盘规定**：第 3 节新增「报告落盘」——change 级收尾 review 落盘到 `openspec/changes/<name>/reviews/`、架构 review → `proposal.md` 末尾、checkpoint review → `tasks.md` 验证证据附注。下游读落盘文件而非会话记忆，跨会话后 Verdict 不丢失。
- **Changed — `td-archive` 步骤 2 归档门禁收紧**：新增 change 级收尾 review Verdict 检查——`MUST_FIX_CRITICAL` 或无 review 报告 → 阻塞 archive（此前可绕过 6.3 的 critical 判定直接归档）。升级感知：归档前若 6.3 判出 critical 或未做收尾 review，将被拦截，需先修复或补做。
- **Fixed — `td-propose` 步骤 7 tier-small 架构自检落点明确**："跳过架构 review：无实质新架构决策"记录到 `proposal.md` 影响评估节末尾，供 `td-apply` 步骤 4 复核读取。
- **Fixed — `executing-plans` 步骤 1 >2x 估时引用估时字段**：消除对未定义字段的依赖。
- **Added — `writing-plans/references/task-template.md` 新增可选 `估时` 字段**：作为 `executing-plans` >2x 判定的单一事实源；省略时该判定降级为"明显超出同类任务预期"，不构成硬触发。

见 [CHANGELOG.md](CHANGELOG.md) 的 `[1.17.0]` 条目。
