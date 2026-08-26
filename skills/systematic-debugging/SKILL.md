---
name: systematic-debugging
description: 4-phase root cause, must find the root cause before fixing a bug. Serves systems-engineering keynote principle 3. Trigger scenario: test fails and the cause is unclear; user reports a bug; when a fix attempt has failed 2 or more times—reproduce first then isolate, don't guess.
user-invocable: true
---

# Systematic Debugging

## Dependency Skills

- `human-in-loop`

## Served Keynote Principle(s)

**Systems-engineering keynote principle 3: Meta-synthesis from qualitative to quantitative.** Debug is the purest embodiment of this principle—repeated iteration from "phenomenon" (qualitative) to "root cause" (quantitative).

**Systems-engineering keynote principle 1: Systems engineering.** A bug is not "the code is wrong"; it is "system behavior deviates from the contract". Before fixing a bug, you must understand at which layer the system deviated.

**Feedback control loop placement (《工程控制论》)**: The 4-phase flow is the concrete form of the feedback control loop (Reproduce detects, Isolate locates, Root Cause attributes, Fix & Verify corrects + re-detects).

## Trigger Timing

- Test fails, and the failure cause is unclear
- User reports a bug
- The agent's own fix attempt has failed 2 or more times (the threshold that triggers the debug flow; this is a different level from `executing-plans` step 4's "3 failures triggers plan reflection"—2 failures triggers debug, 3 failures triggers plan reflection)
- Task execution failure within `executing-plans`

## 4-Phase Flow

### Phase 1: Reproduce

- Find the minimal steps that can reliably reproduce the bug
- If you can't reliably reproduce it, first solve "how to reproduce"—this is a prerequisite
- Record the reproduction steps; every subsequent phase will use them

**Failure mode:** "I ran it once and didn't get an error, it should be fine"—this isn't debugging, it's praying.

### Phase 2: Isolate

- Use bisection to narrow the problem scope
- Comment out code blocks, skip paths, isolate inputs
- Find the "minimal change set"—the smallest code change that makes the bug disappear

**Failure mode:** "I think it's a problem with X" and changing it directly without verification. Verify the hypothesis first, then act.

### Phase 3: Root Cause

- After finding the minimal change set, ask "why does this change fix the bug?"
- The answer should be a system-level explanation, not "because I changed this line, it works now"
- If you can't explain it, go back to Phase 2

**Failure mode:** "As long as it runs"—a fix without finding the root cause means the bug will come back in another form.

### Phase 4: Fix & Verify

- Fix the root cause, not the symptom
- Run the reproduction steps, confirm the bug is gone
- Run the full test suite, confirm no new bugs were introduced
- Add a regression test specifically for this bug—prevent it from coming back

**Failure mode:** Not running the full test suite after fixing. A fix for one bug that breaks something else is worse than the bug itself.

**Loop closure placement**: Phase 4's "add a regression test" is not just "prevent the bug from coming back"; it is the **closure action** of the feedback control loop in 《工程控制论》—it converts "the error discovered this time" into "the contract for next error detection" (the regression test becomes part of the system behavior contract). A Phase 4 without a regression test is a broken loop: the bug is fixed, but the system hasn't learned anything from this error.

## Relationship with Other Skills

- Works with `human-in-loop`: if Phase 3 can't find the root cause, stop and ask the user
