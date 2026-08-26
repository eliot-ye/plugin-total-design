---
name: delay-decision
description: Premature closure of reversible decisions loses information. Serves systems-engineering keynote principle 3 (Meta-Synthesis from Qualitative to Quantitative).
user-invocable: false
---

# Delay Decision

## Dependent Skills

- `td-explore`
- `tier-large`

## Served Keynote Principle(s)

**Systems-engineering keynote principle 3: Meta-Synthesis from Qualitative to Quantitative.** Understanding ascends from qualitative to quantitative through iterative refinement; premature closure loses information.

Derived from the "decide as late as possible" principle of Lean software development (Poppendieck). The premise is Qian Xuesen's meta-synthesis method — a decision is not "choose the best at a certain moment," but "preserve reversibility while continuously collecting information, and close only when you must."

## Rules

### Distinguish Two Types of Decisions

| Type | Example | Handling |
|---|---|---|
| **Reversible decision** (two-way door) | Which library to choose, naming style, internal API shape | Delay; first move forward with the simplest approach, and come back to decide when information is sufficient |
| **Irreversible decision** (one-way door) | Database selection, public API, deployment architecture | Decide early; must `/td-explore` thoroughly before deciding |

### Hierarchy of Decisions

The reversible/irreversible dichotomy is flat; it does not account for **the system level at which the decision resides**. Qian Xuesen's systems engineering emphasizes "the hierarchical structure of systems" (keynote principle 4's "hierarchical view"); decisions at different levels have different reversibilities:

| System level | Decision example | Default reversibility |
|---|---|---|
| **Top-level architecture** (system level) | System boundaries, subsystem partitioning, cross-subsystem contracts | Usually irreversible — changing top-level architecture ripples through all subsystems |
| **Module design** (subsystem level) | Internal module structure, intra-subsystem API shape | Usually reversible — internal subsystem refactoring does not affect other subsystems |
| **Implementation details** (component level) | Naming, helper function shape, comment style | Almost always reversible — low change cost, small impact scope |

This hierarchy correlates strongly with tier:

- **tier-small:** the system is flat; the three levels collapse into one; the reversible/irreversible dichotomy is sufficient.
- **tier-medium:** the system has clear module/subsystem boundaries; top-level architecture decisions and module design decisions need to be treated by level.
- **tier-large:** the system is multi-level nested; top-level architecture decisions should be captured by a "general design document" (see `tier-large`'s "General Design Document Required" section), rather than being handled by delay-decision alone.

**Execution rule:** when `$_TD_TIER == tier-large` and the current decision belongs to the top-level architecture level, this skill should prompt the user: "Top-level architecture decisions should go into the general design document required by `tier-large`, rather than being handled by delay-decision alone."

### Delay Is Not Procrastination

What is delayed is the "final decision," not "starting to act." During the delay period:

- Move forward using stub / mock / interface
- Collect real signals from usage scenarios
- Keep runnable examples of 2–3 candidate approaches

### Trigger Timing

- The user hesitates on a design point during `/td-propose`
- The agent itself writes "let's pick approach A first, and change later" in `design.md` — this phrasing needs checking: is A reversible?
- Multiple candidate approaches are still on the table and the user wants to "just pick one"
- **When triggered for remediation by `/td-system-audit`:** when audit finds the "reversible decision closed prematurely" problem, trigger this skill to reopen the decision.
- **Connection to `td-explore`:** the `td-explore` phase's "do not persist spec" is essentially delay-decision (not closing the spec, waiting for more information before proposing; see the "Connection to `delay-decision`" paragraph in `td-explore` step 4). When the user wants to "hurry up and propose to close the spec," this skill triggers a reminder that "forcing closure when information is insufficient will lose information" (keynote principle 3, meta-synthesis).

## What the Agent Should Do When Triggered

1. Determine whether the current decision is reversible or irreversible
2. If reversible: suggest first moving forward with the simplest approach, delaying the decision until "information is sufficient" (define the criterion for "sufficient")
3. If irreversible: suggest first running `/td-explore`, and not forcing closure when information is insufficient
4. Explicitly annotate in `design.md`: `[reversible decision - delayed]` or `[irreversible decision - closed on YYYY-MM-DD]`

## What Not to Do

- Do not twist "delay decision" into "decide nothing" — that is a slacker's guide, not a Lean principle
- Do not blanket-delay all decisions — deciding irreversible decisions early is discipline
