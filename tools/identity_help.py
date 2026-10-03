#!/usr/bin/env python3
"""Give every entity's identity attribute the one help text that is true of it.

An entity's system identifier means the same thing on every record: it is
assigned once, never changes and is what other records store to refer to it.
Writing that afresh 300 times would only produce 300 paraphrases, so the text
is stated here once, with the entity's own label, and help_quality exempts it
from the stamped-text check.

    python3 tools/identity_help.py [--check]
"""
from __future__ import annotations

import pathlib
import sys
from io import StringIO

import yaml as pyyaml

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import apply_authored as authored  # noqa: E402
import dictionary_lib as d  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[1]


def text(label: str) -> dict:
    return {
        "summary": f"The permanent system identifier of the {label} record.",
        "usage": "Assigned by the application when the record is created and never changed; integrations and links use it to find the record.",
        "relationshipContext": f"Other records that refer to a {label} store this identifier. The number or code people quote is a separate field.",
    }


def main() -> int:
    check = "--check" in sys.argv
    changed = 0
    for path in sorted((ROOT / "domain" / "entities").glob("*.yaml")):
        if path.name == "index.yaml":
            continue
        raw = pyyaml.safe_load(path.read_text())["entity"]
        key = (raw.get("identity") or {}).get("key")
        label = d.lower_words(raw["name"])
        attr = next((a for a in raw.get("attributes") or [] if a.get("name") == key), None)
        if attr is None or (attr.get("help") or {}) == text(label):
            continue
        changed += 1
        if check:
            continue
        doc = authored.rt.load(path.read_text())
        node = next(a for a in doc["entity"]["attributes"] if a["name"] == key)
        node.fa.set_block_style()
        node["help"] = authored.block(text(label))
        buffer = StringIO()
        authored.rt.dump(doc, buffer)
        path.write_text(buffer.getvalue())
    print(f"{changed} identity attribute(s) {'need help' if check else 'given help'}")
    return 1 if check and changed else 0


if __name__ == "__main__":
    sys.exit(main())
