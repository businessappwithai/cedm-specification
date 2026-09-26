/**
 * The YAML model language.
 *
 * A model written in YAML is the source of truth; its Mermaid (EML) view is
 * derived from it for drawing and is never read back for generation. Both
 * syntaxes are read into the same model records and compiled by the same
 * compiler, so a model means the same application whichever it was written in.
 *
 *   readModelYaml(text)        YAML text → validated document + diagnostics
 *   compileModelDocument(doc)  document → ParsedModel, what the templates consume
 *   renderEmlView(doc)         document → EML text, for viewers and the designer
 *   emlToModelDocument(text)   EML text → document, for migrating a model
 *   serializeModelDocument(d)  document → canonical YAML text
 */

import { stringify } from "yaml";
import { extractWorkflowSections } from "../eml";
import { type CompileOptions, compileModelRecords, type ParsedModel } from "../model/compile";
import { readEmlModel, type UncarriedLine, uncarriedDirectiveLines } from "../model/read-eml";
import { type ConversionIssue, documentToRecords, recordsToDocument } from "./convert";
import type { ModelDocument } from "./document";
import { canonicalDocument, type ModelDiagnostic, readModelYaml } from "./validate";

export type { ConversionIssue } from "./convert";
export { documentToRecords, recordsToDocument } from "./convert";
export * from "./document";
export { type DocumentPath, type RenderedView, renderEmlView } from "./render-eml";
export {
  canonicalDocument,
  type DiagnosticSeverity,
  type ModelDiagnostic,
  type ReadModelYamlOptions,
  type ReadModelYamlResult,
  readModelYaml,
} from "./validate";

/** File suffix of a YAML model document. */
export const MODEL_YAML_SUFFIX = ".eml.yaml";

/** Whether a path names a YAML model document rather than an EML one. */
export function isModelYamlPath(filePath: string): boolean {
  return /\.eml\.ya?ml$/i.test(filePath) || /\.ya?ml$/i.test(filePath);
}

/**
 * Canonical YAML text for a document.
 *
 * Keys in the order the language documents them, nothing stated twice, long
 * values never folded. Saving a document twice gives the same bytes, so a Git
 * diff between two saves is exactly the change.
 */
export function serializeModelDocument(document: ModelDocument): string {
  return stringify(canonicalDocument(document), {
    lineWidth: 0,
    blockQuote: "literal",
    indentSeq: true,
  });
}

/** Compile a validated document into everything it contributes to generation. */
export function compileModelDocument(
  document: ModelDocument,
  options: Omit<CompileOptions, "erdParts"> = {}
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
 * Read, validate and compile YAML model text — what generation starts from.
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

export interface EmlConversion {
  document: ModelDocument;
  /** Declarations EML repeated or pointed at nothing, and how each was resolved. */
  issues: ConversionIssue[];
  /** `%%` lines no compiler reads — comments and reserved directives. */
  uncarried: UncarriedLine[];
}

/**
 * Convert an EML document to a YAML model document.
 *
 * Everything that compiles is carried: compiling the result produces exactly
 * the application the EML produces. What is not carried — comments, reserved
 * directives nothing compiles yet, annotations naming nothing — is returned so
 * the caller can show it rather than lose it quietly.
 */
export function emlToModelDocument(source: string): EmlConversion {
  const warnings: string[] = [];
  const { document, issues } = recordsToDocument(
    readEmlModel(source, (message) => warnings.push(message))
  );
  for (const message of warnings) {
    issues.push({ construct: "directive", message, kind: "dropped" });
  }
  issues.push(...sagaDirectiveIssues(source, document));
  return { document, issues, uncarried: uncarriedDirectiveLines(source) };
}

/**
 * Sagas whose `%%workflow` line says one thing and whose compiled form another.
 *
 * EML documents a saga's trigger and operation on its `%%workflow` line, and
 * that is where the checker and the composer read them — but the saga compiler
 * reads only `%%meta trigger:` / `%%meta operation:`. A saga declared
 * `trigger: automatic operation: UPDATE` on its directive alone therefore
 * compiles as rule-triggered on every write, and runs only if some rule names
 * it. The converted document states what compiles, because that is the
 * application the EML generates; this says where that differs from what the
 * author wrote, so the difference is a decision rather than an accident.
 */
function sagaDirectiveIssues(source: string, document: ModelDocument): ConversionIssue[] {
  const issues: ConversionIssue[] = [];
  const sagas = new Map((document.sagas ?? []).map((saga) => [saga.name, saga]));

  for (const section of extractWorkflowSections(source)) {
    if (section.kind !== "saga") continue;
    const saga = sagas.get(section.name);
    if (!saga) continue;

    const compiledTrigger = saga.trigger ?? "rule";
    const compiledOperation = saga.operation ?? "ALL";
    const differences: string[] = [];
    if (section.trigger && section.trigger !== compiledTrigger) {
      differences.push(`trigger: ${section.trigger} (compiles as ${compiledTrigger})`);
    }
    if (section.operation && section.operation !== compiledOperation) {
      differences.push(`operation: ${section.operation} (compiles as ${compiledOperation})`);
    }
    if (!differences.length) continue;

    issues.push({
      construct: `%%workflow ${section.name}`,
      message:
        `the %%workflow line declares ${differences.join(" and ")}. The saga compiler reads ` +
        "only %%meta trigger:/operation:, so EML generates the compiled values and the document " +
        "states those. Set them in the YAML to get what the directive says.",
      kind: "resolved",
    });
  }

  return issues;
}
