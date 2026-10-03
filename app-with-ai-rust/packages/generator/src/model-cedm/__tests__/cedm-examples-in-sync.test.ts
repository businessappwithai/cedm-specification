/**
 * The checked-in CEDM forms of the example models are the conversion of their
 * model documents, so a change to one that is not made to the other fails
 * here. Regenerate with `appwithai convert <model>.eml.yaml --force`.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readModelYaml } from "../../model-yaml";
import { raiseModelDocument, serializeCedmDocument } from "../index";

const ROOT = path.resolve(__dirname, "../../../../..");
const PAIRS: Array<[string, string]> = [
  ["examples/drug-discovery.eml.yaml", "examples/drug-discovery.cedm.yaml"],
  ...["crm", "dance-studio", "ecommerce", "helpdesk", "minimal"].map((name): [string, string] => [
    `language/yaml/examples/${name}.eml.yaml`,
    `language/cedm/examples/${name}.cedm.yaml`,
  ]),
];

describe("checked-in CEDM examples", () => {
  for (const [eml, cedm] of PAIRS) {
    it(`${cedm} is the conversion of ${eml}`, () => {
      const document = readModelYaml(readFileSync(path.join(ROOT, eml), "utf-8")).document;
      expect(document).toBeDefined();
      expect(readFileSync(path.join(ROOT, cedm), "utf-8")).toBe(
        serializeCedmDocument(
          raiseModelDocument(document!),
          ` Converted from ${path.basename(eml)}.`
        )
      );
    });
  }
});
