#!/usr/bin/env python3
"""Replace an entity's lifecycle transitions and terminal states.

    python tools/lifecycle_set.py BankLoan --terminal PAID_OFF,DEFAULTED,CANCELLED \\
        APPLICATION>APPROVED:approve APPROVED>ACTIVE:activate ...

Every state named in a transition must be one of the lifecycle's `states`.
"""
from __future__ import annotations

import pathlib
import sys

from ruamel.yaml import YAML
from ruamel.yaml.comments import CommentedMap

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import help_shapes as hs  # noqa: E402

yaml = YAML()
yaml.preserve_quotes = True
yaml.width = 100000
yaml.indent(mapping=2, sequence=4, offset=2)


def main(argv: list[str]) -> int:
    name = argv[0]
    terminal = None
    initial = None
    edges = []
    it = iter(argv[1:])
    for arg in it:
        if arg == "--initial":
            initial = next(it)
        elif arg == "--terminal":
            terminal = [s for s in next(it).split(",") if s]
        else:
            edge, _, action = arg.partition(":")
            a, _, b = edge.partition(">")
            edges.append((a, b, action))
    for path in hs.ENTITIES.glob("*.yaml"):
        if path.name == "index.yaml":
            continue
        with path.open() as h:
            doc = yaml.load(h)
        if doc["entity"]["name"] != name:
            continue
        lc = doc["entity"]["lifecycle"]
        states = set(lc["states"])
        for a, b, _ in edges:
            if a not in states or b not in states:
                raise SystemExit(f"{a}>{b}: not in states {sorted(states)}")
        new = []
        for a, b, action in edges:
            m = CommentedMap()
            m["from"], m["to"], m["action"] = a, b, action
            m.fa.set_flow_style()
            new.append(m)
        lc["transitions"] = new
        if initial is not None:
            lc["initial"] = initial
        if terminal is not None:
            lc["terminal"] = terminal
        with path.open("w") as h:
            yaml.dump(doc, h)
        print(f"{name}: {len(new)} transitions, terminal={lc['terminal']}")
        return 0
    raise SystemExit(f"no entity {name}")


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
