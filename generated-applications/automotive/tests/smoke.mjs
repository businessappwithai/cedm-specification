/**
 * Browser smoke test for this application.
 *
 *   bun smoke.mjs [--shots]            # backend :3000 and frontend :3001 already running
 *
 * Signs in as the seeded administrator, then visits the dashboard, every window
 * the navigation offers (its list, its first record and its create page), the
 * rules, workflows and reports screens, and records what is wrong: a crashed
 * screen ("Something went wrong"), a table name leaking into the UI (`bus_…`),
 * a failed (5xx) request, a console or page error. Prints one JSON object and
 * exits 1 if anything was found, so it is a CI gate as well as a report.
 *
 * `qa.sh` runs this and the Rust request suite together.
 *
 * Generated: 2026-10-02T01:02:24.309Z
 * Project: automotive
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const domain = "automotive";
const shots = process.argv.includes("--shots");
const BASE = process.env.APP_URL ?? "http://localhost:3001";
const OUT = (process.env.SMOKE_OUT ?? new URL("./smoke-output/", import.meta.url).pathname).replace(/\/?$/, "/");
if (shots) mkdirSync(OUT, { recursive: true });

// CHROMIUM names a browser binary when Playwright's own download is not the one
// to use (a container with a different revision installed).
const browser = await chromium.launch({
  ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}),
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const findings = [];
let where = "login";
const note = (kind, detail) => findings.push({ where, kind, detail: String(detail).slice(0, 240) });
page.on("pageerror", (e) => note("pageerror", e.message));
page.on("console", (m) => {
  if (m.type() !== "error") return;
  const t = m.text();
  if (/401|Unauthorized|favicon/i.test(t)) return;
  // A 429 is counted once, below, rather than once per console line it produces.
  if (/429|Too Many Requests|Slow down/i.test(t)) return;
  note("console", t);
});
let refused = 0;
page.on("response", (r) => {
  const s = r.status();
  if (s === 429) refused++;
  if (s >= 500) note("http" + s, r.url());
});

const settle = async () => {
  await page.waitForLoadState("networkidle", { timeout: 2500 }).catch(() => {});
  await page.waitForTimeout(400);
};
const inspect = async () => {
  const text = await page.locator("body").innerText().catch(() => "");
  if (/Something went wrong/.test(text)) note("crash", text.match(/Something went wrong[^\n]*\n?[^\n]*/)?.[0]);
  const leak = text.match(/\bbus_[a-z0-9_]+/g);
  if (leak) note("table-name", [...new Set(leak)].slice(0, 4).join(", "));
  return text;
};

// sign in, retrying until the app has hydrated (a click before that is a GET)
for (let i = 0; i < 8; i++) {
  await page.goto(BASE + "/auth/login");
  await page.waitForTimeout(1500);
  await page.fill('input[type="email"]', "admin@admin.com");
  await page.fill('input[type="password"]', "admin");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  if (!page.url().includes("/auth/login")) break;
}
if (page.url().includes("/auth/login")) {
  note("login", "could not sign in");
  console.log(JSON.stringify({ domain, findings }));
  await browser.close();
  process.exit(1);
}

// A step that throws is a finding, not a crash: the run still reports everything it
// saw before it, and still exits 1.
let cards = 0;
let visited = 0;
let records = 0;
let creates = 0;
let themesApplied = 0;
let stateBars = 0;
try {
where = "dashboard";
await page.goto(BASE + "/");
await settle();
await inspect();
cards = await page.locator(".swiss-card").count();
if (shots) await page.screenshot({ path: OUT + "dashboard.png" });

const hrefs = await page.evaluate(() =>
  [...new Set([...document.querySelectorAll("aside a[href], nav a[href]")].map((a) => a.getAttribute("href")))].filter(
    (h) => h && h.startsWith("/") && !h.startsWith("/admin") && !["/", "/ask", "/reports", "/dashboard"].includes(h)
  )
);

// Every window up to a cap; past it, an even sample, so a domain with a hundred
// reference-data windows costs the same as one with thirty.
const limit = Number(process.env.LIMIT ?? 45);
const sample =
  hrefs.length <= limit
    ? hrefs
    : Array.from({ length: limit }, (_, i) => hrefs[Math.floor((i * hrefs.length) / limit)]);
for (const href of sample) {
  const t0 = Date.now();
  where = href;
  await page.goto(BASE + href);
  await settle();
  const text = await inspect();
  visited++;
  const row = page.locator("tbody tr").first();
  if (await row.count()) {
    await row.click().catch(() => {});
    await settle();
    await inspect();
    if (page.url() !== BASE + href) records++;
  }
  where = href + "/new";
  await page.goto(BASE + href + "/new");
  await settle();
  const form = await inspect();
  if (!/Something went wrong/.test(form)) creates++;
  if (process.env.VERBOSE) console.error(href, Date.now() - t0, "ms");
  if (shots && visited === 1) {
    await page.goto(BASE + href);
    await settle();
    await page.screenshot({ path: OUT + "list.png" });
  }
}

// The shell: every theme applies without breaking a screen, the menu collapses,
// and the toolbar's Refresh answers.
where = "themes";
await page.goto(BASE + (sample[0] ?? "/"));
await settle();
const themes = ["Neutral", "Butter", "Chocolate", "Matcha", "Stone", "Gothic", "Y2K"];
for (const name of themes) {
  const selector = page.locator('[data-testid="theme-selector"]').first();
  if (!(await selector.count())) {
    note("theme-selector", "no theme selector on the page");
    break;
  }
  await selector.click().catch(() => {});
  await page.waitForTimeout(300);
  await page.getByRole("option", { name, exact: true }).first().click().catch(() => {});
  await page.waitForTimeout(500);
  const applied = await page.evaluate(() => document.querySelector("[data-astryx-theme]")?.getAttribute("data-astryx-theme"));
  if (applied === name.toLowerCase()) themesApplied++;
  else note("theme", `${name} did not apply (got ${applied})`);
  await inspect();
}
await page.locator('[data-testid="theme-selector"]').first().click().catch(() => {});
await page.getByRole("option", { name: "Neutral", exact: true }).first().click().catch(() => {});

where = "menu";
const collapse = page.getByRole("button", { name: /collapse|expand|toggle (side)?(bar|menu)/i }).first();
if (await collapse.count()) {
  const side = page.locator("aside, nav").first();
  const before = await side.boundingBox({ timeout: 3000 }).catch(() => null);
  await collapse.click().catch(() => {});
  await page.waitForTimeout(500);
  const after = await side.boundingBox({ timeout: 3000 }).catch(() => null);
  if (before && after && after.width >= before.width) note("menu", "the menu did not collapse");
  await collapse.click().catch(() => {});
} else {
  note("menu", "no collapse button with an accessible name");
}

where = "refresh";
const refresh = page.getByRole("button", { name: /refresh/i }).first();
if (await refresh.count()) {
  const reread = page.waitForResponse((r) => /\/api\//.test(r.url()), { timeout: 5000 }).catch(() => null);
  await refresh.click().catch(() => {});
  if (!(await reread)) note("refresh", "Refresh made no request");
} else {
  note("refresh", "no Refresh button with an accessible name");
}

// A record whose table has a drawn state machine shows it.
where = "workflow-state";
for (const href of sample.slice(0, 12)) {
  await page.goto(BASE + href);
  await settle();
  const row = page.locator("tbody tr").first();
  if (!(await row.count())) continue;
  await row.click().catch(() => {});
  await settle();
  if (await page.locator('[data-testid="workflow-state-bar"]').count()) stateBars++;
}

for (const path of ["/admin/rules", "/admin/workflow-definitions", "/admin/workflows", "/reports"]) {
  where = path;
  await page.goto(BASE + path);
  await settle();
  await inspect();
  if (shots) await page.screenshot({ path: OUT + path.replace(/\//g, "_").replace(/^_/, "") + ".png" });
}

} catch (e) {
  note("smoke-crash", e?.message ?? e);
}

if (refused > 0) {
  where = "rate-limit";
  note(
    "rate-limited",
    `${refused} request(s) were refused with 429. The smoke test is faster than a person; start the backend with RATE_LIMIT_MAX_PER_MINUTE=0 (tests/qa.sh does).`
  );
}
await browser.close();
const result = { domain, cards, windows: visited, records, creates, themes: themesApplied, stateBars, findings };
console.log(JSON.stringify(result));
process.exit(findings.length ? 1 : 0);
