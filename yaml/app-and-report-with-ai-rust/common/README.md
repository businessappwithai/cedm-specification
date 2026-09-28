# The orchestrator — `common/`

This directory runs two products together from one model. It holds neither
product: the generator and the language are the root of `cedm-specification`,
and the reporting platform is `yaml/enterprise_reporting_rust`. All three are
directories of one repository, so nothing here is pinned or checked out.

| | What it is | Where |
|---|---|---|
| **This directory** | The reporting-pack, subpath-overlay and front-door builds, the Docker pieces, the published guide, the model viewers and the protocol documents | `yaml/app-and-report-with-ai-rust/common` |
| **APPWITHAI** | An AI-assisted ERD designer and full-stack code generator. One YAML model (`*.eml.yaml`) describes the data, the decisions and the processes; the generator compiles all three into a running application — a **Loco.rs (Rust)** backend behind a TanStack Start + Astryx front end | the repository root |
| **Enterprise Reporting** | A multi-datasource analytics platform — reports, charts, dashboards and natural-language queries over connected databases — with a **Loco.rs (Rust)** backend (`rust/`) behind a TanStack Start front end | `yaml/enterprise_reporting_rust` |

```
yaml/app-and-report-with-ai-rust/
├── start.sh · stop.sh       generate an application and bring both up
├── docker-compose.yml       profiles: demo (one PostgreSQL) · prod (two)
└── common/
    ├── build/               generate-app.ts · reporting-pack.ts · subpath-overlay.ts · landing.ts · smoke.sh
    ├── docker/              reporting.Dockerfile · nginx · pg-init
    ├── examples/            the models (*.eml.yaml) the checks run over
    ├── html/                the published guide, model-yaml.js, the in-browser generator, html/models/
    ├── scripts/             check-models · check-stacks · check-clis · check-reporting-pack
    └── website/
        ├── llmtext/         llms-full.txt · llmdetailed.txt · the two enhancement editions · llms-reporting.txt
        └── viewers/         the model viewers
```

## The language is the root's

A model is one YAML document, validated against `language/yaml/eml.schema.json`
at the repository root, and read by the root's one reader. The scripts here
import it (`../../../language/…` from `common/`); none of them parses a model
itself. The reporting platform's `language/cli` re-exports the same model, so a
model means one thing to all three.

`examples/*.eml.yaml` and `html/models/*.eml.yaml` are the same files checked in
twice — one set is what the scripts read, the other is what the published guide
serves — and `check:models` asserts they stay byte-identical. **Edit both.**

## Running both, from one model

```bash
bun install                                       # at the repository root, once
(cd yaml/app-and-report-with-ai-rust/common && bun install)
cd yaml/app-and-report-with-ai-rust
./start.sh                                        # the reference CRM model
./start.sh common/examples/my-app.eml.yaml        # any other model
./start.sh my-app.eml.yaml --profile prod         # two database servers
./start.sh --port 8080                            # somewhere other than :80
```

`start.sh` refuses to run without the root's and `common/`'s `node_modules`, and
says which is missing: generation drives the root's pipeline, and without it the
failure is a module that cannot be resolved, a long way in.

| | |
|---|---|
| http://localhost/ | opens the application (a redirect to `/app/`) |
| http://localhost/app | the application generated from the model — its Loco backend answers `/app/api/` |
| http://localhost/report | the reporting platform, already holding that application's schema as a data source and its reports, charts and dashboard — its Loco backend answers `/report/api/` |
| http://localhost/accounts | the accounts for both applications, one pair per role |

`start.sh`'s seven steps: check the model with the root's `eml validate` →
generate the application into `common/.runtime/app` through the root's pipeline
(`--stack tanstack-astryx-loco`) → put its front end on `/app` → derive the
reporting pack → write the front door → write `common/.runtime/.env` →
`docker compose up`. Everything it writes goes under `common/.runtime/`, which is
not checked in. `stop.sh` takes it down; `stop.sh --volumes` discards the
databases too.

The first `up` compiles both Rust backends inside their images, which takes
several minutes; later builds reuse the dependency layers. No Rust toolchain is
needed on the machine running `start.sh`: generation skips the `loco new`
scaffold, which only contributes the framework's own CI workflow, rustfmt config
and `AGENTS.md`.

**Secrets are generated once and then left alone.** `AUTH_SECRET`,
`ENCRYPTION_KEY`, `JWT_SECRET` and `REPORT_ADMIN_PASSWORD` are each added to
`common/.runtime/.env` only when absent. Regenerating `ENCRYPTION_KEY` leaves
every stored data-source password undecryptable, and the failure looks like a
broken data source rather than a rotated key. Writing that file before running
`start.sh` is the supported way to inject configuration.

**The two profiles.** `demo` (the default) runs one pgvector PostgreSQL 16
holding three databases — the application's, `enterprise_config` and
`ers_knowledge`. `prod` runs two servers, each the image its application asks
for: pgvector on PostgreSQL 18 for the generated application, Apache AGE on 16
for the reporting platform. Under both, the reporting platform's configuration
never shares a database with the application it reports on — regenerating the
application drops and recreates its tables, and the reports have to survive
that.

**Where the reports come from.** `build/reporting-pack.ts` is a CLI over the
generator's `buildReportingPack` (`packages/generator/src/reporting/pack.ts` at
the root). It derives a baseline from structure — a register per entity, a
breakdown per enum-bound column, a lifecycle per state machine in the order the
model lists its states, children per one-to-many relationship — and one
reporting role per role the model's `rbac` declares, reading exactly the tables
that role may read. A model can also carry `reports`, each a question its users
actually ask written as the single read-only query that answers it; those are
listed first and take the top of the dashboard.

## One model, three targets

```bash
bun language/cli/eml.ts validate -i <model.eml.yaml>          # from the repository root

bun language/cli/eml.ts generate -i <model> -o ./out --stack node-rest
bun language/cli/eml.ts generate -i <model> -o ./out --stack tanstack-astryx-loco
bun language/cli/eml.ts generate -i <model> -o ./out --stack enterprise-reporting
```

The three differ in what they write, never in what they understand — all of them
read the same compiled model. `node-rest` is a dependency-free prototype;
`tanstack-astryx-loco` is the whole application; `enterprise-reporting` is code
shaped to drop into the reporting platform, and it reaches least on purpose:
that platform already holds auth, two layers of RBAC, an encrypted connection
manager, an NL→SQL pipeline, a job runner and a UI shell. It does **not** compile
`hooks`, `stateMachines`, `sagas` or `rbac`.

The generator also ships two binaries of its own — `appwithai` (the TypeScript
pipeline) and `appwithai-gen` (its Rust rewrite, the backend crate only, byte
for byte the same). `bun run check:clis` runs both over a model here.

## Checks

```bash
bun install
bun run check            # models, types, lint, bundles, every stack, both CLIs, the reporting SQL
```

| | |
|---|---|
| `check:models` | Every model in `examples/` reads clean through the root's reader, and `html/models/` is byte-identical to its counterpart |
| `type-check` | `build/**` and `scripts/**` under the strict config (`tsconfig.language.json`) |
| `lint` | Biome over `scripts/` and `build/` |
| `check:language-tools` | `html/model-yaml.js`, `html/assets/appwithai-model.js` and `website/viewers/appwithai-model.js` match what `scripts/build-site-bundles.ts` at the root builds from `language/browser/` |
| `check:stacks` | All three `--stack` targets generate, and carry what the model declared |
| `check:clis` | Both generator binaries generate, and wrote what each should. `appwithai-gen` needs cargo |
| `check:pack` | Every query in every model's reporting pack runs against a **real** generated schema — the `bus_` DDL lifted out of the Loco crate's `m0002_bus_tables` migration. Skips itself with a message when no PostgreSQL is reachable; `check:pack:ci` refuses to |

## CI

Two workflows at the repository root run this directory, because GitHub reads
workflows only from the root's `.github/workflows/`:

| | |
|---|---|
| `yaml-imports.yml` | On pull requests touching `yaml/`, the language or the generator: the site bundles are current, then every check above against a real PostgreSQL, then the reporting platform's lint, type-check and format |
| `yaml-build-and-run.yml` | On `workflow_dispatch` and nightly: `start.sh` over a model, then proves `/app` and `/report` answer — content types included, both APIs answered by Rust, via `build/smoke.sh` — and that the seeder exited 0 |

## Reading further

| | |
|---|---|
| The model language | `language/yaml/README.md` at the repository root |
| APPWITHAI, in full | [`website/llmtext/llms-full.txt`](website/llmtext/llms-full.txt) |
| The interactive authoring walkthrough | [`website/llmtext/llmdetailed.txt`](website/llmtext/llmdetailed.txt) |
| The reporting platform, in full | [`website/llmtext/llms-reporting.txt`](website/llmtext/llms-reporting.txt) |
| The human guide | [`html/index.html`](html/index.html) — nine chapters building a CRM |

`../CLAUDE.md` is the authority on this directory and on how the two products
are run together; the root's and the reporting platform's `CLAUDE.md` on theirs.
