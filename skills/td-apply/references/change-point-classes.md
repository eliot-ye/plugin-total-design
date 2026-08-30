# 四类变更点（caller impact 定义单一事实源）

本文件是四类变更点与 caller impact 触发条件的单一事实源，被三层防护的三处引用：

- `td-propose` 步骤 6.c「proposal.md 必填节：caller impact 分析」（前馈层）
- `td-apply` 步骤 4「Caller Impact 实测」子节（实时层）
- `requesting-code-review/references/architecture-review-checklist.md`（校验层）

改四类定义 / 触发条件 / 边界裁定时只改本文件，三处引用方不复述定义。

## 触发条件

满足任一即触发 caller impact 三层防护：

- change 跨分系统（proposal 影响评估的受影响分系统 ≥ 2）
- 涉及下列四类变更点任一类

单分系统 + 无四类变更点 → 三层均不触发（不给小改动加流程开销）。

## 四类变更点定义

1. **公共符号签名变更**（参数列表 / sync-async / 异常契约）
2. **Protocol / 接口方法变更**（抽象方法签名或语义）
3. **装配点变更**（构造调用 / 依赖注入 / bootstrap / bypass 路径）
4. **数据流 / 返回值语义变更**（返回值 shape / 字段含义 / 落库行为）

## 边界裁定

- 四类之外不做全量 call graph 追踪（对个人 / 小团队项目是过度设计）。
- 某变更点是否属于四类，按"是否可能被本分系统外的 caller 依赖"判断，判断不了时归入（保守原则）。

## 已知盲区

静态引用搜索抓不到动态 dispatch（反射 / DI 容器 / 字符串调用）——该盲区由 `td-apply` 步骤 7.2 的契约 / 集成测试与架构 review 清单的"隐式依赖"条目补，三层防护不对动态耦合宣称全覆盖。
