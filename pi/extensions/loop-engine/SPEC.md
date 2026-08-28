# loop-engine extension spec

## Goal

Provide a generic durable scheduled prompt runner.

The loop engine is intentionally simple:

```text
loop behavior = approved prompt
safety = permission system
state = SQLite
control = JSON block from each run
```

It should support workflows like:

```text
Every 10 minutes, check review requests assigned to me or where I am subscribed.
If any exist, review one PR/MR/change using the available tools/MCPs.
If real code issues are found, post concise comments.
If it looks clean, notify me and post a short positive comment with what was checked and a small funny anecdote.
Do not approve, request changes, merge, or automerge.
After reviewing one item, continue immediately until no review requests remain.
```

The engine should not become a PR-review DSL, provider adapter framework, or tool policy system.

## Relationship to other workflows

```text
loop-engine:
  durable scheduled prompt runner with continuation and SQLite state

research-swarm:
  read-only fan-out/reduce workflow

dev-loop:
  implementation/test-audit/review loop

agent-pr:
  branch/worktree/PR wrapper around dev-loop
```

A loop prompt may eventually invoke these workflows, but loop-engine itself remains generic.

## Non-goals

- No provider-specific PR/MR/GitHub/GitLab/etc. logic in the engine.
- No required/allowed tool DSL in v1.
- No action/authority DSL in v1.
- No provider adapter system in v1.
- No parallel item processing in v1.
- No direct SQLite state tools for agents in v1.
- No automerge or approval semantics built into the engine.

## Core model

A loop is an approved prompt plus schedule, status, limits, state, and run logs.

```text
/loop add <prompt>
  -> generate minimal JSON loop definition
  -> show short summary + raw JSON
  -> ask user to approve/revise/reject
  -> persist only after approval
  -> schedule if active
```

The user revises through chat questions/answers. No editor UI in v1.

## Minimal loop definition

V1 loop definitions should stay small.

```json
{
	"id": "review-loop",
	"name": "Review requests loop",
	"prompt": "Every 10 minutes, check review requests assigned to me or where I am subscribed...",
	"schedule": "every 10m",
	"status": "active",
	"limits": {
		"maxIterationsPerTick": 20,
		"maxRunMinutes": 60
	}
}
```

Behavior-specific details belong in the prompt, for example:

```text
If the PR looks clean, notify me and post a short positive comment with:
- what you checked
- why it looks safe
- one small funny anecdote or light joke
```

Do not add structured fields like `cleanPrAction`, `provider`, `allowedTools`, or `postPolicy` in v1.

## Approval display

When adding a loop, show:

1. Short human summary.
2. Raw JSON definition.
3. Clear approval choices.

Example:

````md
## Loop summary

- Schedule: every 10 minutes
- Mode: self-requeue through `continueNow`
- Run limit: 20 iterations or 60 minutes per scheduled tick
- Behavior: defined by prompt
- Safety: enforced by normal Pi permission system

## JSON

```json
{ ... }
```
````

Approve this loop? yes / revise / reject

````

## Storage

Use global SQLite state by default:

```text
~/.pi/agent/loop-engine/state.sqlite
````

Rationale:

- loops may be global, project-bound, workspace-bound, or provider-bound
- work review domains may span large monorepos or internal systems
- binding details stay in prompt/state, not engine-specific schema

SQLite stores:

- loop definitions
- run logs
- key/value state updates
- lock/lease data
- failure summaries

## Scheduling and triggers

V1 supports:

- interval schedules
- manual run
- pause/resume

Commands:

```text
/loop add <prompt>
/loop list
/loop status <id>
/loop run <id>
/loop pause <id>
/loop resume <id>
/loop remove <id>
```

Startup behavior:

- active loops are scheduled when Pi starts and extension loads
- missed ticks do not necessarily backfill; v1 may run at next scheduled opportunity only

## Execution isolation

Each loop iteration runs in a new isolated Pi session/subagent, not in the current interactive session.

Rationale:

- clean context per iteration
- no main-session context pollution
- easier audit logs
- SQLite carries durable state

A single scheduled tick may cause multiple isolated iterations through `continueNow`.

## Self-requeue control

Each iteration returns Markdown plus a required JSON control block.

If `continueNow` is true, the engine starts another isolated iteration immediately, subject to limits.

If false, the engine sleeps until the next scheduled tick.

This supports drain-style loops without building a queue DSL.

Example PR review drain:

```text
scheduled tick
  -> iteration 1 scans review requests
  -> finds 10
  -> reviews one request
  -> returns continueNow=true
  -> iteration 2 scans again
  -> reviews one request
  -> ...
  -> final iteration finds zero
  -> returns continueNow=false
  -> sleep until next scheduled tick
```

## Iteration output contract

Default output: human-readable Markdown plus required JSON control block.

````md
## Summary

Reviewed PR ABC-123. Found two real issues and posted comments. More review requests may remain.

## Actions

- Checked assigned/subscribed review requests
- Reviewed ABC-123
- Posted 2 comments

## Control

```json
{
	"status": "success",
	"continueNow": true,
	"reason": "Reviewed one request; run again to check remaining requests.",
	"stateUpdates": [
		{
			"key": "reviewed:ABC-123:sha-abc",
			"value": {
				"reviewedAt": "2026-08-27T10:00:00Z",
				"verdict": "commented"
			}
		}
	]
}
```
````

````

Control fields:

```ts
type LoopRunControl = {
  status: "success" | "blocked" | "failed";
  continueNow: boolean;
  reason: string;
  stateUpdates?: Array<{
    key: string;
    value: unknown;
    ttlSeconds?: number;
  }>;
};
````

## State model

V1 agents cannot query SQLite directly.

Instead:

- engine passes relevant state key/value entries and recent run summaries into each isolated iteration
- agent emits `stateUpdates` in the JSON control block
- engine writes `stateUpdates` to SQLite

Default state package passed to each run:

```md
## Loop Definition

<approved prompt + schedule + limits>

## Recent Runs

- 10:00: reviewed PR A, continueNow=true
- 10:05: reviewed PR B, continueNow=true
- 10:10: no review requests, continueNow=false

## Relevant State

- reviewed:PR-A:sha-abc = {...}
- failed:PR-C = { failureCount: 2, cooldownUntil: ... }
```

Do not pass full transcripts or full SQLite dump.

## Duplicate prevention pattern

For PR/MR/review-request loops, the prompt should instruct the agent to use state updates like:

```text
reviewed:<request-id>:<head-sha>
```

This means:

- unchanged review request can be skipped
- changed review request can be reviewed again

The engine does not hardcode this; it only stores and passes state.

## Failure handling pattern

For review-request loops, recommended prompt behavior:

```text
If reviewing one request fails:
- emit a failure state update with request id and reason
- avoid retrying it immediately if it repeatedly fails
- continue now if other requests may remain
```

Default desired behavior:

```text
one bad PR should not block all others
```

The engine enforces only global iteration/run limits. Detailed failure policy lives in prompt and state.

## Limits

Default limits:

```json
{
	"maxIterationsPerTick": 20,
	"maxRunMinutes": 60
}
```

If limits are hit:

- stop immediate continuation
- record blocked/limited run summary
- notify user if notification mechanism exists
- resume on next scheduled tick

## Safety model

Loop-engine itself does not implement detailed tool policy.

Safety is handled by:

- global permission layer
- workflow role guard, if active
- normal Pi tool permissions
- prompt restrictions approved by user

For scheduled automation, the approved prompt should explicitly forbid dangerous external actions when relevant, e.g.:

```text
Do not approve, request changes, merge, automerge, force-push, or delete branches.
```

The permission layer should enforce these where possible.

## Subagents inside loop runs

A loop iteration may use subagents.

Recommended PR review shape:

```text
loop-run coordinator:
  scan for assigned/subscribed review requests
  pick one eligible request
  spawn one review subagent with request link/number and short instructions
  collect report
  post/comment/notify according to prompt
  emit control JSON
```

V1 should process one review request per isolated iteration.

Do not start with parallel PR reviews. Parallel processing can be added later after state/dedupe/retry behavior is proven.

## Commands

### `/loop add <prompt>`

- parse schedule and limits from prompt if present
- generate minimal JSON definition
- ask clarifying questions if needed
- show summary + JSON
- require approval before persisting

### `/loop list`

Show loop ids, names, schedules, status, last run, next run.

### `/loop status <id>`

Show definition summary, recent runs, recent state keys, failures.

### `/loop run <id>`

Manually trigger one scheduled tick. The tick may self-requeue through `continueNow` until limits or completion.

### `/loop pause <id>` / `/loop resume <id>`

Pause/resume scheduling.

### `/loop remove <id>`

Disable/remove loop definition after confirmation.

## SQLite schema sketch

```sql
create table loops (
  id text primary key,
  name text not null,
  prompt text not null,
  schedule text not null,
  status text not null,
  limits_json text not null,
  created_at text not null,
  updated_at text not null,
  approved_at text
);

create table loop_runs (
  id text primary key,
  loop_id text not null references loops(id),
  tick_id text not null,
  iteration integer not null,
  status text not null,
  continue_now integer not null,
  reason text,
  markdown_report text not null,
  control_json text not null,
  started_at text not null,
  finished_at text not null
);

create table loop_state (
  loop_id text not null references loops(id),
  key text not null,
  value_json text not null,
  updated_at text not null,
  expires_at text,
  primary key (loop_id, key)
);

create table loop_locks (
  loop_id text primary key references loops(id),
  holder text not null,
  acquired_at text not null,
  expires_at text not null
);
```

## Open questions

- Exact subagent/background execution substrate.
- Notification mechanism.
- Whether state TTL cleanup runs on startup or periodically.
- How to display run logs in TUI.
- Whether to support cron syntax in addition to `every 10m`.
- Whether loops should run when Pi TUI is closed; v1 likely requires Pi process running.

## Implementation plan

1. Choose subagent/background substrate.
2. Implement SQLite store.
3. Implement `/loop add/list/status/pause/resume/remove/run`.
4. Implement interval scheduler while Pi process is running.
5. Implement isolated iteration execution.
6. Require Markdown + JSON control block.
7. Persist reports and state updates.
8. Add basic notifications.
9. Test with a dry-run review loop before allowing posting comments.
