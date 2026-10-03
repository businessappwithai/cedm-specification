#!/usr/bin/env bun
/**
 * Convert an installation's stored Mermaid models, versions, automations and
 * project histories to YAML — once. See
 * packages/web/src/lib/server/stored-models/index.ts for what it does.
 *
 *   bun run convert:stored-models --dry-run     report the plan, write nothing
 *   bun run convert:stored-models               convert
 *     --archive-unconvertible   keep what cannot be converted in the audit table only
 *     --abandon-pending         give up saves that were interrupted
 *     --verbose                 every item and every note
 *
 * Run it with the application stopped and with the same DATABASE_URL and
 * DEFAULT_OUTPUT_DIR the application uses: the project histories are found
 * under that output directory.
 */

import { closeDatabase } from "@appwithai/core/services";
import { convertStoredModels } from "../packages/web/src/lib/server/stored-models";

const FLAGS = new Set(["--dry-run", "--archive-unconvertible", "--abandon-pending", "--verbose"]);
const args = process.argv.slice(2);
const unknown = args.filter((arg) => !FLAGS.has(arg));
if (unknown.length) {
  console.error(`Unknown option(s): ${unknown.join(" ")}\nOptions: ${[...FLAGS].join(" ")}`);
  process.exit(2);
}

try {
  const outcome = await convertStoredModels({
    dryRun: args.includes("--dry-run"),
    archiveUnconvertible: args.includes("--archive-unconvertible"),
    abandonPending: args.includes("--abandon-pending"),
    verbose: args.includes("--verbose"),
    log: (line) => console.log(line),
  });
  process.exitCode = outcome.status === "blocked" ? 1 : 0;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
