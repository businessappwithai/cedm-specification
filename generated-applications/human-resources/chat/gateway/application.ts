/**
 * The generated application, as the gateway speaks to it: always with the
 * signed-in person's own token, never with a service account. Every answer has
 * therefore already passed the application's three authorisation gates
 * (`sys_access`, the model's `rbac` operations, workflow transitions); the
 * gateway adds no data access of its own and needs none.
 */

export class ApplicationError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

export interface ApplicationUser {
  pid: string;
  email: string;
  name: string;
  role: string | null;
}

export interface SignedIn {
  token: string;
  user: ApplicationUser;
  /** The application's own `Set-Cookie` for its session, relayed to the browser. */
  setCookie: string | null;
}

/** One entity the person may read, as the dashboard describes it. */
export interface EntityEntry {
  table: string;
  windowName: string;
  description: string;
  /** The front-end route of its window, e.g. `/sales-order`. Null for a line item. */
  route: string | null;
}

export interface Dashboard {
  isMaster: boolean;
  role: string | null;
  entities: EntityEntry[];
}

export interface ColumnMeta {
  column_name: string;
  name: string;
  is_key: boolean;
  is_identifier: boolean;
  is_updateable: boolean;
  sys_reference_id: number;
}

export interface EntityMeta {
  table: string;
  columns: ColumnMeta[];
  lifecycle: { statusField: string; finals: string[] } | null;
}

export interface TransactionStatus {
  field: string;
  value: string;
  label: string;
  isFinal: boolean;
}

type Json = Record<string, unknown>;

export class ApplicationClient {
  constructor(private readonly apiUrl: string) {}

  private async request(path: string, init: RequestInit & { token?: string } = {}): Promise<{ status: number; body: any; headers: Headers }> {
    const headers = new Headers(init.headers);
    headers.set("accept", "application/json");
    if (init.body !== undefined) headers.set("content-type", "application/json");
    if (init.token) headers.set("authorization", `Bearer ${init.token}`);
    let response: Response;
    try {
      response = await fetch(`${this.apiUrl}${path}`, { ...init, headers, redirect: "manual" });
    } catch (error) {
      throw new ApplicationError(502, "APPLICATION_UNREACHABLE", `The application could not be reached: ${(error as Error).message}`);
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
      (typeof body?.message === "string" && body.message) ||
      (typeof body?.error === "string" && body.error) ||
      fallback;
    const code =
      status === 401 ? "UNAUTHENTICATED" : status === 403 ? "FORBIDDEN" : status === 404 ? "NOT_FOUND" : "APPLICATION_ERROR";
    throw new ApplicationError(status, code, message);
  }

  /** Check a password with the application, and receive its token. */
  async signIn(email: string, password: string): Promise<SignedIn> {
    const { status, body, headers } = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (status !== 200 || typeof body?.token !== "string") {
      this.fail(status === 200 ? 502 : status, body, "The email or password was not accepted.");
    }
    return {
      token: body.token,
      user: {
        pid: String(body.user?.pid ?? ""),
        email: String(body.user?.email ?? email),
        name: String(body.user?.name ?? email),
        role: typeof body.user?.role === "string" ? body.user.role : null,
      },
      setCookie: headers.get("set-cookie"),
    };
  }

  async currentUser(token: string): Promise<ApplicationUser> {
    const { status, body } = await this.request("/auth/me", { token });
    if (status !== 200) this.fail(status, body, "The application session has ended.");
    return {
      pid: String(body.user?.pid ?? ""),
      email: String(body.user?.email ?? ""),
      name: String(body.user?.name ?? ""),
      role: typeof body.user?.role === "string" ? body.user.role : null,
    };
  }

  /** The entities this person may read — the same answer their dashboard gets. */
  async dashboard(token: string): Promise<Dashboard> {
    const { status, body } = await this.request("/me/dashboard", { token });
    if (status !== 200) this.fail(status, body, "The application did not describe what you may see.");
    const entities: EntityEntry[] = [];
    for (const group of (body?.data ?? []) as Json[]) {
      for (const table of (group.entities ?? []) as Json[]) {
        const windowName = String(table.window_name ?? table.name ?? table.table_name);
        entities.push({
          table: String(table.table_name),
          windowName,
          description: String(table.window_help ?? table.window_description ?? table.description ?? ""),
          // `entityHref` in the generated front end: the window name, lower-cased, spaces to dashes.
          route: table.window_name ? `/${String(table.window_name).toLowerCase().replace(/\s+/g, "-")}` : null,
        });
      }
    }
    return { isMaster: body?.isMaster === true, role: typeof body?.role === "string" ? body.role : null, entities };
  }

  async meta(token: string, table: string): Promise<EntityMeta> {
    const { status, body } = await this.request(`/bus/${encodeURIComponent(table)}/meta`, { token });
    if (status !== 200) this.fail(status, body, `The application did not describe ${table}.`);
    const lifecycle = body?.lifecycle;
    return {
      table,
      columns: (body?.columns ?? []) as ColumnMeta[],
      // `services::dictionary::Lifecycle`, serialised as written: snake_case.
      lifecycle:
        lifecycle && typeof lifecycle.status_field === "string"
          ? { statusField: lifecycle.status_field, finals: (lifecycle.finals ?? []).map(String) }
          : null,
    };
  }

  async search(
    token: string,
    table: string,
    options: { text?: string; filters?: Record<string, unknown>; page: number; pageSize: number }
  ): Promise<{ rows: Json[]; total: number }> {
    const query = new URLSearchParams({ page: String(options.page), limit: String(options.pageSize) });
    if (options.text) query.set("search", options.text);
    for (const [column, value] of Object.entries(options.filters ?? {})) {
      if (!/^[a-z_][a-z0-9_]*$/.test(column)) {
        throw new ApplicationError(400, "INVALID_FILTER", `"${column}" is not a column name.`);
      }
      if (value === null || typeof value === "object") {
        throw new ApplicationError(400, "INVALID_FILTER", `The filter on ${column} must be a single value.`);
      }
      query.set(`filter.${column}`, `equals:${String(value)}`);
    }
    const { status, body } = await this.request(`/bus/${encodeURIComponent(table)}?${query}`, { token });
    if (status !== 200) this.fail(status, body, `The application refused the search on ${table}.`);
    return { rows: (body?.data ?? []) as Json[], total: Number(body?.meta?.total ?? 0) };
  }

  async read(token: string, table: string, id: string): Promise<{ row: Json; status: TransactionStatus | null }> {
    const { status, body } = await this.request(`/bus/${encodeURIComponent(table)}/${encodeURIComponent(id)}`, { token });
    if (status !== 200) this.fail(status, body, "The application did not return that record.");
    const transaction = body?.transactionStatus;
    return {
      row: body as Json,
      status:
        transaction && typeof transaction.field === "string"
          ? {
              field: transaction.field,
              value: String(transaction.value ?? ""),
              label: String(transaction.label ?? transaction.value ?? ""),
              isFinal: transaction.isFinal === true,
            }
          : null,
    };
  }

  /** The workflow moves drawn out of `from`; the application still decides who may make them. */
  async transitions(token: string, table: string, from: string): Promise<Array<{ to: string; label: string }>> {
    const query = new URLSearchParams({ table, from });
    const { status, body } = await this.request(`/workflows/transitions?${query}`, { token });
    if (status !== 200) this.fail(status, body, "The application did not list the workflow moves.");
    // `controllers::workflow::transitions`: a bare array of drawn edges. It is
    // topology only — whether this person may make a move is decided by the
    // application when they confirm it, and that refusal is theirs to see.
    if (!Array.isArray(body)) throw new ApplicationError(502, "APPLICATION_ERROR", "Unexpected transitions response.");
    return (body as Json[]).map((edge) => ({
      to: String(edge.to),
      label: typeof edge.transition === "string" && edge.transition ? edge.transition : String(edge.to),
    }));
  }
}
