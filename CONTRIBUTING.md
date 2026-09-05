# Contributing to total-design

> 装上它，你的 agent 就有了一个总体设计部。

感谢你考虑为 total-design 贡献！这是一个开源的 atomcode plugin，把 OpenSpec（契约层）+ Superpowers（行为层）+ 钱学森系统工程（约束层主基调）封装成一个可分发的 plugin。

## 项目身份

先读 `AGENTS.md` 了解项目身份和结构。简单说：

- 这是一个 **atomcode plugin**，不是应用项目
- 产出形态：一组 Markdown 文件（`SKILL.md` / 命令文件）+ manifest
- 没有可执行代码，所有"逻辑"都是 Markdown 指令

## 三种贡献方式

### 1. 报告问题 / 提建议

- 用 GitHub Issues
- 标题写清是"问题报告"还是"功能建议"
- 如果是问题报告，附上：atomcode 版本、plugin 版本、触发场景、预期 vs 实际

### 2. 改 skill / command / constraint

- 改 skill → 改 `skills/<skill-name>/SKILL.md`
- 改 command → 改 `commands/<command-name>.md`
- 改 constraint → 改 `skills/<constraint-name>/SKILL.md`（注意：约束层 skill 必须有 `## 服务的主基调原则` 一节）

### 3. 加新的 skill / command / constraint

- 加 skill → 新建 `skills/<new-skill-name>/SKILL.md`
- 加 command → 新建 `commands/td-<new-command-name>.md`
- 加 constraint → 新建 `skills/<new-constraint-name>/SKILL.md`，并在正文开头加 `## 服务的主基调原则` 一节

## 贡献流程

### 1. Fork + Clone

```bash
git clone <your-fork-url>
cd total-design
```

### 2. 创建分支

```bash
git checkout -b feat/<short-description>
# 或
git checkout -b fix/<short-description>
```

### 3. 改动

改 `SKILL.md` / 命令文件 / `plugin.json` 等。

### 4. 本地验证

```bash
# 检查 plugin.json 是合法 JSON
node -e 'JSON.parse(require("fs").readFileSync("plugin.json", "utf8")); console.log("OK plugin.json")'

# 检查所有 SKILL.md 有 frontmatter + 必填字段
node - <<'EOF'
const fs = require('fs');
function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) yield* walk(p);
    else if (e.name === 'SKILL.md') yield p;
  }
}
for (const p of walk('skills')) {
  const c = fs.readFileSync(p, 'utf8');
  if (!c.startsWith('---')) throw new Error(`${p}: no frontmatter`);
  const end = c.indexOf('---', 3);
  if (end === -1) throw new Error(`${p}: unterminated frontmatter`);
  const fm = c.slice(3, end);
  for (const k of ['name', 'description']) {
    if (!fm.includes(k + ':')) throw new Error(`${p}: missing ${k}`);
  }
  console.log(`OK ${p}`);
}
EOF

# 检查所有命令文件名带 td- 前缀
ls commands/ | grep -v ^td- && echo "FAIL: command without td- prefix" || echo "OK: all commands have td- prefix"

# 检查无冒号在 skill / command 名
node - <<'EOF'
const fs = require('fs');
function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}
let bad = false;
for (const d of ['skills', 'commands']) {
  for (const p of walk(d)) {
    if (p.includes(':')) {
      console.log(`FAIL ${p}: colon in filename`);
      bad = true;
    }
  }
}
if (bad) process.exit(1);
console.log('OK: no colons');
EOF
```

### 5. Commit

使用 conventional commits：

```bash
git add .
git commit -m "feat: add <skill-name> skill"
```

类型：

- `feat` — 新增 skill / command / constraint
- `fix` — 修复 skill 触发条件 / 命令逻辑错误
- `docs` — 改 README / AGENTS.md / CONTRIBUTING.md
- `refactor` — 重组目录结构 / 重命名 skill
- `test` — 加测试（目前没有自动化测试，但有上面的手动验证脚本）

### 6. Push + PR

```bash
git push origin feat/<short-description>
```

然后在 GitHub 上开 PR。

**PR 描述里写清：**

- 改了什么（哪些 skill / command / constraint）
- 为什么改（动机 / 场景）
- 怎么验证的（跑过哪些验证脚本）
- 是否改了 `system-engineering` 主基调 skill（改主基调需要更高门槛的讨论）

## 设计原则（贡献前必读）

### 1. 钱学森系统工程主基调是第零层

所有 constraint 都在系统工程框架下生效。每条局部规律（Brooks / Goldratt / 精益）都要显式声明它服务主基调的哪一条。

**贡献约束**：如果你加一个新的 constraint skill，必须在正文开头加 `## 服务的主基调原则` 一节，显式 link 到 `system-engineering` skill 的某一条主基调。没这一节的 PR 会被打回。

### 2. profile × tier 二维配置

- **profile**（仓库状态）：greenfield / brownfield / maintenance
- **tier**（系统复杂度）：small / medium / large

两个维度以 `field-assessment` 的 `references/` 变体文件形态存在（3 profile + 3 tier），agent 根据现场判读激活命中的 profile 一份 + tier 一份。强度以 `field-assessment` 表 1（5 个 constraint 强度）、表 2（human-in-loop 加成）、表 3（system-audit 频率）为单一事实源。

**贡献约束**：如果你加新的 profile 或 tier，要同时更新 `field-assessment` 表 1/2/3 及 `references/` 下的对应变体文件。

### 3. 触发式而非 hook 强制

Superpowers 的"触发式"哲学保留：skill 靠 agent 根据上下文判读触发，不靠 hook 强制。

**贡献约束**：默认不引入新的 hook。如果引入，必须在 PR 描述里论证为什么 hook 比触发式更合适。

### 4. 不原样照搬 Superpowers

转译时去掉 Superpowers 自己的 plugin 引用、marketplace 引用，只保留方法论内核。每个 skill 加 `## 服务的主基调原则` 一节。

**贡献约束**：从 Superpowers 转译 skill 时，不要直接复制粘贴。要：
- 去掉 Superpowers 的 marketplace / plugin 引用
- 在正文开头加 `## 服务的主基调原则` 一节
- 调整语气和具体步骤以贴合 total-design 的三层结构

### 5. 不重新实现 OpenSpec CLI

本 plugin 转译 OpenSpec 的方法论到 atomcode，不重新实现 OpenSpec 的 CLI。命令调用 `openspec` CLI 工具。

**贡献约束**：不要在命令文件里实现 OpenSpec CLI 已经有的功能。命令文件应该是"调用 CLI + 触发 skills + 遵守 constraints"的编排，不是 CLI 本身。

## atomcode plugin 规范（贡献前必读）

以下事实来自 atomcode 源码 `crates/atomcode-core/src/plugin/manifest.rs` 和 `skill.rs`：

| 项 | 规则 |
|---|---|
| manifest 文件名 | `plugin.json`（必须 JSON，不接受 YAML） |
| manifest 合法字段 | `name` / `version` / `description` / `skills` / `commands` / `hooks` |
| **无 `constraints` 字段** | 约束层不能用 manifest 声明，必须以 skill 形态存在 |
| **无 `profiles` / `tiers` 字段** | 二维配置不能靠 manifest 实现，必须以 skill 形态存在 |
| skill/command 命名规则 | 1–64 字符；合法字符 `a-zA-Z0-9-_/`；**禁 `:`**；禁首尾斜杠、`//` |
| skill 形态 | 两种布局都支持：① 目录式 `<dir>/SKILL.md` ② 扁平 `<name>.md`（legacy） |
| skill frontmatter 字段 | `name` / `description` / `disable-model-invocation` / `user-invocable` / `argument-hint` / `allowed-tools`（原子字符，连字符分隔，与 README 与 AGENTS.md 模板一致；下划线变体会被 atomcode 静默忽略） |
| 命令生态惯例 | 扁平 kebab-case，无冒号 |

## PR 审查标准

审查者会按以下标准看 PR：

### 必过项

- [ ] `plugin.json` 是合法 JSON
- [ ] 所有 `SKILL.md` 有 frontmatter + `name` + `description`
- [ ] 所有命令文件有 frontmatter + `description`
- [ ] 文件名无冒号（atomcode 规则）
- [ ] 改 constraint skill 的，正文开头有 `## 服务的主基调原则` 一节
- [ ] 改 `system-engineering` 主基调 skill 的，PR 描述里论证了为什么需要改主基调
- [ ] commit 风格符合 conventional commits

### 加分项

- [ ] PR 描述里附了实测场景（"我在 X 项目里装上这个改过的 plugin，跑了 Y 命令，结果是 Z"）
- [ ] 改 skill 的，更新了对应的 profile / tier 强度矩阵
- [ ] 改命令的，更新了 README 的命令清单

### 打回项

- [ ] 从 Superpowers 直接复制粘贴 skill，没转译
- [ ] 加新的 hook 但没论证为什么触发式不够
- [ ] 加新的 constraint skill 但没 `## 服务的主基调原则` 一节
- [ ] 改主基调 skill 但没充分讨论

## 风格

### Markdown 风格

- 标题用 `#` / `##` / `###`，不跳级
- 代码块标语言（` ```bash ` / ` ```javascript ` / ` ```markdown `）
- 表格用标准 markdown 表格语法（`|` 分隔）
- 不用 HTML 标签

### 语气风格

- 直接、简洁、命令式
- 不写"please" / "kindly" / "you might want to"
- 不写"我相信" / "我觉得" / "可能"——直接说事实
- 不写"在这个 section 中我们将讨论"——直接讨论

### 中文 vs 英文

- skill / command 正文：**中文为主**，因为目标用户里有大量中文开发者，且钱学森系统工程本身是中文语境的学术传统
- code / command / filename：**英文**，符合 atomcode 命名规则
- AGENTS.md / CONTRIBUTING.md / README.md：**中文为主，关键术语保留英文**

## 社区行为准则

参见 `CODE_OF_CONDUCT.md`。简单说：

- 尊重所有人——不论背景、经验、立场
- 聚焦技术讨论——不攻击人
- 接受批评——别人指出你的 PR 问题时，先想是不是真的有问题，再想怎么回应

## License

本 plugin 以 MIT 协议开源。贡献即表示你同意你的贡献也以 MIT 协议发布。

## 联系

- GitHub Issues：报 bug / 提建议
- GitHub Discussions：讨论设计 / 问问题
- 不要私下联系维护者要求优先处理你的 PR

---

感谢你的贡献！
