#!/usr/bin/env python3
"""Merge authored structure and help into the CEDM entity files.

    python3 tools/apply_authored.py authored/*.yaml [--check]

An authored file is a map of entity name → what an author wrote about it, in a
short form, so the writing is the bulk of the file:

    Activity:
      d: One sentence description.            # entity description
      icon: phone-call                         # ui.icon
      label: [subject]                         # ui.recordLabel
      h: {summary: …, businessMeaning: …, usage: …, relationshipContext: …,
          lifecycle: …, workflowContext: …, example: …}
      a:
        subject: {s: summary, u: usage, c: relationshipContext, v: {VALUE: meaning}}
        +dueDate: {t: date req, s: …, u: …, c: …}          # a new attribute
      r:
        customer: {s: summary, u: usage, n: cardinalityMeaning, c: context}
        +opportunity: {t: Opportunity 0..1, s: …, u: …, n: …, c: …}   # a new relationship
      i: [A rule the record must keep.,                     # appended invariants
          {rule: …, when: "end_date < start_date", message: …}]   # …executable ones
      L: {initial: DRAFT, terminal: [CLOSED], t: [DRAFT>OPEN submit, OPEN>CLOSED close]}

A new attribute's `t` is `<type> [req] [unique] [<maxLength>] [<precision>,<scale>]
[=<default>] [->Target]`; an enum takes its values from `v`, in order.

Merging keeps what an author already wrote: a help key is replaced when the
authored entry names it, removed when it was stamped from a template
(`help_quality.legacy`) and the entry does not name it, and otherwise kept.
Files are rewritten with ruamel's round trip, so ordering, flow style and every
key this tool does not touch stay as they were.
"""
from __future__ import annotations

import json
import pathlib
import re
import sys

import yaml as pyyaml
from ruamel.yaml import YAML
from ruamel.yaml.comments import CommentedMap, CommentedSeq

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import dictionary_lib as dictlib  # noqa: E402
import help_quality  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[1]
ENTITY_DIR = ROOT / "domain" / "entities"

ATTRIBUTE_KEYS = {"s": "summary", "u": "usage", "c": "relationshipContext", "b": "businessMeaning",
                  "w": "workflowRole", "g": "validationGuidance", "x": "examples"}
RELATIONSHIP_KEYS = {"s": "summary", "u": "usage", "n": "cardinalityMeaning", "c": "context",
                     "b": "businessMeaning", "w": "workflowRole"}
# Legacy spellings of entity help keys; writing the canonical key retires them.
ALIASES = dictlib.HELP_ALIASES
TYPES = {"uuid", "string", "text", "email", "integer", "decimal", "Money", "money", "date", "datetime",
         "boolean", "enum", "reference", "currency_code", "country_code", "locale", "timezone", "url"}
MANAGED = {"version", "createdAt", "updatedAt", "createdBy", "updatedBy", "deletedAt", "deletedBy"}

rt = YAML()
rt.width = 4096
rt.preserve_quotes = True
rt.indent(mapping=2, sequence=2, offset=0)


def block(mapping: dict) -> CommentedMap:
    out = CommentedMap()
    for key, value in mapping.items():
        out[key] = value
    out.fa.set_block_style()
    return out


def parse_type(spec: str, where: str) -> CommentedMap:
    parts = spec.split()
    if not parts or parts[0] not in TYPES:
        raise SystemExit(f"{where}: unknown type in {spec!r}")
    out = CommentedMap()
    out["type"] = parts[0]
    required = False
    for part in parts[1:]:
        if part == "req":
            required = True
        elif part == "unique":
            out["unique"] = True
        elif part.startswith("->"):
            out["target"] = part[2:]
        elif part.startswith("="):
            value = part[1:]
            out["default"] = {"true": True, "false": False}.get(value, int(value) if value.isdigit() else value)
        elif re.fullmatch(r"\d+,\d+", part):
            precision, scale = part.split(",")
            out["precision"], out["scale"] = int(precision), int(scale)
        elif part.isdigit():
            out["maxLength"] = int(part)
        else:
            raise SystemExit(f"{where}: cannot read {part!r} in {spec!r}")
    out.insert(1, "required", required)
    return out


def merge_help(existing, authored: dict, stamped_keys: set[str], aliases: dict[str, str] | None = None) -> CommentedMap:
    out = CommentedMap()
    old = existing if isinstance(existing, dict) else {}
    written = set(authored)
    retired = {alias for alias, canonical in (aliases or {}).items() if canonical in written}
    for key, value in old.items():
        if key in written or key in retired:
            continue
        if key in stamped_keys:
            continue
        out[key] = value
    for key, value in authored.items():
        out[key] = value
    # Put the summary first and the value meanings last, as authors write them.
    ordered = CommentedMap()
    for key in ["summary"] + [k for k in out if k not in ("summary", "valueSemantics", "valueLabels")] + ["valueLabels", "valueSemantics"]:
        if key in out and key not in ordered:
            ordered[key] = out[key]
    ordered.fa.set_block_style()
    return ordered


def stamped_by_path() -> dict[str, set[str]]:
    entities = {}
    for path in ENTITY_DIR.glob("*.yaml"):
        if path.name == "index.yaml":
            continue
        entity = (pyyaml.safe_load(path.read_text()) or {}).get("entity") or {}
        if entity.get("name"):
            entities[entity["name"]] = entity
    by_owner: dict[str, set[str]] = {}
    for path in help_quality.legacy(entities):
        owner, key = path.rsplit(".", 1)
        if ".valueSemantics" in owner:
            owner, key = owner.split(".valueSemantics")[0], "valueSemantics"
        by_owner.setdefault(owner, set()).add(key)
    return by_owner


def apply(name: str, entry: dict, path: pathlib.Path, stamped: dict[str, set[str]]) -> str:
    doc = rt.load(path.read_text())
    entity = doc["entity"]
    if entry.get("d"):
        entity["description"] = entry["d"]
    ui = entity.setdefault("ui", CommentedMap())
    if entry.get("icon"):
        if entry["icon"] not in dictlib.LUCIDE:
            raise SystemExit(f"{name}: icon {entry['icon']!r} is not a lucide 0.312 id (tools/lucide-icons.txt)")
        ui["icon"] = entry["icon"]
    if entry.get("label"):
        ui["recordLabel"] = CommentedSeq(entry["label"])
        ui["recordLabel"].fa.set_flow_style()

    attributes = entity.setdefault("attributes", CommentedSeq())
    by_name = {a["name"]: a for a in attributes}
    for key, spec in (entry.get("a") or {}).items():
        if key.startswith("-"):
            gone = key[1:]
            if gone in by_name:
                attributes.remove(by_name.pop(gone))
            continue
        attr_name = key.lstrip("+")
        # Re-running a batch updates what an earlier run added.
        new = attr_name not in by_name and (key.startswith("+") or bool(spec.get("t")))
        where = f"{name}.{attr_name}"
        if attr_name in MANAGED:
            raise SystemExit(f"{where}: managed column; every table already has it")
        authored = {ATTRIBUTE_KEYS[k]: v for k, v in spec.items() if k in ATTRIBUTE_KEYS}
        if spec.get("v"):
            authored["valueSemantics"] = block({str(k): v for k, v in spec["v"].items()})
        if new:
            if attr_name in by_name:
                raise SystemExit(f"{where}: already declared")
            attr = CommentedMap()
            attr["name"] = attr_name
            for k, v in parse_type(spec["t"], where).items():
                attr[k] = v
            if attr["type"] == "enum":
                if not spec.get("v"):
                    raise SystemExit(f"{where}: an enum needs values (v)")
                attr["values"] = CommentedSeq(str(v) for v in spec["v"])
                attr["values"].fa.set_flow_style()
            attr["help"] = merge_help({}, authored, set())
            attr.fa.set_block_style()
            attributes.append(attr)
            by_name[attr_name] = attr
        else:
            if attr_name not in by_name:
                raise SystemExit(f"{where}: no such attribute (prefix + to add one)")
            attr = by_name[attr_name]
            if spec.get("t"):
                retyped = parse_type(spec["t"], where)
                for k in ("type", "required", "unique", "maxLength", "precision", "scale", "default", "target", "values"):
                    if k in attr:
                        del attr[k]
                for offset, (k, v) in enumerate(retyped.items()):
                    attr.insert(1 + offset, k, v)
                if attr["type"] == "enum":
                    values = CommentedSeq(str(v) for v in spec["v"])
                    values.fa.set_flow_style()
                    attr.insert(1 + len(retyped), "values", values)
            if attr.get("values") and spec.get("v"):
                want = {str(v) for v in attr["values"]}
                if set(map(str, spec["v"])) != want:
                    raise SystemExit(f"{where}: value meanings {sorted(map(str, spec['v']))} differ from values {sorted(want)}")
            attr.fa.set_block_style()
            attr["help"] = merge_help(attr.get("help"), authored, stamped.get(where, set()))

    relationships = entity.get("relationships")
    if relationships is None:
        relationships = entity["relationships"] = CommentedSeq()
    rel_by_name = {r["name"]: r for r in relationships}
    for key, spec in (entry.get("r") or {}).items():
        if key.startswith("-"):
            gone = key[1:]
            if gone in rel_by_name:
                relationships.remove(rel_by_name.pop(gone))
            continue
        rel_name = key.lstrip("+")
        new = rel_name not in rel_by_name and (key.startswith("+") or bool(spec.get("t")))
        where = f"{name}.@{rel_name}"
        authored = {RELATIONSHIP_KEYS[k]: v for k, v in spec.items() if k in RELATIONSHIP_KEYS}
        if new:
            if rel_name in rel_by_name:
                raise SystemExit(f"{where}: already declared")
            target, cardinality = spec["t"].split()[:2]
            rel = CommentedMap()
            rel["name"] = rel_name
            rel["target"] = target
            rel["cardinality"] = cardinality
            rel["ownership"] = "aggregate" if "aggregate" in spec["t"] else "reference"
            rel["help"] = merge_help({}, authored, set())
            rel.fa.set_block_style()
            relationships.append(rel)
            rel_by_name[rel_name] = rel
        else:
            if rel_name not in rel_by_name:
                raise SystemExit(f"{where}: no such relationship (prefix + to add one)")
            rel = rel_by_name[rel_name]
            if spec.get("t"):
                target, cardinality = spec["t"].split()[:2]
                rel["target"], rel["cardinality"] = target, cardinality
            rel.fa.set_block_style()
            rel["help"] = merge_help(rel.get("help"), authored, stamped.get(where, set()))
    if not relationships:
        relationships.fa.set_flow_style()

    if entry.get("I") is not None:
        entity["invariants"] = CommentedSeq()
        entry = {**entry, "i": entry["I"]}
    if entry.get("i"):
        invariants = entity.setdefault("invariants", CommentedSeq())
        prefix = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", "-", name).upper()
        taken = {str(i.get("id")) for i in invariants if isinstance(i, dict)}
        stated = {str(i.get("rule")) for i in invariants if isinstance(i, dict)}
        number = 1
        for rule in entry["i"]:
            if (rule["rule"] if isinstance(rule, dict) else rule) in stated:
                continue
            while f"{prefix}-{number:03d}" in taken:
                number += 1
            item = CommentedMap([("id", f"{prefix}-{number:03d}")])
            if isinstance(rule, dict):
                item["rule"] = rule["rule"]
                item["violatedWhen"] = rule["when"]
                item["message"] = rule.get("message", rule["rule"])
            else:
                item["rule"] = rule
            item.fa.set_flow_style()
            invariants.append(item)
            taken.add(item["id"])

    if entry.get("L"):
        spec = entry["L"]
        status = next((a for a in attributes if a["name"] == spec.get("attribute", "status")), None)
        if status is None or not status.get("values"):
            raise SystemExit(f"{name}: a lifecycle needs its enum attribute")
        states = [str(v) for v in status["values"]]
        life = CommentedMap()
        life["title"] = f"{dictlib.words(name)} Lifecycle"
        life["attribute"] = spec.get("attribute", "status")
        life["states"] = CommentedSeq(states)
        life["states"].fa.set_flow_style()
        life["initial"] = spec["initial"]
        life["terminal"] = CommentedSeq(spec.get("terminal", []))
        life["terminal"].fa.set_flow_style()
        moves = CommentedSeq()
        for move in spec["t"]:
            edge, action = move.split()
            source, target = edge.split(">")
            for state in (source, target):
                if state not in states:
                    raise SystemExit(f"{name}: lifecycle state {state} is not a value of {life['attribute']}")
            item = CommentedMap([("from", source), ("to", target), ("action", action)])
            item.fa.set_flow_style()
            moves.append(item)
        life["transitions"] = moves
        old = entity.get("lifecycle")
        same = old is not None and plain(old) == plain(life)
        # Workflows are derived from the lifecycle (tools/derive_workflows.py): a new lifecycle drops them.
        for key in [k for k in entity if k == "lifecycle" or (k == "workflows" and not same)]:
            del entity[key]
        position = list(entity.keys()).index("help") if "help" in entity else len(entity)
        entity.insert(position, "lifecycle", life)

    if entry.get("h"):
        entity["help"] = merge_help(entity.get("help"), entry["h"], stamped.get(f"{name}.help", set()), ALIASES)

    from io import StringIO

    buffer = StringIO()
    rt.dump(doc, buffer)
    return buffer.getvalue()


PROSE = re.compile(r"^(\s*(?:- )?[A-Za-z0-9_+\-]+): (.+)$")


def lenient(text: str) -> str:
    """Quote prose values, so a colon or a `#` inside a sentence does not break YAML.

    A value that opens with a YAML structure (`{`, `[`, a quote, `|`, `>`) is
    left alone; anything else on a `key: value` line is taken as a sentence.
    """
    out = []
    for line in text.split("\n"):
        m = PROSE.match(line)
        if m:
            value = m.group(2).rstrip()
            structured = value.lstrip().startswith(("{", "[", "|", ">", "&", "*", "!"))
            quoted = value.startswith(('"', "'"))
            if quoted:
                # A quoted scalar is left alone only when the quotes enclose the whole value.
                try:
                    whole = isinstance(pyyaml.safe_load(f"k: {value}").get("k"), str)
                except pyyaml.YAMLError:
                    whole = False
                if not whole:
                    line = f"{m.group(1)}: {json.dumps(value, ensure_ascii=False)}"
            elif not structured and (": " in value or " #" in value or value.endswith(":")):
                line = f"{m.group(1)}: {json.dumps(value, ensure_ascii=False)}"
        out.append(line)
    return "\n".join(out)


def plain(value):
    """ruamel's containers as plain dicts and lists, for comparison."""
    if isinstance(value, dict):
        return {str(k): plain(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [plain(v) for v in value]
    return value


def split_text(value, where: str = "") -> list[str]:
    """Paths where `{a: x, y}` made `y` a key with no value."""
    found = []
    if isinstance(value, dict):
        for key, item in value.items():
            if item is None:
                found.append(f"{where}.{key}")
            else:
                found.extend(split_text(item, f"{where}.{key}"))
    elif isinstance(value, list):
        for index, item in enumerate(value):
            found.extend(split_text(item, f"{where}[{index}]"))
    return found


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    check = "--check" in sys.argv
    files = {}
    for path in ENTITY_DIR.glob("*.yaml"):
        if path.name == "index.yaml":
            continue
        entity = (pyyaml.safe_load(path.read_text()) or {}).get("entity") or {}
        if entity.get("name"):
            files[entity["name"]] = path
    stamped = stamped_by_path()
    changed = 0
    for source in args:
        authored = pyyaml.safe_load(lenient(pathlib.Path(source).read_text())) or {}
        split = split_text(authored)
        if split:
            raise SystemExit(f"{source}: text cut at a comma by a flow mapping at {split[0]}; quote it or write the map as a block")
        for name, entry in authored.items():
            if name not in files:
                raise SystemExit(f"{source}: {name} is not a library entity")
            text = apply(name, entry or {}, files[name], stamped)
            pyyaml.safe_load(text)  # what is written must read back
            if text != files[name].read_text():
                changed += 1
                if not check:
                    files[name].write_text(text)
    print(f"{changed} entity file(s) {'would change' if check else 'updated'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
