# research-swarm extension spec

## Goal

Provide a `/research-swarm <prompt>` workflow for read-only autonomous exploration.

The current Pi session acts as coordinator. It decides how to split the user's research/analyze/explore request into focused child subagents, runs them in parallel waves, receives compact evidence reports, and synthesizes a decision-ready result.

This workflow is for finding facts, not making implementation edits.

## Relationship to other workflows

```text
research-swarm:
  read-only fan-out/reduce for facts and evidence

dev-loop:
  implementation/test-audit/review loop

agent-pr:
  branch/worktree/PR wrapper around dev-loop
```

Typical usage:

```text
user asks to analyze/research/explore
  -> research-swarm gathers useful evidence
  -> coordinator summarizes
  -> user chooses next action:
       save report
       continue research
       start decision discussion / grilling if available
       create spec/tickets
       start dev-loop
       start agent-pr
       do nothing
```

Grilling is not a hard dependency. If a grilling/decision skill exists, the coordinator may offer it; otherwise it can ask decision questions manually.

## Non-goals

- No file edits.
- No implementation.
- No automatic spec/ticket/PR creation unless user chooses it.
- No infinite research.
- No unsupported claims without evidence.
- No dumping child transcripts into the main context.

## Command input

`/research-swarm <prompt>` accepts a normal prompt, for example:

```text
/research-swarm analyze how auth works in this repo
/research-swarm compare package candidates for subagents
/research-swarm research best way to debug localStorage issues in our SPA
```

The coordinator turns the prompt into a short Research Brief before spawning children.

## Research Brief

Required sections:

```md
## Question

## Scope

repo | web | repo+web | inferred

## Known Constraints

## Desired Output

## Source Policy

## Open Ambiguities
```

If source scope is ambiguous and matters, coordinator asks or chooses conservative repo-first behavior according to config.

## Source scope policy

Default configurable policy: prompt-driven/inferred.

```text
codebase analysis -> repo only
package/API/comparison research -> web or repo+web
implementation research for this repo -> repo+web
ambiguous -> ask or conservative repo-first
```

Default config:

```json
{
	"sourceScopePolicy": "prompt-driven-ask-if-ambiguous"
}
```

## Web access policy

Default configurable policy: no web unless an approved web/search tool is installed and enabled.

If web access is enabled:

- read-only research children may use approved web/search tools directly
- children must cite URLs
- external network use should match the prompt's implied scope

Default config:

```json
{
	"webAccessPolicy": "enabled-tools-only"
}
```

## Fan-out planning

The coordinator decides how many child agents to spawn.

Default configurable bounds:

```json
{
	"minAgents": 1,
	"maxAgents": 5
}
```

Heuristic:

```text
small focused question -> 1-2 agents
medium codebase/topic exploration -> 3 agents
package comparison / broad research -> 4-5 agents
```

Each child gets a narrow shard assignment and must return only useful facts/evidence, not full exploration logs.

## Waves

Research may run in multiple waves.

Default configurable bound:

```json
{
	"maxWaves": 2
}
```

Wave pattern:

```text
wave 1:
  broad parallel exploration

coordinator identifies gaps/conflicts:
  wave 2:
    targeted follow-up agents
```

No endless research. If important gaps remain after max waves, report them under `Risks / Unknowns`.

## Child role: explorer

Children are read-only explorers.

Allowed:

- read/search repo files according to source policy
- run read-only commands if needed, such as `git grep`, `rg`, `find`, `git log`, package metadata inspection
- use approved web/search/fetch tools if web access is enabled and relevant

Forbidden:

- edit/write files
- run destructive commands
- install dependencies
- change branches/worktrees
- create issues/PRs
- make unsupported claims

## Explorer output format

Default: Markdown with required headings and structured findings.

```md
## Shard

<brief description of assignment>

## Summary

<compact answer for this shard>

## Findings

### Finding: <short title>

- Claim:
- Evidence:
  - Source: <path/url>
  - Quote/snippet: <exact relevant quote or concise code snippet>
- Confidence: high | medium | low
- Relevance:

## Gaps / Unknowns

- ...

## Suggested Follow-up

- ...
```

Evidence is mandatory for factual claims. If a child is unsure, it must say so.

## Coordinator synthesis output

Default configurable output style: decision-ready summary.

```md
## Answer / Summary

## Key Evidence

## Tradeoffs / Options

## Risks / Unknowns

## Recommended Next Actions

- save report
- continue research
- start decision discussion / grilling if available
- create spec/tickets
- start dev-loop
- start agent-pr
- do nothing
```

Only show relevant next actions. For example, do not suggest `dev-loop` if the result is not implementation-ready.

## Save behavior

Default configurable policy: ask after showing result.

```json
{
	"savePolicy": "ask-after-result"
}
```

If user chooses to save, suggested path:

```text
.pi/research-swarm/reports/<timestamp>-<slug>.md
```

If user provides a path in the prompt, use that path after confirming if it would overwrite an existing file.

## Follow-up behavior

After completion, the coordinator may offer relevant actions:

Always relevant:

- save report
- continue research
- do nothing

If unresolved tradeoffs/decisions exist:

- start decision discussion
- use grilling skill if available

If implementation-ready:

- create spec/tickets
- start `dev-loop`
- start `agent-pr`

No follow-up action runs automatically unless user chooses it.

## Defaults

```json
{
	"sourceScopePolicy": "prompt-driven-ask-if-ambiguous",
	"webAccessPolicy": "enabled-tools-only",
	"minAgents": 1,
	"maxAgents": 5,
	"maxWaves": 2,
	"childMode": "read-only",
	"evidenceFormat": "structured-findings",
	"coordinatorOutput": "decision-ready-summary",
	"savePolicy": "ask-after-result",
	"followUpPolicy": "offer-relevant-options",
	"rolePermissionEnforcement": "prompt-v1-enforce-later"
}
```

## Implementation notes

This workflow should be implemented only after choosing a subagent substrate.

Candidates to compare:

- Pi official `examples/extensions/subagent/`
- `@arhen/pi-core-subagent`
- `@tintinweb/pi-subagents`
- `amosblomqvist/pi-interactive-subagents`

`@arhen/pi-core-subagent` may fit well because research-swarm is naturally a graph/DAG fan-out/reduce workflow.

## Implementation plan

1. Choose subagent substrate.
2. Implement `/research-swarm` command.
3. Coordinator creates Research Brief.
4. Coordinator creates shard plan automatically within configured bounds.
5. Spawn read-only explorers in parallel.
6. Synthesize reports.
7. Optionally run one follow-up wave for gaps/conflicts.
8. Return decision-ready summary.
9. Offer relevant follow-up actions.
