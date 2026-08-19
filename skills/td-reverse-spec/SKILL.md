---
name: td-reverse-spec
description: 中途接手项目专用：先 reverse-spec 已有代码，再 propose 改动。触发场景：用户说"接手项目"、"reverse spec"、"反推 spec"、"看现有代码"、"刚接手这个库"。
user-invocable: true
argument-hint: <existing-codebase-path or empty for cwd>
---

# td-reverse-spec

中途接手已有代码库时，直接 `/td-propose` 改动很危险——你不知道现有代码在 spec 层是什么样子。reverse-spec 先从代码反推 spec，建立 baseline，再在 baseline 上 propose 改动。

## 依赖技能

- `system-engineering`
- `constraint-matrix`

## 服务的主基调原则

**系统工程主基调第 2 条：总体设计部。**

reverse-spec 是总体设计部在"接手"阶段的工作——先建立系统全局视图，再决定动哪里。

**系统工程主基调第 4 条：开放的复杂巨系统。**

不简化还原，而是先识别层次（分系统切分），再在每个层次上建立认识。

## 输入 - 要 reverse-spec 的代码库路径。空则用当前工作目录

`$ARGUMENTS`

## 步骤

### 1. 激活主基调与配置层

激活主基调与配置层。只注入强度不做判断，按下述三步序列执行：

1. **`system-engineering`** — 主基调四条进入上下文。reverse-spec 是总体设计部在"接手"阶段的工作——先建立系统全局视图，再决定动哪里。
2. **profile × tier 识别** — 调 `constraint-matrix`，判读 `$_TD_PROFILE` / `$_TD_TIER`，读入表 1 + 表 2。会话内缓存，后续步骤直接引用。reverse-spec 本身是 profile-brownfield 的入口动作，但 tier 决定 reverse-spec 的粒度（small 粗粒度即可，large 要画分系统接口图）。
3. **其余 constraint** — 只把强度值读入上下文，不在本步判断是否触发。

### 2. 识别代码库状态

扫描目标代码库：

- 文件数、代码行数
- 主要目录结构
- 有无 `tests/`、CI 配置、`package.json` 等
- 最近 git 提交频率

判断依据如下，但**不重新判读 profile**——步骤 1 已通过 `constraint-matrix` 判读并缓存 `$_TD_PROFILE` / `$_TD_TIER`，本步骤直接消费，不与缓存打架：

- 文件数、代码行数
- 主要目录结构
- 有无 `tests/`、CI 配置、`package.json` 等
- 最近 git 提交频率

中途接手通常判读为 `profile-brownfield`。若步骤 1 判出其他 profile：`profile-greenfield`（代码库其实是脚手架）→ reverse-spec 可以粗粒度甚至跳过，见 `profile-greenfield` 的切换规则；`profile-maintenance`（已上线项目）→ reverse-spec 粒度按 tier 走，见该 profile 的切换规则。

### 3. 分系统切分

站在总体设计部视角，把代码库切成几个分系统（subsystem）。切分依据：

- 目录边界
- 模块依赖图
- 部署单元
- 数据所有权边界

不要过细——目标是识别"分系统"级别，不是"文件"级别。通常 3–8 个分系统。

### 4. 对每个分系统 reverse-spec

读分系统的代码，反推 spec：

- 这个分系统对外提供的契约是什么？（API、数据格式、事件）
- 这个分系统依赖哪些其他分系统？
- 这个分系统的关键不变量是什么？
- 这个分系统的已知缺陷 / 技术债？

输出到 `openspec/specs/<subsystem-name>/spec.md`。

### 5. 识别分系统间接口

把分系统之间的依赖关系画成图。识别：

- 接口的稳定性（哪些是公共契约，哪些是内部实现）
- 循环依赖
- 隐式依赖（共享数据库、共享配置）

### 6. 输出 reverse-spec 报告

按本 skill 的 `references/reverse-spec-report.md` 的报告模板输出（识别的分系统 + 接口图 + 各分系统 spec 位置 + 已知风险 + 建议的下一步）。

## Guardrails

- **不修改原代码**——reverse-spec 只读不写（除了写 spec 文件）
- 不要 reverse-spec 全部分系统到完美——目标是建立 baseline，不是写教科书
- 优先 reverse-spec 你**接下来要改**的那个分系统，其他分系统粗粒度即可

## 与其他命令的关系

- reverse-spec 的产物（`openspec/specs/<subsystem>/spec.md` baseline + 步骤 6 的 reverse-spec 报告）被 `/td-propose` 引用：步骤 3 的 brownfield reverse-spec 检查消费 `openspec/specs/` 下的 baseline spec 作为"已建立认识"的判据，proposal 的"系统工程影响评估"节才有依据。
- reverse-spec 不直接被 `/td-apply` 引用——apply 读 change 内 artifact（proposal/design/specs/tasks），不读主 spec baseline。若 baseline 在 archive sync 后被合并进主 spec，apply 也不显式对照主 spec（这是 td-apply 自己的设计选择）。
- `/td-archive` 步骤 3 的"实际 vs 预期"复盘会把 baseline spec 作为"改之前真实状态"的对照源之一（见该 skill）。
- `/td-system-audit` 在 project scope 下会把 `openspec/specs/` 下的主 spec baseline 纳入审计对象（见该 skill）。
