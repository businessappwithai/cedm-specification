#!/usr/bin/env bash
# One command that checks the whole application.
#
#   bash qa.sh            # smoke test every screen in a browser, then the Rust request suite
#   bash qa.sh --smoke    # the browser smoke test only
#   bash qa.sh --api      # the Rust request suite only
#
# Starts the backend (:3000) and the frontend (:3001) if they are not already
# running, and stops only what it started. The database must exist and be
# migrated and seeded (`cd backend && cargo loco db migrate && cargo loco db seed`);
# the Rust suite uses its own `<crate>_test` database, created here if missing.
# Exits non-zero if either check fails, so it is a CI gate as is.
#
# Generated: 2026-10-02T13:06:07.471Z
# Project: regulatory
set -uo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"
CRATE="$(echo "regulatory" | tr '-' '_')"
MODE="${1:-all}"
STARTED=()
trap 'for pid in "${STARTED[@]:-}"; do [ -n "$pid" ] && kill "$pid" 2>/dev/null; done' EXIT

up() { curl -sf "$1" >/dev/null 2>&1; }

smoke=0
api=0

if [ "$MODE" != "--api" ]; then
  up "http://localhost:3000/api/me/health" || {
    # The general rate limit is off for the run: the smoke test is far faster than a
    # person. The limiter has its own request test.
    ( cd backend && RATE_LIMIT_MAX_PER_MINUTE=0 exec cargo loco start --server-and-worker >"$ROOT/tests/backend.log" 2>&1 ) &
    STARTED+=($!)
    for _ in $(seq 1 120); do up "http://localhost:3000/api/me/health" && break; sleep 1; done
  }
  up "http://localhost:3001/" || {
    ( cd frontend && exec bun run dev >"$ROOT/tests/frontend.log" 2>&1 ) &
    STARTED+=($!)
    for _ in $(seq 1 120); do up "http://localhost:3001/" && break; sleep 1; done
  }
  echo "== browser smoke test"
  ( cd tests && bun install --silent >/dev/null 2>&1; bun smoke.mjs --shots ) || smoke=1
fi

if [ "$MODE" != "--smoke" ]; then
  echo "== Rust request suite"
  : "${PGUSER:=postgres}"
  TEST_URL="${DATABASE_URL_TEST:-postgres://${PGUSER}:${PGPASSWORD:-postgres}@${PGHOST:-localhost}:${PGPORT:-5432}/${CRATE}_test}"
  createdb -h "${PGHOST:-localhost}" -U "$PGUSER" "${CRATE}_test" 2>/dev/null || true
  ( cd backend && DATABASE_URL="$TEST_URL" LOCO_ENV=test cargo test --test app ) || api=1
fi

echo
echo "smoke: $([ $smoke = 0 ] && echo passed || echo FAILED)    api: $([ $api = 0 ] && echo passed || echo FAILED)"
exit $((smoke + api))
