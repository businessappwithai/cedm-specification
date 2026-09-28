# EML — APPWITHAI Modeling Language

**EML** is a YAML language for describing an application in one document: its
entities and relationships, its business rules, who may do what, the questions
it answers, and how its records move. A model is one file, `*.eml.yaml`. The
APPWITHAI generators read it to produce a full-stack application (TanStack Start
+ Astryx on a Loco.rs backend), the checker validates it, and the modelling tool
edits it and draws it — as the same document, with no second notation.

```yaml
eml: "1.0"
name: Orders
entities:
  - name: Customer
    help: A person or company that buys from us.
    attributes:
      - { name: id, type: uuid, pk: true }
      - { name: name, type: string(120), help: The name printed on invoices. }
  - name: Order
    help: A customer's commitment to buy, from the moment it is drafted.
    attributes:
      - { name: id, type: uuid, pk: true }
      - { name: customer_id, type: uuid, fk: true, help: Who placed the order. }
      - { name: status, type: string, enum: OrderStatus, help: Where the order is in fulfilment. }
enums:
  - { name: OrderStatus, values: [draft, submitted, shipped] }
relationships:
  - { from: Customer, fromCardinality: exactly-one, to: Order, toCardinality: zero-or-more, label: places }
```

## Where the language is defined

| File | Defines |
|---|---|
| [`yaml/eml.schema.json`](yaml/eml.schema.json) | The document's shape: every key, what it may hold, which are required (JSON Schema 2020-12). The reader validates with this file. |
| [`appwithai-language.json`](appwithai-language.json) | What the shape means: the type vocabulary, foreign-key resolution, cardinalities, hook events, rule node types, saga step contracts, automation documents, diagnostics, and which construct each compiler reads. |
| [`yaml/checker.ts`](yaml/checker.ts) | The rules that relate one part of a model to another — every `EML` diagnostic. |

Everything else here documents or loads those files.

- [`yaml/README.md`](yaml/README.md) — the key-by-key reference, validation,
  canonical form and tools.
- [`spec/`](spec/00-overview.md) — the specification, chapter by chapter:
  [overview](spec/00-overview.md),
  [entities and relationships](spec/01-entities.md),
  [business rules](spec/02-business-rules.md),
  [workflows](spec/03-workflows.md),
  [types and cardinalities](spec/04-types-and-cardinalities.md),
  [access rules, reports and triggers](spec/05-access-reports-and-triggers.md).

The definition is read from code through a typed accessor:

```ts
import { cardinalityKind, isHookType, loadLanguageDefinition, normalizeType } from "../language";

normalizeType("varchar");                     // "string"
cardinalityKind("exactly-one", "zero-or-more"); // "oneToMany"
isHookType("beforeCreate");                   // true
```

## Folder layout

```
language/
├── README.md                     # This entry point
├── appwithai-language.json       # ⭐ The machine-readable definition
├── index.ts                      # Typed loader/accessor for it
├── yaml/
│   ├── README.md                 #   the key-by-key reference
│   ├── eml.schema.json           # ⭐ the document's shape
│   ├── document.ts               #   the document's TypeScript types
│   ├── checker.ts                #   the language checker
│   └── examples/                 #   crm, dance-studio, ecommerce, helpdesk, minimal
├── browser/                      # The browser bundle's entry (html/model-yaml.js)
├── spec/                         # The specification, chapters 00–05
└── cli/                          # The `eml` CLI: validate, info, generate
```

`examples/drug-discovery.eml.yaml` at the repository root is the model the
generator is validated on; `yaml/examples/crm.eml.yaml` exercises every construct
the language has.

## Validate and generate

```bash
appwithai validate model.eml.yaml [--strict]      # YAML, schema, checker — every finding at its line
appwithai generate -i model.eml.yaml -o out -n my-app

bun run eml validate -i model.eml.yaml            # the `eml` CLI: the same three layers
bun run eml generate -i model.eml.yaml -o ./out --docker
```

The [`eml` CLI](cli/README.md) validates **with self-correction** — it applies
the checker's mechanically fixable corrections to the YAML, keeping its
comments, and reports each — and generates a complete, runnable application. It
supports `--input`, `--output`, `--name`, `--stack`, `--docker`,
`--github <owner/repo>`, `--force`, `--no-autofix`, `--json` and `--help`.

`bun run wasm` runs the Rust generator compiled to `wasm32-wasip1`; the parity
gate holds its output byte-identical to the native build's and to the
TypeScript generator's.

## What each construct does

| Level | Constructs | Status |
|---|---|---|
| **core** | `entities` (attributes, keys, `indexes`), `enums` bound with `enum:`, `categories`, and every `relationships` cardinality pair | compiled |
| **rules** | `rules`: decision graphs → JDM by node type; `actions` and `decisionTable` → a JDM decision table | compiled |
| **workflows** | `hooks` (all 13 events), `stateMachines` (enforced), `sagas` | compiled |
| **access** | `rbac`, in its CRUD and transition forms → `sys_operation_access` / `sys_transition_access`, enforced by the generated backend | compiled |
| **help** | `help` on every entity and column → `sys_table.description`, `sys_column.description`, the form hints and the generated manual | compiled |
| **reports** | `reports` → `sys_report`, served read-only at `/api/reports` | compiled |
| **validated** | `triggers`, `hookFlows`, and the entity keys `label`, `prefix`, `softDelete`, `audited` | shape and references enforced; no application generator compiles them yet |
| **reserved** | the attribute keys `ui`, `default`, `min`, `max`, `format` | validated for shape; no reader |

`help` is a level of its own because it is the one that gets skipped. It reads
like documentation, so it is easy to leave for later — and then the generated
manual prints a dash in every row, which is the first thing anyone opening the
application sees. The checker reports it missing (`EML152`, `EML153`) and
reports help that only restates a name (`EML151`).

The definition's `constructs` block records each construct's status and the file
that reads it; the levels above group them.

For the whole system — the generator, its templates, and what a generated
application contains — see [`../website/llmtext/llms-full.txt`](../website/llmtext/llms-full.txt),
the same material written as one context file for language models.
