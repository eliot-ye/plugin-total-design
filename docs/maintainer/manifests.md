# Manifest 与发布

> **读者**：维护者——要改 manifest、加平台、或发版的人。
> **读完应能**：知道四处清单各自服务谁、合法字段、哪些必须一致、发版时同步改什么。

## 四处清单

| 位置 | 服务对象 | 角色 |
|---|---|---|
| `.claude-plugin/plugin.json` | Claude Code + atomcode | 加载清单（skills / commands / hooks 资产字段） |
| `.claude-plugin/marketplace.json` | Claude Code + atomcode | git marketplace 声明 |
| 根 `plugin.json` | Agent Plugins 1.0.0 生态 | 跨平台元数据（`$schema` / `name` / `version` / `description` / `author`），符合标准的客户端据此识别并加载 `skills/` |
| `package.json` | Pi Agent + DeepSeek Harness (DSH) | `pi.skills` / `pi.extensions`；`dsh.bundle.patch` 指向 `dsh/cordis.patch.yml` |

DSH 不新增清单文件——其 bundle 身份由 `package.json` 承载。

## 字段规则

- 只接受 JSON（不接受 YAML）。
- `.claude-plugin/plugin.json` 合法字段（Claude Code + atomcode 兼容并集）：`name` / `version` / `description` / `skills` / `commands` / `hooks`。
- `skills` / `commands` 接受字符串或路径数组；本 plugin 用字符串 `"./skills"` / `"./commands"`（字符串形态是 atomcode 原生支持，Claude Code 识别为"追加默认路径"）。
- **没有** `constraints` / `profiles` / `tiers` 字段——这些必须以 skill 形态存在。
- 根 `plugin.json` schema 是 **closed**（Agent Plugins 1.0.0 官方规范）：只允许 `$schema` / `name` / `version` / `description` / `author` / `homepage` / `repository` / `license` / `keywords` / `extensions`；v1 只定义 `skills/` + `mcp.json` 两种组件，因此 `commands/` 仅由 atomcode / Claude Code 通过 `.claude-plugin/plugin.json` 加载。

## 一致性硬约束

- 四处清单中**描述本 plugin 的字段**必须一致：根 `plugin.json`、`.claude-plugin/plugin.json`、`.claude-plugin/marketplace.json` 的 `plugins[0]`、`package.json` 的 `name` / `version` / `description` 完全相同，version bump 时同步。
- `description` 保持**纯 ASCII**——atomcode TUI plugin manager 按字节下标切截断，多字节字符会导致 panic。
- `marketplace.json` 的顶层 `name`（`total-design-marketplace`）与 `description` 是 marketplace 自身身份，不要求与 plugin 条目一致。

## Agent Plugins 1.0.0

本 plugin 通过根 `plugin.json` 的 `$schema` 声明 conformance（`https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`）。任何遵循该标准的客户端都能通过根 `plugin.json` 识别并加载 `skills/` 目录。

## 发布流程（version bump 与发布文档同步）

**版本号是否 bump 是发布决策，不是改动的自动后果**——改 SKILL.md / 命令文件 / 文档不默认要求 bump；只有决定发布新版本时才 bump。

决定 bump 时，以下必须在同一个逻辑变更内完成：

1. **四处清单** `version` 同步（见上方一致性硬约束）。
2. **CHANGELOG.md**：按 Keep a Changelog 在顶部新增当前版本条目（最新在上），按 Added / Fixed / Changed / Docs 分类；历史条目只读。
3. **RELEASE_NOTES.md**：更新为当前版本说明——本版本定位、行为变更表（升级用户感知差异）、升级步骤、完整变更列表指向 CHANGELOG 对应条目。

不允许只 bump 版本不更新发布文档。

## 自检命令

```bash
# 四处清单中本 plugin 的 name / version / description 一致且 ASCII
node -e '
const fs = require("fs");
const entries = [
  JSON.parse(fs.readFileSync("plugin.json", "utf8")),
  JSON.parse(fs.readFileSync(".claude-plugin/plugin.json", "utf8")),
  JSON.parse(fs.readFileSync(".claude-plugin/marketplace.json", "utf8")).plugins[0],
  JSON.parse(fs.readFileSync("package.json", "utf8")),
];
for (const key of ["name", "version", "description"]) {
  const values = entries.map((e) => e[key]);
  if (new Set(values).size !== 1) throw new Error(`${key} 不一致: ${values.join(" | ")}`);
  if (key === "description" && /[^\x00-\x7F]/.test(values[0])) throw new Error("description 非 ASCII");
}
console.log("OK: name/version/description 一致且 ASCII");
'
```
