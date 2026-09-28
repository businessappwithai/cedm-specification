# Generation templates

The Handlebars templates the generators render into a generated application.
There is one stack, `tanstack-astryx-loco`: a Loco.rs (Rust) backend and a
TanStack Start + Astryx frontend, with bun end-to-end suites beside them.

```
tanstack-astryx-loco/
├── backend/             Loco.rs crate: Cargo workspace, migration/ crate,
│                        config/*.yaml, controllers, services, tasks, request suites
├── frontend/            TanStack Start routes and components, the Astryx overlay
├── tests/               the generated bun:test harness and suites
└── docker-compose.yml.hbs
common/                  templates from the retired NestJS stack; no generator reads them
```

Both generators render these files. `packages/generator` (TypeScript) emits the
whole application; `crates/appwithai-gen` (Rust) emits `backend/`, and
`bun run parity` holds the two backends byte-identical.

## Usage

```bash
bun run generate:tanstack -- -i examples/drug-discovery.eml.yaml \
  -o generated-projects/drug-discovery -n drug-discovery
```

The model is a YAML document (`*.eml.yaml`); see `language/yaml/README.md`.
The generated project carries it, as written, in `model/model.eml.yaml`.

## Adding or changing a template

1. A template is rendered only if its generator names it: `RENDERED_FILES` in
   `src/generators/tanstack-astryx-loco/loco-backend.generator.ts` and
   `crates/appwithai-gen/src/backend.rs` for the backend, the copy lists in the
   frontend generator for verbatim files. One template per output file.
2. Handlebars strict mode is off in both engines, so a helper one registry lacks
   renders as an empty string rather than failing. Exercise a new helper in a
   corpus model and run `bun run parity`.
3. Never write `{{` in a template's output text — an inline `style={ {…} }`, a
   `${VAR:-{{x}}}` shell default — use the `shellDefault` / `shellRequired`
   helpers or hoist the value. `src/templates/__tests__/template-syntax.test.ts`
   precompiles every template and rejects the inline shapes.
4. Regenerate and confirm the change landed in the output: a template the
   generator does not read changes nothing while looking like a finished fix.
