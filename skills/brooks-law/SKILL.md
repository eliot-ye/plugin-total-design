---
name: brooks-law
description: Coordination cost reminder before adding people. Serves systems-engineering keynote principle 1 (Systems Engineering) — overall coordination cost grows non-linearly with headcount.
user-invocable: false
---

# Brooks's Law Reminder

## Dependent Skills

- `critical-buffer`
- `wip-limit`
- `field-assessment`

## Served Keynote Principle(s)

**Systems-engineering keynote principle 1: Systems Engineering.** Overall performance ≠ sum of parts; coordination cost grows as O(n²) with headcount.

Brooks said in *The Mythical Man-Month*: "Adding human resources to a late software project makes it later." The premise of this law is Qian Xuesen's systems engineering — a software project is a complex system, and overall performance is not equal to the sum of each engineer's contributions.

## Rules

When the user wants to "add people" (hiring, adding agents, running multiple subagents in parallel) to speed up progress, the agent triggers this skill to remind them of three things (intensity per the brooks-law row of Table 1: tier-small does not enforce — a light reminder suffices; tier-medium reminds; tier-large enforces; Table 1 is in `field-assessment/references/strength-matrix.md`):

1. **Coordination cost:** new person onboarding time + increased communication overhead among existing members
2. **Parallelizability:** is this task truly parallelizable? Or is its critical chain serial? (See the `critical-buffer` skill)
3. **Alternatives:** before adding people, have you tried "reducing WIP," "shrinking scope," or "delaying non-critical decisions"?

## Trigger Timing

- The user says "hire another one" / "add an agent" / "run several subagents in parallel"
- The user requests parallelizing multiple subagents during `/td-apply`
- The change's `tasks.md` contains the words "multi-person collaboration" or "parallel"
- **Triggered by `wip-limit` during a WIP override:** when the user explicitly overrides a WIP violation, `wip-limit`'s override flow triggers this skill to issue a mandatory reminder (see `wip-limit`'s "Hard Constraint + Override Mechanism" section).

## What the Agent Should Do When Triggered

1. Cite the original meaning of Brooks's Law
2. List the three reflection questions (items 1/2/3 above)
3. Have the user **explicitly confirm**: "I have considered the coordination cost and still want to add people" — only then continue (tier-small does not enforce, a reminder suffices; tier-medium suggests confirmation; tier-large requires confirmation)
4. If the user confirms, record it in the change's `design.md` as a "known risk"

## What Not to Do

- Do not "blanket prohibit adding people" — Brooks's Law has boundary conditions (the task is truly parallelizable, the new person's onboarding time is sufficient, and the project still has enough time to absorb the onboarding cost)
- But these boundary conditions require the user to explicitly argue them; they cannot be assumed to hold by default
