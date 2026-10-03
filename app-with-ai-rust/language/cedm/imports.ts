/**
 * Imports: assembling one self-contained CEDM model from a model, the modules it
 * imports and the domain library.
 *
 * A model may import
 *
 * - **library entities** — `{ entity: SalesOrder }` brings in the canonical
 *   definition from `domain/entities/`, narrowed by `include` / `exclude`;
 * - **application modules** — `{ module: common }` brings in everything another
 *   CEDM model declares (its entities, value lists, categories, permissions,
 *   hooks, rules, processes and reports). This is how every domain
 *   application shares one common foundation.
 *
 * An imported entity brings the entities its *required* references point at
 * (cardinality `1` or `1..*`, or a required reference attribute), recursively,
 * because a record that cannot be created without them is no use alone. An
 * optional reference to an entity the model does not contain is left out of
 * the generated application, and said so — a library entity is designed to fit
 * many applications, and most of them do not want every neighbour.
 *
 * An entity declared in the model with the name of an imported one refines it:
 * its keys replace the imported ones, and its attributes and relationships are
 * merged by name.
 *
 * `extends` is resolved here as well: a specialisation carries its parent's
 * attributes and relationships (all but the parent's identity), so
 * `Customer extends PartyRole` stores what a party role stores.
 *
 * File access is the caller's: this module is given a library to ask, so the
 * browser bundle and the CLI resolve imports the same way.
 */

import type { DocumentPath } from "../yaml/document";
import type { CedmAttribute, CedmEntity, CedmModelDocument, CedmRelationship } from "./document";
import type { LoweringNote } from "./lower";

export interface CedmLibrary {
  /** The library's definition of an entity, or undefined if it has none. */
  entity(name: string): CedmEntity | undefined;
  /** A module, by the name an import gives it. */
  module?(name: string): CedmModelDocument | undefined;
}

export interface ResolvedCedmModel {
  /** The model with every import folded in and no `imports` left. */
  document: CedmModelDocument;
  notes: LoweringNote[];
  /** Where each entity came from: `model`, `library`, or `module:<name>`. */
  origins: Map<string, string>;
  /** Library entities the model uses, in the order they were brought in. */
  libraryEntities: string[];
  /**
   * For each entity of `document`, where the model brought it in: its own
   * declaration, or the import that did.
   */
  entityPaths: DocumentPath[];
  /** For each list a module contributes to, how many items precede the model's own. */
  listOffsets: Record<string, number>;
}

const REQUIRED_CARDINALITY = /^(1|[1-9][0-9]*\.\.\*)$/;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function mergeByName<T extends { name: string }>(base: T[] = [], over: T[] = []): T[] {
  const merged = base.map((item) => over.find((candidate) => candidate.name === item.name) ?? item);
  for (const item of over) {
    if (!base.some((candidate) => candidate.name === item.name)) merged.push(item);
  }
  return merged;
}

/** A local declaration refining an imported entity. */
export function refineEntity(base: CedmEntity, over: CedmEntity): CedmEntity {
  const merged: CedmEntity = { ...base, ...over };
  merged.attributes = mergeByName(base.attributes, over.attributes);
  merged.relationships = mergeByName(base.relationships, over.relationships);
  if (!merged.relationships.length) delete merged.relationships;
  if (base.ui || over.ui) merged.ui = { ...base.ui, ...over.ui };
  if (base.persistence || over.persistence) {
    merged.persistence = { ...base.persistence, ...over.persistence };
  }
  return merged;
}

function narrow(entity: CedmEntity, include?: string[], exclude?: string[]): CedmEntity {
  if (!include && !exclude) return entity;
  const keys = new Set(
    entity.identity?.key === undefined || entity.identity.key === null
      ? []
      : Array.isArray(entity.identity.key)
        ? entity.identity.key
        : [entity.identity.key]
  );
  const keep = (name: string) =>
    keys.has(name) || ((!include || include.includes(name)) && !exclude?.includes(name));
  return {
    ...entity,
    attributes: (entity.attributes ?? []).filter((attribute) => keep(attribute.name)),
    relationships: (entity.relationships ?? []).filter((relationship) => keep(relationship.name)),
  };
}

function identityNames(entity: CedmEntity): Set<string> {
  const key = entity.identity?.key;
  if (key === undefined || key === null) return new Set();
  return new Set(Array.isArray(key) ? key : [key]);
}

/** Fold every import into one self-contained model. */
export function resolveCedmImports(
  document: CedmModelDocument,
  library: CedmLibrary
): ResolvedCedmModel {
  const notes: LoweringNote[] = [];
  const origins = new Map<string, string>();
  const libraryEntities: string[] = [];
  const note = (
    severity: LoweringNote["severity"],
    code: string,
    message: string,
    path: DocumentPath
  ) => notes.push({ severity, code, message, path });

  const result: CedmModelDocument = { cedm: document.cedm };
  if (document.application) result.application = clone(document.application);
  const entities: CedmEntity[] = [];
  const indexOf = new Map<string, number>();
  const entityPaths: DocumentPath[] = [];
  const addEntity = (entity: CedmEntity, origin: string, path: DocumentPath) => {
    const existing = indexOf.get(entity.name);
    if (existing !== undefined) {
      entities[existing] = refineEntity(entities[existing] as CedmEntity, entity);
      if (origin === "model") entityPaths[existing] = path;
      return;
    }
    indexOf.set(entity.name, entities.length);
    entities.push(entity);
    entityPaths.push(path);
    origins.set(entity.name, origin);
  };

  type ListKey = "enums" | "hooks" | "hookFlows" | "triggers" | "reports" | "rules" | "processes";
  const LISTS: ListKey[] = [
    "enums",
    "hooks",
    "hookFlows",
    "triggers",
    "reports",
    "rules",
    "processes",
  ];
  const appendLists = (from: CedmModelDocument) => {
    for (const key of LISTS) {
      const items = from[key] as unknown[] | undefined;
      if (!items?.length) continue;
      const target =
        ((result as unknown as Record<string, unknown>)[key] as unknown[] | undefined) ?? [];
      target.push(...clone(items));
      (result as unknown as Record<string, unknown>)[key] = target;
    }
    if (from.ui?.categories?.length) {
      result.ui = { categories: [...(result.ui?.categories ?? []), ...clone(from.ui.categories)] };
    }
    if (from.authorization?.permissions?.length) {
      result.authorization = {
        permissions: [
          ...(result.authorization?.permissions ?? []),
          ...clone(from.authorization.permissions),
        ],
      };
    }
  };

  const fromLibrary = (name: string, path: DocumentPath): CedmEntity | undefined => {
    const found = library.entity(name);
    if (!found) {
      note("error", "CEDM101", `The CEDM library has no entity "${name}".`, path);
      return undefined;
    }
    if (!libraryEntities.includes(name)) libraryEntities.push(name);
    return clone(found);
  };

  /* ---- modules and library imports, in the order written ---------------- */
  const visiting: string[] = [];
  /** `base` is the top-level import a nested module's findings are reported at. */
  const importFrom = (model: CedmModelDocument, base: DocumentPath | undefined) => {
    (model.imports ?? []).forEach((item, index) => {
      const path: DocumentPath = base ?? ["imports", index];
      if ("module" in item) {
        if (visiting.includes(item.module)) {
          note(
            "error",
            "CEDM103",
            `Module "${item.module}" imports itself (${[...visiting, item.module].join(" → ")}).`,
            path
          );
          return;
        }
        const module = library.module?.(item.module);
        if (!module) {
          note("error", "CEDM102", `No application module named "${item.module}".`, path);
          return;
        }
        visiting.push(item.module);
        importFrom(module, path);
        for (const entity of module.entities ?? []) {
          addEntity(clone(entity), `module:${item.module}`, path);
        }
        appendLists(module);
        visiting.pop();
        return;
      }
      const entity = fromLibrary(item.entity, path);
      if (entity) addEntity(narrow(entity, item.include, item.exclude), "library", path);
    });
  };
  importFrom(document, undefined);

  /* ---- the model's own declarations ------------------------------------- */
  (document.entities ?? []).forEach((entity, index) => {
    addEntity(clone(entity), "model", ["entities", index]);
  });
  const listOffsets: Record<string, number> = {};
  for (const key of LISTS) listOffsets[key] = (result[key] as unknown[] | undefined)?.length ?? 0;
  listOffsets.categories = result.ui?.categories?.length ?? 0;
  listOffsets.permissions = result.authorization?.permissions?.length ?? 0;
  appendLists(document);

  /* ---- extends ---------------------------------------------------------- */
  const flatten = (entity: CedmEntity, seen: string[]): CedmEntity => {
    if (entity.extends === undefined) return entity;
    if (seen.includes(entity.extends)) {
      note(
        "error",
        "CEDM104",
        `${entity.name} extends itself through ${[...seen, entity.extends].join(" → ")}.`,
        []
      );
      return entity;
    }
    const local = indexOf.has(entity.extends)
      ? entities[indexOf.get(entity.extends) as number]
      : undefined;
    const parentName = entity.extends;
    const parentSource = local ?? library.entity(entity.extends);
    if (!parentSource) {
      note(
        "warning",
        "CEDM105",
        `${entity.name} extends "${entity.extends}", which neither the model nor the library declares; nothing is inherited.`,
        []
      );
      return entity;
    }
    const parent = flatten(clone(parentSource), [...seen, entity.name]);
    const parentKeys = identityNames(parent);
    const own = new Set((entity.attributes ?? []).map((attribute) => attribute.name));
    const ownRelationships = new Set(
      (entity.relationships ?? []).map((relationship) => relationship.name)
    );
    const inherited: CedmAttribute[] = (parent.attributes ?? []).filter(
      (attribute) => !parentKeys.has(attribute.name) && !own.has(attribute.name)
    );
    // A parent's links to its own specializations (`Party.person`,
    // `Party.organization`) say which kinds of Party exist. They belong to the
    // parent: copied onto `Person`, they link a Person to an Organization it
    // has nothing to do with, and make a cycle of the two.
    const definitionOf = (name: string): CedmEntity | undefined =>
      entities[indexOf.get(name) ?? -1] ?? library.entity(name);
    const specializes = (name: string, root: string, seen: string[] = []): boolean => {
      const next = definitionOf(name)?.extends;
      if (next === undefined || seen.includes(name)) return false;
      return next === root || specializes(next, root, [...seen, name]);
    };
    const inheritedRelationships: CedmRelationship[] = (parent.relationships ?? []).filter(
      (relationship) =>
        !ownRelationships.has(relationship.name) &&
        !specializes(relationship.target, parentName)
    );
    return {
      ...entity,
      attributes: [...(entity.attributes ?? []), ...inherited],
      ...(inheritedRelationships.length || entity.relationships
        ? { relationships: [...(entity.relationships ?? []), ...inheritedRelationships] }
        : {}),
    };
  };

  /* ---- closing over required references --------------------------------- */
  for (let index = 0; index < entities.length; index++) {
    entities[index] = flatten(entities[index] as CedmEntity, []);
    const entity = entities[index] as CedmEntity;
    if (origins.get(entity.name) === "model") continue;
    const needed: string[] = [];
    for (const relationship of entity.relationships ?? []) {
      if (REQUIRED_CARDINALITY.test(String(relationship.cardinality))) {
        needed.push(relationship.target);
      }
    }
    for (const attribute of entity.attributes ?? []) {
      if (
        attribute.type.toLowerCase() === "reference" &&
        attribute.required !== false &&
        attribute.target !== undefined
      ) {
        needed.push(attribute.target);
      }
    }
    for (const name of needed) {
      if (indexOf.has(name)) continue;
      const found = library.entity(name);
      if (!found) continue;
      if (!libraryEntities.includes(name)) libraryEntities.push(name);
      addEntity(clone(found), "library", entityPaths[index] ?? []);
      note(
        "info",
        "CEDM106",
        `${name} is brought in because ${entity.name} cannot exist without it.`,
        []
      );
    }
  }

  result.entities = entities;
  return { document: result, notes, origins, libraryEntities, entityPaths, listOffsets };
}
