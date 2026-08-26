---
name: test-driven-development
description: RED-GREEN-REFACTOR, delete code written before tests. Serves systems-engineering keynote principle 1—tests are the contract for system behavior. Trigger scenario: before the user writes any code; immediately block when the user says "I'll write the code first, then add tests".
user-invocable: true
---

# Test-Driven Development

## Dependent Skills

- `human-in-loop`
- `system-engineering`
- `systematic-debugging`
- `writing-plans`

## Served Keynote Principle(s)

**Systems-engineering keynote principle 1: Systems engineering.** Tests are not a "byproduct of code quality"; they are the contract for system behavior. Without a contract, the code the agent writes is just "talking to itself".

**Hierarchy of contracts**: TDD's RED-GREEN-REFACTOR is a **subsystem-level** contract (the behavioral contract of a single task). But this workflow also has a **system-wide-level** contract—the main spec contract that already-archived changes sync to `openspec/specs/`. When TDD's "delete code" enforcement conflicts with an already-archived spec contract, the **system-wide-level contract takes precedence**: first trigger `human-in-loop` to let the user decide whether to change the spec contract or keep the code, rather than directly deleting the code and breaking the already-archived spec contract.

## Trigger Timing

- During the `executing-plans` flow, when implementing each task
- Before the user writes code (any code)
- When the user says "I'll write the code first, then add tests"—immediately trigger this skill to block

## Working Style

### RED: Write a failing test first

1. Look at the task's "verification" field and **risk level** (high / medium / low, annotated by `writing-plans`)
2. Decide test intensity by risk level:
   - **high** (core path / spans multiple subsystems / data consistency / security / irreversible): full boundary test suite (normal path + boundaries + exceptions)
   - **medium** (regular functionality): normal path + key boundaries
   - **low** (mechanical changes): smoke-level verification is sufficient
3. Write a test that **will currently fail** (because the feature isn't implemented yet)
4. Run the test, confirm it **really fails** (not a build error, not some other failure)
5. If the test didn't fail, it means the feature already exists or the test was written wrong—stop

### GREEN: Write the minimal implementation

1. Write the **minimal** code that makes the test pass
2. Don't "incidentally" add extra features—YAGNI
3. Run the test, confirm green
4. If it can't go green, go back to RED and adjust the test; don't muscle through in GREEN

### REFACTOR: Refactor

1. After tests are green, see if the code can be cleaner
2. During refactoring, tests must stay green
3. After refactoring, run the full test suite to confirm nothing else broke

## Hard Constraints

### Delete the products of "write code first, add tests later"

If the agent discovers code was already written but the corresponding test doesn't exist or was added after: **delete the code, start over from RED.** Not "add a test to catch up", but "start over".

This rule seems aggressive, but it prevents the rot of "tests only exist to accommodate already-written code".

**Exception (brownfield legacy code):** This rule only applies to **newly written code in the current change**. Legacy code that already existed when taking over a project inherently has no tests; mandatory deletion would destroy the system—legacy code follows the `profile-brownfield` path: first add characterization tests to lock in existing behavior, then refactor.

**Exception 2 (conflict with already-archived spec contract):** When TDD's "delete code" enforcement would break the main spec contract that an already-archived change synced to `openspec/specs/`, **don't delete directly**—first trigger `human-in-loop` to let the user decide: (a) change the spec contract (re-propose to modify the main spec), or (b) keep the code (abandon this TDD's deletion enforcement, record as "known contract deviation"). This is the execution rule for "system-wide-level contract takes precedence over subsystem-level TDD enforcement".

### Don't accept "this can't be tested"

If the agent says "this can't be tested":

- UI rendering? Test snapshots
- Side effects? Mock the boundaries
- Randomness? Inject a seed
- Time/space dependent? Inject a clock

"Can't be tested" almost always means "the contract wasn't thought through".

## Relationship with Other Skills

- Works with `systematic-debugging`: when RED fails, if the failure reason is unclear, trigger systematic-debugging
- Works with `td-archive`: TDD's RED-GREEN-REFACTOR is the subsystem-level contract; archive's "actual vs expected" retrospective is the system-wide-level contract validation. The two are complementary applications of "model carrier" at the subsystem level and the system-wide level (see the "Model Carrier" section under systems-engineering keynote principle 3 in `system-engineering`).

## What Not to Do

- Don't "write a stub test as a placeholder, fill it in later"—this is an abuse of deferred decisions
- Don't add new features during the REFACTOR phase—REFACTOR only changes shape, not behavior
