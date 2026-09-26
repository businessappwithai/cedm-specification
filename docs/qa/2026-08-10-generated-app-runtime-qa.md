# QA Report — the generated app, in a browser

**Date:** 2026-08-10
**Branch:** `claude/gstack-drug-discovery-qa-lkhred`
**Model under test:** `examples/drug-discovery.eml.mmd`
**Scope:** close every open item from the previous passes, then run the generated
application — Rust backend, TanStack/Astryx frontend — and use it.

| | Before | After |
|---|---|---|
| Generated-frontend lint errors | 149 | **0** |
| Generated-frontend `tsc --noEmit` | never ran | **0 errors** |
| Generator's own type-check gate | skipped every run | **runs and passes** |
| Generated backend suite | 247 / 247 | **264 / 264** |
| Repo `type-check` | 3 errors | **0** |
| `cargo clippy -p appwithai-gen` | 3 warnings | **0** |
| Generator unit tests | 66 | **412** |
| Rust generator unit tests | 62 | **68** |
| TS/Rust backend equivalence | 115 files | **115 files, both `--db` targets** |
| Browser QA of the running app | never run | **13 / 13 checks pass, 0 console errors** |

---

## Two defects the browser found that no test suite did

Both suites were green — 247 Rust request tests, 412 generator tests — while the
application was broken in the browser. Both defects sit exactly where an HTTP
test cannot see: one in React's render loop, one in the gap between what the
form emits and what the API accepts.

### 1. The form crashed into the error boundary after every successful save

Creating a record returned `201`, and the UI then died with

```
Maximum update depth exceeded.
```

The record was in the database; the user saw *"Something went wrong / Reload
page"* and had no way to tell the write had succeeded.

The cause was mine, introduced earlier in this branch while making
`useEffect` dependency lists "honest":

```ts
onChange(values);
}, [values, onChange]);          // was: }, [values]); // eslint-disable-line
```

Parents pass `onChange` as an inline arrow, so its identity changes on every
render: the effect re-ran every render, called back into the parent, the parent
set state, and React aborted. The same edit had been made to a second effect
(`}, [initialData, form.setFieldValue]`) — `useForm` rebuilds `form` each
render, so that one looped too.

The `eslint-disable` comment was load-bearing, and deleting it without replacing
what it protected is the whole bug. The fix keeps the dependency list honest
*and* correct by making the values stable rather than by suppressing the rule:
the callback and the form are read through refs, so the effect triggers on
`values` / `initialData` alone but never calls a stale function.

Found by bisecting 29 changed components against their `HEAD` versions in the
running dev server — the loop reproduced with the first 22 applied and vanished
with 21, which named `dynamic-form.tsx` in four HMR reloads.

### 2. An optional field could never be cleared — the backend rejected its own UI

```
POST /api/bus/compound  {"molecular_weight": null, …}
→ 400 {"message":"A value has the wrong type or format"}
```

Omitting the key gave `201`. Sending `null` — the only way a caller can clear an
optional value, and exactly what the generated number input emits when you empty
it — gave `400`.

`json_to_expr` bound every NULL as `Expr::val(sea_query::Value::String(None))`:
an untyped **text** parameter. Postgres will not store text in a `numeric`,
`date`, `timestamptz`, `uuid`, `boolean` or `jsonb` column, so it raised 42804
`datatype_mismatch`, which `errors.rs` correctly maps to a 400 — the error
handling was right, the binding was wrong. `raw_json_to_expr`, used by the rules
engine against columns on other tables, had the same defect.

Both now emit a NULL of the column's own type (`None::<i32>`, `None::<Uuid>`,
`None::<chrono::NaiveDate>`, …).

Alongside it, the form's own number input turned a legitimate **0** into `null`:

```ts
fieldApi.handleChange(e.target.valueAsNumber || null)
```

so a required amount could not be set to zero and an optional one silently lost
it. An empty input is `NaN`; that is the only value that means "cleared".

**Guarded by a new generated test.** `clears_an_optional_field_with_an_explicit
_null` runs per entity, one field at a time so a failure names the column, over
every optional non-text field. It is a real guard, not decoration: with the fix
reverted **11 of 17 entity suites fail**; with it, 17 of 17 pass. The generated
backend suite is now **264 tests**, up from 247.

---

## Everything else that was open

### The generated frontend now lints and type-checks clean

149 → 0 Biome errors. The last 20 lived in `.hbs`-sourced files, which Biome
cannot lint directly — they only appear after generation, which is why they
survived several passes.

`tsc --noEmit` on the generated frontend had **never successfully run**. Two
things blocked it:

- **No `target` in the generated `tsconfig.json`**, so tsc defaulted to ES5 and
  rejected every `for…of` over an iterator (`Headers`, `URLSearchParams`,
  `Map.values()`) with TS2802 — while Vite transpiled the same code happily.
  Now `"target": "ES2022"`, matching what Vite emits.
- `src/routeTree.gen.ts` does not exist until the TanStack Router plugin runs.
  The generator's gate already skips with a reason in that case, which is
  correct; after `bun run build` the type-check passes with 0 errors.

Both gates now run and pass on every generation:

```
📋 Linting Astryx frontend...   ✅ Frontend linting passed
📋 Type-checking frontend...    ✅ Frontend type-check passed
```

### Repo-side

- `bun run type-check` — 0 errors (was 3).
- `cargo clippy -p appwithai-gen --all-targets -- -D warnings` — clean (was 3).
- Biome errors on every file this branch touches — 0 (was 42 at `HEAD`).
  The two `==` in `ifCond` are deliberate and now say so: the helper implements
  the operator the *template* named, and `==` and `===` are separate branches a
  template chooses between.
- The `==>` saga edge quirk, the `seed: from=src/fixtures` warning, the empty
  `src/initializers` directory, and the request-suite count reported by both
  generators — all fixed in earlier commits on this branch, all still green.

### Equivalence held throughout

After every change:

```
diff -r generated-projects/dd-ts/backend generated-projects/dd-rs/backend
POSTGRES: IDENTICAL (115 files)
NEON:     IDENTICAL
```

---

## The browser pass

Chromium via the image's own build, against the real stack: Rust backend on
:3000 with a migrated and seeded `drug_discovery_development`, Vite dev server
on :3001.

| Check | Result |
|---|---|
| Sign in as `admin@admin.com` / `admin` | → `/dashboard` |
| Dashboard built from the dictionary | 24 links |
| Create a `User` through the inline form | 201, appears in the list |
| Create a `Compound` selecting its required FK | 201, FK resolved from the User just created |
| Record survives a reload | yes |
| Row click → detail view | `/compound/a4b95029-…` |
| Audit log shows the business write | yes |
| Category code auto-slugs from the name | `qa-slug-test` |
| `/admin/windows`, `/admin/rules`, `/admin/workflows` | all render |
| Theme selector | all 7 Astryx themes |
| Buttons without an explicit `type` | 0 |
| Console errors (401s from the pre-login session probe excluded) | **0** |
| Failed writes | **0** |

Worth recording for the next person writing a script against this UI, on top of
what `CLAUDE.md` already warns: the login route is **`/auth/login`**, not
`/login`; the list toolbar's search is behind a **button**, not a bare input;
and there is no `<nav>` or `<aside>` element — the dictionary navigation is
plain `<a>` elements in the page.

---

## Open items

- **`docker compose build` and a live container run remain untested**, blocked
  by the egress policy (`403 CONNECT` to `production.cloudfront.docker.com`).
  `docker compose config` parses and interpolates correctly for both targets.
- The Neon leg validates the connection profile against TLS Postgres, not a
  hosted Neon endpoint.
- `bun run lint` at the repo root still reports ~2900 pre-existing errors across
  1166 files. None are in files this branch touches, and the count on those
  files went from 42 to 0.
- The generated `tests/` bun:test suites were not re-run this pass; `cargo test`
  is the primary gate and covers the same HTTP surface in a quarter of the time.
