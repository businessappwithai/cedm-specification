# EML CLI (`eml`)

A TypeScript CLI that reads a model — a YAML document, `*.eml.yaml`, written in
the [APPWITHAI Modeling Language](../README.md) — validates it **with
self-correction**, and **generates a complete, runnable application** from it.

A model is read by the language's own reader
(`packages/generator/src/model-yaml`) and validated with the same three layers
as `appwithai validate` — YAML syntax, the JSON Schema, the full language
checker — so every finding is reported at the YAML line and column it concerns,
and the CLI never disagrees with the generator about whether a model is valid.

Runs under **Bun**. Reading a model needs the repository's dependencies
(`bun install` at the root).

```bash
bun language/cli/eml.ts --help
```

## Commands

| Command | Purpose |
|---------|---------|
| `generate` | Validate (self-correct) → generate an app (+Docker, +GitHub) |
| `validate` | Validate a model; report every finding; exit 1 on errors |
| `info` | Print a summary of the model |
| `help` | Show usage |

## Options

```
-i, --input <file>        Model (.eml.yaml); or first positional arg
-o, --output <dir>        Output directory for the generated app
-n, --name <name>         Application name (default: derived from the model)
    --stack <stack>       node-rest (default) | tanstack-astryx-loco | enterprise-reporting
    --skip-cli-scaffold   tanstack-astryx-loco: skip `loco new` (offline; templates only)
    --docker              Also emit Dockerfile + docker-compose.yml (node-rest)
    --github <owner/repo> Publish the generated app to a GitHub repository
    --github-token <tok>  GitHub token (else GITHUB_TOKEN / GH_TOKEN)
    --private | --public  Visibility of a repository --github creates (default private)
    --no-autofix          Do not correct mechanically fixable findings first
    --force               Overwrite a non-empty output directory
    --json                Machine-readable output (validate / info)
```

## Examples

```bash
bun language/cli/eml.ts validate -i language/yaml/examples/helpdesk.eml.yaml
bun language/cli/eml.ts info -i language/yaml/examples/helpdesk.eml.yaml
bun language/cli/eml.ts generate -i language/yaml/examples/helpdesk.eml.yaml -o ./out --docker
cd out && bun run start   # → http://localhost:3000

# The generator's own stack: a Rust (Loco.rs) backend and a TanStack Start + Astryx frontend
bun language/cli/eml.ts generate -i examples/drug-discovery.eml.yaml -o ./dd \
  --stack tanstack-astryx-loco
```

## Stacks

**`node-rest`** — a dependency-free REST application on Bun (`node:http` + a
JSON-file datastore), for trying a model in seconds:

```
out/
  src/
    server.js      HTTP server + routing (REST CRUD per entity)
    services.js    per-entity lifecycle: validation → rules → hooks → workflow
    rules.js       business-rule engine (walks each rule's decision graph)
    workflows.js   state machines (enforces legal status transitions → 409)
    hooks.js       lifecycle hook handlers (generated stubs to implement)
    validate.js    request validation (required fields, enums, coercion)
    db.js          JSON-file datastore
    model.js       the model (generated)
    openapi.js     OpenAPI 3 document builder
  rules/           one GoRules JDM document per rule, plus index.json
  eml.model.json   model snapshot
  package.json  README.md  .gitignore
  Dockerfile  docker-compose.yml  .dockerignore  .github/workflows/app-ci.yml   (with --docker)
```

**`tanstack-astryx-loco`** — the application `appwithai generate` produces, by
the same pipeline (`generateApplication`): the Loco.rs backend with its seeds and
request suites, the TanStack Start + Astryx frontend, the bun test suites, and
`model/model.eml.yaml` exactly as written. `loco new` scaffolds the backend
first; `--skip-cli-scaffold` skips it for an offline build.

**`enterprise-reporting`** — TanStack Start + Kysely + PostgreSQL code shaped to
drop into the reporting platform (`yaml/enterprise_reporting_rust`): per entity,
five CRUD server functions using `.inputValidator()` and `requireAuth()`, a
paginated list route and a detail/edit route; plus one Kysely migration and a
`KYSELY_TYPES.md` snippet for that platform's `Database` interface. It is not a
standalone application: it expects the platform's auth, RBAC, connection manager
and UI shell to be there already. The platform's own copy of the `eml` CLI
(`yaml/enterprise_reporting_rust/language/cli`) makes this its default stack.

## Business rules → GoRules JDM

For `node-rest` and `enterprise-reporting`, each rule's decision graph is converted to a GoRules JDM
document by the generator's own converter
(`packages/generator/src/rules/jdm-converter.ts`) and written to
`<out>/rules/`. Node types map to JDM nodes: `start` → inputNode, `end` →
outputNode, `decision` → switchNode, `expression` → expressionNode, `function` →
functionNode. The Loco stack seeds its rules into `sys_rule_definitions`
instead.

## Generate from an online model in CI

The repo ships a driver workflow, `.github/workflows/eml-generate-and-publish.yml`
(`workflow_dispatch`), that points the CLI at an **online model URL**
(`*.eml.yaml`), generates the app (with Docker and the `app-ci.yml` workflow),
and publishes it to a target GitHub repository with the CLI's `--github`
publisher. Inputs: `model_url`, `target_repo`, `app_name`, `stack`,
`visibility`. It needs an `EML_PUBLISH_TOKEN` secret (a token with `repo` and
`workflow` scopes; `workflow` is required to push `app-ci.yml` into the target
repository).

## How the pieces fit

```
model.eml.yaml ──readModelYaml──▶ ModelDocument ──toEmlModel──▶ EmlModel ──generate/*──▶ app
                  (YAML · schema · checker)                        │
                                                                   └──▶ generateApplication (tanstack-astryx-loco)
```

`src/document.ts` is the only reader. `src/model.ts` is what the node-rest
generators and runtime consume.

## Validation & self-correction

`validate` reports the model as written. `generate` first applies the
mechanically fixable corrections — in memory; the file is never rewritten —
and reports each one, then refuses a model that still has an error. The
correctable codes are the fixer's `AUTO_FIXABLE_CODES`
(`packages/generator/src/model-yaml/fixer.ts`), listed with what each does in
`diagnostics.autoFixable` in `../appwithai-language.json`. `--no-autofix`
generates only from a model that is valid as written.

## Development

```bash
cd language/cli
bun install                 # dev-only: TypeScript + type packages
bun run typecheck           # tsc --noEmit
bun run lint                # biome check
```
