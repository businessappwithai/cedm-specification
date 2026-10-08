#!/usr/bin/env python3
"""Print what an entity declares, and which of its help is still template filler.

    python tools/help_skeleton.py Account Address        # by entity name
    python tools/help_skeleton.py --next 8               # the next 8 entities with filler
    python tools/help_skeleton.py --todo                 # names of every entity with filler left
"""
from __future__ import annotations

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import help_shapes as hs  # noqa: E402


def filler_index():
    seen, rows = hs.scan()
    bad = {(w, k) for w, k, _ in hs.filler_rows(seen, rows)}
    return bad


def flags(bad, where, help_):
    return " ".join(f"{k}{'*' if (where, k) in bad else ''}" for k in (help_ or {}))


def show(entity: dict, bad) -> None:
    n = entity["name"]
    print(f"## {n}  kind={entity.get('kind')}  icon={(entity.get('ui') or {}).get('icon')}")
    print(f"   {entity.get('description')}")
    print(f"   EH: {flags(bad, n, entity.get('help'))}")
    for key, value in (entity.get("help") or {}).items():
        if (n, key) not in bad:
            print(f"      keep {key}: {value}")
    for a in entity.get("attributes") or []:
        bits = [a.get("type", "?")]
        for flag in ("required", "unique", "immutable"):
            if a.get(flag):
                bits.append(flag)
        for k in ("maxLength", "default", "target", "min", "max", "precision", "scale", "unit"):
            if a.get(k) is not None:
                bits.append(f"{k}={a[k]}")
        if a.get("values"):
            bits.append("values=" + ",".join(map(str, a["values"])))
        where = f"{n}.{a['name']}"
        print(f"   A {a['name']} [{' '.join(bits)}]  {flags(bad, where, a.get('help'))}")
        for key, value in (a.get("help") or {}).items():
            if key == "valueSemantics" and isinstance(value, dict):
                real = {v: t for v, t in value.items() if (f"{where}[{v}]", "valueSemantics") not in bad}
                for v, t in real.items():
                    print(f"      keep valueSemantics[{v}]: {t}")
            elif (where, key) not in bad:
                print(f"      keep {key}: {value}")
    for r in entity.get("relationships") or []:
        where = f"{n}.{r['name']}"
        print(f"   R {r['name']} -> {r.get('target')} {r.get('cardinality')} {r.get('ownership')}  {flags(bad, where, r.get('help'))}")
        for key, value in (r.get("help") or {}).items():
            if (where, key) not in bad:
                print(f"      keep {key}: {value}")
    for inv in entity.get("invariants") or []:
        print(f"   I {inv.get('id')}: {inv.get('rule')}")
    lc = entity.get("lifecycle")
    if lc:
        edges = " ".join(f"{t['from']}>{t['to']}({t.get('action')})" for t in lc.get("transitions") or [])
        print(f"   L {lc.get('attribute')} initial={lc.get('initial')} terminal={lc.get('terminal')} {edges}")
    print()


def main(argv: list[str]) -> int:
    bad = filler_index()
    entities = {e["name"]: e for _, e in hs.load()}
    todo = sorted({w.split(".")[0].split("[")[0] for w, _ in bad})
    if "--todo" in argv:
        print("\n".join(todo))
        return 0
    if "--next" in argv:
        count = int(argv[argv.index("--next") + 1])
        names = todo[:count]
    else:
        names = [a for a in argv if not a.startswith("--")]
    for name in names:
        if name not in entities:
            print(f"?? no entity {name}")
            continue
        show(entities[name], bad)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
