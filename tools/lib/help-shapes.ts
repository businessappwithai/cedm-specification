/**
 * Help text that is a template with the names filled in, not authored prose.
 *
 * A template text is the same sentence in many entities with only the entity,
 * the field or the target swapped, so its *shape* — the text with those names
 * replaced by placeholders — repeats. Authored prose does not: a sentence that
 * says something true about one concept is not also true of forty others.
 *
 * `tools/help-legacy-shapes.txt` lists the shapes the earlier template
 * generators stamped. Filler *is* a text matching one of them, however few
 * times it occurs — which is what lets the check run on a single new entity —
 * and the list is frozen (see tools/help-shapes.ts).
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadEntities, ROOT } from "./library";
import { escapeRegExp, splitWords, WORD_END, WORD_START } from "./text";
import type { Spec } from "./yaml";

export const LEGACY = path.join(ROOT, "tools", "help-legacy-shapes.txt");
/** Distinct entities that must share a shape before it counts as a template. */
export const THRESHOLD = 3;

/** salesOrder → sales order: how a name reads inside prose. */
function proseWords(name: string): string {
  return name.replace(/(?<=[a-z0-9])(?=[A-Z])/g, " ").toLowerCase();
}

/** The text with every name that varies between entities replaced by a placeholder. */
export function shape(
  text: unknown,
  entity: string,
  own: string | null | undefined,
  targets: ReadonlyArray<string | null | undefined>,
  kind?: string | null
): string {
  let out = splitWords(String(text)).join(" ");
  const swap = (name: string | null | undefined, mark: string) => {
    if (!name) return;
    const forms = new Set([name, proseWords(name), proseWords(name).replaceAll(" ", "_")]);
    for (const form of forms) {
      out = out.replace(new RegExp(`${WORD_START}${escapeRegExp(form)}${WORD_END}`, "giu"), mark);
    }
  };
  // Longest first, so "stateProvince" goes before "state".
  const unique = [...new Set(targets.filter((t): t is string => Boolean(t)))];
  for (const target of unique.sort((a, b) => b.length - a.length)) swap(target, "#");
  swap(entity, "#");
  if (kind) swap(kind.replaceAll("_", " ").replaceAll("entity", "").trim(), "~");
  swap(own, "@");
  return out.replace(new RegExp(`${WORD_START}(?:a|an|the) #`, "gu"), "#");
}

export interface HelpText {
  /** `Entity`, `Entity.attribute` or `Entity.attribute[VALUE]`. */
  where: string;
  key: string;
  value: unknown;
  own: string | null;
  targets: Array<string | null | undefined>;
}

/** Every help string an entity carries, with the names its shape abstracts over. */
export function* helpTexts(entity: Spec): Generator<HelpText> {
  const name = entity.name as string;
  const related = (entity.relationships ?? []).map((r: Spec) => r?.target);
  for (const [key, value] of Object.entries(entity.help ?? {})) {
    yield { where: name, key, value, own: null, targets: related };
  }
  for (const attr of entity.attributes ?? []) {
    for (const [key, value] of Object.entries(attr.help ?? {})) {
      if (key === "valueSemantics" && value && typeof value === "object" && !Array.isArray(value)) {
        for (const [val, text] of Object.entries(value)) {
          yield {
            where: `${name}.${attr.name}[${val}]`,
            key: "valueSemantics",
            value: text,
            own: String(val),
            targets: [attr.target, attr.name],
          };
        }
      } else {
        yield { where: `${name}.${attr.name}`, key, value, own: attr.name, targets: [attr.target] };
      }
    }
  }
  for (const rel of entity.relationships ?? []) {
    for (const [key, value] of Object.entries(rel.help ?? {})) {
      yield { where: `${name}.${rel.name}`, key, value, own: rel.name, targets: [rel.target] };
    }
  }
}

export function legacyShapes(): Set<string> {
  if (!existsSync(LEGACY)) return new Set();
  return new Set(
    readFileSync(LEGACY, "utf-8")
      .split("\n")
      .filter((line) => line && !line.startsWith("//"))
  );
}

export interface ShapeRow {
  where: string;
  key: string;
  shape: string;
  value: string;
}

/** Every help string's shape, and which entities share each (key, shape). */
export function scan(entities = loadEntities().map((file) => file.entity)) {
  const seen = new Map<string, { key: string; shape: string; entities: Set<string> }>();
  const rows: ShapeRow[] = [];
  for (const entity of entities) {
    for (const text of helpTexts(entity)) {
      if (typeof text.value !== "string") continue;
      const s = shape(text.value, entity.name, text.own, text.targets, entity.kind);
      const id = `${text.key}\u0000${s}`;
      const entry = seen.get(id) ?? { key: text.key, shape: s, entities: new Set<string>() };
      entry.entities.add(entity.name);
      seen.set(id, entry);
      rows.push({ where: text.where, key: text.key, shape: s, value: text.value });
    }
  }
  return { seen, rows };
}

/** The help texts that match a frozen template shape: HELP-001. */
export function fillerRows(rows: ShapeRow[], legacy = legacyShapes()): ShapeRow[] {
  return rows.filter((row) => legacy.has(row.shape));
}
