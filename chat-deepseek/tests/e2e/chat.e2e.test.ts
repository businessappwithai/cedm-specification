/**
 * The chat, end to end, in a real browser — against a running application, its
 * reporting platform, the gateway and the Harness hosts it starts.
 *
 *   CHAT_E2E_ORIGIN=http://localhost:8080     # the front door: / app, /chat, /report
 *   CHAT_E2E_APP_API=http://localhost:3000/api
 *   CHAT_E2E_RECORDER_PORT=3997               # where the gateway's DEEPSEEK_BASE_URL points
 *   bun test tests/e2e --timeout 180000
 *
 * Nothing is stubbed but the model's words. The model endpoint is the Messages
 * recorder, scripted per test to make the tool calls a model would make; every
 * tool call then runs for real — through the host, the gateway's internal API,
 * the application and the reporting platform, as the signed-in person — and
 * what the person sees and saves is the application's own screen.
 *
 * What it proves, in order:
 * 1. One sign-in at /chat signs the person in to the chat, the application and
 *    the reporting platform.
 * 2. A create form opened by the assistant is the application's own, inside the
 *    conversation; saving it reaches the assistant as an `[Application]` notice
 *    the gateway wrote after reading the record back.
 * 3. An update form whose record someone else changes meanwhile shows the
 *    application's conflict dialog in the conversation, and overwriting it is
 *    reported back the same way.
 * 4. A report runs as the person, pages in the conversation, and its page opens
 *    embedded — already signed in, no second login.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { type Browser, chromium, type Frame, type Page } from "playwright";
import { type RecordedRequest, startMessagesRecorder } from "../support/messages-recorder";

const ORIGIN = process.env.CHAT_E2E_ORIGIN ?? "http://localhost:8080";
const APP_API = process.env.CHAT_E2E_APP_API ?? "http://localhost:3000/api";
const RECORDER_PORT = Number(process.env.CHAT_E2E_RECORDER_PORT ?? "3997");
const EMAIL = process.env.CHAT_E2E_EMAIL ?? "admin@admin.com";
const PASSWORD = process.env.CHAT_E2E_PASSWORD ?? "admin";
const CHROMIUM = process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const run = Date.now().toString(36);
const teamName = `E2E Team ${run}`;

type Call = { name: string; input: Record<string, unknown> };

/**
 * The model's side of each conversation, keyed by what the person wrote. A step
 * returns the next call given the results so far, or null to answer in text.
 */
const SCRIPTS: Array<{ when: RegExp; steps: Array<(results: string[]) => Call | null> }> = [
  { when: /new team/i, steps: [() => ({ name: "open_create_form", input: { entity: "Team" } })] },
  {
    when: /edit the e2e team/i,
    steps: [
      () => ({ name: "search_records", input: { entity: "Team", text: teamName, pageSize: 1 } }),
      (results) => {
        const ref = /"ref":"(rec_[^"]+)"/.exec(results[0] ?? "")?.[1];
        return ref ? { name: "open_update_form", input: { ref } } : null;
      },
    ],
  },
  {
    when: /team report/i,
    steps: [
      () => ({ name: "search_reports", input: { text: "Team" } }),
      (results) => {
        // A model picks the report whose title answers the question, not the
        // first hit: the search also matches descriptions that mention teams.
        const reports = JSON.parse(results[0] ?? "[]") as Array<{ reportId: string; title: string }>;
        const chosen = reports.find((report) => /\bteams?\b/i.test(report.title)) ?? reports[0];
        return chosen ? { name: "run_approved_report", input: { reportId: chosen.reportId } } : null;
      },
    ],
  },
];

const recorder = startMessagesRecorder(RECORDER_PORT, {
  toolCall: (request: RecordedRequest) => {
    if (request.toolNames.length === 0 || request.userText.startsWith("[Application]")) return null;
    const script = SCRIPTS.find((candidate) => candidate.when.test(request.userText));
    const step = script?.steps[request.turnResults.length];
    return step ? step(request.turnResults) : null;
  },
  text: (request) =>
    request.userText.startsWith("[Application]")
      ? "Noted — the application confirms it."
      : request.turnResults.length
        ? "It is open below."
        : "I could not find that.",
});

let browser: Browser;
let page: Page;

async function waitFor<T>(what: string, probe: () => Promise<T | null | undefined | false>, timeoutMs = 45_000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await probe();
    if (value) return value as T;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

async function say(text: string): Promise<void> {
  const composer = page.locator('[data-composer-input="true"][contenteditable="true"]');
  await composer.waitFor({ timeout: 30_000 });
  await composer.click();
  await page.keyboard.type(text);
  await page.keyboard.press("Enter");
}

async function newSession(): Promise<void> {
  await page.getByText("New Session").first().click();
  await page.waitForTimeout(1500);
}

/** The application frame a card opened, once its screen has rendered. */
async function appFrame(path: RegExp): Promise<Frame> {
  return waitFor(`a frame on ${path}`, async () => {
    const frame = page.frames().find((candidate) => {
      // A frame still loading has no URL yet.
      if (!URL.canParse(candidate.url())) return false;
      const url = new URL(candidate.url());
      return path.test(url.pathname + url.search);
    });
    if (!frame) return null;
    return (await frame.locator('input[name="name"]').count()) > 0 ? frame : null;
  });
}

/** The `[Application]` notice the gateway wrote, as the model received it. */
function noticeMatching(pattern: RegExp): Promise<RecordedRequest> {
  return waitFor(`an [Application] notice matching ${pattern}`, async () =>
    recorder.requests.find((request) => request.userText.startsWith("[Application]") && pattern.test(request.userText))
  );
}

async function signInToApp(): Promise<string> {
  const response = await fetch(`${APP_API}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const body = (await response.json()) as { token: string };
  return body.token;
}

beforeAll(async () => {
  browser = await chromium.launch({ executablePath: CHROMIUM, args: ["--no-sandbox"] });
  page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
});

afterAll(async () => {
  await browser?.close();
  recorder.stop();
  const token = await signInToApp().catch(() => null);
  if (!token) return;
  const found = await fetch(`${APP_API}/bus/bus_team?filter.name=equals:${encodeURIComponent(teamName)}`, {
    headers: { authorization: `Bearer ${token}` },
  }).then((r) => r.json() as Promise<{ data?: Array<{ id: string; version?: number }> }>);
  for (const row of found.data ?? []) {
    // A delete names the version it read, as every write to an optimistic table does.
    await fetch(`${APP_API}/bus/bus_team/${row.id}`, {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${token}`,
        ...(typeof row.version === "number" ? { "if-match": `"v${row.version}"` } : {}),
      },
    });
  }
});

describe("the chat, end to end", () => {
  it("signs the person in once, to the chat, the application and the reporting platform", async () => {
    await page.goto(`${ORIGIN}/chat/`);
    expect(new URL(page.url()).pathname).toBe("/chat/_/sign-in");
    await page.fill("#email", EMAIL);
    await page.fill("#password", PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${ORIGIN}/chat/`, { timeout: 60_000 });
    const chooser = page.getByText("Choose workspace");
    await page.waitForTimeout(3000);
    if (await chooser.count()) {
      await chooser.click();
      await page.getByText("Default workspace").last().click();
    }
    // Every cookie the browser holds: the three are path-scoped, and a lookup by
    // URL would only return the ones whose path covers it.
    const cookies = await page.context().cookies();
    const names = cookies.map((cookie) => `${cookie.name}@${cookie.path}`);
    expect(names).toContain("chat.session_token@/chat");
    expect(names).toContain("token@/");
    expect(names.some((name) => name.startsWith("ers.session_token@/report"))).toBe(true);
  });

  it("opens the application's own create form in the conversation, and a save comes back as a notice", async () => {
    await say("Open a new team form");
    const frame = await appFrame(/^\/team\/new\?embed=1$/);
    expect(await frame.locator("aside").count()).toBe(0);
    await frame.fill('input[name="name"]', teamName);
    await frame.fill('input[name="region"]', "North");
    await frame.locator('button[type="submit"]', { hasText: "Create" }).first().click();

    const notice = await noticeMatching(new RegExp(`Team ${teamName} created in the application`));
    expect(notice.userText).toContain("[Application]");
    const token = await signInToApp();
    const stored = await fetch(`${APP_API}/bus/bus_team?filter.name=equals:${encodeURIComponent(teamName)}`, {
      headers: { authorization: `Bearer ${token}` },
    }).then((r) => r.json() as Promise<{ data: Array<{ region: string }> }>);
    expect(stored.data).toHaveLength(1);
    expect(stored.data[0]?.region).toBe("North");
  });

  it("shows the application's conflict dialog when someone else saved first, and reports the overwrite", async () => {
    await newSession();
    await say("Edit the e2e team");
    const frame = await appFrame(/^\/team\/[0-9a-f-]{36}\?embed=1&edit=1$/);
    const id = new URL(frame.url()).pathname.split("/")[2]!;
    await frame.fill('input[name="region"]', "South");

    // Someone else saves the same record while the form is open.
    const token = await signInToApp();
    const current = await fetch(`${APP_API}/bus/bus_team/${id}`, { headers: { authorization: `Bearer ${token}` } });
    const etag = current.headers.get("etag") ?? "";
    const theirs = await fetch(`${APP_API}/bus/bus_team/${id}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "if-match": etag },
      body: JSON.stringify({ region: "East" }),
    });
    expect(theirs.status).toBe(200);

    await frame.getByRole("button", { name: "Save" }).first().click();
    await frame.getByText("This record was changed while you were editing it").waitFor({ timeout: 20_000 });
    expect(await frame.getByRole("button", { name: "Refresh to latest" }).count()).toBe(1);
    await frame.getByRole("button", { name: "Overwrite with my changes" }).click();

    await noticeMatching(new RegExp(`Team ${teamName} updated in the application`));
    const stored = await fetch(`${APP_API}/bus/bus_team/${id}`, { headers: { authorization: `Bearer ${token}` } }).then(
      (r) => r.json() as Promise<{ region: string; version: number }>
    );
    expect(stored.region).toBe("South");
    expect(stored.version).toBeGreaterThanOrEqual(3);
  });

  it("runs a report as the person, and opens its page embedded without a second sign-in", async () => {
    await newSession();
    await say("Show me the team report");
    const card = page.locator('[data-business-card="report"]').last();
    await card.waitFor({ timeout: 45_000 });
    await waitFor("report rows", async () => (await card.locator("tbody tr").count()) > 0).catch(async (error) => {
      throw new Error(`${(error as Error).message}; the card reads: ${(await card.innerText()).slice(0, 400)}`);
    });

    // What the model was told: the report it chose, how many rows the person's
    // own run returned, and a preview — never the SQL or a data-source handle.
    const told = recorder.requests.find(
      (request) => /team report/i.test(request.userText) && request.turnResults.length === 2
    )?.turnResults[1];
    expect(told).toMatch(/^[^:]*\bteams?\b[^:]*: [1-9]\d* row\(s\), columns /i);
    expect(told).not.toMatch(/select\s|from\s+bus_|postgres:\/\//i);

    await card.getByRole("button", { name: /Report page|Chart and report page/ }).click();
    const reportFrame = await waitFor("the embedded report page", async () =>
      page.frames().find(
        (frame) => URL.canParse(frame.url()) && /^\/report\/reports\/[^/]+\/viewer$/.test(new URL(frame.url()).pathname)
      )
    ).catch((error) => {
      throw new Error(`${(error as Error).message}; frames: ${page.frames().map((frame) => frame.url()).join(", ")}`);
    });
    await reportFrame.getByText("Report Data").waitFor({ timeout: 45_000 });
    expect(new URL(reportFrame.url()).pathname).not.toContain("/login");
    expect(await reportFrame.locator("aside").count()).toBe(0);
  });
});
