# Purpose TBD Housekeeping

`td-archive` 步骤 4 的降级子流程（OpenSpec CLI < v1.11 时使用；≥ v1.11 由 `openspec validate --specs` 直接检出，语义以 `td-archive` 步骤 4 为准）：主 spec `## Purpose` 节会残留模板默认值 `TBD - created by archiving change <name>. Update Purpose after archive.`，不能让它留到下一次 audit。

## 触发时机

sync 完成（`openspec archive` 执行完毕）后立即执行，不推迟到下一次 audit。

## 步骤

1. 读本次 archive 涉及的所有主 spec（即 change 的 `specs/` delta 覆盖的那些 `openspec/specs/<capability>/spec.md`）。
2. 对每个主 spec，检查 `## Purpose` 节是否仍为 `TBD` 模板默认值（grep `^TBD - created by archiving` 即可命中）。
3. 命中 → **本步骤内补写**：基于已归档 change 的 proposal「What Changes」节，为每个 TBD 主 spec 写一句话 Purpose（描述该 capability 是什么、解决什么问题）。补写后再次 grep 确认无 TBD 残留。
4. 全部主 spec 的 Purpose 都已非 TBD → 跳过，不打扰用户。

## 定位

这是 housekeeping，不是核心归档动作——但放任 TBD 残留会让后续 `/td-system-audit` 反复报告同一问题。本检查确保"归档即闭环"。
