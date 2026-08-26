---
name: td-propose
description: Creates a change and generates proposal/design/tasks artifacts. The OpenSpec contract-layer entry point. Trigger scenarios: the user says "propose a change", "propose", "start a new change", "create a proposal", "want to build feature X".
user-invocable: true
argument-hint: <change-name or description>
---

# td-propose

The OpenSpec contract-layer entry point. Before writing code, establishes a contract between human and AI about "what to build and why build it this way".

## Dependent Skills

- `system-engineering`
- `field-assessment`

## Served Keynote Principle(s)

**Systems-engineering keynote principle 3: meta-synthesis from qualitative to quantitative.**

The "systems-engineering impact assessment" section in the proposal is the engineering embodiment of this principle — the agent must not only write the "what" and "how", but also "what impact this will have on the system as a whole", completing the meta-synthesis from qualitative to quantitative. The "expected behavior model" field within it is the "model" carrier of meta-synthesis (see the "Model Carrier" section under the "Four Keynote Principles" in `system-engineering`).

**Engineering Cybernetics feedback control loop placement**: propose is the feedforward control stage (establishing the control target "expected behavior model", which is detected in real time during `/td-apply` step 7.2 and post-corrected during `/td-archive` step 3).

## Input

#### Can be:

- **A kebab-case change name**: e.g. `add-user-auth`
- **A natural language description**: the agent derives a kebab-case name from it
- **Empty**: use the ask-user mechanism to ask the user "what change do you want to make"

#### Content

`$ARGUMENTS`

## Steps

### Step 1. Activate keynote and configuration layer

Activate the keynote and configuration layer. Only inject strengths without making judgments; execute the following three-step sequence:

1. **`system-engineering`** — The four keynote principles enter the context. Every judgment in propose is made within the framework of the four keynote principles.
2. **profile × tier identification** — Call `field-assessment`, read `$_TD_PROFILE` / `$_TD_TIER`, load Table 1 (5 constraint strengths) + Table 2 (human-in-loop modifiers). Cached within the session; subsequent steps reference it directly.
3. **Remaining constraints** — Only read strength values into context; do not judge whether they trigger in this step — subsequent steps use these to judge whether wip-limit / human-in-loop triggers.

### Step 2. Read site context (config.yaml context)

Read the `context` field of `openspec/config.yaml` (tech stack, conventions, domain knowledge, etc.) as the site context for subsequent proposal/design. This context information directly feeds into the judgment basis of the proposal's "systems-engineering impact assessment" section.

**First-run guided fill**: If the `context` field is empty, commented out, or still the template default, automatically explore the needed information, ask the user key questions when necessary, and after getting answers write them into the `context` field of `openspec/config.yaml`. This is a one-time investment — all subsequent `/td-propose` / `/td-explore` calls will read it.

Guided question examples:

- "What is the project's primary tech stack?" (e.g. TypeScript / Rust / Python / mixed)
- "What conventions does the team follow?" (e.g. conventional commits / code style guides / PR templates)
- "What domain is the project in?" (e.g. e-commerce / infra / internal tools)

User answers → write to config.yaml → continue to Step 3. User skips → leave empty, continue to Step 3 (non-blocking).

### Step 3. Trigger precondition checks

Against the strengths injected in Step 1 and the current change state, determine whether the following trigger:

- `wip-limit` (hard blocking + override): Has the number of active changes reached the limit? If yes → **block this step, do not execute Step 4**; execute the "hard constraint + override mechanism" section of `wip-limit` (authoritative description is in that skill; after override passes, continue to Step 4).
- `human-in-loop`: Is the user's description clear enough to propose? If unclear → use the ask-user mechanism to ask "what change do you want to make".
- **TODO pool check**: Read `openspec/todo.md` (if it doesn't exist → skip this sub-item, treat as empty pool, do not proactively create the file). The main entry / change sub-item / priority / sectioning rules for todo.md are in `references/todo-format.md`.
  - List all **unchecked** (`- [ ]`) main entries as the candidate pool, **present sorted by priority** (P0 → P1 → P2; unlabeled treated as P2).
  - If the input content is empty or the user has no explicit change description → ask the user to pick an entry from the candidate pool (or "skip, just describe a new change"). If the user picks an entry → derive the change name from the entry's semantics.
  - If the user has given an explicit description → check whether any main entry in the candidate pool semantically overlaps; if so, prompt the user "there's already a similar entry in the TODO pool, want to propose based on it?" — the same main entry can carry multiple changes (one sub-item appended per change), which does not count as duplicate change creation.
  - The candidate pool is the backlog (can be infinitely large); only active changes count as WIP — having candidates in the pool does not cause blocking; only the active change count triggers `wip-limit`.
- **brownfield reverse-spec check**: If `$_TD_PROFILE == profile-brownfield`, check whether `openspec/specs/` already has a baseline spec for the relevant subsystem. If not → trigger `human-in-loop`, prompting the user "you haven't yet built an understanding of the existing system; proposing big changes is risky. Run `/td-reverse-spec` first?" — after the user agrees, execute `/td-reverse-spec` to establish the baseline, then return to this step to continue propose.
- **greenfield explore check**: If `$_TD_PROFILE == profile-greenfield` and `openspec/specs/` is empty (initial spec not yet established), check whether exploration has already been done in this session. Criterion: whether the session history contains a `/td-explore` call or a `brainstorming` trigger, and the artifacts contain **at least 2 candidate directions** (each candidate direction annotated with systems-engineering impact; see `td-explore` step 4's artifact requirements). If not → trigger `human-in-loop`, prompting the user "the most common mistake in greenfield is 'build as soon as you think of it'. Want to `/td-explore` at least 2 candidate directions before proposing?" — after the user agrees, execute `/td-explore`, then return to this step to continue propose.

### Step 4. Create the change directory

```bash
openspec new change "<name>"
```

**If this change came from a TODO pool entry** (the one picked in Step 3): after creation, write back to `openspec/todo.md`, adding a **new change sub-item** under that main entry: `  - [ ] change: <name>` (indent two spaces; when the same main entry carries multiple changes, append multiple sub-items, one per change). **Do not check off the main entry** — checking off is the responsibility of `td-archive`, and only after all change sub-items under a main entry have been archived. The change sub-item is the anchor that `td-archive` uses to locate the corresponding entry.

**The linkage direction is todo.md → change sub-item** (the todo.md side marks "this change came from me") — the change artifacts (proposal/design/tasks) must still not contain any reference to `openspec/todo.md` (see Guardrails "proposals do not reference the TODO pool").

### Step 5. Get artifact build order

```bash
openspec status --change "<name>" --json
```

Parse the JSON to get `applyRequires`, `artifacts`, `planningHome`, `changeRoot`, `artifactPaths`, `actionContext`.

### Step 6. Loop-create artifacts (with required-field checks)

Use the task-tracking tool to track progress. The loop body executes the following four sub-steps for each artifact; only proceed to Step 7 after all `applyRequires` artifacts are done and all required fields pass.

**6.a Merge existing in-session exploration artifacts**: If this session has already produced `brainstorming` spec drafts or `td-explore` candidate direction assessments (in conversational form or written to disk as drafts), merge the candidate direction trade-offs and "systems-engineering impact" assessments into the proposal skeleton as input for the required fields in 6.c. If no artifacts exist, skip this and build directly from template.

**6.b Create artifact**:

```bash
openspec instructions <artifact-id> --change "<name>" --json
```

- Read `template` as structure
- Apply `context` and `rules` as constraints — **do not copy them into the artifact file**
- Read completed dependency artifacts as context
- Write to `resolvedOutputPath`

greenfield special case: If `$_TD_PROFILE == profile-greenfield` and `openspec/specs/` is empty, the first change's proposal must also establish the initial spec baseline — this is the impact assessment basis for all subsequent changes.

**6.c Required-field check** (done immediately after writing each artifact; if missing → go back to 6.b to fill in, do not proceed to 6.d):

- **proposal.md required section: systems-engineering impact assessment**

```markdown
## Systems-Engineering Impact Assessment

(Serves systems-engineering keynote principle 3: "meta-synthesis from qualitative to quantitative" — expert judgment + data + models iteratively elevated to quantitative understanding)

- Subsystems affected:
- Expected overall performance change:
- Is this local optimization or global coordination:
- If local optimization, risk to global coherence:
- Expected behavior model: What is the expected system behavior of this change? What data/tests verify this expectation? (This is the "model" carrier of meta-synthesis — see the "Model Carrier" section under the "Four Keynote Principles" in `system-engineering`)
```

A proposal without this section is not apply-ready.

**Execution semantics of the "expected behavior model" field**:

- This field is one of the anchor points for the "actual vs expected" review in `/td-archive` step 3 — during archive, the question "was the expected behavior model validated by actual behavior? If not, how does the model need to be corrected?" must be answered.
- This field is also an input for `/td-apply` step 7.2 system-level verification — system-level verification must verify whether the "expected behavior model" still holds after cross-subsystem integration.

- **proposal.md required: tier-large general design document**

If `$_TD_TIER == tier-large`, the proposal must include a "general design document" with 4 required fields:

1. This change's position in the system hierarchy
2. All subsystems affected
3. Relationship to the most recently archived change
4. Whether cross-subsystem coordination is triggered

(The single source of truth for field definitions is in the "General design document is mandatory" section of `tier-large`)

Without this document, the proposal is not apply-ready. This check is symmetric with `td-apply` step 2's precondition check — tier-large's general design document requirement is validated at both propose and apply, preventing missed checks.

- **tasks.md required: critical chain annotation and project buffer**

tasks.md must:

- Annotate the critical chain: which task sequence is the project's critical path
- Leave a project buffer: at the ratio for the current tier (look up the critical-buffer row in Table 1, already cached in-session; Table 1 is in `field-assessment/references/strength-matrix.md`)

Insufficient granularity → trigger `writing-plans` to refine; unclear annotation → refer to the annotation spec in the `critical-buffer` skill.

**6.d Loop judgment**:

```bash
openspec status --change "<name>" --json
```

Check whether each artifact ID in `applyRequires` has `status: "done"`. If not done → go back to 6.b to process the next one; if all done and all required fields pass → proceed to Step 7.

### Step 7. Architecture review (after proposal is finalized)

After all artifacts are created, **do an architecture review before entering implementation**.

Call the architecture review of `requesting-code-review` (see Section 5 of that skill); the review target is the proposal's subsystem partitioning and design decisions. The checklist is in that skill's `references/architecture-review-checklist.md`.

Severity definitions are in `requesting-code-review` Section 5 (critical / warning / nit, single source of truth). This step only holds the blocking loop: critical (bad subsystem partitioning / circular dependencies / implicit dependencies) → block, go back to Step 6 to revise the proposal then re-review; warning → record to the proposal, can be deferred; nit → can be ignored.

Only after the architecture review passes (no critical) do we proceed to Step 8.

### Step 8. Display final status

```bash
openspec status --change "<name>"
```

Output:

- Change name + location
- List of created artifacts + brief description
- Architecture review result: passed / has warnings (recorded)
- "All artifacts created! Ready for implementation."
- "Run `/td-apply` to start implementing."

## Guardrails

- Create all artifacts required by `applyRequires`; cannot skip
- Always read dependency artifacts before creating a new artifact
- `context` and `rules` are constraints for you, not file content
- After writing each artifact, verify the file exists
- If the change name already exists, ask the user whether to continue or create new
- **Proposals do not reference the TODO pool**: change artifacts such as proposal/design/tasks **must not contain** any reference to `openspec/todo.md` (paths, entry descriptions, priorities, sub-item annotations) — TODO pool information only exists in todo.md; the backlog is the candidate layer, change artifacts are the contract layer, and the two layers are isolated. TODO pool entries are only associated through change sub-items under main entries, and do not enter the artifact body text.
