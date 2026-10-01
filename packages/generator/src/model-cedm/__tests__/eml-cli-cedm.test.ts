/**
 * The `eml` CLI reads a CEDM model as it reads the model document it lowers to:
 * the same findings and the same CLI model, for every CEDM example in the
 * repository and for a domain application that imports from the library.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readModel, toEmlModel } from "../../../../../language/cli/src/document";
import { serializeModelDocument } from "../../model-yaml";
import { createFileLibrary, readCedmModel } from "../index";

const ROOT = path.resolve(__dirname, "../../../../..");
const MODELS = [
  "examples/drug-discovery.cedm.yaml",
  "language/cedm/examples/crm.cedm.yaml",
  "language/cedm/examples/helpdesk.cedm.yaml",
  "applications/sales.cedm.yaml",
];

describe("the eml CLI reads CEDM", () => {
  for (const model of MODELS) {
    it(`${model}: as it reads the model document it lowers to`, async () => {
      const file = path.join(ROOT, model);
      const text = readFileSync(file, "utf-8");
      const viaCli = await readModel(text, { autofix: false, file });
      expect(
        viaCli.ok,
        JSON.stringify(viaCli.diagnostics.filter((d) => d.severity === "error"))
      ).toBe(true);

      const lowered = readCedmModel(text, {
        library: createFileLibrary({ root: ROOT, modelDirectory: path.dirname(file) }),
      }).document!;
      const viaDocument = await readModel(serializeModelDocument(lowered), { autofix: false });

      expect(viaCli.document).toEqual(JSON.parse(JSON.stringify(lowered)));
      expect(toEmlModel(viaCli.document!)).toEqual(toEmlModel(viaDocument.document!));
    });
  }
});
