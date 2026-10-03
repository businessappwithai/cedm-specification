# QA Report — database targets, and the Docker path

**Date:** 2026-08-10
**Branch:** `claude/gstack-drug-discovery-qa-lkhred`
**Model under test:** `examples/drug-discovery.eml.mmd`
**Scope:** remove `--db sqlite` from the TypeScript CLI, replace it with real targets, and test the complete stack on each — natively first, then in containers.

| | Before | After |
|---|---|---|
| `--db` values that do anything | 0 of 2 | **2 of 2** |
| Generated apps with a `docker-compose.yml` | **0** | all |
| Generated backends with a `Dockerfile` | **0** | all |
| Generator unit tests | 66 | **68** |
| Generated backend suite, `postgres` | 247 / 247 | 247 / 247 |
| Generated backend suite, `neon` (TLS) | n/a | **247 / 247** |
| TS/Rust backend equivalence | 114 files | **115 files, both targets** |

---

## `--db sqlite` is gone

It was accepted by both CLIs and did nothing. The generated backend is Postgres
throughout — `sqlx-postgres` features, `postgres://` in every `config/*.yaml`,
Postgres-only `sys_*` DDL — so no reading of `--db sqlite` produced a SQLite
app.

The TypeScript side advertised it hardest: `--help` on two commands, an
interactive wizard printing `2. SQLite (for development / testing)`, the value
stored in the project manifest, and `info` echoing it back. All removed.

Replaced with two targets that are real:

```
--db postgres   Self-hosted or managed PostgreSQL (default)
--db neon       Neon serverless Postgres; same driver, TLS required
```

While in `list`, the stack blurb was still describing **NestJS 10 + Fastify +
Kysely** as the first option. That stack and its templates were deleted from
this repo; `list` was advertising something `--stack` cannot generate. Removed.

### MariaDB was asked for and is not here

Dropped after checking, at your call, and the check is worth recording:
**loco-rs 1.0.1 has no MySQL driver.** Its `Cargo.toml` pins
`sea-orm` to `sqlx-postgres` and `sqlx-sqlite`, and `loco new --db` offers only
`sqlite | postgres | none`. On top of that the backend carries 710 lines of
hand-written Postgres DDL, 70 `sqlx::query` call sites using `$1` placeholders
and `RETURNING`, a `TEXT[]` column in `audit_log`, and an Electric proxy built
on Postgres logical replication with no MariaDB equivalent. It is a port of the
whole persistence layer plus a framework fork, not a flag.

---

## Neon

Neon is Postgres — same wire protocol, same driver, same SQL. The generated
backend needs no code changes at all. Exactly two things differ, and the
templates branch on `database.isNeon` for those two only:

1. **No localhost fallback.** `config/development.yaml` and `config/test.yaml`
   emit `get_env(name="DATABASE_URL")` with no default. A silent fallback is the
   real hazard here: unset, the app would migrate and seed a local database
   while the developer believes they are pointed at Neon. It now fails to render
   instead, naming the variable.
2. **TLS is mandatory and the database is provisioned out of band.**
   `.env.example` carries the Neon connection-string shape with
   `?sslmode=require`, and `runSetup` skips `createdb` — running it against Neon
   produced a warning on every single run, which trains people to ignore the one
   time it matters.

Everything else — all 115 backend files — is byte-identical between the two
targets and between the two generators.

### Tested against real TLS

There is no hosted Neon reachable from this container, so the profile was
exercised against a TLS-enabled Postgres using the same connection shape. That
covers what actually differs (TLS handshake, `sslmode=require`, mandatory
`DATABASE_URL`); it does not cover Neon's own endpoint behaviour such as
connection pooling or scale-to-zero cold starts.

```
psql "…?sslmode=require" -c "SELECT ssl, version FROM pg_stat_ssl …"
 t | TLSv1.3
```

| Step | Result |
|---|---|
| `cargo build` | clean |
| `cargo loco db migrate` with no `DATABASE_URL` | **refuses** — `Environment variable DATABASE_URL not found` |
| `cargo loco db migrate` over TLS | 9 migrations applied |
| `cargo loco db seed` over TLS | 17 `sys_table`, 141 `sys_field`, 1 workflow, admin created |
| Login, dictionary, bus CRUD, audit chain | all pass over TLS |
| `cargo test --test app` | **247 / 247** |

---

## Docker: there was no path at all

The larger finding of this pass. Before this change, **no generated application
could be containerised**:

- **No `docker-compose.yml` was ever produced.** Its generation sits in
  `generateSharedFiles` *after* an early `return` taken for the only stack that
  exists. The code and its template had been unreachable since the NestJS stack
  was deleted.
- **No backend `Dockerfile` existed.** Neither the templates nor `loco new`
  emit one, yet the compose template built `./backend/Dockerfile`.
- The compose template described the **old NestJS app**: `NODE_ENV` on a Rust
  binary (Loco reads `LOCO_ENV`, so it would have served development settings in
  production), a required `BETTER_AUTH_SECRET` the backend never reads, and a
  healthcheck on `/api/health` — the route is `/api/me/health`, so the check
  could never pass and `depends_on: service_healthy` would have hung the
  frontend forever.
- The **frontend `Dockerfile`** copied `backend/package.json`, which does not
  exist because the backend is a cargo crate; copied `bun.lock`, absent until
  someone runs `bun install`; installed with `--frozen-lockfile` against that
  missing lockfile; and exposed 3000, the *backend* port.

All fixed. Added `backend/Dockerfile.hbs` (multi-stage Rust build, dependency
layer cached separately, `LOCO_ENV`, healthcheck on the real route), rewrote the
compose template for this stack, rewrote the frontend Dockerfile, and wired
compose into the path that actually runs.

Compose is now rendered through Handlebars rather than string replacement, so it
branches on the target: the `neon` profile has **no `postgres` service** and
requires `DATABASE_URL`.

### A Handlebars trap worth naming

Writing the port mapping the obvious way does not compile:

```
- "${BACKEND_PORT:-{{config.port}}}:{{config.port}}"
```

A shell default closing immediately after a Handlebars expression leaves three
consecutive braces; Handlebars takes the first two as its terminator and fails
on the third. Same family as the documented "never write an inline
`style={ {…} }` in a `.hbs` template". The mappings, URLs and CORS origin are
therefore pre-built in the context as `compose.*`.

It bit three times in this file, the third being the comment that explained it —
which reproduced the hazard literally and broke the build. The comment now
describes it in prose and says *hoist, do not escape*.

### Verified with Docker, as far as policy allows

`docker compose config` is Docker's own parser and interpolator, and needs no
network:

| Target | Services | Behaviour |
|---|---|---|
| `postgres` | `postgres backend frontend` | `DATABASE_URL` resolves to the compose service with the correct `<crate>_development` name; `LOCO_ENV: production`; healthcheck on `/api/me/health` |
| `neon` | `backend frontend` | refuses to start without `DATABASE_URL`, with the message `DATABASE_URL is required for the neon target` |

**Image builds could not be run.** The Docker daemon starts fine here, but
pulling any base image is denied by the organisation's egress policy:

```
production.cloudfront.docker.com:443
gateway answered 403 to CONNECT (policy denial or upstream failure)
```

`/root/.ccr/README.md` is explicit that a 403 is a policy denial to report, not
to work around, so `docker compose build` and a running container stack remain
unverified. What is verified is that the compose files parse, interpolate and
resolve correctly for both targets, and that the Dockerfiles reference files
that exist, the right env var, the right port and the right health route — every
one of which was wrong before.

---

## Open items

- **`docker compose build` and a live container run are untested**, blocked by
  the egress policy above. Worth running wherever the registry is reachable.
- The Neon leg validates the connection profile against TLS Postgres, not a
  hosted Neon endpoint.
- Pre-existing and untouched: three `bun run type-check` errors, three clippy
  warnings, and the `==>` saga quirk. **All three are fixed** — see
  `2026-08-10-generated-app-runtime-qa.md`, which also closes the generated
  frontend's lint and type-check gates and reports the browser pass.
