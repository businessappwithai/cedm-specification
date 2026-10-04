# QA Report — the Rust generator's emission layer

**Date:** 2026-08-08
**Branch:** `claude/gstack-drug-discovery-qa-lkhred`
**Model under test:** `examples/drug-discovery.eml.yaml` (17 entities, 16 relationships, 7 categories, 1 saga)
**Scope:** gstack `/qa` on both generators and on the app they produce. The change under test is the emission layer of `crates/appwithai-gen` — the BusEntity port, the backend context, the file-emission lists, and then the dictionary and saga seed generators — so the method was to generate the same model with both generators and diff.

**Result:** the Rust generator now emits a complete Loco backend that compiles and passes its own suite with no TypeScript involved. Two critical defects were found on the way, both of which produced plausible wrong output rather than an error.

| | Before | After |
|---|---|---|
| Backend files emitted by the Rust generator | 0 | **114** (64 rendered, 14 copied, 34 per-entity, 2 seeds) |
| Rust generator unit tests | 34 | **66** |
| TypeScript generator tests actually executed | 0 of 19 | **19 of 19** |
| Backend output matching the TypeScript generator | n/a | **byte-identical, all 114 files** |
| Generated backend `cargo check --all-targets` | n/a | **clean** |
| Generated backend request suite (`cargo test --test app`) | n/a | **246 / 246**, 225s |

---

## Method

Both generators ran against the same model, into two directories, with the same
flags:

```bash
bun run generate:tanstack -- -i examples/drug-discovery.eml.yaml \
  -o generated-projects/dd-ts -n drug-discovery --no-setup --force --skip-cli-scaffold

cargo run -p appwithai-gen -- generate -i examples/drug-discovery.eml.yaml \
  -o generated-projects/dd-rs -n drug-discovery --skip-cli-scaffold --force
```

Then `diff -r`, with the `Generated: <timestamp>` header line normalised —
it is the only field that is expected to differ between two runs, let alone two
generators.

Byte-equality against the TypeScript generator is the acceptance test, the same
way `info`'s output was for the parser modules. It is a stronger check than any
assertion I could have written: it covers all 114 files at once, including the
ones no test names.

---

## Defects found and fixed

### 1. Every business column vanished from the bus-table DDL — *critical*

`migration/src/m0002_bus_tables.rs` came out with tables containing only the
primary key and the four bookkeeping columns. `bus_compound` lost `smiles`,
`molecular_weight`, `inchi_key`, `formula`, `compound_class`,
`registration_status` and `registered_by_id` — every column the model declares.

The DDL template drives column emission through helpers the Rust registry did
not have:

```hbs
{{#unless (or (eq name ../primaryKey) (eq name 'created_at') …)}}
{{#switch (typeToReferenceId type)}}
  {{#case 10}}…{{/case}}
```

`or`, `switch`, `case`, `default` and `typeToReferenceId` were unregistered, and
`eq`/`ne` were written as output-writing helpers, which cannot be used as
subexpressions. None of that failed: `set_strict_mode(false)` renders an
unresolvable helper as nothing, so the generator reported success and wrote a
syntactically valid migration that creates the wrong schema.

The same gap had a second effect in the opposite direction. The index guard,
`{{#if (or (eq name 'name') unique)}}`, read truthy with `or` missing, so every
column got an index — including the ones that should not have one.

Confirmed fixed against a live database rather than against a string. Migrating
`drug_discovery_test` with the Rust-generated migration gives:

```
 id                  | uuid                   | not null | gen_random_uuid()
 smiles              | character varying(255) | not null |
 molecular_weight    | numeric(18,6)          |          |
 inchi_key           | character varying(255) |          |
 formula             | character varying(255) |          |
 compound_class      | character varying(255) |          |
 registration_status | character varying(255) | not null |
 registered_by_id    | uuid                   | not null |
Indexes:
    "bus_compound_smiles_key" UNIQUE CONSTRAINT, btree (smiles)
    "idx_bus_compound_smiles" btree (smiles)
```

Every declared column is present; `registered_by_id` is `uuid` rather than the
`string` the ERD declares, which is the FK branch inside `{{#case 10}}` doing its
job; and `molecular_weight` has no index, which is the `or` guard doing its job.

**Fixed** in `templates.rs`: `eq`, `ne`, `and`, `or`, `not` and
`typeToReferenceId` are now value-returning helpers (`handlebars_helper!`), and
`switch`/`case`/`default` are `HelperDef` implementations sharing a thread-local
frame stack, matching the TypeScript loader's first-match-wins semantics
including the non-fall-through.

### 2. A helper shadowed a context field, blanking every human label — *high*

`-- Compound (bus_compound)` rendered as `--  (bus_compound)`.

`registry()` registered a `displayName` helper. `displayName` is also a **field**
on every entity and attribute in the context, and in Handlebars a helper wins:
`{{displayName}}` called the zero-argument helper and got `""`. The TypeScript
loader registers no such helper, which is why the same template was correct
there.

**Fixed**: the helper is gone, with a comment saying why it must not come back.
`templates::tests::context_fields_are_not_shadowed_by_helpers` pins it.

### 3. The frontend lint gate warned on every `--no-setup` run — *medium*

`bun run generate:tanstack … --no-setup` ends with:

```
📋 Linting Astryx frontend...
⚠️  Frontend linting found issues
```

on every run, whatever the generated code says. With no `frontend/node_modules`,
the `biome` on PATH is the monorepo's 2.x, while the generated `biome.json`
targets the 1.9.4 that the generated `package.json` pins. Biome 2 rejects the
1.x `organizeImports` key and exits on a configuration error before linting
anything. `runLint` swallows output, so the message named neither the cause nor
a fix.

The type-check gate immediately below it already handles this exact case, and
the file already states the principle — "a gate you cannot read is not a gate".

**Fixed** in `full-stack.generator.ts`: the lint gate skips with a reason when
`node_modules` is absent, and when it does run it prints what Biome said.

```
📋 Linting Astryx frontend...
⏭️  Skipped — no node_modules (run `bun install` in frontend/)
```

### 4. `bun run test:generator` ran nothing and exited 1 — *medium*

The script CLAUDE.md documents as "Generator unit tests" reported
`No test files found, exiting with code 1`. There is a suite —
the ERD parser's test file, 19 tests over the ERD
parser — but `packages/generator/vitest.config.ts` included only
`test/**/*.{test,spec}.{js,ts}`, and the suite lives beside the code it covers.

It matters more than usual right now: that parser is the one `crates/appwithai-gen/src/model.rs`
is a port of, so it is the closest thing the repo has to a shared oracle for the
port, and it had never run.

**Fixed**: the config now includes `src/**` as well. All 19 pass.

---

## Verified, not a defect

**The generated `frontend/biome.json` is fine.** It pins schema 1.9.4 and uses
the 1.x `organizeImports` key, which looks stale next to the monorepo's Biome
2.5.6 — but the generated `package.json` pins `@biomejs/biome ^1.9.4`, so inside
the generated app the config matches its own linter. The failure in defect 3 is
in *how the gate runs it*, not in the file. Running `bunx biome lint` from the
monorepo against a generated frontend reproduces the error and proves nothing.

---

## Open items

### Closed: the seed generators are ported, and the backend now builds on its own

This was written up as the next port item, then done in the same pass. Three
more modules:

| Module | Ports |
|---|---|
| `dictionary.rs` | `dictionary-seed.ts` — `seed/dictionary.sql` |
| `dictionary_help.rs` | `dictionary-help.ts` — the composed window/tab/field help |
| `saga.rs` | `language/sagas.ts` + `workflows/saga.ts` — parsing, BPMN, `seed/workflows.sql` |

Both seed files come out **byte-identical** to the TypeScript generator's, which
takes the whole-backend equivalence from 112 files to all **114** — nothing now
excluded but the `Generated:` timestamp.

Why it mattered: both files are embedded at compile time,

```rust
const DICTIONARY_SQL: &str = include_str!("../../seed/dictionary.sql");
const WORKFLOWS_SQL:  &str = include_str!("../../seed/workflows.sql");
```

so their absence was not a missing feature but a crate that would not compile.

Three things worth knowing about the port:

- **The ids had to match exactly, not merely be stable.** They are UUIDv5 over
  `"<project>:<kind>:<parts>"` under a fixed namespace, and the dictionary seed
  is idempotent only because they are. Rust's `Uuid::new_v5` and the
  hand-rolled SHA-1 in `dictionary-seed.ts` agree, so a project regenerated by
  the other generator keeps its window ids — and any URL that names one.
- **saga `steps` property parsing has a terminal-key rule** (`fields`, `data`,
  `body`, `prompt` swallow the rest of the line) because their values are JSON
  and contain the `": "` a key/value scanner splits on. Getting that wrong
  truncates a `CreateEntity` step's payload to its first field, silently.
- **A saga's step order comes from the flowchart arrows, not the directive
  order.** `parse_edge_order` reproduces that, including stripping `-->|Yes|`
  edge labels before splitting so a label is never read as a node id.

Verified with no TypeScript involved anywhere:

```
cargo check --all-targets                      # clean
LOCO_ENV=test cargo test --test app            # 246 passed; 0 failed
```

And checked in the database rather than in the file, against a schema dropped
and recreated first so nothing could be left over from the TypeScript run:

| Query | Result |
|---|---|
| `sys_table` rows | 17 — one per entity |
| tables per `sys_category` | 2, 3, 2, 2, 2, 4, 2 across the model's 7 categories |
| `bus_*` tables with no category | **0** — the default-category fallback fired |
| `sys_window` rows with help | 17 |
| `sys_field` rows with help | 141 |
| `sys_workflow_definitions` | `CriticalDeviationEscalation` → `bus_deviation_report`, `is_model_managed`, 6,498 bytes of BPMN |

The saga row is the one to look at: its `entity_name` is the *physical table*,
not the `DeviationReport` the model writes. That resolution is what lets the
executor find the entity in the dictionary at run time, and it is done at
generation rather than at run time so the stored definition speaks the same
vocabulary as the dictionary it is looked up in.

That is the full generated request suite — CRUD and rules for all 17 entities,
plus auth, dictionary, permissions, workflow, saga execution and the audit hash
chain — running against a schema *and a dictionary* this generator wrote.

One environment note for whoever repeats this: `DATABASE_URL` over TCP needs a
password even for a superuser, because `pg_hba.conf` only grants peer auth on
the unix socket. A `psql` that works from the shell proves nothing about what
the suite will get; the first run failed 246/246 on
`password authentication failed`, which looks exactly like a codegen
catastrophe and is not one.

### The generated frontend does not lint clean — 149 errors

Now that the gate in defect 3 reports honestly, it has something to report. With
`frontend/node_modules` installed, `bun run lint` in the generated frontend
finds 149 errors:

| Rule | Count | Rule | Count |
|---|---|---|---|
| `style/useTemplate` | 23 | `complexity/noForEach` | 10 |
| `suspicious/noArrayIndexKey` | 18 | `style/noUnusedTemplateLiteral` | 9 |
| `complexity/useLiteralKeys` | 16 | `correctness/useExhaustiveDependencies` | 9 |
| `style/noNonNullAssertion` | 13 | others (incl. `a11y/useButtonType`) | 51 |

All of them are style and quality rules in the frontend templates, not
correctness bugs, and none are caused by anything in this change — the frontend
generator is untouched here. Fixing them means editing dozens of `.hbs` files
and belongs in its own pass. Two are worth pulling forward when that happens:
`useExhaustiveDependencies` (9) and `noArrayIndexKey` (18) are the two on this
list that can produce real React bugs rather than untidy code.

Note also that the generated `lint` script is `biome lint --write src`, so
running the gate rewrites generated files in place. It fixed 4 files on this
run.

### A thick-arrow-only saga silently gets no step order

Found while porting `parse_edge_order`, and reproduced in both implementations.
A line is admitted to edge parsing by a `--` test:

```ts
if (trimmed.startsWith("%%") || !trimmed.includes("--")) continue;
const parts = cleaned.split(/-{2,}>|-{2,}|={2,}>/);
```

The splitter knows `==>`, but the guard above it does not: a line whose only
arrow is `==>` never reaches the split. So a flowchart drawn entirely with thick
arrows yields an empty order, and the saga's steps fall back to the order the
saga `steps` directives happen to be written in — which is exactly the thing binding
steps to node ids is meant to stop being load-bearing.

No diagnostic fires, because an empty order is indistinguishable from a saga
whose steps are all unplaced. Nothing in `examples/` or `language/examples/` uses
`==>`, so nothing is broken today.

Ported faithfully rather than fixed: correcting it here would make the two
generators disagree while the port is still being verified by byte-diff. The fix
belongs in `language/sagas.ts` first — either widen the guard to
`includes("--") || includes("==")`, or drop the guard and let the split decide —
and both generators pick it up together. Pinned meanwhile by
`saga::tests::arrows_of_every_length_split_the_same_way`, which asserts the
current behaviour and says why.

### Smaller things, left alone deliberately

- **`src/initializers/` is created and never written.** Both generators list it
  in their directory set and no template targets it. Harmless — `src/lib.rs`
  does not declare the module — but it is an empty directory in every generated
  project.
- **"40 request suites" undercounts by one.** `entities × 2 + 6`, where there
  are seven fixed suites. Ported as-is: making the Rust generator print a
  different number than the TypeScript one would read as a divergence during the
  port.
- **The Rust parser sets `isPrimaryKey`; the TypeScript parser never does.** No
  template reads it, and `skip_serializing_if` keeps it out of the JSON when
  false, so the rendered output is identical.
- **Frontend flags are accepted and inert** on the Rust CLI (`--theme`,
  `--dark-mode`, `--skip-frontend`, `--api-url`). The CLI now says so.
- **Three pre-existing `bun run type-check` errors** (`language/sagas.ts`,
  `cli/generate.ts`, `tanstack-start-frontend.generator.ts`). Present on `HEAD`
  with these changes stashed; untouched here.

---

## What this run says about the test surface

Both critical defects produced *plausible* output rather than an error, and
neither would have been caught by a test that only asserts generation succeeds.
`set_strict_mode(false)` is load-bearing — the templates test optional fields
with `{{#if maxLength}}` and most attributes have none — so a typo, a missing
helper and a shadowed field all render as silence.

Two guards now exist for that class:

- `backend::tests::bus_table_ddl_carries_every_column` pins the output of the
  template that leans hardest on helpers, including the negative case (a
  non-unique column must *not* be indexed);
- the TS/Rust byte-diff, which is what actually found both defects and is worth
  re-running after every emission change until the port is finished.
