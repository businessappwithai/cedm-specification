# QA pass — the generator and the generated app, over `crm.eml.yaml`

**Date**: 2026-09-12
**Model**: `language/yaml/examples/crm.eml.yaml` — 17 entities, 7 categories, 8 rules,
5 state machines, 38 `hooks` declarations, 5 sagas, 34 `rbac` entries.
**Scope**: the full application generator, then the application it generates —
built, migrated, seeded, served, and driven over HTTP and through a browser.

Three defects were found and fixed. One is reported and left open, because
closing it is a feature with a product decision in it rather than a repair.

> The `/qa` skill from gstack could not be used: this container cannot clone
> `github.com/garrytan/gstack` (the sandbox refuses the untrusted-code fetch),
> so `bun run setup:gstack` does not complete and no gstack skill is on disk.
> The pass below follows the method the existing `docs/qa/` reports use.

---

## Summary

| | |
|---|---|
| Defects found | 4 |
| Fixed here | 3 |
| Left open | 1 (`parent` is not honoured by the frontend) |
| Gates run | 9, all green after the fixes |

### The four

1. **A modelled `validation-error` rule matched and was then discarded.** The
   write was accepted and reported `final`. Two of the CRM model's eight rules
   are affected. *Fixed.*
2. **The generated Loco config was not valid YAML at rest**, so a formatter
   could rewrite it into something that will not boot, and every `cargo loco`
   command printed a deprecation warning. *Fixed.*
3. **24 dead file copies in the frontend generator** printed 24
   "component not found" warnings on every generation run. *Fixed.*
4. **an entity's `parent` is enforced in the dictionary and ignored by the
   generated frontend**, in both directions. *Reported, not fixed.*

---

## 1. A `validation-error` rule matched, and the runtime threw the verdict away

**Severity: high.** A declared business validation did nothing, silently.

`language/appwithai-language.json` defines the action:

```json
{ "name": "validation-error",
  "purpose": "Reject the write. The message is returned to the caller.",
  "required": ["message"] }
```

and `language/spec/05-directives.md` says `trigger-workflow` and
`validation-error` "are the two the generated runtime acts on".

It did not act on the second one. `promotion.rs` looked for exactly one
blocking action name:

```rust
.find(|action| action.action_type == "prevent");
```

`prevent` is what the rules *editor* writes. `validation-error` is what a
model's a rule's `actions` compiles to. A matched `validation-error` therefore fell
past the blocking pass into `run_action`, hit the catch-all arm, and was
logged and dropped:

```
WARN crm::services::promotion: unknown rule action; ignored
     action="validation-error" http.method=POST http.uri=/api/bus/support_case
```

The record was written and the response carried `"doc_status": "final"`.

Two rules in the CRM model are affected — `caseTriage-requireResolutionNotes`
and `quoteDiscountApproval-refuseDiscount`. Evidence that the rule itself was
never the problem: evaluated directly it matches and returns the right verdict.

```
POST /api/rules/dry-run  {"ruleId": "<caseTriage>", "data": {"status": "resolved"}}
→ {"matched": true, "results":[{"actions":[{"type":"validation-error",
     "config":{"message":"A resolved case needs resolution notes"}}]}]}
```

while the same condition through the front door was accepted:

```
POST /api/bus/support_case  {... "status":"resolved" ...}   → 201, doc_status "final"
```

**Why it was invisible.** Nothing asserts the promotion outcome of a blocking
rule end to end. `doc_status` appears in the generated suites only in
`tests/support/entities.rs`, as a field name to skip. The per-entity
`rules_*.rs` suites exercise `/api/rules/validate`, which parses a document
and touches no pipeline. So the whole blocking path — `prevent` as much as
`validation-error` — had no HTTP-level coverage, and the one name that was
checked happened to be the one no model emits. **That gap is now closed**: see
the regression gate below.

**The fix** (`backend/src/services/promotion.rs.hbs`) gives the two spellings
one predicate, so the editor's word and the model's compile to the same
verdict:

```rust
fn is_blocking(action_type: &str) -> bool {
    matches!(action_type, "prevent" | "validation-error")
}
```

used both in the blocking pass and in `run_action`'s already-handled arm, so a
future third spelling cannot be added to one and forgotten in the other. Two
unit tests ride with it in the template: both spellings block, and the three
actions that *do* work (`trigger-workflow`, `cascade-update`, `create-record`)
do not — a false positive there would short-circuit before any side effect ran
and silently drop the automation the rule asked for.

**After, against the running app.** The controller already turns a `rejected`
promotion into a 400, so the fix delivers the documented contract exactly —
the message reaches the caller:

```
POST /api/bus/support_case   status=resolved, no notes
→ 400 {"message":"Rejected by a business rule",
       "errors":["A resolved case needs resolution notes"]}

PUT /api/bus/quote/<id>      {"discount_percent": 45}
→ 400 {"errors":["Discounts above 40 percent cannot be approved by anyone
                  — reprice the quote"]}
```

and no false positives — `resolved` *with* notes is 201, an ordinary open case
is 201, `discount_percent: 10` is 200. `trigger-workflow` still fires: a quote
at 25% leaves a `completed` `QuoteApprovalEscalation` run behind, so the
rule → saga chain is intact.

**The regression gate**, in
`backend/tests/requests/rules_workflow.rs.hbs` —
`a_blocking_rule_refuses_the_write_under_either_name`. It authors a rule
against the first entity, makes a real write, and asserts on the response, for
both action names; the generated suite is **292** where it was 291.

Two things make it mean something. It writes the column back the value the row
already holds, and asserts that write succeeds **with no rule in place** before
installing one — otherwise an entity whose text column is enum-backed would
answer 400 to a bad value as readily as to a blocked one, and the case would
pass for the wrong reason. And it asserts the 400 carries the *rule's own*
message, which is what separates a refusal by the rule from a refusal by the
validator.

It was verified the only way a regression gate can be: by reverting
`is_blocking` to the pre-fix `matches!(action_type, "prevent")` and watching it
fail on exactly the second half —

```
a matched `validation-error` rule did not refuse the write — the same payload
was accepted with no rule in place, so the verdict was dropped:
  {… "doc_status":"final", "promotion":{"docStatus":"final","message":null} …}
  left: 200   right: 400
```

— `prevent` having blocked correctly in the same run, which is what says the
two names really had diverged. Restoring the fix turns it green.

This also closes the `prevent` half, which had never been exercised end to end
either.

---

## 2. The generated Loco config was not valid YAML at rest

**Severity: medium.** A formatter could leave a generated app unable to start.

The three `config/*.yaml` templates wrote Tera's native delimiters:

```yaml
port: {{ get_env(name="PORT", default="3000") }}
```

`{` is a YAML flow-mapping indicator, so that file is *not* YAML until Loco
rewrites it. Confirmed on the generated output before the fix — `yaml.safe_load`
raises `ConstructorError`. Loco 1.1's `config/template.rs` says what follows:
any tool that reads the file as YAML first (prettier, yaml-language-server, an
editor on format-on-save) respaces the braces and the app stops booting. Loco
warned about it on every single command:

```
warning: this config uses the legacy `{{ }}` template delimiters, which are not
valid YAML and are rewritten by editors/formatters (see
https://github.com/loco-rs/loco/issues/1727). Use the YAML-safe form instead.
```

**The fix** converts all 27 tags across `development`, `test` and `production`
to Loco's YAML-safe delimiters. It also *simplifies* the templates: the old form
needed a Handlebars escape (`\{{ … }}`) on every line to survive generation, and
the new one needs none. All three generated files now parse as YAML before
rendering, and `cargo loco` runs warning-free.

**Two traps here, and the second one cost a boot.** Loco rewrites and renders
the **whole file, comments included**:

- a doubled brace anywhere — a comment included — re-earns the deprecation
  warning, because the check is a plain `content.contains("{{")`;
- and a *complete* YAML-safe tag written out in a comment is translated to the
  Tera form and then **evaluated**. An explanatory `<%= ... %>` in the header
  comment I first wrote became `{{ ... }}`, and the app failed to load its
  config with `Found `...` but expected one of: integer, float, string, …`.

So neither delimiter may appear in prose in these files. The comments now
describe them in words.

**Regression gate** (`src/templates/__tests__/template-syntax.test.ts`, +3
tests) covers both halves, scoped to `config/*.yaml.hbs` so ordinary Handlebars
elsewhere is untouched. It distinguishes an *escaped* `\{{` (which reaches the
output) from a plain `{{x}}` (which Handlebars consumes at generation), which is
the distinction that makes the check meaningful rather than noisy. Both traps
were verified to fail the gate by reintroducing each one deliberately.

`crates/appwithai-gen/src/backend.rs` asserted the old form; it now asserts the
new one *and* that no legacy delimiter survives.

---

## 3. Twenty-four dead file copies in the frontend generator

**Severity: low**, but it is noise that hides a real miss.

Every generation run printed:

```
UI component not found: button
UI component not found: input
…  (19 of these)
Static component not found: src/components/ui/breadcrumb.tsx
…  (5 more)
```

`tanstack-start-frontend.generator.ts` copied `src/components/ui/<name>.tsx`
from the template tree. Every one of those templates is a `.tsx.hbs` now — they
became Astryx adapters — so all 24 copies failed, were caught, and warned. The
files exist in the output regardless: the Astryx overlay's `writeUiAdapters`
renders all 26 from `.tsx.hbs` a moment later. Pure dead code, and exactly the
"one template per output file" trap `CLAUDE.md` names, with the copy list as the
dead half.

Removed. Generation now runs with **zero** warnings, and the output is
byte-identical before and after apart from `Generated:` timestamps — verified by
diffing two full generations.

---

## 4. an entity's `parent` is ignored by the generated frontend — **left open**

**Severity: medium.** Reported rather than fixed: see the end of this section.

`CLAUDE.md` states the contract:

> `parent: Invoice` on `InvoiceLine` says the child has no life away from
> its parent … no `sys_window`, so **no card on the dashboard and nothing to
> navigate to**, and its `sys_tab` is attached to the *parent's* window.

**The dictionary half is exactly right.** For CRM's two children:

| check | result |
|---|---|
| `sys_window` rows for either line item | 0 |
| `sys_window` total | 22 = 15 entity + 7 admin ✓ |
| `Opportunity Line Item` tab → window | `Opportunity`, `tab_level 1`, `seq_no 20` ✓ |
| `Quote Line Item` tab → window | `Quote`, `tab_level 1`, `seq_no 20` ✓ |
| `/api/me/permissions` line-item windows | none ✓ |

**The frontend ignores all of it, in both directions.**

- The child **does** get a dashboard card. The dashboard reads
  `/api/sys/categories/with-entities`, which is `sys_table` + category and knows
  nothing about windows, so `Opportunity Line Item` and `Quote Line Item` appear
  as cards — and, because the model lists neither under a `categories`, they
  land in the **default** category, rendering under *People and Teams*.
- The child **does** get a standalone route. `opportunity-line-item.tsx` and
  `quote-line-item.tsx` are generated and render a working list at
  `/opportunity-line-item`.
- And the parent's detail view does **not** show the child tab. `/opportunity/<id>`
  renders its field groups, notes and audit trail, and no Line Items tab at all.

The component for this is generated and imported by nothing:
`src/components/forms/master-detail-tabs.tsx` has no importer anywhere in the
tree.

**Why it is left open.** The repair is not one-sided. Suppressing the card and
the route without first wiring `master-detail-tabs.tsx` into the detail route
would make line items unreachable in the UI entirely — strictly worse than
today. Wiring it in is a feature with product decisions inside it: whether a
child is reachable standalone for an administrator at all, whether the tab
edits inline or links out, and what the dashboard does with a child whose
`categories` was never declared. That is a change to specify, not a defect to
patch during a QA pass.

Worth noting alongside it: the default-category fallback is what puts line
items under *People and Teams*. It is defensible on its own — an uncategorised
entity has to go somewhere — but it is what makes this look like a
categorisation bug rather than a windowing one.

---

## What was verified and passed

Everything below was run against `crm.eml.yaml` **after** the three fixes.

### The generator

| Gate | Result |
|---|---|
| `bun language/checker.ts` on the model | 0 errors, 0 warnings |
| `bun run type-check` | clean |
| `bun run test:generator` | **547 passed** (540 before; +7 new) |
| `cargo test -p appwithai-gen` | **118 passed** |
| `cargo clippy -p appwithai-gen --all-targets -D warnings` | clean |
| `bun run parity` (3 models) | backends byte-identical |
| Generation, full app | exit 0, **zero warnings** |

Emission-layer checks on the output:

- **No Handlebars leaks** — zero block helpers across every `.rs`, `.sql`,
  `.toml`, `.ts`, `.tsx` in the generated tree.
- **Migrations**: 14 emitted, 14 registered in `lib.rs`, both directions.
  `m0002`/`m0003` are correctly the inline-`const` shape (they interpolate the
  model) and so have no `.sql`.
- **Seeds**: all 5 emitted (`dictionary`, `workflows`, `access`, `rules`,
  `transitions`), and all 5 are exactly what the tasks `include_str!`.
- **Hook registry shapes**: 7 `match` and 6 `if` across 13 dispatchers — the
  distinction that decides whether clippy's `single_match` fails the build.
  7 handler modules for the 7 declaring entities.
- **Regeneration safety**: a hand-written body added to
  `hooks/handlers/account.rs` survived `--force` regeneration intact. The
  "written once, never touched" invariant holds.
- **Dictionary counts** match the model exactly: 17 `sys_table`, 212
  `sys_column`, 17 `sys_tab`, 212 `sys_field`, 22 `sys_window`, 7 `sys_category`,
  151 `sys_ref_list`, 7 `sys_role`.

### The generated backend

| Gate | Result |
|---|---|
| `cargo build --all-targets` | clean, **0 warnings** |
| `cargo clippy --all-targets -D warnings` | clean |
| `cargo loco db migrate` | 14 applied |
| `cargo loco db seed` | all tasks, idempotent |
| `LOCO_ENV=test cargo test --test app` | **292 passed** (291 before; +1) |

Seeded accounts are right: `users` holds 9 — `admin@admin.com`, the seven
`rbac` demonstration accounts, and a plain user — matching `sys_role`'s 9.
(`bus_user` is empty and should be: it is the *business* User entity, not the
credential table.)

### The generated application, over HTTP

- **Auth**: `admin@admin.com` / `admin` works, as `config/*.yaml` and
  `.env.example` advertise.
- **Guards**: `/api/bus/*`, `/api/rules/*`, `/api/workflow*` refuse an anonymous
  caller with 401. `/api/me/health`, `/api/sys/*` reads and `/openapi.json` are
  open, as designed.
- **All 17 entities** answer `list`, `meta` and `fields/form` with 200.
- **CRUD round-trip**: create → read → update → read-back all correct.
- **Validation** names the missing mandatory fields rather than 500-ing, and
  rejects an unknown field by name.
- **Audit**: the trail records CREATE and UPDATE, `changed_fields` is populated
  — the `TEXT[]` arm in `row_json.rs` that was a past defect is working — and
  `/api/audit/verify` returns `{"verified": true, "entries_checked": 3}`.
- **Lookups**: `resolve_ref_table_name` derives all three of Account's targets
  correctly, including the suffix-less person role: `owner_id → bus_user`,
  `territory_id → bus_territory`, `sla_policy_id → bus_sla_policy`.
- **`enums` → `sys_ref_list`**: the modelled values are the ones the API
  enforces (`account_type`, `status`, `role`, …).
- **RBAC gate 2** is exact, and the two roles are complementary:

  | | Account | Lead | Opportunity | Quote | Campaign | Territory |
  |---|---|---|---|---|---|---|
  | `sales_rep` | 200 | 200 | 200 | — | **403** | **403** |
  | `marketing_manager` | 200 | 200 | **403** | **403** | 200 | — |

- **RBAC gate 3 (transition topology)** is enforced for the master role too:
  `new → working` is 200; `working → converted`, an edge the diagram never drew,
  is 400 — `no transition on bus_lead.status from 'working' to 'converted'`.
  Account, which declares no machine, accepts a free status change, which is the
  documented behaviour for a table with no edges.
- **Workflows**: a rule's `trigger-workflow` action resolves the named
  definition and leaves a `completed` run behind.
- **OpenAPI**: 47 paths documented; `/api/bus/{entity}` and `/api/sys/{segment}`
  are described generically, as they must be.

### The generated frontend

- `bun install` and `bun run build` both clean.
- Browser pass (Chromium, `/opt/pw-browsers/chromium-1194`): login →
  `/dashboard` → entity list → detail, no page errors beyond two expected 401s
  from pre-auth probes.
- The dashboard renders all 7 `categories` sections with their descriptions,
  icons and colours, plus the 5-window Application Dictionary section.
- A record created over the API appears in the list UI.
- The detail view resolves lookup **labels**, not raw UUIDs — "QA Runtime
  Account" and "Priya Raman" — so `identifierColumnNames` works end to end.
- Field groups, required markers, per-field help, notes, audit trail and the
  record pager all render.

---

## Notes for whoever picks this up

- **`bun run test:generator` is 547 now**, up from 540: +3 config-delimiter
  gates, +2 promotion predicate tests, and the two `it("finds …")` guards that
  keep a mis-scoped filter from silently testing nothing.
- **Local Postgres needed a password** for the generated default
  (`postgres://postgres@localhost:5432/crm_development`) to connect over TCP in
  this container. That is environment, not generator: `DATABASE_URL` overrides
  it everywhere, as documented.
- `bun language/checker.ts` writes a `<model>.error` sidecar even when
  it finds nothing (`"ok": true`, `"issues": []`). Harmless and gitignored, but
  the name reads as a failure. `language/` is byte-identical to the sibling repo
  and not editable here, so this is a note for that repo, not a finding.
