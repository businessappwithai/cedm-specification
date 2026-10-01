#!/usr/bin/env bash
# Generate every CEDM domain application into generated-applications/.
#
#   bash scripts/generate-domain-applications.sh            # all of them
#   bash scripts/generate-domain-applications.sh sales hr   # just these
#
# Each applications/<domain>.cedm.yaml becomes generated-applications/<domain>/,
# a complete application (Loco.rs backend, TanStack Start + Astryx frontend,
# tests) that also carries the common CEDM specification under cedm/.
#
# --skip-cli-scaffold keeps the output reproducible and offline: `loco new`
# fetches over the network, and what it adds (CI workflow, rustfmt config,
# AGENTS.md) is the framework's own, not the model's. Drop the flag to get it.
# Paths are repository-relative so the manifest records no machine's directory.
set -euo pipefail
cd "$(dirname "$0")/.."

bun --filter @appwithai/core build >/dev/null
bun --filter @appwithai/generator build >/dev/null

if [ "$#" -gt 0 ]; then domains=("$@"); else
  domains=()
  for file in applications/*.cedm.yaml; do
    name="$(basename "$file" .cedm.yaml)"
    [ "$name" = "common" ] || domains+=("$name")
  done
fi

failed=0
for domain in "${domains[@]}"; do
  if bun packages/generator/dist/cli/generate.js generate \
      -i "applications/$domain.cedm.yaml" -o "generated-applications/$domain" -n "$domain" \
      --stack tanstack-astryx-loco --no-setup --force --skip-cli-scaffold >"/tmp/generate-$domain.log" 2>&1; then
    echo "  ok   $domain"
  else
    echo "  FAIL $domain (see /tmp/generate-$domain.log)" >&2
    failed=$((failed + 1))
  fi
done
[ "$failed" -eq 0 ] || { echo "$failed application(s) failed." >&2; exit 1; }
echo "Generated ${#domains[@]} application(s) into generated-applications/."
