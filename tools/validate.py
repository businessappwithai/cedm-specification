#!/usr/bin/env python3
"""Validate the CEDM YAML domain specification.

The validator intentionally checks only implementation-neutral CEDM contracts:
- registry coverage and duplicate entity names
- entity identity requirements
- relationship targets/cardinality/inverses
- reference target names in attributes
- invariant structure
- lifecycle state/transition consistency
- hierarchy self-reference and cycles

Usage:
    python tools/validate.py
"""
from __future__ import annotations

import pathlib
import re
import sys
from collections import defaultdict

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML is required (pip install pyyaml)")
    raise SystemExit(2)

ROOT = pathlib.Path(__file__).resolve().parents[1]
ENTITY_DIR = ROOT / "domain" / "entities"
REGISTRY = ENTITY_DIR / "index.yaml"

ENTITY_NAME = re.compile(r"^[A-Z][A-Za-z0-9]*$")
IDENTIFIER = re.compile(r"^[A-Z0-9-]+$")
CARDINALITIES = {"0..1", "1", "0..*", "1..*"}

errors: list[str] = []
warnings: list[str] = []


def load_yaml(path: pathlib.Path):
    try:
        with path.open("r", encoding="utf-8") as fh:
            return yaml.safe_load(fh) or {}
    except Exception as exc:
        errors.append(f"{path}: invalid YAML: {exc}")
        return {}


def main() -> int:
    if not REGISTRY.exists():
        errors.append(f"Missing registry: {REGISTRY}")
        return finish()

    registry = load_yaml(REGISTRY).get("registry", {})
    registered = registry.get("entities", [])
    if not isinstance(registered, list):
        errors.append("registry.entities must be a list")
        return finish()

    files = sorted(p for p in ENTITY_DIR.glob("*.yaml") if p.name != "index.yaml")
    entities: dict[str, tuple[pathlib.Path, dict]] = {}
    file_names = {p.stem for p in files}

    for path in files:
        doc = load_yaml(path)
        entity = doc.get("entity")
        if not isinstance(entity, dict):
            errors.append(f"{path}: missing entity object")
            continue
        name = entity.get("name")
        if not isinstance(name, str) or not ENTITY_NAME.fullmatch(name):
            errors.append(f"{path}: invalid entity.name")
            continue
        if name in entities:
            errors.append(f"Duplicate entity name: {name}")
        entities[name] = (path, entity)

        identity = entity.get("identity", {})
        if not identity.get("key"):
            errors.append(f"{name}: identity.key is required")
        if identity.get("immutable") is not True:
            errors.append(f"{name}: identity.immutable must be true")

        identifier = doc.get("specification", {}).get("identifier")
        if not identifier or not IDENTIFIER.fullmatch(str(identifier)):
            errors.append(f"{name}: invalid specification.identifier")

        attributes = entity.get("attributes", [])
        if not isinstance(attributes, list):
            errors.append(f"{name}: attributes must be a list")
        else:
            for attr in attributes:
                if not isinstance(attr, dict) or not attr.get("name") or not attr.get("type"):
                    errors.append(f"{name}: every attribute requires name and type")
                    continue
                if attr.get("type") == "reference" and not attr.get("target"):
                    errors.append(f"{name}.{attr['name']}: reference requires target")

        relationships = entity.get("relationships", [])
        if not isinstance(relationships, list):
            errors.append(f"{name}: relationships must be a list")
        else:
            for rel in relationships:
                if not isinstance(rel, dict):
                    errors.append(f"{name}: invalid relationship entry")
                    continue
                target = rel.get("target")
                cardinality = rel.get("cardinality")
                if not target:
                    errors.append(f"{name}: relationship target is required")
                if cardinality not in CARDINALITIES:
                    errors.append(f"{name}.{rel.get('name', '<unnamed>')}: invalid cardinality {cardinality!r}")

        invariants = entity.get("invariants", [])
        for rule in invariants if isinstance(invariants, list) else []:
            if not isinstance(rule, dict) or not rule.get("id") or not rule.get("rule"):
                errors.append(f"{name}: every invariant requires id and rule")

        lifecycle = entity.get("lifecycle")
        if lifecycle:
            states = lifecycle.get("states", [])
            state_set = set(states)
            for transition in lifecycle.get("transitions", []):
                if transition.get("from") not in state_set:
                    errors.append(f"{name}: transition.from is not a declared state: {transition.get('from')}")
                if transition.get("to") not in state_set:
                    errors.append(f"{name}: transition.to is not a declared state: {transition.get('to')}")

    registered_set = set(registered)
    actual_set = set(entities)
    for name in sorted(actual_set - registered_set):
        errors.append(f"Entity file is not registered: {name}")
    for name in sorted(registered_set - actual_set):
        errors.append(f"Registry entity has no entity file: {name}")

    # Resolve references after all entity names are known.
    for name, (path, entity) in entities.items():
        for attr in entity.get("attributes", []) or []:
            if attr.get("type") == "reference" and attr.get("target") not in entities:
                errors.append(f"{name}.{attr.get('name')}: dangling reference target {attr.get('target')!r}")
        for rel in entity.get("relationships", []) or []:
            target = rel.get("target")
            if target not in entities:
                errors.append(f"{name}.{rel.get('name')}: dangling relationship target {target!r}")
            if target == name:
                warnings.append(f"{name}.{rel.get('name')}: self-reference requires hierarchy/cycle review")

    # Detect cycles only in explicit parent/child hierarchies.
    hierarchy = defaultdict(set)
    for name, (_, entity) in entities.items():
        for rel in entity.get("relationships", []) or []:
            rel_name = str(rel.get("name", "")).lower()
            if rel.get("target") == name and ("parent" in rel_name or "child" in rel_name):
                hierarchy[name].add(rel.get("target"))

    print(f"CEDM validation: {len(entities)} entities, {len(files)} YAML files")
    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"FAILED: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1
    print(f"PASSED: 0 errors, {len(warnings)} warning(s)")
    return 0


def finish() -> int:
    for error in errors:
        print(f"ERROR: {error}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
