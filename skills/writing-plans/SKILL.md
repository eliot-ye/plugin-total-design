---
name: writing-plans
description: Break work into bite-sized tasks, annotating each task with its impact on subsystems. Serves systems-engineering keynote principle 1. Trigger scenario: user says "list a plan", "break down tasks", "plan it out", or during propose when building the tasks.md skeleton, or during apply when refining tasks.
user-invocable: true
---

# Writing Plans

## Dependent Skills

- `critical-buffer`
- `delay-decision`
- `field-assessment`
- `requesting-code-review`

(`test-driven-development` consumes the risk fields annotated by this skill, but this skill does not depend on it—it is not listed as a dependency skill to avoid a circular dependency with `test-driven-development`'s dependency skills section.)

## Served Keynote Principle(s)

**Systems-engineering keynote principle 1: Systems engineering.** Every task must not only look at itself; it must annotate "which subsystems this local action affects".

## Boundary with td-propose / td-apply

tasks.md is completed in two stages:

1. **`/td-propose` stage**: Create the tasks.md skeleton—task sequence + critical chain annotations + project buffer (per the `critical-buffer` skill's rules). This is the "implementation plan" part of the proposal.
2. **`/td-apply` stage**: If the tasks.md granularity is still not fine enough, this skill is triggered again to refine.

Critical chain annotations are completed in the propose stage; the apply stage only does validation and refinement.

## Trigger Timing

- `/td-propose` stage: spec already exists, needs to be broken into a tasks.md skeleton
- `/td-apply` stage: tasks.md already exists but the granularity is not fine enough

## Working Style

### 1. Task splitting order: by system hierarchy first, then by time granularity

Qian Xuesen's systems engineering emphasizes the "hierarchical structure of systems" (systems-engineering keynote principle 4, "Hierarchy View"). Task decomposition should be done by hierarchy, not by flat time-granularity slicing.

**Splitting order**:

1. **First split by subsystem boundaries**: corresponds to `td-reverse-spec`'s subsystem splitting. One group of tasks per subsystem.
2. **Then split by hierarchy within each subsystem**: top-level architecture → module design → implementation details. Within the same subsystem, top-level architecture tasks precede module design tasks, and module design tasks precede implementation detail tasks.
3. **Finally check the time granularity of each task**: each task should be of a size the agent can complete in one go (2–5 minutes). Tasks that are too coarse continue to be split down by hierarchy.

**Counter-examples**:

- ❌ "Put all UI changes in one group, all API changes in another group"—slicing by technology layer, breaking subsystem boundaries.
- ✅ "auth subsystem: first modify the token validation module, then modify the session module; payment subsystem: first modify the order module, then modify the refund module"—slicing by subsystem boundary + hierarchy within subsystems.

**Splitting rule when subsystems independently determine tiers**: When `field-assessment`'s identification flow allows subsystems to independently determine tiers, this skill's task splitting is broken down by subsystem hierarchy—each subsystem gets its own sub-task sequence, and inter-subsystem dependency tasks form the cross-subsystem critical chain. Execution rules are in `field-assessment`'s `references/subsystem-tiering.md`.

### 2. Required fields for each task

The field template and risk-level determination are in `references/task-template.md` (five fields: file / risk / verification / subsystem impact / dependency + high/medium/low determination criteria).

Every task must carry a `risk` field (high / medium / low)—`test-driven-development` uses this to decide test intensity, and `requesting-code-review` uses it to decide review depth.

### 3. Annotate the critical chain

Use the `critical-buffer` skill's rules to annotate the critical chain path + project buffer in tasks.md.

### 4. Don't write "deal with it later"

All tasks must either be in tasks.md or explicitly marked `[out of scope]`. "Deal with it later" is where plan rot begins.

## Relationship with Other Skills

- Works with `delay-decision`: if a reversible decision is encountered in the plan, mark it `[deferred decision]` instead of forcing a call
- Works with `field-assessment`: when `field-assessment`'s identification flow allows subsystems to independently determine tiers, this skill's task splitting should **break down tasks by subsystem hierarchy**—each subsystem has its own task sequence, and inter-subsystem dependency tasks form the cross-subsystem critical chain.

## What Not to Do

- Don't write a "high-level plan"—the plan must be fine-grained enough for the agent to execute directly
- Don't label all tasks as "critical chain"—the critical chain is the longest path, not all paths
