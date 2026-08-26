# Identification Flow + Persistence Layer

This file defines the field assessment flow for profile/tier and the `.td-state/` persistence conventions. Step 1 of every td-* skill invokes this flow.

## Identification Flow

The agent assesses in the following order, writes the result into the working context (variable names recommended: `$_TD_PROFILE` / `$_TD_TIER`), and subsequent steps consult Table 1 / Table 2 / Table 3 for strength values (see `strength-matrix.md`).

### 1. Read persistence cache

Read `openspec/.td-state/profile-tier.yaml`. If the file exists and no re-assessment trigger is active (see "### 4. Cache Assessment Result"), use the cached values directly and skip to "### 5. Inject Strength." If the file does not exist, perform a fresh assessment per "### 2" + "### 3"—**this step only reads, never writes**; the write responsibility is in "### 4. Cache Assessment Result." For the file format, see the "### profile-tier.yaml template" section below.

### 2. Assess profile (three options, by priority)

| priority | profile | criteria (all must hold) |
|---|---|---|
| 1 | `profile-maintenance` | repo is live **AND** has real user traffic **AND** has CI/CD configured |
| 2 | `profile-brownfield` | repo already has runnable code (not scaffolding) **AND** does not meet maintenance criteria |
| 3 | `profile-greenfield` | repo just init'd / only scaffolding / file count < 10 and no business logic |

When criteria conflict, take the higher priority. When criteria are ambiguous → trigger `human-in-loop` and ask the user "Is this a new project, an inherited project, or a live maintenance project?"

### 3. Assess tier (three options)

| tier | criteria (any one holds → take this tier, take the highest) |
|---|---|
| `tier-large` | file count 100+ **OR** multi-team **OR** multi-repo **OR** multiple deployment units |
| `tier-medium` | file count 10–100 **OR** single-team multi-person **OR** 1–3 deployment units |
| `tier-small` | file count 3–10 **OR** single-person/single-team **OR** 1 deployment unit |

If the system has "obvious subsystem boundaries," upgrade to `tier-medium` even if the file count is small. If the system is split into multiple independent subsystems → each subsystem is tiered independently (see `subsystem-tiering.md`).

**Trigger for subsystem independent tiering**: When "### 2. Assess profile" identifies `profile-brownfield` or `profile-maintenance`, and `td-reverse-spec` step 3 has already identified "obvious subsystem boundaries," subsystem independent tiering is triggered. Each subsystem is tiered independently per the criteria in this section, and the result is written to the `subsystem-<name>` entry in `openspec/.td-state/profile-tier.yaml`.

**Hierarchical view positioning**: The tier criteria in this section are planar dimensions (file count, team size, deployment units). The subsystem independent tiering mechanism extends these planar dimensions into a hierarchical dimension—acknowledging that a complex giant system is a multi-level nested structure (keynote principle 4, "hierarchical view"), and that subsystems at different levels need to be treated in layers. This is not "tier criteria failing," but rather "tier criteria taking effect separately at each subsystem level."

### 4. Cache Assessment Result

The assessment result is written to `openspec/.td-state/profile-tier.yaml` for persistence, retained across sessions. Triggers for re-assessment (executing the "re-assessment strategy" below when hit):

- After `/td-archive` completes (project state may have changed)—archive step 5.1 is responsible for triggering re-assessment
- `/td-system-audit` finds profile/tier inconsistent with reality
- User explicitly says "project phase has changed"

**Re-assessment strategy** (applies to td-archive 5.1 / td-system-audit / user-explicit trigger):

1. Read `profile-tier.yaml` cached values (file does not exist → treat as empty cache, skip to step 2 for fresh assessment).
2. Re-run "### 2. Assess profile" + "### 3. Assess tier" to obtain new assessment results.
3. Compare new assessment with cache:
   - **Consistent** → update `judged_at` timestamp (keep profile/tier unchanged), do not prompt the user.
   - **Inconsistent** → overwrite `profile-tier.yaml` with the new result, and synchronize the `judge_reason` field to reflect the new criteria (e.g., "greenfield moved to maintenance because it went live + has CI/CD"). The caller (e.g., td-archive 5.1) prompts the user "project state has changed from `<old>` to `<new>`."

Re-assessment **does not "delete the cache file"**—it "reads cache → re-assesses → compares → writes back per comparison result."

### 5. Inject Strength

After assessment is complete, the agent reads Table 1 (strength of the 5 constraints under the current tier) + Table 2 (profile-specific human-in-loop additions) + Table 3 (system-audit frequency) into context. Subsequent steps reference these strength values and do not re-consult this skill.

**Strength injection under subsystem independent tiering**: When `profile-tier.yaml` contains `subsystems` entries, strength injection should be **per-subsystem**—each subsystem has its own Table 1 / Table 2 strength. Dependencies spanning subsystems are treated using the "highest-tier subsystem" strength (conservative principle). When subsequent steps reference strengths, they must distinguish "which subsystem the current operation acts on."

### Convention for Downstream Strength References

When downstream skills reference the strength values from Table 1 / Table 2 / Table 3, they follow the same convention:

- **Strength values are injected into the session context by the td-* skill's "Step 1"**—injection is completed through the `field-assessment` identification flow.
- **If strength is not injected** (e.g., td-* skill skipped Step 1, or session context was cleared), the downstream skill invokes `field-assessment` to inject before reading, and does not redefine the values.
- **Single source of truth**: Strength values are defined only in `strength-matrix.md` (Table 1 + Table 2) and `audit-frequency.md` (Table 3); downstream skills do not copy values when referencing them, but rather reference "look up row Y in Table X for the current tier."

This convention applies to all constraint skills, tier skills, and td-* skills. Downstream skills do not need to repeat this convention in their body—this section is the single anchor for the convention.

## Persistence Layer (.td-state/)

profile/tier assessment results are persisted to `openspec/.td-state/profile-tier.yaml`. The file is created on demand by the agent when the identification flow is first run; it is not pre-provisioned.

### Conventional Paths

```
openspec/.td-state/
├── profile-tier.yaml        ← maintained by field-assessment: profile/tier assessment cache + timestamps triggering re-assessment
├── archive-counter.yaml     ← maintained by td-archive: cumulative archive count (used for system-audit frequency triggering)
├── audit-history.yaml       ← maintained by td-system-audit: sequence of audit timestamps
└── audits/                  ← maintained by td-system-audit: each complete audit report
```

### File Templates

The `profile-tier.yaml` template is in the "### profile-tier.yaml template" section below (the identification flow reads and writes it directly, tightly bound). The other persistence files (archive-counter / audit-history) have templates maintained by their respective owners:

- `archive-counter.yaml` template → `td-archive`'s `references/archive-counter-template.md`
- `audit-history.yaml` template → `td-system-audit`'s `references/audit-history-template.md`

### profile-tier.yaml template

```yaml
profile: <profile-greenfield | profile-brownfield | profile-maintenance>
tier: <tier-small | tier-medium | tier-large>
judged_at: <ISO8601 timestamp>
judge_reason: <one-sentence rationale, e.g., "live + has CI/CD → maintenance; 120 files → large">
# Subsystem independent tiering (optional, only when the system has obvious subsystem boundaries)
subsystems:
  - name: <subsystem-A>
    tier: <tier-small | tier-medium | tier-large>
    judge_reason: <one-sentence rationale>
  - name: <subsystem-B>
    tier: <tier-small | tier-medium | tier-large>
    judge_reason: <one-sentence rationale>
```

**Behavior when file does not exist**: When the agent invokes the identification flow and `openspec/.td-state/profile-tier.yaml` does not exist, it performs a fresh assessment per "### 2. Assess profile" + "### 3. Assess tier" below, then creates the file and writes the result. If the file already exists, it reads the file first and does not re-assess—unless a "trigger re-assessment" condition is hit.
