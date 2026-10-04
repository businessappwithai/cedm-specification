# TODOs - HMS OpenUI5/OData V4 Enhancement

Work deferred from the Better Auth + Trigger.dev + GoRules enhancement plan.

---

## Open from QA, 2026-08-07

Found running `/qa` over the generator and the app it generates from
`examples/drug-discovery.eml.yaml`. Seven defects were fixed in that pass (see
`docs/qa/2026-08-07-generator-and-generated-app.md`); these three
are decisions rather than fixes.

### A. `rules` sections are never generated into the app — HIGH

The model declares three business rules. `eml info` lists all three.
`sys_rule_definitions` in the generated app is empty, and the generator has no
rule parsing or seeding at all — `backend/seed/` holds only `dictionary.sql`
and `workflows.sql`.

The engine is not the problem: `scripts/qa/rules-matrix.ts` re-encodes all
three rules as JDM by hand and the app enforces them correctly. What is missing
is the compiler — a `rules` flowchart → JDM path plus a `seed/rules.sql`,
mirroring what `src/workflows/saga.ts` already does for saga `steps`. Comparable in
size to the saga compiler, which is why it was not built inside a QA pass.

This is the largest remaining gap between what a model says and what its app does.

### B. `Agent` steps are declared but never execute — ✅ RESOLVED (2026-08-13)

Resolved as "declared, refused, and said so in three places" rather than by
implementing it. The defect was never the absence of the node — it was the
silence: the executor skipped it, the saga ran to completion, and the run
reported success for a business outcome that never happened.

Now: the executor **fails the run** on reaching an `Agent` step, `EML437`
reports it at validation before generation, and `stepNodes.Agent.notes` plus
`language/spec/03-workflows.md` both state it outright. Genuinely unknown node
types are still skipped — that forward-compatibility is why the catch-all
exists, and it now applies only to types this backend has never heard of.

Implementing it for real was rejected deliberately: it would make every
generated app depend on a reachable model endpoint at run time, which is an
architectural commitment the generator should not make on the author's behalf.
If that changes, the work is a new branch in `execute()` in
`services/workflow.rs.hbs` and flipping `shipped` to `true`.

### C. Sagas do not compensate — ✅ RESOLVED (2026-08-13)

Documented, not changed — the behaviour is the normal saga trade-off and worth
keeping. `language/spec/03-workflows.md` now leads its Compensation section
with "a saga is not a transaction", states that earlier writes **stay
committed** because each step commits on its own, works the CAPA example
through, and gives the two practical consequences: order steps so the
cheapest-to-undo run last, and never rely on a later step to validate what an
earlier one wrote. The `Partial-failure` scenarios in
`scripts/qa/workflow-matrix.ts` are cited as the evidence.

> **Status audit, 2026-07-31.** These items were written against an HMS app built
> on OpenUI5 + OData V4. This repository generates TanStack Start + NestJS and has
> no OData layer and no `BaseEntityController`, so items 1 and 4 no longer map onto
> the code as written. Current state:
>
> | # | Item | Status |
> |---|------|--------|
> | 1 | Row-Level Security | ✅ **Done** (2026-08-13) — re-scoped to table-level authorisation |
> | 2 | Rate limiting on auth endpoints | ✅ **Done** (2026-07-31) |
> | 3 | JDM Editor self-hosting | ✅ **Already done** — bundled from npm, no CDN |
> | 4 | Dead letter queue | **Blocked** — external (Trigger.dev plan) |

---

## 1. Row-Level Security — ✅ RESOLVED as table-level authorisation (2026-08-13)

Re-scoped and closed. The original item targeted `BaseEntityController` and
OData queries, neither of which exists any more, and named two candidate homes.
Decision: **generated apps**, re-homed onto the Loco `bus` controller. This
repository's own project data was the smaller, internal concern; generated apps
are the product, and that is where the promise matters.

Investigating it found the gap was wider than "users can read each other's
records". `/api/bus/*` required a JWT **and nothing else** — no role check of
any kind. `sys_access` was read only by `/api/me/permissions`, to decide which
windows the UI renders, so hiding an entity hid its menu entry and left its
endpoint open to anyone with any account. The dictionary described the grant;
only the navigation obeyed it. Security by menu.

`services/authz.rs` now enforces the same grant on the request, through the
Compiere chain the dictionary already models: role → `sys_access` → window →
tab → table, honouring `is_read_only` and `is_exclude`, with `is_master_role`
bypassing the lookup. Reads require read, writes require write, and a refusal
is a 403 that says which table and which verb.

**Row-level ownership was considered and deliberately not implemented.**
Filtering to `created_by = me` is a different decision with different
consequences — it makes shared work invisible rather than forbidden, and on
this schema most entities are collaborative by design (a Sample is not owned by
whoever registered it). Table-level access is the grant the dictionary actually
models, so it is the grant enforced. If per-record ownership is wanted later it
belongs as an explicit `sys_table` flag, not as a blanket filter.

Guarded by `permissions::an_authenticated_user_without_a_grant_is_refused_the_data`.
That test exists because no other suite could catch this: they all sign in as
the seeded administrator, who holds a master role and passes every check, so a
guarded endpoint and an open one look identical to them. It registers a fresh
account — which has no `sys_user` link and therefore no grants — and asserts
403 on both read and write, then asserts the administrator still gets 200 on
the same path, so the guard is shown to discriminate rather than simply break
the route.

**Metadata stays open**, matching the existing decision that `/api/sys/*` reads
need no token: the frontend builds its navigation from the dictionary before
anyone signs in. Data is gated; the description of the data is not.

---

## 2. Rate Limiting on Auth Endpoints — ✅ DONE (2026-07-31)

**Implemented in** `packages/web/src/lib/rate-limit.ts`, applied to
`routes/api/auth/login.ts` (10/min per IP) and `routes/api/auth/register.ts`
(3/min per IP). Returns 429 with `Retry-After` and `RateLimit-*` headers.
Covered by `packages/web/src/lib/__tests__/rate-limit.test.ts` (15 tests).

Deviation from the plan below: `express-rate-limit` was not used. The auth
endpoints are TanStack Start server handlers taking a Web `Request` and returning
a `Response`, not Express middleware, so the package does not apply. The
replacement is a dependency-free in-memory fixed-window limiter with the same
semantics.

**Remaining limitation:** counters are per-process and reset on restart. Move the
`buckets` map to Redis before running more than one instance.

<details>
<summary>Original plan</summary>

**What:** Add `express-rate-limit` middleware to `/api/auth/*` endpoints (10 attempts per minute per IP address).

**Why:** No protection against brute force login attacks. Attacker can try unlimited passwords.

**Pros:**
- Industry standard security practice
- Simple to implement (middleware config)
- Prevents credential stuffing attacks

**Cons:**
- 2h effort (minimal)
- May block legitimate users on shared NAT (corporate networks)

**Context:**
- Use `express-rate-limit` package (already compatible with NestJS)
- Config: 10 attempts/min for `/api/auth/signin`, 3 attempts/min for `/api/auth/signup`
- Store in Redis for distributed rate limiting (or in-memory for single-server)

**Depends on:** Phase 2 (Better Auth integration complete)

**Blocked by:** None

</details>

---

## 3. JDM Editor Self-Hosting — ✅ ALREADY DONE

`@gorules/jdm-editor` is a declared dependency of `@appwithai/web` and is imported
directly as an ES module in `packages/web/src/components/workflow/GoRulesEditor.tsx`:

```ts
import "@gorules/jdm-editor/dist/style.css";
import { DecisionGraph, JdmConfigProvider } from "@gorules/jdm-editor";
```

There is no `cdn.jsdelivr.net` script tag anywhere in the repository, so the
supply-chain risk this item describes does not exist. The webpack work below is
moot — the editor is bundled by Vite as part of the normal build.

<details>
<summary>Original plan</summary>

**What:** Install `@gorules/jdm-editor` via npm and serve from `/static/jdm-editor.js` instead of loading from CDN.

**Why:** CDN dependency creates supply chain risk. If CDN is compromised, attacker can inject malicious JavaScript into admin interface (RCE).

**Pros:**
- Removes external dependency
- Better security (no third-party code at runtime)
- Offline support (editor works without internet)

**Cons:**
- 3h effort (webpack config for React build)
- Adds ~2MB to bundle size
- Must manually upgrade editor version (no auto-update from CDN)

**Context:**
- Current: `<script src="https://cdn.jsdelivr.net/npm/@gorules/jdm-editor"></script>`
- Target: `<script src="/static/jdm-editor.js"></script>`
- Requires webpack config to bundle React component
- May conflict with OpenUI5's own build system (test carefully)

**Depends on:** Phase 5 (JDM Editor iframe wrapper exists)

**Blocked by:** None

</details>

---

## 4. Dead Letter Queue for Failed Workflows — BLOCKED

Still blocked, and for the reason the item already records: DLQ availability
depends on the Trigger.dev account plan, which is an external decision.

Scope note: Trigger.dev appears in this repository only inside the **generated**
NestJS templates (`backend/src/modules/jobs/job-queue.service.ts.hbs`,
`modules/bus/promotion-dispatcher.service.ts.hbs`). The "AdminWorkflows view"
below refers to the HMS app, not `routes/admin/workflows/` here. Confirm the
target app and the plan before starting.

**What:** Configure Trigger.dev dead letter queue to persist workflows that fail after 3 retries. Surface in AdminWorkflows view.

**Why:** Current behavior: workflow retries 3x, then disappears. Admins see error_details but can't retry from UI. DLQ ensures failed workflows are never lost.

**Pros:**
- Production reliability (no silent data loss)
- Trigger.dev built-in feature (minimal implementation)
- Enables bulk retry (process all DLQ items at once)

**Cons:**
- 2h effort (config + UI updates)
- May require Trigger.dev plan upgrade (DLQ not available in free tier)
- DLQ storage costs if many failures

**Context:**
- Trigger.dev DLQ config: `deadLetterQueue: { enabled: true }`
- AdminWorkflows view: add "Failed (DLQ)" filter
- Show count: "12 workflows in dead letter queue"
- Retry button: re-queue from DLQ

**Depends on:**
- Phase 3 (Trigger.dev workflow system complete)
- Trigger.dev paid plan (verify DLQ availability)

**Blocked by:** Trigger.dev plan limits (check with Trigger.dev account)

---

## Deferred (Not TODOs - Explicitly Rejected)

These items were considered but explicitly rejected:

- ~~**Audit logging**~~ - superseded: shipped and verified end to end, 2026-07-31. `audit_log` is created by migration `0007`, `AuditInterceptor` records every bus mutation, and `/admin/audit` reads it with filters and a before/after diff.
- **Multi-tenancy** - HMS is single-hospital system, no use case
- **Workflow scheduling** - No time-based triggers identified
- **Rule versioning** - Admin can duplicate rules manually
- **Bulk operations** - OData $batch is complex, unclear use case

---

## Found by /qa on `claude/drug-discovery-mmd-qa-nc8d0b`, 2026-07-30 — RESOLVED

All four deferred findings fixed on main, 2026-07-30:

- **Database consistency** — Init panel placeholder/default changed to `postgresql://…:5432/…`; helper text updated; `.env.example` switched to PostgreSQL vars (`PGHOST`, `PGPORT`, etc.); `database.service.ts` header comment updated from MariaDB to PostgreSQL.
- **EML `rules` ingestion** — `extractRuleFlowcharts()` added to `rules-design.tsx`; on first load the editor now seeds from the first `rules` flowchart in `project.erdCode` instead of the hardcoded "Order Discount" placeholder.
- **`(round)` node shape** — `NodeShape` union extended with `"round"`; `parseNodeDef` branch added for `^\((.+?)\)` in `the flowchart parser`.
- **Console pipe amplification** — `routes/api/db/reverse-engineer.ts` and `generate-schema.ts` migrated from `@tanstack/start/api` (deprecated, emits `console.warn` on every load) to `@tanstack/start-api-routes` (the underlying package, no warning); `@tanstack/start-api-routes` added as an explicit web dependency.

---

## Found by /qa on `claude/drug-discovery-categories-qa-fon34w`, 2026-07-31 — RESOLVED

Ten defects found driving the generated drug-discovery app (17 entities, 7 categories)
against PostgreSQL. All fixed in the generator templates, so every generated app picks
them up. Full report with evidence: [docs/qa/qa-report-drug-discovery-2026-07-31.md](docs/qa/qa-report-drug-discovery-2026-07-31.md).

- **`generate --force` broke `bun run migrate`** — scaffold migrations were named
  `<Date.now()>_<slug>.ts` and the cleanup pass removed only three of eight slugs, so a
  regeneration emitted a fresh set alongside the old and the runner replayed CREATE
  TABLE migrations. Now a fixed zero-padded sequence, overwritten in place.
- **`bun run migrate` never ran the seeds** — `src/migrate.ts` looked in `src/seeds`;
  they are generated at the backend root. Silent: it reported success with an empty
  Application Dictionary.
- **Unhandled ElectricProvider sync error on every load** — booted PGlite with
  `VITE_ELECTRIC_URL` unset, which is the shipped default and already covered by the
  HTTP fallback. Now idle when Electric is not configured.
- **Duplicate TanStack Query keys from `useQueries`** — `DynamicTable` keyed lookups by
  referenced table, so two FKs to the same table collided and shifted every later result
  onto the wrong field. Same in the breadcrumb shells. Both now dedupe.
- **Google Fonts was a hard runtime dependency** — a render-blocking third-party
  stylesheet. Latin subsets vendored under `frontend/public/fonts` (SIL OFL).
- **FK columns rendered raw UUIDs** — the shipped `.tsx` DynamicTable ignored
  `ref_label_fields` and defaulted to `"name"`.
- **Category selects on `/admin/categories` were unreadable** — `.swiss-input` kept
  `py-3` under every height override, clipping the text to a band shorter than the glyphs.
- **Dashboard header overflowed at 375px** — fixed-width search box.
- **Audit trail recorded a `promotion` column that does not exist** — the interceptor
  diffed the raw response envelope. Also added the missing `audit_log` migration.
- **"1 records"**, and the frontend `dev` script rendered as `vinxi dev --port ` with no
  port because `config.frontendPort` was never in the template context.

### Not fixed — model authoring, not a defect

`drug-discovery.eml.yaml` declares `booked_by`, `reported_by` and `registered_by` as
plain strings rather than `_id`-suffixed foreign keys, so the generator cannot derive
the referenced table and those columns render as UUIDs. The EML checker already flags
this as `EML114`. Renaming them in the model is the fix.

---

## Found by the generated E2E suite, 2026-07-31 — RESOLVED

Ran the generated `tests/` suite against the running drug-discovery app:
60 failures → 40/40 suites, 609 tests, 0 failures. All fixed in the templates.

**Test harness (generated code, so generator bugs):**

- **`_by` foreign keys unresolvable** — `resolveParentEntity` derived the parent
  from `<stem>_id`, so `registered_by_id` looked for a `registered_by` entity and
  left a mandatory FK unset. Six entities could not be created at all.
- **`is_active` excluded as server-managed** — the generator never adds it; when a
  bus table has one the model declared it, often as required. The factory was
  forbidden from supplying a field the API demanded.
- **Name-driven fakers overrode the declared type** — `ratio` matched
  "calib(ratio)n", `login` matched "last_(login)". Patterns are now segment-
  anchored, and a value that does not fit the column's declared type is discarded.
- **Unique columns unique only within a run** — the salt came from the seeded
  faker, so a second run against a populated database regenerated a value it had
  already inserted (409). Now drawn from an unseeded per-process id.
- **`firstTextField` picked `email`** — suites write arbitrary markers into it,
  tripping the email-format rule. Format-constrained columns are now skipped.

**Rules engine (an app bug, not just a test bug):**

- **The CRUD verb was injected as `action`**, overwriting any entity column of
  that name. `bus_workflow_event.action` is a declared required column, so its
  required-field rule could never fire. The verb now travels as `_operation`.
- **Trigger-workflow rules tested an undeclared input (`i0`)**, so the condition
  was ignored and both post-create and post-update workflows fired on every
  operation. The decision table now declares the operation input.

**Audit report — server-side pagination**

The API was already paginated (LIMIT/OFFSET + total). The UI asked for a
hardcoded 50, computed page counts from that literal rather than the server's
echoed limit, and hid the pager below two pages. Now: 25/50/100/250 rows, row
range, first/previous/next/last, page maths from `meta`, and the previous page
held on screen while the next loads (without which the in-flight empty state
tripped the out-of-range clamp and bounced every navigation back to page 1).
Verified against 545 rows.
