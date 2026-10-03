# Architecture: four product repositories inside `cedm-specification`, YAML-only

**Repository changed:** `businessappwithai/cedm-specification`, branch `ccr-bed99bf5-27bbbs` (draft PR).
**Repositories read, not changed:** `app-with-ai-rust`, `app-and-report-with-ai-rust`, `enterprise_reporting_rust`, `businessappwithairust`.
On approval this document is committed as `docs/architecture/yaml-only-repository-consolidation.md` and kept current as each phase finishes.

---

## 1. Context

`cedm-specification` already moved the platform from Mermaid models (EML, `.eml.mmd`) to YAML (`.eml.yaml`) with CEDM (`.cedm.yaml`) on top. It did that in place. The root is `app-with-ai-rust`, converted, and nothing keeps the original layout of each repository.

An earlier attempt copied three of the repositories under `yaml/`. Exploration found it incomplete:

- The root-side tools it relies on never reached `main`: `scripts/patch-vendored-generators.ts`, `scripts/build-site-bundles.ts`, `scripts/convert-model-files.ts` and `language/browser/browser-generator.entry.ts`. They exist only on the closed branch `claude/cedm-yaml-repo-conversion-rwpznq`.
- `build/generate-app.ts` does not exist anywhere.
- The website's `run-in-browser.js`, `run-real-stack.js`, `assistant.js`, `check-spec.mjs` and `website-e2e.mjs`, and every llmtext document, still read Mermaid. They are broken in the copy.
- The copies import the cedm root by deep relative path, so none of them stands on its own.
- The verify harness cannot run on `main`.
- `app-with-ai-rust` has no copy at all.

**What you asked for.** Fresh copies of all four repositories at the top level of `cedm-specification`, keeping their own layout. Convert each to YAML by redoing the proven root conversion on it. Prove the Mermaid and YAML forms generate the same output. Only then remove every trace of Mermaid from the whole repository.

**Decisions you confirmed:**

| Question | Decision |
|---|---|
| Folder names | `app-with-ai-rust/`, `app-and-report-with-ai-rust/`, `businessappwithairust/`, `enterprise-reporting-rust/` (hyphenated, as you asked; the GitHub name stays `enterprise_reporting_rust`) |
| Existing `yaml/` | Kept, and the new copies are added beside it. It is still covered by the final Mermaid purge (§8.4) |
| What the `app-with-ai-rust` copy contains | YAML **and** CEDM, matching the root's platform code. The domain library, `applications/` and `generated-applications/` stay at the root only |
| How far removal goes | Both the model input format **and** Mermaid as a diagram renderer or view |
| Upgrade path for old databases | Removed. No Mermaid-era database conversion remains anywhere (§8.2) |
| `generated-applications/` | Regenerated from YAML once the generators emit no Mermaid |

---

## 2. Current state (measured)

| Repository | Pinned commit (= local HEAD) | Tracked files | `.mmd` files | Files mentioning "mermaid" |
|---|---|---|---|---|
| app-with-ai-rust | `2512a1f` | 2023 | 24 | 210 |
| app-and-report-with-ai-rust | `fbc49ce` | 176 | 18 | 48 |
| enterprise_reporting_rust | `ac01073` | 3036 | 4 | 23 |
| businessappwithairust | `eccd780` | 190 | 6 | 45 |

**The cedm root is already nearly Mermaid-free.**

- Neither generator CLI accepts `.mmd`: `isModelYamlPath` in `packages/generator/src/model-yaml/index.ts`, and `is_model_yaml_path` in `crates/appwithai-gen/src/main.rs`.
- The checker runs directly on the YAML document: `language/yaml/checker.ts` → `checkModelDocument`, called from `readModelYaml` in `model-yaml/validate.ts`.
- Diagrams are drawn with React Flow and elkjs (`components/model/ModelDiagram.tsx`).
- The `mermaid` npm package appears only as a transitive dependency.

**What still depends on Mermaid at the root:**

1. **The one-time database converter.** `packages/web/src/lib/server/stored-models/**`, including the vendored `legacy/eml.js` and `legacy/automation.js`, plus `scripts/convert-stored-models.ts` and the four `.mmd` test fixtures.
2. **The core startup gate.** `packages/core/src/services/model-format.ts` (`assertModelFormat`), called from `database.service.ts` `runMigrations`, and the `stored_model_conversions` type.
3. **Two migrations in every generated backend.** `m0013_workflow_definition_source` creates `mermaid_code`. `m0017_workflow_definition_yaml.rs.hbs` contains `automation_document()`, a Rust port of the Mermaid automation parser. Both generators emit them: `loco-backend.generator.ts` and `crates/appwithai-gen/src/backend.rs`. They are in all 47 `generated-applications/`.
4. **Stale code, CI and docs.**
   - `tests/scripts/*` and `scripts/tests/*` legacy scripts that import a parser which no longer exists.
   - `.github/workflows/eml-generate-and-publish.yml`, which downloads an `.mmd`.
   - `SAMPLE_MERMAID_ERD` in `packages/generator/test/setup.ts`.
   - `database/migrations/001_initial_schema.ts` and `database/generator.sql`, which still create `mermaid_code` columns.
   - `.gitignore`, `.env.example`.
   - Prose: `CLAUDE.md` (59 mentions, much of it stale), `docs/` (26 files), `website/llmtext/` (4 files with Mermaid fences), `html/` (9 files), the `SKILL.md`/README files in packages, and `CEDM_YAML_Architecture_Design.md`.

---

## 3. Target layout

```
cedm-specification/
├── (root platform: unchanged role — YAML + CEDM, domain library, applications, generated-applications)
├── app-with-ai-rust/              ← copy of businessappwithai/app-with-ai-rust @2512a1f, converted
├── app-and-report-with-ai-rust/   ← copy @fbc49ce, converted
├── enterprise-reporting-rust/     ← copy of enterprise_reporting_rust @ac01073, converted
├── businessappwithairust/         ← copy @eccd780, converted
├── yaml/                          ← earlier conversion, kept (purged of Mermaid in Phase 6)
└── COPIES.yaml                    ← source repository, commit, file count, exclusions per copy
```

### 3.1 Dependency topology: the four copies form one closed set

Originally the orchestrator placed `app-with-ai-rust/` and `enterprise_reporting_rust/` beside itself with `deps.sh`. The copies keep that shape, but use their siblings instead of the cedm root.

```
app-and-report-with-ai-rust ──► ../app-with-ai-rust   (generator pipeline, model-yaml, reporting pack, core aliases)
                            ──► ../enterprise-reporting-rust   (docker build contexts)
enterprise-reporting-rust   ──► ../app-with-ai-rust   (YAML reader, language definition, JDM converter)
businessappwithairust       ──► (none at run time: self-contained vendored browser bundles, built from ../app-with-ai-rust)
app-with-ai-rust            ──► (none; CEDM library found by walk-up → cedm root, or CEDM_SPEC_ROOT)
```

Why siblings rather than the root:

- The copy set mirrors the original repositories' relationships.
- A copy can be lifted back out with its partners.
- `yaml/` already demonstrated the alternative, deep `../../../../` paths into the root, and its brittleness.

`deps.sh`/`deps.json` in the orchestrator become a sibling-path resolver with no clone or fetch.

`locateCedmRoot` and `locate_root` already find the specification by walking up, so the `app-with-ai-rust` copy's CEDM imports resolve to the root's `domain/` with no code change.

### 3.2 How the copies sit inside the root's tooling

Without these changes the root's own gates break.

| Root tool | Change |
|---|---|
| `Cargo.toml` workspace | Add the four copies to `exclude`; each has its own cargo workspace |
| `package.json` workspaces (`packages/*`) | Unchanged. Copies install separately (`bun install` inside each) |
| `biome.json`, `tsconfig*.json`, `vitest.config.ts` | Exclude the four copies (Biome otherwise treats nested configs as nested roots and refuses to run) |
| Corpus walkers (`cedm-equivalence`, `examples-in-sync`, `generate-domain-applications.sh`) | Skip the copies, as they already skip `yaml/` and `generated-applications/` |
| `.gitignore` | `node_modules/`, `target/`, `dist/`, `.runtime/`, `generated-projects/` inside every copy |

### 3.3 What "copy as is" excludes

These are the same exclusions as the earlier import, recorded in `COPIES.yaml`:

- `.git`
- The `.claude/skills/gstack` submodules, which are third-party and installed per developer.
- Secrets and data in `enterprise_reporting_rust`: `.env.docker.production`, `data.backup`, `*.sqlite-wal`, `*.sqlite-shm`.
- Build output.

Everything else is copied byte-identical and committed **before** any conversion, so the conversion is a reviewable diff.

---

## 4. The YAML architecture each copy adopts

This is the existing root design, which you described as perfect. It is reused, not redesigned.

```
.eml.yaml / .cedm.yaml
   │  readModelYaml: YAML parse (duplicate keys refused) → eml.schema.json (ajv 2020) → checkModelDocument
   │  CEDM: resolveCedmImports → lowerCedmModel  (TS)  ≡  cedm.rs (Rust), proved by cedm-lowering-parity
   ▼
ModelDocument → documentToRecords → ModelRecords → compileModelRecords → ParsedModel
   ▼
generateApplication → loco backend + Astryx frontend + tests   (TS)   ≡   appwithai-gen (Rust, native + wasm32-wasip1)
```

- **One semantic layer.** Each construct has one record type and one compiler.
- **The schema is the language:** `language/yaml/eml.schema.json`.
- **Diagnostics are reported at YAML line and column.**
- **Diagrams are drawn from the document:**
  - React Flow + elkjs in the web tool.
  - The SVG viewers (`erd-viewer.js`, `workflow-viewer.js`, `rules-viewer.js`) on the sites, fed by `readModelForViewer` from the YAML bundle.
  - No Mermaid text is ever produced.

---

## 5. Conversion of each copy

The conversion recipe is recovered from `claude/cedm-yaml-repo-conversion-rwpznq`: the four missing root scripts and the root CLI's `enterprise-reporting` stack. Each is adapted to today's root, where the Mermaid readers are gone and CEDM exists, and placed in the copy that owns it.

### 5.1 `app-with-ai-rust/`: make its platform equal to the root's

The copy's platform paths become identical to the root's:

- `packages/`, `crates/`, `language/`, `scripts/`, `database/`, `examples/`, `html/`, `website/`, `tests/`
- root configs, and `docs/` where it applies to the platform

`cedm-specification`-only content is not copied in: `domain/`, `domains/`, `specification/`, `schema/`, `tools/`, `applications/`, `generated-applications/`, `graphify-out/`, the screenshots, `yaml/`.

Method:

1. `rsync` the root's tracked platform files over the clone.
2. Delete clone paths the root deleted. These are the Mermaid parsers, `mermaid*.ts`, `api/mermaid`, `routes/admin/mermaid`, `mermaid-agent.ts`, `language/checker.ts`/`fixer.ts`/`composer.ts`/`grammar`/`spec` (Mermaid), and every `.mmd`.
3. Each `.mmd` model gets its `.eml.yaml` counterpart, produced by the root converter at the 18f5792 reference. Every copy example already has a root YAML twin (`examples/drug-discovery.eml.yaml`, `language/yaml/examples/*`).
4. Root-specific prose (`README.md` of cedm) is not carried; the copy keeps its own `README.md`, rewritten for YAML.

### 5.2 `enterprise-reporting-rust/`

- **`language/cli`.**
  - Reads `.eml.yaml` through `../app-with-ai-rust/packages/generator/src/model-yaml` and `language/cli/src/document.ts`.
  - Keeps its two stacks, `enterprise-reporting` and `node-rest`.
  - Version 2.0.0.
  - `runtime/src/workflows.js` reads `wf.initial`.
- **Removed:** the Mermaid parser and validator, `vendor/` (the Mermaid flowchart parser and JDM converter, replaced by `ruleGraphToJdm`), and `erdwithai-language.json`, `checker.ts`, `fixer.ts`, `composer.ts`, `grammar/`, `spec/`, `rag.ts`. The README points at the YAML reference.
- **Examples:** `crm`, `ecommerce`, `helpdesk`, `minimal` → `.eml.yaml`.
- **`rust/src/tasks/seed_reporting_pack.rs` fixture:** `crm.eml.yaml`.
- **Secret defaults** in `docker-compose.{dev,local,remote}.yml` and `docs/DOCKER_*.md` are scrubbed, as in `yaml/`.

### 5.3 `app-and-report-with-ai-rust/`

- **`common/language/` removed.** It is replaced by the sibling `app-with-ai-rust`'s YAML reader.
- **`common/build/generate-app.ts` written.** It is the missing piece: a thin CLI over `generateApplication({ document })` from the sibling, used by `start.sh`, `check-stacks` and `check-reporting-pack`.
- **`common/build/reporting-pack.ts`:** `parseModelYaml` → `buildReportingPack`. `start.sh` accepts only `*.eml.yaml`/`*.cedm.yaml`.
- **Models.**
  - `common/examples/*`, `common/html/models/*` and the former `common/language/examples/*` → `.eml.yaml`.
  - `check:models` keeps its twin-copies assertion over the YAML files.
  - `clinic.mmd`, which is prose rather than a model, becomes `clinic.md`.
- **`docker-compose.yml`** uses `../enterprise-reporting-rust` as its build contexts.
- **Pages and assets.** The `html/` guide, viewers and `run-in-browser.js` use the YAML bundles (§5.5). `run-real-stack` is converted, not deleted (§5.5).

### 5.4 `businessappwithairust/`

- **Published validators.**
  - `guide/model-yaml.js` replaces `checker.js` and `fixer.js`.
  - `check-model.mjs`, `audit-model.mjs` and `check-model-standalone.mjs` run it; the audit keeps its 22 checks, restated over the document.
  - `guide/source/*.html` and `build-validator-source-page.mjs` carry `model-yaml.js`.
- **Viewers.** `viewers/appwithai-model.js` replaces `eml-model.js`, and `erd/workflow/rules-viewer.js` read the document.
- **Models.** Six `guide/models/*.eml.yaml`. `BUILT_IN` and the `try-it-yourself.html` cards point at them.
- **Chapters 09 and 10 and the assistant are fixed; `yaml/` left all three broken.** `run-in-browser.js`, `run-real-stack.js` and `assistant.js` compile YAML with `compileForBrowser` and validate with `model-yaml.js`. The assistant extracts a ```yaml fence.
- **Specifications.** `llms-full.txt`, `llmdetailed.txt` and the two derived enhancement editions are rewritten as the **YAML** model-language protocol, with examples in ```yaml fences validated by `model-yaml.js`. The editions are rebuilt with `build-llmtext-enhancement.mjs`.
- **Checks.**
  - `check-spec.mjs` and `website-e2e.mjs` measure figures with the YAML reader.
  - `tests.yml` runs them.
  - `CLAUDE.md` is rewritten.

### 5.5 Vendored browser generators, which have no source in these repositories

`appwithai-wasm.js` and `appwithai-fullstack.js` were built upstream in `app-with-ai-tanstack`. They are converted in three steps:

1. **Patch.** `scripts/patch-vendored-generators.ts` lives in `app-with-ai-rust/scripts/` and is applied to each site's copy. It adds `generateFromModel(options)`, which takes a model compiled by `appwithai-model.js` at the parse boundary. The same patch is extended to `appwithai-fullstack.js` (chapter 10, and the deployable zip with `overlay: false`).
2. **Rebundle.** The patched module is rebuilt with `bun build --format esm` from an entry that re-exports only the surviving exports. Tree-shaking then removes the dead Mermaid parser, which would otherwise stay in the file unexported.
3. **Reword.** Remaining wording (`model/model.eml.mmd`, MIME type, manual text) is changed by named replacements, each listed in the script.

`scripts/build-site-bundles.ts` (in `app-with-ai-rust/scripts/`) builds `appwithai-model.js` and `model-yaml.js` from `language/browser/*.entry.ts` for both sites. `--check` fails when a committed bundle is stale. This follows the rule that `Bun.build` output is pinned to bun version and platform.

---

## 6. Equivalence: Mermaid against YAML, before anything is deleted

The **Mermaid side** is the original repository at its pinned commit, exported to the scratchpad (`git archive` from `/home/user/<repo>`). It is never added to the cedm repository. The **YAML side** is the converted copy.

The harness is `verify/` in `app-with-ai-rust/scripts/verify-yaml-conversion/`, adapted from `yaml/verify/`. It takes `--mermaid <dir>`, `--only <section>` and `--json`.

The 18f5792 reference compiler for Mermaid models is restored as a scratch worktree of cedm at that commit, fetched from the remote.

| # | Gate | What must hold |
|---|---|---|
| E1 | **Models**: every `.mmd` in all four originals | It has a YAML counterpart. `compileModelDocument(yaml)` is deep-equal to the reference `parseModel(mmd)` |
| E2 | **Full application**: `app-with-ai-rust`, drug-discovery and crm | The original's generator over the `.mmd` and the copy's over the `.eml.yaml` emit the same file set. Every file is byte-identical except the generation timestamp and the model file's name and format |
| E3 | **Rust parity** in the copy | `bun run parity`: TS, Rust native and Rust wasm32-wasip1 backends byte-identical on every parity model, and CEDM lowering parity |
| E4 | **Enterprise CLI**: 4 models × 2 stacks | Mermaid CLI output equals YAML CLI output, apart from the named, justified differences carried over from `compare-output.ts` (listing order, migration timestamp, reader-only fields, unread `%%rbac`, rounded rule node, `initial`) |
| E5 | **Browser**: 6 website models + 3 orchestrator models | The compiled model is byte-equal. `generateFromModel(yaml)` equals the original `generateFromSource(mmd)`, again apart from the named replacements and timestamps. Viewer models are equal. The same holds for `appwithai-fullstack.js` output |
| E6 | **Reporting pack**, orchestrator | The pack derived from YAML equals the pack derived from Mermaid for every model, and `check:pack:ci` runs all of its SQL against a real PostgreSQL 16 |

Every difference that is accepted has a name and a reason in the harness code. Anything unnamed fails the gate.

---

## 7. Each copy's own gates (YAML side), all green before the purge

| Copy | Gates |
|---|---|
| app-with-ai-rust | `bun install` (lockfile from root), `type-check`, `type-check:language`, `test`, `test:generator`, `cargo clippy -p appwithai-gen --all-targets -D warnings` on CI's toolchain, `parity`, `test:e2e:generated` (303) against local Postgres 16, generated drug-discovery and crm backends `LOCO_ENV=test cargo test --test app` (292 each) + clippy clean, `biome lint` on touched files no worse than the root |
| enterprise-reporting-rust | `bun install --frozen-lockfile`, `precommit` (lint, typecheck, format:check), `bun test src` (record the 3 pre-existing validator failures unchanged), `cargo test` in `rust/`, `bun --bun vite build` |
| app-and-report-with-ai-rust | `bun run check` (models, types, lint, stacks, CLIs, pack) with `check:pack:ci` against Postgres. `docker compose` smoke (`start.sh` → `smoke.sh`) if the container's Docker daemon permits, otherwise reported as not run |
| businessappwithairust | `check-spec.mjs`, `website-e2e.mjs`, `check-model.mjs` + `audit-model.mjs` (22/22) on all six models plus the bare-model negative, validator source page checks, `build-site-bundles --check`, and a headless Chromium run of chapters 09, 10 (where the WebContainer is reachable) and 11 and the viewers via a local `http.server` |
| root | `type-check`, `test`, `test:generator`, `parity`, clippy (copies excluded from every root tool, §3.2) |

---

## 8. Phase 6: remove every trace of Mermaid

This starts only after §6 and §7 are green and recorded.

### 8.1 What is removed

- The verify harness (`yaml/verify/` and the new one), the 18f5792 reference, every `.mmd` fixture, and every equivalence test whose Mermaid side is a file. The evidence moves into the PR description and the architecture document's verification table, worded as "the previous model format".
- Stale scripts and CI: legacy `tests/scripts/*` and `scripts/tests/*`, `SAMPLE_MERMAID_ERD`, `eml-generate-and-publish.yml` (rewritten to take a `.eml.yaml` URL), `.gitignore`/`.env.example` entries, and the pnpm lockfile line.
- Prose: `docs/mermaid.md` is deleted, and every other document, `CLAUDE.md`, `README`, `SKILL.md`, html and llmtext file in the root, the four copies and `yaml/` is rewritten. Historical reports keep their findings but describe the old format neutrally.
- Within `yaml/`: dead parser code in its patched bundles (rebundled as in §5.5), its Mermaid prose, and its verify harness. The YAML models and the files you asked to keep are retained.

### 8.2 Upgrade paths, removed as you decided

- **`packages/web/src/lib/server/stored-models/`** (`legacy/`, convert, plan and apply), the `convert:stored-models` script and its tests, and the `project-git.yml` step that runs them.
- **`packages/core/src/services/model-format.ts`**, the `assertModelFormat` call in `runMigrations` and the `stored_model_conversions` type. A fresh modelling-tool schema creates no Mermaid-era columns; `database/migrations/001…` and `generator.sql` are updated.
- **Generated backends**, in the TS templates and Rust `backend.rs`, which must agree byte for byte:
  - `m0013_workflow_definition_source` keeps its name, so migration bookkeeping stays aligned, but becomes a no-op.
  - `m0017_workflow_definition_yaml` keeps only the YAML `definition` column and drops `automation_document()`.
  - `CLAUDE.md`'s "never edit m0000–m0017" note is amended to record this one deliberate exception and its consequence: a database created by an older release must be upgraded with that release first.
  - `yaml-source.test.ts`'s `SCHEMA_HISTORY` exemption is removed, so the "no Mermaid in any generated file" assertion now has no exceptions.

### 8.3 Regenerate `generated-applications/`

Run `scripts/generate-domain-applications.sh` for all 47 apps. Commit source only, never `target/`, `node_modules/` or binaries. Verify with `scripts/qa/qa-loop.sh` on a sample of 3 domains (build, smoke, `cargo test`). A full `--all` run is reported if time permits.

### 8.4 Final gate: zero Mermaid traces

Run case-insensitively over the whole tracked tree:

```
git grep -nIiE 'mermaid|\.mmd\b|erDiagram|stateDiagram|%%(meta|entity|field|enum|index|category|rbac|hook|rule|guard|trigger|report|workflow|step)\b'
git ls-files | grep -iE '\.(mmd|mermaid)$'
```

Both must return nothing, apart from **one exception that cannot be removed without a product change**: `mermaid` as a *transitive* entry in third-party lockfiles (`@copilotkit/react-core → streamdown → mermaid`). No code in any repository imports it. That gate is a script, `scripts/check-no-mermaid.sh`, and runs in `validate.yml`. Every copy's and the root's gates (§7) are re-run after the purge.

---

## 9. Phases and commits

All work happens on `ccr-bed99bf5-27bbbs` in `cedm-specification`, with one draft PR. Each phase is one or more commits and is pushed when its gates pass.

| Phase | Content | Exit criterion |
|---|---|---|
| 0 | Commit this document. Recover the four scripts and the CLI stack from `claude/cedm-yaml-repo-conversion-rwpznq`. Set up the toolchain (wasm32-wasip1 target, Postgres 16 cluster, CI's clippy version) | Document in repo; tooling verified |
| 1 | Raw copies of the four repositories, `COPIES.yaml`, root tooling isolation (§3.2) | Byte-identical to sources (`diff -r`); root gates still green |
| 2 | Convert `app-with-ai-rust/` (§5.1) | §7 row green; E1 (its models), E2, E3 |
| 3 | Convert `enterprise-reporting-rust/` (§5.2) | §7 row green; E1, E4 |
| 4 | Convert `app-and-report-with-ai-rust/` (§5.3, §5.5) | §7 row green; E1, E5 (orchestrator), E6 |
| 5 | Convert `businessappwithairust/` (§5.4, §5.5) | §7 row green; E1, E5 (website) |
| 6 | Purge (§8), regenerate `generated-applications/`, final gate | §8.4 returns nothing; every §7 gate re-run green |

Progress is reported at each phase boundary. If a gate cannot be met — for example Docker or the WebContainer being unavailable in the container — it is reported as **not run, with the reason**, never as passed.

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| The recovered branch scripts target the 18f5792-era root, not today's | Each is adapted and re-proved by E1–E5. Nothing is trusted from the branch's commit messages |
| The vendored bundles cannot be rebuilt from source | Patch plus rebundle (§5.5). E5 proves behaviour is unchanged before and after tree-shaking |
| Copies drift from the root platform | `app-with-ai-rust/` platform paths are equal to the root's at commit time. A `scripts/check-copy-sync.ts` (root) asserts it and runs in CI |
| Removing m0013/m0017 conversion strands old databases | Accepted by your decision. Documented in `CLAUDE.md`, the generated `README` and the release notes |
| Repository size (+~5,400 files) | Source only. Exclusions as §3.3 |
| Nested configs breaking root tools | §3.2 exclusions, checked in Phase 1 by running every root gate |

---

## 11. Critical files

- **Root:**
  - `Cargo.toml`, `biome.json`, `tsconfig*.json`, `vitest.config.ts`, `.gitignore`, `CLAUDE.md`
  - `packages/generator/templates/tanstack-astryx-loco/backend/migration/{src/m0013*,src/m0017*.rs.hbs,sql/m0013*,sql/m0017*}`
  - `packages/generator/src/generators/tanstack-astryx-loco/loco-backend.generator.ts`, `crates/appwithai-gen/src/backend.rs`
  - `packages/web/src/lib/server/stored-models/**`, `packages/core/src/services/{model-format,database.service}.ts`
  - `packages/generator/src/pipeline/__tests__/yaml-source.test.ts`
  - `scripts/generate-domain-applications.sh`, `.github/workflows/*`
- **Reused, unchanged:** `readModelYaml` / `parseModelYaml` (`packages/generator/src/model-yaml/`), `checkModelDocument` (`language/yaml/checker.ts`), `compileModelRecords`, `generateApplication` (`pipeline/generate-application.ts`), `buildReportingPack` (`reporting/pack.ts`), `ruleGraphToJdm` (`rules/jdm-converter.ts`), `language/browser/model-yaml.entry.ts`, `locateCedmRoot` (`model-cedm/library.ts`).
- **Recovered from the branch:** `scripts/patch-vendored-generators.ts`, `scripts/build-site-bundles.ts`, `scripts/convert-model-files.ts`, `language/browser/browser-generator.entry.ts`, `yaml/verify/*`.

## 12. End-to-end verification

1. Phase 1: `diff -r` of each copy against `git archive` of its source commit shows only the §3.3 exclusions.
2. The harness: `bun app-with-ai-rust/scripts/verify-yaml-conversion/verify.ts --mermaid <scratch originals> --json <scratch>/equivalence.json` returns every E-gate passing with named differences only.
3. Every command in §7, per copy and at the root, with output summarised in the PR.
4. The final grep (§8.4) returns nothing, and `scripts/check-no-mermaid.sh` passes in CI.
5. Drug-discovery generated from `app-with-ai-rust/examples/drug-discovery.eml.yaml` migrates, seeds and serves. Sign in as `admin@admin.com`, open three entity screens in headless Chromium, run the generated `cargo test --test app`.
