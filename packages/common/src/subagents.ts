import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { randomUUID } from "node:crypto";

export const PI_SUBAGENTS_PACKAGE_VERSION = "0.58.0" as const;

const SUBAGENT_RPC_REQUEST_EVENT = "subagents:rpc:v1:request";
const SUBAGENT_RPC_REPLY_PREFIX = "subagents:rpc:v1:reply:";
const RUNTIME_AGENT_REGISTER_EVENT = "pi-subagents:runtime-agent-register:v1";

export type RuntimeAgentRegistration = {
	dispose(): void;
};

export type RuntimeAgentRegisterResult =
	{ ok: true; registration: RuntimeAgentRegistration } | { ok: false; error: Error };

export type RuntimeAgentDefinition = {
	description: string;
	systemPrompt: string;
	tools: string[];
};

type RuntimeAgentRegisterRequest = {
	version: 1;
	name: string;
	definition: RuntimeAgentDefinition;
	result?: RuntimeAgentRegisterResult;
};

type SubagentRpcSuccessReply<TData> = {
	version?: 1;
	requestId?: string;
	success: true;
	data: TData;
};

type SubagentRpcFailureReply = {
	version?: 1;
	requestId?: string;
	success: false;
	error?: { code?: string; message?: string };
};

type SubagentRpcReply<TData> = SubagentRpcSuccessReply<TData> | SubagentRpcFailureReply;

export type SubagentPingResult = {
	version?: number;
	methods?: string[];
	capabilities?: Record<string, unknown>;
	events?: Record<string, unknown>;
	session?: Record<string, unknown>;
	[key: string]: unknown;
};

export type SubagentSpawnResult = {
	runId?: string;
	id?: string;
	[key: string]: unknown;
};

export type SubagentSpawnParams = Record<string, unknown>;

export type SubagentRpcMethod = "ping" | "status" | "manage" | "spawn" | "steer" | "interrupt" | "stop" | "resume";

export function registerRuntimeAgent(
	pi: ExtensionAPI,
	name: string,
	definition: RuntimeAgentDefinition,
): RuntimeAgentRegisterResult | undefined {
	const request: RuntimeAgentRegisterRequest = {
		version: 1,
		name,
		definition,
	};
	pi.events.emit(RUNTIME_AGENT_REGISTER_EVENT, request);
	return request.result;
}

export async function requestSubagentsRpc<TData>(
	pi: ExtensionAPI,
	method: SubagentRpcMethod,
	params: Record<string, unknown> = {},
	options: { timeoutMs?: number } = {},
): Promise<TData> {
	const requestId = randomUUID();
	const replyEvent = `${SUBAGENT_RPC_REPLY_PREFIX}${requestId}`;
	const timeoutMs = options.timeoutMs ?? 10_000;

	return await new Promise<TData>((resolve, reject) => {
		const unsubscribe = pi.events.on(replyEvent, (reply: unknown) => {
			const typedReply = reply as SubagentRpcReply<TData>;
			clearTimeout(timeout);
			unsubscribe();
			if (typedReply.success) resolve(typedReply.data);
			else reject(new Error(typedReply.error?.message ?? `pi-subagents RPC ${method} failed`));
		});

		const timeout = setTimeout(() => {
			unsubscribe();
			reject(new Error("Timed out waiting for pi-subagents RPC reply. Is pi-subagents installed and loaded?"));
		}, timeoutMs);

		pi.events.emit(SUBAGENT_RPC_REQUEST_EVENT, {
			version: 1,
			requestId,
			method,
			params,
		});
	});
}

export async function pingSubagents(
	pi: ExtensionAPI,
	options: { timeoutMs?: number } = {},
): Promise<SubagentPingResult> {
	return await requestSubagentsRpc<SubagentPingResult>(pi, "ping", {}, options);
}

export async function spawnSubagentWorkflow(
	pi: ExtensionAPI,
	params: SubagentSpawnParams,
	options: { timeoutMs?: number } = {},
): Promise<SubagentSpawnResult> {
	return await requestSubagentsRpc<SubagentSpawnResult>(pi, "spawn", params, options);
}
