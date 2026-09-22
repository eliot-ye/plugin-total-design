# Scenario→Test 覆盖账本模板

## 用途

本账本是 scenario 粒度的覆盖声明——把 specs/ 里每个 `#### Scenario:` 映射到一个具名测试。由 `td-propose` 步骤 6.c 在 proposal 定型后产出（当 change 的 `applyRequires` 含 `specs` artifact 时），由 `td-apply` 步骤 2 前置检查验证存在性、步骤 6.1 审计全绿。

## 账本格式

```markdown
## Scenario→Test 覆盖账本

| Requirement | Scenario | 测试文件路径 | 测试名 | 状态 |
|---|---|---|---|---|
| <requirement 标题> | <scenario 名> | <path/to/test.ext> | <test_function_name> | 🔴 / 🟢 / N/A |
```

**状态列**：

- 🔴 red：测试尚未实现或未通过
- 🟢 green：测试已通过
- `N/A — 无可执行测试面`：该 scenario 无可执行测试面（纯文档 / 配置类改动），须附带等价机械校验项（口径沿用 `writing-plans/references/task-template.md`「验证字段可判定性」节）

## 规则

- 每个 `#### Scenario:` 必须映射到至少一行——unmapped scenario 是 blocking defect，不是 TODO
- 产出账本时逐行做两项机械校验，任一不过即回改，不得带病交付：
  1. **路径存在性**：账本内每个测试文件路径必须实际存在（逐一核对文件系统，不得凭记忆转写路径）
  2. **名称对齐**：Scenario 列的名称必须与 spec 现文逐字一致（打开 spec 复制原文，禁止凭印象缩写或改写）
- 账本是覆盖下限（floor）：每个 scenario 至少一个具名测试，额外测试不需要账本条目
- `N/A` 条目在 archive 复盘时汇总说明数量与理由（tier-large 须逐条说明等价机械校验）
- 账本与 tasks.md 的 `验证` 字段是交叉引用关系：同一场景可由多个任务实现，同一任务可覆盖多个场景——两者不互相替代

## tier 分层

| tier | 强度 |
|---|---|
| `tier-small` | 仅当 `applyRequires` 含 `specs` **且**含可执行测试面时强制；否则跳过并在账本头注明理由（`applyRequires` 不含 `specs` 或 specs 全部为纯文档 / 配置类无可执行测试面） |
| `tier-medium` | 强制（同上条件），`N/A` 条目在复盘里汇总说明数量与理由 |
| `tier-large` | 强制，`N/A` 条目须在 archive 复盘里逐条说明等价机械校验，不允许静默 |
