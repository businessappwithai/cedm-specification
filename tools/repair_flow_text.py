#!/usr/bin/env python3
"""Repair prose that a YAML flow mapping split at its commas.

An entity file written as

    - {id: SALES-ORDER-006, rule: requires customer, currency, product and tax context.}

is not one rule: in a flow mapping a comma ends the value, so YAML reads
`rule: requires customer` and then three keys, `currency`, `product and tax
context.`, each with a null value. The text is silently cut short, and every
reader — the validator, the generators, a person reading the parsed model —
sees the truncated rule.

This tool rejoins the fragments (each null-valued key that follows a text value
is the continuation of that text, in order) and rewrites the line with the text
quoted, leaving every other line of the file byte-for-byte as it was. A line it
cannot reconstruct is reported, not guessed at.

Usage:
    python tools/repair_flow_text.py            # repair in place, print a summary
    python tools/repair_flow_text.py --check    # report only; exit 1 if anything is split
"""
from __future__ import annotations

import json
import pathlib
import re
import sys

import yaml

ROOT = pathlib.Path(__file__).resolve().parents[1]
ENTITY_DIR = ROOT / "domain" / "entities"

PLAIN = re.compile(r"^[A-Za-z0-9_][A-Za-z0-9_ ./()'+-]*$")
RESERVED = {"true", "false", "null", "yes", "no", "on", "off", "~"}


def is_split(value) -> bool:
    """Whether a parsed mapping (at any depth) carries a fragment of split text."""
    if isinstance(value, dict):
        return any(v is None for v in value.values()) or any(is_split(v) for v in value.values())
    if isinstance(value, list):
        return any(is_split(v) for v in value)
    return False


def rejoin(value):
    """Fold each null-valued key back into the text value before it."""
    if isinstance(value, list):
        return [rejoin(v) for v in value]
    if not isinstance(value, dict):
        return value
    out: dict = {}
    last_text_key = None
    for key, item in value.items():
        if item is None and last_text_key is not None:
            out[last_text_key] = f"{out[last_text_key]}, {key}"
            continue
        out[key] = rejoin(item)
        last_text_key = key if isinstance(out[key], str) else None
    return out


def scalar(value) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if value is None:
        return "null"
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value)
    if PLAIN.match(text) and text.lower() not in RESERVED and not re.match(r"^[0-9.]+$", text):
        return text
    return json.dumps(text, ensure_ascii=False)


def flow(value) -> str:
    if isinstance(value, dict):
        return "{" + ", ".join(f"{k}: {flow(v)}" for k, v in value.items()) + "}"
    if isinstance(value, list):
        return "[" + ", ".join(flow(v) for v in value) + "]"
    return scalar(value)


LINE = re.compile(r"^(?P<indent>\s*)(?P<dash>- )?(?:(?P<key>[A-Za-z_][\w-]*): )?(?P<body>\{.*\})\s*$")


def repair_line(line: str):
    """The repaired line, or None when the line holds no split text."""
    match = LINE.match(line)
    if not match:
        return None
    try:
        parsed = yaml.safe_load(match["body"])
    except yaml.YAMLError:
        return None
    if not is_split(parsed):
        return None
    fixed = rejoin(parsed)
    if is_split(fixed):
        raise ValueError("fragments with no text before them")
    prefix = match["indent"] + (match["dash"] or "") + (f"{match['key']}: " if match["key"] else "")
    return prefix + flow(fixed)


def main() -> int:
    check = "--check" in sys.argv[1:]
    repaired = unrepairable = 0
    files = 0
    for path in sorted(ENTITY_DIR.glob("*.yaml")):
        lines = path.read_text(encoding="utf-8").split("\n")
        changed = False
        for number, line in enumerate(lines):
            try:
                fixed = repair_line(line)
            except ValueError as exc:
                print(f"{path.relative_to(ROOT)}:{number + 1}: cannot repair: {exc}")
                unrepairable += 1
                continue
            if fixed is None:
                continue
            repaired += 1
            if check:
                print(f"{path.relative_to(ROOT)}:{number + 1}: text split at a comma")
                continue
            lines[number] = fixed
            changed = True
        if changed:
            files += 1
            path.write_text("\n".join(lines), encoding="utf-8")
    verb = "split" if check else "repaired"
    print(f"{repaired} line(s) {verb} in {files if not check else 'checked'} file(s); {unrepairable} unrepairable")
    return 1 if (check and repaired) or unrepairable else 0


if __name__ == "__main__":
    raise SystemExit(main())
