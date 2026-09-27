/**
 * The `eml` CLI reads a YAML model as it reads the EML it came from.
 *
 * `language/cli` has its own parser and its own generators, and the YAML is
 * handed to it as its rendered view. The generators are held to byte parity
 * elsewhere; this holds the CLI to the same promise, over every model in the
 * repository: the entities, their attributes and flags, the relationships,
 * enums, indexes, hooks, rules, workflows, access rules and triggers the CLI's
 * parser sees must not depend on which syntax the model was written in.
 *
 * Two differences are not meaning and are normalised away. Order: the CLI
 * lists entities by first mention in the drawing, the view by declaration.
 * And a rule's `raw` diagram text: the view draws a flowchart's nodes and then
 * its edges, where the author may have interleaved them — the parsed nodes and
 * edges are compared instead.
 *
 * One difference in the other direction is deliberate. The CLI takes any
 * `%%meta trigger:` / `operation:` as model-wide metadata, so a saga that states
 * them in a `%%meta` line leaks them into the model's `meta`; the view states
 * them on the saga's own `%%workflow` line, where they belong, and the
 * language checker is what holds that line to account.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseEml } from "../../../../../language/cli/src/parser";
import { emlToModelDocument, readModelYaml, renderEmlView, serializeModelDocument } from "../index";

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

/** Order-free, position-free form of what the CLI's parser saw. */
function normalise(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map(normalise)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== "line" && key !== "raw" && key !== "diagnostics")
        .map(([key, entry]) => [key, normalise(entry)])
    );
  }
  return value;
}

function cliModel(source: string) {
  const model = parseEml(source);
  const { trigger: _trigger, operation: _operation, ...meta } = model.meta as Record<
    string,
    unknown
  >;
  return normalise({ ...model, meta });
}

describe("the eml CLI reads a YAML model as it reads its EML", () => {
  for (const file of corpus()) {
    const relative = path.relative(ROOT, file);
    it(relative, () => {
      const source = readFileSync(file, "utf8");
      const text = serializeModelDocument(emlToModelDocument(source).document);
      const read = readModelYaml(text, { check: false, checkView: false });
      expect(read.document, `${relative}: its YAML did not read back`).toBeDefined();

      const view = renderEmlView(read.document!).text;
      expect(cliModel(view)).toEqual(cliModel(source));
    });
  }
});
