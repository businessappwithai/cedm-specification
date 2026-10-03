// Regression: ISSUE-003 — the SQL editor never loaded under a URL prefix.
// Found by /qa on 2026-09-26, with the platform served at /report beside a
// generated application at /app.
//
// Monaco's loader was configured with a root-absolute `/vs`, so under /report
// the browser asked for /vs/loader.js and got a 404, and the editor stayed on
// "Loading SQL Editor…". `public/vs` is served under Vite's `base`, and the
// loader path has to be built from it. Nothing else in src should name the
// root-absolute path either: a second loader config written that way would
// break the same screen the same way.

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = join(import.meta.dir, "../../..");
const WRAPPER = join(import.meta.dir, "../monaco-editor-wrapper.tsx");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "__tests__" ? [] : sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !name.endsWith(".gen.ts") ? [path] : [];
  });
}

describe("Monaco loader path", () => {
  test("is built from Vite's BASE_URL", () => {
    const source = readFileSync(WRAPPER, "utf-8");
    expect(source).toMatch(/vs:\s*`\$\{[^`]*BASE_URL[^`]*\}\/vs`/);
  });

  test("no source file names the root-absolute /vs path", () => {
    const offenders = sourceFiles(SRC).filter((file) =>
      /["'`]\/vs(\/[^"'`]*)?["'`]/.test(readFileSync(file, "utf-8"))
    );
    expect(offenders.map((file) => relative(SRC, file))).toEqual([]);
  });
});
