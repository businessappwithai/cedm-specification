/**
 * The model language, as one file a web page can load.
 *
 * Bundles the reader (YAML syntax, the JSON Schema, the language checker, every
 * finding located at the YAML line and column it concerns), the fixer and the
 * canonical serializer: the same modules `appwithai validate` and the `eml` CLI
 * run, so a model that validates here validates there.
 *
 * Nothing here is new logic. The language definition is injected twice — once
 * for the language accessor and once for the generator's maps — because a tab
 * has no filesystem to find `appwithai-language.json` on.
 */

import languageDefinition from "../appwithai-language.json";
import {
  type LanguageDefinitionShape,
  setLanguageMapsDefinition,
} from "../../packages/generator/src/model/language-maps";
import {
  canonicalDocument,
  checkAndFix,
  fixModelYaml,
  isModelYamlPath,
  readModelYaml,
  serializeModelDocument,
} from "../../packages/generator/src/model-yaml/index";
import { cedmOrder, lowerCedmModel, raiseModelDocument, resolveCedmImports } from "../cedm/index";
import {
  isCedmModelPath,
  isCedmModelText,
  readCedmModel,
} from "../../packages/generator/src/model-cedm/read";
import { serializeCedmDocument } from "../../packages/generator/src/model-cedm/canonical";
import { type LanguageDefinition, setLanguageDefinition } from "../index";

setLanguageDefinition(languageDefinition as unknown as LanguageDefinition);
setLanguageMapsDefinition(languageDefinition as unknown as LanguageDefinitionShape);

/** The language version the diagnostics are written against. */
export const LANGUAGE_VERSION: string = languageDefinition.language.version;

/**
 * Validate model text: `{ ok, document, diagnostics }`, every diagnostic
 * located at the YAML line and column it concerns.
 */
export const validate = readModelYaml;

/**
 * Repair what can be repaired mechanically, keeping the author's comments, and
 * re-check: `{ text, applied, diagnostics, ok }`.
 */
export const fix = checkAndFix;

/**
 * Validate a CEDM application model: `{ ok, document, resolved, diagnostics }`,
 * every diagnostic at the CEDM line it concerns. A tab has no filesystem, so the
 * library its `imports` name is passed in: `{ entity(name), module?(name) }`,
 * where `entity` returns the library's definition of a CEDM entity.
 */
export const validateCedm = readCedmModel;

/** A model document written in CEDM — `appwithai convert` in a page. */
export const toCedm = (document: Parameters<typeof raiseModelDocument>[0]): string =>
  serializeCedmDocument(raiseModelDocument(document));

export {
  canonicalDocument,
  cedmOrder,
  isCedmModelPath,
  isCedmModelText,
  lowerCedmModel,
  raiseModelDocument,
  readCedmModel,
  resolveCedmImports,
  serializeCedmDocument,
  checkAndFix,
  fixModelYaml,
  isModelYamlPath,
  readModelYaml,
  serializeModelDocument,
};

// Reachable without a bound import, for a page that loads it with a plain <script>.
(globalThis as Record<string, unknown>).EMLYaml = {
  validate,
  fix,
  readModelYaml,
  checkAndFix,
  fixModelYaml,
  serializeModelDocument,
  canonicalDocument,
  isModelYamlPath,
  LANGUAGE_VERSION,
  validateCedm,
  toCedm,
  isCedmModelText,
};
