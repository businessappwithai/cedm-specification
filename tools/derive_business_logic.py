#!/usr/bin/env python3
"""Write each entity's executable business logic into its file.

specification/business-logic.yaml says what an entity states: a `lifecycle` (the
states of its status attribute and the moves between them) and invariants that
carry a `violatedWhen` condition, which a generated application enforces. The
library's prose invariants and `help.lifecycle` text describe these but cannot
be run; this tool derives the executable form from what the entity already says
about itself — its status values, its paired dates, its quantities — and inserts
it as text, so the file's own style and every line an author wrote stay as they
were. An entity that already states a `lifecycle`, and invariants already
present, are never touched. A re-run changes nothing.

    python tools/derive_business_logic.py [--check]
"""
from __future__ import annotations

import json
import pathlib
import re
import sys

import yaml

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import dictionary_lib as d  # noqa: E402

# --------------------------------------------------------------------------
# Lifecycle
# --------------------------------------------------------------------------

INITIAL_ORDER = [
    "DRAFT", "NEW", "CANDIDATE", "IDENTIFIED", "DEVELOPMENT", "RESEARCH", "FUTURE", "EXPECTED",
    "REQUESTED", "REPORTED", "RECORDED", "PROPOSED", "QUOTED", "PLANNED", "PENDING", "EMPTY",
]
# Detours a record leaves and returns from.
SIDE = {
    "SUSPENDED", "ON_HOLD", "HELD", "BLOCKED", "LOCKED", "FROZEN", "QUARANTINED", "MAINTENANCE",
    "UNDER_MAINTENANCE", "OUT_OF_SERVICE", "EXCEPTION", "ON_LEAVE", "INACTIVE", "CLEANING",
    "GROUNDED", "DISABLED", "INSPECTION_PENDING", "CONTAINED", "OVERDUE", "NEGOTIATION",
}
# Ends of the road that mean the thing did not go through, or is no longer in use.
NEGATIVE = {
    "CANCELLED", "REJECTED", "FAILED", "EXPIRED", "TERMINATED", "VOID", "REVERSED", "DISCONTINUED",
    "RETIRED", "WITHDRAWN", "LOST", "DISPOSED", "SCRAPPED", "DENIED", "REVOKED", "OBSOLETE",
    "SUPERSEDED", "DECOMMISSIONED", "NO_SHOW", "BREACHED", "MATERIALIZED", "WAIVED", "REFUNDED",
    "SOLD",
}
# Ends of the road that mean it ran its course.
POSITIVE = {
    "COMPLETED", "CLOSED", "ARCHIVED", "FULFILLED", "DELIVERED", "PAID", "SETTLED", "RESOLVED",
    "CONSUMED", "FULLY_APPLIED", "PASSED", "FILLED", "INSTALLED", "RETURNED", "SOFT_CLOSED",
    "CLEARED", "EXECUTED", "DISPOSITIONED", "AWARDED",
}
POSITIVE_ORDER = ["COMPLETED", "FULFILLED", "DELIVERED", "PAID", "SETTLED", "RESOLVED", "SOFT_CLOSED", "CLOSED", "ARCHIVED"]
# A negative end that only makes sense after the thing happened.
AFTER_THE_FACT = {"REVERSED", "REFUNDED", "RETURNED"}
# A negative end that only makes sense once it has begun.
NOT_AT_THE_START = {"FAILED", "EXPIRED", "TERMINATED", "BREACHED", "NO_SHOW", "LOST", "DISPOSED", "SCRAPPED"}

VERB = {
    "ACTIVE": "activate", "APPROVED": "approve", "SUBMITTED": "submit", "CANCELLED": "cancel",
    "REJECTED": "reject", "COMPLETED": "complete", "CLOSED": "close", "RETIRED": "retire",
    "SUSPENDED": "suspend", "BLOCKED": "block", "INACTIVE": "deactivate", "IN_PROGRESS": "start",
    "RELEASED": "release", "POSTED": "post", "REVERSED": "reverse", "EXPIRED": "expire",
    "FAILED": "fail", "VOID": "void", "ARCHIVED": "archive", "PLANNED": "plan", "PENDING": "submit",
    "ON_HOLD": "hold", "ASSIGNED": "assign", "OPEN": "open", "ISSUED": "issue", "ACCEPTED": "accept",
    "RECEIVED": "receive", "DELIVERED": "deliver", "SHIPPED": "ship", "PAID": "pay",
    "TERMINATED": "terminate", "WITHDRAWN": "withdraw", "DENIED": "deny", "REVOKED": "revoke",
    "DISCONTINUED": "discontinue", "FULFILLED": "fulfil", "RESOLVED": "resolve", "CONFIRMED": "confirm",
    "UNDER_REVIEW": "review", "PUBLISHED": "publish", "LOCKED": "lock", "DISABLED": "disable",
    "QUARANTINED": "quarantine", "CONSUMED": "consume", "REFUNDED": "refund", "SETTLED": "settle",
    "AUTHORIZED": "authorize", "BOOKED": "book", "RESERVED": "reserve", "VERIFIED": "verify",
}
RETURN_VERB = {
    "SUSPENDED": "resume", "ON_HOLD": "resume", "HELD": "resume", "BLOCKED": "unblock",
    "INACTIVE": "reactivate", "LOCKED": "unlock", "QUARANTINED": "release", "FROZEN": "unfreeze",
    "MAINTENANCE": "return_to_service", "UNDER_MAINTENANCE": "return_to_service",
    "OUT_OF_SERVICE": "return_to_service", "EXCEPTION": "resolve_exception", "GROUNDED": "return_to_service",
    "DISABLED": "enable", "CLEANING": "finish_cleaning", "ON_LEAVE": "return_from_leave",
}


def verb(target: str) -> str:
    return VERB.get(target, "mark_" + target.lower())


def lifecycle_of(values: list[str]) -> dict | None:
    """States, initial, terminal and transitions for a status attribute's values."""
    if len(values) < 2:
        return None
    side = [v for v in values if v in SIDE]
    negative = [v for v in values if v in NEGATIVE and v not in SIDE]
    positive = [v for v in values if v in POSITIVE and v not in NEGATIVE]
    positive.sort(key=lambda v: POSITIVE_ORDER.index(v) if v in POSITIVE_ORDER else 50)
    taken = set(side) | set(negative) | set(positive)
    progress = [v for v in values if v not in taken]
    # Progress runs from the state a record starts in, and otherwise as declared.
    progress.sort(key=lambda v: (INITIAL_ORDER.index(v) if v in INITIAL_ORDER else len(INITIAL_ORDER)) if v in INITIAL_ORDER else 100)
    declared = {v: i for i, v in enumerate(values)}
    initial_known = [v for v in progress if v in INITIAL_ORDER]
    rest = sorted((v for v in progress if v not in INITIAL_ORDER), key=declared.get)
    progress = sorted(initial_known, key=INITIAL_ORDER.index) + rest

    if not progress:
        # Nothing but detours and ends: the first declared value is where it starts.
        progress = [values[0]]
        side = [v for v in side if v != values[0]]
        negative = [v for v in negative if v != values[0]]
        positive = [v for v in positive if v != values[0]]

    transitions: list[tuple[str, str, str]] = []

    def edge(a: str, b: str, action: str):
        if a != b and not any(t[0] == a and t[1] == b for t in transitions):
            transitions.append((a, b, action))

    for a, b in zip(progress, progress[1:]):
        edge(a, b, verb(b))
    last = progress[-1]
    if positive:
        edge(last, positive[0], verb(positive[0]))
        for a, b in zip(positive, positive[1:]):
            edge(a, b, verb(b))
    live = progress[1:] or progress
    for s in side:
        for p in live:
            edge(p, s, verb(s))
            edge(s, p, RETURN_VERB.get(s, "resume"))
    ends = positive[-1:] if positive else []
    for n in negative:
        if n in AFTER_THE_FACT:
            sources = [last] + positive
        elif n in NOT_AT_THE_START and len(progress) > 1:
            sources = progress[1:] + side
        else:
            sources = progress + side + ([] if n not in ("RETIRED", "DISCONTINUED", "OBSOLETE", "DECOMMISSIONED", "TERMINATED", "SUPERSEDED") else positive)
        for s in sources:
            edge(s, n, verb(n))
    terminal = ends + negative
    if not terminal:
        # A model that never ends: nothing is terminal, and that is stated, not assumed.
        terminal = []
    # A terminal state has no outgoing moves (LIFE-003).
    transitions = [t for t in transitions if t[0] not in terminal]
    return {
        "states": values,
        "initial": progress[0],
        "terminal": terminal,
        "transitions": transitions,
    }


def render_lifecycle(entity: str, attr: str, plan: dict) -> list[str]:
    title = d.words(entity) + " Lifecycle"
    lines = [
        "  lifecycle:",
        f"    title: {title}",
        f"    attribute: {attr}",
        "    states: [" + ", ".join(plan["states"]) + "]",
        f"    initial: {plan['initial']}",
    ]
    if plan["terminal"]:
        lines.append("    terminal: [" + ", ".join(plan["terminal"]) + "]")
    lines.append("    transitions:")
    for a, b, action in plan["transitions"]:
        lines.append(f"      - {{from: {a}, to: {b}, action: {action}}}")
    return lines


# --------------------------------------------------------------------------
# Executable invariants
# --------------------------------------------------------------------------

def cap(text: str) -> str:
    """Sentence case: the first letter upper, the rest as it is."""
    return text[:1].upper() + text[1:]


def column(name: str) -> str:
    return re.sub(r"(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", "_", name).lower()


START = r"(Start|From|Begin|Effective|Valid)"
END = {"Start": "End", "From": "To", "Begin": "End", "Effective": "Expiry", "Valid": "Expiry"}
DATE_TYPES = {"date", "datetime"}
NON_NEGATIVE = re.compile(r"(quantity|qty|amount|price|cost|total|subtotal|count|duration|weight|volume|capacity|fee|charge|tax|rate)$", re.I)
SIGNED = re.compile(r"(adjust|variance|delta|balance|net|gain|loss|credit|debit|offset|difference|change|temperature|latitude|longitude|score|exchange|interest|growth|margin|profit|drift|bias|signed)", re.I)
# Entities whose amounts are signed by convention (debits and credits, movements both ways).
SIGNED_ENTITIES = re.compile(r"(Journal|Ledger|Adjustment|BankTransaction|Reconciliation|Variance|Valuation|Posting|CashFlow|Forecast|Movement|Statement)")
REASONS = {
    "CANCELLED": ["cancellationReason", "cancelReason", "reasonForCancellation"],
    "REJECTED": ["rejectionReason", "rejectReason"],
    "ON_HOLD": ["holdReason"],
    "SUSPENDED": ["suspensionReason"],
    "BLOCKED": ["blockReason", "blockedReason"],
    "FAILED": ["failureReason"],
    "REVERSED": ["reversalReason"],
    "VOID": ["voidReason"],
    "DENIED": ["denialReason"],
    "TERMINATED": ["terminationReason"],
    "WITHDRAWN": ["withdrawalReason"],
}
STAMPS = {
    "COMPLETED": ["completedAt", "completedOn", "completionDate"],
    "CLOSED": ["closedAt", "closedOn", "closedDate"],
    "APPROVED": ["approvedAt", "approvedOn", "approvalDate"],
    "POSTED": ["postedAt", "postingDate"],
    "CANCELLED": ["cancelledAt", "cancelledOn", "cancellationDate"],
    "SHIPPED": ["shippedAt", "shipDate"],
    "DELIVERED": ["deliveredAt", "deliveryDate"],
    "RETIRED": ["retiredAt", "retiredOn", "retirementDate"],
}


def executable_invariants(entity: dict) -> list[dict]:
    """Conditions the entity's own structure implies, as `violatedWhen` invariants."""
    name = entity["name"]
    attrs = {a["name"]: a for a in entity.get("attributes") or []}
    out: list[dict] = []
    prefix = re.sub(r"(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", "-", name).upper()

    def add(rule, when, message):
        out.append({"id": f"{prefix}-EXE-{len(out) + 1:03d}", "rule": rule, "violatedWhen": when, "message": message})

    def is_date(a): return str(attrs[a].get("type")) in DATE_TYPES

    # Start and end: a thing does not finish before it starts.
    done = set()
    for a in attrs:
        m = re.match(rf"^(.*?){START}(Date|Time|At|On|DateTime)?$", a)
        if not m or not is_date(a):
            continue
        stem, key, tail = m.group(1), m.group(2), m.group(3) or ""
        candidates = [f"{stem}{END[key]}{tail}", f"{stem}{END[key]}Date"] + ([f"{stem}To{tail}"] if key in ("Effective", "Valid") else [])
        for other in candidates:
            if other in attrs and is_date(other) and (a, other) not in done:
                done.add((a, other))
                s, e = column(a), column(other)
                add(
                    f"{cap(d.words(other))} must not be earlier than {d.lower_words(a)}.",
                    f"{s} != null and {e} != null and {e} < {s}",
                    f"{cap(d.words(other))} cannot be earlier than {d.lower_words(a)}.",
                )
                break

    # Quantities and amounts are not negative; a percentage runs from 0 to 100.
    for a, spec in attrs.items():
        t = str(spec.get("type")).lower()
        if t not in ("decimal", "integer", "money") or SIGNED.search(a) or SIGNED_ENTITIES.search(name):
            continue
        c = column(a)
        if re.search(r"(percent|percentage|pct)$", a, re.I):
            add(f"{cap(d.words(a))} is a percentage between 0 and 100.", f"{c} != null and ({c} < 0 or {c} > 100)", f"{cap(d.words(a))} must be between 0 and 100.")
        elif NON_NEGATIVE.search(a) and not spec.get("minimum") is None:
            continue
        elif NON_NEGATIVE.search(a):
            add(f"{cap(d.words(a))} cannot be negative.", f"{c} != null and {c} < 0", f"{cap(d.words(a))} cannot be negative.")

    # A move to a state that needs an explanation carries one.
    status = attrs.get("status")
    values = [str(v) for v in (status or {}).get("values") or []]
    if status is not None:
        for state, names in {**REASONS}.items():
            if state in values:
                for r in names:
                    if r in attrs:
                        add(
                            f"A {d.lower_words(name)} that is {state.lower().replace('_', ' ')} states {d.lower_words(r)}.",
                            f'status == "{state}" and {column(r)} == null',
                            f"Give the {d.lower_words(r)} before the {d.lower_words(name)} is {state.lower().replace('_', ' ')}.",
                        )
                        break
        for state, names in STAMPS.items():
            if state in values:
                for r in names:
                    if r in attrs and is_date(r):
                        add(
                            f"A {d.lower_words(name)} that is {state.lower().replace('_', ' ')} states when ({d.lower_words(r)}).",
                            f'status == "{state}" and {column(r)} == null',
                            f"Record {d.lower_words(r)} when the {d.lower_words(name)} is {state.lower().replace('_', ' ')}.",
                        )
                        break
    return out


def q(s: str) -> str:
    return json.dumps(s)


def render_invariant(item: dict, indent: int) -> str:
    pad = " " * indent
    return (
        f"{pad}- {{id: {item['id']}, rule: {q(item['rule'])}, violatedWhen: {q(item['violatedWhen'])}, "
        f"message: {q(item['message'])}}}"
    )


# --------------------------------------------------------------------------
# Text editing
# --------------------------------------------------------------------------

def indent_of(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def block_end(lines: list[str], start: int) -> int:
    """First line after a top-level (2-space) key's block."""
    end = start + 1
    while end < len(lines) and (not lines[end].strip() or indent_of(lines[end]) > 2 or lines[end].startswith("  - ")):
        end += 1
    while end > start + 1 and not lines[end - 1].strip():
        end -= 1
    return end


def process(text: str) -> str:
    doc = yaml.safe_load(text)
    entity = doc["entity"]
    lines = text.split("\n")
    attrs = {a["name"]: a for a in entity.get("attributes") or []}
    edits: list[tuple[int, list[str]]] = []
    replaced: list[tuple[int, int, list[str]]] = []

    def top(key):
        return next((i for i, l in enumerate(lines) if l.startswith(f"  {key}:")), None)

    # Lifecycle
    if "lifecycle" not in entity:
        for attr_name in ("status", "state", "stage"):
            spec = attrs.get(attr_name)
            if spec and spec.get("values"):
                plan = lifecycle_of([str(v) for v in spec["values"]])
                if plan:
                    at = top("help")
                    assert at is not None, entity["name"]
                    edits.append((at, render_lifecycle(entity["name"], attr_name, plan)))
                break

    # A lifecycle that lists its states and draws no moves is a machine with no
    # topology: every move is accepted. Draw it from the states it lists.
    life = entity.get("lifecycle")
    if isinstance(life, dict) and life.get("states") and not life.get("transitions"):
        plan = lifecycle_of([str(v) for v in life["states"]])
        at = top("lifecycle")
        if plan and at is not None and lines[at].startswith("  lifecycle: {"):
            # Written inline as `lifecycle: {states: [...]}`; a block takes the moves.
            governed = life.get("attribute") or next(a for a in ("status", "state", "stage") if a in attrs)
            replaced.append((at, at + 1, render_lifecycle(entity["name"], governed, plan)))
        elif plan and at is not None:
            end = block_end(lines, at)
            extra = []
            if not life.get("initial"):
                extra.append(f"    initial: {plan['initial']}")
            if not life.get("terminal") and plan["terminal"]:
                extra.append("    terminal: [" + ", ".join(plan["terminal"]) + "]")
            extra.append("    transitions:")
            extra += [f"      - {{from: {a}, to: {b}, action: {action}}}" for a, b, action in plan["transitions"]]
            edits.append((end, extra))

    # Executable invariants
    have = {i.get("id") for i in entity.get("invariants") or []}
    already = [i for i in entity.get("invariants") or [] if "-EXE-" in str(i.get("id"))]
    if not already:
        derived = executable_invariants(entity)
        if derived:
            at = top("invariants")
            if at is None:
                at = top("help")
                edits.append((at, ["  invariants:"] + [render_invariant(i, 2) for i in derived]))
            else:
                end = block_end(lines, at)
                body = [i for i in range(at + 1, end) if lines[i].lstrip().startswith("- ")]
                ipad = indent_of(lines[body[0]]) if body else 2
                edits.append((end, [render_invariant(i, ipad) for i in derived]))

    spans = replaced + [(at, at, new) for at, new in edits]
    for start, stop, new in sorted(spans, key=lambda e: (-e[0], -e[1])):
        lines[start:stop] = new
    return "\n".join(lines)


def main() -> int:
    check = "--check" in sys.argv
    changed = []
    for path in sorted((d.ROOT / "domain" / "entities").glob("*.yaml")):
        if path.name == "index.yaml":
            continue
        text = path.read_text()
        out = process(text)
        if out != text:
            changed.append(path.name)
            if not check:
                yaml.safe_load(out)  # never write what does not parse
                path.write_text(out)
    print(f"{len(changed)} entity file(s) {'need' if check else 'received'} business logic")
    return 1 if check and changed else 0


if __name__ == "__main__":
    raise SystemExit(main())
