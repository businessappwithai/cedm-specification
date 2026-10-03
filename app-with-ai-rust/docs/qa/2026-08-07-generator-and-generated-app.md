# QA Report — AppWithAI generator + generated app

**Date:** 2026-08-07
**Branch:** `claude/gstack-qa-workflow-testing-cgvcr7`
**Model under test:** `examples/drug-discovery.eml.mmd` (17 entities, 7 categories, 3 rules, 2 state machines, 3 hook workflows, 1 saga)
**Scope:** gstack `/qa` on the generator CLI, then on the app it generates, with multi-step workflows and business rules tested in depth via API and browser.

| | Before | After |
|---|---|---|
| Health score | **48 / 100** | **88 / 100** |
| Multi-step workflow scenarios | 244 / 266 | **260 / 266** |
| Rule checks | 15 / 22 | **19 / 22** |
| Workflow Designer (browser) | 0 / 22 usable | **21 / 22** |
| Generated Rust suite | 246 / 246 | 246 / 246 |

The generated app's own Rust suite was green at 246/246 the whole way through — every defect below sat outside what it covers. That is the main lesson of this run: the suite exercises the executor's happy path and the CRUD surface, and nothing exercised the designer, the model's rules, or how a computed value reads once it reaches a person.

---

## Test surfaces built

Three harnesses, committed under `scripts/qa/`:

| Script | What it covers |
|---|---|
| `workflow-matrix.ts` | **266 multi-step workflow scenarios** — every step node type, all four Formula operations, the three context scopes, `as`/`targetSource` hand-off, placeholder interpolation, partial-failure semantics, chains 2–22 steps long |
| `rules-matrix.ts` | 22 rule checks — JDM validation, stored evaluation, dry runs, enforcement on a real business write, and whether the model's own rules ever arrive |
| `workflow-ui.ts` | 22 browser checks — every step type added from the palette, configured, saved, round-tripped, re-opened, executed |
| `saga-view-check.ts` | Focused check: can a model-declared saga be opened in the designer at all |

### Multi-step workflow coverage (266 scenarios)

| Family | Scenarios | Family | Scenarios |
|---|---|---|---|
| Formula/binary | 40 | Composite (all types) | 14 |
| Formula/chain3 | 16 | CreateEntity/basic | 12 |
| Formula/chain5 | 16 | DeleteEntity | 10 |
| Formula/scope-entityData | 16 | REST | 9 |
| Interpolation/number-format | 16 | Unknown-nodes | 7 |
| Formula/edge | 17 | CreateEntity/interpolation | 7 |
| Formula/long (6–12 steps) | 7 | Partial-failure | 6 |
| Formula/accumulate | 6 | Scope-precedence | 6 |
| Agent | 6 | Composite/cross-entity | 6 |
| UpdateEntity (5 families) | 17 | others | 12 |

Step counts run from 2 to 22 per workflow.

---

## Defects found and fixed

### 1. Every computed whole number rendered as `42.0` — HIGH
**Fixed** — `templates/.../services/workflow.rs.hbs`

`Formula` stored results as f64, so a whole number serialised as `42.0`. Invisible while a value only feeds more arithmetic; wrong the moment it reaches a person.

- A step titling a record `CAPA-{{seq}}` produced `CAPA-42.0`
- A computed day count written to a text column stored `30.0`

Whole results are now narrowed to i64 when stored, and `resolve_string` formats a whole float without the fractional part for values arriving from elsewhere. **13 of the 22 original failures were this one bug.**

### 2. Workflows authored in the UI could never run — CRITICAL
**Fixed** — `templates/.../workflow-definitions/{new,$id.edit}.tsx`

The entity dropdown used each table's *display name* as the option value, so a workflow was stored against `"Deviation Report"` while the executor resolves `entityName` through the dictionary and needs `bus_deviation_report`. The save succeeded; every execution then failed:

```
entityName='Deviation Report'   -> 404 {"message":"Unknown entity 'Deviation Report'"}
entityName='bus_deviation_report' -> 200 {"status":"completed","tasksExecuted":1}
```

### 3. No workflow could be edited — CRITICAL
**Fixed** — `templates/.../controllers/workflow.rs.hbs`

The edit screen has always called `PUT /api/workflow-definitions/{id}`. No such route existed:

```
PUT   -> HTTP 405
PATCH -> HTTP 405
```

"Save Changes" silently lost every edit. An `update` handler is added on both prefixes and both verbs; it refuses a model-managed definition (400, same reasoning `remove` used) and parses supplied BPMN before storing it.

### 4. A model-declared saga could not be opened in the designer — HIGH
**Fixed** — `src/workflows/saga.ts`

`buildSagaBpmn` emitted no `bpmndi` layout, on the stated grounds that "bpmn-js lays out a diagram that has none". It does not — it rejects the import with `no diagram to display`. Measured before the fix:

```
step labels visible: 0/4      bpmn-js rendered elements: 0
console: BPMN import error Error: no diagram to display
```

After: 11 elements rendered, all four steps shown as readable cards (`.gstack/qa-reports/screenshots/saga-model-managed-edit.png`).

### 5. REST ignored its EML-declared `body` and discarded `as` — MEDIUM
**Fixed** — `templates/.../services/workflow.rs.hbs`

The executor read `bodyTemplate`; the language declares the property as `body`. A REST step authored in EML silently sent the default payload instead of the one it spelled out — the same mismatch `fields`/`data` already had on `CreateEntity`. Both spellings are honoured now. REST also declared `as` and then threw the response away; it is now bound, parsed as JSON when it is JSON.

### 6. `Agent` steps are a silent no-op — MEDIUM (warned, not implemented)
**Warned** — `src/generators/tanstack-astryx-loco/loco-backend.generator.ts`

EML declares six step types; the Loco executor dispatches five. An `Agent` step passes `eml validate` ("no problems"), is offered in the designer palette, and does nothing at run time — the executor skips unknown nodes with only a log line. Generation now warns, naming the saga and node:

```
⚠️  saga AgentProbe.AG1: "Agent" steps are declared by EML but the Loco
    backend has no executor for them — this step will be skipped at run time.
```

The 6 remaining matrix failures are this gap, kept as a standing record rather than deleted. **Implementing `Agent` is a feature decision, not a QA fix — see Open items.**

### 7. Frontend type-check reported 79 phantom errors — MEDIUM
**Fixed** — `src/generators/full-stack.generator.ts`

Every generation ended with `⚠️ Frontend type-check found 79 error(s)`. All 79 were artefacts of `src/routeTree.gen.ts` not existing yet — it is written by the TanStack Router plugin on the first dev/build run. With it present, `tsc --noEmit` exits 0. The gate now skips with the reason, the way the missing-`node_modules` case already did.

---

## Confirmed working

- **Generator CLI** — `eml validate` / `info` / `sagas` all correct on the model; full generation in ~2m52s; `loco new` scaffold + template overlay + dictionary seed; migrations and seed apply cleanly (17 tables, admin user, saga installed).
- **Workflow executor** — all four Formula operations including the documented divide-by-zero→0; context precedence (`decision` → `vars` → `entityData`) correct in all 12 precedence scenarios; `as`/`targetSource` hand-off across entities; `as` rebinding; placeholder interpolation from every scope; unknown node types skipped not fatal; malformed BPMN refused at write time; chains to 22 steps.
- **Partial failure** — a failing step aborts the run, downstream steps do not execute, and the run is recorded `failed`. There is **no compensation**: writes made before the failure stay committed (documented, see Open items).
- **Rules engine** — 19/22. JDM validation rejects all four malformed shapes without a 500; a `prevent` rule refuses a matching write and lets a non-matching one through; stored evaluation and dry runs behave.
- **Workflow Designer** — 21/22 after fixes. All five palette types add, configure, save, round-trip, re-open and execute. Model-managed workflows are correctly read-only (Save disabled client-side *and* refused server-side).

---

## Open items — not fixed, needs a decision

### A. The model's business rules are never generated into the app — HIGH
`drug-discovery.eml.mmd` declares three rules. `eml info` lists all three. `sys_rule_definitions` in the generated app is **empty**, and the generator has no rule parsing or seeding at all — `seed/` contains only `dictionary.sql` and `workflows.sql`.

```
model rule "experimentSubmitGate" — not seeded
model rule "deviationSeverity"    — not seeded
model rule "bookingConflict"      — not seeded
```

The engine is fine: `rules-matrix.ts` re-encodes all three as JDM by hand and the app enforces them correctly. What is missing is the compiler — a `%%rule` flowchart → JDM path, and a `seed/rules.sql` to install it, mirroring what `saga.ts` already does for `%%step`.

This is a feature of comparable size to the saga compiler, so I have not built it inside a QA pass. It is the single largest gap between what the model says and what the app does.

### B. `Agent` steps
Either implement the node in `services/workflow.rs.hbs` or remove it from `language/appwithai-language.json`. The generation-time warning stops it failing silently; it does not close the gap.

### C. Saga compensation
A saga has no rollback. `J1` scenarios confirm a `CreateEntity` that succeeds before a later step fails leaves its row behind. Reasonable for a saga pattern, but currently undocumented — worth a line in the EML workflow spec, or compensating steps.

### D. Cosmetic
`GET /api/auth/me` 401s once on the login page before a token exists. Console noise only; the app works.

---

## Reproducing

```bash
# generate + bring up
bun run generate:tanstack -- -i examples/drug-discovery.eml.mmd \
  -o generated-projects/drug-discovery -n drug-discovery --force
cd generated-projects/drug-discovery/backend
cargo loco db migrate && cargo loco db seed && cargo loco start --server-and-worker
cd ../frontend && bun run dev

# the three harnesses
bun scripts/qa/workflow-matrix.ts          # 266 multi-step scenarios
bun scripts/qa/rules-matrix.ts             # 22 rule checks
bun scripts/qa/workflow-ui.ts              # 22 browser checks
```

`workflow-matrix.ts` takes `--only <family>` to iterate on one group, and `--json <file>` to write machine-readable results.

---

## Top 3 to fix next

1. **Compile `%%rule` sections into JDM and seed them** (Open item A) — the model declares business rules that the generated app does not have.
2. **Decide `Agent`'s fate** (Open item B) — implement it or drop it from the language.
3. **Document saga non-compensation** (Open item C) — the behaviour is defensible, the silence about it is not.
