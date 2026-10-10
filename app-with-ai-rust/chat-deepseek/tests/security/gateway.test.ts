/**
 * The gateway's security properties, against a running gateway and the
 * application it serves — nothing is stubbed.
 *
 *   CHAT_TEST_GATEWAY=http://localhost:3100/chat \
 *   CHAT_TEST_INTERNAL=http://127.0.0.1:3101 \
 *   CHAT_TEST_DATABASE_URL=postgres://…/crm_chat \
 *   CHAT_TEST_PASSWORD=admin \
 *   bun test tests/security
 *
 * Two people sign in: the administrator and a second account; the second may
 * not open the first's views. Every other suite drives the chat as one
 * person, so ownership is checked nowhere else.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import pg from "pg";

const GATEWAY = process.env.CHAT_TEST_GATEWAY ?? "http://localhost:3100/chat";
const INTERNAL = process.env.CHAT_TEST_INTERNAL ?? "http://127.0.0.1:3101";
// The chat's own database, where app_views lives — never the application's.
const DATABASE = process.env.CHAT_TEST_DATABASE_URL ?? "postgres://postgres:qapass@localhost:5432/crm_chat";
const SCHEMA = process.env.CHAT_TEST_SCHEMA ?? "chat";
const PASSWORD = process.env.CHAT_TEST_PASSWORD ?? "admin";
const FIRST = process.env.CHAT_TEST_FIRST ?? "admin@admin.com";
const SECOND = process.env.CHAT_TEST_SECOND ?? "sales.rep@crm.example.com";

const pool = new pg.Pool({ connectionString: DATABASE });

/** Cookies as a browser would hold them for the chat's path. */
async function signIn(email: string, password = PASSWORD): Promise<{ status: number; cookie: string }> {
  const response = await fetch(`${GATEWAY}/_/auth/sign-in/application`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: new URL(GATEWAY).origin },
    body: JSON.stringify({ email, password }),
  });
  const cookie = response.headers
    .getSetCookie()
    .map((header) => header.split(";")[0])
    .filter((pair) => pair?.startsWith("chat."))
    .join("; ");
  return { status: response.status, cookie };
}

async function userId(email: string): Promise<string> {
  const { rows } = await pool.query(`SELECT id FROM ${SCHEMA}."user" WHERE email = $1`, [email]);
  if (!rows[0]) throw new Error(`no chat user for ${email}`);
  return rows[0].id as string;
}

async function mintView(owner: string, expiresInSeconds: number): Promise<string> {
  const id = `v_test${crypto.randomUUID().replace(/-/g, "")}`;
  await pool.query(
    `INSERT INTO ${SCHEMA}.app_views (id, user_id, kind, target, operation, title, expires_at)
     VALUES ($1, $2, 'business-application', $3, 'create', 'Test view', now() + make_interval(secs => $4))`,
    [id, owner, JSON.stringify({ path: "/account/new?embed=1" }), expiresInSeconds]
  );
  return id;
}

let first = "";
let second = "";

beforeAll(async () => {
  const a = await signIn(FIRST);
  const b = await signIn(SECOND);
  expect(a.status).toBe(200);
  expect(b.status).toBe(200);
  first = a.cookie;
  second = b.cookie;
});

afterAll(async () => {
  await pool.query(`DELETE FROM ${SCHEMA}.app_views WHERE id LIKE 'v_test%'`);
  await pool.end();
});

describe("without a chat session", () => {
  it("the chat sends you to sign in", async () => {
    const response = await fetch(`${GATEWAY}/`, { redirect: "manual" });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toEndWith("/_/sign-in");
  });

  it("no Harness API is reachable", async () => {
    const response = await fetch(`${GATEWAY}/api/session/list`, { method: "POST", body: "{}" });
    expect(response.status).toBe(401);
  });

  it("no view opens", async () => {
    const response = await fetch(`${GATEWAY}/_/views/v_abcdefghijklmnop/open`, { redirect: "manual" });
    expect(response.status).toBe(401);
  });

  it("a wrong password is refused, in words", async () => {
    const response = await fetch(`${GATEWAY}/_/auth/sign-in/application`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: new URL(GATEWAY).origin },
      body: JSON.stringify({ email: FIRST, password: "not-the-password" }),
    });
    expect(response.status).toBe(401);
    const body = (await response.json()) as { message?: string };
    expect(body.message).toContain("not accepted");
  });
});

describe("signed in, the machine stays out of reach", () => {
  const signedIn = (path: string, init: RequestInit = {}) =>
    fetch(`${GATEWAY}${path}`, { ...init, headers: { cookie: first, "content-type": "application/json", ...(init.headers ?? {}) } });

  it("the route that reads any file on the host is refused", async () => {
    const response = await signedIn("/api/file?path=/etc/passwd");
    expect(response.status).toBe(403);
    expect(await response.text()).not.toContain("root:");
  });

  it("a directory cannot be made a workspace", async () => {
    const response = await signedIn("/api/workspace/create", {
      method: "POST",
      body: JSON.stringify({ type: "client-request", rpcId: "x", method: "workspace/create", payload: { args: { request: { path: "/etc" } } } }),
    });
    expect(response.status).toBe(403);
  });

  it("namespaces the chat does not use are refused", async () => {
    for (const path of ["/api/terminal/open", "/api/directoryPicker/list", "/api/pluginManager/install"]) {
      expect((await signedIn(path, { method: "POST", body: "{}" })).status).toBe(403);
    }
  });
});

describe("the WebSocket mux holds the same allowlist as the HTTP routes", () => {
  /** Open one stream over `/api/remote.mux` as the first person and return the first frame back. */
  async function openStream(endpoint: string): Promise<{ type?: string; error?: { code?: string } }> {
    const url = `${GATEWAY.replace(/^http/, "ws")}/api/remote.mux`;
    const socket = new WebSocket(url, { headers: { cookie: first, origin: new URL(GATEWAY).origin } } as unknown as string[]);
    try {
      await new Promise<void>((resolve, reject) => {
        socket.onopen = () => resolve();
        socket.onerror = () => reject(new Error("socket failed"));
      });
      const streamId = crypto.randomUUID();
      const answer = new Promise<string>((resolve) => {
        socket.onmessage = (event) => {
          const frame = JSON.parse(String(event.data));
          if (frame.streamId === streamId) resolve(String(event.data));
        };
      });
      socket.send(JSON.stringify({ type: "open", streamId, endpoint, payload: { args: {} } }));
      return JSON.parse(await Promise.race([answer, Bun.sleep(10_000).then(() => "{}")]));
    } finally {
      socket.close();
    }
  }

  it("refuses to open a stream on an endpoint the chat does not use", async () => {
    for (const endpoint of ["terminal/open", "workspace/create", "settings/mutate"]) {
      const frame = await openStream(endpoint);
      expect(frame.type, endpoint).toBe("error");
      expect(frame.error?.code, endpoint).toBe("FORBIDDEN");
    }
  });

  it("opens the streams the chat does use", async () => {
    const frame = await openStream("workspace/follow");
    expect(frame.type).toBe("item");
  });
});

describe("settings can be read and never written", () => {
  const rpc = (method: string) =>
    fetch(`${GATEWAY}/api/${method}`, {
      method: "POST",
      headers: { cookie: first, "content-type": "application/json" },
      body: JSON.stringify({ type: "client-request", rpcId: "s", method, payload: { args: {} } }),
    });

  it("answers a read", async () => {
    expect((await rpc("settings/describe")).status).toBe(200);
  });

  it("refuses every write: one could repoint the model endpoint the server's key is sent to", async () => {
    for (const method of ["settings/mutate", "settings/update", "settings/replace"]) {
      expect((await rpc(method)).status, method).toBe(403);
    }
  });
});

describe("the internal tool API", () => {
  it("refuses a call without a host secret", async () => {
    const response = await fetch(`${INTERNAL}/internal/tools/search_records`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entity: "Account" }),
    });
    expect(response.status).toBe(401);
  });

  it("refuses a forged host secret", async () => {
    const response = await fetch(`${INTERNAL}/internal/tools/search_records`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-chat-host-secret": "forged-secret-value" },
      body: JSON.stringify({ entity: "Account" }),
    });
    expect(response.status).toBe(401);
  });
});

describe("view ids belong to one person", () => {
  it("open for their owner", async () => {
    const id = await mintView(await userId(FIRST), 600);
    const response = await fetch(`${GATEWAY}/_/views/${id}/open`, { headers: { cookie: first }, redirect: "manual" });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/account/new?embed=1");
  });

  it("are not found for anyone else", async () => {
    const id = await mintView(await userId(FIRST), 600);
    const response = await fetch(`${GATEWAY}/_/views/${id}/open`, { headers: { cookie: second }, redirect: "manual" });
    expect(response.status).toBe(404);
  });

  it("say so when they have expired", async () => {
    const id = await mintView(await userId(FIRST), -1);
    const response = await fetch(`${GATEWAY}/_/views/${id}/open`, { headers: { cookie: first }, redirect: "manual" });
    expect(response.status).toBe(410);
  });
});

describe("sign-out", () => {
  it("ends the chat session", async () => {
    const { cookie } = await signIn(SECOND);
    const out = await fetch(`${GATEWAY}/_/sign-out`, { method: "POST", headers: { cookie, origin: new URL(GATEWAY).origin }, redirect: "manual" });
    expect(out.status).toBe(303);
    const after = await fetch(`${GATEWAY}/api/session/list`, { method: "POST", headers: { cookie }, body: "{}" });
    expect(after.status).toBe(401);
  });
});

describe("sign-in is rate limited", () => {
  it("refuses a burst of attempts from one address", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 8; i++) statuses.push((await signIn(FIRST, "wrong-password")).status);
    expect(statuses).toContain(429);
  });
});
