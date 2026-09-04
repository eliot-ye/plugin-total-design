# config.yaml context 引导流程

本文件是 `openspec/config.yaml` 的 `context` 字段引导填写的**单一权威**。`td-explore` / `td-propose` / `td-init` 首次运行读取现场背景时都执行本节，不各自重复展开。

## 引导流程

1. 读 `openspec/config.yaml` 的 `context` 字段（tech stack、conventions、domain knowledge 等）。**文件不存在 → 先创建骨架（只写 `context: ""`），随后按空值流程走**（官方 `openspec init --tools none` 只建目录不生成 config.yaml，此路径真实可达）。
2. **若为空、被注释、或仍是模板默认值**：自动探索需要的信息，必要时一次问完以下三个问题，拿到答案后写入 `context` 字段：

   - "项目的主要 tech stack 是？"（如 TypeScript / Rust / Python / 混合）
   - "团队遵守的 conventions 有？"（如 conventional commits / 代码风格指南 / PR 模板）
   - "项目所在的 domain 是？"（如 e-commerce / infra / 内部工具）

3. 用户答完 → 写入 `context` 字段 → 继续后续步骤。
4. **用户跳过 → 保持空，继续后续步骤（不阻塞）。**
