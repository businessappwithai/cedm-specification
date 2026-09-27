/**
 * `convert:stored-models` against a real Mermaid-era installation.
 *
 * The schema is built by today's migrations and then taken back to the shape
 * it had before YAML — `erd_versions.mermaid_code`, `workflows.mermaid_code`
 * and `.flowchart_code` — and filled with what that tool stored: versions and a
 * current model in Mermaid, an automation in its Mermaid dialect, a service's
 * drawn flowchart, an interrupted save. The project's history has the old file
 * layout, and the legacy library holds an entry for a project with none.
 *
 * Needs Postgres, like the repository suite:
 *   APPWITHAI_GIT_TEST_DB=1 DATABASE_URL=… bun run test -- src/lib/server/stored-models
 */

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { compileModelDocument, readModelYaml } from "@appwithai/generator/model-yaml";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  closeDatabase,
  getDatabase,
  runMigrations,
  sql,
} from "../../../../../../core/src/services/database.service";
import { mermaidEraColumns } from "../../../../../../core/src/services/model-format";
import { STEP_TYPES } from "../../../automation/model";
import { automationFromYaml } from "../../../automation/yaml";
import { digest, MODEL_YAML } from "../../project-git";
import { projectLibrary, restoreProject, saveProject } from "../../project-repository";
import { convertStoredModels } from "..";
import { serializeAutomation } from "../legacy/automation.js";

vi.mock("@appwithai/core/services", async () => ({
  ...(await import("../../../../../../core/src/services/database.service")),
  ...(await import("../../../../../../core/src/services/model-format")),
}));

const enabled = process.env.APPWITHAI_GIT_TEST_DB === "1";
const suite = enabled ? describe : describe.skip;
const FIXTURES = path.join(__dirname, "fixtures");
const REPO = path.resolve(__dirname, "../../../../../../..");
const schema = `stored_models_${randomUUID().replaceAll("-", "")}`;
let root: string;
let admin: pg.Client;

const fixture = (name: string) => fs.readFile(path.join(FIXTURES, name), "utf8");
const reference = (file: string) => fs.readFile(path.join(REPO, file), "utf8");
const compiled = (text: string) =>
  JSON.parse(JSON.stringify(compileModelDocument(readModelYaml(text, { check: false }).document!)));
const gitIn = (dir: string, args: string[]) =>
  execFileSync("git", ["-c", "user.name=Author", "-c", "user.email=author@example.com", ...args], {
    cwd: dir,
    encoding: "utf8",
  });

const automation = {
  id: "a1",
  name: "Flag expired samples",
  kind: "automation",
  trigger: { entity: "Sample", event: "updated" },
  conditions: [{ id: "c1", field: "sample.status", operator: "eq", value: "expired" }],
  loops: [],
  steps: STEP_TYPES.slice(0, 3).map((type, i) => ({
    id: `s${i}`,
    type,
    resultName: `r${i}`,
    props: { entity: "Sample", field: "status", value: `v${i}` },
  })),
  hooks: [],
  status: "live",
} as never;

async function run(options: Partial<Parameters<typeof convertStoredModels>[0]> = {}) {
  const lines: string[] = [];
  const outcome = await convertStoredModels({
    dryRun: false,
    archiveUnconvertible: false,
    abandonPending: false,
    verbose: false,
    log: (line) => lines.push(line),
    ...options,
  });
  return { ...outcome, output: lines.join("\n") };
}

suite("convert:stored-models (isolated PostgreSQL schema)", () => {
  let history: string;
  let libraryEntry: string;

  beforeAll(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "appwithai-stored-models-"));
    process.env.DEFAULT_OUTPUT_DIR = root;
    admin = new pg.Client({
      connectionString: process.env.DATABASE_URL,
      database: process.env.PGDATABASE ?? "appwithai",
    });
    await admin.connect();
    await admin.query(`CREATE SCHEMA ${schema}`);
    process.env.PGOPTIONS = `-c search_path=${schema}`;
    await runMigrations();
    const db = getDatabase();

    // Back to the schema before YAML.
    for (const statement of [
      "ALTER TABLE erd_versions ADD COLUMN mermaid_code text NOT NULL DEFAULT ''",
      "ALTER TABLE erd_versions ALTER COLUMN mermaid_code DROP DEFAULT",
      "ALTER TABLE erd_versions DROP COLUMN model_yaml",
      "ALTER TABLE workflows ADD COLUMN mermaid_code text",
      "ALTER TABLE workflows ADD COLUMN flowchart_code text",
      "ALTER TABLE workflows DROP COLUMN definition_yaml",
    ])
      await sql.raw(statement).execute(db);

    const now = new Date().toISOString();
    for (const id of ["lab", "clinic"])
      await sql`INSERT INTO projects (id, name) VALUES (${id}, ${id})`.execute(db);
    const versions: Array<[string, number, string]> = [
      ["v1", 1, await fixture("minimal.eml.mmd")],
      ["v2", 2, await fixture("drug-discovery.eml.mmd")],
      ["v3", 3, ""],
    ];
    for (const [id, number, text] of versions)
      await sql`INSERT INTO erd_versions (id, project_id, version_number, mermaid_code, is_current, created_at, git_commit)
                VALUES (${id}, 'lab', ${number}, ${text}, ${number === 2}, ${now}, 'deadbeef')`.execute(
        db
      );
    await sql`INSERT INTO workflows (id, project_id, name, service_name, workflow_type, mermaid_code, status)
              VALUES ('w1', 'lab', 'Flag expired samples', 'Sample', 'automation', ${serializeAutomation(automation)}, 'live'),
                     ('w3', 'lab', 'Hand drawn', 'Sample', 'crud', ${"flowchart TD\n  A[Receive sample] --> B{Damaged?}\n"}, 'draft')`.execute(
      db
    );
    await sql`INSERT INTO workflows (id, project_id, name, service_name, workflow_type, flowchart_code, hook_definitions)
              VALUES ('w2', 'lab', 'SampleService', 'SampleService', 'hooks',
                      ${"flowchart TD\n  A[beforeCreate: checkSample] --> B[Create]\n"},
                      ${JSON.stringify([{ type: "beforeCreate", name: "checkSample", entity: "Sample", enabled: true, order: 0 }])})`.execute(
      db
    );

    // The project's history, in the layout that tool wrote.
    history = path.join(root, "lab");
    await fs.mkdir(path.join(history, "model/diagrams"), { recursive: true });
    await fs.mkdir(path.join(history, "model/library"), { recursive: true });
    await fs.mkdir(path.join(history, "backend"), { recursive: true });
    const current = await fixture("helpdesk.eml.mmd");
    libraryEntry = `model/library/${digest("crm-v1.mmd").slice(0, 24)}`;
    const files: Record<string, string> = {
      "model/model.eml.mmd": current,
      "model/editor.eml.mmd": current,
      [MODEL_YAML]: 'eml: "1.0"\nentities: []\n',
      "model/diagrams/abc.mmd": "flowchart TD\n  A --> B\n",
      [`${libraryEntry}.mmd`]: await fixture("minimal.eml.mmd"),
      [`${libraryEntry}.json`]: `${JSON.stringify({ filename: "crm-v1.mmd", type: "erd", canonical: false, createdAt: now })}\n`,
      "backend/app.rs": "fn main() {}\n",
    };
    for (const [name, text] of Object.entries(files))
      await fs.writeFile(path.join(history, name), text);
    gitIn(history, ["init", "-q"]);
    gitIn(history, ["add", "-A"]);
    gitIn(history, ["commit", "-q", "-m", "Save model"]);
    const head = gitIn(history, ["rev-parse", "HEAD"]).trim();
    gitIn(history, ["update-ref", "refs/appwithai/versions/abc", head]);
    await sql`INSERT INTO project_git_state (project_id, model_code, model_commit, updated_at)
              VALUES ('lab', ${current}, ${head}, ${now})`.execute(db);
    await sql`INSERT INTO project_git_operations (id, project_id, request_id, fingerprint, kind, status, payload, created_at)
              VALUES ('op1', 'lab', 'r1', 'f', 'draft', 'prepared', ${JSON.stringify({ model: current })}, ${now})`.execute(
      db
    );

    // A library entry for a project that never had a history.
    const legacy = path.join(root, ".mermaid-library");
    await fs.mkdir(legacy);
    await fs.writeFile(path.join(legacy, "clinic.eml.mmd"), await fixture("minimal.eml.mmd"));
    await fs.writeFile(
      path.join(legacy, "clinic.eml.mmd.meta.json"),
      JSON.stringify({
        filename: "clinic.eml.mmd",
        projectId: "clinic",
        type: "erd",
        canonical: true,
        createdAt: now,
      })
    );
  }, 60000);

  afterAll(async () => {
    await closeDatabase();
    if (admin) {
      await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await admin.end();
    }
    if (root) await fs.rm(root, { recursive: true, force: true });
    delete process.env.DEFAULT_OUTPUT_DIR;
    delete process.env.PGOPTIONS;
  });

  it("reports what blocks it and writes nothing", async () => {
    const head = gitIn(history, ["rev-parse", "HEAD"]).trim();
    const outcome = await run({ dryRun: true });
    expect(outcome.status).toBe("blocked");
    // The empty version, the hand-drawn flowchart, the interrupted save.
    expect(outcome.blocking).toBe(3);
    expect(outcome.output).toContain("A[Receive sample] --> B{Damaged?}");
    expect(outcome.output).toContain("the stored model is empty");
    expect(await mermaidEraColumns(getDatabase())).toHaveLength(3);
    expect(gitIn(history, ["rev-parse", "HEAD"]).trim()).toBe(head);
  });

  it("converts everything once the operator has chosen what to do with the rest", async () => {
    const outcome = await run({ archiveUnconvertible: true, abandonPending: true });
    expect(outcome.status, outcome.output).toBe("converted");
    const db = getDatabase();
    expect(await mermaidEraColumns(db)).toEqual([]);

    const versions = (
      await sql<{ id: string; model_yaml: string; git_commit: string | null }>`
      SELECT id, model_yaml, git_commit FROM erd_versions ORDER BY version_number`.execute(db)
    ).rows;
    expect(versions.map((v) => v.id)).toEqual(["v1", "v2"]);
    expect(compiled(versions[0]!.model_yaml)).toEqual(
      compiled(await reference("language/yaml/examples/minimal.eml.yaml"))
    );
    expect(compiled(versions[1]!.model_yaml)).toEqual(
      compiled(await reference("examples/drug-discovery.eml.yaml"))
    );
    expect(versions.every((v) => v.git_commit === null)).toBe(true);

    const workflows = (
      await sql<{
        id: string;
        workflow_type: string;
        definition_yaml: string | null;
        hook_definitions: string | null;
      }>`
      SELECT id, workflow_type, definition_yaml, hook_definitions FROM workflows ORDER BY id`.execute(
        db
      )
    ).rows;
    expect(workflows.map((w) => w.id)).toEqual(["w1", "w2"]);
    expect(automationFromYaml(workflows[0]!.definition_yaml!).steps).toHaveLength(3);
    expect(workflows[1]!.workflow_type).toBe("hooks");
    expect(JSON.parse(workflows[1]!.hook_definitions!)[0].name).toBe("checkSample");

    const state = (
      await sql<{ model_code: string; model_commit: string }>`
      SELECT model_code, model_commit FROM project_git_state WHERE project_id = 'lab'`.execute(db)
    ).rows[0]!;
    expect(compiled(state.model_code)).toEqual(
      compiled(await reference("language/yaml/examples/helpdesk.eml.yaml"))
    );
    expect(state.model_commit).toBe(gitIn(history, ["rev-parse", "HEAD"]).trim());

    // The history: no Mermaid, the model the tool holds, the library as YAML,
    // the application's own files untouched, and a clean working tree.
    const tree = gitIn(history, ["ls-tree", "-r", "--name-only", "HEAD"])
      .split("\n")
      .filter(Boolean);
    expect(tree.filter((name) => name.endsWith(".mmd"))).toEqual([]);
    expect(gitIn(history, ["show", `HEAD:${MODEL_YAML}`])).toBe(state.model_code);
    expect(tree).toContain(`model/library/${digest("crm-v1.eml.yaml").slice(0, 24)}.eml.yaml`);
    expect(tree).toContain("backend/app.rs");
    expect(gitIn(history, ["status", "--porcelain"])).toBe("");
    expect(gitIn(history, ["for-each-ref", "refs/appwithai/versions"])).toBe("");

    const audit = (
      await sql<{ source: string; error: string | null }>`
      SELECT source, error FROM stored_model_conversions`.execute(db)
    ).rows;
    const bySource = (source: string) => audit.filter((row) => row.source === source);
    expect(bySource("erd_version")).toHaveLength(3);
    expect(bySource("erd_version").filter((row) => row.error)).toHaveLength(1);
    expect(bySource("automation")).toHaveLength(2);
    expect(bySource("hook_flowchart")).toHaveLength(1);
    expect(bySource("project_model")).toHaveLength(1);
    expect(bySource("pending_operation")).toHaveLength(1);
    expect(bySource("repository").length).toBeGreaterThanOrEqual(4);
    expect(bySource("legacy_library")).toHaveLength(1);

    await expect(fs.access(path.join(root, ".mermaid-library"))).rejects.toThrow();
    await fs.access(path.join(root, ".mermaid-library.converted"));
  }, 120000);

  it("leaves a tool that saves, restores and lists the library as before", async () => {
    const saved = await saveProject("lab", "owner", {
      mode: "draft",
      description: "After conversion",
    });
    expect(saved.commit).toBeTruthy();
    const restored = await restoreProject("lab", "owner", { versionId: "v1", scope: "model" });
    expect(restored.commit).toBeTruthy();
    expect(compiled(gitIn(history, ["show", `HEAD:${MODEL_YAML}`]))).toEqual(
      compiled(await reference("language/yaml/examples/minimal.eml.yaml"))
    );
    expect((await projectLibrary("lab")).map((entry) => entry.filename)).toContain(
      "crm-v1.eml.yaml"
    );

    // The project that had no history imports its converted library on first save.
    await saveProject("clinic", "owner", {
      model: await reference("language/yaml/examples/minimal.eml.yaml"),
    });
    const clinic = await projectLibrary("clinic");
    expect(clinic.map((entry) => entry.filename)).toEqual(["clinic.eml.yaml"]);
    expect(readModelYaml(clinic[0]!.content).document?.entities.length).toBeGreaterThan(0);
  }, 60000);

  it("finds nothing to do when run again", async () => {
    expect((await run()).status).toBe("nothing-to-do");
  });
});
