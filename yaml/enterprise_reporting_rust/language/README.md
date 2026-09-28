# EML — the model language, as this platform uses it

An application model — entities, relationships, enumerations, business rules,
lifecycle hooks, state machines, sagas and access rules — is one YAML document,
`*.eml.yaml`. The `eml` CLI in this directory reads it and generates code for
this platform from it.

**The language is defined once, at the root of the repository**, and this
directory does not carry a copy of it:

| What | Where |
|---|---|
| The definition (JSON Schema 2020-12) — what the validator runs | [`../../../language/yaml/eml.schema.json`](../../../language/yaml/eml.schema.json) |
| The reference, construct by construct | [`../../../language/yaml/README.md`](../../../language/yaml/README.md) |
| The specification, chapter by chapter | [`../../../language/spec/`](../../../language/spec/00-overview.md) |
| The vocabulary — types, cardinalities, hook events, rule-node types | [`../../../language/appwithai-language.json`](../../../language/appwithai-language.json) |
| The reader and checker — YAML syntax, the schema, ~130 semantic rules, each finding at its YAML line | `packages/generator/src/model-yaml/` |

The CLI reads a model through that reader
([`language/cli/src/document.ts`](../../../language/cli/src/document.ts)), so
`eml validate` here reports exactly what `appwithai validate` reports. The
generators are this platform's own.

---

## Folder layout

```
language/
├── README.md                      # This file
├── cli/                           # The `eml` CLI — validate, inspect, generate
│   ├── README.md
│   ├── eml.ts                     # Executable entrypoint (run with Bun)
│   ├── runtime/src/               # The node-rest stack's dependency-free runtime
│   └── src/
│       ├── cli.ts                 # Argument parsing and command dispatch
│       ├── model.ts               # The CLI's model — re-exported from the root CLI
│       ├── util.ts                # String utilities
│       └── generate/
│           ├── enterprise-reporting.ts  # TanStack Start + Kysely + PostgreSQL code
│           ├── app.ts             # node-rest (dependency-free Node app)
│           ├── jdm.ts             # Business rules → GoRules JDM
│           ├── docker.ts, ci.ts   # --docker (node-rest)
│           └── github.ts          # --github
└── examples/
    ├── minimal.eml.yaml           # Smallest complete example
    ├── helpdesk.eml.yaml          # Support tickets, SLA rule, ticket lifecycle
    ├── ecommerce.eml.yaml         # Catalogue, orders, pricing rules, order lifecycle
    └── crm.eml.yaml               # A full CRM: 17 entities, 8 rules, 5 sagas
```

## The `eml` CLI

```bash
# Validate a model — every finding at its YAML line and column
bun language/cli/eml.ts validate -i language/examples/helpdesk.eml.yaml

# Summarise it
bun language/cli/eml.ts info -i language/examples/helpdesk.eml.yaml

# TanStack Start + Kysely + PostgreSQL code for this repository (the default)
bun language/cli/eml.ts generate -i model.eml.yaml -o ./out

# A dependency-free Node app
bun language/cli/eml.ts generate -i model.eml.yaml -o ./out --stack node-rest
```

Flags: `--input / -i`, `--output / -o`, `--name / -n`, `--stack`, `--docker`,
`--github <owner/repo>`, `--force`, `--no-autofix`, `--json`, `--help`,
`--version`. See [`cli/README.md`](cli/README.md).

---

## A model at a glance

```yaml
eml: "1.0"
name: Minimal Blog
enums:
  - name: PostStatus
    values: [draft, published, archived]
entities:
  - name: Author
    help: Somebody who writes for the blog; kept after they stop, so their posts stay attributed.
    attributes:
      - { name: id, type: string, pk: true }
      - { name: email, type: string, unique: true, help: The address the author signs in with. }
      - { name: name, type: string, help: The by-line shown above each published post. }
      - { name: is_active, type: boolean, help: "Cleared instead of deleting the author, which would orphan their posts." }
  - name: Post
    help: One article, from its first draft to its archiving.
    attributes:
      - { name: id, type: string, pk: true }
      - { name: author_id, type: string, fk: true, help: Who wrote it. }
      - { name: title, type: string, help: The headline readers see. }
      - { name: status, type: string, enum: PostStatus, help: Where the post is in its lifecycle. }
relationships:
  - { from: Author, fromCardinality: exactly-one, to: Post, toCardinality: zero-or-more, label: writes }
rules:
  - name: publishGate
    entity: Post
    event: beforeUpdate
    nodes:
      - { id: A, label: "Start: Publish Requested", type: start }
      - { id: B, label: Author is active?, type: decision }
      - { id: C, label: Allow publish, type: expression }
      - { id: D, label: Reject publish, type: expression }
      - { id: E, label: "End", type: end }
    edges:
      - { from: A, to: B }
      - { from: B, to: C, label: "Yes" }
      - { from: B, to: D, label: "No" }
      - { from: C, to: E }
      - { from: D, to: E }
stateMachines:
  - name: PostLifecycle
    entity: Post
    states: [draft, published, archived]
    initial: draft
    final: [archived]
    transitions:
      - { from: draft, to: published, trigger: publish }
      - { from: published, to: archived, trigger: archive }
```

A rule node's `type` decides what it compiles to: `start` → inputNode,
`end` → outputNode, `decision` → switchNode, `expression` → expressionNode,
`function` → functionNode.

## Diagrams

A model is drawn, not written, as a diagram. The model viewers and the
modelling tool render the ERD, the rules, the state machines and the sagas from
the YAML; nothing reads a drawing back.

For the platform itself — architecture, conventions, server functions, auth, NL
query, RBAC — see [`../CLAUDE.md`](../CLAUDE.md).
