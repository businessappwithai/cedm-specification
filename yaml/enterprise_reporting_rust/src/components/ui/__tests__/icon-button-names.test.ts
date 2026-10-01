// Regression: ISSUE-005 — icon-only buttons with no accessible name.
// Found by /qa on 2026-09-26.
//
// Every row's "⋯" actions menu on the reports, charts, dashboards, jobs and
// email-template lists, the table pagination, the back arrows, and the
// remove/delete buttons were a `size="icon"` Button holding only an SVG. A
// screen reader announced each as "button", twenty to a page, with nothing to
// tell them apart. Each carries an `aria-label` (or `title`) now; a button
// that shows text of its own, or an `sr-only` span, is named by that instead.

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = join(import.meta.dir, "../../..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "__tests__" ? [] : sourceFiles(path);
    return name.endsWith(".tsx") ? [path] : [];
  });
}

/** `<Button …>` opening tags; `=>` inside a handler is not the tag's end. */
const OPENING = /<Button\b((?:=>|[^>])*?)>/gs;

function unnamedIconButtons(file: string): string[] {
  const source = readFileSync(file, "utf-8");
  const found: string[] = [];
  for (const match of source.matchAll(OPENING)) {
    const attrs = match[1] ?? "";
    if (!/\bsize="icon"/.test(attrs)) continue;
    if (/\baria-label\b|\baria-labelledby\b|\btitle=/.test(attrs)) continue;
    const end = source.indexOf("</Button>", (match.index ?? 0) + match[0].length);
    const body = source.slice((match.index ?? 0) + match[0].length, end);
    const text = body.replace(/<[^>]*>|\{[^}]*\}/g, "").trim();
    if (text || body.includes("sr-only")) continue;
    const line = source.slice(0, match.index).split("\n").length;
    found.push(`${relative(SRC, file)}:${line}`);
  }
  return found;
}

describe("icon-only buttons", () => {
  test("every one has an accessible name", () => {
    expect(sourceFiles(SRC).flatMap(unnamedIconButtons)).toEqual([]);
  });

  test("the detector sees an unnamed one", () => {
    const probe = '<Button variant="ghost" size="icon" onClick={() => go()}><X /></Button>';
    const named = '<Button size="icon" aria-label="Remove" onClick={() => go()}><X /></Button>';
    const count = (s: string) =>
      [...s.matchAll(OPENING)].filter((m) => !/aria-label/.test(m[1] ?? "")).length;
    expect(count(probe)).toBe(1);
    expect(count(named)).toBe(0);
  });
});
