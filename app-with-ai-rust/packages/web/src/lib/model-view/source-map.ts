/**
 * Where each part of a model document is written in its YAML text.
 *
 * The diagram and the text are two views of one document, and this is what
 * joins them: a document path to the lines that declare it (a click on a node
 * selects its YAML), and a line back to the deepest path written on it (the
 * cursor in the YAML highlights its node). Built from the same `yaml` parse the
 * reader uses, so a line number here is a line number in its diagnostics.
 */

import { isMap, isNode, isScalar, isSeq, LineCounter, type Node, parseDocument } from "yaml";
import type { DocumentPath } from "@appwithai/generator/model-yaml";

export interface SourceRange {
  /** 1-based, inclusive. */
  startLine: number;
  /** 1-based, inclusive. */
  endLine: number;
  /** Character offsets into the text, for selecting the range in an editor. */
  start: number;
  end: number;
}

export interface SourceMap {
  /** The lines a path was written on; `undefined` for a path the text lacks. */
  rangeOf(path: DocumentPath): SourceRange | undefined;
  /**
   * The deepest path written at a position; `[]` outside every value. Without
   * a column, the first of the deepest paths on the line — a flow list such
   * as `states: [draft, submitted]` writes several values on one line, and
   * only a column tells them apart.
   */
  pathAt(line: number, column?: number): DocumentPath;
}

interface Entry {
  path: DocumentPath;
  range: SourceRange;
}

export function buildSourceMap(text: string): SourceMap {
  const lineCounter = new LineCounter();
  const parsed = parseDocument(text, { lineCounter, keepSourceTokens: false });
  const entries: Entry[] = [];

  const rangeFor = (start: number, end: number): SourceRange => {
    // A block value's range ends after its trailing newline; the line it ends
    // on is the one before.
    let last = end;
    while (last > start && /\s/.test(text[last - 1] ?? "")) last--;
    return {
      startLine: lineCounter.linePos(start).line,
      endLine: lineCounter.linePos(Math.max(start, last - 1)).line,
      start,
      end: last,
    };
  };

  const walk = (node: Node | null | undefined, path: DocumentPath, keyStart?: number) => {
    if (!isNode(node) || !node.range) return;
    const start = keyStart ?? node.range[0];
    entries.push({ path, range: rangeFor(start, node.range[1]) });
    if (isMap(node)) {
      for (const pair of node.items) {
        if (!isScalar(pair.key)) continue;
        const key = String(pair.key.value);
        walk(pair.value as Node | null, [...path, key], pair.key.range?.[0]);
      }
    } else if (isSeq(node)) {
      node.items.forEach((item, index) => walk(item as Node, [...path, index]));
    }
  };
  walk(parsed.contents as Node | null, []);

  const lineStarts = [0];
  for (let index = 0; index < text.length; index++) {
    if (text[index] === "\n") lineStarts.push(index + 1);
  }
  /** 1-based line and column to a character offset. */
  const offsetOf = (line: number, column: number) =>
    (lineStarts[line - 1] ?? text.length) + column - 1;

  const byKey = new Map(entries.map((entry) => [entry.path.join("\u0000"), entry.range]));

  return {
    rangeOf(path) {
      // A path whose leaf was left out — an optional key the author did not
      // write — is shown at the nearest thing that was written.
      for (let depth = path.length; depth >= 0; depth--) {
        const range = byKey.get(path.slice(0, depth).join("\u0000"));
        if (range) return range;
      }
      return undefined;
    },
    pathAt(line, column) {
      const offset = column === undefined ? undefined : offsetOf(line, column);
      let best: Entry | undefined;
      for (const entry of entries) {
        const { startLine, endLine, start, end } = entry.range;
        if (line < startLine || line > endLine) continue;
        if (offset !== undefined && (offset < start || offset > end)) continue;
        if (!best || entry.path.length > best.path.length) best = entry;
      }
      return best?.path ?? [];
    },
  };
}
