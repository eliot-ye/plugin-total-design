---
name: tier-small
description: Small system complexity tier. 3-10 files, single team. constraints are soft-enforced, system-audit frequency is low.
user-invocable: false
---

# Tier: Small (small system)

## Assessment Basis

See the "### 3. Assess tier" section of the `field-assessment` identification flow for criteria (take the highest when any holds).

- System hierarchy: flat, no obvious subsystem boundaries

## system-audit frequency

See Table 3's tier-small row (project scope: every 5 changes completed; current-change not required; Table 3 is in `field-assessment/references/audit-frequency.md`).

## Special Rules

### 1. No heavy process required

Small systems are prone to over-engineering. profile × constraint already provides relaxation for small systems; don't run the full SDD "just because the process template says so."

### 2. Simplicity first

For any "should we introduce tool X?" decision, the default answer is "don't introduce it." The virtue of a small system is simplicity.

## Switching to Other tiers

- File count grows to 10+ → switch to `tier-medium`
- System starts to show obvious subsystems → consider `tier-medium` even if the file count is small
