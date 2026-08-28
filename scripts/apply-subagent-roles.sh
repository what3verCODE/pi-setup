#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PI_HOME="${PI_CODING_AGENT_DIR:-${PI_HOME:-$HOME/.pi/agent}}"
BACKUP_DIR="$PI_HOME/backups/subagent-roles-$(date +%Y%m%d-%H%M%S)"
INSTALL_PACKAGES=1
REMOVE_ONLY=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --no-install-packages) INSTALL_PACKAGES=0 ;;
    --remove-only) REMOVE_ONLY=1 ;;
    -h|--help)
      cat <<'EOF'
Usage: scripts/apply-subagent-roles.sh [--no-install-packages] [--remove-only]

Installs/records the chosen baseline packages, backs up the current user roles,
disables pi-subagents builtins, replaces ~/.pi/agent/agents with this repo's
pi/agents folder, installs the Gotgenes permission config, and merges managed
Pi settings.

Add/remove role files under pi/agents/; this script mirrors that folder, so it
does not need edits when roles change.

Environment:
  PI_CODING_AGENT_DIR or PI_HOME  Target Pi agent dir. Defaults to ~/.pi/agent.
EOF
      exit 0
      ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
  shift
done

PACKAGE_SPECS=(
  "npm:pi-subagents@0.58.0"
  "npm:@gotgenes/pi-permission-system@27.1.1"
  "./packages/dev-loop"
)

mkdir -p "$PI_HOME" "$PI_HOME/agents" "$PI_HOME/extensions/pi-permission-system" "$PI_HOME/packages"

backup_path() {
  local path="$1"
  if [ -e "$path" ] || [ -L "$path" ]; then
    mkdir -p "$BACKUP_DIR/$(dirname "${path#$PI_HOME/}")"
    cp -a "$path" "$BACKUP_DIR/${path#$PI_HOME/}"
  fi
}

copy_file() {
  local src="$1"
  local dest="$2"
  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"
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

echo "Applying subagent baseline from $ROOT"
echo "Target Pi dir: $PI_HOME"

if command -v pnpm >/dev/null 2>&1; then
  echo "Installing/building local workspace packages..."
  (cd "$ROOT" && pnpm install --frozen-lockfile && pnpm build)
else
  echo "pnpm not found; local package build skipped. Install pnpm with proto before using local Pi packages."
fi

backup_path "$PI_HOME/settings.json"
backup_path "$PI_HOME/extensions/pi-permission-system/config.json"
backup_path "$PI_HOME/agents"
backup_path "$PI_HOME/packages"

if [ "$INSTALL_PACKAGES" -eq 1 ] && command -v pi >/dev/null 2>&1; then
  echo "Installing selected Pi packages..."
  for spec in "${PACKAGE_SPECS[@]}"; do
    pi install "$spec"
  done
elif [ "$INSTALL_PACKAGES" -eq 1 ]; then
  echo "pi command not found; package specs will still be merged into settings.json"
fi

# Merge this repo's managed settings. Unknown local settings are preserved, but
# this repo owns subagents.disableBuiltins and the package list it declares.
node - "$ROOT/pi/settings.json" "$PI_HOME/settings.json" <<'NODE'
const fs = require('node:fs');
const [srcPath, destPath] = process.argv.slice(2);
const managed = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
let existing = {};
if (fs.existsSync(destPath)) existing = JSON.parse(fs.readFileSync(destPath, 'utf8'));
function merge(a, b) {
  if (Array.isArray(a) || Array.isArray(b)) return b;
  if (!a || typeof a !== 'object' || !b || typeof b !== 'object') return b;
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = merge(out[k], v);
  return out;
}
const next = merge(existing, managed);
fs.writeFileSync(destPath, JSON.stringify(next, null, 2) + '\n');
NODE

copy_file "$ROOT/pi/extensions/pi-permission-system/config.json" \
  "$PI_HOME/extensions/pi-permission-system/config.json"
sync_packages "$ROOT/packages" "$PI_HOME/packages"
copy_file "$ROOT/package.json" "$PI_HOME/package.json"
copy_file "$ROOT/pnpm-workspace.yaml" "$PI_HOME/pnpm-workspace.yaml"
if [ -f "$ROOT/pnpm-lock.yaml" ]; then
  copy_file "$ROOT/pnpm-lock.yaml" "$PI_HOME/pnpm-lock.yaml"
fi

if command -v pnpm >/dev/null 2>&1; then
  echo "Linking copied local workspace packages..."
  (cd "$PI_HOME" && pnpm install --prod --no-frozen-lockfile --config.auto-install-peers=false)
fi

if [ "$REMOVE_ONLY" -eq 0 ]; then
  echo "Mirroring managed subagent roles from pi/agents/ ..."
  sync_dir "$ROOT/pi/agents" "$PI_HOME/agents"
else
  echo "Removing all user subagent role files from $PI_HOME/agents ..."
  find "$PI_HOME/agents" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
fi

if [ -d "$BACKUP_DIR" ]; then
  echo "Backup written to: $BACKUP_DIR"
fi

echo "Done. Restart Pi or run /reload. In Pi, verify with: subagent({ action: \"list\" })"
