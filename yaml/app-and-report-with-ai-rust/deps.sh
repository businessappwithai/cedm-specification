#!/usr/bin/env bash
#
# Check that the two product repositories this one orchestrates are where
# deps.json says — beside this repository — and install the one it reads.
#
#   ./deps.sh              check both are present
#   ./deps.sh --install    also `bun install --frozen-lockfile` where deps.json asks
#   ./deps.sh --status     say where each is, and whether it is installed
#
# Inside cedm-specification the repositories are copies side by side, recorded
# in COPIES.yaml at its root, so there is nothing to clone or update here.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

command -v bun >/dev/null 2>&1 || {
  echo "bun is not installed. deps.json is read with bun, as is everything else here." >&2
  exit 1
}

mode="${1:-}"
case "$mode" in
  ""|--install|--status) ;;
  *) echo "usage: ./deps.sh [--install|--status]" >&2; exit 2 ;;
esac

status=0
while IFS=$'\t' read -r name path install; do
  if [[ ! -d "$path" ]]; then
    echo "✗ ${name}: not found at ${path}" >&2
    status=1
    continue
  fi
  installed="no node_modules"
  [[ -d "$path/node_modules" ]] && installed="installed"
  if [[ "$mode" == "--install" && "$install" == "true" ]]; then
    (cd "$path" && bun install --frozen-lockfile)
    installed="installed"
  fi
  if [[ "$install" == "true" ]]; then
    echo "✓ ${name}: ${path} (${installed})"
  else
    echo "✓ ${name}: ${path}"
  fi
done < <(bun -e '
  const deps = (await Bun.file("deps.json").json()).dependencies;
  for (const d of deps) console.log([d.name, d.path, String(Boolean(d.install))].join("\t"));
')
exit "$status"
