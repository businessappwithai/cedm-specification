import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readModelYaml } from "@appwithai/generator/model-yaml";
import { replaceSections, SectionEditError } from "../sections";

const MODEL = path.resolve(__dirname, "../../../../../../examples/drug-discovery.eml.yaml");
const text = readFileSync(MODEL, "utf-8");
const document = readModelYaml(text).document!;

describe("replaceSections", () => {
  it("replaces one section and leaves every other byte where the author put it", () => {
    const rules = document.rules!.slice(0, 1);
    const edited = replaceSections(text, { rules });
    const read = readModelYaml(edited);
    expect(read.document?.rules).toEqual(rules);
    expect(read.document?.entities).toEqual(document.entities);
    // The author's comments above and below the section survive.
    const before = text.slice(0, text.indexOf("\nrules:"));
    expect(edited.startsWith(before)).toBe(true);
    const after = text.slice(text.indexOf("\nstateMachines:"));
    expect(edited.endsWith(after)).toBe(true);
  });

  it("removes a section given an empty list", () => {
    const edited = replaceSections(text, { reports: [] });
    expect(readModelYaml(edited).document?.reports).toBeUndefined();
    expect(edited).not.toMatch(/^reports:/m);
  });

  it("inserts a section the model lacked where the language orders it", () => {
    const minimal = 'eml: "1.0"\nentities:\n  - name: Item\n    attributes:\n      - name: id\n        type: string\n        pk: true\n';
    const edited = replaceSections(minimal, {
      sagas: [
        {
          name: "Stamp",
          entity: "Item",
          steps: [{ id: "a", type: "UpdateEntity", properties: { field: "id", value: "x" } }],
        },
      ],
      hooks: [{ entity: "Item", event: "beforeCreate", handler: "stamp" }],
    });
    expect(edited.indexOf("hooks:")).toBeLessThan(edited.indexOf("sagas:"));
    expect(edited.indexOf("entities:")).toBeLessThan(edited.indexOf("hooks:"));
    expect(readModelYaml(edited).ok).toBe(true);
  });

  it("refuses a section it may not replace, and text that is not YAML", () => {
    expect(() => replaceSections(text, { entities: [] } as never)).toThrow(SectionEditError);
    expect(() => replaceSections("entities: [", { rules: [] })).toThrow(/not YAML/);
  });
});
