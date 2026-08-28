import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import {
	DEFAULT_AGENTS,
	DEFAULT_MAX_CYCLES,
	DEFAULT_ROLE_PROMPTS,
	type DevLoopAgents,
	type DevLoopConfig,
	type DevLoopOptions,
	type DevLoopRolePrompts,
} from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJsonFile(path: string): unknown {
	return JSON.parse(readFileSync(path, "utf8"));
}

function resolveConfigPath(configPath: string, value: string): string {
	return isAbsolute(value) ? value : resolve(dirname(configPath), value);
}

function maybeReadConfig(path: string): Partial<DevLoopConfig> {
	if (!existsSync(path)) return {};
	const raw = readJsonFile(path);
	if (!isRecord(raw)) throw new Error(`Invalid dev-loop config at ${path}: expected object`);

	const config: Partial<DevLoopConfig> = {};
	if (raw.maxCycles !== undefined) {
		const maxCycles = raw.maxCycles;
		if (typeof maxCycles !== "number" || !Number.isInteger(maxCycles) || maxCycles < 1 || maxCycles > 10) {
			throw new Error(`Invalid dev-loop config at ${path}: maxCycles must be an integer from 1 to 10`);
		}
		config.maxCycles = maxCycles;
	}
	if (raw.agents !== undefined) {
		if (!isRecord(raw.agents)) throw new Error(`Invalid dev-loop config at ${path}: agents must be an object`);
		const agents: Partial<DevLoopAgents> = {};
		for (const key of ["briefer", "worker", "tester", "reviewer", "sanity"] as const) {
			const value = raw.agents[key];
			if (value === undefined) continue;
			if (typeof value !== "string" || !value.trim()) {
				throw new Error(`Invalid dev-loop config at ${path}: agents.${key} must be a non-empty string`);
			}
			agents[key] = value.trim();
		}
		config.agents = { ...DEFAULT_AGENTS, ...agents };
	}
	if (raw.rolePrompts !== undefined) {
		if (!isRecord(raw.rolePrompts))
			throw new Error(`Invalid dev-loop config at ${path}: rolePrompts must be an object`);
		const rolePrompts: DevLoopRolePrompts = {};
		for (const key of ["worker", "tester", "reviewer"] as const) {
			const value = raw.rolePrompts[key];
			if (value === undefined) continue;
			if (typeof value !== "string" || !value.trim()) {
				throw new Error(`Invalid dev-loop config at ${path}: rolePrompts.${key} must be a non-empty path string`);
			}
			rolePrompts[key] = resolveConfigPath(path, value.trim());
		}
		config.rolePrompts = rolePrompts;
	}
	return config;
}

function findUp(start: string, relativePath: string): string | undefined {
	let current = start;
	while (true) {
		const candidate = join(current, relativePath);
		if (existsSync(candidate)) return candidate;
		const parent = dirname(current);
		if (parent === current) return undefined;
		current = parent;
	}
}

export function loadDevLoopConfig(cwd: string): DevLoopConfig {
	const configPaths = [join(homedir(), ".pi", "agent", "dev-loop", "config.json")];
	const projectConfig = findUp(cwd, join(".pi", "dev-loop.json"));
	if (projectConfig) configPaths.push(projectConfig);

	let config: DevLoopConfig = {
		maxCycles: DEFAULT_MAX_CYCLES,
		agents: DEFAULT_AGENTS,
		rolePrompts: DEFAULT_ROLE_PROMPTS,
	};
	for (const path of configPaths) {
		const partial = maybeReadConfig(path);
		config = {
			maxCycles: partial.maxCycles ?? config.maxCycles,
			agents: { ...config.agents, ...(partial.agents ?? {}) },
			rolePrompts: { ...config.rolePrompts, ...(partial.rolePrompts ?? {}) },
		};
	}
	return config;
}

export function parseDevLoopArgs(args: string, config: DevLoopConfig): DevLoopOptions {
	const tokens = args.trim().split(/\s+/).filter(Boolean);
	let maxCycles = config.maxCycles;
	const agents = { ...config.agents };
	const promptParts: string[] = [];

	for (let index = 0; index < tokens.length; index += 1) {
		const token = tokens[index];
		const next = tokens[index + 1];

		if (token === "--cycles" || token === "--max-cycles") {
			const value = Number(next);
			if (!Number.isInteger(value) || value < 1 || value > 10) {
				throw new Error("--cycles must be an integer from 1 to 10");
			}
			maxCycles = value;
			index += 1;
			continue;
		}
		if (
			token === "--briefer" ||
			token === "--worker" ||
			token === "--tester" ||
			token === "--reviewer" ||
			token === "--sanity"
		) {
			if (!next) throw new Error(`${token} requires an agent name`);
			if (token === "--briefer") agents.briefer = next;
			if (token === "--worker") agents.worker = next;
			if (token === "--tester") agents.tester = next;
			if (token === "--reviewer") agents.reviewer = next;
			if (token === "--sanity") agents.sanity = next;
			index += 1;
			continue;
		}
		promptParts.push(token);
	}

	return { prompt: promptParts.join(" "), maxCycles, agents, rolePrompts: config.rolePrompts };
}
