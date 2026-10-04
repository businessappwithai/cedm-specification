# The business chat

Every application this generator writes ships with this chat, in its `chat/`
directory. A person signs in once, with their account in the application, and
from then on works in plain language. The chat finds records, runs the
business's reports, and opens the application's **own screens inside the
conversation**, where the person creates, edits and approves. The same sign-in
reaches the reporting platform, whose reports open in the conversation too.

It is a [DeepSeek Harness](https://www.npmjs.com/package/@deepseek-ai/dsh)
composition, pinned to **0.2.0-rc.2** exactly. A gateway in front of it owns
everything Harness should not: who the person is, what they may reach, and
the credentials that reach it.

```
browser ─► nginx ─► /chat/ ─► gateway (Bun)  ──────────► one Harness host per person
                │               Better Auth sessions        127.0.0.1 only, its own home,
                │               single sign-on broker       the business composition:
                │               view ids, refs               four reads, four screen openers,
                │               host manager, proxy          the skills — nothing else
                │                     ▲                            │ tool calls
                │                     └────────────────────────────┘
                │               tools run here, as the person, against:
                ├─► /        the application (Loco backend + TanStack Start, ?embed=1 in a card)
                └─► /report  the reporting platform (embed routes, assertion sign-in)
```

## What the person can do

| Ask | What happens |
|---|---|
| "Find the open opportunities for Acme" | `search_records`, as the person, through the application's own three access gates |
| "What state is that deal in?" | `get_record_summary`: fields, status, whether the status is final, the moves allowed from it |
| "Open it" / "I want to change the amount" | `open_record` / `open_update_form`: the application's screen, in a card |
| "Create a new support case" | `open_create_form`: the application's empty form, in a card |
| "Approve it" | `request_approval`: the record at its lifecycle bar with that move preselected; the person presses it |
| "Which accounts grew most this quarter?" | `search_reports`, then `run_approved_report`: a paged table, a chart where the report defines one |

**The model never writes a record.** It has no tool that writes. A save
happens in the embedded screen, under the application's validation, rules,
permissions and optimistic locking. If someone else saved first, the screen
shows the conflict dialog: refresh to their version, or overwrite. The save
reaches the conversation as an `[Application]` event only after the gateway has
read the record back. Until then the assistant may say the form is open, and
not that anything was saved.

## Sign-in: the chat is the broker, both applications keep their own

1. The person signs in at `/chat/_/sign-in` with their **application**
   account. The gateway checks it against the application's
   `POST /api/auth/login`, opens its own Better Auth session
   (`chat.session_token`), and relays the application's session cookie, so the
   embedded screens are signed in. Sign-in is rate-limited per client address.
2. For the reporting platform, the gateway signs a **60-second Ed25519
   assertion** with `SSO_SIGNING_KEY`: `iss`, `aud: "report"`, the person's
   email and roles, a single-use `jti`. The platform's
   `POST /api/auth/assertion` verifies it against `SSO_PUBLIC_KEY`. It refuses
   any lifetime over 120 seconds, any replayed `jti`, and any deactivated
   account. It then opens the platform's own session, matching the person's
   roles by name to the reporting roles the pack created from the same
   `rbac`, and re-syncs them on every sign-in.
3. Signing out of the chat ends all three sessions.

**The model never sees** a token, a cookie, a raw URL, an id or SQL. Records
reach it as opaque `ref`s issued to that person. A screen is a **view id**:
it lasts `CHAT_VIEW_TTL_SECONDS` (600 by default), and is checked against
its owner and re-authorised with the application every time it is opened. A
card whose view has expired offers **Re-open**, which mints a new one after
the same checks.

## The composition

`profile/business.patch.yml` is applied to every host as the last `--patch`
layer, so nothing on disk can widen it. It disables every row that leaves the
business surface:

- shells and subprocesses;
- the sandbox and terminals;
- workspace files and uploads;
- web fetch and search;
- MCP;
- programmatic tool calling;
- sub-agents and workflows;
- the plugin manager;
- other model providers;
- telemetry.

It inserts one agent preset, `business`, whose tools are this package's eight
and `skill`. `bun run test:composition` composes the patch over the shipped
bundles and **fails on any enabled package outside `ALLOWED_PACKAGES`**. It
then boots a host and checks the agent's tool catalog.

The gateway proxies a host's HTTP and WebSocket surface to its owner only, and
filters it by endpoint, not merely by route. Harness's mux socket can open any
endpoint, so every `open` frame goes through the same allowlist
(`checkMuxFrame`). `settings` is read-only (`describe`), because a settings
write could repoint the DeepSeek base URL that the server's key is sent to.

## Skills

`skills/` holds nine skills on working *in* an application:

- using it;
- finding, creating and updating records, and conflicts;
- workflows and approvals;
- reports;
- charts and dashboards;
- roles and access;
- asking questions in plain language.

The generator adds a tenth for each project, `skills/<project>-domain/SKILL.md`.
It is written from the compiled model, so the assistant's vocabulary is the
application's own: every record type with its help text, its fields and its
line items; every value list and what each value means; every lifecycle,
listing its moves, its final states and who may make each move; the roles and
what each may read; and the reports the business asked for. `AGENTS.md` holds
the operating rules, which no skill overrides.

## Memory: what one person costs, measured

There is no model on the server: DeepSeek runs the model, so memory here is
processes, and **the term that scales is one Harness host per signed-in
person.** `bun run load` (`tests/load/host-memory.ts`) measures it. It signs
real accounts in through the real gateway, which starts each person's host,
and has each person ask questions. Each question makes a real
`search_records` call, through the gateway and the application, as that
person. The model is the one thing scripted: its words are canned, its tool
call is not. RSS and PSS are read from `/proc` per host process.

**PSS** divides each shared page among the processes sharing it. Summed over
hosts, it is what they take from the machine, and it is the figure to plan
capacity with. RSS counts shared pages in every process and overstates the
total.

Measured on 2026-10-04, on a 16 GB, 4-core Linux machine, CRM model, role
*Sales Rep*, `CHAT_HOST_HEAP_MB=256`:

| hosts | turns each | phase | per host PSS | per host RSS | all hosts PSS | gateway RSS |
|---:|---:|---|---:|---:|---:|---:|
| 1 | 0 | idle | 108.6 MB | 134.2 MB | 108.6 MB | 93.8 MB |
| 1 | 1 | after the turn | 125.1 MB | 153.6 MB | 125.1 MB | 94.4 MB |
| 10 | 0 | idle | 73.4 MB | 120.7 MB | 734.2 MB | 98.3 MB |
| 10 | 1 | after the turn | 87.8 MB | 141.0 MB | 877.7 MB | 112.9 MB |
| 25 | 0 | idle | 65.2 MB | 117.3 MB | 1,630.8 MB | 107.2 MB |
| 25 | 1 | after the turn | 74.6 MB | 130.8 MB | 1,864.5 MB | 131.0 MB |
| 40 | 0 | idle | 67.0 MB | 121.5 MB | 2,681.1 MB | 111.2 MB |
| 40 | 1 | after the turn | 72.2 MB | 129.3 MB | 2,888.4 MB | 134.4 MB |
| 10 | 10 | after ten turns | 94.4 MB | 147.7 MB | 943.8 MB | 109.9 MB |

The last row is a separate run from a fresh gateway: ten people, each asking ten
questions in one conversation, every question a real tool call.

Two things the table shows:

- **A host shares most of itself.** At 40 hosts, a host's own share (PSS) is
  72 MB against 129 MB resident. The runtime's code pages are mapped once and
  shared, so the per-host cost falls as hosts are added, and levels off at
  about 70–75 MB from 25 hosts on.
- **The gateway is not the cost.** It held 134 MB with 40 people signed in and
  streaming.

### 200 people

A host grows with its conversation. At 10 hosts, nine more turns each added
6.6 MB of PSS: **about 0.7 MB a turn**. That is a lower bound. The scripted
answers are a sentence long and each search returns five rows, while a real
DeepSeek answer, and a report preview of twenty rows, is longer.

Scaled from the measurements:

| | per host | 200 hosts |
|---|---:|---:|
| Measured floor: short conversations (72–94 MB PSS from 25 hosts on) | ~75–95 MB | **~15–19 GB** |
| Long conversations: 50 turns at a measured 0.7 MB, with headroom for real answers (×3) | ~200 MB | ~40 GB |
| Ceiling: every host at its 256 MB heap cap, plus its ~70 MB not on the heap | ~330 MB | ~65 GB |

The rest of the server holds the following:

- the gateway: 134 MB at 40 people, about 0.5 GB allowed for 200;
- the two Loco backends and their front ends: about 1 GB;
- PostgreSQL with 200 connections: 2–4 GB;
- the operating system and page cache: about 4 GB.

So **200 people active at once fit in 32 GB**, with room for most of them to
hold long conversations. **64 GB** is for every one of them sitting at the
heap ceiling at the same time, and a host stops there by design. That is
lower than the 40–70 GB estimated before anything was measured: the runtime
shares far more between hosts than an estimate per process assumed.

Two limits on what this shows:

- **It was measured up to 40 hosts.** That is what a 16 GB machine holds with
  the rest of the stack beside it. The 200 column assumes the per-host cost
  stays where it settled from 25 hosts on; it was falling, not rising, as
  hosts were added.
- **Only the model is scripted.** DeepSeek's own latency does not change the
  memory a host holds; a longer answer does, and that is the ×3 above.

Run `bun run load` on the server that will carry it before relying on any of
this. The script refuses to start a step with less than `--min-available-mb`
free.

### The three controls

- **`CHAT_HOST_IDLE_MINUTES`** (30). A host with no traffic for that long is
  stopped, and its session log stays on disk. The next message starts it
  again in about a second. Signed-in people are rarely all active, and an
  idle one costs nothing.
- **`CHAT_HOST_HEAP_MB`** (256). The heap ceiling given to each host's Node.
  One runaway conversation fails its own host, which restarts, rather than
  the machine.
- **`CHAT_MAX_HOSTS`** (0 means derived). At most this many hosts run at
  once. The next person waits, with a stated position, rather than pushing the
  machine into swap. The default is three quarters of the machine's memory
  divided by the larger of `MEASURED_HOST_RSS_MB` (`gateway/hosts.ts`) and 90%
  of the heap ceiling, so it is sized from what a host was measured to cost.

## Running it

In a generated project, `docker compose up` starts the chat with everything
else, behind nginx on one origin: the application at `/`, the chat at
`/chat/`. In the orchestrator (`app-and-report-with-ai-rust`), `./start.sh`
generates `CHAT_AUTH_SECRET` and the `SSO_SIGNING_KEY` / `SSO_PUBLIC_KEY` pair
once, and serves the chat at `/chat` beside `/app` and `/report`.

Natively, with the application and the reporting platform running:

```bash
bun install
cp .env.example .env      # in a generated project; fill CHAT_AUTH_SECRET,
                          # SSO_SIGNING_KEY and DEEPSEEK_API_KEY
bun gateway/server.ts     # :3100, under CHAT_BASE_PATH (/chat)
```

Every variable `gateway/config.ts` reads is in a generated project's
`.env.example`, with that project's ports filled in. Three of them must never
change once set:

- `CHAT_AUTH_SECRET` — changing it ends every chat session;
- `SSO_SIGNING_KEY` — replacing it without its `SSO_PUBLIC_KEY` makes every
  reporting sign-in a bad signature;
- `CHAT_DATABASE_URL` — this must be a database **of its own**, never the
  application's: the reporting platform reads every schema of the database it
  reports on, so chat sessions stored there would become reportable rows. The
  gateway creates the database on first start when it is missing.

Hosts need Node 22.19 or later (`CHAT_NODE_BIN`). The image installs it.

## Tests

```bash
bun run type-check
bun run test                 # unit: config, cookies, crypto, the proxy's filters
bun run test:composition     # the composition gate — no package outside the allowlist
```

Against a running stack (application, reporting platform, the gateway behind
nginx with `CHAT_TRUST_PROXY=1`, and `DEEPSEEK_BASE_URL` pointed at
`tests/support/messages-recorder.ts`):

```bash
bun test tests/security      # the gateway's refusals, and the platform's half of sign-on
bun test tests/e2e --timeout 180000
bun run load -- --app-db postgres://…/<app>_development --steps 1,10,25,40
```

`tests/security/gateway.test.ts` covers the refusals:

- every route and stream refused without a session;
- one person's view id is a 404 for another;
- the mux and settings filters;
- `Origin` and `Host` checks;
- hosts unreachable from outside loopback.

`tests/security/reporting-assertion.test.ts` signs with the gateway's own
`signAssertion` and covers:

- replay, a foreign key, an edited payload, expiry, audience and a
  deactivated account, each refused;
- role sync.

The end-to-end suite drives Chromium through the following:

- sign in once;
- open a record from the conversation;
- save it in the embedded form, and see the `[Application]` event;
- the conflict dialog inside the chat;
- a report in a card;
- the reporting page embedded, with no second sign-in.

**Only the model's words are scripted.** A run against the live DeepSeek
model needs `DEEPSEEK_API_KEY`. Where there is none, it is reported as not
run, never imitated.
