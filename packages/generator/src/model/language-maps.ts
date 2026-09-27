/**
 * The parts of the language definition the compilers read.
 *
 * The definition of the model language is `language/appwithai-language.json`
 * (with `language/yaml/eml.schema.json` for the document's shape). The
 * compilers read its type aliases, its cardinalities and its workflow step
 * types from that file, so the language is stated once.
 *
 * Where the file is found:
 *   1. `APPWITHAI_LANGUAGE_FILE`, when set;
 *   2. `language/appwithai-language.json`, walking up from this module;
 *   3. the same, walking up from the working directory;
 *   4. a definition handed over with `setLanguageMapsDefinition` — the browser
 *      bundle and the YAML reader do this with the JSON they bundle.
 *
 * There is no built-in copy to fall back on. A compiler that could not find the
 * definition used to carry on with a copy of it, which read `text` as `string`
 * and reported nothing; a missing definition is an error, and it says where it
 * looked.
 */

import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

export type CanonicalType =
  | "string"
  | "text"
  | "integer"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "json";

export type CardinalityKind = "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany";

export type RelationshipEnd = "exactly-one" | "zero-or-one" | "zero-or-more" | "one-or-more";

export interface LanguageDefinitionShape {
  types?: { map?: Record<string, CanonicalType>; default?: CanonicalType };
  cardinalities?: {
    map?: Array<{ from: RelationshipEnd; to: RelationshipEnd; kind: CardinalityKind }>;
  };
  workflowConstructs?: {
    stepNodes?: {
      types?: Array<{
        name: string;
        purpose?: string;
        shipped?: boolean;
        required?: string[];
        oneOf?: string[][];
      }>;
    };
  };
}

/** One workflow step type as the language declares it. */
export interface StepNodeSummary {
  name: string;
  purpose: string;
  /** `false` means declared but not executed by the backend. */
  shipped: boolean;
  /** Properties a step of this type must supply. */
  required: string[];
  /** Groups of which at least one member must be supplied. */
  oneOf: string[][];
}

/** The language definition could not be found or read. */
export class LanguageDefinitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LanguageDefinitionError";
  }
}

function candidateFiles(): string[] {
  const candidates: string[] = [];
  const override = process.env.APPWITHAI_LANGUAGE_FILE;
  if (override) candidates.push(override);

  const starts: string[] = [];
  try {
    starts.push(path.dirname(fileURLToPath(import.meta.url)));
  } catch {
    // A bundle with no module URL searches from the working directory only.
  }
  starts.push(process.cwd());

  for (const start of starts) {
    let dir = start;
    for (let depth = 0; depth < 12; depth++) {
      candidates.push(path.join(dir, "language", "appwithai-language.json"));
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return candidates;
}

let cachedDefinition: LanguageDefinitionShape | undefined;

function loadDefinition(): LanguageDefinitionShape {
  if (cachedDefinition) return cachedDefinition;

  const candidates = candidateFiles();
  const file = candidates.find((candidate) => existsSync(candidate));
  if (!file) {
    throw new LanguageDefinitionError(
      "language/appwithai-language.json was not found. Set APPWITHAI_LANGUAGE_FILE to its path. " +
        `Looked in: ${[...new Set(candidates)].slice(0, 4).join(", ")}, …`
    );
  }
  try {
    cachedDefinition = JSON.parse(readFileSync(file, "utf-8")) as LanguageDefinitionShape;
  } catch (error) {
    throw new LanguageDefinitionError(
      `${file} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  return cachedDefinition;
}

/**
 * The workflow step types the language declares, in declaration order.
 *
 * Read by the frontend generator so the designer's palette and the backend's
 * executor are written against one vocabulary.
 */
export function getStepNodeTypes(): StepNodeSummary[] {
  const types = loadDefinition().workflowConstructs?.stepNodes?.types;
  if (!Array.isArray(types)) {
    throw new LanguageDefinitionError(
      "the language definition has no workflowConstructs.stepNodes.types list"
    );
  }
  return types.map((spec) => ({
    name: spec.name,
    purpose: spec.purpose ?? "",
    shipped: spec.shipped !== false,
    required: spec.required ?? [],
    oneOf: spec.oneOf ?? [],
  }));
}

/** One step type's contract, or `undefined` if the language declares no such type. */
export function getStepNode(name: string): StepNodeSummary | undefined {
  return getStepNodeTypes().find((step) => step.name === name);
}

/** Type alias → canonical type, as the language defines it. */
export function getTypeMap(): Record<string, CanonicalType> {
  const map = loadDefinition().types?.map;
  if (!map || Object.keys(map).length === 0) {
    throw new LanguageDefinitionError("the language definition has no types.map");
  }
  return map;
}

/** The canonical type an alias the language does not define becomes. */
export function getDefaultType(): CanonicalType {
  const fallback = loadDefinition().types?.default;
  if (!fallback) throw new LanguageDefinitionError("the language definition has no types.default");
  return fallback;
}

/**
 * The kind of relationship two ends make, or `null` for a pair the language
 * does not define (the schema refuses those before a compiler sees them).
 */
export function getCardinalityKind(
  from: RelationshipEnd,
  to: RelationshipEnd
): CardinalityKind | null {
  const map = loadDefinition().cardinalities?.map;
  if (!map?.length) throw new LanguageDefinitionError("the language definition has no cardinalities.map");
  return map.find((entry) => entry.from === from && entry.to === to)?.kind ?? null;
}

/**
 * Supply the language definition directly instead of finding it on disk — for
 * a context with no filesystem to search, such as the browser bundle.
 */
export function setLanguageMapsDefinition(definition: LanguageDefinitionShape): void {
  cachedDefinition = definition;
}

/** Test-only: forget the loaded definition. */
export function __resetLanguageCache(): void {
  cachedDefinition = undefined;
}
