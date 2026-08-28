import { readFileSync } from "node:fs";
import type { DevLoopConfig } from "./types.js";

const DEFAULT_ROLE_PROMPT_TEXT = {
	worker: `# Worker role

You are the worker child subagent for /dev-loop.

## Contract

You receive a Work Brief or a focused fix brief. You own code and test edits for this run.

TDD is the default method:

1. Write or update failing tests when behavior changes.
2. Implement the minimal code needed to pass.
3. Refactor after green.
4. Run targeted verification before returning.

## Allowed

- edit production code
- edit tests and fixtures
- run targeted tests/checks
- inspect relevant repo files and instructions

## Required output

\`\`\`md
## Status

success | blocked

## Changed Files

- ...

## Verification

- \`command\` — pass/fail

## Notes

...
\`\`\`

If blocked, explain the blocker and the smallest next action needed.`,
	tester: `# Tester role

You are the tester child subagent for /dev-loop.

## Contract

You are read-only. You may run tests/checks, but must not edit files.

Judge whether the tests are meaningful, sufficient, deterministic, and actually validate the intended behavior from the Work Brief.

## Check

- Do tests cover the acceptance criteria?
- Do tests fail for the right reason?
- Are tests behavior-oriented rather than implementation-detail assertions?
- Are mocks/fakes honest?
- Are edge cases missing?
- Are failures implementation bugs, bad tests, unrelated existing failures, or environment/tooling issues?

## Required output

\`\`\`md
## Verdict

pass | fail

## Commands Run

- \`command\` — pass/fail

## Findings

### P1: Short title

- Evidence:
- Impact:
- Required fix:

## Notes

...
\`\`\`

Use P0/P1 only for blocking issues. Put non-blocking issues under Notes or P2/P3 findings.`,
	reviewer: `# Reviewer role

You are the reviewer child subagent for /dev-loop.

## Contract

You are read-only. Do not edit files.

Review the whole diff against the Work Brief, issue/spec, current user intent, and repo instructions.

## Check

- Does the diff satisfy the Work Brief and acceptance criteria?
- Does it follow AGENTS.md, CONTEXT.md, ADRs, and existing conventions?
- Are architecture/API boundaries respected?
- Is scope proportionate?
- Is complexity justified?
- Are docs/domain updates needed?
- Are there obvious untested edge cases? Do not deep-audit tests; that belongs to tester.

## Severity

\`\`\`text
P0 = dangerous/broken/data loss/security/spec impossible
P1 = must fix before done: spec miss, failing behavior, bad tests, major design issue
P2 = should fix if cheap: maintainability, minor edge case, docs gap
P3 = nit/style/preference
\`\`\`

Only P0/P1 block completion.

## Required output

\`\`\`md
## Verdict

pass | fail

## Findings

### P1: Short title

- Evidence:
- Impact:
- Required fix:

## P2/P3 Notes

- ...
\`\`\``,
} as const;

function readRolePrompt(name: "worker" | "tester" | "reviewer", configuredPath?: string): string {
	return configuredPath ? readFileSync(configuredPath, "utf8") : DEFAULT_ROLE_PROMPT_TEXT[name];
}

export function makeWorkflowScript(userPrompt: string, options: DevLoopConfig): string {
	const rolePrompts = {
		worker: readRolePrompt("worker", options.rolePrompts.worker),
		tester: readRolePrompt("tester", options.rolePrompts.tester),
		reviewer: readRolePrompt("reviewer", options.rolePrompts.reviewer),
	};

	return String.raw`
const userPrompt = ${JSON.stringify(userPrompt)};
const maxCycles = ${JSON.stringify(options.maxCycles)};
const agents = ${JSON.stringify(options.agents)};
const rolePrompts = ${JSON.stringify(rolePrompts)};

function hasBlockingFindings(text) {
  const body = String(text || "");
  if (/\bP0\b/i.test(body) || /\bP1\b/i.test(body)) return true;
  if (/^## Verdict\s*\n\s*fail\b/im.test(body)) return true;
  if (/\bBLOCK\b/i.test(body)) return true;
  return false;
}

function clip(text, limit) {
  const s = String(text || "");
  return s.length > limit ? s.slice(0, limit) + "\n\n[clipped]" : s;
}

const briefTask = "Create a compact Work Brief for this /dev-loop request.\n\n" +
  "Request:\n" + userPrompt + "\n\n" +
  "Return exactly these sections:\n" +
  "## Goal\n## Acceptance Criteria\n## Constraints\n## Non-goals\n## Relevant Context\n## Verification Commands\n## Risk / Approval Notes\n\n" +
  "If the request is ambiguous or risky, state that clearly under Risk / Approval Notes. Do not edit files.";

const brief = await runs.run("brief", {
  agent: agents.briefer,
  task: briefTask,
  context: "fresh",
  worktree: false
});

let workBrief = String(brief || "");
let lastWorker = "";
let lastTester = "";
let lastReviewer = "";
let completed = false;

for (let cycle = 1; cycle <= maxCycles; cycle++) {
  const fixContext = cycle === 1
    ? "Initial worker cycle."
    : "Fix cycle " + cycle + ". Address only blocking P0/P1 findings from the prior tester/reviewer reports.";

  lastWorker = String(await runs.run("worker-" + cycle, {
    agent: agents.worker,
    task: rolePrompts.worker + "\n\n" + fixContext + "\n\n" +
      "## Work Brief\n" + workBrief + "\n\n" +
      "## Prior worker report\n" + clip(lastWorker, 8000) + "\n\n" +
      "## Prior tester report\n" + clip(lastTester, 8000) + "\n\n" +
      "## Prior reviewer report\n" + clip(lastReviewer, 8000) + "\n\n" +
      "Implement or fix the change. Follow your required output format. Do not push, publish, deploy, reset, clean, or stash the repository.",
    context: "fresh",
    worktree: false
  }));

  lastTester = String(await runs.run("tester-" + cycle, {
    agent: agents.tester,
    task: rolePrompts.tester + "\n\n" +
      "Test and audit the current diff and tests for this /dev-loop cycle.\n\n" +
      "## Work Brief\n" + workBrief + "\n\n" +
      "## Worker report\n" + clip(lastWorker, 12000) + "\n\n" +
      "Run safe, targeted checks if useful. Do not edit files. Follow your required output format.",
    context: "fresh",
    worktree: false
  }));

  lastReviewer = String(await runs.run("reviewer-" + cycle, {
    agent: agents.reviewer,
    task: rolePrompts.reviewer + "\n\n" +
      "Review the current diff against this /dev-loop Work Brief.\n\n" +
      "## Work Brief\n" + workBrief + "\n\n" +
      "## Worker report\n" + clip(lastWorker, 10000) + "\n\n" +
      "## Tester report\n" + clip(lastTester, 10000) + "\n\n" +
      "Inspect git status/diff and relevant files. Do not edit files. Follow your required output format.",
    context: "fresh",
    worktree: false
  }));

  if (!hasBlockingFindings(lastTester) && !hasBlockingFindings(lastReviewer)) {
    completed = true;
    break;
  }
}

const sanity = String(await runs.run("final-sanity", {
  agent: agents.sanity,
  task: rolePrompts.reviewer + "\n\n" +
    "Do a final read-only sanity check for this /dev-loop run.\n\n" +
    "## Work Brief\n" + workBrief + "\n\n" +
    "## Last worker report\n" + clip(lastWorker, 10000) + "\n\n" +
    "## Last tester report\n" + clip(lastTester, 10000) + "\n\n" +
    "## Last reviewer report\n" + clip(lastReviewer, 10000) + "\n\n" +
    "Check git status/diff summary, changed files, and whether any generated/secret/unexpected files appear. Do not edit files. Return a concise final sanity verdict.",
  context: "fresh",
  worktree: false
}));

return "# /dev-loop " + (completed ? "Done" : "Blocked") + "\n\n" +
  "## Agents\n" + JSON.stringify(agents, null, 2) + "\n\n" +
  "## Work Brief\n" + workBrief + "\n\n" +
  "## Final status\n" + (completed ? "No blocking P0/P1 findings were reported before final sanity." : "Stopped with blocking findings or max cycles reached.") + "\n\n" +
  "## Last worker report\n" + lastWorker + "\n\n" +
  "## Last tester report\n" + lastTester + "\n\n" +
  "## Last reviewer report\n" + lastReviewer + "\n\n" +
  "## Final sanity\n" + sanity + "\n";
`;
}
