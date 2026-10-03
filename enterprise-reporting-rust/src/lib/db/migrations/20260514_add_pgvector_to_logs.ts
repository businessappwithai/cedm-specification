/**
 * Migration: Add pgvector support to logs table for PostgreSQL
 *
 * This migration updates the logs table to use pgvector type for message_vector
 * when running on PostgreSQL with pgvector extension installed.
 *
 * For MariaDB or other databases without pgvector, vectors remain as TEXT (JSON arrays).
 *
 * Run: bun run db:migrate
 */

import { type Kysely, sql } from "kysely";
import type { Database } from "../kysely-db";

export async function up(db: Kysely<Database>): Promise<void> {
  // Check if pgvector extension is available (PostgreSQL only)
  try {
    await sql.raw(`CREATE EXTENSION IF NOT EXISTS vector`).execute(db);

    // Alter the logs table to use pgvector type
    // First, add a temporary column
    await sql
      .raw(`
      ALTER TABLE logs
      ADD COLUMN message_vector_pgvector vector(1536)
    `)
      .execute(db);

    // Copy data from text vector to pgvector column
    await sql
      .raw(`
      UPDATE logs
      SET message_vector_pgvector = message_vector::vector
      WHERE message_vector IS NOT NULL
    `)
      .execute(db);

    // Drop the old column
    await sql
      .raw(`
      ALTER TABLE logs
      DROP COLUMN message_vector
    `)
      .execute(db);

    // Rename the new column
    await sql
      .raw(`
      ALTER TABLE logs
      RENAME COLUMN message_vector_pgvector TO message_vector
    `)
      .execute(db);

    // Create index for vector similarity search
    await sql
      .raw(`
      CREATE INDEX IF NOT EXISTS idx_logs_message_vector
      ON logs USING ivfflat (message_vector vector_cosine_ops)
      WITH (lists = 100)
    `)
      .execute(db);
  } catch (error) {
    // If pgvector is not available (MariaDB, etc.), keep the TEXT type
    console.log("pgvector extension not available, keeping message_vector as TEXT (JSON arrays)");
  }
}

export async function down(db: Kysely<Database>): Promise<void> {
  // Revert back to TEXT type if needed
  try {
    await sql
      .raw(`
      ALTER TABLE logs
      DROP INDEX IF EXISTS idx_logs_message_vector
    `)
      .execute(db);

    await sql
      .raw(`
      ALTER TABLE logs
      ADD COLUMN message_vector_text TEXT
    `)
      .execute(db);

    await sql
      .raw(`
      UPDATE logs
      SET message_vector_text = message_vector::text
      WHERE message_vector IS NOT NULL
    `)
      .execute(db);

    await sql
      .raw(`
      ALTER TABLE logs
      DROP COLUMN message_vector
    `)
      .execute(db);

    await sql
      .raw(`
      ALTER TABLE logs
      RENAME COLUMN message_vector_text TO message_vector
    `)
      .execute(db);
  } catch (error) {
    console.log("Could not revert pgvector migration");
  }
}
