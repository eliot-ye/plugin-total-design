# audit-history.yaml Template

The persistent file maintained by `td-system-audit`. After each audit is persisted to disk, `openspec/.td-state/audit-history.yaml` is synchronously updated: append a record for this audit. The file is created on demand on first run of this step.

```yaml
audits:
  - timestamp: <ISO8601>
    scope: <current-change | project>
    report: <report filename under audits/>
    severe_count: <number of severe issues>
    next_due: <ISO8601 deadline for the next project-scope audit; only tier-large project scope needs to compute "one week later">
```
