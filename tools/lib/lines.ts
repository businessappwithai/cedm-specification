/**
 * Editing an entity file as lines of text.
 *
 * The derivation tools insert blocks into a file rather than re-serialising it,
 * so every line an author wrote stays exactly as it was. These are the helpers
 * they share for finding where a top-level block ends.
 */

export function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}

/** The line of a top-level (two-space) key under `entity:`, or undefined. */
export function topKey(lines: string[], key: string): number | undefined {
  const at = lines.findIndex((line) => line.startsWith(`  ${key}:`));
  return at < 0 ? undefined : at;
}

/** First line after a top-level (2-space) key's block, trailing blank lines excluded. */
export function topBlockEnd(lines: string[], start: number): number {
  let end = start + 1;
  while (
    end < lines.length &&
    (!lines[end]?.trim() || indentOf(lines[end] as string) > 2 || lines[end]?.startsWith("  - "))
  )
    end++;
  while (end > start + 1 && !lines[end - 1]?.trim()) end--;
  return end;
}

/** First line after `start` that is not nested deeper than `indent`. */
export function blockEnd(lines: string[], start: number, indent: number): number {
  let end = start + 1;
  while (end < lines.length && (!lines[end]?.trim() || indentOf(lines[end] as string) > indent))
    end++;
  while (end > start + 1 && !lines[end - 1]?.trim()) end--;
  return end;
}

/** A replacement of lines [start, stop) — an insertion when they are equal. */
export type Span = [start: number, stop: number, lines: string[]];

/**
 * Apply every span, last first, so no edit moves the lines another still names.
 * Spans at the same place land in the order they were given: an insertion that
 * extends a block, given first, stays in that block ahead of a new one.
 */
export function applySpans(lines: string[], spans: Span[]): string[] {
  const out = [...lines];
  const ordered = spans
    .map((span, index) => ({ span, index }))
    .sort((a, b) => b.span[0] - a.span[0] || b.span[1] - a.span[1] || b.index - a.index);
  for (const { span } of ordered) {
    const [start, stop, replacement] = span;
    out.splice(start, stop - start, ...replacement);
  }
  return out;
}
