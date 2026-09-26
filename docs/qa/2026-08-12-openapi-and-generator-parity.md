# QA — OpenAPI coverage, generator parity, and the dictionary's window/tab/field layer

**Date:** 2026-08-12
**Model:** `examples/drug-discovery.eml.mmd` (17 entities, 7 categories, 1 saga)
**Scope:** the OpenAPI document a generated app serves; equivalence between the
TypeScript and Rust generators; the `sys_window` / `sys_tab` / `sys_field` rows
the dictionary seed produces, exercised on an entity with two entity references.

Everything below was run against a freshly generated application, migrated and
seeded from empty, with the backend actually running — not against templates
read in isolation.

---

## Summary

| Gate | Result |
|---|---|
| TS vs Rust generated backend | **identical** — 116 files, 0 differing lines outside the `Generated:` timestamp |
| Generated backend suite (TS-generated) | **268 passed**, 0 failed |
| Generated backend suite (Rust-generated) | **268 passed**, 0 failed |
| `cargo clippy --all-targets -D warnings` (generated) | **clean** |
| Generator unit tests (Vitest) | **414 passed** |
| Generator unit tests (`cargo test -p appwithai-gen`) | **68 passed** |
| Repo `tsc --noEmit` | **clean** |

Two defects found and fixed, both in the OpenAPI layer. Two findings reported
and **not** fixed, because both are the documented behaviour of the language
rather than code faults — they need a decision, not a patch.

---

## What changed

### DEFECT-001 — most of the API was undocumented
**Severity:** Medium · **Status:** fixed

`src/openapi.rs` claimed in its own module doc to describe "auth, the
dictionary, rules, workflows, audit". It described 19 operations. `sys.rs` (21
handlers) and `audit.rs` (4 handlers) carried no `#[utoipa::path]` at all, and
`rules`, `workflow`, `auth` and `bus` were each missing several.

Nothing failed, which is why it survived: an undocumented route still works, so
the only symptom is a client generated from the spec that is quietly missing
endpoints.

Annotated every routed handler and registered it. The served document went from
**19 operations to 49**, across 37 paths, and gained the `audit` tag.

### DEFECT-002 — the document declared the wrong verb for a business update
**Severity:** Medium · **Status:** fixed

`bus::update` is mounted at both `PUT` and `PATCH`. Its annotation declared
`patch` only. The generated frontend sends `PUT`, so the one verb the app
actually uses for editing a business record was absent from its own API
description.

Found by the new coverage test, not by reading. Now declared as `put`, with the
`PATCH` alias stated in the description. The same `PUT`/`PATCH` pairing on
`sys` and `rules` and `workflow` is documented the same way.

Also corrected while annotating: `/api/sys/fields/form` and `/api/sys/fields/grid`
take a **required `entity`** query parameter, not an optional `tableName`. The
first draft of the annotation said `tableName`, and the live check caught it —
the endpoint returns 400 without `entity`.

Three workflow operations (`list`, `execute`, `runs`) also carried no
`security(...)`, left over from when that controller was unguarded (fixed in
`6dd3880`). The spec was still advertising them as open. They now declare
bearer, which matches what the server does.

### New guard — `tests/requests/openapi.rs`
**4 tests**, generated into every app. The backend suite is now **268**.

The important one is `every_routed_handler_is_described`: it walks the
controllers' own `Routes` tables, rebuilds each mounted URI the way
`AppRoutes::collect` does, and fails on the first route the served document does
not carry. A hand-maintained `paths(...)` list is correct the day it is written
and wrong six commits later; this makes that a test failure instead of a
discovery.

The other three assert the document is served and well-formed, that `/redoc`
and `/scalar` both render, and that the dictionary-driven families stay
described **generically** — `/api/bus/{entity}`, not one path per table. That
last one matters: entities can be added through the dictionary at run time, so a
per-table document would be wrong without anyone regenerating anything.

---

## Runtime verification

Server started with `cargo loco start --server-and-worker`, database migrated
and seeded from empty.

```
GET /openapi.json   200   32,118 bytes   application/json   OpenAPI 3.1.0
GET /redoc          200   32,792 bytes
GET /scalar         200   32,490 bytes
```

37 paths · 49 operations · tags `auth, bus, sys, audit, rules, workflow` ·
`securitySchemes: [bearer]`.

Every documented parameterless `GET` was called against the running server and
answered. Every security claim in the document was checked against the server:

| | documented | observed |
|---|---|---|
| `/api/sys/tables`, `/api/me/health`, `/openapi.json` | open | 200 without a token |
| `/api/bus/*`, `/api/audit`, `/api/rules`, `/api/workflow`, `/api/workflows/runs`, `/api/me/permissions` | bearer | 401 without a token |
| `POST /api/sys/tables`, `POST /api/workflow` | bearer | 401 without a token |

The document and the server agree.

---

## The dictionary: windows, tabs and fields

Counted on the seeded database:

| | count |
|---|---|
| `sys_table` | 17 |
| `sys_column` | 141 |
| `sys_window` | 24 |
| `sys_tab` | 17 |
| `sys_field` | 141 |

**One tab per entity, one field per column** — 17 and 141 respectively, exactly
matching the tables and columns. The 24 windows are the 17 entity windows plus 7
admin windows (Audit Log, Business Rules, Role, Table and Column, User, Window
Tab and Field, Workflow Designer), which carry no tab onto a business table
because they drive the admin screens.

### Tested: an entity referencing two other entities

`bus_capa` was chosen because it references two *different* entities:

```
Capa (window, type M, "Maintain Capa records")
└── Capa (tab, seq 10) ──> bus_capa
    ├── deviation_report_id   ──> bus_deviation_report
    └── remediation_owner_id  ──> bus_user
```

9 columns, 9 fields, 8 shown on the form (`id` hidden). Both references resolve,
by two different routes: `deviation_report_id` by the `<entity>_id → bus_<entity>`
rule, `remediation_owner_id` through the person-role list, which sends it to
`bus_user` rather than a `bus_remediation_owner` that does not exist.

Exercised end to end — two users, an experiment, a deviation report and a Capa
created through `/api/bus/*`, with the Capa pointing at both parents. Both
lookups carried their `ref_table_name` on `/api/bus/capa/fields/form` and
`/fields/grid`.

### Tested: the admin can reconfigure it afterwards

Hiding a field through the dictionary API took effect on the next request, with
no restart and no redeploy:

```
GET  /api/bus/capa/fields/form   -> [..., effectiveness_metric, status, verified_at]
PUT  /api/sys/fields/{id}  {"is_displayed": false}   -> 200
GET  /api/bus/capa/fields/form   -> [..., status, verified_at]
```

That is the §6.4 promise — reordering or hiding a field is a data change, not a
deployment — and it holds.

---

## Reported, not fixed — both since closed

> **Update, same day.** Both were fixed after this report; see
> `2026-08-12-lookup-resolution-and-labels.md`. `qualifierPrefixes` strips
> `parent_` before the entity rule, and `is_identifier` falls back to the first
> label-able column when no conventional name is present. All 25 lookups on this
> model now resolve and render a label.

Both of these are the **documented** behaviour of the modelling language
(`language/appwithai-language.json`, `foreignKeys.resolution`), so changing
either is a language decision rather than a bug fix. The EML checker reports
`0 errors, 0 warnings` on this model, which is consistent with the spec as
written.

### FINDING-A — 5 of 25 lookups render a raw UUID

A lookup renders a human label only if its target table has a column marked
`is_identifier`, and that mark is set from a fixed six-name list —
`name, first_name, last_name, title, code, label` — identical in both
generators.

Three entities in this model have no column with any of those names, so nothing
is marked, and every lookup pointing at them renders the id:

| lookup | target | why |
|---|---|---|
| `bus_capa.deviation_report_id` | `bus_deviation_report` | columns are `anomaly_description`, `severity`, `status`, … |
| `bus_sample.compound_id` | `bus_compound` | columns are `smiles`, `inchi_key`, `formula`, … |
| `bus_compound_alias.compound_id` | `bus_compound` | " |
| `bus_stability_test.compound_id` | `bus_compound` | " |
| `bus_stability_pull.stability_test_id` | `bus_stability_test` | columns are `condition_temperature`, `status`, … |

The remaining 18 lookups resolve and render correctly.

This is the same class as ISSUE-006 from 2026-07-31, which fixed the *rendering*
when labels exist. It does not help a table that has no label column to begin
with. A compound really is identified by its `smiles` or `inchi_key`; the
heuristic simply has no way to know that.

**Options, in the order I would consider them:** let a model name its own label
column with a directive (the honest fix, and a language change); or fall back to
the first `is_selection_column`, then the first non-key string column, when
nothing is marked. Either changes the dictionary seed for every model, so it
wants a decision before a patch.

### FINDING-B — a self-referencing FK resolves to a table that does not exist

`bus_sample.parent_sample_id` resolves to `bus_parent_sample`. There is no such
table; `GET /api/bus/parent_sample` is a 404, and the field falls back to
rendering the raw id — so a sample's parent cannot be picked from a list.

This follows rule 2 exactly (`<entity>_id → bus_<entity>`, and the entity here
reads as `parent_sample`), so the generator is doing what it is specified to do.
The gap is that nothing warns: `EML114` checks that an FK column ends in `_id`,
but no check asserts that the table it resolves to is one the model defines.

**The cheapest useful change** is a checker rule — the checker knows every
entity, so an FK resolving outside that set is mechanically detectable, and it
would have flagged this at validation time rather than at a picker that silently
does nothing. Whether `parent_<entity>_id` should additionally resolve to
`bus_<entity>` is the separate language question.

---

## Reproducing

```bash
# parity
bun run generate:tanstack -- -i examples/drug-discovery.eml.mmd \
  -o generated-projects/dd-ts -n drug-discovery --no-setup --force --skip-cli-scaffold
cargo run -p appwithai-gen -- generate -i examples/drug-discovery.eml.mmd \
  -o generated-projects/dd-rs -n drug-discovery --skip-cli-scaffold --force
diff -r generated-projects/dd-ts/backend generated-projects/dd-rs/backend   # timestamps only

# the generated backend
cd generated-projects/dd-ts/backend
createdb drug_discovery_test
LOCO_ENV=test cargo test --test app                 # 268
cargo clippy --all-targets -- -D warnings

# the OpenAPI document, live
cargo loco db migrate && cargo loco db seed
cargo loco start --server-and-worker &
curl -s localhost:3000/openapi.json | python3 -m json.tool | head
```
