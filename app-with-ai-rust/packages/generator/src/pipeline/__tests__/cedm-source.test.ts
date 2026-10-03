/**
 * A CEDM model as the generation source.
 *
 * `examples/drug-discovery.cedm.yaml` is drug-discovery written in CEDM. The
 * application generated from it must be the application generated from the
 * model document it says the same thing as — `cedmOrder` of
 * `examples/drug-discovery.eml.yaml`, which differs from the original only in
 * declaring each relationship and state machine with its entity — file for
 * file, every file of 400-odd, apart from the moment each was written and the
 * shipped model itself.
 *
 * And every generated application, whatever it was written in, carries the
 * common CEDM specification under `cedm/`.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { cedmOrder, createFileLibrary, readCedmModel } from "../../model-cedm";
import { readModelYaml, serializeModelDocument } from "../../model-yaml";
import { generateApplication } from "../index";
import { locateCedmRoot } from "../../model-cedm/library";

const ROOT = path.resolve(__dirname, "../../../../..");
/** The CEDM specification: this repository, or the one enclosing its copy. */
const SPEC_ROOT = locateCedmRoot(ROOT) ?? ROOT;
const EML = path.join(ROOT, "examples/drug-discovery.eml.yaml");
const CEDM = path.join(ROOT, "examples/drug-discovery.cedm.yaml");

const BINARY = /\.(woff2?|ttf|otf|png|jpe?g|gif|ico|webp|wasm)$/i;

async function files(root: string, directory = root): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await files(root, full)));
    else found.push(path.relative(root, full));
  }
  return found.sort();
}

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

describe("a CEDM model as the generation source", () => {
  const outputs: string[] = [];
  afterAll(async () => {
    for (const output of outputs) await fs.rm(output, { recursive: true, force: true });
  });

  async function output(): Promise<string> {
    const directory = await fs.mkdtemp("/tmp/cedm-source-");
    outputs.push(directory);
    return directory;
  }

  it("generates the application its model document generates", async () => {
    const cedmText = await fs.readFile(CEDM, "utf-8");
    const read = readCedmModel(cedmText, { library: createFileLibrary({ root: SPEC_ROOT }) });
    expect(read.ok, JSON.stringify(read.diagnostics.filter((d) => d.severity === "error"))).toBe(
      true
    );
    const original = readModelYaml(await fs.readFile(EML, "utf-8"));
    expect(read.document).toEqual(cedmOrder(original.document!));

    const fromCedm = await output();
    await quietly(() =>
      generateApplication({
        projectName: "drug-discovery",
        skipCliScaffold: true,
        document: read.document!,
        modelText: cedmText,
        cedm: { text: cedmText, root: SPEC_ROOT, libraryFiles: [], moduleFiles: [] },
        outputDir: fromCedm,
      })
    );
    const orderedText = serializeModelDocument(cedmOrder(original.document!));
    const fromDocument = await output();
    await quietly(() =>
      generateApplication({
        projectName: "drug-discovery",
        skipCliScaffold: true,
        document: readModelYaml(orderedText).document!,
        modelText: orderedText,
        outputDir: fromDocument,
      })
    );

    const cedmFiles = await files(fromCedm);
    expect(cedmFiles.length).toBeGreaterThan(400);
    expect(cedmFiles.filter((file) => file !== path.join("model", "model.cedm.yaml"))).toEqual(
      await files(fromDocument)
    );

    const differing: string[] = [];
    for (const file of cedmFiles) {
      if (BINARY.test(file) || file.startsWith("model/")) continue;
      const [left, right] = await Promise.all([
        fs.readFile(path.join(fromCedm, file), "utf-8"),
        fs.readFile(path.join(fromDocument, file), "utf-8"),
      ]);
      if (withoutTimestamps(left) !== withoutTimestamps(right)) differing.push(file);
    }
    expect(differing).toEqual([]);

    // The CEDM text ships as written; the document it lowered to beside it.
    expect(await fs.readFile(path.join(fromCedm, "model", "model.cedm.yaml"), "utf-8")).toBe(
      cedmText
    );
    const compiled = await fs.readFile(path.join(fromCedm, "model", "model.eml.yaml"), "utf-8");
    expect(compiled).toContain(serializeModelDocument(read.document!));
    expect(compiled.startsWith("# Compiled from model.cedm.yaml")).toBe(true);

    // The common CEDM specification, in both applications.
    for (const directory of [fromCedm, fromDocument]) {
      const bundled = await files(path.join(directory, "cedm"));
      expect(bundled).toContain(path.join("specification", "manifest.yaml"));
      expect(bundled).toContain(path.join("specification", "application-profile.yaml"));
      expect(bundled).toContain(path.join("schema", "cedm-entity.schema.yaml"));
      expect(bundled).toContain(path.join("domains", "catalog.yaml"));
      expect(bundled).toContain("README.md");
    }
  }, 300_000);
});
