/**
 * The Loco + Astryx application, generated in a browser tab by the real
 * pipeline.
 *
 * `generateApplication` (`packages/generator/src/pipeline/generate-application.ts`)
 * is the one generation path: the `appwithai` CLI and the modelling tool both
 * call it. This entry runs that same function, unchanged, against an in-memory
 * filesystem (`shims/fs.ts`) holding the templates, the language definition and
 * the CEDM specification, and hands back the files it wrote. Nothing about the
 * application is decided here, which is the point: a second generator for the
 * browser would be a second answer to what a model generates, and the two would
 * drift.
 *
 * The scaffold step (`loco new`) is skipped, as it is in the parity gate and in
 * every offline build: it starts a process, and what it contributes — the
 * framework's own CI workflow, `.rustfmt.toml`, `AGENTS.md` — is not part of
 * the application.
 *
 * The bundle is built by `scripts/sites/build-site-bundles.ts` in
 * `app-with-ai-rust`, with `node:fs`, `node:crypto`, `node:os`, `node:url` and
 * `child_process` aliased to `shims/`. Its assets (`loco-assets.json`) are
 * built by the same script from the files on disk, and fetched by the page only
 * when someone asks for the download.
 */

import "./shims/globals";
import { generateApplication } from "../../packages/generator/src/pipeline/generate-application";
import { NO_LOG } from "../../packages/generator/src/pipeline/logger-port";
import type { ModelDocument } from "../yaml/document";
import { executables, mount, snapshot, unmount } from "./shims/fs";

/** A file in `loco-assets.json`: text as-is, binary as base64. */
export type LocoAsset = string | { base64: string };

/** Absolute path in the in-memory volume → contents. */
export type LocoAssets = Record<string, LocoAsset>;

export interface LocoGenerationOptions {
  /** The model, read and validated by `appwithai-model.js`. */
  document: ModelDocument;
  /** The model's own text, shipped as `model/model.eml.yaml`. */
  modelText: string;
  /** The project name: the crate, the package and the database are named from it. */
  name: string;
  version?: string;
  description?: string;
  theme?: string;
  database?: "postgres" | "neon";
  /** `loco-assets.json`, as fetched by the page. */
  assets: LocoAssets;
}

/** The settings the CLI uses when given only a model and a name. */
export const LOCO_DEFAULTS = {
  version: "1.0.0",
  theme: "neutral",
  database: "postgres" as const,
  port: 3000,
  frontendPort: 3001,
  recordsPerEntity: 1000,
};

const OUTPUT = "/out";

function decode(asset: LocoAsset): string | Uint8Array {
  if (typeof asset === "string") return asset;
  const binary = atob(asset.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

let mounted: LocoAssets | undefined;

/** What a generation wrote. */
export interface LocoApplication {
  /** Every file, keyed by its path inside the project, in path order. Strings are
   *  text; bytes are the fonts the front end ships. */
  files: Map<string, string | Uint8Array>;
  /** The files the generator made executable (the test runner scripts). */
  executables: Set<string>;
}

/** Generate the application and return every file it wrote. */
export async function generateLocoApplication(options: LocoGenerationOptions): Promise<LocoApplication> {
  if (!options.document.entities?.length) {
    throw new Error("This model declares no entities. A model declares its entities under `entities:`.");
  }
  if (mounted !== options.assets) {
    mount(Object.fromEntries(Object.entries(options.assets).map(([path, asset]) => [path, decode(asset)])));
    mounted = options.assets;
  }
  unmount(OUTPUT);
  const outputDir = `${OUTPUT}/${options.name}`;
  await generateApplication({
    document: options.document,
    modelText: options.modelText,
    projectName: options.name,
    projectVersion: options.version ?? LOCO_DEFAULTS.version,
    projectDescription: options.description ?? options.document.description,
    outputDir,
    stackOption: "tanstack-astryx-loco",
    astryxTheme: options.theme ?? LOCO_DEFAULTS.theme,
    database: options.database ?? LOCO_DEFAULTS.database,
    port: LOCO_DEFAULTS.port,
    frontendPort: LOCO_DEFAULTS.frontendPort,
    apiBaseUrl: `http://localhost:${LOCO_DEFAULTS.port}`,
    enableDarkMode: false,
    skipCliScaffold: true,
    recordsPerEntity: LOCO_DEFAULTS.recordsPerEntity,
    manifest: { input: "model.eml.yaml", packageManager: "bun" },
    // The CLI passes its own; a tab has no log to write to, and the default
    // logger is pino's Node transport.
    logger: NO_LOG,
  });
  const application = { files: snapshot(outputDir), executables: executables(outputDir) };
  unmount(OUTPUT);
  return application;
}
