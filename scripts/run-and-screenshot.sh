#!/usr/bin/env bash
# Run generated applications and screenshot each.
#
#   bash scripts/run-and-screenshot.sh sales healthcare logistics
#
# For every domain: copy generated-applications/<domain> to a scratch directory
# (so `bun install` and cargo's `target/` never touch the repository), create
# its database, migrate and seed it, start the backend and the frontend, capture
# the screens (scripts/screenshot-application.mjs), and stop everything. The
# build is deleted afterwards — a debug build is several gigabytes. Needs
# Postgres at $PGHOST (default localhost) as postgres/$PGPASSWORD, a Rust
# toolchain, bun and the container's Chromium.
set -uo pipefail
cd "$(dirname "$0")/.."
REPO="$PWD"
SCRATCH="${SCRATCH:-/tmp/claude-0/run}"
SHOTS="$REPO/generated-applications/screenshots"
export PGPASSWORD="${PGPASSWORD:-qapass}"
PG="postgres://postgres:${PGPASSWORD}@localhost:5432"

stop() { [ -n "${BACK:-}" ] && kill "$BACK" 2>/dev/null; [ -n "${FRONT:-}" ] && kill "$FRONT" 2>/dev/null; wait 2>/dev/null; BACK=""; FRONT=""; }
trap stop EXIT

for domain in "$@"; do
  crate="$(echo "$domain" | tr '-' '_')"
  app="$SCRATCH/$domain"
  db="${crate}_development"
  echo "==> $domain"
  rm -rf "$app" && mkdir -p "$SCRATCH" && cp -r "generated-applications/$domain" "$app"

  psql -h localhost -U postgres -qc "DROP DATABASE IF EXISTS $db" -c "CREATE DATABASE $db" || continue
  export DATABASE_URL="$PG/$db"
  export CARGO_TARGET_DIR="$SCRATCH/target-$domain"

  ( cd "$app/backend" \
    && cargo build -q --bin "${domain}-cli" 2>"$SCRATCH/$domain-build.log" \
    && cargo run -q --bin "${domain}-cli" -- db migrate >"$SCRATCH/$domain-migrate.log" 2>&1 \
    && cargo run -q --bin "${domain}-cli" -- db seed >"$SCRATCH/$domain-seed.log" 2>&1 ) \
    || { echo "  backend setup failed (see $SCRATCH/$domain-*.log)"; rm -rf "$CARGO_TARGET_DIR"; continue; }

  ( cd "$app/backend" && exec cargo run -q --bin "${domain}-cli" -- start --server-and-worker >"$SCRATCH/$domain-server.log" 2>&1 ) &
  BACK=$!
  for _ in $(seq 1 60); do curl -sf http://localhost:3000/api/me/health >/dev/null 2>&1 && break; sleep 1; done

  ( cd "$app/frontend" && bun install >"$SCRATCH/$domain-install.log" 2>&1 && exec bun run dev >"$SCRATCH/$domain-frontend.log" 2>&1 ) &
  FRONT=$!
  for _ in $(seq 1 90); do curl -sf http://localhost:3001/ >/dev/null 2>&1 && break; sleep 1; done

  node scripts/screenshot-application.mjs "$domain" http://localhost:3001 "$SHOTS/$domain"
  stop
  rm -rf "$CARGO_TARGET_DIR" "$app"
done
