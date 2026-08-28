# Loop/subagent extension GitHub status

Snapshot date: 2026-08-27.

Sources used: npm package metadata (`npm view`), package tarball READMEs (`npm pack`), and GitHub CLI/API for repository status. `pi.dev` package pages returned HTTP 403 from this environment, so this file treats npm and GitHub as the primary sources.

## Summary verdict

| Package                   | GitHub repo                                                                 | GitHub archived? | npm latest       | Last npm publish | Last GitHub push | Open issues | Open PRs | Activity read                | Fit for this setup                                                                                                         |
| ------------------------- | --------------------------------------------------------------------------- | ---------------: | ---------------- | ---------------- | ---------------- | ----------: | -------: | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `@trevonistrevon/pi-loop` | [`trvon/pi-loop`](https://github.com/trvon/pi-loop)                         |               No | `0.7.9`          | 2026-08-27       | 2026-08-27       |           0 |        0 | Very active                  | Strong candidate for monitor/re-wake/background-loop layer, but overlaps with pi-workflows monitor and task orchestration. |
| `@agimon-ai/doompi-loop`  | [`AgiFlow/doompi`](https://github.com/AgiFlow/doompi)                       |               No | `0.0.1-alpha.39` | 2026-08-27       | 2026-08-27       |           0 |        1 | Very active, alpha           | Interesting if adopting DoomPi distribution concepts; too alpha/coupled for default setup.                                 |
| `pi-autoresearch`         | [`davebcn87/pi-autoresearch`](https://github.com/davebcn87/pi-autoresearch) |               No | `1.6.2`          | 2026-07-09       | 2026-07-15       |           8 |        6 | Active, but quieter recently | Strong for benchmark/optimization experiments; not a general dev-loop/subagent substrate.                                  |
| `@arhen/pi-core-subagent` | [`arhen/pi-extensions`](https://github.com/arhen/pi-extensions)             |     No on GitHub | `1.3.46`         | 2026-08-25       | 2026-08-25       |           3 |        0 | Very active, young           | Strong subagent-substrate concept, but if the Pi gallery marks it archived, treat as high-risk/fork-only until clarified.  |
| `@tintinweb/pi-subagents` | [`tintinweb/pi-subagents`](https://github.com/tintinweb/pi-subagents)       |               No | `0.19.0`         | 2026-08-27       | 2026-08-27       |          26 |       25 | Very active, high adoption   | Strongest installable subagent candidate if configured conservatively; broad surface area.                                 |

Notes:

- `@arhen/pi-core-subagent`: the user reported the Pi package/gallery entry as archived. GitHub API reports `arhen/pi-extensions` itself is **not archived**. Treat this as a package/gallery-status discrepancy requiring manual verification before install.
- GitHub `open_issues_count` includes issues + PRs; the table uses explicit search counts for issues and PRs separately where available.

## New loop candidates

### `@trevonistrevon/pi-loop`

Source: [`trvon/pi-loop`](https://github.com/trvon/pi-loop) / npm `@trevonistrevon/pi-loop`.

Package description: cron/event-based agent re-wake loops and background process monitoring.

What it provides, according to its README:

- `/loop` command for scheduled, event, and dynamic goal loops.
- `/tasks` fallback task management when `pi-tasks` is absent.
- `LoopCreate`, `LoopList`, `LoopUpdate`, `LoopDelete` tools.
- `MonitorCreate`, `MonitorList`, `MonitorStop` for background commands and wake-on-done/failure/inactivity.
- `WorkflowCreate`, `WorkflowClaim`, `WorkflowRevise`, `WorkflowTransition` task-driven workflow tools.
- `OrchestrationCreate`, `OrchestrationGet` for bounded async subagent batches via `pi-subagents` protocol v2.
- Persistence is session-isolated; README emphasizes authority, persistence, mutation, RPC, and recovery boundaries in docs.

GitHub/npm health:

- GitHub: not archived, MIT, 9 stars, 5 forks.
- Activity: last push and latest npm publish on 2026-08-27.
- Release cadence: many publishes from 2026-05-26 through 2026-08-27.
- Issue/PR state: 0 open issues, 0 open PRs; 46 merged PRs.
- Tests/scripts advertised: typecheck, lint, unit tests, property/fuzz tests, benchmarks, package smoke test, and opt-in live Pi/LLM E2E tests.

Assessment:

- **Improving/active development:** yes, strongly.
- **Main advantage:** most complete general-purpose re-wake/monitor/task-loop candidate in this batch.
- **Main risk:** overlaps with existing `pi-workflows` monitor workflow and planned custom `dev-loop`/`agent-pr` orchestration. Installing it globally may create a second workflow/task authority.
- **Recommendation:** review source before install. Prefer as an optional monitor/re-wake layer only if it solves a concrete gap not already covered by `pi-workflows` monitor.

### `@agimon-ai/doompi-loop`

Source: [`AgiFlow/doompi`](https://github.com/AgiFlow/doompi) / npm `@agimon-ai/doompi-loop`.

Package description: session-scoped recurring prompt scheduler and loop controls for Pi coding agents.

What it provides, according to its README:

- `/loop` starts a loop; `/loops` inspects/stops active loops.
- Runs prompt immediately, then repeats at bounded intervals.
- Accepted interval range: 30 to 3600 seconds; default 300 seconds.
- If Pi is busy, due passes wait for idle and can coalesce rather than overlap.
- Session-scoped state only: not a durable queue; session shutdown/replacement aborts pending launches.
- Exposes cross-extension launcher contracts through DoomPi/Cordis services.
- README explicitly warns it is **alpha** and launcher/scheduling contracts may change.

GitHub/npm health:

- GitHub: not archived, MIT, 20 stars, 1 fork.
- Activity: repo created 2026-08-22; last push 2026-08-27; latest package publish 2026-08-27.
- Issue/PR state: 0 open issues, 1 open PR; 12 merged PRs.
- Package status: `0.0.1-alpha.39`, alpha tag.

Assessment:

- **Improving/active development:** yes, very active but very young.
- **Main advantage:** small/session-scoped recurring prompt loop, explicit non-durable semantics, nice coalescing behavior.
- **Main risk:** alpha, tied to DoomPi distribution/contracts, and intentionally not durable. Not enough stability for a default personal setup layer.
- **Recommendation:** watch, do not adopt now unless deliberately testing DoomPi. If we need a simple session-only recurring prompt, borrow the design ideas rather than depend on the alpha package.

### `pi-autoresearch`

Source: [`davebcn87/pi-autoresearch`](https://github.com/davebcn87/pi-autoresearch) / npm `pi-autoresearch`.

Package description: autonomous experiment loop for Pi — run, measure, keep or discard. Inspired by `karpathy/autoresearch`.

What it provides, according to its README:

- Extension tools: `init_experiment`, `run_experiment`, `log_experiment`.
- `/autoresearch` dashboard command with `off`, `clear`, and `export` subcommands.
- Live dashboard widget and fullscreen dashboard.
- Skills: `autoresearch-create`, `autoresearch-finalize`, `autoresearch-hooks`.
- Session files under `.auto/`: `prompt.md`, `measure.sh`, `log.jsonl`, optional `checks.sh`, optional hooks.
- Intended loop: try idea, benchmark, keep improvements, revert regressions, repeat.

GitHub/npm health:

- GitHub: not archived, MIT, 7876 stars, 446 forks.
- Activity: repo created 2026-03-11; latest package publish 2026-07-09; last push 2026-07-15.
- Issue/PR state: 8 open issues, 6 open PRs; 30 merged PRs.
- Package status: stable-looking `1.6.2`, 9 published versions.

Assessment:

- **Improving/active development:** yes historically; less hot than the August loop packages but still maintained recently.
- **Main advantage:** focused, benchmark-driven optimization loop with durable `.auto/` artifacts and clear experiment logging.
- **Main risk:** it is not a general task loop, PR loop, or subagent substrate. It may auto-commit experiment results and needs careful branch/dirty-repo policy review.
- **Recommendation:** useful as a specialized optimization package. Do not use it as the base for general `dev-loop`; consider it optional per-project when there is a measurable metric.

## Revised subagent candidate

### `@tintinweb/pi-subagents`

Source: [`tintinweb/pi-subagents`](https://github.com/tintinweb/pi-subagents) / npm `@tintinweb/pi-subagents`.

Package description: Claude Code-like subagents and workflow orchestration for Pi — parallel execution, live widget, FleetView, custom agent types, mid-run steering, dynamic workflows, Claude Code compatibility, look and feel.

What it provides, according to its README:

- `Agent`, `get_subagent_result`, `steer_subagent` Claude Code-like tool surface.
- Background/foreground subagents with isolated sessions, custom tools/system prompts/models/thinking levels.
- Custom agent definitions in project/global agent files.
- Live widget, FleetView, conversation viewer, steering, stop, resume, and mentions.
- `SubagentWorkflow` deterministic JavaScript workflows with `agent()`, `parallel()`, `pipeline()`, `phase()`, `gate`, `schema`, and one-level nested workflows.
- Worktree isolation, gate commands, model-scope enforcement, tool denylist, skill preloading.
- Optional nested subagents, context inheritance, persistent memory, scheduling, cross-extension RPC/event bus.

GitHub/npm health:

- GitHub: not archived, MIT, 977 stars, 210 forks.
- Activity: latest npm publish and last GitHub push on 2026-08-27.
- Issue/PR state: 26 open issues, 25 open PRs; 79 closed issues, 75 merged PRs.
- Package status: `0.19.0`, many releases from 2026-03-05 through 2026-08-27.
- Quality gates advertised: lint, typecheck, tests, E2E tests, coverage, benchmarks, and `prepublishOnly` lint/typecheck/test/build.

Assessment:

- **Improving/active development:** yes, strongly.
- **Main advantage:** strongest installable subagent package by feature set, adoption, and current activity.
- **Main risk:** broad surface. Disable context inheritance, memory, nested subagents, and scheduling initially; do not rely on tool denylist as the only security boundary.
- **Recommendation:** promote to top source-review candidate. If source review passes, prefer this over `@arhen` when interactive control, FleetView, custom agents, worktrees, and RPC matter.

### `@arhen/pi-core-subagent`

Source: [`arhen/pi-extensions`](https://github.com/arhen/pi-extensions), package directory `packages/core/pi-core-subagent`; npm `@arhen/pi-core-subagent`.

Package description: fast in-process subagents with dependency-graph scheduler, background runs, intercom, and mailbox.

What it provides, according to its README:

- In-process child `AgentSession`s; no subprocess spawning.
- Parent receives final answer rather than child transcript, reducing context bloat.
- Single, parallel, chain, and DAG/graph modes through `needs` edges.
- Upstream outputs are prepended automatically to dependent prompts.
- Graph validation rejects unknown IDs, self-edges, and cycles before spawning.
- Agent files from `.agents/agents`, `.claude/agents`, `.pi/agents`, project then home.
- Two toolsets only: read-only by default; write mode enables `bash`, `edit`, `write`.
- Live widget, cancellation, intercom, mailbox, watchdog for silent hangs.
- Worktree support is documented in the broader package docs/source and remains important to verify.

GitHub/npm health:

- GitHub repo: `arhen/pi-extensions`, not archived according to GitHub API, MIT, 1 star, 0 forks.
- Activity: repo created 2026-08-17; latest package publish and last push 2026-08-25.
- Issue/PR state: 3 open issues, 0 open PRs; no merged PR history visible via search.
- Package status: `1.3.46`; very high publish velocity from 2026-08-16 through 2026-08-25.

Assessment:

- **Improving/active development:** yes, but very young and low-adoption.
- **Main advantage:** still the cleanest conceptual fit for a deterministic graph/DAG subagent substrate.
- **Main risk:** the user reports the Pi package entry as archived, while GitHub is not archived. This is a red flag for package lifecycle/stability even if the repo is active. The package also exposes source `.ts` directly as its Pi extension entry, so compatibility with current Pi loader/runtime should be verified.
- **Recommendation:** downgrade from “likely adopt” to **source-review/fork candidate** until the archive discrepancy is clarified. If the code is good, adapting/forking the graph scheduler ideas may be safer than relying on the public package.

## Comparison for this setup

| Need                                                | Best candidate from this batch    | Why                                                                                                             |
| --------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Repeatedly check external status / wake agent later | `@trevonistrevon/pi-loop`         | Most mature and active general loop/monitor package here.                                                       |
| Simple session-only repeating prompt                | `@agimon-ai/doompi-loop` design   | Small and explicit, but alpha/coupled; watch rather than adopt.                                                 |
| Benchmark-driven optimization                       | `pi-autoresearch`                 | Purpose-built experiment artifacts, measurement, keep/revert loop.                                              |
| Interactive/custom subagent management              | `@tintinweb/pi-subagents`         | Strongest installable candidate: FleetView, custom agents, steering/resume, workflow scripting, worktrees, RPC. |
| Deterministic subagent DAGs                         | `@arhen/pi-core-subagent` concept | Clean graph interface model, but archive discrepancy means source-review/fork first.                            |
| Personal `dev-loop` / `agent-pr`                    | Custom workflow on one substrate  | None of these exactly implement the desired role guard, P0/P1 gates, and PR policy.                             |

## Revised recommendation

1. **Do not install all loop packages.** They overlap heavily.
2. Keep `@trevonistrevon/pi-loop` as the strongest new candidate for monitor/re-wake/background-loop behavior.
3. Keep `pi-autoresearch` as a specialized optimization tool only.
4. Watch `@agimon-ai/doompi-loop`; avoid for default setup while alpha and DoomPi-coupled.
5. Promote `@tintinweb/pi-subagents` to top installable subagent source-review candidate.
6. Treat `@arhen/pi-core-subagent` as a source-review/fork candidate, not a blind install, because of the reported archive status mismatch.
7. For the planned personal stack, keep the architecture unchanged: choose one subagent substrate, then build custom `research-swarm`, `dev-loop`, and `agent-pr` policy on top.
