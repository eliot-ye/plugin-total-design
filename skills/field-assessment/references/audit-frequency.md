# audit 频率（表 3，单一事实源）

本文件是 system-audit 频率的唯一事实源。`td-system-audit` / `executing-plans` / 3 个 tier skill 引用本文件。

## 表 3：system-audit 频率

| tier | project scope | current-change scope |
|---|---|---|
| `tier-small` | 每完成 5 个 change | 不要求 |
| `tier-medium` | 每完成 3 个 change | 每个关键链任务完成时 |
| `tier-large` | 每周一次 | 每完成 1 个 change |

**子系统独立定 tier 时的频率**：当系统内部有子系统独立定 tier 时，project scope audit 频率按"最高 tier 子系统"处理（保守原则），current-change scope audit 频率按"当前 change 所跨子系统中最高 tier"处理。

### current-change scope 的触发 skill 归属

current-change audit 的触发 skill 按 tier 分工：

| tier | 触发 skill | 触发位置 |
|---|---|---|
| `tier-small` | 不要求 | — |
| `tier-medium` | `executing-plans` 步骤 3 | 每个关键链任务完成时 |
| `tier-large` | `td-apply` 步骤 7.3 | 每完成 1 个 change |

project scope audit 的触发统一由 `td-archive` 步骤 5.2 驱动（archive 计数器达阈值即建议）。
