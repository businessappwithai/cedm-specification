import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseModelYaml } from "@appwithai/generator/model-yaml";
import { commitArtifactPair, showFileAtCommit } from "../src/git/history";
import {
  ModelProjectionError,
  modelToArchitecture,
  narrowDocument,
  projectModel,
  projectSource,
  readModelDocument,
  selectModelContext,
} from "../src/model/context";
import { executeQuery } from "../src/query/execute";
import { architectureToYaml, parseArchitectureYaml, parseYaml } from "../src/yaml";

const ROOT = path.resolve(__dirname, "../../..");
const CORPUS = [
  "examples/drug-discovery.eml.yaml",
  "language/yaml/examples/crm.eml.yaml",
  "language/yaml/examples/dance-studio.eml.yaml",
  "packages/yamltecture/test/fixtures/field-service.eml.yaml",
];

const load = (file: string) => readFile(path.join(ROOT, file), "utf8");

describe("model context over the corpus", () => {
  for (const file of CORPUS) {
    it(`projects ${path.basename(file)} canonically and compiles what it projects`, async () => {
      const text = await load(file);
      const document = readModelDocument(text);
      const projection = projectModel(document);
      // Canonical: projecting the projection changes nothing.
      expect(projectSource(projection)).toBe(projection);
      // And it is the same model: the generator compiles both to the same thing.
      expect(parseModelYaml(projection).model.entities).toEqual(
        parseModelYaml(text).model.entities
      );

      const graph = modelToArchitecture(document);
      expect(graph.nodes.map((node) => node.id).sort()).toEqual(
        document.entities.map((entity) => entity.name).sort()
      );

      const context = selectModelContext(document, "", { maxCharacters: 3000 });
      expect(context.yaml.length).toBeLessThanOrEqual(3000);
      // Whatever was kept still reads as a model document.
      expect(() => readModelDocument(context.yaml)).not.toThrow();
    });
  }

  it("selects the entity a question names, its neighbours, and what concerns them", async () => {
    const document = readModelDocument(await load("examples/drug-discovery.eml.yaml"));
    const context = selectModelContext(document, "what moves can an Experiment make?", {
      maxCharacters: 100000,
    });
    expect(context.entityNames[0]).toBe("Experiment");
    const neighbours = (document.relationships ?? [])
      .filter((r) => r.from === "Experiment" || r.to === "Experiment")
      .flatMap((r) => [r.from, r.to]);
    expect(new Set(context.entityNames)).toEqual(new Set(neighbours));

    const narrowed = parseYaml<{
      stateMachines?: Array<{ entity: string }>;
      entities: Array<{ name: string }>;
      relationships?: Array<{ from: string; to: string }>;
    }>(context.yaml);
    expect(narrowed.stateMachines?.map((m) => m.entity)).toContain("Experiment");
    for (const machine of narrowed.stateMachines ?? []) {
      expect(context.entityNames).toContain(machine.entity);
    }
    for (const relationship of narrowed.relationships ?? []) {
      expect(context.entityNames).toContain(relationship.from);
      expect(context.entityNames).toContain(relationship.to);
    }
    expect(context.truncated).toBe(true);
  });

  it("keeps only the enums and category members the kept entities use", async () => {
    const document = readModelDocument(await load("examples/drug-discovery.eml.yaml"));
    const narrowed = narrowDocument(document, new Set(["Compound"]));
    const used = new Set(
      narrowed.entities.flatMap((e) => e.attributes.flatMap((a) => (a.enum ? [a.enum] : [])))
    );
    expect(new Set(narrowed.enums?.map((e) => e.name) ?? [])).toEqual(used);
    for (const category of narrowed.categories ?? []) {
      expect(category.entities).toEqual(["Compound"]);
    }
  });

  it("drops whole declarations to stay under budget, never part of one", async () => {
    const document = readModelDocument(await load("language/yaml/examples/crm.eml.yaml"));
    const whole = selectModelContext(document, "Opportunity", { maxCharacters: 100000 });
    // A budget above Opportunity alone and below Opportunity with its neighbours.
    const alone = selectModelContext(document, "Opportunity", { maxCharacters: 1000 });
    expect(alone.entityNames).toEqual(["Opportunity"]);
    const budget = alone.yaml.length + 400;
    expect(whole.yaml.length).toBeGreaterThan(budget);
    const tight = selectModelContext(document, "Opportunity", { maxCharacters: budget });
    expect(tight.yaml.length).toBeLessThanOrEqual(budget);
    expect(tight.truncated).toBe(true);
    expect(tight.entityNames[0]).toBe("Opportunity");
    expect(tight.fingerprint).toBe(whole.fingerprint);
    readModelDocument(tight.yaml);
  });

  it("changes the fingerprint when the model changes and not when only its comments do", async () => {
    const text = await load("language/yaml/examples/crm.eml.yaml");
    const base = selectModelContext(readModelDocument(text), "").fingerprint;
    const commented = `# reviewed\n${text.replace(/\n/, "\n# a comment\n")}`;
    expect(selectModelContext(readModelDocument(commented), "").fingerprint).toBe(base);
    const renamed = text.replace("name: Enterprise CRM", "name: Enterprise CRM Renamed");
    expect(renamed).not.toBe(text);
    expect(selectModelContext(readModelDocument(renamed), "").fingerprint).not.toBe(base);
  });

  it("refuses text that is not a model document, saying where", () => {
    expect(() => readModelDocument("eml: '1.0'\nentities: nope\n")).toThrow(ModelProjectionError);
    try {
      readModelDocument("entities:\n  - name: [\n");
    } catch (error) {
      expect(error).toBeInstanceOf(ModelProjectionError);
      expect((error as ModelProjectionError).diagnostics[0]?.line).toBeGreaterThan(0);
    }
  });

  it("keeps prototype-shaped names as data", () => {
    const document = readModelDocument(
      'eml: "1.0"\nentities:\n  - name: Item\n    attributes:\n      - name: __proto__\n        type: string\n      - name: constructor\n        type: string\n'
    );
    expect(document.entities[0]?.attributes.map((a) => a.name)).toEqual(["__proto__", "constructor"]);
    expect(projectModel(document)).toContain("name: __proto__");
    expect(({} as Record<string, unknown>).constructor).toBe(Object);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe("graphs and history", () => {
  it("validates YAML graphs and refuses hierarchy cycles before querying", () => {
    expect(() => parseArchitectureYaml("nodes: [{id: a, type: Entity, parent: b}]")).toThrow();
    expect(() =>
      executeQuery(
        { nodes: [{ id: "a", type: "Entity", parent: "a" }], links: [] },
        { nodes: { filters: [{ condition: { operator: "ancestorOf", value: "a" } }] } }
      )
    ).toThrow("Cycle");
    const graph = parseArchitectureYaml(
      "nodes: [{id: a, type: Entity, attributes: {enabled: true}}]"
    );
    expect(parseArchitectureYaml(architectureToYaml(graph))).toEqual(graph);
  });

  it("requires a host commit coordinator for model/YAML writes", async () => {
    const port = {
      showFile: async () => "",
      diffFile: async () => "",
      historyForFile: async () => [],
    };
    await expect(
      commitArtifactPair(port, "model.eml.yaml", "source", "model.ai.yaml", "yaml", "save")
    ).rejects.toThrow("read-only");
    await expect(showFileAtCommit(port, "HEAD; bad", "model.eml.yaml")).rejects.toThrow(
      "commit ID"
    );
    await expect(showFileAtCommit(port, "a".repeat(40), "../secret")).rejects.toThrow("Unsafe");
  });
});
