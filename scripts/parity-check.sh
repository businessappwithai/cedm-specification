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
# Each model is checked in both syntaxes. A model's YAML (`*.eml.yaml`) is its
# source of truth and its EML the view it converts from, so four backends are
# generated per model — TypeScript and Rust, from each — and three comparisons
# made: TS(EML) = Rust(EML), TS(YAML) = Rust(YAML), and Rust(YAML) = Rust(EML).
# The last is the Rust half of what `model-yaml/__tests__/` proves for the
# TypeScript generator.
#
# Run over EVERY model in PARITY_MODELS, not just the first. Parity on a model that
# declares no `%%rbac` says nothing about the code that compiles `%%rbac`, so a
# feature landing without a corpus line exercising it is a feature this script
# cannot see.
set -euo pipefail

cd "$(dirname "$0")/.."

# The corpus. Grow this — and grow the models themselves — whenever a directive
# or a template branch lands that no existing model reaches.
# `<EML model>:<its YAML>`.
PARITY_MODELS=(
  "examples/drug-discovery.eml.mmd:examples/drug-discovery.eml.yaml"
  "language/examples/crm.eml.mmd:language/yaml/examples/crm.eml.yaml"
  "language/examples/dance-studio.eml.mmd:language/yaml/examples/dance-studio.eml.yaml"
  "language/examples/ecommerce.eml.mmd:language/yaml/examples/ecommerce.eml.yaml"
  "language/examples/helpdesk.eml.mmd:language/yaml/examples/helpdesk.eml.yaml"
  "language/examples/minimal.eml.mmd:language/yaml/examples/minimal.eml.yaml"
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

generate_ts() {
  INIT_CWD="$PWD" bun --filter @appwithai/generator generate -- \
    --stack tanstack-astryx-loco -i "$1" -o "$2" -n parity \
    --no-setup --force --skip-cli-scaffold >/dev/null
}

generate_rs() {
  cargo run -q -p appwithai-gen -- generate \
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

for pair in "${PARITY_MODELS[@]}"; do
  eml="${pair%%:*}"
  yaml="${pair##*:}"
  missing=0
  for file in "$eml" "$yaml"; do
    if [ ! -f "$file" ]; then
      echo "!! missing corpus model: $file" >&2
      missing=1
    fi
  done
  if [ "$missing" -ne 0 ]; then
    failures=$((failures + 1))
    continue
  fi

  slug="$(basename "$eml" | tr -c 'a-zA-Z0-9' '-')"
  rm -rf "$OUT_DIR/$slug"-*

  echo
  echo "==> $eml  ·  $yaml"

  # --skip-cli-scaffold throughout: `loco new` fetches over the network and its
  # output is identical either way, so scaffolding here would only make the
  # check flaky.
  generate_ts "$eml" "$OUT_DIR/$slug-ts-eml"
  generate_rs "$eml" "$OUT_DIR/$slug-rs-eml"
  generate_ts "$yaml" "$OUT_DIR/$slug-ts-yaml"
  generate_rs "$yaml" "$OUT_DIR/$slug-rs-yaml"

  compare "TypeScript and Rust agree on the EML" "$OUT_DIR/$slug-ts-eml" "$OUT_DIR/$slug-rs-eml"
  compare "TypeScript and Rust agree on the YAML" "$OUT_DIR/$slug-ts-yaml" "$OUT_DIR/$slug-rs-yaml"
  compare "the Rust generator reads the YAML as it reads the EML" "$OUT_DIR/$slug-rs-yaml" "$OUT_DIR/$slug-rs-eml"
done

echo
if [ "$failures" -ne 0 ]; then
  echo "FAILED: $failures model(s) diverged." >&2
  echo "Fix the generator that is wrong — do not update the other to match a defect." >&2
  exit 1
fi
echo "PASSED: ${#PARITY_MODELS[@]} model(s) in both syntaxes, backends byte-identical."
