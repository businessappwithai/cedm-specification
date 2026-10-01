/**
 * Test harness configuration.
 *
 * Every knob is env-overridable so the same suites run against a locally
 * started app, a docker-compose stack, or CI.
 *
 * Generated: 2026-10-01T13:57:52.650Z
 * Project: sales
 */

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function str(name: string, fallback: string): string {
  const raw = process.env[name];
  return raw && raw.length > 0 ? raw : fallback;
}

export const config = {
  /** Base URL of the running backend, without a trailing slash. */
  baseUrl: str("E2E_BASE_URL", "http://localhost:3000").replace(/\/+$/, ""),

  /** Prefix applied by `app.setGlobalPrefix('api')` in the backend. */
  apiPrefix: "/api",

  /** Frontend origin — sent as the Origin header so CORS + better-auth accept us. */
  origin: str("E2E_ORIGIN", "http://localhost:3001"),

  /**
   * Seeded administrator. Must match the backend bootstrap in `src/main.ts`,
   * which reads ADMIN_EMAIL / ADMIN_PASSWORD and defaults to these values.
   */
  admin: {
    email: str("E2E_ADMIN_EMAIL", process.env.ADMIN_EMAIL ?? "admin@admin.com"),
    password: str("E2E_ADMIN_PASSWORD", process.env.ADMIN_PASSWORD ?? "admin"),
  },

  /**
   * Records created per entity by the bulk-seed suite.
   *
   * Two presets are wired into the runner:
   *   --small   10   quick smoke run
   *   --full  1000   the full volume run (the default)
   *
   * `--records <n>` or E2E_RECORDS_PER_ENTITY sets an arbitrary value.
   */
  recordsPerEntity: int("E2E_RECORDS_PER_ENTITY", 1000),

  /** Named presets the runner exposes as --small / --full. */
  recordPresets: { small: 10, full: 1000 } as const,

  /** Records written per HTTP batch during bulk seeding. */
  seedBatchSize: int("E2E_SEED_BATCH_SIZE", 25),

  /** Extra users created by the users-and-roles suite. */
  usersToCreate: int("E2E_USERS_TO_CREATE", 25),

  /** How many random workflow-triggering mutations the chaos suite performs. */
  randomWorkflowOps: int("E2E_RANDOM_WORKFLOW_OPS", 50),

  /** Faker seed — fixed so a failing run reproduces exactly. */
  fakerSeed: int("E2E_FAKER_SEED", 20260731),

  /** Seconds to wait for the backend to answer its health check. */
  serverReadyTimeoutMs: int("E2E_SERVER_READY_TIMEOUT_MS", 120_000),

  /** Per-request timeout. */
  requestTimeoutMs: int("E2E_REQUEST_TIMEOUT_MS", 30_000),

  /**
   * Default per-test timeout handed to `bun test --timeout`. bun:test's own
   * default is 5s, which is too tight once the database holds real volume.
   */
  suiteTimeoutMs: int("E2E_SUITE_TIMEOUT_MS", 60_000),

  /** Milliseconds to wait for an async workflow run to reach a terminal state. */
  workflowTimeoutMs: int("E2E_WORKFLOW_TIMEOUT_MS", 20_000),

  /**
   * How many times to wait out a 429 before giving up. The backend throttles to
   * RATE_LIMIT_MAX_PER_MINUTE requests a minute per caller (300 in development),
   * which bulk seeding exceeds; the harness starts it with the limiter off, so
   * this only matters against a backend someone else started.
   */
  throttleRetries: int("E2E_THROTTLE_RETRIES", 12),

  /** Base backoff when a 429 carries no Retry-After header. */
  throttleBackoffMs: int("E2E_THROTTLE_BACKOFF_MS", 2000),

  /** Set E2E_VERBOSE=1 to log every request. */
  verbose: process.env.E2E_VERBOSE === "1",

  /**
   * The browser volume suite (`09-browser-volume`), which is excluded from the
   * default run because it takes minutes.
   *
   * The defaults describe the intended shape of the test — a hundred thousand
   * records on one entity — and every one is overridable so the same suite can
   * be run as a two-minute smoke check in CI.
   */
  browserVolume: {
    /** Records created, manipulated and then deleted. */
    records: int("E2E_BROWSER_RECORDS", 100_000),
    /** Writes issued per round trip into the page. */
    writeBatch: int("E2E_BROWSER_WRITE_BATCH", 500),
    /**
     * Requests in flight inside the page at once.
     *
     * 16, because that is the width the only complete 100,000-record run was
     * measured at: 201 inserts/s and 257 deletes/s, start to finish. An earlier
     * change lowered this to 8 on the reasoning that the browser's per-origin
     * connection limit (6 for HTTP/1.1) makes anything above it pointless. That
     * reasoning did not survive the measurement — inserts were identical at
     * both widths, but the 8-wide run's delete phase ran at 16-25/s and was
     * abandoned. The cause was never isolated (the backend sustained 200
     * deletes/s at width 8 when driven directly, and 130/s through the dev
     * proxy, so it is something about the page rather than the server). Until
     * it is, the value with a passing run behind it wins.
     */
    concurrency: int("E2E_BROWSER_CONCURRENCY", 16),
    /** Records sampled for per-operation read/update latency. */
    sampleSize: int("E2E_BROWSER_SAMPLE", 200),
    /** Starting a dev server and a browser, plus login. */
    setupTimeoutMs: int("E2E_BROWSER_SETUP_TIMEOUT_MS", 300_000),
    /** The insert and delete phases, which are the long ones. */
    insertTimeoutMs: int("E2E_BROWSER_INSERT_TIMEOUT_MS", 3_600_000),
    /** Everything else — list, filter, grid render, sampled CRUD. */
    phaseTimeoutMs: int("E2E_BROWSER_PHASE_TIMEOUT_MS", 300_000),
  },
} as const;

export type TestConfig = typeof config;
