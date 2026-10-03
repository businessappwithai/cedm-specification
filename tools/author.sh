#!/usr/bin/env bash
# Apply authored CEDM batches, then re-derive what depends on them and validate.
#   bash tools/author.sh batch1.yaml [batch2.yaml …]
set -euo pipefail
cd "$(dirname "$0")/.."
python3 tools/apply_authored.py "$@"
python3 tools/derive_business_logic.py | tail -1
python3 tools/derive_workflows.py | tail -1
python3 tools/build_enumerations.py | tail -1
python3 tools/validate.py 2>&1 | grep -E "^ERROR|PASSED|FAILED"
