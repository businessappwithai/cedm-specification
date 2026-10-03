#!/usr/bin/env bun
/**
 * The context the assistant is given for a question about a model.
 *
 *   bun packages/yamltecture/scripts/model-context.ts <model.eml.yaml> "<question>" [maxCharacters]
 */

import { readFile } from "node:fs/promises";
import { ModelProjectionError, readModelDocument, selectModelContext } from "../src/model/context";

const [, , input, question = "", budget] = process.argv;
if (!input) {
  console.error(
    'Usage: bun packages/yamltecture/scripts/model-context.ts <model.eml.yaml> "<question>" [maxCharacters]'
  );
  process.exit(2);
}

try {
  const document = readModelDocument(await readFile(input, "utf8"));
  const context = selectModelContext(document, question, {
    maxCharacters: budget ? Number(budget) : undefined,
  });
  console.error(
    `${context.entityNames.length} entities: ${context.entityNames.join(", ")}` +
      `${context.truncated ? " (truncated)" : ""} · fingerprint ${context.fingerprint}`
  );
  process.stdout.write(context.yaml);
} catch (error) {
  console.error(error instanceof ModelProjectionError ? `${input}: ${error.message}` : error);
  process.exit(1);
}
