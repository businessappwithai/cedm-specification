#!/usr/bin/env bash
# Check what has been authored, then print the next batch's skeleton.
#
#   tools/help-next.sh [count]
#
# Applying a batch is `bun tools/help-apply.ts tools/help-batches/bNNN.txt`;
# this only reports. It commits and pushes nothing: that stays with the author.
set -euo pipefail
cd "$(dirname "$0")/.."
if ! bun tools/validate.ts >/tmp/help-next-validate.$$ 2>&1; then
  grep "^ERROR" /tmp/help-next-validate.$$ || cat /tmp/help-next-validate.$$
  rm -f /tmp/help-next-validate.$$
  echo "The library does not validate; fix it before authoring more."
  exit 1
fi
rm -f /tmp/help-next-validate.$$
echo "remaining: $(bun tools/help-skeleton.ts --todo | grep -c . || true)"
bun tools/help-skeleton.ts --next "${1:-8}" | grep -v "^      keep" | cut -c1-190
