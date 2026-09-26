/**
 * The manual reports the window, the tab and the fields — and reports the ones
 * the application actually draws.
 *
 * Two defects this covers, and they are different shapes.
 *
 * The first is absence. The manual described an entity's *columns* and stopped,
 * so the layer between a column and a screen — `sys_window`, `sys_tab`,
 * `sys_field`, which is what the running application reads on every render —
 * was in the dictionary, in the database, and in no document a reader was given.
 *
 * The second is the one adding it invites: a manual that worked the layout out
 * for itself would report a screen the application does not draw — accurate
 * about the columns and wrong about the screen, which is the worse of the two
 * failures because it reads as authoritative. So the rows are checked against
 * `seed/dictionary.sql`, the SQL the generated backend actually applies, rather
 * than against the function the manual calls.
 *
 * The fixture is a real published model rather than one written to match the
 * renderer, for the reason `compile-reports.test.ts` gives: a fixture that
 * matches the code proves only that the code matches itself.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { declaredEntityNames, entityToBusEntity } from "@appwithai/core/types";
import { buildDictionarySeedSql } from "../../generators/tanstack-astryx-loco/dictionary-seed";
import { parseModel } from "../../pipeline/parse-model";
import { renderManual } from "../index";

const MODEL = join(import.meta.dirname, "../../../../../language/examples/crm.eml.mmd");

function manual() {
  const parsed = parseModel(readFileSync(MODEL, "utf-8"));
  return {
    parsed,
    html: renderManual(parsed, {
      name: "CRM",
      version: "1.0.0",
      description: "A manual test",
      stack: "loco",
      generatedAt: "2026-01-01T00:00:00.000Z",
    }),
  };
}

describe("the manual's screen layout", () => {
  it("gives every entity a window, a tab and its fields", () => {
    const { parsed, html } = manual();

    expect(parsed.entities.length).toBeGreaterThan(0);
    const blocks = html.match(/Where it appears/g) ?? [];
    expect(blocks).toHaveLength(parsed.entities.length);

    /* Not just the heading: the sentence naming the window and the tab has to be
       there too, or the section is a title over an empty table. */
    const named =
      html.match(/opens this record in the <b>[^<]+<\/b> window, on the <b>[^<]+<\/b> tab/g) ?? [];
    expect(named).toHaveLength(parsed.entities.length);
  });

  it("reports each field the way seed/dictionary.sql places it", () => {
    const { parsed, html } = manual();
    const declared = declaredEntityNames(parsed.entities);
    const busEntities = parsed.entities.map((entity) => entityToBusEntity(entity, declared));
    const seed = buildDictionarySeedSql({ projectName: "crm", entities: busEntities });

    /* Every sys_field row's (is_displayed, is_displayed_grid), read out of the
       SQL by column name. Several entities share column names, so the manual's
       rows are compared as a multiset rather than one by one. */
    const flags = (onForm: string, inGrid: string) => `${onForm}/${inGrid}`;
    const fromSeed = [
      ...seed.matchAll(/INSERT INTO sys_field \(([^)]*)\)\nVALUES \(([\s\S]*?)\)\nON CONFLICT/g),
    ].map((match) => {
      const columns = (match[1] ?? "").split(", ");
      /* A value is a quoted literal (which may itself hold commas) or a bare token. */
      const values = (match[2] ?? "").match(/'(?:[^']|'')*'|[^,\s][^,]*/g) ?? [];
      const at = (name: string) => values[columns.indexOf(name)] === "TRUE";
      return flags(at("is_displayed") ? "Yes" : "No", at("is_displayed_grid") ? "Yes" : "No");
    });
    const fromManual = [
      ...html.matchAll(
        /<td><code>[^<]+<\/code><\/td>\s*<td>[^<]*<\/td>\s*<td>(Yes|No)<\/td>\s*<td>(Yes|No)<\/td>\s*<td>\d+<\/td>/g
      ),
    ].map((match) => flags(match[1] ?? "", match[2] ?? ""));

    expect(fromSeed.length).toBeGreaterThan(0);
    expect(fromManual.sort()).toEqual(fromSeed.sort());
  });

  it("orders the fields the way the screen draws them", () => {
    const { html } = manual();
    const table = html.slice(html.indexOf("Where it appears"));
    const orders = [...table.matchAll(/<td>(\d+)<\/td>\s*<td>(?:Yes|No)<\/td>\s*<\/tr>/g)]
      .slice(0, 8)
      .map((match) => Number(match[1]));

    expect(orders.length).toBeGreaterThan(1);
    expect([...orders]).toEqual([...orders].sort((a, b) => a - b));
  });
});
