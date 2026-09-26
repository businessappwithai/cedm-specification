#!/usr/bin/env bash
#
# Byte-parity between the two generators.
#
# `packages/generator` (TypeScript) emits a whole application; `crates/appwithai-gen`
# (Rust) emits the backend half of the same one. The Rust port exists to become the
# generator, and the only way to know it still is, is to generate both and compare.
# Anything less — a unit test per module, a spot check on one file — passes happily
# while a helper the Rust registry never registered renders as an empty string,
# because Handlebars strict mode is off in both engines.
#
# Only `backend/` is compared. The frontend and the bun:test suite are TypeScript's
# alone by design (cargo owns `backend/`, bun owns `frontend/` and `tests/`), and
# `model/model.eml.mmd` sits at the project root, outside the compared tree.
#
# The `Generated:` line carries a wall-clock timestamp and is the one difference
# that means nothing. Every other difference is a defect.
#
# Run over EVERY model in PARITY_MODELS, not just the first. Parity on a model that
# declares no `%%rbac` says nothing about the code that compiles `%%rbac`, so a
# feature landing without a corpus line exercising it is a feature this script
# cannot see.
set -euo pipefail

cd "$(dirname "$0")/.."

# The corpus. Grow this — and grow the models themselves — whenever a directive
# or a template branch lands that no existing model reaches.
PARITY_MODELS=(
  "examples/drug-discovery.eml.mmd"
  "language/examples/crm.eml.mmd"
  "language/examples/dance-studio.eml.mmd"
)

OUT_DIR="${PARITY_OUT_DIR:-$(mktemp -d)}"
KEEP="${PARITY_KEEP:-0}"
failures=0

# Lines whose difference is not a defect.
IGNORE=(-I '^//[/!] *Generated: ' -I '^-- Generated: ' -I '^# Generated: ')

cleanup() {
  [ "$KEEP" = "1" ] || rm -rf "$OUT_DIR"
}
trap cleanup EXIT

echo "==> Building the TypeScript generator"
bun --filter @appwithai/core build >/dev/null
bun --filter @appwithai/generator build >/dev/null

echo "==> Building the Rust generator"
cargo build -q -p appwithai-gen

for model in "${PARITY_MODELS[@]}"; do
  if [ ! -f "$model" ]; then
    echo "!! missing corpus model: $model" >&2
    failures=$((failures + 1))
    continue
  fi

  slug="$(basename "$model" | tr -c 'a-zA-Z0-9' '-')"
  ts="$OUT_DIR/$slug-ts"
  rs="$OUT_DIR/$slug-rs"
  rm -rf "$ts" "$rs"

  echo
  echo "==> $model"

  # --skip-cli-scaffold on both: `loco new` fetches over the network and its output
  # is identical either way, so scaffolding here would only make the check flaky.
  INIT_CWD="$PWD" bun --filter @appwithai/generator generate -- \
    --stack tanstack-astryx-loco -i "$model" -o "$ts" -n parity \
    --no-setup --force --skip-cli-scaffold >/dev/null

  cargo run -q -p appwithai-gen -- generate \
    -i "$model" -o "$rs" -n parity --skip-cli-scaffold --force >/dev/null

  if diff -r "${IGNORE[@]}" "$ts/backend" "$rs/backend"; then
    echo "   ok — backends are identical"
  else
    echo "!! PARITY BROKEN for $model" >&2
    failures=$((failures + 1))
  fi
done

echo
if [ "$failures" -ne 0 ]; then
  echo "FAILED: $failures model(s) diverged." >&2
  echo "Fix the generator that is wrong — do not update the other to match a defect." >&2
  exit 1
fi
echo "PASSED: ${#PARITY_MODELS[@]} model(s), backends byte-identical."
