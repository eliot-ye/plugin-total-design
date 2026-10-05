# total-design v1.14.1 发布说明

> 面向使用态用户：本次为**修复版**，无行为变更、无新增能力；升级只需 reinstall，无需重新信任 hook。

## 本版本是什么

1.14.1 是 **hooks 修复版**：修 `hooks/td_state_sync.js`（SessionEnd 状态持久化兜底 hook）的两处状态写入缺陷，两处都会造成"状态文件被写脏"——一个让 `.td-state/audit-history.yaml` 无限膨胀，一个让完整报告被误标为 incomplete。skill / command / references 零改动，四处 manifest 的 name / description / author 不变，仅 version bump。

**为什么发**：两条缺陷都是"运行时看似正常、状态文件里悄悄积累错误"的形态——audit-history 的镜像增长不会在会话内被用户察觉，.incomplete.log 的膨胀只在下一次 `td-system-audit` 消费入口时暴露。属于典型的"必须发版才能修"。

## 修复了什么

### 1. audit-history 全量重追加（`syncAuditHistory`）

**症状**：真实项目 `.td-state/audit-history.yaml` 镜像膨胀到 2095 条，重复条目覆盖同一批 report。

**根因**：`known` 集合的键形态两侧不一致——
- 从历史 `report:` 字段读入的键是 `audits/YYYYMMDD-HHMMSS-<name>.md`（带 `audits/` 前缀，来自 `td-system-audit` 步骤的落盘约定）；
- 从 `readdirSync(stateDir)` 产出的键是裸文件名 `YYYYMMDD-HHMMSS-<name>.md`。

去重比对用 `Set.has` 全等匹配，两侧键永远不匹配，去重恒失效。每次 `SessionEnd` 触发都把所有历史 report 追加一遍。

**修复**：入集合前统一走 `path.basename` 归一化——两种形态均收敛为裸名，去重恢复生效。

### 2. 完整报告被误判为 incomplete（`loadReportMarkers` / `isCompleteReport`）

**症状**：完整的 audit 报告被写入 `.td-state/.incomplete.log`，下次 `td-system-audit` 步骤 2 消费入口时被误当作"待补"处理。

**根因**：
- `loadReportMarkers` 从 `references/audit-report-template.md` 抓模板标题，正则限 `^#{2,3} `（H2/H3），存入的 marker 含 `##` / `###` 前缀；
- `isCompleteReport` 用 `String.includes(marker)` 匹配落盘报告；
- agent 落盘报告时用 H1 层级（同一标题，不同层级）——`includes` 判 false，完整报告被误列。

**修复**：
- marker 只存标题内容，剥掉 `#` 层级前缀（`s.replace(/^#+\s*/, "")`）；
- `HEADING_RE` 放宽到 `^#{1,6} ` 覆盖任意标题层级；
- `FALLBACK_MARKERS` 同步改为内容形态（`["System Audit 报告", "主基调对照"]`）。

`isCompleteReport` 的 `includes` 匹配变成"层级无关"，模板与 hook 的耦合方向仍是模板 → hook（`references/audit-report-template.md` 改标题 → hook 自动跟随），未破坏单一事实源。

### 3. 可测性：`require.main` 入口守卫 + 函数面导出

**症状**：脚本尾部无条件 `main()`，`require` 即执行——无法在测试中引入而跳过执行，上述两处缺陷因此漏网。

**修复**：
- 包 `if (require.main === module) { main(); }` 守卫，测试 `require` 时不再触发副作用；
- `module.exports` 导出 `loadReportMarkers` / `isCompleteReport` / `findProjectRoot` / `syncArchiveCounter` / `syncAuditHistory` 五个函数供测试消费。

CLI 直接执行行为不变（`node td_state_sync.js` 走 `require.main === module` 分支，正常进 `main()`）。

## ⚠️ 行为变更

**无。** 本次是 hook 内部状态写入缺陷修复——hook 的触发时机（`SessionEnd` 事件）、命令串、环境变量（`${CLAUDE_PLUGIN_ROOT}`）、状态文件路径与字段格式均不变。skill / command / references 零改动，td-* 契约流（propose → apply → archive）不受影响。

**唯一可感知的差异**：`.td-state/audit-history.yaml` 从"每次会话结束追加全量"变为"追加新 report"（幂等）；`.td-state/.incomplete.log` 不再包含完整报告。这是修复目的本身，不是行为变更。

## 升级步骤

1. **bump 版本**：四处清单的 `version` 已同步改为 `1.14.1`（根目录 `plugin.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / `package.json`，description 保持纯 ASCII 且四处完全一致）。
2. **运行时前置**：不变——Node.js ≥20.19.0；OpenSpec CLI ≥ 1.12。
3. **重新安装**（按平台）：
   - atomcode：`/plugin marketplace add <this-repo-url>` → `/plugin install total-design`
   - Claude Code：`claude plugin marketplace add <this-repo-url>` → `claude plugin install total-design`（或 `claude --plugin-dir <this-repo-path>`）
   - Pi Agent：`pi install git:<this-repo-url>`
4. **重新 trust**：**不需要**——本次 hook 命令串未变更（哈希不变），已 trust 的安装继续生效。全新安装按平台执行 `atomcode plugin trust total-design`。
5. **存量脏数据清理**（可选，仅在 audit-history 已膨胀时执行）：
   - 检查膨胀：`wc -l .td-state/audit-history.yaml`——条目数远超真实 audit 次数（正常：约等于历史报告数）即膨胀；
   - 检查 `.incomplete.log`：内容里若含 `System Audit 报告` 或 `主基调对照` 完整标题的报告被列，属误判残留；
   - 处理：删掉 `.td-state/audit-history.yaml` 与 `.td-state/.incomplete.log` 后跑一次 `td-system-audit`，hook 会重建；或保留原文件、下次会话结束时 hook 会自然收敛（幂等，不重追加）。
6. **验证**：
   - 四处清单版本号同为 1.14.1，description 四处逐字一致。
   - hook 入口守卫存在：`grep -n "require.main === module" hooks/td_state_sync.js` 有输出。
   - hook 函数面导出存在：`grep -n "module.exports" hooks/td_state_sync.js` 有输出，含 5 个函数名。
   - 去重键归一化存在：`grep -n "path.basename" hooks/td_state_sync.js` 有输出。
   - marker 剥层级存在：`grep -n "replace(/^#+\\\\s\\*, \"\")" hooks/td_state_sync.js` 有输出。
   - hook 幂等：装完后跑两次 `SessionEnd`（连续启停一次 atomcode session），`.td-state/audit-history.yaml` 二次会话结束后条目数不变。
   - 逻辑名 / 命令名 / 路径 / CLI 命令 / 环境变量不变：`field-assessment` / `/td-propose` / `openspec list` / `$_TD_TIER` 等。

## 完整变更列表

见 [CHANGELOG.md](./CHANGELOG.md) 的 [1.14.1] 条目。
