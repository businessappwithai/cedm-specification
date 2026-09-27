/**
 * The repository half of the conversion: each project's local Git history.
 *
 * A project's history kept its model as Mermaid — `model/model.eml.mmd`, the
 * designer's buffer in `model/editor.eml.mmd`, one diagram per workflow under
 * `model/diagrams/`, library entries under `model/library/`, and whatever a
 * generation shipped. The tool no longer reads any of it, and its snapshot
 * allow-list no longer admits the extension, so nothing it does would ever
 * remove those files: this is the one commit that does.
 *
 * The commit is built on the project's HEAD and holds the model and workflows
 * exactly as the tool writes them (`modelFiles`), every library entry and
 * every other Mermaid model converted to YAML beside where it was, and every
 * `.mmd` removed. A file that differs on disk from HEAD is someone's work that
 * was never committed; the project is refused rather than overwritten.
 *
 * Projects that never had a history keep legacy library entries in
 * `<output>/.mermaid-library`. Those are converted into the project's folder,
 * where the tool's first save imports them.
 */

import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { type Kysely, sql } from "kysely";
import { digest, encode, type Files, git, MODEL_YAML, outputRoot } from "../project-git";
import { AI_PROJECTION, modelFiles } from "../project-repository";
import { type Conversion, convertModel } from "./convert";
import { auditId, type Item } from "./database";

// biome-ignore lint/suspicious/noExplicitAny: rows are read with raw SQL.
type Db = Kysely<any>;

export const CONVERSION_MARKER = "APPWITHAI-Operation: convert-stored-models";
const EDITOR = "model/editor.eml.mmd";
const MODEL = "model/model.eml.mmd";

/** A library entry's file name once its model is YAML. */
export const libraryName = (filename: string) =>
  filename.replace(/(\.eml)?\.mmd$/i, "").replace(/\.eml\.ya?ml$/i, "") + ".eml.yaml";
const libraryPrefix = (filename: string) => `model/library/${digest(filename).slice(0, 24)}`;

export interface RepositoryPlan {
  projectId: string;
  directory: string;
  head: string;
  /** Everything read from the history, and what it became. */
  items: Item[];
  /** Files written besides the model's own, keyed by path; null removes. */
  files: Files;
  /** Uncommitted edits on disk to a file the commit would replace. */
  edited: string[];
}

export interface LegacyLibraryPlan {
  directory: string;
  items: Array<Item & { target: string | null; meta: Record<string, unknown> }>;
}

async function tracked(dir: string, commit: string): Promise<Map<string, string>> {
  const list = await git(dir, ["ls-tree", "-r", "-z", commit]);
  const blobs = new Map<string, string>();
  for (const row of list.split("\0").filter(Boolean)) {
    const match = /^(100644|100755) blob ([a-f0-9]+)\t(.+)$/.exec(row);
    if (match) blobs.set(match[3]!, match[2]!);
  }
  return blobs;
}

const blobText = (dir: string, blob: string) => git(dir, ["cat-file", "blob", blob]);

/** The project folders with a history, under the tool's output directory. */
async function projectsWithHistory(
  db: Db
): Promise<Array<{ projectId: string; directory: string }>> {
  const root = outputRoot();
  if (!existsSync(root)) return [];
  const real = await fs.realpath(root);
  const rows = await sql<{
    project_id: string;
  }>`SELECT project_id FROM project_git_state ORDER BY project_id`.execute(db);
  return rows.rows
    .map((row) => ({ projectId: row.project_id, directory: path.join(real, row.project_id) }))
    .filter(({ directory }) => existsSync(path.join(directory, ".git")));
}

/**
 * What a project's history needs, or nothing when it has been converted: no
 * Mermaid left in HEAD, and the model file already the model the tool holds.
 */
export async function planRepository(
  projectId: string,
  directory: string,
  currentModel: string,
  workflows: Array<Record<string, unknown>>
): Promise<RepositoryPlan | null> {
  const head = (
    await git(directory, ["rev-parse", "--verify", "--quiet", "HEAD"]).catch(() => "")
  ).trim();
  if (!head) return null;
  const blobs = await tracked(directory, head);
  const mermaid = [...blobs.keys()].filter((name) => /\.mmd$/i.test(name)).sort();
  const modelBlob = blobs.get(MODEL_YAML);
  const modelInHistory = modelBlob ? await blobText(directory, modelBlob) : "";
  if (!mermaid.length && modelInHistory === currentModel) return null;

  const plan: RepositoryPlan = { projectId, directory, head, items: [], files: {}, edited: [] };
  const item = (key: string, original: string, conversion: Conversion, retired?: string): Item => ({
    source: "repository",
    key: `${key}@${head}`,
    projectId,
    original,
    conversion,
    ...(retired ? { retired } : {}),
  });

  for (const name of mermaid) {
    const original = await blobText(directory, blobs.get(name)!);
    plan.files[name] = null;
    if (name === MODEL || name === EDITOR) {
      plan.items.push(
        item(
          name,
          original,
          { ok: true, yaml: "", notes: [] },
          `the project's model is ${MODEL_YAML}`
        )
      );
    } else if (name.startsWith("model/diagrams/")) {
      plan.items.push(
        item(
          name,
          original,
          { ok: true, yaml: "", notes: [] },
          "a workflow's diagram; the workflow itself is kept"
        )
      );
    } else if (name.startsWith("model/library/")) {
      const metaBlob = blobs.get(name.replace(/\.mmd$/i, ".json"));
      const meta = metaBlob
        ? (JSON.parse(await blobText(directory, metaBlob)) as Record<string, unknown>)
        : {};
      const conversion =
        meta.type === "rules"
          ? ({
              ok: false,
              error: "a library entry holding only rules is not a model",
              notes: [],
            } as Conversion)
          : convertModel(original);
      plan.items.push(item(name, original, conversion));
      if (metaBlob) plan.files[name.replace(/\.mmd$/i, ".json")] = null;
      if (conversion.ok) {
        const filename = libraryName(String(meta.filename ?? path.basename(name)));
        const prefix = libraryPrefix(filename);
        plan.files[`${prefix}.eml.yaml`] = encode(conversion.yaml);
        plan.files[`${prefix}.json`] = encode(
          `${JSON.stringify({ filename, canonical: !!meta.canonical, createdAt: meta.createdAt ?? new Date().toISOString() }, null, 2)}\n`
        );
      }
    } else {
      // Any other Mermaid model — what a generation shipped, or one kept beside
      // the model when a generated project was first imported — stays beside
      // where it was, as YAML.
      const conversion = convertModel(original);
      plan.items.push(item(name, original, conversion));
      if (conversion.ok)
        plan.files[name.replace(/(\.eml)?\.mmd$/i, ".eml.yaml")] = encode(conversion.yaml);
    }
  }

  // The model and workflows, written as the tool writes them; everything under
  // `model/workflows/` and `model/automations/` that they do not include goes.
  const layout = await modelFiles(currentModel, workflows);
  for (const name of [MODEL_YAML, AI_PROJECTION])
    if (!(name in layout) && blobs.has(name)) plan.files[name] = null;
  for (const name of blobs.keys())
    if (
      (name.startsWith("model/workflows/") || name.startsWith("model/automations/")) &&
      !(name in layout)
    )
      plan.files[name] = null;
  Object.assign(plan.files, layout);

  for (const [name, value] of Object.entries(plan.files)) {
    const blob = blobs.get(name);
    const committed = blob ? encode(await blobText(directory, blob)) : null;
    const onDisk = await fs
      .readFile(path.join(directory, name))
      .then((bytes) => bytes.toString("base64"))
      .catch((e: NodeJS.ErrnoException) => {
        if (e.code === "ENOENT") return null;
        throw e;
      });
    if (onDisk !== committed && onDisk !== value) plan.edited.push(name);
  }
  return plan;
}

/**
 * Every history that needs converting. Before the database is converted — a
 * dry run — the model and automations it will hold are passed in, so the plan
 * describes the commit the real run makes.
 */
export async function planRepositories(
  db: Db,
  pending?: { models: Map<string, string>; definitions: Map<string, string | null> }
): Promise<RepositoryPlan[]> {
  const plans: RepositoryPlan[] = [];
  for (const { projectId, directory } of await projectsWithHistory(db)) {
    const state = await sql<{ model_code: string }>`
      SELECT model_code FROM project_git_state WHERE project_id = ${projectId}`.execute(db);
    const model = pending?.models.get(projectId) ?? state.rows[0]?.model_code ?? "";
    const rows = (
      await sql`SELECT * FROM workflows WHERE project_id = ${projectId} ORDER BY id`.execute(db)
    ).rows as Array<Record<string, unknown>>;
    const workflows = rows
      .filter((row) => !pending || pending.definitions.get(String(row.id)) !== null)
      .map((row) =>
        pending?.definitions.has(String(row.id))
          ? {
              ...row,
              workflow_type: "automation",
              definition_yaml: pending.definitions.get(String(row.id)),
            }
          : row
      );
    const plan = await planRepository(projectId, directory, model, workflows);
    if (plan) plans.push(plan);
  }
  return plans;
}

/** Commit `files` on `parent` without the snapshot allow-list, which refuses `.mmd`. */
async function commitConversion(dir: string, parent: string, files: Files): Promise<string> {
  const index = path.join(dir, ".git", `appwithai-index-${randomUUID()}`);
  const env = {
    GIT_INDEX_FILE: index,
    GIT_AUTHOR_NAME: "APPWITHAI",
    GIT_AUTHOR_EMAIL: "local@appwithai.invalid",
    GIT_COMMITTER_NAME: "APPWITHAI",
    GIT_COMMITTER_EMAIL: "local@appwithai.invalid",
  };
  try {
    await git(dir, ["read-tree", parent], undefined, env);
    let entries = "";
    for (const [name, value] of Object.entries(files)) {
      if (value === null) entries += `0 ${"0".repeat(40)}\t${name}\0`;
      else {
        const blob = (
          await git(dir, ["hash-object", "-w", "--stdin"], Buffer.from(value, "base64"), env)
        ).trim();
        entries += `100644 ${blob}\t${name}\0`;
      }
    }
    await git(dir, ["update-index", "-z", "--index-info"], entries, env);
    const tree = (await git(dir, ["write-tree"], undefined, env)).trim();
    const commit = (
      await git(
        dir,
        ["commit-tree", tree, "-p", parent],
        `Convert the model to YAML\n\nThe model, its versions and its library are YAML; the Mermaid files are\nkept in the database's stored_model_conversions table.\n\n${CONVERSION_MARKER}\n`,
        env
      )
    ).trim();
    await git(dir, ["update-ref", "HEAD", commit, parent]);
    return commit;
  } finally {
    await fs.rm(index, { force: true });
  }
}

export async function applyRepository(db: Db, plan: RepositoryPlan, archiveUnconvertible: boolean) {
  if (plan.edited.length)
    throw new Error(
      `${plan.projectId}: edited outside the tool and not committed: ${plan.edited.join(", ")}`
    );
  if (!archiveUnconvertible && plan.items.some((i) => !i.conversion.ok))
    throw new Error(
      `${plan.projectId}: its history holds files that cannot be converted; see the plan`
    );

  const lock = await sql<{ locked: boolean }>`
    SELECT pg_try_advisory_lock(hashtextextended(${`project-git:${plan.projectId}`}, 0)) AS locked`.execute(
    db
  );
  if (!lock.rows[0]?.locked)
    throw new Error(`${plan.projectId}: the tool is saving this project; stop it first`);
  try {
    const head = (await git(plan.directory, ["rev-parse", "HEAD"])).trim();
    if (head !== plan.head)
      throw new Error(`${plan.projectId}: its history moved since the plan; run again`);
    const commit = await commitConversion(plan.directory, plan.head, plan.files);

    for (const [name, value] of Object.entries(plan.files)) {
      const target = path.join(plan.directory, name);
      if (value === null) await fs.rm(target, { force: true });
      else {
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, Buffer.from(value, "base64"));
      }
    }
    await git(plan.directory, ["read-tree", commit]);

    // Versions are re-archived from their converted text when one is restored,
    // which happens only for a version with no archive of its own.
    const refs = await git(plan.directory, [
      "for-each-ref",
      "--format=%(refname)",
      "refs/appwithai/versions",
    ]);
    for (const ref of refs.split("\n").filter(Boolean))
      await git(plan.directory, ["update-ref", "-d", ref]);

    const now = new Date().toISOString();
    await db.transaction().execute(async (tx) => {
      for (const item of plan.items) await record(tx, item, now);
      await sql`UPDATE project_git_state SET model_commit = ${commit}, updated_at = ${now}
                 WHERE project_id = ${plan.projectId}`.execute(tx);
    });
    return commit;
  } finally {
    await sql`SELECT pg_advisory_unlock(hashtextextended(${`project-git:${plan.projectId}`}, 0))`.execute(
      db
    );
  }
}

async function record(tx: Db, item: Item, now: string) {
  await sql`
    INSERT INTO stored_model_conversions
      (id, project_id, source, source_key, original_text, converted_text, issues, error, converted_at)
    VALUES (${auditId(item.source, item.key)}, ${item.projectId}, ${item.source}, ${item.key}, ${item.original},
            ${item.conversion.ok && item.conversion.yaml ? item.conversion.yaml : null},
            ${JSON.stringify(item.retired ? [...item.conversion.notes, `retired: ${item.retired}`] : item.conversion.notes)},
            ${item.conversion.ok ? null : item.conversion.error}, ${now})
    ON CONFLICT (id) DO NOTHING`.execute(tx);
}

/* -------------------------------------------------------------------------- */
/*  Library entries of projects that had no history                            */
/* -------------------------------------------------------------------------- */

export async function planLegacyLibrary(db: Db): Promise<LegacyLibraryPlan | null> {
  const directory = path.join(outputRoot(), ".mermaid-library");
  if (!existsSync(directory)) return null;
  const withHistory = new Set(
    (
      await sql<{ project_id: string }>`SELECT project_id FROM project_git_state`.execute(db)
    ).rows.map((r) => r.project_id)
  );
  const projects = new Set(
    (await sql<{ id: string }>`SELECT id FROM projects`.execute(db)).rows.map((r) => r.id)
  );
  const plan: LegacyLibraryPlan = { directory, items: [] };
  for (const entry of (await fs.readdir(directory))
    .filter((n) => n.endsWith(".meta.json"))
    .sort()) {
    const meta = JSON.parse(await fs.readFile(path.join(directory, entry), "utf8")) as Record<
      string,
      unknown
    >;
    const filename = path.basename(String(meta.filename ?? ""));
    const projectId = typeof meta.projectId === "string" ? meta.projectId : null;
    const original = await fs.readFile(path.join(directory, filename), "utf8").catch(() => "");
    const base = { source: "legacy_library" as const, key: entry, projectId, original, meta };
    if (!projectId || !projects.has(projectId)) {
      plan.items.push({
        ...base,
        target: null,
        conversion: { ok: false, error: "its project does not exist", notes: [] },
      });
    } else if (withHistory.has(projectId)) {
      // The tool imported the entry into the project's history when it
      // created it; the history's copy is the one converted.
      plan.items.push({
        ...base,
        target: null,
        conversion: { ok: true, yaml: "", notes: [] },
        retired: "imported into the project's history",
      });
    } else if (meta.type === "rules") {
      plan.items.push({
        ...base,
        target: null,
        conversion: {
          ok: false,
          error: "a library entry holding only rules is not a model",
          notes: [],
        },
      });
    } else {
      plan.items.push({
        ...base,
        target: libraryPrefix(libraryName(filename)),
        conversion: convertModel(original),
      });
    }
  }
  return plan;
}

export async function applyLegacyLibrary(
  db: Db,
  plan: LegacyLibraryPlan,
  archiveUnconvertible: boolean
) {
  if (!archiveUnconvertible && plan.items.some((i) => !i.conversion.ok))
    throw new Error("the legacy library holds entries that cannot be converted; see the plan");
  const root = await fs.realpath(outputRoot());
  const now = new Date().toISOString();
  for (const item of plan.items) {
    if (!item.conversion.ok || !item.target || !item.projectId) continue;
    const folder = path.join(root, item.projectId);
    await fs.mkdir(path.join(folder, "model/library"), { recursive: true });
    const filename = libraryName(String(item.meta.filename));
    await fs.writeFile(path.join(folder, `${item.target}.eml.yaml`), item.conversion.yaml);
    await fs.writeFile(
      path.join(folder, `${item.target}.json`),
      `${JSON.stringify({ filename, canonical: !!item.meta.canonical, createdAt: item.meta.createdAt ?? now }, null, 2)}\n`
    );
  }
  await db.transaction().execute(async (tx) => {
    for (const item of plan.items) await record(tx, item, now);
  });
  // Kept, renamed: nothing reads it any more, and every entry is in the audit table.
  let retired = `${plan.directory}.converted`;
  if (existsSync(retired)) retired = `${retired}-${now.replace(/[:.]/g, "-")}`;
  await fs.rename(plan.directory, retired);
  return retired;
}
