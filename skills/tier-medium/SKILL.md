---
name: tier-medium
description: Medium system complexity tier. 10-100 files, multiple modules. constraints are moderately enforced, system-audit frequency per Table 3 (see field-assessment).
user-invocable: false
---

# Tier: Medium (medium system)

## Assessment Basis

See the "### 3. Assess tier" section of the `field-assessment` identification flow for criteria (take the highest when any holds).

- System hierarchy: has obvious module/subsystem boundaries

## system-audit frequency

See Table 3's tier-medium row (project scope: every 3 changes completed; current-change: at each critical chain task completion; Table 3 is in `field-assessment/references/audit-frequency.md`).

## Special Rules

### 1. Make subsystem boundaries explicit

A common problem in medium systems is "subsystem boundaries are blurred." During reverse-spec, draw out the subsystem boundaries to serve as the basis for impact assessment of subsequent changes.

**Hierarchical view positioning**: Making subsystem boundaries explicit is the engineering instantiation of keynote principle 4's "hierarchical view" in tier-medium—acknowledging that medium systems are multi-level nested structures (top-level architecture → module design → implementation details), and that different levels need to be treated in layers. When the `field-assessment` identification flow allows subsystem independent tiering, each subsystem of a medium system may also have its own subsystem hierarchy.

### 2. Public contract changes are human-in-loop baseline type 1

In medium systems, API shapes, database schemas, configuration formats—these "public contracts" begin to have cross-subsystem impact. `human-in-loop` must trigger before modifying these—this belongs to that skill's generic baseline type 1 (public contract changes), effective under all profile × tier combinations (Table 1 annotation explicitly states "not repeated as a tier addition"), and is no longer treated as a medium-specific addition here.

### 3. Critical chain diagnosis

The critical chain of a medium system is typically not a single-task sequence, but rather "modify subsystem A → wait for subsystem B modification → integration testing." Identify this chain; reserve buffer on integration testing.

## Switching to Other tiers

- File count grows to 100+ → switch to `tier-large`
- System simplifies to under 10 files → switch to `tier-small`
