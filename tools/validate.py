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

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import dictionary_lib as dictlib  # noqa: E402
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
CARDINALITY_PATTERN = re.compile(r"^(?:0|[1-9][0-9]*)\.\.(?:1|\*)$")

errors: list[str] = []
warnings: list[str] = []


def load_yaml(path: pathlib.Path):
    try:
        with path.open("r", encoding="utf-8") as fh:
            return yaml.safe_load(fh) or {}
    except Exception as exc:
        errors.append(f"{path}: invalid YAML: {exc}")
        return {}


def split_text(value, where: str = "entity") -> list[str]:
    """Paths whose mapping holds text a flow mapping cut at a comma.

    The signature is a null-valued key straight after a text value: in
    `{rule: a, b}` YAML reads `b` as a key with no value. A null that follows
    anything else (`key: null` on a value object's identity) is deliberate.
    """
    found: list[str] = []
    if isinstance(value, dict):
        items = list(value.values())
        if any(item is None and isinstance(before, str) for before, item in zip(items, items[1:])):
            found.append(where)
        for key, item in value.items():
            if item is not None:
                found.extend(split_text(item, f"{where}.{key}"))
    elif isinstance(value, list):
        for index, item in enumerate(value):
            found.extend(split_text(item, f"{where}[{index}]"))
    return found


def dictionary_checks(entities: dict[str, tuple[pathlib.Path, dict]]) -> None:
    """The DICT-* and ENUM-* rules of specification/dictionary-mapping.yaml."""
    mapping = load_yaml(ROOT / "specification" / "dictionary-mapping.yaml")
    known = set(dictlib.HELP_ALIASES) | set(dictlib.HELP_ALIASES.values())
    known |= set(mapping.get("help", {}).get("carriedKeys", {}).get("keys", []))
    known |= set(mapping.get("help", {}).get("windowSlots", []) + mapping["help"].get("tabSlots", []) + mapping["help"].get("fieldSlots", []))
    enumeration_tables: dict[str, str] = {}
    for name, (_, entity) in entities.items():
        kind = entity.get("kind")
        if len(dictlib.kind_classes(kind)) < 1:
            errors.append(f"{name}: DICT-002 kind {kind!r} resolves to no class")
        icon = (entity.get("ui") or {}).get("icon")
        if not icon:
            errors.append(f"{name}: DICT-001 ui.icon is required")
        elif icon not in dictlib.LUCIDE:
            errors.append(f"{name}: DICT-001 ui.icon {icon!r} is not a lucide 0.312 icon (tools/lucide-icons.txt)")
        help_ = entity.get("help") or {}
        if not help_.get("summary") or not (help_.get("businessMeaning") or help_.get("purpose")):
            errors.append(f"{name}: DICT-003 help needs summary and businessMeaning (or purpose)")
        for key in help_:
            if key not in known:
                errors.append(f"{name}: DICT-004 unknown help key {key!r}")
        ui = entity.get("ui") or {}
        if ui.get("group") and ui["group"] not in dictlib.GROUPS:
            errors.append(f"{name}: DICT-008 ui.group {ui['group']!r} is not in groups.order")
        attribute_names = {a.get("name") for a in entity.get("attributes") or []}
        label = ui.get("recordLabel")
        for part in ([label] if isinstance(label, str) else label or []):
            if part not in attribute_names:
                errors.append(f"{name}: DICT-009 ui.recordLabel names {part!r}, which the entity does not declare")
        for attr in entity.get("attributes") or []:
            where = f"{name}.{attr.get('name')}"
            attr_help = attr.get("help") if isinstance(attr.get("help"), dict) else {}
            if not attr_help.get("summary") or not attr_help.get("usage"):
                errors.append(f"{where}: DICT-006 help needs summary and usage")
            for key in attr_help:
                if key not in known:
                    errors.append(f"{where}: DICT-004 unknown help key {key!r}")
            values = attr.get("values")
            if attr.get("type") == "enum" and not values:
                errors.append(f"{where}: ENUM-001 an enum attribute declares values")
            if values:
                table = "bus_" + re.sub(r"(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", "_", dictlib.enumeration_name(name, attr["name"])).lower()
                if table in enumeration_tables:
                    errors.append(f"{where}: ENUM-003 table {table} is also {enumeration_tables[table]}")
                enumeration_tables[table] = where
                have = {str(k) for k in (attr_help.get("valueSemantics") or {})}
                want = {str(v) for v in values}
                if have != want:
                    errors.append(f"{where}: DICT-005 valueSemantics differs from values (missing {sorted(want - have)}, extra {sorted(have - want)})")
        for rel in entity.get("relationships") or []:
            if not rel.get("help"):
                warnings.append(f"{name}.{rel.get('name')}: DICT-007 relationship has no help")
    for table, where in enumeration_tables.items():
        for name in entities:
            if "bus_" + re.sub(r"(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", "_", name).lower() == table:
                errors.append(f"{where}: DICT-010 enumeration table {table} collides with entity {name}")
    import subprocess

    registry = subprocess.run([sys.executable, str(ROOT / "tools" / "build_enumerations.py"), "--check"], capture_output=True, text=True)
    if registry.returncode:
        errors.append(f"ENUM-002 {registry.stdout.strip() or registry.stderr.strip()}")


def structure_checks(entities: dict[str, tuple[pathlib.Path, dict]]) -> None:
    """How relationships become columns (language/cedm/lower.ts) — rules a model must not leave to chance.

    STRUCT-001 A to-many reference that no relationship on its target answers
    plants a key column on the target. Whether that key is meant — the target
    belongs to one source (`inverseCardinality: 1`) — or the relation is
    many-to-many and holds no key (`inverseCardinality: 0..*`) must be stated:
    left implicit, `Product.locations` gave every Location a `product_id`.
    STRUCT-003 The two ends of a many-to-many are both 0..* or both 1..*;
    the model language defines no other pairing.
    STRUCT-002 Two to-one relationships of one entity must not resolve to the
    same key column; name it with `foreignKey`.
    """
    def many(cardinality) -> bool:
        return str(cardinality).endswith("*")

    for name, (_, entity) in entities.items():
        for rel in entity.get("relationships") or []:
            if not many(rel.get("cardinality")) or rel.get("ownership") == "aggregate" or "inverseCardinality" in rel:
                continue
            target = entities.get(rel.get("target"), (None, {}))[1]
            if not target:
                continue
            back = [r for r in target.get("relationships") or [] if r.get("target") == name and "inverseCardinality" not in r]
            if rel.get("inverse"):
                back = [r for r in back if r.get("name") == rel["inverse"]]
            if rel.get("target") == name:
                back = [r for r in back if r is not rel]
            if len(back) != 1:
                errors.append(
                    f"{name}.{rel.get('name')}: STRUCT-001 to-many reference to {rel.get('target')} has no counterpart; "
                    "state inverseCardinality (1: the target holds the key; 0..*: many-to-many) or name its inverse"
                )
        for rel in entity.get("relationships") or []:
            inverse = rel.get("inverseCardinality")
            if inverse is not None and many(inverse) and str(rel.get("cardinality")) != str(inverse):
                errors.append(
                    f"{name}.{rel.get('name')}: STRUCT-003 a many-to-many is {inverse} on one end and {rel.get('cardinality')} on the other; "
                    "both ends must match (state a minimum as an invariant)"
                )
        refs = [a for a in entity.get("attributes") or [] if a.get("type") == "reference"]
        keys: dict[str, str] = {}
        for rel in entity.get("relationships") or []:
            if many(rel.get("cardinality")) or rel.get("foreignKey") is False:
                continue
            key = rel.get("foreignKey") or next(
                (a["name"] for a in refs if a.get("target") == rel.get("target")),
                next((a["name"] for a in refs if a["name"] == f"{rel.get('name')}Id"), f"{rel.get('name')}Id"),
            )
            if key in keys:
                errors.append(f"{name}.{rel.get('name')}: STRUCT-002 resolves to the key {key!r} that {name}.{keys[key]} uses; name it with foreignKey")
            keys[key] = rel.get("name")


TOKEN = re.compile(r"""\s*(?:(?P<num>\d+(?:\.\d+)?)|(?P<str>"(?:[^"\\]|\\.)*")|(?P<op>==|!=|<=|>=|<|>|\(|\))|(?P<word>[A-Za-z_][A-Za-z0-9_]*))""")
KEYWORDS = {"and", "or", "not", "null", "true", "false"}


def snake(name: str) -> str:
    return re.sub(r"(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", "_", name).lower()


def tokens(expression: str):
    position, out = 0, []
    while position < len(expression):
        if not expression[position:].strip():
            break
        m = TOKEN.match(expression, position)
        if not m:
            return None
        position = m.end()
        kind = m.lastgroup
        out.append((kind, m.group(kind)))
    return out


def business_logic_checks(entities: dict[str, tuple[pathlib.Path, dict]]) -> None:
    """BL-001…BL-011 of specification/business-logic.yaml."""
    seen_ids: dict[str, str] = {}
    for name, (_, entity) in entities.items():
        attrs = {a["name"]: a for a in entity.get("attributes") or []}
        columns = {snake(a) for a in attrs} | {"id", "created_at", "updated_at", "version"}
        # A to-one relationship is a foreign key column on this entity.
        columns |= {snake(r["name"]) + "_id" for r in entity.get("relationships") or [] if str(r.get("cardinality")) in ("1", "0..1")}
        life = entity.get("lifecycle")
        states: set[str] = set()
        initial = None
        status_attr = next((a for a in ("status", "state", "stage") if a in attrs and attrs[a].get("values")), None)
        if isinstance(life, dict):
            governed = life.get("attribute") or status_attr
            values = [str(v) for v in (attrs.get(governed, {}).get("values") or [])]
            states = {str(x) for x in life.get("states") or []}
            if states != set(values):
                errors.append(f"{name}: BL-001 lifecycle states differ from {governed} values (missing {sorted(set(values) - states)}, extra {sorted(states - set(values))})")
            initial = life.get("initial") or ((life.get("states") or [None])[0])
            terminal = {str(x) for x in life.get("terminal") or []}
            if initial not in states:
                errors.append(f"{name}: BL-002 lifecycle initial {initial!r} is not a state")
            for t in terminal - states:
                errors.append(f"{name}: BL-002 terminal {t!r} is not a state")
            pairs, graph = set(), defaultdict(set)
            for t in life.get("transitions") or []:
                a, b = str(t.get("from")), str(t.get("to"))
                if a not in states or b not in states:
                    errors.append(f"{name}: BL-003 transition {a}→{b} names a state the lifecycle does not declare")
                    continue
                if (a, b) in pairs:
                    errors.append(f"{name}: BL-003 transition {a}→{b} is declared twice")
                pairs.add((a, b))
                graph[a].add(b)
                if a in terminal:
                    errors.append(f"{name}: BL-004 terminal state {a} has an outgoing transition to {b}")
            reach, frontier = {initial}, [initial]
            while frontier:
                for nxt in graph[frontier.pop()]:
                    if nxt not in reach:
                        reach.add(nxt)
                        frontier.append(nxt)
            for state in sorted(states - reach):
                errors.append(f"{name}: BL-005 state {state} is not reachable from {initial}")
            if terminal:
                for state in sorted(states - terminal):
                    seen, todo = {state}, [state]
                    while todo:
                        for nxt in graph[todo.pop()]:
                            if nxt not in seen:
                                seen.add(nxt)
                                todo.append(nxt)
                    if not (seen & terminal):
                        errors.append(f"{name}: BL-006 state {state} cannot reach a terminal state")
        elif status_attr:
            warnings.append(f"{name}: BL-011 {status_attr} has values and the entity states no lifecycle")

        for inv in entity.get("invariants") or []:
            ident = str(inv.get("id"))
            if ident in seen_ids and seen_ids[ident] != name:
                errors.append(f"{name}: BL-007 invariant id {ident} is also used by {seen_ids[ident]}")
            seen_ids[ident] = name
            when = inv.get("violatedWhen")
            if when is None:
                continue
            if not inv.get("message"):
                errors.append(f"{name}.{ident}: BL-007 an executable invariant needs a message")
            toks = tokens(str(when))
            if toks is None:
                errors.append(f"{name}.{ident}: BL-008 violatedWhen is not an expression the rules engine reads: {when!r}")
                continue
            idents = [v for k, v in toks if k == "word" and v not in KEYWORDS]
            for word in idents:
                if word not in columns:
                    errors.append(f"{name}.{ident}: BL-008 violatedWhen names {word!r}, which is not a column of {name}")
            for i, (k, v) in enumerate(toks):
                if k == "op" and v in ("<", "<=", ">", ">=") and i > 0 and toks[i - 1][0] == "word":
                    column = toks[i - 1][1]
                    if column in attrs or snake(column) in {snake(a) for a in attrs}:
                        if f"{column} != null" not in str(when) and attrs.get(next((a for a in attrs if snake(a) == column), ""), {}).get("required") is not True:
                            errors.append(f"{name}.{ident}: BL-008 compares {column} without first guarding it against null")
            # A state named in a comparison is a state the lifecycle declares.
            for i, (k, v) in enumerate(toks[:-2]):
                if k == "word" and v in ("status", "state", "stage") and toks[i + 1] == ("op", "==") and toks[i + 2][0] == "str" and states:
                    literal = toks[i + 2][1].strip('"')
                    if literal not in states:
                        errors.append(f"{name}.{ident}: BL-009 names state {literal!r}, which the lifecycle does not declare")
                    if initial is not None and literal == initial:
                        errors.append(f"{name}.{ident}: BL-010 applies to the initial state {initial}, so a new record could not be created")


def reference_data_checks(entities: dict[str, tuple[pathlib.Path, dict]]) -> None:
    """REF-001…REF-004 of specification/reference-data.yaml."""
    loaded: dict[str, dict] = {}
    for name, (_, entity) in entities.items():
        ref = entity.get("referenceData")
        if not ref:
            continue
        data = load_yaml(ROOT / "domain" / ref).get("referenceData") or {}
        if data.get("entity") != name:
            errors.append(f"{name}: REF-001 {ref} holds the rows of {data.get('entity')!r}")
            continue
        loaded[name] = data
    for name, data in loaded.items():
        entity = entities[name][1]
        attrs = {a["name"]: a for a in entity.get("attributes") or []}
        rels = {r["name"]: r for r in entity.get("relationships") or []}
        key = data.get("key")
        seen: set = set()
        for row in data.get("rows") or []:
            if key not in row:
                errors.append(f"{name}: REF-001 a row has no {key}")
                continue
            if row[key] in seen:
                errors.append(f"{name}: REF-001 {key} {row[key]!r} appears twice")
            seen.add(row[key])
            for field, value in row.items():
                if field in rels:
                    target = rels[field]["target"]
                    if target in loaded:
                        keys = {r.get(loaded[target]["key"]) for r in loaded[target]["rows"]}
                        if value not in keys:
                            errors.append(f"{name} {row[key]}: REF-002 {field} {value!r} is not a row of {target}")
                elif field in attrs:
                    spec = attrs[field]
                    if isinstance(value, str) and spec.get("maxLength") and len(value) > int(spec["maxLength"]):
                        errors.append(f"{name} {row[key]}: REF-003 {field} is {len(value)} long; the attribute allows {spec['maxLength']}")
                    values = spec.get("values")
                    if values and str(value) not in {str(v) for v in values}:
                        errors.append(f"{name} {row[key]}: REF-003 {field} {value!r} is not one of {values}")
                else:
                    errors.append(f"{name} {row[key]}: REF-003 {field} is not an attribute or relationship of {name}")
            for attr_name, spec in attrs.items():
                if spec.get("required") is True and attr_name not in row and attr_name != entity.get("identity", {}).get("key"):
                    errors.append(f"{name} {row[key]}: REF-003 required {attr_name} is missing")
    # REF-004: narrowedBy names references of the entity, and the target has its own key to each.
    for name, (_, entity) in entities.items():
        rels = {r["name"]: r for r in entity.get("relationships") or []}
        refs = {a["name"] for a in entity.get("attributes") or [] if a.get("type") == "reference"} | set(rels)
        for holder in list(entity.get("relationships") or []) + list(entity.get("attributes") or []):
            narrowed = holder.get("narrowedBy")
            if not narrowed:
                continue
            for control in narrowed:
                if control not in refs:
                    errors.append(f"{name}.{holder['name']}: REF-004 narrowedBy names {control!r}, which is not a reference of {name}")
                    continue
                controlled = (rels.get(control) or next((a for a in entity["attributes"] if a["name"] == control), {})).get("target")
                target = entities.get(holder.get("target") or "", (None, {}))[1]
                if target and controlled and not any(r.get("target") == controlled and str(r.get("cardinality")) in ("1", "0..1") for r in target.get("relationships") or []):
                    errors.append(f"{name}.{holder['name']}: REF-004 {holder.get('target')} has no key to {controlled}, so {control} cannot narrow it")


def main() -> int:
    if not REGISTRY.exists():
        errors.append(f"Missing registry: {REGISTRY}")
        return finish()

    registry = load_yaml(REGISTRY).get("registry", {})
    registered = registry.get("entities", [])
    if not isinstance(registered, list):
        errors.append("registry.entities must be a list")
        return finish()

    # Every specification file must at least be YAML: a catalog that does not
    # parse is one no tool can read, and nothing else here would notice.
    for directory in ("specification", "domains", "schema", "applications"):
        for path in sorted((ROOT / directory).glob("*.yaml")):
            load_yaml(path)

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

        for where in split_text(entity):
            errors.append(
                f"{path}: {where} has text split at a comma by a YAML flow mapping "
                "(quote it; tools/repair_flow_text.py repairs this)"
            )

        identity = entity.get("identity", {})
        if entity.get("kind") != "value_object" and not identity.get("key"):
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
                if cardinality not in CARDINALITIES and not (isinstance(cardinality, str) and CARDINALITY_PATTERN.fullmatch(cardinality)):
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

    dictionary_checks(entities)
    structure_checks(entities)
    business_logic_checks(entities)
    reference_data_checks(entities)

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
