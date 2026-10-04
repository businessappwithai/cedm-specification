# QA — the chat, the website's download, and what a chat host costs

**Date:** 2026-10-04
**Scope:**
- the DeepSeek Harness chat (`chat-deepseek/`) running against a generated CRM
  application and the reporting platform;
- the website's *Download the deployable app (.zip)* button, and the
  application inside that archive;
- the chat's memory per signed-in person.

**Model:** `examples/crm` (the website's `guide/models/crm.eml.yaml`), 17
entities, 7 declared roles.

## The stack under test

Everything below ran as real processes in one container, behind one nginx
origin (`:8080`):

| Path | Process |
|---|---|
| `/` | the generated CRM front end (TanStack Start), backend on `:3000` (Loco 1.2, `crm_development`) |
| `/report/` | the reporting platform's front end, built with the `/report` overlay; its Loco backend on `:5150` |
| `/chat/` | the chat gateway (`bun gateway/server.ts`), one Harness 0.2.0-rc.2 host per signed-in person |

The DeepSeek endpoint was `tests/support/messages-recorder.ts`: **the model's
words were scripted; every tool call, screen, save and sign-in was real.** No
`DEEPSEEK_API_KEY` is available in this environment, so **a run against the
live model was not performed.**

## 1. The website's download

`scripts/sites/check-loco-download.ts` in `app-with-ai-rust` (now
`bun run check:site-download`) runs the following:

1. It serves the website, opens chapter 09 in Chromium and generates.
2. It clicks the download and saves the archive the page offers.
3. It generates the same model with `generateApplication`, the path the CLI
   takes, and compares every file.

**Result: 576 files in the archive, 576 from the pipeline, `chat/` included;
no difference.** Three differences are normalised and nothing else is
accepted:

- the generation timestamps;
- the manifest's `input` path;
- Rust layout. The CLI runs `cargo fmt`, and a browser cannot, so both
  backends are formatted before comparing.

The archive was then run as a reader would run it:

- `cargo build --locked` built it;
- `db migrate` and `db seed` completed;
- the server and the front end started (screenshots `zip-01`, `zip-02`);
- **its own request suite (`LOCO_ENV=test cargo test --locked --test app`)
  passed 335 of 335.**

### Found and fixed

- **The download did not work in any real browser.** `language/index.ts`
  called `fileURLToPath(import.meta.url)` at module scope. In a browser that
  URL is `http:`, so the bundle threw while loading, before the button did
  anything. Every check that ran the bundle under Bun passed, because there
  the URL is `file:`. The path is now resolved lazily, behind a guard, in the
  root and the copy. The new check opens the page in Chromium for exactly
  this reason.
- **The page's counts were stale.** `chat/` (49 files) and `lib/embed.ts`
  took the CRM from 526 to 576 files. The figures on `index.html` and in
  chapter 04 were corrected, and `website-e2e.mjs` held them to the generator:
  it failed on all three, and now passes 150 of 150. The chapter 04 tree, the
  chapter 09 description and the completion message now name the chat and the
  single nginx origin.

## 2. The application, and the application inside the chat

Screenshots are in `screenshots/2026-10-04-chat/`.

| Shot | Shows |
|---|---|
| `app-01` … `app-06` | sign-in, dashboard, a list, an opportunity with its lifecycle bar, the conflict dialog after a second user saved first, a new-record form |
| `chat-01` … `chat-08` | the chat's sign-in, signed in, a create form opened inside the conversation, the `[Application]` saved notice and the reply, the conflict dialog inside the conversation, the overwrite reported, a report in a card, and the reporting page embedded with no second sign-in |

### Found and fixed, from the screenshots

| What the screen showed | Cause | Fix |
|---|---|---|
| A **Final** badge on a record whose status was not final | `doc-status-badge` labelled the *rule* outcome with words that read as the lifecycle | Labels are now *Rules passed*, *Checking rules* and *Rules not met* |
| "Opportunity Opportunity 5" in the conflict dialog | The record's identifier already began with the entity label | The prefix is dropped when the identifier already carries it |
| A row of dashes for `promotion` in the conflict dialog | The dialog listed columns the form does not show | Only fields the form shows, and only where the two values display differently |
| An unstyled red button | `button.tsx` mapped `destructive` to `danger`, which Astryx does not define | Maps to Astryx's `destructive` |
| The theme selector floating over an embedded screen | It rendered regardless of embed mode | Hidden when embedded |

Shots `chat-03` and `chat-05` were taken before the theme-selector fix.

### Not fixed here, reported

- **Enum values show raw in lists and read views** (`feature_request`,
  `prospecting`), while forms show the labels. This predates this work.
- The chat sidebar's session titles read "I could not find that." That is the
  scripted model's text, not a defect.

## 3. Security gates, against the live stack

| Suite | Result |
|---|---|
| `tests/unit` | 25 / 25 |
| `tests/security/gateway.test.ts` | 18 / 18. Mutation-checked: removing the mux filter fails it |
| `tests/security/reporting-assertion.test.ts` | 11 / 11 |
| `tests/e2e/chat.e2e.test.ts` | 4 / 4, twice |
| `bun run test:composition` | passes: no enabled package outside the allowlist |

Two of the defects these suites closed were the most serious found in this
work:

- **Harness's mux socket bypassed the endpoint allowlist.** A client could
  open any endpoint over the WebSocket that the HTTP routes refused. The
  gateway now applies the same allowlist to every `open` frame
  (`checkMuxFrame`).
- **A settings write could repoint the DeepSeek base URL**, and with it where
  the server's API key is sent. `settings` is now read-only through the
  gateway (`describe` only).

## 4. Memory per signed-in person

`bun run load` (`tests/load/host-memory.ts`) works like this:

- it signs accounts in through the real gateway, which starts each person's
  host;
- each person asks questions, and each question makes a real `search_records`
  call as that person;
- RSS and PSS are read from `/proc`.

It ran on a 16 GB, 4-core machine, with a 256 MB heap cap per host.

| hosts | turns each | per host PSS | per host RSS | all hosts PSS | gateway RSS |
|---:|---:|---:|---:|---:|---:|
| 1 | 1 | 125.1 MB | 153.6 MB | 125.1 MB | 94.4 MB |
| 10 | 1 | 87.8 MB | 141.0 MB | 877.7 MB | 112.9 MB |
| 25 | 1 | 74.6 MB | 130.8 MB | 1,864.5 MB | 131.0 MB |
| 40 | 1 | 72.2 MB | 129.3 MB | 2,888.4 MB | 134.4 MB |
| 10 | 10 | 94.4 MB | 147.7 MB | 943.8 MB | 109.9 MB |

What the figures give:

- **Per person:** about 72–95 MB from 25 hosts on, and about 0.7 MB more
  per turn. That per-turn figure is a lower bound, because the scripted
  answers are short.
- **200 people active at once:** about 15–19 GB of hosts with short
  conversations, about 40 GB with long ones, and 65 GB with every host at its
  heap cap.
- **Server:** 32 GB for 200 active people; 64 GB only for every one of them at
  the heap ceiling at once.

This replaces the unmeasured estimate of 40–70 GB. The figures were measured
to 40 hosts and the 200 column is scaled from them; `chat-deepseek/README.md`
states both limits. `MEASURED_HOST_RSS_MB` is now the measured 154 MB.

### Found and fixed in the load script itself

- **Accounts never received their role.** Registration writes only the
  credential. The script now gives each account the dictionary identity and
  the role exactly as `seed_access` does.
- **Registration's rate limit stopped the run at 15 accounts.** The script now
  waits out `Retry-After`. It keeps what it measured on a failure, and exits
  non-zero.
- **A shell whose command mentioned the Harness path was counted as a host.**
  Hosts are now matched on `node` running `dsh/lib/bin.js`, by argument.

## 5. Not run, and why

- **The live DeepSeek model:** no `DEEPSEEK_API_KEY` here.
- **The orchestrator's `docker compose up` with the chat.** The compose, nginx,
  `start.sh` and smoke changes were checked with `docker compose config`, a
  sign-and-verify of the key pair `start.sh` writes, and the smoke test's chat
  probes against the stack above. A full image build waits on `deps.json`
  pinning an `app-with-ai-rust` commit that contains `chat-deepseek/`, which
  exists once that repository's pull request merges.
