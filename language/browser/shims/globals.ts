/**
 * The two Node globals the pipeline reads: `process` (its environment and
 * working directory) and `Buffer`. Imported first by the entry, so both exist
 * before any pipeline module evaluates.
 */
import { Buffer } from "node:buffer";

const scope = globalThis as unknown as { process?: unknown; Buffer?: unknown };

if (!scope.Buffer) scope.Buffer = Buffer;

if (!scope.process) {
  scope.process = {
    // APPWITHAI_LANGUAGE_FILE and CEDM_SPEC_ROOT are constants of the build
    // (`define`), so they point at the volume whichever host runs the bundle.
    env: { NODE_ENV: "production" },
    cwd: () => "/",
    platform: "browser",
    argv: [],
    exitCode: undefined,
    versions: {},
    stdout: { write: () => true, isTTY: false },
    stderr: { write: () => true, isTTY: false },
    on: () => undefined,
    exit: (code?: number) => {
      throw new Error(`process.exit(${code ?? 0}) called in the browser build`);
    },
  };
}
