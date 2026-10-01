/**
 * The CEDM specification on disk: where it is, and its entities and modules.
 *
 * The specification is the repository's own `domain/entities/` (one file per
 * entity, `entity:` at the top), `specification/`, `schema/` and `domains/`,
 * plus `applications/`, the CEDM application models — one per domain — and the
 * modules they share. A model finds it by walking up from itself, from the
 * working directory, or from this module, and `CEDM_SPEC_ROOT` overrides all
 * three.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import type { CedmEntity, CedmLibrary, CedmModelDocument } from "../../../../language/cedm";

/** The marker of a specification root. */
const MARKER = path.join("specification", "manifest.yaml");

function walkUp(start: string): string | undefined {
  let directory = path.resolve(start);
  for (;;) {
    if (existsSync(path.join(directory, MARKER)) && existsSync(path.join(directory, "domain"))) {
      return directory;
    }
    const parent = path.dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
}

/** The CEDM specification root, or undefined when none can be found. */
export function locateCedmRoot(near?: string): string | undefined {
  const fromEnvironment = process.env.CEDM_SPEC_ROOT;
  if (fromEnvironment && existsSync(path.join(fromEnvironment, MARKER))) {
    return path.resolve(fromEnvironment);
  }
  const candidates = [near, process.cwd()];
  try {
    candidates.push(path.dirname(fileURLToPath(import.meta.url)));
  } catch {
    // Not a file module (a bundle in a browser): no third place to look.
  }
  for (const candidate of candidates) {
    if (!candidate) continue;
    const found = walkUp(candidate);
    if (found) return found;
  }
  return undefined;
}

/** What a CEDM model brings to generation besides the document it lowers to. */
export interface CedmSource {
  /** The CEDM text, as written. */
  text: string;
  /** The CEDM specification root its library imports came from. */
  root?: string;
  /** Library entities it uses, as files relative to `root`. */
  libraryFiles: string[];
  /** Module files it imported (absolute). */
  moduleFiles: string[];
}

export interface FileLibrary extends CedmLibrary {
  root: string | undefined;
  /** The file a library entity was read from, relative to the root. */
  entityFile(name: string): string | undefined;
  /** Module files read while resolving, by name. */
  moduleFiles: Map<string, string>;
}

const entityCache = new Map<string, Map<string, { file: string; entity: CedmEntity }>>();

function libraryEntities(root: string): Map<string, { file: string; entity: CedmEntity }> {
  const cached = entityCache.get(root);
  if (cached) return cached;
  const entities = new Map<string, { file: string; entity: CedmEntity }>();
  const directory = path.join(root, "domain", "entities");
  for (const file of readdirSync(directory).sort()) {
    if (!file.endsWith(".yaml") || file === "index.yaml" || file === "README.yaml") continue;
    let document: unknown;
    try {
      document = parse(readFileSync(path.join(directory, file), "utf-8"));
    } catch {
      continue;
    }
    const entity = (document as { entity?: CedmEntity } | null)?.entity;
    if (entity && typeof entity.name === "string") {
      // Reference data is a file of its own beside the entity; the entity is
      // handed out with the rows inlined, so nothing downstream reads a file.
      if (entity.referenceData !== undefined) {
        const rows = parse(readFileSync(path.join(root, "domain", entity.referenceData), "utf-8")) as {
          referenceData?: { key: string; rows: NonNullable<CedmEntity["data"]>["rows"] };
        };
        if (rows.referenceData) entity.data = { key: rows.referenceData.key, rows: rows.referenceData.rows };
        delete entity.referenceData;
      }
      entities.set(entity.name, { file: path.join("domain", "entities", file), entity });
    }
  }
  entityCache.set(root, entities);
  return entities;
}

/**
 * A library backed by the specification on disk.
 *
 * `modelDirectory` is where the importing model lives: a module is looked for
 * beside it first (`<name>.cedm.yaml`), then under `applications/`.
 */
export function createFileLibrary(options: {
  root?: string;
  modelDirectory?: string;
  /** Read and validate a module; the reader supplies it so modules are held to the schema. */
  readModule?: (text: string, file: string) => CedmModelDocument;
}): FileLibrary {
  const root = options.root ?? locateCedmRoot(options.modelDirectory);
  const moduleFiles = new Map<string, string>();
  return {
    root,
    moduleFiles,
    entity(name) {
      if (!root) return undefined;
      return libraryEntities(root).get(name)?.entity;
    },
    entityFile(name) {
      if (!root) return undefined;
      return libraryEntities(root).get(name)?.file;
    },
    module(name) {
      const places = [
        options.modelDirectory && path.join(options.modelDirectory, `${name}.cedm.yaml`),
        options.modelDirectory && path.join(options.modelDirectory, name),
        root && path.join(root, "applications", `${name}.cedm.yaml`),
      ].filter((place): place is string => Boolean(place));
      const file = places.find((place) => existsSync(place));
      if (!file) return undefined;
      moduleFiles.set(name, file);
      const text = readFileSync(file, "utf-8");
      return options.readModule
        ? options.readModule(text, file)
        : (parse(text) as CedmModelDocument);
    },
  };
}
