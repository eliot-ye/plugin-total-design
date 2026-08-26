---
name: td-reverse-spec
description: For taking over an existing project: first reverse-spec the existing code, then propose changes. Trigger scenarios: the user says "taking over a project", "reverse spec", "reverse-engineer the spec", "look at the existing code", "just took over this repo".
user-invocable: true
argument-hint: <existing-codebase-path or empty for cwd>
---

# td-reverse-spec

When taking over an existing codebase mid-flight, directly `/td-propose` changes is dangerous — you don't know what the existing code looks like at the spec layer. reverse-spec first reverse-engineers the spec from the code, establishes a baseline, then proposes changes on top of that baseline.

## Dependencies

- `system-engineering`
- `field-assessment`

## Served Keynote Principle(s)

**Systems-engineering keynote principle 2: General design department.**

reverse-spec is the work of the general design department during the handover phase — first establish the system's global view, then decide where to act.

**Systems-engineering keynote principle 4: Open complex giant system.**

Do not reduce and decompose simplistically; instead, first identify the layers (subsystem partitioning), then build understanding at each layer.

## Input — the codebase path to reverse-spec. Empty means current working directory

`$ARGUMENTS`

## Steps

### 1. Activate keynote and configuration layer

Activate keynote and configuration layer. Only inject strengths, do not make judgments; execute the following three-step sequence:

1. **`system-engineering`** — The four keynote principles enter context. reverse-spec is the work of the general design department during the handover phase — first establish the system's global view, then decide where to act.
2. **profile × tier identification** — Call `field-assessment`, read `$_TD_PROFILE` / `$_TD_TIER`, load Table 1 + Table 2. Cache within the session; subsequent steps reference directly. reverse-spec itself is the entry action for `profile-brownfield`, but tier determines the granularity of reverse-spec (small: coarse-grained is fine; large: draw subsystem interface diagrams).
3. **Other constraints** — Only read strength values into context; do not decide whether they trigger in this step.

### 2. Identify codebase state

Scan the target codebase (file count, lines of code, directory structure, presence of `tests/`/CI/`package.json`, git commit frequency), but **do not re-judge profile** — Step 1 already read and cached `$_TD_PROFILE` / `$_TD_TIER` via `field-assessment`; this step consumes them directly and does not conflict with the cache:

Taking over mid-flight is usually judged as `profile-brownfield`. If Step 1 identified another profile: `profile-greenfield` (the codebase is actually scaffolding) → reverse-spec can be coarse-grained or even skipped; see the switching rules for `profile-greenfield`. `profile-maintenance` (a live, shipped project) → reverse-spec granularity follows tier; see the switching rules for that profile.

### 3. Subsystem partitioning

From the general design department's perspective, partition the codebase into several subsystems. Partitioning criteria:

- Directory boundaries
- Module dependency graph
- Deployment units
- Data ownership boundaries

Do not go too fine — the goal is to identify at the "subsystem" level, not the "file" level. Usually 3–8 subsystems.

**Layered-view restoration**: Subsystem partitioning is the engineering instantiation of keynote principle 4's "layered view" during the reverse-spec phase. When boundaries between subsystems are clear, the partitioning result of this step is the triggering input for the `field-assessment` identification flow's "subsystem independent tiering" mechanism (execution rules in `field-assessment`'s `references/subsystem-tiering.md`).

### 4. reverse-spec each subsystem

Read the subsystem's code and reverse-engineer the spec:

- What contract does this subsystem expose externally? (API, data formats, events)
- Which other subsystems does this subsystem depend on?
- What are this subsystem's key invariants?
- What are this subsystem's known defects / tech debt?

Write output to `openspec/specs/<subsystem-name>/spec.md`.

### 5. Identify inter-subsystem interfaces

Draw the dependencies between subsystems as a graph. Identify:

- Interface stability (which are public contracts, which are internal implementation)
- Circular dependencies
- Implicit dependencies (shared database, shared configuration)

**Connection to `requesting-code-review` architecture review**: The "circular dependencies, implicit dependencies" identified in this step are exactly the checklist items under the "low coupling" dimension in `requesting-code-review`'s `references/architecture-review-checklist.md`. The interface stability identified during the reverse-spec phase is the input to the architecture review in subsequent `/td-propose` Step 7 — during architecture review, compare against the interface stability in the reverse-spec report to judge whether a new change breaks an existing subsystem's public contract.

### 6. Output reverse-spec report

Output according to the report template in `references/reverse-spec-report.md` (identified subsystems + interface diagram + each subsystem's spec location + known risks + suggested next steps).

## Guardrails

- **Do not modify original code** — reverse-spec is read-only (except for writing spec files)
- Do not reverse-spec all subsystems to perfection — the goal is to establish a baseline, not to write a textbook
- Prioritize reverse-spec of the subsystem you are **about to change**; other subsystems can be coarse-grained

## Relationship to other commands

- The outputs of reverse-spec (`openspec/specs/<subsystem>/spec.md` baseline + the reverse-spec report from Step 6) are referenced by `/td-propose`: Step 3's brownfield reverse-spec check consumes the baseline spec under `openspec/specs/` as the criterion for "established understanding," giving the proposal's "systems-engineering impact assessment" section its basis.
- reverse-spec is not directly referenced by `/td-apply` — apply reads the change's internal artifacts (proposal/design/specs/tasks), not the main spec baseline. If the baseline is merged into the main spec after archive sync, apply still does not explicitly compare against the main spec (this is td-apply's own design choice).
- `/td-archive` Step 3's "actual vs. expected" post-mortem review uses the baseline spec as one of the reference sources for "the true state before the change" (see that skill).
- `/td-system-audit` under project scope includes the main spec baseline under `openspec/specs/` as an audit object (see that skill).
