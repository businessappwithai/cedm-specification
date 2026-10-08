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
# `model/model.eml.yaml` sits at the project root, outside the compared tree.
#
# The `Generated:` line carries a wall-clock timestamp and is the one difference
# that means nothing. Every other difference is a defect.
#
# Three backends are generated per model, all from its YAML — TypeScript, the
# native Rust binary, and the Rust generator compiled to `wasm32-wasip1` and hosted
# by `scripts/appwithai-wasm.mjs` — and two comparisons made: TypeScript = Rust,
# and WebAssembly = native. The second is what makes the WebAssembly build the
# same generator rather than a second one.
#
# Run over EVERY model in PARITY_MODELS, not just the first. Parity on a model that
# declares no access rules says nothing about the code that compiles them, so a
# feature landing without a corpus model exercising it is a feature this script
# cannot see.
set -euo pipefail

cd "$(dirname "$0")/.."

# The CEDM specification — the domain library and the domain applications — is
# found the way the generators find it: CEDM_SPEC_ROOT, else the nearest
# directory upward holding specification/manifest.yaml and domain/. This
# repository's copy inside cedm-specification finds the enclosing repository.
spec_root() {
  if [ -n "${CEDM_SPEC_ROOT:-}" ] && [ -f "$CEDM_SPEC_ROOT/specification/manifest.yaml" ]; then
    echo "$CEDM_SPEC_ROOT"; return
  fi
  local dir="$PWD"
  while [ "$dir" != "/" ]; do
    if [ -f "$dir/specification/manifest.yaml" ] && [ -d "$dir/domain" ]; then echo "$dir"; return; fi
    dir="$(dirname "$dir")"
  done
}
SPEC_ROOT="$(spec_root)"
if [ -z "$SPEC_ROOT" ]; then
  echo "!! no CEDM specification found (set CEDM_SPEC_ROOT)" >&2
  exit 1
fi

# The corpus. Grow this — and grow the models themselves — whenever a construct
# or a template branch lands that no existing model reaches.
PARITY_MODELS=(
  "examples/drug-discovery.eml.yaml"
  "language/yaml/examples/crm.eml.yaml"
  "language/yaml/examples/dance-studio.eml.yaml"
  "language/yaml/examples/ecommerce.eml.yaml"
  "language/yaml/examples/helpdesk.eml.yaml"
  "language/yaml/examples/minimal.eml.yaml"
  # Written in CEDM: each generator reads the CEDM itself — the Rust and
  # WebAssembly builds through their own port of the lowering, not the
  # TypeScript one.
  "examples/drug-discovery.cedm.yaml"
  "language/cedm/examples/crm.cedm.yaml"
  # A domain application: enumeration tables, imports of the common module.
  "$SPEC_ROOT/applications/sales.cedm.yaml"
)

# CEDM models whose lowering is compared across TypeScript, Rust and
# WebAssembly, document for document. Every PARITY_MODELS entry written in
# CEDM is compared too; these add what generation parity would not reach.
CEDM_LOWERING_MODELS=(
  "examples/drug-discovery.cedm.yaml"
  "$SPEC_ROOT/applications/common.cedm.yaml"
  language/cedm/examples/*.cedm.yaml
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

echo "==> Building the Rust generator for wasm32-wasip1"
cargo build -q -p appwithai-gen --release --target wasm32-wasip1

generate_ts() {
  INIT_CWD="$PWD" bun --filter @appwithai/generator generate -- \
    --stack tanstack-astryx-loco -i "$1" -o "$2" -n parity \
    --no-setup --force --skip-cli-scaffold >/dev/null
}

generate_rs() {
  cargo run -q -p appwithai-gen -- generate \
    -i "$1" -o "$2" -n parity --skip-cli-scaffold --force >/dev/null
}

generate_wasm() {
  # --liftoff-only: CI's Node segfaulted in V8's optimising wasm tier on the
  # larger applications; the baseline compiler is slower but does not crash.
  node --no-warnings --liftoff-only scripts/appwithai-wasm.mjs generate \
    -i "$1" -o "$2" -n parity --skip-cli-scaffold --force >/dev/null
}

compare() {
  local label="$1" left="$2" right="$3"
  if diff -r "${IGNORE[@]}" "$left/backend" "$right/backend"; then
    echo "   ok — $label"
  else
    echo "!! PARITY BROKEN: $label" >&2
    failures=$((failures + 1))
  fi
}

for model in "${PARITY_MODELS[@]}"; do
  if [ ! -f "$model" ]; then
    echo "!! missing corpus model: $model" >&2
    failures=$((failures + 1))
    continue
  fi

  slug="$(basename "$model" | tr -c 'a-zA-Z0-9' '-')"
  rm -rf "$OUT_DIR/$slug"-*

  echo
  echo "==> $model"

  # --skip-cli-scaffold throughout: `loco new` fetches over the network and its
  # output is identical either way, so scaffolding here would only make the
  # check flaky.
  generate_ts "$model" "$OUT_DIR/$slug-ts"
  generate_rs "$model" "$OUT_DIR/$slug-rs"
  generate_wasm "$model" "$OUT_DIR/$slug-wasm"

  compare "TypeScript and Rust agree" "$OUT_DIR/$slug-ts" "$OUT_DIR/$slug-rs"
  compare "the WebAssembly build emits what the native build emits" "$OUT_DIR/$slug-wasm" "$OUT_DIR/$slug-rs"
done

echo
echo "==> CEDM lowering: TypeScript, Rust and WebAssembly read each model alike"
if ! bun scripts/cedm-lowering-parity.ts "${CEDM_LOWERING_MODELS[@]}"; then
  failures=$((failures + 1))
fi

echo
if [ "$failures" -ne 0 ]; then
  echo "FAILED: $failures model(s) diverged." >&2
  echo "Fix the generator that is wrong — do not update the other to match a defect." >&2
  exit 1
fi
echo "PASSED: ${#PARITY_MODELS[@]} model(s), backends byte-identical across TypeScript, Rust and WebAssembly."
