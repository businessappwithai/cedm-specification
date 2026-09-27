#!/usr/bin/env bun
/**
 * Prove the browser bundle of the YAML model language is the same engine the
 * CLI runs — in a real browser, over every YAML model in the repository.
 *
 * `html/model-yaml.js` is loaded into headless Chromium as a module. Each
 * model is validated there and in this process (by the source modules
 * `appwithai validate` uses); the two must report the same diagnostics — code,
 * severity, line and column — and draw the same Mermaid view. A deliberately
 * broken document must be refused the same way too, so the comparison is not
 * two engines agreeing that nothing is wrong.
 *
 * A bundle that fell back to the built-in vocabulary because it could not find
 * the language definition would read a model differently without saying so;
 * this is the check that sees it.
 *
 *   bun run build:language-tools && bun scripts/check-language-bundle.ts
 *
 * `PLAYWRIGHT_CHROMIUM` overrides the browser executable (the container's
 * Chromium lives outside Playwright's own revision directory).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { readModelYaml, renderEmlView } from "../packages/generator/src/model-yaml/index";

const ROOT = path.resolve(import.meta.dir, "..");
const SKIP = new Set(["node_modules", "dist", ".git", "generated-projects", "target"]);

function yamlModels(): string[] {
  const found: string[] = [];
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory)) {
      if (SKIP.has(entry) || entry.startsWith(".")) continue;
      const full = path.join(directory, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".eml.yaml")) found.push(full);
    }
  };
  walk(ROOT);
  return found.sort();
}

const BROKEN = [
  'eml: "1.0"',
  "name: Broken",
  "entities:",
  "  - name: Thing",
  "    colour: red",
  "    attributes:",
  "      - name: id",
  "        type: uuid",
  "        pk: true",
  "      - name: owner_id",
  "        type: uuid",
  "        fk: true",
  "relationships:",
  "  - from: Thing",
  "    fromCardinality: exactly-one",
  "    to: Nowhere",
  "    toCardinality: zero-or-more",
  "",
].join("\n");

interface Outcome {
  ok: boolean;
  diagnostics: string[];
  view: string;
}

function summarise(result: ReturnType<typeof readModelYaml>): Outcome {
  return {
    ok: result.ok,
    diagnostics: result.diagnostics.map(
      (d) => `${d.severity} ${d.code} ${d.line}:${d.column} ${d.message}`
    ),
    view: result.document ? renderEmlView(result.document).text : "",
  };
}

const bundle = readFileSync(path.join(ROOT, "html/model-yaml.js"), "utf8");
const server = createServer((request, response) => {
  if (request.url === "/model-yaml.js") {
    response.writeHead(200, { "content-type": "text/javascript" });
    response.end(bundle);
  } else {
    response.writeHead(200, { "content-type": "text/html" });
    response.end("<!doctype html><title>model-yaml</title>");
  }
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("server did not bind");
const origin = `http://127.0.0.1:${address.port}`;

const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {}),
  args: ["--no-sandbox"],
});
let failures = 0;
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
  await page.evaluate(async (url) => {
    const module = await import(url);
    (globalThis as Record<string, unknown>).__modelYaml = module;
  }, `${origin}/model-yaml.js`);

  const inBrowser = (text: string) =>
    page.evaluate((source) => {
      interface BundleApi {
        validate(text: string): {
          ok: boolean;
          document?: unknown;
          diagnostics: Array<{
            severity: string;
            code: string;
            line: number;
            column: number;
            message: string;
          }>;
        };
        renderEmlView(document: unknown): { text: string };
      }
      const api = (globalThis as Record<string, unknown>).__modelYaml as BundleApi;
      const result = api.validate(source);
      return {
        ok: result.ok,
        diagnostics: result.diagnostics.map(
          (d) => `${d.severity} ${d.code} ${d.line}:${d.column} ${d.message}`
        ),
        view: result.document ? api.renderEmlView(result.document).text : "",
      };
    }, text);

  const cases: Array<[string, string]> = [
    ...yamlModels().map((file): [string, string] => [
      path.relative(ROOT, file),
      readFileSync(file, "utf8"),
    ]),
    ["(a broken document)", BROKEN],
  ];

  for (const [label, text] of cases) {
    const expected = summarise(readModelYaml(text));
    const actual = await inBrowser(text);
    const same =
      actual.ok === expected.ok &&
      actual.view === expected.view &&
      JSON.stringify(actual.diagnostics) === JSON.stringify(expected.diagnostics);
    const errorCount = expected.diagnostics.filter((d) => d.startsWith("error")).length;
    if (same) {
      console.log(
        `  ok  ${label}  (${expected.ok ? "valid" : `${errorCount} error(s)`}, ${expected.diagnostics.length} diagnostic(s))`
      );
    } else {
      failures++;
      console.error(`  !!  ${label}: the browser bundle and the CLI disagree`);
      console.error(
        `      cli:     ok=${expected.ok} ${expected.diagnostics.slice(0, 3).join(" | ")}`
      );
      console.error(`      browser: ok=${actual.ok} ${actual.diagnostics.slice(0, 3).join(" | ")}`);
    }
  }

  const brokenErrors = summarise(readModelYaml(BROKEN)).diagnostics.filter((d) =>
    d.startsWith("error")
  );
  if (brokenErrors.length === 0) {
    failures++;
    console.error("  !!  the broken document validated; the comparison proves nothing");
  }
  if (errors.length) {
    failures++;
    console.error(`  !!  the page raised: ${errors.join("; ")}`);
  }
} finally {
  await browser.close();
  server.close();
}

if (failures) {
  console.error(`\nFAILED: ${failures} disagreement(s).`);
  process.exit(1);
}
console.log("\nPASSED: the browser bundle reads every model exactly as the CLI does.");
