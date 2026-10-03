/**
 * The REST twins of `src/server-fns/admin.ts` and `getSessionFn`. Node serves
 * these as TanStack server functions, which nothing but the Node process can
 * call, so there is no Node response to compare with. Each step asserts what
 * the Node function returns or throws (and the rows it writes), plus the
 * documented differences: D-28 (a created user can sign in at once), D-30
 * (a deactivated one cannot), D-32 (your own password change keeps your
 * session) and D-33 (the roles screen's routes exist).
 *
 *   DATABASE_URL=… bun rust/parity/admin-fns.ts   (after parity/run.ts)
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const RUST_URL = process.env.RUST_URL ?? "http://localhost:5150";
const NODE_URL = process.env.NODE_URL ?? "http://localhost:4050";
const ADMIN = "1aa00cc2af0225000c5c114df3eebb69";
const cachePath = join(import.meta.dir, ".session-cache.json");
if (!existsSync(cachePath)) {
  console.error("Run parity/run.ts once first: it signs in and caches the sessions this script uses.");
  process.exit(2);
}
const cookies = JSON.parse(readFileSync(cachePath, "utf8")) as Record<string, string>;
const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

let failed = 0;
let passed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "✓" : "✗"} ${name}${ok ? "" : `  ${JSON.stringify(detail)}`}`);
}

async function api(method: string, path: string, as: string | null, body?: unknown) {
  const headers: Record<string, string> = {};
  if (as) headers.cookie = cookies[as] ?? as;
  if (body !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(`${RUST_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown = text;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, body: json as Record<string, unknown> };
}

const run = Math.floor(Math.random() * 200) + 20;
let n = 0;
async function signIn(base: string, email: string, password: string) {
  const res = await fetch(`${base}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `192.0.${run}.${++n}` },
    body: JSON.stringify({ email, password }),
  });
  return { status: res.status, cookie: res.headers.getSetCookie()[0]?.split(";")[0] ?? "" };
}

const errorOf = (b: unknown) => (b as { error?: { message?: string } })?.error?.message;
const EMAIL = "parity-fn-user@parity.test";

async function cleanup() {
  const { rows } = await db.query("SELECT id FROM users WHERE email = $1", [EMAIL]);
  for (const r of rows) {
    await db.query("DELETE FROM user_roles WHERE user_id = $1", [r.id]);
    await db.query("DELETE FROM users WHERE id = $1", [r.id]);
  }
  await db.query("DELETE FROM user_roles WHERE role_id IN (SELECT id FROM roles WHERE name LIKE 'parity-fn-%')");
  await db.query(
    "DELETE FROM resource_permissions WHERE role_id IN (SELECT id FROM roles WHERE name LIKE 'parity-fn-%')"
  );
  await db.query("DELETE FROM roles WHERE name LIKE 'parity-fn-%'");
  await db.query("DELETE FROM audit_log WHERE details LIKE '%parity-fn-%'");
}
await cleanup();

// ── getSessionFn ────────────────────────────────────────────────────────────
{
  const me = await api("GET", "/api/auth/session", "admin");
  const s = (me.body as unknown as { session?: { user?: { id: string; roles: string[] }; expires?: string } }).session;
  check("session twin: admin", me.status === 200 && s?.user?.id === ADMIN && !!s?.expires, me.body);
  const none = await api("GET", "/api/auth/session", null);
  check("session twin: signed out is { session: null }", JSON.stringify(none.body) === '{"session":null}', none.body);
}

// ── listUsers ───────────────────────────────────────────────────────────────
{
  const anon = await api("GET", "/api/admin/users/page", null);
  check("listUsers: signed out → UNAUTHORIZED", anon.status === 401 && errorOf(anon.body) === "UNAUTHORIZED", anon);
  const before = Number((await db.query("SELECT count(*) FROM audit_log WHERE user_id = 'parity-analyst'")).rows[0].count);
  const denied = await api("GET", "/api/admin/users/page", "analyst");
  const audit = await db.query(
    "SELECT action, resource_type, details FROM audit_log WHERE user_id = 'parity-analyst' ORDER BY created_at DESC LIMIT 1"
  );
  const after = Number((await db.query("SELECT count(*) FROM audit_log WHERE user_id = 'parity-analyst'")).rows[0].count);
  check(
    "listUsers: analyst → FORBIDDEN, audited as withErrorHandler does",
    denied.status === 403 &&
      errorOf(denied.body) === "FORBIDDEN" &&
      after === before + 1 &&
      audit.rows[0]?.resource_type === "user" &&
      JSON.stringify(JSON.parse(audit.rows[0]?.details)) ===
        JSON.stringify({ error: "FORBIDDEN", code: "UNHANDLED_ERROR", action: "listUsers", operation: "list" }),
    { denied, audit: audit.rows[0] }
  );
  const page = await api("GET", "/api/admin/users/page?page=0&pageSize=2", "admin");
  const total = Number((await db.query("SELECT count(*) FROM users")).rows[0].count);
  const ids = (await db.query("SELECT id FROM users ORDER BY created_at DESC LIMIT 2")).rows.map((r) => r.id);
  const items = (page.body as unknown as { items: { id: string; roles: unknown[]; password_hash?: string }[] }).items;
  const meta = (page.body as unknown as { meta: Record<string, number> }).meta;
  check(
    "listUsers: one page, newest first, with roles and no credential",
    page.status === 200 &&
      JSON.stringify(items.map((u) => u.id)) === JSON.stringify(ids) &&
      items.every((u) => Array.isArray(u.roles) && !("password_hash" in u)) &&
      JSON.stringify(meta) === JSON.stringify({ total, page: 0, pageSize: 2, totalPages: Math.ceil(total / 2) }),
    page.body
  );
}

// ── createUser, getUser, updateUser ────────────────────────────────────────
let userId = "";
{
  const created = await api("POST", "/api/admin/users", "admin", {
    email: EMAIL,
    password: "parity-fn-pw-1",
    displayName: "parity-fn-user",
    isActive: true,
    roleIds: ["parity-analyst-role"],
  });
  userId = (created.body as unknown as { id: string }).id;
  const cred = await db.query(
    "SELECT provider_id, account_id FROM auth_accounts WHERE user_id = $1 AND provider_id = 'credential'",
    [userId]
  );
  const roles = await db.query("SELECT role_id FROM user_roles WHERE user_id = $1", [userId]);
  const audit = await db.query(
    "SELECT action, resource_type, details FROM audit_log WHERE resource_id = $1 AND action = 'create'",
    [userId]
  );
  check(
    "createUser: { id }, credential row, roles and audit",
    created.status === 200 &&
      /^[0-9a-f-]{36}$/.test(userId) &&
      cred.rows.length === 1 &&
      cred.rows[0].account_id === userId &&
      roles.rows.length === 1 &&
      audit.rows.length === 1,
    { created, cred: cred.rows, roles: roles.rows, audit: audit.rows }
  );
  for (const base of [RUST_URL, NODE_URL]) {
    const s = await signIn(base, EMAIL, "parity-fn-pw-1");
    check(`D-28: the new user signs in at once (${base})`, s.status === 200, s);
  }
  const dup = await api("POST", "/api/admin/users", "admin", {
    email: EMAIL,
    password: "parity-fn-pw-1",
    displayName: "again",
  });
  check(
    "createUser: duplicate email → CONFLICT",
    dup.status === 409 && errorOf(dup.body) === "CONFLICT: User with this email already exists",
    dup
  );
  const got = await api("GET", `/api/admin/users/${userId}`, "admin");
  check(
    "getUser: the row, without credential columns",
    got.status === 200 &&
      (got.body as unknown as { email: string }).email === EMAIL &&
      JSON.stringify(Object.keys(got.body)) ===
        JSON.stringify(["id", "email", "display_name", "avatar_url", "is_active", "created_at", "updated_at"]),
    got.body
  );
  const missing = await api("GET", "/api/admin/users/no-such-user", "admin");
  check("getUser: unknown → NOT_FOUND", missing.status === 404 && errorOf(missing.body) === "NOT_FOUND", missing);
  const upd = await api("PUT", `/api/admin/users/${userId}`, "admin", {
    id: userId,
    displayName: "parity-fn-renamed",
    isActive: false,
    roleIds: [],
  });
  const row = (await db.query("SELECT display_name, is_active FROM users WHERE id = $1", [userId])).rows[0];
  const rc = (await db.query("SELECT count(*) FROM user_roles WHERE user_id = $1", [userId])).rows[0].count;
  check(
    "updateUser: fields and roles replaced",
    upd.status === 200 && row.display_name === "parity-fn-renamed" && row.is_active === false && rc === "0",
    { upd, row, rc }
  );
  const s = await signIn(RUST_URL, EMAIL, "parity-fn-pw-1");
  check("D-30: a deactivated user cannot sign in", s.status === 401, s);
  await api("PUT", `/api/admin/users/${userId}`, "admin", { id: userId, isActive: true });
}

// ── changePassword ──────────────────────────────────────────────────────────
{
  const mine = await signIn(RUST_URL, EMAIL, "parity-fn-pw-1");
  const other = await signIn(NODE_URL, EMAIL, "parity-fn-pw-1");
  const wrong = await api("POST", `/api/admin/users/${userId}/password`, mine.cookie, {
    id: userId,
    currentPassword: "not-the-password",
    newPassword: "parity-fn-pw-2",
  });
  check(
    "changePassword: wrong current password",
    wrong.status === 401 && errorOf(wrong.body) === "UNAUTHORIZED: Current password is incorrect",
    wrong
  );
  const byAnalyst = await api("POST", `/api/admin/users/${userId}/password`, "analyst", {
    id: userId,
    currentPassword: "parity-fn-pw-1",
    newPassword: "parity-fn-pw-2",
  });
  check("changePassword: someone else's, not an admin → FORBIDDEN", byAnalyst.status === 403, byAnalyst);
  const ok = await api("POST", `/api/admin/users/${userId}/password`, mine.cookie, {
    id: userId,
    currentPassword: "parity-fn-pw-1",
    newPassword: "parity-fn-pw-2",
  });
  const still = await api("GET", "/api/auth/session", mine.cookie);
  const gone = await api("GET", "/api/auth/session", other.cookie);
  check("changePassword: { success: true }", ok.status === 200 && JSON.stringify(ok.body) === '{"success":true}', ok);
  check(
    "D-32: the session it was changed from survives, the others end",
    (still.body as unknown as { session: unknown }).session !== null && (gone.body as unknown as { session: unknown }).session === null,
    { still: still.body, gone: gone.body }
  );
  const oldPw = await signIn(NODE_URL, EMAIL, "parity-fn-pw-1");
  const newPw = await signIn(NODE_URL, EMAIL, "parity-fn-pw-2");
  check("changePassword: Node's sign-in takes the new password only", oldPw.status === 401 && newPw.status === 200, {
    oldPw,
    newPw,
  });
}

// ── deleteUser ──────────────────────────────────────────────────────────────
{
  const self = await api("DELETE", `/api/admin/users/${ADMIN}`, "admin");
  check(
    "deleteUser: yourself → FORBIDDEN",
    self.status === 403 && errorOf(self.body) === "FORBIDDEN: Cannot delete your own account",
    self
  );
  const del = await api("DELETE", `/api/admin/users/${userId}`, "admin");
  const left = await db.query(
    "SELECT (SELECT count(*) FROM users WHERE id = $1) u, (SELECT count(*) FROM auth_accounts WHERE user_id = $1) a, (SELECT count(*) FROM auth_sessions WHERE user_id = $1) s",
    [userId]
  );
  check(
    "deleteUser: the user, credential and sessions go",
    del.status === 200 && JSON.stringify(left.rows[0]) === '{"u":"0","a":"0","s":"0"}',
    { del, left: left.rows[0] }
  );
}

// ── Roles: server functions and the roles screen (D-33) ─────────────────────
{
  const list = await api("GET", "/api/admin/roles/parsed", "admin");
  const names = (await db.query("SELECT name FROM roles ORDER BY name ASC")).rows.map((r) => r.name);
  const roles = list.body as unknown as { name: string; permissions: unknown }[];
  check(
    "listRoles: by name, permissions parsed",
    list.status === 200 &&
      JSON.stringify(roles.map((r) => r.name)) === JSON.stringify(names) &&
      roles.every((r) => Array.isArray(r.permissions)),
    list.body
  );
  const fromFn = await api("POST", "/api/admin/roles", "admin", {
    name: "parity-fn-role-a",
    description: "from createRole",
    permissions: ["view_reports"],
  });
  const fromScreen = await api("POST", "/api/admin/roles", "admin", {
    name: "parity-fn-role-b",
    description: "",
    permissions: JSON.stringify(["report:*", "chart:view"]),
  });
  const stored = (
    await db.query("SELECT name, description, permissions FROM roles WHERE name LIKE 'parity-fn-role-%' ORDER BY name")
  ).rows;
  check(
    "createRole: an array (server function) or its JSON text (screen)",
    fromFn.status === 200 &&
      fromScreen.status === 200 &&
      JSON.stringify(stored) ===
        JSON.stringify([
          { name: "parity-fn-role-a", description: "from createRole", permissions: '["view_reports"]' },
          { name: "parity-fn-role-b", description: "", permissions: '["report:*","chart:view"]' },
        ]),
    { fromFn, fromScreen, stored }
  );
  const a = (fromFn.body as unknown as { id: string }).id;
  const b = (fromScreen.body as unknown as { id: string }).id;
  const got = await api("GET", `/api/admin/roles/${a}`, "admin");
  check(
    "getRole: parsed permissions",
    JSON.stringify((got.body as unknown as { permissions: unknown }).permissions) === '["view_reports"]',
    got.body
  );
  const upd = await api("PUT", `/api/admin/roles/${a}`, "admin", {
    id: a,
    name: "parity-fn-role-a2",
    permissions: JSON.stringify(["job:*"]),
  });
  const row = (await db.query("SELECT name, permissions FROM roles WHERE id = $1", [a])).rows[0];
  check(
    "updateRole: name and permissions",
    upd.status === 200 && row.name === "parity-fn-role-a2" && row.permissions === '["job:*"]',
    { upd, row }
  );
  const grants = await api("POST", `/api/admin/roles/${b}/permissions`, "admin", {
    permissions: [
      { resource_type: "report", resource_id: "parity-r-total", permission_level: "view" },
      { resource_type: "chart", resource_id: "parity-c-1", permission_level: "edit" },
    ],
  });
  const shown = await api("GET", `/api/admin/roles/${b}/permissions`, "admin");
  const data = (shown.body as unknown as { data?: { resourcePermissions: unknown[]; resources: Record<string, unknown[]> } }).data;
  check(
    "role grants: replaced, then listed with the resources on offer",
    grants.status === 200 &&
      data?.resourcePermissions.length === 2 &&
      Array.isArray(data?.resources.reports) &&
      Array.isArray(data?.resources.charts) &&
      Array.isArray(data?.resources.dashboards),
    { grants, shown: shown.body }
  );
  const bad = await api("POST", `/api/admin/roles/${b}/permissions`, "admin", {
    permissions: [{ resource_type: "report", resource_id: "x", permission_level: "owner" }],
  });
  check("role grants: an unknown level is refused", bad.status === 400, bad);
  await db.query("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES ('parity-analyst', $1, 'x')", [b]);
  const inUse = await api("DELETE", `/api/admin/roles/${b}`, "admin");
  check(
    "deleteRole: assigned → IN_USE",
    inUse.status === 409 && errorOf(inUse.body) === "IN_USE: Cannot delete role that is assigned to users",
    inUse
  );
  await db.query("DELETE FROM user_roles WHERE role_id = $1", [b]);
  const del = await api("DELETE", `/api/admin/roles/${a}`, "admin");
  const left = (await db.query("SELECT count(*) FROM roles WHERE id = $1", [a])).rows[0].count;
  check("deleteRole: unassigned → gone", del.status === 200 && left === "0", { del, left });
  const byAnalyst = await api("POST", "/api/admin/roles", "analyst", { name: "parity-fn-role-x", permissions: [] });
  check("createRole: analyst → FORBIDDEN", byAnalyst.status === 403 && errorOf(byAnalyst.body) === "FORBIDDEN", byAnalyst);
}

await cleanup();
await db.end();
console.log(`\n${passed}/${passed + failed} passed, ${failed} failure(s)`);
process.exit(failed ? 1 : 0);
