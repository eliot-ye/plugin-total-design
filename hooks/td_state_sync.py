#!/usr/bin/env python3
"""td_state_sync.py — SessionEnd hook：从文件系统事实校正 .td-state 状态文件。

职责（只增补校正，不删除、不覆盖用户已有数据）：
1. archive-counter.yaml：count = openspec/changes/archive/ 下已归档 change 目录数，
   last_archive_name = 按 mtime 最新的归档 change 名。与文件不一致时以文件系统事实为准。
2. audit-history.yaml：为 openspec/.td-state/audits/*.md 中缺失的记录补条，
   保留已有记录的 next_due / severe_count。

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
MINIMAL_MARKERS = ("## System Audit", "### 主基调对照")


def is_complete_report(path):
    """报告含 MINIMAL_MARKERS 之一才视为完整。"""
    try:
        with open(path, encoding="utf-8") as f:
            content = f.read()
        return any(marker in content for marker in MINIMAL_MARKERS)
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
    if not missing:
        return

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

    # 不完整报告的兜底：把它们的名字写到 audits/.incomplete.log，
    # 下次 /td-system-audit project scope 时由 agent 主动检查并决定是补写还是删除。
    incomplete = [
        r for r in reports
        if r not in known and not is_complete_report(os.path.join(audits_dir, r))
    ]
    if incomplete:
        incomplete_log = os.path.join(audits_dir, ".incomplete.log")
        with open(incomplete_log, "a", encoding="utf-8") as f:
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
