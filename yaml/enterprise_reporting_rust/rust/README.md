# ers-backend: the Loco.rs port of the Enterprise Reporting backend

The Rust replacement for the Node server side (API routes, server functions,
Trigger.dev workers and the on-premise cron runner). It runs **beside** the
Node service against the **same** PostgreSQL config database and accepts the
**same** Better Auth session cookie, so the two can be compared response by
response. With `ERS_RUST_API_URL` set, it **is** the backend: the TanStack
Start server proxies the API to it and starts no workers of its own.

- **The plan:** [`MIGRATION_PLAN.md`](MIGRATION_PLAN.md) covers scope, phases, the
  compatibility contracts (§4), the security invariants (§5) and every known
  difference from Node (§9).
- **What is ported:** every `/api/` route the application calls except the
  CopilotKit runtime, every server function that has a caller, all workers,
  the cron runner and the knowledge-graph sync (§7.1). The Node backend stays
  in the tree, disabled, for comparison. The exact set of routes Rust serves
  is [`routes.json`](routes.json).
- **User data sources: PostgreSQL only.** MySQL and SQL Server are out of scope
  (MIGRATION_PLAN.md §1).

## Run it

```bash
cp .env.example .env         # same AUTH_SECRET / ENCRYPTION_KEY / DATABASE_URL as Node
cargo run -- start           # HTTP API on :5150
cargo run -- start -s        # API + queue workers in one process
cargo run -- start --worker  # queue workers only
cargo run -- scheduler       # cron driver: runs `cron_tick` every minute
cargo run -- start --all     # all three in one process (development)
```

The baseline migration runs the DDL of `src/lib/db/bootstrap.ts` (all
`IF NOT EXISTS`), so it is safe against a database Node already bootstrapped,
and either service can boot first. Regenerate it after changing bootstrap.ts:

```bash
bun rust/parity/extract-baseline.ts
```

### Tasks

| Task | What it does |
|---|---|
| `cargo run -- task cron_tick [at:<RFC3339>] [dry_run:true]` | Enqueues the monitoring evaluations due this minute (the scheduler runs it every minute) |
| `cargo run -- task evaluate_rule rule_id:<id>` | Evaluates one monitoring rule now and prints the outcome |
| `cargo run -- task generate_report report_id:<id> user_id:<id> [format:csv]` | Runs `report:generate` now |
| `cargo run -- task email_batch query_id:<id> template_id:<id> recipient_query_id:<id> column:<email column> user_id:<id> [format:csv] [report_name:<name>]` | Runs `email:batch` now |
| `cargo run -- task generate_nl_report id:<id> [triggered_by:manual]` | Runs a scheduled NL report definition now |
| `cargo run -- task report_cleanup` | Deletes NL report artifacts older than `REPORT_ARTIFACT_RETENTION_DAYS` (default 90); `cron_tick` runs it at 02:00 UTC |
| `cargo run -- task sync_knowledge_graph [llmtext:<path>]` | Creates the Apache AGE graph if needed and syncs every data source's schema and the config metadata into it (`GRAPH_DATABASE_URL`); `start` does this in the background |

### The frontend on the Loco backend

```bash
ERS_RUST_API_URL=http://localhost:5150 bun --bun vite dev   # development, from the repo root
bun run build && ERS_RUST_API_URL=http://localhost:5150 bun server-static-wrapper.mjs  # production
docker compose up -d backend app                            # Docker: rust/Dockerfile as `backend`
```

Every method + path in `routes.json` is proxied to Rust, Better Auth's
`sign-in/email`, `sign-out` and `get-session` among them; the login form's
`loginFn` calls Rust too. In production, any other `/api/` path is a 404
except the CopilotKit runtime (`/api/copilotkit`), which stays in the
TanStack server, and `src/server.ts` starts no cron runner, workers or graph
sync. Every server function with a caller forwards to its REST twin.
Responses from Rust carry `x-ers-backend: loco-rs`.

**Run one Rust backend with the scheduler per installation** (`start --all`
in the image), and never alongside Node's cron runner, or monitoring rules
fire twice.

### Docker

```bash
docker build -t enterprise-reporting-backend rust/
```

A release build of `ers-backend-cli` on `debian:bookworm-slim` with `ffmpeg`
(CopilotKit's transcribe converts the browser's audio to WAV). It runs
`start --all`: API, queue workers and scheduler in one process, configured
from the same environment variables as the Node service.

## Check it

```bash
cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test
```

The unit tests include fixtures produced by the Node code itself: a Node
ciphertext the Rust decryptor must open, and a 132-case × 4,440-minute cron
corpus the Rust matcher must reproduce exactly.

### Parity with the Node backend

With both servers running against one database (Node on :4050, Rust on :5150),
and both started with `DATA_SOURCE_HOST_ALLOWLIST=localhost`: the fixture's
"user" database is on localhost, which the network-target check otherwise
refuses on the connection-test and data-source cases. Start Node **without**
`ERS_RUST_API_URL`, or the suite would compare Rust with itself (it refuses to
run if it detects this).

```bash
bun rust/parity/seed.ts          # deterministic fixture + a small "user" database
bun rust/parity/run.ts           # every HTTP case in parity/cases.json, both backends
bun rust/parity/monitoring.ts    # one evaluation per rule by each worker, rows compared
bun rust/parity/report-csv.ts    # report:generate / data:export: CSV byte for byte, XLSX and PDF by content
bun rust/parity/report-export.ts # reports/:id/export in every format
bun rust/parity/email-batch.ts   # email:batch into two local SMTP sinks (Python 3.11 smtpd)
bun rust/parity/nl-report.ts     # scheduled NL reports, every row and file compared
bun rust/parity/log-search.ts    # logs/search ranking over Node-written vectors
bun rust/parity/nl-query.ts      # NL history, schema, execute, RAG, voice (needs pgvector)
bun rust/parity/auth.ts          # Better Auth sign-in/out/get-session, and sessions across backends
bun rust/parity/admin-fns.ts     # the admin server functions' Rust twins
bun rust/parity/phase7.ts        # report-builder dry run, ADK, CopilotKit audio/threads, upload (needs the stub)
bun rust/parity/phase7-fns.ts    # NL builder, share pages, dashboard stats (needs the stub)
bun rust/parity/cron-corpus.ts   # regenerate the cron fixture from the Node matcher
bun rust/parity/crypto-roundtrip.ts  # regenerate the Node ciphertext fixture
```

The two Phase 7 suites need a model server that answers the same way every
time. `parity/llm-stub.py` is one: it stands in for llama.cpp and Mastra, and
records every request, so the suites compare the prompts each backend sent as
well as what came back. Start it, and point **both** backends at it
(`MASTRA_URL=http://localhost:4199`, `AI_NL2SQL_BASE_URL=http://localhost:4199/v1`,
`LLAMA_REASONING_URL=http://localhost:4199`), with `GRAPH_DATABASE_URL` set
for the graph context:

```bash
python3 rust/parity/llm-stub.py 4199
```

`run.ts` signs in once per identity through Better Auth on Node; the cookie is
then sent to both backends. A case may name a documented difference
(`"known": "D-4"`). That difference is reported and does not fail the run.
Any other difference fails it.

## Layout

```
src/
├── app.rs            Loco hooks: routes, workers, tasks, boot checks
├── auth/             Better Auth sessions: issuing (sign-in, cookies, rate limit,
│                     origin checks), verification, per-request RBAC lookup
├── common/           settings, node-pg–compatible row→JSON, envelopes, pagination
├── controllers/      one module per /api area
├── datasources/      pooled connections to users' databases, connection test,
│                     PostgreSQL introspection, network-target (SSRF) check
├── email.rs          renderTemplate + SMTP
├── metadata/         metadata entities: reads, and the schema → metadata sync
├── migration/        the bootstrap baseline + Rust-owned tables
├── monitoring/       cron matcher, threshold evaluation, alert dispatch
├── permissions/      hasPermission, checkEntityAccess, validateQueryAccess, decideQueryRun
├── security/         AES-256-GCM (Node-compatible), audit log
├── sql/              read-only check, strict table extraction, validateSQL
├── embeddings/       log-search embedding
├── graph/            Apache AGE: Cypher over sqlx, schema sync, graph RAG
├── nlquery/          embedding and speech clients, pgvector RAG store, the
│                     schema cache, and the model calls (report builder,
│                     intent classifier, Mastra, NL→SQL)
├── render/           XLSX and PDF writers
├── reportgen/        scheduled NL reports: RBAC snapshot, charts, worker, cleanup
├── tasks/            cron_tick, evaluate_rule, generate_report, email_batch,
│                     generate_nl_report, report_cleanup, sync_knowledge_graph
└── workers/          monitoring:evaluate, report:generate, data:export, email:batch
```
