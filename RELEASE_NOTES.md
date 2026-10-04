# total-design v1.14.0 发布说明

> 面向使用态用户：升级前请先读「⚠️ 行为变更」与「升级步骤」。

## 本版本是什么

1.14.0 是 **流程减法 + 新约定版**：1 项新约定（`td-cut:` 砍角标注）+ 2 处流程减法（tier-small 架构 review 降档、propose 校验收窄）+ 1 处 gate 补位（archive 全库校验收口）。td-* 契约流（propose → apply → archive）结构不变，表 1/2/3 强度数值不动，skill / command 数量不变（18 skill + 8 command）。

灵感来源：ponytail 项目（AI agent 极简编码 skill）——借鉴其「砍角显式化」注释约定与「验证前置」思想，转译接入 td 的 delay-decision → archive 闭环；其三级用户调档模式经评估**不采纳**（会破坏 field-assessment 表 1/2/3 的配置层单一事实源）。

## 本次新增

### `td-cut:` 砍角标注约定

agent 实施中故意砍角（降级实现、留已知上限的简化：全局锁、O(n²) 扫描、naive 启发式、先不做的输入校验场景）必须在代码处留一行标注：

```
# td-cut: <砍了什么角>, <已知上限>, <升级路径>
例：# td-cut: 全局锁, 单进程吞吐上限, 分账户锁当并发成为瓶颈
```

- **只标有真实 ceiling 的故意砍角**——顺手的小事不标，避免注释噪音
- **不替代记账**——该做的事延后仍走 TODO 池；`td-cut:` 是代码侧锚点，让 "later" 在 diff 里可见，不至于变 "never"
- **归档时强制收敛**——`td-archive` 前置检查 grep 本 change 的 `td-cut:` 标注，每条归入三类：已升级实现 / 已进 TODO 池 / 用户确认接受为长期现状；未收敛停下问用户

## ⚠️ 行为变更

| 变更点 | 1.13.0 表现 | 1.14.0 行为 |
|---|---|---|
| tier-small 架构 review（td-propose 步骤 7） | 无条件完整 review | 降为一行自检："是否引入新的分系统切分或偏离既有架构？"——无则记录跳过理由；tier-medium / large 不变 |
| propose 期校验范围（td-propose 步骤 8） | `validate --all` 全库校验，其他 change 的旧问题会阻塞本流程 | 只定点校验本 change；全库校验移至 archive |
| 归档校验（td-archive 步骤 4） | 无全库校验 | 补 `validate --all --json` gate 收口：旧问题提示不阻塞但必须记录，本次归档引入的问题阻塞 |
| 故意砍角（td-apply → td-archive） | 无显式留痕约定，砍角决策只在会话上下文里 | 代码处留 `td-cut:` 标注；archive 时核对收敛，不允许"留着不管" |

**不改变的**：tier-medium / tier-large 的架构 review、tier-small 的 caller impact 与收尾 review 档位、td-* artifact 流（propose → apply → archive）、表 1/2/3 强度数值、WIP 硬约束 + override 机制本体、hook 触发时机（SessionEnd 事件不变）、`.td-state/` 持久化约定、四处 manifest 的 name / description / author、skill / command 数量（18 skill + 8 command）。

## 升级步骤

1. **bump 版本**：四处清单的 `version` 已同步改为 `1.14.0`（根目录 `plugin.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / `package.json`，description 保持纯 ASCII 且四处完全一致）。
2. **运行时前置**：不变——Node.js ≥20.19.0（OpenSpec CLI 与 SessionEnd hook 共用）；OpenSpec CLI ≥ 1.12（`validate "<name>" --type change` 定点校验依赖）：`npm install -g @fission-ai/openspec@latest`。
3. **重新安装**（按平台）：
   - atomcode：`/plugin marketplace add <this-repo-url>` → `/plugin install total-design`
   - Claude Code：`claude plugin marketplace add <this-repo-url>` → `claude plugin install total-design`（或 `claude --plugin-dir <this-repo-path>`）
   - Pi Agent：`pi install git:<this-repo-url>`
4. **重新 trust**：本次 hook 命令串未变更（哈希不变），已 trust 的安装无需重新 trust；全新安装按平台执行 `atomcode plugin trust total-design`。
5. **验证**：
   - 四处清单版本号同为 1.14.0，description 四处逐字一致。
   - 砍角标注约定存在：`grep -n "td-cut:" skills/constraints/references/delay-decision.md` 有输出。
   - tier-small 降档存在：`grep -n "tier-small.*一行自检" skills/td-propose/SKILL.md` 有输出。
   - 定点校验存在：`grep -n 'validate "<name>" --type change' skills/td-propose/SKILL.md` 有输出。
   - archive gate 存在：`grep -n "全库结构校验" skills/td-archive/SKILL.md` 有输出。
   - skill 数量：`ls -d skills/*/ | wc -l` 输出 `18`。
   - 逻辑名/命令名/路径/CLI 命令/环境变量不变：`field-assessment` / `/td-propose` / `openspec list` / `$_TD_TIER` 等。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.14.0] 条目。
