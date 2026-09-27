/**
 * Durable coordinator: prepared DB operation -> files -> Git -> DB projection.
 * A session advisory lock spans independently committed journal/projection writes.
 * Recovery replays the same bytes and operation ID, never creates a second version.
 */
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getDatabase, sql } from "@appwithai/core/services";
import {
  type ModelDiagnostic,
  readModelYaml,
  serializeModelDocument,
} from "@appwithai/generator/model-yaml";
import {
  type ModelContext,
  projectSource,
  readModelDocument,
  selectModelContext,
} from "@appwithai/yamltecture";
import { automationFromYaml } from "../automation/yaml";
import { type CompositionIssue, composeModel, type ServiceHookDefinition } from "../model/compose";
import {
  assertCommit,
  commitFiles,
  decode,
  digest,
  encode,
  ensureRepository,
  type Files,
  GENERATION,
  git,
  head,
  inventory,
  MANIFEST,
  MODEL_YAML,
  mergeGenerated,
  projectDirectory,
  publishFiles,
  RepositoryError,
  readFile,
  treeFiles,
} from "./project-git";

export { RepositoryError } from "./project-git";

type Db = ReturnType<typeof getDatabase>;
type Workflow = Record<string, unknown>;
interface Projection {
  model?: string;
  workflows?: Workflow[];
  named?: boolean;
  description?: string;
  actor: string;
  generationInput?: string;
}
interface Operation {
  id: string;
  projectId: string;
  parent: string | null;
  files: Files;
  before: Files;
  kind: string;
  projection: Projection;
}
export interface SaveInput {
  model?: string;
  mode?: "draft" | "version";
  description?: string;
  requestId?: string;
  expectedCommit?: string | null;
}
interface Result {
  commit: string;
  operationId: string;
  version?: Record<string, unknown>;
  modelCommit?: string;
}
const jsonFile = (data: unknown) => encode(`${JSON.stringify(data, null, 2)}\n`);
export const AI_PROJECTION = ".appwithai/model.ai.yaml";
const workflowFields = [
  "id",
  "project_id",
  "name",
  "service_name",
  "workflow_type",
  "definition_yaml",
  "description",
  "extension_points",
  "config",
  "triggers",
  "conditions",
  "generated_code",
  "code_language",
  "status",
  "is_enabled",
  "hook_definitions",
  "generated_hook_code",
  "is_draft",
];
const cleanWorkflow = (row: Workflow): Workflow =>
  Object.fromEntries(workflowFields.filter((k) => row[k] !== undefined).map((k) => [k, row[k]]));

async function locked<T>(
  projectId: string,
  action: (db: Db, dir: string) => Promise<T>
): Promise<T> {
  return getDatabase()
    .connection()
    .execute(async (db) => {
      const lock = await sql<{
        locked: boolean;
      }>`SELECT pg_try_advisory_lock(hashtextextended(${`project-git:${projectId}`}, 0)) AS locked`.execute(
        db
      );
      if (!lock.rows[0]?.locked)
        throw new RepositoryError("Another save or import is running. Retry shortly.", 423);
      try {
        const project = await db
          .selectFrom("projects")
          .select(["id", "generated_path"])
          .where("id", "=", projectId)
          .executeTakeFirst();
        if (!project) throw new RepositoryError("Project not found", 404);
        const dir = await projectDirectory(projectId);
        if (project.generated_path && path.resolve(project.generated_path) !== dir)
          throw new RepositoryError(
            "The existing output path differs from the configured project directory. Align DEFAULT_OUTPUT_DIR before importing."
          );
        const pending = await db
          .selectFrom("project_git_operations")
          .select("id")
          .where("project_id", "=", projectId)
          .where("status", "=", "prepared")
          .executeTakeFirst();
        await ensureRepository(dir, projectId, !!pending);
        await recover(db, dir, projectId);
        return await action(db, dir);
      } finally {
        await sql`SELECT pg_advisory_unlock(hashtextextended(${`project-git:${projectId}`}, 0))`.execute(
          db
        );
      }
    });
}

async function finish(db: Db, dir: string, operation: Operation): Promise<Result> {
  const { id, projectId, parent, files, before, projection: p } = operation;
  let commit = await head(dir);
  const message = commit ? await git(dir, ["show", "-s", "--format=%B", commit]) : "";
  if (!message.includes(`APPWITHAI-Operation: ${id}`)) {
    if (commit !== parent)
      throw new RepositoryError(
        "Repository changed while a save was pending. Reconcile the pending operation before saving again."
      );
    await publishFiles(dir, before, files);
    commit = await commitFiles(
      dir,
      files,
      parent,
      `${p.description || operation.kind}\n\nAPPWITHAI-Operation: ${id}\nAPPWITHAI-Kind: ${operation.kind}\n`,
      p.actor
    );
  } else {
    // HEAD was updated before a process failure; repair its index without touching edits.
    await git(dir, ["read-tree", commit!]);
  }
  if (!commit) throw new RepositoryError("Snapshot did not produce a commit", 500);
  const result: Result = { commit, operationId: id };
  const priorState = await db
    .selectFrom("project_git_state")
    .selectAll()
    .where("project_id", "=", projectId)
    .executeTakeFirst();
  let modelRevision = commit;
  if (priorState && operation.kind !== "restore-application") {
    const priorTree = (await git(dir, ["rev-parse", `${priorState.model_commit}:model`])).trim();
    const nextTree = (await git(dir, ["rev-parse", `${commit}:model`])).trim();
    const priorProjection = await git(dir, [
      "rev-parse",
      "--verify",
      `${priorState.model_commit}:${AI_PROJECTION}`,
    ]).catch(() => "");
    const nextProjection = await git(dir, [
      "rev-parse",
      "--verify",
      `${commit}:${AI_PROJECTION}`,
    ]).catch(() => "");
    if (priorTree === nextTree && priorProjection === nextProjection)
      modelRevision = priorState.model_commit;
  }
  await db.transaction().execute(async (tx) => {
    const now = new Date().toISOString();
    if (p.model !== undefined) {
      // Generation commits don't become model revisions unless restoring the entire app.
      const state = {
        project_id: projectId,
        model_code: p.model,
        model_commit: modelRevision,
        updated_at: now,
      };
      await tx
        .insertInto("project_git_state")
        .values(state)
        .onConflict((c) => c.column("project_id").doUpdateSet(state))
        .execute();
      result.modelCommit = modelRevision;
      if (p.workflows) {
        // IDs are project-scoped before any update; do not delete runtime history.
        const ids = p.workflows.map((w) => String(w.id));
        let remove = tx.deleteFrom("workflows").where("project_id", "=", projectId);
        if (ids.length) remove = remove.where("id", "not in", ids);
        await remove.execute();
        for (const workflow of p.workflows) {
          const w = cleanWorkflow(workflow);
          const existing = await tx
            .selectFrom("workflows")
            .select("project_id")
            .where("id", "=", String(w.id))
            .executeTakeFirst();
          if (existing && existing.project_id !== projectId)
            throw new RepositoryError("Workflow belongs to another project");
          const values = { ...w, project_id: projectId, updated_at: now };
          if (existing)
            await tx
              .updateTable("workflows")
              .set(values)
              .where("id", "=", String(w.id))
              .where("project_id", "=", projectId)
              .execute();
          else
            await tx
              .insertInto("workflows")
              .values({ ...values, created_at: now } as never)
              .execute();
        }
      }
      if (p.named) {
        const last = await tx
          .selectFrom("erd_versions")
          .select("version_number")
          .where("project_id", "=", projectId)
          .orderBy("version_number", "desc")
          .executeTakeFirst();
        await tx
          .updateTable("erd_versions")
          .set({ is_current: false })
          .where("project_id", "=", projectId)
          .execute();
        result.version = await tx
          .insertInto("erd_versions")
          .values({
            id: `erd_${id}`,
            project_id: projectId,
            version_number: (last?.version_number ?? 0) + 1,
            model_yaml: p.model,
            description: p.description || "Saved version",
            is_current: true,
            created_by: p.actor,
            git_commit: commit,
            created_at: now,
            validation_errors: "[]",
            parsed_schema: "{}",
            entity_count: 0,
            relationship_count: 0,
            ai_suggestions: "{}",
            ai_enhanced: false,
            import_source: null,
            import_metadata: "{}",
            commit_message: p.description ?? null,
            change_summary: "{}",
          })
          .returningAll()
          .executeTakeFirstOrThrow();
      }
      if (operation.kind === "restore-application") {
        await tx
          .updateTable("project_git_state")
          .set({ generation_commit: commit, generation_model_commit: commit })
          .where("project_id", "=", projectId)
          .execute();
      }
    }
    if (p.generationInput) {
      await tx
        .updateTable("project_git_state")
        .set({
          generation_commit: commit,
          generation_model_commit: p.generationInput,
          updated_at: now,
        })
        .where("project_id", "=", projectId)
        .execute();
      await tx
        .updateTable("projects")
        .set({ generated_path: dir, deployment_status: "completed", updated_at: now })
        .where("id", "=", projectId)
        .execute();
    }
    await tx
      .updateTable("project_git_operations")
      .set({ status: "complete", result: JSON.stringify(result) })
      .where("id", "=", id)
      .execute();
  });
  return result;
}

async function recover(db: Db, dir: string, projectId: string): Promise<void> {
  const pending = await db
    .selectFrom("project_git_operations")
    .selectAll()
    .where("project_id", "=", projectId)
    .where("status", "=", "prepared")
    .orderBy("created_at")
    .execute();
  for (const row of pending) await finish(db, dir, JSON.parse(row.payload));
}

async function existingResult(
  db: Db,
  projectId: string,
  requestId: string,
  fingerprint: string
): Promise<Result | undefined> {
  const row = await db
    .selectFrom("project_git_operations")
    .selectAll()
    .where("project_id", "=", projectId)
    .where("request_id", "=", requestId)
    .executeTakeFirst();
  if (!row) return undefined;
  if (row.fingerprint !== fingerprint)
    throw new RepositoryError("This request ID was already used for different content", 409);
  if (row.status !== "complete" || !row.result)
    throw new RepositoryError("Save is pending recovery. Retry the same request.", 503);
  return JSON.parse(row.result);
}

async function apply(
  db: Db,
  dir: string,
  projectId: string,
  kind: string,
  files: Files,
  projection: Projection,
  requestId: string = randomUUID(),
  fingerprint = digest(JSON.stringify({ kind, files, projection })),
  expectedCommit?: string | null
): Promise<Result> {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(requestId))
    throw new RepositoryError("Invalid request ID", 400);
  const existing = await existingResult(db, projectId, requestId, fingerprint);
  if (existing) return existing;
  const state = await db
    .selectFrom("project_git_state")
    .selectAll()
    .where("project_id", "=", projectId)
    .executeTakeFirst();
  if (expectedCommit !== undefined && (state?.model_commit ?? null) !== expectedCommit)
    throw new RepositoryError(
      "The saved model changed in another window. Reload or compare before saving."
    );
  const before: Files = {};
  for (const name of Object.keys(files)) before[name] = await readFile(dir, name);
  const operation: Operation = {
    id: randomUUID(),
    projectId,
    parent: await head(dir),
    files,
    before,
    kind,
    projection,
  };
  await db
    .insertInto("project_git_operations")
    .values({
      id: operation.id,
      project_id: projectId,
      request_id: requestId,
      fingerprint,
      kind,
      status: "prepared",
      payload: JSON.stringify(operation),
      created_at: new Date().toISOString(),
    })
    .execute();
  return finish(db, dir, operation);
}

/** A model that is not one, reported at the lines at fault. */
function modelRefusal(diagnostics: ModelDiagnostic[], what: string): RepositoryError {
  const lines = diagnostics
    .filter((d) => d.severity === "error")
    .slice(0, 8)
    .map((d) => `  line ${d.line}:${d.column} ${d.code} ${d.message}`);
  return new RepositoryError(`${what}:\n${lines.join("\n")}`, 422);
}

/**
 * Check model text before it is saved.
 *
 * A draft must be a model document — YAML the schema accepts — because every
 * reader downstream (the viewer, the assistant's projection, the graph) needs
 * the document; it may still carry the checker's findings, since a draft is
 * allowed to be unfinished. A named version is a claim that the model is
 * ready, so it must pass the checker as well.
 */
function assertSavable(model: string, named: boolean): void {
  const read = readModelYaml(model, { check: named });
  if (!read.document) throw modelRefusal(read.diagnostics, "The model is not a valid model document");
  if (named && !read.ok) throw modelRefusal(read.diagnostics, "A version must pass the model checker");
}

/**
 * The model's files: the author's text, verbatim, and its canonical
 * projection. The projection is what tells a change to the model from a change
 * to how it is written, and what the assistant reads.
 */
function modelSourceFiles(model: string): Files {
  if (!model.trim()) return {};
  return {
    [MODEL_YAML]: encode(model),
    [AI_PROJECTION]: encode(projectSource(model)),
  };
}

/** Where a saved automation's own document lives in the history. */
const automationPath = (id: string) => `model/automations/${digest(String(id)).slice(0, 24)}.yaml`;

async function modelFiles(model: string, workflows: Workflow[]): Promise<Files> {
  const files: Files = {
    ...modelSourceFiles(model),
    "model/workflows.json": jsonFile(workflows.map(cleanWorkflow)),
  };
  for (const w of workflows) {
    const id = digest(String(w.id)).slice(0, 24);
    files[`model/workflows/${id}.json`] = jsonFile(cleanWorkflow(w));
    if (typeof w.definition_yaml === "string" && w.definition_yaml)
      files[automationPath(String(w.id))] = encode(w.definition_yaml);
  }
  return files;
}

async function currentModel(db: Db, projectId: string): Promise<string> {
  const state = await db
    .selectFrom("project_git_state")
    .selectAll()
    .where("project_id", "=", projectId)
    .executeTakeFirst();
  if (state) return state.model_code;
  const version = await db
    .selectFrom("erd_versions")
    .select("model_yaml")
    .where("project_id", "=", projectId)
    .orderBy("is_current", "desc")
    .orderBy("version_number", "desc")
    .executeTakeFirst();
  return version?.model_yaml ?? "";
}

async function initialize(db: Db, dir: string, projectId: string, actor: string): Promise<void> {
  const state = await db
    .selectFrom("project_git_state")
    .selectAll()
    .where("project_id", "=", projectId)
    .executeTakeFirst();
  if (state) return;
  const model = await currentModel(db, projectId);
  const workflows = await db
    .selectFrom("workflows")
    .selectAll()
    .where("project_id", "=", projectId)
    .orderBy("id")
    .execute();
  const files = await inventory(dir);
  const originalPaths = Object.keys(files);
  // A generated project already carries the model it was generated from. If
  // the tool's saved model differs, both are kept: the saved one as the model,
  // the generated one beside it for whoever reconciles them.
  const originalModel = files[MODEL_YAML];
  Object.assign(files, await modelFiles(model, workflows));
  if (originalModel && originalModel !== files[MODEL_YAML])
    files["model/imported-generated.eml.yaml"] = originalModel;
  files[".appwithai/project.json"] = jsonFile({ projectId, formatVersion: 1 });
  files[".appwithai/import.json"] = jsonFile({
    sourcePaths: originalPaths.sort(),
    note: "Existing code baseline; historical generated code is not inferred.",
  });
  files[".gitignore"] = encode(
    `${files[".gitignore"] ? decode(files[".gitignore"]!) : ""}\n# APPWITHAI local state\n.env\n.env.*\n!.env.example\n!.env.sample\n!.env.template\nnode_modules/\ndist/\nbuild/\n.output/\n*.log\n*.db\n*.sqlite*\n*.pid\n`
  );
  await apply(
    db,
    dir,
    projectId,
    "import",
    files,
    { model, workflows, actor, description: "Import existing project files" },
    "initial-import"
  );
}

async function archiveVersions(
  db: Db,
  dir: string,
  projectId: string,
  actor: string
): Promise<void> {
  const versions = await db
    .selectFrom("erd_versions")
    .selectAll()
    .where("project_id", "=", projectId)
    .where("git_commit", "is", null)
    .orderBy("version_number")
    .execute();
  for (const v of versions) {
    const ref = `refs/appwithai/versions/${digest(v.id)}`;
    let commit = (await git(dir, ["rev-parse", "--verify", "--quiet", ref]).catch(() => "")).trim();
    if (!commit) {
      const parent =
        (
          await git(dir, ["rev-parse", "--verify", "--quiet", "refs/appwithai/archive"]).catch(
            () => ""
          )
        ).trim() || null;
      // Archived as it was saved. A version that no longer reads as a model
      // document is refused by name, not archived as something else.
      const read = readModelYaml(v.model_yaml, { check: false });
      if (!read.document)
        throw modelRefusal(read.diagnostics, `Version ${v.version_number} is not a valid model document`);
      commit = await commitFiles(
        dir,
        {
          ...modelSourceFiles(v.model_yaml),
          "model/historical-version.json": jsonFile({
            id: v.id,
            version: v.version_number,
            createdAt: v.created_at,
            modelOnly: true,
          }),
        },
        parent,
        `Import model version ${v.version_number}\n`,
        actor,
        "refs/appwithai/archive"
      );
      await git(dir, ["update-ref", ref, commit]);
    }
    await db
      .updateTable("erd_versions")
      .set({ git_commit: commit })
      .where("id", "=", v.id)
      .where("project_id", "=", projectId)
      .execute();
  }
}

export async function importProject(projectId: string, actor: string) {
  return locked(projectId, async (db, dir) => {
    await initialize(db, dir, projectId, actor);
    await archiveVersions(db, dir, projectId, actor);
    return {
      directory: dir,
      commit: await head(dir),
      inventory: Object.keys(await inventory(dir)),
    };
  });
}

export async function saveProject(
  projectId: string,
  actor: string,
  input: SaveInput
): Promise<Result> {
  return locked(projectId, async (db, dir) => {
    const fingerprint = digest(JSON.stringify({ ...input, actor, requestId: undefined }));
    if (input.requestId) {
      const existing = await existingResult(db, projectId, input.requestId, fingerprint);
      if (existing) return existing;
    }
    const previous = await db
      .selectFrom("project_git_state")
      .selectAll()
      .where("project_id", "=", projectId)
      .executeTakeFirst();
    if (
      input.expectedCommit !== undefined &&
      (previous?.model_commit ?? null) !== input.expectedCommit
    )
      throw new RepositoryError(
        "The saved model changed in another window. Reload or compare before saving."
      );
    await initialize(db, dir, projectId, actor);
    const model = input.model ?? (await currentModel(db, projectId));
    if (typeof model !== "string" || model.length > 5_000_000)
      throw new RepositoryError("Model must be text under 5 MB", 400);
    if (!model.trim()) throw new RepositoryError("The model is empty; there is nothing to save.", 400);
    assertSavable(model, input.mode === "version");
    if (previous) {
      // A missing file reads as null from disk and as absent from the tree; a
      // project with no model yet has neither, which is not an edit.
      const baseline = (await treeFiles(dir, previous.model_commit, "model"))[MODEL_YAML] ?? null;
      const working = await readFile(dir, MODEL_YAML);
      if (working !== baseline && working !== encode(model))
        throw new RepositoryError(
          "The model file was edited outside the application. Preserve or import that edit before saving."
        );
    }
    const workflows = await db
      .selectFrom("workflows")
      .selectAll()
      .where("project_id", "=", projectId)
      .orderBy("id")
      .execute();
    return apply(
      db,
      dir,
      projectId,
      input.mode ?? "draft",
      await modelFiles(model, workflows),
      { model, workflows, named: input.mode === "version", description: input.description, actor },
      input.requestId,
      fingerprint
    );
  });
}

export async function changeWorkflow(
  projectId: string,
  actor: string,
  workflowId: string,
  patch: Workflow | null,
  requestId?: string
) {
  return locked(projectId, async (db, dir) => {
    const fingerprint = digest(JSON.stringify({ workflowId, patch, actor }));
    if (requestId) {
      const existing = await existingResult(db, projectId, requestId, fingerprint);
      if (existing)
        return patch
          ? await db
              .selectFrom("workflows")
              .selectAll()
              .where("id", "=", workflowId)
              .where("project_id", "=", projectId)
              .executeTakeFirst()
          : null;
    }
    await initialize(db, dir, projectId, actor);
    const rows: Workflow[] = await db
      .selectFrom("workflows")
      .selectAll()
      .where("project_id", "=", projectId)
      .orderBy("id")
      .execute();
    const found = rows.find((w) => w.id === workflowId);
    const workflows = rows.filter((w) => w.id !== workflowId);
    if (patch)
      workflows.push(
        cleanWorkflow({
          name: "Workflow",
          service_name: "",
          workflow_type: "automation",
          definition_yaml: null,
          status: "draft",
          is_enabled: true,
          ...found,
          ...patch,
          id: workflowId,
          project_id: projectId,
        })
      );
    const model = await currentModel(db, projectId);
    const files = await modelFiles(model, workflows);
    for (const name of Object.keys(await inventory(dir)))
      if (
        (name.startsWith("model/workflows/") || name.startsWith("model/automations/")) &&
        !(name in files)
      )
        files[name] = null;
    await apply(
      db,
      dir,
      projectId,
      "draft",
      files,
      { model, workflows, actor, description: "Save workflows" },
      requestId,
      fingerprint
    );
    return patch ? workflows.find((w) => w.id === workflowId) : null;
  });
}

export async function restoreProject(
  projectId: string,
  actor: string,
  target: {
    versionId?: string;
    commit?: string;
    scope: "model" | "application";
    requestId?: string;
    expectedCommit?: string | null;
  }
) {
  return locked(projectId, async (db, dir) => {
    if (target.requestId) {
      const existing = await existingResult(
        db,
        projectId,
        target.requestId,
        digest(JSON.stringify(target))
      );
      if (existing) return existing;
    }
    const state = await db
      .selectFrom("project_git_state")
      .selectAll()
      .where("project_id", "=", projectId)
      .executeTakeFirst();
    if (target.expectedCommit !== undefined && state?.model_commit !== target.expectedCommit)
      throw new RepositoryError("The saved model changed. Reload before restoring.");
    await initialize(db, dir, projectId, actor);
    await archiveVersions(db, dir, projectId, actor);
    const version = target.versionId
      ? await db
          .selectFrom("erd_versions")
          .selectAll()
          .where("id", "=", target.versionId)
          .where("project_id", "=", projectId)
          .executeTakeFirst()
      : undefined;
    if (target.versionId && !version) throw new RepositoryError("Version not found", 404);
    const commit = version?.git_commit ?? target.commit;
    if (!commit) throw new RepositoryError("Choose a snapshot to restore", 400);
    await assertCommit(dir, commit);
    const snapshot = await treeFiles(dir, commit, target.scope === "model" ? "model" : undefined);
    if (target.scope === "application" && !snapshot[GENERATION])
      throw new RepositoryError("This snapshot has no generated application", 400);
    if (target.scope === "application") {
      const generation = JSON.parse(decode(snapshot[GENERATION]!));
      const input = await treeFiles(dir, generation.inputCommit, "model");
      for (const name of Object.keys(snapshot))
        if (name.startsWith("model/")) delete snapshot[name];
      Object.assign(snapshot, input);
    }
    // Every snapshot the tool restores holds its model as YAML: saves write it,
    // and the one-time conversion archived every version that predates it. A
    // commit that has none is from before that and is not a model to restore.
    if (!snapshot[MODEL_YAML])
      throw new RepositoryError(
        `Snapshot ${commit.slice(0, 8)} has no ${MODEL_YAML}. Restore one of the project's versions instead.`,
        400
      );
    if (target.scope === "model" && !snapshot["model/workflows.json"]) {
      const workflows = await db
        .selectFrom("workflows")
        .selectAll()
        .where("project_id", "=", projectId)
        .orderBy("id")
        .execute();
      const original = await treeFiles(dir, (await head(dir))!, "model");
      Object.assign(snapshot, original, await modelFiles(decode(snapshot[MODEL_YAML]!), workflows));
    }
    // Checkpoint every allowlisted local source before replacing anything.
    await apply(db, dir, projectId, "checkpoint", await inventory(dir), {
      actor,
      description: "Preserve local work before restore",
    });
    const model = decode(snapshot[MODEL_YAML]!);
    const files: Files = {
      ...snapshot,
      [AI_PROJECTION]: encode(projectSource(model)),
    };
    for (const name of Object.keys(await treeFiles(dir, (await head(dir))!))) {
      if (
        (target.scope === "application" || name.startsWith("model/")) &&
        !(name in snapshot) &&
        name !== ".appwithai/project.json" &&
        name !== AI_PROJECTION
      )
        files[name] = null;
    }
    const workflows = snapshot["model/workflows.json"]
      ? JSON.parse(decode(snapshot["model/workflows.json"]!))
      : undefined;
    return apply(
      db,
      dir,
      projectId,
      target.scope === "application" ? "restore-application" : "restore",
      files,
      {
        model,
        workflows,
        named: true,
        actor,
        description: `Restore ${target.scope} from ${commit.slice(0, 8)}`,
      },
      target.requestId,
      digest(JSON.stringify(target)),
      target.expectedCommit
    );
  });
}

/**
 * What generation reads for a saved model commit: the model with the sagas and
 * hooks its automations and services add, as they were saved in that commit.
 *
 * When nothing is added the author's text is what generates, comments and all,
 * so the generated project carries the model exactly as it was written. When
 * something is, the composed document is written canonically under a header
 * naming where each addition came from. Either way it is checked as a model
 * before anything is generated from it.
 */
export function generationInput(
  model: string,
  workflows: Workflow[]
): { modelYaml: string; warnings: CompositionIssue[] } {
  const automations = [];
  const serviceHooks: Array<{ service: string; hooks: ServiceHookDefinition[] }> = [];
  for (const row of workflows) {
    if (row.workflow_type === "automation" && typeof row.definition_yaml === "string") {
      try {
        automations.push({ ...automationFromYaml(row.definition_yaml), name: String(row.name) });
      } catch (error) {
        throw new RepositoryError(
          `Automation "${String(row.name)}" cannot be read: ${error instanceof Error ? error.message : String(error)}`,
          422
        );
      }
    } else if (row.workflow_type === "hooks" && row.hook_definitions) {
      const hooks =
        typeof row.hook_definitions === "string"
          ? (JSON.parse(row.hook_definitions) as ServiceHookDefinition[])
          : (row.hook_definitions as ServiceHookDefinition[]);
      serviceHooks.push({ service: String(row.service_name), hooks });
    }
  }

  const composition = composeModel(readModelDocument(model), { automations, serviceHooks });
  const errors = composition.issues.filter((issue) => issue.severity === "error");
  if (errors.length)
    throw new RepositoryError(
      `The project's automations cannot be added to the model:\n${errors
        .map((issue) => `  ${issue.source}: ${issue.message}`)
        .join("\n")}`,
      422
    );

  const { sagas, hooks } = composition.added;
  const modelYaml =
    sagas || hooks
      ? `# The model in model/model.eml.yaml, with ${sagas} saga(s) and ${hooks} hook(s)\n` +
        "# added from the project's automations and services when it was generated.\n" +
        serializeModelDocument(composition.document)
      : model;
  const read = readModelYaml(modelYaml);
  if (!read.ok) throw modelRefusal(read.diagnostics, "The model cannot be generated from");
  return {
    modelYaml,
    warnings: composition.issues.filter((issue) => issue.severity === "warning"),
  };
}

export async function prepareGeneration(projectId: string, actor: string, input: SaveInput) {
  const saved = await saveProject(projectId, actor, input);
  return locked(projectId, async (_db, dir) => {
    const modelCommit = saved.modelCommit ?? saved.commit;
    const snapshot = await treeFiles(dir, modelCommit, "model");
    if (!snapshot[MODEL_YAML])
      throw new RepositoryError(
        `The saved model ${modelCommit.slice(0, 8)} has no ${MODEL_YAML}; save the model again.`,
        500
      );
    const workflows: Workflow[] = snapshot["model/workflows.json"]
      ? JSON.parse(decode(snapshot["model/workflows.json"]))
      : [];
    const { modelYaml, warnings } = generationInput(decode(snapshot[MODEL_YAML]), workflows);
    return {
      modelCommit,
      /** What generation reads: the saved model, with what its automations add. */
      modelYaml,
      /** What composition had to say that does not stop generation. */
      warnings,
      directory: dir,
      expectedHead: await head(dir),
      sourceHashes: Object.fromEntries(
        Object.entries(await inventory(dir)).map(([k, v]) => [k, v === null ? null : digest(v)])
      ),
    };
  });
}

export async function publishGeneration(
  projectId: string,
  actor: string,
  prepared: Awaited<ReturnType<typeof prepareGeneration>>,
  staging: string,
  options: Record<string, unknown>,
  requestId?: string
) {
  return locked(projectId, async (db, dir) => {
    const incoming = await inventory(staging);
    // The request describes an input and options, not timestamped generator output.
    const fingerprint = digest(JSON.stringify({ input: prepared.modelCommit, actor, options }));
    if (requestId) {
      const existing = await existingResult(db, projectId, requestId, fingerprint);
      if (existing)
        return {
          ...existing,
          inputCommit: prepared.modelCommit,
          stale: (await repositoryHistory(projectId)).state?.model_commit !== prepared.modelCommit,
        };
    }
    if (incoming[MODEL_YAML] && decode(incoming[MODEL_YAML]) !== prepared.modelYaml)
      throw new RepositoryError(
        "The generator changed the input model during validation. Save the corrected model before publishing.",
        422
      );
    // The backend is a cargo crate with no package.json; bun owns the rest.
    for (const required of ["package.json", "backend/Cargo.toml", "frontend/package.json"]) {
      if (!incoming[required])
        throw new RepositoryError(`Generated application is missing ${required}`, 422);
      if (required.endsWith(".json")) JSON.parse(decode(incoming[required]!));
    }
    const current = await inventory(dir);
    for (const name of new Set([...Object.keys(current), ...Object.keys(prepared.sourceHashes)])) {
      if (name.startsWith("model/") || name.startsWith(".appwithai/")) continue;
      if (
        (current[name] === undefined ? undefined : digest(current[name]!)) !==
        prepared.sourceHashes[name]
      )
        throw new RepositoryError(
          `Local source changed during generation: ${name}. Generate again to include it.`
        );
    }
    const manifestText = await readFile(dir, MANIFEST);
    const manifest: Record<string, string> = manifestText ? JSON.parse(decode(manifestText)) : {};
    const old: Files = {};
    for (const [name, blob] of Object.entries(manifest)) {
      if (!/^[a-f0-9]{40,64}$/.test(blob)) throw new RepositoryError("Invalid generated manifest");
      old[name] = encode(await git(dir, ["cat-file", "blob", blob]));
    }
    const changes = await mergeGenerated(dir, old, incoming);
    const nextManifest: Record<string, string> = {};
    for (const [name, bytes] of Object.entries(incoming))
      if (
        bytes !== null &&
        !name.startsWith("model/") &&
        !name.startsWith(".appwithai/") &&
        name !== ".gitignore"
      )
        nextManifest[name] = (
          await git(dir, ["hash-object", "-w", "--stdin"], Buffer.from(bytes, "base64"))
        ).trim();
    // Keep original generated blobs reachable even when the published files are merged.
    // A manifest containing hashes alone does not protect blobs from Git garbage collection.
    const baselineCommit = await commitFiles(
      dir,
      incoming,
      null,
      "Generated source baseline\n",
      actor,
      `refs/appwithai/generated/${randomUUID()}`
    );
    changes[MANIFEST] = jsonFile(nextManifest);
    // Preserve the exact generator input, even if the editor has advanced meanwhile.
    changes[".appwithai/generated-model.eml.yaml"] = encode(prepared.modelYaml);
    changes[".appwithai/generated-model.ai.yaml"] = encode(projectSource(prepared.modelYaml));
    changes[GENERATION] = jsonFile({
      inputCommit: prepared.modelCommit,
      baselineCommit,
      options,
      generatedAt: new Date().toISOString(),
    });
    const result = await apply(
      db,
      dir,
      projectId,
      "generation",
      changes,
      { actor, generationInput: prepared.modelCommit, description: "Generate application" },
      requestId,
      fingerprint
    );
    const state = await db
      .selectFrom("project_git_state")
      .selectAll()
      .where("project_id", "=", projectId)
      .executeTakeFirstOrThrow();
    return {
      ...result,
      stale: state.model_commit !== prepared.modelCommit,
      inputCommit: prepared.modelCommit,
    };
  });
}

export async function repositoryHistory(projectId: string, offset = 0) {
  const db = getDatabase();
  const state = await db
    .selectFrom("project_git_state")
    .selectAll()
    .where("project_id", "=", projectId)
    .executeTakeFirst();
  const rows = await db
    .selectFrom("project_git_operations")
    .select(["id", "kind", "status", "result", "created_at", "payload"])
    .where("project_id", "=", projectId)
    .orderBy("created_at", "desc")
    .limit(50)
    .offset(Math.max(0, Math.floor(offset) || 0))
    .execute();
  return {
    initialized: !!state,
    state,
    stale: !!state?.generation_commit && state.generation_model_commit !== state.model_commit,
    history: rows.map(({ payload, ...r }) => {
      const projection = (JSON.parse(payload) as Operation).projection;
      return {
        ...r,
        actor: projection.actor,
        description: projection.description,
        result: r.result ? JSON.parse(r.result) : null,
      };
    }),
    hasMore: rows.length === 50,
  };
}

export async function compareProject(
  projectId: string,
  from: string,
  to: string,
  includeCode = false
) {
  const dir = await projectDirectory(projectId);
  await ensureRepository(dir, projectId, true, true);
  await assertCommit(dir, from);
  await assertCommit(dir, to);
  const diff = await git(dir, [
    "diff",
    "--no-ext-diff",
    "--no-textconv",
    "--stat",
    "--patch",
    from,
    to,
    "--",
    ...(includeCode ? ["."] : ["model/"]),
  ]);
  return { diff: diff.slice(0, 200000), truncated: diff.length > 200000 };
}

export function repositoryFailure(error: unknown): Response {
  return Response.json(
    {
      error:
        error instanceof RepositoryError
          ? error.message
          : "Repository operation failed. Your edits remain available; retry the same save to recover.",
    },
    { status: error instanceof RepositoryError ? error.status : 503 }
  );
}

/** One model in a project's library: an exported snapshot someone can load again. */
export interface LibraryEntry {
  filename: string;
  projectId: string;
  /** Whether this entry is the project's current model. */
  canonical: boolean;
  content: string;
  createdAt: string;
  downloadUrl: string;
}

/** A library entry is a model file: a plain name ending in `.eml.yaml`. */
const LIBRARY_FILENAME = /^[a-zA-Z0-9._-]+\.eml\.yaml$/;
const libraryPrefix = (filename: string) => `model/library/${digest(filename).slice(0, 24)}`;

export async function projectLibrary(projectId: string): Promise<LibraryEntry[]> {
  const state = await getDatabase()
    .selectFrom("project_git_state")
    .select("project_id")
    .where("project_id", "=", projectId)
    .executeTakeFirst();
  if (!state) return [];
  const dir = await projectDirectory(projectId);
  const entries: LibraryEntry[] = [];
  const files = await inventory(dir);
  for (const name of Object.keys(files).sort()) {
    if (!name.startsWith("model/library/") || !name.endsWith(".json")) continue;
    const meta = JSON.parse(decode(files[name]!));
    const bytes = files[name.replace(/\.json$/, ".eml.yaml")];
    if (!bytes) continue;
    entries.push({
      filename: meta.filename,
      projectId,
      canonical: !!meta.canonical,
      content: decode(bytes),
      createdAt: meta.createdAt,
      downloadUrl: `/api/model-library/${encodeURIComponent(meta.filename)}?projectId=${encodeURIComponent(projectId)}`,
    });
  }
  return entries;
}

/**
 * Keep a model in the project's library. A canonical entry also becomes the
 * project's model, through the same checks a save makes.
 */
export async function saveLibraryModel(
  projectId: string,
  actor: string,
  entry: { filename: string; content: string; canonical?: boolean },
  requestId?: string
) {
  if (!LIBRARY_FILENAME.test(entry.filename) || entry.filename.includes(".."))
    throw new RepositoryError("A library model must have a plain name ending in .eml.yaml", 400);
  if (typeof entry.content !== "string" || entry.content.length > 5_000_000)
    throw new RepositoryError("A library model must be text under 5 MB", 400);
  assertSavable(entry.content, false);
  return locked(projectId, async (db, dir) => {
    await initialize(db, dir, projectId, actor);
    const prefix = libraryPrefix(entry.filename);
    const files: Files = {
      [`${prefix}.eml.yaml`]: encode(entry.content),
      [`${prefix}.json`]: jsonFile({
        filename: entry.filename,
        canonical: !!entry.canonical,
        createdAt: new Date().toISOString(),
      }),
    };
    if (entry.canonical) {
      for (const [name, bytes] of Object.entries(await inventory(dir)))
        if (
          name.startsWith("model/library/") &&
          name.endsWith(".json") &&
          name !== `${prefix}.json` &&
          bytes
        ) {
          const meta = JSON.parse(decode(bytes));
          if (meta.canonical) files[name] = jsonFile({ ...meta, canonical: false });
        }
    }
    const model = entry.canonical ? entry.content : await currentModel(db, projectId);
    const workflows = await db
      .selectFrom("workflows")
      .selectAll()
      .where("project_id", "=", projectId)
      .orderBy("id")
      .execute();
    Object.assign(files, await modelFiles(model, workflows));
    return apply(
      db,
      dir,
      projectId,
      "draft",
      files,
      { model, workflows, actor, description: `Save library model ${entry.filename}` },
      requestId,
      digest(JSON.stringify(entry))
    );
  });
}

export async function deleteLibraryModel(projectId: string, actor: string, filename: string) {
  if (!LIBRARY_FILENAME.test(filename) || filename.includes(".."))
    throw new RepositoryError("A library model must have a plain name ending in .eml.yaml", 400);
  return locked(projectId, async (db, dir) => {
    await initialize(db, dir, projectId, actor);
    const prefix = libraryPrefix(filename);
    const model = await currentModel(db, projectId);
    return apply(
      db,
      dir,
      projectId,
      "draft",
      { [`${prefix}.eml.yaml`]: null, [`${prefix}.json`]: null },
      { model, actor, description: `Remove library model ${filename}` }
    );
  });
}

/** Explicit source edits in the enhancement editor are journaled like model saves. */
export async function saveProjectFiles(
  projectId: string,
  actor: string,
  files: Record<string, string>,
  requestId?: string
) {
  return locked(projectId, async (db, dir) => {
    await initialize(db, dir, projectId, actor);
    const encoded = Object.fromEntries(
      Object.entries(files).map(([name, content]) => [name, encode(content)])
    );
    return apply(
      db,
      dir,
      projectId,
      "enhancement",
      encoded,
      { actor, description: "Save generated source edits" },
      requestId
    );
  });
}

/** Read-only model context for the assistant, selected from a saved Git snapshot. */
export async function projectModelContext(
  projectId: string,
  question = "",
  commit?: string
): Promise<ModelContext & { commit: string | null; projection: string; recentDiff: string }> {
  const state = await getDatabase()
    .selectFrom("project_git_state")
    .selectAll()
    .where("project_id", "=", projectId)
    .executeTakeFirst();
  const selectedCommit = commit ?? state?.model_commit;

  let source: string;
  let recentDiff = "";
  if (!selectedCommit) {
    source = await currentModel(getDatabase(), projectId);
  } else {
    const dir = await projectDirectory(projectId);
    await ensureRepository(dir, projectId, true, true);
    const snapshot = await treeFiles(dir, selectedCommit, "model");
    source = snapshot[MODEL_YAML] ? decode(snapshot[MODEL_YAML]) : "";
    const parent = (await git(dir, ["rev-list", "--parents", "-n", "1", selectedCommit]))
      .trim()
      .split(" ")[1];
    recentDiff = parent
      ? (
          await git(dir, [
            "diff",
            "--no-ext-diff",
            "--no-textconv",
            "--unified=2",
            parent,
            selectedCommit,
            "--",
            AI_PROJECTION,
          ])
        ).slice(0, 8000)
      : "";
  }

  // A project with no model yet has nothing to select from, which is an answer
  // — an empty context — not a failure.
  if (!source.trim()) {
    return {
      yaml: "",
      graph: { nodes: [], links: [] },
      entityNames: [],
      truncated: false,
      fingerprint: "",
      commit: selectedCommit ?? null,
      projection: "",
      recentDiff,
    };
  }
  const document = readModelDocument(source);
  return {
    ...selectModelContext(document, question),
    commit: selectedCommit ?? null,
    projection: projectSource(source),
    recentDiff,
  };
}
