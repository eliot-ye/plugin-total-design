---
name: td-init
description: Initialize the total-design workflow: check OpenSpec structure + configure .gitignore to prevent false conflicts in multi-person collaboration. Trigger scenarios: the user says "initialize", "td init", "start using td", "set up td workflow", "add .gitignore".
user-invocable: true
disable-model-invocation: true
argument-hint: (no arguments)
---

# td-init

The one-time entry point for initializing the total-design workflow. Ensures two things are ready: the **OpenSpec contract-layer structure** (specs / changes) and the **multi-person collaboration git boundary** (`.td-state/` does not enter version control).

## Dependencies

- `system-engineering`
- `field-assessment`

## Served Keynote Principle(s)

**Systems-engineering keynote principle 1: Systems engineering.**

init is "setting up the way the system works first" — first establish the specs baseline, the change directory, and the git boundary, so that each subsequent local action has a footing derived from overall performance. Starting work without a framework is the first source of "local actions creating global imbalance."

**Systems-engineering keynote principle 2: General design department.**

The multi-person collaboration git boundary (`.td-state/` derivable state does not enter version control) is an engineering decision from the general design department's perspective: if state can be derived from filesystem facts, git conflicts should not pretend it matters.

## Steps

### 1. Activate keynote and configuration layer

Activate keynote and configuration layer. Only inject strengths, do not make judgments; execute the following three-step sequence:

1. **`system-engineering`** — The four keynote principles enter context. init is "setting up the way the system works first."
2. **profile × tier identification** — Call `field-assessment`, read `$_TD_PROFILE` / `$_TD_TIER`. Greenfield projects (empty repo or only scaffolding) are usually judged as `profile-greenfield`; at the init stage the `.td-state/` cache may not yet exist for profile/tier, handle as "file does not exist, judge now."
3. **Other constraints** — Only read strength values into context; do not decide whether they trigger in this step.

### 2. Check OpenSpec structure

Check whether the `openspec/` directory exists:

- **Does not exist** → Initialize the OpenSpec contract layer:
  1. Check whether the `openspec` CLI is available (`openspec --version`).
  2. **CLI not available → Create the base structure on its behalf** (does not block initialization; use file tools to create directories):
     - `openspec/specs/` — main spec directory
     - `openspec/changes/` — active change directory
     - `openspec/changes/archive/` — archived change directory
     - Prompt the user: "`openspec` CLI is not installed; the base structure has been created on its behalf. Subsequent `/td-propose` / `/td-apply` / `/td-archive` depend on the CLI; it is recommended to install `npm install -g @fission-ai/openspec@latest`."
  3. **CLI available → Run `openspec init`** to establish the base structure (output identical to the fallback approach; when the CLI is ready, the official path is more robust).
- **Already exists** → Skip; continue to Step 3.

### 3. Configure .gitignore (core step)

Check whether the project root `.gitignore` already includes `openspec/.td-state/`:

- **Already includes it** → Skip; prompt "already configured."
- **Does not include it** → Create/append the following snippet in `openspec/.gitignore` (does not touch the root `.gitignore`; the nested gitignore's paths are relative to the `openspec/` directory, and the rules only apply to the openspec subtree, not affecting other content in the root directory):

```gitignore
# total-design local state: all derivable from filesystem facts, not version-controlled
.td-state/
```

  - `openspec/.gitignore` does not exist → create the file and write to it
  - Already exists → append (do not overwrite existing content); if it already contains a `.td-state/` entry → skip (idempotent)

**Why**: All state files under `.td-state/` (`profile-tier.yaml` / `archive-counter.yaml` / `audit-history.yaml` / `audits/`) can be derived from filesystem facts (the `archive/` directory, `audits/*.md`, etc.); committing them to git only creates false conflicts — when two people archive / audit simultaneously, they read-modify-write the same YAML, and git reports a conflict or silently loses data. After ignoring, the conflict surface drops to zero, files remain local, and this workflow (including the `SessionEnd` hook) continues to read and write normally.

**Must be committed, do not ignore, file may not exist**: `openspec/config.yaml` (team-shared context), `openspec/specs/` (main spec), `openspec/changes/` (change assets), `openspec/todo.md`.

### 4. Legacy project migration check

Use `git ls-files` to check whether `.td-state/` is already tracked by git (a legacy project that was committed before `.gitignore` was added):

```bash
git ls-files openspec/.td-state/
```

- **Has output** → Prompt the user to perform a one-time untrack (**must obtain user confirmation first**; this is a destructive git operation):

```bash
git rm -r --cached openspec/.td-state/
```

  The `.td-state/` files remain local (this workflow reads and writes normally); they simply no longer enter version control. Execute after confirmation, and suggest committing this change.
- **No output** → Skip.

### 5. First-time guided config.yaml context fill

Same guided flow as `td-propose` Step 2: read the `context` field of `openspec/config.yaml`; if empty or at template default, ask all three questions at once — tech stack / conventions / domain — and write the answers into the `context` field. User skips → leave it empty, non-blocking. Asking once at init means subsequent td-propose / td-explore calls can all read it, avoiding repeated interruptions.

### 6. Completion output

Output initialization results:

- OpenSpec structure: ready (newly created / already exists)
- `.gitignore`: root directory already has it / openspec/.gitignore created or appended / not needed
- Legacy project migration: completed / not needed / pending user confirmation
- config context: filled in / skipped

## Guardrails

- **Do not overwrite** existing `.gitignore` / `openspec/.gitignore` content; only append
- `git rm --cached` is a destructive git operation; **must obtain user confirmation** before executing
- Do not modify any content under `openspec/specs/` or `openspec/changes/`
- When the CLI is not available, only create the **directory structure** on its behalf — do not create/fabricate artifact, spec, or change content (that is the responsibility of td-propose / td-reverse-spec); when the CLI is available, prefer `openspec init`
- Re-runnable: idempotent; already-configured items are skipped
