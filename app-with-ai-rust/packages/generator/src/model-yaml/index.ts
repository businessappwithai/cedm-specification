/**
 * The model language: a model is a YAML document, `*.eml.yaml`.
 *
 *   readModelYaml(text)          YAML text → validated document + diagnostics
 *   compileModelDocument(doc)    document → ParsedModel, what the templates consume
 *   serializeModelDocument(doc)  document → canonical YAML text
 *   parseModelYaml(text)         all three steps, refusing a model with errors
 */

import { Document, isScalar, visit } from "yaml";
import { type CompileOptions, compileModelRecords, type ParsedModel } from "../model/compile";
import { canonicalDocument } from "./canonical";
import type { ModelDocument } from "./document";
import { documentToRecords } from "./to-records";
import { type ModelDiagnostic, readModelYaml } from "./validate";

export { canonicalDocument } from "./canonical";
export {
  AUTO_FIXABLE_CODES,
  type AppliedFix,
  type CheckAndFixResult,
  checkAndFix,
  type FixOptions,
  type FixOutcome,
  fixModelYaml,
} from "./fixer";
export * from "./document";
export { documentToRecords } from "./to-records";
export {
  type DiagnosticSeverity,
  type ModelDiagnostic,
  type ReadModelYamlOptions,
  type ReadModelYamlResult,
  readModelYaml,
} from "./validate";

/** File suffix of a model document. */
export const MODEL_YAML_SUFFIX = ".eml.yaml";

/** Whether a path names a model document: `*.eml.yaml`, or any `.yaml` / `.yml`. */
export function isModelYamlPath(filePath: string): boolean {
  return /\.ya?ml$/i.test(filePath);
}

/**
 * Canonical YAML text for a document.
 *
 * Keys in the order the language documents them, nothing stated twice, long
 * values never folded. Saving a document twice gives the same bytes, so a Git
 * diff between two saves is exactly the change.
 */
export function serializeModelDocument(document: ModelDocument): string {
  const yaml = new Document(canonicalDocument(document));
  // A list of plain values — enum values, index columns, states, roles — is
  // written on one line, the way a person writes it; a list of mappings stays
  // a block. Decided by shape alone, so the output is the same on every save.
  visit(yaml, {
    Seq(_key, node) {
      if (node.items.length && node.items.every((item) => isScalar(item))) node.flow = true;
    },
  });
  return yaml.toString({
    lineWidth: 0,
    blockQuote: "literal",
    indentSeq: true,
    flowCollectionPadding: false,
  });
}

/** Compile a validated document into everything it contributes to generation. */
export function compileModelDocument(
  document: ModelDocument,
  options: CompileOptions = {}
): ParsedModel {
  return compileModelRecords(documentToRecords(document), options);
}

/** A model the generator refuses, with what is wrong with it. */
export class ModelYamlError extends Error {
  constructor(
    readonly diagnostics: ModelDiagnostic[],
    source = "model"
  ) {
    const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error");
    super(
      `${source} has ${errors.length} error(s):\n` +
        errors
          .map(
            (error) => `  ${source}:${error.line}:${error.column} ${error.code} ${error.message}`
          )
          .join("\n")
    );
    this.name = "ModelYamlError";
  }
}

/**
 * Read, validate and compile model text — what generation starts from.
 * Throws `ModelYamlError` when the model has errors.
 */
export function parseModelYaml(
  text: string,
  options: { source?: string; warn?: (message: string) => void } = {}
): { model: ParsedModel; document: ModelDocument; diagnostics: ModelDiagnostic[] } {
  const result = readModelYaml(text);
  if (!result.ok || !result.document) {
    throw new ModelYamlError(result.diagnostics, options.source);
  }
  return {
    model: compileModelDocument(result.document, { warn: options.warn }),
    document: result.document,
    diagnostics: result.diagnostics,
  };
}
