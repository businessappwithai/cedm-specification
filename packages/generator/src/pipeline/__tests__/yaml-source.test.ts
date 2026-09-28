/**
 * The YAML model is the generation source, and the only one.
 *
 * Three properties of a generated application, each of which a regression has
 * a plausible route to breaking without any other test noticing:
 *
 *   1. **Generation is a function of the model.** Two runs over the same
 *      document write the same files with the same contents, apart from the
 *      moment each was written. Anything else means a generator is reading
 *      something besides the model — the clock, the environment, a directory
 *      listing — and the byte-for-byte parity gate between the TypeScript and
 *      Rust generators stops meaning anything.
 *   2. **The model ships as the author wrote it.** `model/model.eml.yaml` is
 *      the text, comments included, not a re-serialisation: the comments are
 *      where an author records why a rule has three rows, and a copy without
 *      them is a different document.
 *   3. **Nothing generated is Mermaid.** No diagram source, no `%%` directive,
 *      no reader or writer for either. The application stores what it builds
 *      at run time — automations included — as YAML, and a Mermaid string left
 *      in a template is a second model format the application would have to
 *      keep reading forever.
 */
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { readModelYaml } from "../../model-yaml";
import { generateApplication } from "../index";

const MODEL = path.resolve(__dirname, "../../../../../examples/drug-discovery.eml.yaml");

/** Binary assets are copied verbatim and cannot carry model text. */
const BINARY = /\.(woff2?|ttf|otf|png|jpe?g|gif|ico|webp|wasm)$/i;

/**
 * What Mermaid looks like in a file: a diagram opener at the start of a line,
 * a `%%` directive, or the library named at all.
 */
const MERMAID: Array<{ what: string; pattern: RegExp }> = [
  {
    what: "a diagram opener",
    pattern: /^\s*(erDiagram|stateDiagram(-v2)?|flowchart\s+\w+|graph\s+(TD|TB|BT|LR|RL))\b/m,
  },
  {
    what: "a %% directive",
    pattern:
      /%%\s*(meta|hook|entity|field|enum|index|category|rbac|rule|guard|trigger|report|workflow|step|action|loop)\b/,
  },
  { what: "the word mermaid", pattern: /mermaid/i },
];

/**
 * The only files allowed to name Mermaid: the migrations that carry the
 * schema's history. m0013 created `sys_workflow_definitions.mermaid_code`, and
 * databases that applied it hold automations in that column; m0017 converts
 * each one to a YAML document and drops the column. Editing m0013 would reach
 * nobody who already migrated, and m0017 cannot convert a column it may not
 * name — so the history is exempt, and every other file is held to none.
 */
const SCHEMA_HISTORY = [
  /^backend\/migration\/sql\/m0013_workflow_definition_source\.(up|down)\.sql$/,
  /^backend\/migration\/sql\/m0017_workflow_definition_yaml\.(up|down|finish)\.sql$/,
  /^backend\/migration\/src\/m0017_workflow_definition_yaml\.rs$/,
];

async function files(root: string, directory = root): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await files(root, full)));
    else found.push(path.relative(root, full));
  }
  return found.sort();
}

/** Generation stamps each file with the time it was written. */
function withoutTimestamps(text: string): string {
  return text.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g, "<timestamp>");
}

function quietly<T>(run: () => Promise<T>): Promise<T> {
  const log = console.log;
  const warn = console.warn;
  console.log = () => {};
  console.warn = () => {};
  return run().finally(() => {
    console.log = log;
    console.warn = warn;
  });
}

describe("a YAML model as the generation source", () => {
  const outputs: string[] = [];
  afterAll(async () => {
    for (const output of outputs) await fs.rm(output, { recursive: true, force: true });
  });

  async function generate(modelText: string): Promise<string> {
    const read = readModelYaml(modelText);
    expect(read.ok, JSON.stringify(read.diagnostics.slice(0, 3))).toBe(true);
    const output = await fs.mkdtemp("/tmp/yaml-source-");
    outputs.push(output);
    await quietly(() =>
      generateApplication({
        projectName: "drug-discovery",
        skipCliScaffold: true,
        document: read.document!,
        modelText,
        outputDir: output,
      })
    );
    return output;
  }

  it("generates the same application every time, ships the model as written, and no Mermaid", async () => {
    const modelText = await fs.readFile(MODEL, "utf-8");
    const [first, second] = [await generate(modelText), await generate(modelText)];

    const written = await files(first);
    expect(await files(second)).toEqual(written);
    expect(written.length).toBeGreaterThan(400);

    const differing: string[] = [];
    const mermaid: string[] = [];
    for (const file of written) {
      if (BINARY.test(file)) continue;
      const [left, right] = await Promise.all([
        fs.readFile(path.join(first, file), "utf-8"),
        fs.readFile(path.join(second, file), "utf-8"),
      ]);
      if (withoutTimestamps(left) !== withoutTimestamps(right)) differing.push(file);
      if (SCHEMA_HISTORY.some((allowed) => allowed.test(file))) continue;
      for (const { what, pattern } of MERMAID) {
        const match = left.match(pattern);
        if (match) mermaid.push(`${file}: ${what} (${JSON.stringify(match[0].trim())})`);
      }
    }
    expect(differing).toEqual([]);
    if (process.env.SHOW_MERMAID) console.error(mermaid.join("\n"));
    expect(mermaid).toEqual([]);

    // The author's text, comments and all — the header comment is the check
    // that nothing re-serialised it on the way.
    const shipped = await fs.readFile(path.join(first, "model", "model.eml.yaml"), "utf-8");
    expect(shipped).toBe(modelText);
    expect(shipped.startsWith("# ")).toBe(true);
    expect(written).not.toContain(path.join("model", "model.eml.mmd"));
  }, 300_000);
});
