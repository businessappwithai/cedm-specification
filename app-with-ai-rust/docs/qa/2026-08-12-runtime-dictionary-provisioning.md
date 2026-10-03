# QA — runtime window/tab/field provisioning

**Date:** 2026-08-12
**Skill:** `/qa` (gstack), Standard tier
**Target:** a freshly generated `drug-discovery` app — generated, migrated and
seeded from an empty database, running under `cargo loco start`
**Question:** when an admin adds a table or a column through the dictionary API
at run time, does the app create the equivalent window, tab and field the way
the seed does at generation time?

**Answer before this pass: no.** Two defects, both fixed and both now guarded.

---

## Health

| | before | after |
|---|---|---|
| Runtime table → window + tab | ✗ nothing created | ✓ |
| Runtime column → field | ✗ request failed outright | ✓ |
| Generated backend suite | 268 | **271 passed**, 0 failed |
| `cargo clippy --all-targets -D warnings` | clean | clean |
| TS vs Rust generator | identical | identical, 116 files |
| Generator unit tests | 414 / 68 | 414 / 68 |

---

## DEFECT-003 — a table added at run time had no screen

**Severity:** High · **Status:** fixed

The seed emits one `sys_window` and one `sys_tab` per entity and one `sys_field`
per column, and the entire UI is built from those rows. `POST /api/sys/tables`
is generic CRUD, so it inserted a `sys_table` row and stopped there.

Observed on the running app before the fix:

```
POST /api/sys/tables      -> 201
sys_window  24 -> 24      (unchanged)
sys_tab     17 -> 17      (unchanged)
```

The table existed and `/api/bus/<it>` served data, but nothing rendered it
anywhere — which to anyone using the app reads as the table not having been
created at all.

`sys::create` now pairs them the way the seed does: a window titled
`Maintain <name> records` (type `M`), a tab, and `sys_table.sys_window_id`
pointed at the new window, which is what the navigation follows. A column gets a
field on its table's tab, with the key hidden and the grid taking the first
eight non-key columns — the seed's own layout rules.

## DEFECT-004 — the dictionary API could not create a column at all

**Severity:** High · **Status:** fixed

Found while testing the above. `POST /api/sys/columns` failed every time:

```
POST /api/sys/columns -> 400 {"message":"A value has the wrong type or format"}
```

The sys controller bound every value by its JSON type, so `sys_table_id` — a
`uuid` column — went in as text and Postgres refused it with 42804. This was not
limited to columns: any `sys_*` write carrying a foreign key, a date, or a
boolean-as-string had the same problem, which is most of the dictionary.

Same class as the `dynamic_repo` NULL defect fixed in `183d563`. Rather than
write a second binder that can drift from the first, `verify_column` now reports
the column's SQL type and binding is delegated to
`dynamic_repo::raw_json_to_expr` — one binder across the business and dictionary
tables, so the two cannot disagree about what a `date` accepts.

## DEFECT-005 — attaching a table to an existing window left it with no tab

**Severity:** Medium · **Status:** fixed
**Found by:** this QA pass, in the first version of the DEFECT-003 fix

Honouring a caller-supplied `sys_window_id` was implemented as an early return,
which skipped the tab as well as the window:

```
POST /api/sys/tables {"sys_window_id": "<existing>"}  -> 201
  uses caller's window : true
  tabs                 : 0        <-- the same empty screen, one layer down
```

The window is the caller's to choose; the tab is still owed. Fixed, and the tab
now takes `MAX(seq_no) + 10` on that window so attaching a table appends rather
than reordering somebody else's screen.

---

## Test cases run against the fresh app

| | case | result |
|---|---|---|
| TC-1 | admin adds a table | window 24→25, tab 17→18, both named and wired |
| TC-2 | admin adds two columns, one a lookup | both 201; fields created on the right tab |
| TC-3 | new entity usable with no restart | `/api/sys/fields/form?entity=bus_assay_run` returns both fields; `experiment_id` resolves to `bus_experiment` |
| TC-4 | table attached to an existing window | window count unchanged; 1 tab, `seq_no` 20 after the existing tab |
| TC-5 | same column twice | 1 field, not 2 |
| TC-6 | column on a table with no tab | 201, no field, no crash |

TC-3 is the one worth keeping in mind: a lookup added at run time resolves
through the same naming rules as a generated one, so a column named
`experiment_id` gets a working picker without regenerating anything.

## Guards added

Three tests, generated into every app, in `tests/requests/dictionary.rs`:

- `gives_every_entity_a_tab_and_every_column_a_field` — checks the mapping is
  total in *both* directions rather than that the totals agree. 141 fields for
  141 columns still passes if one column has two and another none. It also fails
  on a field whose tab belongs to a different entity than its column, which
  nothing in the schema prevents.
- `provisions_a_window_tab_and_field_for_anything_added_at_run_time` — drives
  the API, and covers DEFECT-005 by attaching a second table to the first one's
  window and asserting the window is reused *and* a tab appears.
- `resolved_lookups_point_at_the_right_entity` — pins reference resolution for
  every lookup whose target exists, including that a `_by`/`_by_id` column
  reaches the user entity rather than a table named after the column.

---

## Still open

> **Update, same day.** Both closed; see
> `2026-08-12-lookup-resolution-and-labels.md`.

Unchanged from `2026-08-12-openapi-and-generator-parity.md`, and deliberately not
asserted by the new tests because both are the documented behaviour of the
language rather than defects:

- 5 of 25 lookups render raw UUIDs where the target table has no column in
  `IDENTIFIER_COLUMNS`.
- A self-reference such as `parent_sample_id` derives `bus_parent_sample`, which
  does not exist, so that picker has nothing to show.

One flake seen, not reproduced: `rules_experiment::validates_the_jdm_it_builds`
failed once in a full run and passed in isolation and on two subsequent full
runs. It POSTs to `/api/rules/validate` and never touches the dictionary, so it
is unrelated to this work — noted here so the next person who sees it knows it
has been seen before.

## Reproducing

```bash
bun run generate:tanstack -- -i examples/drug-discovery.eml.mmd \
  -o generated-projects/dd-qa -n drug-discovery --no-setup --force --skip-cli-scaffold
createdb dd_qa
cd generated-projects/dd-qa/backend
DATABASE_URL=postgres://…/dd_qa cargo loco db migrate && cargo loco db seed
DATABASE_URL=postgres://…/dd_qa cargo loco start --server-and-worker &

TOKEN=$(curl -s -X POST localhost:3000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@admin.com","password":"admin"}' | jq -r .token)
curl -s -X POST localhost:3000/api/sys/tables -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"table_name":"bus_assay_run","name":"Assay Run","created_by":"qa","updated_by":"qa"}'
psql -d dd_qa -c "SELECT count(*) FROM sys_window;"   -- 25, was 24
```
