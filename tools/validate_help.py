#!/usr/bin/env python3
"""Validate that every entity, attribute and relationship carries written help.

The Application Dictionary shows this help on every window, tab and field, so a
missing or stamped text is a screen that tells its user nothing. Keys are the
canonical ones (`tools/dictionary_lib.py` HELP_ALIASES maps the older names);
an older name is accepted where its canonical one is absent.

  Entity        summary, businessMeaning, usage, example; lifecycle when the
                entity has one; relationshipContext when it has relationships
  Attribute     summary, usage
  Relationship  summary, usage, cardinalityMeaning
  Any text      not the shape of a retired template (tools/help_quality.py)
"""
from __future__ import annotations

import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
import dictionary_lib as dictlib  # noqa: E402
import help_quality  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
ENTITY_DIR = ROOT / "domain" / "entities"
CANONICAL = {canonical: alias for alias, canonical in dictlib.HELP_ALIASES.items()}


def written(help_block: dict, key: str) -> bool:
    for k in (key, CANONICAL.get(key)):
        value = help_block.get(k) if k else None
        if isinstance(value, str) and value.strip():
            return True
    return False


def main() -> int:
    errors: list[str] = []
    entities: dict[str, dict] = {}
    for path in sorted(ENTITY_DIR.glob("*.yaml")):
        if path.name == "index.yaml":
            continue
        entity = (yaml.safe_load(path.read_text(encoding="utf-8")) or {}).get("entity", {})
        name = entity.get("name", path.stem)
        entities[name] = entity

        help_block = entity.get("help") or {}
        required = ["summary", "businessMeaning", "usage", "example"]
        if entity.get("lifecycle"):
            required.append("lifecycle")
        if entity.get("relationships"):
            required.append("relationshipContext")
        for key in required:
            if not written(help_block, key):
                errors.append(f"{name}: help needs {key}")
        if len(str(help_block.get("summary", "")).split()) < 3:
            errors.append(f"{name}: help summary is too short to say what the record is")

        for attr in entity.get("attributes") or []:
            fh = attr.get("help") or {}
            for key in ("summary", "usage"):
                if not written(fh, key):
                    errors.append(f"{name}.{attr.get('name')}: help needs {key}")

        for rel in entity.get("relationships") or []:
            rh = rel.get("help") or {}
            for key in ("summary", "usage", "cardinalityMeaning"):
                if not written(rh, key):
                    errors.append(f"{name}.@{rel.get('name')}: help needs {key}")

    for where, text in sorted(help_quality.legacy(entities).items()):
        errors.append(f"{where}: template help text {text!r}")

    if errors:
        print("CEDM help validation FAILED")
        print("- " + "\n- ".join(errors))
        return 1
    print(f"CEDM help validation PASSED: {len(entities)} entities")
    return 0


if __name__ == "__main__":
    sys.exit(main())
