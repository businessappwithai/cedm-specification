/**
 * TanStack Start + Astryx on Loco.rs — the generator's own stack.
 *
 * Drives the one generation path (`generateApplication` in
 * packages/generator/src/pipeline/generate-application.ts) with the model
 * document and its text, so an application generated here is the application
 * `appwithai generate` produces from the same model: the Rust backend, its
 * seeds, the frontend, the test suites, and `model/model.eml.yaml` as written.
 *
 * The pipeline is loaded with a runtime dynamic import, so the CLI's own
 * type-check does not pull the generator's whole program in.
 */

import type { ModelDocument } from "../../../yaml/document.ts";

export interface LocoGenerateOptions {
  outDir: string;
  appName: string;
  /** Skip `loco new` (it needs the Loco CLI and the network); templates only. */
  skipCliScaffold: boolean;
}

interface PipelineModule {
  generateApplication(options: {
    document: ModelDocument;
    modelText: string;
    projectName: string;
    projectDescription?: string;
    outputDir: string;
    skipCliScaffold?: boolean;
  }): Promise<{ entities: unknown[] }>;
}

const PIPELINE_MODULE = [
  "..",
  "..",
  "..",
  "..",
  "packages",
  "generator",
  "src",
  "pipeline",
  "generate-application.ts",
].join("/");

/** Generate the application; returns how many entities it carries. */
export async function generateLoco(
  document: ModelDocument,
  modelText: string,
  options: LocoGenerateOptions
): Promise<number> {
  const pipeline = (await import(PIPELINE_MODULE)) as PipelineModule;
  const model = await pipeline.generateApplication({
    document,
    modelText,
    projectName: options.appName,
    ...(document.description ? { projectDescription: document.description } : {}),
    outputDir: options.outDir,
    skipCliScaffold: options.skipCliScaffold,
  });
  return model.entities.length;
}
