#!/usr/bin/env python3
"""Apply authored help text to the CEDM entity library.

Help written by a person (or reviewed after drafting) lives in
``domain/help/authored/*.yaml``, one file per batch, keyed by entity name:

    Account:
      help:
        workflowContext: Opened during chart-of-accounts setup and referenced by ...
        example: "1000 Cash at bank, an ASSET account posted to by receipts."
      attributes:
        code:
          businessMeaning: The number accountants quote ...
      relationships:
        payments:
          summary: ...

This tool writes each authored key into the entity file it names — the entity's
``help``, an attribute's ``help`` or a relationship's ``help`` — **by editing the
text**, never by a YAML round trip. A round trip would rewrap every folded line
in the library and turn a ten-key change into a ten-thousand-line diff (the
reason ``tools/enrich_dictionary.py`` edits text too). Positions come from
``yaml.compose``, so the edit lands inside the node it names whatever the file's
style: a flow mapping gains ``, key: "…"`` before its closing brace, a block
mapping gains a line at its keys' indent, and a missing ``help`` is created in
the style of the mapping that holds it.

It only ever adds. A key whose meaning is already present — under its own
spelling or an alias from ``specification/dictionary-mapping.yaml`` (``purpose``
is ``businessMeaning``) — is reported and left alone, so an authored batch can
be re-applied safely and cannot overwrite help someone has since edited.

Every file it changes is parsed again and each applied value read back; if
anything does not match, the file is restored and the run fails. A key the
contract does not know, or an entity, attribute or relationship the library
does not have, is an error rather than a guess.

Usage:
    python tools/apply_authored.py                    # apply every batch in domain/help/authored/
    python tools/apply_authored.py batch.yaml ...     # apply these batches
    python tools/apply_authored.py --check            # report what would change; exit 1 if anything would
"""
from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
ENTITY_DIR = ROOT / "domain" / "entities"
AUTHORED_DIR = ROOT / "domain" / "help" / "authored"
DICTIONARY_MAPPING = ROOT / "specification" / "dictionary-mapping.yaml"
HELP_SEMANTICS = ROOT / "specification" / "help-semantics.yaml"

SECTIONS = ("attributes", "relationships")


def load_contract():
    """The help keys the specification knows, and its aliases."""
    help_ = yaml.safe_load(DICTIONARY_MAPPING.read_text(encoding="utf-8"))["help"]
    aliases = {k: v for k, v in (help_.get("aliases") or {}).items() if k != "description"}
    known = set(help_.get("carriedKeys", {}).get("keys", []))
    for slot in ("windowSlots", "tabSlots", "fieldSlots"):
        known |= set(help_.get(slot) or [])
    known |= set((help_.get("relationshipHelp") or {}).get("slots") or [])
    known.add(help_.get("summarySlot", "summary"))
    return known, aliases


def canonical(key, aliases):
    return aliases.get(key, key)


def scalar(value: str) -> str:
    """A YAML double-quoted scalar: valid in flow and block context alike.

    Quoting every value is what keeps an authored sentence with a comma in it
    from being split into keys — the defect `tools/repair_flow_text.py` exists
    to undo.
    """
    return json.dumps(value, ensure_ascii=False)


def mapping_get(node, key):
    """The value node under `key` in a composed mapping, or None."""
    if not isinstance(node, yaml.MappingNode):
        return None
    for k, v in node.value:
        if isinstance(k, yaml.ScalarNode) and k.value == key:
            return v
    return None


def named_item(sequence, name):
    """The mapping in a composed sequence whose `name` is `name`."""
    if not isinstance(sequence, yaml.SequenceNode):
        return None
    for item in sequence.value:
        value = mapping_get(item, "name")
        if isinstance(value, yaml.ScalarNode) and value.value == name:
            return item
    return None


def line_end(text: str, index: int) -> int:
    """The index just past the newline that ends the line holding `index`."""
    newline = text.find("\n", index)
    return len(text) if newline < 0 else newline + 1


def last_end(node) -> int:
    """Where the last piece of text inside `node` ends.

    Not `node.end_mark` for a block collection: PyYAML puts that at the next
    token, which after a dedent is the *next* key's line, at its indent — so
    inserting "after the line it ends on" would land one entry too late. A
    scalar's and a flow collection's end marks are exact, so this descends to
    the last of those.
    """
    if isinstance(node, yaml.MappingNode) and not node.flow_style and node.value:
        return last_end(node.value[-1][1])
    if isinstance(node, yaml.SequenceNode) and not node.flow_style and node.value:
        return last_end(node.value[-1])
    return node.end_mark.index


def after_last_line(text: str, node) -> int:
    """The index at which a new line can follow everything inside `node`."""
    end = last_end(node)
    # A block scalar (`|`, `>`) ends just past its own final newline.
    if end > 0 and text[end - 1] == "\n":
        return end
    return line_end(text, end)


@dataclass
class Edit:
    index: int
    text: str
    #: Where the replaced span ends; equal to `index` for a pure insertion.
    end: int | None = None


@dataclass
class Report:
    applied: list = field(default_factory=list)
    present: list = field(default_factory=list)
    errors: list = field(default_factory=list)


def append_to_mapping(text: str, node: yaml.MappingNode, pairs: list[tuple[str, str]]) -> Edit:
    """Add `pairs` to an existing mapping, in its own style."""
    if node.flow_style:
        close = node.end_mark.index - 1
        if text[close] != "}":
            raise ValueError(f"line {node.end_mark.line + 1}: flow mapping does not end in '}}'")
        body = ", ".join(f"{k}: {scalar(v)}" for k, v in pairs)
        return Edit(close, (", " if node.value else "") + body)
    if not node.value:
        raise ValueError(f"line {node.start_mark.line + 1}: empty block mapping")
    indent = node.value[0][0].start_mark.column
    at = after_last_line(text, node)
    lines = "".join(f"{' ' * indent}{k}: {scalar(v)}\n" for k, v in pairs)
    if at == len(text) and not text.endswith("\n"):
        lines = "\n" + lines
    return Edit(at, lines)


def add_help(text: str, holder: yaml.MappingNode, pairs: list[tuple[str, str]]) -> Edit:
    """Create a `help` mapping on a mapping that has none, in its style."""
    if holder.flow_style:
        close = holder.end_mark.index - 1
        if text[close] != "}":
            raise ValueError(f"line {holder.end_mark.line + 1}: flow mapping does not end in '}}'")
        body = ", ".join(f"{k}: {scalar(v)}" for k, v in pairs)
        return Edit(close, f", help: {{{body}}}")
    indent = holder.value[0][0].start_mark.column
    at = after_last_line(text, holder)
    lines = f"{' ' * indent}help:\n" + "".join(
        f"{' ' * (indent + 2)}{k}: {scalar(v)}\n" for k, v in pairs
    )
    return Edit(at, lines)


def load_minimums():
    """The contract's minimum summary lengths, entity and field."""
    rules = yaml.safe_load(HELP_SEMANTICS.read_text(encoding="utf-8")).get("qualityRules") or {}
    return {
        "entity": int(rules.get("minimumEntitySummaryWords", 0)),
        "field": int(rules.get("minimumFieldSummaryWords", 0)),
    }


def short_summary(summary, label, minimums) -> bool:
    """Is this existing summary below the contract's minimum length?

    Only entity and attribute summaries have a minimum; a relationship's
    summary is never replaced.
    """
    if not isinstance(summary, str) or not summary.strip():
        return False
    if label == "help":
        floor = minimums["entity"]
    elif label.startswith("attributes."):
        floor = minimums["field"]
    else:
        return False
    return len(summary.split()) < floor


def plan_file(path: Path, entries: dict, known, aliases, report: Report, minimums=None):
    """The edits one entity file needs, and what each one writes."""
    text = path.read_text(encoding="utf-8")
    root = yaml.compose(text)
    parsed = yaml.safe_load(text)
    entity_node = mapping_get(root, "entity")
    entity = parsed["entity"]
    name = entity["name"]
    edits, expect = [], []

    def target(label, holder_node, holder_parsed, authored):
        if not isinstance(authored, dict):
            report.errors.append(f"{name} {label}: authored help must be a mapping")
            return
        existing = holder_parsed.get("help") if isinstance(holder_parsed.get("help"), dict) else {}
        have = {canonical(k, aliases) for k, v in existing.items() if v not in (None, "", [], {})}
        pairs, replacements = [], []
        for key, value in authored.items():
            if key not in known:
                report.errors.append(f"{name} {label}: '{key}' is not a help key the specification knows")
                continue
            if not isinstance(value, str) or not value.strip():
                report.errors.append(f"{name} {label}: '{key}' must be non-empty text")
                continue
            value = " ".join(value.split())
            if key == "summary" and short_summary(existing.get("summary"), label, minimums):
                # The one key that is replaced rather than added: a summary
                # shorter than the contract's minimum is a gap even though
                # the key is present, and there can only be one summary.
                replacements.append(value)
                continue
            if canonical(key, aliases) in have:
                report.present.append(f"{name} {label}.{key}")
                continue
            pairs.append((key, value))
            have.add(canonical(key, aliases))
        help_node = mapping_get(holder_node, "help")
        for value in replacements:
            old = mapping_get(help_node, "summary")
            if not isinstance(old, yaml.ScalarNode):
                report.errors.append(f"{name} {label}: summary is not text; fix it by hand")
                continue
            edits.append(Edit(old.start_mark.index, scalar(value), old.end_mark.index))
            expect.append((label, "summary", value))
            report.applied.append(f"{name} {label}.summary (replaced)")
        if not pairs:
            return
        try:
            if isinstance(help_node, yaml.MappingNode):
                edits.append(append_to_mapping(text, help_node, pairs))
            elif help_node is None:
                edits.append(add_help(text, holder_node, pairs))
            else:
                report.errors.append(f"{name} {label}: help is not a mapping; fix it by hand")
                return
        except ValueError as exc:
            report.errors.append(f"{name} {label}: {exc}")
            return
        for key, value in pairs:
            expect.append((label, key, value))
            report.applied.append(f"{name} {label}.{key}")

    if "help" in entries:
        target("help", entity_node, entity, entries["help"])
    for section in SECTIONS:
        for item_name, authored in (entries.get(section) or {}).items():
            node = named_item(mapping_get(entity_node, section), item_name)
            item = next((i for i in entity.get(section) or [] if isinstance(i, dict)
                         and i.get("name") == item_name), None)
            if node is None or item is None:
                report.errors.append(f"{name}: no {section[:-1]} named '{item_name}'")
                continue
            target(f"{section}.{item_name}", node, item, authored)
    unknown = set(entries) - {"help", *SECTIONS}
    for key in sorted(unknown):
        report.errors.append(f"{name}: unknown section '{key}' (use help, attributes or relationships)")
    return text, edits, expect


def read_back(text: str, label: str, key: str):
    entity = yaml.safe_load(text)["entity"]
    if label == "help":
        return (entity.get("help") or {}).get(key)
    section, item_name = label.split(".", 1)
    for item in entity.get(section) or []:
        if isinstance(item, dict) and item.get("name") == item_name:
            return (item.get("help") or {}).get(key)
    return None


def load_batches(paths):
    """Merge every batch into {entity: entries}, refusing contradictions."""
    merged: dict = {}
    for path in paths:
        doc = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        if not isinstance(doc, dict):
            raise SystemExit(f"{path}: a batch is a mapping of entity name to help")
        for entity, entries in doc.items():
            slot = merged.setdefault(entity, {})
            for section, value in (entries or {}).items():
                if section == "help":
                    slot.setdefault("help", {}).update(value or {})
                else:
                    for item, keys in (value or {}).items():
                        slot.setdefault(section, {}).setdefault(item, {}).update(keys or {})
    return merged


def entity_files():
    files = {}
    for path in sorted(ENTITY_DIR.glob("*.yaml")):
        if path.name == "index.yaml":
            continue
        try:
            name = (yaml.safe_load(path.read_text(encoding="utf-8")) or {})["entity"]["name"]
        except (yaml.YAMLError, KeyError, TypeError):
            continue
        files[name] = path
    return files


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("batches", nargs="*", type=Path, help="batch files (default: domain/help/authored/*.yaml)")
    parser.add_argument("--check", action="store_true", help="report only; exit 1 if anything would change")
    args = parser.parse_args(argv)

    batches = args.batches or sorted(AUTHORED_DIR.glob("*.yaml"))
    if not batches:
        print(f"no authored batches in {AUTHORED_DIR.relative_to(ROOT)}")
        return 0
    known, aliases = load_contract()
    authored = load_batches(batches)
    minimums = load_minimums()
    files = entity_files()
    report = Report()
    changed = 0

    for entity, entries in sorted(authored.items()):
        path = files.get(entity)
        if path is None:
            report.errors.append(f"{entity}: no entity file declares this entity (or it does not parse)")
            continue
        before_errors = len(report.errors)
        text, edits, expect = plan_file(path, entries, known, aliases, report, minimums)
        if not edits or args.check:
            continue
        if len(report.errors) > before_errors:
            # Half a batch for one entity is worse than none: skip the file.
            report.applied = [a for a in report.applied if not a.startswith(f"{entity} ")]
            continue
        new = text
        for edit in sorted(edits, key=lambda e: e.index, reverse=True):
            end = edit.index if edit.end is None else edit.end
            new = new[: edit.index] + edit.text + new[end:]
        try:
            mismatched = [
                f"{label}.{key}" for label, key, value in expect if read_back(new, label, key) != value
            ]
        except yaml.YAMLError as exc:
            mismatched = [f"the edited file does not parse: {str(exc).splitlines()[0]}"]
        if mismatched:
            report.errors.append(f"{entity}: not applied, read-back failed for {', '.join(mismatched)}")
            report.applied = [a for a in report.applied if not a.startswith(f"{entity} ")]
            continue
        path.write_text(new, encoding="utf-8")
        changed += 1

    verb = "would apply" if args.check else "applied"
    print(f"{verb} {len(report.applied)} key(s) in {changed if not args.check else len({a.split(' ')[0] for a in report.applied})} file(s); "
          f"{len(report.present)} already present; {len(report.errors)} error(s)")
    for error in report.errors:
        print(f"ERROR: {error}")
    if report.errors:
        return 1
    if args.check and report.applied:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
