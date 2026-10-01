#!/usr/bin/env node
/**
 * Screenshots of a running generated application.
 *
 *   node scripts/screenshot-application.mjs <domain> <frontendUrl> <outDir>
 *
 * Signs in as the seeded administrator and captures the dashboard (the page
 * the application opens on), one entity's list, its create form and a record,
 * and the Application Dictionary's own window screen. A capture that cannot be
 * made is reported and skipped rather than stopping the run: what this proves
 * is what the application actually shows, so a missing screen is a finding.
 *
 * The browser is the container's own Chromium; Playwright's bundled revision
 * does not match it.
 */

import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const [domain, baseUrl, outDir] = process.argv.slice(2);
if (!domain || !baseUrl || !outDir) {
  console.error("usage: screenshot-application.mjs <domain> <frontendUrl> <outDir>");
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const problems = [];
page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));

const settle = async () => {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1200);
};

const shot = async (name, options = {}) => {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, ...options });
  console.log(`  captured ${domain}/${name}.png`);
};

try {
  // Sign in. The form posts only after hydration, so wait for the page to be
  // idle before submitting: an early click does a plain GET and looks like a
  // broken login.
  await page.goto(`${baseUrl}/auth/login`);
  await settle();
  await page.locator('input[type="email"]').fill("admin@admin.com");
  await page.locator('input[type="password"]').fill("admin");
  await shot("login");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 30000 });
  await settle();

  // The dashboard.
  await page.goto(`${baseUrl}/`);
  await settle();
  await shot("dashboard", { fullPage: true });
  await shot("dashboard-top");

  // One entity: the first card that links somewhere that is not the admin area.
  const hrefs = await page
    .locator("a[href]")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  const entityHref = hrefs.find(
    (href) => href && /^\/[a-z0-9-]+$/.test(href) && !["/admin", "/auth", "/"].includes(href)
  );
  if (entityHref) {
    await page.goto(`${baseUrl}${entityHref}`);
    await settle();
    await shot("list");

    const create = page.getByRole("button", { name: /^(create|new|add)/i }).first();
    if (await create.count()) {
      await create.click();
      await page.waitForTimeout(800);
      await shot("create-form");
      await page.keyboard.press("Escape").catch(() => {});
    }

    await page.goto(`${baseUrl}${entityHref}`);
    await settle();
    const row = page.locator("tbody tr").first();
    if (await row.count()) {
      await row.click().catch(() => {});
      await settle();
      await shot("record");
    }
  } else {
    console.log(`  no entity link found on the ${domain} dashboard`);
  }

  // The Application Dictionary's own screens.
  await page.goto(`${baseUrl}/admin/elements`);
  await settle();
  await shot("admin");
} catch (error) {
  console.error(`  ${domain}: ${error instanceof Error ? error.message : String(error)}`);
  await page.screenshot({ path: path.join(outDir, "error.png") }).catch(() => {});
  process.exitCode = 1;
} finally {
  if (problems.length) console.log(`  page errors: ${problems.slice(0, 3).join(" | ")}`);
  await browser.close();
}
