import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { pingSubagents, spawnSubagentWorkflow } from "@what3vercode/pi-common/subagents";
import { loadDevLoopConfig, parseDevLoopArgs } from "./config.js";
import type { DevLoopConfig, DevLoopOptions, LastRun } from "./types.js";
import { makeWorkflowScript } from "./workflow.js";

function formatError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

export default function (pi: ExtensionAPI) {
	let lastRun: LastRun | undefined;

	async function startDevLoop(options: DevLoopOptions, ctx: ExtensionCommandContext): Promise<void> {
		if (!options.prompt) {
			ctx.ui.notify(
				"Usage: /dev-loop [--cycles N] [--worker AGENT] [--tester AGENT] [--reviewer AGENT] <task>",
				"warning",
			);
			return;
		}
		if (!ctx.isIdle()) {
			ctx.ui.notify("/dev-loop can only start while Pi is idle.", "warning");
			return;
		}

		try {
			await pingSubagents(pi, { timeoutMs: 2_000 });
		} catch (error) {
			ctx.ui.notify(`Cannot start /dev-loop because pi-subagents RPC is unavailable: ${formatError(error)}`, "error");
			return;
		}

		const workflowScript = makeWorkflowScript(options.prompt, options);
		try {
			const data = await spawnSubagentWorkflow(pi, {
				workflowScript,
				cwd: ctx.cwd,
				context: "fresh",
				async: true,
				chatProgress: "auto",
			});
			lastRun = { ...options, runId: data.runId ?? data.id, startedAt: new Date().toISOString() };
			ctx.ui.notify(
				`Started /dev-loop${lastRun.runId ? ` (${lastRun.runId})` : ""}. Use subagent status/FleetView for progress.`,
				"info",
			);
		} catch (error) {
			ctx.ui.notify(`Failed to start /dev-loop: ${formatError(error)}`, "error");
		}
	}

	pi.registerCommand("dev-loop", {
		description: "Run worker -> tester -> reviewer cycles with configured pi-subagents",
		handler: async (args: string, ctx: ExtensionCommandContext) => {
			let options: DevLoopOptions;
			try {
				options = parseDevLoopArgs(args, loadDevLoopConfig(ctx.cwd));
			} catch (error) {
				ctx.ui.notify(formatError(error), "warning");
				return;
			}
			await startDevLoop(options, ctx);
		},
	});

	pi.registerCommand("dev-loop-status", {
		description: "Show dev-loop config and last run launched by this extension instance",
		handler: async (_args: string, ctx: ExtensionCommandContext) => {
			let config: DevLoopConfig;
			try {
				config = loadDevLoopConfig(ctx.cwd);
			} catch (error) {
				ctx.ui.notify(formatError(error), "error");
				return;
			}
			const last = lastRun
				? `\nLast run${lastRun.runId ? ` (${lastRun.runId})` : ""}: ${lastRun.prompt} [cycles=${lastRun.maxCycles}, started=${lastRun.startedAt}]`
				: "\nNo /dev-loop run has been launched in this session.";
			ctx.ui.notify(
				`dev-loop config: agents=${JSON.stringify(config.agents)}, rolePrompts=${JSON.stringify(config.rolePrompts)}, maxCycles=${config.maxCycles}${last}`,
				"info",
			);
		},
	});

	pi.registerTool({
		name: "start_dev_loop",
		label: "Start Dev Loop",
		description:
			"Queue a /dev-loop command for a worker/test/review workflow. Configure agents and role prompt paths in .pi/dev-loop.json or ~/.pi/agent/dev-loop/config.json.",
		parameters: {
			type: "object",
			properties: {
				prompt: { type: "string", description: "Development task, issue, or spec path for /dev-loop" },
				maxCycles: { type: "integer", minimum: 1, maximum: 10, description: "Maximum work/test/review cycles" },
			},
			required: ["prompt"],
			additionalProperties: false,
		},
		async execute(_toolCallId, params: { prompt: string; maxCycles?: number }) {
			const cycleFlag = params.maxCycles === undefined ? "" : `--cycles ${params.maxCycles} `;
			pi.sendUserMessage(`/dev-loop ${cycleFlag}${params.prompt}`, {
				deliverAs: "followUp",
				expandPromptTemplates: true,
			});
			return {
				content: [{ type: "text", text: "Queued /dev-loop as a follow-up command." }],
				details: {},
			};
		},
	});
}
