/**
 * Shared pieces of the Mermaid → YAML verification (`bun yaml/verify/verify.ts`).
 *
 * The verification compares each repository under `yaml/` with the same
 * repository as it was before conversion — its Mermaid form — and passes only
 * when the two produce the same things. Two inputs make that possible:
 *
 *   --mermaid <dir>     the repositories as imported, one directory each
 *                       (`<dir>/app-and-report-with-ai-rust`, …). `bun
 *                       yaml/verify/verify.ts --fetch` materialises it from the
 *                       commits `yaml/SOURCES.yaml` records.
 *   --reference <dir>   a checkout of this repository at 18f5792, the last
 *                       commit whose generator read Mermaid, with its
 *                       dependencies installed. It is the only thing here that
 *                       reads a Mermaid model.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

export const ROOT = resolve(import.meta.dir, "../..");
export const YAML_ROOT = join(ROOT, "yaml");
export const REPOSITORIES = [
  "app-and-report-with-ai-rust",
  "enterprise_reporting_rust",
  "businessappwithairust",
] as const;
export type Repository = (typeof REPOSITORIES)[number];

/** The commit before which the generator read Mermaid. */
export const REFERENCE_COMMIT = "18f5792";

/**
 * Where a Mermaid model of an imported repository went. Mirrors
 * `scripts/convert-model-files.ts`, plus the one rename and the one move the
 * conversion made.
 */
export function yamlPathFor(mermaidRelative: string): string | undefined {
  if (mermaidRelative === "app-and-report-with-ai-rust/common/examples/clinic.mmd") return undefined;
  // The orchestrator's own language copy is gone (it uses the one at the root),
  // and the reference models it carried moved beside its other examples.
  const moved = mermaidRelative.replace(
    /^app-and-report-with-ai-rust\/common\/language\/examples\//,
    "app-and-report-with-ai-rust/common/examples/"
  );
  const renamed =
    moved === "app-and-report-with-ai-rust/common/examples/hospital-management-system.mmd"
      ? moved.replace(/\.mmd$/, ".original.mmd")
      : moved;
  const stem = basename(renamed).replace(/\.mmd$/i, "").replace(/\.eml$/i, "");
  return join(dirname(renamed), `${stem}.eml.yaml`);
}

export function walk(dir: string, accept: (file: string) => boolean, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, accept, out);
    else if (accept(path)) out.push(path);
  }
  return out.sort();
}

/**
 * Where the orchestrator's Mermaid copy has its dependency checkouts placed
 * (`./deps.sh` put them there; they are other repositories, not its files).
 */
export const ORCHESTRATOR_CHECKOUTS = [
  "app-and-report-with-ai-rust/app-with-ai-rust/",
  "app-and-report-with-ai-rust/enterprise_reporting_rust/",
];

export function mermaidModels(mermaidDir: string): Array<{ mermaid: string; yaml?: string; key: string }> {
  return walk(mermaidDir, (file) => file.endsWith(".mmd"))
    .filter((file) => !ORCHESTRATOR_CHECKOUTS.some((dir) => relative(mermaidDir, file).startsWith(dir)))
    .map((file) => {
    const key = relative(mermaidDir, file);
    const target = yamlPathFor(key);
    return { mermaid: file, key, yaml: target ? join(YAML_ROOT, target) : undefined };
  });
}

export function run(
  command: string,
  args: string[],
  options: { cwd?: string; env?: Record<string, string> } = {}
): { status: number; stdout: string; stderr: string } {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? ROOT,
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
  if (
    a && b && typeof a === "object" && typeof b === "object" && Array.isArray(a) === Array.isArray(b)
  ) {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)]))
      differences((a as any)[key], (b as any)[key], limit, `${path}.${key}`, out);
    return out;
  }
  out.push(`${path || "(root)"}: mermaid ${JSON.stringify(a)?.slice(0, 200)} ≠ yaml ${JSON.stringify(b)?.slice(0, 200)}`);
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
