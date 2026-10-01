#!/usr/bin/env bun
/**
 * Prove the browser bundle of the YAML model language is the same engine the
 * CLI runs — in a real browser, over every YAML model in the repository.
 *
 * `html/model-yaml.js` is loaded into headless Chromium as a module. Each
 * model is validated there and in this process (by the source modules
 * `appwithai validate` uses); the two must report the same diagnostics — code,
 * severity, line and column — and the fixer must repair it to the same text. A
 * deliberately
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
import { readCedmModel } from "../packages/generator/src/model-cedm/read";
import { checkAndFix, readModelYaml } from "../packages/generator/src/model-yaml/index";

const ROOT = path.resolve(import.meta.dir, "..");
const SKIP = new Set([
  "node_modules",
  "dist",
  ".git",
  "generated-projects",
  "generated-applications",
  "target",
]);

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
  fixed: string;
}

function summarise(text: string): Outcome {
  const result = readModelYaml(text);
  return {
    ok: result.ok,
    diagnostics: result.diagnostics.map(
      (d) => `${d.severity} ${d.code} ${d.line}:${d.column} ${d.message}`
    ),
    fixed: checkAndFix(text).text,
  };
}

/**
 * A CEDM model that imports from a library the page supplies. A tab has no
 * filesystem, so the library is an object; here it holds one entity, written
 * so that lowering has real work to do: a reference whose name does not say its
 * target, a lifecycle with no initial state, an invariant with a condition.
 */
const CEDM_LIBRARY_ENTITY = {
  name: "Shipment",
  identity: { key: "shipmentId", type: "uuid" },
  attributes: [
    { name: "shipmentId", type: "uuid", required: true },
    { name: "reference", type: "string", required: true, maxLength: 40 },
    { name: "status", type: "enum", values: ["OPEN", "SENT"] },
    { name: "weight", type: "decimal", required: false },
  ],
  relationships: [{ name: "deliveryLocation", target: "Location", cardinality: "1" }],
  lifecycle: {
    states: ["OPEN", "SENT"],
    transitions: [{ from: "OPEN", to: "SENT", action: "send" }],
  },
  invariants: [{ id: "SHP-1", rule: "Weight is not negative.", violatedWhen: "weight < 0" }],
};
const CEDM_LOCATION = { name: "Location", attributes: [{ name: "name", type: "string" }] };
const CEDM_WITH_IMPORTS = [
  'cedm: "1.0"',
  "application: {name: Imports}",
  "imports:",
  "  - entity: Shipment",
  "",
].join("\n");

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
        fix(text: string): { text: string };
      }
      const api = (globalThis as Record<string, unknown>).__modelYaml as BundleApi;
      const result = api.validate(source);
      return {
        ok: result.ok,
        diagnostics: result.diagnostics.map(
          (d) => `${d.severity} ${d.code} ${d.line}:${d.column} ${d.message}`
        ),
        fixed: api.fix(source).text,
      };
    }, text);

  /** The CEDM reader in the page and here, given the same library. */
  const cedmCases: Array<[string, string]> = [
    [
      "examples/drug-discovery.cedm.yaml",
      readFileSync(path.join(ROOT, "examples/drug-discovery.cedm.yaml"), "utf8"),
    ],
    [
      "language/cedm/examples/crm.cedm.yaml",
      readFileSync(path.join(ROOT, "language/cedm/examples/crm.cedm.yaml"), "utf8"),
    ],
    ["(a CEDM model importing from a supplied library)", CEDM_WITH_IMPORTS],
  ];
  const library = {
    entity: (name: string) =>
      name === "Shipment" ? CEDM_LIBRARY_ENTITY : name === "Location" ? CEDM_LOCATION : undefined,
  };
  for (const [label, text] of cedmCases) {
    const local = readCedmModel(text, { library: library as never });
    const expected = JSON.stringify({
      ok: local.ok,
      document: local.document,
      diagnostics: local.diagnostics.map((d) => `${d.severity} ${d.code} ${d.line}:${d.column}`),
    });
    const actual = await page.evaluate(
      ({ source, entities }) => {
        const api = (globalThis as Record<string, unknown>).__modelYaml as {
          validateCedm(
            text: string,
            options: { library: unknown }
          ): {
            ok: boolean;
            document?: unknown;
            diagnostics: Array<{ severity: string; code: string; line: number; column: number }>;
          };
        };
        const result = api.validateCedm(source, {
          library: { entity: (name: string) => entities[name] },
        });
        return JSON.stringify({
          ok: result.ok,
          document: result.document,
          diagnostics: result.diagnostics.map(
            (d) => `${d.severity} ${d.code} ${d.line}:${d.column}`
          ),
        });
      },
      { source: text, entities: { Shipment: CEDM_LIBRARY_ENTITY, Location: CEDM_LOCATION } }
    );
    // Round trip through JSON on this side too: the page returns plain data.
    const same = JSON.stringify(JSON.parse(actual)) === JSON.stringify(JSON.parse(expected));
    if (same && local.ok) {
      console.log(`  ok  ${label}  (CEDM, ${local.diagnostics.length} diagnostic(s))`);
    } else {
      failures++;
      console.error(
        `  !!  ${label}: the browser and Node read this CEDM model differently (ok=${local.ok})`
      );
    }
  }

  const cases: Array<[string, string]> = [
    ...yamlModels().map((file): [string, string] => [
      path.relative(ROOT, file),
      readFileSync(file, "utf8"),
    ]),
    ["(a broken document)", BROKEN],
  ];

  for (const [label, text] of cases) {
    const expected = summarise(text);
    const actual = await inBrowser(text);
    const same =
      actual.ok === expected.ok &&
      actual.fixed === expected.fixed &&
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

  const brokenErrors = summarise(BROKEN).diagnostics.filter((d) => d.startsWith("error"));
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
