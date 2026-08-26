---
name: profile-greenfield
description: Zero-start project profile. Repo is empty or only has scaffolding. full SDD, WIP limit starts up.
user-invocable: false
---

# Profile: Greenfield (zero start)

## Trigger Conditions

- Repo just init'd, no runnable code
- Only scaffolding (`create-react-app` output / `cargo new` output / etc.)
- File count < 10, and no business logic

## Default Activated Layers

| layer | strength |
|---|---|
| OpenSpec contract layer | **strong**: proposal first, "systems engineering impact assessment" must be filled in |
| Behavior layer (skills) | **strong**: full SDD, brainstorming → writing-plans → TDD → review → verify all the way through |
| Engineering management constraint layer | **medium**: WIP limit starts up, brooks-law reminder, delay-decision strong |

## Constraint Strength Under Each tier

This profile does not change constraint strength: strength is determined by tier (see the "Convention for Downstream Strength References" section of the `field-assessment` identification flow).

## Special Rules

### 1. `/td-explore` first, then `/td-propose`

The most common mistake in greenfield is "I thought of it, so I'll build it." explore at least 2 candidate directions before proposing.

### 2. Initial spec establishment

The first `/td-propose` doesn't just create a change—it also establishes the initial spec under `openspec/specs/`. This is the baseline.

### 3. Avoid the "perfect architecture" trap

Greenfield easily falls into "design the architecture perfectly first." Use the delay-decision skill—make reversible decisions simply first, and revisit when there's enough information.

### 4. tier relaxation takes priority

When this profile's "behavior layer strong: full SDD" conflicts with `tier-small`'s "no heavy process required," **tier prevails**—tier determines constraint strength and process weight, while profile only determines process emphasis (greenfield emphasizes the complete explore→propose path, but does not change the strength of each tier). greenfield × small → process is simplified; greenfield × medium/large → full SDD.

## Switching to Other profiles

- Project has runnable code + real users → switch to `profile-maintenance`
- Project code volume exceeds scaffolding but not yet live → switch to `profile-brownfield` (but this scenario is rare; typically it goes directly from greenfield to maintenance)
