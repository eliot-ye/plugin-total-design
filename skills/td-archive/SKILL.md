---
name: td-archive
description: Archive after completion. OpenSpec contract-layer entry. Trigger scenarios: user says "archive", "wrap up", "close out", "this change is done".
user-invocable: true
argument-hint: <change-name>
---

# td-archive

Archive the change after completion. Archiving is not deletion; it is the precipitation of "completed learnings."

## Dependencies

- `system-engineering`
- `field-assessment`

## Served Keynote Principle(s)

**Systems-engineering keynote principle 3: meta-synthesis from qualitative to quantitative.**

archive is not "checking all the boxes and wrapping up"; it is "completing one meta-synthesis cycle from expected to actual." The retrospective on "actual vs. expected" before archive is the closure of this cycle.

**Systems-engineering keynote principle 2: general design department.**

Triggering a profile re-assessment after archive is the responsibility of the general design department: project state has changed, so the way of working must adjust accordingly.

**《Engineering Cybernetics》 feedback control loop aligned**: archive is the post-hoc error detection + correction link (the "actual vs. expected" retrospective is post-hoc error detection; the "model validation" field correction feeds the next propose's prediction model).

## Input - name of the change to archive. If empty, infer or ask the user.

`$ARGUMENTS`

## Steps

### Step 1. Activate keynote and configuration layer

Activate keynote and configuration layer. Inject strength values only, without making judgments — execute the following three-step sequence:

1. **`system-engineering`** — The four keynote principles enter context. archive is not "checking all the boxes and wrapping up"; it is "completing one meta-synthesis cycle from expected to actual."
2. **profile × tier identification** — Call `field-assessment`, read `$_TD_PROFILE` / `$_TD_TIER`, and load Table 1 + Table 2 + Table 3 (archive needs Table 3 to determine system-audit frequency triggers). Cache within the session; subsequent steps reference directly.
3. **Other constraints** — Only read the strength values into context; do not judge whether to trigger in this step — subsequent steps judge whether to trigger / whether tasks comply based on these.

### Step 2. Pre-checks

- Are all tasks in `tasks.md` marked `[x]`?
- Has `verification-before-completion` been run? — This includes both change-level + system-level (cross-subsystem boundary, when the proposal annotates affected subsystems) verification layers; missing either does not count as complete.

### Step 3. Mandatory "actual vs. expected" retrospective (hard step)

Before archiving, you **must** add a section "actual systems-engineering impact vs. expected" in the change — checking against the proposal's "systems-engineering impact assessment" section (including the "expected behavior model" field), item by item per the table below:

| proposal side (expected) | archive side (actual) |
|---|---|
| which subsystems are affected | subsystems actually affected |
| expected overall performance change | actual overall performance change |
| is this a local optimization or global coordination | actually a local optimization or global coordination |
| if local optimization, the risk of global失调 | actual global impact of the local optimization (keynote principle 1 post-hoc re-check) |
| expected behavior model | model validation (does actual behavior validate the expected model) |

Supplementary fields (retrospective items not covered by the table):

- unexpected side effects (these become input for the subsequent `/td-system-audit`)

**Model validation** field expansion:

- If validation passes → model holds; record "expected behavior model validated."
- If validation fails → model needs correction; record "expected behavior model vs. actual deviation: <deviation description>, model correction suggestion: <...>." This is the closure action of the meta-synthesis cycle — converting "the deviation found this time" into "a prediction model correction for the next propose" (see the "feedback control loop" section of `system-engineering`).
- If the proposal did not fill in the "expected behavior model" field (legacy change compatibility) → skip this field and do the retrospective using only the first three fields. This fallback is only for legacy changes produced by old versions; new changes must fill this field in the proposal (`td-propose` Step 6.c), so this branch should theoretically never be reached.

The retrospective has two comparison sources, stacked by the principle "use if present, degrade if absent":

1. **proposal's "systems-engineering impact assessment" section** — always present (mandatory propose item); the primary anchor on the "expected" side.
2. **main spec baseline under `openspec/specs/`** — if the subsystem modified by this change has a baseline in `openspec/specs/<subsystem>/spec.md` deposited by reverse-spec or a prior archive sync, use that baseline as one of the comparison sources for "the real state before the change." The retrospective must answer: "does the change's spec delta break any contract / invariant declared in the baseline?" **Baseline does not exist** (greenfield first change, or the subsystem was never reverse-spec'd) → skip this comparison source and do the retrospective using only the proposal's self-description; do not block archive.

Without this section, archive refuses to continue. This is the data source for `/td-system-audit`'s "actual vs. expected" audit — the loop must close.

### Step 4. archive (including sync)

```bash
openspec archive "<name>"
```

`openspec archive` does two things:
1. Moves the change from `openspec/changes/` to `openspec/changes/archive/`
2. Automatically syncs the spec delta produced by the change to the main spec

If you only want to archive without syncing specs (infra / doc-only change), add `--skip-specs`.

**TODO sub-item check-off after successful archive**: Follow the `references/todo-format.md` "check-off timing" rules from `td-propose` — read `openspec/todo.md`, find the parent entry containing a `change: <name>` sub-item, check off the corresponding sub-item; if **all sub-items under the parent entry are checked off** → check off the parent entry `[x]`; if **some sub-items remain unchecked** → keep the parent entry as `- [ ]`. If the corresponding sub-item or file cannot be found → skip; do not proactively create a file.

**Purpose TBD housekeeping check**: When `openspec archive` syncs the main spec, the newly generated main spec `## Purpose` section retains the td-archive template default `TBD - created by archiving change <name>. Update Purpose after archive.` — this is a known sync side effect, and TBD must not be left to the next audit. Immediately after sync completes, execute the sub-flow per `references/purpose-tbd-housekeeping.md` (read the affected main specs → grep `^TBD - created by archiving` → if hit, write a one-sentence Purpose within this step → grep again to confirm no residual TBD).

### Step 5. Post-archive follow-up actions

archive is the "closure point" of the contract layer; it must trigger three follow-up relays (executed in sequence):

#### 5.1 profile/tier re-assessment

After archiving one change, the project's profile may change (greenfield moving to maintenance, or brownfield entering a major refactor). **Mandatory: re-call `field-assessment`'s "identification flow" section** to re-assess `$_TD_PROFILE` / `$_TD_TIER`. The re-assessment strategy is in `field-assessment`'s `references/identification-flow.md` "### 4. Cache assessment results" section, "re-assessment strategy" paragraph — read that paragraph and execute; this section does not repeat it.

If the new assessment differs from the Step 1 cache:

- Update the session cache to the new profile/tier
- Prompt the user: "Project state has changed from `<old-profile>` × `<old-tier>` to `<new-profile>` × `<new-tier>`. Subsequent constraint strengths follow the new configuration."

If the assessment matches the cache → skip the prompt; do not bother the user.

#### 5.2 system-audit frequency trigger check

archive is the event of "completing one change," which aligns exactly with Table 3 (system-audit frequency, see `field-assessment/references/audit-frequency.md`).

**Persistent counter**: After each archive completes, read `openspec/.td-state/archive-counter.yaml`, increment `count` by 1, and write back. The file format is in `references/archive-counter-template.md`; the file is created on-demand by this step on first run.

**Threshold determination** (frequency numbers always from Table 3's project scope column):

| tier | driving source | determination method | when file does not exist |
|---|---|---|---|
| `tier-small` / `tier-medium` | count-driven | `archive-counter.yaml`'s `count` ≥ Table 3 threshold | treat as `count: 0`, then add 1 for this event and re-evaluate |
| `tier-large` | time-driven | most recent `scope: project` entry in `audit-history.yaml`, its `timestamp` is ≥ Table 3 threshold (one week) from now | treat as never having run a project audit; directly determine threshold reached |

Threshold reached → **proactively suggest** the user run `/td-system-audit project`; this is not mandatory, but rather "per keynote principle 2's general design department responsibility, it's time for a periodic self-check." Both files are created on-demand by this step on first run.

#### 5.3 WIP release check

After archiving, the number of active changes decreases. If there was a new change previously blocked due to the WIP limit, prompt the user: "WIP released (currently active `<n>` / limit `<limit>`), you can now `/td-propose` the X you wanted to do before."

## Guardrails

- **Read-only after archiving**: files under `openspec/changes/archive/` are never modified
- Must verify change completeness before archiving (all tasks done, all artifacts present)
- Do not archive a change that is still in progress — if there are unfinished tasks, first ask the user whether to continue completing them or abandon them
