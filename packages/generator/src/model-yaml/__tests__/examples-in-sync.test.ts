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

const PAIRS: Array<[string, string]> = [
  ["examples/drug-discovery.eml.mmd", "examples/drug-discovery.eml.yaml"],
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
