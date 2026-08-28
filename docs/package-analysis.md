# Pi extension/package analysis

This document analyzes candidate Pi packages/extensions for this personal setup.

Scope:

- Pi package gallery candidates provided by user
- `amosblomqvist/pi-config/extensions` candidates

This is **not an install manifest**. Do not install from this document automatically.

## Scoring model

| Score | Meaning                                          |
| ----- | ------------------------------------------------ |
| 5     | Strong fit; review source and likely adopt/adapt |
| 4     | Good fit; useful after source/config review      |
| 3     | Maybe; useful for specific workflows only        |
| 2     | Defer; powerful but likely too broad/noisy now   |
| 1     | Reject for current setup                         |

Primary criteria:

- supports planned workflows: `dev-loop`, `agent-pr`, future parallel task mode
- improves safety/DX without broad behavior mess
- has clear boundaries/configuration
- does not duplicate personally trusted skills/workflows
- can be pinned/reviewed

## Executive ranking

### Review first

| Rank | Package/extension                            | Score | Why                                                                                                                                                                                                                                                                                       |
| ---- | -------------------------------------------- | ----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `@gotgenes/pi-permission-system`             |     5 | Direct security foundation: path/bash/tool permission policy, fail-closed behavior, subagent prompt forwarding.                                                                                                                                                                           |
| 2    | `bash-guard/` from `amosblomqvist/pi-config` |     5 | Smaller focused bash safety layer; especially interesting because it treats subagents differently from main sessions.                                                                                                                                                                     |
| 3    | `@arhen/pi-core-subagent`                    |     4 | Strong conceptual match for `dev-loop`: isolated child sessions, graph scheduling, read/write tool split, worktree isolation for write agents. Downgraded from 5 because user reports Pi package/gallery entry as archived while GitHub repo is not archived; verify/fork before install. |
| 4    | `pi-subagents`                               |     5 | Strongest production/workflow substrate candidate: builtin scout/worker/reviewer/oracle roles, workflow scripts, missions, gates, budgets, worktrees, observability, extension APIs. Compare deeply with `@tintinweb`; see `docs/subagent-package-comparison.md`.                         |
| 5    | `@tintinweb/pi-subagents`                    |     5 | Strong, active Claude Code-like subagents/workflows package: isolated sessions, custom agents, FleetView, scripted workflows, RPC, scheduling, worktrees, memory, tool denylist. Best interactive UX candidate.                                                                           |
| 6    | Pi official `examples/extensions/subagent/`  |     4 | Known-good reference implementation; should be read before adopting third-party subagent packages.                                                                                                                                                                                        |

### Planning/review candidates

| Package/extension           | Score | Why                                                                                                                                                                                        |
| --------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@plannotator/pi-extension` |     4 | Interactive file-based plan mode, browser UI, annotations/approval, phase-specific tool restrictions, and code/PR review. Strong if we want explicit human plan approval before execution. |

### Good DX candidates

| Package/extension                                 | Score | Why                                                                                                                                                                          |
| ------------------------------------------------- | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pi-lens`                                         |     4 | Real-time diagnostics/LSP/lint/typecheck feedback; useful if not noisy/heavy.                                                                                                |
| `@ff-labs/pi-fff`                                 |     4 | Faster/fuzzier search; low conceptual risk but changes core search behavior.                                                                                                 |
| `browser/` from `amosblomqvist/pi-config`         |     4 | Opt-in Playwright browser tools; very useful for frontend debugging.                                                                                                         |
| `prompt-snippets/` from `amosblomqvist/pi-config` |     3 | Manual per-message steering without installing broad skills.                                                                                                                 |
| `@dietrichgebert/ponytail`                        |     3 | Minimalism/YAGNI/reuse skill with huge adoption; potentially useful prompt behavior, but review for compatibility and whether it fights thorough workflow/reviewer behavior. |
| `@juicesharp/rpiv-todo`                           |     3 | Nice visible todo overlay; may overlap with workflow state.                                                                                                                  |

### Workflow candidates to inspect carefully

| Package                   | Score | Why                                                                                                                                                                                          |
| ------------------------- | ----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@trevonistrevon/pi-loop` |     4 | Very active cron/event/dynamic re-wake loops plus background command monitoring and bounded subagent orchestration; promising but overlaps `pi-workflows` monitor and custom workflow state. |
| `pi-autoresearch`         |     4 | Purpose-built benchmark/optimization loop with `.auto/` artifacts and dashboard; strong when there is a measurable metric, not a general dev-loop substrate.                                 |
| `pi-background-tasks`     |     4 | Durable background shell/tasks/delegated agents; relevant to `agent-pr` and future parallel tasks, but broad.                                                                                |
| `@agimon-ai/doompi-loop`  |     2 | Active but alpha and DoomPi-coupled; useful session-scoped loop design, not ready as a default dependency.                                                                                   |
| `pi-fabric`               |     2 | Powerful programmable runtime/orchestration; likely too broad for now and overlaps planned design.                                                                                           |

### Memory candidates need separate decision

| Package/extension                                      | Score | Why                                                                                                    |
| ------------------------------------------------------ | ----: | ------------------------------------------------------------------------------------------------------ |
| `pi-hermes-memory`                                     |     3 | Rich local memory/session search/secret scanning; but memory policy needs grilling first.              |
| `@amaster.ai/pi-memory-mem0`                           |     3 | Mem0 semantic memory with passive/active/hybrid modes; cloud/self-host/privacy decision needed.        |
| `observational-memory/` from `amosblomqvist/pi-config` |     3 | Interesting `.memory/` topic-file model; may fit Obsidian better than vector memory, but needs design. |

### Integration candidates only if needed

| Package/extension                            | Score | Why                                                                           |
| -------------------------------------------- | ----: | ----------------------------------------------------------------------------- |
| `pi-mcp-adapter`                             |     3 | Excellent if you have specific MCP servers; otherwise expands attack surface. |
| `pi-web-access`                              |     3 | Powerful web/search/fetch/GitHub/PDF/video; useful but broad and API-heavy.   |
| `web-fetch/` from `amosblomqvist/pi-config`  |     3 | Narrower fetch/PDF/readability alternative.                                   |
| `web-search/` from `amosblomqvist/pi-config` |     2 | Google CSE-specific; only if you want that exact provider.                    |
| `pi-mcp-adapter` + `pi-web-access` together  |     2 | Too much tool surface unless explicitly needed.                               |

---

# Detailed analysis

## `@gotgenes/pi-permission-system`

Source: `github.com/gotgenes/pi-packages`  
Category: security  
Score: **5**

### Description

Centralized permission enforcement extension for Pi. It gates tool calls, bash commands, MCP, skills, special operations, external paths, and sensitive file patterns. It supports allow/ask/deny policies, session approvals, project/global configs, and subagent prompt forwarding.

Notable documented features:

- hides disallowed tools before agent start
- enforces `allow` / `ask` / `deny`
- cross-cutting `path` rules for sensitive files
- symlink-resolved path matching
- external directory guard
- fail-closed on internal errors
- prompts on unparseable/indirect bash commands instead of silently allowing
- subagent ask forwarding

### Pros

- Best match for security foundation.
- More complete than ad-hoc `permission-gate` or `protected-paths`.
- Protects paths across multiple tool surfaces, not just bash.
- Good fit for autonomous `dev-loop`/`agent-pr` where subagents need guardrails.
- Project config cannot loosen global policy until project is trusted.

### Cons / risks

- Large policy system; needs careful config review.
- Could become annoying if too many `ask` prompts fire.
- Needs compatibility review with chosen subagent package.
- May overlap with `bash-guard`; probably choose one primary permission layer.

### Recommendation

**Review first.** Likely adopt if source/config look clean.

Suggested role:

```text
global security foundation
```

Do not pair blindly with multiple bash guards; avoid double prompts.

---

## `bash-guard/` from `amosblomqvist/pi-config`

Source: `github.com/amosblomqvist/pi-config/extensions/bash-guard`  
Category: security  
Score: **5**

### Description

Focused bash tool interceptor. Main sessions prompt for risky commands. Spawned subagents hard-block catastrophic operations using `PI_SUBAGENT_DEPTH`.

Main-session prompts include risky git, disk tooling, `rm`, `sudo`, `find -delete`, shell redirections, pipes, deploy/destructive cloud commands, and more.

Subagents hard-block catastrophic commands like recursive deletion, sudo, pipe-to-shell, disk formatting, `git push`, `git reset --hard`, `git clean`, etc.

### Pros

- Simple and directly aligned with autonomous subagents.
- Different policy for interactive main session vs headless subagents is exactly the right idea.
- Easier to understand than a full permission system.
- Good fallback if `@gotgenes/pi-permission-system` feels too big.

### Cons / risks

- Only intercepts `bash`; does not protect `write`/`edit` or extension tools.
- Depends on `PI_SUBAGENT_DEPTH`, so behavior depends on subagent substrate.
- May need import/package-name modernization.

### Recommendation

Compare against `@gotgenes/pi-permission-system`.

Possible decisions:

```text
A. Use @gotgenes as full policy system; skip bash-guard.
B. Use bash-guard as lightweight v1 security.
C. Adapt bash-guard ideas into our own workflow permission layer.
```

---

## `@arhen/pi-core-subagent`

Source: `github.com/arhen/pi-extensions`  
Category: workflow/subagents  
Score: **4**

### Description

Fast in-process subagents with dependency graph scheduling. Children are separate `AgentSession`s inside the same Pi process, not subprocesses. Supports parallel/chained/graph tasks via `needs` edges, background runs, mailbox/intercom, and agent files.

Notable design principles from README:

- delegation graph is the workflow
- proof is exit code, not self-report
- agent files respected
- two toolsets only: read-only or write
- zero parent-context injection
- worktree isolation for write agents

### Pros

- Very strong fit for our `dev-loop` design.
- Read-only vs write toolsets map nicely to implementer/test-auditor/reviewer.
- Graph scheduler could support future parallel task mode.
- Worktree isolation for write agents is relevant for `agent-pr`.
- Avoids dumping child transcripts into parent context.

### Cons / risks

- Need source audit.
- Need verify exact tool permissions and whether they are enforceable enough.
- In-process design may have different isolation tradeoffs than subprocess/tmux.
- Worktree/dependency behavior needs careful testing.
- User reports Pi package/gallery entry as archived; GitHub repo itself is not archived as of 2026-08-27. Treat this mismatch as a lifecycle/stability risk.

### Recommendation

**Top subagent concept, but not a blind install.** Compare with official example and `@tintinweb/pi-subagents`; verify the archive mismatch. If the source is good, consider fork/adapt rather than depending directly on the public package.

---

## `pi-subagents`

Source: `github.com/nicobailon/pi-subagents`  
Category: workflow/subagents  
Score: **5**

### Description

Single-agent delegation and scripted multi-agent workflows for Pi. Ships builtin agents (`scout`, `researcher`, `worker`, `reviewer`, `oracle`, `delegate`), prompt shortcuts (`/parallel-review`, `/review-loop`, `/parallel-research`, `/gather-context-and-clarify`, `/parallel-cleanup`), FleetView/inspector observability, `workflowScript` orchestration, missions, gates, budgets, retained children, worktree isolation, watchdog/capability APIs, and extension APIs.

Current status snapshot from npm/GitHub on 2026-08-27:

- npm latest: `0.58.0`, published 2026-08-27.
- GitHub: not archived, 3336 stars, 577 forks, default branch `main`.
- Last GitHub push: 2026-08-27.
- Issues/PRs: 3 open issues, 2 open PRs; 734 merged PRs.
- Release cadence: very frequent from 2026-01-24 through 2026-08-27.

### Pros

- Closest off-the-shelf shape to our desired `dev-loop`: docs recommend `clarify → scout → worker → fresh reviewers → worker`.
- Builtin roles map directly to explorer/researcher/implementer/reviewer/oracle.
- `workflowScript` gives deterministic control with `runs.run`, `runs.all`, `runs.steer`, validation, `workflowScriptPath`, budgets, gates, mission state, and retained children.
- Strong child-safety story: children do not get parent-only subagent artifacts, do not receive the bundled skill, and do not get `subagent` tool by default unless explicitly configured/depth-bounded.
- Strong observability and artifacts: FleetView, inspector, transcripts, events/logs.
- Extension APIs look useful for custom `research-swarm`, `dev-loop`, and `agent-pr` integration.
- Low current issue/PR count relative to activity/adoption.

### Cons / risks

- Large and opinionated; may become the workflow authority rather than just a substrate.
- Missions/schedules/watchdog/extension APIs could overlap with `pi-workflows` and planned custom state.
- Builtin agents/prompts may need curation to avoid behavior drift.
- Still needs a separate positive permission/role guard for publish phases and write authority.

### Recommendation

**Top subagent substrate candidate for source review.** Prefer this if production workflow guardrails, builtin roles, workflow scripts, missions/receipts, extension APIs, and worktrees matter more than a pure Claude-like UI. See `docs/subagent-package-comparison.md` for the deeper comparison with `@tintinweb/pi-subagents` and `@arhen/pi-core-subagent`.

---

## `@tintinweb/pi-subagents`

Source: `github.com/tintinweb/pi-subagents`  
Category: workflow/subagents  
Score: **5**

### Description

Claude Code-style autonomous subagents and workflow orchestration for Pi. The package description is strong and the README backs it up: isolated sessions, each with its own tools/system prompt/model/thinking level; background or foreground execution; mid-run steering; session resume; custom agent types; FleetView/live widgets; deterministic scripted workflows through `SubagentWorkflow`; cross-extension RPC; scheduling; worktree isolation; skill preloading; persistent memory; model-scope enforcement; and tool denylist.

Current status snapshot from npm/GitHub on 2026-08-27:

- npm latest: `0.19.0`, published 2026-08-27.
- GitHub: not archived, 977 stars, 210 forks, default branch `master`.
- Last GitHub push: 2026-08-27.
- Issues/PRs: 26 open issues, 25 open PRs; 79 closed issues, 75 merged PRs.
- Release cadence: many releases from 2026-03-05 through 2026-08-27.
- Quality gates advertised: lint, typecheck, tests, E2E tests, coverage, benchmarks, `prepublishOnly` runs lint/typecheck/test/build.

### Pros

- Most mature-looking subagent candidate by adoption and feature completeness.
- Strong active development: latest npm and GitHub push are current.
- Custom agent types map well to explorer/implementer/test-auditor/reviewer roles.
- Live widget, FleetView, conversation viewer, steering, and resume are strong human-operator DX.
- `SubagentWorkflow` gives deterministic JavaScript orchestration (`agent`, `parallel`, `pipeline`, `phase`, `gate`) rather than pure prompt improvisation.
- Cross-extension RPC is useful if custom `dev-loop`/`agent-pr` wants to spawn/stop/join subagents without binding to internals.
- Worktree isolation and gate commands fit PR/review workflows.
- Model-scope enforcement and tool denylist give some policy hooks.
- It explicitly disables its workflow tool if another `Workflow`/`SubagentWorkflow` provider already exists, reducing orchestrator conflicts.

### Cons / risks

- Big surface area: subagents, workflows, scheduling, memory, mentions, nested agents, RPC, UI, worktrees.
- Context inheritance and persistent memory should be disabled initially to avoid context/memory pollution.
- Nested subagents should stay off unless there is a clear need.
- Scheduling overlaps with loop packages and monitor workflows.
- Tool denylist is not the same as a positive role permission system; still need external permission/role guard.
- 25 open PRs and 26 open issues show activity, but also a lot in flight.
- Package Pi entry points to `./src/index.ts`; verify loader/runtime compatibility before relying on it.

### Recommendation

Upgrade to **top installable subagent candidate** for source review. It may be better than `@arhen/pi-core-subagent` for this setup if interactive management, FleetView, custom agent types, RPC, and workflow scripting matter. Configure conservatively for v1:

```text
Enable: Agent, get_subagent_result, steer_subagent, FleetView/widget, custom agents, worktrees, gate commands, RPC if needed.
Disable initially: nested subagents, context inheritance, persistent memory, scheduling, broad workflow auto-use unless custom coordinator needs it.
Still required: separate permission/role guard for explorer/read-only/reviewer/test-auditor/publish phases.
```

---

## `@trevonistrevon/pi-loop`

Source: `github.com/trvon/pi-loop`  
Category: workflow/loops/monitoring  
Score: **4**

### Description

Cron/event/dynamic re-wake loops for Pi, with background command monitors, task/workflow tools, and bounded async subagent orchestration.

Current status snapshot is in `docs/loop-subagent-extension-status.md`: GitHub not archived, latest publish and push on 2026-08-27, 0 open issues, 0 open PRs.

### Pros

- Very active development and release cadence.
- Covers real monitoring/re-wake use cases: delayed checks, background process completion, inactivity alerts.
- Has explicit task/workflow ownership surfaces and recovery-oriented docs.
- Could be useful for long-running CI/deploy/job checks.

### Cons / risks

- Overlaps heavily with the existing `pi-workflows` monitor workflow.
- Adds another task/workflow authority that may conflict with custom `dev-loop`/`agent-pr` state.
- Broad surface: loops, monitors, workflows, tasks, orchestration.

### Recommendation

High-interest source review, but adopt only if it solves a concrete gap in monitor/re-wake behavior. Do not install alongside another workflow monitor casually.

---

## `pi-autoresearch`

Source: `github.com/davebcn87/pi-autoresearch`  
Category: workflow/optimization loop  
Score: **4**

### Description

Autonomous benchmark/experiment loop: initialize an experiment, run a measurement command, log result, keep/revert changes, and repeat. Persists session artifacts in `.auto/` and provides dashboard UI plus `autoresearch-*` skills.

Current status snapshot is in `docs/loop-subagent-extension-status.md`: GitHub not archived, latest publish 2026-07-09, last push 2026-07-15, 8 open issues, 6 open PRs.

### Pros

- Strong fit for measurable optimization targets: test speed, build time, training loss, bundle size, Lighthouse score.
- Durable `.auto/` artifacts make experiment state inspectable.
- Purpose-built dashboard/logging.

### Cons / risks

- Specialized; not a general coding loop, subagent substrate, or PR workflow.
- Auto-commit/keep/revert behavior needs branch and dirty-repo policy review.
- Activity is recent but quieter than August loop packages.

### Recommendation

Optional specialized package for optimization sessions. Do not use as the foundation for `dev-loop`.

---

## `@agimon-ai/doompi-loop`

Source: `github.com/AgiFlow/doompi`  
Category: workflow/loops  
Score: **2**

### Description

Session-scoped recurring prompt scheduler. It runs a prompt immediately, repeats at bounded intervals, waits for idle if Pi is busy, and coalesces due signals. README states it is alpha and not a durable queue.

Current status snapshot is in `docs/loop-subagent-extension-status.md`: GitHub not archived, package is `0.0.1-alpha.39`, latest publish and push on 2026-08-27, 0 open issues, 1 open PR.

### Pros

- Clear, small session-loop semantics.
- Active development.
- Coalescing/idle behavior is the right shape for recurring prompts.

### Cons / risks

- Alpha; contracts may change.
- Coupled to DoomPi/Cordis distribution contracts.
- Not durable across session shutdown/resume.

### Recommendation

Watch/defer. Borrow design ideas if needed; do not make it a default dependency now.

---

## `@plannotator/pi-extension`

Source: `github.com/backnotprop/plannotator`  
Category: planning/review/DX  
Score: **4**

### Description

Interactive plan review/annotation extension for Pi. Adds file-based plan mode with browser UI. In plan mode, the agent explores the codebase, writes a Markdown checklist plan, submits it through `plannotator_submit_plan`, and waits for human approval/denial/annotated feedback before execution. It also has code/PR review surfaces.

Current status snapshot from npm/GitHub on 2026-08-27:

- npm latest: `0.27.8`, published 2026-08-24.
- GitHub: not archived, 8088 stars, 600 forks.
- Last GitHub push: 2026-08-27.
- Issues/PRs: 93 open issues, 45 open PRs; 725 merged PRs.
- Release cadence: very frequent from 2026-02-21 through 2026-08-24.

### Pros

- Strong fit for explicit human approval before autonomous execution.
- Phase-specific tool restrictions are exactly the right concept: planning can be read-only / plan-file-only; execution gets broader tools after approval.
- Browser UI with plan diff and annotations gives better feedback than chat-only plan approval.
- Event-bus API allows other extensions to enter/exit/query plan mode.
- Honors Pi project trust for project-local config.

### Cons / risks

- Heavy package: npm unpacked size ~41 MB with browser UI assets/server code.
- Large open issue/PR count suggests lots of surface/in-flight work.
- Could duplicate custom workflow checkpoints if we build our own plan approval UI.
- Browser/server/network/VCS integrations need security review.

### Recommendation

High-interest review if we want plan approval/annotation as a first-class gate before `dev-loop` or `agent-pr` execution. Do not install until we decide whether plan approval belongs in Plannotator or our custom workflow coordinator.

---

## `@dietrichgebert/ponytail`

Source: `github.com/DietrichGebert/ponytail`  
Category: prompting/skills/minimalism  
Score: **3**

### Description

“Lazy senior dev mode” for AI agents. Pi package includes an extension and skills. Core behavior is a minimalism ladder: question whether the code needs to exist, reuse existing code, prefer stdlib/native platform/installed dependency, one-liner if appropriate, otherwise minimum that works. README claims benchmark reductions in LOC/tokens/cost/time while preserving safety.

Current status snapshot from npm/GitHub on 2026-08-27:

- npm latest: `4.9.0`, published 2026-08-07.
- GitHub: not archived, 113792 stars, 6222 forks.
- Last GitHub push: 2026-08-07.
- Issues/PRs: 69 open issues, 108 open PRs; 174 merged PRs.

### Pros

- Good philosophy for this setup: avoid overbuilding, reuse existing code, prefer platform features, keep solutions small.
- Huge adoption/visibility.
- Could improve normal sessions and implementer behavior without adding orchestration.

### Cons / risks

- Mostly prompt/skill behavior; may conflict with thorough exploration or reviewer expectations if always-on.
- Marketing/adoption numbers are unusually huge; source review should verify real Pi extension behavior.
- Minimalism can become underengineering if not balanced by security, tests, and domain constraints.
- Includes cross-agent/plugin assets beyond Pi; review package contents and hooks before installing.

### Recommendation

Maybe adopt as a manually invoked skill/snippet, not an always-on global behavior initially. Better to encode the “minimal sufficient change” principle into reviewer/implementer prompts after source review.

---

## `pi-background-tasks`

Source: `github.com/ismailsaleekh/pi-background-tasks`  
Category: workflow/DX/background tasks  
Score: **4**

### Description

Extension for durable background shell tasks, read-only delegated agents, local attested Pi runs, and fixed-purpose Fusion workflows through child Pi processes.

Public commands include `/bg`, `/jobs`, `/logs`, `/tasks`, `/kill`, `/fusion`. Public tools include `bg_run`, `bg_delegate`, `bg_logs`, `bg_result`, `bg_run_pi_attested`, and fusion tools.

### Pros

- Useful for long-running commands and monitors.
- Relevant to future parallel/delegated tasks.
- Could support `/agent-pr` background execution or task tracking.
- Separates long shell work from foreground conversation.

### Cons / risks

- Broad tool surface.
- Shell background tasks are not sandboxed by default.
- Fusion workflows may overlap with your preferred skills/workflows.
- Could become another orchestration system competing with `dev-loop`.

### Recommendation

Review after subagent substrate. Potentially adopt only background shell/task features; avoid workflow/fusion parts unless explicitly desired.

---

## `pi-lens`

Source: `github.com/apmantza/pi-lens`  
Category: DX/code quality  
Score: **4**

### Description

Real-time code feedback for Pi: LSP, linters, formatters, type-checking, structural analysis, AST search/replace, dependency/security scans, diagnostics tools.

### Pros

- Strong DX candidate.
- Could make implementer/test-auditor more effective by surfacing diagnostics.
- Useful outside workflows too.
- Tooling feedback is less behaviorally messy than broad skills.

### Cons / risks

- Could be noisy or expensive on large repos.
- External tool auto-detection/install behavior needs review.
- May overlap with existing repo commands/checks.
- Need ensure it does not auto-fix unexpectedly without approval.

### Recommendation

Review after security/subagents. Likely useful if configured conservatively.

Suggested default posture:

```text
read diagnostics: yes
auto-fix/format: explicit only
background scans: project opt-in
```

---

## `@ff-labs/pi-fff`

Source: `github.com/dmtrKovalenko/fff`  
Category: DX/search  
Score: **4**

### Description

FFF-powered fuzzy file/content search. Adds/replaces search tools with Rust-native indexed search: `fffind`, `ffgrep`, `fff-multi-grep`, and fuzzy `@` autocomplete.

### Pros

- Low conceptual risk compared with workflow/memory packages.
- Faster and fuzzier repo navigation.
- Frecency and git-aware ranking can improve agent file discovery.
- Useful for both normal sessions and subagents.

### Cons / risks

- Changes search behavior; fuzzy ranking may hide deterministic expectations.
- Native dependency/index may have machine-specific issues.
- Need verify ignores/protected paths and large repo behavior.

### Recommendation

Good DX candidate. Install only after verifying it does not worsen deterministic search for agents.

---

## `browser/` from `amosblomqvist/pi-config`

Source: `github.com/amosblomqvist/pi-config/extensions/browser`  
Category: DX/frontend/debugging  
Score: **4**

### Description

Playwright-driven headless Chromium extension. Provides opt-in browser tools gated behind `/browser on`: navigate, run JS, inspect console/network, fill/click, screenshot, close.

### Pros

- Very useful for SPA/frontend debugging.
- Off by default, so it does not pollute every session.
- Can inspect localStorage, network headers, console errors, screenshots.
- Good for real browser behavior that tests may miss.

### Cons / risks

- Requires Playwright/Chromium install.
- Persistent browser profile may contain cookies/session data.
- Browser tools can touch external network and logged-in apps.
- Need secret/cookie handling policy.
- Imports may need package-name update.

### Recommendation

Adopt only if you do frontend/browser work often. Keep opt-in per session.

---

## `@juicesharp/rpiv-todo`

Source: `github.com/juicesharp/rpiv-mono`  
Category: DX/state  
Score: **3**

### Description

Todo list extension with live overlay that survives reload and compaction. Shows current/done/queued tasks.

### Pros

- Good visibility into what agent is doing.
- Useful for long interactive sessions.
- Lower risk than orchestration packages.

### Cons / risks

- May overlap with `dev-loop` workflow state.
- Another state surface can confuse whether tasks are authoritative.
- Need see whether model overuses/maintains todos well.

### Recommendation

Maybe install for normal sessions, but do not make it part of `dev-loop` v1. Workflow state should stay inside coordinator loop reports.

---

## `prompt-snippets/` from `amosblomqvist/pi-config`

Source: `github.com/amosblomqvist/pi-config/extensions/prompt-snippets`  
Category: DX/prompting  
Score: **3**

### Description

Tiny prompt rules that can be toggled per message via `/snippets` or `alt+s`. Snippets are Markdown files with frontmatter and reset after each send.

Included snippets seen in repo:

- ask questions
- delegate exploration
- diagnose report
- orchestrator mode
- session kickoff
- verify not assume

### Pros

- Manual, explicit steering.
- Less invasive than always-on skills.
- Easy to edit snippets in your setup repo.

### Cons / risks

- Can overlap with skills like Matt Pocock workflows.
- Another prompt mechanism to remember.
- Needs careful curation to avoid prompt soup.

### Recommendation

Maybe adapt with only 3-5 snippets you actually use.

---

## `pi-hermes-memory`

Source: `github.com/chandra447/pi-hermes-memory`  
Category: memory/session search/security  
Score: **3**

### Description

Persistent memory and session search extension. Uses SQLite FTS5, secret scanning, background learning, failure memory, procedural skills, memory aging, and two-tier global/project memory.

Notable documented posture: policy-only memory by default; full Markdown memories are not injected into system prompt by default. Agent is told when to call `memory_search`.

### Pros

- Rich local session search.
- Secret scanning is relevant.
- Failure memory could help avoid repeated mistakes.
- Project/global separation aligns with repo-specific work.
- More inspectable than opaque cloud memory.

### Cons / risks

- Memory is a big behavior change.
- Auto-consolidation/background learning may store things you did not intend.
- Could conflict with Obsidian as source of durable memory.
- Native SQLite dependency risk.
- Need decide memory retention/deletion/privacy model.

### Recommendation

Do not install yet. Run a memory/Obsidian grilling first.

Possible fit:

```text
session search + failure memory, not general life memory
```

---

## `@amaster.ai/pi-memory-mem0`

Source: `github.com/TGYD-helige/pi`  
Category: semantic memory  
Score: **3**

### Description

Semantic memory powered by Mem0. Supports platform/cloud, embedded, and self-hosted backends. Modes: hybrid, active, passive. Passive side captures turns and prefetched recall; active side exposes a `mem0_memory` tool.

Documented safety boundaries include untrusted memory wrapping, project namespacing, credential redaction, and cloud mode disclosure.

### Pros

- Flexible backend modes.
- Active mode can avoid automatic capture.
- Project namespacing is good.
- Embedded/self-hosted options avoid Mem0 Cloud.

### Cons / risks

- Semantic memory can recall wrong/stale context.
- Passive mode sends conversation turns to memory extraction automatically.
- Platform mode sends data to third-party cloud.
- Less Obsidian-native than a Markdown/topic-file approach.
- Needs embedding/model cost/privacy decisions.

### Recommendation

Memory decision bucket. If used, start with `active` mode, not passive/hybrid.

---

## `observational-memory/` from `amosblomqvist/pi-config`

Source: `github.com/amosblomqvist/pi-observational-memory`  
Category: memory  
Score: **3**

### Description

Tiered subprocess-backed observational memory. Parallel observers distill conversation into atomic observations; consolidator promotes old observations into durable `.memory/` topic files. Deterministic/model-free compaction.

### Pros

- File/topic model may fit Obsidian better than vector DB.
- Atomic observations + consolidation is conceptually clean.
- Potentially more auditable than hidden semantic memory.

### Cons / risks

- Needs separate repo review.
- Background observers can create noise or bad memories.
- Need decide how `.memory/` relates to Obsidian vault.
- Could duplicate existing `herdr-agent-state.ts` / Obsidian extension ideas.

### Recommendation

Most interesting memory direction if you want Obsidian/Markdown integration, but grill first.

---

## `pi-mcp-adapter`

Source: `github.com/nicobailon/pi-mcp-adapter`  
Category: MCP/integration  
Score: **3**

### Description

MCP adapter for Pi. Provides access to MCP servers with a proxy-tool approach to reduce context bloat. Supports lazy server connections, setup/import from other host configs, cached tool metadata, direct tools optional, resources, runtime registration from extensions, and config layering.

### Pros

- Unlocks MCP ecosystem without flooding context with every tool schema.
- Lazy connections are good.
- Useful if you already rely on MCP servers elsewhere.
- Can bridge external services/databases/browsers/APIs.

### Cons / risks

- MCP servers can have huge and risky tool surfaces.
- Importing host configs could accidentally expose too much.
- Needs permission system before serious use.
- Adds another integration layer to debug.

### Recommendation

Only install when you have specific MCP servers you want. Pair with permission system and package filtering.

---

## `pi-web-access`

Source: `github.com/nicobailon/pi-web-access`  
Category: web/research/fetch/GitHub/PDF/video  
Score: **3**

### Description

Broad web access extension: web search, URL fetching, GitHub repo/PR/issue rendering, PDFs, YouTube/local video understanding, source checking, activity monitor, and provider integrations.

### Pros

- Very capable research tool.
- GitHub PR/issue rendering may help `agent-pr` workflows.
- PDF/video support is useful if needed.
- Could replace several smaller web tools.

### Cons / risks

- Broad external network surface.
- Multiple providers/API keys/configs.
- Video/PDF processing can be heavyweight.
- More than needed for normal coding sessions.
- Needs strong privacy/source policy.

### Recommendation

Maybe later. Prefer narrower `web-fetch` first unless you need full web/search/video stack.

---

## `web-fetch/` from `amosblomqvist/pi-config`

Source: `github.com/amosblomqvist/pi-config/extensions/web-fetch`  
Category: web/fetch/PDF  
Score: **3**

### Description

Narrow web fetch extension using readability, Turndown, PDF extraction, bounded response sizes, and Jina reader fallback.

### Pros

- Narrower and easier to reason about than `pi-web-access`.
- Useful for documentation/API reading.
- Has response-size limits.

### Cons / risks

- External network access still needs policy.
- Needs compatibility update for current Pi package imports.
- Jina fallback sends URLs/content through third-party service.

### Recommendation

Good candidate for a minimal web-reading tool if you do not want full `pi-web-access`.

---

## `web-search/` from `amosblomqvist/pi-config`

Source: `github.com/amosblomqvist/pi-config/extensions/web-search`  
Category: web/search  
Score: **2**

### Description

Google Custom Search based web search extension. Reads credentials from env vars or extension-local `auth.json`.

### Pros

- Simple if you want Google CSE specifically.
- Smaller than broad web packages.

### Cons / risks

- Requires Google API key/CSE setup.
- Secret handling required.
- Search-only; likely less useful than fetch+GitHub/PDF tooling.
- Extension-local `auth.json` should not be committed.

### Recommendation

Defer unless Google CSE is specifically desired.

---

## `pi-fabric`

Source: `github.com/monotykamary/pi-fabric`  
Category: orchestration/runtime  
Score: **2**

### Description

Programmable tool and agent runtime for Pi. Provides `fabric_exec`, composing core tools, MCP servers, captured extension tools, agents, actors, workflows, mesh/council patterns, and TypeScript programs.

### Pros

- Very powerful.
- Could express complex workflows and councils.
- Has architecture/security docs and configuration.

### Cons / risks

- Too broad for current setup.
- Overlaps heavily with `dev-loop`, subagents, MCP, and background task plans.
- Adds a full programmable runtime before we know we need one.
- High risk of becoming the mess you want to avoid.

### Recommendation

Defer. Reconsider only if the simpler subagent workflow cannot express your needs.

---

## `@juicesharp/rpiv-todo` vs Pi official `todo.ts`

Score: **3**

### Notes

There is also a Pi official example `todo.ts`. Before installing `@juicesharp/rpiv-todo`, compare:

- persistence model
- compaction behavior
- UI noise
- whether model overuses it
- whether it conflicts with workflow state

Recommendation: use todo as human-visible DX, not as workflow source of truth.

---

## `ask-user-question.ts` from `amosblomqvist/pi-config`

Category: interaction  
Score: **2-3**

### Description

Likely a small helper for asking the user questions through Pi UI.

### Pros

- May improve explicit user checkpoints.
- Could be useful inside workflows.

### Cons / risks

- Pi already has `ctx.ui` primitives and official `question.ts` examples.
- May be redundant.

### Recommendation

Review only if workflow implementation needs a reusable question helper.

---

## `custom-header.ts` from `amosblomqvist/pi-config`

Category: UI  
Score: **2-3**

### Description

Custom header UI extension.

### Pros

- Low-risk UI customization.
- Could show workflow status/model/branch.

### Cons / risks

- Pure preference.
- May overlap with footer/status-line examples.

### Recommendation

Defer until security/workflow decisions are done.

---

# Key decisions to make next

## 1. Permission layer

Candidates:

```text
@gotgenes/pi-permission-system
bash-guard/
Pi official permission-gate/protected-paths examples
custom lightweight guard
```

Recommended decision path:

1. Review `@gotgenes/pi-permission-system` config and source.
2. Review `bash-guard` source.
3. Choose one primary permission layer.
4. Add a minimal config to `pi-setup`.

## 2. Subagent substrate

Candidates:

```text
pi-subagents (nicobailon)
@tintinweb/pi-subagents
@arhen/pi-core-subagent
amos interactive-subagents
Pi official subagent example
custom extension using official APIs
```

Recommended decision path:

1. Read Pi official example.
2. Read `pi-subagents` source/docs.
3. Read `@tintinweb/pi-subagents` source/docs.
4. Read `@arhen/pi-core-subagent` source/docs as graph-design reference/fork candidate.
5. Decide whether to adopt one substrate or build our own minimal `dev-loop` extension.

Current leaning:

```text
pi-subagents for production workflow substrate / builtin roles / workflowScript / missions / APIs
@tintinweb/pi-subagents if interactive FleetView + Claude-like UX matters more
@arhen/pi-core-subagent as minimal DAG-design reference/fork candidate
```

## 3. Memory/Obsidian

Candidates:

```text
pi-hermes-memory
@amaster.ai/pi-memory-mem0
amos observational-memory
custom Obsidian-backed memory
```

Do not choose until grilled.

Open questions:

- What should be remembered?
- Who approves memories?
- Where is source of truth: SQLite/vector DB, `.memory/`, or Obsidian?
- Should memories be auto-injected, tool-retrieved, or manual only?
- How are secrets and project boundaries handled?

## 4. Web access

Candidates:

```text
pi-web-access
pi-mcp-adapter + specific MCP servers
amos web-fetch/web-search
custom minimal fetch tool
```

Recommended default:

```text
No broad web/MCP package until specific need.
If needed, start with narrow web-fetch or pi-web-access with strict config.
```

# Suggested adoption roadmap

## Phase 1: Security and review only

- Review `@gotgenes/pi-permission-system`
- Review `bash-guard`
- Pick permission layer
- Add config to `pi-setup`

## Phase 2: Subagent implementation choice

- Read official Pi subagent example
- Review `@arhen/pi-core-subagent`
- Review `@tintinweb/pi-subagents`
- Decide substrate for `dev-loop`

## Phase 3: DX improvements

- Try `pi-lens` conservatively
- Try `@ff-labs/pi-fff`
- Consider `browser/` if frontend debugging is common
- Consider `prompt-snippets/`

## Phase 4: Memory

- Grill Obsidian/memory design
- Compare Hermes vs Mem0 vs observational memory
- Choose manual/tool-based memory before auto-memory

## Phase 5: Web/MCP

- Add only if a concrete use case appears
- Prefer narrow tools over broad ecosystem exposure
