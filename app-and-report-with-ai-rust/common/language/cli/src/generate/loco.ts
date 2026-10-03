/**
 * TanStack Start + Loco.rs generation target — `--stack tanstack-astryx-loco`.
 *
 * Drives the SHIPPED pipeline in `app-with-ai-rust` —
 * `packages/generator/src/pipeline/generate-application.ts`, which its own CLI
 * and its `/api/generate` route both go through — rather than assembling the
 * generator's inputs a second time here. The application it writes is a Loco
 * (Rust) backend — a cargo crate with its migrations, dictionary seed, access
 * rules, workflows and hooks — and a TanStack Start + Astryx front end.
 *
 * This target used to drive `app-with-ai-tanstack` and write a NestJS backend.
 * That repository is no longer a dependency: the server side of everything this
 * orchestrator composes is Rust now, the generated application's included.
 *
 * Why the pipeline and not a second assembly here: this file once mapped
 * `EmlModel` onto the core `Entity[]` / `Relationship[]` shapes by hand, and
 * every part of a model that is *not* a column or a relationship line never
 * reached the generator — no `%%enum` dropdowns, no lookups, no help text, no
 * `%%index`, no `%%rule`/`%%hook`/`%%workflow`/`%%rbac`/`%%category`. None of
 * that failed; it generated a different application from the one the model
 * describes. The pipeline reads the model source itself with the same parser
 * and the same compilers, so there is one reading of a model instead of two.
 *
 * `skipCliScaffold` is set. The scaffold step shells out to `loco new` for the
 * framework's own CI workflow, `.rustfmt.toml`, `AGENTS.md` and `.gitignore`,
 * none of which the backend needs to compile — the generator's parity gate
 * builds the crate the same way. Skipping it keeps generation free of a Rust
 * toolchain on this machine: the crate is compiled inside its Docker image.
 *
 * The cross-package module is loaded via a runtime dynamic import with a
 * non-literal specifier and local structural types, so this file stays
 * self-contained for the CLI's own type-check while still driving the real
 * pipeline at runtime (under Bun, which resolves the checkout's own
 * `@appwithai/*` path aliases from its tsconfig).
 */

import type { EmlModel } from "../model.ts";

// --- Local structural mirrors of the shipped pipeline's types --------------

/** The subset of `GenerateApplicationOptions` this target sets. */
interface GenerateApplicationOptionsLike {
  sources: string | string[];
  projectName: string;
  projectVersion: string;
  projectDescription: string;
  outputDir: string;
  stackOption: "tanstack-astryx-loco";
  database: "postgres" | "neon";
  port: number;
  frontendPort: number;
  skipCliScaffold: boolean;
}

/** `generateApplication` resolves to the parsed model it generated from. */
interface ParsedModelLike {
  entities: unknown[];
  relationships: unknown[];
}

type GenerateApplication = (options: GenerateApplicationOptionsLike) => Promise<ParsedModelLike>;

export interface GenerationResultLike {
  generatedFiles: string[];
  entityCount: number;
  relationshipCount: number;
}

/**
 * Where a generated application listens.
 *
 * The pair `docker-compose.yml` runs the two services on — the Loco backend on
 * 4001 and the front end on 4000. Naming them here rather than taking the
 * pipeline's `port + 1` rule keeps the generated configuration (the backend's
 * `config/*.yaml` default port, the front end's dev proxy) and the compose file
 * saying the same thing.
 */
const DEFAULT_BACKEND_PORT = 4001;
const DEFAULT_FRONTEND_PORT = 4000;

export interface LocoGenerateOptions {
  outDir: string;
  appName: string;
  /** Backend API port. The front end takes {@link DEFAULT_FRONTEND_PORT}. */
  port?: number;
  /** `neon` drops the local-database fallbacks and asks for `sslmode=require`. */
  database?: "postgres" | "neon";
  /**
   * The model document — the generator's actual input, not decoration.
   *
   * The pipeline parses this text: the entities, the enums, the rules, the
   * hooks, the workflows, the access rules and the categories all come out of
   * it. It is also written to `model/model.eml.mmd` beside the app, which the
   * generated `backend/Dockerfile` copies (`COPY --from=builder /app/model
   * ./model`) — an output without it cannot be built at all — and which is the
   * only copy of the model that travels with the application, so a generated
   * directory is regenerable from itself.
   */
  modelSource: string;
}

/**
 * Generate a TanStack Start + Loco.rs app from the model source by driving the
 * shipped pipeline.
 *
 * `model` is used only for the project description; everything the generator
 * reads comes from `opts.modelSource`, parsed by the generator's own parser.
 */
export async function generateLoco(
  model: EmlModel,
  opts: LocoGenerateOptions
): Promise<GenerationResultLike> {
  const source = opts.modelSource?.trim();
  if (!source) {
    throw new Error(
      "tanstack-astryx-loco needs the model source: the shipped pipeline parses it to compile rules, hooks, workflows, access rules and enums."
    );
  }

  // Non-literal specifier keeps this out of the CLI's own type program while
  // resolving at runtime (relative to this module) under Bun.
  const pipelineModule = [
    "..",
    "..",
    "..",
    "..",
    "..",
    "app-with-ai-rust",
    "packages",
    "generator",
    "src",
    "pipeline",
    "generate-application.ts",
  ].join("/");
  const mod = (await import(pipelineModule)) as unknown as {
    generateApplication: GenerateApplication;
  };

  const parsed = await mod.generateApplication({
    sources: opts.modelSource,
    projectName: opts.appName,
    projectVersion: "1.0.0",
    projectDescription: `${model.meta.name ?? opts.appName} — generated from EML`,
    outputDir: opts.outDir,
    stackOption: "tanstack-astryx-loco",
    database: opts.database ?? "postgres",
    port: opts.port ?? DEFAULT_BACKEND_PORT,
    frontendPort: DEFAULT_FRONTEND_PORT,
    skipCliScaffold: true,
  });

  return {
    generatedFiles: await collectGeneratedFiles(opts.outDir),
    entityCount: parsed.entities.length,
    relationshipCount: parsed.relationships.length,
  };
}

/**
 * What the run put on disk.
 *
 * Walked afterwards rather than counted as they are written, for the same
 * reason the pipeline walks its own output: the generators write from well over
 * a hundred places and threading a count through them is a larger change than
 * the number is worth. `node_modules` and cargo's `target` are excluded — on a re-generate into a
 * populated directory it would be most of what a walk finds.
 */
async function collectGeneratedFiles(outDir: string): Promise<string[]> {
  const { readdir } = await import("node:fs/promises");
  const path = await import("node:path");

  const files: string[] = [];
  const walk = async (directory: string): Promise<void> => {
    let entries: Array<{ name: string; isDirectory(): boolean }>;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "target")
        continue;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(full);
      else files.push(full);
    }
  };

  await walk(outDir);
  return files;
}
