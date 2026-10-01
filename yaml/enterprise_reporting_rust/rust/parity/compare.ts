/**
 * How the parity scripts compare files that cannot be byte-identical
 * (MIGRATION_PLAN.md §9, D-22): an XLSX cell by cell, a PDF by its text.
 */
import ExcelJS from "exceljs";

export async function xlsxCells(bytes: Buffer, onlySheet?: string): Promise<string[]> {
  const wb = new ExcelJS.Workbook();
  // exceljs types its argument as the pre-generic `Buffer`.
  await wb.xlsx.load(bytes as unknown as ArrayBuffer);
  const out: string[] = [];
  wb.eachSheet((ws) => {
    if (onlySheet && ws.name !== onlySheet) return;
    out.push(`sheet ${ws.name}`);
    // rust_xlsxwriter stores a width the way Excel does, with its fixed
    // 5-pixel padding (w + 0.7109375); exceljs stores the bare number.
    ws.columns?.forEach((c, i) => {
      const w = c.width ?? 0;
      const bare = Math.abs(w - Math.floor(w) - 0.7109375) < 1e-9 ? Math.floor(w) : w;
      out.push(`width ${i} ${bare}`);
    });
    ws.eachRow({ includeEmpty: false }, (row, r) => {
      row.eachCell({ includeEmpty: false }, (cell, c) => {
        // exceljs keeps "" as a string cell; rust_xlsxwriter writes a
        // formatted blank, which reading skips. Both show an empty cell.
        if (cell.value === "" || cell.value === null) return;
        const font = cell.font ?? {};
        const fill = (cell.fill as { fgColor?: { argb?: string } } | undefined)?.fgColor?.argb ?? "";
        const v = cell.value;
        out.push(
          `${r},${c} ${typeof v}:${v === null ? "" : String(v)} bold=${!!font.bold} color=${font.color?.argb ?? ""} fill=${fill}`
        );
      });
    });
  });
  return out;
}

/** The strings a PDF draws (`(…) Tj`), unescaped, "Generated:" lines dropped. */
export function pdfText(bytes: Buffer): string[] {
  const s = bytes.toString("latin1");
  return [...s.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)]
    .map((m) => m[1].replace(/\\([()\\])/g, "$1"))
    .filter((t) => !t.startsWith("Generated:"));
}

/** `pdfText` per page: the strings of each content stream, in file order. */
export function pdfPages(bytes: Buffer): string[][] {
  const s = bytes.toString("latin1");
  return [...s.matchAll(/stream\r?\n([\s\S]*?)endstream/g)]
    .map((m) => pdfText(Buffer.from(m[1], "latin1")))
    .filter((p) => p.length > 0);
}
