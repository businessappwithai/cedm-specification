/**
 * What a generation run is told besides the model: the project's name and
 * where it goes, the database it targets, the ports, and what to skip. Both
 * entry points — the CLI and the web app's `/api/generate` — build one of these
 * and hand it to `generateApplication` with the model document.
 */

import type { StackOption } from "../generators/full-stack.generator";

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
