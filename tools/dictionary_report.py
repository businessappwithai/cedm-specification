#!/usr/bin/env python3
"""Report how much of the Application Dictionary the specification supplies.

For every dictionary slot named in specification/dictionary-mapping.yaml, count
the entities (or attributes) that state it, derive it by rule, or leave it empty.
Exit status is 1 when a *required* slot is empty — the same condition
tools/validate.py reports as DICT-*, shown here as a coverage figure.

    python tools/dictionary_report.py
"""
from __future__ import annotations

import collections
import pathlib
import sys

import yaml

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import dictionary_lib as d  # noqa: E402


def main() -> int:
    entities = [
        yaml.safe_load(p.read_text())["entity"]
        for p in sorted((d.ROOT / "domain" / "entities").glob("*.yaml"))
        if p.name != "index.yaml"
    ]
    n = len(entities)
    attrs = [(e, a) for e in entities for a in e.get("attributes") or []]
    rels = [(e, r) for e in entities for r in e.get("relationships") or []]
    enums = [(e, a) for e, a in attrs if a.get("values")]
    classes = collections.Counter(d.kind_class(e.get("kind")) for e in entities)

    def pct(k: int, total: int) -> str:
        return f"{k:>5} / {total:<5} {100 * k / total if total else 100:5.1f}%"

    def attr_help(a):
        return a.get("help") if isinstance(a.get("help"), dict) else {}

    rows = [
        ("window.icon        (ui.icon)", sum(1 for e in entities if (e.get("ui") or {}).get("icon") in d.LUCIDE), n),
        ("window.description (help.summary)", sum(1 for e in entities if (e.get("help") or {}).get("summary")), n),
        ("window.help        (businessMeaning|purpose)", sum(1 for e in entities if (e.get("help") or {}).get("businessMeaning") or (e.get("help") or {}).get("purpose")), n),
        ("window.kind class  (resolves)", sum(1 for e in entities if d.kind_classes(e.get("kind"))), n),
        ("field.summary      (attribute help)", sum(1 for _, a in attrs if attr_help(a).get("summary")), len(attrs)),
        ("field.usage        (attribute help)", sum(1 for _, a in attrs if attr_help(a).get("usage")), len(attrs)),
        ("field help on references (relationship help)", sum(1 for _, r in rels if r.get("help")), len(rels)),
        ("list value meanings (every value of an enum)", sum(1 for _, a in enums if {str(v) for v in a["values"]} <= {str(k) for k in (attr_help(a).get("valueSemantics") or {})}), len(enums)),
        ("enumeration tables (one per enumerated attribute)", len(enums), len(enums)),
    ]
    print(f"CEDM → Application Dictionary coverage: {n} entities, {len(attrs)} attributes, {len(rels)} relationships, {len(enums)} enumerations")
    for label, k, total in rows:
        print(f"  {label:<52}{pct(k, total)}")
    print("  kind classes: " + ", ".join(f"{c} {k}" for c, k in sorted(classes.items())))
    return 0 if all(k == total for _, k, total in rows) else 1


if __name__ == "__main__":
    raise SystemExit(main())
