---
name: tier-large
description: Large system complexity tier. 100+ files / multi-team / multi-repo. constraints are enforced, system-audit is periodic, general design document required.
user-invocable: false
---

# Tier: Large (large system)

## Assessment Basis

See the "### 3. Assess tier" section of the `field-assessment` identification flow for criteria (take the highest when any holds).

- System hierarchy: multi-level nested subsystems, possibly with cross-repo dependencies

## system-audit frequency

See Table 3's tier-large row (current-change: every 1 change completed; project: once per week; Table 3 is in `field-assessment/references/audit-frequency.md`).

## Special Rules

### 1. General design document is mandatory

For every change in a large system, the proposal must include a "general design document":

- The position of this change within the system hierarchy
- All subsystems affected
- The relationship with recently archived changes
- Whether cross-subsystem coordination is triggered

Without this document, `/td-apply` is not allowed.

**Execution-layer validation is the responsibility of `td-propose` step 6.c and `td-apply` step 2**:

- `td-propose` step 6.c's "required field check" should include "general design document is mandatory for tier-large"—missing document → go back to 6.b to write it, cannot proceed to 6.d.
- `td-apply` step 2's "pre-check" should include "general design document is mandatory for tier-large"—missing document → blocks apply, prompts user to go back to `/td-propose` to add the document.

This skill only declares the "general design document is mandatory" rule; execution-layer validation is the responsibility of td-propose / td-apply, avoiding duplication of validation logic in this skill.

### 2. WIP limit

Parallel work in a large system almost certainly creates dyscoordination if forced. The maximum number of active changes allowed at any given time is taken from the wip-limit row of Table 1 (Table 1 is in `field-assessment/references/strength-matrix.md`).

If the user insists on parallelism, execute `wip-limit`'s "hard constraint + override mechanism"—the override circuit orchestration is held solely by `wip-limit` (brooks-law reminder → critical-buffer assessment → human-in-loop type 6 confirmation → record), and is not repeated in simplified form here.

### 3. Critical chain buffer

Uncertainty is highest in large systems—integration issues, cross-team coordination, production environment surprises. The buffer ratio is taken from the critical-buffer row of Table 1. Buffer is not "waste," it is "capacity that is inevitably needed."

### 4. Periodic system-audit

Large systems have the highest risk of "local optimization creating global dyscoordination." The `project` scope audit frequency follows Table 3's tier-large project scope row (Table 3 is in `field-assessment/references/audit-frequency.md`).

The audit report pays special attention to:

- Whether any subsystem has recently made changes that are "optimal for itself but harm its neighbors"
- Whether critical chain buffer has been compressed
- Whether there are decisions that "should have triggered human-in-loop but didn't"

**Hierarchical view positioning**: When the `field-assessment` identification flow allows subsystem independent tiering, project scope audit is performed per subsystem hierarchy (the full semantics of layered audit are in `td-system-audit` step 2, not repeated here)—execution rules are in `field-assessment`'s `references/subsystem-tiering.md`.

## Switching to Other tiers

- System simplifies to under 100 files → switch to `tier-medium`
- System splits into multiple independent subsystems → each subsystem is tiered independently
