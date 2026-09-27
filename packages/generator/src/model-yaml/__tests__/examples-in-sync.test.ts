/**
 * The YAML examples shipped with the language are the conversions of their
 * EML counterparts, byte for byte, and each is a valid model.
 *
 * The `.mmd` files stay because the parity gate and the Rust generator read
 * them; this keeps the two from drifting apart. Regenerate a YAML example with
 * `appwithai convert <model.mmd> -o <model.eml.yaml> --force`.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { emlToModelDocument, readModelYaml, serializeModelDocument } from "../index";

const ROOT = path.resolve(__dirname, "../../../../..");

/**
 * Every model in the repository with its YAML beside it (`x.mmd` / `x.eml.mmd`
 * → `x.eml.yaml`), plus the language's own examples, whose YAML lives under
 * `language/yaml/examples/`. Three `.mmd` files have none, and on purpose:
 * `examples/clinic.mmd` and `examples/gemini-crm.mmd` are not EML models (a
 * prose design note and a styled flowchart with no diagram type — they
 * declare nothing a generator compiles), and `tests/test-data/hospital-erd/
 * hospital.erd.mmd` fails the language checker in either syntax (98 × EML113:
 * lookup tables keyed by `code`, which the generator re-keys by an added `id`).
 */
const BESIDE = [
  "examples/cli-crm.eml.mmd",
  "examples/clinic.erd.mmd",
  "examples/crm.erd.mmd",
  "examples/drug-discovery.eml.mmd",
  "examples/ecommerce.erd.mmd",
  "examples/gemini-crm-erd.mmd",
  "examples/simple.erd.mmd",
  "html/models/crm.eml.mmd",
  "html/models/drug-discovery.eml.mmd",
  "html/models/investment-planning-wealth-management-system.eml.mmd",
  "packages/generator/examples/crm.erd.mmd",
  "packages/yamltecture/test/fixtures/field-service.eml.mmd",
  "school-management.mmd",
  "simple-crm.mmd",
  "test-patient.mmd",
  "test-simple-erd.mmd",
];

const PAIRS: Array<[string, string]> = [
  ...BESIDE.map((eml): [string, string] => [eml, eml.replace(/(\.eml)?\.mmd$/, ".eml.yaml")]),
  ...["crm", "dance-studio", "ecommerce", "helpdesk", "minimal"].map((name): [string, string] => [
    `language/examples/${name}.eml.mmd`,
    `language/yaml/examples/${name}.eml.yaml`,
  ]),
];

describe.each(PAIRS)("%s ↔ %s", (eml, yaml) => {
  const source = readFileSync(path.join(ROOT, eml), "utf8");
  const text = readFileSync(path.join(ROOT, yaml), "utf8");

  it("is the conversion of its EML", () => {
    expect(text).toBe(serializeModelDocument(emlToModelDocument(source).document));
  });

  it("is a valid model", () => {
    const result = readModelYaml(text);
    expect(result.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  });
});
