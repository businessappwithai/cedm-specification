#!/usr/bin/env python3
"""Remove the keys that only restate a field's `required` flag.

`requiredMeaning: Required.` and `optionalMeaning: Optional.` say what the schema
already says; the longer template forms said it at length. The dictionary shows a
field's required state from `required`, so the text adds nothing.

    python tools/help_strip.py [--check]
"""
from __future__ import annotations

import pathlib
import sys

from ruamel.yaml import YAML

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import help_shapes as hs  # noqa: E402

KEYS = ("requiredMeaning", "optionalMeaning")
yaml = YAML()
yaml.preserve_quotes = True
yaml.width = 100000
yaml.indent(mapping=2, sequence=4, offset=2)


def main(argv: list[str]) -> int:
    check = "--check" in argv
    touched = 0
    for path in sorted(hs.ENTITIES.glob("*.yaml")):
        if path.name == "index.yaml":
            continue
        with path.open() as handle:
            doc = yaml.load(handle)
        changed = False
        for attr in doc["entity"].get("attributes") or []:
            help_ = attr.get("help")
            if isinstance(help_, dict):
                for key in KEYS:
                    if key in help_:
                        del help_[key]
                        changed = True
        if changed:
            touched += 1
            if not check:
                with path.open("w") as handle:
                    yaml.dump(doc, handle)
    print(f"{touched} entit{'y' if touched == 1 else 'ies'} {'carry' if check else 'cleaned of'} requiredMeaning/optionalMeaning")
    return 1 if check and touched else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
