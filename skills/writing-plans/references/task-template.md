# Task Required Field Template and Risk Levels

## Required Field Template

```markdown
- [ ] <task description>
  - file: <exact file paths>
  - risk: <high | medium | low>
  - verification: <how to verify this task is done>
  - subsystem impact: <which subsystems this touches>
  - dependency: <other tasks that must complete first>
```

## Risk Level Determination

Used by `test-driven-development` to decide test intensity, and by `requesting-code-review` to decide review depth:

- **high**: core path / spans multiple subsystems / data consistency / security / irreversible decision → full boundary test suite + mandatory review
- **medium**: regular functionality → standard TDD intensity (normal path + key boundaries)
- **low**: mechanical changes (rename, docs, pure config) → smoke verification is sufficient
