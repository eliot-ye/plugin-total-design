---
name: system-engineering
description: Qian Xuesen systems-engineering keynote. The premise for all local constraint skills.
user-invocable: false
---

# Systems-Engineering Keynote (Qian Xuesen)

Qian Xuesen's approach is, at its core, not the operational layer of "project management" — it is **systems engineering**: recognizing and handling complex objects as an integrated whole system.

## Four Keynote Principles

### 1. Systems Engineering

The overall performance of a system is **not equal** to the sum of its parts' performance; the key is **overall coordination**, not local optimization.

**Implication for the workflow:** Every local action must be derived from overall performance. An action that makes a local part better but throws the whole out of balance is wrong.

### 2. General Design Department

Any complex engineering effort needs a group that **stands at the system-wide level**, specifically responsible for the overall scheme and coordinating all subsystems.

**Implication for the workflow:** The agent itself cannot simultaneously act as both a "subsystem engineer" and the "general design department." The `brainstorming` skill is upgraded to the "general design department" working mode; the `/td-system-audit` command is the general design department's periodic self-inspection mechanism.

### 3. Meta-Synthesis from Qualitative to Quantitative

Expert qualitative judgment + data + models → iterative refinement → ascension to quantitative understanding; humans and machines combined, not pure algorithm.

#### Model Carrier

Models are the bridge that elevates qualitative judgment to quantitative understanding. In this workflow, that "model" carrier is OpenSpec's spec/design artifact (the contract and invariants of subsystems) — the "systems-engineering impact assessment" section of the proposal is the predicted model, and the "actual vs. predicted" retrospective in the archive is model validation. Downstream skills must explicitly hold the judgment that "the spec is the meta-synthesis model carrier" and must not treat the spec as mere documentation.

**Implication for the workflow:** The OpenSpec proposal must answer "which subsystems will this change affect, and how will overall performance change" — this is the artifact-level manifestation of meta-synthesis from qualitative to quantitative. The agent cannot just write "what" and "how"; it must write "what impact this will have on the system as a whole."

### 4. Open Complex Giant System

Systems like society, the human body, and the mind cannot be reduced by simplification — they require **holistic view + hierarchical view**.

Holistic view: the overall performance of a system is not equal to the sum of its parts' performance; local actions must be derived from overall performance.

Hierarchical view: a complex giant system is a multi-level nested structure; subsystems at different levels have different complexity and constraint strength and must be treated by level — you cannot treat a tier-large multi-repo system as "one tier" and force a solution; each subsystem should be assigned its own tier independently.

**Implication for the workflow:** The profile × tier two-dimensional configuration is the engineering manifestation of this principle — treating systems by scale tier. A 3-file script and a 100,000-line monolithic system cannot be subject to the same constraint strength. When there are clear subsystem boundaries within the system, `field-assessment`'s identification process allows subsystems to be assigned tiers independently (see the "Identification Process" section of `field-assessment`).

## Feedback Control Loop (threading through all four keynote principles)

The four keynote principles are not parallel static principles — they are dynamically closed through a feedback control loop:

- **propose (feedforward control):** predict "systems-engineering impact" before implementation, establishing control objectives.
- **apply (control execution + real-time error detection):** implement per `tasks.md`; TDD is contract-level error detection, verification is system-level error detection.
- **archive (feedback control loop closure):** the "actual vs. predicted" retrospective is post-hoc error detection, correcting the next propose's prediction model.

Multiple closed loops in this workflow are concrete forms of this feedback control loop: `td-system-audit` step 7's "rerun audit closed loop after fix," `systematic-debugging`'s 4-phase closed loop, `executing-plans` step 3's human checkpoint, and `verification-before-completion` section 6's system-level verification. When downstream skills trigger these closed loops, they should be aware that this is the engineering of the feedback control principle from *Engineering Cybernetics* within this workflow — not an isolated "just rerun it."

## How to Use This Skill

This skill is **the premise for all constraint skills** and is not triggered standalone. When the agent activates any constraint skill, it should simultaneously be aware of this skill's four keynote principles, executing local rules within the systems-engineering framework.

When the agent invokes `/td-system-audit`, this skill is the audit's reference standard.

When the agent triggers any feedback control closed loop (see the enumeration in the "Feedback Control Loop" section), this skill's "Feedback Control Loop" section is the home anchor for those closed loops.
