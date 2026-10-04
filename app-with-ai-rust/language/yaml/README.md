# The EML YAML model language

An application model — its entities, relationships, enumerations, categories,
lifecycle hooks, access rules, reports, business rules, state machines and
sagas — written as one YAML document, `*.eml.yaml`.

The document is the model: the generators read it, the checker validates it,
and the modelling tool edits it and draws its diagrams from it. The
specification, chapter by chapter, is in [`../spec/`](../spec/00-overview.md).

| File | What it is |
|---|---|
| [`eml.schema.json`](eml.schema.json) | The definition of the language (JSON Schema 2020-12). The validator runs this file; there is no second description of it. |
| [`examples/`](examples) | The example corpus — `crm` (every construct), `dance-studio`, `ecommerce`, `helpdesk`, `minimal`. `examples/drug-discovery.eml.yaml` at the repository root is the model the generator is validated on. |

Editors that speak the YAML language server get completion and inline errors by
adding one line at the top of a model:

```yaml
# yaml-language-server: $schema=../../language/yaml/eml.schema.json
```

## One semantic layer

A model is read into *model records*
(`packages/generator/src/model/records.ts`) by `documentToRecords`, and every
compiler reads the records — so a construct has exactly one compiler. The Rust
generator reads the same document into the same records
(`crates/appwithai-gen/src/yaml_model.rs`), and the parity gate generates every
corpus model with both and compares the backends byte for byte.

## A model

```yaml
eml: "1.0"
name: Orders
description: Taking and fulfilling customer orders.

enums:
  - name: OrderStatus
    values: [draft, submitted, shipped, cancelled]

categories:
  - name: Sales
    icon: ShoppingCart
    entities: [Customer, Order]

entities:
  - name: Customer
    help: A person or company that buys from us.
    icon: user
    attributes:
      - { name: id, type: uuid, pk: true }
      - { name: name, type: string(120) }
      - { name: email, type: email, unique: true, help: Where order confirmations go. }
  - name: Order
    attributes:
      - { name: id, type: uuid, pk: true }
      - { name: customer_id, type: uuid, fk: true }
      - { name: status, type: string, enum: OrderStatus }
      - { name: total, type: decimal, optional: true }
    indexes:
      - columns: [customer_id, status]
  - name: OrderLine
    parent: Order
    attributes:
      - { name: id, type: uuid, pk: true }
      - { name: order_id, type: uuid, fk: true }
      - { name: quantity, type: integer }

relationships:
  - { from: Customer, fromCardinality: exactly-one, to: Order, toCardinality: zero-or-more, label: places }
  - { from: Order, fromCardinality: exactly-one, to: OrderLine, toCardinality: one-or-more }

hooks:
  - { entity: Order, event: beforeCreate, handler: stampOrderNumber }

rbac:
  - { entity: Order, action: delete, roles: [manager] }
  - { entity: Order, action: ship, roles: [warehouse, manager] }

reports:
  - name: orders_by_status
    title: Orders by status
    entity: Order
    chart: bar
    x: status
    y: count
    sql: |
      SELECT status, count(*) AS count
      FROM bus_order
      GROUP BY status

stateMachines:
  - name: OrderLifecycle
    entity: Order
    states: [draft, submitted, shipped, cancelled]
    initial: draft
    final: [shipped, cancelled]
    transitions:
      - { from: draft, to: submitted, trigger: submit }
      - { from: submitted, to: shipped, trigger: ship }
      - { from: submitted, to: cancelled, trigger: cancel }

sagas:
  - name: ShipmentHandoff
    entity: Order
    trigger: automatic
    operation: UPDATE
    steps:
      - id: mark
        type: UpdateEntity
        label: Mark as handed off
        properties: { field: status, value: shipped }
```

## Constructs

Keys are listed in canonical order. *Required* keys are in bold.

### Document

| Key | Meaning |
|---|---|
| **`eml`** | Language version; `"1.0"`. |
| `name` | The model's name. |
| `version` | The model's own version. |
| `description` | What the application is for, in one sentence. Opens the generated manual. |

### `entities`

| Key | Meaning |
|---|---|
| **`name`** | Entity name; begins with a letter. The table is `bus_<snake_case>`. |
| `help` | What one record is. Shown on the window. |
| `icon` | A lucide id, e.g. `flask-conical`. The generated app pins lucide 0.312 — check the id exists there. |
| `parent` | Makes this entity a line item: no window of its own, a tab inside the parent's, linked on its foreign key to the parent. |
| `concurrency` | `optimistic` (default) or `last-write-wins`. Optimistic: a save names the version it was read at, and one made against a version someone else replaced is refused with the record as it now stands; the screen offers to refresh or to overwrite. Last-write-wins accepts a save that names no version — for an append-only log or a counter. A record in a final state of the entity's state machine is closed either way (`EML158`). Compiled to `sys_table.concurrency_mode`. |
| `label` | The name the screens show. *Carried; not compiled by the application generators yet.* |
| `prefix` | `bus` or `sys`. *Carried; not compiled yet.* |
| `softDelete` | `true` to delete by setting `deleted_at`. *Carried; not compiled yet.* |
| `audited` | `true` to keep an audit trail. *Carried; the `eml` CLI's generators read it.* |
| **`attributes`** | Columns, in order. An `id` key is added when no attribute is the key. |
| `indexes` | `{ columns: [...], unique?: true }` |

Each attribute:

| Key | Meaning |
|---|---|
| **`name`** | Column name. |
| **`type`** | An EML type or alias, optionally with a length: `string`, `string(255)`, `text`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `uuid`, `json`, and the semantic aliases `email`, `url`, `phone`, `password`, `color`, which also choose the form control. The vocabulary is `language/appwithai-language.json`. |
| `pk` / `fk` / `unique` / `optional` | Primary key, foreign key, unique, nullable. Attributes are required unless optional or the key. A lookup's target table is derived from the column name (see `foreignKeys` in the language definition), so `fk` columns follow the `<entity>_id` convention. |
| `enum` | Binds the column to a declared enum; it renders as a dropdown. Only bound enums reach the dictionary. |
| `help` | Guidance under the form control. |
| `ui`, `default`, `format` | The control, the starting value and the display/check format, as written. *Carried; not compiled yet.* |
| `min`, `max` | Bounds — a number when written as a plain number, text otherwise. *Carried; not compiled yet.* |
| `comment` | A note for the model's readers. Carried, not compiled. |

### `relationships`

`from`, `fromCardinality`, `to`, `toCardinality` are required; `label` names the
relationship (default `<from>_<to>`). A cardinality is one of `exactly-one`,
`zero-or-one`, `zero-or-more`, `one-or-more`, and only these eight pairs are
valid:

| from / to | Kind |
|---|---|
| exactly-one / exactly-one | one-to-one |
| zero-or-one / zero-or-one | one-to-one |
| exactly-one / zero-or-more | one-to-many |
| exactly-one / one-or-more | one-to-many |
| zero-or-more / exactly-one | many-to-one |
| one-or-more / exactly-one | many-to-one |
| zero-or-more / zero-or-more | many-to-many |
| one-or-more / one-or-more | many-to-many |

The foreign key is on the many side of a one-to-many, named after the one side.

### `enums`, `categories`

`enums`: `{ name, values: [...] }`, optionally `table`, `labels` and `descriptions`.
A column binds one with `enum:`. `table: true` says the list has a business table —
an entity of the same name, with a `code`, `name`, `description`, `sequence` and
`is_active` column — whose rows are the values (written by the dictionary seed as
application data, not sample data); the dropdown is then a Table reference
(`sys_reference` type `T` + `sys_ref_table`) and `/api/sys/ref-list` reads the
table, so a value reworded or retired there is what a form offers. `labels` and
`descriptions` map a value to its dropdown label and its meaning. A CEDM model
gets all of this from `application.enumerationTables` (see `language/cedm/README.md`).

Entity `data` — `{ key, rows }` — is reference data the application ships with:
rows keyed by physical column, a foreign key column holding the natural key of the row
it points at, `key` naming the column that is this entity's own natural key. The
dictionary seed writes them as application data, parents first; the business seed
leaves them alone and points its records at them. An attribute's `narrowedBy: [col, …]`
(requires `fk`) says which other foreign keys of the entity narrow this lookup's
choices — a state by its country, a city by its state then its country — and the
backend applies it where it supplies the choices (`GET /api/bus/{entity}/lookup/{column}`)
and when it accepts a write.

`categories`: **`name`**, `code` (derived from the name when omitted; categories
sharing a code merge), `description`, `icon`, `color`, `seq`, `default` (the
category that receives entities placed in no other), `entities`. A model with no
categories gets one "General" category holding every entity. A line item
(`parent:`) belongs in none — it has no dashboard card.

### `hooks`

`{ entity, event, handler, fields? }`. `event` is one of `beforeCreate`,
`afterCreate`, `beforeUpdate`, `afterUpdate`, `beforeDelete`, `afterDelete`,
`beforeRead`, `afterRead`, `beforeQuery`, `afterQuery`, `beforeList`,
`afterList`, `customValidate`. One handler name serves one event per entity. The
generated `src/hooks/handlers/<entity>.rs` is written once and never
overwritten, so implementations survive regeneration. `fields` lists the columns
a field-level hook concerns, in order; the generated handler is scoped to the
first.

### `hookFlows`

**`name`**, `title`, **`entity`**, `direction`, **`nodes`**, **`edges`**: the
order an entity's hooks run in around a write, drawn by the model viewer. A node
is `{ id, label }` for a step shown for context, or `{ id, event, handler }` for
a hook the entity declares; an edge is `{ from, to, label? }`. Nothing compiles
a flow; the checker holds it to the hooks it names.

### `rbac`

`{ entity, action, roles: [...] }`. `action` is `create`, `read`, `update`,
`delete` (or an alias: `insert`, `view`, `edit`, `remove`, …), `*` for all four,
or the `trigger` of a transition in the entity's state machine. A target with no
rule stays open; `read` rules also decide which roles see an entity at all.

### `triggers`

`{ entity, source, handler }`: an external event or schedule that calls
`handler` on `entity`. `source` is `cron:<5 or 6 fields>`, `webhook:<name>` or
`message:<topic>`. Validated; the `eml` CLI's generators compile it, the
application generators do not yet.

### `reports`

**`name`**, `title`, `entity`, `chart` (`bar` `line` `pie` `area`, which needs
`x` and `y`), `help`, **`sql`**. The query must be a single `SELECT` or `WITH` —
refused by the schema, by the compiler, and again by the generated application
before it runs — and may span lines as a block scalar. The application caps it
at 5,000 rows.

### `rules`

A business rule bound to a lifecycle event: **`name`**, `title`, **`entity`**,
**`event`**, `priority` (lower runs first; default 100), `direction` (`down`
default, `up`, `right`, `left` — layout only), **`nodes`**, **`edges`**,
`actions`, `decisionTable`.

It compiles, in this precedence, from a `decisionTable` authored in the rules
editor, else its `actions`, else its decision graph. A node is
`{ id, label, type }` — `start` (exactly one), `end` (at least one), `decision`,
`expression`, `function` — and an edge `{ from, to, label? }`, labelled when it
leaves a decision. An action is `{ name, type, when?, props? }`, with `type` one
of `validation-error`, `transform`, `trigger-workflow`; with no `when` it fires
on every write, which the checker points out (EML282).

### `stateMachines`

**`name`**, `title`, **`entity`**, **`states`**, `initial`, `final`,
**`transitions`** (`{ from, to, trigger? }`). Topology is enforced for every
caller: a move the machine does not draw is refused. A `trigger` is what an
`rbac` rule names to restrict that move. Bind the entity's status column to an
enum carrying exactly these states.

A `final` state is a completed transaction. A record in one is closed: every
update is refused with 409 `RECORD_FINAL`, for every caller, the master role
included, and the screen offers only to refresh. Seeded into
`sys_workflow_states` with the machine's `initial` state and labels.

### `sagas`

**`name`**, `title`, **`entity`**, `operation` (`CREATE` — the default —
`UPDATE`, `DELETE`, `ALL`), `trigger` (`automatic` — the default — runs it on
every matching write; `rule` runs it only when a rule's `trigger-workflow`
action names it), `description`, **`steps`**, in execution order. A step is
`{ id, type, label?, properties? }`, with `type` a step node from the language
definition (`Formula`, `Decision`, `CreateEntity`, `UpdateEntity`,
`DeleteEntity`, `REST`, `Agent`) and every property a string.
The generated Loco backend currently starts a saga only through a rule's
`trigger-workflow` action or `/api/workflow/{id}/execute`; `trigger: automatic`
is recorded on the definition (`sys_workflow_definitions.trigger_type`) and not
yet acted on by that backend.

## Validation

`readModelYaml` checks a model in three layers and reports every finding at the
line and column of the YAML that caused it:

1. **YAML** — the text parses; a duplicate key is an error, not "last wins".
2. **Schema** — the document is what `eml.schema.json` says a model is.
3. **Checker** — [`checker.ts`](checker.ts), the rules that relate one part of a
   model to another (`EML001`–`EML5xx`). Each finding carries the document path
   of the construct it concerns, so an `EML116` about an optional primary key
   lands on that attribute's line.

A model with an error is refused for generation; warnings and infos are shown.

```text
$ appwithai validate orders.eml.yaml
  orders.eml.yaml:6:9   ✖ EML116 Primary key "Order.id" is marked optional.
  orders.eml.yaml:11:5  ✖ EML121 Relationship references undeclared entity "Missing".
  orders.eml.yaml:8:5   ✖ EML147 "OrderLine" names parent "Nowhere", which is not declared.
```

`fixModelYaml` applies the eight mechanically fixable corrections to the YAML
document in place, keeping its comments, and re-runs the checker; the `eml`
CLI does so before it generates unless given `--no-autofix`.

## Canonical form

`serializeModelDocument` writes one canonical text for a model: keys in the
order above, lists of plain values on one line, nothing stated twice (a title
equal to the name, a `down` direction, a saga's default trigger (`automatic`)
and operation (`CREATE`), and `false` flags are all omitted). Saving a model
twice gives the same bytes, so a Git diff between two saves is exactly the
change. The modelling tool keeps the author's own text as the model and writes
the canonical form beside it for the assistant.

## Tools

```bash
appwithai validate model.eml.yaml [--strict]
appwithai generate -i model.eml.yaml -o out -n my-app

bun run eml validate -i model.eml.yaml           # the `eml` CLI
bun run build:wasm && bun run wasm -- generate -i model.eml.yaml -o out -n my-app
```

`bun run wasm` runs the Rust generator compiled to `wasm32-wasip1`; the parity
gate holds its output byte-identical to the native build's. A generated project
ships the model it was generated from as `model/model.eml.yaml`, byte for byte.

From TypeScript, `@appwithai/generator/model-yaml`:

```ts
import {
  readModelYaml,          // text → { document, diagnostics, ok }
  compileModelDocument,   // document → ParsedModel
  serializeModelDocument, // document → canonical text
  fixModelYaml,           // text → the text with auto-fixable findings corrected
} from "@appwithai/generator/model-yaml";
```

In a browser, `html/model-yaml.js` (built by `bun run build:language-tools`)
exposes the same reader, checker and fixer.
