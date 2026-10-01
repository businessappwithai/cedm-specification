/**
 * Run inside the reference (18f5792): compile Mermaid models the way that
 * commit's generator did, and print `{ [file]: { model } | { error } }` as JSON.
 *
 *   REFERENCE=<checkout> bun yaml/verify/reference/compile-mermaid.ts <file.mmd>...
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const reference = process.env.REFERENCE;
if (!reference) throw new Error("REFERENCE is not set");
const { parseModel } = await import(join(reference, "packages/generator/src/pipeline/parse-model.ts"));

const result: Record<string, unknown> = {};
for (const file of process.argv.slice(2)) {
  const warn = console.warn;
  console.warn = () => {};
  try {
    result[file] = { model: parseModel(readFileSync(file, "utf8")) };
  } catch (error) {
    result[file] = { error: String(error) };
  } finally {
    console.warn = warn;
  }
}
process.stdout.write(JSON.stringify(result));
