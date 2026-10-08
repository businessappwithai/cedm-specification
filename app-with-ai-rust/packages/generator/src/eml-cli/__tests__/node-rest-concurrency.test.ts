/**
 * The `eml` CLI's Node REST application keeps the same promise the Loco
 * backend does: two people, one record.
 *
 * The app is generated from the CRM corpus model, started as a real process,
 * and driven over HTTP: every record carries a version and answers with it as
 * an ETag; an update or delete names the version it read, and a stale one is
 * refused with the record as it now stands; an optimistic entity refuses a
 * write that names none (428) and a `last-write-wins` one accepts it; and a
 * record in a final state of its state machine is closed to every update and
 * delete — on the column the machine actually drives, which for an opportunity
 * is `stage`, not `status`.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readModel, toEmlModel } from "../../../../../language/cli/src/document";
import { collectionName, generateApp } from "../../../../../language/cli/src/generate/app";
import type { EmlModel } from "../../../../../language/cli/src/model";

const ROOT = path.resolve(__dirname, "../../../../..");
const MODEL_FILE = path.join(ROOT, "language/yaml/examples/crm.eml.yaml");

type Row = Record<string, unknown>;
interface Answer {
  status: number;
  etag: string | null;
  body: Row & { error?: string; conflict?: Row & { current: Row; status: Row } };
}

let model: EmlModel;
let outDir: string;
let server: ChildProcess;
let base: string;

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.unref();
    probe.on("error", reject);
    probe.listen(0, () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(() => resolve(port));
    });
  });
}

async function call(
  method: string,
  route: string,
  body?: unknown,
  headers: Record<string, string> = {}
): Promise<Answer> {
  const response = await fetch(`${base}${route}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return {
    status: response.status,
    etag: response.headers.get("etag"),
    body: text ? (JSON.parse(text) as Answer["body"]) : {},
  };
}

function entity(name: string) {
  const found = model.entities.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`the CRM model declares no ${name}`);
  return found;
}

/** The route the generator gives an entity: its own `collectionName`. */
function collection(name: string): string {
  return collectionName(entity(name));
}

/** The fields a create needs: every required, non-key column, with a value of its type. */
function bodyFor(name: string, extra: Row = {}): Row {
  const enums = new Map(model.enums.map((e) => [e.name, e.values]));
  const out: Row = {};
  for (const attribute of entity(name).attributes) {
    if (!attribute.required || attribute.isPrimaryKey || attribute.isForeignKey) continue;
    if (["created_at", "updated_at", "version"].includes(attribute.name)) continue;
    const values = attribute.enumRef ? enums.get(attribute.enumRef) : undefined;
    out[attribute.name] = values?.length
      ? values[0]
      : attribute.type === "integer" || attribute.type === "decimal"
        ? 1
        : attribute.type === "boolean"
          ? true
          : attribute.type === "date"
            ? "2026-10-08"
            : attribute.type === "datetime"
              ? "2026-10-08T00:00:00Z"
              : `${attribute.name}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return { ...out, ...extra };
}

function textField(name: string): string {
  const found = entity(name).attributes.find(
    (attribute) =>
      attribute.type === "string" &&
      !attribute.enumRef &&
      !attribute.isPrimaryKey &&
      !attribute.isForeignKey
  );
  if (!found) throw new Error(`${name} has no free-text column`);
  return found.name;
}

beforeAll(async () => {
  const read = await readModel(readFileSync(MODEL_FILE, "utf-8"), {
    autofix: false,
    file: MODEL_FILE,
  });
  expect(read.ok, JSON.stringify(read.diagnostics.filter((d) => d.severity === "error"))).toBe(
    true
  );
  model = toEmlModel(read.document!);
  outDir = mkdtempSync(path.join(tmpdir(), "eml-node-rest-"));
  generateApp(model, { outDir, appName: "crm" });

  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath.includes("bun") ? process.execPath : "bun", ["src/server.js"], {
    cwd: outDir,
    env: { ...process.env, PORT: String(port), DATA_FILE: path.join(outDir, "data/store.json") },
    stdio: "ignore",
  });
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(`${base}/health`)).ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("the generated Node REST app did not start");
}, 30_000);

afterAll(() => {
  server?.kill();
  if (outDir) rmSync(outDir, { recursive: true, force: true });
});

describe("the eml CLI's Node REST app: optimistic locking", () => {
  it("carries the entity's concurrency and the machine's real status column into the model", () => {
    expect(entity("Activity").concurrency).toBe("last-write-wins");
    expect(entity("Team").concurrency).toBe("optimistic");
    const pipeline = model.workflows.find((w) => w.kind === "state" && w.entity === "Opportunity");
    expect(pipeline?.statusField).toBe("stage");
  });

  it("refuses a stale update and a stale delete with the record as it stands", async () => {
    const route = `/api/${collection("Team")}`;
    const field = textField("Team");
    const created = await call("POST", route, bodyFor("Team"));
    expect(created.status).toBe(201);
    expect(created.body.version).toBe(1);
    expect(created.etag).toBe('"v1"');
    const url = `${route}/${created.body.id}`;

    expect((await call("PATCH", url, { [field]: "blind" })).status).toBe(428);

    const first = await call("PATCH", url, { [field]: "first" }, { "If-Match": '"v1"' });
    expect(first.status).toBe(200);
    expect(first.etag).toBe('"v2"');

    const stale = await call("PATCH", url, { [field]: "second" }, { "If-Match": '"v1"' });
    expect(stale.status).toBe(409);
    expect(stale.body.error).toBe("VERSION_CONFLICT");
    expect(stale.body.conflict?.current[field]).toBe("first");
    expect(stale.body.conflict?.currentVersion).toBe(2);
    expect(stale.body.conflict?.overwritable).toBe(true);
    expect(stale.body.conflict?.changedFields).toContain(field);

    const overwrite = await call("PATCH", url, { [field]: "second" }, { "If-Match": '"v2"' });
    expect(overwrite.status).toBe(200);
    expect((await call("GET", url)).etag).toBe('"v3"');

    expect((await call("DELETE", url)).status).toBe(428);
    const staleDelete = await call("DELETE", url, undefined, { "If-Match": '"v2"' });
    expect(staleDelete.status).toBe(409);
    expect(staleDelete.body.error).toBe("VERSION_CONFLICT");
    expect((await call("GET", url)).status).toBe(200);
    expect((await call("DELETE", url, undefined, { "If-Match": '"v3"' })).status).toBe(204);

    expect((await call("PATCH", url, {}, { "If-Match": "not-a-version" })).status).toBe(400);
  });

  it("lets a last-write-wins entity write without naming a version", async () => {
    const route = `/api/${collection("Activity")}`;
    const created = await call("POST", route, bodyFor("Activity"));
    expect(created.status).toBe(201);
    const url = `${route}/${created.body.id}`;
    expect((await call("PATCH", url, { [textField("Activity")]: "lww" })).status).toBe(200);
    expect((await call("DELETE", url)).status).toBe(204);
  });

  it("closes a record in a final state to every update and delete", async () => {
    const pipeline = model.workflows.find((w) => w.kind === "state" && w.entity === "Opportunity")!;
    const finalStage = pipeline.final![0]!;
    const route = `/api/${collection("Opportunity")}`;
    const closed = await call("POST", route, bodyFor("Opportunity", { stage: finalStage }));
    expect(closed.status).toBe(201);
    expect(closed.body.transactionStatus).toMatchObject({
      field: "stage",
      value: finalStage,
      isFinal: true,
    });
    const url = `${route}/${closed.body.id}`;

    for (const precondition of ['"v1"', "*"]) {
      const update = await call(
        "PATCH",
        url,
        { [textField("Opportunity")]: "reopen" },
        { "If-Match": precondition }
      );
      expect(update.status).toBe(409);
      expect(update.body.error).toBe("RECORD_FINAL");
      expect(update.body.conflict?.overwritable).toBe(false);
      const remove = await call("DELETE", url, undefined, { "If-Match": precondition });
      expect(remove.status).toBe(409);
      expect(remove.body.error).toBe("RECORD_FINAL");
    }
    expect((await call("GET", url)).status).toBe(200);
  });

  it("documents the precondition in its OpenAPI", async () => {
    const document = (await call("GET", "/openapi.json")).body as {
      paths: Record<string, unknown>;
    };
    const item = JSON.stringify(document.paths[`/api/${collection("Team")}/{id}`]);
    expect(item).toContain("If-Match");
    expect(item).toContain("428");
    expect(item).toContain("RECORD_FINAL");
  });
});
