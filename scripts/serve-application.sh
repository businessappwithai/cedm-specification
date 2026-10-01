#!/usr/bin/env bash
# Run one generated application and leave it running, for QA.
#
#   bash scripts/serve-application.sh sales          # build, migrate, seed, start
#   bash scripts/serve-application.sh --stop sales   # stop it and delete its build
#
# The application is copied to a scratch directory first, so `bun install` and
# cargo's `target/` never touch the repository. Backend :3000, frontend :3001.
# Rebuilding after a template change is incremental while the application runs;
# --stop deletes the build (a debug build is several gigabytes), so one
# application's build is gone before the next one's starts.
set -uo pipefail
cd "$(dirname "$0")/.."
SCRATCH="${SCRATCH:-/tmp/claude-0/run}"
export PGPASSWORD="${PGPASSWORD:-qapass}"
PG="postgres://postgres:${PGPASSWORD}@localhost:5432"

if [ "${1:-}" = "--stop" ]; then
  domain="$2"
  for pidfile in "$SCRATCH/$domain.backend.pid" "$SCRATCH/$domain.frontend.pid"; do
    [ -f "$pidfile" ] && kill "$(cat "$pidfile")" 2>/dev/null; rm -f "$pidfile"
  done
  pkill -f "$SCRATCH/$domain/" 2>/dev/null
  rm -rf "$SCRATCH/target-$domain" "$SCRATCH/$domain"
  echo "stopped $domain and cleared its build"
  exit 0
fi

domain="$1"
crate="$(echo "$domain" | tr '-' '_')"
app="$SCRATCH/$domain"
db="${crate}_development"
mkdir -p "$SCRATCH"
rm -rf "$app" && cp -r "generated-applications/$domain" "$app"
psql -h localhost -U postgres -qc "DROP DATABASE IF EXISTS $db" -c "CREATE DATABASE $db" || exit 1
export DATABASE_URL="$PG/$db"
export CARGO_TARGET_DIR="$SCRATCH/target-$domain"

( cd "$app/backend" \
  && cargo build -q --bin "${domain}-cli" 2>"$SCRATCH/$domain-build.log" \
  && cargo run -q --bin "${domain}-cli" -- db migrate >"$SCRATCH/$domain-migrate.log" 2>&1 \
  && cargo run -q --bin "${domain}-cli" -- db seed >"$SCRATCH/$domain-seed.log" 2>&1 ) \
  || { echo "backend setup failed (see $SCRATCH/$domain-*.log)"; exit 1; }

( cd "$app/backend" && exec cargo run -q --bin "${domain}-cli" -- start --server-and-worker >"$SCRATCH/$domain-server.log" 2>&1 ) &
echo $! >"$SCRATCH/$domain.backend.pid"
for _ in $(seq 1 60); do curl -sf http://localhost:3000/api/me/health >/dev/null 2>&1 && break; sleep 1; done

( cd "$app/frontend" && bun install >"$SCRATCH/$domain-install.log" 2>&1 && exec bun run dev >"$SCRATCH/$domain-frontend.log" 2>&1 ) &
echo $! >"$SCRATCH/$domain.frontend.pid"
for _ in $(seq 1 90); do curl -sf http://localhost:3001/ >/dev/null 2>&1 && break; sleep 1; done
echo "$domain is up: backend http://localhost:3000  frontend http://localhost:3001  (admin@admin.com / admin)"
