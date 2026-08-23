# archive-counter.yaml 模板

`td-archive` 步骤 5.2 维护的持久化文件。每次 archive 完成后，读 `openspec/.td-state/archive-counter.yaml`，把 `count` +1，写回文件。文件由本步骤首次运行时按需创建。

只管累计 count + 最近一次 archive 标识，时间戳判定统一走 `audit-history.yaml`（见 `td-system-audit` 的 `references/audit-history-template.md`）。

```yaml
count: <累计已 archive 的 change 数>
last_archive_name: <最近 archive 的 change 名>
```
