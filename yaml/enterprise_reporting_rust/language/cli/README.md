# EML CLI (`eml`)

Reads a model (`*.eml.yaml`: ERD + business rules + workflows), validates it
with the language's own reader, and generates code for this platform from it.

The reader is the one at the root of the repository
([`language/cli/src/document.ts`](../../../../language/cli/src/document.ts) over
`packages/generator/src/model-yaml`): YAML syntax, the JSON Schema, the full
language checker, and every finding located at its YAML line and column. The
generators — `enterprise-reporting` and `node-rest` — are this platform's own.

Runs under **Bun**, from this repository's checkout (the reader resolves its
`yaml` and `ajv` from the root install).

```bash
bun language/cli/eml.ts --help
```

## Commands

| Command | Purpose |
|---------|---------|
| `generate` | Validate (correcting what is mechanically correctable, in memory) → generate |
| `validate` | Validate a model; report every finding at its YAML line; exit 1 on errors |
| `info` | Print a summary of the model |
| `help` | Show usage |

## Options

```
-i, --input <file>        Model file (.eml.yaml); or first positional arg
-o, --output <dir>        Output directory for the generated code
-n, --name <name>         Application name (default: derived from the model)
    --stack <stack>       enterprise-reporting (default) | node-rest
    --docker              Also emit Dockerfile + docker-compose.yml (node-rest only)
    --github <owner/repo> Publish the generated app to a GitHub repository
    --github-token <tok>  GitHub token (else GITHUB_TOKEN / GH_TOKEN)
    --private | --public  Visibility of the created GitHub repo (default private)
    --no-autofix          Do not correct mechanically fixable findings before generating
    --force               Overwrite a non-empty output directory
    --json                Machine-readable output (validate/info)
-h, --help                Show help
-v, --version             Show version
```

`validate` reports the model as written; `generate` applies the language's
fixer in memory first (the file on disk is never changed) unless
`--no-autofix` is given.

## Examples

```bash
# Validate a model
bun language/cli/eml.ts validate -i language/examples/helpdesk.eml.yaml

# Summarise it
bun language/cli/eml.ts info -i language/examples/helpdesk.eml.yaml

# Generate TanStack Start + Kysely code (enterprise-reporting, the default)
bun language/cli/eml.ts generate -i model.eml.yaml -o ./out

# Generate a prototype Node REST app
bun language/cli/eml.ts generate -i model.eml.yaml -o ./out --stack node-rest --docker

# Generate and publish to GitHub (needs GITHUB_TOKEN)
bun language/cli/eml.ts generate -i model.eml.yaml -o ./out --github me/my-app --public
```

## Stacks

### `enterprise-reporting` (default)

Generates **TanStack Start + Kysely + PostgreSQL** code that slots into this
repository. For each entity:

- `src/server-fns/<entity>.ts` — five CRUD server functions, each using
  `.inputValidator()` (never `.validator()`), `requireAuth()`, and Kysely via
  `getDb()`, with a Zod schema and TypeScript type.
- `src/routes/_authed/<entity>/index.tsx` — paginated list page with TanStack
  Table and shadcn/ui components.
- `src/routes/_authed/<entity>/$id.tsx` — detail / edit page.

Shared outputs:

- `src/lib/db/migrations/<ts>_create_tables.ts` — a Kysely migration with
  PostgreSQL DDL (`CREATE TABLE IF NOT EXISTS`).
- `KYSELY_TYPES.md` — a snippet for the `Database` interface in
  `src/lib/db/kysely-db.ts`.

```
out/
├── src/
│   ├── server-fns/<entity>.ts
│   ├── routes/_authed/<entity>/
│   │   ├── index.tsx
│   │   └── $id.tsx
│   └── lib/db/migrations/<ts>_create_tables.ts
├── rules/<rule>.jdm.json
├── KYSELY_TYPES.md
└── README.md
```

### `node-rest`

A self-contained, **dependency-free** Node app (`node:http` + JSON-file
datastore) — `runtime/src/` plus the model as `src/model.js` and hook stubs in
`src/hooks.js`. With `--docker` it also emits a `Dockerfile`,
`docker-compose.yml`, and a GitHub Actions workflow at
`.github/workflows/app-ci.yml`.

## Business rules → GoRules JDM

For either stack, each rule is converted to a GoRules JDM decision document by
the generator's own converter (`packages/generator/src/rules/jdm-converter.ts`)
and written to `<out>/rules/`: `start` → inputNode, `end` → outputNode,
`decision` → switchNode, `expression` → expressionNode, `function` →
functionNode.

## Architecture

```
model.eml.yaml ──readModel──▶ ModelDocument ──toEmlModel──▶ EmlModel ──generate/*──▶ code
                  (root: language/cli/src/document.ts, packages/generator/src/model-yaml)
```

## Development

```bash
cd language/cli
bun install          # dev-only: TypeScript + type packages
bun run typecheck    # tsc --noEmit
bun run lint         # biome check
```
