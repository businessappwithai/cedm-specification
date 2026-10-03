#!/usr/bin/env python3
"""Print the structure of CEDM entities compactly, for writing their help.

    python3 tools/help_skeleton.py Aircraft Account ...
    python3 tools/help_skeleton.py --all-names

Shows what help has to describe — kind, description, attributes (type, required,
target, values), relationships, lifecycle and invariants — and nothing else.
"""
from __future__ import annotations

import pathlib
import re
import sys

import yaml

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import help_quality  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[1]
ENTITY_DIR = ROOT / "domain" / "entities"


def files() -> dict[str, pathlib.Path]:
    found = {}
    for path in sorted(ENTITY_DIR.glob("*.yaml")):
        if path.name == "index.yaml":
            continue
        entity = (yaml.safe_load(path.read_text()) or {}).get("entity") or {}
        if entity.get("name"):
            found[entity["name"]] = path
    return found


STAMPED: dict[str, set[str]] = {}


def todo(where: str) -> str:
    keys = STAMPED.get(where)
    return f"  *{','.join(sorted(keys))}" if keys else ""


def show(name: str, path: pathlib.Path) -> None:
    e = yaml.safe_load(path.read_text())["entity"]
    print(f"## {name} [{e.get('kind')}] — {e.get('description', '').strip()}")
    for a in e.get("attributes") or []:
        bits = [a.get("type", "?")]
        if a.get("required"):
            bits.append("req")
        if a.get("unique"):
            bits.append("unique")
        if a.get("target"):
            bits.append("->" + a["target"])
        if a.get("default") is not None:
            bits.append(f"={a['default']}")
        values = f" {a['values']}" if a.get("values") else ""
        print(f"  a {a['name']}: {' '.join(bits)}{values}{todo(name + '.' + a['name'])}")
    for r in e.get("relationships") or []:
        print(f"  r {r['name']} -> {r.get('target')} {r.get('cardinality')} {r.get('ownership', '')}{todo(name + '.@' + r['name'])}")
    life = e.get("lifecycle") or {}
    if life.get("transitions"):
        moves = ", ".join(f"{t['from']}>{t['to']}" for t in life["transitions"])
        print(f"  L {life.get('attribute')}: {moves}")
    for inv in e.get("invariants") or []:
        text = inv.get("rule") or inv.get("expression") or inv.get("description") if isinstance(inv, dict) else inv
        print(f"  i {str(text)[:140]}")
    if todo(name + ".help"):
        print(f"  h{todo(name + '.help')}")


def load_stamped(index: dict[str, pathlib.Path]) -> None:
    entities = {n: (yaml.safe_load(p.read_text()) or {})["entity"] for n, p in index.items()}
    for where in help_quality.legacy(entities):
        owner, key = where.rsplit(".", 1)
        if ".valueSemantics" in owner:
            owner, key = owner.split(".valueSemantics")[0], "values"
        STAMPED.setdefault(owner, set()).add(key)


if __name__ == "__main__":
    index = files()
    load_stamped(index)
    if sys.argv[1:] == ["--all-names"]:
        print(" ".join(index))
    elif sys.argv[1:] == ["--todo"]:
        owners = sorted({w.split(".")[0] for w in STAMPED})
        print(len(owners), "entities with stamped help:", " ".join(owners))
    else:
        for wanted in sys.argv[1:]:
            show(wanted, index[wanted])
