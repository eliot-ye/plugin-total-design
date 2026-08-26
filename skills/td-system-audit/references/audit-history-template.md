# audit-history.yaml 模板

`td-system-audit` 维护的持久化文件。每次 audit 落盘后，同步更新 `openspec/.td-state/audit-history.yaml`：追加一条本次 audit 的记录。文件由本步骤首次运行时按需创建。

```yaml
audits:
  - timestamp: <ISO8601>
    scope: <current-change | project>
    report: <audits/ 下的报告文件名>
    severe_count: <严重问题数>
    next_due: <下次 project-scope audit 的 ISO8601 截止时间，仅 tier-large project scope 需要算"一周后">
```
