# Lookup resolution and labels — both open findings closed

**Date:** 2026-08-12
**Closes:** the two items left open by
`2026-08-12-openapi-and-generator-parity.md` and repeated in
`2026-08-12-runtime-dictionary-provisioning.md`.

Both were the documented behaviour of the modelling language rather than code
faults, so they were reported and left for a decision. The decision was to fix
both.

---

## Result

On `examples/drug-discovery.eml.yaml`, **all 25 lookups now resolve to an entity
the dictionary has, and all 25 render a human label.** Before: 18 rendered a
label, 5 rendered a raw UUID, and 1 pointed at a table that does not exist.

| Gate | Result |
|---|---|
| TS vs Rust generated backend | **identical**, 116 files, 0 differing lines outside the timestamp |
| Generated backend suite | **272 passed**, 0 failed |
| `cargo clippy --all-targets -D warnings` (generated + `appwithai-gen`) | clean |
| Generator unit tests | **414** (Vitest) · **68** (`cargo test -p appwithai-gen`) |
| Repo `tsc --noEmit` | clean |
| `language/checker.ts` on drug-discovery | 0 errors, 0 warnings |

---

## FINDING-B — a self-reference resolved to a table that does not exist

`bus_sample.parent_sample_id` derived `bus_parent_sample`. There is no such
table: `GET /api/bus/parent_sample` was a 404, so the picker had nothing to show
and the field fell back to a raw id.

The generator was doing exactly what rule 2 said (`<entity>_id → bus_<entity>`,
and the entity here reads as `parent_sample`). The rule was the problem.

**Added `foreignKeys.qualifierPrefixes` to the language definition** — prefixes
that name the *role* a reference plays rather than a different entity. One entry
today, `parent_`. It is stripped before the entity rule, so `parent_sample_id`
resolves to `bus_sample`.

Ordering matters and is now explicit: the person-role list is consulted first,
then the qualifier comes off, then the person-role list again — so
`parent_owner_id` reaches the user entity exactly as `owner_id` does. A bare
`parent_id` strips to `id` and still resolves to nothing, because the model has
not said what kind of parent it means.

**The tradeoff, stated plainly:** stripping is unconditional. A model that
genuinely declares a `ParentSample` entity and a `parent_sample_id` pointing at
it now resolves to `bus_sample` instead. That is why EML119 exists.

Mirrored in all six places the resolution rule lives, which had to stay in
agreement:

| | |
|---|---|
| `language/appwithai-language.json` | canonical `foreignKeys.qualifierPrefixes` |
| `backend/src/services/dictionary.rs.hbs` | `QUALIFIER_PREFIXES`, what the running app uses |
| `backend/tests/support/entities.rs.hbs` | `const fn`, compared as `prefix + role` because a `const fn` cannot slice a `&str` |
| `tests/harness/harness.ts.hbs` | the bun suite's parent resolution |
| `common/seeds/business-data.ts.hbs` | the demo-data seed |
| `language/checker.ts` | `stripQualifierPrefix`, used by `fkToEntityName` |

## FINDING-A — entities with no conventional label column rendered raw UUIDs

`is_identifier` was set from a fixed list of six names — `name, first_name,
last_name, title, code, label`. Three entities in this model use none of them: a
compound is identified by its `smiles`, a deviation report by its
`anomaly_description`, a stability test by its conditions. Those entities got no
identifier at all, and then *every lookup pointing at them* rendered a UUID.

**`is_identifier` now falls back.** The conventional names when present;
otherwise the first column, in declaration order, that could serve as a label —
skipping the key, the system timestamps, and anything that is not a String or
Text reference. Foreign keys are excluded by that last rule: a lookup labelled
by another lookup is no better than the id.

The fallback is a property of the entity, not the column — whether `smiles`
identifies a compound depends on whether anything else already does — so both
generators compute the whole set per entity before emitting any column.

Identifier columns went from 7 of 17 entities to **17 of 17**:

| entity | identifier | how |
|---|---|---|
| `bus_compound` | `smiles` | fallback |
| `bus_deviation_report` | `anomaly_description` | fallback |
| `bus_stability_test` | `condition_temperature` | fallback |
| `bus_sample` | `physical_state` | fallback |
| `bus_capa` | `title` | conventional |
| `bus_user` | `first_name`, `last_name` | conventional |

## New: EML119

The checker validated the *shape* of an FK name (EML114, "does not end in
`_id`") but never that the name landed anywhere. A well-formed column naming a
non-entity produced a `bus_` table that is never created — and nothing said so.
The app compiles, the migration runs, and the column works as an opaque id.

`EML119` reports an FK whose resolved target the model does not define. Person
roles are exempt, since they resolve by rule rather than by their own name.

Verified on a synthetic model — it fires on the genuinely dangling reference and
stays quiet on the two that resolve:

```
warn [EML119] Foreign key "Sample.widget_id" resolves to "Widget",
              which this model does not define.
     → Define a "Widget" entity, or rename the column after the entity it
       points at. Left as is, the field renders a raw UUID with no lookup.
```

`parent_sample_id` and `reported_by_id` in the same model produce nothing, which
is the point: the first now resolves through the qualifier rule, the second
through the person-role rule.

It is a warning, not an error, so it does not block generation — a dangling FK
is a working column, just an unhelpful one.

---

## Runtime verification

Fresh app, migrated and seeded from empty, then `cargo loco start`:

```
GET /api/bus/sample/fields/form
  compound_id        -> bus_compound     labels=['smiles']
  parent_sample_id   -> bus_sample       labels=['physical_state']
  experiment_id      -> bus_experiment   labels=['title']

GET /api/bus/capa/fields/form
  deviation_report_id  -> bus_deviation_report  labels=['anomaly_description']
  remediation_owner_id -> bus_user              labels=['first_name','last_name']
```

Before this change the same two calls returned `bus_parent_sample` (404) and
empty label lists for `compound_id` and `deviation_report_id`.

A note on method: the first run of this check reported the *old* results,
because a server from an earlier step still held port 3000 and the new process
had exited with a bind failure. The numbers above are from a confirmed-fresh
process. Worth remembering — a stale listener looks exactly like a fix that did
not work.

## New guard

`every_entity_that_can_be_labelled_has_an_identifier`, generated into every app.
It fails on any `bus_` table that has a String or Text column but nothing marked
`is_identifier` — the precise condition that made a lookup render a UUID. The
bar is "can be labelled": an entity whose columns are all numbers, dates and
foreign keys has nothing a human could read and is correctly left without one.

The backend suite is now **272**.

## Reproducing

```bash
bun language/checker.ts <a model with a dangling FK> --no-color   # EML119

bun run generate:tanstack -- -i examples/drug-discovery.eml.yaml \
  -o generated-projects/dd-ts -n drug-discovery --no-setup --force --skip-cli-scaffold
createdb dd_fix
cd generated-projects/dd-ts/backend
DATABASE_URL=postgres://…/dd_fix cargo loco db migrate && cargo loco db seed
psql -d dd_fix -c "SELECT t.table_name, string_agg(c.column_name,', ')
  FILTER (WHERE c.is_identifier)
  FROM sys_table t JOIN sys_column c ON c.sys_table_id=t.sys_table_id
  WHERE t.table_name LIKE 'bus_%' GROUP BY 1 ORDER BY 1;"
```
