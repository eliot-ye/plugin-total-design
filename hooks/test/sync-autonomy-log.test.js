#!/usr/bin/env node
/* syncAutonomyLog fixture 比对测试。
 *
 * 以子进程方式调用 hook（注入 {"cwd": <fixture>} stdin，走完整 main() 路径，
 * 与 atomcode SessionEnd 实际调用形态一致），在临时 fixture（真实 git 仓库 +
 * archive 目录 + autonomy-log.yaml 初态）上跑，读回 autonomy-log.yaml 与
 * 手算期望逐字节比对。
 *
 * 运行：node hooks/test/sync-autonomy-log.test.js
 * 零依赖，Node >= 20.19.0（与 hook 一致）。
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawnSync } = require("node:child_process");

const HOOK = path.join(__dirname, "..", "td_state_sync.js");

// hook 补记条目的 summary 固定串（与 td_state_sync.js L319 保持一致）
const SUMMARY = "SessionEnd hook 补记：archive 目录与对应 commit 均成立，状态文件漏写";

// ─── fixture 工具 ───

function mkFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "td-hook-test-"));
  const openspec = path.join(root, "openspec");
  const stateDir = path.join(openspec, ".td-state");
  const archiveDir = path.join(openspec, "changes", "archive");
  fs.mkdirSync(stateDir, { recursive: true });
  fs.mkdirSync(archiveDir, { recursive: true });
  spawnSync("git", ["init", "-q"], { cwd: root });
  spawnSync("git", ["config", "user.name", "Test"], { cwd: root });
  spawnSync("git", ["config", "user.email", "test@test"], { cwd: root });
  return { root, openspec, stateDir, archiveDir };
}

function rmFixture(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

function runHook(root) {
  return spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ cwd: root }),
    encoding: "utf8",
    timeout: 10000,
  });
}

function gitCommit(root, subject, content) {
  const f = path.join(root, "touch.txt");
  fs.appendFileSync(f, (content || subject) + "\n");
  spawnSync("git", ["add", "-A"], { cwd: root });
  spawnSync("git", ["commit", "-q", "-m", subject], { cwd: root });
}

function makeArchiveDir(archiveDir, date, changeName) {
  const d = path.join(archiveDir, `${date}-${changeName}`);
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, "proposal.md"), "# " + changeName);
  return d;
}

function setMtime(p, isoTimestamp) {
  const t = new Date(isoTimestamp);
  fs.utimesSync(p, t, t);
}

// ─── 期望条目构造 ───

function completedEntry(date, name) {
  return (
    `  - timestamp: ${date}T00:00:00\n` +
    `    change: ${name}\n` +
    `    action: completed\n` +
    `    summary: "${SUMMARY}"\n`
  );
}

// ─── 测试框架（极简） ───

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  \u2713 ${name}`);
  } catch (err) {
    failed++;
    console.log(`  \u2717 ${name}`);
    console.log(`    ${err.message}`);
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(
      (msg ? msg + "\n" : "") +
      "--- expected ---\n" + JSON.stringify(expected) +
      "\n--- actual ---\n" + JSON.stringify(actual)
    );
  }
}

function assertNotExists(p, msg) {
  if (fs.existsSync(p)) throw new Error(msg || `${p} should not exist`);
}

// ─── 测试用例 ───

console.log("syncAutonomyLog fixture 比对测试\n");

// 1. 核心补记：双事实满足时追加 completed 条目
test("核心补记：archive 目录 + commit 存在，log 无 completed 条目 → 补记", () => {
  const f = mkFixture();
  try {
    makeArchiveDir(f.archiveDir, "2026-09-20", "add-login");
    gitCommit(f.root, "feat: add-login");
    fs.writeFileSync(path.join(f.stateDir, "autonomy-log.yaml"), "entries:\n");
    runHook(f.root);
    const actual = fs.readFileSync(path.join(f.stateDir, "autonomy-log.yaml"), "utf8");
    assertEqual(actual, "entries:\n" + completedEntry("2026-09-20", "add-login"));
  } finally { rmFixture(f.root); }
});

// 2. 不创建：autonomy-log.yaml 不存在时 hook 不凭空创建
test("不创建：autonomy-log.yaml 不存在时不创建", () => {
  const f = mkFixture();
  try {
    makeArchiveDir(f.archiveDir, "2026-09-20", "add-login");
    gitCommit(f.root, "feat: add-login");
    runHook(f.root);
    assertNotExists(path.join(f.stateDir, "autonomy-log.yaml"),
      "autonomy-log.yaml 不应被创建");
  } finally { rmFixture(f.root); }
});

// 3. 不重复：已有 completed 条目时不重复补记
test("不重复：已有 completed 条目时不重复补记", () => {
  const f = mkFixture();
  try {
    makeArchiveDir(f.archiveDir, "2026-09-20", "add-login");
    gitCommit(f.root, "feat: add-login");
    const initial = "entries:\n" +
      "  - timestamp: 2026-09-19T12:00:00\n" +
      "    change: add-login\n" +
      "    action: completed\n" +
      '    summary: "done"\n';
    fs.writeFileSync(path.join(f.stateDir, "autonomy-log.yaml"), initial);
    runHook(f.root);
    assertEqual(fs.readFileSync(path.join(f.stateDir, "autonomy-log.yaml"), "utf8"), initial);
  } finally { rmFixture(f.root); }
});

// 4a. 双事实缺一：commit 不存在时不补
test("双事实缺一：commit subject 不含 change 名 → 不补", () => {
  const f = mkFixture();
  try {
    makeArchiveDir(f.archiveDir, "2026-09-20", "add-login");
    gitCommit(f.root, "feat: something-else");
    const initial = "entries:\n";
    fs.writeFileSync(path.join(f.stateDir, "autonomy-log.yaml"), initial);
    runHook(f.root);
    assertEqual(fs.readFileSync(path.join(f.stateDir, "autonomy-log.yaml"), "utf8"), initial);
  } finally { rmFixture(f.root); }
});

// 4b. 双事实缺一：archive 目录不存在时不补
test("双事实缺一：archive 目录不存在 → 不补", () => {
  const f = mkFixture();
  try {
    gitCommit(f.root, "feat: add-login");
    const initial = "entries:\n";
    fs.writeFileSync(path.join(f.stateDir, "autonomy-log.yaml"), initial);
    runHook(f.root);
    assertEqual(fs.readFileSync(path.join(f.stateDir, "autonomy-log.yaml"), "utf8"), initial);
  } finally { rmFixture(f.root); }
});

// 5. mtime 防伪：旧 archive 目录 + 旧 commit 满足双事实，但目录 mtime ≤ 回退条目时间 → 不补
test("mtime 防伪：旧 archive mtime ≤ 回退条目 timestamp → 不补", () => {
  const f = mkFixture();
  try {
    const d = makeArchiveDir(f.archiveDir, "2026-09-20", "add-login");
    gitCommit(f.root, "feat: add-login");
    // archive 目录 mtime 设为过去（早于 rolled-back 条目 timestamp）
    setMtime(d, "2026-09-19T00:00:00Z");
    const initial = "entries:\n" +
      "  - timestamp: 2026-09-20T10:00:00\n" +
      "    change: add-login\n" +
      "    action: rolled-back\n" +
      '    reason: test failure\n' +
      '    detail: something\n';
    fs.writeFileSync(path.join(f.stateDir, "autonomy-log.yaml"), initial);
    runHook(f.root);
    assertEqual(fs.readFileSync(path.join(f.stateDir, "autonomy-log.yaml"), "utf8"), initial);
  } finally { rmFixture(f.root); }
});

// 6. 整词边界：短名不误匹配长名 commit subject 子串
test("整词边界：change 名 'add-login' 不误匹配 subject 中的 'add-login-v2'", () => {
  const f = mkFixture();
  try {
    makeArchiveDir(f.archiveDir, "2026-09-20", "add-login");
    // commit subject 含 "add-login-v2"（长名子串），lookahead (?![a-z0-9-]) 应阻断
    gitCommit(f.root, "feat: add-login-v2 redo login");
    const initial = "entries:\n";
    fs.writeFileSync(path.join(f.stateDir, "autonomy-log.yaml"), initial);
    runHook(f.root);
    assertEqual(fs.readFileSync(path.join(f.stateDir, "autonomy-log.yaml"), "utf8"), initial);
  } finally { rmFixture(f.root); }
});

// 7. 回退后收敛：rolled-back 时间旧 + archive 目录 mtime 新 + commit 存在 → 补 completed
test("回退后收敛：rolled-back 条目时间旧 + archive 目录新 + commit 存在 → 补", () => {
  const f = mkFixture();
  try {
    makeArchiveDir(f.archiveDir, "2026-09-20", "add-login");
    gitCommit(f.root, "feat: add-login");
    // rolled-back 条目 timestamp 远在过去；archive 目录 mtime 是刚才创建的（now）→ now > 过去 → 放行
    const initial = "entries:\n" +
      "  - timestamp: 2020-01-01T00:00:00\n" +
      "    change: add-login\n" +
      "    action: rolled-back\n" +
      '    reason: test failure\n' +
      '    detail: something\n';
    fs.writeFileSync(path.join(f.stateDir, "autonomy-log.yaml"), initial);
    runHook(f.root);
    const actual = fs.readFileSync(path.join(f.stateDir, "autonomy-log.yaml"), "utf8");
    assertEqual(actual, initial + completedEntry("2026-09-20", "add-login"));
  } finally { rmFixture(f.root); }
});

// 8. header 补全：log 无 entries 行且不以换行结尾 → 补 \n + entries:
test("header 补全：无 entries 行且无尾换行 → 补 \\n + entries:", () => {
  const f = mkFixture();
  try {
    makeArchiveDir(f.archiveDir, "2026-09-20", "add-login");
    gitCommit(f.root, "feat: add-login");
    const initial = "# autonomy log";
    fs.writeFileSync(path.join(f.stateDir, "autonomy-log.yaml"), initial);
    runHook(f.root);
    const actual = fs.readFileSync(path.join(f.stateDir, "autonomy-log.yaml"), "utf8");
    // content 不以 \n 结尾 → header += "\n"；不含 "entries:" → header += "entries:\n"
    assertEqual(actual, initial + "\nentries:\n" + completedEntry("2026-09-20", "add-login"));
  } finally { rmFixture(f.root); }
});

// 9. 混合多 change：一个已有 completed，一个漏记 → 只补漏记的
test("混合：多 change 中只补漏记的", () => {
  const f = mkFixture();
  try {
    makeArchiveDir(f.archiveDir, "2026-09-20", "add-login");
    gitCommit(f.root, "feat: add-login");
    makeArchiveDir(f.archiveDir, "2026-09-20", "fix-bug");
    gitCommit(f.root, "fix: fix-bug");
    // add-login 已有 completed；fix-bug 漏记
    const initial = "entries:\n" +
      "  - timestamp: 2026-09-19T12:00:00\n" +
      "    change: add-login\n" +
      "    action: completed\n" +
      '    summary: "done"\n';
    fs.writeFileSync(path.join(f.stateDir, "autonomy-log.yaml"), initial);
    runHook(f.root);
    const actual = fs.readFileSync(path.join(f.stateDir, "autonomy-log.yaml"), "utf8");
    assertEqual(actual, initial + completedEntry("2026-09-20", "fix-bug"));
  } finally { rmFixture(f.root); }
});

// 10. 多条条目：同一 change 有 rolled-back + completed，最新为 completed → 不补
test("多条条目：最新为 completed → 不补（即使历史有 rolled-back）", () => {
  const f = mkFixture();
  try {
    makeArchiveDir(f.archiveDir, "2026-09-20", "add-login");
    gitCommit(f.root, "feat: add-login");
    const initial = "entries:\n" +
      "  - timestamp: 2026-09-18T10:00:00\n" +
      "    change: add-login\n" +
      "    action: rolled-back\n" +
      '    reason: test failure\n' +
      '    detail: something\n' +
      "  - timestamp: 2026-09-19T12:00:00\n" +
      "    change: add-login\n" +
      "    action: completed\n" +
      '    summary: "fixed"\n';
    fs.writeFileSync(path.join(f.stateDir, "autonomy-log.yaml"), initial);
    runHook(f.root);
    assertEqual(fs.readFileSync(path.join(f.stateDir, "autonomy-log.yaml"), "utf8"), initial);
  } finally { rmFixture(f.root); }
});

// 11. 非 git 仓库：git 不可用时不崩溃不补
test("非 git 仓库：git 不可用时不崩溃不补", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "td-hook-test-nogit-"));
  const openspec = path.join(root, "openspec");
  const stateDir = path.join(openspec, ".td-state");
  const archiveDir = path.join(openspec, "changes", "archive");
  fs.mkdirSync(stateDir, { recursive: true });
  fs.mkdirSync(archiveDir, { recursive: true });
  try {
    makeArchiveDir(archiveDir, "2026-09-20", "add-login");
    const initial = "entries:\n";
    fs.writeFileSync(path.join(stateDir, "autonomy-log.yaml"), initial);
    runHook(root);
    assertEqual(fs.readFileSync(path.join(stateDir, "autonomy-log.yaml"), "utf8"), initial);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

// ─── 结果 ───
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
