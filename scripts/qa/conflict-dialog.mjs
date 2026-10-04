// Browser check of optimistic locking: two people, one record.
//
//   bun scripts/qa/conflict-dialog.mjs --window /account --table bus_account [--field name]
//
// Two signed-in browser contexts open the same record. The first edits a text
// field and saves. The second, still holding the version it read, edits the
// same field and saves — and must be shown the conflict dialog, naming who
// changed the record and the field, with Refresh and Overwrite. Run twice: once
// choosing Overwrite (the stored value must be the second person's), once
// choosing Refresh (the stored value must stay the first person's, and the
// form must show it). Prints one JSON object; exit 1 on any failure.
// Backend :3000, frontend :3001 (scripts/serve-application.sh).
import { chromium } from "playwright";

const arg = (name, fallback) => {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 ? process.argv[at + 1] : fallback;
};
const WINDOW = arg("window");
const TABLE = arg("table");
const FIELD = arg("field");
const BASE = process.env.APP_URL ?? "http://localhost:3001";
const API = process.env.API_URL ?? "http://localhost:3000/api";
if (!WINDOW || !TABLE) {
  console.error("usage: conflict-dialog.mjs --window /<window> --table bus_<entity> [--field <column>]");
  process.exit(2);
}

const failures = [];
const fail = (step, detail) => failures.push({ step, detail: String(detail).slice(0, 300) });

const login = await fetch(`${API}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@admin.com", password: "admin" }),
}).then((r) => r.json());
const auth = { Authorization: `Bearer ${login.token}` };
const api = (path, init = {}) =>
  fetch(`${API}${path}`, { ...init, headers: { ...auth, "Content-Type": "application/json", ...(init.headers ?? {}) } });

const list = await api(`/bus/${TABLE}?limit=1`).then((r) => r.json());
const record = list?.data?.[0];
if (!record?.id) {
  console.log(JSON.stringify({ ok: false, failures: [{ step: "setup", detail: `no ${TABLE} record to edit` }] }));
  process.exit(1);
}
const meta = await api(`/bus/${TABLE}/meta`).then((r) => r.json());
const column =
  FIELD ??
  meta.columns.find(
    (c) => c.sys_reference_id === 10 && c.is_updateable && !c.is_key && !/_id$/.test(c.column_name)
  )?.column_name;
if (!column) {
  console.log(JSON.stringify({ ok: false, failures: [{ step: "setup", detail: "no editable text column" }] }));
  process.exit(1);
}
const label = meta.columns.find((c) => c.column_name === column)?.name ?? column;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});

async function signedIn() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  for (let i = 0; i < 8; i++) {
    await page.goto(`${BASE}/auth/login`);
    await page.waitForTimeout(1500);
    await page.fill('input[type="email"]', "admin@admin.com");
    await page.fill('input[type="password"]', "admin");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    if (!page.url().includes("/auth/login")) return page;
  }
  throw new Error("could not sign in");
}

/** Open the record, enter edit mode, and type `value` into the column's input. */
async function openAndEdit(page, value) {
  await page.goto(`${BASE}${WINDOW}/${record.id}`);
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  await page.getByRole("button", { name: /^Edit$/ }).first().click();
  // The form names each input after its column; the Astryx Input replaces the
  // id a <Label htmlFor> would point at, so a label lookup finds nothing.
  const input = page.locator(`[name="${column}"]`).first();
  await input.waitFor({ timeout: 5000 });
  await input.fill(value);
}

async function save(page) {
  await page.getByRole("button", { name: /Save Changes/ }).first().click();
  await page.waitForTimeout(1500);
}

async function stored() {
  const row = await api(`/bus/${TABLE}/${record.id}`).then((r) => r.json());
  return row[column];
}

async function round(choice) {
  const first = await signedIn();
  const second = await signedIn();
  const theirs = `qa-first-${Date.now()}`;
  const mine = `qa-second-${Date.now()}`;

  // Both open the record before either saves: both hold the same version.
  await openAndEdit(first, theirs);
  await openAndEdit(second, mine);
  await save(first);
  if ((await stored()) !== theirs) fail(`${choice}: first save`, `stored ${await stored()}`);

  await save(second);
  const dialog = second.getByText("This record was changed while you were editing it");
  if (!(await dialog.isVisible().catch(() => false))) {
    fail(`${choice}: dialog`, "the second save did not open the conflict dialog");
    return;
  }
  const body = await second.locator("body").innerText();
  if (!body.includes(label)) fail(`${choice}: dialog`, `the dialog does not name the field ${label}`);
  if (!body.includes(theirs)) fail(`${choice}: dialog`, "the dialog does not show the saved value");

  if (choice === "overwrite") {
    await second.getByRole("button", { name: "Overwrite with my changes" }).click();
    await second.waitForTimeout(1500);
    if ((await stored()) !== mine) fail("overwrite: stored", `expected ${mine}, stored ${await stored()}`);
  } else {
    await second.getByRole("button", { name: "Refresh to latest" }).click();
    await second.waitForTimeout(1000);
    if ((await stored()) !== theirs) fail("refresh: stored", `expected ${theirs}, stored ${await stored()}`);
    const shown = await second.locator("body").innerText();
    if (!shown.includes(theirs)) fail("refresh: form", "the form does not show the latest value");
  }
  await first.context().close();
  await second.context().close();
}

try {
  await round("overwrite");
  await round("refresh");
} catch (error) {
  fail("run", error instanceof Error ? error.message : error);
}
await browser.close();
console.log(JSON.stringify({ ok: failures.length === 0, table: TABLE, column, failures }, null, 2));
process.exit(failures.length === 0 ? 0 : 1);
