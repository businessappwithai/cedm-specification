#!/usr/bin/env python3
"""Remove the retired generators' requiredMeaning / optionalMeaning texts.

"Required." and "Optional when another reference supplies identity." restate
the attribute's `required` flag, which every form already shows; written by a
person they would say *why* a value is required. Those that are legacy shapes
(help_quality.legacy) are removed; any an author wrote stays.

    python3 tools/drop_legacy_meanings.py
"""
from __future__ import annotations

import pathlib
import sys
from io import StringIO

import yaml as pyyaml

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import apply_authored as authored  # noqa: E402
import help_quality  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[1]
KEYS = {"requiredMeaning", "optionalMeaning"}

files = {}
entities = {}
for path in sorted((ROOT / "domain" / "entities").glob("*.yaml")):
    if path.name == "index.yaml":
        continue
    entity = pyyaml.safe_load(path.read_text())["entity"]
    files[entity["name"]] = path
    entities[entity["name"]] = entity

targets: dict[str, set[tuple[str, str]]] = {}
for where in help_quality.legacy(entities):
    parts = where.split(".")
    if len(parts) == 3 and parts[2] in KEYS and not parts[1].startswith("@") and parts[1] != "help":
        targets.setdefault(parts[0], set()).add((parts[1], parts[2]))

removed = 0
for name, items in targets.items():
    doc = authored.rt.load(files[name].read_text())
    for attr in doc["entity"]["attributes"]:
        for attr_name, key in items:
            if attr["name"] == attr_name and isinstance(attr.get("help"), dict) and key in attr["help"]:
                del attr["help"][key]
                removed += 1
    buffer = StringIO()
    authored.rt.dump(doc, buffer)
    files[name].write_text(buffer.getvalue())
print(f"removed {removed} restated required/optional meanings from {len(targets)} entities")
