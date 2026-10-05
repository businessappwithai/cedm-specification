#!/usr/bin/env bun
/**
 * The website's "Download the deployable app (.zip)" button, tested the way a
 * reader uses it.
 *
 *   bun scripts/sites/check-loco-download.ts [--model crm] [--keep <dir>]
 *
 * 1. Serves the website (`businessappwithairust/`, a sibling of this
 *    repository) over HTTP and opens chapter 09 in Chromium — a real browser,
 *    where a module's URL is `http:` and there is no filesystem. Under Bun the
 *    bundle's URL is `file:`, which is how a module-scope `fileURLToPath` in the
 *    language loader broke every download in a browser while every Bun-run
 *    check of the same bundle passed.
 * 2. Generates, clicks the button, and saves the archive the page offers.
 * 3. Generates the same model under the same name with the real pipeline
 *    (`generateApplication`, as the `appwithai` CLI does) and compares every
 *    file. Three differences are expected and normalised, and nothing else is
 *    accepted:
 *    - the `Generated:` / `generatedAt` timestamps and the manifest's `input`
 *      path, which name when and from where;
 *    - Rust layout: the pipeline runs `cargo fmt` over the backend and a
 *      browser cannot, so the archive's `.rs` files are formatted here before
 *      comparing. A difference that survives formatting is a real one.
 *
 * Exits non-zero on any difference, naming the files. Running the archive
 * (build, migrate, seed, its own request suite) is a slower step documented in
 * `docs/qa/` and done by hand; this script is the gate on what the button
 * writes.
 */

import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { chromium } from "playwright";
import { readModelYaml } from "../../packages/generator/src/model-yaml/index";
import { generateApplication } from "../../packages/generator/src/pipeline/generate-application";
import { NO_LOG } from "../../packages/generator/src/pipeline/logger-port";

const ROOT = resolve(import.meta.dir, "../..");
const SITE = resolve(ROOT, "..", "businessappwithairust");
const arg = (name: string, fallback: string) => {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 ? (process.argv[at + 1] ?? fallback) : fallback;
};
const MODEL = arg("model", "crm");
const NAME = "zipcheck";
const CHROMIUM = process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const scratch = arg("keep", "") || mkdtempSync(join(tmpdir(), "loco-download-"));

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name === "node_modules" || name === "target") continue;
      out.push(...walk(path));
    } else out.push(path);
  }
  return out;
}

function normalise(path: string, text: string): string {
  let out = text
    .replace(/^.*Generated:.*$/gm, "<generated>")
    .replace(/"generatedAt": "[^"]*"/g, '"generatedAt": "<at>"')
    .replace(/datetime="[^"]*">[^<]*</g, 'datetime="<at>"><at><');
  if (path.endsWith(".appwithai.json")) out = out.replace(/"input": "[^"]*"/, '"input": "<input>"');
  return out;
}

async function run(command: string[], cwd: string): Promise<void> {
  const proc = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe" });
  const code = await proc.exited;
  if (code !== 0) throw new Error(`${command.join(" ")} failed in ${cwd}: ${await new Response(proc.stderr).text()}`);
}

// ── 1–2: the page, in a browser ───────────────────────────────────────────────
const server = Bun.serve({
  port: 0,
  async fetch(request) {
    const path = decodeURIComponent(new URL(request.url).pathname);
    const file = Bun.file(join(SITE, path.endsWith("/") ? `${path}index.html` : path));
    return (await file.exists()) ? new Response(file) : new Response("not found", { status: 404 });
  },
});

const step = (what: string) => console.log(`· ${what}`);
const zipPath = join(scratch, `${NAME}.zip`);
step(`chapter 09 in Chromium, model #${MODEL}`);
const browser = await chromium.launch({ executablePath: CHROMIUM, args: ["--no-sandbox"] });
try {
  const page = await browser.newPage({ acceptDownloads: true });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://localhost:${server.port}/guide/run-in-browser.html#${MODEL}`);
  await page.fill("#app-name", NAME);
  await page.click("#generate");
  step("generated in the page; pressing Download the deployable app");
  await page.waitForSelector("#download-stack:not([disabled])", { timeout: 180_000 });
  const download = page.waitForEvent("download", { timeout: 300_000 }).catch(() => null);
  await page.click("#download-stack");
  await page.waitForSelector("#download-stack-hint.hint--done, #download-stack-hint.hint--bad", { timeout: 300_000 });
  const saved = await download;
  if (!saved) {
    throw new Error(
      `the page offered no archive: ${await page.locator("#download-stack-hint").innerText()}` +
        (errors.length ? `\npage errors: ${errors.join("; ")}` : "")
    );
  }
  await saved.saveAs(zipPath);
} finally {
  await browser.close();
  server.stop(true);
}

step(`saved ${zipPath}`);
const unzipped = join(scratch, "zip");
await run(["unzip", "-q", zipPath, "-d", unzipped], scratch);
const fromZip = join(unzipped, NAME);

// ── 3: the same model through the real pipeline ──────────────────────────────
// The page's own table names the file behind each key (`#drug` is drug-discovery).
const pageScript = readFileSync(join(SITE, "assets", "js", "run-in-browser.js"), "utf8");
const listed = new RegExp(`\\b${MODEL}:\\s*\\{\\s*path:\\s*"([^"]+)"`).exec(pageScript)?.[1];
if (!listed) throw new Error(`chapter 09 offers no model under #${MODEL}`);
const modelPath = join(SITE, "guide", listed);
const modelText = readFileSync(modelPath, "utf8");
const read = readModelYaml(modelText);
if (!read.document) throw new Error(`${modelPath} did not read`);
const fromCli = join(scratch, "cli", NAME);
step(`the same model through generateApplication: ${listed}`);
await generateApplication({
  document: read.document,
  modelText,
  projectName: NAME,
  projectVersion: "1.0.0",
  projectDescription: read.document.description,
  outputDir: fromCli,
  stackOption: "tanstack-astryx-loco",
  astryxTheme: "neutral",
  database: "postgres",
  port: 3000,
  frontendPort: 3001,
  apiBaseUrl: "http://localhost:3000",
  enableDarkMode: false,
  skipCliScaffold: true,
  recordsPerEntity: 1000,
  manifest: { input: "model.eml.yaml", packageManager: "bun" },
  logger: NO_LOG,
});

// The pipeline formats the backend; the browser cannot, so format the archive.
step("cargo fmt over both backends, then every file compared");
await run(["cargo", "fmt", "--all"], join(fromZip, "backend"));
await run(["cargo", "fmt", "--all"], join(fromCli, "backend"));

const zipFiles = walk(fromZip).map((path) => relative(fromZip, path));
const cliFiles = walk(fromCli).map((path) => relative(fromCli, path));
const problems: string[] = [];
for (const file of cliFiles.filter((file) => !zipFiles.includes(file))) problems.push(`missing from the archive: ${file}`);
for (const file of zipFiles.filter((file) => !cliFiles.includes(file))) problems.push(`only in the archive: ${file}`);
for (const file of zipFiles.filter((file) => cliFiles.includes(file))) {
  const a = readFileSync(join(fromZip, file));
  const b = readFileSync(join(fromCli, file));
  if (a.equals(b)) continue;
  if (normalise(file, a.toString("utf8")) !== normalise(file, b.toString("utf8"))) problems.push(`differs: ${file}`);
}

const summary = `${zipFiles.length} files in the archive, ${cliFiles.length} from the pipeline`;
if (problems.length) {
  writeFileSync(join(scratch, "differences.txt"), `${problems.join("\n")}\n`);
  console.error(`✗ the download is not what the pipeline writes (${summary}):\n  ${problems.slice(0, 20).join("\n  ")}`);
  console.error(`  everything is in ${scratch}`);
  process.exit(1);
}
console.log(`✓ the download is what the pipeline writes: ${summary}, chat/ included`);
if (!process.argv.includes("--keep")) rmSync(scratch, { recursive: true, force: true });
