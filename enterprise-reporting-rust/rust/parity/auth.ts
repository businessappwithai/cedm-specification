/**
 * Better Auth parity: `sign-in/email`, `sign-out` and `get-session` on both
 * backends — status, body, `Set-Cookie` (values masked, attributes compared),
 * the headers that matter, and the `auth_sessions` rows each call leaves. It
 * also checks that a session issued by either backend opens the other.
 *
 * Each case uses its own client address (`X-Forwarded-For`), so the per-address
 * rate limit is exercised only where a case means to exercise it.
 *
 *   DATABASE_URL=… AUTH_SECRET=… PARITY_ADMIN_PASSWORD=… bun rust/parity/auth.ts
 */
import { createHmac } from "node:crypto";
import bcrypt from "bcryptjs";
import { Client } from "pg";

const NODE_URL = process.env.NODE_URL ?? "http://localhost:4050";
const RUST_URL = process.env.RUST_URL ?? "http://localhost:5150";
const SECRET = process.env.AUTH_SECRET ?? "";
const PASSWORD = process.env.PARITY_ADMIN_PASSWORD ?? "admin";
const ADMIN = "1aa00cc2af0225000c5c114df3eebb69";
const ORIGIN = "http://localhost:4050";
const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const signed = (value: string) =>
  encodeURIComponent(`${value}.${createHmac("sha256", SECRET).update(value).digest("base64")}`);

// A deactivated account with a known password (D-30).
const inactiveHash = await bcrypt.hash("inactive-pw-123", 4);
await db.query(
  `INSERT INTO users (id, email, password_hash, display_name, is_active, created_at, updated_at)
   VALUES ('parity-inactive', 'inactive@parity.test', $1, 'Inactive', false, '2026-09-20T00:00:00.000Z', '2026-09-20T00:00:00.000Z')
   ON CONFLICT (id) DO UPDATE SET is_active = false`,
  [inactiveHash]
);
await db.query(
  `INSERT INTO auth_accounts (id, user_id, account_id, provider_id, password, created_at, updated_at)
   VALUES ('parity-inactive-cred', 'parity-inactive', 'parity-inactive', 'credential', $1, NOW(), NOW())
   ON CONFLICT (id) DO UPDATE SET password = $1`,
  [inactiveHash]
);

const run = Math.floor(Math.random() * 200) + 20;
let n = 0;
const nextIp = () => `198.51.${run}.${++n}`;

type Got = { status: number; headers: Record<string, string>; cookies: string[]; body: unknown; token?: string };
const KEEP = ["content-type", "cache-control", "pragma", "x-retry-after", "location"];
const VOLATILE = /^(token|id|createdAt|updatedAt|expiresAt)$/;
function mask(v: unknown, key = ""): unknown {
  if (Array.isArray(v)) return v.map((x) => mask(x));
  if (v && typeof v === "object")
    return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, mask(x, k)]));
  // The user's own timestamps are fixed; the session's are not.
  if (VOLATILE.test(key) && typeof v === "string" && key !== "id") return "<v>";
  if (key === "id" && typeof v === "string" && v !== ADMIN) return "<v>";
  return v;
}

async function call(
  base: string,
  method: string,
  path: string,
  opts: { headers?: Record<string, string>; body?: string; ip: string }
): Promise<Got> {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { "x-forwarded-for": opts.ip, "user-agent": "parity-agent", ...opts.headers },
    body: opts.body,
    redirect: "manual",
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {}
  const headers: Record<string, string> = {};
  for (const k of KEEP) {
    const v = res.headers.get(k);
    if (v !== null) headers[k] = k === "content-type" ? v.split(";")[0] : v;
  }
  const cookies = res.headers.getSetCookie().map((c) => c.replace(/^([^=]+)=([^;]+)/, "$1=<v>"));
  const token = (body as { token?: string } | null)?.token;
  return { status: res.status, headers, cookies, body, token };
}

const json = (b: unknown) => ({ headers: { "content-type": "application/json" }, body: JSON.stringify(b) });
const creds = { email: "admin@admin.com", password: PASSWORD };

/** A session row of the admin's, `ageDays` old, expiring `expiresInDays` from now. */
async function plantSession(token: string, ageDays: number, expiresInDays: number) {
  await db.query("DELETE FROM auth_sessions WHERE token = $1", [token]);
  await db.query(
    `INSERT INTO auth_sessions (id, user_id, token, expires_at, ip_address, user_agent, created_at, updated_at)
     VALUES ($1, $2, $1, NOW() + make_interval(secs => $3), '10.0.0.1', 'planted', NOW() - make_interval(secs => $4), NOW() - make_interval(secs => $4))`,
    [token, ADMIN, expiresInDays * 86400, ageDays * 86400]
  );
}

/** What a call left in `auth_sessions`, with times reduced to whole hours from now. */
async function rowFor(token: string | undefined) {
  if (!token) return null;
  const { rows } = await db.query(
    `SELECT user_id, ip_address, user_agent,
            round(extract(epoch FROM expires_at - NOW()) / 3600) AS expires_in_h,
            round(extract(epoch FROM NOW() - updated_at) / 3600) AS updated_h_ago
     FROM auth_sessions WHERE token = $1`,
    [token]
  );
  return rows[0] ?? "deleted";
}

type Case = {
  name: string;
  method?: string;
  path: string;
  opts?: (ip: string) => { headers?: Record<string, string>; body?: string };
  before?: () => Promise<void>;
  /** The row to report after the call: the token the call issued, or a planted one. */
  row?: "issued" | string;
  repeat?: number;
  known?: string;
};

const cases: Case[] = [
  { name: "sign-in", path: "/api/auth/sign-in/email", opts: () => json(creds), row: "issued" },
  {
    name: "sign-in, form-encoded",
    path: "/api/auth/sign-in/email",
    opts: () => ({
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: `email=${encodeURIComponent(creds.email)}&password=${encodeURIComponent(PASSWORD)}`,
    }),
    row: "issued",
  },
  {
    name: "sign-in, don't remember me",
    path: "/api/auth/sign-in/email",
    opts: () => json({ ...creds, rememberMe: false }),
    row: "issued",
  },
  {
    name: "sign-in with a trusted callback",
    path: "/api/auth/sign-in/email",
    opts: () => json({ ...creds, callbackURL: "/dashboard" }),
  },
  {
    name: "sign-in with an untrusted callback",
    path: "/api/auth/sign-in/email",
    opts: () => json({ ...creds, callbackURL: "https://evil.example/x" }),
  },
  { name: "wrong password", path: "/api/auth/sign-in/email", opts: () => json({ ...creds, password: "nope-nope" }) },
  {
    name: "unknown account",
    path: "/api/auth/sign-in/email",
    opts: () => json({ email: "nobody@parity.test", password: "whatever1" }),
  },
  {
    name: "email is case-folded",
    path: "/api/auth/sign-in/email",
    opts: () => json({ ...creds, email: "ADMIN@admin.com" }),
  },
  { name: "invalid email", path: "/api/auth/sign-in/email", opts: () => json({ email: "a@b.c", password: "x" }) },
  { name: "missing password", path: "/api/auth/sign-in/email", opts: () => json({ email: "a@b.co" }) },
  {
    name: "wrong types",
    path: "/api/auth/sign-in/email",
    opts: () => json({ email: 1, password: "x", rememberMe: "no" }),
  },
  { name: "body not an object", path: "/api/auth/sign-in/email", opts: () => json(null) },
  { name: "no content type", path: "/api/auth/sign-in/email", opts: () => ({ body: JSON.stringify(creds) }) },
  {
    name: "text/plain",
    path: "/api/auth/sign-in/email",
    opts: () => ({ headers: { "content-type": "text/plain" }, body: "x" }),
  },
  {
    name: "invalid JSON",
    path: "/api/auth/sign-in/email",
    opts: () => ({ headers: { "content-type": "application/json" }, body: "{" }),
  },
  {
    name: "cross-site navigation",
    path: "/api/auth/sign-in/email",
    opts: () => ({
      headers: { ...json(creds).headers, "sec-fetch-site": "cross-site", "sec-fetch-mode": "navigate" },
      body: json(creds).body,
    }),
  },
  {
    name: "browser request with no origin",
    path: "/api/auth/sign-in/email",
    opts: () => ({ headers: { ...json(creds).headers, "sec-fetch-site": "same-origin" }, body: json(creds).body }),
  },
  {
    name: "browser request, trusted origin",
    path: "/api/auth/sign-in/email",
    opts: () => ({
      headers: { ...json(creds).headers, "sec-fetch-site": "same-origin", origin: ORIGIN },
      body: json(creds).body,
    }),
  },
  {
    name: "with a cookie, untrusted origin",
    path: "/api/auth/sign-in/email",
    opts: () => ({ headers: { ...json(creds).headers, cookie: "x=1", origin: "http://evil.example" }, body: json(creds).body }),
  },
  {
    name: "rate limit: the sixth sign-in in a minute",
    path: "/api/auth/sign-in/email",
    opts: () => json({ ...creds, password: "wrong-wrong" }),
    repeat: 6,
  },
  {
    name: "deactivated account",
    path: "/api/auth/sign-in/email",
    opts: () => json({ email: "inactive@parity.test", password: "inactive-pw-123" }),
    row: "issued",
    known: "D-30",
  },
  { name: "get-session, signed out", method: "GET", path: "/api/auth/get-session" },
  {
    name: "get-session, forged cookie",
    method: "GET",
    path: "/api/auth/get-session",
    opts: () => ({ headers: { cookie: "ers.session_token=abc.def" } }),
  },
  {
    name: "get-session, fresh",
    method: "GET",
    path: "/api/auth/get-session",
    before: () => plantSession("parityFreshSessionToken000000000", 0, 7),
    opts: () => ({ headers: { cookie: `ers.session_token=${signed("parityFreshSessionToken000000000")}` } }),
    row: "parityFreshSessionToken000000000",
  },
  {
    name: "get-session, a day old: extended",
    method: "GET",
    path: "/api/auth/get-session",
    before: () => plantSession("parityOldSessionToken00000000000", 2, 5),
    opts: () => ({ headers: { cookie: `ers.session_token=${signed("parityOldSessionToken00000000000")}` } }),
    row: "parityOldSessionToken00000000000",
  },
  {
    name: "get-session, a day old but don't-remember",
    method: "GET",
    path: "/api/auth/get-session",
    before: () => plantSession("parityDontRememberToken000000000", 2, 5),
    opts: () => ({
      headers: {
        cookie: `ers.session_token=${signed("parityDontRememberToken000000000")}; ers.dont_remember=${signed("true")}`,
      },
    }),
    row: "parityDontRememberToken000000000",
  },
  {
    name: "get-session, expired: row deleted, cookies cleared",
    method: "GET",
    path: "/api/auth/get-session",
    before: () => plantSession("parityExpiredSessionToken0000000", 8, -1),
    opts: () => ({ headers: { cookie: `ers.session_token=${signed("parityExpiredSessionToken0000000")}` } }),
    row: "parityExpiredSessionToken0000000",
  },
  {
    name: "get-session clears a stale cache cookie",
    method: "GET",
    path: "/api/auth/get-session",
    opts: () => ({ headers: { cookie: "ers.session_data=stale" } }),
  },
  {
    name: "sign-out",
    path: "/api/auth/sign-out",
    before: () => plantSession("paritySignOutToken00000000000000", 0, 7),
    opts: () => ({
      headers: {
        "content-type": "application/json",
        origin: ORIGIN,
        cookie: `ers.session_token=${signed("paritySignOutToken00000000000000")}`,
      },
      body: "{}",
    }),
    row: "paritySignOutToken00000000000000",
  },
  {
    name: "sign-out, untrusted origin: nothing deleted",
    path: "/api/auth/sign-out",
    before: () => plantSession("paritySignOutEvilToken0000000000", 0, 7),
    opts: () => ({
      headers: {
        "content-type": "application/json",
        origin: "http://evil.example",
        cookie: `ers.session_token=${signed("paritySignOutEvilToken0000000000")}`,
      },
      body: "{}",
    }),
    row: "paritySignOutEvilToken0000000000",
  },
  {
    name: "sign-out, cookie but no origin",
    path: "/api/auth/sign-out",
    opts: () => ({ headers: { "content-type": "application/json", cookie: "x=1" }, body: "{}" }),
  },
  { name: "sign-out, no content type", path: "/api/auth/sign-out", opts: () => ({ body: "{}" }) },
  { name: "sign-out, signed out", path: "/api/auth/sign-out", opts: () => json({}) },
];

// Each backend has its own limiter, so one address per case serves both.
async function once(base: string, c: Case, ip: string): Promise<string> {
  await c.before?.();
  let got: Got | undefined;
  const statuses: number[] = [];
  for (let i = 0; i < (c.repeat ?? 1); i++) {
    got = await call(base, c.method ?? "POST", c.path, { ip, ...(c.opts?.(ip) ?? {}) });
    statuses.push(got.status);
  }
  const g = got as Got;
  const token = c.row === "issued" ? g.token : c.row;
  const row = await rowFor(token);
  if (c.row === "issued" && g.token) await db.query("DELETE FROM auth_sessions WHERE token = $1", [g.token]);
  const headers = { ...g.headers };
  // One or two seconds either way is the clock, not a difference.
  if (headers["x-retry-after"]) headers["x-retry-after"] = String(Math.round(Number(headers["x-retry-after"]) / 5) * 5);
  return JSON.stringify({
    statuses: c.repeat ? statuses : undefined,
    status: g.status,
    headers,
    cookies: g.cookies,
    body: mask(g.body),
    row,
  });
}

let failed = 0;
let known = 0;
for (const c of cases) {
  const ip = nextIp();
  const a = await once(NODE_URL, c, ip);
  const b = await once(RUST_URL, c, ip);
  if (a === b) console.log(`✓ ${c.name}`);
  else if (c.known) {
    known++;
    console.log(`~ ${c.name}  (documented difference ${c.known})\n    node=${a}\n    rust=${b}`);
  } else {
    failed++;
    console.log(`✗ ${c.name}\n    node=${a}\n    rust=${b}`);
  }
}

// A session issued by either backend opens the other.
for (const [issuer, reader] of [
  [NODE_URL, RUST_URL],
  [RUST_URL, NODE_URL],
]) {
  const ip = nextIp();
  const res = await fetch(`${issuer}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(creds),
  });
  const cookie = res.headers.getSetCookie()[0]?.split(";")[0] ?? "";
  const session = (await (await fetch(`${reader}/api/auth/get-session`, { headers: { cookie } })).json()) as {
    user?: { id: string };
  } | null;
  const guarded = await fetch(`${reader}/api/queries`, { headers: { cookie } });
  const out = await fetch(`${reader}/api/auth/sign-out`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN, cookie },
    body: "{}",
  });
  const after = (await (await fetch(`${issuer}/api/auth/get-session`, { headers: { cookie } })).json()) as unknown;
  const ok = session?.user?.id === ADMIN && guarded.status === 200 && out.status === 200 && after === null;
  if (!ok) failed++;
  console.log(
    `${ok ? "✓" : "✗"} issued by ${issuer}, used and signed out on ${reader}, then gone on ${issuer}` +
      (ok ? "" : `  (user=${session?.user?.id} guarded=${guarded.status} out=${out.status} after=${JSON.stringify(after)})`)
  );
}

await db.query("DELETE FROM auth_sessions WHERE token LIKE 'parity%' OR user_id = 'parity-inactive'");
await db.query("DELETE FROM auth_accounts WHERE id = 'parity-inactive-cred'");
await db.query("DELETE FROM users WHERE id = 'parity-inactive'");
await db.end();
console.log(`\n${cases.length - failed - known}/${cases.length} identical, ${known} documented, ${failed} failure(s)`);
process.exit(failed ? 1 : 0);
