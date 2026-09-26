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

import { Document, isScalar, visit } from "yaml";
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
  issues.push(...sagaDirectiveIssues(source));
  return { document, issues, uncarried: uncarriedDirectiveLines(source) };
}

/**
 * Sagas that state a trigger or operation twice, differently.
 *
 * The language puts both on the `%%workflow` line; older models wrote them as
 * `%%meta` lines in the section. Both are read and the directive wins, so a
 * model saying `trigger: automatic` on one and `%%meta trigger: rule` on the
 * other runs automatically — which is worth saying, because one of the two
 * lines is not what the author believes.
 */
function sagaDirectiveIssues(source: string): ConversionIssue[] {
  const issues: ConversionIssue[] = [];
  const lines = source.split(/\r?\n/);
  lines.forEach((raw, index) => {
    const header = raw.trim().match(/^%%workflow\s+(\S+)\s+(.*)$/);
    if (!header || !/\bkind:\s*saga\b/i.test(header[2] ?? "")) return;
    const name = header[1]!;
    const onLine = (key: string) => header[2]?.match(new RegExp(`\\b${key}:\\s*(\\S+)`))?.[1];

    for (let next = index + 1; next < lines.length; next++) {
      const line = lines[next]!.trim();
      if (/^%%workflow\s/.test(line)) break;
      const meta = line.match(/^%%meta\s+(trigger|operation)\s*:\s*(\S+)/);
      if (!meta) continue;
      const declared = onLine(meta[1]!);
      if (declared !== undefined && declared.toLowerCase() !== meta[2]!.toLowerCase()) {
        issues.push({
          construct: `%%workflow ${name}`,
          message:
            `declares ${meta[1]}: ${declared} on its %%workflow line and ${meta[2]} in a %%meta ` +
            "line. The %%workflow line wins; the document states that value.",
          kind: "resolved",
        });
      }
    }
  });
  return issues;
}
