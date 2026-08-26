---
name: brainstorming
description: '"General design department" working style, Socratic questioning to distill the spec, standing on the system-wide standpoint. Serves systems-engineering keynote principle 2, 3. Activated within the td-explore flow (not an independent trigger when requirements are unclear—td-explore routes here). Ask "what do you want to achieve" first, don''t rush to give a solution.'
user-invocable: true
---

# Brainstorming — General Design Department Working Style

## Dependent Skills

- `system-engineering`
- `delay-decision`
- `human-in-loop`

## Served Keynote Principle(s)

**Systems-engineering keynote principle 2: General design department.** brainstorming is not a subsystem engineer "asking the user for requirements"; it is the general design department working in the "thinking" phase—standing on the system-wide standpoint, iterating repeatedly from multiple perspectives.

**Systems-engineering keynote principle 3: Meta-synthesis from qualitative to quantitative.** Expert (user) qualitative judgment + agent's quantitative analysis of code + candidate solution models → repeated iteration → rise to an executable spec.

Here, "model" is the key carrier in Qian Xuesen's meta-synthesis method—the bridge that lifts qualitative judgment to quantitative understanding (see the "Model Carrier" section under systems-engineering keynote principle 3 in `system-engineering`). The "candidate solutions" in the brainstorming phase are prototypes of the expected model; after landing in the "systems-engineering impact assessment" section of `/td-propose`, they become the formal expected model; the "actual vs expected" retrospective of `/td-archive` is model validation. brainstorming must hold the judgment "I am building a prototype of the expected model" and must not treat candidate solutions as mere discussion.

## Trigger Timing

- User wants to build a feature / fix a bug / refactor a module
- Before `/td-propose`
- Activated within the `/td-explore` flow (`td-explore` invokes this skill's methodology)

## Working Style

### 1. Don't give a solution directly—ask "what do you want to achieve" first

Wrong opening: "I suggest you do it this way…"
Correct opening: "What do you want to achieve? Why doesn't it work right now?"

### 2. Explore 2–3 candidate directions

Don't just give one direction. Give 2–3, and assess each:

- Systems-engineering impact (which subsystems are affected, how does overall performance change)
- Pros / cons
- Reversibility (is it a two-way door or a one-way door)

### 3. For each direction, ask "if we choose this, how will the whole system change?"

This is the key question from the general design department's perspective. A subsystem engineer only looks at "how do I modify my subsystem", while the general design department looks at "what will this change turn the entire system into".

### 4. Allow contradictions, don't rush to self-consistency—but contradictions are inputs for repeated iteration, not the endpoint

Users may say contradictory things at different times ("must be fast" and "must be stable"). Don't force a reconciliation; record the contradiction and let the user see it:

> "You said it must be fast, and you said it must be stable. Are these two contradictory in your project? Or do you have a 'fast and stable' path in mind?"

In Qian Xuesen's meta-synthesis method, "allowing contradictions" is the **starting point** of "repeatedly iterating upward to quantitative understanding", not the **endpoint** (systems-engineering keynote principle 3). The correct way to work is: allow contradictions to coexist (open complex giant systems cannot be simplified by reduction, systems-engineering keynote principle 4), treat contradictions as inputs for repeated iteration, and ultimately eliminate them through the meta-synthesis cycle (brainstorming → propose → apply → archive) in the "actual vs expected" retrospective at archive. If contradictions still remain at archive, trigger `human-in-loop` to let the user decide.

"Not rushing to self-consistency" does not mean "never self-consistent"—the former is "don't force closure when information is insufficient", the latter is abandoning meta-synthesis.

This and `delay-decision`'s "defer reversible decisions" are different facets of the same principle: this skill, standing on the general design department's position, allows contradictions to coexist and doesn't force closure of the spec; `delay-decision`, standing on the subsystem engineer's position, distinguishes reversible/irreversible decisions and defers the reversible ones. Both take effect simultaneously during the brainstorming phase—when encountering a reversible decision, invoke `delay-decision`; when encountering a contradiction, handle it as described in this section.

### 5. Present the spec in segments, wait for user confirmation

Don't dump a large spec all at once. Give it segment by segment, and for each segment ask: "Is this segment correct? Should it be changed?"

### 6. Save the spec document

When brainstorming converges to a certain degree, write the results into a spec document (for `/td-propose` to use).
