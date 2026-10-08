#!/usr/bin/env python3
"""Write authored help into the entity files.

A batch is a plain-text file, one block per entity, so prose never needs YAML
quoting:

    @ Account
    s: What the entity is, in a sentence or two.
    b: The business meaning.
    u: When and how it is used.
    c: How it connects to the entities around it.
    l: How it moves through its lifecycle.
    x: A concrete example.
    a accountType
    s: What the field stores.
    u: How it is filled, read and validated.
    v ASSET: What this value means.
    v LIABILITY: ...
    r parentAccount
    s: What the relationship says.
    u: How it is used.
    n: What its cardinality means.
    w: Its part in a process.

Keys — entity: s summary, b businessMeaning, u usage, c relationshipContext,
l lifecycle, x example, d distinctions, p workflowContext, y synonyms.
Attribute: s summary, u usage, b businessMeaning, c relationshipContext,
g validationGuidance, e examples (semicolon-separated), v <VALUE> valueSemantics.
Relationship: s summary, u usage, n cardinalityMeaning, w workflowRole, t context.
A line that starts with two spaces continues the previous text.

An authored block *replaces* that item's help. What it leaves out is dropped if
it was template filler (`tools/help_shapes.py`) and kept if it was real prose.

    python tools/help_apply.py batch.txt [--dry-run]
"""
from __future__ import annotations

import pathlib
import re
import sys

from ruamel.yaml import YAML
from ruamel.yaml.comments import CommentedMap, CommentedSeq

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import help_shapes as hs  # noqa: E402

ENTITY_KEYS = {"s": "summary", "b": "businessMeaning", "u": "usage", "c": "relationshipContext",
               "l": "lifecycle", "x": "example", "d": "distinctions", "p": "workflowContext", "y": "synonyms"}
ATTR_KEYS = {"s": "summary", "u": "usage", "b": "businessMeaning", "c": "relationshipContext",
             "g": "validationGuidance", "e": "examples"}
REL_KEYS = {"s": "summary", "u": "usage", "n": "cardinalityMeaning", "w": "workflowRole", "t": "context"}
ALWAYS_DROP = {"requiredMeaning", "optionalMeaning"}

yaml = YAML()
yaml.preserve_quotes = True
yaml.width = 100000
yaml.indent(mapping=2, sequence=4, offset=2)


def parse(text: str) -> dict:
    """{entity: {"help": {...}, "attrs": {name: {...}}, "rels": {name: {...}}}}"""
    out: dict = {}
    entity = target = None
    last: tuple[dict, str] | None = None
    for number, raw in enumerate(text.splitlines(), 1):
        if not raw.strip() or raw.lstrip().startswith("//"):
            continue
        if raw.startswith("  ") and last:
            holder, key = last
            holder[key] = (holder[key] + " " + raw.strip()).strip()
            continue
        line = raw.rstrip()
        if line.startswith("@ "):
            entity = line[2:].strip()
            out[entity] = {"help": {}, "attrs": {}, "rels": {}}
            target, kind = out[entity]["help"], "entity"
            last = None
            continue
        if entity is None:
            raise SystemExit(f"line {number}: text before the first '@ Entity'")
        m = re.match(r"^([ar]) (\w+)\s*$", line)
        if m:
            bucket = out[entity]["attrs" if m.group(1) == "a" else "rels"]
            target = bucket.setdefault(m.group(2), {})
            kind = "attr" if m.group(1) == "a" else "rel"
            last = None
            continue
        m = re.match(r"^v ([A-Za-z0-9_.\-]+):\s*(.*)$", line)
        if m and kind == "attr":
            target.setdefault("valueSemantics", {})[m.group(1)] = m.group(2).strip()
            last = (target["valueSemantics"], m.group(1))
            continue
        m = re.match(r"^([a-z]):\s*(.*)$", line)
        if m:
            table = {"entity": ENTITY_KEYS, "attr": ATTR_KEYS, "rel": REL_KEYS}[kind]
            if m.group(1) not in table:
                raise SystemExit(f"line {number}: key {m.group(1)!r} is not valid for a {kind}")
            key = table[m.group(1)]
            target[key] = m.group(2).strip()
            last = (target, key)
            continue
        raise SystemExit(f"line {number}: cannot read {line[:60]!r}")
    return out


def merge(old, authored: dict, bad_texts: set[str], vocabulary: set[str]) -> CommentedMap:
    """The new help mapping: authored keys, plus real prose the author did not replace."""
    new = CommentedMap()
    for key, value in authored.items():
        new[key] = dict(value) if isinstance(value, dict) else value
    if isinstance(old, dict):
        for key, value in old.items():
            if key == "valueSemantics" and isinstance(value, dict):
                # Authored values win; real prose for the others stays.
                kept = {v: t for v, t in value.items() if " ".join(str(t).split()) not in bad_texts}
                merged = {**kept, **(new.get("valueSemantics") or {})}
                if merged:
                    order = list(value) + [v for v in merged if v not in value]
                    new["valueSemantics"] = {v: merged[v] for v in order if v in merged}
                continue
            if key in new or key in ALWAYS_DROP or key == "valueSemantics":
                continue
            # Real prose the author did not replace stays; template text goes,
            # whatever key it sits under.
            if isinstance(value, str) and " ".join(value.split()) in bad_texts:
                continue
            new[key] = value
    return new


def main(argv: list[str]) -> int:
    dry = "--dry-run" in argv
    files = [a for a in argv if not a.startswith("--")]
    batches: dict = {}
    for f in files:
        for name, block in parse(pathlib.Path(f).read_text()).items():
            if name in batches:
                raise SystemExit(f"{name} is authored twice")
            batches[name] = block
    paths = {}
    for path in sorted(hs.ENTITIES.glob("*.yaml")):
        if path.name == "index.yaml":
            continue
        with path.open() as handle:
            doc = yaml.load(handle)
        paths[doc["entity"]["name"]] = (path, doc)
    problems = []
    legacy = hs.legacy_shapes()
    for name, block in batches.items():
        if name not in paths:
            problems.append(f"{name}: no such entity")
            continue
        path, doc = paths[name]
        entity = doc["entity"]
        attrs = {a["name"]: a for a in entity.get("attributes") or []}
        rels = {r["name"]: r for r in entity.get("relationships") or []}
        related = tuple(r.get("target") for r in rels.values())

        def filler_set(item_old, own, targets):
            bad = set()
            if isinstance(item_old, dict):
                for key, value in item_old.items():
                    if key == "valueSemantics" and isinstance(value, dict):
                        for val, text in value.items():
                            if isinstance(text, str) and hs.shape(text, name, str(val), (own, *targets), entity.get("kind")) in legacy:
                                bad.add(" ".join(text.split()))
                    elif isinstance(value, str):
                        s = hs.shape(value, name, own, targets, entity.get("kind"))
                        if s in legacy:
                            bad.add(" ".join(value.split()))
            return bad

        entity["help"] = merge(entity.get("help"), block["help"], filler_set(entity.get("help"), None, related),
                               set(ENTITY_KEYS.values()) | {"purpose", "whenUsed", "howItRelates", "lifecycleUsage",
                                                              "commonProcesses", "commonExamples"})
        for attr_name, authored in block["attrs"].items():
            if attr_name not in attrs:
                problems.append(f"{name}.{attr_name}: no such attribute")
                continue
            attr = attrs[attr_name]
            if authored.get("examples"):
                authored["examples"] = [e.strip() for e in authored["examples"].split(";") if e.strip()]
            attr["help"] = merge(attr.get("help"), authored, filler_set(attr.get("help"), attr_name, (attr.get("target"),)),
                                 set(ATTR_KEYS.values()))
            for need in ("summary", "usage"):
                if not attr["help"].get(need):
                    problems.append(f"{name}.{attr_name}: no {need} (DICT-006 needs both)")
            want = {str(v) for v in attr.get("values") or []}
            have = {str(v) for v in (attr["help"].get("valueSemantics") or {})}
            if want and have != want:
                problems.append(f"{name}.{attr_name}: valueSemantics must cover exactly {sorted(want)} (missing {sorted(want - have)}, extra {sorted(have - want)}); add 'v VALUE: ...' lines")
        for rel_name, authored in block["rels"].items():
            if rel_name not in rels:
                problems.append(f"{name}.{rel_name}: no such relationship")
                continue
            rel = rels[rel_name]
            rel["help"] = merge(rel.get("help"), authored, filler_set(rel.get("help"), rel_name, (rel.get("target"),)),
                                set(REL_KEYS.values()))
    if problems:
        print("\n".join(problems))
        return 1
    if not dry:
        for name in batches:
            path, doc = paths[name]
            with path.open("w") as handle:
                yaml.dump(doc, handle)
    seen, rows = hs.scan() if not dry else (None, [])
    if not dry:
        bad = list(hs.filler_rows(seen, rows))
        left = {}
        for w, k, _ in bad:
            e = w.split(".")[0].split("[")[0]
            if e in batches:
                left.setdefault(e, []).append(f"{w}.{k}")
        for e in batches:
            print(f"{e}: {'clean' if e not in left else str(len(left[e])) + ' filler left: ' + ', '.join(left[e][:6])}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
