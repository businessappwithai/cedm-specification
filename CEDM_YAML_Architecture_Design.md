# YAML as the source of truth for enterprise application models

**Repository**: `cedm-specification` · **Branch**: `claude/cedm-yaml-architecture-uxneqi`
**Status**: Phases 1–2 delivered and verified; phases 3–6 planned below.

> This document replaces an earlier draft of the same name. That draft proposed
> a new schema ("CEDL") designed without reference to what the generator
> consumes, and reported deliverables that had not been built or measured. Its
> schema and parser were removed; nothing below depends on them.

## 1. Goal

`cedm-specification` carries the complete AppWithAI platform, imported from
`app-with-ai-rust` (all 2,022 tracked files at their original paths). In that
platform an application model is written in **EML**: Mermaid diagrams with `%%`
directive comments. The goal is to make **YAML the source of truth** for every
model, with Mermaid kept only as a derived view for drawing:

- a YAML model language that expresses everything EML expresses;
- the generator — templates, CLI, web tool and the Rust generator — producing
  the complete application from YAML;
- the existing YAML→Mermaid rendering used for viewing, and saves stored as YAML.

## 2. Principles

1. **One semantic layer.** A construct has exactly one compiler. EML and YAML
   are two syntaxes read into the same records; they cannot drift apart because
   nothing downstream of the records knows which syntax was used.
2. **Equivalence is proved, not asserted.** Every model in the repository is
   converted, compiled both ways and compared on every test run; a generated
   application is compared file by file.
3. **The schema is the language.** `language/yaml/eml.schema.json` is the
   definition, and the validator runs it — there is no second description to
   fall out of step.
4. **Nothing is lost silently.** Where EML says something YAML does not carry,
   or says one thing where the compiler reads another, conversion reports it.
5. **The Mermaid view is derived.** It is regenerated from the YAML and never
   read for generation.

## 3. Architecture

```
            EML (.mmd)                                YAML (.eml.yaml)
                │                                            │
     readEmlModel (text readers)           readModelYaml: YAML → schema (ajv)
                │                                  → checker over view → view check
                ▼                                            │
          ModelRecords  ◄──────────── documentToRecords ─────┘
       (model/records.ts)  ────────── recordsToDocument ─────►  ModelDocument
                │                                               │        │
     compileModelRecords (model/compile.ts)          renderEmlView  serializeModelDocument
                │                                     (Mermaid view)  (canonical YAML)
                ▼
           ParsedModel ──► generateApplication ──► FullStackGenerator ──► templates
```

### 3.1 Model records (`packages/generator/src/model/records.ts`)

What a model *says*, before compilation: entity and attribute declarations with
the type token as written, relationships with both ends' cardinality, and one
record type per directive (category, rbac, hook, report, rule, state machine,
saga, hook diagram). Anything derived — table names, reference ids, primary
keys, default categories — is derived by the compilers, once.

Every compiler was split in two to make this possible: a reader (EML text →
records) and a record compiler (records → the `ParsedModel` pieces). The EML
entry points are the composition of the two, so EML behaviour is unchanged —
`parseModel` output is byte-identical to the pre-refactor commit on all 24
models in the repository.

| Construct | Reader | Compiler |
|---|---|---|
| ERD | `MermaidParser.read` | `compileErdRecords` |
| `%%category` | `readCategoryDirectives` | `compileCategoryDeclarations` |
| `%%rbac` | `readRbacDirectives` | `compileRbacDeclarations` |
| `%%hook` | `readHookDirectives` | `compileHookDeclarations` |
| `%%report` | `readReportDeclaration` | `validateReportDeclaration` |
| `%%rule` | `readRuleSection` | `compileRuleDeclarations` |
| state | `readStateMachines` | `compileStateMachineDeclarations` |
| saga | `readSagaDirectives` | `compileSagaDeclarations` |

### 3.2 The YAML model language (`language/yaml/`, `packages/generator/src/model-yaml/`)

The document nests what EML scatters — an entity carries its help, icon,
parent, indexes, and each attribute its enum binding and help — and otherwise
mirrors the records. The reference is `language/yaml/README.md`.

**Validation** runs in four layers, each reported at the YAML line and column:
YAML (duplicate keys refused), schema, the ~130-rule language checker run over
the Mermaid view with a line→path map back to the YAML, and a view-fidelity
check. Reusing the checker through the view gives YAML every existing semantic
rule immediately; porting the rules to operate on records natively is listed
as future work (§6) rather than done twice now.

**Canonical form**: stable key order, plain-value lists inline, defaults
omitted, identical bytes on every save.

### 3.3 Mermaid view (`render-eml.ts`)

The view is an EML document, so every existing viewer, the ERD designer and the
checker read it unchanged. Layout keeps it faithful: model-wide directives
precede all sections, rules precede workflows, sagas come last (a saga's block
runs to the next `%%workflow`), and state-machine lines are interleaved so
states first appear in the listed order. For every repository model the view
reads back to the same document.

### 3.4 Generation

`generateApplication` takes a YAML `document` or EML `sources` and compiles
once. The loco backend no longer re-parses raw EML for sagas; it takes them
from `ParsedModel` like every other construct, so no generator reads model
text. A generated project ships `model/model.eml.yaml` (source) and
`model/model.eml.mmd` (view).

The CLI (`appwithai`) accepts `.eml.yaml` for every command, validates YAML
in-process and never auto-fixes it, and adds `convert` (EML → YAML, written
only when it compiles to the same model) and `view` (YAML → Mermaid).

## 4. Findings

- **Saga trigger/operation are read from two places.** EML documents a saga's
  `trigger:` and `operation:` on its `%%workflow` line, where the checker and
  composer read them; the saga compiler (TypeScript and Rust alike) reads only
  `%%meta trigger:` / `%%meta operation:`. `language/examples/crm.eml.mmd`'s
  `ClosedWonHandoff` and `RenewalPlaybook` are declared `trigger: automatic
  operation: UPDATE` and compile as rule-triggered on every write — and, since
  no rule names them, never run. The YAML language has one place for each and
  follows the compiler; its view states the effective values where the checker
  looks, which is why the checker now reports these two sagas (EML286).
  Conversion names every affected saga. Fixing EML itself changes both
  generators' output and is Phase 6.
- **`%%trigger` and `%%guard`** are reserved by EML and compiled by nothing.
  They are reported, with line numbers, on conversion.

## 5. Delivered

### Phase 1 — Import and foundation

- Complete import of `app-with-ai-rust`: 2,022 tracked files byte-identical at
  their original paths; `cedm-specification`'s own README kept, the platform's
  as `README.platform.md`.
- Compilers split into readers and record compilers (§3.1).

### Phase 2 — YAML language and YAML-sourced generation

- `language/yaml/eml.schema.json`, `language/yaml/README.md`, YAML examples for
  the whole EML example corpus plus `examples/drug-discovery.eml.yaml`.
- Reader/validator, record conversion, compiler entry, view renderer, canonical
  serializer, EML converter with a not-carried report.
- Pipeline and CLI generate from YAML.

**Verification** (all run on this branch):

| Gate | Result |
|---|---|
| Corpus equivalence — 24 models: EML→YAML text→validated→compiled equals `parseModel(EML)`; re-serialises identically; view reads back identically; checker findings match apart from three codes traced to the EML files | pass |
| Generated application — drug-discovery from EML and from YAML: 475 files each, 473 identical after masking timestamps; the 2 others are the manifest's input path and the shipped Mermaid | pass |
| `parseModel` over 24 models vs the pre-refactor commit | byte-identical |
| `bun run parity` (TypeScript vs Rust backend, 3 models) | byte-identical |
| `bun run test:generator` | 845 / 845 |
| `bun run test` (web) | 1229 / 1229 |
| `bun run type-check`, `type-check:language` | clean |

## 6. Remaining phases

### Phase 3 — The modelling tool saves YAML

Scope: `packages/web`.
- `project-repository.ts` commits `model.eml.yaml` as the project's model;
  `project_git_state.model_code` holds YAML. A project saved before this is
  converted on its next save, and the conversion report is shown.
- The design screen renders the Mermaid view from the YAML. An edit made in
  the Mermaid editor or ERD designer is converted with `emlToModelDocument`
  on save; what it does not carry is shown before the save completes.
- `/api/generate` passes the YAML `document`; `model-context?q=yaml` reads the
  stored YAML instead of re-projecting EML.
- `allowedFile` in `project-git.ts` admits `.eml.yaml`.

Acceptance: an existing project round-trips (open → save → generate) with a
generated application identical to the one before the change; the
consistency suite (`project-repository.test.ts`) passes against Postgres.

### Phase 4 — The `eml` CLI and a browser/WASM build

- `language/cli` (`bun run eml`) accepts `.eml.yaml` for `validate`, `info`,
  `sagas` and `generate`, delegating to `model-yaml`.
- A browser bundle of the YAML language — reader, validator, view renderer,
  converter — built by `scripts/build-language-tools.ts` beside the existing
  checker bundle, so an upload page validates YAML with the same diagnostics as
  the CLI.

Acceptance: the CLI's output over every YAML example matches `appwithai
validate`; the bundle validates the examples in a headless browser.

### Phase 5 — The Rust generator reads YAML

- `crates/appwithai-gen`: `serde_yaml` into records mirroring `model/records.ts`,
  compiled by the existing Rust modules; `--input` accepts `.eml.yaml`.
- `scripts/parity-check.sh` compares TS(YAML) with Rust(YAML) and Rust(YAML)
  with Rust(EML) for every parity model.
- A `wasm32` build of the generator core (records → dictionary/access/workflow
  seeds) as the compiled half of the CLI-WASM target.

Acceptance: parity byte-identical on YAML inputs; `cargo clippy -D warnings`
clean on CI's toolchain.

### Phase 6 — Consolidation

- Fix the saga trigger/operation split in both generators (read the directive,
  keep `%%meta` for compatibility), with the parity corpus extended to cover it.
- Port the checker's rules to run on records, removing the view round-trip
  from validation.
- EML becomes an import format: `convert` stays, generation from `.mmd` is
  retired once Phases 3–5 have shipped.

## 7. Risks

| Risk | Mitigation |
|---|---|
| A new EML construct is added to one syntax only | Constructs exist once, in the records; the corpus test fails on any model the two syntaxes compile differently |
| The view cannot draw a YAML value | The view-fidelity layer warns at that value; generation is unaffected |
| Checker findings phrased in EML terms confuse YAML authors | Locations are YAML; Phase 6 moves the rules onto records |
| Rust generator lags the TypeScript one on YAML | Phase 5's parity gate runs on YAML inputs; until then the Rust CLI reads EML, which `convert`/`view` keep available |
