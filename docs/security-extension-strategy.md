# Security extension strategy

This document records the intended security-extension direction for this Pi setup.

The goal is to support more autonomous workflows (`research-swarm`, `dev-loop`, `agent-pr`) without stacking noisy or conflicting permission systems.

## Candidates

### `@gotgenes/pi-permission-system`

Full policy system for Pi.

Potential responsibilities:

- protected paths
- external directory guard
- bash allow/ask/deny
- tool-level permissions
- MCP/skill gates
- session approvals
- subagent prompt forwarding

### `bash-guard/` from `amosblomqvist/pi-config`

Focused bash guard.

Potential responsibilities:

- prompt for risky bash in main session
- hard-block catastrophic bash in subagents
- use `PI_SUBAGENT_DEPTH` to distinguish main session vs subagent

Limitation: guards `bash` only, not `write`/`edit` or other extension tools.

### Pi official examples

Relevant examples:

- `permission-gate.ts`
- `protected-paths.ts`
- `dirty-repo-guard.ts`

Good as reference implementations or lightweight fallbacks.

## Combination options

### Option A: Full permission system only

Use:

```text
@gotgenes/pi-permission-system
```

Skip:

```text
bash-guard
permission-gate
protected-paths
```

#### Pros

- One policy source of truth.
- Covers more than bash.
- Better fit for subagents/workflows.
- Less duplicate prompting.
- Can protect paths across multiple tool surfaces.

#### Cons

- More complex.
- Needs careful config review.
- Larger source audit.

#### Verdict

Best long-term choice if the source/config model is trusted.

### Option B: Lightweight guard only

Use:

```text
amos bash-guard
```

Possibly plus:

```text
Pi official protected-paths.ts
```

#### Pros

- Small and understandable.
- Easy to fork/adapt.
- Good design idea: main session asks; subagents hard-block.

#### Cons

- `bash-guard` only handles bash.
- File writes/edits need a separate guard.
- Harder to maintain one consistent policy.

#### Verdict

Good fallback if `@gotgenes/pi-permission-system` is too heavy or noisy.

### Option C: Hybrid, but not double-prompting

Use:

```text
@gotgenes/pi-permission-system
```

Then copy/adapt only selected ideas from `bash-guard`, especially:

```text
subagent-specific hard-block policy
```

Avoid running both full prompt layers globally.

#### Pros

- Full policy coverage from permission system.
- Keeps useful subagent-specific hard-stop behavior.
- Allows custom workflow role enforcement.

#### Cons

- Requires careful integration.
- Easy to accidentally duplicate checks/prompts.

#### Verdict

Best custom direction if we need more than stock `@gotgenes/pi-permission-system`.

## Recommended direction

Aim for:

```text
1. @gotgenes/pi-permission-system
   global security policy

2. custom dev-workflow guard
   workflow-specific role enforcement

3. no separate bash-guard unless gotgenes fails review
```

Meaning:

```text
general safety = permission system
workflow role safety = custom extension
```

Do not install multiple global prompt-based guards as-is.

## Custom workflow guard responsibilities

The custom guard should care only about workflow-specific constraints.

### `research-swarm`

Explorer agents:

- read/search only
- no edits
- no destructive bash
- web only if approved web tool is enabled and source policy allows it

### `dev-loop`

Implementer:

- may edit code/tests
- may run targeted verification
- still subject to global permission policy

Test auditor:

- read/search allowed
- may run tests/checks
- no `write`/`edit`
- no source modifications

Reviewer:

- read/search allowed
- read-only bash allowed
- no `write`/`edit`
- no source modifications

### `agent-pr`

Before publish phase:

- no push
- no PR creation
- no automerge

Publish phase only:

- allow `git push origin <branch>`
- allow `gh pr create --draft`
- allow one summary `gh pr comment`

Always forbid:

- automerge
- force push unless explicitly requested and approved
- deleting remote branches unless explicitly requested and approved

## Design rules for custom security code

### 1. Avoid duplicate policy layers

Bad:

```text
permission-system asks
bash-guard asks
custom guard asks
```

Good:

```text
one global permission decision layer
one workflow-specific role enforcement layer
```

### 2. Fail closed

If parser, config, or state lookup fails:

```text
block, do not allow
```

Especially for:

- bash
- writes
- external paths
- secrets
- subagents
- publish operations

### 3. Protect paths across all relevant tools

Do not only guard `bash`.

Consider:

- `read`
- `write`
- `edit`
- bash redirection
- MCP tools
- extension tools
- subagent tools

Protected defaults to consider:

```text
.env*
~/.ssh/*
~/.gnupg/*
*.pem
*.key
.git/
node_modules/
dist/
build/
coverage/
```

Some paths should be read-blocked; others only write-blocked.

### 4. Enforce role-aware permissions

Workflow role matters.

Default role permissions:

```text
research-swarm explorer:
  read/search only

dev-loop implementer:
  read/search/bash/edit/write allowed with normal safety

dev-loop test-auditor:
  read/search/bash test commands allowed
  no edit/write

dev-loop reviewer:
  read/search/read-only bash allowed
  no edit/write

agent-pr coordinator:
  publish commands allowed only in publish phase
```

### 5. Treat git specially

Usually ask or block:

```text
git push
git push --force
git reset --hard
git clean -fd
git checkout .
git rm
git commit
git rebase
git merge
```

Usually allow:

```text
git status
git diff
git log
git show
git branch --show-current
```

For `/agent-pr`, allow only during explicit publish phase:

```text
git checkout -b <branch>
git push origin <branch>
gh pr create --draft
gh pr comment
```

No automerge.

### 6. Subagents should be stricter than main session

Main session can ask the user.

Subagents should usually hard-deny or forward asks to the coordinator/user.

Default principle:

```text
main session:
  ask for risky commands

subagents:
  hard-deny catastrophic commands
  or forward ask to coordinator/user
```

### 7. Keep approvals scoped

Approvals should be scoped to:

- session
- role
- cwd
- tool
- pattern
- workflow phase

Avoid accidental global approvals.

Bad:

```text
allow all git
```

Better:

```text
allow `git status` in this session
allow `pnpm test` in this repo
allow `gh pr create --draft` only during agent-pr publish phase
```

### 8. Log decisions

Autonomous workflows need an audit trail.

Log at least:

- timestamp
- workflow
- phase
- role
- tool
- input preview
- matched rule
- decision
- reason

This helps diagnose unsafe or blocked behavior.

## Source review checklist

Before adopting or forking a security extension, review:

### Architecture

- extension entrypoint
- registered tools/commands
- event hooks used
- config loading
- state persistence
- subagent integration model

### Security

- fail-open vs fail-closed behavior
- path canonicalization / symlink handling
- bash parsing and indirection handling
- secret redaction in logs/prompts
- external directory behavior
- subagent behavior
- approval scope

### DX

- prompt frequency
- session approvals
- clear decision messages
- ability to configure noisy rules
- behavior in non-UI/headless contexts

### Maintainability

- dependency size
- tests
- TypeScript quality
- Pi API compatibility
- package update cadence
- config schema clarity

## Fork guidance

### Prefer configure/adopt

Prefer configuring upstream if the package is good.

Especially for:

```text
@gotgenes/pi-permission-system
```

Forking a security system means owning security bugs forever.

### Prefer copy/adapt only for small focused code

Good candidates for copy/adapt:

```text
bash-guard ideas
Pi official permission-gate/protected-paths examples
small workflow role guard
```

### Avoid early forks of large systems

Avoid forking early:

```text
pi-lens
pi-web-access
pi-mcp-adapter
pi-fabric
memory packages
```

Either use as-is after review or skip.

## Next steps

1. Source-review `@gotgenes/pi-permission-system`.
2. Source-review `amos bash-guard`.
3. Decide:
   - full permission system
   - lightweight guard
   - hybrid with custom workflow role guard
4. Add chosen config/spec to `pi-setup`.
5. Only then implement autonomous workflow extensions.
