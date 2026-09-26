/**
 * Mermaid ERD Parser
 *
 * Parses Mermaid ER diagram syntax and extracts entities and relationships.
 * Supports standard Mermaid ERD notation including:
 * - Entity definitions with attributes
 * - Relationship cardinalities (||--||, ||--o{, }o--||, }o--o{)
 * - Attribute types (string, integer, boolean, date, etc.)
 * - Attribute modifiers (PK, FK, UK, OPTIONAL)
 *
 * @example
 * ```mermaid
 * erDiagram
 *   Customer {
 *     string id PK
 *     string name
 *     string email UK
 *     date created_at
 *   }
 *   Order ||--o{ OrderItem : contains
 * ```
 */

import type { Entity, EntityAttribute, EntityEnum, Relationship } from "@appwithai/core/types";
import { snakeCase } from "@appwithai/core/utils";
import {
  type AttributeDeclaration,
  type EnumDeclaration,
  type ErdRecords,
  endFromLeftGlyph,
  endFromRightGlyph,
  type FieldEnumBinding,
  type FieldHelp,
  type IndexDeclaration,
  type RelationshipDeclaration,
  relationshipOperator,
} from "../model/records";
import { getCardinalityKind, getDefaultType, getTypeMap } from "./language-maps";

// Type mapping from Mermaid types to our standard types.
// Sourced from language/appwithai-language.json at runtime (with a built-in
// fallback) so the parser stays in lockstep with the EML language definition.
const TYPE_MAP: Record<string, EntityAttribute["type"]> = getTypeMap();

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
 * outright, so the application never opened and the message named no model
 * line. It reached the Application Dictionary as two `sys_column` rows for one
 * column as well, which is a form with the field on it twice.
 *
 * The first declaration keeps its place and its type: it is where the author
 * was describing this column, and the later line is the accident. The
 * *constraints* merge the other way — the strongest of them wins:
 *
 * - **required**, if any declaration is required. `string title` followed by
 *   `string title OPTIONAL` must not quietly relax a mandatory column into a
 *   nullable one; the loosening is invisible in the diagram and shows up as
 *   missing data much later.
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
 * Format: `type name [modifiers]` — `string name`, `integer id PK`,
 * `string email UK`, `decimal price OPTIONAL`, `string customer_id FK`. The
 * type token keeps any length suffix as written (`string(255)`), and it is
 * looked up in the language's type map *with* that suffix, so an alias the map
 * does not carry falls back to the language default exactly as it always has.
 */
export function attributeFromDeclaration(declaration: AttributeDeclaration): EntityAttribute {
  const rawType = declaration.type.toLowerCase();
  const baseType = rawType.replace(/\(\d+\)$/, "");
  const modifiers = declaration.modifiers.map((m) => m.toUpperCase());

  // Map type to standard type (unknown aliases fall back to the language default)
  const type = TYPE_MAP[rawType] || getDefaultType();

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
 * The operator is rebuilt from the two ends and resolved through the language
 * definition, so the eight operators `appwithai-language.json` lists are the
 * only ones that compile, whichever syntax the model was written in.
 */
export function relationshipFromDeclaration(declaration: RelationshipDeclaration): Relationship {
  const operator = relationshipOperator(declaration);
  const cardinality = getCardinalityKind(operator);
  if (!cardinality) {
    throw new Error(
      `Relationship ${declaration.source} ${operator} ${declaration.target} uses an operator the language does not define`
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
 * This is the only place ERD declarations become entities: the EML reader and
 * the YAML model reader both produce `ErdRecords`, and both end here.
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
   * Repeats resolve the way they always have: the first `%%enum` of a name is
   * the one that counts, and for entity annotations the last one wins while the
   * entity keeps the position of the first. Building the maps in declaration
   * order is what gives both.
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
 * A directive naming something the document does not declare is dropped
 * here rather than invented: the checker reports it as EML141 or EML142, and
 * a column conjured out of a help line would be a column the schema has no
 * place for.
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
 * Bind each `%%entity <Child> parent: <Parent>` to the column that links them.
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
       Nothing reported it, because the parser is what the checker's own
       EML148 was comparing against. */
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

/** An ERD with nothing declared — the starting point every reader fills in. */
export function emptyErdRecords(): ErdRecords {
  return {
    entities: [],
    relationships: [],
    indexes: [],
    enums: [],
    enumBindings: [],
    fieldHelp: [],
    entityHelp: [],
    entityIcons: [],
    entityParents: [],
  };
}

/** `Source ||--o{ Target : "label"` — captures entity, left glyphs, right glyphs, entity, label. */
const RELATIONSHIP_LINE =
  /^([a-zA-Z_][a-zA-Z0-9_]*)\s+(\|[|o]|\}[o|])--(o[|{]|\|[|{])\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*:\s*"?([^"]*)"?)?$/;

export class MermaidParser {
  /**
   * Parse Mermaid ERD syntax
   * @param mermaidSyntax - Raw Mermaid ERD content
   * @returns Parsed entities and relationships
   */
  parse(mermaidSyntax: string): {
    entities: Entity[];
    relationships: Relationship[];
    enums: EntityEnum[];
  } {
    return compileErdRecords(this.read(mermaidSyntax));
  }

  /**
   * Read what an EML document's ERD layer declares, without compiling it.
   *
   * `%%index`, `%%enum`, `%%field` and `%%entity` name what they annotate, so
   * they are collected as they appear and resolved by the compiler at the end:
   * the language does not require a directive to follow the block it refers to.
   */
  read(mermaidSyntax: string): ErdRecords {
    const records = emptyErdRecords();

    const lines = mermaidSyntax.replace(/\r\n/g, "\n").split("\n");

    let currentEntity: string | null = null;
    let currentAttributes: AttributeDeclaration[] = [];
    let inEntityBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      const trimmed = line.trim();

      // Skip empty lines, comments, and the erDiagram declaration. Directives
      // are read before the blanket comment skip that would otherwise swallow them.
      if (!trimmed || trimmed === "erDiagram") {
        continue;
      }
      if (trimmed.startsWith("%%")) {
        this.readDirective(trimmed, records);
        continue;
      }

      // Parse relationship (can appear before or after entity definitions)
      const relationship = this.readRelationship(trimmed);
      if (relationship) {
        records.relationships.push(relationship);
        continue;
      }

      // Parse entity start: "EntityName {", "entity_name {", or "bus_entity {"
      const entityStartMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s*\{$/);
      if (entityStartMatch?.[1]) {
        // An unclosed entity is kept only if it declared something.
        if (currentEntity && currentAttributes.length > 0) {
          records.entities.push({ name: currentEntity, attributes: currentAttributes });
        }
        currentEntity = entityStartMatch[1];
        currentAttributes = [];
        inEntityBlock = true;
        continue;
      }

      if (trimmed === "}") {
        if (currentEntity) {
          records.entities.push({ name: currentEntity, attributes: currentAttributes });
          currentEntity = null;
          currentAttributes = [];
        }
        inEntityBlock = false;
        continue;
      }

      if (inEntityBlock && currentEntity) {
        const attribute = this.readAttribute(trimmed);
        if (attribute) currentAttributes.push(attribute);
      }
    }

    // Handle entity without closing brace (edge case)
    if (currentEntity && currentAttributes.length > 0) {
      records.entities.push({ name: currentEntity, attributes: currentAttributes });
    }

    return records;
  }

  /** Read one `%%` line into whichever ERD directive it is, if any. */
  private readDirective(line: string, records: ErdRecords): void {
    const index = this.parseIndexDirective(line);
    if (index) records.indexes.push(index);
    const declaredEnum = this.parseEnumDirective(line);
    if (declaredEnum) records.enums.push(declaredEnum);
    const binding = this.parseFieldEnumDirective(line);
    if (binding) records.enumBindings.push(binding);
    const fieldHelp = this.parseFieldHelpDirective(line);
    if (fieldHelp) records.fieldHelp.push(fieldHelp);
    const entityHelp = this.parseEntityHelpDirective(line);
    if (entityHelp) records.entityHelp.push(entityHelp);
    const entityParent = this.parseEntityParentDirective(line);
    if (entityParent) records.entityParents.push(entityParent);
    const entityIcon = this.parseEntityIconDirective(line);
    if (entityIcon) records.entityIcons.push(entityIcon);
  }

  /**
   * `%%index Entity(col)` or `%%index Entity(a, b) unique`.
   *
   * Returns null for any other `%%` line, which is how the caller tells a
   * directive from a comment.
   */
  private parseIndexDirective(line: string): IndexDeclaration | null {
    const match = line.match(/^%%index\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(unique)?\s*$/i);
    if (!match?.[1]) return null;

    const columns = (match[2] ?? "")
      .split(",")
      .map((column) => column.trim())
      .filter(Boolean);
    if (columns.length === 0) return null;

    return { entity: match[1], columns, unique: Boolean(match[3]) };
  }

  /** `%%enum OrderStatus: draft, submitted, approved` */
  private parseEnumDirective(line: string): EnumDeclaration | null {
    const match = line.match(/^%%enum\s+([A-Za-z_]\w*)\s*:\s*(.+)$/);
    if (!match?.[1] || !match[2]) return null;
    const values = match[2]
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    return values.length > 0 ? { name: match[1], values } : null;
  }

  /** `%%field Order.status enum: OrderStatus` — the binding that makes a list. */
  private parseFieldEnumDirective(line: string): FieldEnumBinding | null {
    const match = line.match(
      /^%%field\s+([A-Za-z_]\w*)\.([A-Za-z_]\w*)\s+enum\s*:\s*([A-Za-z_]\w*)\s*$/
    );
    if (!match?.[1] || !match[2] || !match[3]) return null;
    return { entity: match[1], column: match[2], enumName: match[3] };
  }

  /**
   * `%%field Order.total_amount help: What the customer is charged, before tax.`
   *
   * The text runs to the end of the line, punctuation and all: it is prose for
   * a person filling in the form, not an identifier. It becomes
   * sys_column.description, which the generated form renders under the control.
   */
  private parseFieldHelpDirective(line: string): FieldHelp | null {
    const match = line.match(/^%%field\s+([A-Za-z_]\w*)\.([A-Za-z_]\w*)\s+help\s*:\s*(.+)$/);
    if (!match?.[1] || !match[2] || !match[3]) return null;
    const help = match[3].trim();
    return help ? { entity: match[1], column: match[2], help } : null;
  }

  /** `%%entity Order help: One purchase, from raising to closing.` */
  private parseEntityHelpDirective(line: string): { entity: string; help: string } | null {
    const match = line.match(/^%%entity\s+([A-Za-z_]\w*)\s+(?:help|description)\s*:\s*(.+)$/);
    if (!match?.[1] || !match[2]) return null;
    const help = match[2].trim();
    return help ? { entity: match[1], help } : null;
  }

  /**
   * `%%entity Patient icon: stethoscope` — what the entity is drawn with.
   *
   * The value is taken as written and not validated against lucide's catalogue,
   * which this repository does not carry: an unknown name renders a placeholder
   * rather than failing a build. Anchored at `^%%` like every other directive
   * parser, so prose mentioning an icon stays prose.
   */
  private parseEntityIconDirective(line: string): { entity: string; icon: string } | null {
    const match = line.match(/^%%entity\s+([A-Za-z_]\w*)\s+icon\s*:\s*([\w.-]+)\s*$/);
    if (!match?.[1] || !match[2]) return null;
    return { entity: match[1], icon: match[2] };
  }

  /**
   * `%%entity InvoiceLine parent: Invoice` — a line item, not a reference.
   *
   * The ERD alone cannot tell the two apart. `InvoiceLine.invoice_id` and
   * `Invoice.patient_id` are both a foreign key with a relationship behind it,
   * and nothing in Mermaid says that a line has no life of its own while a
   * patient plainly does. This key says it, and the Application Dictionary
   * turns it into the arrangement the distinction was always about: the child
   * becomes a tab *inside* the parent's window rather than a window of its own,
   * linked on the foreign key it already declared.
   */
  private parseEntityParentDirective(line: string): { entity: string; parent: string } | null {
    const match = line.match(/^%%entity\s+([A-Za-z_]\w*)\s+parent\s*:\s*([A-Za-z_]\w*)\s*$/);
    if (!match?.[1] || !match[2]) return null;
    return { entity: match[1], parent: match[2] };
  }

  /**
   * Read a relationship line.
   *
   * Only the eight operators the language defines are relationships; any other
   * glyph pair falls through to the rest of the line handling, as it always has.
   *
   * Left side glyphs:  ||  |o  }o  }|
   * Right side glyphs: ||  o|  o{  |{
   */
  private readRelationship(line: string): RelationshipDeclaration | null {
    const match = line.match(RELATIONSHIP_LINE);
    if (!match?.[1] || !match[4]) return null;

    const [, source, left, right, target, rawLabel] = match;
    if (!getCardinalityKind(`${left}--${right}`)) return null;
    const sourceEnd = endFromLeftGlyph(left!);
    const targetEnd = endFromRightGlyph(right!);
    if (!sourceEnd || !targetEnd) return null;

    const label = rawLabel?.trim();
    return {
      source: source!,
      target: target!,
      sourceEnd,
      targetEnd,
      ...(label ? { label } : {}),
    };
  }

  /** Read a column declaration: `type name [modifiers]`. */
  private readAttribute(line: string): AttributeDeclaration | null {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) return null;
    const type = parts[0] ?? "";
    const name = parts[1];
    if (!name) return null;
    return { type, name, modifiers: parts.slice(2) };
  }
}

export default MermaidParser;
