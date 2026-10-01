/**
 * Reading a model file for the CLI.
 *
 * A model is a YAML document: a CEDM application model (`*.cedm.yaml`, opening
 * with `cedm:`), or a model document (`*.eml.yaml`). Every command that takes a
 * model goes through here, so every command validates it the same way — YAML,
 * the schema, the imports and lowering for CEDM, the language checker — before
 * anything is generated from it, and reports each finding at the line and
 * column of the file the author edits.
 */

import * as fs from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import type { ParsedModel } from "../model/compile";
import {
  type CedmModelDocument,
  type CedmSource,
  createFileLibrary,
  isCedmModelText,
  readCedmModel,
  validateCedmValue,
} from "../model-cedm";

export type { CedmSource };
import {
  compileModelDocument,
  isModelYamlPath,
  type ModelDiagnostic,
  type ModelDocument,
  readModelYaml,
} from "../model-yaml";

export interface LoadedModel {
  path: string;
  text: string;
  document: ModelDocument;
  model: ParsedModel;
  /** Present when the model was written in CEDM. */
  cedm?: CedmSource;
}

const SYMBOL: Record<ModelDiagnostic["severity"], string> = {
  error: "✖",
  warning: "⚠",
  info: "ℹ",
};

/** `file:line:column  ✖ CODE message` — the shape editors and CI annotate from. */
export function formatDiagnostic(file: string, diagnostic: ModelDiagnostic): string {
  const where = `${file}:${diagnostic.line}:${diagnostic.column}`;
  const hint = diagnostic.hint ? `\n      ${diagnostic.hint}` : "";
  return `  ${where}  ${SYMBOL[diagnostic.severity]} ${diagnostic.code} ${diagnostic.message}${hint}`;
}

export interface ValidateOptions {
  /** Print warnings and infos as well as errors. Default true. */
  verbose?: boolean;
  print?: (line: string) => void;
}

/** Refuse a path that does not name a model document, before reading it. */
export function requireModelPath(filePath: string): void {
  if (!isModelYamlPath(filePath)) {
    throw new Error(
      `"${path.basename(filePath)}" is not a model. A model is a YAML document ` +
        "(*.cedm.yaml or *.eml.yaml); see language/cedm/README.md."
    );
  }
}

/**
 * Validate a model file and print what is wrong with it.
 * Throws when the model has an error; returns the document otherwise.
 */
export async function validateModelYamlFile(
  filePath: string,
  options: ValidateOptions = {}
): Promise<{
  document: ModelDocument;
  text: string;
  diagnostics: ModelDiagnostic[];
  cedm?: CedmSource;
}> {
  requireModelPath(filePath);
  const print = options.print ?? ((line: string) => console.log(line));
  const text = await fs.readFile(filePath, "utf-8");
  const name = path.basename(filePath);

  let result: { document?: ModelDocument; diagnostics: ModelDiagnostic[]; ok: boolean };
  let cedm: CedmSource | undefined;
  if (isCedmModelText(text)) {
    const library = createFileLibrary({
      modelDirectory: path.dirname(filePath),
      readModule: (moduleText, file) => {
        const value = parse(moduleText) as unknown;
        const problems = validateCedmValue(value);
        if (problems) {
          throw new Error(
            `Module ${path.basename(file)} is not a valid CEDM model:\n` +
              problems.map((problem) => `  ${problem.message}`).join("\n")
          );
        }
        return value as CedmModelDocument;
      },
    });
    const read = readCedmModel(text, { library });
    result = read;
    cedm = {
      text,
      ...(library.root ? { root: library.root } : {}),
      libraryFiles: read.libraryEntities
        .map((entity) => library.entityFile(entity))
        .filter((file): file is string => file !== undefined),
      moduleFiles: [...library.moduleFiles.values()],
    };
  } else {
    result = readModelYaml(text);
  }

  const shown = result.diagnostics.filter(
    (diagnostic) => options.verbose !== false || diagnostic.severity === "error"
  );
  for (const diagnostic of shown) print(formatDiagnostic(name, diagnostic));

  const errors = result.diagnostics.filter((diagnostic) => diagnostic.severity === "error");
  if (!result.ok || !result.document) {
    throw new Error(
      `Model validation failed for "${name}": ${errors.length} error(s). ` +
        "Fix the errors shown above and re-run."
    );
  }
  return {
    document: result.document,
    text,
    diagnostics: result.diagnostics,
    ...(cedm ? { cedm } : {}),
  };
}

/** Read, validate and compile a model file. */
export async function loadModelFile(
  filePath: string,
  options: ValidateOptions = {}
): Promise<LoadedModel> {
  const { document, text, cedm } = await validateModelYamlFile(filePath, options);
  const model = compileModelDocument(document, {
    warn: (message) => console.warn(`  ⚠️  ${message}`),
  });
  return { path: filePath, text, document, model, ...(cedm ? { cedm } : {}) };
}
