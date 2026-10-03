# EML — Types, Flags and Cardinalities

The vocabularies a model writes values from. Every one is defined in
`language/appwithai-language.json` — `types`, `attributes`, `cardinalities` —
and read from there by the checker and both generators.

## Attribute types

An attribute's `type` is a name from the type map, optionally with a length.
Types are **case-insensitive** (`VARCHAR` is `varchar` is `string`) and are
normalised to one of eight canonical types, which decide the column's SQL type,
its TypeScript and validation types, and its form control. An unknown type is
`EML115` and is generated as a string.

### Canonical types

`string`, `text`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `json`.

### Aliases

| Canonical | Aliases |
|---|---|
| `string` | `string`, `varchar`, `char`, `uuid`, `guid`, `id`, `email`, `url`, `phone`, `password`, `color` |
| `text` | `text`, `longtext` |
| `integer` | `int`, `integer`, `bigint`, `smallint` |
| `decimal` | `number`, `decimal`, `float`, `double`, `money`, `amount` |
| `boolean` | `bool`, `boolean` |
| `date` | `date` |
| `datetime` | `datetime`, `timestamp`, `time` |
| `json` | `json`, `jsonb`, `object`, `array` |

### Semantic aliases

Some aliases normalise to `string` but say more: the Application Dictionary gives
each its own reference, so the generated form draws the right control and
checks the right thing.

| Alias | Stored as | Rendered as |
|---|---|---|
| `email` | string | an email input, validated as an address |
| `url` | string | a URL input |
| `phone` | string | a telephone input |
| `password` | string | a password input, minimum length enforced |
| `color` | string | a colour picker |
| `uuid` | string | a UUID key — the type for primary and foreign keys |

Prefer the semantic alias whenever one fits: `type: email` and `type: string`
store the same value, and only one of them gives the user an email field.

A `text` column is prose the author writes about the record, and the dictionary
treats it that way: it is one of the signals that decide which column labels a
record in a lookup (see `applicationDictionary` in the definition).

### Length

A length follows the type in parentheses, and becomes the column's maximum
length:

```yaml
- { name: display_name, type: string(120) }
- { name: code, type: varchar(40) }
```

## Attribute flags

Boolean keys on an attribute. Each defaults to `false`, and canonical form omits
a `false` flag.

| Flag | Effect |
|---|---|
| `pk` | Primary key: unique, never required on a create — the generator supplies it — and the entity's key. |
| `fk` | Foreign key: the column is a reference, and with a reference-shaped name it becomes a lookup ([01](01-entities.md#foreign-keys)). |
| `unique` | A unique index. |
| `optional` | Nullable: not required on a create. |

**Defaults:** a column is required unless it is `optional` or the key, and not
unique unless it is `unique` or the key.

## Relationship cardinalities

A relationship states the cardinality of each end:

| End | Meaning |
|---|---|
| `exactly-one` | one record, always |
| `zero-or-one` | at most one record |
| `zero-or-more` | any number of records, none included |
| `one-or-more` | at least one record |

These eight pairs are the language's relationships; any other pair is refused by
the schema. The kind decides which side carries the foreign key — the many side
of a one-to-many, named after the one side.

| `fromCardinality` | `toCardinality` | Kind | Example |
|---|---|---|---|
| `exactly-one` | `exactly-one` | one-to-one | User — Profile |
| `zero-or-one` | `zero-or-one` | one-to-one | Employee — ParkingSpace |
| `exactly-one` | `zero-or-more` | one-to-many | Company — Contact |
| `exactly-one` | `one-or-more` | one-to-many | Order — OrderItem |
| `zero-or-more` | `exactly-one` | many-to-one | Deal — DealStage |
| `one-or-more` | `exactly-one` | many-to-one | OrderItem — Order |
| `zero-or-more` | `zero-or-more` | many-to-many | Student — Course |
| `one-or-more` | `one-or-more` | many-to-many | Author — Book |

```yaml
relationships:
  - { from: Company, fromCardinality: exactly-one, to: Contact, toCardinality: zero-or-more, label: employs }
  - { from: Deal, fromCardinality: zero-or-more, to: DealStage, toCardinality: exactly-one, label: in_stage }
```
