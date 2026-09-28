/**
 * Every list grid offers its list as a CSV download.
 *
 * Two things are asserted here and they fail in different ways.
 *
 * `src/lib/csv.ts` is a hand-written module with no template, so it reaches the
 * output through a copy list — and the copy `catch`es and warns. A file missed
 * there is a frontend that does not build, reported as a line of console noise
 * in the middle of a successful generation.
 *
 * The helper's own rules are the other half. Quoting and formula-defusing are
 * the parts that look cosmetic and are not: an unwrapped field containing a
 * newline silently becomes two rows, and a cell that opens with `=` is executed
 * by Excel, LibreOffice and Sheets when the file is opened. A record whose name
 * a user typed as `=HYPERLINK(...)` is data, and has to arrive as data.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { readYamlFixture } from "../../model/__tests__/compile-yaml";
import { generateApplication } from "../../index";

const MODEL = `eml: "1.0"
entities:
  - name: Member
    attributes:
      - name: id
        type: string
        pk: true
      - name: full_name
        type: string
      - name: status
        type: string
`;

let emitted: { csv: string; table: string } | undefined;

async function generated() {
  if (emitted) return emitted;
  const out = await fs.mkdtemp("/tmp/csv-export-");
  await generateApplication({
    document: readYamlFixture(MODEL),
    modelText: MODEL,
    projectName: "csvapp",
    outputDir: out,
    skipTests: true,
    skipCliScaffold: true,
  });
  const read = (rel: string) => fs.readFile(path.join(out, "frontend", rel), "utf-8");
  emitted = {
    csv: await read("src/lib/csv.ts"),
    table: await read("src/components/tables/dynamic-table.tsx"),
  };
  return emitted;
}

describe("the CSV export module", () => {
  it("is emitted into the generated frontend", async () => {
    const { csv } = await generated();
    expect(csv).toContain("export function toCsv");
    expect(csv).toContain("export function downloadCsv");
    expect(csv).toContain("export const CSV_EXPORT_LIMIT");
  });

  it("is wired to a button on every grid", async () => {
    const { table } = await generated();
    expect(table).toContain('from "@/lib/csv"');
    expect(table).toContain("handleExportCsv");
    expect(table).toContain('data-testid="export-csv"');
  });

  it("reads the list from the API rather than the page on screen", async () => {
    const { table } = await generated();
    // `data` holds one page; the export asks for the list.
    expect(table).toContain("limit: CSV_EXPORT_LIMIT");
  });
});

/**
 * The helper's rules, executed rather than read.
 *
 * The emitted module is plain TypeScript with no imports, so its functions can
 * be lifted out and run — which is the only way to assert what a quote or a
 * leading `=` actually produces.
 */
async function csvHelpers() {
  const { csv } = await generated();
  const body = csv
    .replace(/export const/g, "const")
    .replace(/export function/g, "function")
    .replace(/:\s*string(\[\])?(\[\])?/g, "")
    .replace(/:\s*void/g, "");
  // eslint-disable-next-line no-new-func
  const factory = new Function(`${body}; return { toCsv, csvFileName, CSV_EXPORT_LIMIT };`);
  return factory() as {
    toCsv: (headers: string[], rows: string[][]) => string;
    csvFileName: (table: string) => string;
    CSV_EXPORT_LIMIT: number;
  };
}

describe("toCsv", () => {
  it("wraps a field holding a comma, a quote or a newline", async () => {
    const { toCsv } = await csvHelpers();
    const out = toCsv(["a"], [["x,y"], ['he said "no"'], ["line\nbreak"]]);
    expect(out).toContain('"x,y"');
    expect(out).toContain('"he said ""no"""');
    expect(out).toContain('"line\nbreak"');
  });

  it("separates rows with CRLF, as RFC 4180 asks", async () => {
    const { toCsv } = await csvHelpers();
    expect(toCsv(["a", "b"], [["1", "2"]])).toBe("a,b\r\n1,2");
  });

  it("defuses a cell a spreadsheet would execute", async () => {
    const { toCsv } = await csvHelpers();
    const out = toCsv(["name"], [['=HYPERLINK("http://x")'], ["+1(2)"], ["@SUM(A1)"]]);
    // Prefixed with an apostrophe — what Excel, LibreOffice and Sheets read
    // back as "this is text".
    expect(out).toContain("'=HYPERLINK");
    expect(out).toContain("'+1(2)");
    expect(out).toContain("'@SUM(A1)");
  });

  it("leaves a negative number alone, because the minus sign is arithmetic", async () => {
    const { toCsv } = await csvHelpers();
    const out = toCsv(["amount"], [["-42"], ["-3.5"]]);
    expect(out).toContain("\r\n-42");
    expect(out).toContain("\r\n-3.5");
    expect(out).not.toContain("'-42");
  });

  it("leaves an ordinary value untouched", async () => {
    const { toCsv } = await csvHelpers();
    expect(toCsv(["a"], [["plain"]])).toBe("a\r\nplain");
  });
});

describe("csvFileName", () => {
  it("names the file for the entity and the day", async () => {
    const { csvFileName } = await csvHelpers();
    const today = new Date().toISOString().slice(0, 10);
    expect(csvFileName("bus_class_session")).toBe(`class-session-${today}.csv`);
  });
});
