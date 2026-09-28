/**
 * One stored Mermaid text → its YAML, and everything the conversion had to say.
 *
 * Two kinds of text were stored as Mermaid: models (EML) and automations. Each
 * is read by the reader that wrote it (`legacy/`), taken to today's language,
 * written as YAML, and read back by today's reader before it counts as
 * converted. A text that does not survive that is not converted at all: the
 * caller decides, and says, what happens to it.
 */

import { readModelYaml } from "@appwithai/generator/model-yaml";
import type { Automation } from "../../automation/model";
import { automationFromYaml, automationToYaml } from "../../automation/yaml";
import { parseAutomation, serializeAutomation } from "./legacy/automation.js";
import { emlToModelDocument } from "./legacy/eml.js";
import { upgradeDocument, writeWithComments } from "./upgrade";

export type Conversion =
  | { ok: true; yaml: string; notes: string[] }
  | { ok: false; error: string; notes: string[] };

/** The first few findings of a reader, one per line, as the author would locate them. */
function findings(
  diagnostics: Array<{
    severity: string;
    line: number;
    column: number;
    code: string;
    message: string;
  }>,
  severity: string
) {
  return diagnostics
    .filter((d) => d.severity === severity)
    .map((d) => `line ${d.line}:${d.column} ${d.code} ${d.message}`);
}

/**
 * A Mermaid (EML) model → a YAML model document.
 *
 * Converted means it reads as a document today. Checker findings do not stop
 * it — a draft was allowed to be unfinished, and still is — but each is noted,
 * as is everything the Mermaid said that the document does not carry.
 */
export function convertModel(source: string): Conversion {
  const notes: string[] = [];
  if (!source.trim()) return { ok: false, error: "the stored model is empty", notes };

  let legacy: ReturnType<typeof emlToModelDocument>;
  try {
    legacy = emlToModelDocument(source);
  } catch (error) {
    return {
      ok: false,
      error: `the Mermaid reader refused it: ${error instanceof Error ? error.message : String(error)}`,
      notes,
    };
  }
  for (const issue of legacy.issues)
    notes.push(
      `${issue.kind === "dropped" ? "not carried" : "resolved"}: ${issue.construct} — ${issue.message}`
    );
  for (const line of legacy.uncarried)
    if (line.reason === "uncompiled-directive")
      notes.push(`not carried: line ${line.line} \`${line.text}\` is a directive nothing compiled`);

  const { document, notes: upgraded } = upgradeDocument(legacy.document);
  notes.push(...upgraded);
  const { text, unplaced } = writeWithComments(document, source);
  for (const line of unplaced) notes.push(`comment kept nowhere: ${line}`);

  const read = readModelYaml(text);
  if (!read.document)
    return {
      ok: false,
      error: `the converted document does not read:\n  ${findings(read.diagnostics, "error").slice(0, 8).join("\n  ")}`,
      notes,
    };
  for (const finding of findings(read.diagnostics, "error"))
    notes.push(`checker (the model was saved with this): ${finding}`);
  return { ok: true, yaml: text, notes };
}

/** A line as it is compared: its words, not its spacing. */
const normalise = (line: string) => line.trim().replace(/\s+/g, " ");

/**
 * An automation stored in the automations screen's Mermaid dialect → its YAML
 * document.
 *
 * The dialect was always written by the screen, so reading it and writing it
 * back gives the same lines. A line of the stored text that the rewrite does
 * not contain is something the reader did not understand — a hand edit, a
 * node it has no step for — and converting would drop it without a word, so
 * the automation is refused and the lines are named.
 */
export function convertAutomation(source: string, name: string, entity: string): Conversion {
  const notes: string[] = [];
  if (!source.trim()) return { ok: false, error: "the stored automation is empty", notes };
  let automation: Automation;
  try {
    automation = { ...parseAutomation(source, entity || "Record"), name };
  } catch (error) {
    return {
      ok: false,
      error: `the automation reader refused it: ${error instanceof Error ? error.message : String(error)}`,
      notes,
    };
  }
  const written = new Set(serializeAutomation(automation).split("\n").map(normalise));
  const lost = source
    .split("\n")
    .map(normalise)
    .filter((line) => line && !line.startsWith("%%meta kind:") && !written.has(line));
  if (lost.length)
    return {
      ok: false,
      error: `${lost.length} line(s) are not part of the automation the reader understood:\n  ${lost.slice(0, 8).join("\n  ")}`,
      notes,
    };

  const yaml = automationToYaml(automation);
  try {
    automationFromYaml(yaml);
  } catch (error) {
    return {
      ok: false,
      error: `the converted document does not read: ${error instanceof Error ? error.message : String(error)}`,
      notes,
    };
  }
  return { ok: true, yaml, notes };
}
