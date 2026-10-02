# QA pass over the 47 domain applications — 2026-10-02

Every `applications/<domain>.cedm.yaml` was generated, served, driven through
the browser smoke (`tests/smoke.mjs`, every screen, console and network
errors) and put through its own `cargo test --test app`, one application at a
time (`scripts/qa/qa-loop.sh`), the build deleted before the next.

**Result: 47 of 47 clean — smoke 0 findings, every Rust request test passing.**
Test counts run from 690 (`common`) to 2020 (`finance`); `logistics` 1208,
`workflow` 830.

## Defects found and fixed at the source (templates, generator, language)

| Defect | Where it was fixed |
|---|---|
| Generated test values ignored `maxLength` and narrowed lookups (41 CRUD failures; Country code is 2 characters) | `tests/support/factory.rs`, `entities.rs` (`max_length`), bun `factory.ts`; values lead with a symbol so they never equal a seeded code |
| A "first text field" PATCH wrote random text into lifecycle columns (`status`, `state`, `stage`) | `first_text_field` skips them, Rust and bun |
| A rule test's `createData` lacked parents | `build_record_with_parents` |
| An entity column named like a Rust keyword (`type`) did not compile | raw identifier in `bus_entity.rs.hbs`; `entity-model-keywords.test.ts` |
| Two generated test modules named alike (`rules_workflow`) collided | renamed `workflow_rules`; `requests-module-names.test.ts` |
| A line-item or order identified by its currency, not its number | `identifierColumnNames` accepts `*_number/_code/_reference` — TS and Rust, documented in the language definition and specification |
| Smoke harness: cold-server sign-in timeout, 429 flood, locator timeouts | `smoke.mjs.hbs`, `qa.sh.hbs` (`RATE_LIMIT_MAX_PER_MINUTE=0`) |
| The `Delete` trigger on the workflow list was never drawn; a hook after an early `return` crashed `rules/$id.edit` | `ui/alert-dialog.tsx.hbs` uncontrolled trigger; hook moved |
| Raw `bus_…` names on rules / workflow screens | `useEntityLabel` |
| **An entity named `Route` wrote `routes/route.tsx`, TanStack's reserved layout file, which broke the whole frontend** (`logistics`) | `RESERVED_ROUTE_SLUGS` in `tanstack-start-frontend.generator.ts`: reserved names get no explicit route files and are served by the `$entity` catch-all; `reserved-route-slugs.test.ts` |

## Left open

- The reserved-name list is a hand-kept set. A router convention not on it
  would fail the same way; the smoke catches it on the first run.
- `--force` regeneration does not delete files a previous run wrote, so a
  renamed or newly reserved route leaves a stale file behind (removed by hand
  for `logistics`).
- The bun suites can see a 409 on 2–3 character unique columns after a prior
  run; the Rust suite resets its database and is the primary gate.
- The QA loop dies when the container restarts while idle; relaunch with
  `pg_ctlcluster 16 main start` and `E2E_PG_URL=postgres://postgres:qapass@localhost:5432`.
