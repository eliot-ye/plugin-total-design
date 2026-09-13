#!/usr/bin/env node
/* td_state_sync.js — SessionEnd hook：从文件系统事实校正 .td-state 状态文件。
 *
 * 职责（只增补校正，不删除、不覆盖用户已有数据）：
 * 1. archive-counter.yaml：count = openspec/changes/archive/ 下已归档 change 目录数，
 *    last_archive_name = 按 mtime 最新的归档 change 名。与文件不一致时以文件系统事实为准。
 * 2. audit-history.yaml：为 openspec/.td-state/audits/*.md 中缺失的记录补条，
 *    保留已有记录的 next_due / severe_count。
 * 3. audits/.incomplete.log：按当前不完整报告集合整文件重写——
 *    它是 hook 自身派生的现状快照而非用户数据，重写即校正：自动去重、
 *    已解决项退出、已删除报告消失。
 * 4. autonomy-log.yaml：补漏记的 completed 条目（仅当该文件已存在——
 *    文件不存在 = 项目从未做过 autonomous 批量执行，hook 不凭空创建）。
 *    补记条件 = 两个文件系统事实同时成立：archive/YYYY-MM-DD-<change>/
 *    目录存在，且对应 commit 存在（git log --all 的 subject 含 <change>）。
 *    按"同一 change 最新条目"判定：已是 completed 不重复补；最新为
 *    rolled-back 的 change 其目录会被 td-archive 的归档 gate 挡住而不存在，
 *    不会被补——用户确认处理并归档后，目录出现，补记即日志收敛。
 *
 * 会话结束时由 atomcode 以 SessionEnd 事件调用。任何失败静默退出，不影响会话。
 * 运行时：Node >= 20.19.0（与 OpenSpec CLI 的 Node 要求一致，本 plugin 无独立 Node 下限）。
 * 实现：CJS + node: 内置模块，零依赖、零构建、无 package.json——`node <file>` 直接可跑。
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const REPORT_NAME_RE = /^(\d{8}-\d{6})-([a-z-]+)\.md$/;

// 报告内容完整性校验：audit 报告至少含下列 marker 之一，
// 才会被 syncAuditHistory 补 audit-history.yaml 记录。
// 这是防止"空报告 / 不完整报告被固化"的边界。
//
// marker 不硬编码标题字符串，而是从 audit 报告模板（插件安装副本里的
// skills/td-system-audit/references/audit-report-template.md）动态读取标题行：
// 模板标题改动时 hook 自动跟随，避免"模板与 hook 两处维护同一字符串"导致
// 改模板后 hook 静默失效（单一事实源，耦合方向 = 模板 → hook）。
// 模板读取失败时回退到内置默认值，hook 永不因模板问题崩溃。
const HEADING_RE = /^#{2,3} /;
const FALLBACK_MARKERS = ["## System Audit", "### 主基调对照"];


function loadReportMarkers() {
  /* 从 audit 报告模板的「报告模板」代码块内读取标题行作为完整性 marker。
   *
   * 只收集代码块（```markdown ... ```）内的二/三级标题——那是报告落盘时实际
   * 输出的标题，检查清单节的标题不属于报告内容，不收。
   * 优先从插件安装目录（ATOMCODE_PLUGIN_ROOT / CLAUDE_PLUGIN_ROOT 环境变量）
   * 读取；环境变量缺失、模板不可读或代码块内无标题时回退 FALLBACK_MARKERS。
   */
  const root = process.env.ATOMCODE_PLUGIN_ROOT || process.env.CLAUDE_PLUGIN_ROOT;
  if (root) {
    const template = path.join(
      root, "skills", "td-system-audit", "references", "audit-report-template.md"
    );
    let lines;
    try {
      lines = fs.readFileSync(template, "utf8").split("\n");
    } catch (err) {
      // 模板不可读：落到 FALLBACK_MARKERS
    }
    if (lines) {
      let inBlock = false;
      const markers = [];
      for (const line of lines) {
        const s = line.trim();
        if (s.startsWith("```")) {
          inBlock = !inBlock;
          continue;
        }
        if (inBlock && HEADING_RE.test(s)) markers.push(s);
      }
      if (markers.length) return markers;
    }
  }
  return FALLBACK_MARKERS;
}

function isCompleteReport(ri) {
  /* 报告含模板标题 marker 之一才视为完整。 */
  const markers = loadReportMarkers();
  let content;
  try {
    content = fs.readFileSync(ri, "utf8");
  } catch (err) {
    return false;
  }
  return markers.some((marker) => content.includes(marker));
}

function findProjectRoot(cwd) {
  /* 从 cwd 向上找含 openspec/ 目录的项目根。 */
  let d = path.resolve(cwd);
  // fs.existsSync 对根目录返回 false，父目录取空串——与"向上到顶"对齐
  while (d) {
    if (fs.existsSync(path.join(d, "openspec")) && fs.statSync(path.join(d, "openspec")).isDirectory()) {
      return d;
    }
    const parent = path.dirname(d);
    if (parent === d) return null;
    d = parent;
  }
  return null;
}

function syncArchiveCounter(stateDir, openspecDir) {
  /* count = archive/ 目录 change 数；last_archive_name = mtime 最新者。 */
  const archiveDir = path.join(openspecDir, "changes", "archive");
  const counterPath = path.join(stateDir, "archive-counter.yaml");

  let count = 0;
  let lastName = null;
  if (fs.existsSync(archiveDir) && fs.statSync(archiveDir).isDirectory()) {
    const entries = fs
      .readdirSync(archiveDir)
      .filter((e) => fs.statSync(path.join(archiveDir, e)).isDirectory());
    count = entries.length;
    if (entries.length) {
      lastName = entries.reduce((latest, e) => {
        const latestMtime = fs.statSync(path.join(archiveDir, latest)).mtimeMs;
        return fs.statSync(path.join(archiveDir, e)).mtimeMs > latestMtime ? e : latest;
      });
    }
  }

  let curCount = null;
  let curLast = null;
  try {
    const content = fs.readFileSync(counterPath, "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^\s*count:\s*(\d+)/);
      if (m) curCount = Number(m[1]);
      const m2 = line.match(/^\s*last_archive_name:\s*(.*)/);
      if (m2) curLast = m2[1].trim();
    }
  } catch (err) {
    // 文件不存在：curCount/curLast 保持 null，视为待写
  }

  if (curCount === count && curLast === (lastName === null ? "" : lastName)) {
    return; // 已一致，不动
  }

  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    counterPath,
    `count: ${count}\nlast_archive_name: ${lastName === null ? "" : lastName}\n`,
    "utf8"
  );
}

function countSevere(ri) {
  try {
    return fs.readFileSync(ri, "utf8").split("**[严重]**").length - 1;
  } catch (err) {
    return 0;
  }
}

function syncAuditHistory(stateDir) {
  /* 为 audits/*.md 补缺失的 audit-history.yaml 记录，只追加不修改已有记录。 */
  const auditsDir = path.join(stateDir, "audits");
  const historyPath = path.join(stateDir, "audit-history.yaml");
  if (!fs.existsSync(auditsDir) || !fs.statSync(auditsDir).isDirectory()) {
    return;
  }

  const reports = fs
    .readdirSync(auditsDir)
    .filter((f) => f.endsWith(".md"))
    .sort();
  if (!reports.length) return;

  const known = new Set();
  try {
    for (const line of fs.readFileSync(historyPath, "utf8").split("\n")) {
      const m = line.match(/^\s*report:\s*(.*)/);
      if (m) known.add(m[1].trim());
    }
  } catch (err) {
    // 历史文件不存在：known 保持空集
  }

  const missing = reports.filter(
    (r) => !known.has(r) && isCompleteReport(path.join(auditsDir, r))
  );
  const incomplete = reports.filter(
    (r) => !known.has(r) && !isCompleteReport(path.join(auditsDir, r))
  );
  const incompleteLog = path.join(auditsDir, ".incomplete.log");
  if (!missing.length && !incomplete.length && !fs.existsSync(incompleteLog)) {
    return; // 无待补条、清单为空且无需清空——无工作可做
  }

  if (missing.length) {
    fs.mkdirSync(stateDir, { recursive: true });
    let header = "";
    if (fs.existsSync(historyPath) && fs.statSync(historyPath).size > 0) {
      // 已有内容：确保文件以换行结尾再追加列表项
      const content = fs.readFileSync(historyPath, "utf8");
      if (!content.endsWith("\n")) header += "\n";
      if (!content.includes("audits:")) header += "audits:\n";
    } else {
      header = "audits:\n";
    }
    const block = missing.map((report) => {
      let ts = "unknown";
      let scope = "current-change";
      const m = REPORT_NAME_RE.exec(report);
      if (m) {
        scope = m[2];
        // 本地时间 naive 字符串：不带时区后缀（Python isoformat() 语义），
        // toISOString() 会给 UTC 并加 Z，会改变历史文件的既有格式
        const parts = m[1].match(/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/);
        if (parts) {
          const [, y, mo, d, h, mi, s] = parts;
          ts = `${y}-${mo}-${d}T${h}:${mi}:${s}`;
        }
      }
      return `  - timestamp: ${ts}\n    scope: ${scope}\n    report: ${report}\n    severe_count: ${countSevere(path.join(auditsDir, report))}\n`;
    }).join("");
    fs.appendFileSync(historyPath, header + block, "utf8");
  }

  // 不完整报告的兜底：以当前计算的 incomplete 集合整文件重写 audits/.incomplete.log，
  // 清单是"现状快照"——去重（每次重算）、已进 audit-history 的自动退出、
  // 磁盘上已删除的报告自动消失。消费方是 td-system-audit 步骤 2 的
  // "不完整报告兜底"（project scope），由 agent 读取清单后请用户决定补写还是删除。
  if (incomplete.length || fs.existsSync(incompleteLog)) {
    fs.writeFileSync(incompleteLog, incomplete.join("\n") + (incomplete.length ? "\n" : ""), "utf8");
  }
}

function syncAutonomyLog(stateDir, openspecDir) {
  /* 为 autonomy-log.yaml 补漏记的 completed 条目（见文件头职责 4）。
   * 保守口径：autonomy-log.yaml 不存在 → 直接返回，不创建。
   * 只追加不删改既有条目（append-only，与 autonomy-template.md 的读写规则一致）。
   */
  const logPath = path.join(stateDir, "autonomy-log.yaml");
  if (!fs.existsSync(logPath)) return;
  const archiveDir = path.join(openspecDir, "changes", "archive");
  if (!fs.existsSync(archiveDir) || !fs.statSync(archiveDir).isDirectory()) return;

  // 每个 change 的最新条目 action 与 timestamp——change: 行设定当前 change，
  // 其前的 timestamp: / 其后的 action: 行归属它；后出现的条目覆盖先出现的 = 最新为准
  const latestAction = new Map();
  const latestTs = new Map();
  let currentChange = null;
  let currentTs = null;
  for (const line of fs.readFileSync(logPath, "utf8").split("\n")) {
    // timestamp 是列表项首个键，行首带 "- " 前缀（如 "  - timestamp: ..."）
    const mt = line.match(/^\s*-?\s*timestamp:\s*(.*)/);
    if (mt) {
      currentTs = mt[1].trim();
      continue;
    }
    const mc = line.match(/^\s*change:\s*(.*)/);
    if (mc) {
      currentChange = mc[1].trim();
      continue;
    }
    const ma = line.match(/^\s*action:\s*(\S+)/);
    if (ma && currentChange) {
      latestAction.set(currentChange, ma[1]);
      latestTs.set(currentChange, currentTs);
    }
  }
  const alreadyCompleted = new Set(
    [...latestAction.entries()].filter(([, a]) => a === "completed").map(([c]) => c)
  );

  // 事实 2：对应 commit 存在——git log --all 的 subject 含 change 名。
  // 非 git 仓库 / git 不可用 → 事实不可验证，不补（hook 永不因环境问题崩溃）。
  let subjects;
  try {
    subjects = execFileSync("git", ["log", "--all", "--pretty=%s"], {
      cwd: openspecDir,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (err) {
    return;
  }

  // 事实 1：archive/YYYY-MM-DD-<change>/ 目录存在。
  const dirs = fs
    .readdirSync(archiveDir)
    .filter((e) => /^\d{4}-\d{2}-\d{2}-.+/.test(e))
    .filter((e) => fs.statSync(path.join(archiveDir, e)).isDirectory());

  const missing = dirs.filter((full) => {
    const name = full.replace(/^\d{4}-\d{2}-\d{2}-/, "");
    if (alreadyCompleted.has(name)) return false;
    // 目录必须比该 change 的最新条目新——同名 re-propose 后回退时，旧周期的
    // archive 目录与旧 commit 仍满足双事实，不校验时间会把回退 change 伪造成已完成
    const ts = latestTs.get(name);
    if (ts) {
      const t = Date.parse(ts);
      if (!Number.isNaN(t) && fs.statSync(path.join(archiveDir, full)).mtimeMs <= t) return false;
    }
    // change 名按整词匹配（前后不能是字母数字或连字符），防短名误匹配长名子串
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nameRe = new RegExp(`(?<![a-z0-9-])${escaped}(?![a-z0-9-])`);
    return nameRe.test(subjects);
  });
  if (!missing.length) return;

  let header = "";
  const content = fs.readFileSync(logPath, "utf8");
  if (!content.endsWith("\n")) header += "\n";
  if (!content.includes("entries:")) header += "entries:\n";
  const block = missing.map((full) => {
    // 归档日期取自目录名前缀（文件系统事实）；具体时刻不可考，取当日零点
    const date = full.slice(0, 10);
    const name = full.replace(/^\d{4}-\d{2}-\d{2}-/, "");
    return `  - timestamp: ${date}T00:00:00\n    change: ${name}\n    action: completed\n    summary: "SessionEnd hook 补记：archive 目录与对应 commit 均成立，状态文件漏写"\n`;
  }).join("");
  fs.appendFileSync(logPath, header + block, "utf8");
}

function main() {
  let cwd = process.cwd();
  try {
    const payload = JSON.parse(fs.readFileSync(0, "utf8"));
    if (payload && typeof payload === "object" && payload.cwd) cwd = payload.cwd;
  } catch (err) {
    // 无 stdin JSON 或不可解析，用当前工作目录
  }

  const root = findProjectRoot(cwd);
  if (!root) return; // 无 openspec/，本 plugin 不适用，静默退出

  const stateDir = path.join(root, "openspec", ".td-state");
  const openspecDir = path.join(root, "openspec");
  fs.mkdirSync(stateDir, { recursive: true });
  try {
    syncArchiveCounter(stateDir, openspecDir);
  } catch (err) {
    // 文件系统失败不影响会话
  }
  try {
    syncAuditHistory(stateDir);
  } catch (err) {
    // 文件系统失败不影响会话
  }
  try {
    syncAutonomyLog(stateDir, openspecDir);
  } catch (err) {
    // 文件系统失败不影响会话
  }
}

main();
