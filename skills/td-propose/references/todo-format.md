# openspec/todo.md Format Conventions

`openspec/todo.md` is the single file for the project-level backlog (todo pool). All td-* skills read and write this file according to the format defined here.

## File Structure

```markdown
# TODO (Backlog)

Project-level backlog. Each unchecked entry is a candidate for a potential change.

## Todo

- [ ] [P1] Support dark mode
- [ ] [P2] Optimize first-screen loading

## In Progress

- [ ] [P0] Refactor payment module
  - [ ] change: refactor-payments
  - [ ] change: refactor-checkout

## Done

- [x] [P1] Set up CI
  - [x] change: setup-ci
```

## Entry Format

Two-level structure of main entries + change sub-items:

```markdown
- [ ] <priority> <one-sentence outcome>
  - [ ] change: <name>      ← one sub-item per change carried, indented two spaces
```

- **Main entry**: `- [ ] <priority> <one-sentence outcome>`. Priority `[P0]` (critical) / `[P1]` (important) / `[P2]` (general), optional; unlabeled treated as P2. `td-propose` sorts candidates by P0 → P1 → P2 when presenting.
- **Writing constraint**: the main entry must be a **verifiable one-sentence outcome** (e.g. "support dark mode"), not a problem statement or process description (e.g. "optimize performance"). Rewrite accordingly when adding to the pool.
- **Change sub-item**: `  - [ ] change: <name>` (indented two spaces), indicating that this backlog entry is carried by a change. `td-propose` adds one sub-item when creating a change; if sub-items already exist, append — one sub-item per change.

## Rules

- **State semantics**: main entry `- [ ]` = not started or in progress; main entry `- [x]` = done (all change sub-items have been archived). Sub-item `- [ ]` = that change is active; sub-item `- [x]` = that change has been archived.
- **Check-off timing**: only `td-archive` operates after a change is successfully archived — it checks off the corresponding sub-item `[x]`; if **all sub-items** under a main entry are checked off → the main entry is checked off `[x]`; if any sub-item remains unchecked → the main entry stays `- [ ]`. No other skill may check off entries or sub-items.
- **Traceability archive (sub-items retained permanently)**: change sub-items are **not removed** after archival — they serve as the traceability record of "which changes ultimately completed this backlog entry"; the change side does not write a reverse source (keeping it one-directional), so traceability relies on sub-items + git log.
- **Git strategy**: todo.md is a shared source of truth and **must be committed** (not ignored). It is a single file; multi-person collaboration coordinates at **entry granularity** — only one person proposes / checks off the same entry at a time; different entries do not conflict.
- **File does not exist**: treat as empty pool, do not proactively create. Only create when the user explicitly wants to record a backlog (`td-propose` does not create when picking candidates; `td-explore` / `td-system-audit` create when writing to the pool and the user agrees).
- **Sectioning**: `## Todo` / `## In Progress` / `## Done` are advisory organization, non-mandatory — when the file is not sectioned, process by the `- [ ]` / `- [x]` state semantics of main entries / sub-items.
- **Do not delete entries**: completed entries (including sub-items) are retained in the "Done" section as backlog history. Deletion only happens when the user explicitly requests it.
