/**
 * A YAML model generates the same application as the EML it was converted
 * from — every file of it, frontend, backend and tests.
 *
 * This is the acceptance test for the YAML model language as a source: not
 * that the compiled model matches (the corpus test proves that), but that
 * nothing between the model and the disk still reads EML text. Two files may
 * differ and only two: the manifest names its input, and the shipped Mermaid
 * is the author's text for an EML model and the rendered view for a YAML one.
 */
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { emlToModelDocument, readModelYaml, serializeModelDocument } from "../../model-yaml";
import { generateApplication } from "../index";

const MODEL = path.resolve(__dirname, "../../../../../examples/drug-discovery.eml.mmd");
const EXPECTED_TO_DIFFER = new Set([".appwithai.json", path.join("model", "model.eml.mmd")]);

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

  it("generates the application its EML generates, file for file", async () => {
    const eml = await fs.readFile(MODEL, "utf-8");
    const yaml = serializeModelDocument(emlToModelDocument(eml).document);
    const read = readModelYaml(yaml);
    expect(read.ok).toBe(true);

    const fromEml = await fs.mkdtemp("/tmp/yaml-source-eml-");
    const fromYaml = await fs.mkdtemp("/tmp/yaml-source-yaml-");
    outputs.push(fromEml, fromYaml);

    const common = { projectName: "drug-discovery", skipCliScaffold: true } as const;
    await quietly(() => generateApplication({ ...common, sources: eml, outputDir: fromEml }));
    await quietly(() =>
      generateApplication({ ...common, document: read.document!, outputDir: fromYaml })
    );

    const emlFiles = await files(fromEml);
    expect(await files(fromYaml)).toEqual(emlFiles);
    expect(emlFiles.length).toBeGreaterThan(400);

    const differing: string[] = [];
    for (const file of emlFiles) {
      const [left, right] = await Promise.all([
        fs.readFile(path.join(fromEml, file), "utf-8"),
        fs.readFile(path.join(fromYaml, file), "utf-8"),
      ]);
      if (withoutTimestamps(left) !== withoutTimestamps(right)) differing.push(file);
    }
    expect(differing.filter((file) => !EXPECTED_TO_DIFFER.has(file))).toEqual([]);

    // Both ship the model as YAML, and it is the same document.
    const shippedFromEml = await fs.readFile(
      path.join(fromEml, "model", "model.eml.yaml"),
      "utf-8"
    );
    const shippedFromYaml = await fs.readFile(
      path.join(fromYaml, "model", "model.eml.yaml"),
      "utf-8"
    );
    expect(shippedFromYaml).toBe(yaml);
    expect(shippedFromEml).toBe(yaml);

    // The YAML-sourced project's Mermaid is the rendered view, marked as such.
    const view = await fs.readFile(path.join(fromYaml, "model", "model.eml.mmd"), "utf-8");
    expect(view).toContain("Rendered from the YAML model.");
  }, 300_000);

  it("refuses to run without a model", async () => {
    await expect(
      generateApplication({ projectName: "none", outputDir: "/tmp/never-written" })
    ).rejects.toThrow(/needs a model/);
  });
});
