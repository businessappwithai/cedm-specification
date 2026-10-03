import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db/config";
import type { ErrorMessagesTable, WarningConfigsTable } from "@/lib/db/kysely-db";

export interface ErrorMessage {
  id: string;
  error_code: string;
  severity: "error" | "warning" | "info" | null;
  title: string;
  message: string;
  user_message?: string | null;
  suggestions?: string[] | null;
  documentation_url?: string | null;
  is_active: boolean | null;
  category?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface WarningConfig {
  id: string;
  warning_code: string;
  name: string;
  description?: string | null;
  trigger_type: string;
  trigger_config?: Record<string, unknown> | null;
  severity: "info" | "warning" | "critical" | null;
  message_template: string;
  suggestions_template?: string[] | null;
  is_active: boolean | null;
  display_duration: number | null;
  require_dismissal: boolean | null;
  enable_auto_resolve: boolean | null;
  auto_resolve_after?: number | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ErrorOccurrence {
  id: string;
  error_code: string;
  user_id?: string;
  error_message?: string;
  stack_trace?: string;
  component_stack?: string;
  url?: string;
  user_agent?: string;
  context?: Record<string, unknown>;
  is_reported: boolean;
  is_resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

/** JSON-encoded TEXT columns, decoded once on the way out of the database. */
function parseJson<T>(value: unknown): T | null {
  if (typeof value !== "string" || value.length === 0) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function toErrorMessage(row: ErrorMessagesTable): ErrorMessage {
  return {
    ...row,
    suggestions: parseJson<string[]>(row.suggestions),
    metadata: parseJson<Record<string, unknown>>(row.metadata),
  };
}

function toWarningConfig(row: WarningConfigsTable): WarningConfig {
  return {
    ...row,
    trigger_config: parseJson<Record<string, unknown>>(row.trigger_config),
    suggestions_template: parseJson<string[]>(row.suggestions_template),
    metadata: parseJson<Record<string, unknown>>(row.metadata),
  };
}

class ErrorManagementService {
  /**
   * Get error message by error code
   */
  async getErrorMessage(errorCode: string): Promise<ErrorMessage | null> {
    const db = getDb();
    const result = await db
      .selectFrom("error_messages")
      .where("error_code", "=", errorCode)
      .where("is_active", "=", true)
      .selectAll()
      .executeTakeFirst();

    return result ? toErrorMessage(result) : null;
  }

  /**
   * Get all active error messages
   */
  async getAllErrorMessages(): Promise<ErrorMessage[]> {
    const db = getDb();
    const results = await db
      .selectFrom("error_messages")
      .where("is_active", "=", true)
      .orderBy("category")
      .orderBy("error_code")
      .selectAll()
      .execute();
    return results.map(toErrorMessage);
  }

  /**
   * Get error messages by category
   */
  async getErrorMessagesByCategory(category: string): Promise<ErrorMessage[]> {
    const db = getDb();
    const results = await db
      .selectFrom("error_messages")
      .where("category", "=", category)
      .where("is_active", "=", true)
      .orderBy("error_code")
      .selectAll()
      .execute();

    return results.map((msg) => ({
      ...msg,
      suggestions: msg.suggestions ? JSON.parse(msg.suggestions as string) : undefined,
      metadata: msg.metadata ? JSON.parse(msg.metadata as string) : undefined,
    }));
  }

  /**
   * Update error message
   */
  async updateErrorMessage(id: string, updates: Partial<ErrorMessage>): Promise<void> {
    const db = getDb();

    const data: Record<string, unknown> = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Serialize JSON fields
    if (updates.suggestions) {
      data.suggestions = JSON.stringify(updates.suggestions);
    }
    if (updates.metadata) {
      data.metadata = JSON.stringify(updates.metadata);
    }

    await db.updateTable("error_messages").where("id", "=", id).set(data).execute();
  }

  /**
   * Create new error message
   */
  async createErrorMessage(
    message: Omit<ErrorMessage, "id" | "created_at" | "updated_at">
  ): Promise<ErrorMessage> {
    const db = getDb();

    const now = new Date().toISOString();
    const row: ErrorMessagesTable = {
      ...message,
      id: randomUUID(),
      suggestions: message.suggestions ? JSON.stringify(message.suggestions) : null,
      metadata: message.metadata ? JSON.stringify(message.metadata) : null,
      severity: message.severity ?? null,
      user_message: message.user_message ?? null,
      documentation_url: message.documentation_url ?? null,
      is_active: message.is_active ?? null,
      category: message.category ?? null,
      created_at: now,
      updated_at: now,
    };

    await db.insertInto("error_messages").values(row).execute();

    return this.getErrorMessage(message.error_code) as Promise<ErrorMessage>;
  }

  /**
   * Get warning config by code
   */
  async getWarningConfig(warningCode: string): Promise<WarningConfig | null> {
    const db = getDb();
    const result = await db
      .selectFrom("warning_configs")
      .where("warning_code", "=", warningCode)
      .where("is_active", "=", true)
      .selectAll()
      .executeTakeFirst();

    return result ? toWarningConfig(result) : null;
  }

  /**
   * Get all active warning configs
   */
  async getAllWarningConfigs(): Promise<WarningConfig[]> {
    const db = getDb();
    const results = await db
      .selectFrom("warning_configs")
      .where("is_active", "=", true)
      .orderBy("severity", "desc")
      .orderBy("warning_code")
      .selectAll()
      .execute();

    return results.map(toWarningConfig);
  }

  /**
   * Format error message with template variables
   */
  formatMessage(template: string, variables: Record<string, unknown>): string {
    let message = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      message = message.replace(new RegExp(placeholder, "g"), String(value));
    }
    return message;
  }

  /**
   * Log error occurrence
   */
  async logErrorOccurrence(
    occurrence: Omit<ErrorOccurrence, "id" | "created_at">
  ): Promise<string> {
    const db = getDb();

    const { context, ...rest } = occurrence;
    const id = randomUUID();

    await db
      .insertInto("error_occurrences")
      .values({
        ...rest,
        id,
        error_message_id: null,
        session_id: null,
        resolved_at: rest.resolved_at ?? null,
        user_id: rest.user_id ?? null,
        error_code: rest.error_code ?? null,
        error_message: rest.error_message ?? null,
        stack_trace: rest.stack_trace ?? null,
        component_stack: rest.component_stack ?? null,
        url: rest.url ?? null,
        user_agent: rest.user_agent ?? null,
        context_data: context ? JSON.stringify(context) : null,
        created_at: new Date().toISOString(),
      })
      .execute();

    return id;
  }

  /**
   * Mark error occurrence as reported
   */
  async markErrorAsReported(id: string): Promise<void> {
    const db = getDb();
    await db
      .updateTable("error_occurrences")
      .where("id", "=", id)
      .set({ is_reported: true })
      .execute();
  }

  /**
   * Get error statistics
   */
  async getErrorStats(days: number = 30) {
    const db = getDb();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const stats = await db
      .selectFrom("error_occurrences")
      .where("created_at", ">=", cutoffDate.toISOString())
      .select(["error_code", db.fn.countAll().as("count")])
      .groupBy("error_code")
      .orderBy("count", "desc")
      .limit(10)
      .execute();

    return stats.map((stat) => ({
      errorCode: stat.error_code ?? "unknown",
      count: Number(stat.count),
    }));
  }

  /**
   * Resolve error occurrence
   */
  async resolveErrorOccurrence(id: string): Promise<void> {
    const db = getDb();
    await db
      .updateTable("error_occurrences")
      .where("id", "=", id)
      .set({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
      })
      .execute();
  }
}

export const errorManagementService = new ErrorManagementService();
