/**
 * The reporting platform's half of the single sign-on, against a running
 * platform backend and its database — the assertions are minted by the
 * gateway's own `signAssertion`, so a disagreement between the two halves
 * fails here rather than at somebody's first sign-in.
 *
 *   CHAT_TEST_REPORT_API=http://localhost:5150/api \
 *   CHAT_TEST_REPORT_DATABASE_URL=postgres://…/report_config \
 *   SSO_SIGNING_KEY="$(cat sso.key)" \
 *   bun test tests/security/reporting-assertion.test.ts
 *
 * The platform must have been seeded with the application's reporting pack:
 * role sync is checked against the roles that pack created.
 */

import { generateKeyPairSync, randomUUID, sign } from "node:crypto";
import { afterAll, describe, expect, it } from "bun:test";
import pg from "pg";
import { signAssertion } from "../../gateway/crypto";

const API = process.env.CHAT_TEST_REPORT_API ?? "http://localhost:5150/api";
const DATABASE = process.env.CHAT_TEST_REPORT_DATABASE_URL ?? "postgres://postgres:qapass@localhost:5432/report_chat_e2e";
const SIGNING_KEY = process.env.SSO_SIGNING_KEY ?? "";

const pool = new pg.Pool({ connectionString: DATABASE });
const run = `${Date.now().toString(36)}`;
const person = (who: string) => `${who}.${run}@crm.example.com`;

async function present(assertion: string): Promise<{ status: number; cookie: string | null; body: Record<string, unknown> }> {
  const response = await fetch(`${API}/auth/assertion`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ assertion }),
  });
  return {
    status: response.status,
    cookie: response.headers.get("set-cookie")?.split(";")[0] ?? null,
    body: (await response.json().catch(() => ({}))) as Record<string, unknown>,
  };
}

async function rolesOf(email: string): Promise<{ system: string[]; data: string[] }> {
  const system = await pool.query(
    `SELECT r.name FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id
      WHERE u.email = $1 ORDER BY r.name`,
    [email]
  );
  const data = await pool.query(
    `SELECT DISTINCT d.name FROM users u JOIN ds_user_roles du ON du.user_id = u.id JOIN ds_roles d ON d.id = du.ds_role_id
      WHERE u.email = $1 ORDER BY d.name`,
    [email]
  );
  return { system: system.rows.map((r) => r.name), data: data.rows.map((r) => r.name) };
}

afterAll(async () => {
  await pool.query(
    `DELETE FROM users WHERE email LIKE $1`,
    [`%.${run}@crm.example.com`]
  );
  await pool.end();
});

describe("a valid assertion", () => {
  it("is required to be configured", () => {
    expect(SIGNING_KEY).toContain("PRIVATE KEY");
  });

  it("opens a session and creates the person, with the roles it names", async () => {
    const email = person("sales.rep");
    const answer = await present(signAssertion(SIGNING_KEY, { email, name: "Sales Rep", roles: ["Sales Rep"], master: false }));
    expect(answer.status).toBe(200);
    expect(answer.cookie).toMatch(/^ers\.session_token=/);
    expect((answer.body.user as { email: string }).email).toBe(email);

    const session = await fetch(`${API}/auth/get-session`, { headers: { cookie: answer.cookie ?? "" } });
    expect(session.status).toBe(200);
    expect(((await session.json()) as { user?: { email: string } }).user?.email).toBe(email);

    const roles = await rolesOf(email);
    expect(roles.system).toEqual(["Sales Rep"]);
    expect(roles.data).toEqual(["Sales Rep"]);
  });

  it("re-syncs roles on the next sign-in: one removed in the application is removed here", async () => {
    const email = person("moving");
    expect((await present(signAssertion(SIGNING_KEY, { email, name: "Moving", roles: ["sales_rep", "support_agent"], master: false }))).status).toBe(200);
    expect((await rolesOf(email)).system).toEqual(["Sales Rep", "Support Agent"]);
    expect((await present(signAssertion(SIGNING_KEY, { email, name: "Moving", roles: ["support_agent"], master: false }))).status).toBe(200);
    expect(await rolesOf(email)).toEqual({ system: ["Support Agent"], data: ["Support Agent"] });
  });

  it("maps the application's master role to this platform's administrator", async () => {
    const email = person("owner");
    expect((await present(signAssertion(SIGNING_KEY, { email, name: "Owner", roles: ["Administrator"], master: true }))).status).toBe(200);
    expect((await rolesOf(email)).system).toContain("Administrator");
  });

  it("gives a role the pack never created nothing to read", async () => {
    const email = person("stranger");
    expect((await present(signAssertion(SIGNING_KEY, { email, name: "Stranger", roles: ["Night Porter"], master: false }))).status).toBe(200);
    expect(await rolesOf(email)).toEqual({ system: [], data: [] });
  });

  it("creates an account with no password: an assertion is the only way in", async () => {
    const email = person("passwordless");
    expect((await present(signAssertion(SIGNING_KEY, { email, name: "P", roles: [], master: false }))).status).toBe(200);
    const credential = await pool.query(
      `SELECT a.provider_id, a.password FROM auth_accounts a JOIN users u ON u.id = a.user_id WHERE u.email = $1`,
      [email]
    );
    expect(credential.rows).toEqual([{ provider_id: "appwithai-chat", password: null }]);
  });
});

describe("an assertion is refused", () => {
  it("the second time it is presented", async () => {
    const assertion = signAssertion(SIGNING_KEY, { email: person("replay"), name: "R", roles: [], master: false });
    expect((await present(assertion)).status).toBe(200);
    const second = await present(assertion);
    expect(second.status).toBe(401);
    expect(second.cookie).toBeNull();
  });

  it("when another key signed it", async () => {
    const { privateKey } = generateKeyPairSync("ed25519");
    const forged = signAssertion(privateKey.export({ type: "pkcs8", format: "pem" }).toString(), {
      email: person("forged"),
      name: "F",
      roles: [],
      master: true,
    });
    expect((await present(forged)).status).toBe(401);
  });

  it("when its payload was edited after signing", async () => {
    const token = signAssertion(SIGNING_KEY, { email: person("edited"), name: "E", roles: ["Sales Rep"], master: false });
    const [encoded, signature] = token.split(".");
    const payload = JSON.parse(Buffer.from(encoded ?? "", "base64url").toString("utf8"));
    payload.master = true;
    const edited = `${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${signature}`;
    expect((await present(edited)).status).toBe(401);
  });

  it("when it has expired, or was minted for another audience", async () => {
    const past = Date.now() - 10 * 60_000;
    expect((await present(signAssertion(SIGNING_KEY, { email: person("late"), name: "L", roles: [], master: false }, past))).status).toBe(401);

    const now = Math.floor(Date.now() / 1000);
    const payload = { iss: "appwithai-chat", aud: "app", sub: person("aud"), name: "A", roles: [], master: false, jti: randomUUID(), iat: now, exp: now + 60 };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = sign(null, Buffer.from(encoded), SIGNING_KEY).toString("base64url");
    expect((await present(`${encoded}.${signature}`)).status).toBe(401);
  });

  it("for a deactivated account, whoever vouches for it", async () => {
    const email = person("deactivated");
    expect((await present(signAssertion(SIGNING_KEY, { email, name: "D", roles: [], master: false }))).status).toBe(200);
    await pool.query("UPDATE users SET is_active = FALSE WHERE email = $1", [email]);
    expect((await present(signAssertion(SIGNING_KEY, { email, name: "D", roles: [], master: false }))).status).toBe(401);
  });
});
