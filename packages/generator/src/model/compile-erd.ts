/**
 * The ERD compiler: what a model's entities, relationships, indexes and enums
 * compile to.
 *
 * Reads `ErdRecords` (built from the model document by `documentToRecords`) and
 * produces the `Entity`, `Relationship` and `EntityEnum` values the templates
 * consume. `crates/appwithai-gen/src/model.rs` is the same compiler in Rust, and
 * the parity gate holds the two to identical output.
 */

import type { Entity, EntityAttribute, EntityEnum, Relationship } from "@appwithai/core/types";
import { snakeCase } from "@appwithai/core/utils";
import { getCardinalityKind, getDefaultType, getTypeMap } from "./language-maps";
import type {
  AttributeDeclaration,
  ErdRecords,
  FieldEnumBinding,
  FieldHelp,
  IndexDeclaration,
  RelationshipDeclaration,
} from "./records";

/** Type alias → canonical type, from the language definition. */
/**
 * Read on first use, not at module load: the browser bundle hands the language
 * definition over after its imports have evaluated, and a map read before that
 * would find no definition at all.
 */
let typeMap: Record<string, EntityAttribute["type"]> | undefined;
function typeFor(rawType: string): EntityAttribute["type"] {
  typeMap ??= getTypeMap();
  return typeMap[rawType] || getDefaultType();
}

/**
 * The aliases that mean something the canonical type does not.
 *
 * All five normalise to `string`, so by the time an attribute reaches the
 * dictionary the word the modeller wrote is the only thing that separates an
 * e-mail address from a password from a colour. Keeping it is what makes
 * `email contact_email` render as an e-mail control rather than being inferred
 * from the column's name — an inference that reads `boolean email_opt_out` as
 * an address.
 */
const SEMANTIC_TYPES = new Set(["email", "url", "phone", "password", "color"]);

/**
 * Collapse a column declared more than once into a single attribute.
 *
 * A duplicate is a mistake, and `EML112` says so — but it reached the generated
 * schema as a `CREATE TABLE` naming the column twice, which PostgreSQL refuses
 * outright, so the application never opened and the message named nothing in
 * the model. It reached the Application Dictionary as two `sys_column` rows for
 * one column as well, which is a form with the field on it twice.
 *
 * The first declaration keeps its place and its type: it is where the author
 * was describing this column, and the later line is the accident. The
 * *constraints* merge the other way — the strongest of them wins:
 *
 * - **required**, if any declaration is required. A mandatory `title` followed
 *   by an optional one must not quietly relax the column into a nullable one;
 *   the loosening shows up as missing data much later.
 * - **unique** and **FK** likewise, because each of them is a promise something
 *   downstream relies on — a lookup, an index, a key. (`PK` arrives as
 *   `unique`, and the entity's primary key is picked from the merged list.)
 *
 * The result is the column the author most plausibly meant, and never fewer
 * guarantees than they wrote down.
 */
function mergeDuplicateAttributes(attributes: EntityAttribute[]): EntityAttribute[] {
  const byName = new Map<string, EntityAttribute>();

  for (const attribute of attributes) {
    const existing = byName.get(attribute.name);
    if (!existing) {
      byName.set(attribute.name, { ...attribute });
      continue;
    }

    existing.required = existing.required || attribute.required;
    if (attribute.unique) existing.unique = true;
    if (attribute.isForeignKey) existing.isForeignKey = true;
    // Anything the first line did not say, a later one may still supply.
    if (existing.maxLength === undefined && attribute.maxLength !== undefined) {
      existing.maxLength = attribute.maxLength;
    }
    if (existing.semanticType === undefined && attribute.semanticType !== undefined) {
      existing.semanticType = attribute.semanticType;
    }
    if (existing.description === undefined && attribute.description !== undefined) {
      existing.description = attribute.description;
    }
  }

  return [...byName.values()];
}

/**
 * The attribute a column declaration compiles to.
 *
 * The type keeps any length suffix as written (`string(255)`), and it is looked
 * up in the language's type map *with* that suffix, so a length on an alias the
 * map does not carry resolves to the language's default type.
 */
export function attributeFromDeclaration(declaration: AttributeDeclaration): EntityAttribute {
  const rawType = declaration.type.toLowerCase();
  const baseType = rawType.replace(/\(\d+\)$/, "");
  const modifiers = declaration.modifiers.map((m) => m.toUpperCase());

  // A type the language does not define becomes its default type (EML115).
  const type = typeFor(rawType);

  const isPrimaryKey = modifiers.includes("PK");
  const isForeignKey = modifiers.includes("FK");
  const isUnique = modifiers.includes("UK") || modifiers.includes("UNIQUE");
  const isOptional = modifiers.includes("OPTIONAL") || modifiers.includes("NULL");

  // Extract max length if specified (e.g., string(255))
  const lengthMatch = declaration.type.match(/\((\d+)\)/);
  const maxLength = lengthMatch?.[1] ? parseInt(lengthMatch[1], 10) : undefined;

  return {
    name: declaration.name,
    type,
    required: !isOptional && !isPrimaryKey, // PK is auto-generated
    unique: isUnique || isPrimaryKey,
    maxLength,
    ...(isForeignKey && { isForeignKey: true }),
    ...(SEMANTIC_TYPES.has(baseType) && {
      semanticType: baseType as NonNullable<EntityAttribute["semanticType"]>,
    }),
  };
}

/**
 * The relationship a relationship declaration compiles to.
 *
 * The kind comes from the two ends through the language definition, so the
 * eight pairs `appwithai-language.json` lists are the only ones that compile.
 */
export function relationshipFromDeclaration(declaration: RelationshipDeclaration): Relationship {
  const cardinality = getCardinalityKind(declaration.sourceEnd, declaration.targetEnd);
  if (!cardinality) {
    throw new Error(
      `Relationship ${declaration.source} → ${declaration.target} pairs ${declaration.sourceEnd} with ${declaration.targetEnd}, which the language does not define`
    );
  }

  const label = declaration.label?.trim();
  const name = label
    ? normalizeRelationshipName(label)
    : `${declaration.source.toLowerCase()}_${declaration.target.toLowerCase()}`;

  return {
    name,
    sourceEntity: declaration.source,
    targetEntity: declaration.target,
    cardinality,
    foreignKey: generateForeignKey(declaration.source, declaration.target, cardinality),
  };
}

/**
 * Compile what an ERD declares into entities, relationships and enums.
 *
 * This is the only place ERD declarations become entities.
 */
export function compileErdRecords(records: ErdRecords): {
  entities: Entity[];
  relationships: Relationship[];
  enums: EntityEnum[];
} {
  const entities = records.entities.map((declaration) =>
    completeEntity(declaration.name, declaration.attributes.map(attributeFromDeclaration))
  );
  const relationships = records.relationships.map(relationshipFromDeclaration);

  /*
   * Repeats resolve one way: the first enum of a name is the one that counts,
   * and for entity annotations the last one wins while the entity keeps the
   * position of the first. Building the maps in declaration order gives both.
   */
  const declaredEnums = new Map<string, string[]>();
  for (const declared of records.enums) {
    if (!declaredEnums.has(declared.name)) declaredEnums.set(declared.name, declared.values);
  }
  const entityHelpText = new Map<string, string>();
  for (const { entity, help } of records.entityHelp) entityHelpText.set(entity, help);
  const entityIcons = new Map<string, string>();
  for (const { entity, icon } of records.entityIcons) entityIcons.set(entity, icon);
  const entityParents = new Map<string, string>();
  for (const { entity, parent } of records.entityParents) entityParents.set(entity, parent);

  attachIndexes(entities, records.indexes);
  attachHelp(entities, records.fieldHelp, entityHelpText);
  for (const [name, icon] of entityIcons) {
    const entity = entities.find((candidate) => candidate.name === name);
    if (entity) entity.icon = icon;
  }
  attachParents(entities, entityParents);
  const enums = attachEnums(entities, declaredEnums, records.enumBindings);

  return { entities, relationships, enums };
}

/**
 * Hang the help text on the entities and columns it names.
 *
 * Help naming something the model does not declare is dropped here rather
 * than invented: a column conjured out of a help line would be a column the
 * schema has no place for.
 */
function attachHelp(
  entities: Entity[],
  fieldHelp: FieldHelp[],
  entityHelp: Map<string, string>
): void {
  for (const [name, help] of entityHelp) {
    const entity = entities.find((candidate) => candidate.name === name);
    if (entity) entity.description = help;
  }
  for (const { entity: name, column, help } of fieldHelp) {
    const attribute = entities
      .find((candidate) => candidate.name === name)
      ?.attributes.find((candidate) => candidate.name === column);
    if (attribute) attribute.description = help;
  }
}

/**
 * Bind each child entity's `parent` to the column that links them.
 *
 * The link is the child's own foreign key to the parent — the modeller has
 * already drawn it, so asking for it again would be a second way to say one
 * thing. It is found by the ordinary rule, `<parent>_id`, and failing that by
 * any FK column whose name carries the parent's snake_case name.
 *
 * A parent that does not exist, or a child with no key back to it, is left
 * unlinked rather than guessed at: the checker reports both (EML147, EML148),
 * and a child tab keyed on the wrong column would silently show one invoice's
 * lines under another's.
 */
function attachParents(entities: Entity[], parents: Map<string, string>): void {
  for (const [childName, parentName] of parents) {
    const child = entities.find((candidate) => candidate.name === childName);
    const parent = entities.find((candidate) => candidate.name === parentName);
    if (!child || !parent) continue;

    /* The shared snake-caser, not a local one. Its own copy dropped the
       acronym rule, so `KYCRecord` came out `kycrecord`: a model declaring
       `kyc_record_id` — the column the migration actually emits — found no
       link, and the child silently kept its own window and gained no tab.
       Nothing reported it, because this is what the checker's own EML148 was
       comparing against. */
    const snake = snakeCase(parent.name);
    const link =
      child.attributes.find((a) => a.isForeignKey && a.name === `${snake}_id`) ??
      child.attributes.find((a) => a.isForeignKey && a.name.startsWith(`${snake}_`));
    if (!link) continue;

    child.parentEntity = parent.name;
    child.parentLinkColumn = link.name;
  }
}

/**
 * Bind each index declaration to the entity it names.
 *
 * A declaration naming an unknown entity, or a column the entity does not
 * have, is dropped rather than emitted: the migration would fail at run time
 * on a column that does not exist, and a migration that cannot apply is worse
 * than a missing index. The checker is what reports these to the author.
 */
function attachIndexes(entities: Entity[], declared: IndexDeclaration[]): void {
  for (const { entity: entityName, columns, unique } of declared) {
    const entity = entities.find((candidate) => candidate.name === entityName);
    if (!entity) continue;

    const known = new Set(entity.attributes.map((attribute) => attribute.name));
    if (!columns.every((column) => known.has(column))) continue;

    entity.indexes = entity.indexes ?? [];
    entity.indexes.push({ columns: [...columns], unique });
  }
}

/**
 * Bind columns to their enums and allocate a sys_reference_id per enum.
 *
 * Ids run from 1000 up in sorted name order, which keeps them stable for a
 * given model: the generated forms render any reference at or above 1000 as a
 * dropdown fed by /sys/ref-list, so this allocation is what turns a modelled
 * enum into a select rather than a free-text box.
 *
 * Only enums something actually binds to get an id. A declared-but-unused
 * enum is documentation, and seeding a reference nothing points at would put
 * a dropdown in the dictionary that no field can ever show.
 */
function attachEnums(
  entities: Entity[],
  declared: Map<string, string[]>,
  bindings: FieldEnumBinding[]
): EntityEnum[] {
  const used = new Set<string>();
  for (const binding of bindings) {
    if (!declared.has(binding.enumName)) continue;
    const entity = entities.find((candidate) => candidate.name === binding.entity);
    const attribute = entity?.attributes.find((candidate) => candidate.name === binding.column);
    if (attribute) used.add(binding.enumName);
  }

  const referenceIds = new Map<string, number>();
  let nextId = 1000;
  for (const name of [...used].sort()) {
    referenceIds.set(name, nextId++);
  }

  for (const binding of bindings) {
    const values = declared.get(binding.enumName);
    const referenceId = referenceIds.get(binding.enumName);
    if (!values || !referenceId) continue;
    const entity = entities.find((candidate) => candidate.name === binding.entity);
    const attribute = entity?.attributes.find((candidate) => candidate.name === binding.column);
    if (!attribute) continue;
    attribute.enumRef = binding.enumName;
    attribute.enumValues = [...values];
    attribute.enumReferenceId = referenceId;
  }

  return [...referenceIds.entries()].map(([name, referenceId]) => ({
    name,
    values: [...(declared.get(name) ?? [])],
    referenceId,
  }));
}

/**
 * Complete an entity: table name, the implicit `id` key, timestamps.
 *
 * The table name comes from the one snake-caser in core. This was a second
 * implementation once, and the two disagreed on a name that begins with an
 * acronym: `SIPInstruction` became `s_i_p_instruction` here and
 * `sip_instruction` everywhere that reads the same model, so the generated
 * application carried tables nothing else could name.
 */
function completeEntity(name: string, declaredAttributes: EntityAttribute[]): Entity {
  if (!name) {
    throw new Error("Entity name is required");
  }

  const attributes = mergeDuplicateAttributes(declaredAttributes);
  const tableName = snakeCase(name);

  // Check if id attribute exists, otherwise auto-add
  const hasIdAttribute = attributes.some(
    (a) => a.name === "id" || (a.unique && a.name.endsWith("_id"))
  );

  if (!hasIdAttribute) {
    attributes.unshift({
      name: "id",
      type: "string", // UUID
      required: true,
      unique: true,
    });
  }

  // Find primary key (look for PK modifier or 'id' field)
  const pkAttribute = attributes.find((a) => a.unique && a.name === "id");
  const primaryKey = pkAttribute?.name || "id";

  return {
    name,
    tableName,
    description: ``,
    attributes,
    primaryKey,
    timestamps: true,
  };
}

function normalizeRelationshipName(name: string): string {
  return name.trim().replace(/\s+/g, "_").toLowerCase();
}

/**
 * The foreign key column a relationship is carried by.
 *
 * The column lives on the *many* side and is named after the entity it points
 * at — the *one* side. This used to be derived from the target regardless of
 * direction, so `ClassOffering ||--o{ ClassSession` reported
 * `class_session_id`: a column named after the table it sits on, which is not
 * a foreign key name and is not what the model declares
 * (`class_offering_id`). Anything reading `Relationship.foreignKey` — the
 * `info` CLI, the model graph, the generated tests' reference harness — was
 * told the wrong column.
 *
 * A many-to-many has no such column at all; the target-derived name is kept
 * there as the least surprising placeholder. A `bus_` prefix is removed to
 * match the physical schema.
 */
function generateForeignKey(
  sourceEntity: string,
  targetEntity: string,
  cardinality: Relationship["cardinality"]
): string {
  const referenced = cardinality === "oneToMany" ? sourceEntity : targetEntity;
  const cleanName = snakeCase(referenced).replace(/^bus_/, "");
  return `${cleanName}_id`;
}
