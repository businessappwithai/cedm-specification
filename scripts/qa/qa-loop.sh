#!/usr/bin/env bash
# Serial QA of generated applications, one at a time.
#
#   bash scripts/qa/qa-loop.sh sales healthcare ...     # named domains
#   bash scripts/qa/qa-loop.sh --all                    # every application
#   QA_TESTS=0 bash scripts/qa/qa-loop.sh sales         # skip `cargo test`
#
# For each domain: regenerate it, build and start it (scripts/serve-application.sh),
# smoke-test every screen in a browser (scripts/qa/smoke-application.mjs, with
# screenshots), run its own Rust request suite, record the result in
# $QA_OUT/summary.tsv, and delete the build before the next one starts — a debug
# build is several gigabytes and the disk holds one.
set -uo pipefail
cd "$(dirname "$0")/../.."
OUT="${QA_OUT:-/tmp/claude-0/qa-loop}"
SCRATCH="${SCRATCH:-/tmp/claude-0/run}"
export PGPASSWORD="${PGPASSWORD:-qapass}"
mkdir -p "$OUT"

if [ "${1:-}" = "--all" ]; then
  set -- $(ls applications/*.cedm.yaml | xargs -n1 basename | sed 's/\.cedm\.yaml$//')
fi

for domain in "$@"; do
  crate="$(echo "$domain" | tr '-' '_')"
  dir="$OUT/$domain"; rm -rf "$dir"; mkdir -p "$dir"
  echo "==> $domain $(date +%H:%M)"
  gen=FAIL; smoke=-; tests=-; findings=-

  # QA_SKIP_GENERATE=1 tests the application as committed, without
  # regenerating it from whatever the working tree's generator holds.
  if [ "${QA_SKIP_GENERATE:-0}" = 1 ]; then
    gen=committed
  else
    bash scripts/generate-domain-applications.sh "$domain" >"$dir/generate.log" 2>&1 && gen=ok
  fi
  if [ "$gen" != FAIL ] && bash scripts/serve-application.sh "$domain" >"$dir/serve.log" 2>&1; then
    timeout 1800 bun scripts/qa/smoke-application.mjs "$domain" --shots >"$dir/smoke.json" 2>"$dir/smoke.err"
    smoke=$?
    findings=$(python3 -c "import json,sys;print(len(json.load(open('$dir/smoke.json'))['findings']))" 2>/dev/null || echo "?")

    if [ "${QA_TESTS:-1}" = 1 ]; then
      psql -h localhost -U postgres -qc "DROP DATABASE IF EXISTS ${crate}_test" -c "CREATE DATABASE ${crate}_test" >/dev/null 2>&1
      ( cd "$SCRATCH/$domain/backend" \
        && DATABASE_URL="postgres://postgres:${PGPASSWORD}@localhost:5432/${crate}_test" LOCO_ENV=test \
           CARGO_TARGET_DIR="$SCRATCH/target-$domain" timeout 5400 cargo test --test app >"$dir/cargo-test.log" 2>&1 )
      tests=$(grep -E "^test result" "$dir/cargo-test.log" | tail -1 | sed -E 's/test result: ([a-zA-Z]+)\. ([0-9]+) passed; ([0-9]+) failed.*/\1 \2p \3f/')
      [ -n "$tests" ] || tests="no-result"
    fi
  else
    [ "$gen" != FAIL ] && gen="serve-failed"
  fi

  bash scripts/serve-application.sh --stop "$domain" >/dev/null 2>&1
  psql -h localhost -U postgres -qc "DROP DATABASE IF EXISTS ${crate}_test" -c "DROP DATABASE IF EXISTS ${crate}_development" >/dev/null 2>&1
  printf '%s\tgen=%s\tsmoke=%s\tfindings=%s\ttests=%s\n' "$domain" "$gen" "$smoke" "$findings" "$tests" | tee -a "$OUT/summary.tsv"
done
