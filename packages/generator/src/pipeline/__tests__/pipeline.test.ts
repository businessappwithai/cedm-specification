/**
 * The web route and the CLI must generate the same application.
 *
 * They did not: the route built the generator's options itself with six fields,
 * so a model's categories, enums and sagas reached the CLI's output and not the
 * UI's. This drives the same pipeline call the route now makes and compares.
 */
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { generateApplication, parseModel } from "../index";

const MODEL = path.resolve(__dirname, "../../../../../examples/drug-discovery.eml.mmd");

describe("the pipeline is the only generation path", () => {
  it("carries categories, enums and sagas into the manifest", async () => {
    const source = await fs.readFile(MODEL, "utf-8");
    const out = await fs.mkdtemp("/tmp/pipeline-test-");
    const model = await generateApplication({
      sources: source,
      model: parseModel(source),
      projectName: "pipeline-test",
      outputDir: out,
      skipFrontend: true,
      skipTests: true,
      skipCliScaffold: true,
    });

    // What the route used to lose.
    expect(model.categories.length).toBeGreaterThan(1);
    expect(model.enums.length).toBeGreaterThan(0);
    expect(model.sagas.length).toBeGreaterThan(0);

    const manifest = JSON.parse(await fs.readFile(path.join(out, ".appwithai.json"), "utf-8"));
    expect(manifest.categories).toEqual(model.categories.map((c) => c.name));
    expect(manifest.enums).toHaveLength(model.enums.length);
    expect(manifest.sagas).toHaveLength(model.sagas.length);

    // The model travels with the application it produced.
    const shipped = await fs.readFile(path.join(out, "model", "model.eml.mmd"), "utf-8");
    expect(shipped).toBe(source);

    // And the enums reached the dictionary as real lists, not dangling ids.
    const seed = await fs.readFile(path.join(out, "backend", "seed", "dictionary.sql"), "utf-8");
    for (const modelEnum of model.enums) {
      expect(seed).toContain(`Values allowed for ${modelEnum.name}`);
    }
    await fs.rm(out, { recursive: true, force: true });
  }, 120_000);
});
