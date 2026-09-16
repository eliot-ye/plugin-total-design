# 任务必填字段模板与风险等级

## 任务主体约束

task 主体必须是 agent 能**编程性执行**的动作（写代码、跑测试、执行 CLI 命令、改配置等）。

**非编程性动作不得作为 task 主体**（人工目测/手动 UI 测试、用户验收、业务方 sign-off、第三方审批、人工回归测试等）——它们不构成独立 task，而应降级为该 task 的 **`验证` 字段**补充说明。例如 `验证：跑 E2E 测试 + 手动截图对比 staging 与预期 UI`——手动部分是补充，不是 task 主体。

## 验证字段可判定性

每条任务的 `验证` 字段必须是**可机械判定**的——命令 / 测试 / lint / type check / grep 断言 / `openspec validate` 等，判定结果是 pass / fail 之一，不接受"看起来对"这类不可判定表述。

**非编程性动作的验证补充**（沿用上方「任务主体约束」节的定义）：允许作为 `验证` 字段的补充说明，但必须**额外附带一个等价的可机械判定项**。例如 `验证：跑 E2E 测试 + 手动截图对比 staging 与预期 UI`——"手动截图对比"是补充，"跑 E2E 测试"是可机械判定项。

没有等价可机械判定项时，`验证` 字段须显式记录「无可自动等价校验」，该缺口在 archive 复盘时汇总——不静默接受。

**"补充"与"等价机械项"是同一字段内的两个要求，不是二选一**：缺少等价机械项的人工验证补充不算合格的验证证据。

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
