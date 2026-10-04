# Backend migration plan: Node (TanStack Start) → Loco.rs

This document is the plan for replacing the server side of Enterprise
Reporting with a [Loco](https://loco.rs) (Rust) application. The Rust port
lives in this `rust/` directory. The Node backend stays in place and keeps
running until every endpoint has been shown to return the same output (see
**Parity**).

It covers what moves, in what order, how each piece maps onto Loco, which Node
behaviours have to be kept exactly, and how each phase is checked before the
next one starts.

---

## 1. Scope

### What "the backend" means here

| Node today | Size | Rust target |
|---|---|---|
| `src/routes/api/**` — 69 REST route files | ~9k lines | Loco controllers (`rust/src/controllers/`) |
| `src/server-fns/**` — 13 files, 60 TanStack server functions | ~4.3k lines | REST endpoints on the same controllers, called by the frontend over HTTP |
| `src/lib/jobs/**` — Trigger.dev tasks and 4 workers | ~2.4k lines | Loco `BackgroundWorker`s on the Postgres queue (`rust/src/workers/`) |
| `src/lib/monitoring/monitoring-scheduler.ts` — 60 s cron poller | 429 lines | Loco scheduler plus the `cron_tick` task (`rust/src/tasks/`) |
| `src/lib/report-generation/**` — NL report worker and cleanup | — | Worker plus a scheduled cleanup task |
| `src/lib/auth`, `permissions`, `security`, `sql` validator, `db/connection-manager` | ~2.5k lines | `rust/src/{auth,permissions,security,sql,datasources}` |
| `src/lib/db/bootstrap.ts` — idempotent schema | 974 lines | A Loco/SeaORM baseline migration that runs the same DDL |

### What does not move (in this migration)

- **The React UI and its SSR shell.** TanStack Start keeps rendering pages.
  Only its data access changes: server functions and `/api/*` fetches end up
  calling the Rust service.
- **Better Auth's sign-in, sign-out and session-issuing endpoints**
  (`/api/auth/$`), until Phase 6. Until then Rust **reads** Better Auth
  sessions and never issues them. Sign-in stays where it is and both backends
  accept the same cookie (see §4.2).
- **Mastra / llama.cpp / CopilotKit.** They are separate services already. The
  Rust side calls them over HTTP, as Node does now.
- **DuckDB WASM, TanStack DB and the export UI.** These are client-side.
- **User data sources other than PostgreSQL.** The Rust backend connects to,
  tests, introspects and inspects **PostgreSQL** data sources only. MySQL and
  SQL Server are out of scope: a MySQL or SQL Server data source can still be
  stored, listed, edited and deleted through Rust, but testing or inspecting
  one returns a "PostgreSQL only" error. The existing MySQL connection code in
  `datasources/connection_manager.rs` stays as it is, but it is neither
  extended nor covered by parity. (Node's own SQL Server path cannot work
  either: `mssql` and `tedious` are not installed.) SQLite upload
  (`/api/data-sources/upload`) stays on Node, and SQLite is not a supported
  data source on either side.

---

## 2. Principles

1. **One database, two readers.** Both backends run against the same config
   database (`DATABASE_URL`). Parity tests then compare the two backends on
   identical rows, and moving traffic is a routing change rather than a data
   migration.
2. **The schema stays what `bootstrap.ts` says it is** until Node is retired.
   The Rust baseline migration runs the same `CREATE … IF NOT EXISTS` DDL, so
   either service can boot first. There is no `ALTER` that only one side knows
   about. New columns go into both until Phase 7.
3. **The response is the contract, byte shape included.** Envelopes
   (`{success, data, error:{code,message}}`), status codes, `meta` fields and
   the JSON type of every column (see §4.4) are reproduced exactly. That
   includes Node's known quirks. Where Node is wrong, Rust copies it first,
   and the bug is fixed in **both** as its own change. The parity suite never
   carries "expected differences" that nobody wrote down.
4. **Security rules move as rules, not as code shapes.** The CLAUDE.md
   invariants (§5) each become a Rust unit test named after the rule before
   the endpoint that needs it is ported.
5. **Strangler, not a big bang.** nginx routes `/api/<area>` to Rust one area
   at a time. Moving an area back to Node is a one-line change.

---

## 3. Target architecture

```
                         ┌────────────── nginx ──────────────┐
 browser ── /report/* ──▶│ TanStack Start (SSR + UI) :3000   │
          ── /api/auth ─▶│   Better Auth (sign-in)           │
          ── /api/<X> ──▶│ Loco (ers-backend) :5150  ◀── moved areas
                         └──────────────┬────────────────────┘
                                        │
       ┌────────────────────────────────┼──────────────────────────┐
       ▼                                ▼                          ▼
 config DB (PostgreSQL)        pgmq-style job queue        user data sources
 bootstrap schema, shared      (Loco pg queue tables)      pg / mysql / mssql
```

Loco process roles, all from the same binary:

| Command | Role | Replaces |
|---|---|---|
| `ers-backend-cli start` | HTTP API | `/api/*` routes and server functions |
| `ers-backend-cli start --worker` (or `--server-and-worker`) | Queue consumers | Trigger.dev tasks / `worker-runner.ts` |
| `ers-backend-cli scheduler` | Cron driver | `startOnPremiseCronRunner` 60 s `setInterval` |
| `ers-backend-cli task <name>` | One-off and scheduled tasks | `scripts/*.ts` maintenance scripts |

### 3.1 Module layout

```
rust/
├── Cargo.toml
├── config/{development,test,production}.yaml   # Loco config, env-templated
├── migration/sql/0001_baseline.sql             # DDL extracted from bootstrap.ts
├── src/
│   ├── bin/main.rs                             # loco_rs::cli::main
│   ├── app.rs                                  # Hooks: routes, workers, tasks, boot
│   ├── common/        # env settings, db pool, node-pg–compatible row→JSON, envelopes, pagination
│   ├── auth/          # Better Auth cookie verify + session lookup + live RBAC
│   ├── security/      # AES-256-GCM (Node-compatible), audit log
│   ├── sql/           # isReadOnlyQuery, statement-break scan, strict table extraction, validateSQL
│   ├── permissions/   # hasPermission, checkEntityAccess, validateQueryAccess, decideQueryRun
│   ├── datasources/   # connection manager (pooled per data-source id), connection test, PostgreSQL
│   │                  #   introspection, network-target (SSRF) check
│   ├── metadata/      # EntityService reads, SyncService (schema → metadata_entity_*)
│   ├── monitoring/    # cron matcher (Node-identical semantics), threshold engine
│   ├── controllers/   # one module per /api area
│   ├── render/        # XLSX (rust_xlsxwriter) and PDF (own writer) for exports and workers
│   ├── reportgen/     # scheduled NL reports: RBAC snapshot and drift, native charts, worker, cleanup
│   ├── nlquery/       # embedding/speech clients, pgvector RAG store (hash-embedding fallback)
│   ├── embeddings/    # the log-search embedding (Node's generateLogEmbedding)
│   ├── workers/       # monitoring evaluate, report, export, email batch
│   ├── tasks/         # cron_tick, evaluate_rule, generate_report, email_batch, generate_nl_report, report_cleanup
│   └── migration/     # SeaORM Migrator wrapping the baseline SQL
└── parity/            # Node-vs-Rust harness: HTTP cases, worker rows, CSV bytes, cron corpus
```

### 3.2 Crates

| Concern | Crate | Notes |
|---|---|---|
| Framework | `loco-rs 1.2` | axum 0.8, SeaORM 2, sqlx 0.9, tokio-cron-scheduler |
| Config DB | `sqlx` (the pool under Loco's SeaORM connection) | Dynamic rows give node-pg–identical JSON (§4.4). SeaORM entities come later for typed writes. |
| User DBs | `sqlx` postgres | PostgreSQL only (§1). The mysql code path predates that decision and is left as is |
| SQL parsing | `sqlparser` | Replaces `node-sql-parser` in `extractTablesStrict` |
| Crypto | `aes-gcm` (16-byte nonce), `scrypt`, `hmac`+`sha2`, `bcrypt` | Byte-compatible with Node (§4.3) |
| Cron | own matcher (`monitoring/cron.rs`) and `chrono-tz` | The exact semantics of `matchesCronField` (§4.6) |
| Export | `csv`, `rust_xlsxwriter`, a small PDF writer of its own (`render/pdf.rs`) | Phase 4. `printpdf` was planned; the tables and charts need only text, lines and filled shapes in Helvetica, so the writer is a few hundred lines with no dependency |
| Email | `lettre` | Monitoring alerts, email batch with attachments |

---

## 4. Compatibility contracts (the parts that break silently)

### 4.1 Response envelopes

```jsonc
// success
{ "success": true, "data": { "items": [...], "meta": { "total": 12, "page": 0, "pageSize": 20, "totalPages": 1 } } }
// failure
{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "Not authenticated" } }
```

`meta` is **not** uniform in Node. `/api/queries` and `/api/jobs` omit
`totalPages`. Reports, charts and dashboards include it. `/api/queries` 401s
omit `code`. `rust/src/common/response.rs` exposes both shapes, and each
controller picks the one its Node twin uses. The parity suite enforces the
choice.

### 4.2 Sessions: read Better Auth's cookie, don't issue one

- The cookie is `ers.session_token`, or `__Secure-ers.session_token` over
  HTTPS. It is matched **at a cookie boundary**, never as a substring
  (`crm_app.session_token` is sent from the same origin; see CLAUDE.md).
- The value is `encodeURIComponent(token + "." + base64(HMAC-SHA256(AUTH_SECRET, token)))`.
  Rust verifies the signature with the same `AUTH_SECRET`. Node's
  `verifySession` path skips this check; Rust does not.
- The session is resolved **per request**: `auth_sessions` joined to `users`
  where `token = $1 AND users.is_active`, then `expires_at > now()`. Roles and
  permissions come from `roles`/`user_roles` on every request, never from a
  cache, so revocation still takes effect on the next request.
- `roles.permissions` JSON that does not parse contributes nothing and does not
  fail (one malformed role must not lock out its members).
- Phase 6 moves sign-in itself: bcrypt against `auth_accounts.password` (never
  `users.password_hash`), cookie signing as above, and the same rate limits
  (5 sign-ins/min).

### 4.3 Encryption of `data_sources.connection_config`

Format: `hex(iv[16]) ‖ hex(tag[16]) ‖ hex(ciphertext)`, AES-256-GCM, **16-byte
IV**. The `aes-gcm` crate defaults to 12, so the type is
`AesGcm<Aes256, U16>`.

Key derivation, in order:
1. A 64-hex-char `ENCRYPTION_KEY` → the raw 32 bytes.
2. Otherwise scrypt(N=16384, r=8, p=1, 32 bytes) with salt
   `sha256("ers:" + key)`. On decrypt, fall back to the legacy salt `"salt"`.
3. Unset → fatal, unless `ALLOW_INSECURE_ENCRYPTION=1` and not production.
   That uses scrypt("default-dev-key-change-in-production", "salt").

Nothing logs plaintext or key material. `parity/crypto-roundtrip.ts` encrypts
in Node and decrypts in Rust (and the reverse) in CI.

### 4.4 JSON typing of database values (node-pg defaults)

The Node side installs no type parsers, so what the frontend receives is
node-pg's default mapping. Rust reproduces it in
`common/db.rs::row_to_json`:

| PostgreSQL | node-pg → JSON | Rust must emit |
|---|---|---|
| `int2/int4`, `float4/float8` | number | number |
| `int8` (`COUNT(*)`, `BIGINT`) | **string** | string |
| `numeric/decimal` | **string**, scale kept (`"20.0000"`) | string via `rust_decimal`, scale kept |
| `bool` | boolean | boolean |
| `timestamp`, `timestamptz` | `Date` → ISO `"2026-09-23T10:00:00.000Z"` | same, millisecond precision, `Z` |
| `date` | `Date` at local midnight → ISO | same (the server runs in UTC) |
| `json/jsonb` | parsed | parsed |
| `varchar/text` (incl. the VARCHAR timestamps) | string | string |
| `uuid` | string | string |
| `bytea` | Buffer → `{"type":"Buffer","data":[…]}` | same |

This applies to **user data-source rows too**: report data and SQL-editor
output go through the same converter.

### 4.5 Pagination

Server-side pagination is mandatory (CLAUDE.md). Every list endpoint takes
`page` (0-based) and `pageSize` and applies `LIMIT/OFFSET` in SQL.
`common/pagination.rs` holds the one parser, and per-endpoint caps match Node:
`jobs`/`reports/:id/data` cap at 1000, the others do not cap. **Node parity
quirk:** `reports/:id/data` appends `LIMIT n OFFSET m` only when the stored SQL
has no `LIMIT` of its own. Rust copies this. It is tracked as bug P-1 (§9) and
fixed in both backends together.

Search moves into SQL as it does in `/api/queries` (`ILIKE` on name,
description and data-source name through `EXISTS`), never into the browser.

### 4.6 Cron semantics

Node's on-premise runner does **not** use a cron library. It uses
`matchesCronField`: `*`, `a,b`, `a-b` and `x/n` / `a-b/n` (the step range
defaults to 0–59 for every field), with day-of-month **AND** day-of-week (not
Vixie cron's OR), and it evaluates in the rule's IANA timezone. A library
would change which minutes fire. `monitoring/cron.rs` is a line-for-line port
with table-driven tests, and every production rule's `cron_expression` is
replayed through both matchers over a simulated week before cut-over (§7,
Phase 5).

---

## 5. Security invariants that become tests first

Each item is a `#[test]` in the module that owns it. It is written before the
endpoint that relies on it.

| Invariant (from CLAUDE.md) | Rust home | Test |
|---|---|---|
| Every path that runs stored SQL gates on `decideQueryRun` (read-only **and** table access, at run time) | `permissions/runnable_query.rs` | `refuses_empty`, `refuses_write_sql`, `refuses_statement_break`; parity cases run as the analyst |
| `SELECT 1 LIMIT 1; DROP TABLE users` is not read-only; a `;` inside quotes is fine | `sql/validator.rs` | `statement_break_*` |
| A query whose tables cannot be determined is **denied** (`SELECT * FROM(hr_salaries)`) | `sql/tables.rs` | `from_without_space_is_never_trusted`, `unparseable_is_err`, `derived_table_only_is_denied` |
| CTE names are not tables | `sql/tables.rs` | `cte_names_excluded` |
| `checkEntityAccess` is the one implementation. `admin:*` bypasses. Levels are `select < insert < update < delete < all` | `permissions/ds_rbac.rs` | `admin_bypass`, `best_level_wins_and_case_insensitive`, `no_ds_role_denies`, `malformed_role_json_is_error` |
| The cookie matches at a boundary, never a substring | `auth/session.rs` | `does_not_match_suffix_cookie`, `forged_or_unsigned_token_rejected` |
| Roles are read per request, and a malformed role grants nothing | `auth/session.rs` | `malformed_permissions_ignored` |
| An unset `ENCRYPTION_KEY` is fatal, and nothing logs plaintext | `security/encryption.rs` | `missing_key_is_error` |
| Record-link templates allow only site-relative or http(s) URLs | `reporting/record_link.rs` (Phase 2) | port of `record-link.test.ts` |
| SSRF guard on data-source hosts (`network-target.ts`) | `datasources/network_target.rs` (Phase 3) | port; the webhook SSRF guard is ported already (`monitoring::alerts::tests::ssrf_guard`) |

---

## 6. Inventory and mapping

### 6.1 REST routes → controllers

| Area (`/api/…`) | Node files | Rust controller | Phase |
|---|---|---|---|
| `health` | 1 | `health.rs` | 1 ✅ |
| `queries`, `queries/:id`, `queries/:id/execute` | 3 | `queries.rs` | 1 ✅ list/search, create, get, update, delete, execute |
| `reports`, `reports/:id`, `…/data`, `…/export`, `…/filters*` | 6 | `reports.rs`, `report_export.rs` | 1–4 ✅ `…/export` (CSV, XLSX, PDF, HTML) in Phase 4 |
| `charts`, `charts/:id`, `…/data`, `…/filters` | 4 | `charts.rs` | 1–2 ✅ |
| `dashboards`, `…/:id`, `…/widgets*` | 4 | `dashboards.rs` | 1–2 ✅ |
| `jobs`, `jobs/executions`, `jobs/status` | 3 | `jobs.rs` | 1, 4 ✅ list, create, executions, status |
| `notifications` | 1 | `notifications.rs` | 1–2 ✅ plus the server functions' REST twins |
| `data-sources/**` | 8 | `data_sources.rs`, `share.rs` | 1–3, 7 ✅ `upload` in Phase 7: it checks the file name and stores nothing, as Node's does (P-19) |
| `monitoring/rules*` | 3 | `monitoring.rs` | 1, 5 ✅ list, create/get/update/delete, pause/resume/run, executions |
| `sql/execute`, `sql/validate`, `sql/schema/:id` | 3 | `sql.rs` | 3 ✅ |
| `filters` | 1 | `filters.rs` | 2 ✅ |
| `metadata/entities/**` | 5 | `metadata.rs` | 3 ✅ |
| `logs/**` | 4 | `logs.rs` | 2, 5 ✅ `logs/search` (embedding similarity) in Phase 5 |
| `admin/**`, `auth/permissions` | 5 | `admin.rs`, `auth.rs` | 6 ✅ plus the role routes the roles screen calls and Node lacks (D-33) |
| `settings/email` | 1 | `settings.rs` | 4 ✅ |
| `help/articles` | 1 | `help.rs` | 2 ✅ |
| `report-generation/**` | 3 | `report_generation.rs` | 4, 7 ✅ `POST …/definitions` in Phase 7, dry run included: the report-builder agent is one OpenAI-compatible chat call, ported with its prompt and its zod-style validation (`nlquery/agents.rs`). The preview it runs is gated (D-35) |
| `nl-query/**`, `adk/**`, `copilotkit/**` | 9 | `nl_query.rs`, `adk.rs`, `copilotkit.rs` | 5, 7 ✅ `nl-query/{history,schema,execute,rag-store,rag-context,voice}` in Phase 5; `adk/analyze-intent` (intent classifier, schema context, Mastra supervisor with the NL→SQL fallback) and `copilotkit/{transcribe,tts,threads,threads/:id}` in Phase 7. `/api/copilotkit` itself, the CopilotKit runtime, stays in the TanStack server: it is the library's own streaming protocol, it touches no data, and it proxies to Mastra |
| `voice/**` (incl. WebSocket) | 3 | `nl_query.rs` | 5 ✅ `transcribe`, `synthesize`. `voice/ws` is not ported (P-18); with Rust as the backend it is a 404: under TanStack Start it never upgrades to a WebSocket (it answers the handshake with plain HTTP), and it takes the user id from the client's message rather than from the session. Porting that would port a route that does not work and trusts the caller |
| `auth/$` (Better Auth) | 1 | `auth.rs` | 6 ✅ `sign-in/email`, `sign-out`, `get-session`: the three this application uses. Every other Better Auth path is a 404 with Rust as the backend (§7.1) |
| *(server functions, §6.2)* | | `nl_builder.rs`, `share.rs` | 7 ✅ `nl-builder/{preview,save-report,save-chart,data-sources}`, `share/:kind/:id`, `dashboard/stats` |

### 6.2 Server functions → REST

TanStack server functions are RPC over `/_serverFn/<hash>`. A non-JS backend
cannot serve them. Each becomes a REST endpoint on the controller of its area,
and the server function becomes a thin forwarder in the frontend
(`src/lib/api/backend.ts`, which forwards the session cookie):

| File | Functions | Target |
|---|---|---|
| `reports.ts` | list/get/create/update/delete, get/setRecordLink | `reports.rs`. ✅ get/setRecordLink forward (`/api/reports/:id/record-link`); the CRUD functions have no callers outside the forwarder's reach and stay until Phase 7 |
| `charts.ts` | list/get/create/update/delete | `charts.rs` |
| `dashboards.ts` | list/get/create/update/delete, add/update/removeWidget | `dashboards.rs` |
| `data-sources.ts` | list/get/create/update/delete, inspect | `data_sources.rs`. ✅ `listDataSources` forwards (`GET /api/data-sources`); the others have no callers and stay until Phase 7 |
| `sql.ts` | executeSql, batchExecuteSql, validateSql, introspectSchema | `sql.rs`. ✅ `introspectSchema` forwards (`GET /api/sql/schema/:id`, with the empty-database `warning` folded back into the payload); the other three have no callers and stay until Phase 7 |
| `filters.ts` | getDashboardFilterLinks, applyDashboardFilter | `filters.rs` |
| `notifications.ts` | fetch/markRead/markAllRead/delete | `notifications.rs`. ✅ forwarded (`/api/notifications/inbox`, `/{id}/read`, `/read-all`, `DELETE /{id}`) |
| `schema-instructions.ts` | get/saveField/saveTable | `schema_instructions.rs`. ✅ all three forward (`GET /api/schema-instructions/:dataSourceId`, `POST …/field`, `POST …/table`) |
| `admin.ts` | users and roles CRUD, changePassword | `admin.rs`. ✅ all eleven forward: `/api/admin/users/page`, `POST /api/admin/users`, `/api/admin/users/:id` (GET/PUT/DELETE), `POST …/:id/password`, `/api/admin/roles/parsed`, `POST /api/admin/roles`, `/api/admin/roles/:id` (GET/PUT/DELETE) |
| `auth.ts` (+ `loginFn` in `routes/login.tsx`, `getSessionFn` in `routes/_authed.tsx`) | loginFn, logoutFn, getSessionFn | `auth.rs`. ✅ `loginFn` and `logoutFn` call Rust's `sign-in/email` / `sign-out` and relay its `Set-Cookie`; both `getSessionFn`s read `GET /api/auth/session` |
| `admin-builder.ts` | nlBuildPreview, nlSaveReport, nlSaveChart, nlBuilderListDataSources | `nl_builder.rs`. ✅ all four forward (`POST /api/nl-builder/{preview,save-report,save-chart}`, `GET /api/nl-builder/data-sources`). The preview's prompt is Node's to the byte (context from similar queries, role stats and the knowledge graph), and its query is gated (D-35) |
| `routes/share/{report,chart,dashboard}/$id.tsx` | the public share pages' loaders | `share.rs`. ✅ forward to `GET /api/share/:kind/:id`, no session, `is_public` rows and named columns only |
| `routes/_authed/dashboard.tsx` | getDashboardStatsFn | `share.rs`. ✅ forwards to `GET /api/dashboard/stats` (D-37) |
| `nl-query.ts`, `openkb.ts`, `charts.ts`, `dashboards.ts`, `filters.ts`, and the uncalled functions in `reports.ts`, `data-sources.ts`, `sql.ts` | | no callers anywhere in `src/`, so nothing to forward. They stay in the tree with the Node backend |

The forwarder keeps the server function's current return shape, so no React
component changes during the migration. It is implemented
(`src/lib/api/backend.ts`): with `ERS_RUST_API_URL` set, a forwarded server
function calls its REST twin with the caller's cookie, and unset it runs its
Node body unchanged.

### 6.3 Background work

| Node | Trigger today | Loco |
|---|---|---|
| `report:generate` → `generateReport` | Trigger.dev task / `scheduled:refresh` | `workers::ReportWorker` (pg queue) |
| `data:export` → `exportQueryData` | Trigger.dev task | `workers::ExportWorker` |
| `email:batch` → `sendEmailBatch` | Trigger.dev task | `workers::EmailBatchWorker` (lettre via Loco mailer) |
| `monitoring:evaluate` → `executeMonitoringEvaluation` (retry 3×, backoff 5 s→60 s) | Trigger.dev schedule / on-prem cron | `workers::MonitoringEvaluateWorker`, retries in the worker |
| On-prem cron runner (`setInterval` 60 s): due monitoring rules + due `nl_report_definitions` | `worker-runner.ts` when `TRIGGER_API_URL` unset | `scheduler` job `* * * * *` → `task cron_tick` → enqueues the workers |
| `report-cleanup.ts` | cron | `task report_cleanup` on the scheduler |
| Knowledge-graph init and sync (`graph-init.ts`, `sync.ts`), run at server start | `src/server.ts` | at `start`, in the background (`graph/`), and `task sync_knowledge_graph [llmtext:path]` by hand. With Rust as the backend, `src/server.ts` no longer runs it |
| `job_definitions.schedule_cron` | nothing: no Node code reads it | not fired by Rust either. Porting a scheduler Node never ran would change behaviour, not preserve it |
| Scheduled `nl_report_definitions` → `executeReportGeneration` | on-prem cron runner | `cron_tick` enqueues `workers::ReportGenerationWorker` (`report-generation:execute`) |

**Queue backend:** Loco's Postgres queue (`queue.kind: Postgres`) in the same
PostgreSQL. No Redis. `WORKER_CONCURRENCY` maps to `num_workers`.

**Exactly-once per minute:** Node's runner holds no lock, so two app replicas
both fire. Before enqueueing anything, `cron_tick` claims the minute with
`INSERT INTO ers_cron_ticks (minute) … ON CONFLICT DO NOTHING`. A second
scheduler replica, or a re-run of the same minute, finds the row already there
and does nothing (§9, D-1).

**Cut-over note for cron:** `cron_tick` now does all three of the Node
runner's duties: due monitoring rules, due scheduled NL reports, and the 02:00
UTC artifact cleanup. The Node runner has no switch to turn one of them off. So
on any one installation, run **either** the Node runner **or** the Rust
scheduler, not both, or rules and reports fire twice.

**`JOB_OUTPUT_PATH` must be absolute when both backends run.** Each resolves a
relative path against its own working directory (the repository root for Node,
`rust/` for Loco), so a file one writes is not where the other looks.

---

## 7. Phases

Every phase ends with: `cargo fmt --check`, `cargo clippy -D warnings`,
`cargo test` (unit + DB integration), and `parity/run.ts` green for every
endpoint the phase moved. nginx routing for an area flips only after that.

| Phase | Content | Exit criteria |
|---|---|---|
| **0: Foundation** ✅ done | Loco skeleton, config from env, baseline migration (bootstrap DDL), row→JSON converter, envelopes, pagination, AES compat, cookie-session auth, SQL validator, table extraction, ds-rbac, `decideQueryRun`, cron matcher, threshold engine | Unit tests for every §5 invariant; Node↔Rust crypto round-trip; a Node-issued cookie resolves in Rust |
| **1: Read-only list/detail** ✅ initial set done | GET list/detail for queries, reports, charts, dashboards, jobs, notifications, data sources, monitoring rules; `reports/:id/data` against user DBs | Parity green across a seeded DB for page 0..n, search, 401s, 404s |
| **2: Writes (CRUD)** ✅ done | POST/PUT/DELETE for queries, reports, charts, dashboards, widgets, filters, report/chart filters; logs, help | Parity on write → read-back; audit_log rows equal modulo id/time |
| **3: SQL and data sources** ✅ done (PostgreSQL only) | `sql/execute` (with `validateQueryAccess`), validate, schema introspection + metadata sync, data-source create/get/update/delete/test/inspect/entities/usage/active, metadata entities and fields, schema instructions, SSRF guard on every stored or tested target, IPv4 resolution and `ssl.servername`. MySQL, SQL Server and SQLite upload are out of scope (§1). `ds_schema_cache` is written by the NL schema store, so it moves with Phase 5 | Parity against the pg fixture; RBAC deny matrix identical |
| **4: Workers and cron** ✅ done | Report/export/email workers, `cron_tick`, report cleanup, job_definitions schedules, report-generation endpoints, SMTP settings | Artifact byte-equality for CSV; row equality for XLSX; replay of a week of cron minutes gives the same fired set as Node |
| **5: Monitoring and NL** ✅ done (HTTP routes; see §6.1 for what stays on Node) | Monitoring rules CRUD + evaluation + alert dispatch; NL query and ADK proxied to Mastra; voice WS | Threshold engine table tests; NL endpoints parity with a stubbed Mastra |
| **6: Auth and admin** ✅ done (see §7.1 for the Playwright suite) | Sign-in/out, session issuing, password change (writes `auth_accounts`, deletes other sessions), rate limit, admin users/roles | Sessions issued by Rust are accepted by Node and the reverse; the Playwright suite passes against Rust |
| **7: Retire Node backend** ✅ first half done: Rust is the backend, Node's API is disabled but present | Every remaining route and every called server function ported; server functions stay as forwarders; `src/server.ts` proxies `routes.json` to Loco in production, 404s the rest of `/api/` (bar the CopilotKit runtime) and starts no workers, cron or graph sync; `rust/Dockerfile` and a `backend` service in `docker-compose.yml`. **Deferred:** deleting `src/routes/api`, `src/lib/jobs` and the Trigger.dev config, and moving schema ownership to Loco migrations: the Node backend stays so the two can still be compared | One release with Node API routes disabled but present, then delete |

---

### 7.1 Status at this commit

Phases 0 to 6 are done, and Phase 7 up to deleting the Node backend, which is kept for comparison. Rust serves every `/api/` route the application calls except the CopilotKit runtime, and every server function with a caller forwards to it. Verified against one PostgreSQL 16 config
database, with Node (`bun --bun vite dev`) and Rust (`start
--server-and-worker`) running side by side:

| Check | Result |
|---|---|
| `cargo fmt --check`, `cargo clippy --all-targets -D warnings` | clean |
| `cargo test`: 124 tests covering the §5 invariants, the review regressions, record-link and zod-message ports, the SQL validator's warnings, SQL-editor paging and type inference, the network-target ranges, config redaction, the XLSX/PDF writers, chart scaling, the hash embedding, the RBAC snapshot's column check, the Better Auth cookie signature (checked against a Node-issued cookie), the sign-in schema messages, the rate limiter's sliding window, the email pattern, the route-table check, and (Phase 7) the report-builder's validation messages, JSON extraction from model output, cron normalisation, Cypher literal inlining, the graph-context formatter and `Date#toString`. One needs PostgreSQL | all pass |
| Cron matcher vs the Node matcher's own code: 132 expression/zone cases × 4,440 minutes (DST change, Feb 29, unknown zone, malformed fields) | identical |
| Node-produced ciphertext decrypted by Rust | passes |
| `parity/run.ts`: 279 HTTP cases. Covers reads, and writes with read-back of the rows they changed. Also 401/404/422 and RBAC as admin and analyst, SQL-editor paging over every column type in the fixture, connection tests, monitoring-rule CRUD and actions, jobs, SMTP settings, report generation, the admin routes and `/api/auth/permissions`, plus Rust-only cases for the server-function twins and for D-13, checked against expected responses | 255 identical, 24 documented (D-4, D-10, D-12, D-14, D-16 to D-20, D-24, D-25, D-27, D-31), 0 failures |
| `parity/auth.ts`: 33 Better Auth cases (sign-in in JSON and form encoding, "don't remember me", callback URLs, every validation and media-type refusal, the CSRF and origin checks, the rate limit's 429, `get-session` fresh, day-old, don't-remember, expired and forged, sign-out) comparing status, body, `Set-Cookie` attributes and the `auth_sessions` row. Then a session issued by each backend is used and signed out on the other | 32 identical, 1 documented (D-30), 0 failures; cross-backend sessions work both ways |
| `parity/admin-fns.ts`: 29 checks of the Rust-only twins of `admin.ts` and `getSessionFn` against what the Node functions return, throw and write (audit rows included), and D-28, D-30, D-32, D-33 | 29/29 |
| The login page on a Vite server with `ERS_RUST_API_URL` set, driven by Playwright: the form, the dashboard, the admin users and roles screens (creating a role through the screen), sign-out | the session row is Rust's (the browser's user agent, seven days), every `/api/auth` and `/api/admin` call carries `x-ers-backend: loco-rs`, and sign-out removes the row and the cookie. Screenshots in `rust/docs/screenshots/20-25` |
| `parity/nl-query.ts`: 34 cases over NL history, schema, execute, RAG store/context and voice, with the hash-embedding fallback and no speech servers | 33 identical, 1 documented (D-26), 0 failures |
| `parity/monitoring.ts`: 8 rules × every row written (execution, rule counters, notifications, audit) | 8/8 identical (ESCALATE, BREACH, PASS, NO_DATA ×2, SKIPPED, RBAC_DRIFT) |
| `parity/report-csv.ts`: `report:generate` and `data:export` in CSV, XLSX and PDF | CSV byte-identical; XLSX cell-for-cell and PDF text equal (D-22); timestamp/JSON columns differ as documented (D-3) |
| `parity/report-export.ts`: `reports/:id/export` in every format, themed and unthemed, and the refusals | 11 equivalent, 2 documented (D-3, D-4) |
| `parity/email-batch.ts`: `email:batch` into two SMTP sinks, CSV/XLSX/PDF attachments | 5/5: every message, attachment and audit row equal |
| `parity/nl-report.ts`: scheduled NL reports through `report-generation:execute` | 6 equal, 1 documented (D-2: Node let an analyst's scheduled report read `hr_salaries`) |
| `parity/log-search.ts`: similarity search over Node-written vectors | identical, similarity values included |
| `cron_tick` → Postgres queue → `monitoring:evaluate` worker; a second tick for the same minute | runs once; the second tick is a no-op |
| `parity/phase7.ts`: 36 cases over the Phase 7 routes against a stub model server (`parity/llm-stub.py`, which records every request so the prompts themselves are compared): the report-builder dry run and create, ADK analyze-intent (supervisor and fallback), CopilotKit transcribe/tts/threads, upload, and the NL schema cache Node and Rust write | 34 identical, 2 documented (D-27, D-35) |
| `parity/phase7-fns.ts`: 18 checks of the Rust-only twins of `admin-builder.ts`, the share loaders and the dashboard stats against what the Node functions return and write. The NL builder's context prompt is compared with the output of Node's own `buildMastraContextPrompt` and `formatGraphContext`, imported and run against the same databases | 18/18 |
| Knowledge graph: Node's and Rust's sync of the same config DB into Apache AGE | the same vertices and edges, bar D-38 |
| Production mode: `bun run build`, then `server-static-wrapper.mjs` (the image's `CMD`) with `ERS_RUST_API_URL` set, driven by Playwright: sign-in, dashboard, reports, charts, roles, sign-out, a public share page | every `/api/` response but the CopilotKit runtime's carries `x-ers-backend: loco-rs`; Node's log shows no worker, cron or graph start; `sign-up/email` and `voice/ws` are 404s. Screenshots `26-30` |
| The TanStack Start frontend with `ERS_RUST_API_URL` set, every route in `routes.json` answered by Loco | reports, charts, dashboards, queries, jobs, logs, help and notifications screens load from Rust (responses carry `x-ers-backend: loco-rs`) |

**What Rust serves** is exactly `rust/routes.json`: 143 method + path pairs. A
unit test fails if it and the router ever disagree. That file is what the dev
proxy routes (`ERS_RUST_API_URL`, `vite.config.ts`) and what the production
server routes (`src/server.ts`), both through `src/lib/api/rust-routes.ts`.

**Workers and tasks:** `monitoring:evaluate` (email, in-app and webhook
alerts), `report:generate` and `data:export` (CSV, XLSX, PDF), `email:batch`,
`report-generation:execute` (scheduled NL reports, with the RBAC-drift and
column checks and native charts), `cron_tick` (rules, NL reports, 02:00
cleanup), the knowledge-graph init and sync at start, and the tasks
`evaluate_rule`, `generate_report`, `email_batch`, `generate_nl_report`,
`report_cleanup` and `sync_knowledge_graph` for running one by hand.

**Rust is the backend** when `ERS_RUST_API_URL` is set, in development and
in production alike. `src/server.ts` (the production entry) then proxies every
`routes.json` route to Loco, answers any other `/api/` path with a 404 except
the CopilotKit runtime (`/api/copilotkit`), and starts none of Node's
background work: the cron runner, the job workers and the knowledge-graph
sync all run in Loco, and running both would fire every monitoring rule
twice. `docker-compose.yml` runs Loco as the `backend` service
(`rust/Dockerfile`, `start --all`) and points the `app` at it. Unset
`ERS_RUST_API_URL` and the Node backend runs exactly as before, which is
how the parity suites compare the two.

**Stays in the TanStack server:** the CopilotKit runtime (`/api/copilotkit`),
a JavaScript library's streaming protocol that touches no data and proxies
to Mastra; the Mastra server itself (`mastra/`), an AI sidecar rather than
part of this backend. **Not ported:** `voice/ws` (P-18) and the Better Auth
paths this application never calls (sign-up, which D-34 closed, password
reset, email verification, OAuth).

**Deferred, on purpose:** deleting `src/routes/api`, `src/lib/jobs` and the
Trigger.dev config, and giving Loco's migrations the schema. The instruction
for this port was to keep the Node backend so the outputs can be compared,
and the parity suites need it. When it goes, `bootstrap.ts` stops being the
schema's source and `parity/extract-baseline.ts` with it.

**Not run against Rust yet:** the Playwright suite. `e2e/global-setup.ts` signs
in as `admin@admin.com` / `admin`, and the parity database seeds a different
password, so the suite needs its own database to run as the plan's exit
criterion intends. The sign-in path it exercises is covered above: the real
login form, through Rust, in a browser.

**Sessions and the rate limit during cut-over.** A session issued by either
backend opens the other, and signing out on either ends it on both, because
both read and write the same `auth_sessions` rows with the same signature.
The rate limit does not share state: each process counts its own sign-ins.
Route `/api/auth/*` to one backend at a time, and forward the client address
(`X-Forwarded-For`, a single value) from the proxy in front, or every client
shares one bucket. Like Better Auth, Rust believes a single-value
`X-Forwarded-For`, so its port must be reachable only through that proxy: a
client that can reach it directly can name a new address on every attempt.

**Embedding and speech servers:** the RAG and voice routes call the same
OpenAI-compatible endpoints Node does (`AI_EMBEDDING_BASE_URL` /
`LLAMA_EMBEDDING_URL`, `LLAMA_STT_URL`, `LLAMA_TTS_URL`). Parity covers the paths
without those servers (hash embeddings, "unavailable" answers). With a live
embedding server the vectors are whatever the server returns, the same for
both backends.

**`llmtext/` does not exist** in this repository, whatever CLAUDE.md says, so
neither backend's graph sync imports it. `task sync_knowledge_graph
llmtext:<path>` imports one when there is one.

## 8. Parity harness (`rust/parity/`)

`bun rust/parity/run.ts` does the following:

1. Signs in once through Better Auth on the Node server, which yields one
   cookie. That cookie is valid for both backends (§4.2).
2. For each case in `cases.json` (method, path, body, pagination and search
   variants, and unauthenticated variants), it calls both
   `NODE_URL` (default `http://localhost:4050`) and `RUST_URL` (default
   `http://localhost:5150`).
3. It compares status codes and JSON bodies after normalising only the
   volatile fields listed per case (`timestamp`, generated `id`s).
4. It prints a diff per mismatch and exits non-zero if anything differs.

Write cases carry `reset` SQL, which runs before **each** backend's request so
both start from the same rows, and `check` SQL, whose result rows are compared
alongside the response (`cleanup` restores the fixture afterwards). A route
only Rust has (a server function's REST twin) carries `expect` and
`expectRows` instead of a Node call. Sessions are cached in
`parity/.session-cache.json` (gitignored). Sign-in is rate-limited to 5 a
minute, and a suite that signed in on every run would lock itself out.

---

## 9. Known differences, all written down

Two kinds. **P-n**: Node behaviour that Rust copies on purpose, so the
responses match. Each is fixed later in both backends in the same change.
**D-n**: places where Rust deliberately does **not** match Node, because
copying would mean copying a security gap or a plain bug. The parity suite
marks D-n cases `"known"`, so they are reported rather than failed.

| Id | Behaviour | Where |
|---|---|---|
| P-1 | `reports/:id/data` skips pagination when the stored SQL contains `LIMIT n` | `controllers/reports.rs` |
| P-2 | `page`/`pageSize` are not validated in Node, and a NaN or negative value 500s. Rust falls back to the default or clamps. The parity cases avoid these values until both backends are fixed | `common/pagination.rs` |
| P-3 | The reports/charts/dashboards/saved-queries lists do not filter `is_deleted` or ownership. Jobs do filter `is_deleted` | controllers |
| P-4 | The monitoring-rules list reports `total` over **all** rules, ignoring the status and ownership filters of the page it returns | `controllers/monitoring.rs` |
| P-5 | `/api/data-sources` is unpaginated (`meta.total` = the length returned). It is bounded by configuration, not user data, but still breaks the pagination rule | `controllers/data_sources.rs` |
| P-6 | `/api/notifications` returns `[]` for everyone. The real reads are server functions, which move in Phase 2 | `controllers/notifications.rs` |
| D-1 | A second scheduler replica is a no-op (minute claimed in `ers_cron_ticks`). Two Node replicas both fire | `tasks/cron_tick.rs` |
| D-2 | The monitoring, report, export, email-batch and NL-report **workers** gate stored SQL on `decideQueryRun` (the rule owner / the requesting user; for `email:batch`, the recipient query too). The Node workers run it unchecked, against CLAUDE.md's "every path that executes SQL": a scheduled NL report let an analyst read `hr_salaries`. The Node fix is to call `decideQueryRun` in the five workers | `workers/*` |
| D-3 | CSV cells for timestamps, dates and JSON are ISO strings and JSON text. Node writes `Date#toString()` (dropping milliseconds and the time zone offset) and `[object Object]` | `workers/output.rs` |
| D-4 | `SELECT * FROM(t)` is refused as unanalysable. PostgreSQL itself rejects this syntax. Node's parser accepts it, so Node denies it table by table for non-admins and forwards it to the database for admins | `sql/tables.rs` |
| D-5 | Every route checks `users.is_active` when resolving a session. In Node only the routes that use `verifySession` do, and the Better Auth `getSession` path does not. Rust's `sign-in/email` and `get-session` check it too (D-30) | `auth/session.rs` |
| D-6 | The session cookie's HMAC signature is verified. Node's `verifySession(token)` path skips the check (Better Auth's `getSession` path checks it) | `auth/session.rs` |

| D-7 | User SQL runs in a read-only transaction that is always rolled back. The database refuses any write the analyser misses, and session settings a statement changes do not outlive it. Node runs user SQL on a plain read-write pooled connection | `datasources/connection_manager.rs` |
| D-8 | Column restrictions apply to every column the statement references, however it is written, and `*` is refused. Node checked only `table.column` spellings, so `SELECT salary FROM hr` read a restricted column | `permissions/query_access.rs` |
| D-9 | A `delta_pct` beyond `DECIMAL(8,4)` is stored as NULL. In Node that insert failed after the alerts had gone out, so the evaluation was never recorded. Only the read-only half of an evaluation is retried; Node's task retry re-ran the whole evaluation and re-sent alerts | `workers/monitoring_evaluate.rs` |
| D-10 | **Security, fix in Node too.** CTE names resolve by scope: `WITH hr AS (SELECT * FROM hr) SELECT * FROM hr` is checked against `hr`. Data-modifying statements are refused anywhere in the tree (`WITH d AS (DELETE …) SELECT …`, `SELECT … INTO`, DML under `EXPLAIN`). Node's `extractTablesStrict` drops every CTE name from the table list, whatever its scope, and `isReadOnlyQuery` looks only at the leading keyword. Both queries pass Node's checks with a select grant on some other table | `sql/tables.rs` |
| D-11 | The webhook SSRF guard parses the URL with a WHATWG parser and also checks every address the host resolves to | `monitoring/alerts.rs` |

| D-12 | Report, chart and dashboard writes (PUT/PATCH/DELETE, widgets) need the creator or an admin: Node's `canConfigureReport` rule, applied to every write. Node applies it to report filter links only, so any signed-in user can rewrite or delete anyone's report, chart or dashboard | `permissions/ownership.rs`, `controllers/owned.rs` |
| P-7 | `GET /api/logs` applies `offset` twice (in SQL and again to the merged list), so pages after the first are short or empty, and `totalCount` counts what was fetched | `controllers/logs.rs` |
| P-8 | `GET /api/data-sources/:id/usage` is a stub that returns zeros for any live data source, and zeros with `success: true` on an error too. `DataSourceService.getUsageInfo` has the real counts and nothing calls it | `controllers/data_sources.rs` |
| P-9 | `DELETE /api/metadata/entities/:id` deletes the header and leaves its `metadata_entity_field` rows behind: the table has no foreign key and nothing cascades | `controllers/metadata.rs` |
| D-13 | **Node never answers a failing SQL-editor query.** When the database rejects a statement, `/api/sql/execute`'s catch block calls `request.json()` again on a body it has already read; that throws inside the handler and no response is sent (none after 200 s in testing). The request's connection to the user database also appears to stay checked out. Rust returns the intended `500 EXECUTION_ERROR` carrying the database's message. The Node fix is to read the body once, before the `try` | `controllers/sql.rs` |
| D-14 | `sql/validate` returns no `ast` and no `formattedSQL` (the SQL editor reads neither), and syntax errors carry `sqlparser`'s wording and position rather than `node-sql-parser`'s. Warnings, `isValid` and the envelope match | `sql/validate.rs` |
| D-15 | Editing a data source without a password keeps the stored one. The edit form sends no password unless one is typed ("Leave empty to keep current"), and Node stores the config as sent, so every edit that did not retype the password wiped it | `controllers/data_sources.rs` |
| D-16 | **Security, fix in Node too.** `GET /api/data-sources/:id` returns the decrypted connection config, **password included**, to any signed-in user. Rust returns the config only to the creator or an admin, with the password removed and a connection string's password masked. The edit form does not read this route | `controllers/data_sources.rs` |
| D-17 | **Security, fix in Node too.** Creating a data source needs `data_source:create`, the same permission the connection test asks for, and every stored or tested config goes through the network-target check (a connection string's host included, and every host a config names: a public `host` beside a private connection string is refused). The check runs when a config is stored or tested, not at each connection (§11). Node checks the target only on the test route and only for `host`, and lets any signed-in user create a data source. Without both, create → inspect or `sql/schema` is the same internal-network probe the test route guards against | `controllers/data_sources.rs` |
| D-18 | `/api/data-sources/active` (GET and POST) omits `connection_config`. Node returns the stored ciphertext, which no caller reads. GET also orders by name, so "the first active data source" is stable; Node takes the first row of an unordered select | `controllers/data_sources.rs` |
| D-19 | Metadata writes need a permission: `metadata_entity:edit` (or `:admin`) to update an entity or its fields, `metadata_entity:admin` to delete an entity. Node defines these checks (`MetadataPermissions`) and never calls them from the routes, so any signed-in user can rewrite or delete metadata | `controllers/metadata.rs` |
| D-20 | `fields/batch` accepts each update nested (`{ id, data: {…} }`, the shape Node's own type declares) as well as flat. Node reads the fields from the top level only, so a nested update changes nothing but `updated_at` and still reports success | `controllers/metadata.rs` |
| D-21 | `saveFieldInstruction` / `saveTableInstruction` ask `isAdmin(userId)`. Node reads `users.is_admin`, a column that does not exist, so it refuses every caller, administrators included, and schema instructions cannot be saved at all | `controllers/schema_instructions.rs` |
| P-10 | `settings/email`: `verify` only checks that the SMTP variables are set, and `test` never sends: it answers "not configured" whatever the configuration | `controllers/settings.rs` |
| P-11 | Report export: a colour the report theme does not set falls back to light grey everywhere, text included, so an unthemed XLSX or PDF has grey-on-grey cells | `controllers/report_export.rs` |
| P-12 | Deleting a report-generation definition leaves its artifacts and their files. Only the retention cleanup removes them | `controllers/report_generation.rs` |
| P-13 | `logs/search` finds nothing on a real installation: nothing in either backend writes `logs.message_vector`. `parity/log-search.ts` seeds vectors itself to compare the ranking | `controllers/logs.rs` |
| P-14 | The NL pipeline builds its `nl_query_history` insert and updates and never calls `.execute()`, so nothing is recorded. Rust records nothing either | `controllers/nl_query.rs` |
| P-15 | The admin server functions validate every id as a UUID (`uuidSchema`), and the seeded ids are not UUIDs (`1aa00cc2…`, `admin-role-id`, `role_admin`), so the seeded admin cannot be edited, change their own password, or be given a seeded role through them. The Rust twins accept any id; the forwarding functions still run Node's schema first, so the combined behaviour is Node's | `server-fns/admin.ts` |
| P-16 | `GET /api/admin/users` is unpaginated: every user, every time. `listUsers` is the paginated one | `controllers/admin.rs` |
| P-17 | `/api/admin/logs-permissions` fails on every call: `app_settings` is in no schema (`bootstrap.ts` does not create it, whatever CLAUDE.md's table list says). Were it there, `GET` would still answer `true` whatever it held (`value === "true" \|\| true`) | `controllers/admin.rs` |
| D-22 | XLSX and PDF files are equivalent, not byte-identical: same sheets, cells, values, widths and colours; same text, pages and table layout. `rust_xlsxwriter` stores a column width with Excel's 5-pixel padding (`w + 0.7109375`), and an empty string as a blank cell. The PDF writer is hand-rolled (Helvetica, WinAnsi). The worker PDFs wrap long cells rather than reproducing jsPDF-autotable's exact column split. `parity/compare.ts` compares by content | `render/*` |
| D-23 | Charts in generated NL reports are drawn natively (PDF vectors, an XLSX chart sheet) rather than rendered by ECharts. Same data, series, categories and axis scale; not the same pixels | `reportgen/chart.rs` |
| D-24 | Report generation recognises admins. Node's admin test reads `.name` from each session role, but session roles are strings (`SessionUser.roles: string[]`), so the test is always false: an admin's list shows only their own definitions, and opening anyone else's is a 403. Rust applies the same name rule (`admin`, `administrator`, `admin…`) to the role strings. The list also applies `since` / `titleLike` to the rows as well as `total`. Node filters only the count, so the page and its total disagree | `controllers/report_generation.rs` |
| D-25 | **Security, fix in Node too.** Changing, running or deleting a report-generation definition, and listing its artifacts, needs its creator or an admin, the rule Node's `GET` of a definition already applies. Node's `PATCH` (including `?action=run`), `DELETE` and the artifact list by definition id check only for a session, so any signed-in user can rename, reschedule, re-point the recipients of, run or delete anyone's scheduled report, and list its artifacts | `controllers/report_generation.rs` |
| D-26 | **Security, fix in Node too.** `nl-query/execute` runs the client's `generated_sql` only when it is one read-only statement whose tables the caller may read, inside the read-only transaction (D-7). Node checks table access only and appends `LIMIT` unless the text contains the word "limit" anywhere, so an analyst with `select` on `orders` can commit `UPDATE orders … -- limit` through this route. That was reproduced against the parity fixture | `controllers/nl_query.rs` |
| D-27 | Schema introspection returns an index's `columns` as an array. Node returns PostgreSQL's array literal as a string (`"{a,b}"`), because node-pg has no parser for `name[]`. Its own type says `string[]` | `datasources/introspection.rs` |
| D-28 | Creating a user writes its `auth_accounts` credential, so the user can sign in at once. Node's `createUser` writes only `users.password_hash`, which Better Auth never reads; the account cannot sign in until the next restart's `bootstrapSchema` copies the hash across | `controllers/admin.rs` |
| D-29 | **Security, fix in Node too.** Sign-in is rate-limited on the path the login page uses. Better Auth limits only its HTTP router; `loginFn` calls `getAuth().api.signInEmail` in process, which skips the limiter entirely: eight wrong passwords in a row through that call all come back 401, none 429. With `ERS_RUST_API_URL` set, `loginFn` calls Rust's HTTP route, which applies Better Auth's rules (5 a minute per address and path), and passes the client's address along so the budget is per client, not per Vite server | `controllers/auth.rs`, `routes/login.tsx` |
| D-30 | A deactivated account (`users.is_active = false`) cannot sign in, and `get-session` does not return its sessions. Better Auth never reads `is_active`, so on Node a deactivated user signs in and uses every route that resolves the session through Better Auth (D-5) | `controllers/auth.rs` |
| D-31 | `/api/auth/permissions` returns the resource grants of the caller's own roles (all grants for an admin). Node returns every role's grants to anyone signed in, and `usePermissions` then honours a grant that belongs to another role when it decides what the UI offers | `controllers/auth.rs` |
| D-32 | Changing your own password keeps the session you changed it from and ends the others, as CLAUDE.md describes it. Node's `changePassword` deletes every session of the user, the caller's included | `controllers/admin.rs` |
| D-33 | `POST /api/admin/roles`, `PUT`/`DELETE /api/admin/roles/:id` and `GET`/`POST /api/admin/roles/:id/permissions` exist. The roles screen calls all five; Node has only `GET /api/admin/roles`. Its `POST` answers with the HTML app shell and a 200, so the screen reports "Role created successfully" and nothing is saved; the others are 404s. Creating a role through the screen was checked in a browser against Rust | `controllers/admin.rs` |
| D-34 | **Security. Fixed in Node too** (`disableSignUp: true`; sign-up now answers `400 EMAIL_PASSWORD_SIGN_UP_DISABLED`). Better Auth's `POST /api/auth/sign-up/email` is live on Node (`emailAndPassword` without `disableSignUp`): anyone who can reach the server creates an active account and gets a session back. It has no roles, but every Node route that asks only for a session is open to it (the report-generation writes of D-25, for one). Rust does not serve sign-up; the fix is `disableSignUp: true` in `better-auth.ts` | not ported |
| D-35 | **Security, fix in Node too.** The report-builder's dry run (`POST /api/report-generation/definitions`) and the NL builder's preview (`nlBuildPreview`) run the SQL the model wrote against the user database with no access check, so the model decides what a caller reads. An analyst asking the dry run for salaries got `hr_salaries`' names and salaries back from Node in testing. Rust gates both on `decideQueryRun` and runs them in the read-only transaction (D-7); a refusal is a 403 (dry run) or `success: false` (preview) | `controllers/report_generation.rs`, `controllers/nl_builder.rs` |
| D-36 | The NL builder gives the model the data source's real schema. Node's `getSchemaMetadata` calls `connection.raw`, which Kysely does not have, so it throws, is caught, and the model is always given an empty schema. Rust runs the information-schema query it meant to (cached for an hour, as Node's cache would) | `nlquery/agents.rs` |
| D-37 | **Security, fix in Node too.** `GET /api/dashboard/stats` needs a session. Node's `getDashboardStatsFn` has no check, so anyone who can reach the server reads every table's row count and the latest audit-log entries | `controllers/share.rs` |
| D-38 | The knowledge graph marks primary-key columns (`is_pk`). Node's sync reads `is_pk` from a column list that never carries it, so every column is `is_pk: false` | `graph/sync.rs` |
| P-18 | `voice/ws` is dead: under TanStack Start it answers the WebSocket handshake with plain HTTP, it takes the user id from the client's message rather than the session, and nothing in the frontend opens it. Not ported; a 404 with Rust as the backend | not ported |
| P-19 | `POST /api/data-sources/upload` checks the file's extension, answers 201 and stores nothing | `controllers/share.rs` |

Found while porting, with no behaviour to copy: `src/lib/monitoring/threshold-engine.ts`
defines a second threshold evaluator with different escalation rules, and
nothing imports it. The worker's own `evaluateThreshold` is the one that runs,
and it is the one ported.

## 10. Running both side by side

```bash
# Node (existing)
bun --bun vite dev                                  # :4050

# Rust
cd rust
cp .env.example .env                                # same DATABASE_URL / AUTH_SECRET / ENCRYPTION_KEY as Node
cargo run -- start --server-and-worker              # :5150 (LOCO_PORT / PORT)
cargo run -- scheduler                              # cron driver (or: start --all)

# Compare
bun parity/run.ts

# The frontend against Loco: every route in rust/routes.json goes to Rust
ERS_RUST_API_URL=http://localhost:5150 bun --bun vite dev

# Production: the same switch, in src/server.ts
bun run build && ERS_RUST_API_URL=http://localhost:5150 bun server-static-wrapper.mjs

# Docker: docker-compose.yml builds rust/ as the `backend` service and sets
# ERS_RUST_API_URL=http://backend:5150 on `app`
docker compose up -d backend app
```

Both processes need identical `AUTH_SECRET` (cookie signatures) and
`ENCRYPTION_KEY` (data-source configs). A mismatch looks like "signed out" or
"data source cannot be opened", the same failure modes CLAUDE.md warns about.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| JSON type drift (int8/numeric/timestamps) breaks the UI subtly | §4.4 converter and parity on every list endpoint |
| Cron semantic drift fires monitoring at different minutes | Port the matcher, not a library; replay test |
| Better Auth changes its cookie format on upgrade | Pin `better-auth` (1.7.3 is what Rust reproduces); the Rust unit test checks a Node-issued cookie, and `parity/auth.ts` checks sessions cross both ways. Re-run both on any upgrade, until Phase 7 removes the Node side |
| SQL table extraction differs from `node-sql-parser` | Deny on any parse failure; corpus test of every `saved_queries.sql_content` through both extractors before Phase 3 cut-over |
| Schema drift while two services own it | §2.2: DDL only in the baseline SQL, generated from `bootstrap.ts` |
| DNS rebinding past the network-target check | The check runs when a config is stored or tested, not at each connection, so a hostname repointed at a private address later is connected to. Node has the same gap. Enforcing it at connect time would break every installation whose database is on a private (Docker) network unless it sets `DATA_SOURCE_HOST_ALLOWLIST`. The fix is to pin the checked address, or to check at connect time behind that allowlist, decided together with Node |
| MySQL / SQL Server data sources after cut-over | Out of scope (§1): Rust refuses to test or inspect them. An installation that uses them keeps `data-sources/test`, `…/inspect` and `sql/*` routed to Node, or does not cut those areas over |
