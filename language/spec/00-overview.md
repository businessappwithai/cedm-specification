# EML — Overview

**APPWITHAI Modeling Language (EML)**, version 2.0.0 — a YAML language for
describing an application in one document: its entities and relationships, its
business rules, who may do what, the questions it answers, and how its records
move.

A model is one file, `*.eml.yaml`. The APPWITHAI generators read it to produce a
full-stack application (TanStack Start + Astryx on a Loco.rs backend), the
checker validates it, and the modelling tool edits it and draws it. There is no
second notation: the diagrams the tool shows are drawn from the document, and an
edit made on a diagram is an edit to the document.

## Design goals

1. **One document, every concern.** Structure (entities, relationships), logic
   (rules), access (who may do what), reporting and process (hooks, state
   machines, sagas) live in one file, so an entity's whole behaviour is
   reviewable in one place.
2. **Every construct is a key.** A model is plain YAML: one mapping whose keys
   the schema names. Nothing is inferred from layout, spacing or a comment, so a
   model reads the same to every tool.
3. **Machine-checked, and located.** Every finding — a YAML error, a schema
   violation, a checker diagnostic — is reported at the line and column of the
   YAML that caused it.
4. **The author's text is kept.** A model's comments (`#`) are the author's.
   Tools that change a model edit the YAML document in place rather than
   re-serialising it, and the canonical form (below) makes two saves of the same
   model byte-identical.

## The definition

The language is defined in two files, and nothing else describes it:

| File | Defines |
|---|---|
| [`../yaml/eml.schema.json`](../yaml/eml.schema.json) | The document's shape — every key, what it may hold, which are required (JSON Schema 2020-12). The reader validates with this file. |
| [`../appwithai-language.json`](../appwithai-language.json) | What the shape means — the type vocabulary, foreign-key resolution, cardinalities, hook events, rule node types, saga step contracts, automation documents, diagnostics, and which construct each compiler reads. |

This specification explains the two. Where it and they disagree, they are right
and this is the bug.

## The document

A model is one YAML mapping. `eml` and `entities` are required; every other key
is optional and absent means none. Tools write the keys in this order:

| Key | Holds | Chapter |
|---|---|---|
| **`eml`** | The document version, `"1.0"`. | — |
| `name` | The application's name, as its users call it. | — |
| `version` | The model's own version, carried into the application. | — |
| `description` | One paragraph saying what the application is for. Seeded into `sys_system.APP_DESCRIPTION`; opens the generated manual. | — |
| `enums` | Named value lists a column may be bound to. | [01](01-entities.md#enums) |
| `categories` | Dashboard groupings of entities. | [01](01-entities.md#categories) |
| **`entities`** | The tables: columns, keys, indexes, help, icons, line items. | [01](01-entities.md) |
| `relationships` | How entities relate, by the cardinality of each end. | [01](01-entities.md#relationships) |
| `hooks` | Lifecycle handlers bound to an entity's writes and reads. | [03](03-workflows.md#hooks) |
| `hookFlows` | The order an entity's hooks run in around a write, drawn. | [03](03-workflows.md#hook-flows) |
| `rbac` | Who may perform an operation or cross a transition. | [05](05-access-reports-and-triggers.md#access-rules--rbac) |
| `triggers` | External events and schedules that call a handler. | [05](05-access-reports-and-triggers.md#triggers) |
| `reports` | Questions the application answers, as read-only SQL. | [05](05-access-reports-and-triggers.md#reports) |
| `rules` | Business rules: decision graphs, actions, decision tables. | [02](02-business-rules.md) |
| `stateMachines` | The lifecycle an entity's status column moves through. | [03](03-workflows.md#state-machines) |
| `sagas` | Multi-step processes of executable steps. | [03](03-workflows.md#sagas) |

```yaml
# yaml-language-server: $schema=../../language/yaml/eml.schema.json
eml: "1.0"
name: Orders
description: Taking and fulfilling customer orders.

enums:
  - { name: OrderStatus, values: [draft, submitted, shipped, cancelled] }

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

relationships:
  - { from: Customer, fromCardinality: exactly-one, to: Order, toCardinality: zero-or-more, label: places }
```

The first line is optional. Editors that speak the YAML language server use it
for completion and inline errors.

### Constructs and their status

Each construct is **compiled** (a generator reads it and the application changes),
**validated** (the schema and the checker enforce its shape and references, and
no generator compiles it yet), or **reserved** (validated for shape, with no
reader; held so a later meaning cannot collide with it). The definition's
`constructs` block records which, and names the file that reads each compiled
one. Today:

- **compiled** — `name`/`version`/`description`, `enums`, `categories`,
  `entities` (with `help`, `icon`, `parent`, `concurrency`, `indexes`), attribute `enum` and
  `help`, `relationships`, `hooks`, `rbac`, `reports`, `rules`,
  `stateMachines`, `sagas`;
- **validated** — `hookFlows`, `triggers`, and the entity keys `label`,
  `prefix`, `softDelete`, `audited`;
- **reserved** — the attribute keys `ui`, `default`, `min`, `max`, `format`.

## Validation

`readModelYaml` (`packages/generator/src/model-yaml/validate.ts`) reads a model
in three layers, and every tool — both generators, the `eml` CLI, the modelling
tool and the browser bundle — reads through it:

1. **YAML** — the text parses. A key written twice is an error, not "the last
   one wins".
2. **Schema** — the document is what `eml.schema.json` says a model is, located
   at the key that is wrong.
3. **Checker** — `language/yaml/checker.ts`: the rules that relate one part of a
   model to another, which a schema cannot express. Does the foreign key have a
   relationship behind it? Is the status column bound to the state machine's
   states? Does a saga step read a variable an earlier step published?

```bash
appwithai validate orders.eml.yaml [--strict]
bun run eml validate -i orders.eml.yaml
```

```text
  orders.eml.yaml:6:9   ✖ EML116 Primary key "Order.id" is marked optional.
  orders.eml.yaml:11:5  ✖ EML121 Relationship references undeclared entity "Missing".
  orders.eml.yaml:8:5   ✖ EML147 "OrderLine" names parent "Nowhere", which is not declared.
```

| Severity | Meaning | Fails the run |
|---|---|---|
| **error** | The model is wrong; the generator would produce something incorrect or nothing at all. A model with an error generates nothing. | yes |
| **warning** | Legal, but almost certainly not what the author meant — a dropped constraint, a state with no enum behind it. | only with `--strict` |
| **info** | Worth reading once. | no |

Codes group by what they concern: `EML0xx` the document; `EML100`–`EML119`
entities and attributes; `EML120`–`EML129` relationships; `EML130`–`EML199`
enums, bindings, help, icons, line items, indexes and categories; `EML2xx`
hooks, access rules, triggers, reports and saga steps; `EML3xx` business rules;
`EML400`–`EML449` state machines, sagas and hook flows; `EML5xx` consistency
across constructs. A code keeps its meaning for as long as the language has it.

Warnings are worth reading rather than clearing: most describe something the
generator accepts and quietly gets wrong. `EML146` is the clearest case — a
`status` column not bound to an enum is recorded as free text, and the form
accepts values the state machine cannot act on.

### Fixing

Eight codes are mechanically fixable, and `fixModelYaml`
(`packages/generator/src/model-yaml/fixer.ts`) repairs them in the YAML document
itself, keeping its comments, then re-runs the checker. The `eml` CLI applies
them before it generates unless told `--no-autofix`, and reports each one.

| Code | The fix |
|---|---|
| `EML001` | The model has no name — sets one from the first entity. |
| `EML103` | A column the generator adds anyway — removes the declaration. |
| `EML112` | A column declared twice — removes the later one, keeping the stronger constraints. |
| `EML114` | An `fk` column not ending in `_id` — appends the suffix, everywhere the model names it. |
| `EML117` | An entity with no primary key — adds `id`. |
| `EML287` | A rule condition names a camelCase identifier — rewrites it as the snake_case column. |
| `EML421` | A state machine with no initial state — sets `initial` to its first state. |
| `EML422` | A state machine with no final state — sets `final` to its states with no way out. |

## Canonical form

`serializeModelDocument` writes one text for a model: keys in the order above,
lists of plain values on one line, and nothing stated twice — a title equal to
the name, a `down` direction, a saga's default trigger (`automatic`) and
operation (`CREATE`), and `false` flags are omitted. Saving a model twice gives
the same bytes, so a Git diff between two saves is exactly the change. The
modelling tool keeps the author's own text as the model and writes the
canonical form beside it (`.appwithai/model.ai.yaml`) for the assistant to read.

## The pipeline

Every entry point — the `appwithai` CLI and the web app's `/api/generate` — runs
the same pipeline (`packages/generator/src/pipeline/generate-application.ts`),
so a model produces the same application however it was submitted:

```
model text   → readModelYaml (YAML, schema, checker)   → the document
document     → documentToRecords                        → model records, the one semantic layer
entities, relationships → compileErdRecords             → bus-table DDL, dictionary seed, request suites
categories   → compileCategoryDeclarations              → dashboard groups
rules        → compileRuleDeclarations                  → GoRules JDM → seed/rules.sql → sys_rule_definitions
hooks        → compileHookDeclarations                  → src/hooks/handlers/<entity>.rs + src/hooks/mod.rs
stateMachines→ compileWorkflows                         → sys_workflow_transitions (enforced)
sagas        → compileSagaDeclarations                  → BPMN → sys_workflow_definitions (source: model)
rbac         → compileRbacDeclarations                  → sys_operation_access / sys_transition_access
reports      → compileReportDeclarations                → sys_report, served at /api/reports
the text     → model/model.eml.yaml in the generated project, byte for byte
```

`documentToRecords` is held byte-identical between the TypeScript generator
(`packages/generator/src/model-yaml/to-records.ts`) and the Rust one
(`crates/appwithai-gen/src/yaml_model.rs`), and the parity gate generates every
corpus model with both and compares the backends file by file.

## Naming

| Element | Rule | Recommended case |
|---|---|---|
| Entity name | `^[A-Za-z][A-Za-z0-9_]*$`, unique in the model | `PascalCase` |
| Attribute name | `^[A-Za-z][A-Za-z0-9_]*$`, unique in the entity | `snake_case` |
| Handler | `^[A-Za-z_][A-Za-z0-9_]*$` | `camelCase` |
| Enum name | `^[A-Za-z][A-Za-z0-9_]*$` | `PascalCase` |
| Node / step id | `^[A-Za-z_][A-Za-z0-9_]*$` | short: `A`, `B`, … |

Keys are case-sensitive and spelled as the schema spells them. Types are not:
`VARCHAR`, `varchar` and `string` are one type.

## Chapters

- [`01-entities.md`](01-entities.md) — entities, attributes, keys, enums,
  indexes, categories, help, line items and relationships
- [`02-business-rules.md`](02-business-rules.md) — decision graphs, actions and
  decision tables
- [`03-workflows.md`](03-workflows.md) — hooks, hook flows, state machines,
  sagas and automations
- [`04-types-and-cardinalities.md`](04-types-and-cardinalities.md) — the type
  vocabulary, attribute flags and relationship cardinalities
- [`05-access-reports-and-triggers.md`](05-access-reports-and-triggers.md) —
  access rules, reports and triggers
