# QA — the generated frontend, in a real browser

**Date:** 2026-08-13
**Target:** a generated `drug-discovery` app with both halves running — Loco
backend on :3000, the TanStack Start frontend on :3001 — driven through
Chromium.

Every earlier pass in this series stopped at the API. Each report carried the
same caveat: *"how these render in a browser is inferred from the dictionary
rows rather than observed."* This closes it, and the inference turned out to be
half wrong.

---

## Result

| | before | after |
|---|---|---|
| Lookups on a **list** view | labels | labels |
| Lookups on a **detail** view | **raw UUIDs** | labels |
| Generated backend suite | 272 | 272 passed, 0 failed |
| TS vs Rust generated backend | identical | identical, 116 files |
| Frontend `tsc --noEmit` | clean | clean |

---

## DEFECT-006 — the detail view rendered every lookup as a raw UUID

**Severity:** High · **Status:** fixed

The grid and the record it opens disagreed. On `/sample` a compound reference
rendered `CC(=O)Oc1ccccc1C(=O)O`; on `/sample/<id>` the same reference rendered
`9980b173-201c-4ff5-9e62-5bb8a2cebc70`.

`TableReferenceViewValue` in `dynamic-form.tsx` fetched only when
`field.ref_endpoint` was set — the custom-endpoint case, `/sys/references` and
friends. An ordinary business-table lookup has no custom endpoint; it has
`ref_table_name`. So the query stayed disabled, `records` was empty, no record
matched, and the component fell through to its `label = id` fallback.

It also read the singular `ref_label_field`, defaulting to `"name"`, while the
dictionary describes labels as `ref_label_fields` — the list the grid already
honoured, and the one the earlier identifier work made non-empty for every
entity.

Fixed by giving the view component the same two sources the editable picker
already had: `useEntities(ref_table_name)` when there is no custom endpoint, and
`referenceLabel()` with the same field precedence the grid uses. The shared
helper was already there; only this component was not using it.

Confirmed in the browser, on the record that carries both a plain reference and
the hierarchical self-reference:

```
Compound Id       CC(=O)Oc1ccccc1C(=O)O     (was 9980b173-201c-4ff5-…)
Parent Sample Id  Crystalline solid          (was 3ed52f4e-c963-4018-…)
```

The record's own id still shows in the page heading. That is deliberate and
left alone: a heading needs to identify *this* record, and labels are not
unique — two samples can both be "Aqueous solution".

## Not a defect — two things that looked like one

Recorded because both cost time and both would mislead the next person.

**The login form submits natively if you click too early.** Clicking submit
before hydration completes performs a plain GET, the URL gains a bare `?`, and
no `POST /api/auth/login` is ever made — indistinguishable from a broken login.
Waiting for hydration makes it work every time. A browser script against this
app must wait for hydration, not merely for the input to be visible.

**`id` does not reach the `<input>`.** `<Input id="email">` renders an input
whose id is Astryx's own (`_R_54par6_`), so `#email` matches nothing and
selector-by-id fails. The adapter does pass `id` through; Astryx overrides it.

That second one has a real consequence beyond testing: the call site's
`<Label htmlFor="email">Email Address</Label>` points at an element that does
not exist, so clicking the visible label does not focus the field, and the
accessible name comes from Astryx's own hidden label — which the adapter
derives from the *placeholder*. Every generated form field is announced as
"you@example.com ∙ Required" rather than "Email Address".

**Left unfixed deliberately.** `input.tsx` and `label.tsx` both document this
arrangement as the Phase B bridge, and both say the same thing: Phase C moves
`dynamic-form.tsx` onto Astryx's `Field`, which owns the label properly, and
deletes both the hidden labels and this `Label` component. A targeted patch here
would add a third labelling mechanism to the two already in tension. It is worth
doing as part of Phase C, and worth knowing about before then — filed here
rather than fixed.

---

## The flake: bounded, not explained

`rules_experiment::validates_the_jdm_it_builds` has now failed **once in seven
full runs** (~1,900 test executions), and never in isolation.

What is known: `/api/rules/validate` is a pure function of its request body. It
parses the JDM into a `DecisionContent` and touches no database, no cache and no
shared state. Given the same body it cannot vary. The body is built from the
entity registry, which is generated and fixed. So the failure was not the JDM —
it was the request not arriving intact, which leaves an auth or app-startup
hiccup.

The original failure did not record which, so the assertions now report the
status code and response body. The next occurrence will say whether it was a
401, a 5xx, or a genuine `valid: false`, instead of only that two values
differed.

Not claiming this is fixed. It is instrumented, and the search space is narrowed
to two candidates.

## Housekeeping

`docs/CLAUDE.md` was deleted. It was a second, older copy of the root
`CLAUDE.md`, added in the initial commit and never updated since, describing
NestJS, OpenUI5, OData, Knex, ESLint/Prettier and the Anthropic API — a stack
this repository no longer has. Every structural claim in it was checkable and
wrong: `webapp/`, `backups/`, both template directories it named, and the
scripts `migrate`, `generate:odata`, `generate:ui5`, `test:coverage` are all
gone. Being a `CLAUDE.md`, it loaded as directory-scoped context for anyone
working under `docs/` and contradicted the root file. Recoverable at
`git show 554b764:docs/CLAUDE.md`.

## Reproducing

```bash
cd generated-projects/dd-ts/backend
DATABASE_URL=postgres://…/dd_fix cargo loco start --server-and-worker &
cd ../frontend && bun install && bun run dev          # :3001

# sign in at /auth/login as admin@admin.com / admin, then open a sample
# that has both compound_id and parent_sample_id set.
```

Browser scripts must launch the image's Chromium explicitly — the bundled
revision does not match:

```ts
chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
```
