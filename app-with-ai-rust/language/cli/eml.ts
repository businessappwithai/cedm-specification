#!/usr/bin/env bun
/**
 * EML CLI executable shim.
 *
 * Validate a model (`*.eml.yaml`) and build applications from it. Run with
 * Bun:
 *
 *   bun language/cli/eml.ts <command> [options]
 *   bun language/cli/eml.ts --help
 */

import { run } from "./src/cli.ts";

// Set the exit code rather than calling `process.exit`: exiting at once
// discards whatever stdout has not yet drained, which cut `--json` output off
// at the pipe's buffer (64 KB) whenever it was piped.
run(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
