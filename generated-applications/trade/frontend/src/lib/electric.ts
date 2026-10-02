/**
 * ElectricSQL + PGlite — local-first sync for sys_ (Application Dictionary) tables.
 *
 * sys_ rows are scoped to the authenticated user's role: each Electric shape
 * subscription forwards a `role` query param so the Electric proxy can apply
 * server-side filtering before sending rows to the client. Only the rows that
 * belong to the current role are loaded into the local PGlite instance and
 * subsequently into TanStack DB Collections — nothing else is synced
 * client-side.
 *
 * **PGlite is imported dynamically, and that is load-bearing.** It is a
 * PostgreSQL compiled to WebAssembly, and a static import put it in the shared
 * entry chunk — 972KB raw, 229KB over the wire, on every page of every
 * generated application. `VITE_ELECTRIC_URL` is empty unless someone sets it,
 * so in a default deployment `ELECTRIC_ENABLED` is false, `getDb` is never
 * called, and all of that was downloaded to run nothing. The import now lives
 * inside `getDb`, which is reached only after that flag has been checked, so
 * an application with sync configured pays for PGlite when it first syncs and
 * one without never pays at all.
 *
 * Keep the module-scope imports type-only. A value imported from
 * `@electric-sql/pglite` at the top of this file puts the whole package back
 * on the critical path, and nothing in the bundle output says so — the entry
 * chunk simply grows.
 *
 * Generated: 2026-10-02T17:02:29.060Z
 * Project: trade
 */

import type { PGlite } from '@electric-sql/pglite';

export const ELECTRIC_URL: string =
  import.meta.env.VITE_ELECTRIC_URL || '';

/** When ELECTRIC_URL is not set, sync is disabled and hooks use HTTP fallback. */
export const ELECTRIC_ENABLED = !!ELECTRIC_URL;

let _db: PGlite | null = null;
let _initPromise: Promise<PGlite> | null = null;

/** DDL for the local PGlite schema — mirrors the server-side sys_ tables. */
const SYS_DDL = `
  CREATE TABLE IF NOT EXISTS sys_table (
    sys_table_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
  );
  CREATE TABLE IF NOT EXISTS sys_column (
    sys_column_id TEXT PRIMARY KEY,
    sys_table_id TEXT NOT NULL,
    column_name TEXT NOT NULL,
    name TEXT NOT NULL,
    sys_reference_id INTEGER,
    is_key BOOLEAN DEFAULT FALSE,
    is_mandatory BOOLEAN DEFAULT FALSE,
    seq_no INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS sys_field (
    sys_field_id TEXT PRIMARY KEY,
    sys_column_id TEXT NOT NULL,
    name TEXT NOT NULL,
    seq_no INTEGER DEFAULT 0,
    seq_no_grid INTEGER DEFAULT 0,
    is_displayed BOOLEAN DEFAULT TRUE,
    is_displayed_grid BOOLEAN DEFAULT TRUE,
    is_read_only BOOLEAN DEFAULT FALSE,
    is_mandatory BOOLEAN DEFAULT FALSE
  );
  CREATE TABLE IF NOT EXISTS sys_reference (
    sys_reference_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
  );
  CREATE TABLE IF NOT EXISTS sys_window (
    sys_window_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    sys_table_id TEXT
  );
`;

export async function getDb(): Promise<PGlite> {
  if (_db) return _db;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    // Loaded here rather than at module scope: see the note at the top of this
    // file. Both packages are fetched in parallel, once, and only by a caller
    // that has already established sync is configured.
    const [{ PGlite }, { electricSync }] = await Promise.all([
      import('@electric-sql/pglite'),
      import('@electric-sql/pglite-sync'),
    ]);
    const db = await PGlite.create({ extensions: { electric: electricSync() } });
    await db.exec(SYS_DDL);
    _db = db;
    return db;
  })();

  return _initPromise;
}

export interface SyncConfig {
  /** User role — forwarded to the Electric proxy to filter sys_ rows per role. */
  role: string;
  /** Session token forwarded as a header for proxy-level auth. */
  token?: string;
}

export type UnsubscribeFn = () => void;

/**
 * Subscribe to Electric shapes for all sys_ tables, scoped to the given role.
 *
 * The `role` param is forwarded to the NestJS Electric proxy (`/v1/shape`) which
 * applies a WHERE clause so only the rows visible to that role are streamed.
 * This is the only place where sys_ data enters the client — everything else
 * reads from TanStack DB Collections that are populated from PGlite.
 */
export async function syncSysTablesForRole(config: SyncConfig): Promise<UnsubscribeFn> {
  if (!ELECTRIC_ENABLED) {
    return () => {};
  }

  const db = await getDb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ext = (db as any).electric as { syncShapeToTable: (opts: any) => Promise<any> };

  const commonParams = { role: config.role };
  const authHeaders = config.token ? { Authorization: `Bearer ${config.token}` } : {};

  type ShapeSpec = { table: string; primaryKey: string[] };

  const specs: ShapeSpec[] = [
    { table: 'sys_table',     primaryKey: ['sys_table_id'] },
    { table: 'sys_column',    primaryKey: ['sys_column_id'] },
    { table: 'sys_field',     primaryKey: ['sys_field_id'] },
    { table: 'sys_reference', primaryKey: ['sys_reference_id'] },
    { table: 'sys_window',    primaryKey: ['sys_window_id'] },
  ];

  const subscriptions = await Promise.all(
    specs.map(({ table, primaryKey }) =>
      ext.syncShapeToTable({
        shape: {
          url: ELECTRIC_URL,
          params: { table, ...commonParams },
          headers: authHeaders,
        },
        table,
        primaryKey,
      })
    )
  );

  return () => {
    for (const sub of subscriptions) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sub as any).unsubscribe?.();
    }
  };
}
