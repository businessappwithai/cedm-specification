/**
 * Imported first by every tool: a failure is reported as one line naming what
 * failed, not a stack trace (tools/lib/failure.ts).
 */

import { reportFailure } from "./failure";

process.on("uncaughtException", reportFailure);
process.on("unhandledRejection", reportFailure);
