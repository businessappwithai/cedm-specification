/**
 * Names in a CEDM model and the physical names they compile to.
 *
 * CEDM writes attributes in camelCase (`registrationStatus`); the generated
 * application's columns are snake_case (`registration_status`), because every
 * convention the generator relies on — `<entity>_id` foreign keys, the
 * person-role columns, the identifier columns — is a snake_case one. An
 * attribute whose column is not the snake_case of its name says so with
 * `column:`.
 */

/** `KYCRecord` → `kyc_record`, `registeredById` → `registered_by_id`: the generator's snake case. */
export function snakeCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}

/** `registered_by_id` → `registeredById`. Leaves a name with no underscores as it is. */
export function camelCase(name: string): string {
  return name.replace(/_+([a-zA-Z0-9])/g, (_match, letter: string) => letter.toUpperCase());
}

/** `registrationStatus` → `RegistrationStatus`. */
export function pascalCase(name: string): string {
  const camel = camelCase(name);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/** `SalesOrder` → `salesOrder`. */
export function lowerFirst(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

/** The table an entity's rows are stored in. */
export function tableOf(entity: string): string {
  return `bus_${snakeCase(entity)}`;
}

/**
 * Foreign-key column names that name a person by role rather than by entity.
 * Mirrors `foreignKeys.personRoleColumns` in `language/appwithai-language.json`.
 */
const PERSON_ROLE_COLUMNS = new Set([
  "assigned_to",
  "author_id",
  "lab_manager_id",
  "manager_id",
  "owner_id",
  "pi_id",
  "remediation_owner",
  "remediation_owner_id",
  "user_id",
]);

/** Prefixes naming the role a reference plays: `parent_sample_id` is a Sample. */
const QUALIFIER_PREFIXES = ["parent_"];

/**
 * The table a foreign-key column points at when nothing says otherwise — the
 * rule `resolve_ref_table_name` applies in the generated backend. A CEDM
 * reference names its target explicitly; the explicit target is written to
 * the dictionary only where it differs from this, so a model whose columns
 * follow the convention compiles to exactly what it always has.
 */
export function derivedReferenceTable(column: string): string | undefined {
  if (PERSON_ROLE_COLUMNS.has(column)) return "bus_user";
  const prefix = QUALIFIER_PREFIXES.find((candidate) => column.startsWith(candidate));
  const stripped = prefix ? column.slice(prefix.length) : column;
  if (PERSON_ROLE_COLUMNS.has(stripped)) return "bus_user";
  if (stripped.endsWith("_by_id") || stripped.endsWith("_by")) return "bus_user";
  if (stripped === "id" || !stripped.endsWith("_id")) return undefined;
  return `bus_${stripped.slice(0, -3)}`;
}
