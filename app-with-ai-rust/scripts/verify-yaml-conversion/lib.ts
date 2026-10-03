/**
 * Shared pieces of the verification that the repository copies, converted to
 * YAML models, still mean exactly what their Mermaid originals meant.
 *
 *   bun scripts/verify-yaml-conversion/verify.ts --mermaid <dir>
 *
 * --mermaid <dir> holds each original repository at the commit COPIES.yaml
 * records, one directory per copy, named as the copy is
 * (`<dir>/app-with-ai-rust`, `<dir>/enterprise-reporting-rust`, …). It is not
 * part of this repository.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

/** This copy of app-with-ai-rust. */
export const PLATFORM = resolve(import.meta.dir, "../..");
/** cedm-specification, which holds the four copies side by side. */
export const ROOT = resolve(PLATFORM, "..");

export const COPIES = [
  "app-with-ai-rust",
  "app-and-report-with-ai-rust",
  "enterprise-reporting-rust",
  "businessappwithairust",
] as const;
export type Copy = (typeof COPIES)[number];

/**
 * Files with the old extension that never were models, and what they are.
 * Each must read as zero entities, which is what proves it.
 */
export const NOT_MODELS: Record<string, string> = {
  "app-with-ai-rust/examples/clinic.mmd": "a design essay; the model it describes is examples/clinic.erd",
  "app-with-ai-rust/examples/gemini-crm.mmd": "a styled diagram of examples/gemini-crm-erd, not a model",
  "app-and-report-with-ai-rust/common/examples/clinic.mmd": "the same design essay, kept as clinic.md",
};

/**
 * Where a model of a copy went. A model keeps its directory and becomes
 * `<stem>.eml.yaml`, except where a copy's layout moved it.
 */
export function yamlPathFor(key: string): string | undefined {
  if (key in NOT_MODELS) return undefined;
  let moved = key
    // The platform's YAML examples sit under language/yaml/.
    .replace(/^app-with-ai-rust\/language\/examples\//, "app-with-ai-rust/language/yaml/examples/")
    // The orchestrator's own language copy is gone; its reference models moved
    // beside its other examples.
    .replace(
      /^app-and-report-with-ai-rust\/common\/language\/examples\//,
      "app-and-report-with-ai-rust/common/examples/"
    );
  // Two files of that name in one directory: the bare one is the original
  // model, the .eml one its revision.
  if (moved === "app-and-report-with-ai-rust/common/examples/hospital-management-system.mmd") {
    moved = moved.replace(/\.mmd$/, ".original.mmd");
  }
  const stem = basename(moved).replace(/\.mmd$/i, "").replace(/\.eml$/i, "");
  return join(dirname(moved), `${stem}.eml.yaml`);
}

export function walk(dir: string, accept: (file: string) => boolean, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === "target") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, accept, out);
    else if (accept(path)) out.push(path);
  }
  return out.sort();
}

export interface ModelPair {
  /** `<copy>/<path>` of the original file. */
  key: string;
  mermaid: string;
  /** Absolute path of its YAML counterpart, or undefined for a non-model. */
  yaml?: string;
}

/** Every file with the old extension in the originals, paired with its YAML. */
export function modelPairs(mermaidDir: string, copies: readonly Copy[] = COPIES): ModelPair[] {
  return copies.flatMap((copy) =>
    walk(join(mermaidDir, copy), (file) => file.endsWith(".mmd")).map((file) => {
      const key = relative(mermaidDir, file);
      const target = yamlPathFor(key);
      return { key, mermaid: file, yaml: target ? join(ROOT, target) : undefined };
    })
  );
}

export function run(
  command: string,
  args: string[],
  options: { cwd?: string; env?: Record<string, string> } = {}
): { status: number; stdout: string; stderr: string } {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? PLATFORM,
    env: { ...process.env, ...options.env },
    encoding: "utf8",
    maxBuffer: 1 << 30,
  });
  return { status: result.status ?? 1, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

/** Deep structural difference, reported as paths; empty means equal. */
export function differences(a: unknown, b: unknown, limit = 12, path = "", out: string[] = []): string[] {
  if (out.length >= limit) return out;
  if (JSON.stringify(a) === JSON.stringify(b)) return out;
  if (a && b && typeof a === "object" && typeof b === "object" && Array.isArray(a) === Array.isArray(b)) {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)]))
      differences((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], limit, `${path}.${key}`, out);
    return out;
  }
  out.push(
    `${path || "(root)"}: mermaid ${JSON.stringify(a)?.slice(0, 160)} ≠ yaml ${JSON.stringify(b)?.slice(0, 160)}`
  );
  return out;
}

export function requireDir(path: string | undefined, what: string): string {
  if (!path || !existsSync(path)) {
    console.error(`${what} not found: ${path ?? "(not given)"}`);
    process.exit(2);
  }
  return resolve(path);
}

/** One verification outcome. */
export interface Check {
  section: string;
  subject: string;
  ok: boolean;
  detail?: string[];
}
