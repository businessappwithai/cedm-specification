/**
 * The eight business tools, on the gateway side.
 *
 * A host's tool call arrives on the internal listener with that host's secret;
 * the secret names the person, and their newest live credentials are what the
 * call acts with. Every read goes to the application or the reporting platform
 * *as that person*. What comes back to the model is shaped here, and three
 * things never appear in it: a record id (records are named by sealed refs), a
 * URL, and a credential.
 */

import { ApplicationClient, ApplicationError, type EntityEntry, type EntityMeta, type TransactionStatus } from "./application";
import type { SessionCredentials } from "./auth";
import type { GatewayConfig } from "./config";
import { deriveKey, openRecordRef, randomToken, sealRecordRef, type RecordTarget } from "./crypto";
import type { ChatDatabase } from "./db";
import type { ReportingClient } from "./reporting";
import type { Kysely } from "kysely";

type Json = Record<string, unknown>;

export class ToolRefusal extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ToolRefusal";
  }
}

export interface ViewDescriptor {
  type: "business-application";
  applicationViewId: string;
  title: string;
  operation: "view" | "create" | "update" | "transition";
  entity: string;
  expiresAt: string;
}

/** Columns the model never needs: identity, bookkeeping, and raw references. */
const HIDDEN_COLUMNS = new Set(["id", "version", "created_by", "updated_by", "deleted_at", "is_deleted"]);
const ENTITY_CACHE_MS = 60_000;

function humanise(value: string): string {
  const spaced = value.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export class BusinessTools {
  private readonly refKey: Buffer;
  private readonly entityCache = new Map<string, { at: number; entities: EntityEntry[] }>();
  private readonly metaCache = new Map<string, { at: number; meta: EntityMeta }>();

  constructor(
    private readonly config: GatewayConfig,
    private readonly db: Kysely<ChatDatabase>,
    private readonly application: ApplicationClient,
    private readonly reporting: ReportingClient | null
  ) {
    this.refKey = deriveKey(config.authSecret, "record-ref");
  }

  async handle(operation: string, args: Json, who: SessionCredentials): Promise<unknown> {
    try {
      switch (operation) {
        case "search_records":
          return await this.searchRecords(args, who);
        case "get_record_summary":
          return await this.recordSummary(args, who);
        case "open_record":
          return await this.openRecord(args, who, "view");
        case "open_update_form":
          return await this.openRecord(args, who, "update");
        case "request_approval":
          return await this.openRecord(args, who, "transition");
        case "open_create_form":
          return await this.openCreateForm(args, who);
        case "search_reports":
          return await this.searchReports(args, who);
        case "run_approved_report":
          return await this.runReport(args, who);
        default:
          throw new ToolRefusal(404, "UNKNOWN_TOOL", `There is no business tool called ${operation}.`);
      }
    } catch (error) {
      if (error instanceof ApplicationError) {
        if (error.status === 401) {
          throw new ToolRefusal(401, "SESSION_ENDED", "The person's application session has ended; they need to sign in to the chat again.");
        }
        throw new ToolRefusal(error.status, error.code, error.message);
      }
      throw error;
    }
  }

  // ── entities ────────────────────────────────────────────────────────────────

  private async entities(who: SessionCredentials): Promise<EntityEntry[]> {
    const cached = this.entityCache.get(who.sessionId);
    if (cached && Date.now() - cached.at < ENTITY_CACHE_MS) return cached.entities;
    const { entities } = await this.application.dashboard(who.appToken);
    this.entityCache.set(who.sessionId, { at: Date.now(), entities });
    return entities;
  }

  private async meta(who: SessionCredentials, table: string): Promise<EntityMeta> {
    const key = `${who.sessionId}:${table}`;
    const cached = this.metaCache.get(key);
    if (cached && Date.now() - cached.at < ENTITY_CACHE_MS) return cached.meta;
    const meta = await this.application.meta(who.appToken, table);
    this.metaCache.set(key, { at: Date.now(), meta });
    return meta;
  }

  /** Find an entity by its window name, its table or its bare name, case and spacing aside. */
  private async resolveEntity(who: SessionCredentials, name: unknown): Promise<EntityEntry> {
    if (typeof name !== "string" || !name.trim()) throw new ToolRefusal(400, "ENTITY_REQUIRED", "Name the entity to search.");
    const wanted = name.trim().toLowerCase().replace(/[\s_-]+/g, "");
    const entities = await this.entities(who);
    const match = entities.find((entity) =>
      [entity.windowName, entity.table, entity.table.replace(/^bus_/, "")].some(
        (candidate) => candidate.toLowerCase().replace(/[\s_-]+/g, "") === wanted
      )
    );
    if (!match) {
      throw new ToolRefusal(
        404,
        "ENTITY_NOT_AVAILABLE",
        `"${name}" is not an entity this person can see. They can see: ${entities.map((e) => e.windowName).join(", ") || "none"}.`
      );
    }
    return match;
  }

  private target(who: SessionCredentials, ref: unknown): RecordTarget {
    const target = typeof ref === "string" ? openRecordRef(this.refKey, who.userId, ref) : null;
    if (!target) {
      throw new ToolRefusal(400, "INVALID_REF", "That is not a record reference issued to this person. Search for the record first.");
    }
    return target;
  }

  private label(meta: EntityMeta, row: Json, fallback: string): string {
    const parts = meta.columns
      .filter((column) => column.is_identifier)
      .map((column) => row[column.column_name])
      .filter((value) => value !== null && value !== undefined && value !== "")
      .map(String);
    return parts.length > 0 ? parts.join(" · ") : fallback;
  }

  /** The row as the model may see it: values by column label, no ids, no raw references. */
  private fields(meta: EntityMeta, row: Json): Json {
    const out: Json = {};
    for (const column of meta.columns) {
      const name = column.column_name;
      if (column.is_key || HIDDEN_COLUMNS.has(name) || name.endsWith("_id")) continue;
      if (!(name in row)) continue;
      out[column.name || name] = row[name] ?? null;
    }
    return out;
  }

  private status(meta: EntityMeta, row: Json, reported: TransactionStatus | null): TransactionStatus | null {
    if (reported) return reported;
    if (!meta.lifecycle) return null;
    const value = row[meta.lifecycle.statusField];
    if (typeof value !== "string") return null;
    return {
      field: meta.lifecycle.statusField,
      value,
      label: humanise(value),
      isFinal: meta.lifecycle.finals.includes(value),
    };
  }

  // ── reads ───────────────────────────────────────────────────────────────────

  private async searchRecords(args: Json, who: SessionCredentials) {
    const entity = await this.resolveEntity(who, args.entity);
    const meta = await this.meta(who, entity.table);
    const page = Number.isInteger(args.page) && (args.page as number) > 0 ? (args.page as number) : 1;
    const pageSize = Number.isInteger(args.pageSize) ? Math.min(50, Math.max(1, args.pageSize as number)) : 20;
    const filters = args.filters && typeof args.filters === "object" ? (args.filters as Json) : undefined;
    const { rows, total } = await this.application.search(who.appToken, entity.table, {
      text: typeof args.text === "string" ? args.text : undefined,
      filters,
      page,
      pageSize,
    });
    return {
      entity: entity.table.replace(/^bus_/, ""),
      label: entity.windowName,
      total,
      page,
      rows: rows.map((row) => ({
        ref: sealRecordRef(this.refKey, who.userId, { table: entity.table, id: String(row.id) }),
        label: this.label(meta, row, entity.windowName),
        fields: this.fields(meta, row),
        status: this.status(meta, row, null),
      })),
    };
  }

  private async recordSummary(args: Json, who: SessionCredentials) {
    const target = this.target(who, args.ref);
    const entities = await this.entities(who);
    const entity = entities.find((e) => e.table === target.table);
    if (!entity) throw new ToolRefusal(403, "FORBIDDEN", "This person can no longer see records of that kind.");
    const meta = await this.meta(who, target.table);
    const { row, status: reported } = await this.application.read(who.appToken, target.table, target.id);
    const status = this.status(meta, row, reported);
    const transitions =
      status && !status.isFinal
        ? (await this.application.transitions(who.appToken, target.table, status.value)).map((edge) => ({
            to: edge.to,
            label: edge.label === edge.to ? humanise(edge.to) : edge.label,
          }))
        : [];
    return {
      ref: String(args.ref),
      entity: entity.windowName,
      label: this.label(meta, row, entity.windowName),
      fields: this.fields(meta, row),
      status,
      transitions,
    };
  }

  // ── opens ───────────────────────────────────────────────────────────────────

  private async mintView(
    who: SessionCredentials,
    kind: "business-application" | "enterprise-report",
    target: Json,
    operation: string,
    title: string
  ): Promise<{ id: string; expiresAt: Date }> {
    const id = `v_${randomToken(18)}`;
    const expiresAt = new Date(Date.now() + this.config.viewTtlSeconds * 1000);
    await this.db
      .insertInto("app_views")
      .values({ id, user_id: who.userId, kind, target: JSON.stringify(target), operation, title, expires_at: expiresAt })
      .execute();
    return { id, expiresAt };
  }

  private async openRecord(args: Json, who: SessionCredentials, operation: "view" | "update" | "transition"): Promise<ViewDescriptor> {
    const target = this.target(who, args.ref);
    const entity = (await this.entities(who)).find((e) => e.table === target.table);
    if (!entity) throw new ToolRefusal(403, "FORBIDDEN", "This person can no longer see records of that kind.");
    if (!entity.route) {
      throw new ToolRefusal(409, "NO_SCREEN", `${entity.windowName} records are opened from their parent record.`);
    }
    const meta = await this.meta(who, target.table);
    // Read it now: an id the person cannot read must not become a view.
    const { row, status: reported } = await this.application.read(who.appToken, target.table, target.id);
    const status = this.status(meta, row, reported);
    const label = this.label(meta, row, entity.windowName);

    const query = new URLSearchParams({ embed: "1" });
    if (operation === "update") {
      if (status?.isFinal) {
        throw new ToolRefusal(409, "RECORD_FINAL", `${label} is ${status.label}, a final state: the transaction is complete and cannot be changed.`);
      }
      query.set("edit", "1");
    }
    if (operation === "transition") {
      const to = typeof args.transition === "string" ? args.transition : "";
      if (!status) throw new ToolRefusal(409, "NO_WORKFLOW", `${entity.windowName} records have no workflow.`);
      if (status.isFinal) {
        throw new ToolRefusal(409, "RECORD_FINAL", `${label} is ${status.label}, a final state: it has no further moves.`);
      }
      const moves = await this.application.transitions(who.appToken, target.table, status.value);
      if (!moves.some((move) => move.to === to)) {
        throw new ToolRefusal(
          400,
          "NO_SUCH_MOVE",
          `${label} cannot move from ${status.label} to "${to}". The moves from here are: ${moves.map((m) => m.to).join(", ") || "none"}.`
        );
      }
      query.set("transition", to);
    }
    const title = `${entity.windowName}: ${label}`;
    const view = await this.mintView(
      who,
      "business-application",
      { path: `${entity.route}/${encodeURIComponent(target.id)}?${query}` },
      operation,
      title
    );
    return {
      type: "business-application",
      applicationViewId: view.id,
      title,
      operation,
      entity: entity.windowName,
      expiresAt: view.expiresAt.toISOString(),
    };
  }

  private async openCreateForm(args: Json, who: SessionCredentials): Promise<ViewDescriptor> {
    const entity = await this.resolveEntity(who, args.entity);
    if (!entity.route) {
      throw new ToolRefusal(409, "NO_SCREEN", `${entity.windowName} records are created from their parent record.`);
    }
    const title = `New ${entity.windowName}`;
    const view = await this.mintView(who, "business-application", { path: `${entity.route}/new?embed=1` }, "create", title);
    return {
      type: "business-application",
      applicationViewId: view.id,
      title,
      operation: "create",
      entity: entity.windowName,
      expiresAt: view.expiresAt.toISOString(),
    };
  }

  // ── reports ─────────────────────────────────────────────────────────────────

  private reportSession(who: SessionCredentials): { reporting: ReportingClient; session: string } {
    if (!this.reporting) throw new ToolRefusal(503, "REPORTING_NOT_CONFIGURED", "This application has no reporting platform.");
    if (!who.reportSession) {
      throw new ToolRefusal(503, "REPORTING_UNAVAILABLE", "The reporting platform did not sign this person in; reports are unavailable for this session.");
    }
    return { reporting: this.reporting, session: who.reportSession };
  }

  private async searchReports(args: Json, who: SessionCredentials) {
    const { reporting, session } = this.reportSession(who);
    const words = typeof args.text === "string" ? args.text.toLowerCase().split(/\s+/).filter(Boolean) : [];
    const candidates = [];
    // The platform's list is not narrowed by permission, so narrow by text
    // first and then keep only what this person can actually run.
    for (let page = 0; page < 20 && candidates.length < 60; page++) {
      const { items, total } = await reporting.listReports(session, page, 100);
      for (const item of items) {
        const haystack = `${item.name} ${item.description}`.toLowerCase();
        if (words.every((word) => haystack.includes(word))) candidates.push(item);
      }
      if ((page + 1) * 100 >= total || items.length === 0) break;
    }
    const runnable = [];
    for (const report of candidates.slice(0, 20)) {
      try {
        await reporting.run(session, report.id, 0, 1);
        runnable.push({ reportId: report.id, title: report.name, description: report.description });
      } catch (error) {
        if (!(error instanceof ApplicationError) || error.status !== 403) throw error;
      }
    }
    return { reports: runnable };
  }

  private async runReport(args: Json, who: SessionCredentials) {
    const { reporting, session } = this.reportSession(who);
    const reportId = typeof args.reportId === "string" ? args.reportId : "";
    if (!reportId) throw new ToolRefusal(400, "REPORT_REQUIRED", "Name the report to run, by the id search_reports gave.");
    const report = await reporting.report(session, reportId);
    const first = await reporting.run(session, reportId, 0, 20);
    // The report's own headers, in its own order — what a person sees on the
    // report page — and the result's columns only when it configures none.
    const configured = report.columns.length > 0
      ? report.columns
      : Object.keys(first.rows[0] ?? {}).map((field) => ({ field, header: field }));
    const columns = configured.map((column) => column.header);
    const preview = first.rows.map((row) =>
      Object.fromEntries(configured.map((column) => [column.header, row[column.field] ?? null]))
    );
    const chartId = report.savedQueryId ? await reporting.chartFor(session, report.savedQueryId) : null;
    const view = await this.mintView(
      who,
      "enterprise-report",
      { reportId, chartId, params: args.params && typeof args.params === "object" ? args.params : {} },
      "report",
      report.name
    );
    return {
      type: "enterprise-report" as const,
      reportViewId: view.id,
      title: report.name,
      columns,
      rowCount: first.totalRows,
      preview,
      hasChart: chartId !== null,
      expiresAt: view.expiresAt.toISOString(),
    };
  }
}
