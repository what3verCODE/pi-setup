#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PI_HOME="${PI_HOME:-$HOME/.pi/agent}"
BACKUP_DIR="$PI_HOME/backups/pi-setup-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$PI_HOME" "$PI_HOME/extensions" "$PI_HOME/skills" "$PI_HOME/agents" "$PI_HOME/npm" "$PI_HOME/packages"

backup_if_exists() {
  local path="$1"
  if [ -e "$path" ] || [ -L "$path" ]; then
    mkdir -p "$BACKUP_DIR/$(dirname "${path#$PI_HOME/}")"
    cp -a "$path" "$BACKUP_DIR/${path#$PI_HOME/}"
  fi
}

sync_dir() {
  local src="$1"
  local dest="$2"
  mkdir -p "$dest"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "$src/" "$dest/"
  else
    find "$dest" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    cp -a "$src/." "$dest/"
  fi
}

sync_packages() {
  local src="$1"
  local dest="$2"
  mkdir -p "$dest"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete --exclude node_modules --exclude .turbo --exclude .cache "$src/" "$dest/"
  else
    find "$dest" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    (cd "$src" && find . -path '*/node_modules' -prune -o -type d -exec mkdir -p "$dest/{}" \; -o -type f -exec cp -p "{}" "$dest/{}" \;)
  fi
}

echo "Applying Pi setup from $ROOT"
echo "Target: $PI_HOME"

if command -v pnpm >/dev/null 2>&1; then
  echo "Installing/building local workspace packages..."
  (cd "$ROOT" && pnpm install --frozen-lockfile && pnpm build)
else
  echo "pnpm not found; local package build skipped. Install pnpm with proto before using local Pi packages."
fi

backup_if_exists "$PI_HOME/settings.json"
backup_if_exists "$PI_HOME/extensions"
backup_if_exists "$PI_HOME/skills"
backup_if_exists "$PI_HOME/agents"
backup_if_exists "$PI_HOME/npm/package.json"
backup_if_exists "$PI_HOME/packages"

sync_dir "$ROOT/pi/extensions" "$PI_HOME/extensions"
sync_dir "$ROOT/pi/skills" "$PI_HOME/skills"
sync_dir "$ROOT/pi/agents" "$PI_HOME/agents"
sync_packages "$ROOT/packages" "$PI_HOME/packages"
cp "$ROOT/package.json" "$PI_HOME/package.json"
cp "$ROOT/pnpm-workspace.yaml" "$PI_HOME/pnpm-workspace.yaml"
if [ -f "$ROOT/pnpm-lock.yaml" ]; then
  cp "$ROOT/pnpm-lock.yaml" "$PI_HOME/pnpm-lock.yaml"
fi
cp "$ROOT/pi/npm/package.json" "$PI_HOME/npm/package.json"

node - "$ROOT/pi/settings.json" "$PI_HOME/settings.json" <<'NODE'
const fs = require('node:fs');
const [srcPath, destPath] = process.argv.slice(2);
const managed = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
let existing = {};
if (fs.existsSync(destPath)) {
  existing = JSON.parse(fs.readFileSync(destPath, 'utf8'));
}
// Preserve unknown/local keys but let this repo own the keys it declares.
const next = { ...existing, ...managed };
fs.writeFileSync(destPath, JSON.stringify(next, null, 2) + '\n');
NODE

if command -v npm >/dev/null 2>&1; then
  echo "Installing Pi npm package dependencies..."
  (cd "$PI_HOME/npm" && npm install --omit=dev)
else
  echo "npm not found; skipped package install"
fi

if command -v pnpm >/dev/null 2>&1; then
  echo "Linking copied local workspace packages..."
  (cd "$PI_HOME" && pnpm install --prod --no-frozen-lockfile --config.auto-install-peers=false)
fi

if [ -d "$BACKUP_DIR" ]; then
  echo "Backup written to: $BACKUP_DIR"
fi

echo "Done. Restart Pi or run /reload."
