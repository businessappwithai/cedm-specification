import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseModelYaml } from "../../model-yaml";
import { SHOT, renderSite } from "..";

const modelPath = path.resolve(__dirname, "../../../../../examples/drug-discovery.eml.yaml");
const { model } = parseModelYaml(readFileSync(modelPath, "utf8"), { source: modelPath });

const site = (shots: string[] = []) =>
  renderSite(model, {
    domain: "drug-discovery",
    title: "Drug Discovery",
    description: "Compounds, experiments and assays.",
    shots: new Set(shots),
  });

describe("renderSite", () => {
  const files = site();

  it("writes a Docusaurus project", () => {
    for (const file of ["package.json", "docusaurus.config.js", "sidebars.js", "docs/intro.md", "docs/getting-started.md"]) {
      expect(files.has(file), file).toBe(true);
    }
    expect(JSON.parse(files.get("package.json") as string).overrides.webpack).toBe("5.99.9");
  });

  it("writes one page per entity", () => {
    const pages = [...files.keys()].filter((file) => /^docs\/(entities|reference-data)\/.+\/?[a-z-]+\.md$/.test(file));
    expect(pages.length).toBeGreaterThanOrEqual(model.entities.length);
  });

  it("never names a table or a column: only windows and labels", () => {
    for (const [file, content] of files) {
      if (!file.endsWith(".md")) continue;
      expect(content, file).not.toMatch(/\bbus_[a-z0-9_]+/);
    }
  });

  it("links a screenshot only if it exists", () => {
    const entity = model.entities[0]?.name as string;
    expect([...files.values()].join("\n")).not.toContain("/img/entities/");
    const withShot = site([SHOT.entityList(entity)]);
    expect([...withShot.values()].join("\n")).toContain(`/${SHOT.entityList(entity)}`);
  });

  it("explains every rule and lifecycle", () => {
    expect(files.get("docs/administration/lifecycles.md")).toContain("stateDiagram-v2");
    if (model.rules.length > 0) {
      expect([...files.keys()].some((file) => file.startsWith("docs/administration/rules/"))).toBe(true);
    }
  });
});
