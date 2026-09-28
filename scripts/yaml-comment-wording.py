#!/usr/bin/env python3
"""Rewrite comments in converted models that describe the model as Mermaid.

A converted model keeps its author's comments, and some of them were written
about the Mermaid form: "every diagram is valid, renderable Mermaid", a
`%%rbac` directive, a command that reads a `.mmd`. Only comment lines are
touched; the verification (yaml/verify) re-proves that the models are
unchanged.
"""
import re, sys

BLOCKS = [
    ("""# Every rule, state and saga diagram below is stock Mermaid and renders as
# drawn. The ERD carries EML's OPTIONAL modifier, which Mermaid's ER grammar
# has no equivalent for, so it renders through toRenderableMermaid()
# (packages/web/src/lib/mermaid-render.ts) — the normalization the application
# applies to every ERD before handing it to Mermaid.
""", """# Every entity, rule, state machine and saga below is drawn by the model
# viewer from this document; the YAML itself is what every generator reads.
"""),
    ("""# reports for every role on the matrix. Every diagram is valid, renderable
# Mermaid.
""", """# reports for every role on the matrix.
"""),
    ("""# compile the workflow section or %%rbac. Both are written anyway: the same
# file generates a whole application under --stack tanstack-nestjs, and the
# checker validates all of it either way.
""", """# compile the workflows or rbac. Both are written anyway: the same file
# generates a whole application under --stack tanstack-astryx-loco, and the
# checker validates all of it either way.
"""),
    ("""  # saga — and so cannot live in a screen. The flowchart is what a reader sees
  # and the `%%hook` lines are what the generator compiles; both halves have to
  # say the same thing.
""", """  # saga — and so cannot live in a screen. The hook flow is what a reader sees
  # and the `hooks` entries are what the generator compiles; both halves have to
  # say the same thing.
"""),
    ("""  # through a saga — so none of it can live in a screen. The flowchart is what a
  # reader sees and the `%%hook` lines are what the generator compiles into
""", """  # through a saga — so none of it can live in a screen. The hook flow is what a
  # reader sees and the `hooks` entries are what the generator compiles into
"""),
    ("""  # Nobody presses these; the clock does. `%%trigger` is validated rather
  # than compiled, so it documents the schedule the operator has to provide
  # rather than creating it — check the directive's status before promising
""", """  # Nobody presses these; the clock does. A trigger is validated rather
  # than compiled, so it documents the schedule the operator has to provide
  # rather than creating it — check the construct's status before promising
"""),
    ("""  # What `%%entity … help:` and `%%field … help:` buy: they are compiled into
""", """  # What an entity's and an attribute's `help` buy: they are compiled into
"""),
]

LINE = [
    (r" Every diagram below is valid, renderable Mermaid\.", ""),
    (r" All diagrams are valid, renderable Mermaid\.", ""),
    (r" Every diagram is valid, renderable Mermaid\.", ""),
    (r"%%enum-bound", "enum-bound"),
    (r"%%rbac", "rbac"),
    (r"a declared %%enum", "a declared enum"),
    (r"The %%action hands", "The action hands"),
    (r"Its %%action is", "Its action is"),
    (r"rule's\n", "rule's\n"),
    (r"^(\s*#\s*)%%action names them", r"\1action names them"),
    (r"no %%action directives", "no actions"),
    (r"bun language/checker\.ts (\S+?)\.eml\.mmd", r"bun language/cli/eml.ts validate -i \1.eml.yaml"),
    (r"-i (\S+?)\.eml\.mmd", r"-i \1.eml.yaml"),
    (r"-i (\S+?)\.erd\.mmd", r"-i \1.erd.eml.yaml"),
    (r"EML specification in clinic\.mmd", "EML specification in clinic.md"),
]

def rewrite(text):
    for old, new in BLOCKS:
        text = text.replace(old, new)
    out = []
    for line in text.split("\n"):
        if line.lstrip().startswith("#"):
            for pattern, repl in LINE:
                line = re.sub(pattern, repl, line)
            line = line.rstrip() if line.rstrip() != line and line.strip() != "#" else line
        out.append(line)
    return "\n".join(out)

for path in sys.argv[1:]:
    text = open(path, encoding="utf-8").read()
    new = rewrite(text)
    if new != text:
        open(path, "w", encoding="utf-8").write(new)
        print("rewrote", path)
