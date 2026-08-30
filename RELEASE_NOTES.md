# total-design v1.6.0 发布说明

> 面向使用态用户：升级前请先读「⚠️ 行为变更」与「升级步骤」。

## 本版本是什么

1.6.0 是**新防护机制 + 配置层收拢版**：分两个阶段。

**阶段 1（新防护机制）**：新增 caller impact 三层防护（前馈 / 实测闸门 / 校验），防止"改公共零件前未查 caller"破坏既有调用方（来源：pt-ai 2026-08-24 P0/P1 事故复盘）；新增 `todo-pool` skill（todo 待办池单一事实源）与 `config-context-guidance`（config.yaml context 引导单一权威）。

**阶段 2（配置层收拢）**：skill 总数 27 → 18。5 个局部规律 skill（`brooks-law` / `critical-buffer` / `delay-decision` / `human-in-loop` / `wip-limit`）收拢为 `constraints` 的 references 变体；3 profile + 3 tier 独立 skill 移入 `field-assessment/references/` 变体文件。触发路径收敛为"入口 skill 判读 → 按需读变体"，使用态 LLM 的触发面收窄，强度单一事实源不变（仍在 `field-assessment` 表 1/2/3）。

## 本次变更

### 阶段 1：新防护机制

- **caller impact 三层防护**：
  - **前馈层**（`td-propose` 步骤 6.c）：触发条件命中时 proposal 必填「caller impact 分析」节——变更点类别标注（四类：公共符号签名 / Protocol 接口方法 / 装配点 / 数据流与返回值语义）+ 高危 go/no-go 标记 + 已知高危 caller。
  - **实时层**（`td-apply` 步骤 4）：任务实施前的「Caller Impact 实测」闸门——caller 清单由引用搜索实测产出（file:line + 调用形式），逐 caller 确认兼容；tier-large 硬闸门（清单 + 结论未产出不进入任务实施）、tier-medium 信号触发（高危变更点 / 已知 caller 需适配 / 架构 review 存疑）、tier-small 提醒（默认跳过）。
  - **校验层**（`requesting-code-review` 架构 review）：proposal 缺「caller impact 分析」节或缺变更点类别标注与高危标记 → critical 阻塞 apply（仅 tier-small 降 warning）。
  - **触发条件**：change 跨分系统（受影响分系统 ≥ 2）或涉及四类变更点任一类；单分系统 + 无四类变更点 → 三层均不触发（不给小改动加流程开销）。
  - **单一事实源**：`td-apply/references/change-point-classes.md`（四类定义 / 触发条件 / 边界裁定 / 已知盲区），三层只引用不复述。已知盲区：静态引用搜索抓不到动态 dispatch（反射 / DI 容器 / 字符串调用），由 apply 7.2 契约 / 集成验证补。
- **`todo-pool` skill 新增**：`openspec/todo.md` 待办池的单一事实源与读写操作入口（格式约定、落池、归档勾选）。`td-explore` / `td-system-audit` 落池、`td-archive` 归档勾选、`td-propose` 读池挑候选均按本 skill 的子流程操作；原 `td-propose/references/todo-format.md` 删除并入。
- **`config-context-guidance` 单一权威**：`openspec/config.yaml` 的 `context` 字段引导流程（空 / 注释 / 模板默认值时三问引导，用户跳过不阻塞）收敛到 `field-assessment/references/config-context-guidance.md`，`td-explore` / `td-propose` / `td-init` 三处引用。

### 阶段 2：配置层收拢

- **局部规律收拢**：`brooks-law` / `critical-buffer` / `delay-decision` / `human-in-loop` / `wip-limit` 由独立 skill 收拢为 `constraints` 的 `references/<name>.md` 变体文件，触发路径统一为"命中触发场景 → 读 `constraints` 入口判读子约束 → 读对应 references 执行"。
- **profile/tier 变体收拢**：3 profile + 3 tier 独立 skill 移入 `field-assessment/references/` 变体文件（识别流程判读后按命中的 profile 与 tier 各读一份，共 2 份），内容按使用态视角精简。
- **引用路径全量规范化**：跨 skill 引用一律逻辑名 + 变体路径（`constraints/references/<name>.md` / `field-assessment/references/<name>.md`）。
- **开发态语句清理**：各 skill 正文与 references 的跨 skill 重复段落与开发态语句（编辑指令 / 调用方清单 / 写作规范类旁白）清理；冲突仲裁语义与运行时指针保留。
- **根目录 `plugin.json` 新增**：Agent Plugins 1.0.0 规范清单（`$schema` / `name` / `version` / `description` / `author`），与 `.atomcode-plugin/plugin.json` 的 atomcode 加载清单并存，`name` / `version` / `description` 保持一致。

## ⚠️ 行为变更

| 变更 | 1.5.0 旧行为 | 1.6.0 新行为 |
|---|---|---|
| skill 总数 | 27 个 | **18 个**（10 个独立 skill 并入 `constraints` / `field-assessment` 变体） |
| 子约束触发 | 直接触发 `wip-limit` / `human-in-loop` 等独立 skill | **统一经 `constraints` 入口判读**后读对应 references 执行 |
| profile/tier 读取 | 触发 `profile-greenfield` / `tier-large` 等独立 skill | **由 `field-assessment` 识别流程判读后读对应变体文件**（各一份，共 2 份） |
| proposal 必填节 | 无 caller impact 要求 | **tier-medium/large 命中触发条件时必填「caller impact 分析」节**（变更点类别标注 + 高危标记），缺节阻塞 apply |
| apply 步骤 4 | 架构 review 复核后直接实施 | **架构 review 复核 + Caller Impact 实测闸门**（tier-large 硬闸门 / tier-medium 信号触发 / tier-small 提醒）后再实施 |
| todo 池读写 | `td-propose` 的 `references/todo-format.md` 持有格式 | **`todo-pool` skill 单一事实源**（格式 / 落池 / 勾选子流程） |
| config context 引导 | `td-explore` / `td-propose` / `td-init` 三处各自展开 | **引用 `field-assessment/references/config-context-guidance.md` 单一权威** |

**不改变的**：表 1/2/3 强度数值（`field-assessment` 单一事实源）、td-* artifact 流（propose → apply → archive）、WIP 硬约束 + override 机制、`wip-limit` 等 5 个子约束的执行规则本身、`.td-state/` 持久化约定——零变更。

## 升级步骤

1. **bump 版本**：根目录 `plugin.json` + `.atomcode-plugin/plugin.json` + `marketplace.json` 的 `version` 同步改为 `1.6.0`（description 保持纯 ASCII）。
2. **重新发布/安装**：把仓库内容同步到 marketplace 安装副本（`~/.atomcode/plugins/marketplaces/total-design-marketplace/`）。
3. **重新 trust**：`atomcode plugin trust total-design` —— plugin 内容有变更，需重新 trust 确保新内容加载。
4. **验证**：
   - 安装副本 skills/ 与仓库 `diff -rq` 一致；三份清单（根目录 `plugin.json` / `.atomcode-plugin/plugin.json` / `marketplace.json`）版本号同为 1.6.0。
   - skill 总数 18：`ls skills/ | wc -l` → 18；旧独立 skill 目录不存在：`test ! -d skills/wip-limit && test ! -d skills/tier-large && test ! -d skills/profile-greenfield && echo "OK"`。
   - 变体文件就位：`ls skills/constraints/references/`（5 份）与 `ls skills/field-assessment/references/`（11 份，含 profile/tier 变体 + `config-context-guidance.md`）。
   - caller impact 三层就位：`grep -l 'Caller Impact 实测' skills/td-apply/SKILL.md` 有输出；`test -f skills/td-apply/references/change-point-classes.md`。
   - 逻辑名/命令名/路径/CLI 命令/环境变量不变：`constraints` / `field-assessment` / `/td-propose` / `openspec list` / `$_TD_TIER` 等。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.6.0] 条目。