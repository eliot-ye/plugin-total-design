# Subsystem Independent Tiering (hierarchical view positioning, keynote principle 4)

Table 1's tier-small / tier-medium / tier-large are **planar** dimensions and do not address "the hierarchical nature within a system." Qian Xuesen's systems engineering emphasizes "the hierarchical structure of systems" (keynote principle 4, "hierarchical view")—a complex giant system is a multi-level nested structure: a tier-large multi-repo system may have each repo be tier-small; a tier-large microservices system may have each microservice be tier-medium.

## Subsystem Independent Tiering Mechanism

- **Trigger condition**: `td-reverse-spec` step 3 "subsystem partitioning" identifies "obvious subsystem boundaries," or `td-init` / `/td-system-audit` project scope discovers "system hierarchy spans tier boundaries."
- **Execution rule**: Each subsystem is tiered independently per the tier criteria in `identification-flow.md`'s "### 3. Assess tier." Dependencies spanning subsystems are treated using the "highest-tier subsystem" strength (conservative principle—treat cross-subsystem boundaries according to the most complex subsystem).
- **Persistence**: `openspec/.td-state/profile-tier.yaml` supports multiple subsystem entries (one `subsystem-<name>` record per subsystem); the file template is in the "### profile-tier.yaml template" section of `identification-flow.md`.
- **Coordination with `td-apply` step 7.2**: The tier-graded strength for cross-subsystem boundary verification is treated per "the highest tier among affected subsystems"—avoiding the oversight of "the boundary between a tier-small subsystem and a tier-large subsystem only uses smoke-level integration verification."

This is not splitting "one tier-large critical chain" into "multiple tier-small critical chains"—but rather acknowledging that a complex giant system is a multi-level nested structure, and that subsystems at different levels need to be treated in layers.
