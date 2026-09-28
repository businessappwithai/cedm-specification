/**
 * The generated backend image must ship the real binary, not the stub.
 *
 * The Dockerfile caches dependencies by building a stub (`fn main() {}`)
 * first, then copies the real sources over it. COPY keeps each file's mtime
 * from the build context, and those are older than the stub's build output,
 * so cargo judged the crate fresh and kept the stub. Every image shipped a
 * `<crate>-cli` that exited 0 and printed nothing, for `db migrate`, `db seed`
 * and `start` alike. Under compose that was a container restarting every few
 * milliseconds with an empty log, reported as "unhealthy".
 *
 * The fix is to touch the sources before the real build. This holds the
 * template to it: if a stub is built, the final `cargo build` must follow a
 * `touch` of the sources the stub stood in for.
 *
 * Regression: found by /qa on 2026-09-26, in app-and-report-with-ai-rust's
 * build-and-run workflow (run #6: `status=restarting exit=0 restarts=5`).
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const DOCKERFILE = readFileSync(
  path.join(import.meta.dirname, "../../../templates/tanstack-astryx-loco/backend/Dockerfile.hbs"),
  "utf-8"
);

/** Each `RUN …` instruction, continuation lines joined. */
function runInstructions(source: string): string[] {
  return source
    .replace(/\\\n/g, " ")
    .split("\n")
    .filter((line) => line.trimStart().startsWith("RUN "));
}

describe("backend Dockerfile", () => {
  const runs = runInstructions(DOCKERFILE);
  const stubIndex = runs.findIndex((r) => r.includes("fn main() {}"));
  const finalBuild = runs.findLastIndex((r) => /cargo build --release/.test(r));

  it("builds a dependency stub, then the real crate", () => {
    expect(stubIndex).toBeGreaterThanOrEqual(0);
    expect(finalBuild).toBeGreaterThan(stubIndex);
  });

  it("touches the real sources before the real build", () => {
    const build = runs[finalBuild] ?? "";
    const touch = build.indexOf("touch");
    expect(touch).toBeGreaterThanOrEqual(0);
    expect(touch).toBeLessThan(build.indexOf("cargo build"));
    // Both crates the stub stood in for.
    expect(build).toMatch(/\bsrc\b/);
    expect(build).toMatch(/\bmigration\/src\b/);
  });
});
