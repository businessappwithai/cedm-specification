/**
 * The assistant's view of a model: the model document itself, canonical, and
 * narrowed to what a question is about.
 *
 * A model is a YAML document (`*.eml.yaml`), so the projection the assistant
 * reads needs no second format: it is the document in canonical form. That
 * choice does work — two saves that differ only in comments, key order or
 * layout project to the same bytes, so the project history can tell an edit to
 * the model from an edit to its presentation.
 *
 * Narrowing never rewrites anything. A context is a smaller document holding
 * the entities a question names, their neighbours, and every declaration that
 * refers to one of them — each item whole, as the model states it.
 */

import {
  type ModelDocument,
  readModelYaml,
  serializeModelDocument,
} from "@appwithai/generator/model-yaml";
import { type Architecture, canonicalizeArchitecture, stableHash } from "../core/model";
import { executeQuery } from "../query/execute";

/** A model text that is not a model document, with where and why. */
export class ModelProjectionError extends Error {
  constructor(readonly diagnostics: Array<{ line: number; column: number; message: string }>) {
    super(
      `The model is not a valid model document:\n${diagnostics
        .slice(0, 5)
        .map((d) => `  ${d.line}:${d.column} ${d.message}`)
        .join("\n")}`
    );
    this.name = "ModelProjectionError";
  }
}

/**
 * Read model text into its document. The text must be YAML satisfying the
 * model schema; checker findings (a relationship to an undeclared entity, say)
 * do not stop a projection, because a draft is allowed to be unfinished.
 */
export function readModelDocument(text: string): ModelDocument {
  const read = readModelYaml(text, { check: false });
  if (!read.document) throw new ModelProjectionError(read.diagnostics);
  return read.document;
}

/** The canonical text of a model: what `.appwithai/model.ai.yaml` holds. */
export function projectModel(document: ModelDocument): string {
  return serializeModelDocument(document);
}

/** Canonical text straight from model text. */
export function projectSource(text: string): string {
  return projectModel(readModelDocument(text));
}

/** Entities as nodes, relationships as links: the graph queries run over. */
export function modelToArchitecture(document: ModelDocument): Architecture {
  const names = new Set(document.entities.map((entity) => entity.name));
  return canonicalizeArchitecture({
    nodes: document.entities.map((entity) => ({
      id: entity.name,
      type: "Entity",
      attributes: {
        name: entity.name,
        fields: Object.fromEntries(
          entity.attributes.map((attribute) => [
            attribute.name,
            {
              type: attribute.type,
              modifiers: [
                ...(attribute.pk ? ["PK"] : []),
                ...(attribute.fk ? ["FK"] : []),
                ...(attribute.unique ? ["UK"] : []),
                ...(attribute.optional ? ["optional"] : []),
              ],
            },
          ])
        ),
      },
    })),
    links: (document.relationships ?? [])
      .filter((relationship) => names.has(relationship.from) && names.has(relationship.to))
      .map((relationship) => ({
        source: relationship.from,
        target: relationship.to,
        type: `${relationship.fromCardinality}:${relationship.toCardinality}`,
        attributes: { label: relationship.label ?? "" },
      })),
  });
}

export interface ModelContext {
  /** The narrowed document, canonical. */
  yaml: string;
  /** The entities in it and the relationships between them. */
  graph: Architecture;
  entityNames: string[];
  /** Whether anything the model declares was left out. */
  truncated: boolean;
  /** Of the whole model's canonical text; changes exactly when the model does. */
  fingerprint: string;
}

export interface ModelContextOptions {
  maxCharacters?: number;
  maxEntities?: number;
}

/**
 * The part of a model a question is about, under a size budget.
 *
 * An entity the question names by name (or plural) is selected with every
 * entity one relationship away; a question naming none gets the first
 * `maxEntities` in declaration order. Over budget, whole declarations are
 * dropped — the ones furthest from the question first — and never cut. The
 * first entity is always kept, so a context can exceed the budget only when
 * that one entity alone does; `truncated` then says what else was left out.
 */
export function selectModelContext(
  document: ModelDocument,
  question = "",
  options: ModelContextOptions = {}
): ModelContext {
  const maxEntities = Math.max(1, Math.min(options.maxEntities ?? 20, 100));
  const maxCharacters = Math.max(1000, Math.min(options.maxCharacters ?? 24000, 100000));
  const graph = modelToArchitecture(document);
  const words = new Set(question.toLowerCase().match(/[a-z0-9_]+/g) ?? []);
  const declared = document.entities.map((entity) => entity.name);
  const named = declared.filter(
    (name) => words.has(name.toLowerCase()) || words.has(`${name.toLowerCase()}s`)
  );

  const selected = new Set(named.length ? named : declared.slice(0, maxEntities));
  if (named.length) {
    for (const link of graph.links) {
      if (named.includes(link.source) || named.includes(link.target)) {
        selected.add(link.source);
        selected.add(link.target);
      }
    }
  }
  // Declaration order, the question's own entities first.
  const ordered = [
    ...named,
    ...declared.filter((name) => selected.has(name) && !named.includes(name)),
  ].slice(0, maxEntities);

  let narrowed = narrowDocument(document, new Set(ordered));
  let yaml = projectModel(narrowed);
  let truncated = ordered.length < declared.length;

  // Over budget: drop behaviour furthest from the entity shapes first, then
  // entities from the end of the order — always whole items.
  const sheddable: Array<keyof ModelDocument> = [
    "hookFlows",
    "reports",
    "sagas",
    "rules",
    "stateMachines",
    "triggers",
    "hooks",
    "rbac",
    "categories",
  ];
  for (const key of sheddable) {
    const list = narrowed[key] as unknown[] | undefined;
    if (yaml.length <= maxCharacters || !list?.length) continue;
    const base = narrowed;
    const withFirst = (count: number) =>
      ({ ...base, [key]: count ? list.slice(0, count) : undefined }) as ModelDocument;
    const count = largestFitting(list.length - 1, 0, (n) => projectModel(withFirst(n)).length <= maxCharacters);
    narrowed = withFirst(count);
    yaml = projectModel(narrowed);
    truncated = true;
  }
  if (yaml.length > maxCharacters && ordered.length > 1) {
    const base = narrowed;
    const withFirst = (count: number) => narrowDocument(base, new Set(ordered.slice(0, count)));
    const count = largestFitting(ordered.length - 1, 1, (n) => projectModel(withFirst(n)).length <= maxCharacters);
    narrowed = withFirst(count);
    yaml = projectModel(narrowed);
    truncated = true;
  }

  const entityNames = narrowed.entities.map((entity) => entity.name);
  return {
    yaml,
    graph: executeQuery(graph, {
      nodes: {
        filters: [
          {
            condition: {
              operator: "or",
              conditions: entityNames.map((value) => ({ field: "id", operator: "equals", value })),
            },
          },
        ],
      },
    }),
    entityNames,
    truncated,
    fingerprint: stableHash(projectModel(document)),
  };
}

/**
 * The largest count in `[floor, ceiling]` that `fits`, or `floor` when none
 * does. `fits` must be monotone — true up to some count and false after it —
 * which a projection's length is, since keeping more items never shortens it.
 * A binary search, so narrowing a large model costs a few serialisations
 * rather than one per item dropped.
 */
function largestFitting(ceiling: number, floor: number, fits: (count: number) => boolean): number {
  let low = floor;
  let high = ceiling;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (fits(middle)) low = middle;
    else high = middle - 1;
  }
  return low;
}

/**
 * The document with only the named entities, and every declaration that
 * concerns them. An item is kept whole or not at all.
 */
export function narrowDocument(document: ModelDocument, keep: Set<string>): ModelDocument {
  const entities = document.entities.filter((entity) => keep.has(entity.name));
  const about = <T extends { entity?: string }>(items: T[] | undefined) => {
    const kept = (items ?? []).filter((item) => item.entity !== undefined && keep.has(item.entity));
    return kept.length ? kept : undefined;
  };
  const enumNames = new Set(
    entities.flatMap((entity) =>
      entity.attributes.flatMap((attribute) => (attribute.enum ? [attribute.enum] : []))
    )
  );
  const relationships = (document.relationships ?? []).filter(
    (relationship) => keep.has(relationship.from) && keep.has(relationship.to)
  );
  const categories = (document.categories ?? [])
    .map((category) => ({
      ...category,
      entities: category.entities?.filter((name) => keep.has(name)),
    }))
    .filter((category) => category.entities?.length);
  const enums = (document.enums ?? []).filter((declared) => enumNames.has(declared.name));

  return {
    eml: document.eml,
    ...(document.name ? { name: document.name } : {}),
    ...(document.version ? { version: document.version } : {}),
    ...(document.description ? { description: document.description } : {}),
    ...(enums.length ? { enums } : {}),
    ...(categories.length ? { categories } : {}),
    entities,
    ...(relationships.length ? { relationships } : {}),
    hooks: about(document.hooks),
    hookFlows: about(document.hookFlows),
    rbac: about(document.rbac),
    triggers: about(document.triggers),
    reports: about(document.reports),
    rules: about(document.rules),
    stateMachines: about(document.stateMachines),
    sagas: about(document.sagas),
  };
}
