/**
 * The generation pipeline.
 *
 * Every entry point — the `appwithai` CLI and the web app's `/api/generate`
 * route — goes through here, so a model generates the same application however
 * it was submitted.
 *
 * They used to assemble the generator's options separately, and the copies
 * drifted badly: the web path passed six fields and nothing else, so an
 * application generated through the UI lost every category the model
 * declared, every enum dropdown, and every saga — silently, with a success
 * message at the end.
 *
 * Adding a generator input means adding it to `GenerationSettings` once. A
 * caller that needs something different passes it as a setting; it does not
 * rebuild the options.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { getLogger } from "@appwithai/core/logging";
import {
  FullStackGenerator,
  type FullStackGeneratorOptions,
} from "../generators/full-stack.generator";
import type { AstryxTheme, DatabaseTarget } from "../generators/tanstack-astryx-loco";
import { renderManual } from "../manual";
import type { ParsedModel } from "../model/compile";
import { compileModelDocument, type ModelDocument } from "../model-yaml";
import type { PipelineLogger } from "./logger-port";
import { GENERATION_DEFAULTS, type GenerationSettings } from "./settings";

const warnOnConsole = (message: string) => console.warn(`  \u26a0\ufe0f  ${message}`);

/** Re-exported so an importer needs only this module. */
export { GENERATION_DEFAULTS, type GenerationSettings, type ParsedModel };

/**
 * Assemble the generator's options from a parsed model plus settings.
 *
 * This is the function that has to stay single. Every field below was once
 * spelled out at each call site, and the site that forgot `categories` and the
 * model's sagas shipped applications missing features the model had asked for.
 * Everything comes from the compiled model.
 */
export function buildGeneratorOptions(
  model: ParsedModel,
  settings: GenerationSettings
): FullStackGeneratorOptions {
  const port = settings.port ?? GENERATION_DEFAULTS.port;

  return {
    stackOption: settings.stackOption ?? GENERATION_DEFAULTS.stackOption,
    projectName: settings.projectName,
    projectVersion: settings.projectVersion ?? GENERATION_DEFAULTS.projectVersion,
    projectDescription: settings.projectDescription ?? GENERATION_DEFAULTS.projectDescription,
    database: (settings.database ?? GENERATION_DEFAULTS.database) as DatabaseTarget,
    astryxTheme: (settings.astryxTheme ?? GENERATION_DEFAULTS.astryxTheme) as AstryxTheme,
    outputDir: settings.outputDir,
    port,
    frontendPort: settings.frontendPort ?? port + 1,
    tanstackStartNestjs: {
      frontend: {
        apiBaseUrl: settings.apiBaseUrl ?? `http://localhost:${port}`,
        enableDarkMode: settings.enableDarkMode ?? GENERATION_DEFAULTS.enableDarkMode,
      },
    },
    skipFrontend: !!settings.skipFrontend,
    skipBackend: !!settings.skipBackend,
    skipTests: !!settings.skipTests,
    skipCliScaffold: settings.skipCliScaffold ?? GENERATION_DEFAULTS.skipCliScaffold,
    recordsPerEntity: settings.recordsPerEntity ?? GENERATION_DEFAULTS.recordsPerEntity,
    categories: model.categories,
    modelEnums: model.enums,
    compiledRbac: model.rbac,
    compiledRules: model.rules,
    compiledReports: model.reports,
    compiledWorkflows: model.workflows,
    compiledHooks: model.hooks,
    sagas: model.sagas,
  };
}

/** Extra fields recorded in the manifest beyond what the settings carry. */
export interface ManifestExtras {
  input?: unknown;
  packageManager?: string;
}

/**
 * Write `.appwithai.json`, so anything inspecting a generated project can tell
 * what produced it — and what the model asked for, not just its entities.
 */
export async function writeManifest(
  outputDir: string,
  model: ParsedModel,
  settings: GenerationSettings,
  extras: ManifestExtras = {}
): Promise<void> {
  const port = settings.port ?? GENERATION_DEFAULTS.port;
  try {
    await fs.writeFile(
      path.join(outputDir, ".appwithai.json"),
      JSON.stringify(
        {
          name: settings.projectName,
          version: settings.projectVersion ?? GENERATION_DEFAULTS.projectVersion,
          description: settings.projectDescription ?? GENERATION_DEFAULTS.projectDescription,
          stack: settings.stackOption ?? GENERATION_DEFAULTS.stackOption,
          database: settings.database ?? GENERATION_DEFAULTS.database,
          input: extras.input,
          backendPort: port,
          frontendPort: settings.frontendPort ?? port + 1,
          apiUrl: settings.apiBaseUrl ?? `http://localhost:${port}`,
          entities: model.entities.map((entity) => entity.name),
          categories: model.categories.map((category) => category.name),
          enums: model.enums.map((modelEnum) => `${modelEnum.name} (${modelEnum.values.length})`),
          sagas: model.sagas.map(
            (saga) => `${saga.name} on ${saga.entity} (${saga.steps.length} steps, ${saga.trigger})`
          ),
          packageManager: extras.packageManager,
          generatedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
  } catch {
    // Non-fatal — a missing manifest does not invalidate the generated app.
  }
}

/**
 * Write the manual into the front end's static directory.
 *
 * `frontend/public/` is what TanStack Start serves at the site root, so the
 * dashboard's Manual link can be a plain `/manual.html` anchor — and the file is
 * equally openable by double-clicking it out of the generated directory, which
 * is the other way readers meet this application. One location, reachable both
 * ways; a second copy would be the one that goes stale.
 *
 * A failure here is not fatal. An application without its manual is a smaller
 * loss than a generation run that stopped part-way through.
 */
async function writeManual(
  outputDir: string,
  model: ParsedModel,
  options: GenerateApplicationOptions
): Promise<void> {
  if (options.skipFrontend) return;
  try {
    const directory = path.join(outputDir, "frontend", "public");
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(
      path.join(directory, "manual.html"),
      renderManual(model, {
        name: options.projectName,
        version: options.projectVersion ?? GENERATION_DEFAULTS.projectVersion,
        description: options.projectDescription ?? GENERATION_DEFAULTS.projectDescription,
        stack: "loco",
      }),
      "utf-8"
    );
    console.log("  ✓ Wrote frontend/public/manual.html");
  } catch {
    // non-fatal — an application without its manual still runs
  }
}

/**
 * Ship the model into the application it generated, as
 * `model/model.eml.yaml` — the author's text, byte for byte.
 *
 * The generated code is the model compiled: reading it back tells you what the
 * application does but not what it was asked to do, and nothing in it records
 * that a decision table had three rows for a reason. An administrator extending
 * the application needs the source, and regenerating it then needs only the
 * directory it produced.
 */
export async function writeModelFile(outputDir: string, modelText: string): Promise<void> {
  try {
    await fs.mkdir(path.join(outputDir, "model"), { recursive: true });
    await fs.writeFile(
      path.join(outputDir, "model", "model.eml.yaml"),
      modelText,
      "utf-8"
    );
  } catch {
    // Non-fatal, exactly like the manifest: the application runs without it.
  }
}

export interface GenerateApplicationOptions extends GenerationSettings {
  /** The model: a document `readModelYaml` has validated. */
  document: ModelDocument;
  /**
   * The text `document` was read from, shipped as `model/model.eml.yaml`.
   *
   * The text rather than a serialisation of the document, because the
   * document has no comments: the reasons an author wrote beside a rule or an
   * access list are part of the model, and a re-serialised copy drops every
   * one of them.
   */
  modelText: string;
  /** The document already compiled, when the caller has compiled and logged it. */
  model?: ParsedModel;
  manifest?: ManifestExtras;
  /** Set false to skip `.appwithai.json` (dry runs). */
  writeManifestFile?: boolean;
  /**
   * Where the pipeline's own events go.
   *
   * Defaults to the real `pipeline` channel, which is what `/api/generate`
   * wants. The CLI passes `cliLogger(...)` so a terminal run stays silent
   * unless the operator set `LOG_LEVEL` — see `logger-port.ts`.
   */
  logger?: PipelineLogger;
}

/**
 * Parse, generate, and record — the whole pipeline, in the order every entry
 * point needs it.
 */
export async function generateApplication(
  options: GenerateApplicationOptions
): Promise<ParsedModel> {
  const model = options.model ?? compileModelDocument(options.document, { warn: warnOnConsole });

  // The CLI's own progress lines are the report to whoever is watching the
  // terminal; these are the record for whatever is watching the process. A CLI
  // run is silent unless LOG_LEVEL is set, so the two do not interleave — see
  // the `transport` note in log-spec.json.
  const log: PipelineLogger = options.logger ?? getLogger("pipeline");
  const project = options.projectName;
  const started = Date.now();

  log.event("pipeline.generation.started", {
    project,
    stack: options.stackOption ?? GENERATION_DEFAULTS.stackOption,
    entities: model.entities.length,
  });

  try {
    await fs.mkdir(options.outputDir, { recursive: true });

    const generator = new FullStackGenerator(buildGeneratorOptions(model, options));
    await generator.generate(model.entities, model.relationships);

    await writeModelFile(options.outputDir, options.modelText);
    await writeManual(options.outputDir, model, options);

    if (options.writeManifestFile !== false) {
      await writeManifest(options.outputDir, model, options, options.manifest ?? {});
    }
  } catch (error) {
    // Reported here and re-thrown: the caller decides what a failure means —
    // the CLI exits, `/api/generate` turns it into an SSE frame — but neither
    // of them is a place the event can be named from, because by then which
    // project and how far it got are gone.
    log.event("pipeline.generation.failed", {
      project,
      reason: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  log.event("pipeline.generation.completed", {
    project,
    files: model.entities.length,
    durationMs: Date.now() - started,
  });

  return model;
}
