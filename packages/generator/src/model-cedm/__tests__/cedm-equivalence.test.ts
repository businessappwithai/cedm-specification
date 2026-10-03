/**
 * CEDM says what the model language says — proved over every model in the
 * repository, not asserted.
 *
 * Each model document is raised to CEDM, the CEDM text is read back through
 * the reader the CLI uses (schema, lowering, checker), and the lowered document
 * must equal the original in CEDM's declaration order (`cedmOrder`): the same
 * entities, columns, keys, references, enums, relationships, rules, machines,
 * sagas, hooks, reports and access rules. Compiling the two must give the same
 * model, and the checker must find the same things in both.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { stringify } from "yaml";
import { compileModelDocument, readModelYaml } from "../../model-yaml";
import { cedmOrder, raiseModelDocument } from "../index";
import { readCedmModel } from "../read";

const ROOT = path.resolve(__dirname, "../../../../..");
const SKIP = new Set([
  "node_modules",
  "generated-projects",
  "generated-applications",
  ".git",
  "dist",
  "target",
]);
/** The imported sibling platforms are their own repositories' corpora. */
const SKIP_PATHS = new Set(
  [
    "yaml",
    "app-with-ai-rust",
    "app-and-report-with-ai-rust",
    "enterprise-reporting-rust",
    "businessappwithairust",
  ].map((name) => path.join(ROOT, name))
);

function corpus(directory = ROOT): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory)) {
    if (SKIP.has(entry)) continue;
    const full = path.join(directory, entry);
    if (SKIP_PATHS.has(full)) continue;
    if (statSync(full).isDirectory()) found.push(...corpus(full));
    else if (entry.endsWith(".eml.yaml")) found.push(full);
  }
  return found.sort();
}

const MODELS = corpus();

describe("every model in the repository can be written in CEDM", () => {
  it("finds the corpus", () => {
    expect(MODELS.length).toBeGreaterThan(20);
  });

  for (const file of MODELS) {
    const name = path.relative(ROOT, file);
    it(`${name}: raised to CEDM and lowered back, it is the same model`, () => {
      const original = readModelYaml(readFileSync(file, "utf-8"));
      if (!original.document) return; // a model the language itself refuses is not in scope

      const cedmText = stringify(raiseModelDocument(original.document), { lineWidth: 0 });
      const read = readCedmModel(cedmText);
      const schemaErrors = read.diagnostics.filter((d) => d.code === "SCHEMA");
      expect(schemaErrors).toEqual([]);
      expect(read.document).toEqual(cedmOrder(original.document));

      expect(compileModelDocument(read.document as never)).toEqual(
        compileModelDocument(cedmOrder(original.document))
      );

      const codes = (diagnostics: { code: string; severity: string }[]) =>
        diagnostics
          .filter((d) => !d.code.startsWith("CEDM"))
          .map((d) => `${d.severity} ${d.code}`)
          .sort();
      expect(codes(read.diagnostics)).toEqual(
        codes(readModelYaml(stringify(cedmOrder(original.document), { lineWidth: 0 })).diagnostics)
      );
    });
  }
});
