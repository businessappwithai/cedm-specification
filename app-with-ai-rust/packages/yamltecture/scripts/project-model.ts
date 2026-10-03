#!/usr/bin/env bun
/**
 * Print a model's canonical projection — what the modelling tool stores as
 * `.appwithai/model.ai.yaml` — or write it to a file.
 *
 *   bun packages/yamltecture/scripts/project-model.ts <model.eml.yaml> [out.yaml]
 */

import { readFile, writeFile } from "node:fs/promises";
import { ModelProjectionError, projectSource } from "../src/model/context";

const [, , input, output] = process.argv;
if (!input) {
  console.error("Usage: bun packages/yamltecture/scripts/project-model.ts <model.eml.yaml> [out.yaml]");
  process.exit(2);
}

try {
  const projection = projectSource(await readFile(input, "utf8"));
  if (output) await writeFile(output, projection);
  else process.stdout.write(projection);
} catch (error) {
  console.error(error instanceof ModelProjectionError ? `${input}: ${error.message}` : error);
  process.exit(1);
}
