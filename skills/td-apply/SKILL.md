---
name: td-apply
description: Implement tasks, following artifacts. OpenSpec contract-layer entry. Trigger scenarios: user says "apply", "implement", "start writing code", "work the change", "execute tasks", "start executing", "go". The execution entry point routes through this skill; the behavior layer `executing-plans` is called internally by this flow.
user-invocable: true
argument-hint: <change-name>
---

# td-apply

Implement following the change's `tasks.md`. This is the bridge from "contract" to "code".

## Dependencies

- `system-engineering`
- `field-assessment`

## Served Keynote Principle(s)

**Systems-engineering keynote principle 1: systems engineering.**

apply is not "checking off the task list"; it is "advancing implementation from a systems-global standpoint." The impact of each task on the system as a whole must be continuously held by the agent.

**Core thesis aligned — "overall performance does not equal the sum of the parts' performance"**: Step 7.2's "system-level verification (cross-subsystem boundary, hard step)" is the most direct embodiment of the core thesis (the full elaboration of the thesis and its engineering interpretation is in the "Core thesis aligned" section of `verification-before-completion` and is not repeated here). This step only defines the trigger conditions and tier-layered strength; the execution semantics are in section 6 of `verification-before-completion`.

**Systems-engineering keynote principle 2: general design department.**

Key decisions encountered during apply are not decided by the agent alone — trigger `human-in-loop` to let the user (the general design department) decide.

**《Engineering Cybernetics》 feedback control loop aligned**: apply is the control-execution + real-time error detection link (TDD at the contract level, verification at the system level).

## Input - change name. If empty, infer or ask the user "which change do you want to apply?"

`$ARGUMENTS`

## Steps

### Step 1. Activate keynote and configuration layer

Activate keynote and configuration layer. Inject strength values only, without making judgments — execute the following three-step sequence:

1. **`system-engineering`** — The four keynote principles enter context. apply is not "checking off the task list"; it is "advancing implementation from a systems-global standpoint."
2. **profile × tier identification** — Call `field-assessment`, read `$_TD_PROFILE` / `$_TD_TIER`, and load Table 1 + Table 2 + Table 3. Cache within the session; subsequent steps reference directly. During apply, **do not proactively trigger project-scope system-audit**, but trigger current-change audit at the frequency specified by Table 3's current-change scope (see Step 7.3).
3. **Other constraints** — Only read the strength values into context; do not judge whether to trigger in this step — subsequent steps judge whether to trigger / whether tasks comply based on these.

### Step 2. Pre-checks

Against the strengths injected in Step 1 and the current change's status, judge whether to trigger:

- **change completeness**: Are all artifacts present? Does the proposal have a "systems-engineering impact assessment" section? If not → not apply-ready; stop and ask the user. When the "expected behavior model" field is missing, **do not block**; downgrade with a prompt: "proposal is missing the 'expected behavior model' field (legacy change compatibility); during apply, actual behavior verification per Step 7.2 prevails; new changes should go back to `/td-propose` Step 6.c to fill it in." — This is symmetric with `td-archive` Step 3's legacy change fallback (propose 6.c remains mandatory for new changes; this only permits existing legacy changes and does not weaken the propose-side constraint).
- **tier-large overall design document required**: If `$_TD_TIER == tier-large`, check whether the proposal attaches an "overall design document" (see the "Overall design document required" section for `tier-large`). If this document is missing → **block apply**, prompt the user to go back to `/td-propose` to add the document. This check and the one in `td-propose` Step 6.c are validated in two separate places to avoid missed detection.
- **`wip-limit` (hard block + override, backstop)**: Has the number of currently active changes reached the limit? (Applying one at the limit means the propose-stage WIP hard block was penetrated by override, or the propose stage missed the block.) **Block this step; do not execute Step 3**; execute the "hard constraint + override mechanism" section of `wip-limit` (authoritative description is in that skill; after override passes, continue to Step 3). Both propose and apply must execute the hard block + override mechanism.
- **`critical-buffer`**: Does `tasks.md` annotate the critical chain? Is a project buffer reserved (at the ratio for the current tier, per Table 1's critical-buffer row; Table 1 is in `field-assessment/references/strength-matrix.md`)? If not → trigger `writing-plans` to fill it in (critical chain annotation should be completed in the propose stage; here we only patch the gap).
- Other constraints (brooks-law / delay-decision / human-in-loop) are triggered as needed during implementation; they are not pre-judged in this step.

### Step 3. Read the change's artifacts

Read in dependency order:

1. `proposal.md` (what & why)
2. `design.md` (how)
3. spec files under `specs/`
4. `tasks.md` (implementation steps)

### Step 4. Architecture review re-check + trigger behavior layer

**Before entering task implementation, re-check the architecture review conclusion**: `td-propose` Step 7 has already completed the architecture review and only releases apply if there are no criticals — this step only re-checks: were proposal / design modified after propose? **Unmodified → reuse the Step 7 conclusion, proceed directly to task implementation**; **modified → re-trigger the architecture review of `requesting-code-review`** (check the subsystem decomposition and design decisions against the proposal's "systems-engineering impact assessment" section and `design.md` for high cohesion / low coupling; the checklist is in that skill's `references/architecture-review-checklist.md`). **Unresolved architecture-level criticals → block apply**, prompt the user to go back to `/td-propose` Step 6 to fix the proposal, then re-review.

After the architecture review passes, implement following the task sequence in `tasks.md`. Behavior-layer trigger sequence:

1. **`writing-plans`** (if `tasks.md` granularity is not fine enough): refine the task sequence
2. **`executing-plans`** (execute following the task sequence; internally trigger the following skills at task granularity):
   - **`test-driven-development`**: write a failing test for each task, then write the implementation
   - **`requesting-code-review`**: do review at checkpoints
   - **`verification-before-completion`**: must run verification commands before each task is considered complete

`executing-plans` is the core entry point for behavior-layer execution; TDD / review / verify are triggered at task granularity inside `executing-plans`. The human-in-loop / systematic-debugging triggered inside executing-plans are **task-granularity** (e.g., checkpoint mandatory stop, RED failure) and do not duplicate the apply-global-granularity triggers in this Step 5.

### Step 5. Trigger apply-global-granularity engineering-management constraints

Step 4's executing-plans has already triggered task-granularity human-in-loop / systematic-debugging (e.g., checkpoint mandatory stop, RED failure). This step triggers constraints at the **apply-global granularity**, not duplicating task granularity:

- `brooks-law`: when the user wants to add people / parallel subagents to speed up during apply
- `delay-decision`: when encountering reversible decisions at the top-level architecture layer during apply (does not overlap with task-granularity "implementation-detail reversible decisions")
- `human-in-loop`: when encountering apply-global mandatory-stop scenarios during apply such as "impact beyond the current change scope" (task-granularity checkpoint mandatory stops are the responsibility of executing-plans). The "root cause is outside the plan → stop and ask the user" from Step 7.2 boundary verification failure also goes through this apply-global mandatory-stop channel.

### Step 6. Update tasks.md

For each completed task:

- change `- [ ]` to `- [x]`
- append a verification evidence link after the task (test output, command result)

### Step 7. Completion determination

After all tasks are `[x]`, perform **two-layer final verification**; both layers must pass to count as done:

#### 7.1 change-level verification

Trigger `verification-before-completion` to perform change-level final verification (full test / lint / build / type check).

#### 7.2 system-level verification (cross-subsystem boundary, hard step)

**Execution sequence**: read the proposal's "systems-engineering impact assessment" section to list affected subsystems → run cross-subsystem boundary verification per tier strength → if problems found, trigger `systematic-debugging` to find the root cause → if root cause is outside the plan, stop and ask the user.

After change-level verification passes, check against the **affected subsystems** listed in the "systems-engineering impact assessment" section of `proposal.md`, and run **cross-subsystem boundary verification** for each — verifying that the integrated overall behavior of each subsystem conforms to the contract, not just that each task is locally green.

"Overall performance does not equal the sum of the parts' performance" (keynote principle 1) — all tasks testing green does not mean the subsystem integration is correct. **The execution semantics are carried by section 6 of `verification-before-completion`** (the specific methods for interface/contract testing, data-flow transmission, and boundary mocks are there); this step only defines the trigger conditions and tier-layered strength (per the current tier injected in Step 1):

- `tier-small`: run smoke-level integration verification on affected subsystem boundaries
- `tier-medium`: run integration/contract tests on affected boundaries
- `tier-large`: mandatory complete integration tests + contract tests, checking item-by-item against the "which subsystems are affected" list

Boundary verification discovers a cross-subsystem problem → trigger `systematic-debugging` to find the root cause; if root cause is outside the plan (the proposal's impact assessment missed a subsystem) → stop and ask the user: should we supplement the proposal's assessment or change the code?

**Layered-view aligned**: When the `field-assessment` identification flow allows subsystem independent tiering, the cross-subsystem boundary verification in this step should **verify per subsystem layer** — each subsystem verifies at its own tier strength, and cross-subsystem dependency chains are handled at the strength of the "highest-tier subsystem" (conservative principle). The execution rules for subsystem independent tiering are in `field-assessment`'s `references/subsystem-tiering.md`.

#### 7.3 current-change audit (at Table 3 frequency)

After both verification layers pass, check against Table 3's **current-change scope** frequency to decide whether to trigger `td-system-audit current-change` (Table 3 is in `field-assessment/references/audit-frequency.md`):

- `tier-small`: not required
- `tier-medium`: trigger at each critical-chain task completion — this granularity is the responsibility of `executing-plans`'s checkpoint (see that skill's Step 3); not repeated here
- `tier-large`: trigger once per completed change — this step is that trigger point

When triggered, call `/td-system-audit current-change`, running the "actual vs. expected" of this change against the keynote. The audit report is written to `openspec/.td-state/audits/`, and `audit-history.yaml` is updated.

## Guardrails

- Do not skip tasks; follow `tasks.md` order
- Every task must have verification evidence; "I think I got it right" does not count
- When proposal conflicts with actual code, stop and ask the user: fix the proposal or fix the code?
