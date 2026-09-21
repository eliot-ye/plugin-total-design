# archive-counter.yaml 模板

`td-archive` 步骤 5.2 维护的持久化文件——计数器语义、判定规则与"按需创建"均以 `td-archive` 步骤 5.2 为准，本文件只定义格式：

只管累计 count + 最近一次 archive 标识，时间戳判定统一走 `audit-history.yaml`（见 `td-system-audit` 的 `references/audit-history-template.md`）。

```yaml
count: <累计已 archive 的 change 数>
last_archive_name: <最近 archive 的 change 名>
```
