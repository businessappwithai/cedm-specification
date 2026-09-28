/**
 * Read an existing Postgres database and describe it as a model document.
 *
 * This is the second way into the product. A model normally starts as YAML
 * someone wrote, but a team with a database already has the model — it is just
 * written in DDL. Pointing the tool at a connection string turns that into a
 * model it can work from, which is the whole of the "bring your own database"
 * path, including hosted providers like Neon.
 *
 * Only tables are read — views and materialised views have no primary key to
 * speak of and would generate services that cannot write. A table or column
 * whose name the model language cannot hold is reported in `skipped` rather
 * than renamed: a renamed column is one the generated application would read
 * and write under a name the database does not have.
 */

import pg from "pg";
import type {
  AttributeDocument,
  EntityDocument,
  ModelDocument,
  RelationshipDocument,
} from "../../../../language/yaml/document";

export interface IntrospectOptions {
  /** Postgres connection string. TLS is negotiated for non-local hosts. */
  connectionString: string;
  /** Milliseconds to wait for the connection. Hosted databases can be slow to wake. */
  connectionTimeoutMillis?: number;
  /** Schema to read. Anything but `public` is unusual but legal. */
  schema?: string;
}

export interface IntrospectedSchema {
  /** One entity per table, one relationship per foreign key between two of them. */
  document: ModelDocument;
  tableCount: number;
  relationshipCount: number;
  /** What the database has that the document could not say, and why. */
  skipped: Array<{ table: string; column?: string; reason: string }>;
}

interface ColumnRow {
  column_name: string;
  data_type: string;
  is_nullable: string;
  constraint_type: string | null;
}

interface ForeignKeyRow {
  table_name: string;
  column_name: string;
  foreign_table_name: string;
}

/**
 * Postgres type → the model language's type. Each maps to the canonical type
 * that stores the same values; `uuid` keeps its own name because the language
 * gives it its own reference, and anything unrecognised is a `string`, which
 * holds any value Postgres can print.
 */
function toModelType(dataType: string): string {
  const type = dataType.toLowerCase();
  if (["integer", "int", "int4", "int2", "int8", "bigint", "smallint", "serial"].includes(type))
    return "integer";
  if (
    ["numeric", "decimal", "float4", "float8", "real", "double precision", "money"].includes(type)
  )
    return "decimal";
  if (type === "text") return "text";
  if (type === "date") return "date";
  if (type.startsWith("timestamp") || type.startsWith("time ") || type === "time") return "datetime";
  if (type === "boolean" || type === "bool") return "boolean";
  if (type === "json" || type === "jsonb") return "json";
  if (type === "uuid") return "uuid";
  return "string";
}

/** `stability_test` → `StabilityTest`, the shape entity names take. */
function toPascalCase(name: string): string {
  return name.replace(/(^|_)([a-z0-9])/g, (_match, _sep, char: string) => char.toUpperCase());
}

/** What the model schema accepts as an entity name and as a column name. */
const ENTITY_NAME = /^[A-Za-z][A-Za-z0-9_]*$/;
const COLUMN_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Local hosts do not get TLS; everything else does, without demanding a
 * verifiable chain. Mirrors the reasoning in `config/db.config.ts` — hosted
 * providers sign with roots that are not in every image's trust store.
 */
function sslFor(connectionString: string): pg.ClientConfig["ssl"] {
  try {
    const host = new URL(connectionString).hostname.toLowerCase();
    const local = ["localhost", "127.0.0.1", "::1", "0.0.0.0", "postgres", "db"];
    if (local.includes(host)) return undefined;
  } catch {
    return undefined;
  }
  return { rejectUnauthorized: false };
}

export async function introspectDatabase(options: IntrospectOptions): Promise<IntrospectedSchema> {
  const schema = options.schema ?? "public";
  const ssl = sslFor(options.connectionString);

  const client = new pg.Client({
    connectionString: options.connectionString,
    connectionTimeoutMillis: options.connectionTimeoutMillis ?? 30_000,
    ...(ssl ? { ssl } : {}),
  });

  await client.connect();

  try {
    const tables = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = $1 AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
      [schema]
    );

    const skipped: IntrospectedSchema["skipped"] = [];
    const entityOf = new Map<string, string>();
    for (const { table_name } of tables.rows) {
      const entity = toPascalCase(table_name);
      if (ENTITY_NAME.test(entity)) entityOf.set(table_name, entity);
      else skipped.push({ table: table_name, reason: `"${entity}" is not a valid entity name` });
    }

    // Every foreign key in one query rather than one per table: the
    // relationships are what make the document a model rather than a column
    // list, and a per-table round trip against a hosted database is slow
    // enough to matter once there are a few dozen of them.
    const foreignKeys = await client.query<ForeignKeyRow>(
      `SELECT tc.table_name,
              kcu.column_name,
              ccu.table_name AS foreign_table_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON kcu.constraint_name = tc.constraint_name
        AND kcu.table_schema = tc.table_schema
       JOIN information_schema.constraint_column_usage ccu
         ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
       WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1
       ORDER BY tc.table_name, kcu.column_name`,
      [schema]
    );

    const entities: EntityDocument[] = [];
    const nullable = new Map<string, boolean>();
    for (const [table, name] of entityOf) {
      const columns = await client.query<ColumnRow>(
        `SELECT c.column_name, c.data_type, c.is_nullable, tc.constraint_type
         FROM information_schema.columns c
         LEFT JOIN information_schema.key_column_usage kcu
           ON kcu.table_schema = $1
          AND kcu.table_name = c.table_name
          AND kcu.column_name = c.column_name
         LEFT JOIN information_schema.table_constraints tc
           ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = $1
         WHERE c.table_schema = $1 AND c.table_name = $2
         ORDER BY c.ordinal_position`,
        [schema, table]
      );

      // A column in two constraints comes back twice; the key it takes part
      // in decides what it is, primary before foreign before unique.
      const byName = new Map<string, AttributeDocument>();
      const refused = new Set<string>();
      for (const column of columns.rows) {
        if (!COLUMN_NAME.test(column.column_name)) {
          if (!refused.has(column.column_name)) {
            refused.add(column.column_name);
            skipped.push({ table, column: column.column_name, reason: "not a valid column name" });
          }
          continue;
        }
        const attribute = byName.get(column.column_name) ?? {
          name: column.column_name,
          type: toModelType(column.data_type),
        };
        if (column.constraint_type === "PRIMARY KEY") attribute.pk = true;
        if (column.constraint_type === "FOREIGN KEY") attribute.fk = true;
        if (column.constraint_type === "UNIQUE") attribute.unique = true;
        byName.set(column.column_name, attribute);
        nullable.set(`${table}.${column.column_name}`, column.is_nullable === "YES");
      }
      const attributes = [...byName.values()].map((attribute) => {
        // A nullable column is optional; a primary key never is, whatever
        // information_schema says about it.
        const optional = !attribute.pk && nullable.get(`${table}.${attribute.name}`);
        const { unique, ...rest } = attribute;
        return {
          ...rest,
          ...(unique && !attribute.pk ? { unique: true } : {}),
          ...(optional ? { optional: true } : {}),
        };
      });
      if (!attributes.length) {
        skipped.push({ table, reason: "no column the model can hold" });
        continue;
      }
      entities.push({ name, attributes });
    }

    const declared = new Set(entities.map((entity) => entity.name));
    const relationships: RelationshipDocument[] = [];
    for (const fk of foreignKeys.rows) {
      const parent = entityOf.get(fk.foreign_table_name);
      const child = entityOf.get(fk.table_name);
      // A key pointing outside the tables read would name an entity the
      // document never declares, which the checker rejects.
      if (!parent || !child || !declared.has(parent) || !declared.has(child)) continue;
      if (parent === child) continue;
      relationships.push({
        from: parent,
        fromCardinality: nullable.get(`${fk.table_name}.${fk.column_name}`)
          ? "zero-or-one"
          : "exactly-one",
        to: child,
        toCardinality: "zero-or-more",
        label: fk.column_name,
      });
    }

    return {
      document: {
        eml: "1.0",
        entities,
        ...(relationships.length ? { relationships } : {}),
      },
      tableCount: entities.length,
      relationshipCount: relationships.length,
      skipped,
    };
  } finally {
    await client.end();
  }
}
