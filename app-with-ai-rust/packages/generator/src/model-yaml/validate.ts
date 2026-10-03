/**
 * Reading model text, and everything that can be wrong with it.
 *
 * Three layers, each reported against the line and column of the YAML the
 * author edits:
 *
 * 1. **YAML** — the text parses, with no duplicate keys.
 * 2. **Schema** — the document is what `language/yaml/eml.schema.json` says a
 *    model is. The schema is the definition of the language, and it is the
 *    schema itself that is checked here, not a second description of it.
 * 3. **Model** — the language checker (`language/yaml/checker.ts`): the rules
 *    that relate one part of a model to another, which a schema cannot state.
 *    Each finding names the document path it is about, so it lands on the YAML.
 */

import Ajv2020, { type ErrorObject } from "ajv/dist/2020";
import { isNode, LineCounter, parseDocument } from "yaml";
import languageDefinition from "../../../../language/appwithai-language.json";
import { type LanguageDefinition, setLanguageDefinition } from "../../../../language/index";
import { checkModelDocument } from "../../../../language/yaml/checker";
import schema from "../../../../language/yaml/eml.schema.json";
import type { DocumentPath, ModelDocument } from "./document";

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface ModelDiagnostic {
  severity: DiagnosticSeverity;
  /** `YAML`, `SCHEMA`, or the checker's own code (`EML117`, …). */
  code: string;
  message: string;
  /** Where in the document, as keys and indexes. Empty for the document itself. */
  path: DocumentPath;
  /** 1-based. */
  line: number;
  /** 1-based. */
  column: number;
  hint?: string;
}

export interface ReadModelYamlResult {
  /** Present when the text is YAML and satisfies the schema. */
  document?: ModelDocument;
  diagnostics: ModelDiagnostic[];
  /** No diagnostic of severity `error`. */
  ok: boolean;
}

export interface ReadModelYamlOptions {
  /** Run the language checker (layer 3). Default true. */
  check?: boolean;
}

let compiledSchema: ReturnType<Ajv2020["compile"]> | undefined;

function schemaValidator() {
  if (!compiledSchema) {
    const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
    compiledSchema = ajv.compile(schema);
  }
  return compiledSchema;
}

/** `/entities/0/attributes/2` → `["entities", 0, "attributes", 2]`. */
function pointerToPath(pointer: string): DocumentPath {
  if (!pointer) return [];
  return pointer
    .slice(1)
    .split("/")
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"))
    .map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
}

function pathLabel(path: DocumentPath): string {
  if (!path.length) return "document";
  return path.reduce<string>(
    (label, segment) =>
      typeof segment === "number"
        ? `${label}[${segment}]`
        : label
          ? `${label}.${segment}`
          : segment,
    ""
  );
}

/** Keep the one error that says what is wrong, not every branch ajv tried. */
function significantErrors(errors: ErrorObject[]): ErrorObject[] {
  const anyOf = errors.filter((error) => error.keyword === "anyOf");
  return errors.filter((error) => {
    if (error.keyword === "anyOf") return true;
    return !anyOf.some(
      (parent) =>
        error.instancePath.startsWith(parent.instancePath) &&
        error.schemaPath.startsWith(`${parent.schemaPath}/`)
    );
  });
}

function schemaMessage(error: ErrorObject): { path: DocumentPath; message: string } {
  const path = pointerToPath(error.instancePath);
  const at = pathLabel(path);
  switch (error.keyword) {
    case "required":
      return { path, message: `${at} is missing required key "${error.params.missingProperty}"` };
    case "additionalProperties":
      return {
        path: [...path, error.params.additionalProperty as string],
        message: `${at} has unknown key "${error.params.additionalProperty}"`,
      };
    case "enum":
      return {
        path,
        message: `${at} must be one of: ${(error.params.allowedValues as unknown[]).join(", ")}`,
      };
    case "const":
      return { path, message: `${at} must be ${JSON.stringify(error.params.allowedValue)}` };
    case "anyOf":
      if (path[0] === "relationships") {
        return {
          path,
          message:
            `${at} pairs cardinalities the language does not define. Valid pairs: ` +
            "exactly-one/exactly-one, exactly-one/zero-or-more, exactly-one/one-or-more, " +
            "zero-or-more/exactly-one, one-or-more/exactly-one, zero-or-more/zero-or-more, " +
            "one-or-more/one-or-more, zero-or-one/zero-or-one",
        };
      }
      return { path, message: `${at} does not match any allowed form` };
    case "dependentRequired":
      return {
        path,
        message: `${at} declares "${error.params.property}" and so also needs "${error.params.missingProperty}"`,
      };
    default:
      return { path, message: `${at} ${error.message ?? "is invalid"}` };
  }
}

/**
 * Read YAML model text into a validated document.
 *
 * A document is returned whenever the text is YAML and satisfies the schema,
 * even with model errors, so an editor can still draw what it can. Whether it
 * may be *generated* from is `ok`.
 */
export function readModelYaml(
  text: string,
  options: ReadModelYamlOptions = {}
): ReadModelYamlResult {
  const diagnostics: ModelDiagnostic[] = [];
  const lineCounter = new LineCounter();
  const parsed = parseDocument(text, { lineCounter, uniqueKeys: true, prettyErrors: false });

  const position = (offset: number | undefined) => {
    const { line, col } = lineCounter.linePos(offset ?? 0);
    return { line, column: col };
  };

  /** Where a path points in the text: the key for a missing child, the value otherwise. */
  const locate = (path: DocumentPath) => {
    for (let depth = path.length; depth >= 0; depth--) {
      const prefix = path.slice(0, depth);
      const node = prefix.length ? parsed.getIn(prefix, true) : parsed.contents;
      if (isNode(node) && node.range) return position(node.range[0]);
    }
    return { line: 1, column: 1 };
  };

  for (const error of parsed.errors) {
    diagnostics.push({
      severity: "error",
      code: "YAML",
      message: error.message.split("\n")[0] ?? error.message,
      path: [],
      ...position(error.pos[0]),
    });
  }
  for (const warning of parsed.warnings) {
    diagnostics.push({
      severity: "warning",
      code: "YAML",
      message: warning.message.split("\n")[0] ?? warning.message,
      path: [],
      ...position(warning.pos[0]),
    });
  }
  if (parsed.errors.length) return { diagnostics, ok: false };

  const value: unknown = parsed.toJS({ maxAliasCount: 100 });
  const validated = validateModelValue(value, options);
  for (const issue of validated.issues) diagnostics.push({ ...issue, ...locate(issue.path) });
  return {
    ...(validated.document ? { document: validated.document } : {}),
    diagnostics,
    ok: !diagnostics.some((diagnostic) => diagnostic.severity === "error"),
  };
}

/** A finding about a document, before it is placed on a line of text. */
export type ModelIssue = Omit<ModelDiagnostic, "line" | "column">;

/**
 * Layers 2 and 3 over a value already read from YAML: the schema, then the
 * language checker. Shared by `readModelYaml` and by the CEDM reader, which
 * runs them over the document a CEDM model lowers to and reports each finding
 * where the CEDM model said it.
 */
export function validateModelValue(
  value: unknown,
  options: ReadModelYamlOptions = {}
): { document?: ModelDocument; issues: ModelIssue[] } {
  const issues: ModelIssue[] = [];
  const validate = schemaValidator();
  if (!validate(value)) {
    for (const error of significantErrors(validate.errors ?? [])) {
      const { path, message } = schemaMessage(error);
      issues.push({ severity: "error", code: "SCHEMA", message, path });
    }
    return { issues };
  }

  const document = value as ModelDocument;
  if (options.check !== false) {
    installLanguageDefinition();
    for (const issue of checkModelDocument(document)) {
      issues.push({
        severity: issue.severity,
        code: issue.code,
        message: issue.message,
        path: issue.path,
        ...(issue.hint ? { hint: issue.hint } : {}),
      });
    }
  }
  return { document, issues };
}

/** `pathLabel` for other readers' messages. */
export { pathLabel, pointerToPath, schemaMessage, significantErrors };

let definitionInstalled = false;

/**
 * Hand the checker the language definition bundled with this module rather
 * than letting it read the file beside `language/index.ts`, which does not
 * exist once the CLI is bundled into `dist/` — the same arrangement the
 * browser build uses.
 */
function installLanguageDefinition(): void {
  if (definitionInstalled) return;
  setLanguageDefinition(languageDefinition as unknown as LanguageDefinition);
  definitionInstalled = true;
}
