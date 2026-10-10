#!/usr/bin/env bun
/**
 * Find help text that is a template with the names filled in, not authored prose.
 *
 *     bun tools/help-shapes.ts                  # summary: filler and where it occurs
 *     bun tools/help-shapes.ts --check          # exit 1 if any help text is filler (HELP-001)
 *     bun tools/help-shapes.ts --repeats        # shapes that repeat now (a prompt, not a gate)
 *     bun tools/help-shapes.ts --write-legacy   # (re)build tools/help-legacy-shapes.txt
 *
 * The legacy list is frozen: regenerating it from a library that has since been
 * rewritten would find nothing, and one that mixes both would turn two entities'
 * honest similarity into a "template". Use --write-legacy only from a checkout
 * that still holds the template text.
 */

import "./lib/cli";
import { writeFileSync } from "node:fs";
import { fillerRows, LEGACY, scan, THRESHOLD } from "./lib/help-shapes";
import { head, repr } from "./lib/text";

function main(argv: string[]): number {
  const { seen, rows } = scan();
  if (argv.includes("--repeats")) {
    const repeats = [...seen.values()]
      .filter((entry) => entry.entities.size >= 5)
      .map((entry) => ({ n: entry.entities.size, key: entry.key, shape: entry.shape }))
      .sort(
        (a, b) =>
          b.n - a.n ||
          (b.key > a.key ? 1 : b.key < a.key ? -1 : 0) ||
          (b.shape > a.shape ? 1 : b.shape < a.shape ? -1 : 0)
      );
    for (const { n, key, shape } of repeats.slice(0, 40)) {
      console.log(`${String(n).padStart(4)} ${key}: ${head(shape, 110)}`);
    }
    return 0;
  }
  if (argv.includes("--write-legacy")) {
    const shapes = [
      ...new Set(
        [...seen.values()].filter((e) => e.entities.size >= THRESHOLD).map((e) => e.shape)
      ),
    ].sort();
    writeFileSync(
      LEGACY,
      "// Shapes the template generators stamped. Regenerate with --write-legacy only\n" +
        "// from a checkout that still holds the template text.\n" +
        `${shapes.join("\n")}\n`
    );
    console.log(`${shapes.length} shapes written`);
    return 0;
  }
  const bad = fillerRows(rows);
  if (argv.includes("--check")) {
    for (const row of bad.slice(0, 40)) {
      console.log(`HELP-001 ${row.where}.${row.key}: template text: ${head(row.value, 90)}`);
    }
    if (bad.length) {
      console.log(`HELP-001: ${bad.length} help text(s) are template filler`);
      return 1;
    }
    console.log("HELP-001: no template filler");
    return 0;
  }
  const byEntity = new Set(bad.map((row) => row.where.split(".")[0]?.split("[")[0]));
  const byKey = new Map<string, number>();
  for (const row of bad) byKey.set(row.key, (byKey.get(row.key) ?? 0) + 1);
  const ordered = [...byKey.entries()].sort((a, b) => b[1] - a[1]);
  console.log(
    `${rows.length} help texts; ${bad.length} are filler across ${byEntity.size} entities`
  );
  console.log(`by key: {${ordered.map(([k, n]) => `${repr(k)}: ${n}`).join(", ")}}`);
  return 0;
}

process.exit(main(process.argv.slice(2)));
