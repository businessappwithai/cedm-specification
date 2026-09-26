# The EML YAML model language

An application model — its entities, relationships, enumerations, categories,
lifecycle hooks, access rules, reports, business rules, state machines and
sagas — written as one YAML document, `*.eml.yaml`.

**The YAML document is the source of truth.** The Mermaid (EML) rendering of a
model is derived from it for the diagram viewers and the ERD designer, and is
never read back for generation.

| File | What it is |
|---|---|
| [`eml.schema.json`](eml.schema.json) | The definition of the language (JSON Schema 2020-12). The validator runs this file; there is no second description of it. |
| [`examples/`](examples) | The EML example corpus as YAML — `crm`, `dance-studio`, `ecommerce`, `helpdesk`, `minimal`. `examples/drug-discovery.eml.yaml` at the repository root is the model the generator is validated on. |

Editors that speak the YAML language server get completion and inline errors by
adding one line at the top of a model:

```yaml
# yaml-language-server: $schema=../../language/yaml/eml.schema.json
```

## One language, two syntaxes

EML says everything with a Mermaid diagram or a `%%` directive; YAML says
everything with a key. Both are read into the same *model records*
(`packages/generator/src/model/records.ts`) and compiled by the same compiler
(`compileModelRecords`). A construct has one compiler, so the two syntaxes
cannot come to mean different things. This is proved rather than assumed:

- every `.mmd` model in the repository, converted to YAML text, read back
  through the full validator and compiled, deep-equals what the generator
  compiles from the EML (`model-yaml/__tests__/corpus-equivalence.test.ts`);
- drug-discovery generated from its YAML produces the same 475 files as from
  its EML, byte for byte apart from generation timestamps
  (`pipeline/__tests__/yaml-source.test.ts`).

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

## Constructs and their EML equivalents

Keys are listed in canonical order. *Required* keys are in bold.

### Document

| Key | Meaning | EML |
|---|---|---|
| **`eml`** | Language version; `"1.0"`. | — |
| `name` | The model's name. | `%%meta name:` |
| `version` | The model's own version. | `%%meta version:` |
| `description` | What the application is for, in one sentence. Opens the generated manual. | `%%meta description:` |

### `entities`

| Key | Meaning | EML |
|---|---|---|
| **`name`** | Entity name; begins with a letter. The table is `bus_<snake_case>`. | `Name {` |
| `help` | What one record is. Shown on the window. | `%%entity <E> help:` |
| `icon` | A lucide id, e.g. `flask-conical`. The generated app pins lucide 0.312 — check the id exists there. | `%%entity <E> icon:` |
| `parent` | Makes this entity a line item: no window of its own, a tab inside the parent's, linked on its foreign key to the parent. | `%%entity <E> parent:` |
| **`attributes`** | Columns, in order. An `id` key is added when no attribute is the key. | the block's lines |
| `indexes` | `{ columns: [...], unique?: true }` | `%%index <E>(a, b) unique` |

Each attribute:

| Key | Meaning | EML |
|---|---|---|
| **`name`** | Column name. | 2nd token |
| **`type`** | An EML type or alias, optionally with a length: `string`, `string(255)`, `text`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `uuid`, `json`, and the semantic aliases `email`, `url`, `phone`, `password`, `color`, which also choose the form control. The vocabulary is `language/appwithai-language.json`. | 1st token |
| `pk` / `fk` / `unique` / `optional` | Primary key, foreign key, unique, nullable. Attributes are required unless optional or the key. A lookup's target table is derived from the column name (see `foreignKeys` in the language definition), so `fk` columns follow the `<entity>_id` convention. | `PK` `FK` `UK` `OPTIONAL` |
| `enum` | Binds the column to a declared enum; it renders as a dropdown. Only bound enums reach the dictionary. | `%%field <E>.<c> enum:` |
| `help` | Guidance under the form control. | `%%field <E>.<c> help:` |
| `comment` | The Mermaid attribute comment; diagram only. | `"…"` |

### `relationships`

`from`, `fromCardinality`, `to`, `toCardinality` are required; `label` names the
relationship (default `<from>_<to>`). A cardinality is one of `exactly-one`,
`zero-or-one`, `zero-or-more`, `one-or-more`. Only the eight pairs Mermaid has an
operator for are valid:

| from / to | Operator | Kind |
|---|---|---|
| exactly-one / exactly-one | `\|\|--\|\|` | one-to-one |
| zero-or-one / zero-or-one | `\|o--o\|` | one-to-one |
| exactly-one / zero-or-more | `\|\|--o{` | one-to-many |
| exactly-one / one-or-more | `\|\|--\|{` | one-to-many |
| zero-or-more / exactly-one | `}o--\|\|` | many-to-one |
| one-or-more / exactly-one | `}\|--\|\|` | many-to-one |
| zero-or-more / zero-or-more | `}o--o{` | many-to-many |
| one-or-more / one-or-more | `}\|--\|{` | many-to-many |

### `enums`, `categories`

`enums`: `{ name, values: [...] }`. `%%enum Name: a, b, c`.

`categories`: **`name`**, `code` (derived from the name when omitted; categories
sharing a code merge), `description`, `icon`, `color`, `seq`, `default` (the
category that receives entities placed in no other), `entities`. `%%category`.
A model with no categories gets one "General" category holding every entity.

### `hooks`

`{ entity, event, handler, field? }`. `event` is one of `beforeCreate`,
`afterCreate`, `beforeUpdate`, `afterUpdate`, `beforeDelete`, `afterDelete`,
`beforeRead`, `afterRead`, `beforeQuery`, `afterQuery`, `beforeList`,
`afterList`, `customValidate`. One handler name serves one event per entity. The
generated `src/hooks/handlers/<entity>.rs` is written once and never
overwritten, so implementations survive regeneration.
`%%hook <event> <handler> on <Entity>[field: <column>]`.

### `rbac`

`{ entity, action, roles: [...] }`. `action` is `create`, `read`, `update`,
`delete` (or an alias: `insert`, `view`, `edit`, `remove`, …), `*` for all four,
or the `trigger` of a transition in the entity's state machine. A target with no
rule stays open. `%%rbac role:a|role:b on Entity.action`.

### `reports`

**`name`**, `title`, `entity`, `chart` (`bar` `line` `pie` `area`, which needs
`x` and `y`), `help`, **`sql`**. The query must be a single `SELECT` or `WITH`
— refused by the schema, by the compiler, and again by the generated
application before it runs — and may span lines. The application caps it at
5,000 rows. `%%report`.

### `rules`

A business rule bound to a lifecycle event: **`name`**, `title`, **`entity`**,
**`event`**, `priority` (lower runs first; default 100), `direction` (`TD`
default, `LR`, …), **`nodes`**, **`edges`**, `actions`, `decisionTable`.

It compiles, in this precedence, from a `decisionTable` authored in the rules
editor, else its `actions`, else the decision flowchart drawn by `nodes`
(`{ id, label, shape }` — `stadium` start/end, `diamond` decision, `rect`
action, `round` expression, `circle` connector) and `edges`
(`{ from, to, label? }`). An action is `{ name, type, when?, props? }`; with no
`when` it fires on every write, which the checker points out (EML282).
A `%%rule` flowchart section.

### `stateMachines`

**`name`**, `title`, **`entity`**, **`states`**, `initial`, `final`,
**`transitions`** (`{ from, to, trigger? }`). Topology is enforced for every
caller: a move the machine does not draw is refused. A `trigger` is what an
`rbac` rule names to restrict that move. A `%%workflow … kind: state` section.

### `sagas`

**`name`**, `title`, **`entity`**, `operation` (`CREATE` `UPDATE` `DELETE`
`ALL`, default `ALL`), `trigger` (`rule` — the default — runs it only when a
rule's `trigger-workflow` action names it; `automatic` runs it on every
matching write), `description`, **`steps`**, in execution order. A step is
`{ id, type, label?, properties? }`, with `type` a step node from the language
definition (`Formula`, `Decision`, `CreateEntity`, `UpdateEntity`, …).
A `%%workflow … kind: saga` section with `%%step` directives.

### `hookDiagrams`

`{ name, title?, entity, diagram }` — a drawing of a hook's logic, carried for
the diagram view and not compiled. `diagram` is Mermaid flowchart text: the one
place a model holds diagram text, because it is a picture and nothing reads it.

## Validation

`readModelYaml` checks a model in four layers and reports every finding at the
line and column of the YAML that caused it:

1. **YAML** — the text parses; a duplicate key is an error, not "last wins".
2. **Schema** — the document is what `eml.schema.json` says a model is.
3. **Model** — the language checker, the same ~130 rules (`EML001`–`EML5xx`)
   that gate EML generation, run over the model's Mermaid view. Every line of
   the view records the document path it was drawn from, so an `EML116` about an
   optional primary key lands on that attribute's line in the YAML.
4. **View** — the view reads back to the same document. Where it cannot — a
   value containing text EML reserves, such as a `key:` inside a report's help,
   or a query whose `--` comment would swallow the rest of a one-line
   `%%report` — the model is still exactly what the YAML says; the warning is
   that the *diagram* shows it differently.

A model with an error is refused for generation; warnings and infos are shown.

```text
$ appwithai validate orders.eml.yaml
  orders.eml.yaml:6:9  ✖ EML116 Primary key "A.id" is marked OPTIONAL.
  orders.eml.yaml:11:5  ✖ EML121 Relationship references undeclared entity "Missing".
  orders.eml.yaml:8:13  ✖ EML147 %%entity B parent: "Nowhere" is not declared.
```

The codes and messages are the checker's own, so they read in EML's terms
(`%%entity B parent:`); the location is the YAML's (`parent:` on line 8).

## Canonical form

`serializeModelDocument` writes one canonical text for a model: keys in the
order above, lists of plain values on one line, nothing stated twice (a title
equal to the name, a `TD` direction, a saga's default trigger and operation,
`when`-less actions and `false` flags are all omitted). Saving a model twice
gives the same bytes, so a Git diff between two saves is exactly the change.

## Tools

```bash
appwithai convert model.eml.mmd                 # → model.eml.yaml
appwithai validate model.eml.yaml [--strict]
appwithai view model.eml.yaml [-o - | -o model.eml.mmd]
appwithai generate -i model.eml.yaml -o out -n my-app
```

`convert` writes the YAML only if it compiles to exactly what the EML compiles
to, and lists what it does not carry. A generated project ships
`model/model.eml.yaml` (the source) and `model/model.eml.mmd` (its view).

From TypeScript, `@appwithai/generator/model-yaml`:

```ts
import {
  readModelYaml,          // text → { document, diagnostics, ok }
  compileModelDocument,   // document → ParsedModel
  renderEmlView,          // document → { text, lineMap }
  emlToModelDocument,     // EML text → { document, issues, uncarried }
  serializeModelDocument, // document → canonical text
} from "@appwithai/generator/model-yaml";
```

## Converting from EML: what is not carried

Everything that compiles is carried. `convert` reports the rest:

- **`%%` comments.** Use `#` comments in the YAML.
- **`%%trigger` and `%%guard`.** Reserved by EML and compiled by nothing yet;
  they are listed with their line numbers so they can be re-expressed when the
  language gains them.
- **Declarations that name nothing** — a `%%field` help line for a column the
  entity does not declare — and **repeats**, resolved the way the compiler
  resolves them (the first `%%enum` of a name, the last `help:`).
- **Sagas whose `%%workflow` line says something the compiler ignores.** EML
  documents `trigger:` and `operation:` on the `%%workflow` line, and the
  checker and composer read them there, but the saga compiler reads only
  `%%meta trigger:` / `%%meta operation:`. A saga declared
  `trigger: automatic operation: UPDATE` on its directive alone compiles as
  rule-triggered on every write and runs only if a rule names it — crm's
  `ClosedWonHandoff` and `RenewalPlaybook` are two. The YAML states what
  compiles, because that is the application the EML generates; `convert`
  names each such saga so the author can decide.
