---
name: requesting-code-review
description: Review between tasks, critical issues block progress. Serves systems-engineering keynote principle 2. Trigger scenario: architecture review after propose and before apply; at critical chain task / checkpoint moments; when the user requests a review.
user-invocable: true
---

# Requesting Code Review

## Dependency Skills

- `human-in-loop`

## Served Keynote Principle(s)

**Systems-engineering keynote principle 2: General design department.** Review is not "finding bugs"; it is "the general design department doing a system-wide inspection of the subsystem engineer's work"—does this change conform to the system's overall design? Does it create new disharmony?

## Trigger Timing

- **After `td-propose` is complete, before `td-apply` starts (architecture review)**—the proposal has just been finalized, before entering implementation, first check the subsystem splitting and design decisions; this is when changing the architecture costs the least
- At `executing-plans` checkpoint moments
- After completing each critical chain task
- When the user explicitly requests a review

## Working Style

### 1. Review dimensions

For the code under review, look at it from two dimensions:

#### Spec compliance

- Does the code implement the tasks in tasks.md?
- Does the code conform to the design decisions in design.md?
- Does the code violate the boundaries stated in the proposal's "systems-engineering impact assessment"?

#### Code quality

- Is naming clear?
- Code duplication (DRY)?
- Function length / complexity?
- Is error handling complete?
- Does test coverage cover boundary cases?

### 2. Issue severity

| Severity | Meaning | Handling |
|---|---|---|
| **critical** | Violates spec / severe bug / security issue | **Blocking**, must fix before continuing |
| **warning** | Code quality issues, minor bugs | Should fix, can defer |
| **nit** | Style, naming | Can ignore |

### 3. Review report

```markdown
## Code Review: <task name>

### Spec Compliance
- [ ] Implementation conforms to tasks.md
- [ ] Implementation conforms to design.md
- [ ] Implementation conforms to proposal systems-engineering impact assessment boundaries

### Code Quality
- Naming: <OK / issue>
- DRY: <OK / issue>
- Error handling: <OK / issue>
- Test coverage: <OK / issue>

### Issues

1. **[critical]** <issue>
   - Location: <file:line>
   - Suggestion: <fix>

2. **[warning]** <issue>
   ...

### Verdict
<can continue / must fix critical first>
```

### 4. Critical blocking

If there is a critical issue:

1. **Don't continue to the next task**
2. Immediately fix the critical issue
3. Re-review after fixing

warnings don't block, but should be recorded in tasks.md's "known issues".

### 5. Architecture review (after proposal, before apply)

The review target is not code, but the proposal's subsystem splitting and design decisions. This is when changing the architecture costs the least.

The checklist (high cohesion / low coupling) is in `references/architecture-review-checklist.md`. Severity and blocking semantics are as follows (shared with code review):

- **critical**: bad subsystem splitting / circular dependencies / implicit dependencies—**blocks apply**, go back to propose to modify the proposal before continuing
- **warning**: oversized interfaces, scattered responsibilities—record to the proposal, can defer
- **nit**: naming etc.—can ignore

The critical of architecture review and the critical of code review both follow the "don't continue" rule—except here "don't continue" means don't enter task implementation.

## Relationship with Other Skills

- Works with `human-in-loop`: critical issues are fixed by the agent if it can; if it can't, trigger human-in-loop
