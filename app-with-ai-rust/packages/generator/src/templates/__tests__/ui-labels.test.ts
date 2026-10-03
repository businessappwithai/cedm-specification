/**
 * Every label a person reads in the generated frontend comes from a window, a
 * tab or a field — never from the Application Dictionary's own table and column
 * names.
 *
 * `sys_table.name`, `sys_table.table_name` and `sys_column.column_name` are what
 * the application stores things in. The screens speak in the window's name, the
 * tab's name and the field's name (`sys_window`, `sys_tab`, `sys_field`), which
 * the model's author wrote and the dictionary lets an administrator reword. A
 * table or column name on a screen is a label nobody can change, and one that
 * reads as plumbing.
 *
 * Keys, ids, `name=` attributes and API parameters legitimately carry
 * `column_name` and `table_name`; this looks only for them *drawn* — as the text
 * of an element, or inside the parentheses people put a technical name in.
 *
 * The dictionary's own administration screens (Table and Column, and the
 * definitions that describe them) are the one place those names are the subject
 * rather than a label, and are listed with the reason.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const FRONTEND = path.resolve(__dirname, "../../../templates/tanstack-astryx-loco/frontend/src");

/** Screens whose subject is the dictionary's tables and columns themselves. */
const DICTIONARY_ADMINISTRATION = [
  "components/admin/ad-field-definitions.ts", // labels the fields of sys_table, sys_column…
  "routes/admin/tables.tsx.hbs", // Table and Column
  "routes/admin/tables",
  "routes/admin/columns",
];

/** A dictionary table or column name drawn as text. */
const DRAWN: Array<{ what: string; pattern: RegExp }> = [
  { what: "a column name as element text", pattern: /^\s*\{\s*[\w.]*\bcolumn_name\s*\}\s*$/m },
  { what: "a column name inside text", pattern: />\s*\{\s*[\w.]*\bcolumn_name\s*\}\s*</ },
  { what: "a column name in parentheses", pattern: /\(\{\s*[\w.]*\bcolumn_name\s*\}\)/ },
  { what: "a table name as element text", pattern: /^\s*\{\s*[\w.]*\btable_name\s*\}\s*$/m },
  { what: "a table name in parentheses", pattern: /\(\{\s*[\w.]*\btable_name\s*\}\)/ },
  {
    what: "a table's name as a card, heading or menu label",
    pattern: /\b(?:title|name|label):\s*table\.name\b/,
  },
  { what: "a table's name as a label", pattern: /\{\s*table\.name\s*\}/ },
  { what: "a table's name as a label fallback", pattern: /label:\s*table\.name\b/ },
];

function sources(directory = FRONTEND): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory)) {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) found.push(...sources(full));
    else if (/\.(tsx?|hbs)$/.test(entry) && !full.includes("__tests__")) found.push(full);
  }
  return found.sort();
}

describe("the generated frontend's labels", () => {
  const files = sources();

  it("finds the frontend", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("draw no dictionary table or column name", () => {
    const found: string[] = [];
    for (const file of files) {
      const relative = path.relative(FRONTEND, file).split(path.sep).join("/");
      if (DICTIONARY_ADMINISTRATION.some((allowed) => relative.startsWith(allowed))) continue;
      const text = readFileSync(file, "utf-8");
      for (const { what, pattern } of DRAWN) {
        if (pattern.test(text)) found.push(`${relative}: ${what}`);
      }
    }
    expect(found).toEqual([]);
  });

  it("label an entity by its window", () => {
    const hook = readFileSync(path.join(FRONTEND, "hooks/use-dashboard.ts"), "utf-8");
    expect(hook).toContain("window_name");
    expect(hook).not.toMatch(/entityHref\(table: Pick<DashboardTable, "name">/);
  });
});
