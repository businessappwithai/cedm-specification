/**
 * Reading a model — the half of the pipeline that touches no filesystem.
 *
 * Kept separate from `generate-application.ts` so a caller that has the model
 * source in hand, rather than a path, can read it without pulling `node:fs`
 * into its bundle. A namespace import of `node:fs` at module scope fails a
 * browser build whether or not the functions using it are ever reached.
 *
 * Everything here is pure, so the CLI and the web app get the same reading of a
 * model from the same code. That is the point: they used to read it separately.
 */

import type { StackOption } from "../generators/full-stack.generator";
import { compileModelRecords, type ParsedModel } from "../model/compile";
import { readEmlModel } from "../model/read-eml";
import { MermaidParser } from "../parsers/mermaid.parser";

export type { ParsedModel } from "../model/compile";

export interface GenerationSettings {
  projectName: string;
  outputDir: string;
  projectVersion?: string;
  projectDescription?: string;
  stackOption?: StackOption;
  /** Which Postgres the generated backend targets. */
  database?: "postgres" | "neon";
  /** Backend port. The frontend defaults to this + 1. */
  port?: number;
  frontendPort?: number;
  apiBaseUrl?: string;
  enableDarkMode?: boolean;
  astryxTheme?: string;
  skipFrontend?: boolean;
  skipBackend?: boolean;
  skipTests?: boolean;
  skipCliScaffold?: boolean;
  recordsPerEntity?: number;
}

/** Defaults, in one place, so every entry point starts from the same baseline. */
export const GENERATION_DEFAULTS = {
  projectVersion: "1.0.0",
  projectDescription: "Generated application",
  stackOption: "tanstack-astryx-loco" as StackOption,
  database: "postgres" as const,
  port: 3000,
  enableDarkMode: false,
  astryxTheme: "neutral",
  recordsPerEntity: 1000,
  skipCliScaffold: false,
} as const;

/**
 * Read EML model source into everything it contributes to generation.
 *
 * Accepts several sources so the CLI's multi-file mode (`--sys-file`,
 * `--bus-file`, `--ref-file`) and the web app's single document take the same
 * path. Each source's ERD is compiled on its own, as it always has been; every
 * other construct rides on `%%` lines, which are read from all of them joined.
 *
 * The reading is `readEmlModel` and the meaning is `compileModelRecords` — the
 * same compiler a YAML model document goes through.
 */
export function parseModel(sources: string | string[]): ParsedModel {
  const list = (Array.isArray(sources) ? sources : [sources]).filter(Boolean);
  const joined = list.join("\n");
  const warn = (message: string) => console.warn(`  \u26a0\ufe0f  ${message}`);
  const parser = new MermaidParser();

  return compileModelRecords(readEmlModel(joined, warn), {
    erdParts: list.map((source) => parser.read(source)),
    warn,
  });
}
