---
name: field-assessment
description: Assess the profile × tier in the field and inject constraint strengths. When any constraint skill is activated, consult this skill to confirm the strength under the current profile × tier.
user-invocable: false
---

# Field Assessment (profile × tier assessment + strength injection)

This skill is the **configuration entry point** referenced by all profile / tier / constraint skills: it assesses the profile × tier in the field and injects the values from the three strength tables into the session context.

## Served Keynote Principle(s)

**Systems-engineering keynote principle 4: open complex giant system.** A complex giant system cannot be subjected to one uniform set of constraint strengths—it must be treated in layers according to system scale (tier) and field state (profile). This skill is the engineering entry point for this principle.

## Content Layout

This skill is the configuration entry point; the actual content lives in the four files under `references/` (strength matrix / audit frequency / identification flow / subsystem independent tiering). Downstream skills read these four files through the `field-assessment` identification flow.
## How It Is Referenced

Step 1 of every td-* skill invokes the identification flow of this skill (`references/identification-flow.md`), assesses `$_TD_PROFILE` / `$_TD_TIER`, and reads Table 1 + Table 2 (+ Table 3, needed by archive / apply / system-audit) into context.
