# QA Report — the Rust CLI, and the app it generates

**Date:** 2026-08-10
**Branch:** `claude/gstack-drug-discovery-qa-lkhred`
**Model under test:** `examples/drug-discovery.eml.yaml` (17 entities, 16 relationships, 7 categories, 1 saga)
**Scope:** gstack `/qa`, retesting **only the Rust generator** — its CLI surface end to end, then the application it produces: built, migrated, seeded, started, and exercised over HTTP as a real client.

| | Before | After |
|---|---|---|
| Health score | **48 / 100** | **95 / 100** |
| Critical defects | 1 (auth bypass in every generated app) | **0** |
| CLI defects | 3 | **0** |
| Generated backend request suite | 246 / 246 | **247 / 247** |
| Generator unit tests | 66 | 66 |
| TS/Rust backend equivalence | byte-identical | byte-identical (114 files) |

The health score is low before because the app the generator ships had an
unauthenticated route that could write to any business table. Everything else
worked.

`$B` (the gstack browse binary) is not built in this container — its setup
cannot download Chrome here — so the browser leg was not run. It would have
added little: the Rust generator emits no frontend, and the backend it does emit
renders no HTML. HTTP is the app's entire user surface, and that is what was
tested.

---

## Critical: the workflow controller had no authentication at all

**Every generated application is affected.** The flaw is in
`templates/…/backend/src/controllers/workflow.rs.hbs`, which both generators
emit byte-identically, so it is not a regression from the Rust port — the port
reproduced it faithfully.

Not one of the seven handlers took an `auth::JWT` extractor:

```
$ grep -c "auth::JWT" workflow.rs.hbs
0
```

Its siblings all do — `bus.rs` 8/8, `rules.rs` 8/8, `audit.rs` 4/4. This was an
omission, not a design decision.

### What it allowed

Against a freshly generated, freshly seeded app, with **no credentials at all**:

| Request | Result |
|---|---|
| `GET /api/workflow-definitions` | 200 — every business process, BPMN included |
| `GET /api/workflows/runs` | 200 |
| `POST /api/workflow-definitions` | **201 Created** |
| `PATCH /api/workflow-definitions/{id}` | 200, change persisted |
| `DELETE /api/workflow-definitions/{id}` | 204, row gone |
| `POST /api/workflow-definitions/{id}/execute` | 200, workflow ran |

The model-managed saga survived tampering, but only because the
`is_model_managed` guard caught it — not because of authentication. Every
workflow a user builds in the Designer was anonymously editable and deletable.

### Why it is critical rather than merely bad

A workflow's steps are `CreateEntity`, `UpdateEntity`, `DeleteEntity` and
`REST`. So the controller is a way around the guard on `/api/bus/*`.
Demonstrated end to end:

```
POST /api/bus/bus_team          (no token)  -> 401     # the guard works
POST /api/workflow-definitions  (no token)  -> 201     # …and is irrelevant
POST /api/workflow-definitions/{id}/execute (no token) -> 200
SELECT name FROM bus_team;                  -> PWNED-no-jwt
```

The definition's single step was `CreateEntity` on `bus_team`. The row the bus
route had just refused was written anyway, by a caller who never signed in. The
same path gives anonymous `UpdateEntity` and `DeleteEntity` over every business
table, and `REST` makes the server issue arbitrary outbound HTTP.

### Fixed

`_auth: auth::JWT` on all seven handlers, matching the sibling controllers
exactly. Reads are guarded too: unlike `sys_*`, nothing renders before login
from a workflow definition, and a definition describes the business process in
full.

Replayed against the rebuilt app, every request in the table above now returns
**401** and nothing is written.

Checked before shipping: the generated frontend's workflow screens all go
through the authenticated client in `src/lib/auth.ts`, and all live under
`/admin/*` behind login. There are no raw `fetch` calls to `/api/workflow`.
Guarding the reads breaks nothing.

### Why 246 passing tests never caught it

Every suite in the generated crate authenticates every request:

```rust
support::with_app(|request, _ctx, token| async move {
    request.post("/api/workflow").add_header("authorization", bearer(&token))
```

Nothing anywhere asserted what happens *without* a token, so a wide-open
endpoint and a correctly guarded one were indistinguishable to the suite. The
per-entity `requires_authentication` tests cover `/api/bus/*` only.

Added `permissions::guarded_routes_refuse_an_anonymous_caller`, which walks the
guarded surface with no credentials and fails on any 2xx.

It was verified to be a real gate, twice:

| Guard removed | Test |
|---|---|
| all seven handlers | FAILS — names the three reachable GETs |
| `create` only | FAILS — `CREATE_WORKFLOW … -> 201 Created` |
| none (fixed) | passes |

The second case is why the test POSTs a **valid** definition rather than `{}`. A
bare body is rejected for a missing field before the handler runs, so a test
built on it returns 400 whether or not the route is guarded — and would have
passed with `create` wide open. That was the first version of this test; it is
not the version that shipped.

---

## CLI defects

### `--skip-backend` reported success for work it did not do — medium

```
$ appwithai generate -i model.eml.yaml -o out --skip-backend
✅ Backend generated at /…/out
   17 entities, 16 relationships, 7 categories
```

Zero files were written. The backend is the *only* thing this generator emits,
so `--skip-backend` skips everything; the run then printed a success banner and
a summary of work that never happened.

**Fixed** — it now says what occurred and exits 0, because a no-op is not an
error:

```
⚠️  Nothing was generated.
   --skip-backend was given, and the backend is the only thing this generator
   emits — the frontend and the bun:test suite are not ported to it yet.
```

### `--db sqlite` was accepted and silently ignored — medium

`--db` is in `--help` with `postgresql | sqlite`. Passing `sqlite` succeeded and
emitted a **Postgres** application: `sqlx-postgres` features, `postgres://` in
every `config/*.yaml`, Postgres-only `sys_*` DDL.

**Fixed in the Rust CLI** — refused with an error that says why, exit 1. No
reading of `--db sqlite` produces a SQLite app, and a flag in `--help` gives a
developer every reason to believe it did something.

**Present in the TypeScript CLI too, and not fixed there.** It is worse on that
side: `--db` is offered in help text *and* in an interactive wizard that prints
`sqlite — Zero-config for development`, the value is stored in the project
manifest, and `info` prints it back — while `full-stack.generator.ts` never
reads it. Fixing that means touching the wizard, the manifest and `info`, which
is beyond the scope this pass was given. Filed here.

### `--quiet` suppressed the one warning worth keeping — low

Of the five saga warnings, four survived `--quiet` and one did not:

```
⚠️  saga X.F: "Agent" steps are declared by EML but the Loco backend has
    no executor for them — this step will be skipped at run time.
```

That is the only one describing a *silent* failure. The others report something
the author can see is wrong; this one reports a step that will run, log nothing
useful, and do nothing. It was the only warning gated on `!quiet`.

**Fixed** — ungated, and `compile_sagas` no longer takes a `quiet` flag at all,
so the mistake cannot be made again. `--quiet` is for progress chatter.

---

## Verified working

### CLI

| Area | Result |
|---|---|
| `list`, `info`, `--version`, `--help` | correct; `info` matches the TypeScript CLI |
| Missing / absent / conflicting inputs | exit 1, message names the file and the fix |
| Unknown subcommand / flag | exit 2 (clap), usage shown |
| Empty file, no ERD block, an ERD block with no entities | all three: one clear error naming the file |
| `--dry-run` | writes nothing, creates no directory |
| Existing output without `--force` | refused, names `--force` |
| `--force` regeneration | byte-identical to the first run bar timestamps |
| Multi-file mode (`--bus-file`) | 114 files, same as `--input` |
| `--name` default | output directory basename → `my-app` → crate `my_app` |
| `--port` / `--frontend-port` | reach `config/development.yaml` and the CORS origin |
| Saga diagnostics | unknown step type, missing required property, entity not in model, empty process — all reported with workflow and node id |

### The generated application

Built from the Rust CLI alone, `loco new` scaffold path included.

| Step | Result |
|---|---|
| `cargo build` | clean |
| `cargo loco db migrate` | 9 migrations applied |
| `cargo loco db seed` | 17 `sys_table`, 24 `sys_window`, 141 `sys_field`, 1 workflow, admin created |
| `cargo test --test app` | **247 / 247** on a dropped-and-recreated schema |
| Auth boundary | `sys` reads open (navigation before login), `bus` and the rest 401 |
| Login | `admin@admin.com` / `admin`, JWT returned |
| Bus CRUD | create 200 → get 200 → patch 200 (`version` 1→2) → delete 204 (soft, `deleted_at` set) |
| Validation | unknown column → `400 Unknown field 'description'` |
| Bad ids | malformed UUID → 400, unknown UUID → 404 |
| Audit | 3 entries for the round trip; `/api/audit/verify` → `{"verified":true,"entries_checked":3}` |
| Model-managed guard | PATCH and DELETE of the model saga refused with a message naming the `kind: saga` section |
| Routing | `/api/workflow/definitions` correctly 400s — it matches `/{id}` and says `Cannot parse 'id' with value 'definitions'` |

### Controller-wide auth audit

Swept every controller template, not just the one that failed:

| Controller | Handlers | Guarded | Verdict |
|---|---|---|---|
| `bus.rs` | 8 | 8 | correct |
| `rules.rs` | 8 | 8 | correct |
| `audit.rs` | 4 | 4 | correct |
| `workflow.rs` | 7 | 0 → **7** | **was the bug** |
| `sys.rs` | 14 | 5 | correct — the 5 are exactly the writes (`create`, `update`, `remove`, `fields_batch_reorder`, `categories_unassign`); reads are open by design |
| `auth.rs` | 6 | 2 | correct — login, register and refresh cannot require a token |
| `me.rs` | 3 | 2 | correct — `/health` is open |
| `electric.rs` | 1 | 0 | correct — allowlists 5 `sys_*` tables, drops any client `where`, validates `role` against `[A-Za-z0-9_-]` |

---

## Open items

- **`--db sqlite` in the TypeScript CLI** still accepts a value it cannot honour, and advertises it in an interactive wizard. See above.
- **`cargo loco db seed` logs `WARN … seed: from=src/fixtures`** on every run. `src/fixtures` is deliberately pruned by `pruneScaffold`, so Loco's own fixture seeder finds nothing and says so. Harmless, but it is a warning on a healthy path.
- **The `==>` saga quirk** from the previous pass is unchanged and still pinned by its test: a line reaches edge parsing only if it contains `--`, so a flowchart drawn entirely with thick arrows produces no step order and no diagnostic. The fix belongs in `language/sagas.ts` so both generators pick it up together.
- **Three pre-existing `bun run type-check` errors** and **three pre-existing clippy warnings** (`category.rs`, `model.rs`, `templates.rs`), all present on `main` and untouched here.
