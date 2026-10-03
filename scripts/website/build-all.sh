#!/usr/bin/env bash
# Build the documentation website of every generated application, one at a time.
#
#   bash scripts/website/build-all.sh                # every domain not yet done
#   bash scripts/website/build-all.sh sales hr       # just these
#   FORCE=1 bash scripts/website/build-all.sh sales  # redo one
#
# Per domain: start the application (scripts/serve-application.sh), capture its
# screens with gstack's browser (capture.ts), write the Docusaurus project
# (scripts/build-website.ts), then stop it and delete its build before the next
# one starts. A finished domain leaves `website/<d>/static/.captured`, so a run
# interrupted by the container restarting resumes where it stopped.
set -uo pipefail
cd "$(dirname "$0")/../.."
export PGPASSWORD="${PGPASSWORD:-qapass}"
OUT="${WEBSITE_OUT:-/tmp/claude-0/website-build}"
mkdir -p "$OUT"
pg_ctlcluster 16 main start 2>/dev/null || true

if [ "$#" -gt 0 ]; then domains=("$@"); else
  domains=()
  for file in applications/*.cedm.yaml; do
    domains+=("$(basename "$file" .cedm.yaml)")
  done
fi

for domain in "${domains[@]}"; do
  marker="website/$domain/static/.captured"
  if [ -f "$marker" ] && [ -z "${FORCE:-}" ]; then echo "skip $domain (captured)"; continue; fi
  echo "==> $domain $(date +%H:%M)"
  bun scripts/build-website.ts "$domain" >/dev/null || { echo "$domain	model-failed" >>"$OUT/summary.tsv"; continue; }
  rm -rf "website/$domain/static/img"
  if bash scripts/serve-application.sh "$domain" >"$OUT/$domain-serve.log" 2>&1; then
    bun scripts/website/capture.ts "$domain" >"$OUT/$domain-capture.log" 2>&1
    shots="$(find "website/$domain/static/img" -type f 2>/dev/null | wc -l)"
    bun scripts/build-website.ts "$domain" >/dev/null
    if [ "$shots" -gt 5 ]; then date -u +%FT%TZ >"$marker"; fi
    printf '%s\tshots=%s\t%s\n' "$domain" "$shots" "$(tail -1 "$OUT/$domain-capture.log")" >>"$OUT/summary.tsv"
  else
    printf '%s\tserve-failed\n' "$domain" >>"$OUT/summary.tsv"
  fi
  bash scripts/serve-application.sh --stop "$domain" >/dev/null 2>&1
done
echo "done $(date +%H:%M)"
