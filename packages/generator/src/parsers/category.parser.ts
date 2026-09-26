/**
 * Entity category directive parser.
 *
 * Categories group business entities into named sections. The dashboard renders
 * one block per category (ordered by name) and the admin Application Dictionary
 * exposes a form to maintain them.
 *
 * Declared in an ERD / EML file with a `%%category` directive, which Mermaid
 * treats as a comment and ignores:
 *
 *   %%category name: Compound Management; description: Registration and structure; \
 *             icon: FlaskConical; color: #6366f1; entities: Compound, CompoundAlias
 *
 * Recognised keys — `name` is the only required one:
 *
 *   name         Display name. Also the dashboard's sort key.
 *   code         Stable short identifier. Derived from `name` when omitted.
 *   description  Sentence shown under the category header.
 *   icon         lucide-react icon name, e.g. FlaskConical.
 *   color        Accent colour, e.g. #6366f1.
 *   seq          Ordering hint for admin listings (the dashboard sorts by name).
 *   default      `true` marks the fallback category for uncategorised entities.
 *   entities     Comma-separated ERD entity names to place in this category.
 *
 * A directive may span several lines by ending each continued line with `\`.
 */

import type { CategoryDeclaration } from "../model/records";

/** A category declared in the model. */
export interface EntityCategory {
  name: string;
  code: string;
  description?: string;
  icon?: string;
  color?: string;
  seqNo: number;
  isDefault: boolean;
  /** ERD entity names assigned to this category. */
  entities: string[];
}

/** Derive a stable code from a display name. */
export function slugifyCategory(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/** Join lines ending in a backslash with the line that follows. */
function unfold(source: string): string[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const joined: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    const previous = joined[joined.length - 1];

    if (previous !== undefined && previous.endsWith("\\")) {
      // Continuation: drop the trailing backslash and strip a leading `%%`
      // so wrapped directive lines can stay visually commented.
      joined[joined.length - 1] =
        `${previous.slice(0, -1).trimEnd()} ${line.replace(/^%%\s*/, "")}`;
      continue;
    }
    joined.push(line);
  }

  return joined;
}

/** Split `a: 1; b: 2` into its key/value pairs, tolerating empty segments. */
function parseFields(body: string): Map<string, string> {
  const fields = new Map<string, string>();

  for (const segment of body.split(";")) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    const separator = trimmed.indexOf(":");
    if (separator <= 0) continue;

    const key = trimmed.slice(0, separator).trim().toLowerCase();
    const value = trimmed.slice(separator + 1).trim();
    if (key) fields.set(key, value);
  }

  return fields;
}

/**
 * Read every `%%category` directive from an ERD / EML document, uncompiled.
 *
 * One declaration per directive, in document order. A directive without a
 * `name` is not a declaration: there is nothing to render it as.
 */
export function readCategoryDirectives(source: string): CategoryDeclaration[] {
  const declarations: CategoryDeclaration[] = [];

  for (const line of unfold(source)) {
    const match = line.match(/^%%\s*category\b\s*(.*)$/i);
    if (!match) continue;

    const body = (match[1] ?? "").trim();
    if (!body) continue;

    const fields = parseFields(body);
    const name = fields.get("name")?.trim();
    if (!name) continue; // a category without a name cannot be rendered

    const code = fields.get("code")?.trim();
    const seq = Number(fields.get("seq"));
    const entities = (fields.get("entities") ?? "")
      .split(",")
      .map((entity) => entity.trim())
      .filter(Boolean);

    declarations.push({
      name,
      ...(code ? { code } : {}),
      ...(fields.get("description") ? { description: fields.get("description") } : {}),
      ...(fields.get("icon") ? { icon: fields.get("icon") } : {}),
      ...(fields.get("color") ? { color: fields.get("color") } : {}),
      ...(Number.isFinite(seq) ? { seq } : {}),
      isDefault: /^(true|yes|1)$/i.test(fields.get("default") ?? ""),
      entities,
    });
  }

  return declarations;
}

/**
 * Compile category declarations into categories.
 *
 * Returns categories in declaration order. Declarations sharing a code are
 * merged — the later declaration's fields win and its entity list is appended —
 * so a model split across files does not silently lose assignments.
 */
export function compileCategoryDeclarations(declarations: CategoryDeclaration[]): EntityCategory[] {
  const byCode = new Map<string, EntityCategory>();
  let order = 0;

  for (const declaration of declarations) {
    const code = declaration.code || slugifyCategory(declaration.name);
    if (!code) continue;

    const existing = byCode.get(code);

    const category: EntityCategory = {
      name: declaration.name,
      code,
      description: declaration.description || existing?.description,
      icon: declaration.icon || existing?.icon,
      color: declaration.color || existing?.color,
      seqNo: declaration.seq ?? existing?.seqNo ?? order,
      isDefault: declaration.isDefault || existing?.isDefault || false,
      entities: [...new Set([...(existing?.entities ?? []), ...declaration.entities])],
    };

    if (!existing) order += 1;
    byCode.set(code, category);
  }

  const categories = [...byCode.values()];

  // Exactly one default. Prefer an explicit declaration, else the first category.
  const defaults = categories.filter((category) => category.isDefault);
  if (defaults.length > 1) {
    for (const category of defaults.slice(1)) category.isDefault = false;
  }

  return categories;
}

/** Extract and compile every `%%category` directive from an ERD / EML document. */
export function parseCategories(source: string): EntityCategory[] {
  return compileCategoryDeclarations(readCategoryDirectives(source));
}

/**
 * Categories to seed for a model, guaranteeing the dictionary is never empty.
 *
 * When a model declares no categories we still create a single "General"
 * default and put every entity in it — the admin UI and dashboard then work out
 * of the box, and an administrator can split entities up from there.
 */
export function resolveCategories(source: string, entityNames: string[]): EntityCategory[] {
  return resolveCategoryDeclarations(readCategoryDirectives(source), entityNames);
}

/** `resolveCategories` over declarations already read, from either syntax. */
export function resolveCategoryDeclarations(
  declarations: CategoryDeclaration[],
  entityNames: string[]
): EntityCategory[] {
  const declared = compileCategoryDeclarations(declarations);

  if (declared.length === 0) {
    return [
      {
        name: "General",
        code: "general",
        description: "Default grouping for all business entities",
        icon: "LayoutGrid",
        seqNo: 0,
        isDefault: true,
        entities: [...entityNames],
      },
    ];
  }

  const assigned = new Set(declared.flatMap((category) => category.entities));
  const unassigned = entityNames.filter((name) => !assigned.has(name));

  if (unassigned.length > 0) {
    // Park anything the model did not place into the default category, adding
    // one if the model never marked a default.
    let fallback = declared.find((category) => category.isDefault);

    if (!fallback) {
      fallback = {
        name: "General",
        code: "general",
        description: "Entities not assigned to a specific category",
        icon: "LayoutGrid",
        seqNo: declared.length,
        isDefault: true,
        entities: [],
      };
      declared.push(fallback);
    }

    fallback.entities = [...new Set([...fallback.entities, ...unassigned])];
  } else if (!declared.some((category) => category.isDefault)) {
    declared[0]!.isDefault = true;
  }

  return declared;
}
