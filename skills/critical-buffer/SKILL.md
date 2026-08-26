---
name: critical-buffer
description: Critical chain buffer protection. Serves systems-engineering keynote principle 1 (Systems Engineering) and principle 2 (General Design Department).
user-invocable: false
---

# Critical Chain Buffer Protection

## Dependent Skills

- `wip-limit`
- `field-assessment`

## Served Keynote Principle(s)

**Systems-engineering keynote principle 1: Systems Engineering.** Overall performance depends on the bottleneck, not the average.

**Systems-engineering keynote principle 2: General Design Department.** Bottleneck identification must stand at the system-wide level; it cannot be left to each subsystem engineer's own judgment.

Derived from Goldratt's Theory of Constraints (TOC) and Critical Chain Project Management (CCPM). The premise is Qian Xuesen's systems engineering — without the general design department perspective, bottleneck identification degenerates into a tug-of-war where "every subsystem thinks it is the bottleneck."

## Rules

### Identify the Critical Chain

The critical chain is the **longest path** in the tasks sequence — the path that takes the longest time after accounting for resource constraints, not the path with the most tasks.

### Protect the Buffer

The project buffer at the end of the critical chain and the feeding buffer at tributary convergence points **must not be compressed**.

Common mistakes:
- "Estimated 2 hours, actually 1 hour is enough" → compressing the buffer
- "These tasks can be done in parallel" → failing to identify resource conflicts
- "Let's put a 90% safety margin" → the margin is distributed evenly across every task, with no concentrated buffer

### Implicit Buffer Compression (When WIP Is Exceeded)

Explicit buffer compression (the user directly requesting "compress the estimates") is defended against by this skill's "Protect the Buffer" rule. But there is also implicit buffer compression:

**Implicit buffer compression when WIP is exceeded:** when the number of active changes exceeds the `wip-limit` upper limit, the agent's attention is a finite resource; distributed across N parallel changes, each change receives only 1/N of attention — effectively, each change's critical chain buffer is implicitly compressed by "attention dispersion."

This implicit compression will not be detected within any single change's `critical-buffer` check — internally, each change appears to have complete critical chain annotations and compliant buffer ratios. But during cross-change integration, the implicit buffer compression caused by attention dispersion will erupt as cross-change global imbalance.

**Defense mechanism:**
- `wip-limit`'s hard block + override mechanism is the first line of defense (see `wip-limit`'s "Hard Constraint + Override Mechanism" section).
- When an override occurs, this skill should be triggered within the override flow to assess "the degree of implicit compression of each change's critical chain buffer from running N+1 changes in parallel."
- The assessment output goes into the override confirmation record, as input for the subsequent `/td-system-audit` project scope.

## Trigger Timing

- The user requests "speed up progress" or "compress estimates" during `/td-propose` or `/td-apply`
- The agent generates `tasks.md` itself
- Multiple changes are queued and the user wants to jump the line
- **When triggered for remediation by `/td-system-audit`:** when audit finds the "critical chain buffer compressed" problem, trigger this skill to re-plan tasks.

## What the Agent Should Do When Triggered

1. Explicitly annotate the critical chain path in `tasks.md`
2. Leave a project buffer at the end of the critical chain (ratio per the critical-buffer row of Table 1 for the current tier; Table 1 is in `field-assessment/references/strength-matrix.md`)
3. Refuse to treat the buffer as "compressible slack" — it is the system's capacity to absorb uncertainty
4. When the user requests compression, first ask: "Is this the real bottleneck or a non-bottleneck? Compressing a non-bottleneck does not affect overall performance."

## Adjustment by Tier

The larger the tier, the more complex the system, the higher the uncertainty, and the thicker the buffer. The project buffer ratio is taken from the critical-buffer row of Table 1 (the value rule is in "What the Agent Should Do When Triggered" item 2 above; not repeated here).

### Hierarchical View Homecoming

When there are clear subsystem boundaries within the system (`field-assessment`'s identification process allows subsystems to be assigned tiers independently), this skill's critical chain annotation should be **annotated separately by subsystem level** — each subsystem has its own critical chain and project buffer, and the dependency chain between subsystems is the cross-subsystem critical chain. Execution rules for subsystems assigned tiers independently are in `field-assessment`'s `references/subsystem-tiering.md`.
