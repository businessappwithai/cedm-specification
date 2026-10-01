# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this directory.

---

## What this directory is

An **orchestrator**, living at `yaml/app-and-report-with-ai-rust` inside
`cedm-specification`. It composes two products into one running system and
holds neither of them:

| | What it is | Where |
|---|---|---|
| **This directory** | The reporting-pack, subpath-overlay and front-door builds, the Docker pieces, the published guide, the model viewers and the protocol documents | [`common/`](common/) |
| **APPWITHAI** | An AI-assisted ERD designer and full-stack code generator. One YAML model (`*.eml.yaml`) describes the data, the decisions and the processes; the generator compiles all three into a running application — a **Loco.rs (Rust)** backend crate behind a TanStack Start + Astryx front end | the repository root |
| **Enterprise Reporting** | A multi-datasource analytics platform: connect external databases, ask questions in natural language, and publish the answers as reports, charts, dashboards and scheduled deliveries. Its API, workers, scheduler and seeder are a **Loco.rs (Rust)** backend (`rust/`); its TanStack Start front end renders pages and forwards to it | `yaml/enterprise_reporting_rust` |

**The server side is Rust throughout**, and **the model is YAML throughout.**
This directory was the repository `businessappwithai/app-and-report-with-ai-rust`,
which checked both products out at commits pinned in `deps.json` and carried its
own fork of a Mermaid-based modelling language. It was imported here and
converted: the pins, `deps.sh`, the checkouts and the forked language are gone,
because the language, the generator and the reporting platform are all
directories of this one repository. A change to any of them is tested against
the others in the same commit.

```
check the model            the root's `eml validate` — YAML, schema, checker
      ↓
generate the application   --stack tanstack-astryx-loco, through the root's
      ↓                    pipeline: a Loco crate + a front end
put it on /app             common/build/subpath-overlay.ts
      ↓
derive the reporting pack  common/build/reporting-pack.ts — a CLI over the
      ↓                    generator's buildReportingPack: the queries, and one
      ↓                    reporting role per role the model's rbac declares
write the front door       common/build/landing.ts — both applications, both
      ↓                    sets of accounts, served by nginx at /accounts
inject configuration       common/.runtime/.env
      ↓
build and start            docker compose — postgres; the generated Loco backend
      ↓                    (migrate, seed, serve) and its front end; the
      ↓                    platform's Loco backend and its front end; the Rust
      ↓                    seeder that loads one into the other; nginx in front
smoke-test                 /app and /report answer, both APIs are Rust's, and
                           the seeder finished
```

---

## Layout

```
yaml/app-and-report-with-ai-rust/
├── start.sh · stop.sh       generate an application and bring both up
├── docker-compose.yml       profiles: demo (one PostgreSQL) · prod (two)
├── .claude/skills/          sync-downstream — re-vendoring the browser generator
└── common/                  everything that is not a product
    ├── package.json         `bun run check` lives here
    ├── tsconfig.language.json   strict; covers build/ and scripts/
    ├── biome.json           the lint config for build/ and scripts/
    ├── build/               generate-app.ts · reporting-pack.ts · subpath-overlay.ts
    │                        · landing.ts · smoke.sh
    ├── docker/              reporting.Dockerfile (the platform's front end) · nginx · pg-init
    ├── examples/            the models (*.eml.yaml) the checks run over
    ├── scripts/             check-models · check-stacks · check-clis · check-reporting-pack
    ├── html/                the published nine-chapter guide, model-yaml.js, the
    │                        in-browser generator, html/models/ (twins of examples/)
    └── website/
        ├── llmtext/         llms-full.txt · llmdetailed.txt · llmtextenhancement.txt
        │                    · llmdetailedenhancement.txt · llms-reporting.txt
        └── viewers/         the ERD, rules and workflow model viewers
```

**Everything runs from `common/`**, and it reaches the root on purpose: the
scripts import the root's model reader (`packages/generator/src/model-yaml`),
its pipeline (`packages/generator/src/pipeline/generate-application.ts`) and
its pack derivation (`packages/generator/src/reporting/pack.ts`), so the CLI,
the pack and the modelling tool cannot disagree about what a model means.
`tsconfig.language.json` carries the root's path aliases for the same reason.

---

## Commands

```bash
bun install                              # at the repository root — the scripts import it
cd yaml/app-and-report-with-ai-rust/common
bun install

bun run check            # models → types → lint → bundles → stacks → CLIs → pack
bun run check:models     # every model reads clean, and the twins match
bun run type-check       # tsc --project tsconfig.language.json
bun run lint             # Biome over scripts/ and build/
bun run lint:fix
bun run build:language-tools   # rebuild this directory's bundles (root script)
bun run check:language-tools   # …and fail if the committed copies are stale
bun run check:stacks     # every --stack target generates, carrying what the model declared
bun run check:clis       # both generator binaries generate (appwithai-gen needs cargo)
bun run check:pack       # every derived query runs against a real generated schema
bun run check:pack:ci    # same, but a missing database fails
bun run pack             # bun build/reporting-pack.ts
bun run generate         # bun build/generate-app.ts
```

The `eml` CLI is the root's, three `--stack` targets and all:

```bash
bun ../../../language/cli/eml.ts validate -i examples/crm.eml.yaml
bun ../../../language/cli/eml.ts generate -i examples/crm.eml.yaml -o ./out --stack enterprise-reporting
```

### Install first — the failure modes are silent

Without the root's `node_modules`, every script fails on a module it cannot
resolve, and `tsc` reports thousands of phantom errors. Without the root's
built `packages/core` and `packages/generator` (`bun --filter @appwithai/core
build && bun --filter @appwithai/generator build`), `check:clis` runs a stale
`dist/`. Install and build before you believe any result.

### Use bun, never npm or pnpm

Bun is the runtime, the package manager and the test runner. Cargo is needed
only for `check:cli:rust` and for building a generated backend outside Docker.

---

## The protocol documents

`common/website/llmtext/` carries the documents a language model is pointed at.
Two describe how to **write** a model from a brief; two describe how to
**change one that already exists**:

| | Start from a brief | Start from an existing model |
|---|---|---|
| **One pass** | `llms-full.txt` | `llmtextenhancement.txt` |
| **Phased, with approval gates** | `llmdetailed.txt` §10 | `llmdetailedenhancement.txt` §10 |

**These four are the root's YAML-first editions (`website/llmtext/`) with this
directory's own material spliced in**, identically in each: §1a (this
orchestrator), §4.1.2 (the `enterprise-reporting` target) and two answering
rules at the end of §11. Each enhancement edition is derived from its base by
swapping the protocol section and copying everything else byte for byte;
splicing the same text into both keeps that true. When the root's editions
change, rebuild these from them, and check that each base and its enhancement
edition received identical additions.

`llms-reporting.txt` is this directory's own: the reporting platform's
architecture and conventions, and how a model reaches it.

Every mention of the published host is `https://www.appwithai.org`, scheme and
`www.` included — a bare host is not a URL, and a model that is handed one
reports a failed fetch as a Markdown link around a bare host.

---

## The model language

There is **one** language, at the repository root: `language/yaml/eml.schema.json`
is what a model may contain, `language/appwithai-language.json` what it means,
and `language/yaml/README.md` the prose. A model is one YAML document,
`*.eml.yaml`; nothing in this directory reads or writes Mermaid.

The reporting platform's `language/cli` re-exports the root's model rather than
carrying a fork. Before the import there were three copies of the definition,
all declaring the same version and drifted by 90 and 200 lines — a change made
in one reached neither of the others, silently. That cannot happen now.

### The three `--stack` targets

| `--stack` | Emits | Standalone |
|---|---|---|
| `node-rest` *(default)* | A dependency-free `node:http` app over a JSON-file datastore | Yes — `npm start`, no install |
| `tanstack-astryx-loco` | The full stack: a Loco.rs (Rust) backend crate — migrations, dictionary, access rules, workflows, reports and hook handlers — and a TanStack Start + Astryx front end, plus tests and a manual (~480 files), through the root's pipeline | Yes |
| `enterprise-reporting` | TanStack Start server functions (`.inputValidator()`), list/detail routes, a Kysely PostgreSQL migration, a `Database`-interface snippet | **No** — code to drop into `yaml/enterprise_reporting_rust` |

They differ in what they write, never in what they understand. The
`enterprise-reporting` target does **not** compile `hooks`, `stateMachines`,
`sagas` or `rbac`: that platform already has auth, two layers of RBAC, an
encrypted connection manager, an NL→SQL pipeline, a job runner and a UI shell.
`tanstack-nestjs` is refused by name, with its `tanstack` alias — the generator
no longer writes NestJS, and generating a Rust backend for a command that asked
for NestJS would be a different application from the one its author expected.

---

## Conventions that bite

**Two CLIs, two toolchains.** `appwithai` is the TypeScript pipeline, run by bun;
`appwithai-gen` is the generator's Rust rewrite (`crates/appwithai-gen` at the
root), run by cargo, which emits the backend crate only — the root's parity gate
holds it byte for byte to the first. Both run with `--skip-cli-scaffold`.

**The generated front end lives under `/app`, all of it.** The Loco stack's
front end is plain Vite + TanStack Start, so the subpath overlay can give it a
real `base` — unlike the Vinxi-era NestJS front end, which kept root-absolute
`/_build/` and `/assets/` URLs that nginx had to route at the root. Its client's
`/api` literals are moved to `/app/api`, and nginx sends `/app/api/` straight to
the Loco backend with the prefix taken off; the front end only serves pages. The
overlay also rewrites root-absolute JSX `href="/…"` and route-head `links`
(`/fonts/fonts.css`), and the font URLs inside `public/fonts/fonts.css` — but
**not** every `href:` object key: the sidebar's nav entries are handed to
`<Link to>`, which adds the basepath itself, and prefixing them produced
`/app/app/dashboard`.

**The overlay leaves the reporting platform's Rust forwarders alone.**
`src/server.ts` and `src/lib/api/` in `enterprise_reporting_rust` test paths
against `/api/…` to decide what goes to Rust, and Rust routes `/api/…`;
rewriting those literals to `/report/api/…` made every comparison false and
sent every API request to the disabled Node handlers. They take the prefix off
themselves (`withoutBase`), including from call-site paths the overlay did
rewrite. `smoke.sh` asserts `x-ers-backend: loco-rs` on `/report/api/health`
for exactly this.

**Models are checked in twice.** `common/examples/*.eml.yaml` and
`common/html/models/*.eml.yaml` are the same files: one set is what the scripts
read, the other is what the published guide serves. `check:models` asserts they
are byte-identical. **Edit both.**

**The published bundles are built at the root, never copied.**
`html/model-yaml.js` (the validator a language model is told to run),
`html/assets/appwithai-model.js` (what the in-browser generator is fed) and
`website/viewers/appwithai-model.js` (what the viewers read) are all bundled by
`scripts/build-site-bundles.ts` from `language/browser/`, each inlining the
root's language definition. `Bun.build` output depends on the bun version and
the platform, so a bundle built on anything but CI's pin is byte-wrong for CI
while looking right locally.

**The in-browser generator is vendored and patched.** `html/assets/appwithai-wasm.js`
comes from `app-with-ai-tanstack` and compiled Mermaid itself;
`scripts/patch-vendored-generators.ts` gives it `generateFromModel`, which takes
the model `appwithai-model.js` compiled from YAML, and removes the Mermaid entry
points from its exports. Re-vendoring means re-patching — see the
`sync-downstream` skill.

**A check must not rewrite what it read.** The root workflow fails on any
tracked modification after the checks run.

**`check:pack` skips itself when no PostgreSQL is reachable** and says so; CI
runs `check:pack:ci`, which refuses to. A check that quietly passes without
running is indistinguishable from one that ran.

## Running the two applications together

```bash
./start.sh                                     # the reference CRM model
./start.sh common/examples/my-app.eml.yaml     # any other model
./start.sh my-app.eml.yaml --profile prod      # two database servers
./start.sh --port 8080                         # somewhere other than :80
```

| | |
|---|---|
| http://localhost/ | opens the application — a redirect to `/app/` |
| http://localhost/accounts | the front door: both applications and the accounts for each |
| http://localhost/app | the application generated from the model; `/app/api/` is its Loco backend |
| http://localhost/report | the reporting platform, already holding that application's schema as a data source and its reports, charts and dashboard; `/report/api/` is forwarded to its Loco backend |

The first start compiles both Rust backends inside their images (minutes, once),
then the application's container migrates and seeds (`<app>-cli db migrate`,
`db seed`, then `start --server-and-worker` — the CLI's name comes from the
generated `Cargo.toml` and reaches compose as `APP_CLI`), and the Rust seeder
loads its schema and reporting pack into the platform; until the seeder exits,
`/report` is up but **empty**. `./stop.sh` takes it down, `--volumes` discards the databases too.

### Two applications, two logins, and why they are not merged

This is the thing most likely to be got wrong, so there is a page about it —
at `/accounts`, not at the root. **`/` opens the running application**
(`return 302 /app/`): the site is the application, and a README-like page as the
first thing somebody sees is not what a deployment should open on. The page
was the root for a while, for a real reason — a reader who did not scroll back
through the terminal never learned `/report` existed — which is why it still
exists, `./start.sh` prints both addresses and `/accounts` at the end, and
`smoke.sh` asserts both the redirect and the page.

|  | `/app` | `/report` |
|---|---|---|
| Database | `appdb` | `enterprise_config` |
| Users | its own table, its own session | its own table, its own session |
| A role decides | what you may **do** to a record | which tables your queries may **read** |
| `sales_manager` | `sales.manager@<app>.example.com` | `sales.manager@<app>.reports.example.com` |

`reporting-pack.ts` derives the second column from the *same* `rbac` the
application compiles, so the two role sets line up by name — one reporting role
per declared role, permitted to read exactly the `bus_` tables that role's
`read` rules admit. **It is a mirror, not a shared system**: nothing is
federated, neither password works on the other side, and merging them would
force one product's meaning of "role" onto the other.

Two details worth knowing:

- **The addresses differ on purpose.** Identical ones would invite a reader to
  try a single password on both. The administrator is the exception and keeps
  `admin@admin.com` on each side — the same address, two different accounts, in
  two different databases — because that is what the platform bootstraps for
  itself. Every seeded *role* account on both sides uses the password `admin`,
  and so does the application's administrator. **The reporting administrator
  does not**: the platform's bootstrap (Node's and Rust's alike) refuses an
  `ADMIN_PASSWORD` shorter than eight characters and would generate a random
  one, printed once into a log. `start.sh` generates `REPORT_ADMIN_PASSWORD`
  once into `common/.runtime/.env`, prints it at the end, and the front door
  says where it is rather than claiming `admin`.
- **Only `read` rules narrow a reporting role.** `rbac` also restricts create,
  update and delete, and none of that means anything to somebody who cannot
  write through the reporting platform at all.

**What each surface runs, and what it may claim.** The orchestrator builds the
reporting platform from its own source and changes nothing a reader sees —
`subpath-overlay.ts` rewrites only URLs so it can live under `/report`, in the
build container's copy. The guide's in-browser build cannot run a server, so its
reporting app is a **preview drawn in the platform's own layout and tokens**,
labelled as one on every screen, with a working Administration and a page naming
where the real one is for every screen that needs the platform's servers.

The table counts on the front door are asserted against `deriveAccess`'s own
`entityCounts` before the pack is written — two readings of one fact is how the
products come to disagree about what a role may see, so the second is checked
against the first rather than merely resembling it.

`start.sh`'s seven steps: check the model → generate into `common/.runtime/app` →
overlay onto `/app` → derive the pack into `common/.runtime/pack` → write the
front door → write `common/.runtime/.env` → `docker compose up`. The secrets in
`.env` (`AUTH_SECRET`, `ENCRYPTION_KEY`, `JWT_SECRET`, `REPORT_ADMIN_PASSWORD`)
are each added only when absent, so an older `.env` gains what it lacks. Everything it writes stays under
`common/.runtime/`, which is gitignored. **Neither product's source is
modified.**

**Secrets are generated once and then left alone.** Regenerating
`ENCRYPTION_KEY` leaves every stored data-source password undecryptable, and the
failure looks like a broken data source rather than a rotated key. Writing
`common/.runtime/.env` *before* running `start.sh` is therefore the supported
way to inject configuration — it keeps what it finds and rewrites only the block
it derives from the run. `build-and-run.yml` uses exactly that.

### The two profiles

- **`demo`** (default) — one `pgvector/pgvector:pg16` holding three databases:
  the application's, `enterprise_config`, and `ers_knowledge` (without Apache
  AGE, so the platform's knowledge-graph NL feature is off — it is lazy, and
  nothing else needs it).
- **`prod`** — two servers, each the image its application asks for:
  `pgvector/pgvector:pg18` for the generated application, `apache/age:PG16` for
  the platform.

Under both, the platform's configuration never shares a database with the
application it reports on: regenerating the application drops and recreates its
tables, and the reports have to survive that.

**No service declares `depends_on` for a database.** A `depends_on` naming a
service outside the active profile makes compose refuse to start at all, so
anything that must run under both profiles cannot name either database. Each
waits for its own: the generated backend migrates and seeds on start and is
restarted until that succeeds, the platform's Rust backend waits for its server
and creates its config database if a stale volume never got one, and the seeder
waits for both — including for the application's `bus_` tables to
exist, since an empty database means "not migrated yet" rather than "nothing to
report on".

**Neither prefix is stripped on the way to a front end.** Both applications are *built* to live
under their prefix — bundler `base`, router `basepath`, static lookup — so an
incoming `/report/dashboard` is the path the router expects to match. Stripping
would give the server `/dashboard` while every link it writes says
`/report/dashboard`, and navigation would break on the first click. nginx
addresses every upstream through a variable with `resolver 127.0.0.11`, so an
application that is not up yet answers 502 instead of refusing to start the
whole origin. The one place a prefix *is* taken off is `/app/api/`, which goes
to the generated Loco backend: it renders nothing, routes `/api/…`, and the
front end is not in that path at all.

### Where the reports come from

`buildReportingPack` invents nothing — it lives in the generator
(`packages/generator/src/reporting/pack.ts`) and `build/reporting-pack.ts` is
the CLI over it. Every query is derived from something the model declares:

| Model declares | Pack gets |
|---|---|
| an entity | a register — what rows exist, newest first |
| an enum-bound column | a breakdown, as a chart |
| `created_at` | volume by month, as a line |
| a state machine | a lifecycle over the states the model declares, in its order, zeroes included |
| numeric columns | a measures report, grouped by the entity's primary enum column |
| `oneToMany` | children per parent, ranked |

Names and descriptions come from each entity's and attribute's `help` — the only
place a model says what an entity is *for* rather than what shape it is. That is
the difference between a report called "bus_account by status" and one called
"Accounts by status" that explains what an account is in this business. A model
with no help text still produces a working pack; it just produces one named
after tables.

A model can also carry `reports` — a question its users actually ask, written as
the single read-only query that answers it. Those are listed first and take the top
of the dashboard. See `website/llmtext/llmdetailed.txt` §10.5.1.

---


## CI

GitHub reads workflows only from the repository root, so this directory's run
there:

| Workflow | Trigger | What it does |
|---|---|---|
| `yaml-imports.yml` | pull requests touching `yaml/`, the language or the generator; pushes to `main` | the site bundles are current and the vendored generators patched; then, from `common/`, models · types · lint · stacks · both CLIs · the reporting pack against a real `postgres:16`, and a clean tree afterwards; then the reporting platform's lint, type-check and format |
| `yaml-build-and-run.yml` | `workflow_dispatch`, nightly at 04:00 UTC | the whole thing: `start.sh` over a model, wait for `/app` and `/report`, run `smoke.sh` (content types, `/app/api` answered by Loco, `x-ers-backend: loco-rs` on `/report/api`), assert the seeder exited 0, report what the platform was loaded with, upload logs and the generated source, tear down |

No token is needed: nothing is checked out from another repository.

A path-filtered run that is skipped reports no status at all, so if
`yaml-imports` is made a required check it needs a skip-path fallback.

---

## Git workflow

1. Branch from `main`.
2. `bun install` at the root, then `cd yaml/app-and-report-with-ai-rust/common && bun install`.
3. Run `bun run check` before pushing — or at minimum `check:models`,
   `type-check` and `lint`.
4. If you touched a model under `common/examples/`, update its twin under
   `common/html/models/`.
5. If you touched `language/browser/` or anything it bundles, run
   `bun scripts/build-site-bundles.ts` at the root and commit the bundles.
6. Target `main` for PRs.
