/**
 * Editing one entity file in place.
 *
 * The file is parsed as a Document and written back with ROUND_TRIP, so the
 * lines an edit does not touch come back exactly as they were — comments,
 * folding, quoting and flow style included.
 */

import { readFileSync } from "node:fs";
import { type Document, isMap, isSeq, type YAMLMap, type YAMLSeq } from "yaml";
import { entityPaths } from "./library";
import { parseYaml, readDocument } from "./yaml";

export interface EntityDocument {
  path: string;
  document: Document.Parsed;
  /** The `entity:` mapping node. */
  entity: YAMLMap;
}

/** Every entity file, keyed by entity name. */
export function entityFilesByName(): Map<string, string> {
  const out = new Map<string, string>();
  for (const file of entityPaths()) {
    const name = parseYaml(readFileSync(file, "utf-8"), file).entity?.name;
    if (typeof name === "string") out.set(name, file);
  }
  return out;
}

export function openEntity(path: string): EntityDocument {
  const document = readDocument(path);
  const entity = document.get("entity", true);
  if (!isMap(entity)) throw new Error(`${path}: no entity mapping`);
  return { path, document, entity };
}

/** The entity's document by name; exits with a message when there is none. */
export function openEntityByName(name: string): EntityDocument {
  const file = entityFilesByName().get(name);
  if (!file) fail(`no entity ${name}`);
  return openEntity(file);
}

/** The items of a sequence under the entity (`attributes`, `relationships`), as mapping nodes. */
export function items(entity: YAMLMap, key: string): YAMLMap[] {
  const seq = entity.get(key, true);
  if (!isSeq(seq)) return [];
  return (seq as YAMLSeq).items.filter((item): item is YAMLMap => isMap(item));
}

/** The item whose `name` is `name`. */
export function itemNamed(entity: YAMLMap, key: string, name: string): YAMLMap | undefined {
  return items(entity, key).find((item) => item.get("name") === name);
}

export function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
