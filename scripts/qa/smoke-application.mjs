// Browser smoke test for one running generated application.
//
//   bun scripts/qa/smoke-application.mjs <domain> [--shots]
//
// Signs in, then visits the dashboard, every window the navigation offers (its
// list, its first record and its create page), the rules, workflows and
// reports screens, and records what is wrong: a crashed screen ("Something went
// wrong"), a table name leaking into the UI (`bus_…`), a failed request that is
// not an expected 401, a page-level error. Prints one JSON object; exit 1 if
// anything was found. Backend :3000, frontend :3001 (scripts/serve-application.sh).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const domain = process.argv[2] ?? "app";
const shots = process.argv.includes("--shots");
const BASE = process.env.APP_URL ?? "http://localhost:3001";
const OUT = new URL(`../../generated-applications/screenshots/${domain}/`, import.meta.url).pathname;
if (shots) mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
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
  note("console", t);
});
page.on("response", (r) => {
  const s = r.status();
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

where = "dashboard";
await page.goto(BASE + "/");
await settle();
await inspect();
const cards = await page.locator(".swiss-card").count();
if (shots) await page.screenshot({ path: OUT + "dashboard.png" });

const hrefs = await page.evaluate(() =>
  [...new Set([...document.querySelectorAll("aside a[href], nav a[href]")].map((a) => a.getAttribute("href")))].filter(
    (h) => h && h.startsWith("/") && !h.startsWith("/admin") && !["/", "/ask", "/reports", "/dashboard"].includes(h)
  )
);

let visited = 0;
let records = 0;
let creates = 0;
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

for (const path of ["/admin/rules", "/admin/workflow-definitions", "/admin/workflows", "/reports"]) {
  where = path;
  await page.goto(BASE + path);
  await settle();
  await inspect();
  if (shots) await page.screenshot({ path: OUT + path.replace(/\//g, "_").replace(/^_/, "") + ".png" });
}

await browser.close();
const result = { domain, cards, windows: visited, records, creates, findings };
console.log(JSON.stringify(result));
process.exit(findings.length ? 1 : 0);
