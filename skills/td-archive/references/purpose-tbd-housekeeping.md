# Purpose TBD Housekeeping

A sub-flow of `td-archive` Step 4. When `openspec archive` syncs the main spec, the newly generated main spec `## Purpose` section retains the td-archive template default `TBD - created by archiving change <name>. Update Purpose after archive.` — this is a known sync side effect, and TBD must not be left to the next audit.

## When to trigger

Execute immediately after sync completes (`openspec archive` finishes running); do not defer to the next audit.

## Steps

1. Read all main specs involved in this archive (i.e., those `openspec/specs/<capability>/spec.md` whose `specs/` delta from the change covers).
2. For each main spec, check whether the `## Purpose` section is still the `TBD` template default (grep `^TBD - created by archiving` will match).
3. If matched → **write within this step**: based on the archived change's proposal "What Changes" section, write a one-sentence Purpose for each TBD main spec (describing what this capability is and what problem it solves). After writing, grep again to confirm no residual TBD.
4. If all main specs' Purposes are already non-TBD → skip; do not disturb the user.

## Positioning

This is housekeeping, not the core archival action — but leaving TBD residuals will cause subsequent `/td-system-audit` to repeatedly report the same issue. This check ensures "archiving = closed loop."
