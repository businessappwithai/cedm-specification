/**
 * Enterprise Reporting stack generation target.
 *
 * Generates TanStack Start + Kysely + PostgreSQL application code from an EML
 * model, following the conventions of this repository:
 *
 *   src/server-fns/<entity>.ts           createServerFn with .inputValidator()
 *   src/routes/_authed/<entity>/index.tsx list page (TanStack Table + shadcn/ui)
 *   src/routes/_authed/<entity>/$id.tsx   detail/edit page (shadcn/ui form)
 *   src/lib/db/migrations/<ts>_create.ts  Kysely migration (PostgreSQL)
 *   KYSELY_TYPES.md                       snippet for kysely-db.ts Database interface
 */

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { EmlAttribute, EmlEntity, EmlIndex, EmlModel } from "../model.ts";
import { camelCase, kebabCase, plural, toSnakeCase } from "../util.ts";

export interface EnterpriseReportingOptions {
  outDir: string;
  appName: string;
}

// --- Naming helpers -----------------------------------------------------------

/** snake_case plural table name, e.g. "ReportItem" → "report_items" */
function tbl(e: EmlEntity): string {
  return e.tableName || plural(toSnakeCase(e.name));
}

/** kebab-case URL segment, e.g. "report_items" → "report-items" */
function slug(e: EmlEntity): string {
  return tbl(e).replace(/_/g, "-");
}

/** Human-readable label for a field name */
function toLabel(name: string): string {
  return name.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// --- Type mapping -------------------------------------------------------------

function tsType(attr: EmlAttribute): string {
  switch (attr.type) {
    case "integer":
    case "decimal":
      return "number";
    case "boolean":
      return "boolean";
    case "date":
    case "datetime":
      return "Date";
    case "json":
      return "Record<string, unknown>";
    default:
      return "string";
  }
}

/**
 * The Kysely column type. A date is read back as a \`Date\` but written as the
 * ISO string the form and the input schema carry, so its insert and update
 * types say so; every other column is read and written as one type.
 */
function kyselyColumnType(attr: EmlAttribute): string {
  return attr.type === "date" || attr.type === "datetime"
    ? "ColumnType<Date, Date | string, Date | string>"
    : tsType(attr);
}

// PostgreSQL types. This platform runs PostgreSQL and nothing else — the
// config DB, the knowledge graph and every generated table — so the DDL below
// has to be PostgreSQL's. It used to be MySQL's (INT, TINYINT(1), DATETIME,
// JSON, backtick-quoted identifiers, UUID(), ON UPDATE CURRENT_TIMESTAMP),
// which no database this project talks to would accept.
function ddlType(attr: EmlAttribute): string {
  switch (attr.type) {
    case "integer":
      return "INTEGER";
    case "decimal":
      return "NUMERIC(10,2)";
    case "boolean":
      return "BOOLEAN";
    case "date":
      return "DATE";
    case "datetime":
      return "TIMESTAMPTZ";
    case "text":
      return "TEXT";
    case "json":
      return "JSONB";
    default:
      return attr.maxLength ? `VARCHAR(${attr.maxLength})` : "VARCHAR(255)";
  }
}

// --- Main entry point ---------------------------------------------------------

export function generateEnterpriseReporting(
  model: EmlModel,
  opts: EnterpriseReportingOptions
): string[] {
  const written: string[] = [];
  const { outDir } = opts;

  for (const e of model.entities) {
    const routeDir = path.join(outDir, `src/routes/_authed/${slug(e)}`);
    mkdirSync(path.join(outDir, "src/server-fns"), { recursive: true });
    mkdirSync(routeDir, { recursive: true });

    const sfFile = `src/server-fns/${toSnakeCase(e.name)}.ts`;
    writeFileSync(path.join(outDir, sfFile), serverFnsFile(e, model));
    written.push(sfFile);

    const listFile = `src/routes/_authed/${slug(e)}/index.tsx`;
    writeFileSync(path.join(outDir, listFile), listPageFile(e));
    written.push(listFile);

    const detailFile = `src/routes/_authed/${slug(e)}/$id.tsx`;
    writeFileSync(path.join(outDir, detailFile), detailPageFile(e));
    written.push(detailFile);
  }

  const migDir = path.join(outDir, "src/lib/db/migrations");
  mkdirSync(migDir, { recursive: true });
  const migFile = `src/lib/db/migrations/${Date.now()}_create_tables.ts`;
  writeFileSync(path.join(outDir, migFile), migrationFile(model));
  written.push(migFile);

  writeFileSync(path.join(outDir, "KYSELY_TYPES.md"), kyselyTypesFile(model));
  written.push("KYSELY_TYPES.md");

  writeFileSync(path.join(outDir, "README.md"), readmeFile(model, opts));
  written.push("README.md");

  return written;
}

// --- Server functions ---------------------------------------------------------

function serverFnsFile(e: EmlEntity, model: EmlModel): string {
  const Type = e.name;
  const tableName = tbl(e);
  const pk = e.primaryKey || "id";
  const optimistic = e.concurrency !== "last-write-wins";
  const machine = model.workflows.find((w) => w.kind === "state" && w.entity === e.name);
  const finals = machine?.final ?? [];
  const statusField = machine?.statusField ?? "status";
  /** The write's final-state condition, for an entity whose machine has finals. */
  const finalsWhere = (name: string) =>
    finals.length
      ? `    ${name} = ${name}.where((eb) =>\n      eb.or([eb("${statusField}", "is", null), eb("${statusField}", "not in", ${JSON.stringify(finals)})])\n    );`
      : "";
  const editable = e.attributes.filter((a) => !a.isPrimaryKey);
  const enumMap = Object.fromEntries(model.enums.map((en) => [en.name, en.values]));

  const inputTypeFields = editable
    .map((a) => {
      const opt = a.required ? "" : "?";
      return `  ${a.name}${opt}: ${tsType(a)};`;
    })
    .join("\n");

  const zodFields = editable
    .map((a) => {
      const enumRef = a.enumRef ? enumMap[a.enumRef] : undefined;
      let zodExpr: string;
      if (enumRef) {
        const vals = enumRef.map((v) => `"${v}"`).join(", ");
        zodExpr = `z.enum([${vals}])`;
      } else {
        switch (a.type) {
          case "integer":
            zodExpr = "z.number().int()";
            break;
          case "decimal":
            zodExpr = "z.number()";
            break;
          case "boolean":
            zodExpr = "z.boolean()";
            break;
          default:
            zodExpr = a.maxLength ? `z.string().max(${a.maxLength})` : "z.string()";
        }
      }
      if (!a.required) zodExpr += ".optional()";
      return `  ${a.name}: ${zodExpr},`;
    })
    .join("\n");

  return `import { createServerFn } from "@tanstack/react-start";
import { sql } from "kysely";
import { getDb } from "@/lib/db/kysely-db";
import { requireAuth } from "@/lib/auth/middleware";
import { NotFoundError } from "@/lib/server-fns/with-error-handler";
import { z } from "zod";

// --------------- Types --------------------------------------------------------

export type ${Type} = {
  ${pk}: string;
${editable.map((a) => `  ${a.name}${a.required ? "" : "?"}: ${tsType(a)} | null;`).join("\n")}
  /** The optimistic-lock counter: every write advances it. */
  version: number;
  created_at: Date;
  updated_at: Date;
};

const ${Type}InputSchema = z.object({
${zodFields}
});

type ${Type}Input = z.infer<typeof ${Type}InputSchema>;

// --------------- Server functions --------------------------------------------

export const list${Type}sFn = createServerFn({ method: "GET" })
  .inputValidator((input: { page?: number; pageSize?: number }) => input)
  .handler(async ({ data }) => {
    await requireAuth();
    const page = data.page ?? 0;
    const pageSize = Math.min(data.pageSize ?? 50, 1000);
    const [items, countRow] = await Promise.all([
      getDb()
        .selectFrom("${tableName}")
        .selectAll()
        .orderBy("created_at", "desc")
        .limit(pageSize)
        .offset(page * pageSize)
        .execute(),
      getDb()
        .selectFrom("${tableName}")
        .select((eb) => eb.fn.countAll().as("count"))
        .executeTakeFirstOrThrow(),
    ]);
    return { items, total: Number(countRow.count), page, pageSize };
  });

export const get${Type}Fn = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data: { id } }) => {
    await requireAuth();
    return getDb()
      .selectFrom("${tableName}")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirstOrThrow();
  });

export const create${Type}Fn = createServerFn({ method: "POST" })
  .inputValidator((input: ${Type}Input) => ${Type}InputSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAuth();
    const id = crypto.randomUUID();
    await getDb().insertInto("${tableName}").values({ id, ...data, version: 1 }).execute();
    return { id, version: 1 };
  });

export const update${Type}Fn = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { id: string; version?: number } & Partial<${Type}Input>) => input
  )
  .handler(async ({ data: { id, version, ...rest } }): Promise<WriteResult> => {
    await requireAuth();
    const db = getDb();
    const current = await db
      .selectFrom("${tableName}")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    if (!current) throw new NotFoundError("${Type}", id);
    const refused = precondition(current as unknown as Row, version);
    if (refused) return refused;

    // The version and the final-state test are conditions of the one UPDATE,
    // so a save that landed in between is refused rather than overwritten.
    let update = db
      .updateTable("${tableName}")
      .set({
        ...(${Type}InputSchema.partial().parse(rest) as Record<string, unknown>),
        version: sql\`version + 1\`,
        updated_at: new Date(),
      } as never)
      .where("id", "=", id);
    if (version !== undefined) update = update.where("version", "=", version);
${finalsWhere("update")}
    const row = await update.returningAll().executeTakeFirst();
    if (row) return { ok: true, row: row as unknown as Row };
    return refusedNow(id, version);
  });

export const delete${Type}Fn = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; version?: number }) => input)
  .handler(async ({ data: { id, version } }): Promise<WriteResult> => {
    await requireAuth();
    const db = getDb();
    const current = await db
      .selectFrom("${tableName}")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    if (!current) throw new NotFoundError("${Type}", id);
    const refused = precondition(current as unknown as Row, version);
    if (refused) return refused;

    let remove = db.deleteFrom("${tableName}").where("id", "=", id);
    if (version !== undefined) remove = remove.where("version", "=", version);
${finalsWhere("remove")}
    const row = await remove.returningAll().executeTakeFirst();
    if (row) return { ok: true, row: row as unknown as Row };
    return refusedNow(id, version);
  });

// --------------- Optimistic locking -------------------------------------------
//
// Every row carries a \`version\` that every write advances. An update or a
// delete names the version it was read at; one made against a version somebody
// else has since replaced is refused with the record as it now stands, so the
// screen can offer to refresh or to overwrite. ${optimistic ? "This entity is optimistic: a write that names no version is refused." : "This entity is last-write-wins: a write that names no version is accepted."}${finals.length ? ` A record whose \`${statusField}\` is ${finals.map((f) => `\`${f}\``).join(" or ")} is a completed transaction and closed to every update and delete.` : ""}
//
// The outcome is returned, not thrown: a refusal is an answer the screen acts
// on, and a thrown error reaches the client without its fields.

type Value = string | number | boolean | Date | null | Value[] | { [key: string]: Value };
type Row = { [column: string]: Value };

export type WriteResult =
  | { ok: true; row: Row }
  | {
      ok: false;
      error: "VERSION_CONFLICT" | "RECORD_FINAL" | "PRECONDITION_REQUIRED";
      message: string;
      conflict?: {
        yourVersion: number | null;
        currentVersion: number | null;
        changedAt: Value;
        current: Row;
        status: { field: string; value: Value; isFinal: boolean } | null;
        overwritable: boolean;
      };
    };

const OPTIMISTIC = ${optimistic ? "true" : "false"};
const STATUS_FIELD: string | null = ${finals.length ? JSON.stringify(statusField) : "null"};
const FINAL_STATES: readonly string[] = ${JSON.stringify(finals)};

function isFinal(row: Row): boolean {
  return STATUS_FIELD !== null && FINAL_STATES.includes(String(row[STATUS_FIELD] ?? ""));
}

function refusal(code: "VERSION_CONFLICT" | "RECORD_FINAL", current: Row, version?: number): WriteResult {
  return {
    ok: false,
    error: code,
    message:
      code === "RECORD_FINAL"
        ? "This record is in a final state: its transaction is complete and it cannot be changed."
        : "This record was changed by another user since you opened it.",
    conflict: {
      yourVersion: version ?? null,
      currentVersion: typeof current.version === "number" ? current.version : null,
      changedAt: current.updated_at ?? null,
      current,
      status: STATUS_FIELD
        ? { field: STATUS_FIELD, value: current[STATUS_FIELD] ?? null, isFinal: isFinal(current) }
        : null,
      overwritable: code === "VERSION_CONFLICT",
    },
  };
}

/** The refusal a write must meet before it is attempted, if any. */
function precondition(current: Row, version?: number): WriteResult | null {
  if (isFinal(current)) return refusal("RECORD_FINAL", current, version);
  if (version === undefined && OPTIMISTIC) {
    return {
      ok: false,
      error: "PRECONDITION_REQUIRED",
      message: "A write to ${Type} must name the version it was read at.",
    };
  }
  if (version !== undefined && current.version !== version) {
    return refusal("VERSION_CONFLICT", current, version);
  }
  return null;
}

/** The conditional write matched nothing: say why, from the row as it now is. */
async function refusedNow(id: string, version?: number): Promise<WriteResult> {
  const now = await getDb()
    .selectFrom("${tableName}")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  if (!now) throw new NotFoundError("${Type}", id);
  const row = now as unknown as Row;
  return refusal(isFinal(row) ? "RECORD_FINAL" : "VERSION_CONFLICT", row, version);
}
`;
}

// --- List page ----------------------------------------------------------------

function listPageFile(e: EmlEntity): string {
  const Type = e.name;
  const tableName = tbl(e);
  const routePath = slug(e);
  const sfModule = toSnakeCase(e.name);
  const pluralLabel = plural(toLabel(e.name));
  const displayCols = e.attributes.filter((a) => !a.isPrimaryKey).slice(0, 4);

  const headCells = displayCols
    .map((a) => `                <TableHead>${e.label ? toLabel(a.name) : toLabel(a.name)}</TableHead>`)
    .join("\n");

  const bodyCells = displayCols
    .map((a) => `                    <TableCell>{String(row.${a.name} ?? "")}</TableCell>`)
    .join("\n");

  return `import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { list${Type}sFn } from "@/server-fns/${sfModule}";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authed/${routePath}/")({
  component: ${Type}ListPage,
});

function ${Type}ListPage() {
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data, isLoading } = useQuery({
    queryKey: ["${tableName}", page],
    queryFn: () => list${Type}sFn({ data: { page, pageSize } }),
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">${pluralLabel}</h1>
        <Button asChild>
          <Link to="/_authed/${routePath}/$id" params={{ id: "new" }}>
            New ${toLabel(e.name)}
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
${headCells}
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={${displayCols.length + 1}} className="py-10 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={${displayCols.length + 1}} className="py-10 text-center text-muted-foreground">
                    No ${pluralLabel.toLowerCase()} yet.
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((row) => (
                  <TableRow key={row.id}>
${bodyCells}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/_authed/${routePath}/$id" params={{ id: row.id }}>
                          Edit
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
`;
}

// --- Detail page --------------------------------------------------------------

function detailPageFile(e: EmlEntity): string {
  const Type = e.name;
  const tableName = tbl(e);
  const routePath = slug(e);
  const sfModule = toSnakeCase(e.name);
  const editableAttrs = e.attributes.filter((a) => !a.isPrimaryKey);

  const formFields = editableAttrs
    .map(
      (a) => `          <div className="space-y-1">
            <Label htmlFor="${a.name}">${toLabel(a.name)}${a.required ? "" : " (optional)"}</Label>
            <Input
              id="${a.name}"
              value={form.${a.name} ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, ${a.name}: e.target.value }))}
              ${a.required ? "required" : ""}
            />
          </div>`
    )
    .join("\n");

  return `import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  create${Type}Fn,
  delete${Type}Fn,
  get${Type}Fn,
  update${Type}Fn,
  type WriteResult,
} from "@/server-fns/${sfModule}";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authed/${routePath}/$id")({
  component: ${Type}DetailPage,
});

/** The columns the form edits; the rest (key, version, timestamps) are the server's. */
const EDITABLE = ${JSON.stringify(editableAttrs.map((a) => a.name))} as const;

type Refusal = Extract<WriteResult, { ok: false }> & { action: "save" | "delete" };

function ${Type}DetailPage() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, refetch } = useQuery({
    queryKey: ["${tableName}", id],
    queryFn: () => get${Type}Fn({ data: { id } }),
    enabled: !isNew,
  });

  const [form, setForm] = useState<Record<string, string>>({});
  // The version the form was read at: every update and delete names it.
  const [readVersion, setReadVersion] = useState<number | undefined>(undefined);
  // A write somebody else's write overtook, or one a final state refused.
  const [refusal, setRefusal] = useState<Refusal | null>(null);

  const load = (row: Record<string, unknown>) => {
    setForm(
      Object.fromEntries(
        EDITABLE.map((k) => [k, row[k] == null ? "" : String(row[k])])
      )
    );
    setReadVersion(typeof row.version === "number" ? row.version : undefined);
    setRefusal(null);
  };

  useEffect(() => {
    if (data) load(data as Record<string, unknown>);
  }, [data]);

  const done = () => {
    queryClient.invalidateQueries({ queryKey: ["${tableName}"] });
    navigate({ to: "/_authed/${routePath}/" });
  };

  const saveMutation = useMutation({
    mutationFn: async (version?: number) => {
      if (isNew) {
        await create${Type}Fn({ data: form as never });
        return null;
      }
      return update${Type}Fn({ data: { id, version, ...form } as never });
    },
    onSuccess: (result) => (result && !result.ok ? setRefusal({ ...result, action: "save" }) : done()),
  });

  const deleteMutation = useMutation({
    mutationFn: (version?: number) => delete${Type}Fn({ data: { id, version } }),
    onSuccess: (result) => (result.ok ? done() : setRefusal({ ...result, action: "delete" })),
  });

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">
        {isNew ? "New ${toLabel(e.name)}" : "Edit ${toLabel(e.name)}"}
      </h1>

      <Card>
        <CardContent className="space-y-4 pt-6">
${formFields}

          {refusal && (
            <div role="alert" className="rounded-md border border-destructive p-3 text-sm space-y-2">
              <p className="font-medium">
                {refusal.error === "RECORD_FINAL"
                  ? "This record is closed: its transaction is complete."
                  : refusal.error === "PRECONDITION_REQUIRED"
                    ? "Reload this record before changing it."
                    : refusal.action === "delete"
                      ? "This record was changed before you deleted it."
                      : "This record was changed while you were editing it."}
              </p>
              {refusal.conflict?.status && (
                <p>
                  Status: {String(refusal.conflict.status.value ?? "—")}
                  {refusal.conflict.status.isFinal ? " (final)" : ""}
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => refetch().then(({ data: latest }) => latest && load(latest as Record<string, unknown>))}>
                  Refresh to latest
                </Button>
                {refusal.conflict?.overwritable && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const version = refusal.conflict?.currentVersion ?? undefined;
                      if (refusal.action === "delete") deleteMutation.mutate(version);
                      else saveMutation.mutate(version);
                    }}
                  >
                    {refusal.action === "delete" ? "Delete it anyway" : "Overwrite with my changes"}
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => saveMutation.mutate(readVersion)}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/_authed/${routePath}/" })}
            >
              Cancel
            </Button>
            {!isNew && (
              <Button
                variant="destructive"
                className="ml-auto"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(readVersion)}
              >
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
`;
}

// --- Migration ----------------------------------------------------------------

function migrationFile(model: EmlModel): string {
  const stmts = model.entities.map((e) => {
    const tableName = tbl(e);
    const pk = e.primaryKey || "id";
    const nonPk = e.attributes.filter((a) => !a.isPrimaryKey);

    const cols = [
      `  "${pk}" VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text`,
      ...nonPk.map((a) => {
        const notNull = a.required ? " NOT NULL" : " NULL";
        const uq = a.unique ? " UNIQUE" : "";
        const def = a.type === "boolean" ? " DEFAULT FALSE" : "";
        return `  "${a.name}" ${ddlType(a)}${notNull}${uq}${def}`;
      }),
      // The optimistic-lock counter; every write advances it.
      '  "version" INTEGER NOT NULL DEFAULT 1',
      '  "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP',
      // PostgreSQL has no ON UPDATE CURRENT_TIMESTAMP; the application sets
      // updated_at on write, as the platform's own tables do.
      '  "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP',
    ];

    const extraIndexes = model.indexes
      .filter((idx: EmlIndex) => idx.entity === e.name)
      .map(
        (idx: EmlIndex) =>
          `  await db.schema\n    .createIndex("idx_${tableName}_${idx.columns.join("_")}")\n    .on("${tableName}")\n    .columns([${idx.columns.map((c) => `"${c}"`).join(", ")}])\n    .ifNotExists()\n    .execute();`
      );

    return {
      tableName,
      ddl: `CREATE TABLE IF NOT EXISTS "${tableName}" (\n${cols.join(",\n")}\n)`,
      extraIndexes,
    };
  });

  // `sql` tag, not `db.schema.executeRaw` — Kysely has no such method, so the
  // migration this file writes used to fail at run time as well as parse time.
  return `import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<never>): Promise<void> {
${stmts
  .map(
    (s) =>
      `  await sql\`${s.ddl}\`.execute(db);` +
      (s.extraIndexes.length ? `\n${s.extraIndexes.join("\n")}` : "")
  )
  .join("\n\n")}
}

export async function down(db: Kysely<never>): Promise<void> {
${model.entities.map((e) => `  await db.schema.dropTable("${tbl(e)}").ifExists().execute();`).join("\n")}
}
`;
}

// --- Kysely Database interface snippet ----------------------------------------

function kyselyTypesFile(model: EmlModel): string {
  const blocks = model.entities.map((e) => {
    const tableName = tbl(e);
    const pk = e.primaryKey || "id";
    const rest = e.attributes.filter((a) => !a.isPrimaryKey);

    return `  /** ${e.label ?? e.name} */
  ${tableName}: {
    ${pk}: Generated<string>;
${rest.map((a) => `    ${a.name}${a.required ? "" : "?"}: ${kyselyColumnType(a)} | null;`).join("\n")}
    version: Generated<number>;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
  };`;
  });

  return `# Kysely Database types — EML generated

Paste these entries into the \`Database\` interface in \`src/lib/db/kysely-db.ts\`.

\`\`\`typescript
// Ensure this import is present at the top of kysely-db.ts:
// import type { ColumnType, Generated } from "kysely";

// Inside the Database interface add:
${blocks.join("\n\n")}
\`\`\`
`;
}

// --- README -------------------------------------------------------------------

function readmeFile(model: EmlModel, opts: EnterpriseReportingOptions): string {
  const entityLines = model.entities
    .map(
      (e) =>
        `- \`src/server-fns/${toSnakeCase(e.name)}.ts\` — CRUD server functions\n` +
        `- \`src/routes/_authed/${slug(e)}/index.tsx\` — list page\n` +
        `- \`src/routes/_authed/${slug(e)}/$id.tsx\` — detail / edit page`
    )
    .join("\n");

  return `# ${opts.appName}

Generated from EML model by the Enterprise Reporting EML CLI.
Stack: **TanStack Start + Kysely + PostgreSQL** (enterprise-reporting target).

## Files generated

${entityLines}
- \`src/lib/db/migrations/*_create_tables.ts\` — Kysely migration (PostgreSQL DDL)
- \`KYSELY_TYPES.md\` — Kysely \`Database\` interface snippet

## Integration steps

1. **Copy files** into the repository at the paths shown above.
2. **Add Kysely types**: paste the snippet from \`KYSELY_TYPES.md\` into the
   \`Database\` interface in \`src/lib/db/kysely-db.ts\`.
3. **Bootstrap tables**: add the \`CREATE TABLE\` statements from the migration
   to \`bootstrapSchema()\` in \`src/lib/db/bootstrap.ts\`, or run the migration
   with \`bun run db:migrate\`.
4. **Add navigation links** to the new routes in
   \`src/components/layout/Sidebar.tsx\`.
5. **Customise**: add permission checks (\`requirePermission()\`), refine Zod
   schemas, and apply your UI patterns as needed.

## Server function conventions enforced by this generator

- \`.inputValidator()\` is always used — never \`.validator()\`. The TanStack
  Start v1 Vite plugin only preserves \`.inputValidator()\` across the
  server/client boundary.
- Client calls always pass \`{ data: input }\` — the wrapper is required.
- \`requireAuth()\` is called at the top of every handler.

## Two people, one record

Every table carries a \`version\` that every write advances. The update and
delete functions take the \`version\` the record was read at and make it a
condition of the write: one made against a version somebody else has since
replaced returns \`{ ok: false, error: "VERSION_CONFLICT", conflict }\` with the
record as it now stands, and the detail page offers to refresh or to overwrite.
An entity the model declares \`last-write-wins\` accepts a write that names no
version; every other one returns \`PRECONDITION_REQUIRED\`. A record in a final
state of its state machine is a completed transaction, and every update and
delete returns \`RECORD_FINAL\`.
`;
}
