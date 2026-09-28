/**
 * Data Service
 *
 * Provides CRUD operations for entity data when datasources are editable.
 * All operations respect ds_entity_permissions and use server-side pagination.
 */

import { sql } from "kysely";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db/config";
import { getConnection } from "@/lib/db/connection-manager";
import type { DataSource, MetadataEntityWithFields } from "@/types/database";

/**
 * Paginated result type
 */
export interface PaginatedResult<T> {
  records: T[];
  total: number;
  pageCount: number;
  page: number;
  limit: number;
}

/**
 * Query parameters for entity data listing
 */
export interface EntityDataQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

/**
 * Data Service
 */
// biome-ignore lint/complexity/noStaticOnlyClass: service class pattern with cohesive static methods
export class DataService {
  /**
   * The editable data source and a live connection to it.
   *
   * Every method needed this and each rebuilt it inline through a
   * `getConnectionManager()` that this project does not export — the connection
   * manager's entry point is `getConnection(dataSource)`.
   */
  private static async resolve(dataSourceId: string) {
    const dataSource = (await getDb()
      .selectFrom("data_sources")
      .where("id", "=", dataSourceId)
      .selectAll()
      .executeTakeFirst()) as DataSource | undefined;

    if (!dataSource) {
      throw new Error("Data source not found");
    }
    if (!dataSource.is_editable) {
      throw new Error("Data source is not editable");
    }

    const connection = await getConnection(dataSource);
    if (!connection) {
      throw new Error("Failed to connect to datasource");
    }
    return { dataSource, connection };
  }

  /** The entity's primary-key field, which every row-addressed method needs. */
  private static primaryKey(entityMetadata: MetadataEntityWithFields) {
    const pkField = entityMetadata.fields.find((f) => f.is_primary_key);
    if (!pkField) {
      throw new Error("Entity has no primary key defined");
    }
    return pkField;
  }
  /**
   * List records from an entity with server-side pagination
   */
  static async listRecords(
    dataSourceId: string,
    entityMetadata: MetadataEntityWithFields,
    params: EntityDataQueryParams = {},
    userId?: string
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { connection } = await DataService.resolve(dataSourceId);

    const table = entityMetadata.entity_name;

    /** Searchable columns matched with LIKE, OR-ed together. */
    const searchTerm = params.search?.trim();
    const searchFields = searchTerm ? entityMetadata.fields.filter((f) => f.is_searchable) : [];
    // The table is only known at run time, so these builders are untyped.
    // biome-ignore lint/suspicious/noExplicitAny: dynamic table name
    const applySearch = (q: any): any => {
      if (!searchTerm || searchFields.length === 0) return q;
      // biome-ignore lint/suspicious/noExplicitAny: dynamic column names
      return q.where((eb: any) =>
        eb.or(searchFields.map((f) => sql`${sql.ref(f.field_name)} LIKE ${`%${searchTerm}%`}`))
      );
    };

    const countResult = (await applySearch(
      connection.selectFrom(table).select(sql`count(*)`.as("total"))
    ).executeTakeFirst()) as { total?: number | string } | undefined;
    const total = Number(countResult?.total || 0);

    const page = params.page || 1;
    const limit = Math.min(params.limit || 50, 500);
    const offset = (page - 1) * limit;

    const sortField =
      params.sort ?? entityMetadata.fields.find((f) => f.is_primary_key)?.field_name;
    let query = applySearch(connection.selectFrom(table).selectAll());
    if (sortField) {
      query = query.orderBy(sortField, params.order || "asc");
    }
    const records = await query.limit(limit).offset(offset).execute();

    return {
      records: records as Record<string, unknown>[],
      total,
      pageCount: Math.ceil(total / limit),
      page,
      limit,
    };
  }

  /**
   * Get single record by ID
   */
  static async getRecord(
    dataSourceId: string,
    entityMetadata: MetadataEntityWithFields,
    recordId: string | number,
    userId?: string
  ): Promise<Record<string, unknown> | null> {
    const { connection } = await DataService.resolve(dataSourceId);

    const pkField = DataService.primaryKey(entityMetadata);

    const record = await connection
      .selectFrom(entityMetadata.entity_name)
      .selectAll()
      .where(pkField.field_name, "=", recordId)
      .executeTakeFirst();

    return (record as Record<string, unknown> | undefined) ?? null;
  }

  /**
   * Create new record
   */
  static async createRecord(
    dataSourceId: string,
    entityMetadata: MetadataEntityWithFields,
    data: Record<string, unknown>,
    userId?: string
  ): Promise<Record<string, unknown>> {
    const { connection } = await DataService.resolve(dataSourceId);

    // Validate required fields
    const requiredFields = entityMetadata.fields.filter((f) => !f.is_nullable);
    for (const field of requiredFields) {
      if (data[field.field_name] === null || data[field.field_name] === undefined) {
        throw new Error(`Required field '${field.field_name}' is missing`);
      }
    }

    const record = (await connection
      .insertInto(entityMetadata.entity_name)
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow()) as Record<string, unknown>;

    const pkField = DataService.primaryKey(entityMetadata);

    // Audit log
    if (userId) {
      await getDb()
        .insertInto("audit_log")
        .values({
          id: randomUUID(),
          user_id: userId,
          action: "create",
          resource_type: "metadata_entity",
          resource_id: entityMetadata.id,
          details: JSON.stringify({
            entity_name: entityMetadata.entity_name,
            record_id: record[pkField.field_name],
          }),
          created_at: new Date().toISOString(),
        })
        .execute();
    }

    return record as Record<string, unknown>;
  }

  /**
   * Update record
   */
  static async updateRecord(
    dataSourceId: string,
    entityMetadata: MetadataEntityWithFields,
    recordId: string | number,
    data: Record<string, unknown>,
    userId?: string
  ): Promise<Record<string, unknown> | null> {
    const { connection } = await DataService.resolve(dataSourceId);

    const pkField = DataService.primaryKey(entityMetadata);

    const record = (await connection
      .updateTable(entityMetadata.entity_name)
      .set(data)
      .where(pkField.field_name, "=", recordId)
      .returningAll()
      .executeTakeFirst()) as Record<string, unknown> | undefined;

    if (!record) {
      return null;
    }

    if (userId) {
      await getDb()
        .insertInto("audit_log")
        .values({
          id: randomUUID(),
          user_id: userId,
          action: "update",
          resource_type: "metadata_entity",
          resource_id: entityMetadata.id,
          details: JSON.stringify({
            entity_name: entityMetadata.entity_name,
            record_id: recordId,
            updated_fields: Object.keys(data),
          }),
          created_at: new Date().toISOString(),
        })
        .execute();
    }

    return record;
  }

  /**
   * Delete record
   */
  static async deleteRecord(
    dataSourceId: string,
    entityMetadata: MetadataEntityWithFields,
    recordId: string | number,
    userId?: string
  ): Promise<boolean> {
    const { connection } = await DataService.resolve(dataSourceId);

    const pkField = DataService.primaryKey(entityMetadata);

    const deleteResult = await connection
      .deleteFrom(entityMetadata.entity_name)
      .where(pkField.field_name, "=", recordId)
      .executeTakeFirst();
    const deleted = Number(deleteResult?.numDeletedRows ?? 0);

    if (userId && deleted > 0) {
      await getDb()
        .insertInto("audit_log")
        .values({
          id: randomUUID(),
          user_id: userId,
          action: "delete",
          resource_type: "metadata_entity",
          resource_id: entityMetadata.id,
          details: JSON.stringify({
            entity_name: entityMetadata.entity_name,
            record_id: recordId,
          }),
          created_at: new Date().toISOString(),
        })
        .execute();
    }

    return deleted > 0;
  }

  /**
   * Search records (for foreign key relationship popup)
   */
  static async searchRecords(
    dataSourceId: string,
    entityMetadata: MetadataEntityWithFields,
    searchTerm: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    return await DataService.listRecords(dataSourceId, entityMetadata, {
      search: searchTerm,
      page,
      limit,
    });
  }
}
