# Changelog

本文件记录 total-design plugin 的版本变更。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循 [SemVer](https://semver.org/lang/zh-CN/)。

## [1.10.0] - 2026-09-08

### Added

- **TDD 变异自检（`test-driven-development`）**：high 风险测试全绿后做一次变异自检——临时翻转一处核心断言对应的产线逻辑（改返回值 / 破坏边界），确认测试集转红后还原；不转红 = 该断言什么都没保护，回测试设计步骤重写。medium / low 不做。
- **设计回写（`td-apply` 步骤 5）**：实施途中发现 design / spec / proposal 与代码现实冲突 → 全局必停，触发 `human-in-loop` 让用户拍板：回写 artifact（改完继续）或改代码迁就（仅限实现细节冲突）；用户选回写则更新对应 artifact 并在 tasks.md 记录，且受影响任务的既有验证证据作废——重跑全绿后才继续实施。
- **wip-limit「常见合理化」对照表**（`constraints/references/wip-limit.md`）：4 类 agent 自我说服（"就超一个""change 互不相关""先 override 回头立刻 archive""合并几个 change 一起过"）逐条给出现实反驳，与「触发时机」节的二次 override 提醒衔接。
- **td-archive CLI 加持**：步骤 3 对照源 2 存在时用 `openspec show "<name>" --diff`（OpenSpec CLI ≥ v1.11）取本 change 对主 spec 的真实变更行，契约对照只审 diff 命中行；步骤 4 sync 后跑 `openspec validate --archived`（≥ v1.9）自证归档完整性。两个 flag 均带版本降级，低版本不阻塞 archive。
- **td-explore「先查仓库再提问」**：事实类问题（"现在 X 是怎么做的""有没有 Y 配置"）先在仓库自查（代码 / `openspec/specs/` / config / README），已有事实不问用户；确需提问时附基于现场证据的推荐默认值；仓库证据与用户认知冲突时摆证据让用户裁决。
- brooks-law「协调成本」论据补量化：沟通路径数按 n(n-1)/2 增长，协调成本随并行成员数超线性上升。
- AGENTS.md 审核维度 3 新增「仪式性内容」检查线（仓库元文档，非运行时资产）：方法论文本须绑定执行动作，给出判定线与「服务的主基调原则」节合格形态（声明原则 + 约束的动作，收紧写法而非删节）。

### Changed（行为变更）

- **brainstorming 内联进 `td-explore`，skill 数 18 → 17**：提问提炼方法论成为 td-explore 内建流程，无功能损失；`/total-design:brainstorming` 显式调用入口消失，需求不清场景由 `/td-explore` 承接（其 description 已含"优先路由到这里"语义）。AGENTS.md / README / 各 SKILL.md 引用全部同步，运行时资产零残留。
- **td-archive 步骤 3 复盘深度按 tier 分层**：`tier-small` 只对照 2 字段（实际影响分系统 + 预期行为模型验证），`tier-medium` / `tier-large` 保持 5 字段——小系统的 5 字段对照表是纯形式化。
- **td-apply Guardrails 并行例外**：「不跳过任务，按 tasks.md 顺序」补「tasks.md 显式标注并行的任务除外」。
- **token 优化**：指令侧冗余精简（21 文件 -83 行）；高频预加载段收敛（system-engineering 四条展开、6 处归位段、executing-plans body 63→50 行）——每次 propose+apply+archive 生命周期省约 700-900 token；writing-plans / test-driven-development / requesting-code-review / systematic-debugging 4 个行为层 skill 补精简版「服务的主基调原则」节。

### Fixed

- **初始 spec 建立的写入方表述**（profile-greenfield）：propose 以 change 的 spec delta 形态建立初始 spec，由 archive sync 落进 `openspec/specs/` 成为 baseline——propose 不直写主 spec 目录（原表述易被读成 propose 直写）。
- **td-propose 步骤 6.a 补读 baseline spec**：会话上下文无本次 change 触及分系统的 baseline spec 内容时，读 `openspec/specs/` 相关 spec.md（契约与不变量）作为「与既有架构/风格的遵循关系」与整体影响判断的输入（greenfield 首个 change 无 baseline → 跳过）；原 greenfield 特例段由本逻辑取代删除。

## [1.9.0] - 2026-09-06

### Added

- **change 级收尾 code review（`td-apply` 步骤 6.3）**：完成判定链新增硬步骤——两层验证（change-level + 系统级）全部通过后、change 判 done 前，对本 change 的全部新增 / 修改代码做一次收尾 review；review 判出 critical → **change 不算 done**，修复后重跑 6.1 change-level 验证（修复使既有验证证据失效）。tier 分层：`tier-small` 保底抽查（只查 Spec compliance + 安全红线——小 change 可能全程轮不到 checkpoint review，收尾是它唯一的 review 机会，不整体跳过）；`tier-medium` / `tier-large` 按 tasks.md 全部任务`风险`字段最高档取。原 6.3 current-change audit 顺移为 6.4（audit 在 review 之后跑），表 3（`field-assessment/references/audit-frequency.md`）与 `executing-plans` 的锚点同步 6.3 → 6.4。
- **`requesting-code-review` 第 6 节「change 级收尾 review」**：review 对象为本 change 全部新增 / 修改代码（不是单个任务 diff）；执行方式为工具优先、LLM 兜底——当前 agent 环境自带 code review 工具时优先调用（review 对象与深度档位作为范围输入），工具失败（不可用 / 报错 / 超时）或无工具则按第 1–3 节做 LLM 人工 review；与 checkpoint review 的分工：checkpoint 是任务粒度增量检查，收尾是 change 级整体检查（跨任务接口衔接、模块拼装后的整体 Spec compliance——任务各自绿，拼起来仍可能失调）；critical 阻塞沿用第 4 节。description 与「触发时机」节补 change 收尾触发场景。

### Changed（行为变更）

- **apply 完成判定链变硬**：1.8.0 为「两层验证通过即 done」；1.9.0 起为三层——6.1 change-level 验证 + 6.2 系统级验证 + 6.3 收尾 review 无 critical，三层全过才算 done，之后才进 6.4 current-change audit 与 archive。

### Fixed

- **使用态审核 2 处问题**（收尾 review 节）：删除「这是本节存在的理由」结构辩护句（开发态泄漏，不服务使用态 LLM 执行决策）；「深度档位」段补 `tier-small` 保底抽查分支（引用 `td-apply` 步骤 6.3），消除孤立触发本 skill 时的语义空洞。

## [1.8.0] - 2026-09-05

### Added

- **多平台支持（Claude Code + Pi Agent）**：加载清单由 `.atomcode-plugin/` 迁移到 `.claude-plugin/`（atomcode 加载器搜索顺序 `.atomcode-plugin → .claude-plugin`，本 plugin 走 CC 兼容路径），新增根目录 `package.json`（Pi Agent 的 `pi.skills` 指向 `./skills`）。三个平台共享仓库根目录同一份 `skills/`（18 个 skill），无副本无 symlink。README 补三平台安装 / 信任 / 命令前缀差异说明，AGENTS.md 补「支持的 code agent」表与四处 manifest 一致性规则。
- **review Security 维度**：`requesting-code-review` 新增安全维度（注入面 / 凭证与权限 / 外部输入校验 / 敏感数据暴露）与报告字段。
- **风险驱动的 review 深度分档**：`requesting-code-review` 按 tasks.md 任务的 `风险` 字段分档——high 全查四维度（安全维度必查）、medium 查三维度 + 安全红线、low 抽查 Spec compliance、无 `风险` 字段的独立 review 请求按 medium，落点 `writing-plans` 的「风险 → review 深度」契约。
- **baseline 漂移定向刷新闭环**：`td-system-audit` 步骤 6 映射表新增「baseline spec 与代码漂移 → td-reverse-spec」行；`references/audit-report-template.md` 主基调 3 清单补 baseline 对齐检查项与漂移信号判定（分系统存在绕过 td 工作流的代码提交 / archive 复盘记录过模型偏差 / 用户反馈文档与代码行为不一致，任一命中即抽查对应分系统）。
- **td-reverse-spec 第二入口契约**：除「中途接手」首次建立 baseline 外，承接 audit 检出的漂移分系统做定向刷新——只对漂移分系统执行反推（分系统边界也已变化时先重走边界识别），用新反推结果**覆盖更新**其 `openspec/specs/<subsystem>/spec.md`；该分系统有未归档 change 触及时先完成 archive 再刷新，避免与 archive sync 双写冲突。
- **既有架构与代码风格遵循约束**：`td-explore` 步骤 3 读项目状态时同时识别既有架构风格与代码约定（分系统边界 / 命名 / 模块组织 / 错误处理模式），作为候选方向的隐性约束——不遵循的方向必须显式标注偏离及理由；`td-propose` 影响评估新增「与既有架构/风格的遵循关系」必填字段，偏离需写明偏离点与理由并触发 `human-in-loop` 让用户确认；`td-apply` 步骤 4 TDD 实现默认对齐既有风格与实现模式；`requesting-code-review` 新增 Code consistency 维度与报告字段。

### Changed（行为变更）

- **tier 判据三档互斥化**：`field-assessment` 识别流程 §3 的 tier 判据由重叠区间（文件数 100+ / 10–100 / 3–10）改为互斥区间（源码文件 200+ / 20–199 / <20，部署单元 4+ / 2–3 / 1），补计数口径注（源码文件 = 手写代码 + 测试源文件，排除 vendor / 生成代码 / lock 文件 / 纯静态资源 / 文档与 CI 配置）与判据不明确时的 `human-in-loop` 兜底。三份 tier 变体的「与其他 tier 的切换」阈值改为指向 §3 的判据指针（单一事实源），3 profile × 3 tier 的强度数值不变。
- **hook 运行时改 Node**：`hooks/td_state_sync.py` 替换为 `hooks/td_state_sync.js`（Node ≥20.19.0，CJS + `node:` 内置模块，零依赖），与 OpenSpec CLI 共用同一运行时，去除 Python 依赖；`hooks.json` 的环境变量由 `${ATOMCODE_PLUGIN_ROOT}` 改为 `${CLAUDE_PLUGIN_ROOT}`。hook 触发时机与校正逻辑不变（SessionEnd 兜底，非流程门禁）。
- **7 个 SKILL.md description 精简**：去掉「OpenSpec 契约层入口」等重复前缀与「服务主基调第 X 条」填充语，收敛触发词、去掉引号包裹（`td-propose` / `td-explore` / `td-apply` / `td-archive` / `td-init` / `td-reverse-spec` / `td-system-audit`）。

### Fixed

- **td-apply 装配点新增定义点豁免漏洞**：`references/change-point-classes.md` ③ 装配点类补「装配点的新增定义点也属本类——纯新增、无既有 caller 不豁免标注」；新增跨包同语义锚点特判——同一语义在多个分系统各自落地定义（路径锚点 / 根目录解析 / 相对路径基准等）时每个定义点独立计为 ③ 变更点，变更点清单须列出全部定义点（file:line）并附一致性依据（同源传参或同锚一致性测试二选一）；纯新增定义点没有既有 caller 可查时，实测与校验改为验证一致性依据成立，不得因「无 caller」跳过。
- **使用态审核 4 处问题**：`requesting-code-review` description 补「架构 review」触发场景与 critical 阻塞语义；`td-propose` greenfield explore 判据具象化为用户可枚举信号；`wip-limit` override 回路补落点说明（override 场景的 WIP 确认落 `proposal.md`，非 override 场景的加人手确认由 `brooks-law` 落 `design.md`，两处不冲突）；`td-apply` 前置检查精简为「触发条件 + 指向权威文件」。
- **5 处模糊指令消歧**：`td-system-audit` 信号触发「关键链缓冲被多次压缩」改为「压缩 2 次以上」（与 `systematic-debugging` 的失败 2 次以上阈值口径对齐）；同 skill 收敛 `audit-history.yaml` / `audits/` 的「首次运行时按需创建」冗余（同段 null 语义已承载创建条件）；`td-init` gitignore 约束消除并列句歧义（「文件当前可能不存在，但一旦创建就进版本库」）；`td-explore` 步骤 6 模板说明与下节「条目标号规则」硬约束消歧；`brainstorming` 用动作词替换软词。
- **config-context-guidance 重复节**：删除与 `td-init` 重复的「定位」节。

### Removed

- 删除 `.atomcode-plugin/` 目录（`plugin.json` 移为 `.claude-plugin/plugin.json`，`marketplace.json` 迁移为 `.claude-plugin/marketplace.json`）。
- 删除 `hooks/td_state_sync.py`（由 Node 版 `hooks/td_state_sync.js` 取代，产出等价）。

### Docs

- AGENTS.md：三层结构表述优化，补「支持的 code agent」表、`package.json` 目录条目、四处 manifest 一致性与版本发布流程（四处清单同步 bump）；CONTRIBUTING.md / README.md 同步多平台安装路径。
- README.md：补 Claude Code / Pi Agent 安装说明、三平台命令前缀差异表、hook 运行时前置（Node.js ≥20.19.0）与 Agent Plugins 1.0.0 规范说明。
- `.gitignore`：新增 Node / pnpm 段（`node_modules/` / `dist/` / `*.tsbuildinfo`）。

## [1.7.1] - 2026-09-02

### Fixed

- **explore 流程伪决策点修复（apply 前机械性打断）**：删除 `td-explore` / `brainstorming` / `delay-decision` / `profile-greenfield` 的候选方向硬性数量要求（"至少 2 个" / "2–3 个"），改为按需产出；决策已闭合、无新信息时不凑方向，正确输出为"没有需要你的决策点，直接继续推进"。`td-propose` greenfield explore 检查判据由"候选方向 ≥2"改为"会话内充分探索"。`human-in-loop` 固化判定优先级：必停基线优先、直接推进是补集——放行需同时满足"未命中必停基线 + 用户已授权继续 + 在已闭合决策框架内"。

### Docs

- 清理候选方向相关的负向描述元注释（"数量不设硬性下限" / "不依赖候选方向数量"等仅声明"曾有下限、现已无"、对使用态 LLM 无执行决策价值的语句）。

## [1.7.0] - 2026-09-01

### Changed（行为变更）

- **brainstorming 取消落盘 spec（explore 阶段不落盘）**：删除 brainstorming 第 5/6 步（分段呈现 spec、保存 spec 文档）。explore 阶段成果以对话形式交付，不再落盘 spec 草稿；用户要求落盘时提示走 `/td-propose`。`td-propose` 步骤 6.a 的输入源由"brainstorming spec 草稿"收敛为"`td-explore` 候选方向评估"；greenfield explore 检查判据同步去掉对 brainstorming 落盘的引用。
- **brainstorming 流程内强制 delay-decision 检查**：完成候选方向评估后立即执行 `constraints` 的 `references/delay-decision.md` 检查——不可逆决策（分系统边界 / 公共 API）信息不足时不仓促闭合，提示继续 `/td-explore` 收集信号后由用户拍板再 `/td-propose`；可逆决策（实现方案）按「延迟不等于拖延」处理，不构成进入 propose 的阻塞。
- **`field-assessment` 快车道读取策略**：`constraints` 入口与 `field-assessment` 识别流程补"快车道"读取路径（命中单一 profile/tier 变体时直接读命中份，跳过其余判读），3 profile + 3 tier 变体引用同步对齐。
- **td-archive project audit 阈值改整数倍口径**：`tier-small` / `tier-medium` 的判定由"`count` ≥ 表 3 阈值"改为"`count` 为表 3 阈值的**整数倍**"（count 是累计值不重置，恰好每第 N 次 archive 触发一次建议），与累计计数器兼容。

### Fixed

- **td-reverse-spec spec 产出格式对齐 openspec validate**：Requirement 从句含 SHALL 规范陈述、Purpose / Scenario 结构对齐官方校验器，消除 spec 校验兼容问题。
- **td-system-audit Guardrails 作用域限定**：频率触发（表 3）限定范围，豁免信号触发与修复闭环重跑；步骤 2 补 `audits/.incomplete.log` 消费入口。
- **hook `td_state_sync` .incomplete.log 改整文件重写**：按当前不完整报告集合重写（现状快照而非增量追加），自动去重 / 已解决项退出 / 已删除报告消失；修复无待补条时的短路门控。
- **断链锚点修正**：`td-explore` Guardrails 锚点、`td-propose` critical-buffer「标注规范」指向「识别关键链」节、`td-apply` 6.3 audit 落盘句去重。
- **`td-init` gitignore 检查统一**：`openspec/.td-state/` 是否被覆盖的判定改为"任一层 .gitignore 覆盖"（用 `git check-ignore -v` 实测）。
- **wip-limit 检测计数口径**：活跃 change 计数明确用 `openspec list`（只列活跃 change，`archive/` 不计入）。
- **config-context-guidance 补文件不存在分支**：`openspec/config.yaml` 不存在时先创建骨架（只写 `context: ""`）再按空值流程走（官方 `openspec init --tools none` 只建目录不生成 config.yaml）。

### Docs

- 统一修辞风格，中性化替换调侃词（7 个 skill）。
- 精简冗余描述并清理开发态语句（8 个 skill）。
- 简化和统一技能描述文档（9 个 skill）。

## [1.6.0] - 2026-08-31

### Added

- **caller impact 三层防护**：防止"改公共零件前未查 caller"导致既有调用方破坏（来源：pt-ai 2026-08-24 P0/P1 事故复盘）。三层分工——前馈层 `td-propose` 步骤 6.c 新增「caller impact 分析」必填节（触发条件命中时：变更点类别标注 + 高危 go/no-go 标记 + 已知高危 caller）；实时层 `td-apply` 步骤 4 新增「Caller Impact 实测」子节（tier-large 硬闸门 / tier-medium 信号触发 / tier-small 提醒，caller 清单由引用搜索实测产出）；校验层 `requesting-code-review` 架构 review checklist 补 caller 判据（proposal 缺节或缺标注 → critical 阻塞，仅 tier-small 降 warning）。步骤 2 前置检查补对称校验（tier-medium/large 命中触发条件但缺节 → 不算 apply-ready）。
- **`td-apply/references/change-point-classes.md`**：四类变更点（公共符号签名 / Protocol 接口方法 / 装配点 / 数据流与返回值语义）与 caller impact 触发条件的单一事实源，含边界裁定与已知盲区（动态 dispatch 不全覆盖，由 apply 7.2 集成验证补）。
- **`todo-pool` skill**：`openspec/todo.md` 待办池的单一事实源与读写操作入口（条目格式、状态语义、落池动作、归档勾选动作），`td-explore` / `td-system-audit` 落池、`td-archive` 归档勾选、`td-propose` 读池挑候选均按本 skill 的子流程操作。
- **`field-assessment/references/config-context-guidance.md`**：`openspec/config.yaml` `context` 字段引导填写流程的单一权威（空 / 注释 / 模板默认值时三问引导，用户跳过不阻塞），`td-explore` / `td-propose` / `td-init` 三处引用。
- **根目录 `plugin.json`**：Agent Plugins 1.0.0 规范清单（`$schema` / `name` / `version` / `description` / `author`），与 `.atomcode-plugin/plugin.json` 的 atomcode 加载清单并存、字段集不同，`name` / `version` / `description` 保持一致。

### Changed（行为变更）

- **局部规律收拢为 `constraints` 单一入口**：`brooks-law` / `critical-buffer` / `delay-decision` / `human-in-loop` / `wip-limit` 5 个独立 skill 收拢为 `constraints` 的 `references/<name>.md` 变体文件。触发路径统一为"命中触发场景 → 读 `constraints` 入口判读子约束 → 读对应 references 执行"；12 个 skill 的引用路径统一改写（逻辑名 → `constraints` 的 `references/<name>.md`）。skill 总数 27 → 18。
- **profile/tier 变体收拢为 `field-assessment` references**：3 profile（`profile-greenfield` / `profile-brownfield` / `profile-maintenance`）+ 3 tier（`tier-small` / `tier-medium` / `tier-large`）独立 skill 移入 `field-assessment/references/`，内容按使用态视角精简（删除与识别流程重复的判据段与开发态语句）；14 个 skill 的引用路径同步改写。
- **引用路径全量规范化**：跨 skill 引用一律逻辑名 + 变体路径（`constraints/references/<name>.md`、`field-assessment/references/<name>.md`），消除裸逻辑名引用变体内容的歧义；skill 间交叉引用的文件路径与章节锚点修正。
- **config context 引导收敛**：`td-explore` / `td-propose` / `td-init` 三处逐字重复的 config.yaml context 引导流程收敛为引用 `field-assessment/references/config-context-guidance.md`，三处展开段删除。
- **开发态语句清理**：各 skill 正文与 references 的跨 skill 重复段落（《工程控制论》归位段、子系统切分规则等）与面向编辑者的开发态语句（编辑指令、调用方清单、写作规范类旁白）清理；冲突仲裁语义与运行时指针保留。

### Removed

- 删除 10 个独立 skill 目录：`brooks-law` / `critical-buffer` / `delay-decision` / `human-in-loop` / `wip-limit`（并入 `constraints/references/`）+ `profile-brownfield` / `profile-greenfield` / `profile-maintenance` / `tier-large` / `tier-medium` / `tier-small`（并入 `field-assessment/references/`）。内容保留为变体文件，仅失去独立 skill 身份（不再进 system prompt 的 description 列表，改由 `constraints` / `field-assessment` 入口按需引用）。
- 删除 `td-propose/references/todo-format.md`（格式约定并入 `todo-pool`）。

### Docs

- AGENTS.md：目录结构节补根目录 `plugin.json`；「plugin.json 编辑」节补 Agent Plugins 1.0.0 清单说明；版本发布流程改为三处版本号同步。
- 新增 `docs/audit-fix-gate-2026-08-30.md`：profile/tier 收拢的使用态 LLM 视角审核修复门记录（依赖图谱与风险评估）。

## [1.5.0] - 2026-08-27

### Changed（行为变更）

- **删除英文副本，中文版移入根目录成为唯一版本**：1.4.0 的双语结构（英文根目录 + `zh-CN/` 中文副本）简化为单一中文版。根目录 `skills/` / `commands/` 的内容由中文版替换，`zh-CN/` 目录删除。`plugin.json` 的 `skills` / `commands` 路径不变（仍为 `["./skills"]` / `["./commands"]`），加载器加载的从英文版变为中文版。
- **AGENTS.md 双语同步节精简**：「双语对应与同步修改」节从 6 条硬约束 + 双语开发流程缩减为单语说明 + 历史备注。目录结构节删除 `zh-CN/` 子目录。
- **CONTRIBUTING.md 双语指南保留**：「中文 vs 英文」节原本就规定 skill 正文以中文为主，此节内容仍然适用（code / command / filename 保持英文），不动。
- **user-invocable 收紧（行为层 7 skill）**：`brainstorming` / `executing-plans` / `requesting-code-review` / `systematic-debugging` / `test-driven-development` / `verification-before-completion` / `writing-plans` 的 `user-invocable` 由 `true` 改为 `false`。这些 skill 由流程编排触发（`td-explore` / `td-apply` 内部调用），不再作为独立 slash 入口，消除使用态 LLM 的触发歧义。
- **task 编程性约束**：`writing-plans` 新增「task 只写 agent 能编程性执行的步骤」——task 主体必须是 agent 能编程性执行的动作（写代码、跑测试、执行 CLI 命令、改配置等）；非编程性动作（人工目测、用户验收、第三方审批等）不得作为独立 task，降级为该 task 的 `验证` 字段补充说明。约束收敛到 `references/task-template.md` 的「任务主体约束」节为单一权威。
- **多章节回复编号规则**：`human-in-loop` 新增「需用户回复的条目标号规则」——呈现内容同时含多个需用户回复的章节时（如报告里的"未解决的问题"与"建议的下一步"），各章节内条目标号不得共用同一套编号，改为带章节前缀的编号（`a1 / b1`）。`td-explore` 的探索总结模板与 `td-system-audit` 的 `references/audit-report-template.md` 同步应用（编号前缀示例 `a` = 发现的问题，`b` = 建议的下一步动作）。
- **profile 强度口径收紧**：3 个 profile（`profile-greenfield` / `profile-brownfield` / `profile-maintenance`）的「在各 tier 下的 constraint 强度」改为"约束强度由 tier 单一决定，本 profile 不叠加、不修改强度数值（`human-in-loop` 的表 2 profile 加成除外）"，强度取值引用 `field-assessment` 的「下游引用强度的约定」节，不再逐字重复——消除各 profile 与 `field-assessment` 表 1 的强度口径模糊。
- **层次观归位收敛**：`tier-medium` 的层次观归位段改为引用 `field-assessment` 的 `references/subsystem-tiering.md`，不再逐字重复子系统分层机制说明。
- **删除跨平台同步打回项**：`CONTRIBUTING.md` 删除"引入跨平台同步（`.claude/` / `.codex/` 等）——本 plugin 只针对 atomcode"审查打回项。

### Removed

- 删除 `zh-CN/` 目录（`zh-CN/skills/` 39 文件 + `zh-CN/commands/` 8 文件）。中文版内容已移入根目录 `skills/` + `commands/`。
- 删除根目录 `skills/` + `commands/` 下的英文版内容（39 + 8 文件），由中文版替换。

### Docs

- AGENTS.md 目录结构节、skills/commands 内容编排节更新为单语中文。
- AGENTS.md 补充「`## 依赖技能` 节的语义定义」——预加载 vs 按需触发分界（预加载应列入依赖节，运行时按需触发不列入），判定依据参考 `td-* 标准步骤 1`。
- RELEASE_NOTES.md 更新为 1.5.0 版本发布说明（单语化结构 + 行为层收紧两个阶段）。
- 历史条目（1.4.0 及更早）保留不动，其中对双语结构的描述属于历史记录。

## [1.4.0] - 2026-08-26

### Changed（行为变更）

- **双语化结构**：本 plugin 从单一中文版重构为**英文（默认加载）+ 中文（zh-CN 对应副本）**的双语结构。根目录 `skills/` / `commands/` 为英文版（`plugin.json` 默认指向），`zh-CN/skills/` / `zh-CN/commands/` 为中文版，两套结构 1:1 镜像。
- **默认加载语言切换为英文**：`plugin.json` 的 `skills: ["./skills"]` / `commands: ["./commands"]` 现指向英文版。国际化友好，非中文环境 agent 直接读英文 frontmatter description 触发。
- **AGENTS.md 新增「双语对应与同步修改」节**：作为编辑规则的硬约束子节，规定文件清单 1:1 对应、frontmatter 逻辑字段逐字符一致、正文结构对应、逻辑名/命令名/路径/CLI 命令/环境变量跨语言不变、修改任一语言必须立即同步另一种语言、翻译漂移校验命令。
- **AGENTS.md 目录结构节更新**：反映 `zh-CN/` 子目录的新结构，补充 skills/commands 内容编排说明（英文默认 + 中文对应）。
- **依赖节定义澄清（B1）**：`## 依赖技能` = 会话级**预加载清单**，运行时按需触发的技能不应列入。5 个 td-* 依赖节恢复为仅 `system-engineering` + `field-assessment`（`td-explore` 原有的 `brainstorming` 同属运行时激活，一并移除）。依据 `td-* 标准步骤 1` 的"预加载 vs 按需触发"分界。

### Fixed

- **锚点引用修正（A1）**：统一 en 侧 3 处对 `tier-large` 文档节标题的引用写法（`delay-decision` / `td-apply` / `td-propose`），文档名 overall → general，命中实际标题 "General design document is mandatory"。
- **td-system-audit 反向触发注释（A2）**：en+zh 两处 :99 注释修正，`human-in-loop` 位置描述从错误的"触发时机"节改为"正文已反向声明（见其场景 7）"。
- **依赖节头统一（A3）**：en 侧 14 个 SKILL.md 的依赖节标题统一为 `## Dependent Skills`（消除 `## Dependencies` / `## Dependency Skills` / `## Dependent Skills` 三种变体；zh 侧 `## 依赖技能` 已统一，不动）。
- **argument-hint 双语逐字符一致（B2）**：4 对 argument-hint 统一为 en 写法（`td-init` 的 `(无参数)`→`(no arguments)`，`td-system-audit` 的 `(可选, 默认 current-change)`→`(optional, default current-change)`；含对应命令文件）。
- **field-assessment 格式补全（C1）**：en `field-assessment:16` 补 `## How It Is Referenced` 前缺空行（与 zh 侧对齐）。
- **命令术语一致性（C3）**：`commands/td-system-audit.md` description 修正 `baseline`→`keynote principles`、`total design department`→`general design department`，对齐 project 术语；同时修复命令文件 argument-hint 破坏（去引号+冒号改等号，破坏 YAML frontmatter）。

### Docs

- **双语同步硬约束**：违反文件清单 1:1 对应、frontmatter 逻辑字段不一致、正文结构不对应、跨语言不变量漂移、只改一种语言不同步另一种 = bug。校验命令：`diff <(cd skills && find . | sort) <(cd zh-CN/skills && find . | sort)` 应无输出。
- **翻译漂移校验**：`grep -c '\`<logical-name>\`' skills/` vs `zh-CN/skills/`，每个逻辑名计数应一致。计数不一致 = 某一方漏改/多改 = bug。
- **commit 风格补充**：双语同步提交时 commit message 应体现 en + zh-CN（如 `fix: correct wip-limit override flow (en + zh-CN)`）。
- **新增 `docs/audit-fix-gate-2026-08-26.md`**：记录使用态 LLM 视角审核修复的依赖图谱与分析前置门（步骤 1–6，含 16 个被改 skill 的出边、全 27 节点的依赖图谱邻接表、blast radius 与风险评估）。
- **B1 回退说明**：docs 文件头部与步骤 1 表格、步骤 5/6 风险段均标注 B1 已回退。

## [1.3.1] - 2026-08-23

### Fixed

- **消除平台工具名泄漏**：td-propose 移除正文中的 `request_user_input` 平台工具名，改为平台无关的"询问用户机制"表述（使用态 LLM 视角审核维度 4 修复）。
- **补齐依赖技能节**：critical-buffer / brooks-law / delay-decision / human-in-loop 新增「依赖技能」节，wip-limit 依赖节补列 `field-assessment`——依赖技能节与正文实际引用一致（维度 1 修复）。
- **收敛 profile 重复段落**：3 个 profile 的「在各 tier 下的 constraint 强度」节由三处逐字重复收敛为引用式，统一锚定 `field-assessment` 识别流程的「下游引用强度的约定」节（维度 2/3 修复）。

### Changed

- 版本 bump 至 1.3.1：`plugin.json` + `marketplace.json` 同步（1.3.0 条目中的发布欠账已结清）。
- `marketplace.json` 移除指向 claude-code-marketplace 的 `$schema` 引用（多平台扩展准备）。

## [1.3.0] - 2026-08-23

### Changed（行为变更）

- **wip-limit 升级为硬约束**：从"提示不强制"改为"硬阻塞 + override 机制"。`/td-propose` 与 `/td-apply` 前置检查达上限即阻塞，用户显式 override 时经 `brooks-law` → `critical-buffer` → `human-in-loop`（第 6 类）回路放行；连续 override 会升级提醒防止滥用。
- **配置层重构**：`constraint-matrix` 拆分为 `field-assessment`，表 1/2/3 收敛到四个 references（识别流程 / 强度矩阵 / audit 频率 / 子系统分层）。tier / profile skill 只保留判据与流程侧重，强度数字单一事实源化（改强度只改 `strength-matrix.md`）。
- **"预期行为模型"字段**：proposal 必填，贯通 `/td-apply` 步骤 7.2 系统级验证与 `/td-archive` 步骤 3"模型验证"复盘，形成 propose→apply→archive 闭环。
- **td-propose 步骤重排**：步骤 6 改为 6.a–6.d 循环体（创建→必填检查→循环判定），新增步骤 7 架构 review（critical 阻塞，warning 记录，nit 忽略）。
- **td-apply 强化**：tier-large 总体设计文档必填校验、步骤 4 架构 review 复核（未改沿用 propose 结论，改了才重审）、步骤 5 明确 apply 全局粒度约束、步骤 7.2 跨分系统边界验证执行序列、7.3 current-change audit。
- **td-archive 复盘升级**：步骤 3 改为"实际 vs 预期"对照表 + "模型验证"字段 + baseline 对照源（有则用、缺则降级）；新增归档后 Purpose TBD 残留检查（housekeeping）。
- **子系统独立定 tier（层次观）**：`field-assessment` 识别流程允许子系统独立定 tier，`profile-tier.yaml` 支持 `subsystems` 条目，跨子系统依赖按"最高 tier 子系统"保守处理。
- **反馈控制回路归位**：`system-engineering` 新增「反馈控制回路」节，各 skill 显式声明自己在 propose（前馈）/ apply（控制执行）/ archive（事后校正）回路中的位置。
- **executing-plans 触发路由收窄**：执行入口统一走 `/td-apply`，用户说"开始执行"/"go"应走 `/td-apply`；current-change audit 按 tier 归属分工（medium → executing-plans 步骤 3，large → td-apply 步骤 7.3）。

### Fixed

- td-apply 步骤 2：旧 change（proposal 缺"预期行为模型"字段）不再被阻塞，降级为提示（与 td-archive 步骤 3 兜底对称；新 change 仍由 td-propose 步骤 6.c 强制必填）。
- 解除 `writing-plans` ↔ `test-driven-development` 循环依赖（真实依赖方向为 tdd → writing-plans）。
- hook 报告完整性 marker 单一事实源化：`td_state_sync.py` 从 audit 报告模板「报告模板」代码块动态读取标题，消除模板标题与 hook 硬编码字符串的隐式耦合。
- 修正步骤号错引、表 1 强度冗余与依赖技能节缺失。

### Docs

- 依赖图谱与分析门（改动前置流程）、SKILL 编写视角以使用态 LLM 为主、SKILL 不可引用 AGENTS 文件规则。
- 各 skill 按使用态视角精简语义重复与模糊表述。

## [1.2.0] - 2026-08-15

- **feat**: 新增 `openspec/todo.md` 待办池机制（propose 从池中按优先级挑选候选 change）。
- **refactor**: 规范化 constraint-matrix 表引用；补全 td-propose 架构 review。

## [1.1.1] - 2026-08-15

- **feat**: 新增 `td-init` skill，初始化 total-design 工作流（检查 OpenSpec 结构 + 配置 .gitignore 防多人协作假冲突）。
- **docs**: 更新 README 多人协作指南。

## [1.1.0] - 2026-08-15

- **feat**: 新增 SessionEnd 状态持久化 hook（`hooks/td_state_sync.py`），会话结束时从文件系统事实校正 `.td-state/`。
- **feat**: 新增架构 review 与任务风险分级（high/medium/low），验证扩展为 change-level + 系统级跨分系统两级。
- **feat**: 审核修复契约层接线，约束强度收口并拆分 references 精简 skill。
- **refactor**: 补充 skill 描述触发场景；删除"与其他 skill 的关系"中与正文重复的纯概念条目。

## [1.0.0] - 2026-08-12

- 初始发布：OpenSpec 契约层（7 个 td-* command/skill）+ Superpowers 行为层转译 + 钱学森系统工程主基调约束层。
- **feat**: `td-list` 命令（列出未归档 change）；统一 td-* skill 步骤编号为 1-based。
- **chore**: 放宽各 tier 的 WIP 上限。
