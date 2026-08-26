# Audit Frequency (Table 3, single source of truth)

This file is the single source of truth for system-audit frequency. `td-system-audit` / `executing-plans` / the 3 tier skills reference this file.

## Table 3: system-audit frequency

| tier | project scope | current-change scope |
|---|---|---|
| `tier-small` | every 5 changes completed | not required |
| `tier-medium` | every 3 changes completed | at each critical chain task completion |
| `tier-large` | once per week | every 1 change completed |

**Frequency under subsystem independent tiering**: When the system has subsystems that are independently tiered, the project scope audit frequency follows the "highest-tier subsystem" (conservative principle), and the current-change scope audit frequency follows the "highest tier among subsystems spanned by the current change."

### Triggering skill ownership for current-change scope

The triggering skill for current-change audit is divided by tier:

| tier | triggering skill | trigger point |
|---|---|---|
| `tier-small` | not required | — |
| `tier-medium` | `executing-plans` step 3 | at each critical chain task completion |
| `tier-large` | `td-apply` step 7.3 | every 1 change completed |

project scope audit triggering is uniformly driven by `td-archive` step 5.2 (suggested when the archive counter reaches its threshold).
