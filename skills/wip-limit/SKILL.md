---
name: wip-limit
description: Limit the number of simultaneously active changes. Serves systems-engineering keynote principle 4: open complex giant systems cannot be force-solved in parallel.
user-invocable: false
---

# WIP Limit

## Dependent Skills

- `brooks-law`
- `critical-buffer`
- `human-in-loop`
- `field-assessment`

## Served Keynote Principle(s)

**Systems-engineering keynote principle 4: Open Complex Giant System.** A complex giant system cannot be force-solved in parallel. Opening too many changes at once means their mutual interactions cannot all be held by the agent simultaneously — every change gets abandoned halfway, and overall performance declines.

"Cannot be force-solved in parallel" is a hard constraint, not a suggestion — violation means system imbalance. But Qian Xuesen's systems engineering also respects the "triggered not forced" philosophy: the hard constraint blocks by default, is relaxed when the user explicitly overrides, and triggers an additional mandatory reminder upon override.

## Rules

The upper limit on simultaneously active changes is taken from the wip-limit row of Table 1 for the current tier (Table 1 is in `field-assessment/references/strength-matrix.md`).

"Active" definition: a change that has been `/td-propose`-d but not yet `/td-archive`-d.

### Hard Constraint + Override Mechanism

The WIP upper limit is a hard constraint; violation must have control-flow consequences. Execution rules:

1. **Detect:** `/td-propose` or `/td-apply` reads the current number of active changes during its pre-check and compares it to the wip-limit upper limit.
2. **Below the limit:** continue execution.
3. **At the limit (default hard block):**
   - Block the current `/td-propose` or `/td-apply`; do not execute subsequent steps.
   - Tell the user: "Under tier-XXX the WIP limit is N, and there are currently N active. Force-solving a complex giant system in parallel creates global imbalance (keynote principle 4)."
   - Offer two options: (a) `/td-archive` one first, then propose/apply; (b) explicitly override.
   - Wait for the user's decision.
4. **Override flow (when the user chooses to override)** — this skill is the single orchestration point for the override loop; the sub-step sequence is as follows:

   a. Trigger the `brooks-law` mandatory reminder (coordination cost reflection before adding people).
   b. Trigger `critical-buffer` assessment (the impact of parallel changes on the critical chain, see `critical-buffer`'s "Implicit Buffer Compression" section).
   c. Invoke `human-in-loop` category 6 to execute the "explicit confirmation of risk" loop (`human-in-loop` only does "describe risk + list options + wait for user confirmation" within this loop; the sequence is orchestrated by this section).
   d. After the user confirms, record "overrode WIP limit, user has confirmed the risk" in the change's `proposal.md` — as input for subsequent `/td-system-audit`.
   e. Only then continue executing subsequent steps.

## Trigger Timing

- The user wants to `/td-propose` a new change, but the number of active changes has reached the limit
- The user wants to advance multiple changes at once
- **Post-override second detection:** after the user explicitly overrides a WIP violation, the next time `/td-propose` or `/td-apply` again detects a WIP violation, this skill should additionally prompt within the override flow: "The last time was already an override; consecutive overrides will completely nullify the WIP hard constraint" — to prevent override abuse.
- **When triggered for remediation by `/td-system-audit`:** when audit finds the "too many changes open simultaneously (WIP exceeded)" problem, trigger this skill's "Hard Constraint + Override Mechanism" section, blocking the next `/td-propose` or `/td-apply` until the user archives one or explicitly overrides.

## What the Agent Should Do When Triggered

Execute the "Hard Constraint + Override Mechanism" in the `## Rules` section (the authoritative flow is in that section; not repeated here).

## What Not to Do

- Do not auto-archive the user's changes
- Do not hide the rules to let the user "do as they please" — free rein in a complex system is loss of control
- Do not "just warn and let it pass" — a hard constraint must block or require override; "warn and pass" degrades a hard constraint to a soft constraint (violating the hard-constraint semantics of keynote principle 4's "cannot be force-solved in parallel")
- Do not "blanket prohibit" — the hard constraint + override mechanism preserves the triggered philosophy; the constraint is relaxed when the user explicitly overrides
- Do not allow override abuse — escalate reminder intensity on consecutive overrides (see the "Post-override second detection" in the `## Trigger Timing` section)
