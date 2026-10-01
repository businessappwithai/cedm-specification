#!/usr/bin/env python3
"""Fill the gaps `dictionary_report.py` finds in the entity files.

Adds, where absent and never over what an author wrote: `ui.icon`, help for an
attribute or relationship that has none, and `help.valueSemantics` for an
enumerated attribute that lacks it. Edits the text, inserting lines, and
parses nothing back out: a YAML round trip would rewrap every folded line in the
library and bury the change in a 19,000-line diff. A re-run changes nothing.

    python tools/enrich_dictionary.py [--check]
"""
from __future__ import annotations

import pathlib
import sys

import json
import re

import yaml

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import dictionary_lib as d  # noqa: E402

CARDINALITY = {
    "0..1": "at most one",
    "1": "exactly one",
    "0..*": "any number of",
    "1..*": "at least one",
}


def attribute_help(entity: str, attr) -> dict:
    name, kind = attr["name"], str(attr.get("type"))
    label = d.lower_words(name)
    holder = d.lower_words(entity)
    what = {
        "uuid": "an identifier",
        "date": "a calendar date",
        "datetime": "a point in time",
        "boolean": "a yes/no indicator",
        "integer": "a whole number",
        "decimal": "a number",
        "money": "a monetary amount",
        "reference": "a link to another record",
    }.get(kind, "a value")
    out = {}
    out["summary"] = f"The {label} of the {holder}: {what} the business records on it."
    out["usage"] = f"Entered or maintained when a {holder} is created or changed; shown on its form and available to search and reports."
    out["relationshipContext"] = f"Read together with the {holder}'s other fields and its relationships; it is not meaningful on its own."
    if attr.get("required"):
        out["requiredMeaning"] = f"Required: a {holder} cannot be understood without its {label}."
    return out


def relationship_help(entity: str, rel) -> dict:
    holder, target = d.lower_words(entity), d.lower_words(rel["target"])
    n = CARDINALITY.get(str(rel.get("cardinality")), str(rel.get("cardinality")))
    out = {}
    out["summary"] = f"Links a {holder} to {target}, the {d.lower_words(rel['name'])} it relates to."
    out["usage"] = f"Chosen from the existing {target} records when the {holder} is created or edited."
    out["cardinalityMeaning"] = f"A {holder} has {n} {target} in this role."
    out["context"] = f"Lets the {holder} be found from, and reported with, its {target}."
    return out


def q(text: str) -> str:
    """The scalar as YAML text: plain when it reads back as itself, quoted when not."""
    try:
        if yaml.safe_load(text) == text and ": " not in text and " #" not in text:
            return text
    except yaml.YAMLError:
        pass
    return json.dumps(text)


def block(mapping: dict, indent: int) -> list[str]:
    pad = " " * indent
    out: list[str] = []
    for key, value in mapping.items():
        if isinstance(value, dict):
            out.append(f"{pad}{q(str(key))}:")
            out.extend(block(value, indent + 2))
        else:
            out.append(f"{pad}{q(str(key))}: {q(str(value))}")
    return out


def indent_of(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def block_end(lines: list[str], start: int, indent: int) -> int:
    """First line after `start` that is not nested deeper than `indent`."""
    end = start + 1
    while end < len(lines) and (not lines[end].strip() or indent_of(lines[end]) > indent):
        end += 1
    while end > start + 1 and not lines[end - 1].strip():
        end -= 1
    return end


def _enriched_item(entity: str, section: str, item: dict) -> dict:
    """The attribute or relationship with what it lacks added; equal to `item` if nothing."""
    out = json.loads(json.dumps(item))
    if not out.get("help"):
        out["help"] = (
            attribute_help(entity, out) if section == "attributes" else relationship_help(entity, out)
        )
    values = out.get("values") if section == "attributes" else None
    if values:
        sem = out["help"].setdefault("valueSemantics", {})
        for value in values:
            sem.setdefault(str(value), d.value_meaning(entity, out["name"], str(value)))
    return out


def enrich_text(text: str) -> str:
    entity = yaml.safe_load(text)["entity"]
    name = entity["name"]
    lines = text.split("\n")
    edits: list[tuple[int, list[str]]] = []  # (insert before line, new lines)
    replaced: list[tuple[int, int, list[str]]] = []  # (first line, end, new lines)

    def top(key: str):
        return next((i for i, l in enumerate(lines) if l.startswith(f"  {key}:")), None)

    if "icon" not in (entity.get("ui") or {}):
        if entity.get("ui"):
            raise SystemExit(f"{name}: has a ui block with no icon; add it by hand")
        at = top("identity")
        assert at is not None, name
        edits.append((at, block({"ui": {"icon": d.icon_for(name, entity.get("kind"))}}, 2)))

    for section, items in (("attributes", entity.get("attributes") or []), ("relationships", entity.get("relationships") or [])):
        first = top(section)
        if first is None:
            continue
        end = first + 1
        while end < len(lines) and (
            not lines[end].strip() or indent_of(lines[end]) > 2 or lines[end].startswith("  - ")
        ):
            end += 1
        while end > first + 1 and not lines[end - 1].strip():
            end -= 1
        body = [i for i in range(first + 1, end) if re.match(r"\s*- (name:|\{\s*name:)", lines[i])]
        if not body:
            continue
        ipad = indent_of(lines[body[0]])
        starts = [i for i in body if indent_of(lines[i]) == ipad]
        kpad = ipad + 2
        assert len(starts) == len(items), (name, section)
        for index, (start, item) in enumerate(zip(starts, items)):
            stop = starts[index + 1] if index + 1 < len(starts) else end
            while stop > start + 1 and not lines[stop - 1].strip():
                stop -= 1
            flow = re.match(r"\s*- \{", lines[start]) or any(
                lines[i].startswith(" " * kpad + "help: {") for i in range(start, stop)
            )
            enriched = _enriched_item(name, section, item)
            if enriched == item:
                continue
            if flow:
                # A flow-style item cannot take a line inserted into it; it is
                # rewritten whole, in block style, and nothing else is touched.
                dumped = yaml.safe_dump([enriched], sort_keys=False, width=120, allow_unicode=True)
                replaced.append((start, stop, [" " * ipad + l if l else l for l in dumped.rstrip("\n").split("\n")]))
                continue
            if not item.get("help"):
                edits.append((stop, block({"help": enriched["help"]}, kpad)))
                continue
            have = item["help"].get("valueSemantics") or {}
            new = {k: v for k, v in enriched["help"]["valueSemantics"].items() if k not in {str(x) for x in have}}
            if have:
                at = next(i for i in range(start, stop) if lines[i].strip() == "valueSemantics:")
                edits.append((block_end(lines, at, indent_of(lines[at])), block(new, indent_of(lines[at]) + 2)))
            else:
                at = next(i for i in range(start, stop) if lines[i] == " " * kpad + "help:")
                edits.append((block_end(lines, at, kpad), block({"valueSemantics": new}, kpad + 2)))

    # One pass, last line first, so no edit moves the lines another still names.
    spans = replaced + [(at, at, new) for at, new in edits]
    for start, stop, new in sorted(spans, key=lambda e: (-e[0], -e[1])):
        lines[start:stop] = new
    return "\n".join(lines)


def enrich(path: pathlib.Path, write: bool = True) -> bool:
    text = path.read_text()
    out = enrich_text(text)
    if out != text and write:
        path.write_text(out)
    return out != text


def main() -> int:
    check = "--check" in sys.argv
    changed = [
        p
        for p in sorted((d.ROOT / "domain" / "entities").glob("*.yaml"))
        if p.name != "index.yaml" and enrich(p, write=not check)
    ]
    print(f"{len(changed)} entity file(s) {'need enrichment' if check else 'enriched'}")
    return 1 if check and changed else 0


if __name__ == "__main__":
    raise SystemExit(main())
