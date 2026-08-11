#!/usr/bin/env python3
"""Validate semantic help coverage for CEDM entity YAML files.

The validator intentionally fails when an entity or field lacks contextual help.
It is designed to keep CEDM's YAML useful to humans, application generators,
form/report designers, and AI agents.
"""
from pathlib import Path
import sys
import yaml

ROOT = Path(__file__).resolve().parents[1]
ENTITY_DIR = ROOT / "domain" / "entities"
REQUIRED_ENTITY = ["summary", "purpose", "businessMeaning", "whenUsed", "howItRelates", "lifecycleUsage", "commonProcesses", "commonExamples"]
REQUIRED_FIELD = ["summary", "businessMeaning", "usage", "relationshipContext"]


def meaningful(value):
    return isinstance(value, str) and len(value.split()) >= 3


def main():
    errors = []
    for path in sorted(ENTITY_DIR.glob("*.yaml")):
        if path.name in {"index.yaml"}:
            continue
        try:
            doc = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        except Exception as exc:
            errors.append(f"{path}: YAML error: {exc}")
            continue
        entity = doc.get("entity", {})
        name = entity.get("name", path.stem)
        help_block = entity.get("help")
        if not isinstance(help_block, dict):
            errors.append(f"{path}: entity '{name}' is missing help")
        else:
            for key in REQUIRED_ENTITY:
                if key not in help_block or not help_block[key]:
                    errors.append(f"{path}: entity '{name}' help missing '{key}'")
            if not meaningful(help_block.get("summary", "")):
                errors.append(f"{path}: entity '{name}' help summary is too short")

        for attr in entity.get("attributes", []) or []:
            if not isinstance(attr, dict):
                continue
            field = attr.get("name", "<unnamed>")
            fh = attr.get("help")
            if not isinstance(fh, dict):
                errors.append(f"{path}: field '{field}' is missing help")
                continue
            for key in REQUIRED_FIELD:
                if key not in fh or not fh[key]:
                    errors.append(f"{path}: field '{field}' help missing '{key}'")
            if not meaningful(fh.get("summary", "")):
                errors.append(f"{path}: field '{field}' help summary is too short")
            if attr.get("type") in {"reference", "money"} and "relationshipContext" not in fh:
                errors.append(f"{path}: field '{field}' needs relationshipContext help")

    if errors:
        print("CEDM semantic help validation FAILED")
        print("- " + "\n- ".join(errors))
        return 1
    print("CEDM semantic help validation PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
