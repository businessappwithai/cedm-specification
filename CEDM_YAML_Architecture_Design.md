# YAML as the source of truth for enterprise application models

**Repository**: `cedm-specification`
**Status**: Delivered. YAML is the only model notation the platform reads,
writes, documents or ships; `scripts/check-yaml-only.sh` keeps it that way.

> This document replaces an earlier draft of the same name. That draft proposed
> a new schema ("CEDL") designed without reference to what the generator
> consumes, and reported deliverables that had not been built or measured. Its
> schema and parser were removed; nothing below depends on them.

## 1. Goal

`cedm-specification` carries the complete AppWithAI platform, imported from
`app-with-ai-rust` (all 2,022 tracked files at their original paths). There an
application model was written in **EML**, a text notation of diagrams with
directive comments. The goal was to make **YAML the source of truth** for every
model:

- a YAML model language that expresses everything EML expressed;
- the generator — templates, CLI, web tool, the Rust generator and its
  `wasm32-wasip1` build — producing the complete application from YAML;
- saves, generated projects and every published document in YAML.

Once every consumer read YAML and the equivalence of the two notations had been
proved over the whole corpus, EML was removed: its readers, its view renderer,
its converter, its examples and its documentation.

## 2. Principles

1. **One semantic layer.** A construct has exactly one compiler. The document is
   read into records and nothing downstream of the records knows how it was
   written.
2. **Equivalence is proved, not asserted.** The removal of EML was gated on
   every corpus model compiling to the same records from both notations, and on
   a generated application being identical file by file.
3. **The schema is the language.** `language/yaml/eml.schema.json` is the
   definition, and the validator runs it — there is no second description to
   fall out of step.
4. **Nothing is lost silently.** A construct the language validates but no
   application generator compiles is documented as *carried, not compiled* in
   `language/yaml/README.md`.

## 3. Architecture

```
   CEDM (.cedm.yaml) ── lowerCedmModel ──►  YAML (.eml.yaml)
                                                 │
                         readModelYaml: YAML parse → schema (ajv) → checker
                                                 │
                                           ModelDocument
                                                 │
                               documentToRecords (model-yaml/to-records.ts)
                                                 │
                                          ModelRecords (model/records.ts)
                                                 │
                               compileModelRecords (model/compile.ts)
                                                 │
                                           ParsedModel ──► generateApplication
                                                              │
                                                  FullStackGenerator ──► templates
```

### 3.1 Model records (`packages/generator/src/model/records.ts`)

What a model *says*, before compilation: entity and attribute declarations with
the type token as written, relationships with both ends' cardinality, and one
record type per construct (category, rbac, hook, report, rule, state machine,
saga, hook flow). Anything derived — table names, reference ids, primary
keys, default categories — is derived by the compilers, once.

| Construct | Compiler |
|---|---|
| ERD | `compileErdRecords` |
| `categories` | `compileCategoryDeclarations` |
| `rbac` | `compileRbacDeclarations` |
| `hooks` | `compileHookDeclarations` |
| `reports` | `validateReportDeclaration` |
| `rules` | `compileRuleDeclarations` |
| `stateMachines` | `compileStateMachineDeclarations` |
| `sagas` | `compileSagaDeclarations` |

### 3.2 The YAML model language (`language/yaml/`, `packages/generator/src/model-yaml/`)

The document nests what belongs together — an entity carries its help, icon,
parent and indexes, and each attribute its enum binding and help. The reference
is `language/yaml/README.md`.

**Validation** runs in three layers, each reported at the YAML line and column:
YAML (duplicate keys refused), the schema, and the language checker
(`language/yaml/checker.ts`), which runs on the document itself and carries the
document path of every finding.

**Canonical form**: stable key order, plain-value lists inline, defaults
omitted, identical bytes on every save.

**Repair**: `model-yaml/fixer.ts` applies the auto-fixable codes.

### 3.3 Generation

`generateApplication` takes the validated `document` and the text it was read
from, and compiles once. No generator reads model text. A generated project
ships `model/model.eml.yaml`, and, for a CEDM model, `model/model.cedm.yaml`
beside it with the CEDM library it used under `cedm/`.

The CLI (`appwithai`) reads `.eml.yaml` and `.cedm.yaml` for every command and
never auto-fixes; `convert` converts between the model document and CEDM.

## 4. Findings fixed on the way

- **A saga's trigger and operation were read from two places.** The checker
  read them from the saga's own declaration and the compiler (TypeScript and
  Rust alike) from separate metadata, so crm's `ClosedWonHandoff` and
  `RenewalPlaybook`, declared `trigger: automatic, operation: UPDATE`, compiled
  as rule-triggered on every write. The YAML language has one place for each,
  and both compilers read it (`sagaTrigger` / `saga_trigger`).
- **Two reserved constructs were compiled by nothing.** `triggers` and guards
  are validated and carried; `language/yaml/README.md` says which generators
  compile them.

## 5. Delivered

| Phase | Delivered |
|---|---|
| 1 — Import and foundation | Complete import of `app-with-ai-rust`; compilers split into readers and record compilers |
| 2 — YAML language and generation | Schema, reference, examples, reader/validator, records, canonical serializer; pipeline and CLI generate from YAML |
| 3 — The modelling tool saves YAML | `project-repository.ts` commits `model/model.eml.yaml`; generation reads only that YAML; `allowedFile` admits it |
| 4 — CLI and browser | The `eml` CLI reads YAML; `html/model-yaml.js` is the language in a browser, checked against the CLI in headless Chromium |
| 5 — The Rust generator reads YAML | `crates/appwithai-gen` reads the document into records; `bun run parity` holds TypeScript = Rust = `wasm32-wasip1` |
| 6 — Consolidation | Checker rules run on the document; EML readers, view renderer, converter, stored-model converter and examples removed; the four product copies converted; `check-yaml-only.sh` gates the repository and every generated application |

**Verification** at the removal of EML:

| Gate | Result |
|---|---|
| Corpus equivalence — every model: EML and YAML compile to the same records; YAML re-serialises identically | pass |
| Generated application — drug-discovery from EML and from YAML, compared file by file after masking timestamps | identical apart from the shipped model file |
| `bun run parity` (TypeScript vs Rust vs WebAssembly, all parity models; CEDM lowering in both languages) | byte-identical |
| `bun run test:generator`, `bun run test`, `type-check`, `type-check:language` | pass |

## 6. Risks

| Risk | Mitigation |
|---|---|
| A new construct is added to one generator only | Constructs exist once, in the records; `bun run parity` fails on any model the generators compile differently — so grow the parity corpus with the construct |
| A construct is validated and silently not compiled | `language/yaml/README.md` marks each such key *carried, not compiled*; a new key is either compiled or marked the same day |
| The CEDM lowering drifts between TypeScript and Rust | `scripts/cedm-lowering-parity.ts`, run by `bun run parity`, compares them document for document |
