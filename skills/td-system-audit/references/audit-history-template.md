# audit-history.yaml 模板

`td-system-audit` 维护的持久化文件。每次 audit 落盘后，同步更新 `openspec/.td-state/audit-history.yaml`：追加一条本次 audit 的记录。文件由本步骤首次运行时按需创建。

```yaml
audits:
  - timestamp: <ISO8601 且必须带时区偏移，如 2026-09-05T17:00:43+08:00；禁裸本地时间>
    scope: <current-change | project>
    report: <audits/ 下的报告文件名，必须带 audits/ 前缀，如 audits/20260905-170043-project.md>
    severe_count: <严重问题数>
    next_due: <下次 project-scope audit 的 ISO8601 截止时间（同样带时区偏移），仅 tier-large project scope 需要算"一周后">
```

格式约定（写入方必须遵守，与 hook 补记格式统一）：

- `timestamp` 一律带时区偏移后缀——裸本地时间无法跨时区排序与去重。
- `report` 一律带 `audits/` 前缀——与文件系统实际路径一致，消费方可直接定位。
- 追加前先按 `report` 判重，同一报告已有记录不得重复追加。
