/**
 * View ids: what a chat node holds instead of a URL.
 *
 * A tool mints one (`tools.ts`), the node loads `/_/views/<id>/open`, and the
 * gateway — not the browser, not the model — decides where that goes:
 *
 * - it is the signed-in person's own view, else 404 (another person's id is not
 *   distinguishable from a made-up one);
 * - it has not expired, else 410 and a Re-open action;
 * - the person may still read what it points at, checked again now, against
 *   the application, because roles change between minting and opening.
 *
 * Reports are served the same way: their rows and their export are fetched
 * through the gateway with the person's reporting session, page by page,
 * never written into the conversation log.
 *
 * `POST /_/views/<id>/saved` is how the conversation learns that a record was
 * saved in an embedded screen. The browser says *which* record; the gateway
 * reads it back from the application and writes the notice itself, so a forged
 * message can make the chat re-read a record, never claim something happened.
 */

import type { Kysely } from "kysely";
import { ApplicationClient, ApplicationError } from "./application";
import type { SessionCredentials } from "./auth";
import type { GatewayConfig } from "./config";
import { deriveKey, randomToken, sealRecordRef } from "./crypto";
import type { ChatDatabase } from "./db";
import type { ReportingClient } from "./reporting";
import { expiredPage, notFoundPage } from "./pages";

type Json = Record<string, unknown>;

const json = (status: number, body: unknown) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

export class ViewService {
  private readonly refKey: Buffer;

  constructor(
    private readonly config: GatewayConfig,
    private readonly db: Kysely<ChatDatabase>,
    private readonly application: ApplicationClient,
    private readonly reporting: ReportingClient | null
  ) {
    this.refKey = deriveKey(config.authSecret, "record-ref");
  }

  async handle(request: Request, rest: string, who: SessionCredentials): Promise<Response> {
    const [id, action = ""] = rest.split("/");
    if (!id || !/^v_[A-Za-z0-9_-]{10,64}$/.test(id)) return json(404, { code: "NOT_FOUND", message: "No such view." });
    const view = await this.db.selectFrom("app_views").selectAll().where("id", "=", id).executeTakeFirst();
    if (!view || view.user_id !== who.userId) {
      return action === "open"
        ? new Response(notFoundPage(this.config.basePath), { status: 404, headers: { "content-type": "text/html; charset=utf-8" } })
        : json(404, { code: "NOT_FOUND", message: "No such view." });
    }
    const target = (typeof view.target === "string" ? JSON.parse(view.target) : view.target) as Json;
    const expired = view.expires_at.getTime() < Date.now();

    try {
      switch (`${request.method} ${action}`) {
        case "GET open":
          if (expired) {
            return new Response(expiredPage(this.config.basePath, view.title), {
              status: 410,
              headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
            });
          }
          return await this.open(view.kind, target, who, new URL(request.url).searchParams.get("part"));
        case "GET rows":
          if (expired) return json(410, { code: "EXPIRED", message: "This view has expired; re-open it." });
          return await this.rows(request, target, who);
        case "GET export":
          if (expired) return json(410, { code: "EXPIRED", message: "This view has expired; re-open it." });
          return await this.export(request, target, who);
        case "POST saved":
          return await this.saved(request, view.kind, target, who);
        case "POST reopen":
          return await this.reopen(view, who);
        default:
          return json(404, { code: "NOT_FOUND", message: "No such view action." });
      }
    } catch (error) {
      if (error instanceof ApplicationError) return json(error.status, { code: error.code, message: error.message });
      throw error;
    }
  }

  /**
   * A fresh id for the same target, after the same checks an open makes, for a
   * node whose id expired. The old id stays expired.
   */
  private async reopen(
    view: { kind: "business-application" | "enterprise-report"; target: unknown; operation: string; title: string },
    who: SessionCredentials
  ): Promise<Response> {
    const target = (typeof view.target === "string" ? JSON.parse(view.target) : view.target) as Json;
    const check = await this.open(view.kind, target, who);
    if (check.status !== 303) return check;
    const id = `v_${randomToken(18)}`;
    const expiresAt = new Date(Date.now() + this.config.viewTtlSeconds * 1000);
    await this.db
      .insertInto("app_views")
      .values({ id, user_id: who.userId, kind: view.kind, target: JSON.stringify(target), operation: view.operation, title: view.title, expires_at: expiresAt })
      .execute();
    return json(200, { viewId: id, expiresAt: expiresAt.toISOString() });
  }

  /** Re-check access, then send the browser to the screen itself. */
  private async open(kind: string, target: Json, who: SessionCredentials, part: string | null = null): Promise<Response> {
    if (kind === "business-application") {
      const path = String(target.path ?? "");
      const record = /^\/[^/?]+\/([^/?]+)(\?|$)/.exec(path);
      const entityRoute = path.split("/")[1]?.split("?")[0] ?? "";
      const { entities } = await this.application.dashboard(who.appToken);
      const entity = entities.find((e) => e.route === `/${entityRoute}`);
      if (!entity) return json(403, { code: "FORBIDDEN", message: "You can no longer open records of this kind." });
      if (record && record[1] !== "new") await this.application.read(who.appToken, entity.table, decodeURIComponent(record[1]!));
      return Response.redirect(`${this.config.publicOrigin}${this.config.appPublicPath}${path}`, 303);
    }
    if (!this.reporting || !who.reportSession) return json(503, { code: "REPORTING_UNAVAILABLE", message: "Reports are unavailable." });
    const reportId = String(target.reportId ?? "");
    // Running the report re-checks that this person may still read its tables;
    // the chart is drawn from the same saved query, so it is covered by the
    // same check, and its own data endpoint checks again.
    await this.reporting.run(who.reportSession, reportId, 0, 1);
    if (part === "chart") {
      const chartId = typeof target.chartId === "string" ? target.chartId : "";
      if (!chartId) return json(404, { code: "NO_CHART", message: "This report has no chart." });
      return Response.redirect(
        `${this.config.publicOrigin}${this.config.reportPublicPath}/charts/viewer/${encodeURIComponent(chartId)}?embed=1`,
        303
      );
    }
    return Response.redirect(
      `${this.config.publicOrigin}${this.config.reportPublicPath}/reports/${encodeURIComponent(reportId)}/viewer?embed=1`,
      303
    );
  }

  private async rows(request: Request, target: Json, who: SessionCredentials): Promise<Response> {
    if (!this.reporting || !who.reportSession) return json(503, { code: "REPORTING_UNAVAILABLE", message: "Reports are unavailable." });
    const url = new URL(request.url);
    const page = Math.max(0, Number.parseInt(url.searchParams.get("page") ?? "0", 10) || 0);
    const pageSize = Math.min(200, Math.max(1, Number.parseInt(url.searchParams.get("pageSize") ?? "50", 10) || 50));
    const reportId = String(target.reportId);
    const [data, report] = await Promise.all([
      this.reporting.run(who.reportSession, reportId, page, pageSize),
      this.reporting.report(who.reportSession, reportId),
    ]);
    // The report's own headers travel with the rows, so the card shows what the
    // report page shows rather than raw field names.
    return json(200, { ...data, columns: report.columns });
  }

  private async export(request: Request, target: Json, who: SessionCredentials): Promise<Response> {
    if (!this.reporting || !who.reportSession) return json(503, { code: "REPORTING_UNAVAILABLE", message: "Reports are unavailable." });
    const format = new URL(request.url).searchParams.get("format") ?? "csv";
    if (!["csv", "xlsx", "pdf"].includes(format)) return json(400, { code: "INVALID_FORMAT", message: "Export as csv, xlsx or pdf." });
    const upstream = await this.reporting.export(who.reportSession, String(target.reportId), format);
    const headers = new Headers({ "cache-control": "no-store" });
    for (const name of ["content-type", "content-disposition", "content-length"]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  }

  /**
   * Turn "the embedded form saved record X" into a notice the gateway vouches
   * for: the record is read back as the person, and its label and status come
   * from that read.
   */
  private async saved(request: Request, kind: string, target: Json, who: SessionCredentials): Promise<Response> {
    if (kind !== "business-application") return json(400, { code: "NOT_A_FORM", message: "Only application views save records." });
    let body: Json;
    try {
      body = (await request.json()) as Json;
    } catch {
      return json(400, { code: "INVALID_JSON", message: "Expected JSON." });
    }
    const id = typeof body.id === "string" ? body.id : "";
    const operation =
      body.operation === "create"
        ? "created"
        : body.operation === "delete"
          ? "deleted"
          : body.operation === "transition"
            ? "moved"
            : "updated";
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) return json(400, { code: "INVALID_RECORD", message: "Expected the saved record's id." });

    // The view names the record it opened, except a create form: a screen
    // opened on one record reports on that record and no other.
    const path = String(target.path ?? "");
    const [routePart = "", recordPart = ""] = path.split("?")[0]?.split("/").filter(Boolean) ?? [];
    const opened = decodeURIComponent(recordPart);
    if (opened !== "new" && opened !== id) {
      return json(400, { code: "NOT_THIS_RECORD", message: "This screen was opened on a different record." });
    }
    const { entities } = await this.application.dashboard(who.appToken);
    const entity = entities.find((e) => e.route === `/${routePart}`);
    if (!entity) return json(403, { code: "FORBIDDEN", message: "You can no longer see records of this kind." });

    if (operation === "deleted") {
      // Said only once the application confirms it: the record is gone.
      try {
        await this.application.read(who.appToken, entity.table, id);
      } catch (error) {
        if (error instanceof ApplicationError && error.status === 404) {
          return json(200, { notice: `${entity.windowName} deleted in the application.` });
        }
        throw error;
      }
      return json(409, { code: "NOT_DELETED", message: "The application still holds this record." });
    }
    const meta = await this.application.meta(who.appToken, entity.table);
    const { row, status } = await this.application.read(who.appToken, entity.table, id);
    const label =
      meta.columns
        .filter((column) => column.is_identifier)
        .map((column) => row[column.column_name])
        .filter((value) => value !== null && value !== undefined && value !== "")
        .map(String)
        .join(" · ") || entity.windowName;
    const statusText = status ? ` — status ${status.label}${status.isFinal ? " (final: the transaction is complete)" : ""}` : "";
    return json(200, {
      // "Opportunity Opportunity 1" when the record is named after its kind.
      notice: `${label.toLowerCase().startsWith(entity.windowName.toLowerCase()) ? label : `${entity.windowName} ${label}`} ${operation} in the application${statusText}.`,
      ref: sealRecordRef(this.refKey, who.userId, { table: entity.table, id }),
      version: typeof row.version === "number" ? row.version : null,
    });
  }
}
