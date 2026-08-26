<!-- The second/third-level headings in this file (e.g. `## System Audit Report`, `### Keynote Comparison`) are dynamically read as report-completeness markers by hooks/td_state_sync.py's _load_report_markers — changing headings requires no sync with the hook, the hook follows automatically; but when deleting the "## Report Template" section or heavily restructuring headings, please confirm the hook can still extract headings from this file. -->

# Audit Report Template and Keynote Comparison Checklist

## Keynote Comparison Checklist

For each audit object, audit item by item:

### Keynote Principle 1: Systems Engineering

- [ ] Does each local action in the current work consider its impact on the system as a whole?
- [ ] Is the proposal's "systems-engineering impact assessment" section filled in conscientiously (including the "expected behavior model" field)?
- [ ] Are there signs of "local optimum but global imbalance"?
  - If yes → Step 6 triggers `human-in-loop` to let the general design department judge whether this is a genuine global imbalance or an acceptable local optimization (this workflow has no dedicated "global imbalance" constraint skill; this judgment must be made by the general design department).

### Keynote Principle 2: General Design Department

- [ ] Is the agent "making decisions itself that the user should make"? (violation → trigger `human-in-loop`)
- [ ] Are there places where the "subsystem engineer's perspective" overrides the "general design department's perspective"?

### Keynote Principle 3: Meta-Synthesis from Qualitative to Quantitative

- [ ] Are the decisions in design.md iterated from qualitative to quantitative, or made by gut feel?
- [ ] Were reversible decisions closed prematurely? (violation → trigger `delay-decision`)
- [ ] Was an "actual vs. expected" post-mortem review performed at archive time (including the "model validation" field)?
- [ ] Is the proposal's "expected behavior model" explicitly validated in the archive's "model validation"? Is the model deviation recorded as "a correction for the next propose's prediction model"?
  - This is the closing action of the meta-synthesis cycle — the "model" is the bridge that elevates qualitative judgment to quantitative understanding (see `system-engineering`'s "Four Keynote Principles," principle 3, "Model Carrier" section).

### Keynote Principle 4: Open Complex Giant System

- [ ] Is the current profile/tier configuration appropriate for the project's reality?
- [ ] Is there a tendency to treat a "complex giant system" as a "simple system" and force a solution?
  - Too many changes open simultaneously (WIP exceeded) → Step 6 triggers `wip-limit` hard block + override
  - Compressing the critical chain buffer → Step 6 triggers `critical-buffer`
- [ ] **Layered view**: When the system internally has subsystem independent tiering, are subsystems audited separately by layer?
  - Each subsystem has its own "local optimization creating global imbalance" risk
  - Cross-subsystem dependency chains are cross-subsystem critical chains
  - Does the audit report distinguish between "intra-subsystem imbalance" and "cross-subsystem boundary imbalance"?

## Report Template

```markdown
## System Audit Report

### Scope
<current-change | project>

### Keynote Comparison

| Keynote principle | Pass | Violation |
|---|---|---|
| 1. Systems engineering | ✓ | — |
| 2. General design department | — | ⚠ The agent made decision X itself |
| 3. Meta-synthesis | ✓ | — |
| 4. Open complex giant system | — | ⚠ Critical chain buffer compressed to 15% |

### Problems Found

1. **[Severe]** <problem description>
   - Keynote principle violated: <...>
   - Suggested remediation: <...>

2. **[Reminder]** <problem description>
   - ...

### Suggested Next Actions

1. <action 1>
2. <action 2>
```
