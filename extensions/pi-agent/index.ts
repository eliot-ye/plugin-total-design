/**
 * total-design slash command bridge
 *
 * Registers short-form /td-* commands that invoke the corresponding
 * total-design skills. The skills themselves are loaded from the
 * pi package (git:atomgit.com/eliot-ye/plugin-total-design).
 *
 * Pi invocation:  /td-propose add-user-auth
 * Bridge to:      /skill:td-propose add-user-auth
 */

type SendUserMessage = (
  content: string,
  options?: { deliverAs?: "steer" | "followUp"; expandPromptTemplates?: boolean },
) => Promise<void> | void;

export default function (pi: {
  registerCommand: (
    name: string,
    options: { description: string; handler: (args: string, ctx: unknown) => void | Promise<void> },
  ) => void;
  sendUserMessage: SendUserMessage;
}) {
  const commands: [string, string][] = [
    [
      "td-init",
      "初始化 total-design 工作流：检查 OpenSpec 结构 + 配置 .gitignore",
    ],
    [
      "td-propose",
      "创建 change，生成 proposal / design / tasks artifact",
    ],
    [
      "td-explore",
      "写代码前的思考伙伴，需求不清时的主入口",
    ],
    [
      "td-apply",
      "按 change 的 tasks.md 实施",
    ],
    [
      "td-reverse-spec",
      "中途接手项目：先 reverse-spec 已有代码建立 baseline",
    ],
    [
      "td-archive",
      "完成后归档（含实际 vs 预期复盘）",
    ],
    [
      "td-system-audit",
      "周期性对照系统工程主基调自检",
    ],
    [
      "td-list",
      "列出所有活跃 change 态势（只读）",
    ],
  ];

  for (const [name, description] of commands) {
    pi.registerCommand(name, {
      description,
      handler: async (args: string, ctx: unknown) => {
        // sendUserMessage is on `pi` (extension API), not on command ctx.
        // Command ctx only gets session-replacement methods (newSession,
        // fork, switchSession) — its sendUserMessage only appears on the
        // ReplacedSessionContext handed to withSession callbacks.
        await pi.sendUserMessage(`/skill:${name} ${args}`.trim());
      },
    });
  }
}
