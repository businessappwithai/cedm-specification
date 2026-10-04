/**
 * The reporting platform, as the gateway speaks to it: with the person's own
 * reporting session, which the gateway obtains by presenting a signed assertion
 * (`POST /api/auth/assertion`) and keeps sealed server-side.
 *
 * The platform decides what the person may run — `decideQueryRun` checks every
 * stored query against their data-source permissions at run time — so the
 * gateway never sees SQL and never runs any.
 */

import { ApplicationError } from "./application";

type Json = Record<string, unknown>;

export interface ReportSummary {
  id: string;
  name: string;
  description: string;
  savedQueryId: string | null;
}

export interface ReportPage {
  rows: Json[];
  totalRows: number;
  pageIndex: number;
  pageSize: number;
}

export interface ReportSession {
  /** The platform's session cookie, `name=value`, exactly as it set it. */
  cookie: string;
  /** The `Set-Cookie` header, relayed to the browser so embedded pages are signed in. */
  setCookie: string;
}

export class ReportingClient {
  constructor(private readonly apiUrl: string) {}

  private async request(path: string, init: RequestInit & { cookie?: string } = {}): Promise<{ status: number; body: any; headers: Headers }> {
    const headers = new Headers(init.headers);
    headers.set("accept", "application/json");
    if (init.body !== undefined) headers.set("content-type", "application/json");
    if (init.cookie) headers.set("cookie", init.cookie);
    let response: Response;
    try {
      response = await fetch(`${this.apiUrl}${path}`, { ...init, headers, redirect: "manual" });
    } catch (error) {
      throw new ApplicationError(502, "REPORTING_UNREACHABLE", `The reporting platform could not be reached: ${(error as Error).message}`);
    }
    const text = await response.text();
    let body: any = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { message: text.slice(0, 300) };
      }
    }
    return { status: response.status, body, headers: response.headers };
  }

  private fail(status: number, body: any, fallback: string): never {
    const message =
      (typeof body?.error?.message === "string" && body.error.message) ||
      (typeof body?.message === "string" && body.message) ||
      (typeof body?.error === "string" && body.error) ||
      fallback;
    const code = status === 401 ? "UNAUTHENTICATED" : status === 403 ? "FORBIDDEN" : status === 404 ? "NOT_FOUND" : "REPORTING_ERROR";
    throw new ApplicationError(status, code, message);
  }

  /** Exchange a signed assertion for a reporting session. */
  async signInWithAssertion(assertion: string): Promise<ReportSession> {
    const { status, body, headers } = await this.request("/auth/assertion", {
      method: "POST",
      body: JSON.stringify({ assertion }),
    });
    const setCookie = headers.get("set-cookie");
    if (status !== 200 || !setCookie) this.fail(status === 200 ? 502 : status, body, "The reporting platform did not accept the sign-in.");
    const cookie = setCookie.split(";")[0]?.trim();
    if (!cookie || !cookie.includes("=")) throw new ApplicationError(502, "REPORTING_ERROR", "The reporting platform set no session cookie.");
    return { cookie, setCookie };
  }

  async signOut(session: string): Promise<void> {
    await this.request("/auth/sign-out", { method: "POST", cookie: session, body: "{}" });
  }

  /** Saved reports, most recent first; the platform's list is not narrowed by permission. */
  async listReports(session: string, page: number, pageSize: number): Promise<{ items: ReportSummary[]; total: number }> {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    const { status, body } = await this.request(`/reports?${query}`, { cookie: session });
    if (status !== 200) this.fail(status, body, "The reporting platform did not list its reports.");
    const data = body?.data ?? {};
    return {
      items: ((data.items ?? []) as Json[]).map((item) => ({
        id: String(item.id),
        name: String(item.name ?? ""),
        description: String(item.description ?? ""),
        savedQueryId: typeof item.saved_query_id === "string" ? item.saved_query_id : null,
      })),
      total: Number(data.meta?.total ?? data.meta?.totalItems ?? 0),
    };
  }

  async report(session: string, id: string): Promise<ReportSummary> {
    const { status, body } = await this.request(`/reports/${encodeURIComponent(id)}`, { cookie: session });
    if (status !== 200) this.fail(status, body, "The reporting platform did not return that report.");
    const item = (body?.data ?? {}) as Json;
    return {
      id: String(item.id ?? id),
      name: String(item.name ?? ""),
      description: String(item.description ?? ""),
      savedQueryId: typeof item.saved_query_id === "string" ? item.saved_query_id : null,
    };
  }

  /** Run a saved report, one page; refused with 403 when the person may not read its tables. */
  async run(session: string, id: string, page: number, pageSize: number): Promise<ReportPage> {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    const { status, body } = await this.request(`/reports/${encodeURIComponent(id)}/data?${query}`, { cookie: session });
    if (status !== 200) this.fail(status, body, "The report could not be run.");
    const data = body?.data ?? {};
    return {
      rows: (data.rows ?? []) as Json[],
      totalRows: Number(data.totalRows ?? 0),
      pageIndex: Number(data.pageIndex ?? page),
      pageSize: Number(data.pageSize ?? pageSize),
    };
  }

  /** Whether a chart is drawn from the same saved query as the report. */
  async chartFor(session: string, savedQueryId: string): Promise<string | null> {
    const { status, body } = await this.request(`/charts?${new URLSearchParams({ page: "1", pageSize: "100" })}`, { cookie: session });
    if (status !== 200) return null;
    const items = ((body?.data?.items ?? []) as Json[]).filter((item) => item.saved_query_id === savedQueryId);
    return items.length > 0 ? String(items[0]!.id) : null;
  }

  /** The platform's own export, streamed back unchanged. */
  async export(session: string, id: string, format: string): Promise<Response> {
    return fetch(`${this.apiUrl}/reports/${encodeURIComponent(id)}/export`, {
      method: "POST",
      headers: { cookie: session, "content-type": "application/json" },
      body: JSON.stringify({ format }),
      redirect: "manual",
    });
  }
}
