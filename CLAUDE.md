# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager Rule

**CRITICAL**: Always use `bun` or `bun.js` for all package management and script execution. NEVER use `npm` or `pnpm`.

- Use `bun install` instead of `npm install`
- Use `bun run <script>` instead of `npm run <script>`
- Use `bun --filter @package build` for monorepo packages
- Use `bunx` instead of `npx`; use `#!/usr/bin/env bun` shebangs
- Generated projects must also use bun exclusively

See `.claude/custom-rules.md` for the full Bun-only policy.

---

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

**Install gstack** (one-time setup per developer):
```bash
bun run setup:gstack
```

Available gstack skills:
- `/office-hours` - Brainstorming and idea exploration
- `/plan-ceo-review` - Strategic plan review
- `/plan-eng-review` - Architecture/engineering plan review
- `/plan-design-review` - Design plan review
- `/design-consultation` - Creating a design system
- `/design-shotgun` - Rapid design exploration
- `/design-html` - HTML/CSS design prototyping
- `/review` - Code review before merge
- `/ship` - Ready to deploy / create PR
- `/land-and-deploy` - Land PR and deploy
- `/canary` - Canary deployment
- `/benchmark` - Performance benchmarking
- `/browse` - Headless browser for web browsing and QA testing
- `/connect-chrome` - Connect to a running Chrome instance
- `/qa` - Full QA testing of the app
- `/qa-only` - QA testing without code changes
- `/design-review` - Visual design audit
- `/setup-browser-cookies` - Configure browser cookies
- `/setup-deploy` - Configure deployment pipeline
- `/setup-gbrain` - Configure gstack brain
- `/retro` - Weekly retrospective
- `/investigate` - Debugging errors
- `/document-release` - Post-ship doc updates
- `/document-generate` - Generate documentation
- `/codex` - Adversarial code review / second opinion
- `/cso` - Chief Security Officer review
- `/autoplan` - Automated planning
- `/plan-devex-review` - Developer experience plan review
- `/devex-review` - Developer experience review
- `/careful` - Working with production or live systems
- `/freeze` - Scope edits to one module/directory
- `/guard` - Maximum safety mode
- `/unfreeze` - Remove edit restrictions
- `/gstack-upgrade` - Upgrade gstack to latest version
- `/learn` - Learn from codebase patterns

### Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review

---

# AppWithAI - AI Coding Assistant Guide

**Project**: AppWithAI - AI-Powered Entity Relationship Design & Code Generation Platform
**Version**: 5.1.0 (`@appwithai/web` is 5.1.1; the generator CLI reports 5.2.0)
**Runtime**: Bun.js >= 1.3.14 for this repo (`bun.lock` is authoritative;
`pnpm-workspace.yaml` / `pnpm-lock.yaml` are vestigial — ignore them). A Rust
toolchain is now required as well: the generated backend is a cargo crate, the
generator shells out to `loco new`, and `crates/appwithai-gen` is Rust.

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `bun install` | Install dependencies |
| `bun run dev` | Start web app (http://localhost:3000) |
| `bun run dev:mastra` | Start Mastra AI service (http://localhost:4111) |
| `bun run build` | Build all packages (lint → core → generator → ai → web) |
| `bun run type-check` | TypeScript validation (root tsconfig, `--noEmit`) |
| `bun run type-check:language` | Type-check `language/**` (its own tsconfig; the root one excludes it) |
| `bun run parity` | Generate with both generators and diff the backends |
| `bun run lint` | Biome lint |
| `bun run lint:fix` | Biome check + autofix (`biome check --write .`) |
| `bun run format` | Biome format (`biome format --write .`) |
| `bun run generate` | Generate an app (all flags passed through) |
| `bun run generate:tanstack` | Same, with `--stack tanstack-astryx-loco` pinned (`--db postgres` \| `neon`) |
| `bun run eml` | The `eml` language CLI (`validate`, `info`, `sagas`, `generate`) |
| `appwithai convert <model>` | Convert between a model document (`.eml.yaml`) and a CEDM model (`.cedm.yaml`) |
| `bun run convert` | Run the AI conversion CLI |
| `bun run test` | Unit tests (Vitest, via `@appwithai/web`) |
| `bun run test:generator` | Generator unit tests (Vitest, via `@appwithai/generator`) |
| `bun run test:e2e:generated` | The 303-test end-to-end suite — generator, output, and the output *running* |
| `bun run test:playwright` | Playwright E2E tests |
| `bun run test:e2e:server` | E2E with automatic server startup |
| `bun run seed:admin -- --email you@example.com` | Run migrations + promote a user to admin |
| `bun run clean` | Remove all `node_modules` and `dist` directories |

**Run a single Vitest test file:**
```bash
bun --filter @appwithai/web test -- path/to/file.spec.ts
```

**Run a single Playwright test file:**
```bash
bunx playwright test tests/e2e/specific.e2e.spec.ts
```

### Known-broken scripts

- Root `vitest.config.ts` references `./test/setup.ts`, which does not exist. The config that actually runs is `packages/web/vitest.config.ts`. Prefer `bun run test`.
- `packages/web` still declares a `lint` script using `eslint`, but ESLint is not a dependency. Lint from the root with Biome.
- `bun run lint` reports **2933 errors and 2164 warnings on a clean checkout**,
  so it cannot be used as a gate — a change that adds none is indistinguishable
  from one that adds fifty. Until that backlog is cleared, check your own work
  with `biome lint <the files you touched>` and compare against the same files
  on `main`. The gates that do work are `bun run type-check`,
  `bun run type-check:language`, `bun run test`, `bun run test:generator`,
  `cargo clippy -p appwithai-gen --all-targets -- -D warnings` and
  `bun run parity`.
- **Clippy is only a gate if you run CI's toolchain.** `.github/workflows/parity.yml`
  uses `dtolnay/rust-toolchain@stable`, which moves; this container may be
  several releases behind it. A lint added in between passes locally and fails
  in CI — `explicit_counter_loop` did exactly that. Check which version CI last
  used (it is in the clippy help URL of any failure), install it, and run
  `cargo +<version> clippy -p appwithai-gen --all-targets -- -D warnings`
  before pushing Rust changes.

Removed rather than documented, because their targets never existed: `migrate`
(pointed at `packages/generator/migrations/migrate.ts`) and `test:app` /
`test:e2e` / `test:e2e:all` / `test:complete` (all pointed into a root `test/`
directory). The modelling tool's schema is created by `runMigrations()` in
`packages/core/src/services/database.service.ts` — see `bun run seed:admin`,
which calls it.

---

## Project Overview

AppWithAI turns natural-language descriptions into production-ready full-stack applications:

- AI-powered entity extraction via Mastra.ai agents against a **local OpenAI-compatible model**
- Human-in-the-loop (HITL) approval workflow for ERD design
- Visual model designer: the YAML model drawn with React Flow and laid out by elkjs
- Full-stack code generation: TanStack Start + Astryx frontend on a Loco.rs (Rust) backend
- Dictionary-driven architecture inspired by Compiere ERP (`sys_*` tables)
- Business rules via GoRules JDM / zen-engine
- CopilotKit integration for AI-assisted UI
- E2B sandbox for code execution in generated projects
- **The model language** — one YAML document per application: entities, rules, workflows, access (see `language/`)

### Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Bun.js >= 1.3.14 |
| AI Orchestration | Mastra.ai v1.54+, CopilotKit v1.64+ |
| AI Model | **Local OpenAI-compatible endpoint** (default `qwen3.6:27b-mlx`) — see AI Model Configuration |
| Frontend | TanStack Start v1.168, TanStack Router v1.170, Vite 8, React 19, Tailwind CSS v4, Zustand 5 |
| Frontend (generated) | TanStack Start + **Astryx** (all 26 `components/ui/*` adapters); no Radix, no CVA |
| Diagrams | `@xyflow/react` (React Flow), `elkjs` (layout) |
| Rules | `@gorules/zen-engine` (this repo), the `zen-engine` **crate** (generated backend), `@gorules/jdm-editor` (web UI) |
| Auth | Better Auth (core config) + custom session routes (web) |
| Backend (generated) | **Loco.rs 1.2** (Axum + SeaORM/sqlx), Rust 2021 |
| API docs (generated) | **utoipa 5** + `utoipa-redoc` / `utoipa-scalar` — `/openapi.json`, `/redoc`, `/scalar` |
| Database | PostgreSQL via Kysely + `pg`; LibSQL/SQLite for Mastra state |
| Database (generated) | PostgreSQL — `--db postgres` (self-hosted/managed) or `--db neon` |
| Templates | Handlebars 4.7+ |
| Testing | Vitest 4, Playwright 1.62, Testing Library; generated apps add `cargo test` + `bun:test` |
| Code Sandbox | E2B Code Interpreter |
| Linter/Formatter | **Biome** (replaces ESLint + Prettier) |

> Tailwind v4 is wired through the `@tailwindcss/vite` plugin — there is no v3-style content-scanning step.

---

## AI Model Configuration

**Important:** this project no longer calls the Anthropic API. `ANTHROPIC_API_KEY` is dead config; the `@anthropic-ai/sdk` dependency is vestigial.

All model configuration lives in exactly one file — `packages/ai/src/config.ts`:

```ts
export const AI_BASE_URL = process.env.LOCAL_AI_BASE_URL ?? "http://localhost:8000/v1";
export const AI_MODEL    = process.env.LOCAL_AI_MODEL    ?? "qwen3.6:27b-mlx";
export const AI_API_KEY  = process.env.LOCAL_AI_API_KEY  ?? "local";

/** Pass directly as the `model` field of any Mastra Agent. */
export const mastraModelConfig = {
  id: `openai/${AI_MODEL}`,
  url: AI_BASE_URL,
  apiKey: AI_API_KEY,
} as const;
```

**Never hard-code model strings or base URLs in agents or API routes.** Import
`mastraModelConfig` (or `AI_MODEL` / `AI_BASE_URL`) from `../config` instead.

A local `llama.cpp` server is optionally supported via `LLAMA_CPP_BASE_URL` /
`LLAMA_CPP_MODEL` (`packages/ai/src/providers/llama.ts`).

---

## Monorepo Structure

```
app-with-ai-tanstack/
├── packages/
│   ├── core/          # Types, hooks, services, auth, rules, workflow, config
│   ├── generator/     # Code generation engine, CLI, Handlebars templates
│   ├── ai/            # Mastra.ai agents, workflows, converter, CLI
│   └── web/           # TanStack Start app (Vite 8 + React 19)
├── crates/
│   └── appwithai-gen/ # The Rust generator (clap CLI) — see below
├── language/          # The model language: definition, YAML schema, checker, `eml` CLI
├── docs/              # Architecture, development, testing, roadmap
├── generated-projects/# Output directory for generated applications
├── tests/             # Playwright E2E suites
├── scripts/           # Setup, seeding, and test automation
├── examples/          # Model documents (.eml.yaml) and CEDM models (.cedm.yaml)
└── .claude/           # Project rules, plans, and local skills
```

Root docs: `DESIGN.md`, `HOOKS_GUIDE.md`, `READEME.md` (sic — feature overview), `TODOS.md`, `CHANGELOG.md`.

### Package Aliases

Path aliases are defined in root `tsconfig.json` and mirrored in each Vite/Vitest config.

| Alias | Resolves to |
|-------|-------------|
| `@appwithai/core` (+ `/*`) | `packages/core/src` |
| `@appwithai/generator` (+ `/*`) | `packages/generator/src` |
| `@appwithai/ai` (+ `/*`) | `packages/ai/src` |
| `@appwithai/web` (+ `/*`) | `packages/web/src` |
| `@/*` | `packages/web/src/*` |
| `#/*` | `packages/web/src/*` (web package `imports` field) |

`@appwithai/core` publishes explicit subpath exports — `./types`, `./hooks`,
`./services`, `./utils`, `./generators`, `./auth`, `./workflow`, `./workflows`,
`./rules`, `./config`. Adding a new subdirectory to core requires adding both an
`exports` entry **and** a `bun build` invocation in `packages/core/package.json`.

---

## Package Details

### @appwithai/core (`packages/core/`)

```
src/
├── auth/              # Better Auth config, guards, decorators, session helpers
├── config/            # db.config.ts (the ONLY DB connection site), db.types.ts, workflow.config.ts
├── generators/
│   └── hook-translator/   # Parses hook source into generated code
├── hooks/             # hook-builder, hook-executor (globalHookExecutor), hook-registry
├── rules/             # zen-engine singleton, rules-engine.service, rule-cache, jdm.schema
├── services/          # base.service, database.service, entity.service, process-manager
├── types/             # api, bus-entity, dictionary, entity, hook, rbac, rule, sys-dictionary
├── utils/             # formatting, naming, table-naming
├── validation/        # entity.validation, Zod schemas
├── workflow/          # workflow.service, workflow.types
└── workflows/         # workflow-polling.helper
```

### @appwithai/generator (`packages/generator/`)

Code generation engine. **One stack:**

| `StackOption` | Backend | Frontend |
|---|---|---|
| `tanstack-astryx-loco` | Loco.rs 1.2 (Axum + SeaORM/sqlx) | TanStack Start + Astryx |

`tanstackjs-nestjs` is gone — its generators and templates were deleted, and
`StackOption` survives as a one-member union so the flag keeps working. Treat
`docs/MIGRATION-LOCO-ASTRYX.md` as history: it describes the migration, not a
choice you still make. Anything in this repo still phrased as "both stacks" is
stale; the `<output>/tests/` suites are no longer a cross-stack parity oracle
because there is nothing left to be at parity with.

**CLI binaries**: `appwithai`, `appwithai-generate` (Commander.js, `src/cli/generate.ts`)

```
src/
├── cli/generate.ts            # generate | list | backend | frontend subcommands
├── generators/
│   ├── base.generator.ts
│   ├── full-stack.generator.ts    # StackOption type + orchestration
│   ├── orchestrator.ts
│   ├── dictionary.generator.ts
│   ├── tanstack-astryx-loco/      # loco-backend + astryx-frontend generators
│   └── tests/                     # E2E test generators
├── model/                     # records, compile.ts, compile-erd.ts, language-maps.ts
├── model-yaml/                # readModelYaml, the fixer, document → records
├── model-cedm/                # CEDM models: read and lower
├── workflows/saga.ts          # saga steps → BPMN
├── templates/loader.ts
└── utils/
templates/
├── common/                 # migrations, seeds, hooks, services, AI agents/workflows
└── tanstack-astryx-loco/
    ├── docker-compose.yml.hbs  # rendered, and branches on --db (no postgres service for neon)
    ├── backend/            # Loco.rs: Cargo workspace, migration/ crate, config/*.yaml,
    │                       # .env.example.hbs, Dockerfile.hbs, controllers/bus.rs,
    │                       # src/openapi.rs.hbs,
    │                       # services/{dictionary,dynamic_repo,row_json}.rs
    ├── frontend/           # TanStack Start routes/components + the Astryx overlay
    └── tests/              # the generated bun:test harness and suites
```

**Database targets: `--db postgres` (default) or `--db neon`.** `sqlite` is gone
— it was accepted by both CLIs and ignored, because the backend is Postgres
throughout (sqlx-postgres features, `postgres://` in every `config/*.yaml`,
Postgres-only `sys_*` DDL). MariaDB is not available: loco-rs 1.2 pins sea-orm
to sqlx-postgres and sqlx-sqlite with no MySQL driver. Neon is Postgres, so the
backend needs no code changes; templates branch on `database.isNeon` for exactly
two things — no localhost fallback in `development.yaml`/`test.yaml` (an unset
`DATABASE_URL` must fail loudly rather than silently migrate a local database),
and `?sslmode=require` in `.env.example` with `runSetup` skipping `createdb`.

**Never write a `${VAR:-default}` shell expansion inline next to a Handlebars
expression.** `${BACKEND_PORT:-{{config.port}}}` leaves three consecutive braces
and Handlebars throws on the third — the same two-braces trap as an inline
`style={ {…} }` in a `.tsx` template. Use the `shellDefault` / `shellRequired`
helpers, which emit the whole expansion. `src/templates/__tests__/template-syntax.test.ts`
precompiles every `.hbs` and separately rejects the inline shape, so a new one
cannot reach a user.

**One template per output file.** A `foo.tsx` and a `foo.tsx.hbs` side by side
means one of them is dead, and an edit to the dead one silently does nothing —
this has now caused two wasted fixes (see the `ref_label_fields` note in
`docs/qa/`). The generator decides per file: `renderTemplate("…​.hbs")` renders,
a `{ src, dest }` entry in the static-copy list copies verbatim. Before editing a
frontend template, confirm which of the two the generator actually reads —
`staticAdminPages` in `tanstack-start-frontend.generator.ts` is the copy list.
The four stale pairs that used to sit under `frontend/src/routes/admin/` have
been deleted; the plain `.tsx` is the live copy of each.

**Every key the model declares reaches the application.** `indexes`, `enums`,
an attribute's `enum` and `help`, and an entity's `help`, `icon` and `parent`
are read into records by `model-yaml/to-records.ts` and compiled by
`model/compile-erd.ts`, mirrored in `crates/appwithai-gen/src/yaml_model.rs` and
`model.rs`. A modelled enum is a `sys_ref_list` and renders as a dropdown; an
`indexes` composite reaches the DDL, which no convention can produce.

**An entity's `icon` compiles to `sys_table.icon`** — the dashboard card, the
window heading and the navigation all draw it. A lucide name, taken as written:
neither checker carries lucide's catalogue, so an unknown name is not a
diagnostic and renders a placeholder (`icon: flask` is the trap — lucide has
`flask-conical` and no `flask`). It is written **only when the model declares
one**: the column defaults to `'Table'` in m0001, and the name-pattern guess in
`getEntityIcon()` stays out of the seed deliberately, because a derivation there
would be a second one for `crates/appwithai-gen` to mirror with only the parity
gate holding them together.

**Which spelling of a lucide name actually renders is `ui/icon.tsx`'s problem,
and it got it wrong.** The component looked names up in
`import * as LucideIcons`, whose keys are lucide's **PascalCase exports**
(`FlaskConical`), while every name the dictionary holds is lucide's own
**kebab-case id** — which is what `icon: flask-conical` on an entity writes and
what the language definition names as the spelling to use. So a model that
declared an icon rendered exactly like one that declared none. It resolves
through `dynamicIconImports` now, keyed by those ids, with a normaliser that
accepts `LayoutGrid`, `layout_grid` and `layout-grid` alike — `categories`
writes the first and `entities` the third, and both occur in one payload.
That also settles the download: the barrel cannot be tree-shaken, so the
dashboard pulled a **444 KB** chunk to draw a handful of glyphs; the same
screen's 26 distinct icons now come to **21 KB** as one lazy chunk each.

**The generated app pins lucide 0.312, and its ids are not the current ones.**
`dynamicIconImports` lists 1401, and a name from a later release is not among
them — `triangle-alert` is `alert-triangle` here, and `examples/drug-discovery.eml.yaml`
shipped the wrong one. Neither checker carries the catalogue, so nothing reports
it; check a new name against
`node_modules/lucide-react/dynamicIconImports.js` in a generated frontend.

Because directives are read from `%%` lines, **a new helper or directive is
invisible to the parity gate unless a corpus model exercises it** — Handlebars
strict mode is off in both engines, so a helper missing from the Rust registry
renders as an empty string rather than failing. Grow
`language/yaml/examples/crm.eml.yaml` with the feature.

**Generating an app** (always test against `examples/drug-discovery.eml.yaml` —
17 entities, 7 categories, 1 saga; it is the model this repo is validated on):

```bash
bun run generate:tanstack -- -i examples/drug-discovery.eml.yaml \
  -o generated-projects/drug-discovery -n drug-discovery
createdb drug_discovery_development          # <crate>_development, see below
cd generated-projects/drug-discovery/backend
cargo loco db migrate && cargo loco db seed
cargo loco start --server-and-worker         # :3000
cd ../frontend && bun install && bun run dev # :3001
```

Sign in as `admin@admin.com` / `admin` — the values `ensure_admin` falls back to.
The API describes itself at `http://localhost:3000/openapi.json`, with browsable
UIs at `/redoc` and `/scalar`. `docker compose up` works too — compose and both
Dockerfiles are generated, and the `neon` profile drops the postgres service.

Things to know before editing it:

- **`loco new` does the scaffolding; templates fill the rest.** Phase 1 shells
  out to the Loco CLI, installing it with `cargo install loco --version ^1.2 --locked` if it is missing or older than the 1.2 line the templates pin,
  and Phase 2 overlays the templates. The scaffold is where the framework's own
  current defaults come from — the CI workflow, `.rustfmt.toml`, `AGENTS.md`,
  `.gitignore` — which is why this repo keeps no copies of them and why a failed
  scaffold is a hard error rather than a silent fallback. `--skip-cli-scaffold`
  opts out for offline builds.
  `loco new` refuses to write into a path that already exists, so it runs in a
  scratch directory and its output is copied across; that is what makes
  regenerating over an existing project work. `pruneScaffold()` then deletes the
  starter files this architecture replaces (its `users` migration, mailers,
  dtos, fixtures, examples, tests) so they never compile alongside the overlay.
- **The backend is a cargo crate, not a bun workspace member.** Generated
  projects are bilingual by design: `cargo` owns `backend/`, `bun` owns
  `frontend/` and `tests/`. The backend has no `package.json` — Loco's CLI is
  itself a clap app and provides start/migrate/seed/test/task directly.
  `cargo loco` is not a real cargo subcommand: generated backends ship a
  `.cargo/config.toml` aliasing it to `run --bin <name>-cli --`, which is what
  makes the documented commands work without installing anything globally.
- **The dictionary is a seed, not a migration.** `backend/seed/dictionary.sql`
  is generated from the model and applied by `cargo loco task seed_dictionary`.
  Without it every `/api/bus/*` route 404s, because the dictionary is what tells
  the generic controller which tables exist. Its ids are deterministic UUIDv5s,
  so the file is idempotent and stable across regenerations.
  `cargo loco db seed` runs **four** tasks, in this order and for these reasons:
  `seed_dictionary` → `seed_workflows` (a saga names entities the dictionary has
  to already describe) → `seed_access` (a transition rule names an edge a
  workflow drew) → `ensure_admin` (it grants a role `seed_dictionary` created).
  All four are idempotent.
- **`rbac` compiles to `seed/access.sql`, applied by `seed_access`.** Roles
  into `sys_role`, per-operation restrictions into `sys_operation_access`,
  per-transition into `sys_transition_access`, all `is_model_managed` so
  regeneration can replace what it owns without discarding what an administrator
  added in the running application. The task then creates **one account per
  declared role** — in Rust, not SQL, because a credential row needs an argon2
  digest: an application whose only account is the administrator cannot
  demonstrate access control the administrator bypasses. Those accounts share
  `ROLE_ACCOUNT_PASSWORD` (default `admin`), and unlike `ensure_admin` a re-run
  does not reset them.
- **`hooks` compiles to Rust, and the handler bodies are the developer's.**
  `src/hooks/mod.rs` is a registry of 13 dispatch functions — one per lifecycle
  event — that the generic bus controller calls unconditionally around every
  CRUD operation; `src/hooks/handlers/<entity>.rs` holds one function per
  declared hook. The asymmetry between them is the whole design: the registry is
  **rewritten on every run**, so a newly declared hook is always picked up, and a
  handler module is **written once and never touched**, so regenerating a project
  cannot delete an implementation someone wrote. A hook added to the model later
  is appended to the existing module rather than triggering a rewrite. Merging
  the two into one file would force a choice between losing implementations and
  never picking up a new hook.
  Both files are emitted even for a model with no `hooks`: `lib.rs` declares
  `pub mod hooks;` and the controller calls the dispatchers regardless, so a
  skipped module is a crate that does not compile — the `include_str!` trap in a
  different costume, and just as invisible to the parity gate.
  Three registry shapes come out of a model and **the choice is not cosmetic**:
  no declaring entity emits `let _ = (entity, …)`, one emits an `if`, two or
  more emit a `match`. A one-arm `match` is what clippy's `single_match` rejects,
  and a generated backend is expected to pass `-D warnings` — so how many
  entities declare an event decides whether the crate builds in CI. All three
  shapes occur across the corpus (drug-discovery has empties, crm has 7 matches
  and 6 ifs).
  Ordering inside a handler is fixed and deliberate: `customValidate` runs
  before `beforeCreate`/`beforeUpdate`, so validation sees what the caller
  actually sent rather than what a transform left behind; `after*` hooks run
  *after* the audit entry and cannot undo the write. `beforeDelete` returning
  `Ok(false)` refuses the request — a guard, not an error.
  The entity key is normalised (`bus_compound`, `compound`, `Compound` and
  `chemical-inventory` all reach the same handlers), because a hook that fires
  from the REST route and not from the UI's is worse than one that never fires.
- **A line item has no window of its own.** `parent: Invoice` on
  `InvoiceLine` says the child has no life away from its parent, and the dictionary
  is where that stops being a comment and becomes the application: no
  `sys_window`, so no card on the dashboard and nothing to navigate to, and its
  `sys_tab` is attached to the *parent's* window at `tab_level 1`, numbered
  after the parent's own tab, with `link_column_id` on the foreign key it
  already declared and `is_parent` marked on that column. That is what puts the
  lines under the invoice you opened.
  Two ordering constraints fall out, and both are in the seed for a reason:
  parents are emitted before children (a stable partition, so a model with no
  parents is byte-identical to before) because `sys_tab.sys_window_id` is a NOT
  NULL foreign key; and `link_column_id` is set by a trailing `UPDATE` because
  it points at a `sys_column` row the tab insert precedes.
  A child naming a parent the model does not declare keeps a window of its own —
  an orphan you can still open is fixable, one that has silently vanished is not.
- **The seed emits a full UI layer, one row per thing.** For drug-discovery:
  17 `sys_table`, 141 `sys_column`, and from those **one `sys_tab` per entity
  (17) and one `sys_field` per column (141)**, plus 25 `sys_window` — the 17
  entity windows and the 8 admin windows `ADMIN_WINDOWS` declares (Audit Log,
  Business Rules, Role Administration, System Configuration, Table and Column,
  User Administration, Window/Tab/Field, Workflow Designer), which carry no tab
  onto a business table. Those eight are what the dashboard's
  **Application Dictionary** section renders, so the list is load-bearing rather
  than descriptive: add one and it appears, with the route in its `description`
  and the lucide id in its `icon`. That is the starting point, not the final layout: an admin
  reorders, hides and groups fields through `/api/sys/*` afterwards, and the
  change lands on the next request — every dictionary write calls
  `invalidate_for`, because the product promise is that reordering a field takes
  effect without a redeploy (§6.4).
  **A table or column added at run time is paired the same way.** `sys::create`
  provisions the window and tab for a new `sys_table`, and the field for a new
  `sys_column`, because a table with no window has no screen and a column with
  no field is invisible on the one it has — and both failures are silent. A
  caller-supplied `sys_window_id` is reused rather than duplicated, but the tab
  is still created on it. Note this is also why `sys` writes bind through
  `dynamic_repo::raw_json_to_expr`: the dictionary is full of UUID foreign keys,
  and binding them by JSON type made `POST /api/sys/columns` fail outright.
- **A lookup's target table is derived from the column name, never stored.**
  `sys_column` has no `ref_table_name` column and `sys_ref_table` is empty by
  design; `resolve_ref_table_name` derives it, in this order: a person-role name
  or any `_by`/`_by_id` suffix goes to `bus_user`; a **qualifier prefix**
  (`parent_`) comes off, and the stripped name is re-checked against the
  person-role list; then `<entity>_id → bus_<entity>`.
  The qualifier step is what makes a hierarchical self-reference work —
  `parent_sample_id` is a Sample, and deriving `bus_parent_sample` gave a table
  that does not exist. It is unconditional, so a model that genuinely declares a
  `ParentSample` entity resolves to `bus_sample` instead; `EML119` reports the
  dangling reference that results.
  The canonical rules live in `foreignKeys` in `language/appwithai-language.json`
  and are mirrored in **seven** places that must agree: the backend's
  `dictionary.rs`, the generated `tests/support/entities.rs`, the bun
  `tests/harness/entities.ts` (`referencedEntity`, which also orders the bulk seed and its cleanup), `common/seeds/business-data.ts`,
  `language/checker.ts`, and `isForeignKeyColumnName` /
  `is_foreign_key_column_name` in `bus-entity.types.ts` and `bus.rs`. Change
  one, change all of them.
  That last pair was the copy that disagreed. It accepted `_id` and `_by` only,
  so `string assigned_to FK` — a foreign key the ERD declares outright — was
  stamped `String` in `sys_column` and rendered as a raw-UUID text box, while
  every other component resolved it to `bus_user`. The generated CRUD suite for
  the entity holding it could not create a record at all. `personRoleColumns`
  lists three names ending in neither suffix (`assigned_to`,
  `remediation_owner`, `created_by_user`); the FK *modifier* is still required,
  or a plain `owner_id` integer would get a picker onto a table it never meant.
- **A lookup renders a label only if its target has an `is_identifier` column,
  and there is exactly one derivation of which columns those are.** It lives in
  `identifierColumnNames` (`packages/core/src/types/bus-entity.types.ts`) and is
  mirrored by `identifier_column_names` in `crates/appwithai-gen/src/bus.rs`.
  `entityToBusEntity` marks each attribute, so the dictionary seed reads
  `attr.isIdentifier` rather than deciding for itself — there used to be a
  second copy in `dictionary-seed.ts` that disagreed with this one.
  The order is: a column that names the record outright (`name`, `full_name`,
  `display_name`, `title`, `label`, `subject`); then `first_name` + `last_name`
  together; then `code`/`reference`/`number`, then the same with something in
  front (`order_number`, `invoice_number`, `po_reference` — otherwise a sales
  order is labelled by its currency and customer); then a `text` column, which is
  prose the author wrote about this record; then a join entity's first two
  foreign keys; and failing all of that the first plain string column that is
  neither the key nor a pointer.
  Two of those steps exist for specific failures. The `text` step is ahead of
  the join-entity step because an entity can hold two references and still be
  about its own content — a DeviationReport points at an experiment and at the
  person who filed it and is identified by neither, and labelling it
  "Experiment 14 / Priya" rather than "Reagent precipitated during step 4" is
  the regression that ordering prevents. The last step is why a compound
  identified by `smiles` gets a label at all; without it 5 of 25 lookups on
  drug-discovery rendered a raw UUID.
  It is a property of the *entity*, not the column: whether `smiles` identifies
  a compound depends on whether anything else already does.
  See `docs/qa/2026-08-12-lookup-resolution-and-labels.md`.
- **`/api/bus/*` is authorised, not just authenticated — through three gates.**
  A JWT gets you in; `services/authz.rs` decides what you may touch. One
  `principal()` lookup per request resolves the caller's roles and master flag,
  and then:
  1. **`sys_access`** — the dictionary's own grant, through the chain it already
     models: role → window → tab → table, honouring `is_read_only` and
     `is_exclude`, with `is_master_role` bypassing the lookup.
  2. **`sys_operation_access`** — what the model's `rbac` entries declared.
     `require_operation(pool, &principal, table, Operation::Create|Read|Update|Delete)`.
     **No rows for a `(table, operation)` pair means unrestricted, not denied** —
     that is what keeps the directive additive, and what lets a database
     predating m0009 keep serving. Role names are folded before comparison:
     `sys_role.name` is title-cased for display and a directive writes the
     model's spelling, so `Sales Manager` and `sales_manager` are one role.
  3. **`sys_workflow_transitions` + `sys_transition_access`** —
     `require_transition`, called by `update` when the body writes a status
     column. **Topology is enforced for everyone, the master role included;
     the role rules are bypassed by master.** An edge the diagram never drew is
     a move that does not exist, not a permission an administrator lacks.
     Merging the two checks is how topology enforcement comes to run only on
     the edges that happen to carry a role rule — a bug the NestJS sibling has
     already shipped once. A table with no edges has no machine, so nothing is
     refused; that is what makes the call safe to make unconditionally.

  **All three gates deny when they cannot read their rules.** Each lookup used
  to swallow any error into "no rows", and no rows means allowed — so a timeout
  emptied a caller's roles, disabled the `rbac` operation rules, or (worst)
  skipped the transition loop entirely and made every undrawn move legal, for
  every caller including master. The permissive default is right for the case
  its comment named — a database predating m0009 has no such table — so that
  case is now matched exactly, on SQLSTATE `42P01`, and every other error is
  refused. A restriction that disappears under load is not a restriction.
  Reads need read, writes need write, refusals are 403 (400 for an undrawn
  move, which is a malformed request rather than a forbidden one). Before this,
  `sys_access` was read only by `/api/me/permissions` to decide which windows to
  render, so hiding an entity hid its menu entry and left the endpoint open to
  any account: security by menu. Metadata stays open, matching `/api/sys/*`
  reads — data is gated, the description of the data is not.
  The regression gates are
  `permissions::an_authenticated_user_without_a_grant_is_refused_the_data` and
  the two in `requests/rbac.rs`; no other suite can catch a hole here, because
  they all sign in as the master-role administrator and pass every check.
  `rbac.rs` builds its own non-master caller *and seeds its own rules* rather
  than reading the model's — a model with no `rbac` would otherwise leave the
  whole enforcement path untested, and that is the model most projects start
  from. It deletes its rows before asserting, because a failed assertion that
  left a `read` restriction behind would fail the next twenty tests for a reason
  none of them names.
- **Two people, one record: optimistic locking, and a final state closes it.**
  Every write that changes a bus row advances `version`; every read and write
  answers with `ETag: "v<n>"`, and `/meta` reports the table's
  `concurrency` and `lifecycle`. `DynamicRepo::update` takes a `WriteGuard`
  and makes everything the write depends on a condition of its one UPDATE: the
  `If-Match` version, the from-state of each transition the body makes (so of
  two moves out of one state exactly one lands), and — for a caller, not a
  rule or workflow — that the row is not in a final state. Zero rows is
  `UpdateResult::Refused { current }`, and `services/concurrency.rs` turns it
  into **409 `VERSION_CONFLICT`** or **409 `RECORD_FINAL`** with a `conflict`
  body: the record as it stands, who changed it (the audit trail's last entry),
  when, the columns changed since the caller's version, the status with its
  label and `isFinal`, and `overwritable`. An optimistic table (`sys_table.concurrency_mode`,
  m0020, from the entity's `concurrency`) refuses a save with no `If-Match`
  with **428**; `last-write-wins` accepts it; `If-Match: *` is a deliberate
  overwrite. Final states live in `sys_workflow_states` (m0020), replaced on
  every seed by `seed/transitions.sql`. A rule's transform on the row being
  written keeps the version (`RawVersion::Keep`), a cascade to another row
  advances it, and a refused write's `restore_columns` puts the version back
  too (`RawVersion::Restore`, only while nobody wrote since) — which is what
  lets the caller's `If-Match` still hold for the corrected save. The screen
  side is `lib/concurrency.ts` and `components/admin/conflict-dialog.tsx`:
  refresh to the record the refusal carried, or overwrite naming its version.
  The gates are `tests/requests/concurrency.rs` and the bun
  `12-optimistic-lock`; every other suite reads before it writes
  (`support::if_match`, `harness.saveRecord`).
- **The dashboard is scoped to the caller, and it is `/api/me/dashboard`.**
  The front page used to be built from four unscoped calls — two `/sys/tables`
  listings, `/sys/categories/with-entities` and `/me/permissions`. The first
  three are dictionary reads, which are deliberately open and identical for
  everybody, so every account was offered a card for every entity in the
  application and the three gates then answered 403 on the ones it did not
  hold. A dashboard that offers seventeen entities and refuses them cannot be
  told from a broken one; it is the same mistake as `sys_access` being read
  only by the navigation, in the other direction.
  One request now answers it, from the rows `/api/bus/*` is guarded by:
  categories with the entities this caller may read, the admin windows it may
  open, its role and its master flag. It is on `/api/me` rather than `/api/sys`
  because a caller-scoped read does not belong in a namespace whose reads are
  open.
  `authz::readable_tables` is the set-wise form of `require_read` — the same
  two gates over a list of names, because asking per table would be two queries
  each. That is a second statement of rules that already exist, so
  `rbac::the_dashboard_scope_agrees_with_the_request_guard` drives both over
  every entity in the dictionary and fails on the first one they disagree
  about. Line items are the one deliberate difference: a child declared with
  `parent: <Parent>` on the child entity has no window and is reached by opening a
  parent record, so it is not a place to navigate to — the rule is read off
  `sys_tab.tab_level` rather than recomputed.
- **The admin cards come from the dictionary too, including their icons.**
  `sys_window.icon` (m0016) carries a lucide id, seeded from `ADMIN_WINDOWS`,
  and `sys_window.description` already carried the route. The dashboard used to
  hold a map from window *name* to an icon and a route instead, and a window
  that map did not know about was dropped from the screen without a word:
  `User Administration`, `Role Administration` and `System Configuration` were
  all granted, routed and invisible. A window with no route is still skipped —
  it has nowhere to go — but nothing else is.
- **`sys` *writes* require the master role, not just a JWT.** The dictionary's
  own tables are the authorization model — `sys_role` carries `is_master_role`,
  `sys_user_roles` grants a role, `sys_access` is the first of the three gates,
  and `sys_system` holds the AI endpoint URL that business data is sent to. All
  five write handlers (`create`, `update`, `remove`, `fields_batch_reorder`,
  `categories_unassign`) took a bare `auth::JWT`, so any account that could
  register could promote a role to master, grant itself one, and come back to
  `/api/bus/*` holding everything — demonstrated in three requests against a
  running application. `authz::require_dictionary_admin` is the gate now. Reads
  stay open deliberately: the frontend builds its navigation from the dictionary
  before anyone signs in. The gates are the two `requests::rbac` tests; no other
  suite can see this, because they all sign in as the master-role administrator.
- **An account is two rows, and `/api/accounts` writes them together.** `users`
  is the credential store Loco's JWT reads; `sys_user` is the identity every
  access check reads; `users.sys_user_id` joins them. `/api/sys/users` writes one
  half and cannot hash a password, so a user made through it either cannot sign
  in or reaches nothing. `controllers/accounts.rs` creates, edits, deactivates,
  locks, resets and deletes the pair in one transaction (master role only), and
  `/api/accounts/roles` does the same for roles.
  Three rules hold it together. **The last administrator cannot be removed:**
  each mutation runs under an advisory lock and, *after* applying itself, counts
  active master accounts — zero rolls it back with a 409 — which is what keeps
  it correct for a change that touches several things at once, and covers a role
  being demoted as well as an account being deleted. **Nobody deactivates, locks
  or deletes their own account**, and a built-in (`is_system_user`) account is
  deactivated, never deleted. **Disabled means disabled on a token already
  issued:** a JWT cannot be revoked, so `authz::principal`, `table_access`,
  `readable_tables` and `me::granted_windows` all require the grant, the role
  *and* the account to be switched on, `/api/auth/login` refuses a disabled
  account exactly as it refuses a wrong password (no oracle for the address), and
  `/api/auth/me` answers 401. Those four queries must stay in step — the access
  gate once consulted none of the three flags, so deactivating an account removed
  its menu and left the data open. Failed logins are deliberately not counted
  toward a lock: guessing passwords must not be able to lock the administrator
  out. The gates are `requests/accounts.rs`, and
  `rbac::deactivating_an_account_or_its_role_withdraws_its_access`.
- **`/api/bus/*`, `/api/audit/*`, `/api/rules/*`, all of `/api/workflow*`, and
  the `sys` write verbs require a JWT.** `sys` reads are open, because the
  frontend builds its navigation from the dictionary before anyone logs in;
  `/api/me/health` is open so a readiness probe needs no token. Bus writes are
  audited into `audit_log`'s hash chain, gated on `sys_table.is_changelog`.
  The workflow controller was the one gap — it guarded nothing, and its steps
  are `CreateEntity`/`UpdateEntity`/`DeleteEntity`/REST, so it was a way around
  the guard on `/api/bus/*`. `permissions::guarded_routes_refuse_an_anonymous_caller`
  is the regression gate; it POSTs a *valid* workflow definition, because a bare
  `{}` is rejected for a missing field before the handler runs and would pass
  with `create` wide open.
- **The app describes itself: `/openapi.json`, `/redoc`, `/scalar`.** Built with
  utoipa directly, not `loco-openapi` — that crate depends on `loco-rs ^0.16`
  and this app is on 1.0, so it links two copies of loco-rs and its
  `Initializer` becomes a different type from the one `Hooks::initializers`
  returns. Swagger UI is deliberately absent: its crate downloads assets in a
  build script, which would make a generated app impossible to compile offline.
  Redoc and Scalar embed theirs.
  Adding a handler means adding a `#[utoipa::path(...)]` **and** listing it in
  `paths(...)` in `src/openapi.rs.hbs` — two edits, and
  `tests/requests/openapi.rs` fails if you make only the first. It walks the
  controllers' own `Routes` tables and reports any route the document does not
  carry. Keep `/api/bus/{entity}` and `/api/sys/{segment}` described
  **generically**: one handler serves whatever the dictionary holds, and a path
  per table would be wrong the moment someone adds an entity at run time. Where
  a resource is mounted at both `PUT` and `PATCH`, document the `PUT` — that is
  what the generated frontend sends, and the test accepts it for both.
- **A generated project ships a `Cargo.lock`, and it is a template.**
  Without one every `cargo build` resolves against the crates.io index of the
  day, so an app that compiled last week can fail today because a crate four
  levels down published a broken version — `tinyvec` 1.13.0 did exactly that,
  arriving through `sqlx-postgres` → `stringprep` → `unicode-normalization`,
  where nothing in `Cargo.toml` names it and nothing in `Cargo.toml` can bound
  it. (A direct `tinyvec = "<1.13"` entry does not work: `0.4.1` satisfies it,
  so cargo adds a second copy and leaves the transitive one alone. Bounding a
  transitive dependency needs a requirement inside the same major.)
  `backend/Cargo.lock.hbs` is rendered, not copied: the project's own package
  name and version are the only model-derived values in it. It is checked in,
  so **refresh it whenever `Cargo.toml.hbs` gains or moves a dependency** —
  generate a project, `cargo update` in its `backend/`, copy the result back
  and restore the two templated fields.
  `src/templates/__tests__/cargo-lock.test.ts` fails when a manifest
  dependency has no entry, which is the direction that goes stale silently; the
  reverse would be re-implementing cargo. Note the package entry lands out of
  alphabetical order for any project not named like the one the lock was taken
  from — `cargo build --locked` accepts that, and cargo tidies it on its own.

- **Adding a migration is four edits, and two of them are in one file.**
  Write `migration/sql/m00NN_<slug>.{up,down}.sql`; add
  `migration/src/m00NN_<slug>.rs.hbs` (copy `m0006_audit_log.rs.hbs` — a
  twenty-line `include_str!` wrapper); add **both** a `mod` line and a
  `Box::new(...)` entry to `migration/src/lib.rs.hbs`; and register the
  `.rs.hbs` in `RENDERED_FILES` in *both* `loco-backend.generator.ts` and
  `crates/appwithai-gen/src/backend.rs`. The `.sql` files are copied by
  directory scan, so they need no registration.
  A file emitted but left out of `lib.rs` never runs, and the seeds needing its
  tables then fail with a missing-relation error that says nothing about the
  omission — the Loco form of the NestJS `scaffold` array trap.
  `src/pipeline/__tests__/seed-files.test.ts` asserts both directions: every
  emitted migration is registered, and every registered one is emitted.
  Two shapes exist and the choice is not stylistic. `include_str!` for DDL that
  does not depend on the model; an inline `const UP_SQL: &str = r#"..."#`
  (copy `m0003_workflow_support.rs.hbs`) when it needs `{{#each entities}}`,
  because Handlebars renders the `.rs.hbs` and not the `.sql`.
  **Never renumber or edit m0000–m0017** — they are recorded as applied in
  existing databases, so a change there reaches nobody who already migrated.
  m0013 and m0017 are the one deliberate exception: the column that held
  automations in the earlier notation, and the migration that converted it,
  were removed with every other reader of that notation. A database that
  applied the old m0013 and still holds unconverted automations is upgraded
  with the release that created it first; m0017 refuses it and names how many
  rows it found.
- **A seed a task embeds must always be emitted.** `include_str!` is a
  compile-time macro, so a generator that skips `seed/rules.sql` for a model
  with no `rules` produces a backend that does not compile — and the parity
  gate cannot see it, because both generators emit the same nothing and still
  match. The same test covers this, reading the embedded paths out of the
  generated `src/tasks/*.rs` rather than a list written down beside them.
- **Migrations emit raw SQL, not SeaORM's schema DSL.** The `sys_*` DDL in
  `migration/sql/*.sql` is hand-maintained and is the source of truth. It was
  once extracted from the NestJS templates by `scripts/extract-sys-ddl.ts`, to
  keep two stacks' schemas provably identical; that stack is gone, so the
  script was retired rather than left to check one template against nothing.
  Several `.sql` files still carry a "Regenerate with scripts/extract-sys-ddl.ts
  — do not hand-edit" header. Ignore it: hand-editing is now the only option.
- **The database is `<crate>_development`, not `<crate>`.** That is the default
  baked into `config/development.yaml`, and `cargo loco db migrate` fails
  against a database nothing created. `DATABASE_URL` overrides it everywhere,
  including in the CLI's own `createdb` step. `config/test.yaml` uses
  `<crate>_test`, which `cargo test` truncates between runs.
- **The seeded administrator is `admin@admin.com` / `admin`.** `ensure_admin`
  reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` (or `--email` / `--password`) and falls
  back to those. `config/*.yaml` and `.env.example` must keep advertising the
  same pair — they disagreed once, and the documented credentials did not work.
- **The generated app is headless.** The Rust backend renders no HTML and
  serves no assets — every controller returns JSON. The frontend is a separate
  bun/Vite package. Keep it that way: UI changes must never require
  recompiling the Rust binary.
- **An automation built in the app is stored as YAML.** The automations screen
  writes each one as its own YAML document (`lib/automation/yaml.ts`,
  `automation: "1.0"`) into `sys_workflow_definitions.definition_yaml` (m0017),
  through `POST /api/workflow-definitions` with `kind: "automation"`;
  `validate_automation_definition` refuses a document of any other shape. Rows
  a database whose automations predate this column is refused by m0017, which
  names how many rows it found, rather than half-migrated. The executor runs BPMN only, so `execute` on an automation is a 400, not a 500
  from decoding a NULL diagram.
- **Rule evaluation must stay inside `spawn_blocking`.** `zen_engine::Variable`
  is built on `Rc` and is not `Send`; calling `decision.evaluate(..).await`
  directly from a handler makes the future `!Send` and will not compile.
- **A rule's `trigger-workflow` action runs the workflow, and the run log says
  what happened.** `promotion.rs::trigger_workflow` resolves the named
  definition out of `sys_workflow_definitions` (most recent active one wins —
  a rule can only carry a name) and runs it through the same
  `WorkflowExecutor` that `/api/workflow/{id}/execute` uses, with the
  triggering row as `entityData`. It fails open like the rest of the rule
  pipeline: a workflow that throws leaves a `failed` run behind and the row
  still promotes. It used to insert a run row marked `completed` and stop, so
  the log claimed a chain had succeeded while none of its steps had executed —
  and the manual endpoint running the same BPMN correctly hid it. The gate is
  the bun suite `09-workflow-multistep`.
  Note `sys_workflow_runs` has no `workflow_name` column; the name is recorded
  in `created_by`.
- **A column type `row_json` does not know is emitted as `null`, silently.**
  Every value the generic controllers return crosses `services/row_json.rs`,
  which matches on the Postgres type name and falls through to a `String`
  decode. That decode *fails* for anything unlike a string, and `opt()` maps a
  failed decode to `null` — same as a SQL NULL, so a caller cannot tell the
  difference and only a `tracing::warn!` records it. `TEXT[]` had no arm for
  months: `audit_log.changed_fields` reported nothing on every entry in every
  trail, and `allowed_roles` came back null on every dictionary row while the
  tables held `{Administrator}`. Adding a column of a new type means adding
  its arm here, and the gate is a request test that reads the value back over
  HTTP — a unit test cannot, because the failure needs a real `PgRow`.
- **`components/ui/*` is fully Astryx** (frontend Phase B, 25 of 25 adapters).
  They keep the shadcn prop surface so `components/admin/*` needs no edits, and
  the generated `package.json` no longer ships Radix or CVA. `lucide-react`
  stays: `ui/icon.tsx` resolves the arbitrary icon names the dictionary stores,
  which Astryx's 26 semantic names cannot cover. Phase C — moving the admin
  screens off the Tailwind bridge and `cn()` — has not started.
- **PGlite is imported dynamically, and it has to stay that way.**
  `lib/electric.ts` syncs the dictionary through ElectricSQL into a local
  PostgreSQL compiled to WebAssembly. A static `import { PGlite }` at the top of
  that file put the whole package in the shared entry chunk — 972KB raw, 229KB
  over the wire, on **every page** — and `VITE_ELECTRIC_URL` is empty unless
  someone sets it, so in a default deployment `ELECTRIC_ENABLED` is false,
  `getDb` is never called, and all of it was downloaded to run nothing. The
  import lives inside `getDb` now. Keep the module-scope import type-only: a
  value import puts it back on the critical path and nothing in the build output
  says so — the entry chunk simply grows.
- **The dictionary's lists are fetched once per session, not once per entity.**
  `hooks/use-dictionary-lists.ts` owns `sys_table`, `sys_window` and `sys_tab`.
  Three hooks used to fetch them under keys scoped to the entity being viewed —
  `["sys-window-for-entity", entityName]`, `["window-tabs", tableName]`,
  `entityKeys.table(entity)` — so opening three entity screens pulled the whole
  table list three times and the whole window list twice, for identical answers.
  A hook that wants one entity's row filters the list it already has. It also
  fixes a quieter bug: one of those callers asked for `/sys/tables` with no
  limit, and the endpoint's own default is 200 (`DEFAULT_LIMIT` in
  `controllers/sys.rs`), so an application with more tables than that resolved
  some entities and silently not others. `LIST_LIMIT` is 500 for all three; the
  server clamps at 1000, so a bigger dictionary needs paging rather than a
  bigger constant.
- **Never write an inline `style={ {…} }` in a `.hbs` template.** Two braces is
  a Handlebars expression and generation dies with a parse error. Hoist style
  objects to module scope.
- **All seven Astryx themes ship in every generated app** (`neutral`, `butter`,
  `chocolate`, `matcha`, `stone`, `gothic`, `y2k` — those are the only ones
  published). A `ThemeSelector` in the header switches them at runtime; the
  stylesheets coexist because each is `@scope`-d to its own
  `[data-astryx-theme]`, so don't prune the "unused" ones.

Also see `packages/generator/TWO_PHASE_GENERATION.md` and `MIGRATION_GUIDE.md`.

### appwithai-gen (`crates/appwithai-gen/`) — the Rust generator

A Rust + clap rewrite of the generator, being brought up alongside the
TypeScript one rather than replacing it in a single step. **The TypeScript CLI
in `packages/generator` is still the one that generates a complete app.** Use
that unless you are working on the port.

```bash
cargo run -p appwithai-gen -- info -i examples/drug-discovery.eml.yaml
cargo run -p appwithai-gen -- list
cargo test -p appwithai-gen
```

What is ported and verified against `examples/drug-discovery.eml.yaml`:

| Module | Covers |
|---|---|
| `cli.rs` | the full flag surface, argument-compatible with the TypeScript CLI |
| `yaml_model.rs`, `records.rs`, `model.rs` | the model document → records → the compiled model: entities, attributes, relationships |
| `category.rs` | `categories`, including folded continuation lines |
| `language.rs` | `language/appwithai-language.json` (types, cardinalities) |
| `naming.rs` | the `snake`/`pascal`/`camel`/`kebab` rules, acronym guard included |
| `templates.rs` | Handlebars registry + the helpers the templates actually call |
| `scaffold.rs` | `loco new` + the prune list, same contract as above |
| `bus.rs` | `entityToBusEntity` — table names, display names, `sys_reference_id` |
| `context.rs` | the backend Handlebars context (`prepareContext`) |
| `backend.rs` | the emission layer: `RENDERED_FILES`, the `sys_*` DDL copy, the per-entity test suites |
| `dictionary.rs` | `seed/dictionary.sql` — deterministic UUIDv5 ids, idempotent |
| `dictionary_help.rs` | the composed `sys_window`/`sys_tab`/`sys_field` help text |
| `saga.rs` | `sagas` → BPMN → `seed/workflows.sql` |
| `rbac.rs` | `rbac` → roles, demonstration accounts, `seed/access.sql` |
| `hooks.rs` | `hooks` → `src/hooks/` — the compiler *and* the emission layer |
| `reports.rs` | `reports` → `seed/reports.sql` — the reader *and* the emission layer |

`info` reproduces the TypeScript CLI's entity and category output exactly on the
drug-discovery model, and `generate --skip-cli-scaffold` reproduces the
TypeScript generator's **entire backend byte for byte** — all 116 files,
`seed/dictionary.sql` and `seed/workflows.sql` included — apart from the
`Generated:` timestamp line, on both `--db postgres` and `--db neon`. That
equivalence is the acceptance test for each module as it lands. It is a script
now rather than a snippet to retype, and CI runs it on every push:

```bash
bun run parity        # scripts/parity-check.sh
```

It generates both stacks over every model in `PARITY_MODELS` and diffs the two
`backend/` trees, ignoring only the `Generated:` timestamp line. **Grow the
corpus with the feature**: parity over a model that declares no `rbac` says
nothing about the code that compiles `rbac`, so a directive landing without a
corpus line exercising it is a directive this gate cannot see.

**The backend is complete: it compiles, is clippy-clean, and passes its own
292-test suite with no TypeScript involved.** Still to port: the frontend and
the bun:test suite — that is the only part of a generated app still produced by
TypeScript, and the split is deliberate (`cargo` owns `backend/`, `bun` owns
`frontend/` and `tests/`). The frontend flags (`--theme`, `--dark-mode`,
`--skip-frontend`, `--api-url`) are accepted and inert, and the CLI says so at
the end of every run. `--skip-backend` skips everything, because the backend is
all this generator emits, and it says that too rather than reporting success
over an empty directory.

Note that `seed/dictionary.sql` and `seed/workflows.sql` are not optional
extras — `src/tasks/seed_dictionary.rs` and `seed_workflows.rs` embed them with
`include_str!`, so a crate emitted without them does not compile, and without the
rows they carry every `/api/bus/*` route 404s.

Two notes for anyone continuing it:

- **The `.hbs` templates are reused as-is.** The `handlebars` crate speaks the
  same dialect, so the port is helpers-and-context, not a template rewrite. Only
  a fraction of the ~100 helpers the TypeScript loader registered are reachable
  from the surviving templates — the rest were NestJS-era (`nestModuleName`,
  `tableToDto`, `kyselyType`) and were not carried across.
- **Escaping is off.** Every output is Rust, TypeScript, SQL or YAML, where an
  escaped `&` or `"` is a syntax error rather than a safety measure.
- **Strict mode is off, so a missing helper renders as nothing.** It has to be
  off — the templates test optional fields with `{{#if maxLength}}` — but the
  cost is that an unregistered helper produces plausible wrong output instead of
  an error. Both critical defects found in the emission-layer QA pass were this:
  the bus-table DDL lost every business column because `switch`/`case`/`or` were
  unregistered, and every entity label rendered empty because a `displayName`
  helper shadowed the `displayName` *field*. **Never register a helper under the
  name of a context field.** See `docs/qa/2026-08-08-rust-generator-emission-layer.md`.

### @appwithai/ai (`packages/ai/`)

**CLI binary**: `appwithai-convert`

```
src/
├── config.ts          # ⭐ Central model config — import from here, never hard-code
├── agents/            # domain, entity, relationship (standalone Mastra Agents)
├── mastra/
│   ├── index.ts       # Mastra instance — registers ONLY codeAgent
│   ├── agents/code-agent.ts
│   └── tools/e2b.ts
├── providers/         # llama.cpp provider
├── workflows/erd-design-workflow.ts   # HITL workflow (createWorkflow/createStep)
├── converter/         # AI converter + openai-fallback
├── cli/convert.ts
└── mastra.ts          # Dev-server entrypoint (`bun run dev:mastra`)
```

**Mastra instance** (`src/mastra/index.ts`): registers `codeAgent` only, LibSQL
storage at `file:../../../../mastra.db`, Pino logger (`debug` in dev, `info` in
production). The four `src/agents/*` agents are used directly by the converter
and the ERD workflow — they are not registered on the Mastra instance.

### @appwithai/web (`packages/web/`)

TanStack Start app on Vite 8 + React 19. **No Vinxi** — `vite.config.ts` shims
`@tanstack/start-api-routes` (which still imports `vinxi/routes`) with
`src/lib/start-api-routes-compat.js`.

```
src/
├── routes/
│   ├── __root.tsx, index.tsx, login.tsx, dashboard.tsx, designer.tsx, settings.tsx
│   ├── projects/
│   │   ├── index.tsx
│   │   └── $id/{init,design,logic,rules-design,automations,generate,deploy}.tsx
│   │       └── enhance/{index,$serviceName}.tsx
│   ├── admin/
│   │   ├── users.tsx, model-library/index.tsx
│   │   ├── rules/{index,new,$entity/…}.tsx
│   │   └── workflows/{index,$workflowId}.tsx
│   └── api/            # server routes — see API Route Pattern below
├── components/
│   ├── ProgressStepper, WizardStepHeader, JourneyArc, DbOperationsModal, CopilotProvider
│   ├── model/          # ModelViewer, ModelDiagram, RuleEditor — the YAML model, drawn
│   ├── automation/     # AutomationBuilder and its rail, ladder and inspector
│   ├── rules/          # DecisionTableEditor, JDMEditor
│   ├── workflow/       # WorkflowEditor, GoRulesEditor
│   ├── approval/, code-agent/, error-boundary/, project/, providers/
│   └── ui/             # Shadcn-style primitives
├── lib/
│   ├── model/          # sections, compose, rules, decision tables
│   ├── model-view/     # the model as a graph: graph, layout, source map
│   ├── automation/     # an automation as its own YAML document
│   ├── server/         # project-git, project-repository, model-conversion
│   ├── auth-server.ts, encrypt.ts, errors.ts, api-client.ts, project-access.ts, rate-limit.ts
│   ├── api/{projects,deployment}.ts, workflow/{bpmn-model,step-types}.ts
│   └── start-api-routes-compat.js, vinxi-routes-stub.js   # Vite shims
├── middleware/auth.ts
├── store/{projectStore,authStore}.ts   # Zustand
├── hooks/{useHumanInTheLoop,useModelAssistant}.ts
└└── types/{project,workflow}.ts
```

---

## TanStack Start Patterns

### File-based routing

- Dynamic segments use `$`: `$id`, `$serviceName` (not Next.js `[id]`)
- Splat routes use `$.ts` (e.g. `api/copilotkit/$.ts`)
- Every route file exports `export const Route = createFileRoute('/path')({ ... })`
- `routeTree.gen.ts` is generated by the TanStack Router plugin — never edit it by hand

### API Route Pattern — use `createFileRoute` + `server.handlers`

This is the current pattern (~43 route files). **Do not use `createAPIFileRoute`
for new routes** — only two legacy files still do, and `@tanstack/start/api` is
deprecated and emits a `console.warn` on every load.

```typescript
// routes/api/projects/$id/index.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/projects/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        // Heavy/Node-only deps are imported lazily inside the handler so they
        // stay out of the client bundle.
        const { getDatabase } = await import("@appwithai/core/services");
        const db = getDatabase();

        const project = await db
          .selectFrom("projects")
          .selectAll()
          .where("id", "=", params.id)
          .executeTakeFirst();

        return new Response(JSON.stringify(project), {
          headers: { "Content-Type": "application/json" },
        });
      },

      PUT: async ({ request, params }) => {
        const data = await request.json();
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
```

**Conventions in these handlers:**
- Dynamic-`import()` server-only modules (`@appwithai/core/services`, `pg`, generator code) inside the handler body.
- Always return a real `Response` with an explicit `Content-Type`.
- API routes are excluded from the client router tree via the `tsr` option in `vite.config.ts`.

### Streaming (SSE) route

```typescript
export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { projectId } = await request.json();
        return new Response(
          new ReadableStream({
            async start(controller) {
              try {
                for (const chunk of await generateProject(projectId)) {
                  controller.enqueue(`data: ${JSON.stringify(chunk)}\n\n`);
                }
                controller.close();
              } catch (error) {
                controller.error(error);
              }
            },
          }),
          {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          },
        );
      },
    },
  },
});
```

### Page route

```typescript
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$id/design")({
  component: DesignPage,
});

function DesignPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  return <button onClick={() => navigate({ to: "/projects" })}>Back</button>;
}
```

### Navigation

| Pattern | TanStack Start |
|---------|----------------|
| Navigate | `navigate({ to: '/path' })` |
| With params | `navigate({ to: '/path/$id', params: { id: '123' } })` |
| URL params | `Route.useParams()` |
| Search params | `Route.useSearch()` |
| Link | `<Link to="/path">` |

### Environment variables

- **Client** (`routes/*.tsx`, components): `import.meta.env.VITE_*` only
- **Server** (`server.handlers`, lib server modules): `process.env.*`

---

## The YAML model language (`language/yaml/`) — the source of truth

A model is one YAML document (`*.eml.yaml`), and it is the only thing any
generator reads. Reference: `language/yaml/README.md`. Plan and remaining
phases: `CEDM_YAML_Architecture_Design.md`.

```bash
bun packages/generator/dist/cli/generate.js validate model.eml.yaml
bun packages/generator/dist/cli/generate.js info model.eml.yaml
bun packages/generator/dist/cli/generate.js convert model.eml.yaml   # → model.cedm.yaml (and back)
bun run generate:tanstack -- -i examples/drug-discovery.eml.yaml -o out -n drug-discovery
```

- **Three layers, in order.** `readModelYaml` (`packages/generator/src/model-yaml/validate.ts`)
  parses the YAML, validates it against `language/yaml/eml.schema.json` (ajv
  2020), then runs the language checker (`language/yaml/checker.ts`) over the
  document. Every finding carries a document path and is reported at its YAML
  line and column. `model-yaml/fixer.ts` applies the auto-repairs and keeps the
  author's comments.
- **One semantic layer.** The document is read into the records in
  `packages/generator/src/model/records.ts` (`model-yaml/to-records.ts`) and
  compiled by `compileModelRecords` (`model/compile.ts`): `compileErdRecords`,
  `compileRbacDeclarations`, `compileSagaDeclarations` and the rest. A new
  construct gets a schema key, a record type and one compiler — and the same
  in `crates/appwithai-gen` (`yaml_model.rs`, `records.rs`), held to it by
  `bun run parity`.
- **The schema is the language.** Change `eml.schema.json`,
  `language/yaml/document.ts` and the checker together, then grow a corpus
  model so the parity gate sees the new key.
- **The gates.** `model-yaml/__tests__/model-yaml.test.ts` and `checker.test.ts`
  hold the reader and the checker; `llmtext-examples.test.ts` validates every
  complete model in the protocol documents;
  `pipeline/__tests__/yaml-source.test.ts` generates drug-discovery twice and
  requires the same files, ships the model byte for byte, and runs
  `scripts/check-yaml-only.sh` over the output.
- **No generator reads model text.** `generateApplication` takes the compiled
  `document`; a generated project ships `model/model.eml.yaml` exactly as
  written, comments included.
- **Every tool reads YAML.** The `eml` CLI (`language/cli/`), both generators,
  the modelling tool and the browser bundle. `html/model-yaml.js` is the
  language in a browser (`bun run build:language-tools`;
  `bun run check:language-bundle` compares it with the CLI in headless
  Chromium). `bun run wasm` runs the Rust generator built for `wasm32-wasip1`
  (`bun run build:wasm`), hosted on Node's WASI because Bun's traps; parity
  holds it byte-identical to the native build.
- **A saga's `trigger` and `operation` are keys on the saga**, defaulting to
  `automatic` / `CREATE`, with operation aliases (`INSERT`, `edit`, `*`)
  normalised as `rbac`'s are (`sagaOperation` / `sagaTrigger`,
  `saga_operation` / `saga_trigger`). The seed writes `trigger_type`.
  **The Loco backend does not yet run `automatic` sagas**: a workflow starts
  only from a rule's `trigger-workflow` action or `/api/workflow/{id}/execute`.

## CEDM application models (`language/cedm/`) — the base of the model language

An application is written in **CEDM**: entities in the library's own shape
(`domain/entities/*.yaml`, `schema/cedm-entity.schema.yaml`), imported by name
or declared in the model, plus the application profile
(`specification/application-profile.yaml`). Reference: `language/cedm/README.md`;
schema: `language/cedm/cedm-model.schema.json`. A model is `*.cedm.yaml`, opens
with `cedm:`, and every command (`validate`, `info`, `generate`, `convert`, the
`eml` CLI, the Rust generator, the browser bundle) reads it.

- **A CEDM model is lowered, never compiled directly.** `lowerCedmModel`
  (`language/cedm/lower.ts`) turns it into the `*.eml.yaml` model document both
  generators already compile; `resolveCedmImports` folds imports, modules,
  `extends` and the closure over required references in first. The Rust port is
  `crates/appwithai-gen/src/cedm.rs`, and **the two lowerings must agree**:
  `scripts/cedm-lowering-parity.ts` (run by `bun run parity`) compares them
  document for document, native and `wasm32-wasip1` alike. A lowering change
  is a change in both files, the same day.
- **The gates.** `model-cedm/__tests__/cedm-equivalence.test.ts` raises every
  model in the repository to CEDM and lowers it back (must equal the original in
  *entity order* — `cedmOrder`: a CEDM model declares a relationship on its
  entity, and relationship order is visible in generated output);
  `pipeline/__tests__/cedm-source.test.ts` generates drug-discovery from CEDM and
  from the model document and compares every file; `cedm-examples-in-sync` holds
  each checked-in `.cedm.yaml` to the conversion of its `.eml.yaml`
  (`appwithai convert --force`).
- **A reference names its target.** `deliveryLocation → Location` is held in
  `delivery_location_id`, which would derive `bus_delivery_location`. The model
  document's attribute `references` states it, the dictionary seed stores it in
  `sys_column.ref_table_name` (m0018, by a trailing `UPDATE` — only where it
  differs from the derived one, so every model without one seeds as before), and
  every resolver prefers it: `resolve_ref_table`, `field_meta`, both generated
  test harnesses, `foreignKeyTargetTable`/`foreign_key_target_table`, parent
  links and the checker (EML118). Add a resolver, give it the stored target.
- **Two to-one relationships that point at each other are one one-to-one**, with
  the key on the side that is `1`. Treating them as two one-to-many gave a
  required-FK cycle (`Supplier.party_role_id` ↔ `PartyRole.supplier_role_id`) that
  the business seed could not insert.
- **Every enumeration has a business table** (`application.enumerationTables: true`,
  set on every `applications/*.cedm.yaml`). Lowering adds an entity named like the
  value list (`id, code, name, description, sequence, is_active`) under *Reference
  Data* and marks the document's enum `table`, with `labels`/`descriptions` from
  `help.valueLabels`/`valueSemantics`; both lowerings do it
  (`addEnumerationTables` / `add_enumeration_tables`). The dictionary seed writes the
  rows as application data and a Table reference (`sys_reference` `T` +
  `sys_ref_table`) instead of `sys_ref_list` rows; `sys.rs` `list` answers
  `/sys/ref-list?sys_reference_id=` from the table; the business seed skips these
  entities. Only lists some attribute names get a table. Contract:
  `specification/enumeration-semantics.yaml`; registry `domain/enumerations/index.yaml`
  (`tools/build_enumerations.py`).
- **The specification supplies the Application Dictionary.**
  `specification/dictionary-mapping.yaml` says which CEDM construct fills each
  window/tab/table/column/field slot, `vocabulary.yaml` `kindClasses` resolves a
  free-form `kind` to a class, and `tools/validate.py` enforces DICT-001…010 /
  ENUM-001…003 (`ui.icon` a lucide 0.312 id, help on every entity, attribute and
  relationship, `valueSemantics` per enum value). `tools/dictionary_report.py`
  prints coverage; `tools/enrich_dictionary.py` fills gaps by editing text (a YAML
  round trip rewraps every folded line in the library).
- **Help text is authored, and a filler detector holds it.** `tools/help_shapes.py
  --check` (HELP-001, run by `tools/validate.py`) replaces an entity's, attribute's
  or relationship's names with placeholders and compares the sentence with the frozen
  shapes in `tools/help-legacy-shapes.txt`; a match is template text and an error. To
  author help: `tools/help_skeleton.py --next N` prints what is missing (`*`),
  `tools/help-batches/bNNN.txt` holds the text (`@ Entity`, `s:`/`b:`/`u:`/`c:`/`l:`/`x:`
  for the entity, `a name` then `s:`/`u:`/`c:` and `v VALUE:` for an attribute,
  `r name` then `s:`/`u:`/`n:`/`w:`/`t:` for a relationship), and
  `tools/help_apply.py` validates and writes it. A `v` list must cover **every** value
  of the enum, so reword one flagged value and you re-send all of them. Reword a
  flagged line rather than appending to it: the detector is shape-based, so
  "Exactly one X." fails wherever X is. `tools/lifecycle_lint.py` checks a lifecycle
  (L4 default≠initial is advisory); `tools/lifecycle_set.py` and `tools/attr_set.py`
  repair one. A lowering drops managed columns, so never name a business attribute
  `version`.
- **Reference data comes from the common specification.** Country, StateProvince,
  City, Currency and Language are library entities whose rows live in
  `domain/reference-data/*.yaml` (`tools/build_reference_data.py`, from ISO 3166/4217/639
  and GeoNames) and are named by the entity's `referenceData` key. The library
  inlines them as `data`; lowering turns attribute names into columns (`CEDM180/181`);
  the dictionary seed writes them as application data with UUIDv5 ids over the
  natural key; the business seed skips them and points records at them. An address
  holds relationships to Country, StateProvince and City, never typed codes.
  Contract: `specification/reference-data.yaml`.
- **A lookup can be narrowed, and the backend does it.** `narrowedBy` on a reference
  (CEDM relationship or attribute; `narrowedBy` on the document attribute) becomes
  `sys_column.narrowed_by` (m0019) as `[{by, on}]`. `GET /api/bus/{entity}/lookup/{column}`
  returns the target's rows filtered by the values the record passes, and
  `verify_narrowing` in `bus.rs` refuses a write naming a row outside the set — on
  create, and on update against the stored row with the request laid over it.
  The generated form passes control values and clears a choice that no longer
  belongs. A grid reads labels by `filter.id=in:…` for the page's own ids, not a
  500-row page of the target — states and cities outnumber that.
- **A unique `code` beside a `name` identifies a record as both** (`identifierColumnNames`
  in core, `identifier_column_names` in `bus.rs`): "USD · US Dollar". A `code` that is
  not unique is technical and does not qualify.
- **A refused update leaves nothing behind.** Rules run after the write, so a
  `validation-error` used to keep the refused value in the record and refuse every
  later edit; `bus.rs` `restore_columns` puts the replaced values back. Rules also
  see `_previous_<column>` on an update, so `status != _previous_status` fires on
  *entering* a state, which is what the entity workflows use.
- **One application per domain.** `domains/application-catalog.yaml` →
  `scripts/build-domain-applications.ts` → `applications/*.cedm.yaml` (`--check`
  holds them in sync) → `scripts/generate-domain-applications.sh` →
  `generated-applications/<domain>/`. Every generated application bundles the
  common CEDM specification under `cedm/` (`pipeline/cedm-bundle.ts`).
  **Commit source and generated source only** — never a `target/`, a
  `node_modules/` or a built executable. `scripts/run-and-screenshot.sh` runs
  an application from a scratch copy for exactly this reason.
- **Corpus walkers skip `generated-applications/`** (as they skip
  `generated-projects/`): each holds a `model/model.eml.yaml`.
- **The library had defects the schema found.** 721 invariants and help entries
  were unquoted flow mappings that YAML split at their commas
  (`tools/repair_flow_text.py`; `tools/validate.py` now refuses it), and
  `domains/capability-catalog.yaml` did not parse. `validate.py` parses every
  specification file now.
- **The web tool still saves the model document** (`model/model.eml.yaml`), and
  generation from a project goes through it; CEDM is an input to the CLIs and
  the generators. Its snapshot allow-list already admits `.yaml`/`.md`, so
  `cedm/` and `model/model.cedm.yaml` publish.

## The language definition (`language/`)

`language/` holds the model language: its definition, its schema, its checker,
the `eml` CLI and the browser entries.

```
language/
├── appwithai-language.json   # ⭐ The vocabulary: types, flags, cardinalities, hook
│                             #   events, rule node types, saga step types, and what
│                             #   each compiles to
├── index.ts                  # Typed accessor for it
├── yaml/
│   ├── eml.schema.json       # ⭐ What a model document may contain
│   ├── document.ts           # The document's types
│   ├── checker.ts            # The cross-reference rules the schema cannot express
│   └── examples/             # crm, dance-studio, ecommerce, helpdesk, minimal (.eml.yaml)
├── cedm/                     # CEDM application models and their lowering
├── spec/                     # 00-overview … 05-access-reports-and-triggers
├── cli/                      # The `eml` CLI (Bun): validate, info, generate
└── browser/                  # Entries for the published browser bundles
```

```ts
import { normalizeType, cardinalityKind, isHookType } from "../language";

normalizeType("varchar");                        // "string"
cardinalityKind("exactly-one", "zero-or-more");  // "oneToMany"
isHookType("beforeCreate");                      // true
```

- **Read the definition through `model/language-maps`, not `language/index`**,
  from generator code. `index.ts` resolves `appwithai-language.json` as a
  sibling of its own module, which is right when it runs from source and wrong
  for the *bundled* CLI, where `import.meta.url` is `packages/generator/dist/cli/`.
  `language-maps` walks up for it and honours `APPWITHAI_LANGUAGE_FILE`.
- **`workflowConstructs.stepNodes.types` is a list, each entry naming itself.**
  Both generators once read it as a map and both degraded silently.
  `language::tests::the_shipped_definition_loads_rather_than_falling_back` is
  the gate on the Rust side.
- **`parent_` is stripped before the entity rule**, which is what makes a
  hierarchical self-reference (`Sample.parent_sample_id`) resolve to
  `bus_sample` rather than to a table nothing declares. The list is
  `QUALIFIER_PREFIXES`, in three places that must agree: the backend's
  `dictionary.rs.hbs`, `bus-entity.types.ts` and `language/cedm/naming.ts`.
- **`reports` compile to `sys_report` (m0015), applied by `seed_reports`**, and
  are served at `/api/reports` by `controllers::report`. The query is stored
  verbatim, so it is refused unless it is a single `SELECT` or `WITH` **three
  times**: by the checker at authoring time (EML293), by the compiler before it
  can reach `seed/reports.sql`, and by the controller before it runs. The check
  tracks quoting rather than scanning for a keyword, and a 5,000-row cap is
  applied as an outer `LIMIT`. The reader is `packages/generator/src/reports/index.ts`,
  mirrored by `crates/appwithai-gen/src/reports.rs`; the two agree byte for byte.
- **A key is only real once something reads it *and* a corpus model exercises
  it**: Handlebars strict mode is off in both engines, so an unregistered helper
  renders as an empty string and the parity gate stays green. Grow
  `language/yaml/examples/crm.eml.yaml` or `examples/drug-discovery.eml.yaml` in
  the same commit.
- **When changing language semantics**, update `appwithai-language.json` and the
  schema first, then the checker, `language/spec/`, and both generators.

**Bringing the sibling's work across has a ledger.** `docs/SYNC-HISTORY.md`
records which of `app-with-ai-tanstack`'s pull requests have been carried, which
were deliberately not, and what is queued. This repository's language is YAML
and the sibling's is not, so a sibling change to the language is a port, never
a copy.

## Database

**PostgreSQL via Kysely + `pg`.** Connection config lives in exactly one place:
`packages/core/src/config/db.config.ts`. Change the driver or connection string
there and nowhere else.

```
DATABASE_URL=postgresql://user:pass@host:5432/dbname   # takes precedence
# or individual vars:
PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE
```

`getDb()` is a lazy singleton returning `Kysely<Database>`; `destroyDb()` tears
down the pool (tests, graceful shutdown). `packages/core/src/services/database.service.ts`
wraps it with domain helpers: `projectDb`, `erdVersionDb`, `workflowDb`,
`generationHistoryDb`, `deploymentDb`, `entityDb`, `settingsDb`.

**Migrations** are numbered files in `database/migrations/` (`001`–`010`) applied
via `runMigrations()` from `@appwithai/core/services`. Note there are two `004_*`
files (`004_add_better_auth_tables.ts`, `004_add_business_rules_system.ts`).

```typescript
await db.selectFrom('projects').selectAll().execute();
await db.insertInto('projects').values({ id, name, description }).execute();
await db.updateTable('projects').set({ name: 'updated' }).where('id', '=', id).execute();
await db.deleteFrom('projects').where('id', '=', id).execute();
```

Target-database connection strings for generated projects are encrypted at rest
with AES-256-GCM using `DB_ENCRYPTION_KEY` (`packages/web/src/lib/encrypt.ts`).
Rotating that key invalidates all stored project connections.

---

## Project history — every model save is a local Git commit

The modelling tool keeps **one local Git repository per project**, inside its
output directory (`DEFAULT_OUTPUT_DIR`, else `packages/web/generated-projects`),
and every draft save, named version, restore and generation commits into it.
Carried from the sibling (`cc90133`); see `docs/plans/local-git-integration.md`
and §14 of the divergence report.

```
packages/web/src/lib/server/
├── project-git.ts         # ⭐ git + filesystem only: argument arrays, no shell, no hooks
└── project-repository.ts  # ⭐ journal → files → commit → DB projection, under a per-project lock
packages/yamltecture/      # the model → deterministic YAML (`.appwithai/model.ai.yaml`), + model context
```

- **This release reads YAML only.** A modelling-tool database created by a
  release that stored models in the earlier notation is upgraded with that
  release first; nothing here reads the earlier notation.
- **Persist through the repository service, never around it.** `saveProject`,
  `restoreProject`, `changeWorkflow`, `saveDiagram`, `saveProjectFiles`,
  `prepareGeneration`/`publishGeneration`. A route that writes `erd_versions`,
  `workflows` or a project file directly produces a state the history does not
  contain, and the next save refuses with "edited outside the application".
- **The model is saved as YAML, and only as YAML.** `saveProject` commits the
  author's document as `model/model.eml.yaml` (`MODEL_YAML`), byte for byte,
  and writes `.appwithai/model.ai.yaml` beside it. Generation reads only that
  document: `prepareGeneration` returns `modelYaml`, `/api/generate` validates
  it with `parseModelYaml` and generates from the document, and
  `publishGeneration` refuses output whose `model/model.eml.yaml` differs from
  it. The gate is `saves the model as YAML and generates from exactly that YAML`.
- **A draft is not a version.** `mode: "draft"` commits and writes no
  `erd_versions` row; the current model is `project_git_state.model_code`, with
  the current `erd_versions` row only as the fallback for a project saved before
  this existed. Anything answering "what is the model" — `projectDb.findById`,
  `GET /api/projects/$id`, `model-context?q=summary` — reads it in that order.
- **Generation is staged, then merged.** `/api/generate` generates into
  `.generation-*` beside the project and `publishGeneration` three-way merges it
  against the last generated baseline, so a hand edit to a generated file
  survives. It requires `package.json`, **`backend/Cargo.toml`** and
  `frontend/package.json` — the sibling checks `backend/package.json`, which a
  crate does not have.
- **`allowedFile` is the snapshot allow-list, and it had to learn Rust.** `.rs`
  is in `SOURCE` and `target` is in `OMIT`. Missing the first silently leaves the
  generated backend out of every commit; missing the second commits cargo's
  build output.
- **The consistency suite needs Postgres** and is skipped otherwise:
  `APPWITHAI_GIT_TEST_DB=1 DATABASE_URL=… bun run test -- src/lib/server/__tests__/project-repository.test.ts`.
  CI runs it as `.github/workflows/project-git.yml`.
- Tables: `project_git_state`, `project_git_operations`, `erd_versions.git_commit`
  — created by `migrateProjectGit` (`packages/core/src/services/git-migration.ts`),
  called from `runMigrations`.

## Model context — the assistant's view of a model (Apache AGE)

The modelling tool answers structural questions about a project's model from a
**property graph in Apache AGE**, not from an embedding index. The questions the
assistant actually gets — "what references Compound?", "which rules fire on
Experiment?", "what moves are legal from `submitted`?" — are traversals with one
correct answer, and a nearest-neighbour search over prose about the model returns
whatever chunks happened to mention it. Embeddings are the right tool for a
question about meaning; this is a question about structure.

AGE is a Postgres extension, so the graph lives in the same database as
everything else the tool stores — no second service and no embedding endpoint.

```
packages/generator/src/graph/
├── model-graph.ts   # ⭐ pure: ParsedModel → nodes + edges. No SQL, so testable
├── age-store.ts     # prepareConnection / ensureGraph / cypher / ingestGraph
├── queries.ts       # the ten questions, as Cypher
└── index.ts         # the barrel `@appwithai/generator/graph` resolves to
```

`GET /api/projects/$id/model-context?q=…` answers one question;
`POST` re-ingests from a `source` body. Both call `requireProjectAccess` —
a model graph names every entity, column and role in an application, so reading
it is reading the project.

- **The extension is a deployment step.** `CREATE EXTENSION age;` in the
  modelling tool's database, once. `ensureGraph` creates the *graph*, not the
  extension: creating an extension is a superuser operation and does not belong
  in a request handler.
- **`LOAD 'age'` and the `ag_catalog` search path are per-connection state**, so
  the route checks out a dedicated client and re-issues them on every checkout.
  A pooled client handed back after a `DISCARD ALL` otherwise fails with
  "function cypher(...) does not exist", a long way from its cause.
- **A graph name, node label and edge type cannot be AGE parameters**, so none
  of them may come from user input — and none do: the graph name is a constant
  and labels come from the `NodeLabel` / `EdgeType` unions, which are literals
  in this repo. Everything model- or request-derived — project ids, node keys,
  every property name and value — is bound as an `agtype` parameter.
- **`HAS_MANY` and `REFERENCES` point opposite ways, deliberately.**
  `Compound ||--o{ CompoundAlias` says a Compound *has many* aliases, but the
  foreign key is on the many side, so the thing that *references* Compound is
  CompoundAlias. Emitting one edge in the ERD's declaration direction made
  "what references Compound?" answer nothing for the most-referenced entity in
  the model — worse than not answering, because it reads as a considered "no".
  Which way a foreign key points comes from the cardinality the parser already
  resolved, never from re-deriving a column name: that rule lives in seven
  places that have to agree and this would be an eighth.
- **`summary` is answered from the stored model, not the graph.** It is one
  paragraph and has to work before anything has been ingested. It reads
  `project_git_state` first and `erd_versions` where `is_current` second, and
  reports no roles for a project with no model rather than failing.
- **`?q=yaml&term=…` is the one question not answered from the graph.** It
  returns the saved model's YAML projection, narrowed to the entities `term`
  names, and the diff of the last model commit — the assistant's
  `readSavedModel` action. Project data for a model to read, never instructions.
- **Roles come from `rbacRoleNames`, both kinds.** A model may declare only
  transition rules — drug-discovery's five `rbac` entries all are — and
  reading `rbac.operations` alone reported no roles at all for a model with
  four. The gate is `summariseModel > names roles a model declares only through
  transitions`.

**The `exports`-map trap, which has now cost two debugging cycles.** Root
`tsconfig.json` path aliases satisfy `tsc` for a subpath like
`@appwithai/generator/graph`, but Node and Vite resolve through the package's
`exports` map at run time. A subpath missing from `exports` type-checks
perfectly and crashes the dev server on first import. Adding one means three
edits in the package's `package.json`: an `exports` entry, a `bun build` entry
point, **and** a rebuild before the running server sees it.

---

## The chat (`chat-deepseek/`) — shipped with every generated application

A DeepSeek Harness (`@deepseek-ai/dsh`, pinned **0.2.0-rc.2** exactly) chat in
which a person works with the application in plain language: it finds records,
runs the business's reports, and opens the application's **own screens inside
the conversation** to create, edit and approve. Reference:
`chat-deepseek/README.md`.

```
browser ─► nginx ─► /chat ─► gateway (Bun, Better Auth)  ─► one Harness host per person (loopback)
                │                │  SSO broker, view ids,        business composition only
                │                │  host manager, proxy          tools ─► gateway ─► app / reporting,
                ├─► /       the application (?embed=1 inside a chat card)          as that person
                └─► /report the reporting platform (embed routes)
```

- **It is source here, copied into every project.** `pipeline/chat-bundle.ts`
  copies `chat-deepseek/` to `<project>/chat/` (skipping installs and dot-files
  but `.dockerignore`), and writes two files for the project: the domain skill
  `skills/<project>-domain/SKILL.md` (`chat/domain-skill.ts`, from the compiled
  model — records, value lists, lifecycles with final states, roles, reports)
  and `.env.example`. It is written exactly when the front end is, and a
  missing source is an error rather than a skipped step. A regeneration keeps
  `.data/`, `.env` and `node_modules`. `app-with-ai-rust/chat-deepseek` is the
  copy the website bundle carries (`loco-assets.json`): **change both**.
- **The chat is the single-sign-on broker; both applications keep their own
  authentication.** A person signs in once with their application account. The
  gateway relays the application's session cookie, and signs a 60-second
  Ed25519 assertion (`SSO_SIGNING_KEY`; the platform refuses any lifetime over
  120 seconds) that the reporting platform's
  `POST /api/auth/assertion` verifies with `SSO_PUBLIC_KEY` and a single-use
  `jti`, re-syncing the person's roles by folded name on every sign-in.
- **The composition is narrow by construction.** `profile/business.patch.yml`
  disables every filesystem, shell, browser, MCP, plugin-install and workspace
  plugin; `bun run test:composition` fails on any enabled package outside
  `ALLOWED_PACKAGES`. The model's tools are four reads (`search_records`,
  `get_record_summary`, `search_reports`, `run_approved_report`) and four screen
  openers (`open_record`, `open_create_form`, `open_update_form`,
  `request_approval`). **The model never writes a record**: the person saves in
  the embedded screen, under optimistic locking, and the save arrives back as a
  durable `[Application]` event only after the gateway has read the record back.
- **The model never sees a credential, a cookie, a raw URL or SQL.** Records
  are opaque refs issued per person; a screen is a view id that expires
  (`CHAT_VIEW_TTL_SECONDS`) and is re-authorised on every open.
- **The gateway filters Harness's own protocol, not just its routes.** The mux
  WebSocket can open any endpoint, so `checkMuxFrame` applies the same
  allowlist to every `open` frame; `settings` is read-only (`describe`), because
  a settings write could repoint the DeepSeek base URL the server's key is sent
  to. `tests/security/gateway.test.ts` is the gate.
- **The chat database is never the application's.** The reporting platform
  introspects every schema of the database it reports on, so chat sessions
  stored there would become reportable rows. `ensureDatabase` creates
  `<project>_chat` when it is missing.
- **Embedding.** `?embed=1` makes the generated front end chromeless
  (`lib/embed.ts`, persisted per tab, only when framed) and its save, delete and
  transition paths post `record-saved` to `window.location.origin`. The front
  end serves `frame-ancestors 'self'` on every page through a Vite plugin,
  because TanStack Start's server-rendered responses bypass `server.headers`.
- **Capacity is measured, not estimated.** `bun run load` (`tests/load/host-memory.ts`)
  starts real hosts behind the real gateway with real tool calls and a scripted
  model, and reads RSS and PSS from `/proc`. `MEASURED_HOST_RSS_MB` in
  `gateway/hosts.ts` sizes the default `CHAT_MAX_HOSTS`; the figures and the
  200-user projection are in the README.
- **Tests.** `bun run test` (unit); `tests/security/*` and `tests/e2e/*` run
  against a live stack (application, reporting platform, gateway behind nginx)
  with the DeepSeek endpoint pointed at `tests/support/messages-recorder.ts`.
  Everything but the model's words is real. A live-model run needs
  `DEEPSEEK_API_KEY` and is reported as not run where there is none.

---

## Code Style Guidelines

### TypeScript

Root `tsconfig.json` is strict, with several checks beyond `strict`:

```json
{
  "target": "ES2022",
  "module": "ESNext",
  "moduleResolution": "bundler",
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "isolatedModules": true,
  "experimentalDecorators": true
}
```

`noUncheckedIndexedAccess` means every index access yields `T | undefined` — narrow before use.

### Formatting (Biome)

`biome.json`: 2-space indent, LF, **line width 100**, double quotes (JS + JSX),
always semicolons, ES5 trailing commas, no trailing commas in JSON.
Run `bun run lint:fix` before committing.

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Functions | camelCase | `analyzeDomain()` |
| Types/Interfaces | PascalCase | `EntityAttribute` |
| Classes | PascalCase | `EntityService` |
| Constants (primitives) | UPPER_SNAKE_CASE | `AI_BASE_URL` |
| Constants (instances) | camelCase | `globalHookExecutor`, `domainAgent` |
| Files (logic) | kebab-case | `domain-agent.ts` |
| Files (React components) | PascalCase | `ProgressStepper.tsx` |

### Import order

1. External dependencies
2. Internal packages (`@appwithai/*`)
3. Relative imports
4. Type-only imports (`import type`)

### Error handling

```typescript
async convert(input: ConverterInput): Promise<ConverterOutput> {
  try {
    const result = await someOperation();
    if (!result) return { success: false, error: 'Operation returned empty result' };
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

---

## Architecture Patterns

### Hook system

```typescript
hookRegistry.register({
  entity: 'Patient',
  event: 'beforeCreate',
  handler: async (data) => data,
});

export abstract class BaseService<T> {
  protected abstract entityName: string;

  async create(data: Partial<T>): Promise<T> {
    const processed = await globalHookExecutor.execute(this.entityName, "beforeCreate", data);
    return this.performCreate(processed);
  }

  protected abstract performCreate(data: Partial<T>): Promise<T>;
}
```

See `HOOKS_GUIDE.md` and `packages/core/src/generators/hook-translator/`.

### AI agent pattern (Mastra.ai)

```typescript
import { Agent } from "@mastra/core/agent";
import { mastraModelConfig } from "../config";

export const domainAgent = new Agent({
  id: "domain-agent",
  name: "Domain Analyzer",
  instructions: `...`,
  model: mastraModelConfig,   // never a hard-coded model string
});

export async function analyzeDomain(description: string) {
  const response = await domainAgent.generate(description, {
    structuredOutput: { schema: domainAnalysisSchema },
  });
  return response.object;
}
```

### Business rules (GoRules)

Rules are JDM decision graphs evaluated by `@gorules/zen-engine`
(`packages/core/src/rules/`, with a singleton engine and an LRU rule cache).
The web app edits them through `@gorules/jdm-editor` — bundled from npm, **not** a
CDN — in `components/workflow/GoRulesEditor.tsx` and `components/rules/`.

### Project access

**Every route that touches a project calls `requireProjectAccess`**
(`packages/web/src/lib/project-access.ts`):

```typescript
const access = await requireProjectAccess(request, params.id as string, "read_write");
if (access.response) return access.response;   // 401 / 404 / 403
```

A project that does not exist and a project the caller cannot see are both 404:
telling an unauthorised caller that an id is real is itself a disclosure. 403 is
reserved for the case where the caller *can* see the project and only the
permission is missing.

Pick the permission by what the handler does, not by its verb. `validate` and
`gorules` are POSTs that read.

Where the project id arrives in the body or the query rather than the path —
`api/generate`, `api/deploy`, `api/model-library` — the check goes **before** the SSE
stream opens. A refusal reported as a `data:` line is one the client has to
remember to look for; a 401 is not. `api/deploy` reads its body up front for
exactly this reason: a request body can only be consumed once.

**A PATCH writes only `EDITABLE_PROJECT_COLUMNS`**
(`routes/api/projects/$id/index.ts`). The handler used to spread the body into
the UPDATE, so a caller with write access could set `owner_user_id` and take the
project. The allow-list also maps camelCase to the column name, which fixes a
quieter bug: `generatedPath` matched no column and the write was a silent no-op.

**The gate is `routes/api/projects/__tests__/route-guards.test.ts`.** It reads
the route sources and asserts every handler under `api/projects/$id/**` — plus
`generate`, `deploy`, `model-library` and `db/generate-schema`, which take the id from the body or query —
calls `requireProjectAccess` at least once per verb. Coarse on purpose: a
per-verb check needs the file's meaning, while "at least as many guards as
handlers" needs only its shape, and that is enough to catch the omission on the
day it is made. Three routes are stricter than the shared helper can express
(membership is owner-only) and are listed in `OWNER_ONLY` with their reason,
still required to read the caller. Adding a project route means using the
helper or saying there why not.

This exists because the NestJS sibling shipped five automation handlers with no
check at all: anyone holding a project id could read, overwrite and delete
another project's automations. Every handler was correct in every other
respect, and no test could see it.

**Known gap, deliberately not closed here:** the seven routes under `api/ai/*`
and `api/copilotkit*` have no authentication at all. Anyone who can reach the
app can drive the model — and `api/ai/code-agent*` reaches an E2B sandbox.
Closing it needs the CopilotKit UI and the CLI checked against it, which is its
own change.

### Rate limiting

`packages/web/src/lib/rate-limit.ts` is a dependency-free, in-memory fixed-window
limiter for TanStack Start server handlers (`express-rate-limit` does not apply —
these are Web `Request`/`Response` handlers, not Express middleware). Guard a route
by returning early:

```typescript
const { AUTH_LOGIN_LIMIT, enforceRateLimit } = await import("@/lib/rate-limit");
const limited = enforceRateLimit(request, "auth:login", AUTH_LOGIN_LIMIT);
if (limited) return limited;   // 429 with Retry-After + RateLimit-* headers
```

Counters are keyed by `scope:clientIp`, so each endpoint has its own budget.
Currently applied to `api/auth/login` (10/min per IP) and `api/auth/register`
(3/min per IP).

**Limitation:** counters live in module state — single-process only, and they
reset on restart. Move `buckets` to Redis before running more than one instance.

### User-facing AI flow

```
/projects → New Project → /projects/$id/init
  → natural-language description
  → agents: domain → entity → relationship → the model document (YAML)
  → /projects/$id/design         (HITL model approval)
  → /projects/$id/logic          (business rules, hooks, state machines)
  → /projects/$id/automations    (automations, each its own YAML document)
  → /projects/$id/generate       (stack selection + code generation)
  → /projects/$id/enhance/$serviceName
  → /projects/$id/deploy
```

---

## Environment Variables

**AI (local model — required for AI features):**
- `LOCAL_AI_BASE_URL` (default `http://localhost:8000/v1`)
- `LOCAL_AI_MODEL` (default `qwen3.6:27b-mlx`)
- `LOCAL_AI_API_KEY` (default `local`)
- `LLAMA_CPP_BASE_URL` / `LLAMA_CPP_MODEL` — optional llama.cpp server

**Database:** `DATABASE_URL`, or `PGHOST` / `PGPORT` / `PGUSER` / `PGPASSWORD` / `PGDATABASE`

**Web (client-side vars must be `VITE_`-prefixed):**
- `VITE_APP_URL` (default `http://localhost:3000`)
- `VITE_API_URL` (default `http://localhost:3000/api`)
- `VITE_MASTRA_URL` (default `http://localhost:4111`)
- `COPILOTKIT_API_KEY`

**Mastra:** `MASTRA_DATABASE_URL` (default `file:./appwithai-mastra.db`), `MASTRA_PORT` (4111), `MASTRA_LOG_LEVEL`

**Security:** `SESSION_SECRET`, `JWT_SECRET`, `DB_ENCRYPTION_KEY` (base64, 32 bytes), `CORS_ORIGIN`, `CORS_CREDENTIALS`

**Rate limiting:** `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` — defaults for `defaultRateLimitOptions()`; the auth routes use their own fixed limits (see Rate Limiting)

**Feature flags:** `ENABLE_AI_FEATURES`, `ENABLE_DICTIONARY_FEATURES`, `ENABLE_CODE_GENERATION`, `ENABLE_ANALYTICS`

**Code generation:** `DEFAULT_OUTPUT_DIR`, `TEMPLATE_DIR`

**ERD design:** `ERD_DESIGN_AUTO_RETRY_COUNT` (3), `ERD_DESIGN_RETRY_DELAY_MS` (2000)

`ANTHROPIC_API_KEY` is **no longer used**. See `.env.example` for the full list.

---

## Testing

### Unit tests (Vitest)

```bash
bun run test            # all unit tests
bun run test:watch
bun --filter @appwithai/web test -- path/to/file.spec.ts
```

The effective config is `packages/web/vitest.config.ts` — jsdom, `pool: "forks"`,
10s timeouts. It deliberately includes tests from sibling packages:
`src/**`, `../core/src/**`, `../generator/src/**`. Setup file:
`packages/web/src/components/workflow/__tests__/setup.ts`.

### E2E tests (Playwright)

```bash
bun run test:playwright
bun run test:playwright:ui
bun run test:e2e:server        # starts the server first
bunx playwright test tests/e2e/foo.e2e.spec.ts
```

`playwright.config.ts`: `testDir: ./tests/e2e`, matches `**/*.e2e.spec.ts` and
`**/*.e2e-test.ts`, **Chromium only**, base URL `http://localhost:5000`,
`workers: 1` / `fullyParallel: false` (tests share state), 3-minute timeout.

Note the port mismatch: `bun run dev` serves on **3000**, Playwright targets
**5000**. Use `bun run test:e2e:server`, which sets this up for you.

Some suites under `tests/e2e/complete-tests/` target an OData/UI5 stack the
generator no longer emits — treat those as historical.

### The end-to-end suite (`packages/generator/test/e2e/`)

`bun run test:e2e:generated` — 303 tests over `examples/drug-discovery.eml.yaml`,
in five specs that climb from the model to a running application:

| Spec | Reads | Tests |
|---|---|---|
| `01-model` | the parse | 54 |
| `02-emission` | what lands on disk | 49 |
| `03-dictionary` | the seed SQL, as data | 79 |
| `05-application` | the app over HTTP | 91 |
| `06-performance` | latency, ratios, concurrency | 30 |

It has **its own vitest config** (`vitest.e2e.config.ts`), and `vitest.config.ts`
excludes `test/e2e/**`, so `bun run test:generator` stays a three-second gate.
Three things about how it runs:

- **One generation, one server, one process.** `test/e2e/support/global-setup.ts`
  generates the app, compiles the crate, migrates, seeds and starts the server
  before any worker spawns, publishing the address and token through the
  environment; `singleFork` keeps every spec in one process so "generate once"
  means once. `E2E_SKIP_APP=1` runs only the specs that read files.
- **The database is dropped and recreated every run.** A row left behind makes a
  whole class of failure pass — the same trap the generated bun harness
  documents for its parent-record recursion.
- **Prerequisites**: a Postgres reachable at `E2E_PG_URL` (default
  `postgres://postgres:qapass@127.0.0.1:5432`) and a Rust toolchain. A cold
  `cargo build` of the generated backend is minutes; `CARGO_TARGET_DIR` is
  shared so a warm one is seconds.
- **Never point one `CARGO_TARGET_DIR` at two different generated projects.**
  It is safe here because the suite builds exactly one. Every generated backend
  contains a crate named `migration`, so two projects sharing a target directory
  collide on it and the second `cargo loco db migrate` re-runs the *first*
  project's DDL. The failure is silent and reads like a generator bug: the
  dictionary describes `bus_account` while the database holds `bus_compound`, so
  every create returns a 500 whose log line is
  `relation "bus_account" does not exist`, and the tables whose names both models
  happen to share (`bus_user`, `bus_team`) keep working — which is what makes it
  look like a per-entity defect rather than the wrong schema entirely. Give each
  project its own target directory when comparing two, and take the slow build.

**The performance spec asserts ratios, not milliseconds** — the last page of a
table against its first, a wide entity's metadata against a narrow one's, ten
parallel reads against ten serial ones. A ratio is a property of the query plan
rather than of the hardware, so a dropped index fails it on any machine, while a
budget in milliseconds is either flaky here or meaningless in production. The
few absolute budgets are an order of magnitude above measurement, to catch a
change in kind (an N+1 turning a list into a hundred round trips).

Two defects it found on its first run, both invisible to every file-level check:

- **A `rbac` role was created with no `sys_access` row**, so the first
  authorisation gate refused it everything — reads included, and including the
  transitions its own directive granted it. The demonstration accounts
  `seed_access` creates existed precisely to show access control the
  administrator bypasses, and showed an empty dashboard (`windows: []`) and 403
  on every entity instead. `seed/access.sql` now grants each declared role the
  business windows, and `sys_operation_access` / `sys_transition_access` are
  what narrow it — which is what the directive's additive rule already said.
- **The audit hash chain did not verify after concurrent writes.** The append is
  serialised by an advisory lock, but `created_at` was read *before* the lock and
  tie-broken by a random UUIDv4, so two writers could chain in one order and
  sort in the other. `verify_chain` then reported tampering that never happened —
  the worst outcome available to a tamper-evidence feature, because a false
  alarm and a real one look identical. The timestamp is now taken inside the
  lock and stepped past the tip, making `created_at` strictly increasing along
  the chain.

Two assertions in it are worth not weakening. `02-emission`'s Handlebars-leak
detector flags block helpers anywhere plus simple mustaches naming a **root key
of the generator's own context** — a blanket brace scan reports nine correct
files, because the workflow runtime interpolates `{{key}}` placeholders and the
automation UI documents that syntax. And `03-dictionary` asserts that no
statement names a row a later statement creates: the seed is applied as one
`execute_unprepared`, so the failure mode is a foreign-key error naming neither
the model nor the directive.

### Testing a *generated* app

A generated project ships two independent end-to-end suites over the same HTTP
surface. Both are generated from the model, so both grow when the model does.

```bash
# Rust request suites — 292 on drug-discovery, 292 on crm. ~4 min. The primary gate.
cd <output>/backend
createdb <crate>_test
LOCO_ENV=test cargo test --test app
cargo clippy --all-targets -- -D warnings    # also expected clean

# bun:test suites — 14 shared + per-entity, ~13 minutes; starts the backend itself
cd <output>/tests && bun run test        # or test:fast to skip the bulk seed
bun run run.ts --only crud --no-server   # one group, against a running backend
```

Prefer `cargo test` for a regression gate: it covers the same ground in a
quarter of the time and needs no separate process. The bun suites are what to
reach for when a failure needs a readable HTTP transcript, and they carry the
browser volume suite (`--browser-volume`, 100k records through real Chromium),
which has no Rust equivalent.

Three things worth knowing:

- **Every generated suite authenticates every request as the master-role
  administrator**, so a wide-open endpoint and a guarded one look identical to
  it, and so does a restricted operation and an open one. That is how the
  workflow controller stayed unauthenticated while 246 tests passed. Two suites
  are the exceptions and both must grow with the guards:
  `requests/permissions.rs` sends no credentials at all — extend it when you add
  a guarded route; `requests/rbac.rs` builds a genuinely non-master caller —
  extend it when you change what a role may do.
- **Four bun suites assert against `harness/model.ts`, not the dictionary.**
  `02b` (layout), `02c` (references), `06b` (transitions) and `09`
  (multi-step) read what the model declared — its `enums` values, its
  state-machine edges, its `parent` — rather than reading the
  dictionary the same generator wrote and checking that answer against itself.
  The latter only proves self-consistency and passes just as happily when the
  generator dropped something. Grow `model.ts` when you add a directive.
- **Run the corpus models' suites, not just drug-discovery's.**
  `language/yaml/examples/crm.eml.yaml` is in the parity corpus, and parity only
  compares the two generators against *each other*: they agreed byte for byte
  on a `bus_task` whose mandatory `assigned_to` no test could fill, and 7 of
  crm's tests had been failing unnoticed. `bun run parity` cannot see that;
  `cargo test --test app` in the generated crm backend can.
- **`06-rules-workflow.test.ts` alone accounts for ~690s of the ~750s bun run.**
  It is not hung; it polls. Use `--only crud` / `--only rules` while iterating.
- **Parent records are created on demand, and the chain is as deep as the model
  needs.** `createWithParents` terminates on re-entering an entity already on
  the stack — a real cycle — not on a depth counter. A counter was there once
  and silently truncated StabilityPull → StabilityTest → Compound → User, which
  failed only on a freshly seeded database and passed the moment any earlier
  suite left a row behind. If you touch that recursion, verify against a
  database that has just been migrated and seeded, never a warm one.

### Browser QA of a generated app

`playwright` is a devDependency of the generated `tests/` workspace. In this
container the bundled browser revision does not match, so launch the image's
Chromium explicitly:

```ts
chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
```

Worth knowing before writing a QA script against the UI: **New opens a page of
its own, `/<window>/new`** (the list → detail flow: list, then a record, then
`/new`; `ADCreateShell` in `ad-list-shell.tsx`, rendered by
`bus-entity-detail-page.tsx` for the id `new`), its action is labelled **Create**
(not Save), and **Delete lives inside edit mode** on the detail view. A list is
read newest-modified first (`updated_at DESC`, in `dynamic_repo.rs` and the
dictionary-backed reads in `bus.rs`) unless the caller names an order; the
toolbar's Refresh re-reads the rows **and every dropdown** (`refreshDropdowns` in
`use-entities.ts`). A script that looks for an inline `<form>`, a "Save" button,
or a Delete on the read-only detail will report bugs that are not there.

**A record whose table has a drawn state machine shows it.** `WorkflowStateBar`
(`components/admin/workflow-state-bar.tsx`, registered in the static-copy list of
`tanstack-start-frontend.generator.ts`) reads `/api/workflows/transitions?table=`
and offers exactly the edges that leave the current state; the write goes
through `PATCH`, so topology and role rules are still enforced by the backend.
Drive it by button text — the Astryx `Button` adapter does not forward
`data-testid`.

**Screens name an entity by its window, never its table.** `useEntityLabel()`
(`use-dictionary-entities.ts`) is the one place a stored `bus_…` name becomes a
label; the rules, decision-table, workflow monitor, workflow list and trigger
card use it. `scripts/qa/smoke-application.mjs` fails a screen that shows
`\bbus_[a-z0-9_]+`.

**`AlertDialogTrigger` is rendered by the adapter.** The shadcn composed form
(`<AlertDialog><AlertDialogTrigger asChild><Button/></…>`) used to lose its
trigger — the Delete button on the workflow list was never drawn. The adapter now
holds its own open state when no `open` prop is passed. A hook placed after an
early `return` is the other trap that has crashed a generated screen
(`rules/$id.edit.tsx`, "Rendered more hooks"): call hooks first.

**A generated test value must fit its column.** `tests/support/factory.rs`
honours `FieldMeta::max_length` (a two-letter country code cannot hold
`e2e-code-…`), leads short values with a symbol so they never equal a seeded
ISO code, and takes a narrowed reference from the lookup the form uses —
otherwise Country cannot be created and everything holding one fails.

**The serial QA loop** is `bash scripts/qa/qa-loop.sh <domain>… | --all`: per
domain it regenerates, builds, starts, smoke-tests every screen
(`scripts/qa/smoke-application.mjs`), runs the application's own `cargo test`,
records `$QA_OUT/summary.tsv` (default `/tmp/claude-0/qa-loop`) and deletes the
build before the next one.

Two more that cost a debugging cycle each:

- **Wait for hydration, not for the element.** Clicking submit on `/auth/login`
  before hydration finishes performs a plain GET — the URL gains a bare `?`, no
  `POST /api/auth/login` is made, and it looks exactly like a broken login.
- **`id` does not reach the `<input>`.** `<Input id="email">` renders with
  Astryx's own generated id, so `#email` matches nothing; select by
  `input[type="email"]`. The same override means the call site's
  `<Label htmlFor="…">` dangles, so a field's accessible name comes from its
  *placeholder* — a real accessibility gap, and Phase C work to fix properly
  (see `docs/qa/2026-08-13-generated-frontend-browser-pass.md`).

---

## Git Workflow

1. Create a feature branch from `main`
2. Make changes with descriptive commits
3. Run `bun run type-check` and `bun run lint` before pushing
4. Target `main` for pull requests

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `package.json` | Monorepo root, all scripts |
| `tsconfig.json` | Root TS config + path aliases |
| `biome.json` | Lint + format rules |
| `playwright.config.ts` / `packages/web/vitest.config.ts` | Test configuration |
| `.env.example` | All environment variable templates |
| `.claude/custom-rules.md` | Bun-only policy |
| `.claude/tanstack-start-reference.md` | TanStack Start notes |
| `packages/ai/src/config.ts` | ⭐ Central AI model config |
| `packages/ai/src/mastra/index.ts` | Mastra instance |
| `packages/ai/src/workflows/erd-design-workflow.ts` | HITL ERD workflow |
| `packages/ai/src/agents/domain-agent.ts` | NL → domain analysis |
| `packages/core/src/config/db.config.ts` | ⭐ Sole DB connection site |
| `packages/core/src/services/database.service.ts` | Kysely domain helpers |
| `packages/core/src/hooks/hook-executor.ts` | `globalHookExecutor` |
| `packages/core/src/rules/rules-engine.service.ts` | GoRules evaluation |
| `packages/generator/src/pipeline/generate-application.ts` | ⭐ The one generation path — CLI and web both call it |
| `packages/generator/src/cli/generate.ts` | Generator CLI (the one that ships a complete app) |
| `packages/generator/src/model-yaml/validate.ts` | `readModelYaml` — YAML, the schema, the checker |
| `packages/generator/src/generators/tanstack-astryx-loco/loco-backend.generator.ts` | `loco new` scaffold + template overlay + dictionary seed |
| `packages/generator/templates/tanstack-astryx-loco/` | The only stack's templates |
| `packages/generator/templates/tanstack-astryx-loco/backend/src/openapi.rs.hbs` | The generated app's OpenAPI document — `paths(...)` lives here |
| `packages/generator/templates/tanstack-astryx-loco/backend/tests/requests/openapi.rs.hbs` | Fails when a routed handler is undocumented |
| `packages/generator/templates/tanstack-astryx-loco/backend/tests/requests/permissions.rs.hbs` | The only suite that sends no token |
| `packages/generator/templates/tanstack-astryx-loco/backend/tests/requests/rbac.rs.hbs` | The only suite with a non-master caller — seeds its own rules |
| `packages/generator/templates/tanstack-astryx-loco/backend/src/services/authz.rs.hbs` | ⭐ The three gates: `sys_access`, `rbac` operations, transitions |
| `.../backend/src/controllers/me.rs.hbs` | ⭐ `/api/me/dashboard` — the caller-scoped front page, and `granted_windows` shared with `/permissions` |
| `.../frontend/src/components/ui/icon.tsx.hbs` | ⭐ Lucide ids resolved lazily — the one place a dictionary icon name becomes a glyph |
| `.../frontend/src/hooks/use-dictionary-lists.ts` | ⭐ The dictionary's lists, fetched once per session — the one owner of those three queries |
| `.../frontend/src/lib/electric.ts.hbs` | ⭐ PGlite behind a dynamic import; a value import at module scope costs every page 229KB |
| `packages/generator/src/rbac/{index,roles}.ts` | ⭐ `rbac` → operation rules, transition rules, roles and accounts |
| `packages/generator/src/generators/tanstack-astryx-loco/access-seed.ts` | `seed/access.sql` |
| `crates/appwithai-gen/src/rbac.rs` | All three of the above, Rust side |
| `packages/generator/templates/tanstack-astryx-loco/backend/src/services/dictionary.rs.hbs` | `resolve_ref_table_name` — how a lookup finds its table |
| `packages/generator/src/generators/tanstack-astryx-loco/dictionary-seed.ts` | `seed/dictionary.sql` — windows, tabs, fields, model enums as `sys_ref_list` |
| `packages/core/src/types/bus-entity.types.ts` | ⭐ `identifierColumnNames` — the one answer to what a record is called |
| `packages/generator/src/templates/__tests__/template-syntax.test.ts` | Every `.hbs` parses; rejects inline `${VAR:-{{x}}}` |
| `packages/generator/templates/tanstack-astryx-loco/tests/harness/harness.ts.hbs` | Generated bun test harness (FK recursion lives here) |
| `crates/appwithai-gen/src/main.rs` | The Rust generator's pipeline |
| `crates/appwithai-gen/src/scaffold.rs` | `loco new` + prune, Rust side |
| `crates/appwithai-gen/src/backend.rs` | The Rust generator's emission layer (file lists live here) |
| `crates/appwithai-gen/src/dictionary.rs` | `seed/dictionary.sql`, Rust side |
| `crates/appwithai-gen/src/saga.rs` | Saga parsing + BPMN + `seed/workflows.sql`, Rust side |
| `crates/appwithai-gen/src/hooks.rs` | `hooks` → handler modules + registry, Rust side |
| `packages/generator/src/reports/index.ts` | ⭐ `reports` → the reports a generated app ships with — refuses anything but a single read |
| `crates/appwithai-gen/src/reports.rs` | The same, Rust side — reader and `seed/reports.sql` |
| `.../backend/src/controllers/report.rs.hbs` | ⭐ `/api/reports` — the last of the three read-only guards |
| `packages/generator/src/generators/tanstack-astryx-loco/hook-handlers.ts` | ⭐ The same, TypeScript side — handler modules are written **once** |
| `crates/appwithai-gen/src/templates.rs` | Handlebars registry — read the helper-shadowing note before adding one |
| `packages/web/src/lib/server/project-repository.ts` | ⭐ Every model/workflow/generation write, as a Git commit + DB projection |
| `packages/web/src/lib/server/project-git.ts` | The Git/filesystem adapter and the snapshot allow-list |
| `packages/yamltecture/src/eml/context.ts` | EML → YAML projection and the assistant's model context |
| `examples/drug-discovery.eml.yaml` | ⭐ The model everything is tested against |
| `packages/web/vite.config.ts` | Vite 8 config + `start-api-routes` shim |
| `packages/web/src/routes/__root.tsx` | Root layout |
| `language/appwithai-language.json` | ⭐ EML canonical definition |

---

## Additional Documentation

| Document | Description |
|----------|-------------|
| [docs/SYNC-HISTORY.md](docs/SYNC-HISTORY.md) | ⭐ What has been carried over from `app-with-ai-tanstack`, up to which sibling commit, and what is still queued — read this before starting a sync round |
| [docs/2026-09-13-divergence-from-app-with-ai-tanstack.md](docs/2026-09-13-divergence-from-app-with-ai-tanstack.md) | The same rounds in full: what each defect was, how it was demonstrated, what it cost |
| [docs/architecture.md](docs/architecture.md) | System architecture |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Build system, commands |
| [docs/TESTING.md](docs/TESTING.md) | E2E test generation |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Version 6.0 plans |
| [docs/ARCHITECTURAL-DESIGN-AUTH-WORKFLOW-RULES.md](docs/ARCHITECTURAL-DESIGN-AUTH-WORKFLOW-RULES.md) | Auth + workflow + rules design |
| [docs/AUDIT_GUIDE.md](docs/AUDIT_GUIDE.md) | Audit trail |
| [docs/NESTJS-INTEGRATION-GUIDE.md](docs/NESTJS-INTEGRATION-GUIDE.md) | Generated-backend integration |
| [language/README.md](language/README.md) | EML entry point |
| `docs/qa/` | QA passes, newest first — findings, evidence, and what was left open |

---

## Common Tasks

### Add a new AI agent

1. Create `packages/ai/src/agents/<name>-agent.ts`, importing `mastraModelConfig` from `../config`
2. Re-export from `packages/ai/src/agents/index.ts`
3. Optionally wire into `packages/ai/src/workflows/erd-design-workflow.ts`

### Add a new API route (web)

1. Create the file under `packages/web/src/routes/api/…` (`$param` for dynamic segments)
2. Use `createFileRoute("/api/…")({ server: { handlers: { GET, POST, … } } })`
3. Dynamic-`import()` server-only deps inside the handler; return an explicit `Response`

### The generation pipeline

`packages/generator/src/pipeline/generate-application.ts` is the **single
generation path**: both the `appwithai` CLI and the web app's `/api/generate`
go through `generateApplication`. They used to assemble
`FullStackGeneratorOptions` separately, and the web copy passed six fields — so
an application generated through the UI silently lost every `categories`, every
`enums` dropdown and every saga the model declared, then reported success.

`pipeline/parse-model.ts` is the pure half (no `node:fs`), so a caller holding
the model text can read it without pulling the filesystem into its bundle.

**Adding a generator input** means adding it to `GenerationSettings` once. Do
not add it at a call site.

The pipeline also ships `model/model.eml.yaml` into the generated project and
writes `.appwithai.json` recording what the model declared — entities,
categories, enums and sagas — not just what was generated.

### Add a new generation template

1. Add the `.hbs` file under `packages/generator/templates/tanstack-astryx-loco/`
2. Register it — `RENDERED_FILES` in the matching generator for a rendered
   template, or the static-copy list for a verbatim one. Do not add both; one
   template per output file (see @appwithai/generator above).
3. Supply any new context data in that generator's `prepareContext()`
4. Regenerate against `examples/drug-discovery.eml.yaml` and confirm the file
   appears in the output — registering it is the step that is easy to forget,
   and generation succeeds silently without it.

### Add an endpoint to the generated backend

1. Write the handler in the matching `backend/src/controllers/*.rs.hbs` and
   register it in that file's `routes()`
2. Guard it with `_auth: auth::JWT` unless it is deliberately public — and if it
   is guarded, add it to `GUARDED_ROUTES` in `tests/requests/permissions.rs.hbs`
3. Add a `#[utoipa::path(...)]` **and** list the handler in `paths(...)` in
   `src/openapi.rs.hbs`; `tests/requests/openapi.rs` fails if you skip either
4. Regenerate and run `LOCO_ENV=test cargo test --test app`

### Change something in a generated app

**`bun run generate` runs `packages/generator/dist/cli/generate.js`, not `src/`.**
Templates are read from disk at run time, so a `.hbs` edit lands immediately —
but a change to any *TypeScript* in `packages/generator` or `packages/core` does
nothing until you rebuild:

```bash
bun --filter @appwithai/core build && bun --filter @appwithai/generator build
```

Skipping it produces output from the previous build while every source file on
disk says otherwise, which reads exactly like a template that was never
registered. `bun run parity` builds both generators itself, so it is not
affected.

Never edit `generated-projects/<app>/` to fix a generated app: it is output, and
the next `--force` run overwrites it. Find the template that produced the file,
change that, regenerate, and confirm the change landed:

```bash
bun run generate:tanstack -- -i examples/drug-discovery.eml.yaml \
  -o generated-projects/drug-discovery -n drug-discovery --no-setup --force
grep -n "<your change>" generated-projects/drug-discovery/<the file>
```

The `grep` is not optional. Frontend templates have duplicate `.tsx`/`.tsx.hbs`
pairs where only one copy is live, and editing the dead one changes nothing at
all while looking like a completed fix.

### Extend the model language

1. Edit `language/appwithai-language.json` (the vocabulary) and
   `language/yaml/eml.schema.json` (the document's shape) together
2. Update `language/yaml/document.ts`, the checker (`language/yaml/checker.ts`)
   and the relevant `language/spec/*.md`
3. Read the new key into records (`model-yaml/to-records.ts`) and compile it,
   in both generators — `crates/appwithai-gen` is held to the same output by
   `bun run parity`
4. Exercise it in a corpus model (`language/yaml/examples/crm.eml.yaml` or
   `examples/drug-discovery.eml.yaml`)

There is **one** checker. The generator, the `eml` CLI, the modelling tool and
the browser bundle all run `readModelYaml` — YAML, the schema, then
`language/yaml/checker.ts` — so a rule added there reaches every reader.

### Add a core subpath export

1. Create `packages/core/src/<dir>/index.ts`
2. Add an `exports` entry **and** a `bun build` step to `packages/core/package.json`
3. Add the alias to root `tsconfig.json` and the relevant Vite/Vitest configs

### Run the full stack locally

```bash
bun run dev          # Terminal 1 — web app on :3000
bun run dev:mastra   # Terminal 2 — Mastra on :4111
# plus a local OpenAI-compatible model server on :8000 (LOCAL_AI_BASE_URL)
```
