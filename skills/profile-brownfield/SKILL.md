---
name: profile-brownfield
description: Mid-project handover profile. Repo already has runnable code. reverse-spec first, TDD only for new code.
user-invocable: false
---

# Profile: Brownfield (mid-project handover)

## Trigger Conditions

- Repo already has runnable code (not scaffolding)
- No live users or just recently went live
- agent entering the repo for the first time, and the above conditions hold

## Default Activated Layers

| layer | strength |
|---|---|
| OpenSpec contract layer | **very strong**: reverse-spec first, then propose. No reverse-spec → no major proposals allowed. |
| Behavior layer (skills) | **medium**: TDD enforced only for new code, avoiding "adding tests breaks old code" |
| Engineering management constraint layer | **strong**: critical chain diagnosis, find the weakest link |

## Constraint Strength Under Each tier

This profile does not change constraint strength: strength is determined by tier (see the "Convention for Downstream Strength References" section of the `field-assessment` identification flow).

## Special Rules

### 1. reverse-spec first

First thing upon entering the repo: `/td-reverse-spec`. Establish a baseline spec.

If you `/td-propose` without reverse-spec, the agent will block: "You haven't yet built an understanding of the existing system; proposing major changes is high-risk. Do reverse-spec first?"

### 2. TDD boundary

- **New code**: full TDD (RED-GREEN-REFACTOR)
- **Refactoring old code**: add characterization tests first (lock down existing behavior), then refactor
- **Fixing old bugs**: use systematic-debugging; regression tests are mandatory

### 3. Avoid breaking old code

Before modifying old code, trigger `human-in-loop` (effective under tier-medium / tier-large—Table 2's brownfield addition; under tier-small, Table 2 is "—," so only the human-in-loop baseline of types 1–5 applies): Are you sure you want to touch this old code? Is there a smaller-scope way to change it?

## Switching to Other profiles

- Codebase goes live + has real user traffic → switch to `profile-maintenance`
- After reverse-spec, discover the codebase is actually "just-init'd scaffolding" → switch to `profile-greenfield`
