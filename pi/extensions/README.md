# Extensions

Put trusted global Pi extensions here.

Bootstrap syncs this directory to:

```text
~/.pi/agent/extensions/
```

Larger extensions should live as local Pi packages under `packages/` with their own `package.json` and `tsconfig.json`. Bootstrap mirrors those to `~/.pi/agent/packages/` and `pi/settings.json` loads them via local package paths.

Recommended additions later:

- protected paths
- permission gate
- git checkpoint
- plan mode
- handoff
- subagents
- custom repo test runner
- GitHub PR/issue helper

Keep style/opinion in skills, not extensions.
