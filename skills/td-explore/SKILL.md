---
name: td-explore
description: A low-stakes thinking partner — explore before writing code. The OpenSpec contract-layer entry point and the primary entry when requirements are unclear. Trigger scenarios: the user says "want to explore", "explore", "let me think first", "not sure what to build", "help me think through X". When the user wants to build/fix/refactor but the requirements are unclear, route here first; brainstorming is activated within this flow.
user-invocable: true
argument-hint: <topic or question>
---

# td-explore

Does not create a change, does not write artifacts — just **explores**. When the user is not yet sure what to build, the agent helps them think it through.

## Dependencies

- `system-engineering`
- `field-assessment`
- `brainstorming`

## Served Keynote Principle(s)

**Systems-engineering keynote principle 2: the general design department.**

explore is the work of the general design department in the "thinking" phase — not subsystem engineers directly getting hands-on, but first exploring from a system-wide standpoint.

**Systems-engineering keynote principle 4: open complex giant system.**

explore does not simplify and reduce problems; it allows contradictions to coexist, which is respect for complex giant systems.

**Engineering Cybernetics feedback control loop placement**: explore is the feedforward control preparation stage (collecting prior information for propose's control target, reducing prediction error).

## Input - the topic, question, or idea the user wants to explore

**Exploration scope is limited to this project.**

#### Content

`$ARGUMENTS`

## Steps

### Step 1. Activate keynote and configuration layer

Activate the keynote and configuration layer. Only inject strengths without making judgments; execute the following three-step sequence:

1. **`system-engineering`** — The four keynote principles enter the context.
2. **profile × tier identification** — Call `field-assessment`, read `$_TD_PROFILE` / `$_TD_TIER`, load Table 1 + Table 2. The profile determines explore's emphasis (greenfield emphasizes candidate directions, brownfield emphasizes "impact of touching old code", maintenance emphasizes "production stability").
3. **Remaining constraints** — Only read strength values into context; do not judge whether they trigger in this step.

### Step 2. Read site context (config.yaml context)

Same guided flow as `td-propose` Step 2: read the `context` field of `openspec/config.yaml` as the exploration site context; if empty or template default, ask all three questions (tech stack / conventions / domain) at once and write the answers into the `context` field. One-time investment; subsequent `/td-propose` / `/td-explore` calls all read it. User skips → leave empty, continue to Step 3 (non-blocking).

### Step 3. Read existing context

- Read the project's current state (git log, package.json, directory structure)
- Read relevant existing specs (under `openspec/specs/`)
- Read relevant existing changes (under `openspec/changes/`)
- Read unchecked entries (`- [ ]`) from `openspec/todo.md` — this is the project-level candidate pool, serving as candidate direction input for exploration; file doesn't exist → skip, treat as empty pool

### Step 4. Brainstorm

Invoke the Step 1–4 working method of the `brainstorming` skill — **do not execute** brainstorming's Steps 5–6 (staged confirmation, saving spec document): explore does not persist spec to disk; results are delivered in conversational form (see Step 6). If the user requests persisting exploration results as a spec draft, suggest running `/td-propose` (brainstorming's save step is executed there).

**Artifact requirements**: the explore stage must produce **at least 2 candidate directions**, each annotated with systems-engineering impact (which subsystems are affected / expected overall performance change / reversibility). The artifacts stay in the session context (explore does not persist spec to disk; see Step 6 Guardrails). `/td-propose` Step 3's "greenfield explore check" reads session history to determine whether ≥2 candidate directions already exist — fewer than 2 will cause the propose stage to block and require exploring first.

**Connection to `delay-decision`**: explore's "do not persist spec to disk" is essentially delaying the decision — not closing the spec, waiting for more information before proposing. When the user wants to "hurry up and propose to close the spec", trigger `delay-decision` to remind: "explore not persisting spec to disk is an expression of delayed decision-making; forcefully closing with insufficient information loses information (keynote principle 3, meta-synthesis)." This coordinates with `/td-propose` Step 3's "greenfield explore check" — greenfield projects explore first, then propose.

### Step 5. Systems-engineering perspective assessment

For each candidate direction, assess:

- Which subsystems are affected
- Expected overall performance change
- Is this local optimization or global coordination
- Risk to global coherence from local optimization

Assessment emphasis is adjusted by the `$_TD_PROFILE` read in Step 1:

- `profile-greenfield`: emphasize **trade-offs and reversibility** of candidate directions — no legacy constraints, low cost of choosing the wrong direction, but use `delay-decision` to avoid the two traps of "build as soon as you think of it" and "perfect the architecture first"
- `profile-brownfield`: emphasize **impact of touching old code** — which legacy subsystems will candidate directions touch, can the change scope be minimized, whether it triggers common contract changes (compare with `human-in-loop`'s mandatory-stop scenarios)
- `profile-maintenance`: emphasize **production stability** — the impact of candidate directions on live contracts, deployment pipeline, regression tests, whether you need to stop and ask the user before changing the production environment

### Step 6. Summarize for the user

Present naturally what you've helped the user clarify, so they can see your understanding of the problem, the options you've found, and where things are still stuck. The rough structure below is for reference; adjust based on the actual conversation, don't be rigid:

- **Current understanding**: restate the user's problem, confirm you understood it correctly
- **Candidate directions**: each direction annotated with system impact
- **Unresolved contradictions**: conflict points exposed in the conversation
- **Suggested next step**: toward propose or continue exploring

### Step 7. Write exploration results to the pool (optional)

When exploration produces new directions that the user endorses but does not want to propose immediately, suggest writing them into the `## Todo` section of `openspec/todo.md` (entries as `- [ ] one-sentence description`; format per `td-propose`'s `references/todo-format.md`). File doesn't exist → ask the user whether to create it (exploration output would be the first candidate in a new pool). This is "write it down when you think of it, don't rush to create a change" — adding to the pool doesn't consume WIP; pick from the pool when running `td-propose`. User declines → skip, non-mandatory.

## Guardrails

- Do not create any change files
- Do not modify code
- Ideas in the conversation are allowed to contradict; don't rush to make them self-consistent
- If the user wants to jump directly to propose, remind: "explore is for figuring out what to build; skipping it might lead you to propose the wrong direction. But you're the boss — if you say skip, we skip."
