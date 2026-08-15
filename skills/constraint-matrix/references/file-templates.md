# .td-state/ 文件模板

`openspec/.td-state/` 下各持久化文件的 YAML 模板。文件由各自维护方首次运行时按需创建，不预置。各文件的职责归属见 `constraint-matrix` skill 的「持久化层」节。

## profile-tier.yaml（constraint-matrix 维护）

```yaml
profile: <profile-greenfield | profile-brownfield | profile-maintenance>
tier: <tier-small | tier-medium | tier-large>
judged_at: <ISO8601 时间戳>
judge_reason: <一句话判据，如"已上线 + 有 CI/CD → maintenance；文件 120 个 → large">
```

## archive-counter.yaml（td-archive 维护）

只管累计 count + 最近一次 archive 标识，时间戳判定统一走 `audit-history.yaml`。

```yaml
count: <累计已 archive 的 change 数>
last_archive_name: <最近 archive 的 change 名>
```

## audit-history.yaml（td-system-audit 维护）

```yaml
audits:
  - timestamp: <ISO8601>
    scope: <current-change | project>
    report: <audits/ 下的报告文件名>
    severe_count: <严重问题数>
    next_due: <下次 project-scope audit 的 ISO8601 截止时间，仅 tier-large project scope 需要算"一周后">
```
