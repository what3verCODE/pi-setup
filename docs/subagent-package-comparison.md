# Pi subagent package comparison

Snapshot date: 2026-08-27.

Sources: npm metadata (`npm view`), package tarball READMEs/docs (`npm pack`), and GitHub CLI/API. `pi.dev` pages were not directly readable from this environment.

## Executive comparison

| Package                   | Repo                                                                    | GitHub archived? | npm latest | Last npm publish | Last GitHub push | Open issues | Open PRs | Best fit                                                                                                                                             | Main caution                                                                              |
| ------------------------- | ----------------------------------------------------------------------- | ---------------: | ---------- | ---------------- | ---------------- | ----------: | -------: | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `pi-subagents`            | [`nicobailon/pi-subagents`](https://github.com/nicobailon/pi-subagents) |               No | `0.58.0`   | 2026-08-27       | 2026-08-27       |           3 |        2 | Strongest production-oriented orchestration substrate: builtin roles, workflow scripts, missions, budgets, worktrees, observability, extension APIs. | Large and opinionated; must avoid overlapping with custom workflow authority.             |
| `@tintinweb/pi-subagents` | [`tintinweb/pi-subagents`](https://github.com/tintinweb/pi-subagents)   |               No | `0.19.0`   | 2026-08-27       | 2026-08-27       |          26 |       25 | Strongest interactive/Claude Code-like subagent UX: FleetView, custom agents, steering/resume, mentions, workflows, RPC, worktrees.                  | Broad surface; disable memory/context/nesting/scheduling initially.                       |
| `@arhen/pi-core-subagent` | [`arhen/pi-extensions`](https://github.com/arhen/pi-extensions)         |     No on GitHub | `1.3.46`   | 2026-08-25       | 2026-08-25       |           3 |        0 | Cleanest minimal graph/DAG concept: in-process sessions, read/write toolsets, `needs` edges carry outputs.                                           | User reports Pi gallery entry archived; young/low adoption; source-review/fork candidate. |

## Deep comparison

| Axis                  | `pi-subagents` / Nico                                                                                                                                               | `@tintinweb/pi-subagents`                                                                                                                     | `@arhen/pi-core-subagent`                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Package philosophy    | Parent-agent-guided delegation and scripted multi-agent workflows with production guardrails.                                                                       | Claude Code-like subagents and interactive fleet management.                                                                                  | Minimal graph runtime: delegation is a DAG.                                           |
| Tool surface          | One `subagent` tool with actions, workflow scripts, management, status/control, missions, schedules, watchdog, guide.                                               | Claude-like `Agent`, `get_subagent_result`, `steer_subagent`, `SubagentWorkflow`, UI/settings/mentions.                                       | Small slim toolset; single/parallel/chain/graph-oriented.                             |
| Builtin roles         | Ships `scout`, `researcher`, `worker`, `reviewer`, `oracle`, `delegate`, plus packaged prompts.                                                                     | Custom agent types and defaults; strongly Claude-compatible.                                                                                  | Leader defines inline or agent-file agents; two toolsets only.                        |
| Orchestration style   | `workflowScript` JavaScript: `runs.run`, `runs.all`, steering, budgets, gates, mission state, retained children. Legacy top-level chain/parallel not supported.     | `SubagentWorkflow` JavaScript: `agent`, `parallel`, `pipeline`, `phase`, `gate`; Claude Workflow compatible.                                  | Native graph with `needs` edges; upstream output auto-prepended to dependent prompts. |
| Context model         | Explicit `fresh` or `fork`; child-safety filtering removes parent-only subagent artifacts; fork strips Anthropic thinking blocks.                                   | Optional context inheritance; mentions can spawn through off-screen conversation clone; session resume.                                       | Zero parent-context injection by default; final answer only returns to parent.        |
| Safety boundaries     | Child-safety boundary, no subagent tool in children by default, max subagent depth, spawn budget, model scope, acceptance gates, watchdog, capability ceiling APIs. | Tool denylist, model-scope enforcement, nested subagents opt-in/depth-capped, worktrees/gates, but still needs external positive permissions. | Only read-only or write toolsets; bad graphs fail before spawn; watchdog; worktrees.  |
| Worktree/isolation    | Worktree isolation documented; handoff manifests and discard actions; external CLI runner support.                                                                  | Git worktree isolation; changes auto-committed to branches on completion.                                                                     | Worktree support documented; verify exact behavior in source.                         |
| Observability         | FleetView, live inspector, artifacts, transcripts, events/logs, session sharing.                                                                                    | Widget, FleetView, conversation viewer, notifications, token counts.                                                                          | Widget and final outputs; narrower by design.                                         |
| Durability            | Missions, schedules, retained children, state, receipts, artifacts.                                                                                                 | Session resume, scheduled jobs, persistent memory, notifications.                                                                             | Background runs/mailbox/intercom; less broad persistence model.                       |
| Extension integration | Exports many APIs: background work, external job provider/runs, agents, delegation, capability ceiling, preflight, control channel, intercom, project panes.        | Cross-extension RPC through Pi event bus.                                                                                                     | Smaller direct package; likely less integration surface.                              |
| Activity/adoption     | Very high: 3336 stars, 577 forks, 0.58.0, last push same day, only 3 open issues/2 PRs.                                                                             | High: 977 stars, 210 forks, 0.19.0, last push same day, 26 open issues/25 PRs.                                                                | Young: 1 star, 0 forks, 1.3.46, last push 2026-08-25.                                 |

## Package notes

### `pi-subagents` (`nicobailon/pi-subagents`)

Package description: Pi extension for single-agent delegation and scripted multi-agent workflows.

Important README/doc facts:

- Natural-language usage: “Use reviewer to review this diff”, “Run parallel reviewers…”, “Use scout…”.
- Builtin agents: `scout`, `researcher`, `worker`, `reviewer`, `oracle`, `delegate`.
- Recommended implementation loop: `clarify → scout → worker → fresh reviewers → worker`.
- Packaged prompt shortcuts: `/parallel-review`, `/review-loop`, `/parallel-research`, `/gather-context-and-clarify`, `/parallel-cleanup`.
- Workflow scripts use ordinary JavaScript with `runs.run`, `runs.all`, `runs.steer`, validation mode, `workflowScriptPath`, opt-in budgets, gate/acceptance commands, retained children, and mission state.
- Safety docs explicitly mention child-safety boundaries: child sessions do not receive the bundled skill; forked context is filtered; children do not get `subagent` tool by default; explicit exceptions are depth-bounded.
- Strong observability: FleetView, `/subagents-fleet`, transcript inspection, artifacts, events/logs.
- Extensive extension API: delegation, preflight, capability ceilings, control channel, intercom bridge, background-work providers, external runners, project panes.

GitHub/npm health:

- GitHub: not archived, 3336 stars, 577 forks.
- npm latest: `0.58.0`, published 2026-08-27.
- Last GitHub push: 2026-08-27.
- Open issues/PRs: 3 / 2.
- Merged PRs: 734.
- Release cadence: frequent from 2026-01-24 through 2026-08-27.

Assessment:

- **Best practical fit** if we want a robust substrate for the planned `dev-loop` / `agent-pr` style without implementing everything ourselves.
- It already names the loop close to ours: `clarify → scout → worker → fresh reviewers → worker`.
- Its `workflowScript`, missions, gates, budgets, worktrees, retained children, and extension APIs are especially relevant.
- Risk is mostly scope/authority overlap: it may want to be the workflow system, not just a subagent substrate.

Recommended posture:

```text
Top candidate for source review.
Prefer it if we want production guardrails and custom workflow integration APIs.
Start with builtin scout/worker/reviewer/oracle and workflowScript.
Disable or tightly configure schedules/missions/watchdog if they conflict with pi-workflows.
Still add our own role permission/publish guard.
```

### `@tintinweb/pi-subagents`

Package description: Claude Code-like subagents and workflow orchestration for Pi.

Strengths:

- Best interactive operator UX: FleetView, live conversation viewer, steering, stop, resume, mentions.
- Strong Claude Code compatibility and custom agent type model.
- `SubagentWorkflow` provides deterministic scripts with `agent`, `parallel`, `pipeline`, `phase`, and `gate`.
- RPC/event bus can let custom extensions spawn/stop/join subagents.

Status:

- GitHub not archived, 977 stars, 210 forks.
- npm latest `0.19.0`, published 2026-08-27.
- Last push 2026-08-27.
- 26 open issues, 25 open PRs.

Recommended posture:

```text
Top candidate if interactive subagent management matters most.
Configure conservatively: disable nested agents, context inheritance, memory, and scheduling initially.
```

### `@arhen/pi-core-subagent`

Still the cleanest graph idea, but lower confidence as an install target because of the reported Pi-gallery archive status mismatch and low adoption. Keep as design reference/fork candidate.

## Recommendation for this setup

Selected baseline:

1. `pi-subagents` (`nicobailon`) — baseline substrate for our extensions/ideas.
2. `@tintinweb/pi-subagents` — comparison/reference for interactive UX ideas.
3. `@arhen/pi-core-subagent` — graph/DAG design reference or fork candidate.
4. Pi official subagent example — must-read reference before final integration details.

Rationale:

- Choose **`pi-subagents`** because the priority is robust scripted workflows, builtin/overridden roles, missions/receipts, extension APIs, production guardrails, worktrees, and a loop close to `clarify → scout → worker → fresh reviewers → worker`.
- Keep **`@tintinweb/pi-subagents`** as inspiration if we later want richer human-visible parallel-agent UX, live conversation viewing, steering, mentions, or Claude Code compatibility.
- Keep/fork **`@arhen`** only if we decide we need a tiny graph primitive with minimal behavior.

Do **not** install multiple subagent packages at once. Build custom `research-swarm`, `dev-loop`, and `agent-pr` policy on top of Nico's `pi-subagents`.
