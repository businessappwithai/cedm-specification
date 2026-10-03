#!/usr/bin/env python3
"""Undo regeneration churn: restore every tracked file under generated-applications/
whose only change is a generation timestamp.

    python3 scripts/restore-generation-noise.py

Regenerating rewrites the `Generated:` line of every file, so a regeneration that
changed three templates shows thousands of modified files. Restoring the ones that
differ only in that line leaves a diff that is the real change.
"""
import re
import subprocess

NOISE = re.compile(r'Generated:|generated <time|"generatedAt"|generated at', re.I)

out = subprocess.run(
    ["git", "diff", "-U0", "--no-color", "--", "generated-applications"],
    capture_output=True, text=True, check=True,
).stdout

restore, current, real = [], None, False
for line in out.splitlines():
    if line.startswith("diff --git"):
        if current and not real:
            restore.append(current)
        current = line.split(" b/", 1)[1]
        real = False
    elif current and line[:1] in "+-" and not line.startswith(("+++", "---")):
        if not NOISE.search(line):
            real = True
if current and not real:
    restore.append(current)

for start in range(0, len(restore), 500):
    subprocess.run(["git", "checkout", "--", *restore[start:start + 500]], check=True)
print(f"restored {len(restore)} timestamp-only files")
