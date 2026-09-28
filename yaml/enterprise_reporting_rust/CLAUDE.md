# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun --bun vite dev            # dev server at http://localhost:4050
bun --bun vite build          # production build
bun run start                 # serve it — listens on :3000, PORT overrides

# Code quality (Biome, not ESLint/Prettier)
biome lint src                # lint check
biome lint src --write        # lint + auto-fix
biome format src --write      # format files
biome format src              # format check — `format` WITHOUT --write IS the check
                              #   (Biome v2 has no --check flag; see below)
tsc --noEmit                  # type check
bun run precommit             # lint + typecheck + format:check

# Database (PostgreSQL — config DB and knowledge graph)
bun scripts/rebuild-db.ts                  # full schema rebuild (drops + recreates all tables)
bun src/lib/db/seeds/001_initial_data.ts   # seed sample data + Sakila data source
bun scripts/init-postgres.ts               # init PostgreSQL user DBs with pgvector tables

# Knowledge graph (Apache AGE)
bun scripts/sync-knowledge-graph.ts       # bootstrap AGE + sync schema + import llmtext

# Background jobs (Trigger.dev tasks, or built-in cron fallback)
bun src/lib/jobs/worker-runner.ts         # start background jobs worker

# Load a generated application into this platform (see "The reporting-pack seeder")
REPORTING_PACK=./pack.json APP_DATABASE_URL=postgresql://… \
  ers-backend-cli task seed_reporting_pack      # Rust — what every compose file runs
REPORTING_PACK=./pack.json APP_DATABASE_URL=postgresql://… \
  bun scripts/seed-reporting-pack.ts            # the Node twin, kept for parity

# Unit tests (bun:test). Scope to src — see "Testing" below, a bare `bun test`
# also picks up the Playwright specs under e2e/ and errors on all of them.
bun test src

# E2E tests (start dev server first — webServer config is commented out in playwright.config.ts)
playwright test                             # all tests
playwright test --headed                    # visible browser
playwright test --ui                        # Playwright UI
playwright test e2e/sql-editor.spec.ts      # single spec file
playwright test e2e/sql-editor.spec.ts -g "saves a query"   # single test by name
bun run test:setup && playwright test       # setup test data then run all
```

## Architecture

### Framework and Runtime

TanStack Start v1 (`@tanstack/react-start` ^1.167.65) with file-based routing. Requires Bun ≥ 1.3.0 (CI pins 1.3.11). React 19, Vite 7, Tailwind 3, shadcn/ui over Radix. Linting and formatting use Biome (not ESLint/Prettier).

**The dev server and the production server are on different ports.** `vite dev`
listens on **4050**; `bun run start` serves the build on **3000**, and `PORT`
overrides it. The Playwright suite and `BASE_URL` both default to 4050.

`vite.config.ts` carries three things worth not undoing:

- `server.headers` sets `Cross-Origin-Opener-Policy: same-origin` and
  `Cross-Origin-Embedder-Policy: require-corp` — cross-origin isolation, which
  DuckDB WASM needs for `SharedArrayBuffer`.
- `ssr.external: ['better-auth']` — see **Auth** below. Bundling it breaks every
  sign-in at runtime while the build and typecheck both pass.
- `resolve.dedupe` on React and `optimizeDeps.include` for the same: two copies of
  React in one page is a hooks error with no useful stack.

### Two-Database Architecture

**Config DB (PostgreSQL only)** — `src/lib/db/kysely-db.ts`, re-exported from `src/lib/db/config.ts`:

```ts
import { getDb } from "@/lib/db/config";
```

- Connection via `DATABASE_URL`, else assembled from `POSTGRES_HOST/PORT/DB/USER/PASSWORD` (or `PGHOST`/`PGPORT`/… ), defaulting to `localhost:5432/enterprise_config` as user `enterprise`
- `getDb()` is synchronous; bootstraps schema on first call via `bootstrapSchema()` in `src/lib/db/bootstrap.ts` — idempotent (`CREATE TABLE IF NOT EXISTS`), safe to run every boot
- Stores everything: users, roles, user_roles, resource_permissions, data_sources, saved_queries, report_definitions, chart_definitions, dashboard_layouts, dashboard_widgets, job_definitions, job_executions, audit_log, logs, email_templates, filter_definitions, report_filters, chart_filters, ds_roles, ds_user_roles, ds_entity_permissions, schema_table_instructions, schema_field_instructions, metadata_entity_header, metadata_entity_field, error_messages, warning_configs, error_occurrences, app_settings, nl_query_context, nl_query_role_stats, nl_query_feedback, help_articles — plus `auth_sessions`, `auth_accounts` and `auth_verifications` for Better Auth
- The `Database` interface in `src/lib/db/kysely-db.ts` is the authoritative type for all config DB tables — add a table there and in `bootstrap.ts` together

**Seven tables exist in `bootstrap.ts` that the `Database` interface does not
declare**, so the rule above is already broken in one direction: `ds_schema_cache`,
`adk_intents`, `monitoring_rules`, `monitoring_executions`, `notifications`,
`nl_report_definitions` and `generated_report_artifacts`. Code that reads them —
`monitoring-worker.ts` and `monitoring-scheduler.ts` are the main ones — is
selecting from a table Kysely has no type for. Adding the missing interfaces is
worth doing; until then, do not assume the interface is a complete inventory of
the schema. `bootstrap.ts` is.
- **Knowledge graph** (`ers_knowledge` database): Apache AGE property graph for NL query context; separate pool in `src/lib/graph/client.ts` via `GRAPH_DATABASE_URL`

There is no MariaDB or SQLite anywhere in the running system, despite what several files under `docs/` still claim (see **Stale documentation** below).

**User Data Sources** — `src/lib/db/connection-manager.ts`:

```ts
import { getConnection } from "@/lib/db/connection-manager";
const kysely = await getConnection(dataSource);  // Kysely<any>
```

- Returns a Kysely instance for the user's external database
- Supported `client_type` values: `pg`, `mysql`, `mssql`
- Connection configs stored AES-256-GCM encrypted (`ENCRYPTION_KEY` env var) in the config DB's `data_sources` table; decrypted via `src/lib/security/encryption.ts`
- **An unset `ENCRYPTION_KEY` is now fatal.** It used to warn and fall back to a hard-coded development key, which left every stored data-source password unprotected while only writing one line to a boot log that nothing failed on. Local development that wants the old behaviour must set `ALLOW_INSECURE_ENCRYPTION=1`, and that is refused outright when `NODE_ENV=production`.
- **The key is the ciphertext's only input, so rotating it strands every stored config.** There is no re-encryption path; the failure looks like a data source that exists and cannot be opened. Generate it once, before first boot.
- `encryption.ts` used to log twenty-four `[ENCRYPTION DEBUG]` lines per call on the normal path, ending with the first 200 characters of the plaintext — which for a data source is the whole connection config, password included, in every `docker compose logs`. It does not any more. Do not add diagnostics that print plaintext or key material here.
- Connections pooled by data source ID and health-checked before reuse
- Hostnames are resolved to IPv4 explicitly (`resolveIPv4`) because Docker DNS returns IPv6 first and that path fails against Neon pooler endpoints — keep `ssl.servername` set when changing this

### Route Structure

File-based routing under `src/routes/`:

```
src/routes/
├── __root.tsx     # ErrorBoundary → ThemeProvider → TanStackDBWrapper → DuckDBProvider
│                  #   → TooltipProvider → QueryClientProvider → HelpProvider
├── _authed.tsx    # Auth guard: resolves the session from request headers via
│                  #   getSessionFromHeaders, redirects to /login when absent
├── _authed/       # Protected pages: dashboard, sql-editor, nl-query, charts, dashboards, reports,
│                  #   queries, saved-queries, data-sources, datasets, metadata, filters, jobs,
│                  #   monitoring, queue-management, trigger-board, logs, system-logs, settings,
│                  #   email-templates, admin, users, roles, permissions
├── api/           # API routes using server.handlers pattern
├── share/         # Public (unauthenticated) share links: chart, dashboard, report
├── login.tsx      # Public login page
└── index.tsx      # Root redirect
```

API routes pattern:

```ts
export const Route = createFileRoute("/api/some-path")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        return json({ ... }, { status: 200 });
      },
    },
  },
});
```

`src/routeTree.gen.ts` is generated — never edit it by hand.

### Server Functions — Critical Conventions

Server functions live in `src/server-fns/`. The TanStack Start Vite plugin only recognizes `.inputValidator()` — using `.validator()` causes a runtime crash because the Vite plugin preserves unknown method names verbatim in the client bundle.

```ts
// Correct: use .inputValidator() not .validator()
export const myFn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }) => { ... });

// Client call MUST pass { data: ... } wrapper when inputValidator is used:
const result = await myFn({ data: { id: "abc" } });

// Without inputValidator, no wrapper needed:
export const otherFn = createServerFn({ method: "GET" }).handler(async () => { ... });
await otherFn();
```

Newer server functions wrap logic in `withErrorHandler()` from `src/lib/server-fns/with-error-handler.ts`, which audit-logs failures and normalizes errors into `ServerFunctionError` subclasses (`ValidationError` 422, `UnauthorizedError` 401, `NotFoundError` 404). Older ones return `{ success: boolean, data?: T, error?: string }` directly.

### Auth — Better Auth, not a JWT

Authentication is **Better Auth** (`src/lib/auth/better-auth.ts`). It replaced a
hand-rolled HS256 JWT (`jose`) that carried the user, their roles and their
permissions inside the cookie, and the two properties that motivated the move
are the ones to keep in mind when changing anything here:

- **A JWT is a bearer claim, not a lookup.** Roles and permissions were frozen
  into the token at sign-in, so a role revoked at 09:00 was still granted by an
  unexpired token at 17:00. They are now read from `roles`/`user_roles` on every
  request, against the session's user id — revocation takes effect on the next one.
- **There was no way to end a session server-side.** Now there is a row to
  delete, and changing a password deletes the user's other sessions.

**The seam did not move.** `Session`, `SessionUser`, `auth()`, `requireAuth()`
and `verifySession(token)` keep the shapes they had, so the ~56 files that call
them were untouched. What changed underneath is that `verifySession` is a
database lookup rather than a signature check.

| Where you are | What to call |
|---|---|
| Server fn (`src/server-fns/`) | `import { requireAuth } from "@/lib/auth/middleware"`, then `await requireAuth()` |
| API route (`src/routes/api/`) | `import { auth } from "@/lib/auth/config"`, then `await auth(request)` |
| You hold a raw token, not a request | `verifySession(token)` from `@/lib/auth/session` |
| Route guard | `_authed.tsx` resolves the session in `beforeLoad` and injects `{ session }` into route context (`Route.useRouteContext()`) |

- `/api/auth/$` is Better Auth's own HTTP surface (sign-in, sign-out, session).
  `basePath` is `/api/auth`, so that splat route has to stay at exactly that path
  or every URL the library generates points at a 404.
- **The user table is the existing `users` table.** `roles`, `user_roles`,
  `resource_permissions`, `ds_user_roles` and the audit log all key on `users.id`,
  so Better Auth's `user` model is *mapped onto* `users` rather than given a table
  of its own. Only `email_verified` was added. Sessions, credentials and
  verifications get new tables — `auth_sessions`, `auth_accounts`,
  `auth_verifications` — with real `TIMESTAMPTZ` columns, because the older tables
  store timestamps as `VARCHAR` and Better Auth compares `expires_at` against a
  `Date`, which against a string does not error, it just stops expiring sessions.
- **Passwords stay bcrypt.** Better Auth hashes with scrypt by default; every
  password in an existing installation is a bcrypt hash and there is no converting
  one without the plaintext, so the `hash`/`verify` hooks keep `bcryptjs`. The
  credential lives in `auth_accounts.password` — **not** `users.password_hash`,
  which Better Auth never reads. A password-change path that writes the old column
  reports success while sign-in keeps accepting the old password. `bootstrapSchema()`
  copies each `users.password_hash` into `auth_accounts` once, so existing users
  sign in with the passwords they already have.

#### Two cookie traps, both of which read as "everyone is signed out"

- **Never match the cookie by hand.** The name is Better Auth's business —
  `ers.session_token` today, `__Secure-` prefixed once served over HTTPS — so
  prefer `auth(request)` / `getSessionFromHeaders(headers)`, which hand the real
  headers to the library. Where a raw token is genuinely all you have,
  `readSessionToken()` matches `SESSION_COOKIE_NAME` at a cookie boundary.
- **`COOKIE_PREFIX` is `ers` on purpose.** The generated application this platform
  sits beside sets `<project>_app.session_token`, Better Auth cookies are path `/`,
  and nginx serves both from one origin. The old unanchored
  `cookie.match(/session_token=([^;]+)/)` found the *first substring*, so
  `crm_app.session_token` arrived first alphabetically and its value was handed to
  `verifySession` — signed in, session valid, every permission gone, and the
  dashboard rendering "0 of 10 modules available" to a full administrator.

#### `better-auth` must stay external to the server build

`vite.config.ts` carries `ssr.external: ['better-auth']`. It depends on zod `^4`
and this application on zod `^3`; both are installed, v4 nested under
`better-auth` and v3 hoisted. Node's resolution gets that right and the bundler
flattens it, handing `better-auth` the hoisted v3 — which fails at runtime on
`z.looseObject is not a function`: a 500 on every sign-in, from a build that
succeeded and a typecheck that passed.

### NL Query Pipeline

`/_authed/nl-query/` → CopilotKit sidebar → `/api/copilotkit` → Mastra AI server → llama.cpp → pgvector RAG

1. CopilotKit sidebar (`@copilotkit/react-ui`) proxies to `MASTRA_URL` (default `http://localhost:4111`) via `/api/copilotkit`
2. SQL generation: `src/lib/nlquery/mastra-connector.ts` or `src/lib/nlquery/llama-translator.ts`
3. LLM server: OpenAI-compatible at `LLAMA_REASONING_URL` or `AI_NL2SQL_BASE_URL`
4. RAG context from `src/lib/mastra/rag-store.ts`: `nl_query_embeddings` + `nl_schema_embeddings` pgvector tables in the user's PostgreSQL DB
5. Full pipeline: `src/lib/mastra/nl-query-pipeline.ts` — schema fetch → LLM SQL generation → SQL AST validation → RBAC check → execute
6. Agent/tool orchestration variant: `src/lib/adk/pipeline.ts` (+ `intent-classifier.ts`, `tools/`) calls the same Mastra server
7. Embedding server: `LLAMA_EMBEDDING_URL` / `AI_EMBEDDING_BASE_URL`; falls back to hash-based embeddings when unavailable
8. Embedding dimension: 384 — changing requires re-ingesting all embeddings

### RBAC

Two layers, both stored in the config DB (PostgreSQL):

1. **System-level**: `roles` + `user_roles`. Permission strings: `resource:action` (e.g. `data_source:view`, `nl_query:*`, `*:*`). Helpers in `src/lib/permissions/permissions.ts` — `hasPermission`, `hasResourceAccess`, `filterAccessibleResources`, `requirePermission`
2. **Data-source-level**: `ds_roles`, `ds_user_roles`, `ds_entity_permissions`. Per-table/column access per data source per role. Helpers in `src/lib/permissions/ds-rbac.ts` — `checkEntityAccess`, `getUserAccessibleEntities`. Generated SQL is parsed by `src/lib/mastra/sql-parser.ts` and validated against these before execution

#### Every path that executes SQL gates on `validateQueryAccess`

`/api/sql/execute` used to check that a session existed, that the SQL was a
`SELECT` and that the data source was real — and then run it. It never asked
whether the caller may read the tables the `SELECT` names, so **any signed-in
user could read every table of any data source they could name**, whatever their
`ds_entity_permissions` said. Both the SQL-editor path and the NL-query path now
gate on `validateQueryAccess` (`src/lib/permissions/query-access-validator.ts`),
and a denial is a 403 naming the tables rather than a blank refusal.

**The heading was aspirational until recently — four paths did not.** A security
review found that the report, chart, export and saved-query routes each resolved
a definition by id and ran its SQL behind a session check alone, so any signed-in
user could read any report's data by naming its id. Those four go through
`decideQueryRun` (`src/lib/permissions/runnable-query.ts`) now, which asks both
questions — is this one read-only statement, and may this caller read the tables
it names — in one place.

**Reach for that module when adding a path that runs stored SQL.** The check was
never missing; reaching it was left to each route to remember, and four of them
did not. Both questions are asked at run time rather than trusted from save
time: `sql_content` is an ordinary column, rows predate the validation, and the
person running a query is frequently not the person who saved it.

Two related things the same review changed:

- `validateQueryAccess` **denies** a query whose tables it cannot determine. It
  used to allow one, and the extractor behind it was a regular expression, so
  `SELECT * FROM(hr_salaries)` — one space removed — named no tables and was
  therefore trusted. Table extraction is a real parse now
  (`extractTablesStrict`), but the inversion is the fix: an access decision that
  cannot be made is a refusal.
- `isReadOnlyQuery` refuses a statement break as well as a leading keyword.
  `SELECT 1 LIMIT 1; DROP TABLE users` used to pass.

That this went unseen for so long has a specific cause worth remembering:
**nothing had ever created a `ds_entity_permissions` row**, so there was nothing
for a check to enforce and no way to notice one was missing. Seeding roles from a
model's `%%rbac` produced the first rows, and with them the real behaviour.

Two rules follow from the fix:

- **`checkEntityAccess` is the one implementation.** `sql-ast-validator.ts` used
  to answer "may this user read this table" itself, against
  `permission_level in ("read", "write", "admin")` — a set **disjoint** from the
  `select | insert | update | delete | all` that the type declares, the
  permissions screen offers and `upsertDsEntityPermission` writes. Both of its
  functions delegate now. Do not add a third reading of that fact; the system-admin
  bypass (`admin:*`) and the column restrictions live in `checkEntityAccess` only.
- **The translator refuses rather than warning.** Both call sites used to log the
  verdict and return the SQL anyway. On the voice path nothing executed, but SQL
  naming forbidden tables went back to the speaker — which discloses the schema
  and somebody else's permissions just as well as running it would. The refusal
  has its own shape rather than being folded into `null`, because "you may not
  read `bus_account`" and "the model could not write a query" are different
  things to tell somebody and `null` already meant the second.

### Background Jobs — Trigger.dev, not BullMQ

Job processing runs on **Trigger.dev** (`@trigger.dev/sdk`), configured in `trigger.config.ts` (project `enterprise-reporting`, tasks discovered under `./src/lib/jobs`).

- Task definitions: `src/lib/jobs/trigger-tasks.ts` — `report:generate`, `data:export`, `email:batch`, `scheduled:refresh`, plus monitoring evaluation
- Enqueue via `src/lib/jobs/trigger-queue.ts`; the actual work lives in `src/lib/jobs/workers/`
- `src/lib/jobs/worker-runner.ts` picks the backend: Trigger.dev when `TRIGGER_API_URL` is set, otherwise it starts the built-in on-premise cron runner (`src/lib/monitoring/monitoring-scheduler.ts`), a pure-Bun interval loop that polls `monitoring_rules` every minute
- **BullMQ is gone.** `src/lib/queue/` — the dead legacy tree that imported `bullmq` and `ioredis`, neither of which was ever in `package.json` — has been deleted, along with the Bull Board routes it backed. Job payload types now live beside their consumers in `src/lib/jobs/types.ts`, and the workers take their payload directly rather than a BullMQ `Job` wrapper. `/bull-board` is `/trigger-board`

### Other Subsystems

- **DuckDB WASM** (`src/lib/duckdb/`, `DuckDBProvider` in the root layout): in-browser SQL over query results, gated by `NEXT_PUBLIC_WASM_ENABLED`; progressive loading in `src/lib/wasm/`
- **Knowledge graph** (`src/lib/graph/`): Apache AGE schema sync + graph RAG for NL context
- **Metadata layer** (`src/lib/metadata/`): entity/field definitions, sync from live data source schemas, and metadata-level permissions
- **OpenKB** (`src/lib/openkb/`): knowledge-base client + embedding service for help content
- **Export** (`src/lib/export/`): CSV, Excel via `exceljs`, PDF via `jspdf` + `jspdf-autotable`
- **Logging** (`src/lib/logging/`): Pino; logs are also persisted to the config DB `logs` table
- **Voice** (`src/lib/voice/`, `/api/voice/ws`): Qwen ASR and TTS clients over the llama.cpp endpoints, for spoken NL queries
- **ADK pipeline** (`src/lib/adk/`): the agent/tool orchestration variant of NL query — `intent-classifier.ts`, `pipeline.ts` and `tools/`, against the same Mastra server
- **Report generation** (`src/lib/report-generation/`): the worker that renders report definitions into stored artifacts, plus its cleanup job
- **Record links** (`src/lib/reporting/record-link.ts`): opening a report row as a record in another application — see its own section below

### Help is one toaster, and `HelpProvider` renders it

`src/components/help/help-toaster.tsx` is the only help surface. A `?` opens a
panel pinned to the top right; **its own close button is the only way out** — no
timeout, no click-outside, no Escape, no backdrop and no focus trap, so the
query, report or chart being explained stays visible and editable beside it. One
panel at a time.

`HelpProvider` is the **innermost** provider in `__root.tsx`, and both facts
about its position are load-bearing: it is inside `QueryClientProvider` because
the articles are a `useQuery`, and it renders the toaster itself so that no
screen places a help surface of its own. A `?` anywhere below it opens the one
panel.

- `HelpButton.tsx` — the masthead `?`. It used to advertise "press ? for
  keyboard shortcut"; nothing listens for `?`, and a global binding would fire
  while someone typed a question mark into the SQL editor.
- `HelpPanel.tsx` — the three views (search, an 18-category `<select>`, an
  article) at 26rem. The rail is a `<select>` because eighteen buttons do not fit
  beside anything; the articles, the search and the `DOMPurify` sanitising are
  unchanged from the dialog it replaced.
- `HelpTopicButton` — a `?` for one piece of inline help, named that way rather
  than `HelpButton` to avoid clashing with the masthead component. The cron
  reference on the jobs screen uses it; it was a hover `Tooltip`, available only
  on a pointer, after a delay, and never on a touch device.

**`top-20`, not `top-4`.** The header's right-hand end carries the theme
selector, this `?`, the notification bell and the account menu — a non-modal
panel must not be the thing making four of its own controls unclickable.

This matches the generated application deliberately: `/app` and `/report` come
up together and its dashboard links straight into this platform, so a reader who
meets both should not have to learn two ways to ask for help.

### Design themes — Tremor by default, seven Astryx themes at runtime

Theming has two independent axes. The **mode** (light/dark/system) is
`next-themes` and the `.dark` class, as before. The **design** is
`<html data-design-theme="…">`, picked from the header or Settings → Design
System and stored per browser under `design-theme`. Tremor is the default and has
no attribute, so `globals.css` applies unchanged; the others are the seven
[Astryx](https://github.com/facebook/astryx) themes.

- **Regenerate, never hand-edit** `src/styles/astryx-themes.css` and
  `src/lib/theme/astryx-themes.generated.ts`: `bun scripts/sync-astryx-themes.ts`
  (`ASTRYX_VERSION=x.y.z` to pin). It installs the published packages into a temp
  dir and maps their tokens onto the `--tremor-*`/shadcn variables — the Astryx
  packages are not dependencies of this app.
- Radius, `shadow-tremor-*` and the font families are CSS variables now (defaults
  in `globals.css`) so a design theme can swap them.
- Canvas renderers cannot read CSS variables: ECharts takes its colours from the
  design theme's generated hex values (`useDesignTheme()`).
- Gothic ships only a dark palette, so it forces dark mode via `forcedTheme`.
  Read the mode through `@/lib/theme/use-theme`, whose `resolvedTheme` includes
  the forced value; next-themes' own does not.

### TanStack DB (client-side state)

`src/lib/tanstack-db/collections.ts` — local in-memory `@tanstack/db` collections (no server sync configured):
`activeFiltersCollection`, `chartDraftCollection`, `dashboardStateCollection`, `queryHistoryCollection`, `reportsCollection`, `chartsCollection`, `dashboardsCollection`

### Feature Flags

`src/lib/feature-flags.ts` reads `NEXT_PUBLIC_*` env vars (naming is a leftover; this is not Next.js):
- `NEXT_PUBLIC_WASM_ENABLED` — DuckDB WASM in-browser SQL
- `NEXT_PUBLIC_ECHARTS_ENABLED` — ECharts alternative to Recharts
- `NEXT_PUBLIC_CROSSFILTER_ENABLED` — cross-widget dashboard filtering
- `NEXT_PUBLIC_OFFLINE_ENABLED` — IndexedDB offline caching
- `NEXT_PUBLIC_PROGRESSIVE_ENABLED` — progressive loading for large datasets

## Environment Variables

**Required:**
```
AUTH_SECRET=           # Better Auth secret (≥32 chars; the app refuses to boot below that)
ENCRYPTION_KEY=        # AES-256-GCM key (64 hex chars) for data source connection configs
DATABASE_URL=postgresql://enterprise:password@localhost:5432/enterprise_config
GRAPH_DATABASE_URL=postgresql://enterprise:password@localhost:5432/ers_knowledge
```

**AI / NL Query (optional, needed for NL features):**
```
MASTRA_URL=http://localhost:4111           # Mastra AI server
LLAMA_REASONING_URL=http://localhost:8080  # llama.cpp NL→SQL (appends /v1)
AI_NL2SQL_BASE_URL=                        # Full base URL override (includes /v1)
AI_NL2SQL_MODEL=                           # NL→SQL model name
LLAMA_EMBEDDING_URL=http://localhost:8080  # Embedding server
AI_EMBEDDING_BASE_URL=                     # Full embedding URL override
LLAMA_STT_URL=http://localhost:8081        # Speech-to-text
LLAMA_TTS_URL=http://localhost:8083        # Text-to-speech
```

**Optional:**
```
BETTER_AUTH_URL=           # Better Auth baseURL; falls back to APP_URL, then http://localhost:4050
APP_URL=http://localhost:4050
CORS_ORIGIN=               # comma-separated; appended to Better Auth's trustedOrigins
TRIGGER_API_URL=           # Trigger.dev server; unset falls back to the built-in cron runner
TRIGGER_API_KEY=
WORKER_CONCURRENCY=5
SMTP_HOST/PORT/USER/PASS/SECURE  # Email settings
LOG_LEVEL=info             # Pino log level
DEFAULT_PAGE_SIZE / MAX_PAGE_SIZE / DATA_TABLE_PAGE_SIZE / EXPORT_PAGE_SIZE
```

`.env.example` documents most of this set; copy it to `.env` to start. Two gaps to
know about: it still describes `AUTH_SECRET` as a "JWT signing key", which it has
not been since the Better Auth migration, and it does not mention `BETTER_AUTH_URL`
or `CORS_ORIGIN` at all — both are read by `src/lib/auth/better-auth.ts`, and
getting `baseURL` wrong behind a reverse proxy is a sign-in that redirects to the
wrong origin.

**Server-side pagination is mandatory.** Every data query must apply `LIMIT`/`OFFSET` at the database level; never fetch a full table and paginate on the client. This is a rule with a recent counter-example: `/api/queries` selected the whole `saved_queries` table — every row and every row's `sql_content` — and reported `meta.total` as the length of what it had already fetched, while the caller asked for a page. Filtering in the browser has the matching defect: it only ever searches the rows that page happened to contain, so a query whose name matches is invisible unless it landed on the page you were looking at. Both are done at the database now; do the same for any new list endpoint.

## Default Credentials

Auto-created by `bootstrapSchema()` on first startup (the admin only when no
users exist; the nlquery account only when that row is absent):

- `admin@admin.com` — full administrator. Password from `ADMIN_PASSWORD`.
- `nlquery@nlquery.com` — NL query role only. Password from `NLQUERY_PASSWORD`.

**Neither password is compiled in any more.** Both used to be pre-computed
bcrypt hashes of the words `admin` and `nlquery`, sitting in `bootstrap.ts` —
so every installation that had not changed them, and nothing prompted anyone
to, could be signed into by anyone who had read this repository. With the
environment variable unset a random password is generated, printed once at
boot, and stored nowhere it can be read back.

The credential endpoints are rate-limited now too (`rateLimit` in
`src/lib/auth/better-auth.ts`: 5 sign-ins per minute). Nothing throttled
anything before, so a weak password was guessable at whatever rate the network
allowed.

Running `bun run db:seed` also adds `analyst@example.com` / `analyst123` with a sample Sakila data source.

`bootstrapSchema()` also backfills `auth_accounts` from `users.password_hash` for
every user that has no `credential` account yet, which is what lets these
(and any pre-migration account) sign in through Better Auth unchanged.

## Dependencies — 78, and the ones that look unused are not

22 packages that nothing imported were removed (99 → 78 dependencies, 18 → 17 dev).
Gone: 11 unused `@radix-ui/react-*` primitives, `antlr4` (the SQL parser uses
`antlr4ng`), `idb` (the offline cache uses `idb-keyval`), `sqlite`, `sql.js` and
`@vscode/sqlite3` (SQLite is not a supported data source), `parquet-wasm`
(`parquet-exporter.ts` writes Arrow IPC), `pino-http`, `date-fns`, `lodash`,
`@types/lodash` and `@tanstack/react-store`.

**Six survive a grep for their own name and must not be "cleaned up":**
`postcss` and `autoprefixer` (plugin keys in `postcss.config.js`),
`tailwindcss-animate` (required in `tailwind.config.ts`), `pino-pretty`
(`transport.target`, loaded by name at runtime), `typescript`, and the remaining
`@types/*`. Two more are single-consumer and easy to mistake for dead weight:
`redis` is imported only by `src/lib/openkb/openkb-client.ts`, and `better-sqlite3`
is Mastra's.

**A passing build does not prove a dependency is unused.** Bun keeps a removed
direct dependency resolvable as long as something else still depends on it, so the
evidence has to be the absence of any module specifier in the source, with the
build as confirmation rather than as the argument.

## The reporting-pack seeder — `scripts/seed-reporting-pack.ts`

This 873-line script loads a **generated application** into this platform. It runs
once, after both databases are up, and leaves the platform holding a working
analytics workspace for whatever application was just generated:

1. the generated application's database, registered as a data source with its
   connection details encrypted the way this platform expects
2. that database's schema, introspected and cached — which is what the NL-query
   pipeline reads as context and what the data-source screens list as entities
3. every saved query, report, chart, dashboard and widget in the *reporting pack*
   derived from the model

```bash
REPORTING_PACK=<pack.json> APP_DATABASE_URL=<app db url> bun scripts/seed-reporting-pack.ts
```

**It has a Rust twin, and that is the one callers run:**
`ers-backend-cli task seed_reporting_pack` (`rust/src/tasks/seed_reporting_pack.rs`),
same environment, same tables, same shapes. The orchestrator's compose file runs
it from the backend image, so seeding needs no Bun at all. Change both together.
Two things the port found, both fixed on both sides:

- **The owner was "the oldest user", and on a second run it was the wrong one.**
  `users.created_at` is a `VARCHAR`; bootstrap writes `…T07:50:00.000Z` and the
  seeder `… 07:51:00`, and a space sorts before `T`. The first seeded reporting
  account became the "oldest", every lookup by owner missed, and the whole pack
  was inserted a second time. The owner is the bootstrap administrator's fixed
  id first now.
- **A task is not a boot.** Loco builds a task's context without migrating and
  without `before_run`, so the Rust seeder applies the baseline DDL and the
  bootstrap rows itself (`bootstrap::baseline`, `bootstrap::seed`), and the
  binary's `main` creates a missing config database before any `start`, `task`
  or `db` command connects.

It writes **eleven** of this schema's tables and is **idempotent by name**: run it
twice and the second run updates in place. That matters because it runs on every
`docker compose up`, not only the first.

**It lives here rather than in the orchestrator, and that is the point.** It was
written in `app-and-report-with-ai-tanstack`, where docker-compose stands this
platform up beside a generated application, and was *copied into this tree at image
build time* so it could import through `@/`. That is the right dependency in the
wrong direction: the file needs this project's real `getDb`, `encrypt` and
`introspectAndCacheSchema`, and a seeder with its own encryption or its own
schema-cache shape drifts from the reader — the failure looks like a data source
that exists and cannot be opened. There are now three callers (the orchestrator's
compose file, a generated application's own compose file, and a direct run), and
all three run *this* file rather than a copy.

It hashes with `bcryptjs`, deliberately — the same algorithm `better-auth.ts`
keeps. A seeder hashing with anything else writes accounts that cannot sign in,
and the failure reads as a wrong password.

**A pack is derived, never invented.** `buildReportingPack` in
`app-with-ai-tanstack` (`packages/generator/src/reporting/pack.ts`) builds it from
the model: every query comes from something the model declares, and every reporting
role mirrors a `%%rbac` role's `read` rules. This file only writes it down.

## Record links — `src/lib/reporting/record-link.ts`

A report definition may carry a record link, and the read-only record view then
grows a button that opens the same record in another application — the generated
application it was reported on, or anything else that can address a record by id.
`{id}` in the template is replaced with the row's id, URL-encoded.

**The scheme is allow-listed in one place, and both ends go through it.** The URL
is supplied by an administrator and ends up in an `href`, which is an injection
sink: `javascript:alert(1)` runs on click. An administrator is trusted, but that is
not the same as being able to store a payload that fires for every *ordinary*
viewer of the report. Site-relative (`/app/bus_account/{id}`) and absolute
`http:`/`https:` are permitted and nothing else — an allowlist rather than a
denylist of `javascript:` and friends, because a denylist has to anticipate every
scheme a browser will ever honour and is wrong in the unsafe direction.

## Testing

### Unit tests — real, but wired into nothing

Four `bun:test` files exist:

| File | Covers |
|---|---|
| `src/lib/reporting/__tests__/record-link.test.ts` | template validation and URL building |
| `src/lib/sql/__tests__/validator.test.ts` | the SQL validator |
| `src/lib/sql/__tests__/antlr-validator.test.ts` | the antlr4ng validator |
| `src/lib/validation/__tests__/translation-validator.test.ts` | translation validation |

Two things to know before you trust them:

- **There is no `test` script and CI does not run them.** `precommit` is lint,
  typecheck and format only. Nothing on GitHub executes these files, which is why
  the state below went unnoticed.
- **Run them as `bun test src`, not `bun test`.** A bare `bun test` also collects
  the ~51 Playwright specs under `e2e/`, which are written against
  `@playwright/test` and error out under Bun's runner — 51 errors that say nothing
  about the code.

**Three of them currently fail**, all in `validator.test.ts`, and all because the
validator is more permissive than the test expects: `SELECT * FROM users;` returns
two warnings where the test wants zero, and both `SELECT * WHERE id = 1;` and the
empty string come back `isValid: true` where the test wants `false`. As of this
writing `bun test src` is 78 pass / 3 fail across 4 files. Decide whether the
validator or the test is right before changing either — and if you fix them, wiring
`bun test src` into `precommit` is what stops it happening again.

### E2E tests

Playwright tests in `e2e/`. The dev server must be running on port 4050 before running tests (the `webServer` config in `playwright.config.ts` is commented out). Auth state is set up once by `e2e/global-setup.ts` and cached in `auth.json`, then reused via `storageState`. Tests run serially (1 worker, `fullyParallel: false`) to prevent session interference. Override the target with `BASE_URL`.

`global-setup.ts` signs in by driving the real login form as
`admin@admin.com` / `admin`, so it exercises Better Auth end to end rather than
forging a cookie — which also means a broken `/api/auth/$` route fails the whole
suite at setup rather than one spec at a time. **CI does not run this suite**: it
needs the dev server, a PostgreSQL config database and a cached session, and
nothing starts those for it. See **CI** below.

## `bun run typecheck` passes — keep it that way

`tsconfig.json` includes `**/*.ts`, so `typecheck` — and therefore `precommit` —
covers `language/`, `scripts/`, `e2e/` and `tests/` as well as `src/`. It now
reports **zero** errors.

It did not always. The backlog was 678 errors across ~140 files, and it was
invisible: a single unescaped backtick in `language/cli/src/generate/app.ts`
made that file unparseable, and one parse error makes `tsc` report *that alone*
and stop — so `typecheck` printed exactly one error and exited 2, which reads
far more like a small local problem than a backlog. Fixing the parse error is
what surfaced the rest.

Two habits are worth keeping from that:

- **A low error count is not automatically good news.** If the number collapses
  after an edit, check for a parse error stopping `tsc` early rather than
  assuming you fixed something.
- **Most of those 678 were real defects, not type noise** — Kysely called with
  Knex's API, `.where(column, value)` without an operator, server functions
  reading their payload off the ctx, inserts omitting a NOT NULL primary key,
  columns and hooks that never existed. Treat a new error as a bug report.

`language/**` uses explicit `.ts` import specifiers, which Bun resolves and
`tsc` rejects (TS5097) unless `allowImportingTsExtensions` is set — it is, in
`tsconfig.json`, and it needs the `noEmit` that is already there.

## `bun run precommit` passes too — including across a build

`precommit` is `lint && typecheck && format:check`, and all three are clean —
verified on this tree: typecheck reports zero errors, `format:check` is clean over
446 files, and `lint` exits 0 with 433 pre-existing **warnings** and 9 infos, which
Biome does not fail on. Treat that 433 as a baseline: a lint change that moves it is
worth a second look, and `lint` is not the place to argue with the backlog.

**`precommit` does not run any tests** — not the four `bun:test` files and not
Playwright. See **Testing**.

Getting `format:check` clean took a config change rather than a reformat, and the
reason is worth keeping:

**`src/routeTree.gen.ts` is written by the TanStack router generator on every
`vite build`, in a shape Biome's formatter disagrees with.** Formatting it makes
`format:check` pass exactly until the next build regenerates it — so a tree can
pass the check, build, and fail it again with nothing modified and nothing in
`git status`. That is why `biome.json` now excludes the file from the formatter
(`formatter.includes`), alongside the lint overrides it already had. Do not
reformat it by hand; the generator wins.

Two Biome details that cost time here:

- **`format` without `--write` *is* the check.** There is no `--check` flag in
  Biome v2 — `package.json`'s `format:check` used to pass it and Biome ignored
  the whole invocation, so the check reported success without running.
- **`organizeImports` is an assist, not a lint rule or a formatter rule.**
  `biome check --write` applies it and touches ~190 files; neither `lint`,
  `format:check` nor `precommit` asks for it. Reach for `biome format --write`
  or `biome lint --only=<rule> --write`, never a bare `check --write`.

Where a lint rule is genuinely wrong for the code, the suppression carries a
reason: index keys on a query-result preview table whose rows have no id,
`dangerouslySetInnerHTML` for the pre-paint theme script and for help articles
already through `DOMPurify.sanitize`. Everything else was fixed rather than
silenced.

## CI

`.github/workflows/ci.yml` runs on every pull request and on pushes to `main`.
Before it existed — which was until recently — nothing on GitHub checked
anything here, and `precommit` passing was only ever true of whichever tree
someone last ran it in.

| Job | What it runs |
|---|---|
| **Lint, types and format** | `bun install --frozen-lockfile`, then `lint`, `typecheck` and `format:check` as three separate steps — the parts of `precommit`, split so a failure names itself |
| **Build** | `bun --bun vite build`, then `format:check` *again*, then an assertion that the build left no tracked file modified |

**The second `format:check` is the point of the build job.** The two sides of
the build catch different mistakes: dropping the `routeTree.gen.ts` formatter
exclusion on its own turns the first job red, because the committed file is in
generator form — but dropping it *and* formatting the file by hand, which is the
tempting fix and the one that looks like it worked, leaves the first job green.
Only the post-build check sees the generator put the file back.

It also does not run the **unit tests**, and that one is an oversight rather than
a decision — `bun test src` is four files and under a second, and three of its
assertions are currently red. See **Testing**.

Two more things it deliberately does not do. There is **no `paths:` filter**:
`tsconfig.json` includes `**/*.ts`, so typecheck covers `language/`, `scripts/`,
`e2e/` and `tests/` too, and any filter narrow enough to be useful would leave
one of them unguarded — a skipped path-filtered run also reports no status at
all, which makes a job awkward to require later. And it **does not run the
Playwright suite**: that needs a dev server on 4050, a PostgreSQL config
database and a cached signed-in session, and `playwright.config.ts` has its
`webServer` commented out, so it starts nothing itself.

Bun is pinned to `1.3.11` there; `package.json` asks only for `>=1.3.0`.

## The Loco.rs backend port: `rust/`

`rust/` is a Loco (Rust) replacement for this server side: API routes, server
functions, Trigger.dev workers, the on-premise cron runner and the
knowledge-graph sync. **`rust/MIGRATION_PLAN.md` is the plan**, and its §9
lists every known difference from the Node backend. Both services run against
the **same** config database and accept the **same** Better Auth cookie, so
they need identical `AUTH_SECRET` and `ENCRYPTION_KEY`.

**With `ERS_RUST_API_URL` set, Rust is the backend** — in `vite dev` and in
production alike. Every route in `rust/routes.json` is proxied to Loco
(`vite.config.ts` in development, `src/server.ts` in production, both through
`src/lib/api/rust-routes.ts`); every server function with a caller forwards
to its REST twin (`src/lib/api/backend.ts`); and `src/server.ts` starts no
workers, no cron runner and no graph sync. In production any other `/api/`
path is a 404, except the CopilotKit runtime (`/api/copilotkit`), which stays
in the TanStack server. `docker-compose.yml` runs Loco as the `backend`
service (`rust/Dockerfile`). **Unset, the Node backend runs exactly as it
always has** — it is kept, disabled, so the two can be compared; deleting it
is deferred (MIGRATION_PLAN §7.1).

- **When `bootstrap.ts` changes, regenerate the Rust baseline:**
  `bun rust/parity/extract-baseline.ts`. The Rust migration runs that
  extracted DDL, never a hand-typed copy.
- **When a Node route that has a Rust twin changes, change the twin too** and
  add or adjust its case in `rust/parity/cases.json`. The suites
  (`bun rust/parity/run.ts` and the others in `rust/README.md`, with both
  servers up and Node started *without* `ERS_RUST_API_URL`) are how "same
  output" is checked. The Phase 7 suites need `rust/parity/llm-stub.py`
  as the model server for both backends.
- **A new route goes in Rust**, with its line in `rust/routes.json` (a Rust
  test holds that file to the router). A new `/api/` route added only to
  `src/routes/api/` is a 404 in production when Rust is the backend.
- **Run exactly one Rust scheduler per installation, and never beside the
  Node cron runner**, or monitoring rules fire twice (plan §6.3). The image
  runs `start --all`.
- **Sign-in runs on Rust.** `loginFn` and `logoutFn` call Rust's Better Auth
  routes and relay its `Set-Cookie`; the `getSessionFn` guards read
  `GET /api/auth/session`. Sessions issued by either backend open the other.
  The rate limit is per process.
- **Security fixes Rust has that Node still lacks** are the §9 rows marked
  "fix in Node too" — D-35 (the report-builder dry run and the NL builder run
  model-written SQL unchecked) and D-37 (dashboard stats need no session)
  among them. They matter only while Node serves traffic.
- `vite.config.ts` ignores `rust/**` in its file watcher. A `cargo build`
  writes ~11k files under `rust/target`, and watching them stalled the dev server.
- **Rust owns the bootstrap rows, not only the DDL.** `rust/src/bootstrap.rs`
  writes what `bootstrapSchema()` writes after its tables — the administrator
  and NL-query accounts and roles (same fixed ids, same `ADMIN_PASSWORD` /
  `NLQUERY_PASSWORD` rules), the `auth_accounts` credential backfill, and the
  help articles — on every boot. Before it, a Rust-only installation had a
  schema and no one to sign in as: the administrator was created as a side
  effect of the TanStack server's first request reaching `getDb()`. With
  `ERS_RUST_API_URL` set, `src/server.ts` no longer waits on Node's bootstrap
  before rendering a page. The help articles are extracted, never retyped:
  `bun rust/parity/extract-help-articles.ts` after changing `help-seed.ts`.
- **Under a URL prefix the proxy still reaches Rust.** Served at `/report`, every
  API request arrives as `/report/api/…`; `withoutBase` (`src/lib/api/backend.ts`,
  from Vite's `base`) takes the prefix off before matching `rust/routes.json`
  and before any path is handed to Rust. Without it every prefixed request fell
  through to the disabled Node handlers.
- **Production is `bun server-static-wrapper.mjs`**, not `bun run start`: the
  wrapper is the image's `CMD` and is what serves `dist/client/assets`. A bare
  `bun dist/server/server.js` renders pages with no CSS or JS.

## Stale documentation

Most files under `docs/` predate the migrations to PostgreSQL and Trigger.dev and describe SQLite/MariaDB, BullMQ + Redis, Bull Board, and OpenAI-based NL query. `docs/README.md` and this file are current; verify anything else in `docs/` against source before trusting it.

The ten deployment documents at the repository root (`DEPLOYMENT*.md`,
`HOSTINGER_*.md`, `QUICK_START*.md`, `README_HOSTINGER_DEPLOYMENT.md`) were all
written in June 2026 and none has been revised since — three months before the
Better Auth migration and the `bun run start` fix. Check anything operational in
them against source.

One piece of advice in them is actively dangerous:
`README_HOSTINGER_DEPLOYMENT.md` suggests "rotating `AUTH_SECRET` and
`ENCRYPTION_KEY`" for production. **Rotating `ENCRYPTION_KEY` leaves every stored
data-source connection config undecryptable**, and the failure presents as a broken
data source rather than as a rotated key. Rotating `AUTH_SECRET` invalidates every
live session. Neither is a routine hardening step; generate both once, before the
first boot, and leave them alone.

The same applies to the Docker Compose files: `docker-compose.yml` is current (PostgreSQL via `apache/age:PG16`, `DATABASE_URL`/`GRAPH_DATABASE_URL`), while `docker-compose.dev.yml`, `docker-compose.local.yml`, and `docker-compose.remote.yml` still start a MariaDB container and pass `MARIADB_*` to the app, which ignores them.

## EML Language System

`language/` and `llmtext/` contain the Enterprise Reporting Modeling Language (EML) system — a Mermaid-based language for describing an application as ERD + business rules + workflows, then generating a complete TanStack Start + Kysely application from that description.

Every EML document is valid, renderable Mermaid (`erDiagram`, `flowchart`, `stateDiagram-v2`). EML is a semantic superset: it assigns generator meaning to standard Mermaid syntax and to `%%` directive comments.

### Key files

- `language/erdwithai-language.json` — canonical machine-readable language definition (grammar, directives, validation rules)
- `language/checker.ts` — validates an `.mmd` file against the language definition
- `language/fixer.ts` — auto-repairs fixable checker diagnostics in-place
- `language/index.ts` — programmatic API (`loadLanguageDefinition`, `parseEml`, `validateModel`)
- `language/rag.ts` — RAG indexing for EML-aware LLM completions
- `language/cli/eml.ts` — CLI entry point (run with Bun)
- `language/examples/` — sample EML models (`minimal.eml.mmd`, `ecommerce.eml.mmd`, `helpdesk.eml.mmd`, `crm.eml.mmd`)
- `llmtext/llms-full.txt` — full application context spec for LLMs (architecture, conventions, patterns)

### CLI usage

Input is `-i/--input` or the first positional argument; output is `-o/--output`.
There is no `--out`.

```bash
# Validate a model
bun language/cli/eml.ts validate -i model.mmd

# Inspect parsed model summary
bun language/cli/eml.ts info -i model.mmd

# Generate application (enterprise-reporting is the default stack)
bun language/cli/eml.ts generate -i model.mmd -o ./generated

# Generate the dependency-free Node REST app instead
bun language/cli/eml.ts generate -i model.mmd -o ./generated --stack node-rest

# Auto-fix checker warnings before generating
bun language/checker.ts model.mmd   # check — also writes model.mmd.error beside it
bun language/fixer.ts model.mmd     # fix in-place
```

**The two stacks are `enterprise-reporting` (default) and `node-rest`.** There is
no `tanstack-nestjs` target here — that one belongs to `app-with-ai-tanstack`, and
passing it is rejected with `Unsupported stack`. `tanstack` and `tanstack-start`
are accepted as *aliases for `enterprise-reporting`*, which is the likeliest way
to think you got a NestJS stack and not notice.

`enterprise-reporting` emits code to paste into this repository; `node-rest`
emits a standalone `node:http` app over a JSON file, with no install step.

### Generated output (enterprise-reporting stack)

```
generated/
├── src/
│   ├── server-fns/<entity>.ts         # createServerFn with .inputValidator()
│   ├── routes/_authed/<entity>/
│   │   ├── index.tsx                  # List page (TanStack Table + shadcn/ui)
│   │   └── $id.tsx                    # Detail/edit page
│   └── lib/db/migrations/<ts>_create_tables.ts   # PostgreSQL DDL via sql``
├── rules/<rule>.jdm.json              # one GoRules JDM graph per %%rule flow
├── KYSELY_TYPES.md                    # Database-interface snippet to paste in
└── README.md
```

It writes a `KYSELY_TYPES.md` snippet, **not** a `kysely-db.ts` — you paste the
snippet into the `Database` interface in `src/lib/db/kysely-db.ts` yourself.

### The CLI vendors two modules from app-with-ai-tanstack

`language/cli/src/vendor/` holds copies of that repository's
`packages/web/src/lib/{jdm-converter,mermaid-flowchart-parser}.ts`, so a `%%rule`
flow compiles to the same JDM graph on both sides. They used to be imported
across the repository boundary as `../../../../packages/web/...`, which resolves
nowhere here — this repository has no `packages/` directory at all. Because
`cli.ts` imports the JDM emitter *statically*, that dangling path took down every
command, `validate` and `info` included, neither of which emits JDM. Both files
are dependency-free; re-copy them rather than editing them by hand.

## Repo-local Claude configuration

- `.claude/mcpServers.json` registers two MCP servers: `tanstack-start` (project structure/routes/server-fns/schema introspection, `bun .claude/mcp/tanstack-start-mcp.ts`) and `tanstack` (official TanStack docs search)
- `.claude/skills/bunjs-runtime.md` and `.claude/skills/tanstackstart-testing.md` hold Bun runtime and TanStack Start testing conventions

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
