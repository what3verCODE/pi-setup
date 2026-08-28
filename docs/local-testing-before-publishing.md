# Local testing before publishing Pi packages

Use this checklist when changing a local Pi package or extension and you want to run Pi with it before publishing to npm or adding it permanently to your main setup.

This repo's main local package is `packages/dev-loop`, loaded by `pi/settings.json` as `./packages/dev-loop` after `./scripts/bootstrap.sh` mirrors `packages/` into `~/.pi/agent/packages/`.

## 1. Run static checks first

From the repo root:

```bash
pnpm install
pnpm check
```

For a faster package-focused loop:

```bash
pnpm build
pnpm --filter @what3vercode/dev-loop check
```

## 2. Quick smoke test the package directly

Run Pi with a local package for the current process only using `-e` / `--extension`:

```bash
cd packages/dev-loop
pnpm debug:print
```

Equivalent explicit command:

```bash
cd packages/dev-loop
pnpm --filter @what3vercode/pi-common build
npx pi -e . -p "Say dev-loop package loaded and do not call tools."
```

For interactive testing:

```bash
cd packages/dev-loop
pnpm debug:pi
```

Then try the registered commands, for example:

```text
/dev-loop-status
/dev-loop --cycles 1 make a tiny harmless README edit, then stop
```

Notes:

- `pi -e .` loads the package from the current directory for that run only.
- This is the fastest way to test command/tool registration without editing your installed Pi settings.
- If the package depends on workspace packages, build those first (`pnpm build`) so runtime imports can resolve compiled outputs.

## 3. Test the full managed setup locally

To test exactly what this repo applies to your normal Pi config:

```bash
cd ~/projects/pi-setup
./scripts/bootstrap.sh
```

Then restart Pi or run:

```text
/reload
```

Check the startup header for loaded packages/extensions, then run:

```text
/dev-loop-status
```

This path catches problems that `pi -e .` can miss, such as broken mirrored paths, missing production dependencies, or settings mistakes in `pi/settings.json`.

## 4. Test in a disposable Pi config directory

Use this when you want to avoid touching `~/.pi/agent` while testing install/bootstrap behavior:

```bash
export TEST_PI_HOME="$(mktemp -d)"
PI_HOME="$TEST_PI_HOME" ./scripts/bootstrap.sh
PI_CODING_AGENT_DIR="$TEST_PI_HOME" pi --no-session
```

Inside that Pi session, run your commands and tools. When done:

```bash
rm -rf "$TEST_PI_HOME"
```

Important: `PI_HOME` is used by this repo's bootstrap script. `PI_CODING_AGENT_DIR` is the Pi runtime config-dir override.

## 5. Test package contents before publishing

From the package directory:

```bash
cd packages/dev-loop
pnpm pack --dry-run
```

Confirm the tarball includes only the intended runtime files, typically:

- `src/`
- `schemas/`
- `README.md`
- `package.json`

Also confirm runtime dependencies are publish-safe:

- Pi core packages imported by extensions should be `peerDependencies`.
- Packages needed at runtime must be in `dependencies`, not only `devDependencies`.
- Keep secrets, sessions, local caches, and generated test artifacts out of `files` and git.

## 6. Optional real install test

After packing, install the local tarball into a disposable Pi config directory:

```bash
cd packages/dev-loop
TARBALL="$(pnpm pack --pack-destination /tmp | tail -n 1)"
TEST_PI_HOME="$(mktemp -d)"
PI_CODING_AGENT_DIR="$TEST_PI_HOME" pi install "/tmp/$TARBALL"
PI_CODING_AGENT_DIR="$TEST_PI_HOME" pi --no-session
```

If the package needs other Pi packages, install those too:

```bash
PI_CODING_AGENT_DIR="$TEST_PI_HOME" pi install npm:pi-subagents@0.58.0
```

Clean up afterward:

```bash
rm -rf "$TEST_PI_HOME"
```

## 7. Final pre-publish checklist

Before publishing:

```bash
pnpm check
cd packages/dev-loop
pnpm pack --dry-run
```

Then verify:

- `package.json` has the intended version.
- `README.md` documents install, commands, and config.
- `peerDependencies` / `dependencies` are correct.
- A fresh `pi -e .` interactive session can load the extension.
- A disposable `PI_CODING_AGENT_DIR` install can load the packed package.
