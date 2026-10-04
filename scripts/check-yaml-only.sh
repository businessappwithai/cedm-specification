#!/usr/bin/env bash
# The model is YAML, and nothing in this repository reads, writes, documents or
# ships the earlier diagram notation. This is the gate that keeps it that way.
#
#   scripts/check-yaml-only.sh          every tracked file in the repository
#   scripts/check-yaml-only.sh <dir>    every file under <dir> — a generated
#                                        application, for the generator's tests
#
# Exits 0 when nothing matches and 1 with each match listed otherwise.
#
# Four things are exempt, each for a reason that does not change by editing a
# file here:
#   - this script, which has to name what it looks for;
#   - scripts/sites/patch-vendored-generators.ts, which rewrites the browser
#     generator the published sites vendor from app-with-ai-tanstack. Its
#     search strings are that upstream bundle's own text, so it cannot do its
#     job without quoting it; what it writes passes this gate;
#   - third-party lockfiles, where the library appears as a transitive
#     dependency (@copilotkit/react-core -> streamdown) that no code imports;
#   - graphify-out/ and .understand-anything/, code-graph snapshots of another
#     repository taken on a developer's machine, kept as they were recorded.
set -euo pipefail

readonly PATTERN='mermaid|\.mmd\b|erDiagram|stateDiagram|^\s*(flowchart|graph)\s+(TD|TB|BT|LR|RL)\b|%%\s*(meta|entity|field|enum|index|category|rbac|hook|rule|guard|trigger|report|workflow|step|action|loop)\b'
readonly FILE_PATTERN='\.(mmd|mermaid)$'

if [[ $# -gt 0 ]]; then
  root="$1"
  [[ -d "$root" ]] || { echo "check-yaml-only: $root is not a directory" >&2; exit 2; }
  found=$(grep -rnIiE "$PATTERN" "$root" \
    --exclude='*.lock' --exclude='bun.lockb' --exclude='package-lock.json' \
    --exclude-dir=node_modules --exclude-dir=target || true)
  named=$(find "$root" -path '*/node_modules' -prune -o -path '*/target' -prune -o -type f -print \
    | grep -iE "$FILE_PATTERN" || true)
else
  cd "$(dirname "$0")/.."
  readonly EXEMPT=(
    ':!scripts/check-yaml-only.sh'
    ':!app-with-ai-rust/scripts/check-yaml-only.sh'
    ':!scripts/sites/patch-vendored-generators.ts'
    ':!app-with-ai-rust/scripts/sites/patch-vendored-generators.ts'
    ':!*bun.lock' ':!*pnpm-lock.yaml' ':!*package-lock.json'
    ':!graphify-out' ':!.understand-anything'
    ':!app-with-ai-rust/graphify-out' ':!app-with-ai-rust/.understand-anything'
  )
  found=$(git grep -nIiE "$PATTERN" -- . "${EXEMPT[@]}" || true)
  named=$(git ls-files | grep -iE "$FILE_PATTERN" || true)
fi

if [[ -n "$found" || -n "$named" ]]; then
  [[ -n "$found" ]] && printf '%s\n' "$found"
  [[ -n "$named" ]] && printf 'file: %s\n' $named
  echo "check-yaml-only: $( (printf '%s\n' "$found" "$named" | grep -c .) ) match(es)" >&2
  exit 1
fi
echo "check-yaml-only: no traces"
