/**
 * How the tools spell values in what they print.
 *
 * Messages quote names as `'flask'` and lists as `['A', 'B']` — documentation,
 * QA notes and batch files cite them in that form, so the tools keep it.
 */

/** A value as a message quotes it: strings in single quotes, null as `None`. */
export function repr(value: unknown): string {
  if (value === null || value === undefined) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "string") {
    const quote = value.includes("'") && !value.includes('"') ? '"' : "'";
    let out = "";
    for (const ch of value) {
      if (ch === "\\") out += "\\\\";
      else if (ch === quote) out += `\\${quote}`;
      else if (ch === "\n") out += "\\n";
      else if (ch === "\r") out += "\\r";
      else if (ch === "\t") out += "\\t";
      else out += ch;
    }
    return quote + out + quote;
  }
  if (Array.isArray(value)) return `[${value.map(repr).join(", ")}]`;
  if (typeof value === "object") {
    return `{${Object.entries(value as object)
      .map(([k, v]) => `${repr(k)}: ${repr(v)}`)
      .join(", ")}}`;
  }
  return String(value);
}

/** A value as text: what an f-string interpolation printed. */
export function str(value: unknown): string {
  if (value === null || value === undefined) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (Array.isArray(value) || (typeof value === "object" && value !== null)) return repr(value);
  return String(value);
}

/** Text split on runs of whitespace, empty pieces dropped. */
export function splitWords(text: string): string[] {
  return text.split(/\s+/u).filter(Boolean);
}

/** The first `n` characters (code points, not UTF-16 units). */
export function head(text: string, n: number): string {
  return Array.from(text).slice(0, n).join("");
}

/** JSON with every non-ASCII character escaped, as a `\uXXXX` sequence. */
export function jsonAscii(value: unknown): string {
  return JSON.stringify(value).replace(
    /[\u007f-￿]/g,
    (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`
  );
}

/**
 * `x` to `digits` decimals, ties to even on the exact binary value — how the
 * report has always printed its percentages, so a 0.25 stays `0.2`.
 */
export function fixed(x: number, digits: number): string {
  const exact = x.toFixed(Math.min(100, digits + 60));
  const [whole = "0", fraction = ""] = exact.split(".");
  const kept = fraction.slice(0, digits);
  const rest = fraction.slice(digits);
  const negative = whole.startsWith("-");
  const digitsOnly = (negative ? whole.slice(1) : whole) + kept;
  let up = false;
  if (rest[0] && rest[0] > "5") up = true;
  else if (rest[0] === "5") {
    up = /[1-9]/.test(rest.slice(1)) || Number(digitsOnly.at(-1) ?? "0") % 2 === 1;
  }
  let n = BigInt(digitsOnly || "0");
  if (up) n += 1n;
  let text = n.toString().padStart(digits + 1, "0");
  text = digits ? `${text.slice(0, -digits)}.${text.slice(-digits)}` : text;
  return negative && n !== 0n ? `-${text}` : text;
}

/** `re.escape` for a RegExp source. */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");
}

/** Word boundaries that treat every letter and digit as a word character, not just ASCII. */
export const WORD_START = "(?<![\\p{L}\\p{N}_])";
export const WORD_END = "(?![\\p{L}\\p{N}_])";
