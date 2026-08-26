---
name: td-list
description: List all unarchived changes. Trigger scenarios: user says "list changes", "what's in flight", "unarchived", "what's currently being worked on".
argument-hint: (no arguments)
args: none
---

# td-list

List all currently unarchived (active) changes.

## Steps

### 1. List unarchived changes

```bash
openspec list
```

`openspec list` only lists active changes under `openspec/changes/`; archived ones (moved to `openspec/changes/archive/`) do not appear—this is the semantic boundary of "unarchived".

### 2. Output the status overview

Present the list results to the user in roughly this structure:

```markdown
## Unarchived changes (active changes)

| change | tasks status | last updated |
|---|---|---|
| <name> | <done>/<total> or "No tasks" | <relative time> |
```

If the `openspec list` output is empty (no active changes), note "there are currently no unarchived changes" and suggest the next step: `/td-propose` to open a new change, or `/td-system-audit project` to run a project-wide self-check.

## Guardrails

- This command is read-only—it does not create, modify, or archive any change
- It does not assess change quality (that is `/td-system-audit`'s job); it only lists the status overview
