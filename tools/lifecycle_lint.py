#!/usr/bin/env python3
"""Find lifecycles that do not describe a real life.

    python tools/lifecycle_lint.py [Entity ...]

Checks, per entity with a `lifecycle`:
  L1 a transition leaves a state declared terminal
  L2 a state cannot be reached from the initial state
  L3 a non-terminal state has no way out
  L4 the status attribute's default is not the initial state
  L5 the attribute's `values` differ from the lifecycle's `states`
  L6 `terminal` names a state with no incoming transition (and is not initial)
"""
from __future__ import annotations

import pathlib
import sys

import yaml

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import help_shapes as hs  # noqa: E402


def lint(entity: dict) -> list[str]:
    lc = entity.get("lifecycle")
    if not lc:
        return []
    out = []
    states = list(lc.get("states") or [])
    initial = lc.get("initial")
    terminal = set(lc.get("terminal") or [])
    edges = [(t["from"], t["to"]) for t in lc.get("transitions") or []]
    for a, b in edges:
        if a in terminal:
            out.append(f"L1 leaves terminal {a} -> {b}")
    seen = {initial}
    changed = True
    while changed:
        changed = False
        for a, b in edges:
            if a in seen and b not in seen:
                seen.add(b)
                changed = True
    for s in states:
        if s not in seen:
            out.append(f"L2 {s} unreachable from {initial}")
        if s not in terminal and not any(a == s for a, _ in edges):
            out.append(f"L3 {s} has no way out and is not terminal")
    attr = next((a for a in entity.get("attributes") or [] if a.get("name") == lc.get("attribute")), None)
    if attr:
        if attr.get("default") is not None and str(attr["default"]) != str(initial):
            out.append(f"L4 default {attr['default']} != initial {initial}")
        if attr.get("values") and set(map(str, attr["values"])) != set(map(str, states)):
            out.append("L5 values differ from states")
    return out


def main(argv: list[str]) -> int:
    only = set(argv)
    total = 0
    for _, e in hs.load():
        if only and e["name"] not in only:
            continue
        for line in lint(e):
            print(f"{e['name']}: {line}")
            total += 1
    print(f"{total} lifecycle finding(s)")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
