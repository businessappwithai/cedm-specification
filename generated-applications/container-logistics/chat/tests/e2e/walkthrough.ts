/**
 * The chat, driven through every operation a person does in it, in Chromium,
 * with a screenshot at each step:
 *
 *   list → search → open → create → read back → update → move along the
 *   lifecycle → delete → search again → a report → its pages → its chart page
 *
 * Everything is the real stack behind nginx: the gateway, one Harness host, the
 * CRM application and the reporting platform. The DeepSeek endpoint is the
 * recorder: the model's choice of tool and its words are scripted below, and
 * every tool call, screen, save and read-back is real. The words are built
 * from the tool results the real tools returned.
 *
 *   CHAT_WALKTHROUGH_OUT=docs/qa/screenshots/<date>-chat-crud \
 *   CHAT_E2E_ORIGIN=http://localhost:8080 CHAT_E2E_APP_API=http://localhost:3000/api \
 *   CHAT_E2E_APP_DB=postgres://…/crm_development bun tests/e2e/walkthrough.ts
 *
 * Against the CRM model, with the gateway's DEEPSEEK_BASE_URL on :3997 (this
 * script is the model there). It signs in as the administrator, creates,
 * changes and deletes one account of its own, moves Opportunity 1 one stage,
 * and puts the opportunity back at the end. Exits non-zero on any step that
 * does not happen, with a screenshot of where it stopped.
 */
import { mkdirSync } from "node:fs";
import { type Browser, chromium, type Frame, type Page } from "playwright";
import pg from "pg";
import { type RecordedRequest, startMessagesRecorder } from "../support/messages-recorder";

const OUT = process.env.CHAT_WALKTHROUGH_OUT ?? "./walkthrough-screenshots";
const ORIGIN = process.env.CHAT_E2E_ORIGIN ?? "http://localhost:8080";
const APP_API = process.env.CHAT_E2E_APP_API ?? "http://localhost:3000/api";
/** The application's database: the cleanup puts the demonstration data back. */
const APP_DB = process.env.CHAT_E2E_APP_DB ?? "postgres://postgres:qapass@localhost:5432/crm_development";
const CHROMIUM = process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const run = Date.now().toString(36).slice(-5);
const ACCOUNT = `Northwind Traders ${run}`;

type Call = { name: string; input: Record<string, unknown> };
type Step = (results: string[]) => Call | null;

// ── what the tools answered, read the way a model reads them ────────────────
interface Row {
  ref: string;
  label: string;
  fields: Record<string, unknown>;
  status: { label?: string; value?: string; isFinal?: boolean } | null;
}
function rowsOf(result: string | undefined): { header: string; rows: Row[] } {
  if (!result) return { header: "", rows: [] };
  const newline = result.indexOf("\n");
  return { header: result.slice(0, newline), rows: JSON.parse(result.slice(newline + 1)) as Row[] };
}
const firstRef = (result: string | undefined) => rowsOf(result).rows[0]?.ref;

function table(result: string | undefined, columns: string[]): string {
  const { header, rows } = rowsOf(result);
  if (rows.length === 0) return "Nothing matches that.";
  const cell = (row: Row, column: string) => {
    if (column === "Status" && row.status) return row.status.label ?? "—";
    const value = row.fields[column];
    return value === null || value === undefined || value === "" ? "—" : String(value).replaceAll("_", " ");
  };
  return [
    header,
    "",
    `| Name | ${columns.join(" | ")} |`,
    `|---|${columns.map(() => "---").join("|")}|`,
    ...rows.map((row) => `| ${row.label} | ${columns.map((c) => cell(row, c)).join(" | ")} |`),
  ].join("\n");
}

function summary(result: string | undefined): string {
  if (!result) return "I could not read it.";
  const record = JSON.parse(result) as {
    label: string;
    fields: Record<string, unknown>;
    status: { label: string; isFinal: boolean } | null;
    transitions: Array<{ label: string }>;
  };
  const shown = Object.entries(record.fields).filter(([, v]) => v !== null && v !== "" && typeof v !== "object");
  return [
    `**${record.label}**${record.status ? ` — status **${record.status.label}**${record.status.isFinal ? " (final: this record is closed)" : ""}` : ""}.`,
    "",
    ...shown.slice(0, 10).map(([k, v]) => `- ${k.replaceAll("_", " ")}: ${String(v).replaceAll("_", " ")}`),
    record.transitions.length ? `\nIt can move to: ${record.transitions.map((t) => t.label).join(", ")}.` : "",
  ].join("\n");
}

// ── the model's side of each request ─────────────────────────────────────────
const SCRIPTS: Array<{ when: RegExp; steps: Step[]; answer: (results: string[]) => string }> = [
  {
    when: /^list the accounts/i,
    steps: [() => ({ name: "search_records", input: { entity: "Account", pageSize: 20 } })],
    answer: (r) => table(r[0], ["Status", "Account Type", "Industry"]),
  },
  {
    when: /^which accounts are in technology/i,
    steps: [() => ({ name: "search_records", input: { entity: "Account", filters: { industry: "technology" } } })],
    answer: (r) => table(r[0], ["Status", "Account Type", "Industry"]),
  },
  {
    when: /^open account 4/i,
    steps: [
      () => ({ name: "search_records", input: { entity: "Account", text: "Account 4", pageSize: 1 } }),
      (r) => (firstRef(r[0]) ? { name: "open_record", input: { ref: firstRef(r[0]) } } : null),
    ],
    answer: () => "Account 4 is open below.",
  },
  {
    when: /^create a new account/i,
    steps: [() => ({ name: "open_create_form", input: { entity: "Account" } })],
    answer: () => "The new-account form is open below. Fill it in and press Create; I will confirm once the application has saved it.",
  },
  {
    when: /^what does the new account look like/i,
    steps: [
      () => ({ name: "search_records", input: { entity: "Account", text: ACCOUNT, pageSize: 1 } }),
      (r) => (firstRef(r[0]) ? { name: "get_record_summary", input: { ref: firstRef(r[0]) } } : null),
    ],
    answer: (r) => summary(r[1]),
  },
  {
    when: /^update the new account/i,
    steps: [
      () => ({ name: "search_records", input: { entity: "Account", text: ACCOUNT, pageSize: 1 } }),
      (r) => (firstRef(r[0]) ? { name: "open_update_form", input: { ref: firstRef(r[0]) } } : null),
    ],
    answer: () => "It is open for editing below. Change what you need and press Save.",
  },
  {
    when: /^move opportunity 1/i,
    steps: [
      () => ({ name: "search_records", input: { entity: "Opportunity", text: "Opportunity 1", pageSize: 1 } }),
      (r) => (firstRef(r[0]) ? { name: "request_approval", input: { ref: firstRef(r[0]), transition: "qualification" } } : null),
    ],
    answer: () => "Opportunity 1 is open at its stage bar, with Qualify — the move to Qualification — selected. Press it to make the move.",
  },
  {
    when: /^delete the new account/i,
    steps: [
      () => ({ name: "search_records", input: { entity: "Account", text: ACCOUNT, pageSize: 1 } }),
      (r) => (firstRef(r[0]) ? { name: "open_update_form", input: { ref: firstRef(r[0]) } } : null),
    ],
    answer: () => "It is open below. Delete is in the form's actions; the application will ask you to confirm.",
  },
  {
    when: /^search for northwind/i,
    steps: [() => ({ name: "search_records", input: { entity: "Account", text: ACCOUNT } })],
    answer: (r) => (rowsOf(r[0]).rows.length ? table(r[0], ["Status"]) : `No account named ${ACCOUNT} exists any more.`),
  },
  {
    when: /^show me accounts by status/i,
    steps: [
      () => ({ name: "search_reports", input: { text: "Accounts by status" } }),
      (r) => {
        const reports = JSON.parse(r[0] ?? "[]") as Array<{ reportId: string; title: string }>;
        const chosen = reports.find((report) => report.title === "Accounts by status");
        return chosen ? { name: "run_approved_report", input: { reportId: chosen.reportId } } : null;
      },
    ],
    answer: () => "Here is Accounts by status. Open its chart and report page from the card for the chart, paging, search and export.",
  },
  {
    when: /^show me the activities register/i,
    steps: [
      () => ({ name: "search_reports", input: { text: "register" } }),
      (r) => {
        const reports = JSON.parse(r[0] ?? "[]") as Array<{ reportId: string; title: string }>;
        const chosen = reports.find((report) => report.title === "Activities — register");
        return chosen ? { name: "run_approved_report", input: { reportId: chosen.reportId } } : null;
      },
    ],
    answer: () => "Here is the Activities register: every activity, newest first.",
  },
];

const recorder = startMessagesRecorder(3997, {
  toolCall: (request: RecordedRequest) => {
    if (request.toolNames.length === 0 || request.userText.startsWith("[Application]")) return null;
    const script = SCRIPTS.find((candidate) => candidate.when.test(request.userText.trim()));
    return script?.steps[request.turnResults.length]?.(request.turnResults) ?? null;
  },
  text: (request) => {
    // Harness asks the model to title each session from its first message.
    if (request.userText.startsWith("Generate the session title")) {
      const first = /"text":"([^"]+)"/.exec(request.userText)?.[1] ?? "Conversation";
      return first.replace(/[?.]$/, "");
    }
    if (request.userText.startsWith("[Application]")) {
      const line = request.userText.replace(/^\[Application\]\s*/, "").split("\n")[0];
      return `Confirmed by the application: ${line}`;
    }
    const script = SCRIPTS.find((candidate) => candidate.when.test(request.userText.trim()));
    return script ? script.answer(request.turnResults) : "I could not find that.";
  },
});

// ── the browser ──────────────────────────────────────────────────────────────
mkdirSync(OUT, { recursive: true });

let browser: Browser;
let page: Page;
let shots = 0;

async function waitFor<T>(what: string, probe: () => Promise<T | null | undefined | false>, timeoutMs = 60_000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await probe().catch(() => null);
    if (value) return value as T;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

async function shot(name: string): Promise<void> {
  await page.waitForTimeout(1500);
  shots += 1;
  const file = `${OUT}/${String(shots).padStart(2, "0")}-${name}.png`;
  await page.screenshot({ path: file });
  console.log("shot", file.split("/").pop());
}

async function say(text: string): Promise<void> {
  const composer = page.locator('[data-composer-input="true"][contenteditable="true"]');
  await composer.waitFor({ timeout: 30_000 });
  await composer.click();
  await page.keyboard.type(text);
  await page.keyboard.press("Enter");
}

/** Wait until the model has answered the request just made, then scroll to it. */
async function answered(count: number): Promise<void> {
  await waitFor("the answer", async () => recorder.requests.length >= count);
  await page.waitForTimeout(2500);
  await scrollToEnd();
}

async function scrollToEnd(): Promise<void> {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("*")) {
      const e = el as HTMLElement;
      if (e.scrollHeight > e.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)) e.scrollTop = e.scrollHeight;
    }
  });
  await page.waitForTimeout(500);
}

async function newSession(): Promise<void> {
  await page.getByText("New Session").first().click();
  await page.waitForTimeout(2000);
}

/** The application frame on `path`, once its screen has rendered `ready`. */
async function appFrame(path: RegExp, ready: string): Promise<Frame> {
  return waitFor(`a frame on ${path}`, async () => {
    const frame = [...page.frames()].reverse().find((candidate) => {
      if (!URL.canParse(candidate.url())) return false;
      const url = new URL(candidate.url());
      return path.test(url.pathname + url.search);
    });
    if (!frame) return null;
    return (await frame.locator(ready).count()) > 0 ? frame : null;
  });
}

function notice(pattern: RegExp): Promise<RecordedRequest> {
  return waitFor(`an [Application] notice matching ${pattern}`, async () =>
    recorder.requests.find((request) => request.userText.startsWith("[Application]") && pattern.test(request.userText))
  );
}

async function frameIntoView(frame: Frame): Promise<void> {
  const element = await frame.frameElement();
  await element.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
}

async function adminToken(): Promise<string> {
  const response = await fetch(`${APP_API}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "admin@admin.com", password: "admin" }),
  });
  return ((await response.json()) as { token: string }).token;
}

const before = await (async () => {
  const token = await adminToken();
  const list = (await (
    await fetch(`${APP_API}/bus/bus_opportunity?filter.name=equals:Opportunity%201`, { headers: { authorization: `Bearer ${token}` } })
  ).json()) as { data: Array<{ id: string; stage: string }> };
  return list.data[0];
})();

browser = await chromium.launch({ executablePath: CHROMIUM, args: ["--no-sandbox"] });
page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const pageErrors: string[] = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

try {
  // ── sign in once ──
  await page.goto(`${ORIGIN}/chat/`);
  await page.waitForLoadState("networkidle");
  await page.fill("#email", "admin@admin.com");
  await page.fill("#password", "admin");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${ORIGIN}/chat/`, { timeout: 60_000 });
  await page.waitForTimeout(4000);
  const chooser = page.getByText("Choose workspace");
  if (await chooser.count()) {
    await chooser.click();
    await page.getByText("Default workspace").last().click();
  }
  await newSession();

  // ── list, search, open ──
  let expected = recorder.requests.length;
  await say("List the accounts");
  await answered((expected += 2));
  await shot("list-accounts");

  await say("Which accounts are in technology?");
  await answered((expected += 2));
  await shot("search-accounts-by-industry");

  await say("Open account 4");
  const opened = await appFrame(/^\/account\/[0-9a-f-]{36}\?embed=1$/, "text=Account 4");
  await answered((expected += 3));
  await frameIntoView(opened);
  await shot("open-record-read-only");

  // ── create ──
  await newSession();
  expected = recorder.requests.length;
  await say("Create a new account");
  const form = await appFrame(/^\/account\/new\?embed=1$/, 'input[name="name"]');
  await answered((expected += 2));
  await frameIntoView(form);
  await shot("create-form-empty");
  await form.fill('input[name="name"]', ACCOUNT);
  await form.selectOption('select[name="account_type"]', { index: 1 });
  await form.selectOption('select[name="industry"]', "retail");
  await form.selectOption('select[name="status"]', "active");
  await form.selectOption('select[name="owner_id"]', { index: 1 });
  await form.fill('input[name="website"]', "https://northwind.example.com");
  await form.fill('input[name="phone"]', "+44 20 7946 0000");
  await form.fill('input[name="billing_city"]', "London");
  await form.fill('input[name="employee_count"]', "240");
  await shot("create-form-filled");
  await form.locator('button[type="submit"]', { hasText: "Create" }).first().click();
  await notice(/created in the application/);
  await answered((expected += 1));
  await shot("create-saved-and-confirmed");

  // ── read back ──
  await say("What does the new account look like?");
  await answered((expected += 3));
  await shot("read-record-summary");

  // ── update ──
  await newSession();
  expected = recorder.requests.length;
  await say("Update the new account");
  const edit = await appFrame(/^\/account\/[0-9a-f-]{36}\?embed=1&edit=1$/, 'input[name="name"]');
  await answered((expected += 3));
  await frameIntoView(edit);
  await shot("update-form-open");
  await edit.fill('input[name="phone"]', "+44 20 7946 0999");
  await edit.fill('input[name="employee_count"]', "310");
  await edit.selectOption('select[name="status"]', "on_hold");
  await shot("update-form-changed");
  await edit.getByRole("button", { name: "Save" }).first().click();
  await notice(/updated in the application/);
  await answered((expected += 1));
  await shot("update-saved-and-confirmed");

  // ── a move along the lifecycle ──
  await newSession();
  expected = recorder.requests.length;
  await say("Move opportunity 1 to qualification");
  // The stage bar labels a move by its trigger (Qualify), not by the state it reaches.
  const bar = await appFrame(/^\/opportunity\/[0-9a-f-]{36}\?embed=1&transition=qualification$/, "button:has-text('Qualify')");
  await answered((expected += 3));
  await frameIntoView(bar);
  await shot("approval-move-preselected");
  await bar.locator("button", { hasText: "Qualify" }).first().click();
  await notice(/moved|updated in the application/);
  await answered((expected += 1));
  await shot("approval-move-confirmed");

  // ── delete ──
  await newSession();
  expected = recorder.requests.length;
  await say("Delete the new account");
  const doomed = await appFrame(/^\/account\/[0-9a-f-]{36}\?embed=1&edit=1$/, 'input[name="name"]');
  await answered((expected += 3));
  await frameIntoView(doomed);
  await doomed.getByRole("button", { name: "Delete" }).first().click();
  const confirm = doomed.locator('[role="alertdialog"], [role="dialog"]').filter({ hasText: "Delete" }).last();
  await confirm.waitFor({ timeout: 15_000 });
  await shot("delete-confirmation");
  await confirm.getByRole("button", { name: /^Delete/ }).click();
  await notice(/deleted in the application/);
  await answered((expected += 1));
  await shot("delete-confirmed");

  await say("Search for Northwind again");
  await answered((expected += 2));
  await shot("search-after-delete");

  // ── enterprise reporting ──
  await newSession();
  expected = recorder.requests.length;
  await say("Show me accounts by status");
  const card = page.locator('[data-business-card="report"]').last();
  await card.waitFor({ timeout: 60_000 });
  await waitFor("report rows", async () => (await card.locator("tbody tr").count()) > 0);
  await answered((expected += 3));
  await card.scrollIntoViewIfNeeded();
  await shot("report-in-conversation");

  const [csv] = await Promise.all([page.waitForEvent("download", { timeout: 60_000 }), card.getByRole("link", { name: "CSV" }).click()]);
  const csvPath = `${OUT}/${csv.suggestedFilename()}`;
  await csv.saveAs(csvPath);
  console.log("downloaded", csv.suggestedFilename(), (await Bun.file(csvPath).text()).trim().split("\n").join(" / "));

  await card.getByRole("button", { name: /Report page|Chart and report page/ }).click();
  const reportFrame = await waitFor("the report page", async () =>
    page.frames().find((frame) => URL.canParse(frame.url()) && /^\/report\/reports\/[^/]+\/viewer$/.test(new URL(frame.url()).pathname))
  );
  await reportFrame.getByText("Report Data").waitFor({ timeout: 60_000 });
  await page.waitForTimeout(4000);
  await (await reportFrame.frameElement()).scrollIntoViewIfNeeded();
  await shot("report-page-embedded");
  const chartFrame = await waitFor("the chart", async () =>
    page.frames().find((frame) => URL.canParse(frame.url()) && /^\/report\/charts\/viewer\/[^/]+$/.test(new URL(frame.url()).pathname))
  );
  await chartFrame.locator("canvas, svg").first().waitFor({ timeout: 60_000 });
  await page.waitForTimeout(3000);
  await (await chartFrame.frameElement()).scrollIntoViewIfNeeded();
  await shot("report-chart-embedded");
  await page.evaluate(() => {
    const frames = document.querySelectorAll('[data-business-card="report"] iframe');
    (frames[frames.length - 1] as HTMLElement | undefined)?.scrollIntoView({ block: "end" });
  });
  await reportFrame.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot("report-page-chart-and-data");

  await say("Show me the activities register");
  const register = page.locator('[data-business-card="report"]').last();
  await waitFor("the register card", async () => (await page.locator('[data-business-card="report"]').count()) >= 2);
  await waitFor("register rows", async () => (await register.locator("tbody tr").count()) > 0);
  await answered((expected += 3));
  await register.scrollIntoViewIfNeeded();
  await shot("report-register-in-conversation");
} catch (error) {
  await page.screenshot({ path: `${OUT}/failure.png` }).catch(() => {});
  console.log("FAILED:", error instanceof Error ? error.message : error);
  console.log("frames:", page.frames().map((f) => f.url()).join("\n  "));
  for (const request of recorder.requests.slice(-3)) console.log("turn:", request.userText.slice(0, 80), "| results:", request.turnResults.map((r) => r.slice(0, 300)).join(" || "));
  process.exitCode = 1;
} finally {
  if (pageErrors.length) console.log("page errors:", pageErrors.join(" | "));
  await browser.close();
  recorder.stop();
  // Put the demonstration data back the way it was: the opportunity's stage
  // (the drawn lifecycle has no edge back, so this is a direct correction of
  // test data), and the account if a step failed before deleting it.
  const db = new pg.Client({ connectionString: APP_DB });
  await db.connect();
  try {
    if (before) await db.query("UPDATE bus_opportunity SET stage = $1 WHERE id = $2", [before.stage, before.id]);
    await db.query("DELETE FROM bus_account WHERE name = $1", [ACCOUNT]);
  } finally {
    await db.end();
  }
}
console.log(`done: ${shots} screenshots`);
