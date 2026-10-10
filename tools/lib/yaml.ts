/**
 * Reading and rewriting the specification's YAML.
 *
 * Every tool reads with the `yaml` package's YAML 1.2 core schema — the same
 * reading the generators (`packages/generator`, Bun.YAML, the Rust crate) give
 * the files, so a tool and a generator cannot disagree about what a file says.
 * (The earlier Python tools read YAML 1.1, where an unquoted `ON`, `NO` or `YES`
 * is a boolean; a status value spelled that way meant one thing to the
 * validator and another to the application.)
 *
 * A tool that edits a file parses it as a Document and writes it back with
 * `ROUND_TRIP`: every entity file in the library survives that byte for byte
 * (tools/__tests__/yaml.test.ts), so an edit changes the lines it means to and
 * no others.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { type Document, parse, parseDocument, type ToStringOptions } from "yaml";

/**
 * A value parsed from the specification's YAML. It is untyped by nature — the
 * files are the schema's to describe, not the compiler's — so each tool checks
 * the shape it reads before relying on it.
 */
// biome-ignore lint/suspicious/noExplicitAny: parsed YAML has no static type.
export type Spec = any;

/** How an edited document is written: no folding, sequences indented under their key. */
export const ROUND_TRIP: ToStringOptions = {
  lineWidth: 0,
  indentSeq: true,
  flowCollectionPadding: false,
};

/** Parse YAML text; a document holding nothing is `{}`, as the tools expect a mapping. */
export function parseYaml(text: string, file?: string): Spec {
  try {
    return parse(text, { maxAliasCount: -1 }) ?? {};
  } catch (error) {
    if (!file) throw error;
    throw new Error(`${file}: ${error instanceof Error ? error.message.split("\n")[0] : error}`);
  }
}

export function readYaml(path: string): Spec {
  return parseYaml(readFileSync(path, "utf-8"), path);
}

/** A file as an editable Document, comments and layout kept. */
export function readDocument(path: string): Document.Parsed {
  const document = parseDocument(readFileSync(path, "utf-8"), { keepSourceTokens: true });
  if (document.errors.length) throw new Error(`${path}: ${document.errors[0]?.message}`);
  return document;
}

export function renderDocument(document: Document): string {
  return document.toString(ROUND_TRIP);
}

export function writeDocument(path: string, document: Document): void {
  writeFileSync(path, renderDocument(document), "utf-8");
}
