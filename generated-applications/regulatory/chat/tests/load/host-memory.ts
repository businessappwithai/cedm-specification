#!/usr/bin/env bun
/**
 * What one signed-in person's Harness host costs in memory, measured.
 *
 *   bun tests/load/host-memory.ts \
 *     --gateway http://localhost:3100/chat --origin http://localhost:8080 \
 *     --app-api http://localhost:3000/api --app-db postgres://…/crm_development \
 *     --role "Sales Rep" --steps 1,10,25,40 [--turns 1] [--out results.json]
 *
 * The gateway must be running with `CHAT_TRUST_PROXY=1` and `DEEPSEEK_BASE_URL`
 * pointing at `--recorder-port` (default 3997): this script plays the reverse
 * proxy (one `X-Forwarded-For` per person, so the per-address sign-in limit
 * applies to each person, as it would in production) and the model endpoint.
 *
 * For each step it adds people until that many hosts are running, then measures
 * twice: **idle** (host started, page loaded, nothing asked) and **after a
 * turn** (each new person asks one question; the scripted model makes one
 * `search_records` call, which runs for real through the gateway and the
 * application as that person, then answers). Everything is real except the
 * model's words.
 *
 * Two figures per host, both from `/proc`:
 * - **RSS** — resident memory, counting shared pages in every process that maps
 *   them. What `top` shows; overstates the total.
 * - **PSS** — each shared page divided among the processes sharing it. Summed
 *   over hosts it is what they actually take from the machine, which is the
 *   figure to plan capacity with.
 *
 * Accounts are created through the application's own registration, then given
 * the dictionary identity and `--role` exactly as `seed_access` gives a declared
 * role's account, so their tool calls are permitted ones.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import pg from "pg";
import { startMessagesRecorder } from "../support/messages-recorder";

const arg = (name: string, fallback?: string) => {
  const at = process.argv.indexOf(`--${name}`);
  const value = at >= 0 ? process.argv[at + 1] : undefined;
  if (value === undefined && fallback === undefined) throw new Error(`--${name} is required`);
  return value ?? fallback!;
};

const GATEWAY = arg("gateway", "http://localhost:3100/chat");
const ORIGIN = arg("origin", "http://localhost:8080");
const APP_API = arg("app-api", "http://localhost:3000/api");
const APP_DB = arg("app-db");
const ROLE = arg("role", "Sales Rep");
const STEPS = arg("steps", "1,10,25,40").split(",").map(Number);
/** Turns each new person takes in one conversation; the context a host holds grows with it. */
const TURNS = Number(arg("turns", "1"));
const RECORDER_PORT = Number(arg("recorder-port", "3997"));
const OUT = process.argv.includes("--out") ? arg("out") : null;
const MIN_AVAILABLE_MB = Number(arg("min-available-mb", "2048"));
const PASSWORD = "load-test-password";
const run = Date.now().toString(36);

const recorder = startMessagesRecorder(RECORDER_PORT, {
  toolCall: (request) =>
    request.toolNames.length > 0 && request.turnResults.length === 0
      ? { name: "search_records", input: { entity: "Account", pageSize: 5 } }
      : null,
  text: (request) => `There are ${request.turnResults.length ? "some" : "no"} accounts.`,
});

// ── /proc ─────────────────────────────────────────────────────────────────────

function kb(text: string, field: string): number {
  const match = new RegExp(`^${field}:\\s+(\\d+) kB`, "m").exec(text);
  return match ? Number(match[1]) : 0;
}

/**
 * A Harness host is `node …/dsh/lib/bin.js`: matched on the program and its
 * script argument, never on a substring of the whole command line — a shell
 * whose command merely mentions the path is not a host.
 */
function isHost(argv: string[]): boolean {
  return /(^|\/)node$/.test(argv[0] ?? "") && argv.slice(1).some((part) => part.endsWith("dsh/lib/bin.js"));
}

/** Every running Harness host process, with its RSS and PSS in MB. */
function hostProcesses(): Array<{ pid: number; rssMb: number; pssMb: number }> {
  const found: Array<{ pid: number; rssMb: number; pssMb: number }> = [];
  for (const entry of readdirSync("/proc")) {
    if (!/^\d+$/.test(entry)) continue;
    try {
      if (!isHost(readFileSync(`/proc/${entry}/cmdline`, "utf8").split("\0"))) continue;
      const rollup = readFileSync(`/proc/${entry}/smaps_rollup`, "utf8");
      found.push({ pid: Number(entry), rssMb: kb(rollup, "Rss") / 1024, pssMb: kb(rollup, "Pss") / 1024 });
    } catch {
      // Gone between the listing and the read.
    }
  }
  return found;
}

function processRssMb(match: (cmdline: string) => boolean): number {
  let total = 0;
  for (const entry of readdirSync("/proc")) {
    if (!/^\d+$/.test(entry)) continue;
    try {
      if (!match(readFileSync(`/proc/${entry}/cmdline`, "utf8").replaceAll("\0", " "))) continue;
      total += kb(readFileSync(`/proc/${entry}/status`, "utf8"), "VmRSS") / 1024;
    } catch {}
  }
  return total;
}

function availableMb(): number {
  return kb(readFileSync("/proc/meminfo", "utf8"), "MemAvailable") / 1024;
}

// ── one person ────────────────────────────────────────────────────────────────

interface Person {
  index: number;
  email: string;
  cookie: string;
  address: string;
}

async function createAccount(db: pg.Client, index: number): Promise<string> {
  const email = `load.${run}.${index}@load.example.com`;
  const name = `Load ${index}`;
  // The application hashes the password: registration is its own credential path.
  // Registration is rate-limited, as it should be; wait out a refusal for as
  // long as the application says rather than treating it as a failure.
  let registered: Response;
  for (;;) {
    registered = await fetch(`${APP_API}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: PASSWORD, name }),
    });
    if (registered.status !== 429) break;
    const wait = Number(registered.headers.get("retry-after") ?? "1");
    await Bun.sleep((Number.isFinite(wait) && wait > 0 ? wait : 1) * 1000 + 250);
  }
  if (!registered.ok) throw new Error(`register ${email}: ${registered.status} ${await registered.text()}`);
  // Registration writes only the credential (`users`). What a role hangs off is
  // the dictionary identity (`sys_user`), linked by `users.sys_user_id` — the
  // same three writes `seed_access` makes for a declared role's account.
  const identity = await db.query<{ sys_user_id: string }>(
    `INSERT INTO sys_user (
            sys_user_id, name, email, password_hash, description,
            is_system_user, is_sales_rep, login_failure_count, is_locked,
            is_account_verified, default_sys_role_id,
            entity_type, is_active, created_by, updated_by, created_at, updated_at)
       SELECT gen_random_uuid(), $1, $2, '!', 'Load test account',
              FALSE, FALSE, 0, FALSE, TRUE, r.sys_role_id,
              'D', TRUE, 'system', 'system', NOW(), NOW()
         FROM sys_role r WHERE lower(r.name) = lower($3)
     RETURNING sys_user_id`,
    [name, email, ROLE]
  );
  const sysUserId = identity.rows[0]?.sys_user_id;
  if (!sysUserId) throw new Error(`no role named ${ROLE} in the application`);
  await db.query(
    `INSERT INTO sys_user_roles (
            sys_user_roles_id, sys_user_id, sys_role_id,
            entity_type, is_active, created_by, updated_by, created_at, updated_at)
       SELECT gen_random_uuid(), $1, r.sys_role_id, 'D', TRUE, 'system', 'system', NOW(), NOW()
         FROM sys_role r WHERE lower(r.name) = lower($2)`,
    [sysUserId, ROLE]
  );
  const linked = await db.query(`UPDATE users SET sys_user_id = $1 WHERE lower(email) = lower($2)`, [
    sysUserId,
    email,
  ]);
  if (linked.rowCount !== 1) throw new Error(`registration left no credential row for ${email}`);
  return email;
}

async function rpc(person: Person, method: string, args: Record<string, unknown>): Promise<string> {
  const response = await fetch(`${GATEWAY}/api/${method}`, {
    method: "POST",
    headers: {
      cookie: person.cookie,
      origin: ORIGIN,
      "content-type": "application/json",
      "x-forwarded-for": person.address,
    },
    body: JSON.stringify({ type: "client-request", rpcId: crypto.randomUUID(), method, payload: { args } }),
  });
  const text = await response.text();
  if (!response.ok || text.includes('"ok":false')) throw new Error(`${method}: ${response.status} ${text.slice(0, 300)}`);
  return text;
}

async function signIn(db: pg.Client, index: number): Promise<Person> {
  const email = await createAccount(db, index);
  const address = `10.${100 + Math.floor(index / 250)}.${index % 250}.${(index % 7) + 1}`;
  const response = await fetch(`${GATEWAY}/_/auth/sign-in/application`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN, "x-forwarded-for": address },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!response.ok) throw new Error(`sign-in ${email}: ${response.status} ${await response.text()}`);
  const cookie = response.headers
    .getSetCookie()
    .map((header) => header.split(";")[0])
    .filter((pair) => pair?.startsWith("chat."))
    .join("; ");
  const person = { index, email, cookie, address };
  // The page load is what starts the person's host.
  const page = await fetch(`${GATEWAY}/`, { headers: { cookie, "x-forwarded-for": address } });
  if (page.status !== 200) throw new Error(`chat page for ${email}: ${page.status}`);
  return person;
}

/** A conversation of `TURNS` questions, one at a time, as a person asks them. */
const QUESTIONS = [
  "How many accounts do we have?",
  "Which of them were updated most recently?",
  "Show me the accounts in the technology industry.",
  "What does an account's status mean here?",
  "Which reports are about accounts?",
];

async function startConversation(person: Person): Promise<string> {
  const workspace = await rpc(person, "workspace/initializeDefault", {});
  const workspaceId = /"workspaceId":"([^"]+)"/.exec(workspace)?.[1];
  if (!workspaceId) throw new Error(`no workspace for ${person.email}: ${workspace.slice(0, 200)}`);
  const session = await rpc(person, "session/create", { request: { workspaceId } });
  const sessionId = /"(session-[0-9a-f-]{36})"/.exec(session)?.[1];
  if (!sessionId) throw new Error(`no session for ${person.email}: ${session.slice(0, 200)}`);
  return sessionId;
}

async function ask(person: Person, sessionId: string, turn: number): Promise<void> {
  await rpc(person, "session/prompt", {
    request: {
      requestId: crypto.randomUUID(),
      sessionId,
      mode: "queue",
      content: [{ type: "text", text: QUESTIONS[turn % QUESTIONS.length] ?? QUESTIONS[0] }],
      clientTimeZone: "UTC",
    },
  });
}

async function waitForTurns(expectedRequests: number): Promise<void> {
  const deadline = Date.now() + 180_000;
  while (recorder.requests.length < expectedRequests) {
    if (Date.now() > deadline) {
      throw new Error(`model saw ${recorder.requests.length} requests, expected ${expectedRequests}`);
    }
    await Bun.sleep(250);
  }
  // Let session writes and the closing stream settle before measuring.
  await Bun.sleep(3000);
}

// ── measure ───────────────────────────────────────────────────────────────────

interface Sample {
  hosts: number;
  /** Turns each host's conversation held when this was taken. */
  turns: number;
  phase: "idle" | "after-turn";
  totalRssMb: number;
  totalPssMb: number;
  perHostRssMb: number;
  perHostPssMb: number;
  gatewayRssMb: number;
  availableMb: number;
}

function sample(phase: Sample["phase"]): Sample {
  const hosts = hostProcesses();
  const totalRss = hosts.reduce((sum, host) => sum + host.rssMb, 0);
  const totalPss = hosts.reduce((sum, host) => sum + host.pssMb, 0);
  const round = (value: number) => Math.round(value * 10) / 10;
  return {
    hosts: hosts.length,
    turns: phase === "idle" ? 0 : TURNS,
    phase,
    totalRssMb: round(totalRss),
    totalPssMb: round(totalPss),
    perHostRssMb: round(hosts.length ? totalRss / hosts.length : 0),
    perHostPssMb: round(hosts.length ? totalPss / hosts.length : 0),
    gatewayRssMb: round(processRssMb((cmd) => cmd.startsWith("bun gateway/server.ts"))),
    availableMb: Math.round(availableMb()),
  };
}

const db = new pg.Client({ connectionString: APP_DB });
await db.connect();
const people: Person[] = [];
const samples: Sample[] = [];
let stoppedBecause: string | null = null;

try {
  const baseline = hostProcesses().length;
  if (baseline > 0) throw new Error(`${baseline} hosts are already running; start from a fresh gateway`);
  for (const target of STEPS) {
    if (availableMb() < MIN_AVAILABLE_MB) {
      stoppedBecause = `${Math.round(availableMb())} MB available before step ${target}, below --min-available-mb`;
      break;
    }
    const added: Person[] = [];
    while (people.length < target) {
      const person = await signIn(db, people.length);
      people.push(person);
      added.push(person);
    }
    await Bun.sleep(5000);
    samples.push(sample("idle"));
    console.log(JSON.stringify(samples.at(-1)));
    // Every new person asks in step: each turn is one tool call and one answer,
    // so it is two model requests per person, and the next question waits for
    // all of them — a turn queued behind an unfinished one would measure
    // nothing new.
    const sessions = await Promise.all(added.map((person) => startConversation(person)));
    for (let turn = 0; turn < TURNS; turn++) {
      const before = recorder.requests.length;
      await Promise.all(added.map((person, index) => ask(person, sessions[index] ?? "", turn)));
      await waitForTurns(before + added.length * 2);
    }
    samples.push(sample("after-turn"));
    console.log(JSON.stringify(samples.at(-1)));
  }
} catch (error) {
  stoppedBecause = `failed: ${error instanceof Error ? error.message : String(error)}`;
  console.error(stoppedBecause);
} finally {
  const pattern = `load.${run}.%`;
  await db.query(
    `DELETE FROM sys_user_roles WHERE sys_user_id IN (SELECT sys_user_id FROM sys_user WHERE email LIKE $1)`,
    [pattern]
  );
  await db.query(`DELETE FROM users WHERE email LIKE $1`, [pattern]);
  await db.query(`DELETE FROM sys_user WHERE email LIKE $1`, [pattern]);
  await db.end();
  recorder.stop();
}

const afterTurn = samples.filter((s) => s.phase === "after-turn");
const largest = afterTurn.at(-1);
const summary = {
  measuredAt: new Date().toISOString(),
  machine: { totalMb: Math.round(kb(readFileSync("/proc/meminfo", "utf8"), "MemTotal") / 1024) },
  samples,
  stoppedBecause,
  perHostPssMbAtLargest: largest?.perHostPssMb ?? null,
  perHostRssMbAtLargest: largest?.perHostRssMb ?? null,
};
if (OUT) writeFileSync(OUT, `${JSON.stringify(summary, null, 2)}\n`);
console.log(
  "\n| hosts | turns | phase | per host PSS | per host RSS | all hosts PSS | gateway RSS |\n|---:|---:|---|---:|---:|---:|---:|\n" +
    samples
      .map((s) => `| ${s.hosts} | ${s.turns} | ${s.phase} | ${s.perHostPssMb} MB | ${s.perHostRssMb} MB | ${s.totalPssMb} MB | ${s.gatewayRssMb} MB |`)
      .join("\n")
);
if (stoppedBecause) console.log(`\nstopped: ${stoppedBecause}`);
if (stoppedBecause?.startsWith("failed")) process.exit(1);
