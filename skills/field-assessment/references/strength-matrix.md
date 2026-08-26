# Strength Matrix (single source of truth)

This file is the single source of truth for Table 1 + Table 2, read in through the `field-assessment` identification flow by downstream skills (see the "### 5. Inject Strength" section in `identification-flow.md`). To change strength values, edit only this file.

## Table 1: strength of the 5 constraints across 3 tiers

| constraint | tier-small | tier-medium | tier-large |
|---|---|---|---|
| `wip-limit` | upper limit 5 | upper limit 4 | upper limit 3 |
| `critical-buffer` | 20% project buffer | 35% project buffer | 50% project buffer |
| `brooks-law` | not enforced | reminder | enforced |
| `delay-decision` | strong | strong | strong |
| `human-in-loop` | — | — | + general design document review |

### Semantic notes for Table 1, row 5 (human-in-loop)

**Row 5 of Table 1 is a tier-specific additional trigger condition layered on top of the human-in-loop skill's generic baseline of types 1–5; it is not an absolute strength value.** The generic baseline of types 1–5 is in effect under all profile × tier combinations—this is the "must stop" floor.

- tier-small "—": no additional tier trigger condition; only the generic baseline of types 1–5 applies.
- tier-medium "—": no additional tier trigger condition; only the generic baseline of types 1–5 applies ("public contract changes" belong to baseline type 1, effective in all tiers, and are not repeated here as a tier addition).
- tier-large "+ general design document review": in addition to the baseline, the general design document requires review, which triggers human-in-loop as an extra condition.

### Calculation basis for the Table 1 critical-buffer row

**project buffer = total estimated time of the critical chain × Table 1 critical-buffer row ratio** (per the current tier). It is not the sum of individual task estimates, nor a percentage of the total project duration.

**feeding buffer**: the feeding buffer ratio at a tributary merge point = **tributary chain estimated time × Table 1 critical-buffer row ratio for the same tier**. The feeding buffer uses the same ratio as the project buffer; only the calculation basis changes to the tributary chain estimated time.

tier-small's 20% project buffer is below the CCPM standard (typically 30%). tier-small retains 20% based on the assumption of low uncertainty in small systems; if a tier-small project actually has high uncertainty (e.g., new tech stack, unfamiliar domain), the agent should proactively suggest raising the buffer ratio to 30%.

### Table 1 annotations (3 tiers × 5 constraints)

This table merges the "constraint strength" annotations from the three tier skills to avoid repetition in three places.

| constraint | tier-small annotation | tier-medium annotation | tier-large annotation |
|---|---|---|---|
| `wip-limit` | small systems allow slightly more parallelism | medium systems begin to have coordination costs from parallelism | parallel work in large systems = hard solution = loss of control |
| `critical-buffer` | lower uncertainty | medium uncertainty | highest uncertainty |
| `brooks-law` | small team, adding headcount has limited impact, not enforced | medium team, adding headcount requires onboarding consideration, reminder | large system, adding headcount almost certainly slows things down, enforced |
| `delay-decision` | Table 1 says "strong" (strong in all three tiers). Small systems have low rollback cost, so delay is even more appropriate—this is the specific meaning of "strong" in small systems | strong | strong (delay only at module level and below; top-level architecture goes into the tier-large general design document, not handled via delay-decision) |
| `human-in-loop` | — (no additional tier trigger condition; only the human-in-loop skill's generic baseline of types 1–5 applies) | — (same as tier-small; public contract changes belong to baseline type 1, not repeated as a tier addition) | + general design document review |

## Table 2: profile-specific scenario additions for human-in-loop

Table 2 lists only **profile-specific** scenario additions—the tier baseline's additional trigger conditions are already defined in Table 1, row 5, and are automatically layered on; they are not repeated in Table 2.

| profile | tier-small | tier-medium | tier-large |
|---|---|---|---|
| `profile-brownfield` | — | + before modifying old code | + before modifying old code |
| `profile-maintenance` | — | + before production environment changes | — |

`profile-greenfield` has no profile-specific scenario additions beyond the tier baseline (its strength is the tier baseline from Table 1, row 5), and is not listed separately.

"—" means that cell has no profile scenario addition; only the tier baseline from Table 1, row 5 applies. The two profiles with additions do not have additions beyond the tier baseline under tier-small.

Final human-in-loop strength = `human-in-loop` skill's generic baseline of types 1–5 ∪ Table 1, row 5 tier additions ∪ Table 2 profile scenario additions. The three are layered, not substituted.

### Notes on Table 2 profile-maintenance × tier-large

Strength under maintenance × large is determined by the tier-large Table 1 row (wip-limit upper limit 3 / critical-buffer 50% / brooks-law enforced / delay-decision strong / human-in-loop + general design document review). profile-maintenance only determines process emphasis (lightweight proposal + production stability) and does not change these strengths.

system-audit is periodic, determined by Table 3 (`audit-frequency.md`), and is not within the scope of Table 2.

Table 3 (system-audit frequency) is in `audit-frequency.md`—audit frequency's co-occurrence parties differ from constraint strength, so it is kept as a separate file.
