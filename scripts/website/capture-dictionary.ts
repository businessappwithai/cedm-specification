#!/usr/bin/env bun
/**
 * Screenshots for the shared Application Dictionary manual
 * (`website/application-dictionary/`), taken from a running application — the
 * `common` one by default, because it is the smallest that carries every
 * administrator window.
 *
 *   bash scripts/serve-application.sh common
 *   bun scripts/website/capture-dictionary.ts [domain]
 *
 * Each entry opens a route, performs a few clicks, and captures. The browser is
 * gstack's headless Chromium (`$B`). A step that fails is reported and skipped.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..", "..");
const browse =
  process.env.BROWSE_BIN ?? path.join(os.homedir(), ".claude/skills/gstack/browse/dist/browse");
const frontend = process.env.FRONTEND_URL ?? "http://localhost:3001";
const backend = process.env.BACKEND_URL ?? "http://localhost:3000";
const outDir = path.join(root, "website", "application-dictionary", "static", "img");
const scratch = mkdtempSync(path.join(os.tmpdir(), "capture-dictionary-"));

function b(...args: string[]): { ok: boolean; out: string } {
  const result = spawnSync(browse, args, { encoding: "utf8", timeout: 90_000 });
  return { ok: result.status === 0, out: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

let viewport = "";
function setViewport(size: string) {
  if (viewport !== size) {
    b("viewport", size);
    viewport = size;
  }
}

function open(route: string, settle = 1200): void {
  b("goto", `${frontend}${route}`);
  b("wait", "--networkidle");
  Bun.sleepSync(settle);
}

function settle(ms = 1200): void {
  b("wait", "--networkidle");
  Bun.sleepSync(ms);
}

let captured = 0;
function shot(name: string, size = "1360x900"): void {
  setViewport(size);
  const tmp = path.join(scratch, "shot.jpg");
  const result = b("screenshot", tmp);
  if (!result.ok || !existsSync(tmp)) {
    console.log(`  skipped ${name}`);
    return;
  }
  const target = path.join(outDir, `${name}.jpg`);
  mkdirSync(path.dirname(target), { recursive: true });
  execFileSync("convert", [tmp, "-resize", "1000x>", "-quality", "55", "-strip", "-interlace", "Plane", target]);
  rmSync(tmp, { force: true });
  captured++;
}

const click = (selector: string, wait = 1200) => {
  const result = b("click", selector);
  if (!result.ok) console.log(`  click failed: ${selector}`);
  settle(wait);
};

// Sign in once.
setViewport("1360x900");
open("/auth/login", 1500);
b("fill", "input[type=email]", "admin@admin.com");
b("fill", "input[type=password]", "admin");
b("click", "button:has-text('Sign In')");
for (let attempt = 0; attempt < 10; attempt++) {
  Bun.sleepSync(1000);
  if (b("url").out.includes("/dashboard")) break;
}

const loginResponse = await fetch(`${backend}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "admin@admin.com", password: "admin" }),
});
const token = ((await loginResponse.json()) as { token: string }).token;
const get = async (route: string) =>
  (await fetch(`${backend}${route}`, { headers: { authorization: `Bearer ${token}` } })).json();

open("/dashboard", 1500);
setViewport("1360x2400");
shot("dashboard-full", "1360x2400");
setViewport("1360x900");

// Every administrator window, as it opens.
const pages: Array<[string, string]> = [
  ["admin-index", "/admin"],
  ["rules", "/admin/rules"],
  ["workflow-definitions", "/admin/workflow-definitions"],
  ["workflows", "/admin/workflows"],
  ["automations", "/admin/automations"],
  ["audit", "/admin/audit"],
  ["tables", "/admin/tables"],
  ["windows", "/admin/windows"],
  ["categories", "/admin/categories"],
  ["elements", "/admin/elements"],
  ["references", "/admin/references"],
  ["fields", "/admin/fields"],
  ["reports", "/reports"],
  ["users", "/admin/users"],
  ["roles", "/admin/roles"],
  ["system", "/admin/system"],
  ["rules-new", "/admin/rules/new"],
  ["workflow-definitions-new", "/admin/workflow-definitions/new"],
];
for (const [name, route] of pages) {
  open(route);
  shot(name);
}

// Lists: advanced search, new, a record.
open("/admin/tables");
click("button:has-text('Search')", 800);
shot("list-advanced-search");
open("/admin/tables");
click("button:has-text('New')", 1500);
shot("tables-new", "1360x1300");

open("/admin/tables");
click("table tbody tr:first-child", 2000);
shot("table-record", "1360x1500");
click("table tbody tr:first-child", 2000);
shot("column-record", "1360x1400");

open("/admin/windows");
click("table tbody tr:first-child", 2000);
shot("window-record", "1360x1400");
click("table tbody tr:first-child", 2000);
shot("tab-record", "1360x1400");
click("table tbody tr:first-child", 2000);
shot("field-record", "1360x1400");

open("/admin/references");
click("table tbody tr:nth-child(8)", 2000);
shot("reference-record", "1360x1200");

open("/admin/system");
click("table tbody tr:first-child", 2000);
shot("system-record", "1360x1000");

// Rules and processes.
const rules = (await get("/api/rules")) as Array<{ id: string }>;
if (rules[0]) {
  open(`/admin/rules/${rules[0].id}/edit`, 1800);
  shot("rule-edit", "1360x1000");
  click("button:has-text('Test Rule')", 1200);
  shot("rule-test", "1360x1100");
}
const definitions = (await get("/api/workflow-definitions")) as Array<{ id: string }>;
if (definitions[0]) {
  open(`/admin/workflow-definitions/${definitions[0].id}/edit`, 2000);
  shot("workflow-edit", "1360x1000");
  click("button:has-text('Diagram')", 1500);
  shot("workflow-diagram", "1360x1000");
}
open("/admin/automations");
click("button:has-text('+ New automation')", 1500);
shot("automation-new", "1360x1100");
// The Field Layout Manager with an entity chosen: open the picker, take the first.
open("/admin/fields");
b("click", "[role=combobox]");
Bun.sleepSync(600);
b("press", "Enter");
settle(2000);
shot("fields-entity", "1360x1300");

// Categories, field layout, audit.
open("/admin/categories");
click("button:has-text('New Category')", 1200);
shot("categories-new", "1360x1000");
open("/admin/audit", 2000);
shot("audit-entries", "1360x1000");

console.log(`dictionary: ${captured} captured`);
rmSync(scratch, { recursive: true, force: true });
