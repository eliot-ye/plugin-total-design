# autonomy 文件模板与回退命令

autonomous 运行模式三个状态文件（`autonomy.yaml` / `autonomy-manifest.md` / `autonomy-log.yaml`）的模板与读写规则的单一事实源，以及回退命令的权威原文。模式分支语义见 `constraints` 的 `references/human-in-loop.md`「autonomous 模式下的触发路径」节；本文件只定义文件格式与命令，不定义分支判定。

## autonomy.yaml（运行模式偏好）

路径：`openspec/.td-state/autonomy.yaml`

```yaml
mode: human-in-loop    # human-in-loop | autonomous
set_at: <ISO8601>
set_reason: <一句话，说明为何切换到该模式>
```

读写规则：

- 用户偏好文件：由用户创建与修改（手动编辑 `mode` 字段即可切换模式）。唯一例外：`td-autonomous-run` 步骤 2 经用户显式确认后可创建本文件（首次创建这一次写入，字段值全部来自用户确认内容）；创建后恢复只读，后续切换模式仍由用户手动编辑。
- 文件不存在 → 视为 `human-in-loop`，不影响任何现有流程——该文件可选。
- skill 只读不写：`td-apply` 步骤 1 读入 mode；`td-archive` 步骤 5.4 检测到回退残留时可建议用户改回 `human-in-loop`，不代改。

## autonomy-manifest.md（change 内运行记录）

路径：`openspec/changes/<change-name>/autonomy-manifest.md`。仅 autonomous 模式下由 `td-apply` 创建；human-in-loop 模式不创建。

```markdown
# Autonomy Manifest — <change-name>

## 运行记录（td-apply 追加）

| 时间 | 步骤 | 事件 | 决策来源 |
|---|---|---|---|
| <ISO8601> | 步骤 5 | 沿用 proposal 已确认：<事件一句话> | proposal「已确认决策清单」第 N 类 |
| <ISO8601> | 步骤 4 | caller impact 复核通过，无新增 caller | proposal「caller impact 实测」 |
| <ISO8601> | 步骤 5 | ⚠️ 回退：<失败一句话> | 超出已确认范围 |
```

读写规则：`td-apply` 在进入实施前创建、执行中追加，只增不改；归档后随 change 目录只读。

## autonomy-log.yaml（跨 change 进度与失败日志）

路径：`openspec/.td-state/autonomy-log.yaml`

```yaml
entries:
  - timestamp: <ISO8601>
    change: <change-name>
    action: completed        # completed | rolled-back
    summary: <一句话结果，如"全部任务验证通过，caller impact 复核通过，已 commit">
  - timestamp: <ISO8601>
    change: <change-name>
    action: rolled-back
    reason: <前提假设不成立 / 测试失败 2 次以上根因在 plan 外 / 新 caller / 架构 review critical / 收尾 code review critical / audit 触发第 7 类>
    detail: <失败摘要>
    stash_ref: <git stash list 引用，如 "stash@{0}">
```

读写规则：

- `rolled-back` 条目由 `td-apply` 在 autonomous 回退时追加（其步骤 5）。
- `completed` 条目有两个写入方：批量编排流程在该 change 成功 archive + commit 后写入（`td-autonomous-run` 步骤 5）；SessionEnd hook 按「`archive/YYYY-MM-DD-<change>/` 目录 + 对应 commit」双事实补记漏写的条目（仅当本文件已存在，`summary` 标注补记来源，见 `hooks/td_state_sync.js`）。各读取方（`td-archive` 步骤 4 的归档 gate / 步骤 5.4 的残留提示）按最新条目判定。
- 同一 change 有多条条目时以最新一条为准（append-only：只追加，不删改历史条目；`td-archive` 的归档 gate 与残留提示按最新条目判定；change 经人工处理后重做完成 → 由归档 gate 的用户确认解除阻塞，不回写日志）。
- 文件不存在 → 视为空，读取方不得因文件缺失阻塞。

## 回退命令（单一事实源）

autonomous 模式下回退当前 change 的代码改动（保留 artifact 不删）：

```bash
git stash push -u -m "rollback <change-name>" -- . ':(exclude)openspec/changes/<change-name>/**'
```

要点：

- `-u` 把未跟踪的新增源码一并入栈——否则新增源码残留工作树，后续 change 从脏基线开始；`:(exclude)` 把 `openspec/changes/<change-name>/` 下的 artifact（proposal / design / tasks / autonomy-manifest）排除在 stash 之外——回退撤代码，不撤契约产物。
- 用 stash 不用 `git checkout`：stash 保留恢复路径（人回来 `git stash pop` 救回、`git stash drop` 放弃），checkout 是不可恢复的丢弃，无人现场时没有第二次机会。
- 回退后把 `git stash list` 中对应条目的引用写入 `autonomy-log.yaml` 该条目的 `stash_ref`，供人回来定位。
- 回退前跑 `git status --porcelain`：若存在不属于本 change 的未提交改动（如前序 session 残留），stash 会将其一并入栈——在 `autonomy-log.yaml` 该条目的 `detail` 里显式记录"工作树含无关改动，已一并入栈，人工恢复时注意甄别"，不静默混合。
