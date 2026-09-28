/**
 * Node-vs-Rust response parity (MIGRATION_PLAN.md §8).
 *
 *   NODE_URL=http://localhost:4050 RUST_URL=http://localhost:5150 \
 *   PARITY_ADMIN_PASSWORD=… bun rust/parity/run.ts [filter]
 *
 * Signs in once per identity through Better Auth on the Node service; the
 * cookie is valid on both backends. Each case in cases.json is sent to both,
 * and the status code and JSON body must be equal after removing the paths
 * the case lists under `ignore`. Exits 1 on any mismatch.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

type Case = {
  name: string;
  path: string;
  method?: string;
  body?: unknown;
  as?: "admin" | "analyst" | "none";
  ignore?: string[];
  /** A difference MIGRATION_PLAN.md §9 documents (e.g. "D-4"): reported, not failed. */
  known?: string;
  /** SQL run before EACH backend's request, so both start from the same state. */
  reset?: string[];
  /** SQL run after each request; its rows are compared too (write cases). */
  check?: string;
  /** SQL run once after the case, to leave the fixture as it was. */
  cleanup?: string[];
  /**
   * For a route only Rust has (a server function's REST twin): no Node call;
   * the Rust response must equal this (after `ignore`) and `check` rows must
   * equal `expectRows`.
   */
  expect?: { status: number; body: unknown };
  expectRows?: unknown[];
};

const NODE_URL = process.env.NODE_URL ?? "http://localhost:4050";
const RUST_URL = process.env.RUST_URL ?? "http://localhost:5150";
const filter = process.argv[2];
const { cases } = JSON.parse(readFileSync(join(import.meta.dir, "cases.json"), "utf8")) as { cases: Case[] };

async function signIn(email: string, password: string): Promise<string> {
  const res = await fetch(`${NODE_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: NODE_URL },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`sign-in as ${email} failed: ${res.status} ${await res.text()}`);
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .find((c) => /^(__Secure-)?ers\.session_token=/.test(c));
  if (!cookie) throw new Error(`sign-in as ${email} set no ers.session_token cookie`);
  return cookie;
}

// A Node dev server started with ERS_RUST_API_URL proxies the ported routes
// to Rust, and the suite would then compare Rust with itself — and pass.
const guard = await fetch(`${NODE_URL}/api/health`);
if (guard.headers.get("x-ers-backend")) {
  console.error(
    `${NODE_URL} is answering from the Rust backend (ERS_RUST_API_URL is set on the Node dev server). ` +
      "Start Node without it to compare the two."
  );
  process.exit(2);
}

const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

/*
 * Sessions are cached between runs (gitignored). Sign-in is rate-limited to
 * 5 a minute — deliberately — so a suite that signed in on every run would
 * lock itself out when run twice in quick succession. A cached cookie is
 * reused only while Node still accepts it.
 */
const cachePath = join(import.meta.dir, ".session-cache.json");
const cached: Record<string, string> = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, "utf8")) : {};
async function session(who: string, email: string, password: string): Promise<string> {
  const c = cached[who];
  if (c) {
    const probe = await fetch(`${NODE_URL}/api/filters`, { headers: { cookie: c } });
    if (probe.status === 200) return c;
  }
  cached[who] = await signIn(email, password);
  writeFileSync(cachePath, JSON.stringify(cached));
  return cached[who];
}

const cookies: Record<string, string | undefined> = {
  admin: await session("admin", "admin@admin.com", process.env.PARITY_ADMIN_PASSWORD ?? "admin-parity-pw"),
  analyst: await session("analyst", "analyst@parity.test", "parity-analyst-pw"),
  none: undefined,
};

function drop(value: unknown, path: string[]): void {
  if (!value || typeof value !== "object" || path.length === 0) return;
  const [head, ...rest] = path;
  const obj = value as Record<string, unknown>;
  if (rest.length === 0) delete obj[head];
  else if (head === "*" && Array.isArray(value)) value.forEach((v) => drop(v, rest));
  else drop(obj[head], rest);
}

async function call(base: string, c: Case) {
  const headers: Record<string, string> = {};
  const cookie = cookies[c.as ?? "admin"];
  if (cookie) headers.cookie = cookie;
  if (c.body !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(base + c.path, {
    method: c.method ?? "GET",
    headers,
    // "__null__" sends a literal JSON null (a key cannot hold undefined vs null).
    body: c.body === undefined ? undefined : c.body === "__null__" ? "null" : JSON.stringify(c.body),
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {}
  for (const p of c.ignore ?? []) drop(body, p.split("."));
  return { status: res.status, body };
}

/** First difference as a path, or null when equal (key order ignored). */
function diff(a: unknown, b: unknown, path = "$"): string | null {
  if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b) || (a === null) !== (b === null)) {
    return `${path}: node=${JSON.stringify(a)?.slice(0, 200)} rust=${JSON.stringify(b)?.slice(0, 200)}`;
  }
  if (a && typeof a === "object") {
    const ak = Object.keys(a as object);
    const bk = Object.keys(b as object);
    for (const k of new Set([...ak, ...bk])) {
      const d = diff((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`);
      if (d) return d;
    }
    return null;
  }
  return a === b ? null : `${path}: node=${JSON.stringify(a)} rust=${JSON.stringify(b)}`;
}

let failed = 0;
let ran = 0;
let documented = 0;
for (const c of cases) {
  if (filter && !c.name.includes(filter)) continue;
  ran++;
  // Sequential, each from the case's reset state; the rows `check` selects
  // are compared alongside the response.
  const run = async (base: string) => {
    for (const sql of c.reset ?? []) await db.query(sql);
    const res = await call(base, c);
    const rows = c.check ? (await db.query(c.check)).rows : undefined;
    return { ...res, rows };
  };
  const n = c.expect ? { ...c.expect, rows: c.expectRows } : await run(NODE_URL);
  const r = await run(RUST_URL);
  for (const sql of c.reset ?? []) await db.query(sql);
  for (const sql of c.cleanup ?? []) await db.query(sql);
  const problem =
    n.status !== r.status
      ? `status node=${n.status} rust=${r.status}`
      : (diff(n.body, r.body) ?? diff(n.rows, r.rows, "$rows"));
  if (problem && c.known) {
    documented++;
    console.log(`~ ${c.name}  (documented difference ${c.known})\n    ${problem}`);
  } else if (problem) {
    failed++;
    console.log(`✗ ${c.name}\n    ${problem}`);
  } else {
    console.log(`✓ ${c.name}${c.expect ? "  (rust-only, vs expected)" : ""}${c.known ? `  (${c.known} no longer differs — update §9)` : ""}`);
  }
}
console.log(`\n${ran - failed - documented}/${ran} identical, ${documented} documented difference(s), ${failed} failure(s)`);
await db.end();
process.exit(failed ? 1 : 0);
