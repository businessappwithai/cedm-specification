/**
 * DATABASE CONFIGURATION — single place to change DB connection.
 *
 * Supported env vars:
 *   DATABASE_URL   postgresql://user:pass@host:5432/dbname  (takes precedence)
 *   PGHOST         default: localhost
 *   PGPORT         default: 5432
 *   PGUSER         default: current OS user
 *   PGPASSWORD     default: (empty)
 *   PGDATABASE     default: appwithai
 */

import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { getLogger } from "../logging";
import type { Database } from "./db.types.js";

export type { Database };

function buildPoolConfig(): pg.PoolConfig {
  const url = process.env.DATABASE_URL;

  if (url && (url.startsWith("postgresql://") || url.startsWith("postgres://"))) {
    return { connectionString: url, max: 10 };
  }

  return {
    host: process.env.PGHOST ?? "localhost",
    port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD ?? "",
    database: process.env.PGDATABASE ?? "appwithai",
    max: 10,
  };
}

let _db: Kysely<Database> | null = null;
let _pool: pg.Pool | null = null;

/** The one pool. Built here so this file stays the only connection site. */
function getOrCreatePool(): pg.Pool {
  if (!_pool) {
    const config = buildPoolConfig();
    _pool = new pg.Pool(config);
    // Where this process connected, once, at the moment it first did. The
    // connection string itself is never a field: it carries a password, and
    // `DATABASE_URL` is the one setting whose value in a log is a credential
    // in a log. Host and database name are what an operator needs to answer
    // "which database did it actually open".
    getLogger("db").event("db.pool.opened", {
      host: config.host ?? hostOf(config.connectionString),
      database: config.database ?? databaseOf(config.connectionString),
      max: config.max,
    });
  }
  return _pool;
}

/**
 * The host out of a connection string, without its credentials.
 *
 * Parsed rather than pattern-matched so a password containing an `@` cannot
 * shift where the host appears to start — which is exactly the case where a
 * naive split leaks the thing this function exists to drop.
 */
function hostOf(connectionString: string | undefined): string | undefined {
  if (!connectionString) return undefined;
  try {
    return new URL(connectionString).hostname;
  } catch {
    return undefined;
  }
}

/** The database name out of a connection string, by the same parse. */
function databaseOf(connectionString: string | undefined): string | undefined {
  if (!connectionString) return undefined;
  try {
    return new URL(connectionString).pathname.replace(/^\//, "") || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Returns the shared Kysely<Database> instance (lazy singleton).
 */
export function getDb(): Kysely<Database> {
  if (!_db) {
    _db = new Kysely<Database>({
      dialect: new PostgresDialect({ pool: getOrCreatePool() }),
    });
  }
  return _db;
}

/**
 * The raw `pg` pool behind Kysely, for SQL Kysely cannot model.
 *
 * Apache AGE is the reason this exists: a Cypher call is
 * `SELECT * FROM cypher('g', $$ ... $$, $1) AS (x agtype)`, whose result shape
 * is declared in the statement rather than by the schema, and whose connection
 * needs `LOAD 'age'` and a modified `search_path` first. None of that fits a
 * query builder.
 *
 * It shares Kysely's pool deliberately. Opening a second one would put a
 * connection string in a second place, which is the thing this module exists
 * to prevent.
 */
export function getPool(): pg.Pool {
  return getOrCreatePool();
}

/**
 * Destroy the connection pool (use in tests or graceful shutdown).
 */
export async function destroyDb(): Promise<void> {
  const had = _db !== null || _pool !== null;
  if (had) getLogger("db").event("db.pool.closed");
  if (_db) {
    // Destroying Kysely ends the pool it was given, so the handle here has to
    // be dropped with it or `getPool()` would hand back a dead pool.
    await _db.destroy();
    _db = null;
    _pool = null;
    return;
  }
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}
