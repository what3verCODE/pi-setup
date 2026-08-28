# pi-setup

Personal, reproducible Pi agent setup.

This repo is intentionally small and conservative:

- keep only personally tested/favorite skills here
- keep extensions focused on tools/mechanics, not style opinions
- avoid auto-installing broad skill packs or workflow packages
- never commit secrets (`auth.json`, API keys, sessions, local caches)

## Layout

```text
pi-setup/
├── packages/                # pnpm workspace packages
│   ├── common/              # @what3vercode/pi-common shared helper library
│   └── dev-loop/            # @what3vercode/dev-loop Pi extension package
├── pi/
│   ├── extensions/          # copied/synced to ~/.pi/agent/extensions
│   ├── skills/              # copied/synced to ~/.pi/agent/skills
│   ├── agents/              # managed pi-subagents role definitions
│   ├── npm/package.json     # Pi package dependencies
│   └── settings.json        # managed non-secret Pi settings
├── scripts/
│   └── bootstrap.sh         # apply setup to this machine
└── skills.manifest          # external skill repos to install later
```

## Apply on a machine

```bash
cd ~/projects/pi-setup
./scripts/bootstrap.sh
```

To apply only the selected `pi-subagents` roles + Gotgenes permission config, mirroring `pi/agents/` into your Pi agent dir:

```bash
./scripts/apply-subagent-roles.sh
```

Then restart Pi or run `/reload`.

## Adding skills later

When you provide trusted skill repos, record them in `skills.manifest` first. Do not add automatic installers until the exact source and scope are reviewed.

For now, this repo contains local policy skills/placeholders, Pi settings, and small personal Pi packages.

## Develop packages

```bash
pnpm install
pnpm check
```

Bootstrap mirrors `packages/` to `~/.pi/agent/packages/`, and `pi/settings.json` loads `./packages/dev-loop` as a local Pi package.

## Not managed here

Do not commit:

- `~/.pi/agent/auth.json`
- `~/.pi/agent/sessions/`
- `~/.pi/agent/models-store.json`
- workflow sqlite state
- machine-specific binaries/caches
