# QA — optimistic locking, across the whole system

**Date:** 2026-10-08
**Question:** PR #9 put optimistic locking into the generated application. Is
the same rule true everywhere a model is read or an application is produced?

That covers the generator templates, both generator CLIs, the `eml` CLI and the
application it generates, the reporting platform's code target, the documents
and tools that describe a model, the chat, and every copy in this repository.

**Answer before this work:** no. The generated Loco application guarded saves.
The following did not:

- delete;
- the `eml` CLI's default stack;
- the reporting target;
- the modelling tool's own readers of a model.

## What was found, and what changed

| Where | Found | Now |
|---|---|---|
| Generated backend — `DELETE /api/bus/{entity}/{id}` | Ignored `If-Match` and the record's state. A person holding an old copy could delete a record somebody had changed since, or one in a final state — undoing a completed transaction | `soft_delete` takes the same `WriteGuard` as `update`, with both conditions inside the one statement: a stale version is **409 `VERSION_CONFLICT`**, no version is **428** on an optimistic table, a final record is **409 `RECORD_FINAL`** for every caller, `If-Match: *` included. A workflow's `DeleteEntity` step writes as the system |
| Generated screen — delete | Sent no version | Sends the version it read. A refusal opens the conflict dialog (`action="delete"`: what changed since, *Refresh to latest*, *Delete it anyway*) |
| Generated screen — a record in a final state | Offered **Edit**, opening a form every save of which the API refuses | Edit is disabled with the reason; the record's own read (`transactionStatus.isFinal`) decides, as the state bar does |
| Generated front end — `useUpdateEntity`, `useDeleteEntity` | Unused hooks that wrote without a version | Removed |
| Generated front end — `workflow-state-bar.tsx` | A type error (`unknown` passed where a record was expected) in every generated front end | Typed |
| `eml` CLI — the `node-rest` stack, its **default** | No versions at all: every save and delete overwrote blind, and a final record could be changed | `runtime/src/concurrency.js`: versions, `ETag`, `If-Match`, 409/428 with the Loco backend's response body field for field, `PATCH`, closed final states, and OpenAPI that documents all of it. A store written before versions is backfilled |
| `eml` CLI — state machines | Assumed every machine drives `status`. The CRM's Opportunity keeps its lifecycle in `stage`, so its machine guarded nothing | The column is resolved as the generator resolves it (`status`, `state`, `stage`, else `workflow_status`) |
| `eml` CLI — `info` | Said nothing about either | Lists `last-write-wins` entities and each machine's closed final states |
| Reporting platform's `enterprise-reporting` target | No version column, unconditional `UPDATE`/`DELETE`, and a detail page that sent every column back. It also did not compile: date columns were typed `Date` while the input schema sends strings | `version` in the migration and types. Update and delete make the version and the final-state test conditions of the write and return a refusal, not throw it. The detail page sends the version it read and offers refresh or overwrite. Dates are typed `ColumnType<Date, Date \| string, …>`. The server functions now type-check **with zero errors** inside the platform |
| Both generator CLIs | Entity listings silent on concurrency | `appwithai` and `appwithai-gen` both print `, last-write-wins` beside such an entity, identically |
| `.appwithai.json` | Did not record it | `lastWriteWins` and `finalStates`; `appwithai info <dir>` prints them |
| The generated manual | Silent | Each entity says what happens when two people edit it; each lifecycle says a final state refuses every change and deletion |
| Model graph (Apache AGE) and the modelling tool's diagram | Silent | `concurrency` on every Entity node; the diagram tags a `last-write-wins` entity |
| Chat — the per-application skill and `updating-records-and-conflicts` | Covered saves only | Covers deletes, names the `last-write-wins` record types, and states that a final record is not deleted |
| Language, spec, README, the four protocol documents, `CLAUDE.md` | Described saves only | Describe update **and** delete |
| Generated backend — a status move from a stale read | `require_transition` judged the move against the record as it stood when the server read it, not as the caller read it. Two people who both opened a lead in `new` and moved it at once could both land: the second request's own read saw the first's `working`, and `working → disqualified` is drawn. Or it got **400** "that move does not exist" for a move that was legal from the state the caller saw. The test drove both writers with `If-Match: *`, so it passed or failed by scheduling | `require_transition` takes the caller's version. When the row has moved on since, it does not judge the move; the write's own version condition refuses it as **409**, with the record as it stands. The test sends the version both writers read and requires exactly `[200, 409]` |
| `.gitignore` | `*.test.ts` kept the chat's own unit, security and end-to-end suites out of every commit — in the root and the copy — while they ran and passed locally | Excepted |

## Evidence

**Generated CRM backend** (`language/yaml/examples/crm.eml.yaml`, Loco 1.2),
after merging `main` at `9260fd51` (the accounts API and the domain-library fix):

- `cargo clippy --all-targets -- -D warnings`: clean.
- `LOCO_ENV=test cargo test --test app`: **349 / 349**. The concurrency
  suite alone was then run **8 times in a row** green: before the race fix it
  failed on 3 of 4 runs. It includes four new delete cases:
  - a stale delete is refused with the record as it stands, and the reported
    version deletes it;
  - no version is 428;
  - a `last-write-wins` entity deletes without one;
  - a final record is not deleted with its version or with `*`.

**Bun suites against the running backend:**

- `12-optimistic-lock`: **5 / 5**, including the delete cases.
- The 17 `03-crud.*` suites: **15 / 15** each.

**Generated front end:** `tsc --noEmit` exits 0.

**The `eml` CLI's Node REST app:** a new generator test generates the CRM,
starts it as a process and drives it over HTTP. It passes **5 / 5**. The
reporting copy's runtime passes the same probe under plain `node`.

**Browser** (Chromium, the generated CRM's own screens; screenshots in
`screenshots/2026-10-08-locking/`):

| Shot | Shows |
|---|---|
| `01` | an account open in edit mode |
| `02` | the delete confirmation |
| `03` | another user saved first: the delete is refused, naming who changed it, when, and which fields; the record is still there (GET 200) |
| `04` | *Delete it anyway* sends `If-Match: "v2"`; the record is gone (404) and the screen is back on the list |
| `06` | a closed opportunity: Edit is disabled and says why; a direct `DELETE` is 409 `RECORD_FINAL` and the record remains |

**Repository gates:**

| Check | Result |
|---|---|
| `type-check`, `type-check:language` | pass |
| `test:generator` | 914 / 914 |
| `test` | 1,307 passed, 8 skipped (Postgres-only) |
| `cargo test -p appwithai-gen` | 156 / 156 (root and copy) |
| `cargo clippy -p appwithai-gen --all-targets -D warnings` | clean (root and copy) |
| WebAssembly clippy | clean |
| `cargo fmt --check` | clean |
| `bun run parity` | 10 models byte-identical across TypeScript, Rust and WebAssembly; 7 CEDM lowerings agree |
| `check-yaml-only.sh` | no traces |
| `build:language-tools --check`, `check:language-bundle` | up to date; the browser reads every model as the CLI does |
| Site bundles `--check` | up to date |
| Website: `website-e2e` | 150 / 150 |
| Website: `check-spec` | exit 0 |
| Website: page-carried validators | round-trip |
| Website: standalone checker | up to date |
| 47 domain applications | regenerated; 8,366 timestamp-only changes reverted |

## Not changed, and why

- **6,487 generated test files under `generated-applications/` are not
  committed.** The same `*.test.ts` rule keeps each application's bun suites,
  `12-optimistic-lock` included, out of the repository. They are generated
  source, and committing them is a decision about the repository's size (12 MB),
  so it is left to the owner. The Rust request suites, `concurrency.rs`
  included, are committed.
- **The reporting target's list and detail routes** do not type-check until
  they are copied into the platform's route tree, because their paths are not
  in its generated `routeTree.gen.ts`. That was true before this change.
- **The live DeepSeek model was not run:** no key in this environment.
