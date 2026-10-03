#!/usr/bin/env bun
/**
 * Screenshots of one running generated application, for its documentation site.
 *
 *   bun scripts/website/capture.ts <domain> [--only entities|admin|rules|processes]
 *
 * Needs the application up (`bash scripts/serve-application.sh <domain>`:
 * backend :3000, frontend :3001). The browser is gstack's own headless Chromium
 * (`$B`, the /browse skill's fallback driver); the plan — which entities,
 * rules and processes exist — comes from `scripts/build-website.ts --plan`, so
 * the capture and the pages that link the images are derived from one list.
 *
 * Captures are downsized and re-encoded (1000 px wide, JPEG q55): the sites
 * hold several thousand of them and the originals are three times the size.
 * A capture that fails is reported and skipped — the page that would have
 * linked it simply does not draw it.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..", "..");
const browse =
  process.env.BROWSE_BIN ?? path.join(os.homedir(), ".claude/skills/gstack/browse/dist/browse");
const frontend = process.env.FRONTEND_URL ?? "http://localhost:3001";
const backend = process.env.BACKEND_URL ?? "http://localhost:3000";

const [domain, ...rest] = process.argv.slice(2);
if (!domain) {
  console.error("usage: capture.ts <domain> [--only entities|admin|rules|processes]");
  process.exit(2);
}
const only = rest.includes("--only") ? rest[rest.indexOf("--only") + 1] : undefined;
const wants = (part: string) => !only || only === part;

const staticDir = path.join(root, "website", domain, "static");
const scratch = mkdtempSync(path.join(os.tmpdir(), `capture-${domain}-`));
let viewport = "";
let captured = 0;
let skipped = 0;

function b(...args: string[]): { ok: boolean; out: string } {
  const result = spawnSync(browse, args, { encoding: "utf8", timeout: 90_000 });
  return { ok: result.status === 0, out: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

function setViewport(size: string) {
  if (viewport === size) return;
  b("viewport", size);
  viewport = size;
}

/** Open a page and wait until it has drawn. */
function open(route: string, settle = 900): boolean {
  const go = b("goto", `${frontend}${route}`);
  if (!go.ok) return false;
  b("wait", "--networkidle");
  Bun.sleepSync(settle);
  return true;
}

function shot(rel: string, size = "1360x860"): boolean {
  setViewport(size);
  const tmp = path.join(scratch, "shot.jpg");
  const result = b("screenshot", tmp);
  const target = path.join(staticDir, rel);
  if (!result.ok || !existsSync(tmp)) {
    console.log(`  skipped ${rel}`);
    skipped++;
    return false;
  }
  mkdirSync(path.dirname(target), { recursive: true });
  execFileSync("convert", [tmp, "-resize", "1000x>", "-quality", "55", "-strip", "-interlace", "Plane", target]);
  rmSync(tmp, { force: true });
  captured++;
  return statSync(target).size > 0;
}

/** The page shows an error instead of the screen it was asked for. */
function looksBroken(): boolean {
  const text = b("text").out;
  return /Application error|Something went wrong|Cannot GET|404|Not Found/i.test(text.slice(0, 600));
}

async function api(route: string, token: string): Promise<any> {
  const response = await fetch(`${backend}${route}`, { headers: { authorization: `Bearer ${token}` } });
  return response.ok ? response.json() : [];
}

function signIn(): string {
  setViewport("1360x860");
  open("/auth/login", 1500);
  shot("img/login.jpg");
  b("fill", "input[type=email]", "admin@admin.com");
  b("fill", "input[type=password]", "admin");
  b("click", "button:has-text('Sign In')");
  for (let attempt = 0; attempt < 10; attempt++) {
    Bun.sleepSync(1000);
    if (b("url").out.includes("/dashboard")) break;
  }
  return "";
}

const plan = JSON.parse(
  execFileSync("bun", [path.join(root, "scripts/build-website.ts"), "--plan", domain], { encoding: "utf8" })
) as {
  entities: Array<{ name: string; slug: string; isReference: boolean; isLine: boolean; hasLifecycle: boolean }>;
  lifecycles: Array<{ entity: string; slug: string; initial: string | null; move: string | null }>;
  rules: Array<{ name: string; slug: string }>;
  sagas: Array<{ name: string; slug: string }>;
  admin: Array<{ id: string; route: string }>;
};

const loginResponse = await fetch(`${backend}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "admin@admin.com", password: "admin" }),
});
const token: string = ((await loginResponse.json()) as { token: string }).token;

/**
 * Make a few writes through the API so the screens that show activity — the
 * audit log, the workflow monitor, a record's lifecycle bar — have something to
 * show. Each is a legal move the model itself draws; a refusal is skipped.
 */
async function warmUp(): Promise<void> {
  const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
  for (const lifecycle of plan.lifecycles.slice(0, 6)) {
    if (!lifecycle.initial || !lifecycle.move) continue;
    const list = await fetch(`${backend}/api/bus/${lifecycle.slug}?limit=20`, { headers });
    if (!list.ok) continue;
    const rows = ((await list.json()) as { data?: Array<Record<string, unknown>> }).data ?? [];
    const row = rows.find((candidate) => String(candidate.status ?? "").toUpperCase() === lifecycle.initial?.toUpperCase());
    if (!row) continue;
    await fetch(`${backend}/api/bus/${lifecycle.slug}/${String(row.id)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: lifecycle.move }),
    });
  }
}

signIn();
open("/dashboard", 1500);
shot("img/dashboard.jpg");

// The theme selector, with a dark theme applied, then restored.
b("select", "[aria-label='Theme'], select", "Gothic");
Bun.sleepSync(700);
shot("img/themes.jpg");
b("select", "[aria-label='Theme'], select", "Neutral");

await warmUp();

if (wants("entities")) {
  for (const entity of plan.entities) {
    if (entity.isLine) continue;
    if (open(`/${entity.slug}`) && !looksBroken()) {
      shot(`img/entities/${entity.slug}-list.jpg`);
      if (entity.hasLifecycle) {
        const row = b("click", "table tbody tr:first-child");
        if (row.ok) {
          b("wait", "--networkidle");
          Bun.sleepSync(900);
          shot(`img/entities/${entity.slug}-record.jpg`, "1360x1100");
        }
      }
    }
    if (!entity.isReference && open(`/${entity.slug}/new`) && !looksBroken()) {
      shot(`img/entities/${entity.slug}-new.jpg`, "1360x1500");
    }
  }
}

if (wants("admin")) {
  for (const page of plan.admin) {
    if (open(page.route, 1200)) shot(`img/admin/${page.id}.jpg`);
  }
}

if (wants("rules")) {
  const rules: Array<{ id: string; ruleName: string }> = await api("/api/rules", token);
  const byName = new Map(rules.map((rule) => [rule.ruleName, rule.id]));
  for (const rule of plan.rules) {
    const id = byName.get(rule.name);
    if (id && open(`/admin/rules/${id}/edit`, 1200) && !looksBroken()) shot(`img/rules/${rule.slug}.jpg`);
  }
}

if (wants("processes")) {
  const definitions: Array<{ id: string; name: string }> = await api("/api/workflow-definitions", token);
  const byName = new Map(definitions.map((definition) => [definition.name, definition.id]));
  for (const saga of plan.sagas) {
    const id = byName.get(saga.name);
    if (id && open(`/admin/workflow-definitions/${id}/edit`, 1500) && !looksBroken()) {
      shot(`img/processes/${saga.slug}.jpg`, "1360x1000");
    }
  }
}

rmSync(scratch, { recursive: true, force: true });
console.log(`${domain}: ${captured} captured, ${skipped} skipped`);
