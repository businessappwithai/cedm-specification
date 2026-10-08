#!/usr/bin/env python3
"""Find help text that is a template with the names filled in, not authored prose.

A template text is the same sentence in many entities with only the entity, the
field or the target swapped, so its *shape* — the text with those names replaced
by placeholders — repeats. Authored prose does not: a sentence that says something
true about one concept is not also true of forty others.

    python tools/help_shapes.py            # summary: filler shapes and where they occur
    python tools/help_shapes.py --check    # exit 1 if any help text is filler (HELP-001)
    python tools/help_shapes.py --write-legacy   # (re)build tools/help-legacy-shapes.txt

`tools/help-legacy-shapes.txt` lists the shapes the earlier template generators
stamped. A text matching one is filler however few times it occurs, which is what
lets `--check` run on a single new entity.
"""
from __future__ import annotations

import collections
import pathlib
import re
import sys

import yaml

ROOT = pathlib.Path(__file__).resolve().parents[1]
ENTITIES = ROOT / "domain" / "entities"
LEGACY = pathlib.Path(__file__).with_name("help-legacy-shapes.txt")
THRESHOLD = 3  # distinct entities that must share a shape before it counts as a template


def words(name: str) -> str:
    return re.sub(r"(?<=[a-z0-9])(?=[A-Z])", " ", name).lower()


def shape(text: str, entity: str, own: str | None, targets: tuple[str, ...], kind: str | None = None) -> str:
    """The text with every name that varies between entities replaced by a placeholder."""
    out = " ".join(str(text).split())

    def swap(name: str | None, mark: str) -> None:
        nonlocal out
        if not name:
            return
        for form in {name, words(name), words(name).replace(" ", "_")}:
            out = re.sub(rf"\b{re.escape(form)}\b", mark, out, flags=re.I)

    # Longest first, so "stateProvince" goes before "state".
    for target in sorted({t for t in targets if t}, key=len, reverse=True):
        swap(target, "#")
    swap(entity, "#")
    if kind:
        swap(kind.replace("_", " ").replace("entity", "").strip(), "~")
    swap(own, "@")
    out = re.sub(r"\b(?:a|an|the) #", "#", out)
    return out


def texts(entity: dict):
    """Yield (location, key, text, own-name, targets) for every help string."""
    name = entity["name"]
    help_ = entity.get("help") or {}
    related = tuple(r.get("target") for r in entity.get("relationships") or [])
    for key, value in help_.items():
        yield f"{name}", key, value, None, related
    for attr in entity.get("attributes") or []:
        for key, value in (attr.get("help") or {}).items():
            if key == "valueSemantics" and isinstance(value, dict):
                for val, text in value.items():
                    yield f"{name}.{attr['name']}[{val}]", "valueSemantics", text, str(val), (attr.get("target"), attr["name"])
            else:
                yield f"{name}.{attr['name']}", key, value, attr["name"], (attr.get("target"),)
    for rel in entity.get("relationships") or []:
        for key, value in (rel.get("help") or {}).items():
            yield f"{name}.{rel['name']}", key, value, rel["name"], (rel.get("target"),)
    for inv in entity.get("invariants") or []:
        pass


def load():
    for path in sorted(ENTITIES.glob("*.yaml")):
        if path.name == "index.yaml":
            continue
        yield path, yaml.safe_load(path.read_text())["entity"]


def legacy_shapes() -> set[str]:
    if not LEGACY.exists():
        return set()
    return {line.rstrip("\n") for line in LEGACY.read_text().splitlines() if line and not line.startswith("//")}


def scan():
    seen: dict[tuple[str, str], set[str]] = collections.defaultdict(set)
    rows = []
    for _, entity in load():
        for where, key, value, own, targets in texts(entity):
            if not isinstance(value, str):
                continue
            s = shape(value, entity["name"], own, targets, entity.get("kind"))
            seen[(key, s)].add(entity["name"])
            rows.append((where, key, s, value))
    return seen, rows


def filler_rows(seen, rows):
    legacy = legacy_shapes()
    for where, key, s, value in rows:
        if s in legacy or len(seen[(key, s)]) >= THRESHOLD:
            yield where, key, value


def main(argv: list[str]) -> int:
    seen, rows = scan()
    if "--write-legacy" in argv:
        shapes = sorted({s for (key, s), ents in seen.items() if len(ents) >= THRESHOLD})
        LEGACY.write_text("// Shapes the template generators stamped. Regenerate with --write-legacy only\n"
                          "// from a checkout that still holds the template text.\n" + "\n".join(shapes) + "\n")
        print(f"{len(shapes)} shapes written")
        return 0
    bad = list(filler_rows(seen, rows))
    if "--check" in argv:
        for where, key, value in bad[:40]:
            print(f"HELP-001 {where}.{key}: template text: {str(value)[:90]}")
        if bad:
            print(f"HELP-001: {len(bad)} help text(s) are template filler")
            return 1
        print("HELP-001: no template filler")
        return 0
    by_entity = collections.Counter(w.split(".")[0].split("[")[0] for w, _, _ in bad)
    by_key = collections.Counter(k for _, k, _ in bad)
    print(f"{len(rows)} help texts; {len(bad)} are filler across {len(by_entity)} entities")
    print("by key:", dict(by_key.most_common()))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
