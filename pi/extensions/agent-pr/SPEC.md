# agent-pr extension spec

## Goal

Provide an `/agent-pr <prompt>` workflow for autonomous development tasks that should produce a branch and draft PR for human review.

This workflow is for cases where the user cannot watch every implementation loop in real time, especially parallel or delegated tasks.

`agent-pr` is a wrapper around `dev-loop`:

```text
agent-pr
  -> choose work location
  -> create/enter branch or worktree
  -> run dev-loop inner engine
  -> on success: push branch + open draft PR + comment summary
  -> on failure: preserve local state + report blocker
```

No automerge.

## Relationship to dev-loop

`dev-loop` remains the inner implementation engine:

```text
prompt -> Work Brief -> implementer -> test-auditor -> reviewer -> repeat on P0/P1
```

`agent-pr` owns only outer lifecycle concerns:

- branch/worktree/current-branch selection
- remote branch naming
- PR creation
- PR body/comment publishing
- failure publication policy
- cleanup/preservation decisions

## Non-goals

- No automatic merge.
- No hidden branch/worktree decisions.
- No publishing failed partial work by default.
- No batch/parallel orchestration in v1.
- No replacement for direct interactive `dev-loop` usage.

## Command input

`/agent-pr <prompt>` accepts a normal prompt. The prompt should state the desired work location when it matters.

Supported location intents:

```text
use worktree
new branch here
continue current branch
```

If the prompt does not clearly specify location and the choice matters, the coordinator asks before starting.

## Work location policy

Default: prompt-driven.

```text
If prompt says "use worktree":
  create separate git worktree with new branch

If prompt says "new branch here":
  checkout a new branch in the current repo

If prompt says "continue current branch":
  run in current branch

If ambiguous:
  ask user
```

Possible future configurable defaults:

```json
{
	"defaultLocation": "ask",
	"worktreeRoot": "../.pi-worktrees",
	"branchPrefix": "agent/"
}
```

## Success behavior

Default on successful inner `dev-loop` completion:

1. Push branch.
2. Open a draft PR.
3. Add a summary comment.
4. Return PR URL and final report.

Draft PR is the default because agent-produced work requires human review.

If the prompt explicitly says branch only, no push, no PR, or ready PR, obey the prompt.

## Failure behavior

Default configurable policy: preserve local state only.

If inner `dev-loop` fails, hits max cycles, or reports a blocker:

- keep branch/worktree
- save blocker report/artifacts according to `dev-loop` artifact policy
- do not push/open PR by default
- return path/branch and blocker summary

User may explicitly ask to push/open a blocked draft PR.

Future default config:

```json
{
	"failurePublishPolicy": "local-only"
}
```

## PR body

Default draft PR body should include:

```md
## Goal

## Summary

## Verification

## Review Status

## Risk Notes

## Remaining P2/P3 Notes
```

## PR comments

Default configurable policy: one summary comment.

After opening the draft PR, add one comment containing the `dev-loop` final report:

```md
## dev-loop report

Changed:

- ...

Verified:

- ...

Review:

- no P0/P1
- P2/P3 notes, if any

Artifacts:

- ...
```

Avoid inline comments in v1; they are likely to be noisy.

Future config:

```json
{
	"prCommentPolicy": "summary-comment"
}
```

## Dirty tree handling

Dirty tree behavior depends on location:

### Worktree mode

Current repo may be dirty. The new worktree starts from selected base branch/commit.

Ask if base branch is unclear.

### New branch in current repo

If current tree is dirty, ask before starting. User must choose whether existing changes belong to the agent branch.

### Continue current branch

Dirty tree is expected. Inner `dev-loop` still applies its checkpoint policy before implementer runs.

## Branch naming

V1 can ask or derive a short branch name from the Work Brief.

Recommended default:

```text
agent/<slug>
```

If branch exists, append numeric suffix.

## Batch/parallel mode

Future only. Do not implement in v1.

Possible command:

```text
/agent-pr-batch tasks.md
```

Each task would get:

- own branch/worktree
- own inner `dev-loop`
- own draft PR on success
- no automerge

Batch mode requires additional design for:

- task file format
- concurrency limits
- branch naming collisions
- worktree cleanup
- shared dependency/cache conflicts
- GitHub rate limits
- reporting dashboard

## Defaults

```json
{
	"locationPolicy": "prompt-driven-ask-if-ambiguous",
	"successPublishPolicy": "push-and-draft-pr",
	"failurePublishPolicy": "local-only",
	"prCommentPolicy": "summary-comment",
	"inlineComments": false,
	"automerge": false,
	"batchMode": "future"
}
```

## Implementation plan

1. Implement and stabilize `dev-loop` first.
2. Add `/agent-pr` wrapper command.
3. Support prompt-driven work location selection.
4. Run inner `dev-loop` in selected branch/worktree/current branch.
5. On success, push branch and create draft PR using `gh`.
6. Add one summary comment.
7. On failure, preserve local state and report blocker.
8. Add batch mode only after single-task workflow is reliable.
