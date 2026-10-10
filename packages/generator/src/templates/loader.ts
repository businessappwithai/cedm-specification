import { ReferenceType } from "@appwithai/core/types";
import {
  addBusPrefix,
  addSysPrefix,
  camelCase,
  generateForeignKeyName,
  generatePrimaryKeyName,
  isBusinessTable,
  isSystemTable,
  kebabCase,
  pascalCase,
  plural,
  removeTablePrefix,
  singular,
  snakeCase,
  tableNameToControllerName,
  tableNameToDtoName,
  tableNameToEntityName,
  tableNameToEntitySetName,
  tableNameToModelName,
  tableNameToModuleName,
  tableNameToRoutePath,
  tableNameToServiceName,
} from "@appwithai/core/utils";
import { execSync } from "child_process";
import { existsSync, promises as fs } from "fs";
import Handlebars from "handlebars";
import path from "path";

function resolveOsUser(): string {
  if (process.env.PGUSER) return process.env.PGUSER;
  if (process.env.USER) return process.env.USER;
  if (process.env.LOGNAME) return process.env.LOGNAME;
  try {
    return execSync("whoami").toString().trim() || "postgres";
  } catch {
    return "postgres";
  }
}

// The Node "pg" driver, unlike libpq/psql, never auto-discovers a Unix socket
// for a bare "localhost" host — it always dials TCP, which many local
// Postgres installs (e.g. stock Debian/Ubuntu) require a password for. Find
// the socket directory the generating machine actually uses so the
// generated DATABASE_URL connects passwordlessly out of the box wherever
// possible, and degrade to a plain TCP URL (no `host=` param) when no local
// socket is found.
function resolvePgSocketDir(): string {
  const port = process.env.PGPORT || "5432";
  const candidates = [process.env.PGHOST, "/var/run/postgresql", "/tmp"].filter(
    (candidate): candidate is string => !!candidate && candidate.startsWith("/")
  );
  for (const dir of candidates) {
    if (existsSync(path.join(dir, `.s.PGSQL.${port}`))) {
      return dir;
    }
  }
  return "";
}

/**
 * `sys_reference_id` → PostgreSQL column type.
 *
 * Shared by the `sqlType` (NestJS/Kysely migrations) and `sqlTypeRust` (Loco
 * migrations) helpers on purpose: the two stacks must emit byte-identical DDL
 * so a database created by either backend can be served by the other. Keeping
 * one map makes that a structural guarantee rather than a convention someone
 * has to remember. See docs/MIGRATION-LOCO-ASTRYX.md §6.14.
 */
function sqlTypeFor(referenceId: number, fieldLength?: number): string {
  // Handlebars passes its options object as the last argument, so a non-number
  // `fieldLength` means "no explicit length was given".
  const length = typeof fieldLength === "number" ? fieldLength : undefined;
  const mapping: Record<number, string> = {
    [ReferenceType.STRING]: length ? `varchar(${length})` : "varchar(255)",
    [ReferenceType.INTEGER]: "integer",
    [ReferenceType.AMOUNT]: "decimal(18,6)",
    [ReferenceType.ID]: "uuid",
    [ReferenceType.TEXT]: "text",
    [ReferenceType.DATE]: "date",
    [ReferenceType.DATETIME]: "timestamp",
    [ReferenceType.LIST]: "varchar(40)",
    [ReferenceType.TABLE]: "uuid",
    [ReferenceType.TABLE_DIRECT]: "uuid",
    [ReferenceType.YES_NO]: "boolean",
    [ReferenceType.JSON]: "jsonb",
    [ReferenceType.URL]: "varchar(500)",
    [ReferenceType.IMAGE]: "varchar(500)",
    [ReferenceType.FILE]: "varchar(500)",
    [ReferenceType.EMAIL]: "varchar(255)",
    [ReferenceType.PHONE]: "varchar(40)",
    [ReferenceType.PASSWORD]: "varchar(255)",
    [ReferenceType.COLOR]: "varchar(20)",
  };
  return mapping[referenceId] || "varchar(255)";
}


/** Rust's strict and reserved keywords (2021 edition) that a raw identifier can stand for. */
const RUST_KEYWORDS: ReadonlySet<string> = new Set([
  "as", "async", "await", "break", "const", "continue", "dyn", "else", "enum", "extern", "false", "fn", "for", "if", "impl", "in", "let", "loop", "match", "mod", "move", "mut", "pub", "ref", "return", "static", "struct", "trait", "true", "try", "type", "unsafe", "use", "where", "while", "abstract", "become", "box", "do", "final", "macro", "override", "priv", "typeof", "unsized", "virtual", "yield", "gen",
]);

export class TemplateLoader {
  private cache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(private templateDir: string) {
    this.registerHelpers();
  }

  async load(templatePath: string): Promise<HandlebarsTemplateDelegate> {
    if (this.cache.has(templatePath)) {
      return this.cache.get(templatePath) as HandlebarsTemplateDelegate;
    }

    const fullPath = path.join(this.templateDir, templatePath);
    const source = await fs.readFile(fullPath, "utf-8");
    const template = Handlebars.compile(source, { noEscape: true });

    this.cache.set(templatePath, template);
    return template;
  }

  clearCache(): void {
    this.cache.clear();
  }

  private registerHelpers(): void {
    // ========================================================================
    // String Case Helpers
    // ========================================================================
    Handlebars.registerHelper("pascalCase", pascalCase);
    Handlebars.registerHelper("camelCase", camelCase);
    Handlebars.registerHelper("snakeCase", snakeCase);
    Handlebars.registerHelper("kebabCase", kebabCase);
    Handlebars.registerHelper("plural", plural);
    Handlebars.registerHelper("singular", singular);
    Handlebars.registerHelper("upperCase", (str: string) => str?.toUpperCase() || "");
    Handlebars.registerHelper("lowerCase", (str: string) => str?.toLowerCase() || "");
    Handlebars.registerHelper("capitalize", (str: string) =>
      str ? str.charAt(0).toUpperCase() + str.slice(1) : ""
    );

    // ========================================================================
    // Comparison Helpers
    // ========================================================================
    Handlebars.registerHelper("eq", (a, b) => a === b);
    Handlebars.registerHelper("ne", (a, b) => a !== b);
    Handlebars.registerHelper("lt", (a, b) => a < b);
    Handlebars.registerHelper("lte", (a, b) => a <= b);
    Handlebars.registerHelper("gt", (a, b) => a > b);
    Handlebars.registerHelper("gte", (a, b) => a >= b);
    Handlebars.registerHelper("and", (...args) => args.slice(0, -1).every(Boolean));
    Handlebars.registerHelper("or", (...args) => args.slice(0, -1).some(Boolean));
    Handlebars.registerHelper("not", (value) => !value);

    // ========================================================================
    // Iteration Helpers
    // ========================================================================
    // Like {{#each}} but iterates only over the first N items of the array
    Handlebars.registerHelper(
      "eachFirst",
      function (this: unknown, items: unknown, count: number, options: Handlebars.HelperOptions) {
        if (!Array.isArray(items) || items.length === 0) {
          return options.inverse(this);
        }
        const slice = items.slice(0, count);
        return slice
          .map((item, index) =>
            options.fn(item, {
              data: { index, first: index === 0, last: index === slice.length - 1 },
            })
          )
          .join("");
      }
    );

    // ========================================================================
    // Table Naming Helpers (sys_ and bus_ prefixes)
    // ========================================================================
    Handlebars.registerHelper("addBusPrefix", addBusPrefix);
    Handlebars.registerHelper("addSysPrefix", addSysPrefix);
    Handlebars.registerHelper("removeTablePrefix", removeTablePrefix);
    Handlebars.registerHelper("isSystemTable", isSystemTable);
    Handlebars.registerHelper("isBusinessTable", isBusinessTable);
    Handlebars.registerHelper("tableToEntity", tableNameToEntityName);
    Handlebars.registerHelper("tableToModel", tableNameToModelName);
    Handlebars.registerHelper("tableToController", tableNameToControllerName);
    Handlebars.registerHelper("tableToService", tableNameToServiceName);
    Handlebars.registerHelper("tableToModule", tableNameToModuleName);
    Handlebars.registerHelper("tableToDto", tableNameToDtoName);
    Handlebars.registerHelper("tableToRoute", tableNameToRoutePath);
    Handlebars.registerHelper("tableToEntitySet", tableNameToEntitySetName);
    Handlebars.registerHelper("primaryKeyName", generatePrimaryKeyName);
    Handlebars.registerHelper("foreignKeyName", generateForeignKeyName);

    // ========================================================================
    // Random Sequence Generator (for initial field ordering)
    // ========================================================================
    Handlebars.registerHelper(
      "randomSeq",
      (index: number) => (index + 1) * 10 + Math.floor(Math.random() * 5)
    );

    // ========================================================================
    // TypeScript Type Mapping
    // ========================================================================
    Handlebars.registerHelper("tsType", (referenceId: number) => {
      const mapping: Record<number, string> = {
        [ReferenceType.STRING]: "string",
        [ReferenceType.INTEGER]: "number",
        [ReferenceType.AMOUNT]: "number",
        [ReferenceType.ID]: "string",
        [ReferenceType.TEXT]: "string",
        [ReferenceType.DATE]: "Date",
        [ReferenceType.DATETIME]: "Date",
        [ReferenceType.LIST]: "string",
        [ReferenceType.TABLE]: "string",
        [ReferenceType.TABLE_DIRECT]: "string",
        [ReferenceType.YES_NO]: "boolean",
        [ReferenceType.JSON]: "Record<string, unknown>",
        [ReferenceType.URL]: "string",
        [ReferenceType.IMAGE]: "string",
        [ReferenceType.FILE]: "string",
        [ReferenceType.EMAIL]: "string",
        [ReferenceType.PHONE]: "string",
        [ReferenceType.PASSWORD]: "string",
        [ReferenceType.COLOR]: "string",
      };
      return mapping[referenceId] || "string";
    });

    // TypeScript type mapping from string type names (for templates using string types)
    Handlebars.registerHelper("tsTypeFromString", (type: string) => {
      const mapping: Record<string, string> = {
        string: "string",
        varchar: "string",
        text: "string",
        integer: "number",
        int: "number",
        bigint: "number",
        decimal: "number",
        float: "number",
        number: "number",
        boolean: "boolean",
        bool: "boolean",
        date: "Date",
        datetime: "Date",
        timestamp: "Date",
        json: "Record<string, unknown>",
        jsonb: "Record<string, unknown>",
        uuid: "string",
        id: "string",
        email: "string",
        url: "string",
        password: "string",
        phone: "string",
        color: "string",
        file: "string",
        image: "string",
        amount: "number",
      };
      return mapping[type?.toLowerCase()] || "unknown";
    });

    // ========================================================================
    // Zod Schema Type Mapping
    // ========================================================================
    Handlebars.registerHelper("zodType", (referenceId: number, isMandatory: boolean = false) => {
      const mapping: Record<number, string> = {
        [ReferenceType.STRING]: "z.string()",
        [ReferenceType.INTEGER]: "z.number().int()",
        [ReferenceType.AMOUNT]: "z.number()",
        [ReferenceType.ID]: "z.string().uuid()",
        [ReferenceType.TEXT]: "z.string()",
        [ReferenceType.DATE]: "z.coerce.date()",
        [ReferenceType.DATETIME]: "z.coerce.date()",
        [ReferenceType.LIST]: "z.string()",
        [ReferenceType.TABLE]: "z.string().uuid()",
        [ReferenceType.TABLE_DIRECT]: "z.string().uuid()",
        [ReferenceType.YES_NO]: "z.boolean()",
        [ReferenceType.JSON]: "z.record(z.unknown())",
        [ReferenceType.URL]: "z.string().url()",
        [ReferenceType.IMAGE]: "z.string()",
        [ReferenceType.FILE]: "z.string()",
        [ReferenceType.EMAIL]: "z.string().email()",
        [ReferenceType.PHONE]: "z.string()",
        [ReferenceType.PASSWORD]: "z.string().min(8)",
        [ReferenceType.COLOR]: "z.string()",
      };
      const baseType = mapping[referenceId] || "z.string()";
      return isMandatory ? baseType : `${baseType}.optional()`;
    });

    // ========================================================================
    // SQL Type Mapping (for migrations)
    // ========================================================================
    Handlebars.registerHelper("sqlType", sqlTypeFor);

    // ========================================================================
    // Kysely Type Mapping
    // ========================================================================
    Handlebars.registerHelper("kyselyType", (referenceId: number, fieldLength?: number) => {
      // Handlebars passes options object as last arg, so check if fieldLength is actually a number
      const length = typeof fieldLength === "number" ? fieldLength : undefined;
      const mapping: Record<number, string> = {
        [ReferenceType.STRING]: length ? `varchar(${length})` : "varchar(255)",
        [ReferenceType.INTEGER]: "integer",
        [ReferenceType.AMOUNT]: "decimal(18, 6)",
        [ReferenceType.ID]: "uuid",
        [ReferenceType.TEXT]: "text",
        [ReferenceType.DATE]: "date",
        [ReferenceType.DATETIME]: "timestamp",
        [ReferenceType.LIST]: "varchar(40)",
        [ReferenceType.TABLE]: "uuid",
        [ReferenceType.TABLE_DIRECT]: "uuid",
        [ReferenceType.YES_NO]: "boolean",
        [ReferenceType.JSON]: "jsonb",
        [ReferenceType.URL]: "varchar(500)",
        [ReferenceType.IMAGE]: "varchar(500)",
        [ReferenceType.FILE]: "varchar(500)",
        [ReferenceType.EMAIL]: "varchar(255)",
        [ReferenceType.PHONE]: "varchar(40)",
        [ReferenceType.PASSWORD]: "varchar(255)",
        [ReferenceType.COLOR]: "varchar(20)",
      };
      return mapping[referenceId] || "varchar(255)";
    });

    // ========================================================================
    // TanStack Helpers (TanStack Start)
    // ========================================================================
    Handlebars.registerHelper("tanstackQueryKey", (entity: string) => `['${entity}', 'list']`);
    Handlebars.registerHelper("tanstackDetailKey", (entity: string, id?: string) => {
      // Handlebars passes options object as last arg, check if id is actually a string
      const idVar = typeof id === "string" ? id : "id";
      return `['${entity}', 'detail', ${idVar}]`;
    });
    Handlebars.registerHelper(
      "tanstackMutationKey",
      (entity: string, action: string) => `['${entity}', '${action}']`
    );

    // TanStack Table column type helper
    Handlebars.registerHelper("tanstackColumnType", (referenceId: number) => {
      const mapping: Record<number, string> = {
        [ReferenceType.STRING]: "text",
        [ReferenceType.INTEGER]: "number",
        [ReferenceType.AMOUNT]: "number",
        [ReferenceType.DATE]: "date",
        [ReferenceType.DATETIME]: "datetime",
        [ReferenceType.YES_NO]: "boolean",
        [ReferenceType.EMAIL]: "text",
      };
      return mapping[referenceId] || "text";
    });

    // TanStack Form field type helper
    Handlebars.registerHelper("tanstackFieldType", (referenceId: number) => {
      const mapping: Record<number, string> = {
        [ReferenceType.STRING]: "input",
        [ReferenceType.INTEGER]: "number",
        [ReferenceType.AMOUNT]: "number",
        [ReferenceType.TEXT]: "textarea",
        [ReferenceType.DATE]: "date",
        [ReferenceType.DATETIME]: "datetime-local",
        [ReferenceType.YES_NO]: "checkbox",
        [ReferenceType.LIST]: "select",
        [ReferenceType.TABLE]: "select",
        [ReferenceType.EMAIL]: "email",
        [ReferenceType.URL]: "url",
        [ReferenceType.PASSWORD]: "password",
        [ReferenceType.COLOR]: "color",
      };
      return mapping[referenceId] || "input";
    });

    // ========================================================================
    // Backend helpers (retained: the templates still use them for DTO shapes)
    // ========================================================================
    Handlebars.registerHelper(
      "nestControllerName",
      (entity: string) => `${pascalCase(entity)}Controller`
    );
    Handlebars.registerHelper(
      "nestServiceName",
      (entity: string) => `${pascalCase(entity)}Service`
    );
    Handlebars.registerHelper("nestModuleName", (entity: string) => `${pascalCase(entity)}Module`);
    Handlebars.registerHelper(
      "nestDtoName",
      (entity: string, prefix: string = "") => `${prefix}${pascalCase(entity)}Dto`
    );
    Handlebars.registerHelper("nestGuardName", (name: string) => `${pascalCase(name)}Guard`);
    Handlebars.registerHelper("nestDecoratorName", (name: string) => `${pascalCase(name)}`);

    // ========================================================================
    // Shadcn-surface helpers (the Astryx adapters keep that prop surface)
    // ========================================================================
    Handlebars.registerHelper("shadcnInputType", (referenceId: number) => {
      const mapping: Record<number, string> = {
        [ReferenceType.STRING]: "text",
        [ReferenceType.INTEGER]: "number",
        [ReferenceType.AMOUNT]: "number",
        [ReferenceType.EMAIL]: "email",
        [ReferenceType.URL]: "url",
        [ReferenceType.PASSWORD]: "password",
        [ReferenceType.PHONE]: "tel",
        [ReferenceType.COLOR]: "color",
      };
      return mapping[referenceId] || "text";
    });

    Handlebars.registerHelper("shadcnComponent", (referenceId: number) => {
      const mapping: Record<number, string> = {
        [ReferenceType.STRING]: "Input",
        [ReferenceType.INTEGER]: "Input",
        [ReferenceType.AMOUNT]: "Input",
        [ReferenceType.TEXT]: "Textarea",
        [ReferenceType.DATE]: "DatePicker",
        [ReferenceType.DATETIME]: "DatePicker",
        [ReferenceType.YES_NO]: "Checkbox",
        [ReferenceType.LIST]: "Select",
        [ReferenceType.TABLE]: "Select",
      };
      return mapping[referenceId] || "Input";
    });

    // ========================================================================
    // Rust Helpers (tanstack-astryx-loco: Loco.rs backend)
    // ========================================================================

    /**
     * `sys_reference_id` → Rust type. Nullable columns are wrapped in `Option`,
     * matching the `is_mandatory` flag carried on `sys_column`.
     */
    Handlebars.registerHelper("rustType", (referenceId: number, isMandatory?: boolean) => {
      const mapping: Record<number, string> = {
        [ReferenceType.STRING]: "String",
        [ReferenceType.INTEGER]: "i32",
        [ReferenceType.AMOUNT]: "Decimal",
        [ReferenceType.ID]: "Uuid",
        [ReferenceType.TEXT]: "String",
        [ReferenceType.DATE]: "NaiveDate",
        [ReferenceType.DATETIME]: "DateTime<Utc>",
        [ReferenceType.LIST]: "String",
        [ReferenceType.TABLE]: "Uuid",
        [ReferenceType.TABLE_DIRECT]: "Uuid",
        [ReferenceType.YES_NO]: "bool",
        [ReferenceType.LOCATION]: "String",
        [ReferenceType.LOCATOR]: "String",
        [ReferenceType.ACCOUNT]: "String",
        [ReferenceType.URL]: "String",
        [ReferenceType.IMAGE]: "String",
        [ReferenceType.FILE]: "String",
        [ReferenceType.COLOR]: "String",
        [ReferenceType.JSON]: "serde_json::Value",
        [ReferenceType.PASSWORD]: "String",
        [ReferenceType.EMAIL]: "String",
        [ReferenceType.PHONE]: "String",
      };
      const baseType = mapping[referenceId] || "String";
      // Handlebars passes its options object last, so only a real `true` counts.
      return isMandatory === true ? baseType : `Option<${baseType}>`;
    });

    /**
     * `sys_reference_id` → the Rust type a **SeaORM entity** field must declare
     * for the column `m0002_bus_tables` actually creates.
     *
     * Deliberately not `rustType`. That helper answers "what shape is this value
     * in Rust" and is right for DTOs; this one answers "what type does
     * `DeriveEntityModel` need so the struct matches the table", and the two
     * disagree in three places that all fail at runtime rather than at compile
     * time:
     *
     * - DATETIME is `TIMESTAMPTZ`, which SeaORM maps to `DateTimeWithTimeZone`
     *   (`DateTime<FixedOffset>`), not `rustType`'s `DateTime<Utc>`.
     * - DATE is SeaORM's `Date` alias, not a bare `NaiveDate` import.
     * - A foreign key declared as a string or an integer is a `UUID` column, so
     *   the entity has to say `Uuid`.
     *
     * That last rule is narrower than it first looks, and the narrowness is
     * load-bearing. `m0002_bus_tables` consults `isForeignKey` **only** in the
     * reference-id 10 and 11 branches, so `decimal customer_id FK` really does
     * become `DECIMAL(18,6)` — which is why the migration's `ALTER TABLE … ADD
     * CONSTRAINT` carries `WHEN datatype_mismatch THEN NULL`. Overriding every
     * foreign key to `Uuid` here would declare `Uuid` against a `DECIMAL`
     * column and fail on the first query, so the override is applied to exactly
     * the two branches the DDL applies it to.
     *
     * Nullability follows the same rule as the DDL: `NOT NULL` only when the
     * attribute is required, so everything else is an `Option`.
     */
    /**
     * A column name as a Rust field: a reserved word (`type`, `match`, `move`…)
     * becomes a raw identifier, `r#type`. SeaORM and serde both strip the `r#`,
     * so the column and the JSON key stay `type`; without it the entity does not
     * compile — `HandlingUnit.type` broke the inventory application this way.
     * `rust_ident` in crates/appwithai-gen/src/templates.rs is the same list.
     */
    Handlebars.registerHelper("rustIdent", (name: unknown) =>
      RUST_KEYWORDS.has(String(name)) ? `r#${String(name)}` : String(name)
    );

    Handlebars.registerHelper(
      "seaOrmType",
      (referenceId: number, required?: unknown, isForeignKey?: unknown) => {
        // Handlebars passes its options object as the final argument, so a
        // missing flag arrives as that object rather than as undefined.
        const isTrue = (value: unknown) => value === true;

        const mapping: Record<number, string> = {
          [ReferenceType.STRING]: "String",
          [ReferenceType.INTEGER]: "i32",
          [ReferenceType.AMOUNT]: "Decimal",
          [ReferenceType.ID]: "Uuid",
          [ReferenceType.TEXT]: "String",
          [ReferenceType.DATE]: "Date",
          [ReferenceType.DATETIME]: "DateTimeWithTimeZone",
          [ReferenceType.LIST]: "String",
          [ReferenceType.TABLE]: "Uuid",
          [ReferenceType.TABLE_DIRECT]: "Uuid",
          [ReferenceType.YES_NO]: "bool",
          [ReferenceType.LOCATION]: "String",
          [ReferenceType.LOCATOR]: "String",
          [ReferenceType.ACCOUNT]: "String",
          [ReferenceType.URL]: "String",
          [ReferenceType.IMAGE]: "String",
          [ReferenceType.FILE]: "String",
          [ReferenceType.COLOR]: "String",
          [ReferenceType.JSON]: "Json",
          [ReferenceType.PASSWORD]: "String",
          [ReferenceType.EMAIL]: "String",
          [ReferenceType.PHONE]: "String",
        };

        const fkBecomesUuid =
          isTrue(isForeignKey) &&
          (referenceId === ReferenceType.STRING || referenceId === ReferenceType.INTEGER);

        const base = fkBecomesUuid ? "Uuid" : (mapping[referenceId] ?? "String");
        return isTrue(required) ? base : `Option<${base}>`;
      }
    );

    /**
     * `sys_reference_id` → SQL DDL, for the Loco `migration/` crate.
     *
     * Deliberately the same map `sqlType` uses. The Loco migrations emit raw
     * DDL rather than SeaORM's schema DSL precisely so this equivalence is
     * exact and testable — a database created by either stack must be
     * servable by the other (docs/MIGRATION-LOCO-ASTRYX.md §6.14).
     */
    Handlebars.registerHelper("sqlTypeRust", sqlTypeFor);

    /** snake_case Rust module name: `OrderItem` → `order_item`. */
    Handlebars.registerHelper("rustModName", (entity: string) => snakeCase(entity));

    /** PascalCase Rust struct name: `order_item` → `OrderItem`. */
    Handlebars.registerHelper("rustStructName", (entity: string) => pascalCase(entity));

    /** Axum 0.8 path parameter syntax: `id` → `{id}` (0.7 used `:id`). */
    Handlebars.registerHelper("rustRouteParam", (name: string) => `{${name}}`);

    /**
     * serde attribute for a column whose Rust field name differs from its wire
     * name. The API contract (§9) keeps emitting snake_case column names, and
     * Rust struct fields are snake_case too, so this only fires when a column
     * name is not a valid identifier match.
     */
    Handlebars.registerHelper("serdeAttr", (columnName: string) => {
      const fieldName = snakeCase(columnName);
      return fieldName === columnName ? "" : `#[serde(rename = "${columnName}")]`;
    });

    // ========================================================================
    // Astryx Helpers (tanstack-astryx-loco: Frontend)
    // ========================================================================

    /** `sys_reference_id` → Astryx component name (Appendix A). */
    Handlebars.registerHelper("astryxComponent", (referenceId: number) => {
      const mapping: Record<number, string> = {
        [ReferenceType.STRING]: "TextInput",
        [ReferenceType.INTEGER]: "NumberInput",
        [ReferenceType.AMOUNT]: "NumberInput",
        [ReferenceType.ID]: "TextInput",
        [ReferenceType.TEXT]: "TextArea",
        [ReferenceType.DATE]: "DateInput",
        [ReferenceType.DATETIME]: "DateTimeInput",
        [ReferenceType.LIST]: "Selector",
        [ReferenceType.TABLE]: "Typeahead",
        [ReferenceType.TABLE_DIRECT]: "Selector",
        [ReferenceType.YES_NO]: "Switch",
        [ReferenceType.IMAGE]: "FileInput",
        [ReferenceType.FILE]: "FileInput",
        [ReferenceType.JSON]: "TextArea",
      };
      return mapping[referenceId] || "TextInput";
    });

    /** Astryx subpath import specifier: `Button` → `@astryxdesign/core/Button`. */
    Handlebars.registerHelper(
      "astryxImport",
      (component: string) => `@astryxdesign/core/${component}`
    );

    /**
     * `sys_reference_id` → the read-only renderer a table cell uses. Distinct
     * from `astryxComponent`: a grid shows a `StatusDot` where a form shows a
     * `Switch`.
     */
    Handlebars.registerHelper("astryxCellRenderer", (referenceId: number) => {
      const mapping: Record<number, string> = {
        [ReferenceType.YES_NO]: "StatusDot",
        [ReferenceType.DATE]: "DateCell",
        [ReferenceType.DATETIME]: "DateTimeCell",
        [ReferenceType.AMOUNT]: "NumberCell",
        [ReferenceType.INTEGER]: "NumberCell",
        [ReferenceType.LIST]: "Token",
        [ReferenceType.URL]: "LinkCell",
        [ReferenceType.IMAGE]: "Avatar",
        [ReferenceType.PASSWORD]: "MaskedCell",
      };
      return mapping[referenceId] || "TextCell";
    });

    /** HTML input type for Astryx `TextInput`, mirroring `shadcnInputType`. */
    Handlebars.registerHelper("astryxInputType", (referenceId: number) => {
      const mapping: Record<number, string> = {
        [ReferenceType.EMAIL]: "email",
        [ReferenceType.URL]: "url",
        [ReferenceType.PASSWORD]: "password",
        [ReferenceType.PHONE]: "tel",
        [ReferenceType.COLOR]: "color",
      };
      return mapping[referenceId] || "text";
    });

    // ========================================================================
    // JSON Helpers
    // ========================================================================
    Handlebars.registerHelper("json", (context) => JSON.stringify(context, null, 2));
    Handlebars.registerHelper("jsonInline", (context) => JSON.stringify(context));

    // ========================================================================
    // Array/Loop Helpers
    // ========================================================================
    Handlebars.registerHelper("first", (array, property?: string) => {
      const firstItem = array?.[0];
      // If property is specified and is a string (not Handlebars options object)
      if (typeof property === "string" && firstItem) {
        return firstItem[property];
      }
      return firstItem;
    });
    Handlebars.registerHelper("last", (array, property?: string) => {
      const lastItem = array?.[array?.length - 1];
      // If property is specified and is a string (not Handlebars options object)
      if (typeof property === "string" && lastItem) {
        return lastItem[property];
      }
      return lastItem;
    });
    Handlebars.registerHelper("length", (array) => array?.length || 0);
    Handlebars.registerHelper("includes", (array, value) => array?.includes(value));
    Handlebars.registerHelper("join", (array, separator = ", ") => array?.join(separator) || "");
    Handlebars.registerHelper("slice", (array, start, end) => array?.slice(start, end));
    Handlebars.registerHelper("range", (start: number, end: number) => {
      const result: number[] = [];
      for (let i = start; i <= end; i++) result.push(i);
      return result;
    });

    // Index helpers for loops
    Handlebars.registerHelper("indexPlusOne", (index: number) => index + 1);
    Handlebars.registerHelper("isFirst", (index: number) => index === 0);
    Handlebars.registerHelper(
      "isLast",
      (index: number, array: unknown[]) => index === array.length - 1
    );
    Handlebars.registerHelper("isEven", (index: number) => index % 2 === 0);
    Handlebars.registerHelper("isOdd", (index: number) => index % 2 !== 0);

    // ========================================================================
    // Date/Time Helpers
    // ========================================================================
    Handlebars.registerHelper("now", () => new Date().toISOString());
    Handlebars.registerHelper("timestamp", () => Date.now());
    Handlebars.registerHelper("osUser", () => resolveOsUser());
    Handlebars.registerHelper("pgSocketParam", () => {
      const dir = resolvePgSocketDir();
      return dir ? `?host=${encodeURIComponent(dir)}` : "";
    });
    Handlebars.registerHelper("formatDate", (date: Date | string, format?: string) => {
      const d = new Date(date);
      if (format === "iso") return d.toISOString();
      if (format === "date") return d.toISOString().split("T")[0];
      return d.toISOString();
    });

    // ========================================================================
    // String Manipulation Helpers
    // ========================================================================
    Handlebars.registerHelper("trim", (str: string) => str?.trim() || "");
    Handlebars.registerHelper(
      "replace",
      (str: string, search: string, replacement: string) =>
        str?.replace(new RegExp(search, "g"), replacement) || ""
    );
    Handlebars.registerHelper(
      "split",
      (str: string, separator: string) => str?.split(separator) || []
    );
    Handlebars.registerHelper(
      "endsWith",
      (str: string, suffix: string) => str?.endsWith(suffix) ?? false
    );
    Handlebars.registerHelper(
      "startsWith",
      (str: string, prefix: string) => str?.startsWith(prefix) ?? false
    );
    // ── Shell parameter expansion ───────────────────────────────────────────
    //
    // `${VAR:-default}` cannot be written inline next to a Handlebars
    // expression: `${PORT:-{{config.port}}}` ends in three braces, Handlebars
    // takes the first two as its terminator and dies on the third. It is the
    // same two-braces trap as an inline `style={...}` object in a .tsx
    // template, and it has cost this repo real time twice.
    //
    // These emit the whole expansion so the brace never meets the delimiter:
    //   {{shellDefault "PORT" config.port}}   -> ${PORT:-3000}
    //   {{shellRequired "JWT_SECRET" "..."}}  -> ${JWT_SECRET:?...}
    Handlebars.registerHelper("shellDefault", (name: string, fallback: unknown) =>
      new Handlebars.SafeString(`\${${name}:-${fallback ?? ""}}`)
    );
    Handlebars.registerHelper("shellRequired", (name: string, message?: unknown) =>
      new Handlebars.SafeString(
        typeof message === "string" && message ? `\${${name}:?${message}}` : `\${${name}:?${name} is required}`
      )
    );
    Handlebars.registerHelper("concat", (...args) => args.slice(0, -1).join(""));
    Handlebars.registerHelper("substring", (str: string, start: number, length?: number) =>
      length ? str?.substring(start, start + length) : str?.substring(start)
    );
    Handlebars.registerHelper("padStart", (str: string, length: number, char: string = " ") =>
      String(str).padStart(length, char)
    );
    Handlebars.registerHelper("padEnd", (str: string, length: number, char: string = " ") =>
      String(str).padEnd(length, char)
    );

    // ========================================================================
    // Math Helpers
    // ========================================================================
    Handlebars.registerHelper("add", (a: number, b: number) => a + b);
    Handlebars.registerHelper("subtract", (a: number, b: number) => a - b);
    Handlebars.registerHelper("multiply", (a: number, b: number) => a * b);
    Handlebars.registerHelper("divide", (a: number, b: number) => a / b);
    Handlebars.registerHelper("mod", (a: number, b: number) => a % b);
    Handlebars.registerHelper("abs", (a: number) => Math.abs(a));
    Handlebars.registerHelper("ceil", (a: number) => Math.ceil(a));
    Handlebars.registerHelper("floor", (a: number) => Math.floor(a));
    Handlebars.registerHelper("round", (a: number) => Math.round(a));
    Handlebars.registerHelper("min", (...args) => Math.min(...args.slice(0, -1)));
    Handlebars.registerHelper("max", (...args) => Math.max(...args.slice(0, -1)));

    // ========================================================================
    // Conditional Helpers
    // ========================================================================
    Handlebars.registerHelper(
      "ifCond",
      function (
        this: unknown,
        v1: unknown,
        operator: string,
        v2: unknown,
        options: Handlebars.HelperOptions
      ) {
        switch (operator) {
          case "==":
            // Loose on purpose. `ifCond` implements the operator the template
            // asked for by name, and `==` and `===` are separate branches a
            // template chooses between — collapsing them would make the two
            // spellings mean the same thing and silently change what templates
            // using `==` render.
            // biome-ignore lint/suspicious/noDoubleEquals: the template selected this operator
            return v1 == v2 ? options.fn(this) : options.inverse(this);
          case "===":
            return v1 === v2 ? options.fn(this) : options.inverse(this);
          case "!=":
            // biome-ignore lint/suspicious/noDoubleEquals: the template selected this operator
            return v1 != v2 ? options.fn(this) : options.inverse(this);
          case "!==":
            return v1 !== v2 ? options.fn(this) : options.inverse(this);
          case "<":
            return (v1 as number) < (v2 as number) ? options.fn(this) : options.inverse(this);
          case "<=":
            return (v1 as number) <= (v2 as number) ? options.fn(this) : options.inverse(this);
          case ">":
            return (v1 as number) > (v2 as number) ? options.fn(this) : options.inverse(this);
          case ">=":
            return (v1 as number) >= (v2 as number) ? options.fn(this) : options.inverse(this);
          case "&&":
            return v1 && v2 ? options.fn(this) : options.inverse(this);
          case "||":
            return v1 || v2 ? options.fn(this) : options.inverse(this);
          default:
            return options.inverse(this);
        }
      }
    );

    Handlebars.registerHelper(
      "unless",
      function (this: unknown, condition: boolean, options: Handlebars.HelperOptions) {
        return !condition ? options.fn(this) : options.inverse(this);
      }
    );

    Handlebars.registerHelper(
      "switch",
      function (this: unknown, value: unknown, options: Handlebars.HelperOptions) {
        (this as Record<string, unknown>)._switch_value_ = value;
        (this as Record<string, unknown>)._switch_matched_ = false; // Reset match flag
        // Handle case where options might not have fn
        if (options && typeof options.fn === "function") {
          return options.fn(this);
        }
        return "";
      }
    );

    Handlebars.registerHelper(
      "case",
      function (this: Record<string, unknown>, value: unknown, options: Handlebars.HelperOptions) {
        // Only execute if this case matches AND no previous case has matched
        if (value === this._switch_value_ && !this._switch_matched_) {
          (this as Record<string, unknown>)._switch_matched_ = true; // Mark as matched
          // Handle case where options might not have fn
          if (options && typeof options.fn === "function") {
            return options.fn(this);
          }
        }
        return "";
      }
    );

    Handlebars.registerHelper(
      "default",
      function (this: Record<string, unknown>, options: Handlebars.HelperOptions) {
        // Only execute if no previous case has matched
        if (!this._switch_matched_) {
          (this as Record<string, unknown>)._switch_matched_ = true; // Mark as matched
          // Handle case where options might not have fn (non-block usage)
          if (options && typeof options.fn === "function") {
            return options.fn(this);
          }
        }
        return "";
      }
    );

    // ========================================================================
    // UUID Generation Helper
    // ========================================================================
    Handlebars.registerHelper("uuid", () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    });

    // ========================================================================
    // Comment/Documentation Helpers
    // ========================================================================
    Handlebars.registerHelper("comment", (text: string, style: string = "line") => {
      if (style === "block") {
        return `/* ${text} */`;
      }
      return `// ${text}`;
    });

    Handlebars.registerHelper("jsdoc", (description: string, params?: Record<string, string>) => {
      let doc = "/**\n * " + description;
      if (params) {
        doc += "\n *";
        for (const [name, type] of Object.entries(params)) {
          doc += `\n * @param {${type}} ${name}`;
        }
      }
      doc += "\n */";
      return doc;
    });

    // ========================================================================
    // Import Path Helpers
    // ========================================================================
    Handlebars.registerHelper("relativeImport", (from: string, to: string) => {
      const fromParts = from.split("/");
      const toParts = to.split("/");

      // Find common base
      let commonLength = 0;
      for (let i = 0; i < Math.min(fromParts.length, toParts.length); i++) {
        if (fromParts[i] === toParts[i]) {
          commonLength++;
        } else {
          break;
        }
      }

      const upCount = fromParts.length - commonLength - 1;
      const relativeParts = toParts.slice(commonLength);

      if (upCount === 0) {
        return "./" + relativeParts.join("/");
      }

      return "../".repeat(upCount) + relativeParts.join("/");
    });

    // ========================================================================
    // Test Helpers
    // ========================================================================
    Handlebars.registerHelper("typeToReferenceId", (type: string) => {
      const mapping: Record<string, number> = {
        string: 10,
        varchar: 10,
        char: 10,
        integer: 11,
        int: 11,
        bigint: 11,
        smallint: 11,
        decimal: 12,
        numeric: 12,
        float: 12,
        double: 12,
        number: 12,
        real: 12,
        boolean: 20,
        bool: 20,
        date: 15,
        datetime: 16,
        timestamp: 16,
        timestamptz: 16,
        text: 14,
        json: 28,
        jsonb: 28,
        uuid: 13,
        id: 13,
        email: 29,
        url: 24,
        image: 25,
        file: 26,
        phone: 31,
        password: 30,
        color: 27,
      };
      return mapping[type?.toLowerCase()] ?? 10;
    });

    Handlebars.registerHelper("isExcludedField", (fieldName: string) => {
      const excludedFields = ["id", "created_at", "updated_at", "deleted_at"];
      const lowerFieldName = fieldName?.toLowerCase() || "";

      // Exclude if it's an excluded field name
      if (excludedFields.includes(lowerFieldName)) {
        return true;
      }

      // Exclude if it contains '_id' (foreign keys)
      if (lowerFieldName.includes("_id")) {
        return true;
      }

      return false;
    });

    Handlebars.registerHelper("mockValue", (type: string, fieldName: string) => {
      const typeLower = type?.toLowerCase() || "";
      const nameLower = fieldName?.toLowerCase() || "";

      if (
        typeLower.includes("string") ||
        typeLower.includes("text") ||
        typeLower.includes("varchar")
      ) {
        if (nameLower.includes("email")) {
          return "'test@example.com'";
        }
        if (nameLower.includes("name")) {
          return "'Test Name'";
        }
        if (nameLower.includes("phone")) {
          return "'+1234567890'";
        }
        return "'test_value'";
      }

      if (
        typeLower.includes("int") ||
        typeLower.includes("number") ||
        typeLower.includes("integer")
      ) {
        return "123";
      }

      if (
        typeLower.includes("decimal") ||
        typeLower.includes("float") ||
        typeLower.includes("double")
      ) {
        return "123.45";
      }

      if (typeLower.includes("bool") || typeLower.includes("boolean")) {
        return "true";
      }

      if (typeLower.includes("date") || typeLower.includes("time")) {
        return "new Date().toISOString()";
      }

      return "'test_value'";
    });

    Handlebars.registerHelper(
      "mockUniqueValue",
      (type: string, fieldName: string, index: number) => {
        const typeLower = type?.toLowerCase() || "";
        const nameLower = fieldName?.toLowerCase() || "";

        if (
          typeLower.includes("string") ||
          typeLower.includes("text") ||
          typeLower.includes("varchar")
        ) {
          if (nameLower.includes("email")) {
            return `\`test${index}@example.com\``;
          }
          if (nameLower.includes("name")) {
            return `\`Test Name ${index}\``;
          }
          return `\`test_value_${index}\``;
        }

        if (
          typeLower.includes("int") ||
          typeLower.includes("number") ||
          typeLower.includes("integer")
        ) {
          return `${100 + index}`;
        }

        if (
          typeLower.includes("decimal") ||
          typeLower.includes("float") ||
          typeLower.includes("double")
        ) {
          return `${(100.5 + index).toFixed(2)}`;
        }

        return `\`test_${index}\``;
      }
    );

    // Realistic seed value helper for business data seeds
    Handlebars.registerHelper("seedValue", (fieldName: string, index: number) => {
      const n = (fieldName ?? "").toLowerCase();
      const i = typeof index === "number" ? index : 0;
      const FIRST_NAMES = [
        "James",
        "Mary",
        "Robert",
        "Patricia",
        "John",
        "Jennifer",
        "Michael",
        "Linda",
        "David",
        "Barbara",
      ];
      const LAST_NAMES = [
        "Smith",
        "Johnson",
        "Williams",
        "Brown",
        "Jones",
        "Garcia",
        "Miller",
        "Davis",
        "Wilson",
        "Taylor",
      ];
      // Every call site passes a non-empty literal, and the modulo keeps the
      // index in range, so the lookup cannot miss.
      const pick = <T>(arr: T[]): T => arr[i % arr.length] as T;

      if (n === "first_name") return pick(FIRST_NAMES);
      if (n === "last_name") return pick(LAST_NAMES);
      if (n === "name" || n.endsWith("_name")) return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      if (n === "gender") return i % 2 === 0 ? "Male" : "Female";
      if (n === "relationship" || n === "relationship_type")
        return pick(["Mother", "Father", "Guardian", "Grandmother", "Grandfather"]);
      if (n === "grade" || n === "letter_grade") return pick(["A", "B+", "A-", "B", "A"]);
      if (n === "status")
        return pick(["Active", "Pending", "Completed", "In Progress", "Scheduled"]);
      if (n === "subject" || n === "subject_name")
        return pick(["Mathematics", "Science", "English", "History", "Geography"]);
      if (n === "department")
        return pick(["Engineering", "Marketing", "Finance", "Operations", "HR"]);
      if (n === "address" || n === "street_address")
        return `${(i + 1) * 100} ${pick(["Main St", "Oak Ave", "Elm Dr", "Park Blvd", "Cedar Ln"])}, ${pick(["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"])}`;
      if (n === "city") return pick(["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"]);
      if (n === "phone" || n === "phone_number" || n === "mobile")
        return `555-${String(1000 + i * 101).padStart(4, "0")}`;
      if (n === "description" || n === "notes" || n === "bio") return `Description ${i + 1}`;
      if (n === "title") return `Title ${i + 1}`;
      if (n === "code" || n === "reference_code") return `CODE-${String(i + 1).padStart(3, "0")}`;
      if (n === "score" || n === "grade_value") return String(70 + i * 5);
      if (n === "capacity" || n === "max_students") return String(20 + i * 5);
      if (n === "room_number") return `10${i + 1}`;
      if (n === "year" || n === "academic_year") return String(2024 + i);
      if (n === "section") return String.fromCharCode(65 + i); // A, B, C, D
      return `Sample ${i + 1}`;
    });
  }
}
