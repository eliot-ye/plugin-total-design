---
name: executing-plans
description: Execute tasks in batch, with human checkpoints. Serves systems-engineering keynote principle 2. Trigger scenario: within the td-apply flow when implementing according to the tasks.md sequence (execution entry point is /td-apply; this skill is invoked internally by apply; when the user directly says "start executing" / "go" they should go through /td-apply)—stop for a checkpoint after critical chain tasks.
user-invocable: true
---

# Executing Plans

## Dependency Skills

- `field-assessment`
- `human-in-loop`
- `requesting-code-review`
- `systematic-debugging`
- `test-driven-development`
- `verification-before-completion`

## Served Keynote Principle(s)

**Systems-engineering keynote principle 2: General design department.** Execution is not "head-down grinding"; it is "the subsystem engineer (agent) works for a stretch, then the general design department (user) does a checkpoint".

**Feedback control loop placement (《工程控制论》)**: The task execution flow is a contract-level error detection + correction loop; the Human checkpoint is general-design-department-level error detection + correction.

## Trigger Timing

- Plan is already written (`writing-plans` completed)
- User says "start executing" / "go"
- **current-change audit triggered** (triggered alongside this skill's Human checkpoint): tier stratification and trigger ownership are in `field-assessment/references/audit-frequency.md`'s "current-change scope trigger skill ownership" table (Table 3)—this skill is only responsible for `tier-medium` (triggered when each critical chain task completes); `tier-small` is not required, `tier-large` is handled by `td-apply` step 7.3, not repeated here.

## Working Style

### 1. Execute in tasks.md order

Don't skip tasks, don't parallelize (unless the plan explicitly marks parallelism).

### 2. Each task execution flow

1. Trigger `test-driven-development`: write a failing test first
2. Write the implementation
3. Run tests, confirm green
4. Trigger `verification-before-completion`: run verification commands
5. Update tasks.md: `- [ ]` → `- [x]`, add verification evidence

### 3. Human checkpoint

Stop and ask the user at the following moments:

- After completing a critical chain task
- When hitting a mandatory-stop scenario from the `human-in-loop` skill (categories 1–5 general baseline + tier/profile additions)
- When actual task time significantly exceeds the estimate (>2x)

**current-change audit**: Triggered alongside this checkpoint; frequency and tier stratification are in the current-change audit entry under "Trigger Timing" above.

Checkpoint format:

```
## Checkpoint <N>

### Completed tasks
- [x] <task A> — verification: <test output>
- [x] <task B> — verification: <test output>

### Next steps
- <task C>
- <task D>

### Decisions needed from you
- <decision 1>
- <decision 2>

Continue?
```

### 4. Failure handling

When a task execution fails:

1. Trigger `systematic-debugging`: 4-phase root cause
2. If the root cause is outside the plan, stop and ask the user
3. Don't "muscle through"—after 3 failures, stop and reflect on the plan (2 failures triggers `systematic-debugging`, 3 failures triggers plan reflection; both thresholds are in `systematic-debugging`'s trigger timing)

## Relationship with Other Skills

- Works with `requesting-code-review`: does review at checkpoints
