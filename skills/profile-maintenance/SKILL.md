---
name: profile-maintenance
description: Live maintenance project profile. Repo is live with real users. Lightweight proposal, bugs go through systematic-debugging.
user-invocable: false
---

# Profile: Maintenance (live maintenance)

## Trigger Conditions

- Repo is live, has real user traffic
- Has CI/CD configuration
- Recent git log contains "hotfix" / "rollback" / "prod" etc.

## Default Activated Layers

| layer | strength |
|---|---|
| OpenSpec contract layer | **medium**: proposal is lightweight, spec delta in small steps |
| Behavior layer (skills) | **medium**: new features go through TDD, bugs go through systematic-debugging |
| Engineering management constraint layer | **strong**: bottleneck = deployment/review, buffer reserved for regression testing |

## Constraint Strength Under Each tier

This profile does not change constraint strength: strength is determined by tier (see the "Convention for Downstream Strength References" section of the `field-assessment` identification flow).

## Special Rules

### 1. human-in-loop must trigger before production environment changes

For changes involving the production environment (deployment, migration, permissions, data modification), the agent **must** stop and ask the user. It must not proceed on its own. This belongs to `human-in-loop` generic baseline type 3 (production environment impact), effective under all profile × tier combinations (Table 2's maintenance "+ before production environment changes" addition overlaps with the baseline—it merely emphasizes and does not change the strength).

### 2. Bugs go through systematic-debugging

Live bug fix flow:

1. `systematic-debugging` 4-phase to find root cause
2. Fix root cause, not symptoms
3. Add regression test
4. `verification-before-completion` runs full test suite
5. commit message notes root cause

### 3. critical-buffer application

The bottleneck in the maintenance field is typically:

- Deployment pipeline (can it be deployed quickly and safely)
- Code review (review cycle is long)

Reserve buffer for the bottleneck—don't let a "looks fast" hotfix compress the review buffer.

### 4. Lightweight proposal

maintenance doesn't need as heavy a proposal as greenfield. The proposal can be as short as:

```markdown
## Proposal: <change name>

### Problem
<one or two sentences>

### Change
<one or two sentences>

### Systems engineering impact assessment
- Affected subsystems: <...>
- Overall performance change: <...>
- Local vs global: <...>
```

But the "systems engineering impact assessment" section **cannot be omitted**.

## Switching to Other profiles

- System enters a "major refactor" phase → temporarily switch to `profile-brownfield` (since it's equivalent to re-inheriting)
- Just went live but no users yet → it's actually `profile-brownfield`; don't rush to switch to maintenance
