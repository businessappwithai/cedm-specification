/**
 * The gateway's own tables, in a database and a schema of their own (`chat` by
 * default).
 *
 * It may share a PostgreSQL *server* with the application it serves, never its
 * database. The gateway reads business data only through the application's
 * API, as the person, so there is no path from here to a `bus_` row that skips
 * the application's authorisation — and the reverse matters as much: the
 * reporting platform introspects every schema of the database it reports on,
 * so chat sessions kept in the application's database would become rows a
 * report could select.
 *
 * Better Auth's tables (`user`, `session`, `account`, `verification`) are
 * created by its own migrator; the two below are the gateway's.
 */

import { type Generated, Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";

export interface CredentialsTable {
  /** The Better Auth session this row belongs to; ends with it. */
  session_id: string;
  user_id: string;
  email: string;
  name: string;
  roles: string[];
  is_master: boolean;
  /** The application's JWT, sealed (`stored-credential` key, bound to the session id). */
  app_token: string;
  /** The reporting platform's session token, sealed the same way; null when not signed in there. */
  report_token: string | null;
  created_at: Generated<Date>;
  expires_at: Date;
}

export interface AppViewsTable {
  /** Opaque, unguessable; what a chat node holds. */
  id: string;
  user_id: string;
  kind: "business-application" | "enterprise-report";
  /** `{ path }` inside the application, or `{ reportId, params }` for a report. */
  target: unknown;
  operation: string;
  title: string;
  expires_at: Date;
  created_at: Generated<Date>;
}

export interface ChatDatabase {
  credentials: CredentialsTable;
  app_views: AppViewsTable;
}

/**
 * Create the gateway's database when the server does not have it yet.
 *
 * A container's init scripts run once, when its volume is first created, so a
 * chat added to an application that already has a database would never get
 * one that way. Creating it here, on the server named by the URL, covers both.
 * The role in the URL needs CREATEDB for this; where it lacks it, the database
 * must be created beforehand and this does nothing.
 */
export async function ensureDatabase(databaseUrl: string): Promise<void> {
  const probe = new pg.Client({ connectionString: databaseUrl });
  try {
    await probe.connect();
    return;
  } catch (error) {
    if ((error as { code?: string }).code !== "3D000") throw error;
  } finally {
    await probe.end().catch(() => {});
  }
  const url = new URL(databaseUrl);
  const name = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!/^[A-Za-z_][A-Za-z0-9_]{0,62}$/.test(name)) {
    throw new Error(`CHAT_DATABASE_URL names a database (${name}) this gateway will not create; create it first.`);
  }
  url.pathname = "/postgres";
  const admin = new pg.Client({ connectionString: url.toString() });
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${name}"`);
    console.log(`chat gateway: created database ${name}`);
  } catch (error) {
    // Another gateway starting at the same moment created it first.
    if ((error as { code?: string }).code !== "42P04") throw error;
  } finally {
    await admin.end();
  }
}

export function createPool(databaseUrl: string, schema: string): pg.Pool {
  return new pg.Pool({
    connectionString: databaseUrl,
    max: 20,
    // Every connection resolves unqualified names in the chat schema first, so
    // Better Auth's tables land there and never beside the application's.
    options: `-c search_path=${schema},public`,
  });
}

export function createDb(pool: pg.Pool): Kysely<ChatDatabase> {
  return new Kysely<ChatDatabase>({ dialect: new PostgresDialect({ pool }) });
}

/** Create the schema and the gateway's own tables. Idempotent. */
export async function migrateGatewayTables(db: Kysely<ChatDatabase>, schema: string): Promise<void> {
  await sql`CREATE SCHEMA IF NOT EXISTS ${sql.id(schema)}`.execute(db);
  await sql`
    CREATE TABLE IF NOT EXISTS ${sql.id(schema, "credentials")} (
      session_id   TEXT PRIMARY KEY,
      user_id      TEXT NOT NULL,
      email        TEXT NOT NULL,
      name         TEXT NOT NULL,
      roles        TEXT[] NOT NULL DEFAULT '{}',
      is_master    BOOLEAN NOT NULL DEFAULT FALSE,
      app_token    TEXT NOT NULL,
      report_token TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at   TIMESTAMPTZ NOT NULL
    )`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS credentials_user_idx ON ${sql.id(schema, "credentials")} (user_id)`.execute(db);
  await sql`
    CREATE TABLE IF NOT EXISTS ${sql.id(schema, "app_views")} (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      kind        TEXT NOT NULL CHECK (kind IN ('business-application', 'enterprise-report')),
      target      JSONB NOT NULL,
      operation   TEXT NOT NULL,
      title       TEXT NOT NULL,
      expires_at  TIMESTAMPTZ NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS app_views_expiry_idx ON ${sql.id(schema, "app_views")} (expires_at)`.execute(db);
}

/** Delete expired views and orphaned credentials. Run on an interval. */
export async function sweepExpired(db: Kysely<ChatDatabase>): Promise<void> {
  // A view is kept a day past expiry so a stale node can say "expired" (410)
  // rather than "not found" (404) — the difference tells the person to re-open.
  await db.deleteFrom("app_views").where("expires_at", "<", sql<Date>`now() - interval '1 day'`).execute();
  await db.deleteFrom("credentials").where("expires_at", "<", sql<Date>`now()`).execute();
}
