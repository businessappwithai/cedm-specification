#!/usr/bin/env bun
/**
 * Remove the keys that only restate a field's `required` flag.
 *
 * `requiredMeaning: Required.` and `optionalMeaning: Optional.` say what the schema
 * already says; the longer template forms said it at length. The dictionary shows a
 * field's required state from `required`, so the text adds nothing.
 *
 *     bun tools/help-strip.ts [--check]
 */

import "./lib/cli";
import { isMap } from "yaml";
import { items, openEntity } from "./lib/edit";
import { entityPaths } from "./lib/library";
import { writeDocument } from "./lib/yaml";

const KEYS = ["requiredMeaning", "optionalMeaning"];
const check = process.argv.includes("--check");
let touched = 0;
for (const file of entityPaths()) {
  const { document, entity } = openEntity(file);
  let changed = false;
  for (const attr of items(entity, "attributes")) {
    const help = attr.get("help", true);
    if (!isMap(help)) continue;
    for (const key of KEYS) if (help.delete(key)) changed = true;
  }
  if (!changed) continue;
  touched++;
  if (!check) writeDocument(file, document);
}
console.log(
  `${touched} entit${touched === 1 ? "y" : "ies"} ${check ? "carry" : "cleaned of"} requiredMeaning/optionalMeaning`
);
process.exit(check && touched ? 1 : 0);
