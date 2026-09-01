#!/usr/bin/env python3
"""td_state_sync.py — SessionEnd hook：从文件系统事实校正 .td-state 状态文件。

职责（只增补校正，不删除、不覆盖用户已有数据）：
1. archive-counter.yaml：count = openspec/changes/archive/ 下已归档 change 目录数，
   last_archive_name = 按 mtime 最新的归档 change 名。与文件不一致时以文件系统事实为准。
2. audit-history.yaml：为 openspec/.td-state/audits/*.md 中缺失的记录补条，
   保留已有记录的 next_due / severe_count。
3. audits/.incomplete.log：按当前不完整报告集合整文件重写（"w" 模式）——
   它是 hook 自身派生的现状快照而非用户数据，重写即校正：自动去重、
   已解决项退出、已删除报告消失。

会话结束时由 atomcode 以 SessionEnd 事件调用。任何失败静默退出，不影响会话。
"""

import json
import os
import re
import sys
from datetime import datetime

REPORT_NAME_RE = re.compile(r"(\d{8}-\d{6})-([a-z-]+)\.md$")

# 报告内容完整性校验：audit 报告至少含下列 marker 之一，
# 才会被 sync_audit_history 补 audit-history.yaml 记录。
# 这是防止"空报告 / 不完整报告被固化"的边界。
#
# marker 不硬编码标题字符串，而是从 audit 报告模板（插件安装副本里的
# skills/td-system-audit/references/audit-report-template.md）动态读取标题行：
# 模板标题改动时 hook 自动跟随，避免"模板与 hook 两处维护同一字符串"导致
# 改模板后 hook 静默失效（单一事实源，耦合方向 = 模板 → hook）。
# 模板读取失败时回退到内置默认值，hook 永不因模板问题崩溃。
HEADING_RE = re.compile(r"^#{2,3} ")
FALLBACK_MARKERS = ("## System Audit", "### 主基调对照")


def _load_report_markers():
    """从 audit 报告模板的「报告模板」代码块内读取标题行作为完整性 marker。

    只收集代码块（```markdown ... ```）内的二/三级标题——那是报告落盘时实际
    输出的标题，检查清单节的标题不属于报告内容，不收。
    优先从插件安装目录（ATOMCODE_PLUGIN_ROOT / CLAUDE_PLUGIN_ROOT 环境变量）
    读取；环境变量缺失、模板不可读或代码块内无标题时回退 FALLBACK_MARKERS。
    """
    root = os.environ.get("ATOMCODE_PLUGIN_ROOT") or os.environ.get("CLAUDE_PLUGIN_ROOT")
    if root:
        template = os.path.join(
            root, "skills", "td-system-audit", "references", "audit-report-template.md"
        )
        try:
            with open(template, encoding="utf-8") as f:
                lines = f.readlines()
        except OSError:
            pass
        else:
            in_block = False
            markers = []
            for line in lines:
                s = line.strip()
                if s.startswith("```"):
                    in_block = not in_block
                    continue
                if in_block and HEADING_RE.match(s):
                    markers.append(s)
            if markers:
                return tuple(markers)
    return FALLBACK_MARKERS


def is_complete_report(path):
    """报告含模板标题 marker 之一才视为完整。"""
    markers = _load_report_markers()
    try:
        with open(path, encoding="utf-8") as f:
            content = f.read()
        return any(marker in content for marker in markers)
    except OSError:
        return False


def find_project_root(cwd):
    """从 cwd 向上找含 openspec/ 目录的项目根。"""
    d = os.path.abspath(cwd)
    while True:
        if os.path.isdir(os.path.join(d, "openspec")):
            return d
        parent = os.path.dirname(d)
        if parent == d:
            return None
        d = parent


def sync_archive_counter(state_dir, openspec_dir):
    """count = archive/ 目录 change 数；last_archive_name = mtime 最新者。"""
    archive_dir = os.path.join(openspec_dir, "changes", "archive")
    counter_path = os.path.join(state_dir, "archive-counter.yaml")

    count = 0
    last_name = None
    if os.path.isdir(archive_dir):
        entries = [
            e
            for e in os.listdir(archive_dir)
            if os.path.isdir(os.path.join(archive_dir, e))
        ]
        count = len(entries)
        if entries:
            last_name = max(
                entries, key=lambda e: os.path.getmtime(os.path.join(archive_dir, e))
            )

    cur_count, cur_last = None, None
    if os.path.exists(counter_path):
        with open(counter_path, encoding="utf-8") as f:
            for line in f:
                m = re.match(r"\s*count:\s*(\d+)", line)
                if m:
                    cur_count = int(m.group(1))
                m = re.match(r"\s*last_archive_name:\s*(.*)", line)
                if m:
                    cur_last = m.group(1).strip()

    if cur_count == count and cur_last == (last_name or ""):
        return  # 已一致，不动

    os.makedirs(state_dir, exist_ok=True)
    with open(counter_path, "w", encoding="utf-8") as f:
        f.write("count: %d\n" % count)
        f.write("last_archive_name: %s\n" % (last_name or ""))


def count_severe(path):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read().count("**[严重]**")
    except OSError:
        return 0


def sync_audit_history(state_dir):
    """为 audits/*.md 补缺失的 audit-history.yaml 记录，只追加不修改已有记录。"""
    audits_dir = os.path.join(state_dir, "audits")
    history_path = os.path.join(state_dir, "audit-history.yaml")
    if not os.path.isdir(audits_dir):
        return

    reports = sorted(f for f in os.listdir(audits_dir) if f.endswith(".md"))
    if not reports:
        return

    known = set()
    if os.path.exists(history_path):
        with open(history_path, encoding="utf-8") as f:
            for line in f:
                m = re.match(r"\s*report:\s*(.+)", line)
                if m:
                    known.add(m.group(1).strip())

    missing = [
        r for r in reports
        if r not in known and is_complete_report(os.path.join(audits_dir, r))
    ]
    incomplete = [
        r for r in reports
        if r not in known and not is_complete_report(os.path.join(audits_dir, r))
    ]
    incomplete_log = os.path.join(audits_dir, ".incomplete.log")
    if not missing and not incomplete and not os.path.exists(incomplete_log):
        return  # 无待补条、清单为空且无需清空——无工作可做

    if missing:
        os.makedirs(state_dir, exist_ok=True)
        with open(history_path, "a", encoding="utf-8") as f:
            if os.path.exists(history_path) and os.path.getsize(history_path) > 0:
                # 已有内容：确保文件以换行结尾再追加列表项
                with open(history_path, "r", encoding="utf-8") as rf:
                    content = rf.read()
                if not content.endswith("\n"):
                    f.write("\n")
                if "audits:" not in content:
                    f.write("audits:\n")
            else:
                f.write("audits:\n")
            for report in missing:
                ts, scope = None, "current-change"
                m = REPORT_NAME_RE.match(report)
                if m:
                    scope = m.group(2)
                    try:
                        ts = datetime.strptime(m.group(1), "%Y%m%d-%H%M%S").isoformat()
                    except ValueError:
                        ts = None
                f.write("  - timestamp: %s\n" % (ts or "unknown"))
                f.write("    scope: %s\n" % scope)
                f.write("    report: %s\n" % report)
                f.write("    severe_count: %d\n" % count_severe(os.path.join(audits_dir, report)))

    # 不完整报告的兜底：以当前计算的 incomplete 集合整文件重写 audits/.incomplete.log，
    # 清单是"现状快照"——去重（每次重算）、已进 audit-history 的自动退出、
    # 磁盘上已删除的报告自动消失。消费方是 td-system-audit 步骤 2 的
    # "不完整报告兜底"（project scope），由 agent 读取清单后请用户决定补写还是删除。
    if incomplete or os.path.exists(incomplete_log):
        with open(incomplete_log, "w", encoding="utf-8") as f:
            for r in incomplete:
                f.write("%s\n" % r)


def main():
    cwd = os.getcwd()
    try:
        payload = json.load(sys.stdin)
        if isinstance(payload, dict) and payload.get("cwd"):
            cwd = payload["cwd"]
    except Exception:
        pass  # 无 stdin JSON 或不可解析，用当前工作目录

    root = find_project_root(cwd)
    if not root:
        return  # 无 openspec/，本 plugin 不适用，静默退出

    state_dir = os.path.join(root, "openspec", ".td-state")
    openspec_dir = os.path.join(root, "openspec")
    os.makedirs(state_dir, exist_ok=True)
    try:
        sync_archive_counter(state_dir, openspec_dir)
    except OSError:
        pass
    try:
        sync_audit_history(state_dir)
    except OSError:
        pass


if __name__ == "__main__":
    main()
