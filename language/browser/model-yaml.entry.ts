/**
 * The YAML model language, as one file a web page can load.
 *
 * A model is written as YAML — the source of truth — and drawn as Mermaid. This
 * bundles the reader and validator (YAML syntax, the JSON Schema, the full EML
 * checker over the view, and view fidelity, reported at YAML lines), the view
 * renderer, the EML → YAML converter and the canonical serializer: the same
 * modules `appwithai validate`, `convert` and `view` run, so a model that
 * validates here validates there.
 *
 * Nothing here is new logic. The language definition is injected twice — once
 * for the checker's loader and once for the generator's maps — because a tab
 * has no filesystem to find `appwithai-language.json` on, and a loader that
 * finds nothing falls back to a built-in vocabulary and reads a model
 * differently without saying so.
 */

import languageDefinition from "../appwithai-language.json";
import {
  type LanguageDefinitionShape,
  setLanguageMapsDefinition,
} from "../../packages/generator/src/parsers/language-maps";
import {
  canonicalDocument,
  emlToModelDocument,
  isModelYamlPath,
  readModelYaml,
  renderEmlView,
  serializeModelDocument,
} from "../../packages/generator/src/model-yaml/index";
import { type LanguageDefinition, setLanguageDefinition } from "../index";

setLanguageDefinition(languageDefinition as unknown as LanguageDefinition);
setLanguageMapsDefinition(languageDefinition as unknown as LanguageDefinitionShape);

/** The EML version the view and its diagnostics are written against. */
export const LANGUAGE_VERSION: string = languageDefinition.language.version;

/**
 * Validate YAML model text: `{ ok, document, diagnostics }`, every diagnostic
 * located at the YAML line and column it concerns.
 */
export const validate = readModelYaml;

/** The Mermaid view of a model: `{ text, lineMap }`. Drawn from the YAML, never read back for generation. */
export function view(yamlText: string): { ok: boolean; text: string; diagnostics: unknown[] } {
  const read = readModelYaml(yamlText);
  if (!read.document) return { ok: false, text: "", diagnostics: read.diagnostics };
  return { ok: read.ok, text: renderEmlView(read.document).text, diagnostics: read.diagnostics };
}

/**
 * Convert an EML (Mermaid) model to YAML text, with what it did not carry:
 * `{ yaml, issues, uncarried }`.
 */
export function convert(emlText: string) {
  const { document, issues, uncarried } = emlToModelDocument(emlText);
  return { yaml: serializeModelDocument(document), issues, uncarried };
}

export {
  canonicalDocument,
  emlToModelDocument,
  isModelYamlPath,
  readModelYaml,
  renderEmlView,
  serializeModelDocument,
};

// As in checker.entry.ts — reachable without a bound import.
(globalThis as Record<string, unknown>).EMLYaml = {
  validate,
  view,
  convert,
  readModelYaml,
  renderEmlView,
  emlToModelDocument,
  serializeModelDocument,
  canonicalDocument,
  isModelYamlPath,
  LANGUAGE_VERSION,
};
