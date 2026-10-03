"""Find help text that was stamped from a template rather than written.

A sentence is stamped when, with the names it is about replaced by
placeholders, the same sentence describes several different entities:
"Captures the business meaning of <field> for the <entity>." says nothing about
any of them. Writing that is specific to a record never collides that way.

`stamped(entities)` returns the paths of every such text in a library. The
library was rewritten by hand; what its old generators produced is recorded in
`tools/legacy-help-shapes.txt`, and `legacy(entities)` returns the help texts
that still have one of those shapes — which `tools/validate.py` refuses
(HELP-001). Shapes are compared, not strings, so a template cannot come back
with only the entity's name changed. Short writing that merely recurs ("At
most one.") is not a template and is not refused.
"""
from __future__ import annotations

import pathlib
import re
from collections import defaultdict

LEGACY_FILE = pathlib.Path(__file__).resolve().parent / "legacy-help-shapes.txt"

# Help of a system column means the same thing on every record that has one.
SHARED_ATTRIBUTES = {"createdAt", "updatedAt", "createdBy", "updatedBy", "version", "rowVersion", "tenantId"}
# A text repeated on at least this many entities is a template.
THRESHOLD = 3


def _words(name: str) -> list[str]:
    spaced = re.sub(r"(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", " ", str(name)).replace("_", " ")
    return [w for w in spaced.split() if w]


def _names(*names: str) -> list[str]:
    """Every spelling of each name a sentence could use, longest first."""
    found: set[str] = set()
    for name in names:
        if not name:
            continue
        words = _words(name)
        found.add(str(name))
        found.add(" ".join(words))
        found.add(" ".join(w.lower() for w in words))
        if len(words) > 1 and words[-1].lower() == "id":
            found.add(" ".join(words[:-1]))
            found.add(" ".join(w.lower() for w in words[:-1]))
    return sorted((n for n in found if n), key=len, reverse=True)


def shape(text: str, *names: str) -> str:
    out = str(text)
    for name in _names(*names):
        out = re.sub(rf"(?<![A-Za-z]){re.escape(name)}(?![a-z])", "#", out, flags=re.IGNORECASE)
    out = re.sub(r"\b(a|an)\s+#", "# ", out, flags=re.IGNORECASE)
    out = re.sub(r"\d+(\.\d+)?|\*", "9", out)
    return re.sub(r"\s+", " ", out).strip().lower()


def texts(name: str, entity: dict):
    """(path, text, names) for every help text of one entity."""
    help_ = entity.get("help") or {}
    for key, value in help_.items():
        if isinstance(value, str):
            yield f"{name}.help.{key}", value, (name,)
    identity = (entity.get("identity") or {}).get("key")
    for attr in entity.get("attributes") or []:
        # A system identifier means the same on every record: its help is shared by design.
        if not isinstance(attr, dict) or attr.get("name") in SHARED_ATTRIBUTES or attr.get("name") == identity:
            continue
        names = (name, attr.get("name", ""), attr.get("target", ""))
        h = attr.get("help") if isinstance(attr.get("help"), dict) else {}
        for key, value in h.items():
            if isinstance(value, str):
                yield f"{name}.{attr.get('name')}.{key}", value, names
        for value, meaning in (h.get("valueSemantics") or {}).items():
            yield f"{name}.{attr.get('name')}.valueSemantics.{value}", str(meaning), names + (str(value),)
    for rel in entity.get("relationships") or []:
        names = (name, rel.get("name", ""), rel.get("target", ""), str(rel.get("cardinality", "")))
        for key, value in (rel.get("help") or {}).items():
            if isinstance(value, str):
                yield f"{name}.@{rel.get('name')}.{key}", value, names


def stamped(entities: dict[str, dict]) -> dict[str, str]:
    """Every templated text, keyed by path."""
    owners: dict[str, set[str]] = defaultdict(set)
    seen = []
    for name, entity in entities.items():
        for path, text, names in texts(name, entity):
            key = shape(text, *names)
            owners[key].add(name)
            seen.append((path, text, key))
    return {path: text for path, text, key in seen if len(owners[key]) >= THRESHOLD}


def legacy_shapes() -> set[str]:
    lines = LEGACY_FILE.read_text().splitlines() if LEGACY_FILE.exists() else []
    return {line for line in lines if line and not line.startswith("#")}


def legacy(entities: dict[str, dict]) -> dict[str, str]:
    """Every help text with the shape of one the retired generators wrote, keyed by path."""
    shapes = legacy_shapes()
    found: dict[str, str] = {}
    for name, entity in entities.items():
        for path, text, names in texts(name, entity):
            if shape(text, *names) in shapes:
                found[path] = text
    return found
