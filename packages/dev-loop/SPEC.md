# dev-loop extension spec

## Goal

Provide a `/dev-loop <prompt>` command that makes development more autonomous without turning the main session into a noisy all-purpose worker.

The current Pi session acts as the coordinator. It communicates with three isolated child subagents in a repeatable loop:

```text
worker -> tester -> reviewer -> worker fixes -> ...
```

The loop stops when tests/audit pass, reviewer has no P0/P1 findings, and the coordinator's final read-only sanity check passes.

## Non-goals

- No broad downloaded workflow packs.
- No extra master/coordinator subagent. The current session is the coordinator.
- No direct coordinator edits during an active dev-loop workflow.
- No reviewer/tester file edits.
- No automatic infinite fixing loops.

## Roles

### Coordinator

The current session is the coordinator.

Allowed during workflow:

- communicate with child subagents
- maintain loop state
- create the Work Brief
- inspect git status/diff
- read relevant issue/spec/repo instruction files
- decide next child invocation
- classify whether the loop is done or blocked

Forbidden during workflow:

- edit files
- directly implement fixes
- bypass child role boundaries

### Worker

Owns code and test edits. TDD is the default implementation method, but not part of the role name.

Responsibilities:

- receive Work Brief or fix brief
- write/update failing tests when behavior changes
- implement minimal passing code
- refactor after green
- run targeted verification before returning
- report changed files and verification results

### Tester

Read-only, but may run tests/checks.

Responsibilities:

- inspect diff and tests
- run targeted tests/checks as needed
- judge whether tests are meaningful and sufficient
- classify failures as implementation bug, bad test, unrelated existing failure, or environment/tooling issue
- report missing/weak tests with required fixes

Forbidden:

- file edits

### Reviewer

Read-only. May run read-only commands such as `git diff`, `git status`, `rg`, and file reads.

Responsibilities:

- compare whole diff against Work Brief / issue / acceptance criteria
- apply repo instructions: `AGENTS.md`, `CONTEXT.md`, ADRs, existing conventions
- check architecture/API boundaries
- flag unnecessary scope/complexity
- flag docs/domain impact
- severity-label findings

Forbidden:

- file edits
- deep test ownership; test quality belongs primarily to tester

## Command input

`/dev-loop <prompt>` accepts a normal prompt containing goal, issue, ticket, spec path, or freeform task.

Before children run, coordinator normalizes the prompt into a compact Work Brief.

## Work Brief

Required sections:

```md
## Goal

## Acceptance Criteria

## Constraints

## Non-goals

## Relevant Context

## Verification Commands

## Risk / Approval Notes
```

The coordinator should not pass raw full chat history to children. Children receive the Work Brief plus role-specific context packages.

## Work Brief approval

Default policy: approve only when ambiguous or risky.

Pause for user approval if the brief indicates:

- unclear acceptance criteria
- public API/schema/domain changes
- dependency changes
- destructive file changes
- missing verification command
- broad refactor scope

## Loop

Default loop:

```text
cycle 1:
  checkpoint
  worker(initial Work Brief)
  tester(current diff + worker report)
  reviewer(current diff + Work Brief + reports)

if P0/P1 findings:
  coordinator creates fix brief
  checkpoint
  worker(fix brief)
  tester(current diff + worker report)
  reviewer(current diff + Work Brief + reports)
```

`fix` is not a separate role. The worker handles both initial implementation and fixes.

## Stop conditions

Success requires:

- tester passes or reports no blocking test-quality issue
- reviewer reports no P0/P1 findings
- coordinator final read-only sanity check passes:
  - git status/diff summary
  - changed files list
  - no unexpected generated/secret files

Failure/blocker conditions:

- max cycles exceeded
- role violation
- unresolved P0/P1 after allowed cycles
- command/tooling/environment blocker
- user declines risky Work Brief approval

## Severity model

```text
P0 = dangerous/broken/data loss/security/spec impossible
P1 = must fix before done: spec miss, failing behavior, bad tests, major design issue
P2 = should fix if cheap: maintainability, minor edge case, docs gap
P3 = nit/style/preference
```

Only P0/P1 force another loop. P2/P3 are reported unless cheap and safe to batch into an existing fix cycle.

## Defaults

```json
{
	"maxCycles": 3,
	"checkpointPolicy": "stash",
	"dirtyTreePolicy": "ask",
	"artifactPolicy": "failure-only",
	"outputStyle": "normal",
	"parallelReview": false,
	"roleOutputFormat": "markdown-headings",
	"findingsFormat": "required-fields",
	"roleContext": "role-specific",
	"repoInstructions": "summary-plus-read-permission",
	"subagentReadPolicy": "repo-read-except-protected",
	"rolePermissionEnforcement": "prompt-v1-enforce-later",
	"roleViolationPolicy": "fail"
}
```

## Checkpoints

Default: configurable, stash-based.

Before each worker run:

```bash
git stash push -u -m "pi-dev-loop before worker cycle N"
```

Dirty tree policy default: ask.

If the repo is dirty at start, coordinator shows changed/untracked files and asks whether to continue and include them in the initial checkpoint.

Future checkpoint modes may include patch files or separate worktrees.

## Artifacts

Default: failure-only.

On failure/blocker, save:

```text
.pi/dev-loop/runs/<timestamp>/
  work-brief.md
  cycle-1-worker.md
  cycle-1-tester.md
  cycle-1-reviewer.md
  blocker-report.md
```

Successful runs should not litter the repo by default.

## Role outputs

Default: Markdown with required headings.

### Worker report

```md
## Status

success | blocked

## Changed Files

- ...

## Verification

- `command` — pass/fail

## Notes

...
```

### Tester report

```md
## Verdict

pass | fail

## Commands Run

- `command` — pass/fail

## Findings

### P1: Short title

- Evidence:
- Impact:
- Required fix:

## Notes

...
```

### Reviewer report

```md
## Verdict

pass | fail

## Findings

### P1: Short title

- Evidence:
- Impact:
- Required fix:

## P2/P3 Notes

- ...
```

## Role context packages

### Worker receives

- Work Brief
- prior P0/P1 findings, if this is a fix cycle
- concise repo instruction summary
- changed files summary
- constraints/checkpoint info

### Tester receives

- Work Brief
- current git diff
- worker report
- touched test files
- verification output

### Reviewer receives

- Work Brief
- current git diff
- worker report
- tester report
- concise repo instruction summary

## Repo instruction handling

Default: hybrid.

- Work Brief contains concise repo instruction summary.
- Children may read relevant repo docs as needed:
  - `AGENTS.md`
  - `CONTEXT.md`
  - ADRs
  - package/test config
  - relevant source/test files

Do not dump all repo docs into every subagent by default.

## Subagent file read policy

Default: repo-read except protected paths.

Allowed:

- read/search repo files
- inspect package/test config
- read docs/instructions

Forbidden unless explicitly approved:

- `.env*`
- secrets/credentials
- large generated/build outputs
- dependency/vendor caches such as `node_modules`

## Configuration

Default configured agents:

```json
{
	"agents": {
		"briefer": "oracle",
		"worker": "worker",
		"tester": "tester",
		"reviewer": "reviewer",
		"sanity": "reviewer"
	},
	"rolePrompts": {}
}
```

Users may override these in `~/.pi/agent/dev-loop/config.json` or project-local `.pi/dev-loop.json`.

`rolePrompts.worker`, `rolePrompts.tester`, and `rolePrompts.reviewer` may point to custom Markdown snippets. Relative paths resolve relative to the config file.

## Role permission enforcement

V1 may be prompt-based. Long-term, extension should enforce role permissions where possible:

- reviewer/tester: block write/edit tools
- reviewer/tester: block destructive bash
- all roles: block protected paths/secrets

If a subagent violates its role in v1, default policy is fail loudly and stop workflow.

## Final output

Default configurable style: normal dev summary.

```md
Done / Blocked

Changed:

- ...

Verified:

- ...

Review:

- no P0/P1
- P2/P3 notes, if any

Artifacts:

- failure report path, if created
```

## Implementation plan

1. Keep this spec and role prompts in `pi/extensions/dev-loop/`.
2. Inspect Pi's `examples/extensions/subagent/` implementation.
3. Optionally inspect selected Cursor pstack candidates if manually chosen.
4. Implement minimal `/dev-loop` extension:
   - create Work Brief
   - run worker
   - run tester
   - run reviewer
   - loop on P0/P1 up to max cycles
5. Add checkpoints, config, artifacts, and stricter permission enforcement.
