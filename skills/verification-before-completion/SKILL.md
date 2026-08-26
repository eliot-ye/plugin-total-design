---
name: verification-before-completion
description: Must run verification commands before declaring completion, evidence before assertions. Serves systems-engineering keynote principle 3. Trigger scenario: when the agent is about to claim "task complete" / "bug fixed" / "ready to commit"—verify first, then draw conclusions.
user-invocable: true
---

# Verification Before Completion

## Dependency Skills

- `human-in-loop`
- `systematic-debugging`

## Served Keynote Principle(s)

**Systems-engineering keynote principle 3: Meta-synthesis from qualitative to quantitative.** Declaring "complete" is the synthesis from quantitative (verification evidence) back to qualitative ("it's good"). A qualitative declaration without quantitative evidence is a hallucination.

**Systems-engineering keynote principle 1: Systems engineering.** "Complete" is not "I finished writing"; it is "system behavior conforms to the contract". Contract conformance must be proven with evidence, not asserted by feeling.

**Core thesis placement—"Overall system performance is not the sum of the performance of its parts"**: Section 6 "System-level verification (cross-subsystem boundaries)" is the most direct embodiment of the core thesis. Qian Xuesen explicitly states in 《创建系统学》: "The overall performance of a system is not the sum of the performance of its parts; the key is overall coordination." This workflow engineers this thesis as: all task tests being green only proves each subsystem is locally correct; it cannot prove that after subsystem integration, the overall behavior conforms to the contract—hence cross-subsystem boundary verification is mandatory. The execution semantics of Section 6 (interface/contract tests, data flow propagation, boundary mocks) are the execution layer of this core thesis.

**Feedback control loop placement (《工程控制论》)**: verification is the real-time error detection step (Section 6's system-level verification is real-time error detection at the "system integration level", closing the loop in coordination with `td-apply` step 7.2).

## Trigger Timing

- When the agent is about to claim "task complete" / "bug fixed" / "tests passed" / "ready to commit"
- Before any "I'm done" type declaration
- Before a task is marked `[x]` in `executing-plans`
- Before `requesting-code-review` gives a "can continue"

## Working Style

### 1. List verification commands

For each "complete" declaration, first list the **specific verification commands**:

- Run tests: `<test command>`
- Run linter: `<lint command>`
- Run build: `<build command>`
- Run type check: `<type check command>`

### 2. Actually run these commands

Not "I think it'll pass", but **actually execute**, and get the output.

### 3. Check the output

- Is the exit code 0?
- Are there warnings / errors in the output?
- Does test coverage cover the scenarios that should be tested?

### 4. Give evidence-based declarations

Wrong declaration: "The task is complete."
Correct declaration: "Task complete. Ran `pytest tests/test_auth.py`, all 12 tests green. Ran `mypy`, no type errors."

### 5. If verification fails

**Don't**:
- Immediately "tweak it" and re-run—first understand why it failed
- Declare "basically done, just this little bit"—either it's done or it's not
- Skip the failed verification and commit first—committing failed code is contamination

**Do**:
- Trigger `systematic-debugging` to go through the 4-phase flow
- If it can't be fixed, trigger `human-in-loop` to stop and ask the user

### 6. System-level verification (cross-subsystem boundaries)

Division of labor between this section and `td-apply` step 7.2: step 7.2 defines the trigger conditions and tier-stratified intensity; this section defines the execution semantics. Within the `td-apply` flow, this section is triggered after step 7.1's change-level verification passes; when this skill is triggered independently, if upstream already has change-level verification artifacts, you can go directly to this section.

Change-level verification passing ≠ system integration is correct. **"Overall system performance is not the sum of the performance of its parts" (systems-engineering keynote principle 1)**: all task tests being green only proves each subsystem is locally correct; it cannot prove that after subsystem integration, the overall behavior conforms to the contract. This is the core thesis placed in the `## Served Keynote Principle(s)` section—cross-subsystem boundary verification is the execution layer of this core thesis.

When a change's proposal annotates "which subsystems are affected", after change-level verification, **cross-subsystem boundary verification** must be appended:

- Interface/contract tests between affected subsystems (integration boundaries, not unit tests)
- Correctness of data flow propagation across subsystems
- Boundary mocks: does a behavior change in one subsystem break the contract of an adjacent subsystem

The triggering and tier-stratified intensity of boundary verification are defined by `td-apply` step 7.2; this skill is responsible for the execution-layer semantics: boundary verification also follows this skill's sections 1–5 flow—list verification commands, actually run them, check output, give evidence-based declarations, and on failure trigger `systematic-debugging`.

## Hard Constraints

### Don't accept the following shortcuts

- **"Looks correct by eye"**: UI changes also need verification—snapshot test, E2E test, or at least manual screenshot comparison. "I looked at it and it seems right" is not verification.
- **"Should be fine"**: "I didn't touch that code, it should be fine"—a classic faceplant. Run the full test suite to confirm it's really fine.
- **"Tested before"**: "I ran this test before"—the code changed, so the previous test results are invalidated. Re-run.
