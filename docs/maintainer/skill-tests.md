# Skill 质量断言（开发态）

> **读者**：维护者——改 SKILL.md / references 前后想自动校验内容资产质量的人。
> **读完应能**：跑 `pnpm test`，读懂两个断言的口径与阈值依据，知道怎么调阈值。

这是**开发态工具**，作用对象是本仓库的 `skills/`。它不进 `skills/`、不进 `extensions/`、不随 plugin 分发、不在使用态被加载——装了 plugin 的用户 agent 看不到它。与 `hooks/td_state_sync.js`（运行时）性质不同。

运行：

```bash
pnpm test          # 或 node tests/run-all.mjs
```

任一断言失败 → 非零退出。**使用态 LLM 完全看不到这些断言**，它们只服务本仓库编辑。

## 断言 1：no-dev-files-in-skills

`tests/test-no-dev-files-in-skills.mjs`

对应 [AGENTS.md](../../AGENTS.md) 两条规则：「SKILL 不可引用 AGENTS 文件」+「SKILL 与 references 禁止开发态语句」。扫 `skills/**`（SKILL.md + `references/`），检测两类违规：

| 违规类型 | 检测的句式（正则） | 示例 |
|---|---|---|
| **agent 指令文件作规则来源** | `见/参考/按 AGENTS.md`、`规则在/来自 AGENTS.md` 等 | "编辑规则见 AGENTS.md" |
| **开发态编辑指令** | `只改本文件`/`引用本文件`/`由…合并而来`/`不重复定义` | "只改本文件" |

**关键设计——裸提及 ≠ 违规**：断言只抓"把 agent 指令文件当**规则来源**"的句式，不抓"提到文件名"本身。理由是 [AGENTS.md](../../AGENTS.md) 的「对象性豁免」：`agents-md-hygiene` 的职责就是操作用户项目同名文件，文件名以**操作对象**身份出现合法。所以 `agents-md-hygiene` 提 `AGENTS.md`（如"本 skill 是这类文件的单一格式权威"）不会误报——它没从该文件引入规则。

**怎么验证断言有效**：造一个含违规句式的临时 skill（如 `skills/__fixture__/SKILL.md` 写"见 AGENTS.md"）→ 跑断言应报错并 exit 1 → 删夹具。全绿有两种可能（真干净 / 规则太松），负向测试用于排除后者。

## 断言 2：skill-size

`tests/test-skill-size.mjs`

单个 `SKILL.md` 字符数 ≤ **16000**。

- **口径用字符（`wc -m`）不用字节**：中文文档，tokenizer 按字符/token 计，字符数才反映上下文成本。
- **只测 SKILL.md 本体**：触发即全量加载进上下文，是每次触发的固定成本；`references/` 按需读取、不总是进上下文，不在此强制（避免过度仪式）。
- **阈值 16000 依据**：当前 max 为 `td-propose` 12181，留 ~31% 余量——防继续膨胀而不卡现状。实测分布见断言输出（按体积降序，带条形图便于发现膨胀趋势）。

**调阈值**：改 `test-skill-size.mjs` 顶部 `const LIMIT`。收紧前先看断言输出的体积分布——若有 skill 已贴近当前阈值，说明该瘦身而非硬卡。

## 防复发

这两个断言把 [AGENTS.md](../../AGENTS.md) 里最容易腐烂的规则（开发态泄漏、体积膨胀）从"人工审核"变成"可跑断言"。新增同类规则时，优先做成 `tests/test-*.mjs` 挂进 `run-all.mjs`，而不是只写进审核清单——纸面规则靠自觉，断言不靠。