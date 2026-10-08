#!/usr/bin/env bash
# Validate, commit and push what has been authored, then print the next batch's skeleton.
#   tools/help-next.sh "message" [count]
set -u
cd "$(dirname "$0")/.."
if python3 tools/validate.py 2>&1 | grep -q "^ERROR"; then python3 tools/validate.py 2>&1 | grep "^ERROR"; echo "NOT COMMITTED"; exit 1; fi
git add -A tools domain
git commit -qm "$1

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01XXVXaam1YE4tWxq3ZP4SSK" && echo committed
git push -q origin claude/practical-thompson-0m5ji3 2>&1 | tail -1
echo "remaining: $(python3 tools/help_skeleton.py --todo | wc -l)"
python3 tools/help_skeleton.py --next "${2:-8}" | grep -v "^      keep" | cut -c1-190
