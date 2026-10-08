#!/usr/bin/env python3
"""Validate semantic help coverage for CEDM entity YAML files.

The validator intentionally fails when an entity or field lacks contextual help.
It is designed to keep CEDM's YAML useful to humans, application generators,
form/report designers, and AI agents.

What "has help" means is read from the specification, not written down here:

* the required keys and quality rules from ``specification/help-semantics.yaml``
  (``entityHelp.required``, ``fieldHelp.required``, ``qualityRules``);
* the key aliases from ``specification/dictionary-mapping.yaml``
  (``help.aliases``), which say the library's two shapes of entity help are one
  contract — ``purpose`` is ``businessMeaning``, ``whenUsed`` is ``usage`` and
  so on. A requirement is met by either spelling.

Hard-coding both lists here is how this script came to report 1,500 gaps that
were not gaps: it asked every entity for ``purpose`` *and* ``businessMeaning``,
and 259 of them carried the same text under the other name.

A file that does not parse is an error, not a skip: it holds help nobody can
read, and skipping it reported a cleaner library than there was.

Usage:
    python tools/validate_help.py               # report every gap; exit 1 if any
    python tools/validate_help.py --summary     # counts by rule only
    python tools/validate_help.py --json        # gaps as JSON (what tools/apply_authored.py reads)
    python tools/validate_help.py --entity Account
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
ENTITY_DIR = ROOT / "domain" / "entities"
HELP_SEMANTICS = ROOT / "specification" / "help-semantics.yaml"
DICTIONARY_MAPPING = ROOT / "specification" / "dictionary-mapping.yaml"


def load_contract():
    semantics = yaml.safe_load(HELP_SEMANTICS.read_text(encoding="utf-8"))
    mapping = yaml.safe_load(DICTIONARY_MAPPING.read_text(encoding="utf-8"))
    aliases = {
        key: target
        for key, target in (mapping.get("help", {}).get("aliases") or {}).items()
        if key != "description" and isinstance(target, str)
    }
    quality = semantics.get("qualityRules") or {}
    return {
        "entity": semantics["entityHelp"]["required"],
        "field": semantics["fieldHelp"]["required"],
        "aliases": aliases,
        "entitySummaryWords": int(quality.get("minimumEntitySummaryWords", 3)),
        "fieldSummaryWords": int(quality.get("minimumFieldSummaryWords", 3)),
        "generic": {text.strip().lower() for text in quality.get("genericTextRejected") or []},
    }


def canonical(key, aliases):
    return aliases.get(key, key)


def required_keys(keys, aliases):
    """The required keys with aliases folded, in their declared order."""
    seen, out = set(), []
    for key in keys:
        name = canonical(key, aliases)
        if name not in seen:
            seen.add(name)
            out.append(name)
    return out


def filled(value):
    if isinstance(value, str):
        return bool(value.strip())
    return bool(value)


def present(help_block, aliases):
    """The canonical keys this help block fills, under either spelling."""
    return {canonical(key, aliases) for key, value in help_block.items() if filled(value)}


def words(value):
    return len(value.split()) if isinstance(value, str) else 0


def check_block(help_block, required, min_words, contract, where, gaps, errors):
    if not isinstance(help_block, dict):
        gaps.append({**where, "missing": list(required)})
        errors.append((where, "missing help", f"{where['label']} is missing help"))
        return
    have = present(help_block, contract["aliases"])
    missing = [key for key in required if key not in have]
    if missing:
        gaps.append({**where, "missing": missing})
        for key in missing:
            errors.append((where, f"help missing '{key}'", f"{where['label']} help missing '{key}'"))
    summary = help_block.get("summary")
    if filled(summary) and words(summary) < min_words:
        errors.append((where, "summary too short",
                       f"{where['label']} help summary has {words(summary)} words; the contract asks for {min_words}"))
    for key, value in help_block.items():
        if isinstance(value, str) and value.strip().lower() in contract["generic"]:
            errors.append((where, "generic text", f"{where['label']} help '{key}' is generic text: {value.strip()!r}"))


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--summary", action="store_true", help="print counts by rule only")
    parser.add_argument("--json", action="store_true", help="print the gaps as JSON")
    parser.add_argument("--entity", help="check one entity by name")
    args = parser.parse_args(argv)

    contract = load_contract()
    aliases = contract["aliases"]
    entity_required = required_keys(contract["entity"], aliases)
    field_required = required_keys(contract["field"], aliases)

    errors, gaps = [], []
    checked = 0
    for path in sorted(ENTITY_DIR.glob("*.yaml")):
        if path.name == "index.yaml":
            continue
        rel = str(path.relative_to(ROOT))
        try:
            doc = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        except yaml.YAMLError as exc:
            first = str(exc).splitlines()[0]
            errors.append(({"file": rel, "label": rel}, "YAML error", f"{rel}: YAML error: {first}"))
            continue
        entity = doc.get("entity", {})
        name = entity.get("name", path.stem)
        if args.entity and name != args.entity:
            continue
        checked += 1

        check_block(entity.get("help"), entity_required, contract["entitySummaryWords"], contract,
                    {"file": rel, "entity": name, "target": "entity", "label": f"{rel}: entity '{name}'"},
                    gaps, errors)
        for attr in entity.get("attributes") or []:
            if not isinstance(attr, dict):
                continue
            field = attr.get("name", "<unnamed>")
            check_block(attr.get("help"), field_required, contract["fieldSummaryWords"], contract,
                        {"file": rel, "entity": name, "target": f"attribute:{field}",
                         "label": f"{rel}: field '{field}'"},
                        gaps, errors)

    if args.json:
        print(json.dumps(gaps, indent=2))
        return 1 if errors else 0

    by_rule = Counter(rule for _, rule, _ in errors)
    if errors:
        print("CEDM semantic help validation FAILED")
        if not args.summary:
            print("- " + "\n- ".join(message for _, _, message in errors))
        print(f"{len(errors)} problem(s) in {checked} entities:")
        for rule, count in by_rule.most_common():
            print(f"  {count:6d}  {rule}")
        return 1
    print(f"CEDM semantic help validation PASSED ({checked} entities)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
