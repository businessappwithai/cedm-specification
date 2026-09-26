/**
 * The pipeline's logging seam.
 *
 * The pipeline has two callers and they want opposite things. `/api/generate`
 * is answering a request nobody is watching, so it always logs. The `appwithai`
 * CLI is writing a progress display to somebody's terminal, and interleaving
 * newline-delimited JSON through it makes both harder to read.
 *
 * So the pipeline depends on one method rather than on a logger.
 * `ChannelLogger` from `@appwithai/core/logging` satisfies this structurally —
 * a server caller passes its channel logger and nothing needs adapting — and
 * the CLI passes `cliLogger`, which is the real thing or silence depending on
 * whether the operator asked for logs.
 *
 * Event ids still come from `log-spec.json`. The spec is the contract; this
 * interface is only the wire.
 */

/** What the pipeline needs from a logger, and nothing more. */
export interface PipelineLogger {
  event(id: string, fields?: Record<string, unknown>): void;
}

/**
 * Silence.
 *
 * Deliberately not `console.log`: a caller that has chosen not to log has
 * usually chosen it because it is already reporting progress another way, and
 * writing the same thing to the console again would be duplicating that
 * somewhere nobody is reading.
 */
export const NO_LOG: PipelineLogger = {
  event() {
    /* intentionally silent — see above */
  },
};

/**
 * The logger a command-line run should use.
 *
 * A terminal run is silent unless the operator asks, and the way to ask is
 * `LOG_LEVEL` — the same variable that controls everything else. A CLI flag
 * meaning the same thing would be a second switch for one decision, and the
 * one people would find first is the one that does not work in CI.
 */
export function cliLogger<T extends PipelineLogger>(
  real: T,
  env: NodeJS.ProcessEnv = process.env
): PipelineLogger {
  return env.LOG_LEVEL ? real : NO_LOG;
}
