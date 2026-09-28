/**
 * One generated application, shared by every file in this suite.
 *
 * Generating `examples/drug-discovery.eml.yaml` takes tens of seconds, so it
 * happens once per run and every spec reads the same tree. The output lands
 * outside the repository: a generated project inside it would be picked up by
 * the repo's own linters and type-checker, and `--force` would then be
 * rewriting files a developer might have open.
 *
 * `generateOnce` is idempotent within a process and safe to call from any
 * `beforeAll` — the first caller does the work and the rest await the same
 * promise, so specs do not race each other for the tree.
 */

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { ParsedModel } from "../../../src/model/compile";
import type { ModelDocument } from "../../../src/model-yaml";

const exec = promisify(execFile);

export const REPO_ROOT = path.resolve(import.meta.dirname, "../../../../..");
export const MODEL_PATH = path.join(REPO_ROOT, "examples/drug-discovery.eml.yaml");

/** The model's text and the document it validates to — refused, loudly, if it has errors. */
async function readModel(): Promise<{ modelText: string; document: ModelDocument }> {
  const { readModelYaml } = await import("../../../src/model-yaml");
  const modelText = await fs.readFile(MODEL_PATH, "utf-8");
  const result = readModelYaml(modelText);
  if (!result.ok || !result.document) {
    const errors = result.diagnostics
      .filter((diagnostic) => diagnostic.severity === "error")
      .map(
        (diagnostic) =>
          `${diagnostic.line}:${diagnostic.column} ${diagnostic.code} ${diagnostic.message}`
      );
    throw new Error(`${MODEL_PATH} is not a valid model:\n${errors.join("\n")}`);
  }
  return { modelText, document: result.document };
}

/** Where the generated app lands. Overridable so CI can put it on a fast disk. */
export const OUTPUT_DIR =
  process.env.E2E_OUTPUT_DIR ?? path.join(os.tmpdir(), "appwithai-e2e", "drug-discovery");

/** The crate name, and therefore the database names, of the generated app. */
export const PROJECT_NAME = "drugdiscovery";

export interface Fixture {
  /** Absolute path to the generated project root. */
  dir: string;
  /** The model the generator parsed, as it parsed it. */
  model: ParsedModel;
  /** Wall-clock milliseconds the generation took. */
  generationMs: number;
  /** Every file in the generated tree, project-relative, sorted. */
  files: string[];
}

let pending: Promise<Fixture> | null = null;

/** Every file under `dir`, as paths relative to it. Sorted, so diffs read. */
export async function listFiles(dir: string): Promise<string[]> {
  const found: string[] = [];
  async function walk(current: string): Promise<void> {
    let entries: Awaited<ReturnType<typeof fs.readdir>>;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      // Build output, not generated source.
      if (entry.name === "target" || entry.name === "node_modules" || entry.name === ".git") {
        continue;
      }
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else found.push(path.relative(dir, full));
    }
  }
  await walk(dir);
  return found.sort();
}

export function generateOnce(): Promise<Fixture> {
  pending ??= (async () => {
    const { generateApplication } = await import("../../../src/pipeline/generate-application");

    // The global setup generates the tree in the main process and then stands
    // the application up on it. A worker that regenerated would be deleting the
    // crate the running server was compiled from, so it re-reads instead.
    if (process.env.E2E_REUSE_OUTPUT === "1") {
      const { compileModelDocument } = await import("../../../src/model-yaml");
      const model = compileModelDocument((await readModel()).document);
      return { dir: OUTPUT_DIR, model, generationMs: 0, files: await listFiles(OUTPUT_DIR) };
    }

    await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const { modelText, document } = await readModel();
    const started = performance.now();
    const model = await generateApplication({
      document,
      modelText,
      outputDir: OUTPUT_DIR,
      projectName: PROJECT_NAME,
      // The scaffold shells out to `loco new`, which needs the network and the
      // Loco CLI. The overlay is what this suite is about, and `scaffold.ts`
      // has its own coverage.
      skipCliScaffold: true,
      recordsPerEntity: 25,
    });
    const generationMs = performance.now() - started;

    return { dir: OUTPUT_DIR, model, generationMs, files: await listFiles(OUTPUT_DIR) };
  })();
  return pending;
}

/** Read a file from the generated tree. Throws, loudly, when it is not there. */
export async function readGenerated(relative: string): Promise<string> {
  const { dir } = await generateOnce();
  return fs.readFile(path.join(dir, relative), "utf-8");
}

/** Whether a path exists in the generated tree. */
export async function generatedExists(relative: string): Promise<boolean> {
  const { dir } = await generateOnce();
  return fs
    .access(path.join(dir, relative))
    .then(() => true)
    .catch(() => false);
}

/** Run a command inside the generated project. Used by the application specs. */
export async function inProject(
  command: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs?: number } = {}
): Promise<{ stdout: string; stderr: string }> {
  const { dir } = await generateOnce();
  return exec(command, args, {
    cwd: options.cwd ?? dir,
    env: { ...process.env, ...options.env },
    timeout: options.timeoutMs ?? 600_000,
    maxBuffer: 64 * 1024 * 1024,
  });
}

let duplicate: Promise<string> | null = null;

/**
 * A second, independent generation of the same model into a different path.
 *
 * The dictionary's ids are deterministic UUIDv5s and the seeds claim to be
 * stable across regenerations; the only honest way to assert that is to
 * generate twice and compare. Generating is a couple of seconds, so the second
 * tree is built once and shared like the first.
 */
export function generateDuplicate(): Promise<string> {
  duplicate ??= (async () => {
    const { generateApplication } = await import("../../../src/pipeline/generate-application");
    const dir = `${OUTPUT_DIR}-again`;
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
    await generateApplication({
      ...(await readModel()),
      outputDir: dir,
      projectName: PROJECT_NAME,
      skipCliScaffold: true,
      recordsPerEntity: 25,
    });
    return dir;
  })();
  return duplicate;
}
