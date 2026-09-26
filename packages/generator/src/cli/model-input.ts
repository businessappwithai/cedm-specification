/**
 * Reading a model file for the CLI, in whichever syntax it is written.
 *
 * `*.eml.yaml` / `*.yaml` / `*.yml` is the YAML model language; anything else
 * is EML. Every command that takes a model goes through here, so every command
 * takes both — and a YAML model is always validated before anything is
 * generated from it.
 */

import * as fs from "node:fs/promises";
import path from "node:path";
import type { ParsedModel } from "../model/compile";
import {
  compileModelDocument,
  isModelYamlPath,
  type ModelDiagnostic,
  type ModelDocument,
  readModelYaml,
} from "../model-yaml";
import { parseModel } from "../pipeline/parse-model";

export type LoadedModel =
  | { format: "yaml"; path: string; text: string; document: ModelDocument; model: ParsedModel }
  | { format: "eml"; path: string; text: string; model: ParsedModel };

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

/**
 * Validate a YAML model file and print what is wrong with it.
 * Throws when the model has an error; returns the document otherwise.
 */
export async function validateModelYamlFile(
  filePath: string,
  options: ValidateOptions = {}
): Promise<{ document: ModelDocument; text: string; diagnostics: ModelDiagnostic[] }> {
  const print = options.print ?? ((line: string) => console.log(line));
  const text = await fs.readFile(filePath, "utf-8");
  const result = readModelYaml(text);
  const name = path.basename(filePath);

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
  return { document: result.document, text, diagnostics: result.diagnostics };
}

/** Read, validate (YAML) and compile a model file. */
export async function loadModelFile(
  filePath: string,
  options: ValidateOptions = {}
): Promise<LoadedModel> {
  await fs.access(filePath);

  if (isModelYamlPath(filePath)) {
    const { document, text } = await validateModelYamlFile(filePath, options);
    const model = compileModelDocument(document, {
      warn: (message) => console.warn(`  ⚠️  ${message}`),
    });
    return { format: "yaml", path: filePath, text, document, model };
  }

  const text = await fs.readFile(filePath, "utf-8");
  return { format: "eml", path: filePath, text, model: parseModel(text) };
}
