# Plan: CEDM becomes the base of the model language

**Branch**: `claude/cedm-spec-language-migration-ejg2yj` · **Status**: approved and implemented; see "As built" at the end
**Constraint, above everything else**: at every commit on this branch, `generate`
over every model that works today still produces a complete, compiling, passing
application — byte-identical to today's unless a phase says otherwise and says why.

---

## 1. What exists today

### 1.1 The CEDM specification (`domain/`, `domains/`, `specification/`, `schema/`)

- **310 entity files** (`domain/entities/*.yaml`, ~28k lines), registered in
  `domain/entities/index.yaml`, validated by `tools/validate.py` (0 errors, 15 warnings).
- Entity shape (`schema/cedm-entity.schema.yaml`): `name`, `namespace`, `kind`,
  `description`, `identity {key, type, generated, immutable}`, `attributes[]`
  (camelCase names; types `uuid string enum datetime decimal date reference
  integer object money boolean locale country_code currency_code timezone`;
  `required`, `unique`, `maxLength`, `precision/scale`, `default`, inline enum
  `values`, `target` for `reference`), `relationships[]` (`name`, `target`,
  `cardinality ∈ {0..1, 1, 0..*, 1..*}`, `ownership ∈ {aggregate, reference}`),
  `invariants[] {id, rule}` (prose), `lifecycle {states, transitions[from,to]}`
  (only 4 entities), `extends` (7), and rich structured **help** on entity,
  attribute and relationship.
- Cross-cutting semantics in `specification/*.yaml`: vocabulary, lifecycle,
  business-rules, authorization (action/resource/subject/effect, default deny),
  reporting (dimensions/measures, read-only), aggregate boundaries, integration,
  help semantics, generation contract (SQL/OpenAPI/UI/workflow mappings),
  conformance, validation.
- `domains/` — the domain catalog and metamodel: a domain has capabilities,
  entities, **processes** (steps, triggers, actors), rules, reports, **ui**, ai.

CEDM is a *domain library*: implementation-neutral, no application concepts such
as dashboard categories, icons, hooks, JDM decision graphs, sagas or SQL reports.

### 1.2 The model language and generator

- `language/yaml/eml.schema.json` (+ `language/appwithai-language.json`) defines
  the `*.eml.yaml` model: `enums`, `categories`, `entities` (snake_case
  attributes, `pk`/`fk`/`unique`/`optional`, `enum:` binding, help, icon,
  `parent:`, indexes), top-level `relationships` (crow's-foot ends), `hooks`,
  `rbac`, `triggers`, `reports` (SQL), `rules` (flowchart → JDM),
  `stateMachines`, `sagas`.
- Read into **model records** (`packages/generator/src/model/records.ts`, Rust
  `crates/appwithai-gen/src/records.rs` + `yaml_model.rs`) and compiled once by
  `compileModelRecords` → `ParsedModel` → `generateApplication`.
- Gates: corpus equivalence, `yaml-source` (475-file app compare),
  `examples-in-sync`, `bun run parity` (TS vs Rust, byte-identical backend),
  `test:generator`, web `test`, `type-check(:language)`, clippy, the 303-test
  e2e suite, and the generated app's own `cargo test --test app` (292 tests).

### 1.3 The gap, construct by construct

| Concept | CEDM | Model language today | Gap |
|---|---|---|---|
| Entity | `entity:` file, `kind`, `namespace`, `extends` | `entities[]` item | kind/namespace/extends absent |
| Identity | `identity {key: salesOrderId, type: uuid}` | `pk: true` on an attribute (usually `id`) | naming + type |
| Attribute names | camelCase | snake_case (= column) | needs a physical-name rule |
| Types | CEDM vocabulary incl. `money`, `reference`, `enum`, `country_code`… | `string decimal int date …` + `fk` modifier | vocabulary mapping |
| Enums | inline `values` on the attribute | named `enums[]` + `enum:` binding | lowering to named enums |
| References | `relationships[]` one end per entity, or `type: reference, target:` | top-level `relationships[]` with both ends + `<x>_id fk` column | pairing + FK synthesis |
| Reference target | **explicit** (`deliveryLocation → Location`) | **derived from column name, never stored** | ⚠ the hardest gap — §3.2 |
| Ownership | `ownership: aggregate` + `aggregate-boundaries.yaml` | `parent:` (line items) | direct mapping |
| Lifecycle | `lifecycle {states, transitions}` | `stateMachines[]` | direct mapping (+ `action` → trigger) |
| Invariants | prose `{id, rule}` | `rules[]` (executable JDM flowcharts) | prose is not executable — §3.5 |
| Authorization | permission `{action, resource, subject, effect}` | `rbac[] {entity, action, roles}` | direct mapping for allow; deny needs care |
| Reports | dimensions / measures | `reports[]` SQL | lowering measures → SELECT |
| Processes | `processes[] {steps, triggers}` | `sagas[]` | mapping of step vocabulary |
| Help | structured (summary, businessMeaning, usage, …) | one string per entity/field | richer than today — compose |
| UI | `ui` in domain metamodel | `categories`, `icon`, `label` | needs a CEDM profile section |
| Hooks | none | `hooks[]` | needs a CEDM profile section |

## 2. Target design

### 2.1 Principle: one semantic layer, a new front door

The generator already compiles only **model records**. The migration therefore
does **not** rewrite compilers or templates; it adds a **CEDM reader** that lowers
a CEDM model into the same records. Today's `.eml.yaml` stays a readable format
(and the converter target/source) until the final phase, so every existing gate
keeps proving that nothing downstream changed.

```
 CEDM application model (*.cedm.yaml)          today's model (*.eml.yaml)
   + imported domain/entities/*.yaml                    │
              │                                         │
   readCedmModel: YAML → cedm schema (ajv)   readModelYaml (unchanged)
     → resolve imports/extends/overrides               │
     → lower (naming, enums, refs, lifecycle…)         │
              └──────────────► ModelRecords ◄──────────┘
                                   │  compileModelRecords (unchanged)
                                   ▼
                              ParsedModel → generateApplication → templates
```

### 2.2 The CEDM application model (the new language)

A model is a **CEDM-conformant document**: entities are written exactly in the
CEDM entity schema, so a file from `domain/entities/` is valid inside a model
verbatim. Application concerns CEDM does not cover live in an **application
profile** that becomes part of the CEDM specification
(`specification/application-profile.yaml`), not a private dialect.

```yaml
cedm: "1.0"                         # language version
application:
  name: Order to Cash
  version: 1.0.0
  namespace: acme.o2c

imports:                            # reuse library entities, unchanged
  - entity: SalesOrder              # → domain/entities/sales-order.yaml
  - entity: SalesOrderLine
  - entity: Customer
    include: [customerId, customerNumber, name, status]   # optional narrowing

entities:                           # local entities, CEDM entity schema
  - name: Compound
    kind: core_master_entity
    identity: {key: compoundId, type: uuid, generated: true, immutable: true}
    attributes:
      - {name: smiles, type: string, required: true, unique: true}
      - {name: registrationStatus, type: enum, required: true,
         values: [draft, pending_review, approved, rejected, withdrawn]}
    relationships:
      - {name: registeredBy, target: User, cardinality: '1', ownership: reference}
      - {name: aliases, target: CompoundAlias, cardinality: '0..*', ownership: aggregate}
    lifecycle: {attribute: registrationStatus, states: [...], transitions: [{from, to, action}]}
    invariants: [{id: CMP-001, rule: ..., enforcement: validation, expression: ...}]
    help: {summary: ..., businessMeaning: ..., usage: ..., relationshipContext: ...}
    ui: {icon: flask-conical, label: ...}          # application profile

# application profile (new CEDM spec section) — same content as today, CEDM-named
ui:        {categories: [...]}                     # ← categories
authorization: {roles: [...], permissions: [{action, resource, subject, effect}]}  # ← rbac
rules:     [...]          # executable decision graphs (← rules), may cite invariant ids
processes: [...]          # ← sagas (steps, trigger, operation)
reports:   [...]          # dimension/measure form, or `query:` SQL (← reports)
hooks:     [...]          # ← hooks
triggers:  [...]
```

Exact key names are fixed in Phase 1 and recorded in the schema; the snippet
shows the shape, not the final spelling.

### 2.3 Lowering rules (CEDM → records)

| CEDM | Record produced | Rule |
|---|---|---|
| attribute `name` | column | `snake(name)` via the existing naming rule (acronym guard); explicit `column:` override where snake-casing would not round-trip |
| `identity.key` | the `pk` column | physical name stays what the generator expects today (§3.3) |
| `type` | type token | vocabulary map in `appwithai-language.json`: `uuid→uuid`, `money→decimal(20,4)` + currency semantics, `currency_code/country_code/locale/timezone→string(n)` with validation, `object→json`, `datetime→timestamp`, `enum→string + named enum` |
| inline enum `values` | `EnumDeclaration` named `<Entity><Attribute>` + `FieldEnumBinding` | values kept as written |
| relationship `1`/`0..1` | FK column `<snake(name)>_id` + relationship record | `required` from cardinality; target explicit (§3.2) |
| relationship `0..*`/`1..*` | the inverse end of a pair | paired with the FK on the target; no column |
| `type: reference, target:` attribute | FK column | same as above |
| `ownership: aggregate` on a collection | `parent:` on the child | AGG rules → line-item tabs, as today |
| `lifecycle` | `StateMachineDeclaration` | `action` → transition trigger; status attribute from `lifecycle.attribute` or the enum named `status` |
| `invariants` with `expression` | rule records | prose-only invariants → help text (§3.5) |
| `help` (structured) | entity/field help strings | composed with the order in `help-semantics.yaml` |
| `authorization.permissions` | `RbacDeclaration` | `allow` only in v1; `deny` reported (§3.6) |
| `processes` | `SagaDeclaration` | step vocabulary mapped 1:1 |
| `reports` dimension/measure | `ReportDeclaration` SQL | generated SELECT; still passes the three read-only guards |
| `extends` | merged attribute/relationship set | resolved before lowering; cycles refused |

## 3. Hard problems and how each is handled

### 3.1 Byte-identical output for today's models
The equivalence proof is: **convert every corpus `.eml.yaml` to CEDM form, read
it back, and require identical `ModelRecords`** (therefore identical
`ParsedModel` and identical generated apps). Wherever CEDM's canonical form would
change a physical name (e.g. `molecular_weight` ↔ `molecularWeight` is fine;
`capa_id`, digits, acronyms may not be), the converter writes an explicit
`column:`. This keeps every existing gate meaningful.

### 3.2 Reference targets must become explicit (generator change)
CEDM names targets explicitly (`deliveryLocation → Location`,
`registeredBy → User`). The generator derives a lookup's table from the column
name, and that rule is mirrored in **seven** places. `delivery_location_id`
would derive `bus_delivery_location` — a table that does not exist.

Proposal: add **m0018** — nullable `sys_column.ref_table_name`, written by the
dictionary seed only when the model's target differs from the derived one.
`resolve_ref_table_name` and its mirrors check the stored target first and fall
back to derivation. Consequences:
- for every existing model the column is NULL everywhere → derivation unchanged
  → apps byte-identical apart from the new migration files (stated, tested);
- the seven mirrors (backend `dictionary.rs`, generated `tests/support/entities.rs`,
  bun `harness/entities.ts`, `business-data.ts`, `checker.ts`,
  `isForeignKeyColumnName` TS/Rust) each gain "explicit target wins";
- `rbac.rs`-style dedicated request test: a model whose FK name ≠ target resolves,
  labels and seeds correctly.
This is the single largest generator change in the plan and it is additive.

### 3.3 Primary keys
CEDM keys are `<entity>Id: uuid`. Generated `bus_*` tables, the generic
controller and audit chain all assume today's key column. v1 lowers
`identity.key` to the existing physical key name (`column:` keeps the CEDM name
in the model and documentation); renaming physical keys is out of scope.

### 3.4 Library entities are large and cross-referencing
Importing `SalesOrder` pulls references to `Customer`, `Organization`,
`Location`, `Shipment`, `Invoice`. Rule: an import closes over **required**
(`1`/`1..*`) references transitively; optional references to entities not in the
model are dropped and reported (not silently), mirroring "nothing is lost
silently". `include:`/`exclude:` narrow attributes; overrides add `ui`/help.

### 3.5 Invariants are prose
273 entities carry prose invariants; nothing can execute prose. v1: an invariant
with an optional `expression` (in the vocabulary's `ruleOperators`) compiles to a
validation rule; a prose-only one becomes field/entity help and is listed in
the generation report. The existing executable `rules` (decision graphs) remain
available, and may reference invariant ids.

### 3.6 Authorization: deny and scope
CEDM's policy model has `effect: deny`, `scope` and `defaultEffect: deny`; the
generated app's three gates are additive allow-lists with "no rows = open".
v1 maps `allow` permissions to `%%rbac`-equivalent records and refuses
`deny`/`scope` with a diagnostic rather than generating something weaker than
declared. Default-deny is a later, opt-in generator change.

### 3.7 Two generators
Both the TS and Rust generators read models. The CEDM reader is implemented in
TS first, then ported to Rust (`cedm_model.rs`), and `bun run parity` is
extended so every parity model runs as **TS(cedm) = Rust(cedm) = TS(eml.yaml)**.

## 4. Phases

Each phase ends with all gates in §5 green and is one or more pushed commits.

**Phase 0 — Baseline** (no behaviour change)
- Install, build, run every gate on the branch head; record numbers in
  `docs/qa/` as the reference the rest of the work is compared against.
- Snapshot the generated drug-discovery, crm and dance-studio apps (hashes).

**Phase 1 — The language definition** (docs/schema only; additive)
- `specification/application-profile.yaml`: ui/categories, hooks, processes,
  executable rules, report queries, triggers — as CEDM spec sections.
- `language/cedm/cedm-model.schema.json` (ajv 2020): application header,
  imports, entities (= CEDM entity schema, made machine-checkable), profile.
- `language/appwithai-language.json`: CEDM vocabulary types, `0..1/1/0..*/1..*`
  cardinalities, ownership, entity kinds, lifecycle — alongside today's tokens.
- `language/cedm/README.md` reference, `language/spec/` updates.
- Gate: schema validates every `domain/entities/*.yaml` file; `tools/validate.py` still passes.

**Phase 2 — TypeScript reader and converter** (additive)
- `packages/generator/src/model-cedm/`: read → resolve imports/extends → lower → records.
- Converter both ways: `eml.yaml → cedm.yaml` (with `column:` where needed) and
  `cedm.yaml → eml.yaml` (for the viewers).
- CLI: `appwithai generate|validate|info|view` accept `*.cedm.yaml`;
  `appwithai convert --to cedm`.
- Checked-in `examples/drug-discovery.cedm.yaml` and CEDM forms of every corpus model.
- Gates: new `cedm-corpus-equivalence.test.ts` (records identical for every
  corpus model) and `cedm-source.test.ts` (generated drug-discovery from CEDM =
  from eml.yaml, all files).

**Phase 3 — Generator support for real CEDM models** (the only behavioural change)
- m0018 explicit reference target + the seven mirrors (§3.2).
- Vocabulary types: `money`, `currency_code`, `country_code`, `locale`,
  `timezone`, `object` through DDL, `row_json.rs`, UI field kinds.
- Structured help composition into `sys_*` help.
- Lifecycle `action` names → transitions; invariant expressions → validation rules.
- Gate: existing apps differ **only** by the added migration files (asserted);
  generated backend `cargo test` + clippy pass for all corpus models.

**Phase 4 — Rust generator reads CEDM**
- `crates/appwithai-gen/src/cedm_model.rs`; `--input *.cedm.yaml`.
- Parity extended to CEDM inputs; clippy on CI's toolchain; wasm build.

**Phase 5 — Tools**
- `eml` CLI, browser bundle (`html/model-yaml.js`), and the web modelling tool
  read/write CEDM: the designer still draws Mermaid as a derived view; saves
  commit `model/model.cedm.yaml`; `convert:stored-models` gains the step.

**Phase 6 — A real CEDM domain application**
- `examples/order-to-cash.cedm.yaml` importing library entities (Customer,
  Product, SalesOrder, SalesOrderLine, Invoice, Payment, …) with UI/authorization/
  process profile.
- Generate, `cargo test --test app`, clippy, bun suites, a Playwright pass.
- Add it to `PARITY_MODELS` and the e2e corpus.

**Phase 7 — CEDM is the default**
- Corpus and examples switch to `*.cedm.yaml` as the checked-in source;
  `.eml.yaml` becomes an import/convert format (kept readable, as EML was).
- Update `CLAUDE.md`, `README.md`, `CEDM_YAML_Architecture_Design.md`,
  `language/README.md`, the generator docs.

## 5. Non-regression gates (run at the end of every phase)

| Gate | Command |
|---|---|
| Type checks | `bun run type-check`, `bun run type-check:language` |
| Generator unit + equivalence | `bun run test:generator` |
| Web unit | `bun run test` |
| TS ↔ Rust backend | `bun run parity` |
| Rust lint | `cargo +<CI version> clippy -p appwithai-gen --all-targets -- -D warnings` |
| Lint (own files only) | `biome lint <touched files>` vs `main` |
| CEDM library | `python3 tools/validate.py` |
| Generated app runs | drug-discovery + crm: `cargo test --test app`, clippy `-D warnings` (needs Postgres) |
| End-to-end | `bun run test:e2e:generated` (needs Postgres) at Phases 3, 6, 7 |

If Postgres or the Rust toolchain is not available in the session, the gates
that need them are reported as not run, never as passed.

## 6. Risks

| Risk | Mitigation |
|---|---|
| Lowering silently changes an existing app | Records-level equivalence over every corpus model, plus full-app file compare |
| Explicit ref target diverges from one of the seven mirrors | Stored target is consulted first everywhere; a dedicated request test with FK name ≠ target |
| Library imports drag in half the 310-entity graph | Close only over required references; report every dropped one |
| CEDM help/invariant text is long | Composed help is length-bounded per `sys_*` column; full text kept in the shipped model |
| Rust lags TS | Parity runs on CEDM inputs from Phase 4; until then the Rust CLI reads the `.eml.yaml` the converter emits |
| Scope | Phases are independently shippable; stopping after any phase leaves a working generator |

## 7. Decisions needed before starting

1. **Model shape** — self-contained CEDM documents with optional library
   `imports` (recommended), or models that may *only* import library entities?
2. **Today's `*.eml.yaml`** — keep as a readable import/convert format
   (recommended), or remove at Phase 7?
3. **Physical names** — camelCase in the model, snake_case columns in the
   database (recommended, keeps the generated app's conventions), or columns
   named exactly as CEDM attributes?
4. **Explicit reference targets (m0018)** — approve the additive generator
   change in §3.2? Without it only models whose FK names match their targets can
   be generated, which excludes most of the CEDM library.
5. **Scope of this branch** — all phases, or stop after Phase 2/3 for review?

---

## As built

Approved with the recommendations in section 7, plus two additions: each domain
is its own application with the common CEDM specification bundled in all of
them, and the Rust/WASM port is wholly Rust.

| Phase | Delivered |
|---|---|
| 0 | `docs/qa/2026-10-01-cedm-migration-baseline.md` |
| 1 | `language/cedm/` (schema, types, README), `specification/application-profile.yaml`, vocabulary in `appwithai-language.json` |
| 2 | `lower.ts`, `raise.ts`, `imports.ts`, the reader, `appwithai validate/info/generate/convert` on `*.cedm.yaml`, corpus equivalence over every repository model |
| 3 | m0018 `sys_column.ref_table_name` and every resolver; checker EML118 |
| 4 | `crates/appwithai-gen/src/cedm.rs`, native and `wasm32-wasip1`; `scripts/cedm-lowering-parity.ts` in `bun run parity` |
| 5 | `eml` CLI and browser bundle read CEDM (Chromium held to Node's reading). **The web tool still saves the model document**; its generation path is unchanged and bundles `cedm/` |
| 6 | `domains/application-catalog.yaml` → 47 `applications/*.cedm.yaml` + the common module → `generated-applications/` |
| 7 | README, CLAUDE.md, this document |

Deviations from the plan, and why:

- **Pairing.** Two to-one relationships that name each other are one
  one-to-one (found by seeding the `sales` application: a required-FK cycle).
- **Library defects fixed.** 721 split-text lines, an unparseable catalog.
- **`systemManaged` audit fields** are left to the application unless the model
  says `systemManaged: false` (every generated table carries them already).
- **Web tool.** Making CEDM the stored form of a project touches the
  Postgres-backed consistency suite; it was left as a separate step rather than
  risked here.
- **Still open:** `.eml.yaml` is kept as the compiled form and a convert target
  (decision 2); a full run of the generated applications' own suites has been
  done for the explicit-reference model and the screenshot set, not for all 47.
