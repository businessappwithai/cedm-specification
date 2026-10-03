# Syncing from `app-with-ai-tanstack` — the ledger

This repository and `businessappwithai/app-with-ai-tanstack` are the same product
on two backends, and the sibling is where most new functional work lands first.
Bringing it across is a recurring task, not a one-off migration.

**This file exists so a round starts from a watermark rather than from zero.** It
records, per round: the sibling commit the survey was taken against, which of the
sibling's pull requests were carried, which were examined and deliberately not
carried, and the local commit and pull request that closed it. The *narrative* —
what each defect was, how it was demonstrated, what it cost — stays in
[`2026-09-13-divergence-from-app-with-ai-tanstack.md`](./2026-09-13-divergence-from-app-with-ai-tanstack.md),
whose section numbers are cited below. Read the ledger to decide what to do next;
read the report to understand something already done.

---

## Watermark

| | Sibling `main` | Local |
|---|---|---|
| **Last merged round** | `7e50ea8` — `Make the wasm reporting nav reach…` | PR #33 (round 12) |
| **In flight** | — | — |

A round that begins by enumerating sibling work does so from the **last merged**
watermark, not from an in-flight one — anything on an unmerged local branch can
still be lost. The next round starts with:

```bash
git -C ../app-with-ai-tanstack fetch origin main
git -C ../app-with-ai-tanstack log --oneline 7e50ea8..origin/main
```

---

## How to resume a round

The two repositories **share no git history**. The Rust one was started fresh, so
nothing can be diffed by commit and `git log` across them is meaningless. What is
comparable is enumerated below.

1. **Refresh the sibling.** It is checked out at `../app-with-ai-tanstack`.
   ```bash
   git -C ../app-with-ai-tanstack fetch origin main
   git -C ../app-with-ai-tanstack checkout origin/main -- language website/llmtext
   ```
   The second line matters: the sibling's working tree is not always on `main`,
   and the contract directories are the one thing compared byte for byte.

2. **Re-sync the shared contract first, before reading any code.**
   ```bash
   diff -rq -x '*.eml.mmd.error' language/ ../app-with-ai-tanstack/language/
   diff -rq website/llmtext/ ../app-with-ai-tanstack/website/llmtext/
   ```
   `language/` and `website/llmtext/` are held **byte-identical** to
   `app-with-ai-tanstack@main` and are never authored here. `*.eml.mmd.error` is
   checker output and is gitignored. Copy any difference across wholesale, then
   check both readers still accept it: `bun run type-check:language` and
   `cargo test -p appwithai-gen language::tests::the_shipped_definition_loads_rather_than_falling_back`.

   Do this first because it is how a round discovers its own scope: the contract
   is a *claim* about what the product does, so copying it can make this
   repository describe behaviour it does not yet have. That is exactly how
   `%%report` (§6) and `%%entity icon:` (§8) were found.

3. **Enumerate the sibling's new work.**
   ```bash
   git -C ../app-with-ai-tanstack log --oneline <watermark>..origin/main
   ```
   Its pull requests are the unit to reason about — each squashes to one commit
   whose subject names the change. Triage each into one of four buckets: carried,
   does not apply, applies differently, or deferred. **Record all four here**, not
   just the first; an item with no verdict written down gets re-surveyed every
   round, which is the cost this file exists to remove.

4. **Check the standing skip list** below before surveying an area — several
   categories of sibling work never apply here, for structural reasons.

5. **Close the round** by appending to the table, moving the watermark, and adding
   a section to the divergence report.

---

## What is comparable, and what is not

These four constraints shape every round and are the reason a sibling change is
rarely a patch that can be applied.

- **The architecture does not move.** Everything lands inside the existing
  Loco.rs + Astryx shape: the backend is a cargo crate, `cargo` owns `backend/`,
  `bun` owns `frontend/` and `tests/`. Where the sibling's fix assumes NestJS or
  Better Auth, the *behaviour* is reimplemented against this runtime's vocabulary
  — never the mechanism.
- **Two generators must agree.** `packages/generator` (TypeScript) and
  `crates/appwithai-gen` (Rust) are held byte-identical by `bun run parity`. A
  backend change is two edits, always.
- **Parity cannot see the frontend.** The Rust generator emits only `backend/`,
  so a frontend template change passes `parity` no matter what it does. Frontend
  work is verified by generating an application, building it, and driving it in a
  browser — there is no gate.
- **The corpus is `examples/`, not `language/examples/`.** The latter belongs to
  the shared contract and is off limits. A directive is only really exercised
  once a model in `PARITY_MODELS` uses it; Handlebars strict mode is off in both
  engines, so a missing helper renders as an empty string and parity stays green.

---

## Rounds

| # | Local | Sibling work carried | Survey taken against | Report |
|---|---|---|---|---|
| 1 | `34ab32c`…`9825b7d` → PR #29 | Content comparison — no sibling PR mapping recorded | sibling `main` ≈ `75c5c81` (#130) | §1–§3, §5 |
| 2 | `94fa7e5`…`fd97d38` → PR #29 (`e8f8908`) | Content comparison — CSV export, `sys_system`, business seed, log spec | sibling `main` ≈ `b42f259` (#132) | §2.5, §4 |
| 3 | `92030c4` | The HTTP request log, and what measuring it turned up | — | §4 |
| 4 | `1ab9a59`, `0bd6a09` | **#131** `The model's own reports reach the application it generates`, **#132** `%%rbac shapes the reporting platform's roles too`, **#143** `Run every %%report in the generated suite` | `b42f259` | §6 |
| 5 | `208bdeb` | **#146** `Refuse rather than allow when the generated guard cannot read its rules` (their finding M3) | `a21c02f` (#147) | §7 |
| 6 | `8808fb0` → PR #30 (`2ce0f85`) | **#152** `icon-language-docs`, the compiled half of **#153** `Compile %%entity icon:` | `32e5e7a` (#153) | §8 |
| 7 | `7f4d559` → PR #31 (`a95260d`) | **#150** `One query for the dashboard, and an administrator sees the dictionary`; the icon-rendering half of **#153** | `32e5e7a` (#153) | §9 |
| 8 | `6d0a1bb` → PR #32 | **#148** `Cut the generated frontend's per-page request and bundle cost`, **#149** `Fix five defects a review found in the benchmark changes` | `32e5e7a` (#153) | §10 |
| 9 | `88a19f3`… → PR #32 | contract re-sync from **#157**; **#156** `Mount the application shell`; the dead-template half of **#155** | `cc9faa4` (#157) | §11 |
| 10 | `5f7c05a`… → PR #32 | **#154** `Rate limit per caller, and rate limit sign-in at all` | `cc9faa4` (#157) | §12 |
| 11 | `affb9b8`… → PR #32 | the gate half of **#155** `Stop the generator naming templates that are not there` | `cc9faa4` (#157) | §13 |
| 12 | `22839a6` → PR #33 | **`cc90133`** `Merge the version/history work and the enhance-page work` (project Git history, `packages/yamltecture`, enhance-page rules/hooks); contract re-sync and the manual half of **#158** `c5c80d3` | `7e50ea8` | §14 |

Rounds 1–3 predate this ledger and were driven by directory-by-directory content
comparison rather than by the sibling's commit log; their sibling watermarks are
reconstructed from dates and are approximate. Every round from 4 onward names the
sibling pull requests it carried.

### Round 5 — what was examined and not carried

The sibling ran a security audit across itself and the reporting platform and
closed four findings. Three touch code a generated application ships, so each was
checked here rather than assumed:

| Their finding | Sibling PR | Verdict here |
|---|---|---|
| **H4** the generated app logs the administrator password | #145 | **Does not apply.** `ensure_admin` never prints it and already warns on the default |
| **C5** role mass-assignment through Better Auth's `updateUser` | #144 | **Not through that door** — no Better Auth here. Through `/api/sys/*` instead, and worse; closed in the same round |
| **M3** the generated entity guard fails open on error | #146 | **Applies, in four places.** Closed |

### Round 9 — what it carried, and what it found

- Contract re-synced from `cc9faa4`; `diff -rq` is clean for both directories.
  The only substantive change was one generator-contract line: `%%entity <Name>
  icon:` is now documented as compiling to `sys_table.icon`, which this
  repository already does (round 6).
- The application shell (#156) is mounted — `app-shell.tsx` around the
  `<Outlet />`, a sidebar driven by `/api/me/dashboard` rather than three
  hardcoded lists, a header that reaches every screen, `app-layout.tsx` deleted.
  The sidebar's old lists would have shipped a dead `/admin/dictionary` link, a
  second derivation of `sys_table.icon`, and a menu offering entities the API
  refuses.
- Mounting the header rendered `components/ui/dropdown-menu` for the first time
  and found a defect of this repository's own: the adapter nested a `<button>`
  inside Astryx's own trigger button, which the HTML parser will not keep, so
  every page carrying the menu failed hydration. `header.tsx` was the only
  caller and `header.tsx` had never been rendered. Fixed in the adapter, where
  `asChild` now unwraps.
- The dead-template half of #155 is done — 24 entries naming templates that no
  longer exist, removed from `tanstack-start-frontend.generator.ts` along with
  the `try`/`catch` blocks that were swallowing the resulting failures. The
  *gate* that prevents recurrence was not ported; see the queue.

### Round 10 — the mechanism did not port, the behaviour did

The sibling's fix is `@nestjs/throttler` plus better-auth's own limiter, and
this stack has neither. What ported is the two things it learned:

- **Key the budget on the caller, not the address.** Its users arrive through
  one proxy, so a per-IP budget counts how many people there may be rather than
  how fast one may go — it measured 429s from 31 concurrent users on an idle
  server. `common::rate_limit` counts a verified token's subject, falling back
  to the address only for an anonymous caller.
- **The credential routes need a budget of their own.** A generated application
  here answered 140 wrong passwords in a row, and had no other brute-force
  control. `/api/auth/{login,register,change-password}` now get a tight one,
  spent separately from the general budget.

`TRUST_PROXY` decides whether `X-Forwarded-For` may be believed, off by
default. `config/test.yaml` switches both budgets off, because the generated
suites drive volumes no human session produces; `tests/requests/rate_limit.rs`
covers the limiter by building its own router and budget, the way
`requests/rbac.rs` builds its own rules.

### Round 12 — every sibling commit since `cc9faa4`, with its verdict

| Sibling | Subject | Verdict |
|---|---|---|
| `76f3f6b` (#158) | Show the fields in the browser application, name the reporting app on its sign-in screen | **Does not apply** — `templates/wasm/**` |
| `c5c80d3` (#158) | Make the dictionary gaps mandatory in the report, document the screen in the manual | **Carried.** `checker.entry.ts` by contract copy; the manual **applies differently** — derived from `screenLayout` in `dictionary-seed.ts`, not `DictionaryGenerator`/`GRID_NOISE` (§14) |
| `ac28524` (#158) | Format two files, rebuild what that staled | **Does not apply** — the browser bundles |
| `839f6d3`, `3b2e6a0`, `f9d54b6`, `3859079` (#159) | Wasm field toggle; writable rules/workflows/reports; admin screens; 204 across the Service Worker | **Does not apply** — browser stack. The `sys_report` write path they add has no caller here |
| `adeca74` (#160) | Carry the platform's whole `src` into the reporting image | **Does not apply** — Enterprise Reporting pack |
| `6712381` (#161) | Draw the browser reporting app in the platform's shell | **Does not apply** — browser stack + reporting pack |
| `cc90133` | Version/history work + enhance-page work | **Carried**, adapted where the backend is a crate (§14). Not carried: `AGENTS.md` (a Codex copy of the sibling's own CLAUDE.md) and the Playwright specs `04-*`/`04b-project-git` (the sibling's suite, which does not exist here — the Postgres-backed unit suite and a CI job cover the same ground) |
| `7e50ea8` | Wasm reporting nav reaches items below the fold | **Does not apply** — `tests/e2e/wasm` |

`html/models/investment-planning-wealth-management-system.eml.mmd` was copied
across because the yamltecture integration test reads it; it is a model file,
not a published page.

---

## Standing skip list

Categories of sibling work that do not reach this repository. Check this before
surveying, not after.

| Sibling area | Why it never applies |
|---|---|
| `packages/generator/templates/tanstack-start-nestjs/**` | That stack does not exist here. `StackOption` is a one-member union |
| `html/**`, `website/viewers/**`, the browser WASM bundles | Published from the sibling; this repository serves none of it |
| `website/llmtext/**` and `language/**` as *authoring* | Shared contract — copied, never edited. A change here is a defect |
| `packages/web/**` fixes to the modelling tool | Applies only where the same file exists here; the two web apps have diverged and are not held to parity |
| `--standalone` / WASM overlay work | No equivalent — this repository generates one stack, to a cargo crate |
| Changes to the sibling's `%%report` → Enterprise Reporting pack | A different product; `%%report` compiles to `sys_report` here |

**One exception to the reporting-pack skip, deliberately taken.** `packages/generator/src/reporting/pack.ts` (`buildReportingPack`) and its test were copied from sibling `2cd116c`, unchanged apart from two imports. The orchestrator (`app-and-report-with-ai-rust`) derives the pack for the Rust reporting platform through this repository now, so the derivation has to exist here. `naming/tables.ts` is **not** the sibling's copy: it delegates to `entityToBusEntity`, which is what `m0002_bus_tables` renders, so the pack and the migration cannot name a table two ways. Later sibling changes to `reporting/**` are carried like any other shared module; the browser-stack readers of the pack still do not apply.
| Anything Better Auth, Kysely or NestJS *as a mechanism* | Reimplement the behaviour against Loco/SeaORM/`auth::JWT`, or record that it does not apply |

---

## Open queue

Carried forward, newest survey first. Each names the sibling commit it comes from
so it can be picked up without re-surveying.

| Item | Sibling | Status |
|---|---|---|
| The enhance page's hook-file routes read `src/modules/<entity>/hooks/*.ts` | — (predates round 12, now routed through Git) | A NestJS layout; a generated backend here keeps hooks in `backend/src/hooks/handlers/<entity>.rs`, so the listing is always empty and the save 404s. Now committed through `saveProjectFiles` when it does run |
| "Restore whole application" and "compare" in `ProjectGitHistory` | **`cc90133`** | Carried as written; the routes behind them are exercised by the Postgres-backed unit suite, but the panel has not been driven in a browser |
| A 429 has no dedicated path in the generated frontend | — (left by round 10) | A 401 signs the caller out; a 429 surfaces as a generic error. The headers it would need are exposed |
| Per-account lockout on repeated sign-in failure | — (left by round 10) | The credential budget is a floor against guessing, not a substitute. `users` has nowhere to record a lockout yet |
| The twenty-odd remaining swallowing catches in the frontend generator | — (left by round 11) | The gate catches a path that resolves nowhere; a catch that hides a Handlebars syntax error in a template that *does* exist is still silent |
| `Make the sidebar searchable, with client-side autocomplete` | **#156** `84a782d` | Not started; the shell it sits in is round 9 |
| `Close the generator's low-severity findings: path match, role folding, origins` | **#147** `a21c02f` | **Not surveyed.** Round 5 examined C5/H4/M3 and did not reach this one |

---

## Keeping this file true

- Move the watermark only when a round's pull request is **merged**.
- Every sibling pull request enumerated in a round gets a verdict written down —
  carried, does not apply, applies differently, or deferred to the queue. An
  unrecorded verdict is re-surveyed forever.
- The ledger records *what and where*; the divergence report records *why*. A
  round closes when both have been appended to.
- Naming a sibling pull request by number alone is not enough — it is in another
  repository. Carry the commit SHA, which is stable even if the repository moves.
