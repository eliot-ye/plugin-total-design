# 设计讨论：td 工作流 plugin 改进清单（skill 行为与跨 skill 结构）

> 状态：设计讨论稿，未进入执行阶段。每条独立可推或推迟，无强制批量。
> 立场：**plugin 级**改进——skill 行为本身、跨 skill 一致性、用户 memory 教训的强制化。锚在 atomcode 样本（profile-brownfield × tier-large）。

## 问题陈述

以 atomcode 项目（profile-brownfield × tier-large，29+ change，7 份 reverse-spec + `specs-legacy/`，9 个 td-* skill + 15+ references）为样本，观察当前 td 工作流在 **plugin 层**的结构性缺口。缺口不在 skill 数量，而在 **skill 与已知教训之间的接口**——用户 memory 里已经积累了一批「不能靠 LLM 记住，必须靠 skill 强制」的教训（worktree 4 步复合、worktree 里 archive 报错、5 秒能验证的必须验证、不制造伪决策点、issue 模板固定、git-commit 不加 Co-Authored-By），但其中大部分**没有被 skill 硬编码进去**，只能靠 LLM 会话时恰好想到。

缺口分三类：

1. **memory 教训未强制化**：worktree 路径 workaround、5 秒验证、停止条件、issue 模板——都只活在 memory 里，agent 每次都要重新回忆，且不同 agent 版本回忆稳定性不同。
2. **skill 内部漏洞**：`td-archive` 不做完成度核对（用户 memory 已记「08-04 audit 假闭环」）、`td-explore` 无停止条件（用户 memory 已记「不要凑模板打断用户」）、`td-propose` 不与 spec/ADR 自动对齐、`td-apply` 无 per-requirement checkpoint 导致中断后无法精确 resume。
3. **跨 skill 契约缺失**：change 目录格式约定散落在各 skill 提示词里，改一处悄悄错配其他；change ↔ git 分支的绑定是隐式的；change 生命周期只有 proposed → archived 两态，中间态缺失。

## 设计约束（用户给定，来自 memory）

以下四条为硬约束，所有建议必须满足：

1. **不制造伪决策点**——用户已授权 apply 且无新信息时，正确输出是「无需决策，直接推进」。建议 1.1 的停止条件是这条约束的直接产物。
2. **5 秒能验证的事实必须当场跑命令验证**——不能靠直觉。建议 1.1、1.3、1.4 都要求 skill 内部主动调用工具，不依赖 LLM 记忆。
3. **worktree 工作流是单一原子操作**——4 步复合（worktree add → symlink openspec → 验证穿透 → 复制 user.md）必须一口气完成，不分步等追问。
4. **worktree 里 `openspec archive` 会因 realpath 判定失败**——skill 必须硬编码 workaround，不能依赖 memory 恰好提醒。

## 与主基调的关系

| 主基调条 | 关系 |
|---|---|
| 第 1 条：系统工程 | 跨 skill 结构性问题（第三档 3.1 / 3.2 / 3.3）必须一次性解决，不因「小改动」而局部化 |
| 第 2 条：总体设计部 | 每条建议对应一个具体的设计缺口（memory 教训 / skill 漏洞 / 结构缺失），不做无目标优化 |
| 第 3 条：综合集成 | 建议 3.1（共享 schema）是「多 skill 消费同一契约」的直接落地 |
| 第 4 条：开放的复杂巨系统 | 建议 3.3（change 生命周期状态机）把 skill 之间的隐式时序变成显式契约 |

## 核心机制

建议按「改动性质」分三档，每档独立可执行。

### 第一档：修补现有 skill 的漏洞（8 条）

#### 1.1 `td-explore` 增加「停止条件」+「判据当场验证」

**当前漏洞**（用户 memory 第 1 条教训）：skill 有输出模板（"至少 2 个候选方向"），agent 倾向凑模板打断用户；且候选方向的判据可以是纯直觉（用户 memory 已记「async-storage P1 条目靠直觉推断，事后发现两点都不成立」）。

**改法**：

在 `td-explore SKILL.md` 开头加两个前置 gate：

```
步骤 0.a 停止条件判定
  列出三种停止条件（写死，不依赖 LLM 判断）：
    S1. 后端文档到位（要查的资料已 fetch / 已读）
    S2. 测试证伪设计（现有测试证明当前设计不成立）
    S3. 用户叫停（用户明确说停 / 说够了）
  每轮对话开始时问：以上三条哪条被触发了？
  若都未触发 → 不再问澄清问题，直接推进到 td-propose
  若触发 → 停止 explore，输出到下一 skill

步骤 0.b 候选方向判据验证
  对每个候选方向列出的「判据」：
    涉及文件存在性 / 命令行为 / 配置作用范围 / git 状态
      → 立即跑命令验证（test -f / grep / git log）
      → 验证结果附在候选方向旁边（成功 ✓ / 失败 ✗）
    涉及主观偏好 / 架构判断
      → 标注为「主观判据」，不做验证
  禁止「直觉判据」进入 backlog
  违反处理：若候选方向无判据、或判据未验证 → 不进入 todo-pool
```

**与 memory 对齐**：直接落地 memory 第 1、2 条教训。

**blast radius**：1 个文件（`skills/td-explore/SKILL.md`）。

#### 1.2 `td-propose` 增加「与 spec / ADR 自动对齐」

**当前漏洞**：proposal 生成时不与 `openspec/specs/` 或 `openspec/adr/` 对齐，agent 可能重提已退役路径（如再造 `atomcode-protocol` 或 foundation，AGENTS.md 明示禁止），或违反既有 ADR 而未声明。

**改法**：

在 `td-propose SKILL.md` 生成 proposal 前加一步：

```
步骤 X：spec / ADR 对齐
  输入：proposal 意图描述
  动作：
    扫描 openspec/specs/**/spec.md 提取所有 Requirement 标题
    扫描 openspec/adr/*.md（若存在）提取所有 ADR 标题与决策状态
    检查 proposal 意图是否：
      A. 满足 / 修改 / 违反某条 Requirement
      B. 与某个 ADR 冲突（冲突需显式声明 supersede 意图）
      C. 与某条 Requirement 或 ADR 无关
  输出：proposal.md 新增两节（必填空段）：
    「触碰的 Requirement」：引用 spec.md:行号，标注满足/修改/违反
    「触碰的 ADR」：引用 ADR 编号，标注独立/冲突/supersede
  若 ADR 冲突但未声明 supersede → 停下问用户
```

**约束**：spec 与 ADR 是**只读消费**，本 skill 不修改它们。

**blast radius**：1 个文件（`skills/td-propose/SKILL.md`）+ proposal.md 模板扩展（新增 2 节）。

#### 1.3 `td-apply` 增加「per-requirement checkpoint + 可恢复」+「测试先行任务顺序约束」

**当前漏洞 A（可恢复性）**：change 被打断（context 压缩、用户切换、agent 重启）后，resume 时 agent 无法知道「做到哪一步」，只能重读全部 change 目录（浪费 token、可能重复实现）。

**当前漏洞 B（TDD 纪律松散）**：`superpowers-tdd` 说 RED-GREEN-REFACTOR，但 `td-apply` 编排 tasks 时可能把「实现 X」和「测试 X」混在一组，或把「实现」放在「测试」之前——TDD 纪律在 apply 时松散。

**改法**：

在 `td-apply SKILL.md` 步骤 2（任务分组）后加两步：

```
步骤 2.5 测试先行任务顺序约束
  分类规则（自动，无 LLM 判断）：
    - 任务描述含 "test" / "RED" 关键词 → 视为测试任务
    - 任务描述含 "implement" / "GREEN" / "refactor" 关键词 → 视为实现任务

  检查任务序列的相邻关系：
    对每个实现任务，检查其前一个任务是否为对应功能的测试任务
    违规（实现任务前无测试任务）→ 停下，要求用户或 agent 重排 tasks

  豁免路径：
    - 用户显式声明「本任务不涉及测试」（如纯文档、纯重构、纯配置）
      → 记录到 audit-history.yaml（entry 类型：tdd-bypass）
    - 豁免不阻塞继续执行，但豁免条目可在 audit 时统计豁免率

步骤 2.6 checkpoint 结构（可恢复）
  每个 Requirement 视为一个 checkpoint：
    状态：pending → in_progress → verified
    存储：openspec/changes/<name>/state.yaml（新增字段）
    字段：
      requirement: <标题>
      scenarios:
        - scenario: <标题>
          status: pending | in_progress | verified
          verification: <test-name | grep-pattern | compile-check>
  完成一个 Scenario → 立即写 state.yaml（不等 batch）
  中断后再启动 → 读 state.yaml，从 in_progress 或 pending 继续
```

**约束**：
- state.yaml 走已有的 `.td-state/` 语义——本条是 `.td-state/` 的合法扩展，不是新文件
- 任务顺序约束**不修改 tasks.md 结构**，只检查任务序列的相邻关系
- 豁免路径避免误伤（纯文档、纯重构、纯配置任务）

**与 memory 对齐**：
- 与 memory 中「worktree 工作流是复合操作」同理——把中断恢复变成显式契约
- 与 superpowers-tdd 的 RED-GREEN-REFACTOR 分工：superpowers-tdd 教 TDD 是什么，本条在 `td-apply` 层强制 task 编排顺序

**blast radius**：1 个文件（`skills/td-apply/SKILL.md`）+ state.yaml schema 扩展（新增字段）+ audit-history.yaml 结构扩展（新增 entry 类型 `tdd-bypass`）。

#### 1.4 `td-archive` 增加「完成度硬门禁」

**当前漏洞**（用户 memory 已记「08-04 audit 假闭环」）：用户说「archive」，skill 就把 change 移到 archive 目录；但 proposal 里承诺的 Requirement 可能没实装、Scenario 可能没对应测试通过——archive 照样走。

**改法**：

在 `td-archive SKILL.md` 步骤 4（前置检查）后插入：

```
步骤 4.5 完成度硬门禁（三项全过才归档）

  门禁 A：proposal → 代码实现
    对 proposal 每一条 Requirement：
      在代码中查找实现位置（find_references / grep）
      未找到 → 列为「承诺未落地」

  门禁 B：design Scenario → 测试
    对 design 每一个 Scenario：
      检查是否有对应测试，或明确标注为「编译期强制 / 结构性判据」
      无 → 列为「Scenario 未验证」

  门禁 C：tasks.md 全部勾选
    对 tasks.md 每一条：
      状态 ≠ done → 列为「任务未完成」

  门禁 D：spec delta 完整性
    对每个 delta 文件（openspec/changes/<name>/specs/**/spec.md）：
      diff delta 的 Requirement 标题与基线（openspec/specs/**/spec.md）
      输出三类差异：
        - 未合并（delta 有，基线无）
        - 已合并但语义改动（同名但内容不同）
        - 孤儿（基线有，delta 无，且不属于历史累积）

  判定：
    任一门禁失败 → 拒绝归档，列出失败清单
    用户可显式声明「部分完成，剩余项转 todo」：
      → 剩余项补到 openspec/todo.md
      → 记录到 audit-history.yaml（entry 类型：partial-archive）
      → 允许归档，但 state.yaml 标注 phase=partially-archived
```

**约束**：不修改 spec 或代码，只拒绝归档。剩余项转 todo-pool 是**唯一**允许的部分完成路径（不是「强制用户补齐」，也不是「静默归档」）。

**blast radius**：1 个文件（`skills/td-archive/SKILL.md`）+ audit-history.yaml 扩展（新增 entry 类型 `partial-archive`）+ todo-pool 联动（可能新增条目）。

#### 1.5 `td-archive` worktree 路径 workaround 硬编码

**当前漏洞**（用户 memory 已记）：在 worktree 里跑 `openspec archive` 会报 "Refusing to archive through a path outside the OpenSpec root"——因为 worktree 的 `openspec` 是指向主仓库真实目录的 symlink，CLI 按 realpath 判定 root。当前 workaround 只存在于 memory，agent 未必知道。

**改法**：

在 `td-archive SKILL.md` 执行 archive 前加：

```
步骤 X：worktree 路径检测
  若 openspec 是 symlink（test -L openspec）：
    cd 到 symlink 目标目录（realpath openspec）
    执行 archive
    返回原目录
  否则：
    原地执行 archive
```

**约束**：workaround 只影响 archive 命令的 cwd，不修改 symlink、不修改 openspec 目录结构。只读的 `openspec validate` / `openspec list` 不需要 workaround（memory 已明确）。

**blast radius**：1 个文件（`skills/td-archive/SKILL.md`）。

#### 1.6 `td-reverse-spec` 增加「分系统边界变更走 ADR」

**当前漏洞**：skill 可以悄悄改 6 个分系统边界（mechanism / rows / host / ui / coding / infra），或调整 spec 目录归属。这个决策级别和 ADR 相当，但当前无强制。

**改法**：

在 `td-reverse-spec SKILL.md` exit gate 加：

```
步骤 X：边界变更检测
  检查本次 reverse-spec 输出与上次的 diff：
    若分系统切分变化（新增/删除/合并 spec 目录）
    若 spec 目录归属变化（某 spec 从 A 分系统移到 B 分系统）
    若分系统 tier 变化（large → medium 等）
  → 必须在本 commit 内生成 ADR（openspec/adr/00NN.md）
  → ADR 内容：Context（为什么切）/ Decision（切到哪）/ Alternatives（考虑过但没选的）/ Impact（波及哪些 skill）
  → 未生成 ADR → 拒绝提交
```

**约束**：spec 内容本身的更新不需要 ADR（那是常规 refresh），只有**边界结构**变更需要。

**blast radius**：1 个文件（`skills/td-reverse-spec/SKILL.md`）+ 可能触发 `openspec/adr/` 目录新增（若不存在则创建）。

#### 1.7 `td-system-audit` Round 2 外部 artifact 硬门禁

**当前漏洞**（用户 memory 已记）：Round 2 audit 曾出现「只凭 `.td-state/` 内部计数自洽就签闭环，未核对 artifact 是否真实存在」的假闭环。当前 skill 里只是提示，未强制。

**改法**：

在 `td-system-audit SKILL.md` Round 2 加：

```
步骤 X：artifact 存在性硬门禁
  对每一条「已归档 / 已完成 / 已修复」的断言：
    提取涉及的 artifact 路径（spec 文件、测试文件、commit SHA、gate 输出）
    对每个 artifact：
      文件路径 → test -f <path>
      commit SHA → git cat-file -e <sha>
      gate 命令 → 实际执行并抓 exit code
    任一不存在 → 断言降级为「未验证」，不允许归档为「已闭环」
  输出：断言 × artifact 存在性矩阵，附在 audit 报告的可核查字段
  报告结构：不仅散文描述，还必须有一节「Artifact 验证表」（可机械核对）
```

**约束**：门禁是**硬拒**——任一 artifact 不存在，该条断言无法标为「已闭环」。允许标为「未验证，转 todo」，但不允许标为「已闭环」。

**blast radius**：1 个文件（`skills/td-system-audit/SKILL.md`）+ audit 报告结构扩展（新增 artifact 验证表）。

#### 1.8 `verification-before-completion` 门序列定义化

**当前漏洞**：skill 说「跑相关命令」，但**没有明确定义**门序列。哪些门必跑由 agent 现场判断，不同 agent 判断不同，导致验证覆盖不稳定。

**改法**：

重写 `verification-before-completion SKILL.md`，定义明确的门序列：

```
门序列（按改动类型裁剪，不靠 agent 现场判断）：

  M1. 格式化检查（必跑）
      cargo fmt --all -- --check  # Rust
      # 或 npx prettier --check   # JS/TS
      # 或 golangci-lint run      # Go

  M2. Lint（触及代码文件时必跑）
      cargo clippy -p <affected>

  M3. 单 crate 测试（触及代码文件时必跑）
      cargo nextest run -p <affected>
      # 或 npm test -- --coverage

  M4. 分层门禁（触及 crate 边界 / 依赖方向时必跑）
      bash gates/layers.sh

  M5. Workspace 编译检查（触及公共协议 / 跨 crate 时必跑）
      bash gates/compile.sh
      # 或 cargo check --workspace --all-targets

  M6. UI / 前端专属门（触及 UI 代码时必跑）
      bash gates/tui-*.sh

  M7. 配置污染检查（Rust 项目且触及 Cargo.lock 时必跑）
      grep -c '私有依赖关键字' Cargo.lock  # 必须为 0

  M8. 契约检查（触及 wire / API / 持久化格式时必跑）
      # 项目自定义 gate

触发规则：改动类型 → 门序列的映射写在 skill 里，agent 按映射跑，不现场判断
「跳过门」：不允许，除非用户显式声明并记录到 audit-history.yaml
```

**约束**：门序列本身可以在 skill 里维护（不是配置文件），因为改动类型的判断需要语义理解，不适合完全外部化。

**blast radius**：1 个文件（`skills/verification-before-completion/SKILL.md`，可能是大幅重写）。

### 第二档：新增独立 skill（2 条）

#### 2.1 `td-rollback` skill — change 撤销

**痛点**：td-apply 完了发现问题、或 change 已被 archive 但需要撤销——**没有对应 skill**。当前 workaround 是 git revert + 手工把 archive 目录下的 change 挪回 `changes/`，用户 memory 里没记、skill 里没有、`.atomcode.user.md` 里也没有。

**改法**：

新增 `skills/td-rollback/SKILL.md`，行为：

```
入口：用户输入 /td-rollback <change-name>

步骤 1：定位 change 的最后 commit 范围
  输入：change 名
  动作：
    在 git log 中定位与本 change 相关的 commit 范围
    若 change 已归档 → 定位 archive 时的 commit
    若 change 未归档 → 定位最近一次 apply 的 commit
  输出：commit range（含 SHA）

步骤 2：依赖检查（是否被后续 commit 依赖）
  动作：
    扫描 commit range 之后所有 commit，检查是否修改了同一批文件
    若被依赖 → 停下问用户是否仍要 revert（可能引起冲突）
  输出：依赖清单

步骤 3：生成 revert commit
  动作：
    按 git-commit skill 的中文提交规则生成 revert commit message
    保留 trailer 规则（按用户 memory：使用 git-commit skill 时不加 Co-Authored-By 尾行）
  输出：revert commit SHA

步骤 4：目录双向往返
  若 change 已从 changes/ 移到 archive/：
    反向移动 archive/<name> → changes/<name>
    刷新 .td-state/archive-counter.yaml（-1）

步骤 5：refresh reverse-spec-report.md（若触及 spec）
  动作：调用 td-reverse-spec 的局部刷新
  输出：报告 commit 计数、分系统分布更新

步骤 6：验证（跑 verification-before-completion）
  按门序列执行验证，全部通过才返回
```

**约束**：本 skill 只撤销**本 change 的改动**，不撤销用户在此期间做的其他 commit。revert 冲突时停下问用户，不自动 resolve。

**与 memory 对齐**：与 git-commit skill 的 Co-Authored-By 规则一致——不加尾行。

**blast radius**：1 个新 skill（`skills/td-rollback/SKILL.md`）+ `plugin.json` / `commands/` 增加入口（3–4 文件）。

#### 2.2 `td-triage` skill — issue 分流（可选，看要不要）

**痛点**：issue 文档生成规则已在用户 memory 里（feature / bug 三种章节格式），但**没有 skill 承接**。现在遇到「这个 issue 该做吗 / 该合并哪个 change / 属于哪个 todo-pool 条目」没有工具。

**改法**：

新增 `skills/td-triage/SKILL.md`：

```
入口：用户输入 /td-triage <issue-url-or-file>

步骤 1：读 issue，识别类型
  feature → 按 memory 里定的格式（动机 + 建议方案）
  bug → 按 memory 里定的格式（问题描述 + 复现步骤 + 预期行为）
  chore / refactor → 按 issue 类型标注，走标准 td-explore

步骤 2：查重（是否已有 change 覆盖）
  扫描 openspec/changes/*/ 的 proposal.md
  若有匹配 → 引用该 change，标注「已覆盖」

步骤 3：查 todo-pool
  扫描 openspec/todo.md
  若有匹配 → 引用该条目，标注「已在待办池」

步骤 4：建议下一步
  无覆盖、无待办 → 建议 td-explore 或 td-propose（根据 issue 成熟度判断）
  有覆盖 → 建议跳到 apply 或验证覆盖是否充分
  有待办 → 建议从 todo-pool 转 change
```

**约束**：本 skill 只输出建议，不自动创建 change 或修改 todo。

**优先级判定**：现在没有明确痛点（用户 memory 里的 issue 模板规则可以直接从 memory 里用），可以等 issue 处理流程走成瓶颈再加。**建议 P2，先不做**。

**blast radius**：1 个新 skill（`skills/td-triage/SKILL.md`）+ 命令入口。

#### 2.3 `field-assessment` 增加「项目上下文发现协议」references 变体

**当前漏洞**（使用态 LLM 视角，AGENTS.md § 使用态 LLM 视角审核标准的**触发语义 + 自包含性**维度）：agent 触发 `td-explore` 时对用户项目一无所知，每次都要 `ls` 3–5 轮才能摸清目录结构。这是使用态 LLM 每次触发都要付的性能税，且不同 agent 版本回忆稳定性不同。

**设计原则对齐**：**不引用 AGENTS.md**（避免违反 plugin 编辑禁令）——改为「按入口文件存在性探测」，只读文件路径和顶层节标题用于路由，不引入任何规则到 skill 上下文。

**改法**：

新增 `skills/field-assessment/references/project-context-discovery.md`，定义探测协议：

```
入口文件探测优先级（从高到低）：
  1. openspec/config.yaml     # 若本 plugin 已启用
  2. .atomcode.md             # 项目本地 agent 指令
  3. .claude.md
  4. AGENTS.md                # 仅探测存在性 + 顶层节标题
  5. README.md / README.rst   # 通用兜底
  6. 纯 ls 探索（无入口文件）

动作：
  对每个存在的入口文件：
    读取顶层节标题（不读正文内容）
    提取路径信息（目录结构清单）
  输出「项目上下文候选清单」到 field-assessment 的识别流程节

约束：
  - 只探测路径与顶层节标题，不引入任何规则到 skill 上下文
  - 探测失败静默降级到纯 ls 探索
  - 探测结果缓存到会话内，td-explore / td-propose 触发时直接读取
```

**价值来源判据**（AGENTS.md § 设计变更评估维度 § 价值）：
- 不做这项，agent 在真实项目里会犯什么错？→ **每次触发 td-explore 都要付 3–5 轮 tool call 探索目录结构**（PPG 项目实测数据），是**可复现的性能损失**
- 判据：**工程导向价值**（性能税），非生态对齐

**重量**（AGENTS.md § 重量维度）：
- token 消耗：+1500（新增 references 变体）
- LLM 调用次数：+1 轮（触发时探测）
- 生成 token 量：低（探测结果结构化输出）

**代价**：
- 中——需要在 field-assessment 里增加「入口文件探测优先级」表；各 SKILL.md 触发前置检查处需引用这个 references
- 维护成本：探测优先级可能需要随社区新规范调整（如未来出现 .codex.md）

**风险不对称性**：
- 判错方向 A（漏探测）→ 退化为纯探索，无功能损失
- 判错方向 B（误引入规则）→ 用户可覆盖探测优先级，可恢复
- **双向代价有界**

**结论**：**缩窄范围做**——只探测路径和顶层节标题，不引入规则；不引入 AGENTS.md 引用（遵守 plugin 禁令）。

**blast radius**：1 个新文件（`skills/field-assessment/references/project-context-discovery.md`）+ 1 个文件（`skills/field-assessment/SKILL.md` 引用该 references）+ 各 td-* SKILL.md 触发前置检查处（引用式改动，非结构性）。

### 第三档：跨 skill 结构性问题（3 条）

#### 3.1 共享 schema — 单一契约定义

**痛点**：`td-propose` 生成的 proposal / design / tasks、`td-apply` 消费的 tasks、`td-archive` 归档时的 state——**格式约定散落在各 skill 的提示词里**。改一个 skill 的输出格式，另外两个悄悄错配（这是 td 工作流演进中最容易被忽视的漂移）。

**改法**：

新增 `references/schema.yaml`（或 `references/schema.md`），定义：

```yaml
# 单一权威 schema
proposal:
  required_sections:
    - 问题陈述
    - 触碰的 Requirement    # 新增，见 1.2
    - 触碰的 ADR            # 新增，见 1.2
    - 建议方案
    - 系统工程影响评估
  optional_sections:
    - 前置依赖
    - 验收判据

design:
  required_sections:
    - Context
    - Decision
    - Alternatives considered
    - Impact
    - Verification plan

tasks:
  required_fields_per_task:
    - description
    - verification        # 见 1.3
    - category            # test | implement | refactor
  required_fields_per_requirement:
    - title
    - scenarios: []

state:
  required_fields:
    - phase               # 见 3.3
    - checkpoints: []     # 见 1.3
    - archived_at: null
```

所有 skill 读同一份 schema，不各自内联。改 schema 只需改一份，所有 skill 自动对齐。

**约束**：schema 是**机器可读**的（YAML 或 JSON Schema），不是散文；验证通过 schema 而非 LLM 记忆。

**blast radius**：1 个新文件（`references/schema.yaml`）+ 所有 skill 的 prompt 更新（引用 schema 而非内联）。

#### 3.2 change ↔ git 分支 / worktree 绑定

**痛点**：td 工作流没有告诉 agent「一个 change 应该对应一个 worktree / 分支」。用户 memory 里有 worktree 工作流规则（4 步复合操作），但**change 目录名、分支名、worktree path 三者的绑定关系**是隐式的，靠人工命名。

**改法**：

`td-propose` 创建 change 时同步输出建议分支名，并在 state.yaml 里绑定三者：

```yaml
# openspec/changes/<name>/state.yaml 新增字段
change_id: <name>
suggested_branch: feat/<name>    # 遵循 .atomcode.user.md 的 Branch 前缀约定
worktree_path: /path/to/wt       # 若已在 worktree 中
branch: feat/<name>              # 实际分支
linked_at: <ISO datetime>
```

**约束**：绑定是**建议**，不是强制——用户可能选择在主分支上做小改动。绑定关系用于 rollback 时快速定位（见 2.1），也用于 audit 时统计 change 分布。

**blast radius**：1 个文件（`skills/td-propose/SKILL.md`）+ state.yaml schema 扩展。

#### 3.3 change 生命周期状态机 — 显式 phase

**痛点**：change 现在只有「proposed → archived」两态（外加隐含的 applying），但真实过程有：proposed → designing → implementing → verified → archived。中间态没有，导致 `td-apply` 中断后无法精确 resume（只有 1.3 的 per-requirement checkpoint 打补丁）。

**改法**：

state.yaml 加 `phase` 字段，每个 skill 声明它期望进入和离开哪个 phase：

```yaml
# state.yaml
phase: proposed | designing | implementing | verified | archived | partially-archived | reverted

# skill 契约：
td-propose: proposed → designing
td-apply: designing → implementing → verified
td-archive: verified → archived
td-archive (部分完成): verified → partially-archived
td-rollback: archived → reverted
```

**约束**：跨 phase 的操作是显式的（比如 td-apply 不能从 proposed 直接到 archived）；违反 → 停下问用户。

**与 1.3 的关系**：1.3 是 phase 内部的 checkpoint 粒度，3.3 是 phase 之间的状态机。两者互补，不重复。

**blast radius**：1 个文件（state.yaml schema，与 3.1 合并定义）+ 所有 skill 的 phase 契约声明。

#### 3.4 `td-system-audit` 增加「skill 自身一致性扫描」维度

**当前漏洞**（使用态 LLM 视角，AGENTS.md § 使用态 LLM 视角审核标准的**自动化候选入口**缺失）：AGENTS.md 明确「周期性自审需按 4 维度检查」，但 `td-system-audit` 目前的 audit scope 只覆盖项目状态（project scope），不覆盖 skill 库本身的一致性。随着 18 个 skill 增长，跨 skill 的语义重复/逻辑冲突靠人工发现的成本很高——需要一个自动化的候选扫描入口来降低人工成本。

**与其他建议的关系**：与 § 1.7（audit Round 2 artifact 存在性硬门禁）是**正交**的——1.7 是"audit 报告要可核查"（对 artifact），3.4 是"audit 要覆盖 skill 库自身"（对 skill 库本身）。

**改法**：

在 `td-system-audit SKILL.md` 增加一个 audit scope（`skills` scope），执行 AGENTS.md § 使用态 LLM 视角审核标准的自动化候选扫描：

```
新 scope: skills
  触发：手动（/td-system-audit --scope=skills）或周期性（默认每月）

  自动化扫描维度（可脚本化的部分）：
    D1. 强度单一事实源一致性
       - 扫描 constraint / tier / profile skill 正文中的强度表述
       - 与 field-assessment 表 1/表 2/表 3 交叉验证
       - 差异 → 候选冲突清单

    D2. 数字一致性
       - 跨 skill 同一概念的数字（"失败 2 次 vs 3 次"等）
       - 提取所有数字声明 → 按概念聚合 → 差异项列出

    D3. 开发态语句残留（禁用词表）
       - 扫描 SKILL.md 中的 AGENTS.md / CLAUDE.md 引用
       - 扫描 Superpowers 残留字样
       - 扫描平台工具名（AskUserQuestion / TodoWrite 等）

  人工扫描维度（保留给 td-system-audit 的 LLM 判断）：
    D4. 语义重复 / 模糊
    D5. 可精简

  输出：audit 报告新增「Skill 一致性扫描」节
       含 D1–D3 的自动化扫描结果表 + D4/D5 的 LLM 判断
       报告结构与现有 audit 报告一致
```

**价值来源判据**（AGENTS.md § 设计变更评估维度 § 价值）：
- 不做这项，agent 在真实项目里会犯什么错？→ **跨 skill 语义重复/冲突靠人工发现，成本随 skill 数量线性增长**，18 个 skill 已到临界点，是**可复现的维护成本**
- 判据：**工程导向价值**（维护成本），非生态对齐

**重量**（AGENTS.md § 重量维度）：
- token 消耗：+2000~3000（新增 scope 与扫描规则）
- LLM 调用次数：+2 轮（扫描 + 报告）
- 生成 token 量：中（扫描结果结构化输出）
- 墙钟时间：约 2–5 分钟（估算，取决于 skill 库规模）

**代价**：
- 高——需要设计扫描规则和报告格式，与 AGENTS.md § 使用态 LLM 视角审核标准 4 维度对齐
- 维护成本：扫描规则本身需随 AGENTS.md 审核标准演进同步更新
- 使用态认知成本：新 scope 增加触发方式，但触发是显式的，非默认路径

**风险不对称性**：
- 判错方向 A（漏检冲突）→ 靠人工审兜底，与当前一致，代价有界
- 判错方向 B（误报冲突）→ 用户可标记为已豁免，可恢复
- **双向代价有界，但误报成本高**——扫描结果须明确区分「已豁免」与「新发现」

**结论**：**缩窄范围做**——先只自动扫描 D1（强度一致性）、D2（数字一致性）、D3（禁用词表）三个可脚本化维度；D4（语义重复）/ D5（可精简）保留人工判断。

**blast radius**：1 个文件（`skills/td-system-audit/SKILL.md`）+ audit 报告结构扩展（新增「Skill 一致性扫描」节）+ 可能的辅助扫描脚本（`scripts/` 或 hook）。

#### 3.5 memory 教训 → skill 强制化的追踪机制

**当前漏洞**（用户 memory 中「教训未被强制化」的技术债不可见）：用户 memory 里积累了一批「不能靠 LLM 记住，必须靠 skill 强制」的教训（worktree 4 步复合、worktree archive realpath、5 秒能验证的必须验证、不制造伪决策点、issue 模板固定、git-commit 不加 Co-Authored-By 等），但其中大部分**没有被 skill 硬编码进去**。哪些教训已强制化、哪些还是技术债，缺少系统追踪。

**与其他建议的关系**：与 § 1.1（explore 停止条件）、§ 1.5（archive worktree workaround）等**具体强制化建议互补**——那些是具体教训的强制化，3.5 是"教训强制化覆盖度"的追踪机制。

**改法**：

新增 `skills/td-system-audit/references/memory-lesson-mapping.md`，定义追踪协议：

```
教训登记（人工维护）：
  位置：docs/ 或 .td-state/ 下的映射表（YAML）
  字段：
    - lesson_id: 短标识
    - source: memory | audit-history | user-explicit
    - content: 教训原文摘要
    - enforced_in: skill 路径 + 节号（若已强制化）
    - status: enforced | partial | missing
    - last_reviewed: ISO datetime

扫描流程（td-system-audit skills scope 触发时执行）：
  对每条 status ≠ enforced 的教训：
    输出「未强制化的教训清单」到 audit 报告
  对每条 status = enforced 的教训：
    验证 skill 中确实存在对应条目（grep 关键字）
    若 skill 中已不存在 → 状态降级为 missing，输出「教训强制化漂移」

用户 memory 变更同步：
  用户更新 memory 时 → 手动更新映射表
  td-system-audit 可提示「上次审阅距今 X 天，建议核对 memory 是否有新增教训」
```

**价值来源判据**（AGENTS.md § 设计变更评估维度 § 价值）：
- 不做这项，agent 在真实项目里会犯什么错？→ **memory 中的教训无法强制化时，agent 每次都要靠会话时的即兴回忆，导致同一教训被反复遗忘**（PPG 项目实测：worktree 教训已两次靠 memory 抢救）
- 判据：**工程导向价值**（可复现的教训遗忘成本）

**重量**：
- token 消耗：+1000（新增 references + 映射表）
- LLM 调用次数：+1 轮（audit 时扫描）
- 生成 token 量：低

**代价**：
- 低——映射表是轻量 YAML，扫描规则简单（grep 关键字）
- 维护成本：memory 变更时需手动同步映射表——可用 hook 或 td-system-audit 定期提示降低遗漏

**风险不对称性**：
- 判错方向 A（漏记教训）→ memory 中仍有原始记录，可后续补登
- 判错方向 B（误标 enforced）→ 扫描发现 skill 中无对应条目时自动降级
- **双向代价有界**

**结论**：**做**——权重低、价值明确、与 3.4 联动自然。

**blast radius**：1 个新文件（`skills/td-system-audit/references/memory-lesson-mapping.md`）+ 1 个文件（映射表 YAML，位置待定）+ `skills/td-system-audit/SKILL.md` 增加扫描入口。

## 影响面汇总

| 建议 | 类型 | 改动文件数 | 新状态文件 | 与主基调 |
|---|---|---|---|---|
| 1.1 explore 停止条件 + 判据验证 | 修补 | 1 | ❌ | 开放的复杂巨系统 |
| 1.2 propose spec/ADR 对齐 | 修补 | 1 + proposal 模板 | ❌ | 综合集成 |
| 1.3 apply checkpoint + 测试先行任务顺序 | 修补 | 1 + state.yaml + audit-history | ❌（扩展） | 综合集成 |
| 1.4 archive 完成度硬门禁 | 修补 | 1 + audit-history | ❌（扩展） | 系统工程 |
| 1.5 archive worktree 路径 | 修补 | 1 | ❌ | 开放的复杂巨系统 |
| 1.6 reverse-spec ADR 化 | 修补 | 1 | ❌ | 系统工程 |
| 1.7 audit Round 2 硬门禁 | 修补 | 1 + audit 报告结构 | ❌ | 综合集成 |
| 1.8 verification 门序列 | 修补 | 1（可能重写） | ❌ | 系统工程 |
| 2.1 td-rollback | 新增 skill | 4–5 | ❌ | 开放的复杂巨系统 |
| 2.2 td-triage | 新增 skill | 4–5 | ❌ | 综合集成 |
| 2.3 项目上下文发现协议 | 新增 references + 引用 | 2 + N 引用式 | ❌ | 开放的复杂巨系统 |
| 3.1 共享 schema | 结构 | 1 新 + N skill | ❌ | 综合集成 |
| 3.2 change ↔ branch 绑定 | 结构 | 1 + state.yaml | ❌（扩展） | 系统工程 |
| 3.3 phase 状态机 | 结构 | schema + N skill | ❌（扩展） | 开放的复杂巨系统 |
| 3.4 audit skill 一致性扫描 | 新增 scope | 1 + 报告结构 + 辅助脚本 | ❌ | 综合集成 |
| 3.5 memory 教训 → skill 追踪 | 新增 references + 映射表 | 2 + 1 引用 | ❌ | 系统工程 |
| **合计** | | **~24 文件** | **0 新（全部走已有 `.td-state/`）** | |

**关键约束**：全部改动**不引入新的持久化目录**——`state.yaml` 走 `openspec/changes/<name>/`（change 内部），`audit-history.yaml` 走已有的 `.td-state/`。

## 优先级建议

如果只选 5 条：

1. **1.4 archive 完成度硬门禁**（P0）——堵住「假闭环」这条最贵的 bug
2. **1.5 archive worktree 路径硬编码**（P0）——用户 memory 教训不该靠记忆
3. **1.2 propose 与 spec/ADR 对齐**（P0）——把 spec 目录的价值真正吃进来
4. **1.1 explore 停止条件 + 判据验证**（P0）——用户 memory 已定死，skill 补上强制
5. **3.1 共享 schema**（P0）——一次性投入，之后每次改 skill 都不用同步 N 份

如果只选 1 条：**1.4 archive 完成度硬门禁**——它是唯一能让「td 工作流说完成就真的完成」的机制，也是最容易被 LLM 走过场的那一环。

## 与其他设计的关系

- **与 `schema-borrowing-design-2026-09-14.md`（archive）**：3.1（共享 schema）与该 archive 稿讨论的「artifact 骨架」同源，本稿是落地形式（YAML schema）；archive 稿更关注 schema 生态对齐，本稿更关注 skill 契约收敛。
- **与 autonomy-mode-design-2026-09-09.md**：1.4 的「部分完成转 todo」机制与 autonomous 模式下「不阻塞，标注后继续」哲学一致；1.8 的门序列可复用 autonomous 模式的失败回退策略。

## 风险评估

| 风险 | 严重度 | 缓解 |
|---|---|---|
| 新增 2 个 skill（2.1 / 2.2）导致 skill 数量膨胀 | 低 | 每个 skill 对应明确的 memory 教训或明确空白，非泛化。2.2 建议 P2 不做 |
| 1.4 完成度硬门禁误拒归档 | 中 | 提供「部分完成转 todo」显式路径，不是死锁 |
| 1.8 门序列过严导致每次改动跑全套 | 中 | 门序列按改动类型裁剪，纯文档改动只跑 M1 |
| 3.1 共享 schema 落地时同步 N 个 skill 出错 | 中 | 一次性提交（原子编辑），schema 是单一权威，验证脚本自动检查 skill 引用 |
| 3.3 phase 状态机过于严格 | 低 | 违反 phase 契约是停下问用户，不是拒绝工作；允许用户 override 但记录 |
| worktree workaround（1.5）在其他 OS 上行为不同 | 低 | 用 POSIX 兼容语法（test -L / realpath），Windows 有 WSL；不做 Windows 特化 |
| memory 教训硬编码到 skill 后与 memory 版本漂移 | 中 | memory 变更时需同步 skill 更新（可通过 audit 检查——skill 里 hardcode 的教训条数 vs memory 里对应的条目数） |

## 已决结论（开放问题闭环）

1. **2.2 td-triage 优先级**：建议 P2，先不做。当前 memory 里的 issue 模板规则可以直接从 memory 里调用，未有明确痛点。等 issue 处理流程走成瓶颈再加。

2. **共享 schema 的载体**：YAML（不是 JSON Schema），因为 YAML 支持注释、更接近 skill prompt 的自然阅读体验。放在 `references/schema.yaml`（复用 `references/` 目录，与其他契约文件并列）。

3. **phase 状态机的严格度**：允许「跳 phase」但强制标注原因（写入 audit-history.yaml）。跳 phase 的合理场景：小改动（proposed → verified 直接跳过 designing）；不合理场景：verified → proposed 反向跳（这应该是 rollback 的范畴）。

4. **worktree workaround（1.5）的适用面**：仅针对 `openspec archive` 的写操作；只读的 `openspec validate` / `openspec list` 不需要。这条边界要写在 skill 里，避免过度 workaround。

5. **memory 教训的追踪机制**：memory 里每条「教训」都应在 skill 里能找到对应的强制化条目（可通过 audit 报告检查）。若 memory 有教训但 skill 未强制 → 记为「教训未被强制化」的技术债。

6. **本设计的落地形式**：不作为单个 change 落地，而是作为 td 工作流的**路线图**。每条建议独立开一个 change，按优先级排列。

7. **实施顺序**：
   - 第一批（P0，独立可做）：1.1、1.2、1.4、1.5、1.6、1.7、3.5
   - 第二批（依赖第一批）：1.3（依赖 state.yaml，与 3.1 / 3.3 联动）、1.8（可能需要重写）、3.4（依赖 skills scope 设计，与 1.7 联动）
   - 第三批（结构性，需要单独 change）：3.1、3.2、3.3、2.3（涉及 field-assessment references 目录扩展，需与 3.1 协调）
   - 第四批（可选新增 skill）：2.1（若近期有 rollback 需求）、2.2（P2）

8. **新增 3 条建议的价值来源判据复核**（按 AGENTS.md § 设计变更评估维度 § 价值）：
   - **2.3 项目上下文发现协议**：工程导向（性能税，3–5 轮 tool call 探索），非生态对齐；结论缩窄范围做
   - **3.4 audit skill 一致性扫描**：工程导向（维护成本随 skill 数量线性增长，18 个已到临界点），非生态对齐；结论缩窄范围做（只自动扫描可脚本化 3 维度）
   - **3.5 memory 教训 → skill 追踪**：工程导向（教训遗忘成本可复现，PPG 项目实测 worktree 教训已两次靠 memory 抢救），非生态对齐；结论做
   
   三条都通过价值来源判据，且都遵守 AGENTS.md § SKILL 不可引用 AGENTS 文件的禁令。

9. **2.3 与 3.5 的联动**：两者都属"使用态 LLM 视角"改进——2.3 降低触发时的探索成本，3.5 降低教训遗忘成本。落地时可分开做，但顺序上建议先做 3.5（成本低、价值明确），再做 2.3（涉及 references 目录结构扩展，与 3.1 协调）。

## 评估结论（2026-09-24）

> 评估方式：对照 AGENTS.md「重量/价值/代价 + 风险不对称性」三维度逐条判定，关键事实断言已当场验证（grep skills/ 全树）。验证结果：1.1/1.5/1.8 的「当前漏洞」断言成立；**1.4 断言部分过时**——td-archive 步骤 2/3 已有门禁（SKILL.md:95 自述「CLI 确认语义已由门禁承担」），缺的是 Requirement→代码、Scenario→测试级核对，落地时先核对现有门禁避免重复定义。

### 逐条判定

| 建议 | 判定 | 理由 |
|---|---|---|
| 1.1 explore 停止条件+判据验证 | **做** | memory 教训实测两次；token 微增，省「打断用户」信任成本 |
| 1.2 propose spec/ADR 对齐 | **做** | 重提已退役路径可复现；每 proposal +1 轮扫描换 ADR 违规未声明 |
| 1.3 apply checkpoint | **缩窄做**——只做 checkpoint，删 TDD 顺序约束 | checkpoint 工程导向；「关键词分类 test/implement」是伪判定，中文任务描述直接失效 |
| 1.4 archive 完成度门禁 | **做**（先核对现有步骤 2/3 门禁，避免重复定义） | 假闭环最贵；归档低频，+几轮 grep 可接受 |
| 1.5 worktree workaround | **做，最优先** | 5 行文本，零轮次增加，memory 已抢救过 |
| 1.6 reverse-spec ADR 化 | **做** | 边界漂移不可逆代价；低频触发成本低 |
| 1.7 audit artifact 硬门禁 | **做** | 08-04 假闭环实测；低频，成本有界 |
| 1.8 verification 门序列 | **缩窄做**——只定义「改动类型→门类」映射框架，命令留项目自适应 | 原稿写死 cargo/gates/*.sh 是 atomcode 项目门，不是通用 plugin 资产 |
| 2.1 td-rollback | **推迟**（维持第四批） | rollback 低频，新 skill + 4 文件 |
| 2.2 td-triage | **不做**（维持已决结论 1） | 无工程痛点 |
| 2.3 项目上下文探测 | **做** | +1500 token 换 −3~5 轮 tool call，净正；探测 AGENTS.md 必须严守「对象性豁免」边界 |
| 3.1 共享 schema | **缩窄做**——先只做 proposal 必填节清单（即 1.2 两节），不急全量 schema | 契约收敛是工程导向，但本 plugin 无测试框架，「机器验证」是空的，验证仍靠 LLM 读 |
| 3.2 change↔branch 绑定 | **不做** | 命名约定一句话建议即可，state.yaml 字段是重炮打蚊子 |
| 3.3 phase 状态机 | **不做**，用 1.3 checkpoint 代替 | 中间态价值被 1.3 覆盖；已决结论 3 自己允许跳 phase，等于状态机可绕过 |
| 3.4 audit skills scope | **缩窄做**（维持原稿判定：只自动扫 D1/D2/D3） | 维护成本随 skill 数增长；显式触发非默认路径 |
| 3.5 memory 教训追踪 | **做**，警惕映射表本身是会腐烂的重复定义（memory 与 skill 双份） | 轻量 YAML+grep，教训遗忘可复现 |

**汇总**：直接做 8 条（1.1/1.2/1.4/1.5/1.6/1.7/2.3/3.5）；缩窄 3 条（1.3/1.8/3.1）；不做 2 条（3.2/3.3）；维持原判 2 条（2.1 推迟、2.2 不做）。

### 跨条目风险（原稿低估的三点）

1. **「假闭环」门禁的重复风险**：1.4/1.7/1.8/3.4 四条都在加验证逻辑，各自展开会造出 4 份弱重复的「验证规范」，违反审核标准维度 2（同一事实多处定义）。收敛方案：**1.8（verification skill）作为门序列权威，1.4/1.7 引用它**，不各自内联。
2. **state.yaml 载体收窄**：3.2/3.3 判不做，故 state.yaml 只定义 checkpoint 字段（1.3），不一次定义 branch/phase 字段。
3. **触发面膨胀**：1.1/1.2/1.3/1.4 叠加后 propose/apply 前置 gate 明显变重，与 tier-small「不强求重流程」冲突——这几条 gate 须写明按 field-assessment 表 1 tier 加成裁剪，非无条件必跑。

### 修订后的实施顺序

- **第一批（P0）**：1.5（最窄，先行）→ 1.1 → 1.2 → 1.4（先核对现有门禁）→ 1.6 → 1.7 → 3.5
- **第二批**：1.3（缩窄版，state.yaml 只含 checkpoint 字段）、1.8（映射框架版，落地后 1.4/1.7 改为引用式）
- **第三批**：2.3（与 3.1 协调，3.1 缩窄为 proposal 节清单并入 1.2）、3.4（skills scope，D1–D3）
- **第四批（可选）**：2.1；2.2、3.2、3.3 移出清单（不做）

本节评估落地后，更新「优先级建议」节：原「如果只选 5 条」中的 3.1（共享 schema）替换为 3.5（memory 教训追踪）——前者已缩窄并入 1.2，后者成本低且独立可做。

---

## 复评结论（2026-09-24 二次评估）

> 评估方式：对照现有 SKILL.md 逐条核对「当前漏洞」断言是否成立。核对了 `skills/td-archive/SKILL.md`、`skills/td-explore/SKILL.md`、`skills/td-apply/SKILL.md`、`skills/td-propose/SKILL.md` 全文。上一节评估结论已核对 1.4；本节补齐其余条目的核对结果，并修正上一节的结论。

### 上一节评估结论的六个关键误判

#### 误判 1：1.4 完成度门禁——四个门禁已被现有机制覆盖，应判不做

上一节评估说「1.4 先核对现有步骤 2/3 门禁，避免重复定义」，但没走完核对。逐门禁核对结果：

| 门禁 | 描述 | 现状 |
|---|---|---|
| A | Requirement → 代码实现（find_references / grep） | **不可机械化**——proposal 里 Requirement 是自然语言描述（如「支持用户登录」），grep 找不到这个语义；只能靠 LLM 主观判断「这段代码是否实现了这条 Requirement」，正是 08-04 假闭环教训要防的形式 |
| B | Scenario → 测试 | 已被 `td-apply` 步骤 6.1 覆盖：审计 scenario→test 覆盖账本，未通过是 **blocking defect** |
| C | tasks.md 全部 `[x]` | 已被 `openspec validate --archived`（`td-archive` 步骤 4）硬校验 |
| D | spec delta 完整性 | 已被 `openspec validate --all` 与 CLI sync 机制覆盖 |

**结论：1.4 不做**。真正空的只有门禁 A，但它语义上无法机械验证——那要引入 LLM 主观判断，回到假闭环。

**唯一值得保留**：把 1.4 门禁 A 的意图合入 1.2——`td-propose` 在 proposal.md 里强制把每条 Requirement 显式挂到「具体代码位置预期」（类名 / 函数名 / 模块路径），这样 archive 时才有机械核对的锚点。这是 1.2 的扩展，不是新门禁。

#### 误判 2：1.3 apply checkpoint——tasks.md 天然是 checkpoint 系统，应判不做

`td-apply` 步骤 4 基本执行循环已经写了：「更新 tasks.md：`- [ ]` → `- [x]`，附验证证据」。tasks.md 每任务带状态带证据，本身就是 per-task checkpoint 系统。加 state.yaml 平行结构 = 制造两个事实源，正是本设计自己在「跨 skill 契约缺失」小节批评的形态。

上一节评估说「1.3 缩窄——只做 checkpoint」，但 checkpoint 已存在。此条应完全划掉，不是缩窄。

#### 误判 3：2.3 项目上下文探测违反 AGENTS.md 禁令

2.3 让 `field-assessment` 在探测优先级里把 AGENTS.md 列为第 4 级，声称「仅探测存在性 + 顶层节标题」——这是变相违反「SKILL 不可引用 AGENTS 文件」禁令。

对象性豁免条款**只覆盖 `agents-md-hygiene`**（其职责就是操作 AGENTS.md），`field-assessment` 不在此列。而且使用态 LLM 一旦读到顶层节标题（如「## Git 命令黑名单」），大概率会想读正文——禁令的本意是「agent 不应主动去读 AGENTS.md」，探测标题也是变相读取。

#### 误判 4：3.5 memory 教训追踪映射表位置错误

`skills/td-system-audit/references/memory-lesson-mapping.md` 承载的是「哪些 memory 教训已强制化」的技术债追踪——这是**开发态资产**（给仓库维护者看的），不是使用态运行时资产。放 skills/ 下违反 SKILL.md 编辑规则：「skills 目录内只能保留使用态文本；开发态文本说明可以写到 docs 目录内」。

且 memory 本身是自由文本，映射表必然腐烂——原稿自己也承认这一点。

#### 误判 5：3.1「缩窄做」后等于没做

上一节评估说 3.1 缩窄为「只做 proposal 必填节清单（即 1.2 两节）」——两节直接内联到 `td-propose` 步骤 6.c 模板即可，不需要独立 schema.yaml 文件。本 plugin 无 CI、无测试框架，独立 YAML schema 只给使用态 LLM 多读一份冗余文件，没有机器验证承接。

#### 误判 6：1.1 explore 停止条件与 1.6 reverse-spec ADR 化被高估

**1.1**：`td-explore` 步骤 4 已经写了：「决策已闭合、无新信息时不凑方向——正确输出是一句话『没有需要你的决策点，直接继续推进』」。1.1 说的「不制造伪决策点」这条 memory 教训**已经在 skill 里**。真正缺的是「每轮开始时问三条停止条件」，但让 agent 每轮显式问 S1/S2/S3 反而**制造新的仪式性负担**（每条都要问），与 AGENTS.md 维度 3「仪式性内容」判据冲突：无法回答「使用态 LLM 在哪一步、以什么约束改变行为」。

**1.6**：原稿说「1 个文件改动」，但检测「边界变更」需要：(1) 定义「边界」的可机械判据（6 个分系统切分、目录归属、tier）；(2) 存储「上次的边界快照」；(3) Diff 两次快照。第 2 步在 skill 里没有对应载体——要新增一个 reverse-spec 快照存储，改动远超「1 个文件」。

### 逐条判定（修正后）

| 建议 | 上一节 | 修正后 | 依据 |
|---|---|---|---|
| 1.1 explore 停止条件+判据验证 | 做 | **不做** | 「不凑方向」已在步骤 4；显式问 S1/S2/S3 是仪式性负担 |
| 1.2 propose spec/ADR 对齐 | 做 | **做**（扩展承载 1.4 门禁 A 的意图） | Requirement 挂代码位置预期，为 archive 提供机械核对锚点 |
| 1.3 apply checkpoint | 缩窄做 | **不做** | tasks.md 已是 checkpoint 系统 |
| 1.4 archive 完成度门禁 | 做 | **不做** | 四门禁中三已被覆盖，唯一真空缺（门禁 A）无法机械化 |
| 1.5 worktree workaround | 做 | **做** | 唯一 memory 硬背书 + 5 行文本 + 零轮次增加 |
| 1.6 reverse-spec ADR 化 | 做 | **不做** | 边界快照存储无载体，改动远超 1 文件 |
| 1.7 audit artifact 硬门禁 | 做 | **做**（改形态） | 不新增散文门禁推断；改报告结构为结构化 Artifact 验证表 |
| 1.8 verification 门序列框架 | 缩窄做 | **不做** | 门序列映射框架本身对通用 plugin 是空话（每个项目 gates 不同） |
| 2.1 td-rollback | 推迟 | 推迟 | — |
| 2.2 td-triage | 不做 | 不做 | — |
| 2.3 项目上下文探测 | 做 | **不做** | 违反 AGENTS.md 禁令；变相读取 |
| 3.1 共享 schema | 缩窄做 | **不做** | 缩窄后等价于 1.2 内联；无机器验证承接 |
| 3.2 change↔branch 绑定 | 不做 | 不做 | — |
| 3.3 phase 状态机 | 不做 | 不做 | — |
| 3.4 audit skills scope D1/D2/D3 | 缩窄做 | **缩窄到只做 D3** | D1（强度一致性）/D2（数字一致性）扫描结果需人工裁决，误报率高；D3（禁用词表：AGENTS.md 残留 / Superpowers 残留 / 平台工具名）是唯一可脚本化 + 误报可判定的 |
| 3.5 memory 教训追踪映射表 | 做 | **不做** | 属开发态资产，位置违反 SKILL.md 编辑规则；映射表必然腐烂 |

**汇总**：做 3 条（1.2 / 1.5 / 1.7）；缩窄做 1 条（3.4 只做 D3）；不做 10 条；维持推迟/不做 2 条。

### 与原稿路线图的差异

原稿「修订后的实施顺序」列 4 批 14 条（含缩窄），本复评收敛为 4 条独立 change（每条独立可 propose、可 audit）。差异来源：

- 原稿把「假闭环门禁」（1.4）视为 P0，本复评判不做——现有机制已覆盖大部分，唯一真空缺语义上不可机械化；这条教训的正确承载位置是 1.2（propose 侧让 Requirement 挂代码位置预期），不是 archive 侧加主观判断门禁
- 原稿把 2.3（项目上下文探测）与 3.5（memory 追踪）视为工程导向价值，本复评判不做——两者分别违反 SKILL 不可引用 AGENTS.md 禁令、违反「skills/ 只保留使用态文本」编辑规则；价值判据通过不等于约束通过
- 原稿把 3.1（共享 schema）缩窄为 proposal 节清单并留独立文件，本复评判不做——缩窄后就是内联到 1.2 的模板扩展，独立 schema.yaml 无机器验证承接
- 原稿把 3.4 缩窄到 D1/D2/D3 三维度，本复评进一步缩窄到 D3——D1/D2 的自动化扫描结果需人工裁决，误报成本高，与 AGENTS.md 维度 2「不制造重复定义」的意图冲突

### 落地建议（4 条独立 change）

按依赖与 blast radius 排序：

1. **change 1**：`td-archive` worktree 路径 workaround（1.5）——最窄，1 文件，5 行文本，memory 硬背书。可独立试跑
2. **change 2**：`td-propose` spec/ADR 对齐 + Requirement 挂代码位置预期（1.2 + 1.4 意图合并）——1 文件 + proposal 模板扩展，为后续 archive 门禁提供机械锚点
3. **change 3**：`td-system-audit` 报告结构新增结构化 Artifact 验证表（1.7）——1 文件 + 报告结构扩展，把「散文断言」转为「可机械核对的表」
4. **change 4**：`td-system-audit` skills scope D3 扫描（3.4 缩窄版）——1 文件 + 扫描入口；仅 D3（禁用词表），不与 D1/D2 联动

每批独立提出、独立验证，不打包成路线图。change 1 落地后即可以评估「memory 教训硬编码到 skill」是否真减少遗忘——这是本设计的唯一实证判据。

### 风险评估

| 风险 | 严重度 | 缓解 |
|---|---|---|
| 收敛为 4 条后，用户 memory 里其他教训（worktree 4 步复合、issue 模板、git-commit Co-Authored-By）仍无 skill 承接 | 中 | 这些教训当前靠 memory 硬背书、使用态 LLM 已能正确执行；不是「未被强制化 = 会遗忘」，是「memory 已在承担强制化」。等真出现遗忘再补 |
| 1.7 改报告结构后，历史 audit 报告缺该结构，跨版本比对断裂 | 低 | audit 报告是时间点快照，不需要跨版本可比；新结构自新 audit 起生效即可 |
| 3.4 只做 D3 后，跨 skill 语义重复/数字冲突仍靠人工审 | 低 | 与当前一致（18 个 skill 已到临界但尚可控），且这是原稿自己也承认的「人工兜底」路径 |
| 3.1 不做共享 schema 后，未来 proposal / design / tasks 格式变更仍需多处同步 | 中 | 现有 SKILL.md 里必填节清单已经「接近权威」——真出现漂移时，先加内联锚点，不到引入独立 schema.yaml 的程度再议 |

---

## 第三次评估结论（2026-09-24 独立核验）

> 评估方式：对复评赖以成立的关键事实断言，逐条对照实际 SKILL.md 核验（`td-archive` / `td-propose` / `td-explore` / `td-apply` / `td-system-audit` / `td-reverse-spec` / `verification-before-completion` / `todo-pool` 全文 + `grep` skills/ 全树 43 文件）。结论：**复评方向正确——3 条完全同意，1 条（3.4）不同意载体，1 条（1.1）认为复评砍过头。**

### 事实断言核对（证据）

| 复评断言 | 核对结果 |
|---|---|
| 1.3「tasks.md 天然是 checkpoint 系统」 | **成立**。td-apply 步骤 4 基本执行循环第 4 步：`- [ ]` → `- [x]`，附验证证据 |
| 1.4 四门禁中 B/C/D 已覆盖 | **成立**。B：td-apply 6.1 账本审计，未绿是 blocking defect；C：`openspec validate --archived`（td-archive 步骤 4 归档完整性自证）；D：`validate --all` + CLI sync。只有门禁 A（Requirement→代码）真空，且语义上不可机械化 |
| 1.5「worktree workaround 无 skill 承接」 | **成立**。`grep 'worktree\|realpath\|symlink'` skills/ 全树零命中；td-archive 步骤 4 直接 `openspec archive --yes` |
| 2.3 违反 AGENTS.md 禁令 | **成立**。对象性豁免只覆盖 `agents-md-hygiene`；「读顶层节标题」就是变相读取，禁令本意即 agent 不应主动读 AGENTS.md |
| 3.5 映射表是开发态资产 | **成立**。「skills/ 只留使用态文本」是编辑规则明文，映射表（给仓库维护者看的技术债追踪）放 skills/ 下违规 |
| 原稿 1.7 锚定的「Round 2」 | **目标不存在**。grep 全树「Round 2」仅出现在本 docs 文件——现 `td-system-audit` 无此结构；复评改判为「报告结构扩展」是正确读法 |
| 1.2「propose 不与 spec 对齐」 | **部分过时**。td-propose 6.a 已读相关分系统 baseline、6.c 有「与既有架构/风格的遵循关系」必填字段。但 `openspec/adr/` 对齐确实不存在（skills/ 全树零 ADR 提及）——落地时须引用式衔接 6.a/6.c，不重复定义 |

### 对复评 4 条幸存建议的独立判定

| 建议 | 判定 | 重量 | 价值来源 | 风险不对称性 |
|---|---|---|---|---|
| **1.5 worktree workaround** | **做，最优先**（同意复评） | ~5 行文本，0 轮次增加，无新状态文件 | 工程导向：memory 硬背书（worktree 教训已两次靠 memory 抢救），可复现失败 | 双向有界：条件分支（`test -L`）在不用 worktree 的项目上自禁用，零副作用 |
| **1.2 spec/ADR 对齐 + Requirement 挂代码位置预期** | **做**（同意复评，但两半价值不对称） | 1 文件 + proposal 模板 2 节 | ADR 半：防「重提已退役路径 / 违反 ADR 未声明」，项目条件触发（无 `adr/` 则跳过，零成本）；**代码位置预期半更有价值**——它是 1.4 门禁 A 唯一可行承载：propose 时给出类 / 函数 / 模块锚点，archive / audit 时才有机械核对目标 | 双向有界：锚点是 propose 时刻的预期而非持久指针，漂移不产生错误结论 |
| **1.7 audit Artifact 验证表**（改形态后） | **做**（同意复评） | 报告模板 + SKILL 步骤 4，小 | 工程导向：08-04 假闭环 memory 背书；audit 低频，每次 +几轮 `test -f` / `git cat-file` 可接受 | 双向有界：只降级断言（「已闭环」→「未验证」），不拒工作 |
| **3.4 只做 D3 禁用词扫描** | **价值成立，载体不同意**（见分歧 1） | — | — | — |

### 两个分歧

**分歧 1：3.4 不应放进 `td-system-audit` 的 skills scope。** 复评判「做（skills scope 只做 D3）」，问题在载体：`td-system-audit` 是用户项目里的运行时 skill，它的「skills scope」扫的是 plugin 自己的 skill 库——这是本仓库开发者的维护工作，不服务使用态 LLM 的项目执行决策（按审核标准维度 3「仪式性内容」判据，使用态 LLM 读不到可执行的下一步动作）；同时 `argument-hint` / description 要为第三 scope 扩触发语义，污染触发判读。价值本身成立（开发态泄漏反复发生，维护成本真实），正确载体是**仓库侧资产**：一个可跑的 grep 脚本或 docs/ 检查清单，由开发者周期性执行；且只有开发侧资产能合法引用 AGENTS.md 审核标准作为判据来源（skills/ 下不能引用）。

**分歧 2：1.1 复评砍过头了。** 复评把 1.1 整条判「不做」，其两条理由各管一半：「不凑方向已在步骤 4」与「显式问 S1/S2/S3 是仪式」——对「停止条件每轮问」那半成立，同意不补。但「判据当场验证」那半在现有 skill 里**没有承接**：td-explore 步骤 4「先查仓库再提问」解决的是「不问用户仓库里已有的事实」，不解决「候选方向判据未验证就进 todo-pool」。memory 里的 async-storage 教训（判据靠直觉推断、事后发现两点都不成立）正是后者。正确形态不是原稿的步骤 0 仪式 gate，而是 **todo-pool「落池条目」子流程（或 td-explore 步骤 7）加 2 行**：落池条目含可验证判据（文件存在性 / 命令行为 / 配置作用范围 / git 状态）→ 先跑命令验证再落池，验证结果附在条目上；验证不过 → 显式标「未验证」，禁止「直觉判据」直接落池。这是引用式小改动，服务落池那一步的执行决策，不引入每轮仪式。

### 被否建议复核：全部同意复评

- **1.3**：tasks.md 已是 per-task checkpoint 系统，加 state.yaml 平行结构 = 两个事实源（本稿自己批评的形态）。
- **1.4**：B/C/D 已被覆盖（见核对表），唯一真空缺门禁 A 语义上不可机械化，其意图由 1.2 的「Requirement 挂代码位置预期」承载。
- **1.6**：边界快照存储无载体，「1 个文件」是低估；触发条件本身（什么算边界变更）尚无机械判据。
- **1.8**：通用 plugin 写死 `cargo` / `gates/*.sh` 是 atomcode 项目门，不是 plugin 资产；现有 `verification-before-completion` 的「列出适用命令 + 实跑 + evidence-based 声明」已是正确泛化度，映射框架只会空转。
- **2.1**：rollback 低频，git revert + 手工目录移动够用，维持推迟——等真实需求出现。
- **2.2**：无工程痛点，issue 模板规则 memory 直接可调用，不做。
- **2.3**：违反 AGENTS.md 禁令 + 入口文件清单（`.codex.md` 之类）必然随生态腐烂，不做。
- **3.1**：缩窄后 = 1.2 内联两节；本 plugin 无 CI / 测试框架，独立 schema.yaml 无机器验证承接。
- **3.2 / 3.3**：分支命名约定一句话建议即可；phase 状态机按已决结论 3 自己允许跳 phase，等于可绕过。
- **3.5**：开发态资产放 skills/ 违规；memory 自由文本 + 映射表双份 = 必然腐烂。

否决理由均成立，不翻案。

### 建议落地顺序（5 条独立 change，覆盖复评 4 条 + 1 条新形态）

1. **change 1**：`td-archive` worktree 路径 workaround（1.5）——最窄，5 行，先行试跑
2. **change 2**：`td-propose` spec/ADR 对齐 + Requirement 代码位置预期（1.2 + 1.4 意图）
3. **change 3**：`td-system-audit` 报告 Artifact 验证表（1.7 改形态）
4. **change 4**：todo-pool 落池判据验证 guard（1.1 的 2 行窄版，原稿与复评均未覆盖到）
5. **change 5**：D3 禁用词扫描做成**仓库侧脚本 / 检查清单**（3.4 换载体，不进 runtime skill）

### 风险总评

- 五条全部双向代价有界，无不可恢复路径。
- 最大风险是复评已指出的「1.2 落地时别把 6.a / 6.c 已有内容重复定义」——执行时须引用式衔接，这是每条 change 进「依赖图谱与分析」门禁时先查的点。
- 本稿三轮评估均未动任何 skill / 命令文件；落地按 AGENTS.md 门禁逐条走 propose，每条独立成 change、独立验证。
