#!/usr/bin/env python3
"""Find help that exists but is incomplete, or too thin to say anything.

    python tools/help_audit.py [--thin] [Entity ...]

Always checks: an entity has summary, businessMeaning and usage; an attribute has
summary and usage; a relationship has summary, usage and a statement of cardinality
or role; an enumeration has a meaning for every value.

--thin also lists texts too short to carry information: an attribute whose summary
and usage together are under 14 words, a relationship under 12 across summary,
usage and cardinality, an enum value meaning under 4 words.
"""
from __future__ import annotations

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import help_shapes as hs  # noqa: E402


def words(*texts) -> int:
    return sum(len(str(t).split()) for t in texts if t)


def audit(entity: dict, thin: bool) -> list[str]:
    n = entity["name"]
    out = []
    h = entity.get("help") or {}
    for key in ("summary", "usage"):
        if not h.get(key):
            out.append(f"{n}: entity help has no {key}")
    if not (h.get("businessMeaning") or h.get("purpose")):
        out.append(f"{n}: entity help has no businessMeaning")
    for a in entity.get("attributes") or []:
        ah = a.get("help") or {}
        for key in ("summary", "usage"):
            if not ah.get(key):
                out.append(f"{n}.{a['name']}: no {key}")
        if thin and words(ah.get("summary"), ah.get("usage")) < 14:
            out.append(f"{n}.{a['name']}: thin ({words(ah.get('summary'), ah.get('usage'))} words)")
        if a.get("values"):
            vs = ah.get("valueSemantics") or {}
            for v in a["values"]:
                if str(v) not in {str(k) for k in vs}:
                    out.append(f"{n}.{a['name']}: no meaning for {v}")
                elif thin and words(vs.get(v)) < 4:
                    out.append(f"{n}.{a['name']}[{v}]: thin")
    for r in entity.get("relationships") or []:
        rh = r.get("help") or {}
        for key in ("summary", "usage"):
            if not rh.get(key):
                out.append(f"{n}.{r['name']}: relationship has no {key}")
        if not (rh.get("cardinalityMeaning") or rh.get("workflowRole") or rh.get("context")):
            out.append(f"{n}.{r['name']}: relationship says nothing about cardinality or role")
        if thin and words(rh.get("summary"), rh.get("usage"), rh.get("cardinalityMeaning"), rh.get("workflowRole")) < 12:
            out.append(f"{n}.{r['name']}: thin relationship")
    return out


def main(argv: list[str]) -> int:
    thin = "--thin" in argv
    only = {a for a in argv if not a.startswith("--")}
    total = 0
    for _, e in hs.load():
        if only and e["name"] not in only:
            continue
        for line in audit(e, thin):
            print(line)
            total += 1
    print(f"{total} finding(s)")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
