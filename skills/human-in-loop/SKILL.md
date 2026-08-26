---
name: human-in-loop
description: When the agent must stop and wait for the user to decide. Serves systems-engineering keynote principle 2 (General Design Department) and principle 3 (Meta-Synthesis).
user-invocable: false
---

# Human in the Loop

## Dependent Skills

- `delay-decision`
- `wip-limit`
- `brooks-law`
- `field-assessment`

## Served Keynote Principle(s)

**Systems-engineering keynote principle 2: General Design Department.** In a giant system, some judgments must be left to the general design department and cannot be decided by the subsystem engineers (the agent) themselves.

**Systems-engineering keynote principle 3: Meta-Synthesis.** Qualitative judgment + data + models → iterative refinement. Humans are the source of qualitative judgment; machines are the processors of data and models; the two must be combined.

## Rules

### Scenarios That Must Stop and Wait for the User to Decide

1. **Public contract changes:** API shape, database schema, configuration file format, externally committed behavior
2. **Irreversible decisions** (see the `delay-decision` skill)
3. **Production-environment impact:** deployment, migration, permission changes, data modification
4. **Impact beyond the current change scope:** the change affects code or systems outside the change
5. **The agent's own confidence is low:** the agent is unsure whether the approach aligns with the user's intent
6. **WIP hard-constraint override:** triggered by `wip-limit`'s override flow (see `wip-limit`'s "Hard Constraint + Override Mechanism" section, step 4). Within the override loop, this skill is responsible for "describe risk + list options + wait for user confirmation"; the loop orchestration is held solely by `wip-limit`.
7. **When triggered for remediation by `/td-system-audit`:** when audit finds the "locally optimal but globally imbalanced" or "the agent decided something it should have asked the user about" problem, trigger this skill to let the user (the general design department) judge whether this is a real global imbalance or an acceptable local optimization (corresponding to `td-system-audit` step 6's problem→fix mapping table).

### Intensity Stacking Rules

Categories 1–5 above are the **universal baseline**, in effect across all profile × tier combinations — this is the lower bound of "must stop."

`field-assessment` Table 1, row 5, defines each tier's human-in-loop **extra trigger conditions** (e.g., tier-large's "+ general design document review"; tier-small / tier-medium have no extra conditions). Table 2 defines each profile's **scenario bonuses** (e.g., brownfield's "+ before modifying old code"; maintenance's "+ before production-environment changes").

Final effective intensity = categories 1–5 universal baseline **+** Table 1 tier bonus **+** Table 2 profile bonus; all three stack and are all in effect, not replacing each other. When Table 2's profile bonus overlaps with a baseline scenario (e.g., brownfield's "before modifying old code" and baseline category 4's beyond-scope scenario, or maintenance's "before production-environment changes" and baseline category 3), the stacking is just emphasis and is not contradictory.

**Stacking semantics for categories 6 and 7:** category 6 (WIP override) and category 7 (audit-triggered remediation) are **trigger channels for specific flows** and **do not participate in profile × tier stacking** — they are triggered by the `wip-limit` override flow and `/td-system-audit` respectively, independent of profile/tier intensity. But the `brooks-law` / `critical-buffer` assessments triggered within the override flow still execute at the current tier's intensity.

### Scenarios That Do Not Need to Stop

1. The "first move forward with the simplest approach" of a reversible decision
2. Implementation details within an already-closed design framework
3. verification steps (unless they fail and the agent does not know how to fix them)

## Trigger Mechanism

This skill does not rely on hooks to force compliance; it relies on the agent's own awareness to recognize the scenarios above. When the agent recognizes any of the category 1–5 scenarios above, it **must pause**, stop and ask the user, and **must not advance on its own**.

## What the Agent Should Do When Triggered

1. Describe the current state: "I am doing X, and I have reached decision point Y"
2. List the options + the impact of each
3. Give the agent's recommendation + the reasoning for the recommendation
4. Wait explicitly: "Please decide; I will wait for your reply before continuing"

## What Not to Do

- Do not "ask about" every single action — that is harassment, not human-in-the-loop
- Do not repeatedly stop after the user has explicitly authorized "go ahead on your own" — within the scope the user has authorized, the agent advances autonomously

## Relationship with Other Skills

- Works with `delay-decision`: reversible decisions are delayed, but when an irreversible point is touched during the delay period, this skill triggers
- Works with `brooks-law`: when the user considers "adding people," `brooks-law` reminds, and this skill requires the user to explicitly confirm
- Works with `wip-limit`: when the user wants to force-solve more changes in parallel than the wip-limit upper limit, `wip-limit` hard-blocks, and this skill requires the user to explicitly confirm the risk within the override flow (category 6)
