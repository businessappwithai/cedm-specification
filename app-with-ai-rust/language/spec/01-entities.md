# EML — Entities and Relationships

The data model: `entities` (each a table, with its columns, keys and indexes),
the `enums` a column may be bound to, the `categories` the dashboard groups
entities by, and the `relationships` between entities. Compiled by
`packages/generator/src/model/compile-erd.ts` and its Rust mirror.

## Entities

```yaml
entities:
  - name: Order
    help: A customer's commitment to buy, from the moment it is drafted until it ships or is cancelled.
    icon: shopping-cart
    attributes:
      - { name: id, type: uuid, pk: true }
      - { name: customer_id, type: uuid, fk: true, help: Who placed the order. }
      - { name: order_number, type: string(20), unique: true, help: The number printed on the invoice and quoted on the phone. }
      - { name: status, type: string, enum: OrderStatus, help: Where the order is in fulfilment. }
      - { name: total_amount, type: decimal, help: What the customer owes, tax included. }
      - { name: notes, type: text, optional: true, help: Anything the warehouse should know. }
    indexes:
      - columns: [customer_id, status]
```

| Key | Meaning | Status |
|---|---|---|
| **`name`** | `^[A-Za-z][A-Za-z0-9_]*$`, unique in the model. `PascalCase` recommended. The table is `bus_<snake_case>`. | compiled |
| `help` | What one record is, in the business's words. See [Help](#help). | compiled |
| `icon` | A lucide icon id. See [Icons](#icons). | compiled |
| `parent` | Makes the entity a line item of the one named. See [Line items](#line-items). | compiled |
| `concurrency` | `optimistic` (default) or `last-write-wins`. See [Concurrency](#concurrency). | compiled |
| **`attributes`** | The columns, in order. See [Attributes](#attributes). | compiled |
| `indexes` | `{ columns: [...], unique?: true }`. See [Indexes](#indexes). | compiled |
| `label` | The name the screens show. | validated |
| `prefix` | `bus` or `sys`. | validated |
| `softDelete` | `true` to delete by stamping `deleted_at`. | validated |
| `audited` | `true` to keep an audit trail. | validated |

### Columns the generator adds

Every table gets `created_at`, `updated_at`, `deleted_at` and `version`, and the
audit columns `created_by`, `updated_by`, `deleted_by`. Declaring one of them is
`EML103` (auto-fixable: the declaration is removed) — PostgreSQL refuses a
`CREATE TABLE` that names a column twice.

### Concurrency

`version` is the optimistic-lock counter. Every write that changes a row
advances it, and every read returns it as an ETag, `"v<n>"`. Two people who
open one record both hold its version; the first save advances it, and the
second — still naming the version it read in `If-Match` — is refused with
**409 `VERSION_CONFLICT`**. The refusal carries the record as it now stands,
who changed it and when, the columns that changed, and the record's status, so
the screen offers *Refresh to latest* or *Overwrite with my changes* without a
second request. An overwrite names the version the refusal reported.

An entity's `concurrency` decides what a save that names no version means:

| Value | A save without `If-Match` |
|---|---|
| `optimistic` (default) | refused with **428** — a client that never read the record cannot overwrite it blind |
| `last-write-wins` | accepted — for an append-only log or a counter nobody edits by hand |

A save that does name a version is checked either way. In CEDM the key is
`persistence.concurrency`.

**A final state closes the record.** A record whose status is one of its state
machine's `final` states is a completed transaction: every update is refused
with **409 `RECORD_FINAL`**, for every caller, the master role included, and
whatever the entity's `concurrency`. `EML158` (info) says so when an entity
with final states is declared `last-write-wins`.

An entity that declares no `id` column and no unique or primary `*_id` column
gets an `id` primary key (a UUID) from the generator. A natural key the model
declares — a `code`, an `sku` — is then a unique column beside it. An entity
with no primary key at all is `EML117`, which the fixer resolves by adding `id`.

## Attributes

```yaml
- { name: email, type: email, unique: true, help: Where order confirmations go. }
```

| Key | Meaning |
|---|---|
| **`name`** | The column name, `snake_case`, unique in the entity (a duplicate is `EML112`). |
| **`type`** | A type from the vocabulary, optionally with a length: `string(120)`. See [04](04-types-and-cardinalities.md). An unknown type is `EML115` and is generated as a string. |
| `pk` | Primary key: unique, never required on a create (the generator supplies it), the entity's key. One per entity (`EML113`). |
| `fk` | Foreign key: the column is a reference. See [Foreign keys](#foreign-keys). |
| `unique` | A unique index. |
| `optional` | Nullable. A column is required unless it is `optional` or the key. An optional primary key is `EML116`. |
| `enum` | The name of an entry in `enums`: the column becomes a dropdown of its values. See [Enums](#enums). |
| `help` | What the column is for. See [Help](#help). |
| `comment` | A note for the model's readers. Carried, not compiled. |
| `ui`, `default`, `min`, `max`, `format` | Reserved: validated for shape and carried, with no reader. `min` and `max` must be numbers (`EML145`). |

### Foreign keys

`fk: true` marks a column as a reference, but it does not say *what* the column
references: the generator derives the target from the column name alone, so the
name has to carry it. The rule is `foreignKeys` in the language definition:

| Column name | Resolves to |
|---|---|
| a person-role name — `*_by`, `*_by_id`, or one of `assigned_to`, `author_id`, `lab_manager_id`, `manager_id`, `owner_id`, `pi_id`, `remediation_owner`, `remediation_owner_id`, `user_id` | `bus_user` |
| `parent_<entity>_id` | `bus_<entity>` — a hierarchy's self-reference |
| `<entity>_id` | `bus_<entity>` |
| anything else | nothing — see below |

A column ending in `_by` names a person by the role they played
(`reported_by_id`, `approved_by_id`), so it resolves to the person entity rather
than to a `bus_reported_by` table that does not exist. The generated application
resolves every person role to `bus_user`, so the model's people belong in a `User`
entity; the checker accepts `Staff` or `Employee` as the person entity when it
checks a reference, but the application looks them up in `bus_user` all the same.

**A column that resolves to nothing is silently degraded.** The generator stores
it as a plain string, so grids and forms show the raw UUID with no lookup and no
display name. Two codes catch the causes:

- `EML114` — an `fk` column that does not end in `_id`. Auto-fixable: the fixer
  appends the suffix everywhere the model names the column (its indexes and hook
  fields included), so `reported_by` becomes `reported_by_id` and starts
  resolving to the person entity.
- `EML119` — a column named like a reference to a declared entity without
  `fk: true`. **Both halves are required**: `vendor_id` without the flag and
  `vendor_id` with it are a text box and a lookup respectively.

Every foreign key needs a relationship behind it, and every one-to-many
relationship a foreign key on its many side (`EML125`).

### Help

`help` is compiled, and it is where the business lands in the model: an
entity's help is `sys_table.description` and opens the entity's section of the
generated manual; a column's is `sys_column.description`, the hint under the
form control, and the "Purpose" of its row in the manual. Everything else the
manual says — fields, relationships, lifecycle, rules, access — is derived from
the model's structure. **Help is the author's only lever**, so write it on every
entity and every column, and write domain knowledge rather than the name again.

Three warnings police it:

| Code | Fires when |
|---|---|
| `EML152` | an entity has no `help` |
| `EML153` | an entity has columns with no `help` — reported once, naming them |
| `EML151` | help restates its own subject instead of describing it |

`EML151` matters most, because coverage can be complete and the help still
worthless:

```yaml
# Restates the subject — EML151
- { name: household_id, type: uuid, fk: true, help: Household id for HouseholdMember. }
# Describes it
- name: household_id
  type: uuid
  fk: true
  help: >-
    The family this membership is in. Listed inside the household's own screen —
    a membership away from its household is not something anybody looks up.
```

It reports three shapes — `Unique identifier for X`, the column name in prose
(`Status for Client`), and a template sentence (`X is a business record in …`).
It is deliberately narrow: short, real help (*The day this offer expires.*) does
not fire. **The primary key needs no help**; `EML153` does not ask for it.

Good help answers *what business purpose does this serve, and what value is
expected here*: name the decision or event the field records, describe the
domain constraint rather than the database one, say what each enum value means,
and say what a foreign key's target *is* to this record.

### Icons

`icon` is a lucide icon id (<https://lucide.dev/icons>). `PascalCase`,
`kebab-case` and `snake_case` resolve to the same icon. It compiles to
`sys_table.icon`, which the entity's dashboard card, its window heading and the
navigation all draw. The generated application pins lucide 0.312, whose ids are
not all current ones (`alert-triangle` there is `triangle-alert` today), and no
checker carries lucide's catalogue: a name lucide does not have renders a
placeholder rather than failing validation. `flask` is the common trap — lucide
has `flask-conical` and no `flask`.

## Line items

```yaml
- name: InvoiceLine
  parent: Invoice
  attributes:
    - { name: id, type: uuid, pk: true }
    - { name: invoice_id, type: uuid, fk: true, help: The invoice this line is on. }
```

Some entities have no life away from their owner: an invoice line, an order
line, a prescription item. A relationship cannot say so — `InvoiceLine` →
`Invoice` and `Contact` → `Company` are the same one-to-many edge — so `parent`
does. Decide it with three questions:

1. Would a list of these records *away from their owner* be useful to anyone? A
   screen of every invoice line ever written is not one anybody opens.
2. Does the record's identity depend on the owner? "Line 1 of invoice 7".
3. Would deleting the owner make the record meaningless?

A "yes" to these makes it a child. A reference is the opposite on all three, and
most foreign keys are references.

| | Parent | Child |
|---|---|---|
| `sys_window` | its own | **none** |
| Dashboard | a card | **no card** |
| `sys_tab` | `tab_level 0` | `tab_level 1`, in the **parent's** window |
| Reached by | opening its window | opening a parent record |

The tab links on the child's own foreign key back to the parent, marked
`sys_column.is_parent` and stored as `sys_tab.link_column_id`. Do not declare a
second column for it. A child is still a real table with its own rules, access
control and form — only its *placement* changes.

| Code | Severity | Fires when |
|---|---|---|
| `EML147` | error | the parent is not declared, or an entity names itself |
| `EML148` | error | the child has no foreign key to the parent — nothing for the tab to link on |
| `EML149` | info | an entity is *shaped* like a line item and declares no `parent` |
| `EML150` | warning | a child is listed in a category, which asks for a card it will never have |

`EML149` is an info and never an error, because the three questions are about
the business. It fires on two shapes, each with a foreign key to the candidate:
a name that begins with a declared entity's name (`InvoiceLine`/`Invoice`), and
a name that ends in a line-item noun (`Line`, `LineItem`, `Item`, `Detail`,
`Entry`, `Row`). Answer it either way — declare the parent, or leave the entity
alone because it is a thing in its own right.

## Enums

```yaml
enums:
  - { name: OrderStatus, values: [draft, submitted, approved, shipped, cancelled] }
  - { name: Priority, values: [low, medium, high, urgent] }
```

An enum is a named list of values: letters, digits, `_` and `-` (`EML134`), no
duplicates (`EML133`), one declaration per name (`EML131`). It does nothing to a
column until the column binds it with `enum:`, which compiles it to a
`sys_reference` with one `sys_ref_list` row per value and renders the column as
a dropdown. A column naming an undeclared enum is `EML144`.

A `status`, `state` or `stage` column with no `enum` is `EML146`: the dictionary
records free text, and the form accepts values the entity's state machine cannot
act on. Bind it to an enum carrying exactly the machine's states.

## Indexes

```yaml
indexes:
  - columns: [customer_id, status]
  - { columns: [email], unique: true }
```

Each compiles to a real index in the bus-table DDL — including composites, which
no naming convention can produce. An index naming a column the entity does not
declare is `EML155`, and is left out of the DDL: a migration that cannot apply
is worse than a missing index.

## Categories

```yaml
categories:
  - name: Compound Registry
    description: Structures and aliases
    icon: flask-conical
    color: "#6366f1"
    entities: [Compound, CompoundAlias]
  - { name: People and Teams, default: true, entities: [User, Team] }
```

A category groups entities on the generated dashboard, one block per category,
and `/admin/categories` maintains them. Only `name` is required. `code` is the
dictionary row's stable key, derived from the name when omitted — set it to keep
the key through a rename; categories sharing a code merge. `seq` orders them.
`default: true` marks the category that receives every entity placed in no
other; at most one may. A model that declares none gets a single `General`
category holding every entity.

A block appears on a reader's dashboard only when they may read at least one
entity in it (the model's `read` access rules decide), and line items are never
listed, because a child is reached through its parent.

## Relationships

```yaml
relationships:
  - { from: Customer, fromCardinality: exactly-one, to: Order, toCardinality: zero-or-more, label: places }
  - { from: Order, fromCardinality: exactly-one, to: OrderLine, toCardinality: one-or-more, label: contains }
  - { from: Student, fromCardinality: zero-or-more, to: Course, toCardinality: zero-or-more, label: enrols }
```

**`from`**, **`fromCardinality`**, **`to`** and **`toCardinality`** are
required; `label` names the relationship (default `<from>_<to>`). A cardinality
is `exactly-one`, `zero-or-one`, `zero-or-more` or `one-or-more`, and the eight
pairs [04](04-types-and-cardinalities.md#relationship-cardinalities) lists are the
language's relationships. The kind decides which side carries the foreign key:
the many side of a one-to-many, named after the one side (`Company` →
`company_id`).

| Code | Fires when |
|---|---|
| `EML120` / `EML121` | an end names an undeclared entity |
| `EML123` | an entity relates to itself — valid for a hierarchy; carry the reference (`parent_category_id`) |
| `EML124` | the same relationship is declared twice |
| `EML125` | the many side has no foreign key for the relationship |

**A relationship does not say whether the many side is a line item.**
`Quote → QuoteItem` and `Company → Contact` are the same edge. That is what
[`parent`](#line-items) is for; a model that never writes it gets a dashboard
card listing every quote item ever written, and a quote that does not show its
own items.
