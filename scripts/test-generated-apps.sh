#!/usr/bin/env bash
#
# Generate an application from every YAML model in the repository and test each
# one completely: the backend's lint and its Rust request suites, the
# frontend's build, type-check and unit tests, and the bun end-to-end suites
# against the running application.
#
# The YAML is the source of truth, so the application is generated from the
# `.eml.yaml`.
#
# Per model, in order — a stage that fails is recorded and the next still runs,
# so one report says everything that is wrong:
#
#   generate    appwithai generate -i <model>.eml.yaml --skip-cli-scaffold --no-setup
#   clippy      cargo clippy --all-targets -- -D warnings
#   cargo-test  LOCO_ENV=test cargo test --test app, against a fresh <crate>_test
#   frontend    bun install, vite build, tsc --noEmit, vitest run
#   e2e         migrate + seed a fresh <crate>_development, start the backend,
#               bun run run.ts --no-server
#
# Every generated backend has a crate named `migration`, and two projects
# sharing a target directory collide on it (CLAUDE.md: the second project's
# `db migrate` runs the first project's DDL). The shared target directory keeps
# the dependency builds warm, and `cargo clean -p migration -p <crate>` before
# each project is what keeps them apart.
#
# Environment:
#   PG_URL            postgres://user:pass@host:port (default postgres://postgres:qapass@127.0.0.1:5432)
#   APPS_DIR          where applications are generated (default /home/user/apps/corpus)
#   CARGO_TARGET_DIR  shared cargo target directory (default /home/user/apps/target)
#   REPORT            summary file (default $APPS_DIR/report.md)
#   ONLY              run only models whose path contains this substring
#
#   scripts/test-generated-apps.sh
set -uo pipefail

cd "$(dirname "$0")/.."
ROOT="$PWD"

PG_URL="${PG_URL:-postgres://postgres:qapass@127.0.0.1:5432}"
APPS_DIR="${APPS_DIR:-/home/user/apps/corpus}"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-/home/user/apps/target}"
REPORT="${REPORT:-$APPS_DIR/report.md}"
ONLY="${ONLY:-}"

# `<model>.eml.yaml:<project name>`. The project name decides the crate and the
# database names, so it is unique per model. `packages/generator/examples/
# crm.erd.eml.yaml` is byte-identical to `examples/crm.erd.eml.yaml` and is
# covered by it.
MODELS=(
  "examples/drug-discovery.eml.yaml:drug-discovery"
  "language/yaml/examples/crm.eml.yaml:lang-crm"
  "language/yaml/examples/dance-studio.eml.yaml:dance-studio"
  "language/yaml/examples/ecommerce.eml.yaml:lang-ecommerce"
  "language/yaml/examples/helpdesk.eml.yaml:helpdesk"
  "language/yaml/examples/minimal.eml.yaml:minimal"
  "examples/cli-crm.eml.yaml:cli-crm"
  "examples/clinic.erd.eml.yaml:clinic-erd"
  "examples/crm.erd.eml.yaml:crm-erd"
  "examples/ecommerce.erd.eml.yaml:ecommerce-erd"
  "examples/gemini-crm-erd.eml.yaml:gemini-crm-erd"
  "examples/simple.erd.eml.yaml:simple-erd"
  "html/models/crm.eml.yaml:html-crm"
  "html/models/drug-discovery.eml.yaml:html-drug-discovery"
  "html/models/investment-planning-wealth-management-system.eml.yaml:investment-planning"
  "packages/yamltecture/test/fixtures/field-service.eml.yaml:field-service"
  "school-management.eml.yaml:school-management"
  "simple-crm.eml.yaml:simple-crm"
  "test-patient.eml.yaml:test-patient"
  "test-simple-erd.eml.yaml:test-simple-erd"
)

mkdir -p "$APPS_DIR" "$CARGO_TARGET_DIR"

# Every stage after generation needs the database; a harness that started
# without one would record twenty failures that say nothing about the models.
if ! psql "$PG_URL/postgres" -qtAc "SELECT 1" >/dev/null 2>&1; then
  echo "error: PostgreSQL is not reachable at $PG_URL" >&2
  exit 2
fi

echo "==> Building the generator"
bun --filter @appwithai/core build >/dev/null
bun --filter @appwithai/generator build >/dev/null

psql_admin() { psql "$PG_URL/postgres" -v ON_ERROR_STOP=1 -qtAc "$1"; }
recreate_db() {
  psql_admin "DROP DATABASE IF EXISTS \"$1\" WITH (FORCE)" >/dev/null
  psql_admin "CREATE DATABASE \"$1\"" >/dev/null
}

wait_for_health() {
  for _ in $(seq 1 240); do
    if curl -sf "http://127.0.0.1:3000/api/me/health" >/dev/null; then return 0; fi
    sleep 1
  done
  return 1
}

# The last line matching a pattern, for the report.
last_match() { grep -E "$1" "$2" 2>/dev/null | tail -1 | sed -E 's/\x1b\[[0-9;]*m//g' | cut -c1-120; }

{
  echo "# Generated applications — every model, from its YAML"
  echo
  echo "Generated $(date -u +%Y-%m-%dT%H:%M:%SZ) · generator \`$(git rev-parse --short HEAD)\` · toolchain \`$(rustc --version)\` · bun \`$(bun --version)\`"
  echo
  echo "| Model | generate | clippy | cargo test | frontend | e2e (bun suites) |"
  echo "|---|---|---|---|---|---|"
} > "$REPORT"

overall=0

for entry in "${MODELS[@]}"; do
  model="${entry%%:*}"
  name="${entry##*:}"
  [ -n "$ONLY" ] && [[ "$model" != *"$ONLY"* ]] && continue

  crate="${name//-/_}"
  out="$APPS_DIR/$name"
  logs="$APPS_DIR/logs/$name"
  mkdir -p "$logs"
  echo
  echo "==> $model  →  $out"

  gen="✗" clip="—" ctest="—" front="—" e2e="—"

  rm -rf "$out"
  if bun packages/generator/dist/cli/generate.js generate -i "$model" -o "$out" -n "$name" \
      --stack tanstack-astryx-loco --skip-cli-scaffold --no-setup --force >"$logs/generate.log" 2>&1; then
    gen="✓"
  else
    overall=1
    echo "$model | ✗ generate" >&2
    echo "| \`$model\` | ✗ | — | — | — | — |" >> "$REPORT"
    continue
  fi

  # Keep this project's `migration` crate and binary from being taken for the
  # previous project's.
  (cd "$out/backend" && cargo clean -q -p migration -p "$crate" >/dev/null 2>&1 || true)

  # Backend lint.
  if (cd "$out/backend" && cargo clippy --all-targets -- -D warnings) >"$logs/clippy.log" 2>&1; then
    clip="✓"
  else
    clip="✗"; overall=1
  fi

  # The Rust request suites, against a fresh test database.
  recreate_db "${crate}_test"
  if (cd "$out/backend" && LOCO_ENV=test DATABASE_URL="$PG_URL/${crate}_test" \
        cargo test --test app) >"$logs/cargo-test.log" 2>&1; then
    ctest="✓ $(last_match '^test result' "$logs/cargo-test.log" | grep -oE '[0-9]+ passed')"
  else
    ctest="✗ $(last_match '^test result' "$logs/cargo-test.log" | grep -oE '[0-9]+ passed; [0-9]+ failed')"
    overall=1
  fi

  # The frontend: install, build (which also writes the route tree the
  # type-check needs), type-check, unit tests.
  if (cd "$out/frontend" && bun install >/dev/null 2>&1 && bun run build \
        && bunx tsc --noEmit -p . && bunx vitest run) >"$logs/frontend.log" 2>&1; then
    front="✓ $(last_match 'Tests +[0-9]+ passed' "$logs/frontend.log" | grep -oE '[0-9]+ passed')"
  else
    front="✗"; overall=1
  fi

  # End to end: a freshly migrated and seeded development database, the real
  # server, and every bun suite attached to it.
  recreate_db "${crate}_development"
  export DATABASE_URL="$PG_URL/${crate}_development"
  if (cd "$out/backend" && cargo loco db migrate && cargo loco db seed) >"$logs/seed.log" 2>&1; then
    # The limiter off, as the bun harness does when it starts the server itself:
    # bulk seeding is thousands of writes a minute from one caller.
    (cd "$out/backend" && RATE_LIMIT_MAX_PER_MINUTE=0 RATE_LIMIT_AUTH_MAX_PER_MINUTE=0 \
       exec cargo loco start) >"$logs/server.log" 2>&1 &
    server=$!
    if wait_for_health; then
      if (cd "$out/tests" && bun install >/dev/null 2>&1 && bun run run.ts --no-server) >"$logs/e2e.log" 2>&1; then
        e2e="✓ $(last_match 'suites passed' "$logs/e2e.log" | grep -oE '[0-9]+/[0-9]+')"
      else
        e2e="✗ $(last_match 'suites passed' "$logs/e2e.log" | grep -oE '[0-9]+/[0-9]+')"
        overall=1
      fi
    else
      e2e="✗ server did not become healthy"; overall=1
    fi
    kill "$server" 2>/dev/null; wait "$server" 2>/dev/null
    pkill -f "target/debug/${crate}-cli" 2>/dev/null || true
  else
    e2e="✗ migrate/seed"; overall=1
  fi
  unset DATABASE_URL

  # Results are in the logs; keep the generated sources for inspection but drop
  # what can be rebuilt — twenty projects' node_modules and crate artifacts do
  # not fit on a CI-sized disk together.
  rm -rf "$out/frontend/node_modules" "$out/tests/node_modules" "$out/frontend/dist"
  (cd "$out/backend" && cargo clean -q -p migration -p "$crate" >/dev/null 2>&1 || true)
  psql_admin "DROP DATABASE IF EXISTS \"${crate}_test\" WITH (FORCE)" >/dev/null
  psql_admin "DROP DATABASE IF EXISTS \"${crate}_development\" WITH (FORCE)" >/dev/null

  echo "  generate $gen · clippy $clip · cargo test $ctest · frontend $front · e2e $e2e"
  echo "| \`$model\` | $gen | $clip | $ctest | $front | $e2e |" >> "$REPORT"
done

echo
echo "Report: $REPORT"
cat "$REPORT"
exit "$overall"
