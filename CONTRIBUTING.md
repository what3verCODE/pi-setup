# Contributing

This repo is a personal Pi setup, so changes should stay small, trusted, and easy to test locally before anything is published or applied globally.

## Local development

From the repo root:

```bash
pnpm install
pnpm check
```

For package-specific work, use the package scripts where possible. For example:

```bash
pnpm build
pnpm --filter @what3vercode/dev-loop check
```

## Testing Pi packages locally

Before publishing or installing permanently, test packages/extensions with Pi locally.

See the full guide: [Local testing before publishing Pi packages](docs/local-testing-before-publishing.md).

Quick smoke test for the dev-loop package:

```bash
cd packages/dev-loop
pnpm debug:print
```

Interactive test:

```bash
cd packages/dev-loop
pnpm debug:pi
```

## Pre-publish checklist

Before publishing a package:

```bash
pnpm check
cd packages/dev-loop
pnpm pack --dry-run
```

Verify the package version, packed files, runtime dependencies, and a fresh local Pi load before publishing.
