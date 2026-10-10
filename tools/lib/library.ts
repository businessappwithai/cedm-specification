/**
 * Where the specification is, and its entity files.
 *
 * `CEDM_ROOT` points every tool at another checkout — the tests run the rules
 * against a scratch copy of the library with a defect planted in it.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseYaml, type Spec } from "./yaml";

export const ROOT = path.resolve(process.env.CEDM_ROOT ?? path.join(import.meta.dir, "..", ".."));
export const ENTITY_DIR = path.join(ROOT, "domain", "entities");
export const REGISTRY = path.join(ENTITY_DIR, "index.yaml");

/** Paths relative to the root, for messages. */
export function relative(file: string): string {
  return path.relative(ROOT, file);
}

export interface EntityFile {
  /** Absolute path. */
  path: string;
  /** The file's text, as read. */
  text: string;
  /** The whole parsed document (`entity:`, `specification:`). */
  document: Spec;
  entity: Spec;
}

/** The YAML files in a directory, sorted by name. */
export function yamlFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((file) => file.endsWith(".yaml"))
    .sort()
    .map((file) => path.join(directory, file));
}

/** The entity files: every `domain/entities/*.yaml` except the registry. */
export function entityPaths(): string[] {
  return yamlFiles(ENTITY_DIR).filter((file) => path.basename(file) !== "index.yaml");
}

/**
 * Every entity file, parsed, in file-name order. A file that holds no `entity`
 * mapping is left out here — tools/validate.ts reads the files itself and
 * reports it — so no tool trips over it on the way to its own job.
 */
export function loadEntities(): EntityFile[] {
  return entityPaths().flatMap((file) => {
    const text = readFileSync(file, "utf-8");
    const document = parseYaml(text, file);
    const entity = document?.entity;
    if (!entity || typeof entity !== "object" || typeof entity.name !== "string") return [];
    return [{ path: file, text, document, entity }];
  });
}

/** SalesOrderLine → sales_order_line. */
export function snake(name: string): string {
  return name.replace(/(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/g, "_").toLowerCase();
}

/** SalesOrderLine → SALES-ORDER-LINE: the prefix of the entity's identifiers. */
export function idPrefix(name: string): string {
  return name.replace(/(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/g, "-").toUpperCase();
}

/** The parsed file at a path relative to the root. */
export function readRootYaml(relativePath: string): Spec {
  return parseYaml(readFileSync(path.join(ROOT, relativePath), "utf-8"));
}
