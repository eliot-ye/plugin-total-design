# 任务必填字段模板与风险等级

## 必填字段模板

```markdown
- [ ] <task description>
  - 文件：<exact file paths>
  - 风险：<high | medium | low>
  - 验证：<how to verify this task is done>
  - 分系统影响：<which subsystems this touches>
  - 依赖：<other tasks that must complete first>
```

## 风险等级判定

供 `test-driven-development` 决定测试强度、`requesting-code-review` 决定 review 深度：

- **high**：核心路径 / 跨多个分系统 / 数据一致性 / 安全 / 不可逆决策 → 完整边界用例 + review 必查
- **medium**：常规功能 → 标准 TDD 强度（正常路径 + 关键边界）
- **low**：机械改动（重命名、文档、纯配置）→ 冒烟验证即可
