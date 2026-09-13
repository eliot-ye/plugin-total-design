---
name: td-autonomous-run
description: 批量执行已确认的 change，按 todo.md 优先级走 apply → archive → commit 循环，依赖满足才执行。触发场景：用户说"批量执行"、"自主跑完这批"、"离线执行"、"autonomous run"。仅在 openspec/.td-state/autonomy.yaml 的 mode 为 autonomous 时生效。
user-invocable: true
disable-model-invocation: true
argument-hint: (no arguments)
---

# td-autonomous-run

离线批量执行的编排入口。人不在场时，按优先级逐个驱动已确认的 change 走 apply → archive → commit 循环。本 skill 只编排——不替单个 change 做任何系统级决策，分支语义全部由被驱动的 skill 承载。

## 依赖技能

- `system-engineering`
- `field-assessment`

## 服务的主基调原则

**系统工程主基调第 2 条：总体设计部。** 决策权始终在人：切换 autonomous 模式与批量 commit 授权由用户在本 skill 步骤 2 显式确认，编排者不替人做系统级决策——运行中命中清单未覆盖的必停场景由 `td-apply` 回退（分支表见 `constraints` 的 `references/human-in-loop.md`「autonomous 模式下的触发路径」节），编排者不放宽、不代拍板。

**系统工程主基调第 4 条：开放的复杂巨系统。** 编排是顺序执行——一个 change 走完 apply → archive → commit 才做下一个，不并行硬解。autonomous 模式下 WIP 检查不生效（见 `constraints` 的 `references/wip-limit.md`「autonomous 模式下不生效」节），顺序本身是该主基调的执行形态。

## 输入

无参数。待执行队列从 `openspec/todo.md` 优先级与活跃 change 列表交叉推导。

## 步骤

### 1. 激活主基调与配置层

按下述序列注入，只注入强度不做触发判断：

1. **`system-engineering`** — 主基调四条进入上下文。
2. **profile × tier 识别** — 调 `field-assessment`，判读 `$_TD_PROFILE` / `$_TD_TIER`，读入表 1 + 表 2 + 表 3，会话内缓存。被驱动的 `td-apply` / `td-archive` 各自的步骤 1 会再注入并按需重判，本 skill 的缓存只服务编排判定，不冲突。
3. **其余 constraint** — 强度值读入上下文。autonomous 模式下 `human-in-loop` / `wip-limit` 的分支语义见各自新增节（上文「服务的主基调原则」已引用），不在本步判断。
4. **运行模式** — 读 `openspec/.td-state/autonomy.yaml` 的 `mode` 字段（文件不存在 → 视为 `human-in-loop`）。

### 2. 模式确认（含首次创建引导与 commit 授权）

按步骤 1.4 读到的 mode 分派：

- **文件不存在** → 提示用户："当前未配置自治模式。继续将创建 `openspec/.td-state/autonomy.yaml` 并切换到 autonomous 模式：此后每个 change 在 archive 成功且无失败记录时将自动 commit（相当于批量 commit 授权，可随时把 `mode` 字段改回 `human-in-loop` 中止）。确认继续？"——用户确认后创建（`mode: autonomous`；`set_at` 当前时间；`set_reason` 用户一句话说明，未给则默认"批量执行已确认的 change，人不在场"）；用户拒绝 → 结束，不创建任何文件。
- **存在但 `mode` 非 autonomous** → 提示"当前是 human-in-loop 模式，无需编排"，结束。
- **`mode` == autonomous** → 继续。

### 3. 构建待执行队列

1. 读 `openspec/todo.md` 拿优先级序列（P0 → P1 → P2；格式规则见 `todo-pool` 的「格式约定」节；文件不存在 → 队列只按活跃 change 推导）。
2. 读 `openspec/.td-state/autonomy-log.yaml`（文件不存在 → 视为空；文件模板与读写规则见 `td-apply` 的 `references/autonomy-template.md`），**排除已处理的 change**：最新条目为 `completed` → 跳过；最新条目为 `rolled-back` → 跳过且**不重试**（人回来处理）。
3. 跑 `openspec list` 拿活跃 change 列表，与 todo.md 优先级序列交叉匹配 → 待执行队列。
4. 逐 change 读 proposal 的「前置依赖」节（跨模式必填节，缺节 → 该 change 不入队，提示回 `/td-propose` 步骤 6.c 补节）：`[依赖 X]` 条目对应的 change 已完成并 commit（不在 `openspec list` 活跃列表）→ 依赖满足；未满足 → 跳过，等依赖满足后再触发；依赖的 change 被回退 → 跳过，并在 goal 里提示"N 个 change 因依赖未满足挂起"。
5. **兜底环检测**：构造队列时若发现挂起链闭合（A 依赖 B、B 依赖 A，或经由更多 change 的间接链）→ 在 goal 里显式标记"疑似循环依赖：<change 列表>"，标记后这些 change 保持挂起、**不自动修复**——propose 阶段写入「前置依赖」前的环检测是唯一阻止点（见 `td-propose` 步骤 6.c），本 skill 只识别与报告。

### 4. 设定目标并驱动循环

- 设 goal："按优先级处理剩余依赖满足的 change，每个走 `td-apply` → `td-archive` → commit（commit 落脚点见步骤 5），直到全部完成或剩余待执行为空。"
- 本 skill **不实现循环**——设 goal + per-change 协议，由 agent 的原生会话循环驱动迭代；session 断了进度已落盘（跨 change 进度在 `autonomy-log.yaml`，change 内进度在 `tasks.md` 的 `[x]` 标记 + `autonomy-manifest.md` 运行记录），重新触发本命令即从断点续跑（resume 粒度见步骤 6）。
- **每个 change 开始前重读 `autonomy.yaml` 的 `mode`**：已被改回 `human-in-loop` → 立即停止本批次（"随时中止"靠这条循环内重读生效，不等当前 change 跑完）。

### 5. commit 落脚点（archive 成功后）

每个 change 被 `td-archive` 成功归档后：

1. 读 `autonomy-log.yaml` 该 change 的最新条目（文件不存在 → 视为无条目）：最新为 `rolled-back` → **不 commit**（与 `td-archive` 步骤 4 的归档 gate 双保险），提示人工处理。
2. 无条目或最新非 `rolled-back` → commit 前跑 `git status --porcelain`：若存在不属于本 change 的改动路径（如前序 session 中断残留的其他 change 文件）→ **停止整个批次**（不写 autonomy-log——批次基线被污染不是"change 失败"，写入 rolled-back 会误导人以为该 change 有问题），提示人处理后续跑。
3. 工作树只含本 change 改动 → `git add -A && git commit`。`git add -A` 的安全性靠不变式保证：编排者顺序执行（上一 change commit 后工作树已干净）+ 回退清空工作树（`td-apply` 步骤 5）+ 本步 commit 前的 `git status --porcelain` 检查。
4. commit 后向 `autonomy-log.yaml` 追加该 change 的 `completed` 条目（`summary` 一句话结果，如"全部任务验证通过，caller impact 复核通过，已 commit"）。

commit 消息模板（自包含，HEREDOC 提交以保留换行）：

```
<type>: <change-name> — <proposal 的一句话描述>

<body(可选，尽量精简)>

Co-Authored-By: AtomCode (<model>) <noreply@atomgit.com>
```

`<type>` 用 conventional commits 类型（`feat` / `fix` / `refactor` / `docs` / `chore` / …），从 change 名与 proposal 内容推导；`<model>` 用当前实际运行的模型标识。

### 6. 跨 session 续跑

| 断点位置 | resume 依据 | 行为 |
|---|---|---|
| change 之间（上个已 archive + commit） | `autonomy-log.yaml` 最新条目为 `completed` | 跳过已完成的，从下一个开始 |
| change 内（apply 做到一半） | `tasks.md` 的 `[x]` / `[ ]` 标记 + `autonomy-manifest.md` 运行记录 | 从未完成的 task 继续 |
| 回退的 change | `autonomy-log.yaml` 最新条目为 `rolled-back` | 跳过，不重试（人回来处理） |

- 若当前平台提供持久循环或定时唤醒机制（可选增强），可用其包装本命令实现 session 中断后自动恢复——每次被唤醒读 `autonomy-log.yaml` 续跑；全部完成 / 剩余待执行为空 / mode 被改回 `human-in-loop` 时结束。不支持的平台由用户重新触发本命令，效果相同（进度链在同一文件）。
- **SessionEnd hook 兜底**：会话结束时 hook 按「`archive/YYYY-MM-DD-<change-name>/` 目录存在 + 对应 commit 存在」双事实补记漏写的 `completed` 条目（仅当 `autonomy-log.yaml` 已存在；不用 tasks 全 `[x]` 判定——tasks 打勾不等于通过四层验证）。这是"防 agent 漏写状态"的兜底，不是流程门禁。

## Guardrails

- 不放宽 `td-apply` 的 autonomous 分支：proposal 清单未覆盖的必停场景一律回退；回退的 change 跳过不重试，等人工处理
- 批次基线污染（`git status --porcelain` 发现非本 change 改动）→ 停整批提示人处理，不写入任何 change 的日志
- 每个 change 开始前重读 `mode`，用户改回 `human-in-loop` 即停
- 挂起（依赖未满足 / 疑似循环依赖）与回退的 change 一律不自动处理——判定权在人
