# archive-counter.yaml template

The persistent file maintained by `td-archive` Step 5.2. After each archive completes, read `openspec/.td-state/archive-counter.yaml`, increment `count` by 1, and write back. The file is created on-demand by this step on first run.

It only tracks the cumulative count + the last archive identifier; timestamp determination is uniformly handled via `audit-history.yaml` (see `td-system-audit`'s `references/audit-history-template.md`).

```yaml
count: <cumulative number of archived changes>
last_archive_name: <name of the most recently archived change>
```
