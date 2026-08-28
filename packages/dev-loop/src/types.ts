export const DEFAULT_MAX_CYCLES = 3;

export type DevLoopAgents = {
	briefer: string;
	worker: string;
	tester: string;
	reviewer: string;
	sanity: string;
};

export type DevLoopRolePrompts = {
	worker?: string;
	tester?: string;
	reviewer?: string;
};

export type DevLoopConfig = {
	maxCycles: number;
	agents: DevLoopAgents;
	rolePrompts: DevLoopRolePrompts;
};

export type DevLoopOptions = DevLoopConfig & {
	prompt: string;
};

export type LastRun = {
	runId?: string;
	prompt: string;
	maxCycles: number;
	agents: DevLoopAgents;
	startedAt: string;
};

export const DEFAULT_AGENTS: DevLoopAgents = {
	briefer: "oracle",
	worker: "worker",
	tester: "tester",
	reviewer: "reviewer",
	sanity: "reviewer",
};

export const DEFAULT_ROLE_PROMPTS: DevLoopRolePrompts = {};
