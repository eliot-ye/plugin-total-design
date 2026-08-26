# Architecture Review Checklist (after proposal, before apply)

The review target is the proposal's subsystem splitting and design decisions, not code. This is when changing the architecture costs the least.

## High Cohesion

- Does each subsystem have a single responsibility (one subsystem does one thing)
- Is each subsystem self-contained (clear data ownership)
- Are responsibilities duplicated (two subsystems doing the same thing → merge signal)

## Low Coupling

- Are inter-subsystem interfaces minimized (only expose necessary contracts, internal implementation doesn't leak)
- Are there circular dependencies (A ↔ B)
- Are there implicit dependencies (shared database, shared config, temporal coupling)
- Does a single change pull in too many subsystems (over-coupling signal)

## Severity and Blocking

Shares severity definitions with code review (see `requesting-code-review` skill section 2):

- **critical**: bad subsystem splitting / circular dependencies / implicit dependencies—**blocks apply**, go back to propose to modify the proposal before continuing
- **warning**: oversized interfaces, scattered responsibilities—record to the proposal, can defer
- **nit**: naming etc.—can ignore

The critical of architecture review and the critical of code review both follow the "don't continue" rule—except here "don't continue" means don't enter task implementation.
