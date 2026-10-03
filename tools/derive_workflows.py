#!/usr/bin/env python3
"""Write each entity's workflows into its file, from its lifecycle.

specification/business-logic.yaml: an entity's `workflows` start when a record
meets a condition. Where an entity has a lifecycle, the moves into the states
that need a person — a request awaiting a decision, work that has stopped, a
record cancelled or rejected, a document completed — raise a Task for that
person, the way an SAP or Oracle workflow inbox does. The condition is
edge-triggered (`status != _previous_status`), so a task is raised when the
record *enters* the state and not on every edit made while it is there.

An entity that already states `workflows` is never touched, and `Task` itself
is skipped: a task that raised a task on being blocked would never stop.
A re-run changes nothing.

    python tools/derive_workflows.py [--check]
"""
from __future__ import annotations

import json
import pathlib
import re
import sys

import yaml

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import dictionary_lib as d  # noqa: E402

SKIP = {"Task", "Workflow", "Approval"}

APPROVAL = ["SUBMITTED", "PENDING_APPROVAL", "UNDER_REVIEW", "REQUESTED", "PROPOSED"]
EXCEPTION = ["BLOCKED", "ON_HOLD", "HELD", "FAILED", "EXCEPTION", "QUARANTINED", "OVERDUE", "BREACHED"]
FOLLOW_UP = ["REJECTED", "CANCELLED", "VOID", "REVERSED", "DENIED"]
COMPLETION = ["COMPLETED", "FULFILLED", "DELIVERED", "POSTED"]

LABEL_ATTRS = ["name", "title", "fullName", "displayName", "code", "number", "reference"]


def an(words: str) -> str:
    """`a` or `an` before a phrase, by its sound."""
    first = words.strip().split(" ")[0].lower() if words.strip() else ""
    vowel = bool(first) and first[0] in "aeiou" and not first.startswith(("use", "uni", "eu", "one"))
    return "an" if vowel or first in ("hour", "honest") else "a"


def snake(name: str) -> str:
    return re.sub(r"(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", "_", name).lower()


def label_column(entity: dict) -> str | None:
    names = [a["name"] for a in entity.get("attributes") or [] if str(a.get("type")) in ("string", "text")]
    for wanted in LABEL_ATTRS:
        if wanted in names:
            return snake(wanted)
    for n in names:
        if n.endswith("Number"):
            return snake(n)
    return None


def condition(column: str, states: list[str]) -> str:
    any_of = " or ".join(f'{column} == "{s}"' for s in states)
    return f"({any_of}) and {column} != _previous_{column}" if len(states) > 1 else f'{column} == "{states[0]}" and {column} != _previous_{column}'


def task_step(entity: str, kind: str, task_type: str, priority: str, heading: str, why: str, label: str | None, column: str) -> dict:
    words = d.lower_words(entity)
    ref = "{{" + label + "}}" if label else "{{id}}"
    prefix = re.sub(r"(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", "-", entity).upper()
    return {
        "id": "S1",
        "type": "CreateEntity",
        "label": f"Raise a task: {heading.lower()}",
        "properties": {
            "entity": "Task",
            "as": "taskId",
            "fields": {
                "code": f"{prefix}-{kind}-" + "{{id}}",
                "name": f"{heading} {words} {ref}",
                "description": f"{d.cap(words) if hasattr(d, 'cap') else words.capitalize()} {ref} is now " + "{{" + column + "}}. " + why,
                "task_type": task_type,
                "status": "CREATED",
                "priority": priority,
            },
        },
    }


def derive(entity: dict) -> list[dict]:
    life = entity.get("lifecycle")
    if not isinstance(life, dict) or entity["name"] in SKIP:
        return []
    column = snake(life.get("attribute") or "status")
    states = [str(s) for s in life.get("states") or []]
    label = label_column(entity)
    name = entity["name"]
    words = d.lower_words(name)
    out: list[dict] = []

    def add(workflow: str, title: str, hit: list[str], step: dict, description: str):
        if hit:
            out.append({"name": workflow, "title": title, "description": description, "when": condition(column, hit), "steps": [step]})

    hit = [s for s in APPROVAL if s in states]
    add("ApprovalRequested", f"Ask for a decision when {an(words)} {words} is put forward", hit,
        task_step(name, "APPROVAL", "APPROVAL", "NORMAL", "Decide on", "Approve it, return it for change or reject it; the move you make is recorded on the record.", label, column),
        f"When {an(words)} {words} is {' or '.join(s.lower().replace('_', ' ') for s in hit)}, a task asks someone to decide on it.")
    hit = [s for s in EXCEPTION if s in states]
    add("ExceptionRaised", f"Raise a task when {an(words)} {words} is stopped", hit,
        task_step(name, "EXCEPTION", "USER", "HIGH", "Resolve", "Find out why it stopped and move it on or close it.", label, column),
        f"When {an(words)} {words} is {' or '.join(s.lower().replace('_', ' ') for s in hit)}, a high-priority task asks someone to resolve it.")
    hit = [s for s in FOLLOW_UP if s in states]
    add("FollowUpRequired", f"Follow up when {an(words)} {words} is ended", hit,
        task_step(name, "FOLLOW-UP", "USER", "NORMAL", "Follow up on", "Check the records that depended on it and tell the people affected.", label, column),
        f"When {an(words)} {words} is {' or '.join(s.lower().replace('_', ' ') for s in hit)}, a task asks someone to settle what depended on it.")
    if d.kind_class(entity.get("kind")) in ("transaction", "line"):
        hit = [s for s in COMPLETION if s in states]
        add("CompletionConfirmed", f"Confirm when {an(words)} {words} is done", hit,
            task_step(name, "COMPLETED", "USER", "LOW", "Confirm", "Check the outcome is what was agreed and close any open items.", label, column),
            f"When {an(words)} {words} is {' or '.join(s.lower().replace('_', ' ') for s in hit)}, a task asks someone to confirm the outcome.")
    return out


def q(value) -> str:
    return json.dumps(value, ensure_ascii=False)


def render(workflows: list[dict]) -> list[str]:
    lines = ["  workflows:"]
    for w in workflows:
        lines += [
            f"    - name: {w['name']}",
            f"      title: {q(w['title'])}",
            f"      description: {q(w['description'])}",
            f"      when: {q(w['when'])}",
            "      steps:",
        ]
        for s in w["steps"]:
            lines += [
                f"        - id: {s['id']}",
                f"          type: {s['type']}",
                f"          label: {q(s['label'])}",
                "          properties:",
                f"            entity: {s['properties']['entity']}",
                f"            as: {s['properties']['as']}",
                "            fields:",
            ]
            for k, v in s["properties"]["fields"].items():
                lines.append(f"              {k}: {q(v)}")
    return lines


def process(text: str) -> str:
    entity = yaml.safe_load(text)["entity"]
    if "workflows" in entity:
        return text
    workflows = derive(entity)
    if not workflows:
        return text
    lines = text.split("\n")
    at = next(i for i, l in enumerate(lines) if l.startswith("  help:"))
    lines[at:at] = render(workflows)
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
                yaml.safe_load(out)
                path.write_text(out)
    print(f"{len(changed)} entity file(s) {'need' if check else 'received'} workflows")
    return 1 if check and changed else 0


if __name__ == "__main__":
    raise SystemExit(main())
