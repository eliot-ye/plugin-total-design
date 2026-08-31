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
- `field-assessment`

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

1. **`system-engineering`** — 主基调四条进入上下文。
2. **profile × tier 识别** — 调 `field-assessment`，判读 `$_TD_PROFILE` / `$_TD_TIER`，读入表 1 + 表 2。会话内缓存，后续步骤直接引用。reverse-spec 本身是 profile-brownfield 的入口动作，但 tier 决定 reverse-spec 的粒度（small 粗粒度即可，large 要画分系统接口图）。
3. **其余 constraint** — 只把强度值读入上下文，不在本步判断是否触发。

### 2. 识别代码库状态

扫描目标代码库（文件数、代码行数、目录结构、`tests/`/CI/`package.json` 有无、git 提交频率），但**不重新判读 profile**——步骤 1 已通过 `field-assessment` 判读并缓存 `$_TD_PROFILE` / `$_TD_TIER`，本步骤直接消费，不与缓存打架：

中途接手通常判读为 `profile-brownfield`。若步骤 1 判出其他 profile：`profile-greenfield`（代码库其实是脚手架）→ reverse-spec 可以粗粒度甚至跳过，见 `field-assessment` 的 `references/profile-greenfield.md`「与其他 profile 的切换」节；`profile-maintenance`（已上线项目）→ reverse-spec 粒度按 tier 走，见 `field-assessment` 的 `references/profile-maintenance.md`「与其他 profile 的切换」节。

### 3. 分系统切分

站在总体设计部视角，把代码库切成几个分系统（subsystem）。切分依据：

- 目录边界
- 模块依赖图
- 部署单元
- 数据所有权边界

不要过细——目标是识别"分系统"级别，不是"文件"级别。通常 3–8 个分系统。

**层次观归位**：分系统切分是主基调第 4 条「层次观」在 reverse-spec 阶段的工程化。当分系统之间的边界明显时，本步骤的切分结果是 `field-assessment` 识别流程"子系统独立定 tier"机制的触发输入（执行规则见 `field-assessment` 的 `references/subsystem-tiering.md`）。

### 4. 对每个分系统 reverse-spec

读分系统的代码，反推 spec。先回答四个问题（分析输入，不直接决定文件结构）：

- 这个分系统对外提供的契约是什么？（API、数据格式、事件）
- 这个分系统依赖哪些其他分系统？
- 这个分系统的关键不变量是什么？
- 这个分系统的已知缺陷 / 技术债？

输出到 `openspec/specs/<subsystem-name>/spec.md`，**结构必须能过 `openspec validate --specs`**：

- `## Purpose`：一句话职责（这个分系统是什么、解决什么问题）
- `## Requirements`：对外契约与关键不变量逐条写成 `### Requirement: <标题>`，标题下先写一行含 SHALL/MUST 关键字的规范陈述（如"本分系统 SHALL 对外提供 ……"——校验器要求 Requirement 正文必须含 SHALL 或 MUST，缺失时 validate 报 ERROR），再配 `#### Scenario: <场景名>`（`- **WHEN**` / `- **THEN**` 各一行）
- 依赖关系与技术债**不写入 spec**（spec 是该分系统的行为契约，不是依赖图）——依赖归报告的"分系统间接口图"节，技术债归报告的"已知风险 / 技术债"节

### 5. 识别分系统间接口

把分系统之间的依赖关系画成图。识别：

- 接口的稳定性（哪些是公共契约，哪些是内部实现）
- 循环依赖
- 隐式依赖（共享数据库、共享配置）

**与 `requesting-code-review` 架构 review 的连接**：本步骤识别的"循环依赖、隐式依赖"正是 `requesting-code-review` 的 `references/architecture-review-checklist.md` 里"低耦合"维度的检查项。reverse-spec 阶段识别的接口稳定性，是后续 `/td-propose` 步骤 7 架构 review 的输入——架构 review 时要对照 reverse-spec 报告里的接口稳定性，判断新 change 是否破坏了既有分系统的公共契约。

### 6. 输出 reverse-spec 报告

按 `references/reverse-spec-report.md` 的报告模板输出（识别的分系统 + 接口图 + 各分系统 spec 位置 + 已知风险 + 建议的下一步）。

## Guardrails

- **不修改原代码**——reverse-spec 只读不写（除了写 spec 文件）
- 不要 reverse-spec 全部分系统到完美——目标是建立 baseline，不是写教科书
- 优先 reverse-spec 你**接下来要改**的那个分系统，其他分系统粗粒度即可

