# Scenario→Test 覆盖账本模板

## 用途

本账本是 **scenario ↔ task ↔ test 三向闭合**的覆盖声明——把 specs/ 里每个 `#### Scenario:` 映射到具名测试与实现它的 task。由 `td-propose` 步骤 6.c 在 proposal 定型后产出（当 change 的 `applyRequires` 含 `specs` artifact **且 specs 未被 `skip_specs` 跳过**时——`td-propose` 步骤 6.a 纯重构逃生阀命中时无 spec delta 即无 scenario 可映射，不产出本账本），由 `td-apply` 步骤 2 前置检查验证三向闭合完整性（specs 被跳过时跳过本检查）、步骤 6.1 审计全绿与断言强度。

## 账本格式

```markdown
## Scenario→Test 覆盖账本

| Requirement | Scenario | 测试文件路径 | 测试名 | 实现 task | 状态 |
|---|---|---|---|---|---|
| <requirement 标题> | <scenario 名> | <path/to/test.ext> | <test_function_name> | <task 编号，多值用 / 分隔> | 🔴 / 🟢 / N/A |
```

**状态列**：

- 🔴 red：测试尚未实现或未通过
- 🟢 green：测试已通过 **且** 通过下方「断言强度三判据」——两条都满足才可标 🟢
- `N/A — 无可执行测试面`：该 scenario 无可执行测试面（纯文档 / 配置类改动），须附带等价机械校验项（口径沿用 `writing-plans/references/task-template.md`「验证字段可判定性」节）

## 规则

### 覆盖下限

- 每个 `#### Scenario:` 必须映射到至少一行——unmapped scenario 是 blocking defect，不是 TODO
- 账本是覆盖下限（floor）：每个 scenario 至少一个具名测试，额外测试不需要账本条目

### 断言强度三判据（🟢 的判据，缺一不可）

账本 🟢 不是"测试存在且通过"——那是覆盖存在性。🟢 的完整判据是"测试断言承接了该 scenario 承诺的预期结果"，逐行过三条：

1. **断言覆盖场景承诺**：测试的断言点覆盖该 scenario 描述的预期行为（输入 → 期望输出/状态），不是只测"不报错""不抛异常"这类弱保证。scenario 承诺"返回去重后的 1 条"，断言就得落到"结果集大小 == 1"，不能只断言"调用成功"。
2. **断言可证伪**：能说出哪个产线变更会让这个断言失败（口径沿用 `test-driven-development` 的「可证伪性自检」节）。从实现反抄期望的断言不算——那是变化检测器。
3. **断言落点为行为非文本**：断言落点是返回值 / 状态变化 / 外部效果，不是"源码里出现某字符串"（口径沿用 `test-driven-development` 的「三个伪测试陷阱」的字符串存在性陷阱）。

三判据任一不过 → 该行不得标 🟢，回改测试补强断言，或经 `td-apply` 步骤 6.1 判为 blocking defect。

### 三向闭合（spec ↔ task ↔ test 双向无孤儿）

账本与 tasks.md 的 `覆盖 scenario` 字段（见 `writing-plans/references/task-template.md`「必填字段模板」节）构成双向闭合，两侧孤儿都是 blocking defect：

- **scenario 侧无孤儿**：账本每行的 `实现 task` 列必须非空（`N/A` 状态行除外——无可执行测试面的 scenario 可无 task 承载，但须在 `实现 task` 列标 `—` 并在等价机械校验项里说明理由）；每个 scenario 至少被一个 task 声明覆盖。
- **task 侧无孤儿**：tasks.md 里每条声明了 `覆盖 scenario` 的 task，其列出的每个 scenario 名必须能在账本 Scenario 列逐字找到；task 实现了某 scenario 却没在账本登记 → 孤儿 task，回 `td-propose` 步骤 6.c 补账本行。

同一场景可由多个 task 实现（`实现 task` 列多值），同一 task 可覆盖多个 scenario（`覆盖 scenario` 字段多值）——多对多关系，双向都要闭合。

### 机械校验（产出账本时逐行做，任一不过即回改，不得带病交付）

1. **路径存在性**：账本内每个测试文件路径必须实际存在（逐一核对文件系统，不得凭记忆转写路径）
2. **名称对齐**：Scenario 列的名称必须与 spec 现文逐字一致（打开 spec 复制原文，禁止凭印象缩写或改写）
3. **三向闭合核对**：`实现 task` 列引用的 task 编号在 tasks.md 里存在；tasks.md 里声明 `覆盖 scenario` 的 task 反向能在账本找到——双向交叉核对（口径见上方「三向闭合」节）

### N/A 处置

- `N/A` 条目在 archive 复盘时汇总说明数量与理由（tier-large 须逐条说明等价机械校验）

## tier 分层

| tier | 强度 |
|---|---|
| `tier-small` | 仅当 `applyRequires` 含 `specs` **且**含可执行测试面时强制；否则跳过并在账本头注明理由（`applyRequires` 不含 `specs` 或 specs 全部为纯文档 / 配置类无可执行测试面）。三向闭合的 task 侧核对在 tier-small 降级为提醒（不阻塞），scenario 侧与断言强度三判据仍强制 |
| `tier-medium` | 强制（同上条件），三向闭合双向核对 + 断言强度三判据全强制；`N/A` 条目在复盘里汇总说明数量与理由 |
| `tier-large` | 强制，三向闭合双向核对 + 断言强度三判据全强制；`N/A` 条目须在 archive 复盘里逐条说明等价机械校验，不允许静默 |
