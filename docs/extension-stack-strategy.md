# Extension stack strategy

This document describes the desired combination of Pi extensions for this setup, beyond security alone.

The goal is a small, coherent extension stack that supports autonomous development workflows without creating overlapping behavior, prompt noise, or unsafe automation.

## Design principle

Prefer a few strong layers:

```text
1. Safety / permissions
2. Subagent substrate
3. Custom workflows built on that substrate
4. DX tools that improve visibility/search/debugging
5. Optional memory/web integrations after separate decisions
```

Avoid installing multiple packages that solve the same layer in incompatible ways.

## Target stack shape

```text
Global always-on:
  permission layer
  small status/UI layer
  reload helper

Workflow foundation:
  one subagent substrate
  custom workflow specs/extensions:
    - research-swarm
    - dev-loop
    - agent-pr

Optional per-session/per-project:
  browser tools
  web fetch/search
  pi-lens diagnostics
  fuzzy search
  memory
```

## Candidate layers

## 1. Permission / safety layer

Candidates:

- `@gotgenes/pi-permission-system`
- `bash-guard/` from `amosblomqvist/pi-config`
- Pi official `permission-gate.ts`
- Pi official `protected-paths.ts`
- Pi official `dirty-repo-guard.ts`

Selected direction:

```text
Use @gotgenes/pi-permission-system as the baseline permission layer.
Add custom workflow role guard for research-swarm/dev-loop/agent-pr.
Do not run multiple global prompt guards unless intentionally composed.
```

Gap to solve:

- role-aware permissions for workflow phases
- publish-phase-only permissions for `agent-pr`
- read-only enforcement for explorer/test-auditor/reviewer roles

See `docs/security-extension-strategy.md`.

## 2. Subagent substrate

Candidates:

- Pi official `examples/extensions/subagent/`
- `pi-subagents` from `nicobailon`
- `@tintinweb/pi-subagents`
- `@arhen/pi-core-subagent`
- `amosblomqvist/pi-interactive-subagents`
- `pi-background-tasks` for background/delegated child work
- `pi-fabric` as broad orchestration runtime

Preferred direction:

```text
Use nicobailon/pi-subagents as the baseline primary subagent substrate.
Build custom research-swarm, dev-loop, and agent-pr policy on top of it.
Do not install another subagent package in parallel unless doing isolated source-review/prototype work.
```

Selected baseline:

```text
pi-subagents (nicobailon):
  primary substrate for our extensions/ideas.
  Use its builtin mechanics: workflowScript, builtin/overridden roles,
  missions/receipts where useful, gates, budgets, worktrees,
  retained children, observability, and extension APIs.

@tintinweb/pi-subagents:
  keep as comparison/reference for interactive UX ideas only.
  Do not install alongside Nico's package by default.

@arhen/pi-core-subagent:
  keep as graph/DAG design reference or fork candidate only.

Pi official example:
  must-read reference before implementation details.
```

Likely avoid for v1:

```text
pi-fabric:
  too broad; overlaps workflows/MCP/agents/runtime
```

Gaps to solve:

- stable API for coordinator to spawn role agents
- child output capture without polluting parent context
- role-specific tool permissions
- child failure/cancellation semantics
- optional worktree isolation for write agents
- background execution for `agent-pr`/parallel tasks

## 3. Custom workflow layer

Planned custom workflows:

- `research-swarm`
- `dev-loop`
- `agent-pr`

Specs:

- `pi/extensions/research-swarm/SPEC.md`
- `pi/extensions/dev-loop/SPEC.md`
- `pi/extensions/agent-pr/SPEC.md`

These should be custom even if the subagent substrate comes from a package.

Reason:

```text
The workflow policy is personal and specific:
  - prompt -> Work Brief
  - implementer/test-auditor/reviewer loop
  - P0/P1 gates
  - no automerge
  - manual follow-up choices
```

Gaps to solve:

- workflow state model
- cycle reports
- artifact persistence
- checkpoint mechanism
- PR publishing wrapper
- research fan-out planning
- save/follow-up UI

## 4. Background task layer

Candidates:

- `pi-background-tasks`
- `@trevonistrevon/pi-loop`
- `pi-autoresearch` for benchmark/optimization loops only
- `@agimon-ai/doompi-loop` as an alpha/session-only loop to watch

Useful for:

- long-running shell commands
- watchers
- background delegated agents
- future parallel `/agent-pr-batch`

Risks:

- broad command/tool surface
- shell tasks are not sandboxed by default
- overlaps with subagent/workflow packages

Preferred direction:

```text
Do not install before choosing subagent substrate.
Review whether pi-background-tasks or @trevonistrevon/pi-loop fills a real gap after dev-loop/agent-pr design is implemented.
Keep pi-autoresearch specialized to measurable optimization projects.
Watch/defer @agimon-ai/doompi-loop while alpha and DoomPi-coupled.
```

Possible gap it solves:

- durable background jobs with logs/results
- running `agent-pr` tasks without blocking current session

Possible custom alternative:

- simple workflow-local job registry instead of full background task package

## 5. Search/navigation DX

Candidates:

- `@ff-labs/pi-fff`
- Pi built-in `find`/`grep`
- custom repo search wrapper

Preferred direction:

```text
Try @ff-labs/pi-fff if source/native dependency review passes.
Keep fallback to built-in rg/fd behavior.
```

Pros:

- fuzzy file search
- faster indexed grep
- frecency/git-aware ranking

Risks:

- non-deterministic ranking can sometimes hurt agent reliability
- native/index dependency
- may change expected tool behavior

Gaps to solve:

- deterministic search mode for subagents
- protected path filtering
- large repo index behavior

## 6. Diagnostics/code-quality DX

Candidate:

- `pi-lens`

Useful for:

- LSP diagnostics
- lint/typecheck feedback
- structural analysis
- maybe safer autofix where configured

Preferred direction:

```text
Conservative adoption only.
Diagnostics/read-only first; autofix explicit only.
```

Gaps it may solve:

- test-auditor/reviewer can inspect diagnostics without rerunning everything
- implementer gets targeted code feedback

Risks:

- noisy background analysis
- heavy dependency/tool detection
- accidental autofix/formatting if configured too aggressively

Config posture:

```text
read diagnostics: yes
auto-fix: explicit only
background scans: project opt-in
```

## 7. Browser/frontend debugging

Candidates:

- `browser/` from `amosblomqvist/pi-config`
- `pi-web-access` local video/browser-adjacent capabilities
- MCP browser servers through `pi-mcp-adapter`

Preferred direction:

```text
If frontend debugging is common, adapt amos browser extension.
Keep it off by default and enable per session with /browser on.
```

Useful for:

- SPA debugging
- localStorage/cookies
- console/network inspection
- screenshots

Gaps to solve:

- cookie/session secrecy
- profile location and cleanup
- network/body capture policy
- protected origins / localhost vs external apps

## 8. Web/research access

Candidates:

- `pi-web-access`
- `web-fetch/` from `amosblomqvist/pi-config`
- `web-search/` from `amosblomqvist/pi-config`
- `pi-mcp-adapter` + specific MCP servers
- custom minimal fetch tool

Preferred direction:

```text
No broad web/MCP by default.
Choose when there is a concrete need.
For minimal docs reading, prefer narrow web-fetch over broad web-access.
```

For `research-swarm`:

```text
web tools are allowed only if installed/enabled and prompt implies web research.
```

Gaps to solve:

- source allowlist/denylist
- API key handling
- URL fetch size limits
- third-party proxy disclosure, e.g. Jina/Datalab/etc.
- citation format

## 9. MCP integration

Candidate:

- `pi-mcp-adapter`

Useful when:

- there are specific MCP servers you already want
- you need DB/service/API integrations not worth custom extension code

Preferred direction:

```text
Do not install as default.
Add only with explicit server list and permission policy.
```

Gaps to solve before adoption:

- MCP server inventory
- per-server permissions
- secrets management
- direct vs proxy tool exposure
- disabling host config auto-import surprises

## 10. Memory layer

Candidates:

- `pi-hermes-memory`
- `@amaster.ai/pi-memory-mem0`
- `observational-memory/` from `amosblomqvist/pi-config`
- custom Obsidian-backed memory
- current/local Obsidian extension ideas

Preferred direction:

```text
Do not choose memory package yet.
Run separate memory/Obsidian decision session.
```

Likely desired posture:

```text
manual or tool-retrieved memory first
auto-capture only after trust
Obsidian/Markdown as inspectable source of truth if possible
```

Gaps to solve:

- what gets remembered
- who approves memory writes
- project vs global memory
- secret redaction
- stale memory handling
- Obsidian vault mapping
- whether memory is injected, searched by tool, or manually requested

## 11. Prompt/snippet DX

Candidate:

- `prompt-snippets/` from `amosblomqvist/pi-config`

Useful for:

- one-off steering without permanent skills
- concise/manual prompt modifiers
- avoiding large global prompt rules

Preferred direction:

```text
Maybe adapt with a very small snippet set.
```

Good snippets:

- verify, do not assume
- ask questions first
- delegate exploration
- produce diagnosis report

Risks:

- prompt soup
- overlap with Matt Pocock skills
- hidden behavior if toggles are forgotten

Gap to solve:

- snippet curation and naming

## 12. Todo/task visibility

Candidates:

- `@juicesharp/rpiv-todo`
- Pi official `todo.ts`
- workflow-local state/reporting

Preferred direction:

```text
Do not make todo the workflow source of truth.
Maybe use as normal-session visibility only.
```

Gaps to solve:

- whether todos persist across compaction/reload
- whether workflow state duplicates todo state
- whether model over-maintains todo list

## 13. UI/status layer

Candidates:

- Pi official `custom-footer.ts`
- Pi official `status-line.ts`
- Pi official `model-status.ts`
- Pi official `notify.ts`
- Pi official `reload-runtime.ts`
- `custom-header.ts` from `amosblomqvist/pi-config`

Preferred direction:

```text
Adopt/copy small official examples rather than installing large UI package.
```

Useful status:

- model/thinking level
- git branch/dirty state
- current workflow/phase/cycle
- context usage
- background job count

Gaps to solve:

- unified status component for custom workflows
- desktop notification on workflow completion/blocker
- reload command/tool for extension development

## Combination recommendations

## Minimal v1 stack

```text
Security:
  @gotgenes/pi-permission-system OR bash-guard + protected-paths

Subagents:
  pi-subagents (nicobailon) as baseline substrate

Custom workflows:
  research-swarm spec
  dev-loop spec
  agent-pr spec

UI:
  reload-runtime
  minimal status/footer
```

This is enough to start building without mess.

## Practical v1.5 stack

```text
Security:
  @gotgenes/pi-permission-system
  custom workflow role guard

Subagents:
  pi-subagents (nicobailon) with custom role agents/overrides

Workflows:
  research-swarm
  dev-loop
  agent-pr

DX:
  pi-lens diagnostics, conservative config
  @ff-labs/pi-fff if search behavior is acceptable
  notify/status/reload
```

## Optional per-session stack

```text
/browser on:
  browser debugging tools

web enabled:
  web-fetch or pi-web-access

memory enabled:
  only after Obsidian/memory design
```

## Avoid for now

```text
pi-fabric:
  too broad before simpler workflows prove insufficient

pi-mcp-adapter:
  defer until specific MCP servers are chosen

multiple subagent packages at once:
  likely confusing

multiple permission prompt systems at once:
  duplicate prompts/conflicting policy

passive/automatic memory:
  wait for memory design
```

## Known gaps we likely need to build

### 1. Workflow role guard

No off-the-shelf package exactly enforces our personal roles:

```text
explorer: read-only
implementer: edit allowed
test-auditor: no edits, tests allowed
reviewer: no edits
agent-pr publish phase: push/PR allowed only there
```

Likely custom extension.

### 2. Workflow coordinator layer

The personal workflows need custom orchestration:

- Work Brief generation
- cycle state
- role prompt loading
- report parsing
- P0/P1 loop gates
- max cycles/waves
- artifact saving
- next-action prompts

Likely custom extension using chosen subagent substrate.

### 3. Unified status UI

Need a small status/footer extension aware of:

- current workflow
- phase
- cycle/wave
- active subagents/jobs
- branch/worktree
- blocker/success state

Could adapt official status/footer examples.

### 4. Artifact/report manager

Needed by all workflows:

- save research reports
- save dev-loop failure artifacts
- save agent-pr blocker reports
- maybe link PR comments to local artifacts

Likely custom helper module.

### 5. Package/source review workflow

Need a repeatable way to audit packages:

- npm metadata
- README/docs
- source entrypoints
- registered tools/commands/events
- network/file/bash behavior
- config model
- verdict: adopt/fork/adapt/reject

Could become a `research-swarm` use case later.

### 6. Memory/Obsidian bridge

No current candidate is obviously perfect.

Need decide:

- Obsidian as source of truth?
- memory files vs SQLite/vector DB?
- manual vs automatic capture?
- project/global split?

Likely custom or carefully configured memory package.

## Source review priority

1. `@gotgenes/pi-permission-system`
2. `bash-guard/`
3. Pi official `subagent/` example
4. `pi-subagents` (see `docs/subagent-package-comparison.md`)
5. `@tintinweb/pi-subagents`
6. `@arhen/pi-core-subagent`
7. `@plannotator/pi-extension`
8. `@trevonistrevon/pi-loop`, `pi-autoresearch`, `@agimon-ai/doompi-loop` (see `docs/loop-subagent-extension-status.md`)
9. `pi-background-tasks`
10. `pi-lens`
11. `@ff-labs/pi-fff`
12. `browser/`
13. `@dietrichgebert/ponytail`
14. memory candidates
15. web/MCP candidates

## Decision table

| Layer            | Adopt package?    | Fork/adapt?            | Custom needed?              |
| ---------------- | ----------------- | ---------------------- | --------------------------- |
| Permission       | likely yes        | maybe bash-guard ideas | workflow role guard         |
| Subagents        | maybe             | maybe                  | coordinator integration     |
| Research swarm   | no                | no                     | yes                         |
| Dev loop         | no                | no                     | yes                         |
| Agent PR         | no                | no                     | yes                         |
| Background tasks | maybe later       | unlikely               | maybe minimal job state     |
| Search           | maybe `fff`       | unlikely               | maybe deterministic wrapper |
| Diagnostics      | maybe `pi-lens`   | unlikely               | config only                 |
| Browser          | maybe adapt amos  | yes possible           | config/profile policy       |
| Web              | maybe             | maybe narrow fetch     | source policy               |
| Memory           | undecided         | possible               | Obsidian bridge likely      |
| Status/UI        | official examples | yes                    | workflow-aware status       |

## Current recommendation

Use Nico's `pi-subagents` as the chosen baseline subagent substrate, pending source review and a small smoke prototype.

Next work should be:

```text
1. Choose permission layer.
2. Source-review pi-subagents critical paths and config.
3. Define our custom role agents/overrides on top of pi-subagents.
4. Build minimal workflow coordinator using specs.
5. Add workflow role guard.
6. Add small status/reload/notify DX.
7. Only then test optional DX packages like pi-lens/fff/browser.
```
