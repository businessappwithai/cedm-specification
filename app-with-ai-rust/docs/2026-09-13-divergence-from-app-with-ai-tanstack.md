# Where this repository had fallen behind `app-with-ai-tanstack`

**Date:** 2026-09-13
**Scope:** every functional difference found between `businessappwithai/app-with-ai-rust`
and `businessappwithai/app-with-ai-tanstack@main`, what was closed, and what was
deliberately left.

The two repositories are the same product on two backends. They share no git
history — the Rust one was started fresh — so nothing could be diffed by commit;
this was a content comparison, directory by directory, of the parts that are
supposed to be the same.

**The architecture was not touched.** Everything below lands inside the existing
Loco.rs + Astryx shape: the backend is still a cargo crate, the frontend and the
`tests/` suite are still bun's, `cargo` still owns `backend/`, and the two
generators are still held byte-identical by `bun run parity`. Nothing was ported
from the NestJS stack as a stack; where the sibling's fix assumed NestJS, the
*behaviour* was reimplemented against this runtime's own vocabulary.

---

## 1. What was found, in one table

| # | Area | Symptom in a generated application | Status |
|---|---|---|---|
| 1 | Shared language contract had drifted 1,600 lines | The checker here accepted models the sibling refuses | **Closed** |
| 2 | `reports` directive absent | A model carrying reports could not be validated here at all | **Closed** |
| 3 | EML151–154 diagnostics absent | Missing and self-restating help text went unreported | **Closed** |
| 4 | Four copies of `snakeCase`, three of `formatDisplayName` | `KYCRecord` → table `bus_k_y_c_record`, label `Kyc Record` | **Closed** |
| 5 | Foreign keys labelled by the column, not the target | `kyc_record_id` read `Kyc Record Id` over a cell showing a record | **Closed** |
| 6 | `email` / `phone` / `website` columns read as plain text | No email input, no keyboard hint, no validation | **Closed** |
| 7 | `Relationship.foreignKey` derived from the wrong end | `A ||--o{ B` reported `b_id` — the table it sits on | **Closed** |
| 8 | `hooks` matched anywhere in a line | Prose mentioning a hook compiled into a real one | **Closed** |
| 9 | `validation-error` never became `prevent` | **A rule written to refuse a write let every write through** | **Closed** |
| 10 | `transform` action had no payload column and no runtime arm | One of EML's three action types was inert | **Closed** |
| 11 | `sys_column.description` never written | The dictionary's column screen was blank for every column | **Closed** |
| 12 | `sys_field.help` composed only from the column's shape | The form restated the column name instead of the author's sentence | **Closed** |
| 13 | the model's `description` parsed and dropped | The manual opened on a record count, not on what the app is for | **Closed** |
| 14 | The test factory invented a status vocabulary | Records seeded outside the model's own `enums`, in states no machine draws | **Closed** |
| 14b | No business-data seed task in the generated backend | `cargo loco db seed` leaves the business tables empty | **Closed** |
| 15 | No CSV export from list grids | A reader who wanted the rows in a spreadsheet had the API and a uuid | **Closed** |
| 16 | No `sys_system` configuration table | Changing the AI endpoint or the app's name meant editing YAML on the host and restarting | **Closed** |
| 17 | No log specification (`packages/core/src/logging/`) | 406 `console.*` calls and 32 `tracing::` calls, each inventing its own level and wording | **Closed** |

Items 9 and 10 are the ones worth reading twice: they are silent failures of the
rules engine, and no test in either repository could see them, because the
compiler was perfectly self-consistent and every generated suite authenticates
as the master-role administrator.

Item 14 changed shape once the code was read. The sibling's fix is to its SQL
seed helper (`seedValue`); this repository has no such seed, because sample
records are created by the generated `tests/` suite over HTTP instead. The same
defect was there in that idiom, and is closed in §2.5b.

**All eighteen are closed**, and a nineteenth has since appeared — see §6. The last three — 14b, 16 and 17 — were held back in
the first pass as feature-sized changes rather than ports, and §4 is now the
record of what each actually demanded. In all three the sibling's own
implementation was the wrong thing to copy: its seed disables referential
integrity, its configuration table has no layer beneath it to fall through to,
and its generated logger is Pino behind a NestJS `LoggerService` where this one
is a Rust crate on `tracing`. The one item those three left open — the generated
application's per-request HTTP log — is closed too, and §4 records what
measuring it first changed about the answer.

The sibling has not stood still. Two commits landed there after this report was
written — #131 and #132 — and between them they moved `reports` from a
directive this repository only validates to one it compiles. §6 is that round.

---

## 2. What was implemented

### 2.1 The shared language contract (`language/`, `website/llmtext/`)

`CLAUDE.md` states these are byte-identical to `app-with-ai-tanstack@main`. They
had drifted by roughly 1,600 lines. Restored byte for byte, which brings:

- **`reports`** — a question the application's users actually ask, written into
  the model as the SQL that answers it. Parsed into `model.reports`
  (`language/cli/src/parser.ts`) and held to its shape by the checker
  (EML290–EML296: a query that exists, selects rather than writes, names both
  axes when it asks for a chart, and names an entity the model declares).
  Nothing here compiles it — it is compiled in
  `app-and-report-with-ai-tanstack` — so a model carrying reports generates the
  same application it would without them, and a malformed one is still refused.
  `language/yaml/examples/crm.eml.yaml` now carries 33 of them, which is what puts the
  directive in front of the parity gate.
- **EML151–EML153** — help text, and the two ways a model has none: no `help:`
  at all, and `help:` that restates its own name (`Unique identifier for X`,
  `Status for Client`). Coverage that reads as complete while saying nothing is
  the failure these name.
- **EML149 / EML150** — an entity shaped like a line item that never declares
  `parent:`, and a child also named in a `categories`. EML148's link resolver is
  now shared with EML149, so a parent the checker suggests is one it will then
  accept.
- **EML154** — a `categories` with no `name:`. `category.parser.ts` requires one
  and skips the line without it, so the whole grouping was lost silently and its
  entities fell into the default General category.
- **an attribute's `help` → `attribute.description`** in the CLI parser.

Verified with `bun run type-check:language`, the checker over every example
model and `examples/drug-discovery.eml.yaml` (0 errors), and
`cargo test -p appwithai-gen language` — the Rust loader still reads the shipped
definition rather than falling back to its built-in vocabulary, which is the
failure mode `CLAUDE.md` warns about.

### 2.2 One derivation per identifier

Four copies of "snake-case an identifier" and three of "title-case a name for
the screen" had grown up here, and they disagreed on any entity whose name
begins with an acronym — `KYCRecord`, `CAPA`, `SIPInstruction`,
`FATCADeclaration`.

Nothing failed, which is the whole problem: an application was generated with a
table called `bus_k_y_c_record` while the checker, the manual and the model
author all called it `bus_kyc_record`. The only symptom is a query naming a
relation that does not exist, a long way from its cause.

- `snakeCase` splits a run of capitals before its *last* letter, and collapses a
  doubled underscore (a project called "Drug Discovery Live" named its database
  `drug__discovery__live`).
- the ERD parser and `dictionary-help.ts` each had their own copy and call
  core's now. The help composer's was the quiet one: its stem for `KYCRecord`
  was `kycrecord`, which never matched the `kyc_record` a `kyc_record_id` column
  strips to, so every lookup onto such an entity was unresolvable and its field
  help fell back to "The kyc record of this KYC Verification".
- `formatDisplayName` keeps an acronym rather than re-casing it per letter.
- `attributeDisplayName` labels a resolved foreign key by the entity it points
  at, resolved against the model's declared names: `kyc_record_id` reads
  `KYC Record`, not `Kyc Record Id`.
- `referenceFromColumnName` reads an address, a number or a link out of a
  column's name, for the model that writes `string email` rather than
  `email email`. Guarded to string/text, because `boolean email_opt_out` is a
  checkbox.
- `generateForeignKey` names the column after the *one* side of a `oneToMany`.

Every one is mirrored in `crates/appwithai-gen` (`naming.rs`, `bus.rs`,
`model.rs`, and the call sites in `context.rs`, `dictionary.rs`,
`dictionary_help.rs`).

### 2.3 The `hooks` parser is anchored

`compileHooks` matched `hooks` anywhere in a line, so a plain `%%` comment that
merely mentioned a hook was compiled as a declaration — a handler module and a
registered lifecycle binding nobody declared, with no warning. The shipped
example models all carry prose headers shaped exactly like it.

Anchored at the start of the line, allowing the doubled comment marker older
generated flowcharts emitted and a leading indent, because both are real and
neither is prose. Mirrored in `crates/appwithai-gen/src/hooks.rs`.

### 2.4 A model-declared rule reaches the runtime that has to act on it

EML ships three a rule's `actions` types and two of them did nothing here.

**`validation-error` never became `prevent`.** `promotion.rs` checks for
`prevent` before any side effect runs; a compiled `validation-error` row
matched, was handed to `run_action`, fell through the `other` arm and was logged
as an unknown action. So `rule action refuseDiscount validation-error when:
discount_percent > 40` let every write through, and said so only in a
`tracing::warn!`. Every refusal in `crm`, `dance-studio` and any model using the
directive was inert.

**`transform` had nowhere to land.** The compiler emitted no payload column, so
`JdmViolation.transform_data` — which the runtime already deserialises and
`to_action_config` already forwards — arrived empty; and `run_action` had no arm
for it. Both ends exist now: the compiler folds `field:` and `value:` into one
`transformData` object, and `PromotionService::transform` writes those columns
onto the row that fired the rule, resolving `${field}` placeholders against it
the way a cascade does.

Two details of the transform are deliberate:

- The columns it wrote come back through `PromotionOutcome.transformed` and are
  merged into the create/update response, because the body is built from the row
  as it was *sent* and returning one that contradicts the record just written is
  worse than not transforming at all.
- `id`, `doc_status` and the audit timestamps are refused: `doc_status` is what
  `finalize` settles two lines later, so a transform onto it would be
  overwritten every time and read as a rule that does nothing.

**This is where the sibling's fix was not copied.** `app-with-ai-tanstack` drops
`targetEntity` / `linkField` / `updateData` / `createData` and carries
`field` / `value` instead, because its NestJS runtime implements a different set
of actions. Those four columns stay here — `cascade-update` and `create-record`
are actions this runtime *does* implement — and `transformData` was added beside
them. The compiled row is asserted against the literal strings
`services/promotion.rs` matches on, never against the compiler's own output.

### 2.5c Every list grid downloads as CSV

`frontend/src/lib/csv.ts` and a button on `DynamicTable`. The rows are fetched
rather than read off the screen — `data` holds one page and the point of an
export is the list — and cells go through the grid's own formatter and lookup
map, so a date, an enum-bound column and a referenced record read in the file
exactly as they read on screen.

Two of its rules are security-adjacent rather than cosmetic. RFC 4180 quoting,
because a field holding a newline and no quotes silently becomes two rows — an
export that looks fine and imports wrong. And formula defusing: Excel,
LibreOffice and Sheets all execute a cell opening with `=`, `+`, `-` or `@`, so
a record someone named `=HYPERLINK(...)` runs on open. A negative number is left
alone; the minus sign is arithmetic.

Frontend-only, and outside the parity gate by the same rule as §2.5b.

### 2.5b The test factory builds from the model's vocabulary

The sibling's `seedValue` wrote its own words — "Active", "Pending" — into every
status column, contradicting the application's own dictionary. This repository
creates its sample records a different way, so the fix is in a different file
and the mechanism is worth stating: `tests/harness/factory.ts` invented
`active`, `pending`, `closed`, `draft` for any column matching
`/status|state$/`, and no model declares those words.

`enums` is a closed list the application enforces — `sys_ref_list`, a dropdown,
and an API that refuses anything outside it — so the guess was invalid rather
than merely unrealistic. On `dance-studio`, three of the four words the factory
could produce are values `MemberStatus` does not contain.

`model.ts` had carried the declared values all along; nothing mapped a *column*
to its enum, so the factory could not have looked one up. `FieldMeta` carries
`enumReferenceId` now and `fakeValue` resolves it against `modelEnums` ahead of
every heuristic. Where the entity has a state machine, `buildRecord` writes the
machine's `initial` state instead: an arbitrary pick from the enum is valid for
the dropdown and wrong for the lifecycle, and only `[*] --> x` is both.

TypeScript only, and deliberately — `crates/appwithai-gen` does not emit
`tests/`, and the parity gate compares `backend/` alone.

### 2.5 The model's own help text reaches the application

entity and attribute `help` are the only place a model says what
something is *for*, and the parser has hung both on the entity and the attribute
since the directives were read. Only one landed.

- `sys_column.description` was never written. The column is in the DDL and the
  value was in hand.
- `sys_field.help` — what the generated form renders under the control — was
  composed entirely from the column's shape. A model with a paragraph on every
  column produced an application saying "The Member of this Booking. Required —
  the record cannot be saved while this is empty." over a column the author had
  described in a sentence about the studio's insurance.

The author's words come first and the derived *sentence* gives way to them; the
derived *facts* still follow, because "required", "must be unique" and a length
limit are things the author's sentence does not carry.

In the manual: `formatDisplayName` from core rather than a third local copy, FK
targets resolved against the declared names, and **the model's `description` read
into `ParsedModel` and rendered as the overview** — it was parsed by the checker
and dropped by the pipeline, so a model that said what the application was for
produced a manual opening on a count of record types. It is deliberately kept
separate from `--description`, which names the generated *project*, reaches the
backend templates, and is what the parity gate compares.

---

## 3. What this repository has that the sibling does not

Recorded so a future sync does not "restore" these away. Every one is a
deliberate improvement made here and absent from `app-with-ai-tanstack@main`:

| Here | The sibling |
|---|---|
| `isForeignKeyColumnName` accepts `personRoleColumns` (`assigned_to`, `remediation_owner`, `created_by_user`) | `_id` / `_by` only — so `string assigned_to FK` is stamped `String` and renders a raw-UUID text box |
| `identifierColumnNames` checks a `text` column before the join-entity rule | Labels a DeviationReport "Experiment 14 / Priya" instead of by its own content |
| A unique column gets no extra conventional index (the DDL's own `UNIQUE` already has one) | Two unique indexes on every unique column, paid for on every write |
| `BusEntity.attributes` narrowed to `BusEntityAttribute[]` | Callers cast |
| `packages/generator/src/graph/` — the model graph in Apache AGE | An embedding index over prose about the model |
| `rbac` compiles demonstration accounts, one per declared role, with argon2 digests | — |
| `resolve_ref_table_name` strips a `parent_` qualifier prefix | No hierarchical self-reference in its corpus, so it never needed the rule |
| Workflow controller is JWT-guarded | Shipped unauthenticated once |
| `bun run parity` — two generators diffed byte for byte over a corpus | Single generator |

---

## 4. The three that were closed last, and what each cost

These were left out of the first pass as feature-sized changes against the
Loco/Astryx architecture rather than ports. Each got its own pass; what follows
is what the architecture actually demanded, because in all three cases the
sibling's own implementation was the wrong thing to copy.

**`sys_system` (§1 item 16).** The table itself is the easy half. The point of
it is that an operator can change a setting without a redeploy, and this
application already had a configuration surface — Loco's `settings` block,
resolved from the environment at boot — so the table had to sit *above* that
rather than beside it. `services::system_config` resolves DB row (active,
non-empty) → settings block → compiled default, which makes a row an override
and its absence a no-op.

Two decisions are load-bearing. The keys are the settings block's own names, so
there is no translation table and an operator reading `config/development.yaml`
beside the admin screen sees the same word in both. And a write to
`/api/sys/system` invalidates the config cache: a setting that saves and does
not take effect until the process restarts is no better than the file it
replaced, and it is the one failure this table exists to prevent — so it has a
request test of its own.

Rows are served by the existing generic `/api/sys/{segment}` route rather than a
controller: it is a `sys_*` table with a name, an id and rows to edit, which is
what that route already does, and a bespoke endpoint would need its own paging,
filtering and OpenAPI entry to arrive in the same place.

**The business-data seed (§1 item 14b).** This section previously recorded that
closing it "would have to reproduce the constraint-awareness the HTTP path gets
for free". That turned out to be the whole design. The sibling's seed opens with
`SET session_replication_role = replica` and inserts in any order; this one
sorts the entities so a row is written after everything it points at and leaves
referential integrity switched **on**, so a seed that got the order wrong fails
loudly instead of filling the tables with references to nothing.

Every value is the model's own: a `enums` column takes a declared value, a
status column backing a state machine takes the machine's initial state, and a
foreign key takes the id of a row the same file inserted. The state-machine rule
beats the enum deliberately — a record seeded into a state the diagram never
drew is one no guard will move, so the workflow the application was generated to
demonstrate would be dead on exactly the rows meant to demonstrate it.

Two smaller judgements. A column whose target the model does not declare is
written NULL, because a uuid that joins to nothing renders as a broken lookup
and reads as a data problem rather than a modelling one. And an optional date or
timestamp is left empty: it almost always records that something happened, so
filling it puts the row in two states at once — a booking in `held` carrying a
cancellation time contradicts itself.

**The log specification (§1 item 17).** Both halves landed, and they are not the
same artefact.

The architecture-neutral half ports unchanged: `spec.ts` validates the catalogue
on load, `logger.ts` is Pino configured entirely from it, and a call site names
an event id rather than a level and a sentence. The catalogue is this
repository's own — five channels and sixteen events on the `generator` surface,
every one of them emitted here. The conformance test keeps it honest in both
directions and found two problems on its first run.

The generated half is where the sibling could not be copied. Its generated
application is Pino behind a NestJS `LoggerService`; this one is a Rust crate on
Loco's own `tracing` subscriber, and a JSON catalogue a crate would parse at
startup to say what `tracing` already says is a translation layer, not a shared
contract. So the catalogue is *derived into Rust at generation time* — not
written as a template, because a template is a second copy — and comes out as
one `log_event!` macro. The level has to be resolved during generation because
`tracing`'s macros take it as a literal, which is precisely why this is
generated rather than looked up.

All 32 of the generated backend's `tracing::` call sites now name events. The
compiler covers one direction (an unknown arm does not compile), and
`generated-events.test.ts` covers the two it cannot: a template naming an event
the spec does not declare — which otherwise costs a generate and a three-minute
`cargo check` to discover, in a project rather than in this repository — and a
template still writing its own level and sentence, which compiles perfectly and
is simply absent from the catalogue.

### The request log, and what measuring it turned up

This section previously recorded the per-request HTTP log as open, on the
assumption that "Loco's own middleware already logs" it and the work was
deciding whether to replace or wrap that middleware. Measuring it first changed
the answer.

Loco's `TraceLayer` opens an `http-request` **span**. A span is not an event: it
decorates whatever is emitted inside it and records nothing itself, and
`tower-http`'s own completion event is `DEBUG`, which `config/production.yaml`
filters out at `info`. Driven against a running generated application at
production's level, five requests — a 200, a 200 with a query string, a 401 from
the JWT extractor, a 401 from the login route and a 404 — produced **seven lines,
not one of which said a request had been served**. Five were SQL statements and
two were an error. There was no way to answer what the application served, or
how fast, from its production logs.

So this is a new line rather than a replacement: `common::http_log` is a layer
around the whole router, emitting `request.completed`, `request.refused` or
`request.failed` by status class, with the method, path, status, duration and
request id.

Four things about it are deliberate.

**It wraps the router, not a handler.** A 401 from the JWT extractor, a 403 from
`authz` and a 404 for a route that does not exist are all produced below this
layer, so all three are seen. This is the same lesson the NestJS sibling records
for its own logger — a Fastify `onResponse` hook and never a Nest interceptor,
because an interceptor runs after the guards and sees no refusal at all.

**The path is recorded without the query string.** `?search=…` is full of field
values, and the specification's rule is that a value never reaches a log line.
The path answers what was served; the filters are the caller's business.

**The request id is read on the way out as well as on the way in.** This layer is
outermost, and Loco's id middleware sits beneath it — so the extension it inserts
is invisible here and the id is only reachable as the `x-request-id` header on
the response. Reading both keeps the line correct if that order ever reverses,
which is exactly when a silently empty id would be hardest to notice. An
unmatched route genuinely has no id, and the line says `none` rather than
inventing one.

**`sqlx::query` is turned down to `warn` in production.** Loco's default filter
whitelists it at the configured level, which is what made SQL five of those seven
lines. Without this the new request line would be true and unreadable. `warn`
rather than `off`, because a failing query is worth a line; and `RUST_LOG` still
overrides the lot, so an operator can turn any of it back on without a redeploy.

A generation into a fresh directory also failed on the first run, which is worth
recording because the manual runs did not catch it: `RENDERED_FILES` writes into
`src/common` before the writer that created that directory ran, and every manual
regeneration passed only because the directory was already there from the run
before. `src/common` is in `DIRECTORIES` now, in both generators.

## 5. How this was verified

Every commit on this branch was held to the gates `CLAUDE.md` names as the ones
that work. `bun run lint` is not among them — it reports thousands of findings on
a clean checkout — so the files touched here were checked individually with
`biome check --diagnostic-level=error` and are clean; the findings that remain
under `packages/generator/src/generators` are in files this branch never opened.

| Gate | Result |
|---|---|
| `bun run type-check` | clean |
| `bun run type-check:language` | clean |
| `bun run test` | 1007 passed |
| `bun run test:generator` | 637 passed |
| `cargo test -p appwithai-gen` | 155 passed |
| `cargo fmt --check -p appwithai-gen` | clean |
| `cargo clippy -p appwithai-gen --all-targets -- -D warnings` | clean |
| `bun run parity` | 3 models, backends byte-identical |
| Generated backend (`drug-discovery`) | `cargo clippy --all-targets -- -D warnings` clean, and its own request suite passes **311** against real Postgres |

`cargo fmt --check` is in that list because leaving it out cost a CI cycle: the
three new Rust modules were clippy-clean and tested, and unformatted.

Beyond the gates, each change was confirmed on disk in a generated application
rather than only in a test:

- A model built around `KYCRecord` produces `bus_kyc_record`, a `sys_column.name`
  of `KYC Record` on the lookup, reference 30 on `contact_email` and 24 on
  `website`, a manual reading "Points at **KYC Record**" and opening on the
  model's own description — and both generators agree on the whole backend.
- `crm`'s `refuseDiscount` compiles to `'prevent'` where it compiled to
  `'validation-error'`.
- On a fresh `dance-studio` database, `cargo loco db seed` applies
  `seed/business.sql` with referential integrity switched on. Every seeded
  Member status is a value the dictionary's own dropdown offers; every Booking
  sits in `held`, which has four declared outgoing edges. On `drug-discovery`
  all 17 entities carry rows, 15 real foreign-key constraints are satisfied, and
  `parent_sample_id` resolves to a real Sample rather than to a table nothing
  declares.
- A real `appwithai generate` run writes no JSON at all by default and, with
  `LOG_LEVEL=info`, writes `pipeline.generation.started` and
  `pipeline.generation.completed` carrying the spec's own level, channel and
  message.
- A setting saved through `PATCH /api/sys/system` is visible to the very next
  request, with no restart between them.
- At production's log level a generated application now answers five probe
  requests with five request lines — `request.completed` for the two that
  succeeded, `request.refused` for the 401 the JWT extractor produced before any
  handler ran, for the login route's own 401 and for a 404 on a route that does
  not exist — each carrying the method, path, status, duration and request id,
  and none carrying the query string that was sent.
- `dance-studio`'s `sys_column.description` and `sys_field.help` both carry the
  author's sentence, with the derived "Required —" fact still following it.
- Driving `dance-studio`'s own emitted factory produces `held` for every Booking
  — its machine's initial state — and only `active|lapsed|suspended` for Member,
  with nothing outside the model's vocabulary. Its `tests/` workspace
  type-checks.

One note for whoever runs this next. `bun run generate` executes
`packages/generator/dist/cli/generate.js`, not `src/`, so a TypeScript change
does nothing until `bun --filter @appwithai/generator build`. That cost a
debugging cycle here: a hand comparison of the two generators appeared to show a
divergence that `bun run parity` — which builds both itself — did not.


---

## 6. The round after: `reports` stops being decorative

`reports` was the one directive with a split status. The checker here reads it,
holds it to its shape — EML290 to EML296 — and puts it in `model.reports`;
neither generator had a case for it, so a model carrying reports produced an
application with none, byte for byte the application it would have produced with
the directives deleted. The questions were declared, validated, and answered by
nothing.

The sibling closed that gap for its own stack (#131) and recorded it in the
shared definition (#132): `reports` now reads `"status": "compiled"`, and
`whereItIsCompiled` names a reader. Because `language/` is held byte-identical
rather than merged, copying it across made the contract describe something this
repository did not do — which is why the sync and this are two commits and not
one.

### What was built here, and where it differs from the sibling

The directive reader is a port: both products read one shared directive, so two
readings of it that disagreed would be worse than either. The rest is this
stack's own.

| Piece | Here | Sibling |
|---|---|---|
| Reader | `packages/generator/src/reports/index.ts`, mirrored by `crates/appwithai-gen/src/reports.rs` | one TypeScript copy |
| Storage | `sys_report` (m0015), seeded by `seed/reports.sql` | `sys_report` (018), seeded by `seeds/08_reports.ts` |
| Server | `controllers::report` — Loco/axum, `AssertSqlSafe`, JWT on every route | a NestJS service + controller |
| Gate | `tests/requests/reports.rs`, asserting against the model's declarations | its own suite |

Two decisions are worth stating.

**The reader is mirrored in Rust rather than shelled out to.** The parity gate
compares the two generators' backends byte for byte, so `seed/reports.sql` has
to come out identical from both — which means the directive reading, the
read-only refusal, the key scan that must not truncate a `help:` sentence, and
the UUIDv5 the row is keyed on all exist twice and are held together by that
gate rather than by inspection.

**`sql_text` is guarded three times, and the third is not redundant.** The
checker refuses a write at authoring time (EML293); the compiler refuses one
before it can reach a seed file; and the backend refuses one again before it
runs. `sys_report` is an ordinary table, so a later migration, a restored
backup, or anyone with database access can put a statement in that column — and
without the third check the handler would run it with the application's own
credentials. The refusal is not a keyword scan: `SELECT 1; DROP TABLE bus_user`
opens with a SELECT, so the check tracks quoting and rejects a statement
separator outside a literal, while allowing the single trailing semicolon most
people write and leaving a semicolon *inside* a literal alone. A row cap of
5,000 is applied as an outer `LIMIT` over the query as a subquery, so a model's
own `ORDER BY`, `LIMIT` or CTE still decides which rows, and the response says
when the cap bit.

The list route does not return `sql_text`. It feeds a menu, and handing the
query to the browser would put the application's schema in front of anyone who
can open the reports page.

### The corpus, and why it is `examples/` and not `language/`

A directive is only real once something reads it *and* a corpus model exercises
it — Handlebars strict mode is off in both engines, so an unregistered helper
renders as an empty string and the gate stays green. But the usual instruction,
"grow `language/yaml/examples/crm.eml.yaml`", cannot apply here: that file is inside
the byte-identical contract. Eight `reports` went into
`examples/drug-discovery.eml.yaml` instead, which this repository owns outright.
They are real questions against the real schema — compounds by registration
status, open deviations by severity, CAPAs past their resolution date,
instruments due for calibration, experiments by principal investigator,
chemicals low or expired, stability pulls not yet taken, vendor requests by
status — each excluding soft-deleted rows, because `deleted_at` is how this
schema retires a record.

### One thing found while porting

The sibling's reader carries two comments citing the checker's diagnostic codes,
and they are transposed: it credits EML292 with refusing a write and EML293 with
reporting a duplicate name, where `language/checker.ts` — the same file in both
repositories — has EML292 for the duplicate and EML293 for the read-only rule.
Nothing behaves differently; the comments are wrong, not the code. They are
corrected in this copy rather than carried across.

### How §6 was verified

The same gates, plus the one that matters most for a directive whose payload is
SQL: the generated application's own suite runs every query the model declared,
against the schema this generator produced.

| Gate | Result |
|---|---|
| `bun run type-check` / `type-check:language` | clean |
| `bun run test` | 1007 passed |
| `bun run test:generator` | 637 passed (22 new) |
| `cargo test -p appwithai-gen` | 155 passed (15 new) |
| `cargo fmt --check -p appwithai-gen`, `cargo clippy -p appwithai-gen --all-targets -- -D warnings` | clean |
| `bun run parity` | 3 models byte-identical, drug-discovery now carrying 8 reports |
| `language/checker.ts examples/drug-discovery.eml.yaml` | 0 errors, no EML29x diagnostic |
| Generated `drug-discovery` backend | clippy clean under `-D warnings`; request suite **311 passed** (was 304) |

`requests::reports::every_declared_report_actually_runs` is the one to keep. It
runs all eight of the model's queries over HTTP against the real tables, so a
report that parses and then fails against the schema — a renamed column, a join
written for another stack's types, a table the model never declared — is caught
here rather than by whoever opens the reports page. The other assertions cover
the guards: a planted `DELETE` and a planted `SELECT 1; DELETE …` are both
refused with 400, a planted `SELECT ';'` is not, and the list response never
carries `sql_text`.

One note for whoever runs this next. A first attempt at that suite reported
every test in the crate failing, which reads exactly like a broken migration. It
was `PoolTimedOut`: an earlier run of the same suite was still holding
connections. The generated app was fine. Check for a second `cargo test` before
reading a wall of failures as a schema problem.

---

## 7. A security round, and one finding that is this repository's own

The sibling ran a security audit across itself and the reporting platform
(`security-findings.md`, C1–C5 / H1–H5 / M1–M4) and closed four of them. Three
touch code a generated application ships, so each was checked here rather than
assumed:

| Their finding | Here |
|---|---|
| **H4** · the generated app logs the administrator password | **Does not apply.** `ensure_admin` never prints it, and already warns when the default password is in use |
| **C5** · role mass-assignment through Better Auth's `updateUser` | **Not through that door** — this stack has no Better Auth. Through a different one, and worse: see below |
| **M3** · the generated entity guard fails open on error | **Applies, in four places.** Closed |

### The one that was worse here

`/api/sys/{segment}` is the generic dictionary endpoint, and its segment list
includes `roles` (`sys_role`), `user-roles` (`sys_user_roles`), `access`
(`sys_access`) and `system` (`sys_system`). All five write handlers — `create`,
`update`, `remove`, `fields_batch_reorder`, `categories_unassign` — were guarded
by a bare `auth::JWT`. Any account that could sign in could write the
authorization model itself.

It was demonstrated against a running generated application rather than argued
from the source. An account that registered itself seconds earlier, holding no
roles and reporting `isMaster: false` with zero windows:

| Request | Result |
|---|---|
| `PATCH /api/sys/roles/{id}` `{"is_master_role": true}` | **200** — every holder of that role now bypasses all three gates |
| `POST /api/sys/user-roles` | **201** — a role grant, written by a caller who holds none |
| `PATCH /api/sys/system/{id}` `{"config_value": "https://…"}` | **200** — `ai_base_url` repointed, which is where `/api/ai/query` sends business data |

The second returned 400 on the first attempt, for a missing `created_by`. That
is a *validation* refusal, and mistaking it for an authorization one is exactly
how this survives a test: the suite that would have caught it signs in as the
master-role administrator, to whom an open endpoint and a closed one look the
same.

**The fix** is `authz::require_dictionary_admin`, on all five write handlers.
The bar is the master role, because that is the actor the dictionary screens
were written for and the only administrator this schema models; a finer grain
would need a permission the dictionary does not carry, and inventing one here
would be a second answer to the question `sys_access` already exists to ask.
Reads stay open — the generated frontend builds its navigation from the
dictionary before anyone signs in, so closing them would break the sign-in page.

Re-run against the patched application, the same three requests answer **403**,
an anonymous `GET /api/sys/tables` still answers **200**, and the administrator
can still write. `requests::rbac` carries both halves, and its probe is the
stronger case: it *holds* a role and a `sys_access` grant and is still refused,
because what it is asking for is not access to a table but the ability to
rewrite who has access to every table.

### M3, which does apply

Four sites in `services/authz.rs` turned a failed query into "no rows", and no
rows means allowed:

| Site | What a swallowed error did |
|---|---|
| `principal()` | Emptied the caller's role set — and quietly demoted a master-role administrator |
| `require_operation` | Disabled every `rbac` operation rule for that request |
| `require_transition`, status fields | Skipped the loop, making **every undrawn move legal** — and topology is the one gate with no master bypass |
| `require_transition`, role rules | Disabled the transition role rules |

Each carried a comment justifying the permissiveness, and the justification was
sound for the case it named: a database predating m0009 genuinely has no such
table, and "no rules means unrestricted" is what makes `rbac` additive. It was
applied to *every* error, though, which is a different thing — a timeout or a
dropped connection also produced "allowed". A restriction that disappears under
load is not a restriction.

So the genuine case is now separated from the rest: SQLSTATE `42P01`
(`undefined_table`) keeps the documented behaviour, and every other error is
refused. The sibling's own note applies unchanged — the "open unless closed"
default is a defensible design choice, and the *error* paths should not inherit
its reasoning.

### How this round was verified

| Gate | Result |
|---|---|
| `bun run type-check` | clean |
| `bun run test:generator` | 637 passed |
| `cargo test -p appwithai-gen` | 155 passed |
| `cargo fmt --check`, `cargo clippy -p appwithai-gen --all-targets -- -D warnings` | clean |
| `bun run parity` | 3 models, backends byte-identical |
| Generated `drug-discovery` backend | clippy clean under `-D warnings`; request suite **313 passed** (was 311) |
| The escalation itself | reproduced on a running application, then re-run against the patched one |

---

## 8. The contract moved again, and an entity's `icon` with it

Sixty commits landed on the sibling in four days. `language/` and
`website/llmtext/` are held byte-identical, so the whole set was copied across
— `appwithai-language.json`, `checker.ts`, `fixer.ts`, both browser entries, and
llmtext, which gained two files (`llmtextenhancement.txt`,
`llmdetailedenhancement.txt`). `diff -rq` against the sibling is clean, and both
readers accept it: `type-check:language` passes and
`language::tests::the_shipped_definition_loads_rather_than_falling_back` still
does.

The definition changed what it claims in one load-bearing way: an entity's `icon`
moved from "validated but not yet compiled" to compiled, into `sys_table.icon`
— "what the entity's dashboard card, its window heading and the navigation all
draw". `EML287` also arrived, and rides in with the checker.

So this is the same shape as `reports` in §6: copying the contract made it
describe something this repository did not do. The gap was smaller, though.
`sys_table.icon` and `sys_category.icon` **already exist here** — m0001 declares
`icon VARCHAR(100) DEFAULT 'Table'` — so nothing needed migrating. What was
missing was the read and the write: neither parser looked for the key, and
neither dictionary seed emitted the column.

Both now do, and one decision is worth recording.

**The icon is written only when the model declares one.** `BusEntity` already
carried an `icon`, filled by `getEntityIcon()` — a guess from the entity's name.
That guess deliberately stays out of the seed. Emitting it would mean a second
derivation for `crates/appwithai-gen` to mirror exactly, held together by
nothing but the parity gate; and the column already defaults to `'Table'`, so an
entity that declares nothing emits precisely the row it emitted before this key
was read. The column list widens only for rows that have something to put in it.

Eleven icons went into `examples/drug-discovery.eml.yaml` — the corpus this
repository owns, `language/examples/` being inside the contract. One of them is
the trap the definition names: lucide has `flask-conical` and no `flask`, so
Compound is drawn with the former. An unknown name is **not** a diagnostic —
neither checker carries lucide's catalogue — and renders a placeholder, which is
why the parsers take the value as written rather than validating it.

### How this round was verified

| Gate | Result |
|---|---|
| `diff -rq` on `language/` and `website/llmtext/` vs the sibling | identical |
| `bun run type-check` / `type-check:language` | clean |
| `bun run test` | 1011 passed |
| `bun run test:generator` | 641 passed (4 new) |
| `cargo test -p appwithai-gen` | 157 passed (2 new) |
| `cargo fmt --check`, `clippy --all-targets -- -D warnings` | clean |
| `bun run parity` | 3 models, backends byte-identical |
| Generated `drug-discovery` backend | clippy clean; request suite **313 passed** |

Parity agreeing proves only that the two generators agree, which they also would
if both emitted nothing — so the seed was read directly: 11 `sys_table` rows
carry the declared icon, and the other 6 keep the bare insert and the column's
default.

---

## 9. The dashboard offered every entity to everybody

The front page was the last thing the sibling had that this repository did not,
and reading the two side by side turned it from a layout difference into an
authorisation one.

Both repositories render the same screen: one block per `categories`, a card per
entity inside it, and the dictionary's own screens below. The difference is
where the list comes from. The sibling answers it from
`/sys/categories/dashboard`, a single statement that resolves the caller's roles
itself and returns only the entities that caller may read. This repository built
it from four calls — `/sys/tables?prefix=bus_`, `/sys/tables?entity_type=U`,
`/sys/categories/with-entities` and `/me/permissions` — and **the first three are
dictionary reads, which are deliberately open and identical for everybody.**

So every account was offered a card for every entity in the application, and the
three gates in `services/authz.rs` then answered 403 on the ones it did not
hold. Demonstrated against a running generated application rather than argued
from the source: an account registered seconds earlier, holding no roles, was
offered **17** entities in 7 categories by the dictionary read the dashboard used
— and `GET /api/bus/compound` answered it **403**.

That is the same defect `authz.rs` already documents, in the other direction.
Its header records that `sys_access` was once read only by the navigation, so
hiding a window hid the menu entry and left the endpoint open — *security by
menu*. This is the inverse: the endpoint is closed and the menu does not know,
so the application advertises seventeen doors and opens eight. A dashboard that
offers entities and refuses them cannot be told from a broken one.

### What was built

`GET /api/me/dashboard` answers the whole screen in one request, scoped to the
caller: the categories with the entities inside them, the admin windows it may
open, its role, its master flag.

It is on `/api/me` rather than on `/api/sys` where the sibling puts it. That is
not tidiness. `/api/sys` reads are open by design — the sign-in page builds its
navigation from the dictionary before anyone has a token — and a caller-scoped
read sitting in that namespace would be the one endpoint there that answers
differently per caller, which is exactly the trap that produced this defect.
`/api/me` is already the namespace whose contract is "what the signed-in caller
is allowed to see".

**The scope is the request guard's own, expressed over a set.**
`authz::readable_tables` applies the same two gates `require_read` applies —
`sys_access` through role → window → tab → table, then the `rbac` read rules
with their additive default — to a list of names rather than one name, because
asking per table would be two queries each: sixty round trips on a
seventeen-entity model, for a screen that renders on every sign-in.

That is a second statement of rules that already exist, and the honest thing is
to hold it rather than to assert it.
`rbac::the_dashboard_scope_agrees_with_the_request_guard` drives both paths over
every entity in the dictionary and fails on the first one they disagree about —
an entity offered on the dashboard and refused by the API, or held back and
served. It also refuses to pass by agreeing on nothing: the run asserts that at
least one entity was refused, because a probe that can read everything proves
only that the two agree when nothing is at stake.

Line items are the one deliberate difference and are excluded from the screen
rather than from the API. `parent: <Parent>` on the child entity gives the child no
window and puts its tab inside the parent's, so it is reached by opening a
parent record — the rule is read off `sys_tab.tab_level` rather than recomputed,
so this screen and the detail screen cannot disagree about what a line item is.

### The dictionary's own screens were half-missing

The admin cards came from a map in the frontend, keyed by window *name*, holding
an icon and a route. The dictionary declares **eight** admin windows; that map
knew five of them, and had four keys for windows that do not exist. A window it
did not know about was dropped by the `.filter(Boolean)` that followed — so
`User Administration`, `Role Administration` and `System Configuration` were
granted, routed, reachable by typing the URL, and absent from the screen that
exists to list them.

The route was already in the dictionary (`sys_window.description`, which
`/me/permissions` has always returned). The icon was not, so **m0016 adds
`sys_window.icon`** and the seed writes a lucide id per admin window —
`sys_table` and `sys_category` have carried one since m0001 and m0005, and this
is the third. The map is gone; a window with no route is still skipped, because
it has nowhere to go.

### One line of that map was load-bearing, and it hid a third defect

The map passed an imported React component as the icon for an admin card while
entity cards passed a name, so `Icon` accepted `any` and branched on the type.
Removing the map meant every icon is a dictionary name — which is when the name
lookup turned out not to work.

`ui/icon.tsx` resolved names against `import * as LucideIcons`, whose keys are
lucide's **PascalCase exports** (`FlaskConical`). Every name the dictionary holds
is lucide's own **kebab-case id** — `icon: flask-conical` on Compound is
what the language definition tells an author to write, and it is what the seed
stores. The lookup missed on all of them and fell through to the placeholder:
**the an entity's `icon` support added in §8 rendered nothing at all**, and a model
that named an icon looked exactly like one that named none.

The namespace import is also a barrel, which cannot be tree-shaken. Measured on
the generated drug-discovery frontend, built both ways:

| | Icon chunk the dashboard loads |
|---|---|
| `import * as LucideIcons` | **444,194 bytes** |
| `dynamicIconImports`, one lazy chunk per icon | **20,936 bytes** — all 26 distinct icons this dashboard names |

The normaliser accepts `LayoutGrid`, `layout_grid` and `layout-grid` alike,
because `categories` writes the first and `entities` the third and both arrive
in the same response. It returns a name that is already an id untouched — the
digit rule otherwise splits `grid-2x2` into `grid-2x-2`, breaking icons that
were correct on arrival.

**Measuring it found a fourth thing.** A generated app pins lucide 0.312, whose
`dynamicIconImports` lists 1401 ids, and those ids are not the current ones:
`triangle-alert` is `alert-triangle` in this release. The corpus model shipped
the later spelling, so `DeviationReport` was the one entity whose icon resolved
under neither the old lookup nor the new one. Corrected, and all eleven of the
model's icons now resolve against the pinned release.

### How this round was verified

| Gate | Result |
|---|---|
| `bun run type-check` / `type-check:language` | clean |
| `bun run test` | 1013 passed |
| `bun run test:generator` | 643 passed |
| `cargo test -p appwithai-gen` | 157 passed |
| `cargo fmt --check`, `clippy --all-targets -- -D warnings` | clean |
| `bun run parity` | 3 models, backends byte-identical |
| Generated `drug-discovery` backend | clippy clean; request suite **315 passed** (2 new) |
| Generated frontend | `vite build` succeeds; `tsc --noEmit` clean once the route tree exists |

Against a running generated application, three states of the same screen:

| Caller | Offered | `GET /api/bus/compound` |
|---|---|---|
| Registered seconds ago, no roles | 0 entities, 0 admin windows | 403 |
| `Lab Manager` | 17 entities in 7 groups | 200 |
| `Lab Manager`, with a read rule on `Compound` naming another role | **16** — Compound gone | **403** |
| `Administrator` under that same rule | 17 — master bypasses role rules | 200 |

Removing the rule put the card back. The administrator's response also carries
all **eight** admin windows with a route and an icon each, where the map the
frontend used to hold would have rendered five.

The generated frontend's type-check needs one caveat recorded, because it reads
like a failure: on a fresh generation `tsc --noEmit` reports 85 errors, 79 of
them `createFileRoute` on every route file. `routeTree.gen.ts` is written by the
Vite plugin, so it does not exist until something builds. Run `bun run build`
first; the count is then zero.

---

## 10. What the generated frontend costs per page

The last item the sibling had and this repository did not. Its own pass
(`Cut the generated frontend's per-page request and bundle cost`) found four
things; this stack shares the shape of two of them and none of the specifics,
so the pass was run here rather than ported.

**Method.** An application generated from `examples/drug-discovery.eml.yaml`,
built for production, served by `vite preview`, driven through headless
Chromium against the real backend. Each page is loaded in a **fresh context
with the cache disabled and a signed-in storage state**, so the numbers are
what a first visit to that URL actually costs. The first three attempts at this
measurement were wrong in instructive ways and are worth recording: reading
response bodies reports 0 bytes for anything the browser served from memory
cache, and navigating to a page *after* landing on another one measures only
the incremental chunks, because an SPA does not re-fetch its entry. Resource
Timing on a cold context is what gives the real figure.

### The entry chunk carried a PostgreSQL

`lib/electric.ts` imports `PGlite` — PostgreSQL compiled to WebAssembly — to
hold the dictionary locally for ElectricSQL sync. The import was at module
scope, `providers/index.tsx` mounts `ElectricProvider` at the root of every
page, and that provider imports values from `lib/electric`. So the package sat
in the shared entry chunk: **972,625 bytes raw, 229KB over the wire, on every
page of every generated application**.

`VITE_ELECTRIC_URL` is empty in the generated `.env.local`, and
`ELECTRIC_ENABLED` is `!!ELECTRIC_URL`. In a default deployment the flag is
false, `syncSysTablesForRole` returns a no-op before touching anything, and
`getDb` is never called. Every byte of it was downloaded to run nothing.

The import moved inside `getDb`, which is reached only after that flag has been
checked. An application with sync configured pays for PGlite when it first
syncs; one without never pays. The type import stays, because it is erased.

Unlike the sibling, there was no retry storm to fix here: `ELECTRIC_ENABLED`
short-circuits before any shape request, so a default application makes none —
its `.env` also names the variable the code actually reads, which was the other
half of the sibling's first finding.

### Three hooks asked the same question once per entity

`/sys/tables` and `/sys/windows` return the dictionary's own lists: the same
answer for every entity, changing only when an administrator edits the
dictionary. Three hooks fetched them under keys scoped to the *entity being
viewed* — `["sys-window-for-entity", entityName]` in `use-bus-entity-level`,
`["window-tabs", tableName]` in `use-window-tabs`, `entityKeys.table(entity)`
in `useTableMetadata` — so each new entity screen re-fetched whole lists it
already had.

`hooks/use-dictionary-lists.ts` owns them now, keyed by the list rather than by
the reader. A hook that wants one entity's row filters the list it already has.

It also closed a quieter defect. Those callers asked for 500 rows, 200, 100 and
— in `useTableMetadata` — no limit at all, and the endpoint's default is 200.
An application with more than 200 tables resolved an entity on one screen and
silently not on another, which would read as a broken page rather than as a
truncated list. One `LIST_LIMIT` for all three.

### Measured, before and after

Cold load of each page, production build, cache disabled, signed in:

| Page | JS before | JS after |
|---|---|---|
| `/dashboard` | 382KB | **273KB** |
| `/compound` | 424KB | **315KB** |
| `/admin` | 345KB | **236KB** |

The entry chunk itself goes 972,625 → 444,712 bytes raw, 229KB → 120KB over the
wire.

In-app navigation — sign in, open the dashboard, then visit three entity
screens by clicking, which is the case the shared keys exist for:

| | before | after |
|---|---|---|
| API calls | 25 | **21** |
| `GET /sys/tables` | 3x | **1x** |
| `GET /sys/windows` | 3x | **1x** |

The saving scales with the session: two whole-dictionary fetches per additional
entity screen, forever, versus none.

### What was measured and deliberately left

- **`ankareport` (1.5MB) and `bpmn-js` (560KB) are already lazily split** and
  appear on none of the three pages. The sibling's CopilotKit finding has no
  equivalent here, because this stack does not ship CopilotKit in the generated
  frontend at all.
- **64 to 84 JS files per page.** Most are tiny: per-icon chunks and Astryx's
  per-component chunks. That count is the price of the icon change in §9 — one
  lazy chunk per icon instead of a 444KB barrel — and trading it back would undo
  a larger saving.
- **`/compound` still makes 9 API calls and `/admin` 7**, and after this pass
  none of them is a repeat. Collapsing the remaining dictionary reads into
  per-screen endpoints is a backend change, not a caching one, and is a
  separate piece of work.

### How this round was verified

| Gate | Result |
|---|---|
| `bun run type-check` | clean |
| `bun run test` | 1013 passed |
| `bun run test:generator` | 643 passed |
| `cargo test -p appwithai-gen` | 157 passed |
| `cargo fmt --check`, `clippy --all-targets -- -D warnings` | clean |
| `bun run parity` | 3 models, backends byte-identical |
| Generated frontend | `vite build` succeeds; `tsc --noEmit` **0 errors** |

The generated frontend's type-check is the gate that matters for this change,
since none of it reaches the backend that parity compares. Run `bun run build`
in the generated `frontend/` first: `routeTree.gen.ts` is written by the Vite
plugin, so on a fresh generation `tsc` reports 85 errors that are all its
absence.

---

## 11. The sidebar and the header were generated into every application and rendered by none of them

The sibling mounted an application shell — one sidebar and one header on every
screen that has chrome — and reading the two side by side showed this repository
had the pieces and not the mounting. `components/layout/sidebar.tsx` and
`header.tsx` were generated into every application. `app-layout.tsx` imported
the sidebar. **Nothing imported `app-layout`.** The sidebar's own source said so
in a comment, which is how long it had been true.

What a user got instead: `__root.tsx` wrapped every page in a bare `<main>`, the
dashboard drew a header of its own, and every other screen drew none. So opening
a record lost you the account menu, the manual, the assistant and the way out
until you navigated back to the dashboard, and there was no navigation between
entities at all — the only route to a second entity screen was the dashboard's
cards.

### The shell

`components/layout/app-shell.tsx` is what mounts it, from `__root.tsx`, around
the `<Outlet />`.

**It decides by route, not by session.** A shell that waited for `useAuth()`
would flash its chrome around the sign-in page on every cold load, and show an
unauthenticated visitor to a deep link a sidebar full of nothing while the
redirect resolved. `CHROMELESS` names the prefixes that are their own full-page
experience — `/auth` — and everything else gets the shell.

**It deliberately does not guard the routes.** `app-layout.tsx` did: it
redirected to `/auth/login` when `useAuth()` reported no session. Mounting that
at the root would have put a second, competing redirect behind every page that
already does its own. One guard per screen, where the screen can say what it
needs. `app-layout.tsx` is deleted rather than left beside its replacement.

### The sidebar had three hardcoded lists, and mounting it would have shipped all three

It was not a case of rendering what was already there. The sidebar built its
entries from:

| | What it did | What that would have shipped |
|---|---|---|
| `navItems` | interpolated the entities at generation time, each with an icon guessed from its name | A second derivation of `sys_table.icon`, free to disagree with the dashboard's |
| `adminItems` | named six admin screens, one of them `/admin/dictionary` | A dead link, in the menu whose job is to say what the application has |
| both | were not scoped to the caller | The menu offering entities `/api/bus/*` answers 403 on — §9's defect, in the navigation |

Every entry now comes from `useDashboard()`, the same `/api/me/dashboard` query
the dashboard's cards are built from. One fetch serves both — whichever renders
first pays for it and the other reads the cache — and the menu offers exactly
what this caller may open, because that endpoint answers from the rows
`/api/bus/*` is guarded by. The links are real anchors rather than buttons with
`navigate()`: middle-click, open-in-new-tab and copy-link all work on a link and
none of them work on a click handler, and a menu is the one place people use
them.

The header lost its search box in the same pass. It was a form whose only
handler was `preventDefault()`, over an input bound to no state, placeholdered
`Search... (Ctrl+K)` for a shortcut nothing wired up. The dashboard has a search
that genuinely works — it filters the cards in front of you — and it stays there.
There is no endpoint a global search could call.

### Mounting the header found a defect that had been generated into every application

The shell's first browser pass reported React error #418 — a hydration failure —
on `/dashboard` and on `/compound`, and on no page before the shell. It was
this repository's own, not something ported, and worth recording because of
where it was.

`components/ui/dropdown-menu.tsx` is the shadcn surface over Astryx's
`DropdownMenu`. Radix splits a menu into Trigger and Content and expects the
caller to nest them; Astryx owns the trigger *and* the popover, rendering a
button of its own from a `button` prop. The adapter bridged that by passing
whatever sat inside `DropdownMenuTrigger` through as that button's `icon` — and
in a shadcn call site what sits there is a `<Button>`:

```tsx
<DropdownMenuTrigger asChild>
  <Button variant="ghost" size="icon" className="relative">
    <Bell size={20} />
  </Button>
</DropdownMenuTrigger>
```

So the rendered tree was a `<button>` inside a `<button>`. The HTML parser will
not keep that shape — it hoists the inner button out of the outer one — so the
DOM React hydrates against is not the tree it rendered. React discards the whole
tree and re-renders it on the client, which is what #418 says.

The adapter's own comment named `<Button><MoreHorizontal /></Button>` as "the
common case" and handled it this way, so the defect was in every generated
application from the day the Astryx migration landed. It was invisible because
**`header.tsx` was the only file in the generated frontend that used
`DropdownMenuTrigger`, and `header.tsx` was never rendered.** Mounting the shell
is what executed the adapter for the first time.

Unwrapping is the faithful reading of `asChild`, not a workaround: Radix's
`asChild` means *render my child as the trigger*, and the only translation of
that onto a component which owns its trigger is to take the child's content and
move its `variant` and accessible name onto the button that now exists.
`components/ui/button` already resolves the same conflict the same way — a
non-link `asChild` renders its children rather than nesting them — so the two
adapters now agree. The header no longer wraps its triggers in a `<Button>` at
all, and names them: `aria-label="Notifications"` and `aria-label="Account"`,
rather than the adapter's generic `Open menu`.

### The generator stopped naming templates that are not there

The sibling's #155 has an exact counterpart here, and this round is where it
surfaced — in the *frontend* generator, which no gate reads.

`generateComponents` carried a list of nineteen `components/ui/<name>.tsx` files
to copy. **Every one of them failed.** The Astryx migration made each an
adapter, so the templates are `<name>.tsx.hbs` now and
`astryx-frontend.generator.ts` renders all twenty-six. The loop warned
`UI component not found` nineteen times on every generation, copied nothing, and
the components arrived anyway from the other generator — so the warnings read as
noise rather than as a list that had stopped being true. Five more entries under
`staticComponents` (breadcrumb, separator, tooltip, empty-state, mobile-sidebar)
were the same. Twenty-four dead entries, removed.

The catches around the layout copy went with them, and that is the half that
mattered. The copy loop warned `Layout component not found` and carried on; the
sidebar render fell back to copying a `sidebar.tsx` that does not exist, warned
twice, and carried on. A warning in a generation log that runs to hundreds of
lines is not a failure — **an application would have shipped with no navigation
at all and reported success.** `renderTemplate` also raises on a Handlebars
syntax error, which that catch made indistinguishable from a missing file: a
typo in the sidebar template would have deleted the sidebar from every generated
application, silently. The shell's three files and the sidebar render are
unguarded now, so a missing one fails the generation that produced it.

### How this round was verified

The contract was re-synced first: `diff -rq` against the sibling is clean for
`language/` and `website/llmtext/`, and the only substantive change was one
generator-contract line — an entity's `icon` is documented as compiling to
`sys_table.icon`, which this repository already does (§8).

The shell itself has no gate, because the Rust generator emits only `backend/`
and parity compares nothing here. So it was driven, in a **development** build
first: React's production build reports a hydration failure as the minified
`#418` and nothing else, while the development build names the element and
prints the offending subtree, which is what identified the nested button rather
than the four other things #418 lists as possible causes. Both builds were then
driven signed in, against the real backend:

| Page | Hydration errors | `button button` | Nav links | Headers |
|---|---|---|---|---|
| `/dashboard` | 0 | 0 | 27 | 1 |
| `/compound` | 0 | 0 | 27 | 1 |
| `/auth/login` | 0 | 0 | 0 | 0 |

27 is 2 fixed entries + 17 entities + 8 admin windows, which is the whole
dictionary this account may open. Both menus were opened and asserted on their
contents — the account menu shows the signed-in address, the notifications menu
its empty state — because an adapter change that silences a hydration error by
rendering nothing would pass every count above.

| Gate | Result |
|---|---|
| `bun run type-check` | clean |
| `bun run test` | 1013 passed |
| `bun run test:generator` | 643 passed |
| `cargo test -p appwithai-gen` | 157 passed |
| `cargo fmt --check` | clean |
| `bun run parity` | 3 models, backends byte-identical |
| Generated frontend | `vite build` succeeds; `tsc --noEmit` **0 errors** |

---

## 12. A generated application accepted unlimited password guesses

The sibling load-tested a generated application and found both of its failures
under load were in the rate limiting rather than in the code being limited. This
repository had no rate limiting **anywhere** — not on the credential routes, not
on anything else — so the sibling's two findings are one finding here, and the
mechanism it used to fix them (`@nestjs/throttler`, better-auth's own limiter)
exists in neither this stack nor this language. The behaviour was reimplemented
against Loco.

Demonstrated against a running generated application before it was written: k6
was not needed, a `for` loop was enough. **140 wrong passwords in a row were all
answered.** There was no other brute-force control either — no per-account
lockout, no delay, nothing.

### The key is the caller, not the address

This is the sibling's first finding, and it is worth restating because the
obvious implementation is the wrong one. A budget per IP is right for a public
service and wrong for this one: the users of a generated application arrive
through a reverse proxy — the compose one, a corporate gateway, an ingress — and
to the server every one of them has the same peer address. A per-IP limit stops
meaning *how fast may a person go* and starts meaning *how many people may there
be*. The sibling measured its own at 100/60s and found 429s beginning at 31
concurrent users while p95 latency was 3ms and the server was idle.

So `common::rate_limit` counts an authenticated request against the subject of
its own token, and only an anonymous one falls back to the address — which is
the right key for the routes an anonymous caller can reach, because there is
nothing else to count.

**The token is read in the middleware, not taken from an extractor**, and that
detail is load-bearing. The limiter is a layer around the whole router, so it
runs *before* the JWT extractor that populates a handler's `auth::JWT`. Asking
for that here would find nothing on every request and silently revert to
counting addresses: the limit would look installed and behave as though it were
not. The token is pulled from the `Authorization` header or the session cookie —
this application accepts both, and a limiter that knew only one would count half
its callers by address — and it is **verified**, not merely parsed. An unverified
subject is a bucket the caller picks, which is not a limit at all.

### Two budgets, and why they must not share a counter

The general budget bounds a runaway client; a single screen of this application
costs several requests, so 300 a minute is well above what a person produces.
The credential routes — `/api/auth/{login,register,change-password}` — get 30,
because the thing being bounded there is guessing, and a rate that is
comfortable for a person is already slow for an attacker.

The scope is part of the bucket key. Two budgets sharing one counter is one
budget: thirty ordinary requests would use up the sign-in allowance, and a
caller who had used up its sign-in allowance would find the rest of the
application closed. Both directions are asserted.

`/api/me/health` is exempt. It is the readiness probe, it is open by design, and
an orchestrator polling it every second must not consume the budget of whoever
shares its address.

### `TRUST_PROXY`, and why off is the right default

An anonymous caller is counted by address, so there is one switch deciding
whether `X-Forwarded-For` may be believed. Off is the security-relevant default:
a client that can set its own forwarded header hands itself a fresh bucket per
request, which turns the sign-in limit into decoration. Off, the fallback is the
proxy's own address — blunt, and erring towards refusing rather than towards
letting through.

When it is on, the **rightmost** value is taken rather than the leftmost,
because a well-behaved proxy *appends* the address it saw: anything to the left
of that was supplied by the client. Loco's own `remote_ip` middleware makes the
same choice for the same reason.

### Where it sits in the stack

`.layer(rate_limit).layer(http_log)` in `after_routes`, and the order is not
arbitrary — `.layer(a).layer(b)` makes `b` the outer one, so the request log
wraps the limiter and a 429 is reported as the refusal it is. The other order
would drop every refused request out of the log entirely, which is the one class
of traffic an operator most needs to see. Confirmed on the running application:
each refusal appears as `event="request.refused" … status=429`.

Those lines carry `requestId="none"`, which is correct rather than a gap and for
the reason `common::http_log` already documents for an unmatched 404: Loco's
request-id middleware is layered onto the routes, beneath this one, so a request
the limiter refuses never reaches it. An id that correlates with nothing is
worse than an honest absence.

### What it tells the caller

`RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset` go on **every**
limited response, not only on a refusal: a client that can read its remaining
budget can slow down before it hits the wall, while one that only learns at the
wall has to discover the limit by being refused. `Retry-After` goes only on the
refusal, because the header means *you were refused, wait this long* and putting
it on a served response says the opposite of what happened.

All four are added to `expose_headers` in the CORS configuration. Without that
the browser cannot read them at all: the generated frontend is served from a
different port, so every one of its calls is cross-origin, and a cross-origin
response carries the headers while the fetch API hides them unless they are
exposed. A budget header the client cannot read is not a budget header.

### The test configuration switches it off, and that is not a gap

`config/test.yaml` sets both budgets to 0. The generated suites drive volumes in
seconds that no human session produces in an hour — the bulk-seed suite alone
creates thousands of records through HTTP as one caller — so a budget there
would be testing the limiter rather than the application, and every unrelated
suite would start failing with a 429 whose cause none of them names.

That is exactly the shape of gap this repository has been closing all round, so
the limiter is covered the way `requests/rbac.rs` covers role enforcement: by
building its own conditions. `tests/requests/rate_limit.rs` layers the real
`enforce` over a two-route router of its own with a budget small enough to cross
inside one test, and drives it with `tower`'s `oneshot` — no application, no
configuration, no shared state with any other suite. Seven cases: the refusal
and its headers, the budget on a served response, one caller's exhaustion not
refusing another, the two budgets spent separately, the probe never refused, a
budget of 0 serving everything, and a forged `X-Forwarded-For` buying no fresh
bucket. `tower` is added to `[dev-dependencies]`: it is already in the tree
through axum and loco, so naming it only turns on the `util` feature that
`ServiceExt::oneshot` lives behind, and `Cargo.lock` needs no new entry.

### How this round was verified

Against a running generated application in development, where the budgets are
on:

| Case | Result |
|---|---|
| Wrong passwords accepted in a row, **before** | 140 of 140 answered |
| Wrong passwords accepted in a row, after | 30 served, **the 31st refused** |
| One signed-in caller's general requests | 300 served, **the 301st refused** |
| A **second** caller, same address, immediately after the first was refused | **200** on every request |
| An open dictionary read from an address whose credential budget is spent | **200** |
| The readiness probe, 20 times over a budget of 1 | 200 every time |

The fourth row is the one the design exists for: under a per-IP limit that
caller would have been refused, and it is a different person at the same
gateway. The fifth is the scope separation, live.

The refusal itself carries the application's own error body — the same
`statusCode`/`message`/`error` shape every other refusal uses, so a client parses
one refusal path rather than two — with `RateLimit-Limit: 30`,
`RateLimit-Remaining: 0` and `Retry-After` set to the seconds left in the window.

| Gate | Result |
|---|---|
| `bun run type-check` | clean |
| `bun run test:generator` | 647 passed |
| `cargo test -p appwithai-gen` | 157 passed |
| `cargo fmt --check` (generator and generated backend) | clean |
| `bun run parity` | 3 models, backends byte-identical |
| Generated backend `cargo clippy --all-targets -- -D warnings` | clean |
| Generated backend `LOCO_ENV=test cargo test --test app` | **322 passed, 0 failed** |

**Deliberately left.** The generated frontend does not yet treat a 429
specially — it surfaces as a generic error, where a 401 has a dedicated path
that signs the caller out. Reading `Retry-After` and telling the user to wait is
a frontend change with its own design, and the headers it would need are now
exposed for it. Per-account lockout is also still absent: the credential budget
is a floor against guessing, not a substitute for one, and this repository's
`users` table has nowhere to record a lockout yet.

---

## 13. A list that is allowed to lie will

§11 removed twenty-four entries naming templates that no longer existed, and the
`try`/`catch` blocks around the layout copy that were hiding the failures. That
is the half of the sibling's #155 that was cheap. This is the half that keeps it
from happening again.

The expensive property is not that dead entries accumulate — it is that a
**live** entry can go the same way. `renderTemplate` raises on a Handlebars
syntax error exactly as it does on a missing file, so a catch that swallows one
swallows the other: a typo in a template would delete it from every generated
application, silently, and the first symptom would be a build failure somewhere
else entirely. There are still twenty-odd such catches in the frontend
generator, and rewriting all of them is a separate and riskier change.

So rather than rewrite them, `generators/__tests__/declared-templates.test.ts`
sweeps every generator's source for template paths and asserts each resolves on
disk. Two sweeps, because the generators spell a path two ways:

| Sweep | Catches |
|---|---|
| a quoted `src/…` path with a source extension | the copy lists — `staticComponents`, `staticAdminPages`, `staticLibFiles`, `i18nFiles`, the provider and admin lists |
| a quoted path ending `.hbs` | `RENDERED_FILES` in the backend generator, the per-entity suites, and any inline `renderTemplate` argument |

It depends on no particular list being exported or spelled a particular way,
which is the property that matters: the next list to rot will not be one the
test knows about.

Two details are load-bearing. The `.hbs` sweep asserts it found **more than a
hundred** paths, because a regex that silently stopped matching would make the
suite pass by finding nothing — the same failure this whole section is about,
one level up. And the leading character of a `.hbs` match must be a word
character, which is what keeps prose out: a comment saying a file "became
`.tsx.hbs`" is not a declaration.

One allowlist entry, with its reason. `src/routeTree.gen.ts` is a line of the
generated project's `.gitignore`, which the generator writes as a string —
TanStack Router writes that file on dev and build, so naming it there is telling
git to ignore it, not declaring a template. A future addition needs a reason
written beside it; the list being short is the point.

### How this round was verified

The gate was checked against the failure it exists for rather than only against
a green tree: two dead entries were added back to a copy list, and it failed
naming the one that resolves nowhere —

```
tanstack-astryx-loco/tanstack-start-frontend.generator.ts names src/routes/admin/dictionary.tsx
```

The other entry (`src/components/ui/button.tsx`) was correctly **not** reported,
because `button.tsx.hbs` exists: that entry is in the wrong generator rather
than dead, which is a different bug and one the generated frontend's own build
catches. The sweep answers "does this resolve anywhere", and says so.

`bun run test:generator` 649 passed, `bun run type-check` clean, Biome clean at
`--diagnostic-level=error`.

---

## 14. The model was saved to a database and a folder, and neither was a history

Round 12 carries the sibling's `cc90133` — *Merge the version/history work and
the enhance-page work into main* — surveyed against sibling `7e50ea8`. It is the
largest single change the sibling has made to the modelling tool, and it lands
here almost as written: the modelling tool is the one part of this product whose
two copies share a runtime (bun, Kysely, TanStack Start), so the mechanism ports
and not only the behaviour.

### What was wrong

A design-page save here did three things with no ordering between them: it wrote
a new `erd_versions` row **for a draft** (so every Save Draft was a numbered
version, and Save Version produced two), it POSTed the same text to a
shared diagram-library folder keyed by project *name* (two projects called "CRM"
overwrote each other's canonical file), and it ignored whether that second write
succeeded. Generation then wrote the application over its own directory with
`--force`, so an edit anyone had made in the generated code was lost on the next
run and nothing recorded which model a given application came from.

The diagram library was also open: `GET` on the diagram-library API with no `projectId`
returned every project's diagrams to any caller, signed in or not, and
`GET`/`DELETE` on a single library file checked nothing at all.

### What it is now

**Every model write is a commit.** One local Git repository per project, inside
its output directory, driven by `lib/server/project-git.ts` (argument arrays, no
shell, no hooks, no global config) and coordinated by
`lib/server/project-repository.ts`: a prepared operation is journalled in
`project_git_operations`, the files are written and committed, and only then is
the database projection (`project_git_state`, `erd_versions.git_commit`)
finalised. A replayed request ID returns the same commit instead of a second
version; an interrupted one is recovered on the next call rather than repeated.
A Postgres advisory lock per project serialises writers across processes.

| Action | Now |
|---|---|
| Save Draft | Commits the model; **no** version row |
| Save Version | One version, linked to its commit — to the draft's commit if the model did not change |
| Restore | A *new* commit carrying the old model, after checkpointing local work. Never a reset |
| Generate | Generated into a staging directory, then three-way merged into the project against the last generated baseline, so a hand edit to a generated file survives regeneration. `.appwithai/generation.json` records the input commit |

Each commit also carries `.appwithai/model.ai.yaml`, a deterministic YAML
projection of the model from the new `packages/yamltecture` package — the "YAML
beside the diagram" the sibling added. It is what makes a model diff readable,
and it is what the assistant reads (below).

### Where this repository differs from the sibling, and why

- **The generated backend is a cargo crate.** The sibling's `publishGeneration`
  refused an application without `backend/package.json`, which a generated
  application here has never had; it requires `backend/Cargo.toml` instead. The
  snapshot allow-list gained `.rs`, and `target/` is excluded — without the
  first, the generated backend's source would have been silently left out of
  every commit; without the second, a built backend would have tried to commit
  gigabytes of cargo output.
- **Generation stays in-process.** The sibling shells out to its own CLI; this
  repository's `/api/generate` has called `generateApplication` directly since
  round 1, and still does — only its output directory moved to the staging area.
- **The assistant's context is a graph here, not an embedding index.** The
  sibling appended the YAML projection to its pgvector answer. Here it is a
  twelfth question on `/api/projects/$id/model-context` (`?q=yaml&term=…`) and a
  `readSavedModel` assistant action beside the typed graph traversals, and
  `summary` now reads the saved model from `project_git_state` first — a draft
  no longer writes an `erd_versions` row, so reading only that table would have
  answered from the last *named* version.
- **The manual's screen layout.** The sibling's "Where it appears" section
  (`c5c80d3`) derives the layout from `DictionaryGenerator` and narrows it with
  the browser stack's `GRID_NOISE`; neither exists here. The placement rule
  `seed/dictionary.sql` writes every `sys_field` from was lifted out of
  `buildDictionarySeedSql` into `fieldPlacement` / `screenLayout`, and the
  manual reads that — one derivation, not two. `bun run parity` confirms the
  refactor emitted byte-identical backends. The test checks the manual's
  rows against the seed SQL itself, not against the function the manual calls.

### What was carried unchanged

The enhance page's Business Rules tab now compiles a rule's `actions` directives into the
same decision-table editor the generated application edits, and writes edits
back to a rule's `actions` (`serializeRuleActions`, `replaceRuleActions`, with round-trip
tests); each hook gets its own Trigger.dev workflow with a locked trigger in the
`AutomationBuilder`; and `language/browser/checker.entry.ts` now names the six
Application Dictionary warnings as gaps rather than calling every warning
optional.

### How this round was verified

- `bun run type-check`, `bun run type-check:language` clean; `bun run test`
  1055 passed.
- `APPWITHAI_GIT_TEST_DB=1 bun run test -- src/lib/server/__tests__/project-repository.test.ts`
  6 passed against a real Postgres 16 — idempotent replay, recovery of an
  interrupted operation, concurrent saves, restore, and generation merge. CI
  runs it as `.github/workflows/project-git.yml`.
- `bun run parity`: 3 models, backends byte-identical.
- Driven over HTTP on a running modelling tool: draft → version (reused the
  draft's commit) → second version → restore of v1 (a fourth commit, the project
  reads the restored model) → `/git` history → `?q=yaml` → `?q=summary`, and
  anonymous requests to the diagram-library API, for the list and for a single file, both 401.
- `/api/generate` over HTTP on `language/yaml/examples/crm.eml.yaml`, with the real
  `loco new` scaffold: one commit carrying 159 `.rs` files and nothing under
  `backend/target`. A line appended by hand to `backend/src/controllers/bus.rs`
  was still there after a second generation.
