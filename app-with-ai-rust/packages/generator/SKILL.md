---
name: appwithai-generator
description: Code generation engine for AppWithAI — reads a YAML or CEDM model and generates a Loco.rs + TanStack Start/Astryx application through Handlebars templates
---

# @appwithai/generator Skill

This skill provides guidance for working with the generator package of AppWithAI,
which reads a model (`*.eml.yaml`, or `*.cedm.yaml` lowered to one) and generates
a complete application using Handlebars templates.

## Package Overview

The generator package is responsible for:

- **Model reading**: `readModelYaml` validates a model in three layers — YAML
  parse, the JSON Schema (`language/yaml/eml.schema.json`), then the semantic
  checker — and `compileModelDocument` turns it into a `ParsedModel`
- **CEDM lowering**: a `*.cedm.yaml` model is lowered to the model document by
  `language/cedm/lower.ts` before anything else reads it
- **Template rendering**: Handlebars templates with the helpers the templates call
- **Code generation**: one stack, `tanstack-astryx-loco` — a Loco.rs backend
  crate and a TanStack Start + Astryx frontend, plus tests and a manual
- **CLI Tool**: `appwithai` / `appwithai-generate`

## Directory Structure

```
packages/generator/
├── src/
│   ├── cli/generate.ts              # generate | validate | convert | info | list | …
│   ├── model-yaml/                  # readModelYaml, the fixer, canonical form, serializer
│   ├── model-cedm/                  # CEDM reading and equivalence tests
│   ├── model/                       # records.ts, compile.ts — the one semantic layer
│   ├── pipeline/
│   │   ├── generate-application.ts  # ⭐ the one generation path (CLI and web)
│   │   └── settings.ts              # GenerationSettings + defaults
│   ├── generators/
│   │   ├── full-stack.generator.ts  # orchestration
│   │   └── tanstack-astryx-loco/    # loco-backend + astryx-frontend generators, seeds
│   ├── rbac/  hooks/  reports/  rules/  workflows/   # per-construct compilers
│   ├── graph/                       # model → Apache AGE property graph
│   ├── manual/                      # the generated user manual
│   ├── reporting/                   # the reporting pack
│   └── templates/loader.ts          # Handlebars template loader
├── templates/
│   ├── common/
│   └── tanstack-astryx-loco/        # backend/, frontend/, tests/, docker-compose
└── package.json
```

## Key Concepts

### Reading a model

```typescript
import { parseModelYaml, readModelYaml } from '@appwithai/generator/model-yaml';

// Diagnostics without throwing
const read = readModelYaml(text);
read.ok;           // false when any error was reported
read.diagnostics;  // { severity, code, message, line, column }

// What generation starts from; throws ModelYamlError on errors
const { model, document } = parseModelYaml(text, { source: 'crm.eml.yaml' });
model.entities;       // Entity[]
model.relationships;  // Relationship[]
```

A new construct gets a record type in `model/records.ts`, a YAML key in the
schema and `document.ts`, and one compiler. Nothing compiles from text.

### Generating an application

```typescript
import { generateApplication } from '@appwithai/generator/pipeline';

await generateApplication({
  document,
  modelText: text,                // shipped as model/model.eml.yaml
  projectName: 'crm',
  outputDir: './generated/crm',
  database: 'postgres',           // or 'neon'
  skipCliScaffold: true,          // offline: no `loco new`
});
```

Add a generator input to `GenerationSettings` once — never at a call site.

### Templates

Templates live under `templates/tanstack-astryx-loco/`. A rendered template is
listed in `RENDERED_FILES` (TypeScript generator **and** `crates/appwithai-gen`);
a verbatim one is in the static-copy list. One template per output file.

Strict mode is off in both template engines, so an unregistered helper renders
as an empty string. Never register a helper under the name of a context field.

## CLI Usage

```bash
# Validate a model
bun packages/generator/dist/cli/generate.js validate model.eml.yaml

# Generate an application
bun run generate:tanstack -- -i examples/drug-discovery.eml.yaml \
  -o generated-projects/drug-discovery -n drug-discovery

# Convert between the model document and CEDM
bun packages/generator/dist/cli/generate.js convert model.eml.yaml
```

## Building the Package

```bash
bun --filter @appwithai/core build && bun --filter @appwithai/generator build
```

`bun run generate` runs `dist/`, so a TypeScript change does nothing until this
rebuild. Templates are read from disk and need no rebuild.

## Exports

- `@appwithai/generator` - Main entry point
- `@appwithai/generator/model-yaml` - Reading, checking, fixing, serializing models
- `@appwithai/generator/pipeline` - `generateApplication`
- `@appwithai/generator/graph` - Model graph (Apache AGE)
- `@appwithai/generator/rules` - Rule compilation
- CLI: `appwithai`, `appwithai-generate`

## Testing

```bash
bun run test:generator       # unit tests, ~seconds
bun run parity               # TypeScript, Rust and WebAssembly generators agree
bun run test:e2e:generated   # generate, compile, run, and test over HTTP
```
