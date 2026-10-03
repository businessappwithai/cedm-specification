/**
 * Run the website's in-browser Loco generator the way a page runs it, and write
 * the file map it returns as JSON. Started by `loco-equivalence.ts` in a
 * process whose working directory is `/`, so nothing of this repository is in
 * reach of the bundle except what its assets carry.
 *
 *   bun loco-run.ts <bundle> <assets.json> <model.eml.yaml> <name> <out.json>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { readModelYaml } from "../../packages/generator/src/model-yaml";

const [bundle, assetsPath, modelPath, name, out] = process.argv.slice(2) as [string, string, string, string, string];
const modelText = readFileSync(modelPath, "utf8");
const read = readModelYaml(modelText);
if (!read.ok || !read.document) throw new Error(`${modelPath} does not read`);
const { generateLocoApplication } = await import(bundle);
const console_ = console.log;
console.log = () => {};
const { files, executables } = await generateLocoApplication({
  document: read.document,
  modelText,
  name,
  assets: JSON.parse(readFileSync(assetsPath, "utf8")),
});
console.log = console_;
const json: Record<string, string | { base64: string }> = {};
for (const [path, contents] of files as Map<string, string | Uint8Array>) {
  json[path] = typeof contents === "string" ? contents : { base64: Buffer.from(contents).toString("base64") };
}
writeFileSync(out, JSON.stringify({ files: json, executables: [...executables] }));
