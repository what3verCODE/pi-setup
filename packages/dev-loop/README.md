# @what3vercode/dev-loop

Personal Pi package for `/dev-loop`.

It registers:

- `/dev-loop <prompt>` command
- `/dev-loop-status` command
- `start_dev_loop` LLM-callable tool

The command starts an async `pi-subagents` workflow using existing configured agents:

```text
brief -> worker -> tester -> reviewer -> fixes ... -> final sanity
```

## Requirements

Install and load `pi-subagents` separately:

```bash
pi install npm:pi-subagents@0.58.0
pi install npm:@what3vercode/dev-loop
```

The package expects agents named `oracle`, `worker`, `tester`, and `reviewer` by default. You can remap those names.

## Commands

```text
/dev-loop <task>
/dev-loop --cycles 2 <task>
/dev-loop --worker my-writer --tester my-tester --reviewer my-reviewer <task>
/dev-loop-status
```

## Configuration

Configuration is optional. Defaults are:

```json
{
	"$schema": "https://raw.githubusercontent.com/what3verCODE/pi-setup/main/packages/dev-loop/schemas/config.schema.json",
	"maxCycles": 3,
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

Config files are read in this order; later files override earlier files:

1. Managed extension config: `~/.pi/agent/extensions/dev-loop/config.json`
2. Global user config: `~/.pi/agent/dev-loop/config.json`
3. Project: nearest `.pi/dev-loop.json` from the current working directory upward

Example project config:

```json
{
	"$schema": "https://raw.githubusercontent.com/what3verCODE/pi-setup/main/packages/dev-loop/schemas/config.schema.json",
	"maxCycles": 2,
	"agents": {
		"briefer": "oracle",
		"worker": "worker",
		"tester": "tester",
		"reviewer": "reviewer",
		"sanity": "reviewer"
	},
	"rolePrompts": {
		"worker": "./dev-loop/worker.md",
		"tester": "./dev-loop/tester.md",
		"reviewer": "./dev-loop/reviewer.md"
	}
}
```

Relative `rolePrompts` paths resolve relative to the config file that declares them.

## Role prompts

This package has built-in default role prompt snippets. They are not global agent definitions and do not replace user agents. They are prepended to the task sent during `/dev-loop` only.

Override `rolePrompts` if you want your own worker/tester/reviewer instructions while keeping the same workflow mechanics.
