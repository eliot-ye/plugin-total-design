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
  - 覆盖 scenario：<scenario 名，多值用 / 分隔；本 task 不承载任何 spec scenario 时标 N/A 并给理由>
  - 分系统影响：<which subsystems this touches>
  - 依赖：<other tasks that must complete first>
  - 估时：<estimated effort, optional>
```

**`覆盖 scenario` 字段**：本 task 实现 / 验证的 spec scenario 名（与 `openspec/changes/<change>/specs/` 下 `#### Scenario:` 逐字一致）。本字段是 **spec ↔ task ↔ test 三向闭合**的 task 侧锚点——与 scenario→test 覆盖账本（见 `td-propose` 的 `references/scenario-test-map-template.md`）的 `实现 task` 列互为反向引用，两侧孤儿（scenario 无 task 承载 / task 实现了未登记的 scenario）在 `td-propose` 步骤 6.c、`td-apply` 步骤 6.1 是 blocking defect。多对多关系：一个 task 可覆盖多个 scenario，一个 scenario 可由多个 task 承载。

- 本 task 属纯机械改动、不承载任何 spec scenario（如纯配置 / 文档 / 重命名）→ 标 `N/A` 并给一句话理由，不强行凑 scenario。
- tier 分层：tier-medium / tier-large 强制填（与账本三向闭合核对同强度）；tier-small 降级为提醒（不阻塞），但 scenario 侧闭合与断言强度仍强制（分层口径见账本模板「tier 分层」节）。

**`估时` 字段**（可选）：任务的预计耗时。**供 `executing-plans` 步骤 1 的"任务实际耗时 >2x 估时"判定用**——是该触发条件的唯一事实源。任务主体为机械动作（改配置、跑 lint）时可省略；涉及实现逻辑的任务建议填写。省略时 `executing-plans` 的 >2x 判定降级为"任务实际耗时明显超出同类任务预期"，不构成硬触发。

## 风险等级判定

供 `test-driven-development` 决定测试强度、`requesting-review` 决定 review 深度：

- **high**：核心路径 / 跨多个分系统 / 数据一致性 / 安全 / 不可逆决策 → 完整边界用例 + review 必查
- **medium**：常规功能 → 标准 TDD 强度（正常路径 + 关键边界）
- **low**：机械改动（重命名、文档、纯配置）→ 冒烟验证即可
