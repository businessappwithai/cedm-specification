# The CEDM application model

An application is written in **CEDM**, the Common Enterprise Domain Model this
repository specifies. Its entities are CEDM entities, in exactly the shape the
domain library uses (`domain/entities/*.yaml`, `schema/cedm-entity.schema.yaml`),
so a library entity can be imported by name or pasted into a model unchanged.
What CEDM does not describe — dashboards, who may do what, hooks, executable
rules, the processes the backend runs, the reports it serves — is the
**application profile** (`specification/application-profile.yaml`), written in
CEDM's vocabulary.

| | |
|---|---|
| Schema | [`cedm-model.schema.json`](cedm-model.schema.json) — normative |
| Types | [`document.ts`](document.ts) |
| Translation | [`lower.ts`](lower.ts) (CEDM → model document), [`raise.ts`](raise.ts) (back), [`imports.ts`](imports.ts) |
| Examples | [`examples/`](examples/), [`../../examples/drug-discovery.cedm.yaml`](../../examples/drug-discovery.cedm.yaml), [`../../applications/`](../../applications/) |
| Profile | [`../../specification/application-profile.yaml`](../../specification/application-profile.yaml) |

```bash
appwithai validate model.cedm.yaml
appwithai generate -i model.cedm.yaml -o out -n my-app
appwithai convert model.eml.yaml        # → model.cedm.yaml (refused unless it reads back identically)
appwithai convert model.cedm.yaml       # → model.eml.yaml, the document the generators compile
```

## How it is compiled

A CEDM model is **lowered** into the model document of `language/yaml/`, which
both generators (TypeScript and Rust), the checker and the modelling tool
already compile. Nothing downstream of the lowering knows which language a
model was written in, so a construct cannot mean one thing in CEDM and another
outside it. Every model in the repository is raised to CEDM and lowered back on
every test run, and must return as the same model; the application generated
from `examples/drug-discovery.cedm.yaml` is compared file by file with the one
generated from the model document.

Validation reports every finding at the CEDM line that caused it, in five
layers: YAML, the schema, imports, lowering (what cannot be generated, what is
added), and the model language's own schema and ~130-rule checker, traced back
through the lowering.

## A model

```yaml
cedm: "1.0"
application:
  name: Order to Cash
  version: 1.0.0
  domain: sales                      # the catalog domain it serves

imports:
  - module: common                   # the foundation every domain application shares
  - entity: SalesOrder               # a library entity, by name
  - entity: Customer
    exclude: [creditLimit]           # narrowed

entities:
  - name: SalesOrder                 # refines the imported one
    ui: {icon: shopping-cart}
  - name: Quote                      # declared here, in the CEDM entity shape
    identity: {key: quoteId, type: uuid}
    attributes:
      - {name: quoteId, type: uuid, required: true}
      - {name: quoteNumber, type: string, required: true, unique: true, maxLength: 40}
      - {name: status, type: enum, required: true, values: [DRAFT, SENT, ACCEPTED, REJECTED]}
      - {name: validUntil, type: date, required: false}
    relationships:
      - {name: customer, target: Customer, cardinality: '1', ownership: reference}
      - {name: deliveryLocation, target: Location, cardinality: '0..1', ownership: reference}
    lifecycle:
      attribute: status
      states: [DRAFT, SENT, ACCEPTED, REJECTED]
      initial: DRAFT
      terminal: [ACCEPTED, REJECTED]
      transitions:
        - {from: DRAFT, to: SENT, action: send}
        - {from: SENT, to: ACCEPTED, action: accept}
    invariants:
      - {id: QUOTE-001, rule: An accepted quote must not expire., violatedWhen: 'status == "ACCEPTED" and validUntil == null'}
    help:
      summary: A priced offer to a customer, before it becomes an order.
      businessMeaning: Commits the seller to the quoted terms until it expires.

ui:
  categories:
    - {name: Sales, icon: BadgeDollarSign, entities: [Quote, SalesOrder]}
authorization:
  permissions:
    - {resource: Quote, action: accept, subject: [sales_manager]}
rules: []          # executable decision graphs, as in language/yaml
processes: []      # sagas
reports: []        # read-only SQL
hooks: []
```

## What each construct compiles to

| CEDM | Becomes |
|---|---|
| attribute `name` (camelCase) | a column, the snake_case of the name; `column:` overrides |
| `identity.key` | the primary key, stored as `id` for a single key |
| `type` | kept when it is a model-language token (`uuid`, `string`, `decimal`, `money`, `date`, `datetime`, `boolean`, `object`, `text`, `email`, …); `enum` → `string` with a value list; `reference` → a foreign key (`keyType`, default `string`); `currency_code` → `string(3)`, `country_code` → `string(2)`, `locale` → `string(35)`, `timezone` → `string(64)`, `value_object` → `json`; `maxLength` → `string(n)` |
| `values` | a value list named `<Entity><Attribute>` (or `enumName`), rendered as a dropdown; shared lists live in `enums` and are named with `enum:`. With `application.enumerationTables: true` each list also gets a business table (an entity of that name under *Reference Data*), and the dropdown reads it; `help.valueLabels` and `help.valueSemantics` become its rows' name and description |
| entity `referenceData` / `data` | rows the entity ships with (`domain/reference-data/*.yaml`), inlined by the library; attributes and relationships name the columns, a reference holds the natural key of its target row |
| relationship / reference `narrowedBy: [..]` | the lookup's choices are narrowed by the named references of the same record, applied by the backend that supplies them and checked on write |
| entity `workflows` | each lowers to a saga plus a rule that triggers it when `when` holds of a written record; `_previous_<column>` is the column as it was |
| relationship `1` / `0..1` | a foreign key on the source, `<name>_id`, unless an attribute already holds it — its target written explicitly where the name would not resolve to it (`delivery_location_id` → Location) |
| relationship `0..*` / `1..*` | the other half of a to-one on the target; two relationships naming each other (`inverse`), or the only two between a pair, are one |
| `n..*` (n > 1) | enforced as `1..*`, reported |
| `ownership: aggregate` (to-many) | the target is a line item: no window of its own, a tab inside the root's |
| `lifecycle` | a state machine; each transition's `action` is its trigger, which `authorization` may grant |
| `invariants` with `violatedWhen` | a `validation-error` rule on `beforeCreate` and `beforeUpdate` (or `events`); prose-only invariants are documentation |
| structured `help` | one paragraph, fields joined in the order written |
| `authorization.permissions` (`allow`) | role grants on operations and transitions; `deny` and `scope` are refused, because the generated application's grants are additive |
| `extends` | the parent's attributes and relationships (all but its identity) are carried into the specialisation |
| `ui`, `persistence`, `aggregateRoot` | icon, label; prefix, soft delete, audit, indexes; the parent of a line item |
| `ui.categories`, `rules`, `processes`, `reports`, `hooks`, `hookFlows`, `triggers` | the same constructs as `language/yaml` — the schema references their definitions there |

## Imports

- `{entity: X}` brings the library's definition of `X`, narrowed by `include`
  or `exclude`, and every entity its **required** references point at
  (cardinality `1` or `1..*`, or a required reference attribute), recursively.
  An optional reference to an entity the application does not contain is not
  generated and is reported (`CEDM120`, `CEDM121`).
- `{module: name}` brings everything another CEDM model declares:
  `<name>.cedm.yaml` beside the model, then `applications/<name>.cedm.yaml`.
- An entity declared with an imported entity's name refines it: its keys
  replace the imported ones; attributes and relationships merge by name.

## One application per domain

`applications/` holds one CEDM application per catalog domain, each importing
`applications/common.cedm.yaml` for the foundation all of them share. Every
generated application — from CEDM or not — bundles the common specification
(`specification/`, `schema/`, `domains/`) under `cedm/`, with the library
entities and modules a CEDM model used.

## Diagnostics

| Code | |
|---|---|
| CEDM101 | the library has no entity of that name |
| CEDM102 / CEDM103 | no module of that name / a module imports itself |
| CEDM104 / CEDM105 | `extends` is circular / names nothing known |
| CEDM106 | an entity brought in because an imported one requires it (info) |
| CEDM110 | a value list declared twice with different values |
| CEDM120 / CEDM121 | a reference / relationship to an entity outside the model (not generated) |
| CEDM122 | `foreignKey` names no attribute |
| CEDM130 / CEDM131 | an undefined cardinality / `n..*` enforced as `1..*` |
| CEDM132 | a many-to-many whose ends disagree, related as `0..*` both ways |
| CEDM140 | a key column added for a relationship (info) |
| CEDM150 | a lifecycle with no transitions generates no state machine |
| CEDM160 / CEDM161 | a deny / scoped permission cannot be generated |

Every other code is the model language's checker (`EML…`), reported at the
CEDM line the finding traces back to.

## Converting

`appwithai convert model.eml.yaml` writes the same application in CEDM, and
refuses unless the result reads back as the same model. The one difference it
makes is deliberate: a relationship and a state machine are declared on their
entity, so they come back in entity order. YAML comments are not carried.
