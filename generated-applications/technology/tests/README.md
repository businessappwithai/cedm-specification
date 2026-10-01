# technology — End-to-End Tests

Bun-native end-to-end tests for the generated application. Everything here runs
on `bun:test` — there is no Playwright, Jest or Vitest in this directory.

The suites drive the application through its **HTTP API**, the same surface the
generated frontend uses: they sign in with a real session cookie, exercise CRUD
for every entity, register business rules and prove they fire, and follow the
rule → workflow → cross-entity write chain.

---

## Running

```bash
# From the project root — generates nothing, just runs
bun run test:e2e
```

or from this directory:

```bash
bun install
bun run test          # everything, in order (starts the backend for you)
bun run test:fast     # skip the 1000-record bulk seed
bun run test:attach   # attach to a backend you already started
```

Target one group:

```bash
bun run test:crud
bun run test:rules
bun run test:workflows
bun run test:users
```

The volume suite is opt-in — it drives a real browser through 100,000 records
and takes minutes:

```bash
bun run test:browser-volume              # 100,000 records on one entity
E2E_BROWSER_RECORDS=2000 bun run test:browser-volume   # a quick version
bun run run.ts --browser-volume          # in sequence with everything else
```

Or a single file:

```bash
bun test suites/01-auth.test.ts
```

### Prerequisites

The database must be migrated and seeded — the suites sign in as the seeded
administrator and assume the Application Dictionary is populated:

```bash
cd ../backend && bun run db:setup
```

The runner starts the backend itself unless one is already listening on the
configured port.

---

## Layout

```
tests/
├── run.ts              # Orchestrator — starts the app, runs suites in order
├── harness/            # Shared machinery, no tests
│   ├── config.ts       # Env-driven configuration
│   ├── browser.ts      # Chromium lifecycle + login, for the volume suite
│   ├── http.ts         # fetch client + cookie jar (keeps the session)
│   ├── auth.ts         # login / register / permissions
│   ├── server.ts       # start + health-poll the backend
│   ├── entities.ts     # Entity registry generated from the ERD
│   ├── factory.ts      # Faker record factory
│   ├── rules.ts        # JDM builders + rules API
│   ├── workflows.ts    # Workflow run polling
│   └── harness.ts      # The controller: setup, tracking, teardown
└── suites/             # One file per functional area
    ├── 00-health.test.ts
    ├── 01-auth.test.ts
    ├── 02-dictionary.test.ts
    ├── 03-crud.<entity>.test.ts     (one per entity)
    ├── 04-bulk-seed.test.ts
    ├── 05-rules.<entity>.test.ts    (one per entity)
    ├── 06-rules-workflow.test.ts
    ├── 07-workflow-random.test.ts
    ├── 08-users-roles.test.ts
    └── 09-browser-volume.test.ts    (opt-in; not in the default run)
```

Suites run in filename order because they build on each other: the bulk seed
populates the tables the rules and workflow suites then operate on.

---

## The harness

Every suite calls the same shared harness:

```ts
import { harness, getEntity, buildRecord } from "../harness";

beforeAll(async () => { await harness.setup(); });   // wait for server + login
afterAll(async () => { await harness.teardown(); }); // delete what we created
```

`harness.setup()` is idempotent per process. `harness.createWithParents(entity)`
creates a record and, when the entity has foreign keys, creates or reuses the
parent records first — so a suite never has to know the shape of the ERD.

Anything created through the harness is tracked and removed on teardown, in
reverse order so children go before parents. The bulk-seed suite deliberately
opts out: its volume data is left behind for the suites that follow.

---

## What each suite covers

| Suite | Covers |
|-------|--------|
| `00-health` | Server reachable, health endpoint, protected routes reject anonymous callers |
| `01-auth` | Sign-in as the seeded admin, session persistence, bad credentials, registration, sign-out |
| `02-dictionary` | Every ERD column registered in `sys_column`; form and grid field ordering |
| `03-crud.<entity>` | List, create, read, update (PATCH + PUT), version bump, validation rejection, 404s, sort, search, filter, soft delete |
| `04-bulk-seed` | 1000+ faker records per entity, parents first; totals and pagination at volume |
| `05-rules.<entity>` | JDM built and validated, rule registered, valid records pass, invalid records prevented, dry-run has no side effects, deactivation stops enforcement |
| `06-rules-workflow` | `trigger-workflow` actions emitted and workflow runs enqueued, reaching a terminal state |
| `07-workflow-random` | Randomised creates/updates across random entities with cascade rules; no 5xx, no stuck runs, records stay readable |
| `08-users-roles` | Seeded roles, faker-registered users at volume, permission scoping, admin-only route enforcement |
| `09-browser-volume` | 100,000 records created, listed, deep-paginated, filtered, rendered in the grid, sampled for read/update latency and deleted — all inside a Chromium page signed in through the login form. Prints a performance summary. Opt-in. |

---

## Configuration

Every knob is an environment variable — see `harness/config.ts`.

| Variable | Default | Purpose |
|----------|---------|---------|
| `E2E_BASE_URL` | `http://localhost:3000` | Backend under test |
| `E2E_ORIGIN` | `http://localhost:3001` | Origin header (CORS + better-auth) |
| `E2E_ADMIN_EMAIL` | `admin@admin.com` | Seeded administrator |
| `E2E_ADMIN_PASSWORD` | `administrator` | Seeded administrator password |
| `E2E_RECORDS_PER_ENTITY` | `1000` | Bulk-seed volume per entity |
| `E2E_SEED_BATCH_SIZE` | `25` | Concurrent inserts per batch |
| `E2E_USERS_TO_CREATE` | `25` | Users registered by the users suite |
| `E2E_RANDOM_WORKFLOW_OPS` | `50` | Random operations in the chaos suite |
| `E2E_FAKER_SEED` | `20260731` | Fixed so failures reproduce exactly |
| `E2E_WORKFLOW_TIMEOUT_MS` | `20000` | How long to wait for a workflow run |
| `E2E_VERBOSE` | unset | `1` logs every HTTP request |
| `E2E_BROWSER_RECORDS` | `100000` | Records the volume suite creates and then deletes |
| `E2E_BROWSER_WRITE_BATCH` | `500` | Writes per round trip into the page |
| `E2E_BROWSER_CONCURRENCY` | `16` | Requests in flight inside the page |
| `E2E_BROWSER_SAMPLE` | `200` | Records sampled for per-operation latency |
| `E2E_VOLUME_ENTITY` | auto | Entity the volume suite loads up; defaults to the widest one with no required parents |
| `E2E_CHROMIUM_PATH` | unset | Use an already-installed Chromium instead of playwright's own |
| `E2E_HEADED` | unset | `1` shows the browser |

Lower the volume for a quick local run:

```bash
E2E_RECORDS_PER_ENTITY=25 bun run test
```

---

## Reproducing a failure

The faker seed is fixed, so a failing bulk or chaos run replays identically.
Re-run the single suite that failed with verbose logging:

```bash
E2E_VERBOSE=1 bun test suites/07-workflow-random.test.ts
```

To replay with a different data set, change `E2E_FAKER_SEED`.
