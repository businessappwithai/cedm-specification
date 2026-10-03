/**
 * Replace whole top-level sections of a model's YAML, leaving the rest as the
 * author wrote it.
 *
 * Screens that edit one part of a model — the rules editor, the hooks editor —
 * hand back that part as data. Re-serialising the whole document to apply it
 * would discard every comment and every layout choice the author made
 * elsewhere, so only the text of the named sections is rewritten: each is
 * replaced (or removed, for an empty list) in place, and every other byte of
 * the document stays exactly as it was. A key the text did not have is inserted where the language
 * orders it, so the document still reads top to bottom as the language does.
 */

import { Document, isMap, isNode, isScalar, parseDocument } from "yaml";
import { DOCUMENT_KEY_ORDER, type ModelDocument } from "@appwithai/generator/model-yaml";

/** The sections a screen may replace. The ERD itself is edited as text. */
export const EDITABLE_SECTIONS = [
  "hooks",
  "hookFlows",
  "rbac",
  "triggers",
  "reports",
  "rules",
  "stateMachines",
  "sagas",
] as const satisfies ReadonlyArray<keyof ModelDocument>;

export type EditableSection = (typeof EDITABLE_SECTIONS)[number];
export type SectionChanges = Partial<{ [K in EditableSection]: ModelDocument[K] }>;

export class SectionEditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SectionEditError";
  }
}

/** The YAML text of one top-level key and its value, as the canonical writer lays it out. */
function sectionText(key: string, value: unknown): string {
  return new Document({ [key]: value }).toString({
    lineWidth: 0,
    flowCollectionPadding: false,
    indentSeq: true,
  });
}

/** Offset of the start of the line holding `offset`. */
function lineStart(text: string, offset: number): number {
  return text.lastIndexOf("\n", offset - 1) + 1;
}

/** Offset just past the line holding `offset` (its newline included). */
function lineEnd(text: string, offset: number): number {
  const newline = text.indexOf("\n", offset);
  return newline === -1 ? text.length : newline + 1;
}

/**
 * Where a new top-level key goes in front of `keyOffset`: above the comment
 * lines directly over that key, which belong to it, not to what precedes it.
 */
function insertionPoint(text: string, keyOffset: number): number {
  let at = lineStart(text, keyOffset);
  while (at > 0) {
    const previous = lineStart(text, at - 1);
    if (!/^\s*#/.test(text.slice(previous, at))) break;
    at = previous;
  }
  return at;
}

export function replaceSections(text: string, changes: SectionChanges): string {
  for (const key of Object.keys(changes)) {
    if (!(EDITABLE_SECTIONS as readonly string[]).includes(key))
      throw new SectionEditError(`"${key}" is not a section that can be replaced.`);
  }
  let result = text;
  // One key at a time, each against a fresh parse, so every offset used is
  // an offset into the text as it stands.
  for (const key of Object.keys(changes) as EditableSection[]) {
    const value = changes[key];
    if (value === undefined) continue;
    const document = parseDocument(result);
    if (document.errors.length) {
      const first = document.errors[0];
      throw new SectionEditError(
        `The model is not YAML (${first?.message.split("\n")[0] ?? "unreadable"}); fix it before editing its sections.`
      );
    }
    const root = document.contents;
    if (!isMap(root)) throw new SectionEditError("The model is not a YAML mapping.");

    const replacement = Array.isArray(value) && value.length ? sectionText(key, value) : "";
    const pair = root.items.find((item) => isScalar(item.key) && String(item.key.value) === key);
    if (pair && isScalar(pair.key) && pair.key.range) {
      const start = lineStart(result, pair.key.range[0]);
      const valueEnd = isNode(pair.value) && pair.value.range ? pair.value.range[1] : pair.key.range[1];
      const end = lineEnd(result, Math.max(valueEnd - 1, pair.key.range[1]));
      result = result.slice(0, start) + replacement + result.slice(end);
      continue;
    }
    if (!replacement) continue;
    // A key the text lacks goes before the first key the language orders after it.
    const rank = DOCUMENT_KEY_ORDER.indexOf(key);
    const next = root.items.find((item) => {
      const name = isScalar(item.key) ? String(item.key.value) : "";
      return DOCUMENT_KEY_ORDER.indexOf(name as keyof ModelDocument) > rank;
    });
    if (next && isScalar(next.key) && next.key.range) {
      const at = insertionPoint(result, next.key.range[0]);
      result = result.slice(0, at) + replacement + result.slice(at);
    } else {
      result = `${result}${result.endsWith("\n") ? "" : "\n"}${replacement}`;
    }
  }
  return result;
}
