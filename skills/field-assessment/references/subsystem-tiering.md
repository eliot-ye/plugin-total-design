# 子系统独立定 tier（层次观归位，主基调第 4 条）

表 1 的 tier-small / tier-medium / tier-large 是**平面**维度，没有处理"系统内部的层次性"。钱学森系统工程强调"系统的层次结构"（主基调第 4 条「层次观」），复杂巨系统是多层级嵌套结构——一个 tier-large 的多仓库系统，每个仓库可能是 tier-small；一个 tier-large 的微服务系统，每个微服务可能是 tier-medium。

## 子系统独立定 tier 机制

- **触发条件**：`td-reverse-spec` 步骤 3「分系统切分」识别出"有明显分系统边界"时，或 `td-init` / `/td-system-audit` project scope 发现"系统层次跨 tier 边界"时。
- **执行规则**：每个子系统独立按 `identification-flow.md`「### 3. 判读 tier（三选一）」的 tier 判据定 tier。跨子系统的依赖链按"最高 tier 子系统"的强度处理（保守原则——按最复杂的子系统对待跨子系统边界）。
- **持久化**：`openspec/.td-state/profile-tier.yaml` 支持多子系统条目（每个子系统一条 `subsystem-<name>` 记录），文件模板见 `identification-flow.md` 的「### profile-tier.yaml 模板」节。
- **与 `td-apply` 步骤 7.2 的协同**：跨分系统边界验证的 tier 分层强度，按"受影响分系统中最高 tier"处理——避免"tier-small 子系统和 tier-large 子系统之间的边界只用冒烟级集成验证"的疏漏。

这不是把"一个 tier-large 的关键链"拆成"多个 tier-small 的关键链"——而是承认复杂巨系统是多层级嵌套结构，不同层次的子系统需要分层对待。
