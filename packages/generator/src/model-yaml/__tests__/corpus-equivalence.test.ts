/**
 * The YAML model language means exactly what EML means — over every model in
 * the repository.
 *
 * For each `.mmd` file: convert it to a YAML document, write that as text, read
 * the text back through the full validator, compile it, and require the result
 * to equal what generating from the EML compiles to. A model the generator is
 * tested on, one it ships as an example, and one a test fixture happens to
 * carry are all held to it, because a construct only one of them uses is a
 * construct the others cannot vouch for.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkSource } from "../../../../../language/checker";
import { parseModel } from "../../pipeline/parse-model";
import {
  compileModelDocument,
  emlToModelDocument,
  readModelYaml,
  serializeModelDocument,
} from "../index";

const ROOT = path.resolve(__dirname, "../../../../..");
const SKIP = new Set(["node_modules", "dist", ".git", "generated-projects", "target"]);

function corpus(): string[] {
  const found: string[] = [];
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory)) {
      if (SKIP.has(entry) || entry.startsWith(".")) continue;
      const full = path.join(directory, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".mmd")) found.push(full);
    }
  };
  walk(ROOT);
  return found.sort();
}

/** Compile warnings go to the console; they are not what these tests compare. */
function quietly<T>(run: () => T): T {
  const warn = console.warn;
  console.warn = () => {};
  try {
    return run();
  } finally {
    console.warn = warn;
  }
}

function countByCode(issues: Array<{ code: string; severity: string }>) {
  const counts = new Map<string, number>();
  for (const issue of issues) {
    const key = `${issue.severity}:${issue.code}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * Checker codes allowed to differ between an EML file and its YAML, each for a
 * reason that is about the EML file rather than the model:
 *
 * - EML223: `%%guard` in the retired access-rule shape. Nothing compiles
 *   `%%guard`, so the YAML does not carry it (it is in `uncarried`).
 * - EML005: `%%meta trigger:` on a saga, a key the checker does not know but
 *   the saga compiler reads. The YAML view states it where the checker looks.
 * - EML286: a rule-triggered saga no action names. EML declares a saga's
 *   trigger on its `%%workflow` line, which the compiler ignores; the view
 *   states the trigger that actually compiles, and the checker then sees a saga
 *   that will never run. The conversion reports each such saga.
 */
const EXPLAINED = new Set(["EML223", "EML005", "EML286"]);

const models = corpus();

describe("the YAML model language over the repository's EML corpus", () => {
  it("finds the corpus", () => {
    expect(models.length).toBeGreaterThanOrEqual(20);
    expect(models.map((file) => path.relative(ROOT, file))).toContain(
      "examples/drug-discovery.eml.mmd"
    );
  });

  describe.each(models.map((file) => [path.relative(ROOT, file), file]))("%s", (_name, file) => {
    const eml = readFileSync(file, "utf8");
    const conversion = emlToModelDocument(eml);
    const text = serializeModelDocument(conversion.document);
    const read = readModelYaml(text);

    it("reads back through every validation layer without an error", () => {
      expect(read.diagnostics.filter((d) => d.code === "YAML" || d.code === "SCHEMA")).toEqual([]);
      expect(read.document).toBeDefined();
    });

    it("compiles to exactly what the EML compiles to", () => {
      const fromEml = quietly(() => parseModel(eml));
      const fromYaml = quietly(() => compileModelDocument(read.document!));
      expect(fromYaml).toEqual(fromEml);
    });

    it("writes the same text when saved again", () => {
      expect(serializeModelDocument(read.document!)).toBe(text);
    });

    it("draws a view that reads back to the same document", () => {
      expect(read.diagnostics.filter((d) => d.code === "VIEW")).toEqual([]);
    });

    it("draws a view the checker judges as it judges the EML", () => {
      const before = countByCode(checkSource(eml).issues);
      const after = countByCode(read.diagnostics.filter((d) => !["VIEW"].includes(d.code)));
      const keys = new Set([...before.keys(), ...after.keys()]);
      const unexplained = [...keys].filter(
        (key) => before.get(key) !== after.get(key) && !EXPLAINED.has(key.split(":")[1]!)
      );
      expect(unexplained).toEqual([]);
    });
  });
});
