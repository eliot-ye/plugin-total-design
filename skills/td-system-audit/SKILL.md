---
name: td-system-audit
description: Periodically self-check against the systems-engineering keynote principles, embodying Qian Xuesen's "general design department" perspective. Trigger scenarios: the user says "audit", "self-check", "retrospective", "review against keynote principles", "progress has been rough lately".
user-invocable: true
argument-hint: "<scope: current-change | project>  (optional, default current-change)"
---

# td-system-audit

The engineering instantiation of Qian Xuesen's "general design department" perspective. Periodically runs the agent's current work against the four systems-engineering keynote principles, identifying risks of "local optimization creating global imbalance."

## Dependencies

- `system-engineering`
- `field-assessment`

## Served Keynote Principle(s)

**Systems-engineering keynote principle 2: General design department.**

This command itself is the engineering instantiation of the general design department — periodic self-checking is the core responsibility of the general design department.

**Systems-engineering keynote principle 1: Systems engineering.**

The comparison standard for audit is the four keynote principles, not "code quality" or "progress" — this is an audit from the systems engineering perspective, not from the project management perspective.

**《Engineering Cybernetics》 feedback control loop restoration**: Step 7 "re-run audit after fix to close the loop" is the concrete form of the feedback control loop (re-run limit of 3 is the controller saturation limit; exceeding it triggers `human-in-loop`).

## Input — the scope of the audit. Empty defaults to `current-change`

- `current-change`: audit the currently active change
- `project`: audit the work approach of the entire project

#### Content

`$ARGUMENTS`

## Trigger timing

system-audit does not run only when the user explicitly invokes it. The agent should proactively suggest audit at the following times:

- **Frequency trigger**: Compare against Table 3 (system-audit frequency, per current tier's project scope / current-change scope thresholds; Table 3 is in `field-assessment/references/audit-frequency.md`). The source of truth for frequency is Table 3; this skill does not rewrite it — `td-archive` Step 5.2 already maintains the "cumulative archive counter"; when the threshold is reached, it suggests an audit.
- **Signal trigger**:
  - When the user expresses "feeling like progress hasn't been smooth lately"
  - After the critical chain buffer has been compressed multiple times

## Steps

### 1. Activate keynote and configuration layer

Activate keynote and configuration layer. Only inject strengths, do not make judgments; execute the following three-step sequence:

1. **`system-engineering`** — The four keynote principles enter context. The comparison standard for audit is the four keynote principles; without the keynote framework, audit degenerates into "code quality review."
2. **profile × tier identification** — Call `field-assessment`, read `$_TD_PROFILE` / `$_TD_TIER`, load Table 1 + Table 2 + Table 3. Cache within the session; subsequent steps reference directly. Reading Table 3 is so the audit report can reference "this audit is X changes since the last project scope audit"; the threshold-reached judgment is handled by `td-archive` Step 5.2 (which maintains `archive-counter.yaml` and makes the threshold-reached judgment).
3. **Other constraints** — Only read strength values into context; do not decide whether they trigger in this step.

### 2. Collect audit objects

Collect by scope:

- **current-change**: the current active change's proposal/design/tasks/specs
- **project**: all active changes + the "actual vs. expected" post-mortem review of the 3 most recently archived changes, **and include the main spec baseline under `openspec/specs/`** — this is the subsystem contracts and invariants sedimented from reverse-spec / archive sync, serving as the anchor for audit to compare whether "local changes broke existing subsystem contracts." If `openspec/specs/` is empty (the project has never reverse-spec'd, nor archived any change) → skip the baseline anchor; only audit active changes and recent archive post-mortem reviews.

**Layered-view restoration**: When the `field-assessment` identification flow allows subsystem independent tiering, project scope audit should **audit by subsystem layer separately**, distinguishing in the audit report between "intra-subsystem imbalance" and "cross-subsystem boundary imbalance" — the latter is handled at the strength of the "highest-tier subsystem" (conservative principle). Execution rules in `field-assessment`'s `references/subsystem-tiering.md`.

### 3. Audit against the four keynote principles

For each audit object, audit item by item. The item-by-item checklist is in the "Keynote Principle Comparison Checklist" section of `references/audit-report-template.md` — check off each of the four keynote principles; mark violations and trigger the corresponding constraint skill (see Step 6).

### 4. Output audit report

The report is output to both the conversation and persisted to disk. Disk path: `openspec/.td-state/audits/<YYYYMMDD-HHMMSS>-<scope>.md`. The directory is created on demand on first run of this step.

The report follows the "Report Template" section of `references/audit-report-template.md` (Scope + keynote comparison table + problems found + suggested next actions).

After persisting, synchronously update `openspec/.td-state/audit-history.yaml`: append a record for this audit. File format is in `references/audit-history-template.md`; the file is created on demand on first run of this step.

**null semantics**: `audit-history.yaml` does not exist → this step creates the file and writes the first record; `audits/` directory does not exist → create it synchronously.

### 5. Backlog pool (optional)

After the audit report is output, for the report's "suggested next actions" (especially non-severe issues and follow-up items not to be fixed immediately), ask the user: "Do you want to record these in `openspec/todo.md` backlog pool?" — pooling = recording as backlog candidates, to be picked from the pool during `/td-propose`, not occupying WIP.

- User agrees → following `td-propose`'s `references/todo-format.md` format, write entries to the todo section of `openspec/todo.md` (`- [ ] one-sentence description`; if file does not exist → create it).
- User declines → skip, non-mandatory.

### 6. Trigger remediation

For each severe issue, trigger the corresponding constraint skill for remediation:

| Severe issue type | Constraint skill triggered |
|---|---|
| Critical chain buffer compressed | `critical-buffer` (re-plan tasks) |
| Agent made the decision itself | `human-in-loop` (go back and ask the user) |
| Reversible decision closed prematurely | `delay-decision` (reopen the decision) |
| Too many changes open simultaneously (WIP exceeded) | `wip-limit`'s "hard constraint + override mechanism" (block the next `/td-propose` or `/td-apply` until the user archives one or explicitly overrides) |
| Local optimum but global imbalance | `human-in-loop` (let the general design department judge). This workflow has no dedicated "global imbalance" constraint skill — this judgment must be made by the general design department, not by the agent itself (keynote principle 2) |

Note: This table is a problem→remediation mapping; each constraint skill's "Trigger timing" section already reverse-declares "when triggered for remediation by `/td-system-audit`."

### 7. Re-run audit after fix to close the loop

After severe issues are remediated, **re-run the audit of the same scope**, confirming:

- The previous severe issues have been eliminated
- The remediation action did not introduce new "local optimization creating global imbalance"

Re-run at most 3 times. If severe issues remain after 3 runs → trigger `human-in-loop` to let the user decide how to handle it (continue fixing, adjust scope, or accept residual risk).

Not re-running = the loop is not closed; the problem may return in a different form.

## Guardrails

- Audit is not "nitpicking and finding fault"; it is "the periodic self-check of the general design department" — the tone should be constructive
- The audit report must include "suggested next actions," not just "you got this wrong"
- Do not audit too frequently — once per change is sufficient; doing it more often turns into formalism
