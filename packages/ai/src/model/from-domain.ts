/**
 * A domain analysis as a model document.
 *
 * The analysis is what the language model is good at — which things exist in a
 * business, what they carry, how they relate — returned as structured JSON.
 * Writing that as a model is not a judgement call, so it is done here, in code,
 * the same way every time: the model the tool saves is never text a language
 * model wrote freehand.
 *
 * What is decided here is decided the way the generator reads it:
 *
 * - Entities are singular PascalCase; columns are snake_case.
 * - Every entity has an `id` primary key.
 * - A relationship's foreign key sits on the many side and is named
 *   `<parent>_id`, which is the name the generator resolves a lookup's table
 *   from. An analysis naming it `userId`, or not at all, still produces the
 *   column the application can use.
 * - A type is written as the analysis gave it, lower-cased. One the language
 *   does not have is not coerced to `string`: the checker reports it at its
 *   line, which is where the author (or the next revision) can fix it.
 */

import { pascalCase, snakeCase } from "@appwithai/core/utils";
import type {
  AttributeDocument,
  EntityDocument,
  ModelDocument,
  RelationshipDocument,
  RelationshipEnd,
} from "@appwithai/generator/model-yaml";
import type { DomainAnalysis } from "../types";

/** The two ends a cardinality names, from the relationship's source to its target. */
const ENDS: Record<string, [RelationshipEnd, RelationshipEnd]> = {
  oneToOne: ["exactly-one", "zero-or-one"],
  oneToMany: ["exactly-one", "zero-or-more"],
  manyToOne: ["zero-or-more", "exactly-one"],
  manyToMany: ["zero-or-more", "zero-or-more"],
};

/** A name as an entity name: singular PascalCase, letters and digits only. */
export function entityNameOf(name: string): string {
  const pascal = pascalCase(name.replace(/[^A-Za-z0-9]+/g, " ").trim());
  return /^[A-Za-z]/.test(pascal) ? pascal : `Entity${pascal}`;
}

/** A name as a column name: snake_case. */
export function columnNameOf(name: string): string {
  const snake = snakeCase(name.replace(/[^A-Za-z0-9_]+/g, "_")).replace(/_+/g, "_");
  return /^[A-Za-z_]/.test(snake) ? snake : `c_${snake}`;
}

/** Prose as the language's single-line text: whitespace collapsed, ends trimmed. */
function line(text: string | undefined): string | undefined {
  const collapsed = text?.replace(/\s+/g, " ").trim();
  return collapsed ? collapsed : undefined;
}

export interface DomainModel {
  document: ModelDocument;
  /** Relationships the analysis named between entities it did not declare. */
  dropped: string[];
}

export function domainToModelDocument(analysis: DomainAnalysis, name?: string): DomainModel {
  const entities = new Map<string, EntityDocument>();
  for (const candidate of analysis.entities) {
    const entityName = entityNameOf(candidate.name);
    if (entities.has(entityName)) continue;
    const attributes = new Map<string, AttributeDocument>();
    attributes.set("id", { name: "id", type: "uuid", pk: true });
    for (const suggested of candidate.suggestedAttributes) {
      const column = columnNameOf(suggested.name);
      if (attributes.has(column)) continue;
      attributes.set(column, {
        name: column,
        type: suggested.type.trim().toLowerCase() || "string",
        ...(suggested.unique ? { unique: true } : {}),
        ...(suggested.required ? {} : { optional: true }),
        ...(line(suggested.description) ? { help: line(suggested.description) } : {}),
      });
    }
    entities.set(entityName, {
      name: entityName,
      ...(line(candidate.description) ? { help: line(candidate.description) } : {}),
      attributes: [...attributes.values()],
    });
  }

  const relationships: RelationshipDocument[] = [];
  const dropped: string[] = [];
  for (const candidate of analysis.relationships) {
    const from = entityNameOf(candidate.source);
    const to = entityNameOf(candidate.target);
    const ends = ENDS[candidate.cardinality];
    if (!entities.has(from) || !entities.has(to) || !ends) {
      dropped.push(`${candidate.source} ${candidate.cardinality} ${candidate.target}`);
      continue;
    }
    relationships.push({
      from,
      fromCardinality: ends[0],
      to,
      toCardinality: ends[1],
      ...(line(candidate.name) ? { label: line(candidate.name) } : {}),
    });

    // The foreign key goes on the side holding many of the other, named for
    // the side holding one. Many-to-many needs a join entity the analysis
    // did not give, so it is left as a relationship for the author to resolve.
    const [parent, child] =
      candidate.cardinality === "manyToOne"
        ? [to, from]
        : candidate.cardinality === "manyToMany"
          ? [undefined, undefined]
          : [from, to];
    if (!parent || !child) continue;
    const childEntity = entities.get(child)!;
    const column = `${columnNameOf(parent)}_id`;
    const existing = childEntity.attributes.find((attribute) => attribute.name === column);
    if (existing) existing.fk = true;
    else childEntity.attributes.push({ name: column, type: "uuid", fk: true });
  }

  return {
    document: {
      eml: "1.0",
      ...(name ? { name } : {}),
      ...(line(analysis.summary) ? { description: line(analysis.summary) } : {}),
      entities: [...entities.values()],
      ...(relationships.length ? { relationships } : {}),
    },
    dropped,
  };
}
