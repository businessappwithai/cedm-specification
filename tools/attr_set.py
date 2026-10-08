#!/usr/bin/env python3
"""Set a scalar on one attribute of an entity.

    python tools/attr_set.py BankLoan status default=APPLICATION
"""
from __future__ import annotations

import pathlib
import sys

from ruamel.yaml import YAML

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import help_shapes as hs  # noqa: E402

yaml = YAML()
yaml.preserve_quotes = True
yaml.width = 100000
yaml.indent(mapping=2, sequence=4, offset=2)


def main(argv: list[str]) -> int:
    name, attr, *pairs = argv
    for path in hs.ENTITIES.glob("*.yaml"):
        if path.name == "index.yaml":
            continue
        with path.open() as h:
            doc = yaml.load(h)
        if doc["entity"]["name"] != name:
            continue
        for a in doc["entity"]["attributes"]:
            if a["name"] == attr:
                for pair in pairs:
                    k, _, v = pair.partition("=")
                    a[k] = v
                with path.open("w") as h:
                    yaml.dump(doc, h)
                print(f"{name}.{attr}: {pairs}")
                return 0
        raise SystemExit(f"{name} has no attribute {attr}")
    raise SystemExit(f"no entity {name}")


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
