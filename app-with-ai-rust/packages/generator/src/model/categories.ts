/**
 * Categories: how the dashboard groups a model's entities.
 *
 * The dashboard renders one block per category, ordered by name, and the
 * Application Dictionary's admin screens maintain them. A model declares them
 * under `categories:`; `name` is the only required key, and `code` is derived
 * from it when omitted.
 */

import type { CategoryDeclaration } from "./records";

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

/**
 * Compile category declarations into categories.
 *
 * Returns categories in declaration order. Declarations sharing a code are
 * merged — the later declaration's fields win and its entity list is appended —
 * so two declarations of one category do not silently lose assignments.
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

/**
 * The categories to seed for a model, never none.
 *
 * A model that declares no categories still gets one "General" default holding
 * every entity, so the dashboard and the admin screens work from the start and
 * an administrator can split entities up from there. An entity no category
 * names goes to the default category, which is added if the model marked none.
 */
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
