/**
 * total-design slash command bridge + native td-list + state sync on shutdown
 *
 * Registers short-form /td-* commands for Pi. Seven td-* commands invoke the
 * corresponding total-design skill via /skill:<name>; td-list has no skill and
 * implements its read-only logic natively (runs `openspec list`).
 *
 * On session_shutdown, reuses the exported functions from hooks/td_state_sync.js
 * (no forked logic — same single source of truth as the atomcode/Claude Code
 * SessionEnd hook) to reconcile openspec/.td-state/* from filesystem facts.
 *
 * Skills are loaded from the pi package (git:atomgit.com/eliot-ye/plugin-total-design).
 *
 * Pi invocation:  /td-propose add-user-auth
 * Bridge to:      /skill:td-propose add-user-auth
 * Native:         /td-list  →  runs `openspec list`
 * Shutdown:       reconcile .td-state from fs facts (reuses hook exports)
 */

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

import type { ExtensionAPI, ExtensionCommandContext, ExecResult } from "@earendil-works/pi-coding-agent";

// 命令 handler 只读 ctx.cwd / ctx.isIdle()，其余成员（ui/mode/waitForIdle 等）本插件不触达。
// 直接标注真实 ExtensionCommandContext，让 tsc 在 Pi 升级时捕获签名漂移。
type CommandCtx = ExtensionCommandContext;

// 定位插件根（extension 安装副本的 ext/pi-agent/index.ts → 上两级 = 插件根），
// 并把根注入 env 供 hook 的 loadReportMarkers 读取 audit 报告模板（与 CC 端
// ATOMCODE_PLUGIN_ROOT / CLAUDE_PLUGIN_ROOT 语义一致；未注入时 hook 回退内置
// marker，不崩溃）。
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
if (!process.env.ATOMCODE_PLUGIN_ROOT) {
  process.env.ATOMCODE_PLUGIN_ROOT = PLUGIN_ROOT;
}

// 复用 SessionEnd hook 导出的纯函数（CJS），不复制逻辑。
const require = createRequire(import.meta.url);
const hook = require(path.join(PLUGIN_ROOT, "hooks", "td_state_sync.js")) as {
  findProjectRoot: (cwd: string) => string | null;
  syncArchiveCounter: (stateDir: string, openspecDir: string) => void;
  syncAuditHistory: (stateDir: string) => void;
};

function cwdOf(ctx: CommandCtx): string {
  return ctx.cwd;
}

function idleOf(ctx: CommandCtx): boolean {
  return ctx.isIdle();
}

export default function (pi: ExtensionAPI) {
  // 7 个 td-* 桥接到同名 skill。td-list 无同名 skill，不走桥接，单独注册真实逻辑。
  // sendUserMessage 默认 expandPromptTemplates=false：/skill: 不会作为 skill 命令
  // 展开、而会当普通用户文本发给 LLM——桥接必须显式开启；streaming 时须指定
  // deliverAs，否则 Pi 报错拒绝。
  const bridgeCommands: [string, string][] = [
    ["td-init", "初始化 total-design 工作流：检查 OpenSpec 结构 + 配置 .gitignore"],
    ["td-propose", "创建 change，生成 proposal / design / tasks artifact"],
    ["td-explore", "写代码前的思考伙伴，需求不清时的主入口"],
    ["td-apply", "按 change 的 tasks.md 实施"],
    ["td-reverse-spec", "中途接手项目：先 reverse-spec 已有代码建立 baseline"],
    ["td-archive", "完成后归档（含实际 vs 预期复盘）"],
    ["td-system-audit", "周期性对照系统工程主基调自检"],
  ];

  for (const [name, description] of bridgeCommands) {
    pi.registerCommand(name, {
      description,
      handler: async (args: string, ctx: CommandCtx) => {
        // sendUserMessage 在 `pi`（extension API）上，不在 command ctx 上。
        const idle = idleOf(ctx);
        await pi.sendUserMessage(
          `/skill:${name} ${args}`.trim(),
          idle
            ? { expandPromptTemplates: true }
            : { expandPromptTemplates: true, deliverAs: "steer" },
        );
      },
    });
  }

  // td-list：只读命令，无同名 skill。逻辑不是照搬命令文本——直接跑 `openspec list`，
  // 把真实结果交给 agent 格式化为态势表。结果文本是散文（含 /td-propose 建议），
  // 不走 expandPromptTemplates，避免建议文字被误当命令展开。
  pi.registerCommand("td-list", {
    description: "列出所有活跃 change 态势（只读）",
    handler: async (args: string, ctx: CommandCtx) => {
      const cwd = cwdOf(ctx);
      let result: ExecResult;
      try {
        result = await pi.exec("openspec", ["list"], { cwd });
      } catch (err) {
        // exec 抛错（如 openspec 不在 PATH）——不崩溃会话，交给 agent 说明
        const msg = err instanceof Error ? err.message : String(err);
        await pi.sendUserMessage(
          `\`openspec list\` 调用失败：${msg}\n请确认已安装 OpenSpec CLI（独立工具，非本 plugin 内置）。`,
          idleOf(ctx) ? {} : { deliverAs: "steer" },
        );
        return;
      }
      if (result.code !== 0) {
        const msg = (result.stderr || result.stdout || "").trim() || `exit ${result.code}`;
        await pi.sendUserMessage(
          `\`openspec list\` 执行失败（exit ${result.code}）：${msg.slice(0, 300)}\n请确认已安装 OpenSpec CLI。`,
          idleOf(ctx) ? {} : { deliverAs: "steer" },
        );
        return;
      }
      const text = result.stdout.trim();
      await pi.sendUserMessage(
        text
          ? `以下是从 \`openspec list\` 得到的所有活跃（未归档）change，请整理成态势表呈现：\n\`\`\`\n${text}\n\`\`\`\n若列表为空，提示"当前没有未归档变更"，建议下一步 /td-propose 开新 change 或 /td-system-audit project 做全局自检。`
          : `\`openspec list\` 返回空：当前没有未归档变更。建议下一步 /td-propose 开新 change，或 /td-system-audit project 做全局自检。`,
        idleOf(ctx) ? {} : { deliverAs: "steer" },
      );
    },
  });

  // 会话结束 / 切换 / reload 时，从文件系统事实校正 .td-state 状态文件。
  // 复用 hook 导出的函数（同单一事实源），任何失败静默，不影响会话。
  pi.on("session_shutdown", async (_event, ctx) => {
    try {
      const cwd = ctx.cwd;
      const root = hook.findProjectRoot(cwd);
      if (!root) return; // 无 openspec/，本 plugin 不适用，静默退出
      const openspecDir = path.join(root, "openspec");
      const stateDir = path.join(openspecDir, ".td-state");
      try {
        hook.syncArchiveCounter(stateDir, openspecDir);
      } catch (err) {
        // 文件系统失败不影响会话
      }
      try {
        hook.syncAuditHistory(stateDir);
      } catch (err) {
        // 文件系统失败不影响会话
      }
    } catch (err) {
      // 整体失败不影响会话
    }
  });
}
