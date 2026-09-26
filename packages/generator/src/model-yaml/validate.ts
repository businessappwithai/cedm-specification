/**
 * Reading YAML model text, and everything that can be wrong with it.
 *
 * Four layers, each reported against the line and column of the YAML the
 * author edits:
 *
 * 1. **YAML** — the text parses, with no duplicate keys.
 * 2. **Schema** — the document is what `language/yaml/eml.schema.json` says a
 *    model is. The schema is the definition of the language, and it is the
 *    schema itself that is checked here, not a second description of it.
 * 3. **Model** — the language checker, the same ~130 rules that gate EML
 *    generation, run over the document's Mermaid view. Every view line knows
 *    the document path it was drawn from, so each finding lands on the YAML.
 * 4. **View** — the view reads back to the same document. Where it does not,
 *    the model is still exactly what the YAML says; the drawing is what differs,
 *    and the author is told which construct EML cannot draw faithfully.
 */

import Ajv2020, { type ErrorObject } from "ajv/dist/2020";
import { isNode, LineCounter, parseDocument } from "yaml";
import languageDefinition from "../../../../language/appwithai-language.json";
import { checkSource } from "../../../../language/checker";
import { type LanguageDefinition, setLanguageDefinition } from "../../../../language/index";
import schema from "../../../../language/yaml/eml.schema.json";
import { readEmlModel } from "../model/read-eml";
import { documentToRecords, recordsToDocument } from "./convert";
import { DOCUMENT_KEY_ORDER, type ModelDocument } from "./document";
import { type DocumentPath, renderEmlView } from "./render-eml";

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface ModelDiagnostic {
  severity: DiagnosticSeverity;
  /** `YAML`, `SCHEMA`, `VIEW`, or the checker's own code (`EML117`, …). */
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
  /** Run the language checker over the view (layer 3). Default true. */
  check?: boolean;
  /** Confirm the view reads back to the document (layer 4). Default true. */
  checkView?: boolean;
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
      typeof segment === "number" ? `${label}[${segment}]` : label ? `${label}.${segment}` : segment,
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
            `${at} pairs cardinalities Mermaid has no operator for. Valid pairs: ` +
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

/** Indexes of the items in two lists that differ, or `undefined` when equal. */
function differingItems(left: unknown[], right: unknown[]): number[] {
  const differing: number[] = [];
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index++) {
    if (JSON.stringify(left[index]) !== JSON.stringify(right[index])) differing.push(index);
  }
  return differing;
}

/**
 * A document in canonical form: what `recordsToDocument` writes for it.
 *
 * Canonical form states nothing twice — a title equal to the name, a `TD`
 * direction, a saga's default trigger and operation are all left out — so two
 * documents that mean the same thing are the same document.
 */
export function canonicalDocument(document: ModelDocument): ModelDocument {
  return recordsToDocument(documentToRecords(document)).document;
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
  const validate = schemaValidator();
  if (!validate(value)) {
    for (const error of significantErrors(validate.errors ?? [])) {
      const { path, message } = schemaMessage(error);
      diagnostics.push({ severity: "error", code: "SCHEMA", message, path, ...locate(path) });
    }
    return { diagnostics, ok: false };
  }

  const document = value as ModelDocument;

  if (options.check !== false || options.checkView !== false) {
    const view = renderEmlView(document);

    if (options.check !== false) {
      for (const issue of checkView(view.text)) {
        const path = issue.line ? (view.lineMap[issue.line - 1] ?? []) : [];
        if (issue.code === "EML005" && isSagaMetaLine(path)) continue;
        diagnostics.push({
          severity: issue.severity,
          code: issue.code,
          message: issue.message,
          path,
          ...locate(path),
          ...(issue.hint ? { hint: issue.hint } : {}),
        });
      }
    }

    if (options.checkView !== false) {
      const expected = drawableForm(canonicalDocument(document));
      const drawn = recordsToDocument(readEmlModel(view.text)).document;
      for (const key of DOCUMENT_KEY_ORDER) {
        const want = expected[key];
        const got = drawn[key];
        if (Array.isArray(want) || Array.isArray(got)) {
          const left = (want as unknown[] | undefined) ?? [];
          const right = (got as unknown[] | undefined) ?? [];
          for (const index of differingItems(left, right)) {
            const path: DocumentPath = index < left.length ? [key, index] : [key];
            diagnostics.push(viewDiagnostic(path, locate(path)));
          }
        } else if (JSON.stringify(want) !== JSON.stringify(got)) {
          const path: DocumentPath = want !== undefined ? [key] : [];
          diagnostics.push(viewDiagnostic(path, locate(path)));
        }
      }
    }
  }

  return {
    document,
    diagnostics,
    ok: !diagnostics.some((diagnostic) => diagnostic.severity === "error"),
  };
}

/**
 * A saga's `%%meta trigger:` / `%%meta operation:` line in the view. The saga
 * compiler reads those keys and the checker does not know them (EML005), so a
 * warning about one is about how EML spells a saga, not about the model.
 */
function isSagaMetaLine(path: DocumentPath): boolean {
  return path[0] === "sagas" && (path[2] === "trigger" || path[2] === "operation");
}

/**
 * Whether a query means the same with its line breaks turned into spaces.
 *
 * The view writes a report on one `%%report` line. Outside a quoted literal a
 * line break is whitespace like any other — unless it ends a `--` comment,
 * which would then swallow the rest of the query.
 */
export function sqlSurvivesFlattening(sql: string): boolean {
  let quote: string | null = null;
  for (let index = 0; index < sql.length; index++) {
    const character = sql[index]!;
    if (quote) {
      if (character === quote) quote = null;
      else if (character === "\n") return false;
      continue;
    }
    if (character === "'" || character === '"') quote = character;
    else if (character === "-" && sql[index + 1] === "-") return false;
  }
  return true;
}

/**
 * The document as the view can draw it: a multi-line query on one line, where
 * that changes nothing it means. Compared against what the view reads back, so
 * only a real difference is reported.
 */
function drawableForm(document: ModelDocument): ModelDocument {
  if (!document.reports?.length) return document;
  return {
    ...document,
    reports: document.reports.map((report) =>
      sqlSurvivesFlattening(report.sql)
        ? { ...report, sql: report.sql.replace(/\s*\n\s*/g, " ").trim() }
        : report
    ),
  };
}

function viewDiagnostic(
  path: DocumentPath,
  at: { line: number; column: number }
): ModelDiagnostic {
  return {
    severity: "warning",
    code: "VIEW",
    message:
      `${pathLabel(path)} cannot be drawn faithfully in the Mermaid view. ` +
      "The model is what the YAML says; the diagram shows it differently.",
    path,
    ...at,
    hint:
      "Usually a value containing text EML reserves: a `key:` inside a report or action value, " +
      "a bracket inside a node label, or a state no transition reaches.",
  };
}

/* ------------------------------------------------------------------------ */
/*  The checker                                                               */
/* ------------------------------------------------------------------------ */

let definitionInstalled = false;

/**
 * The language checker over a view.
 *
 * The definition is handed to the checker from the JSON bundled with this
 * module rather than read from beside `language/index.ts`, which does not
 * exist once the CLI is bundled into `dist/` — the same arrangement the
 * browser build of the checker uses.
 */
function checkView(text: string) {
  if (!definitionInstalled) {
    setLanguageDefinition(languageDefinition as unknown as LanguageDefinition);
    definitionInstalled = true;
  }
  return checkSource(text).issues;
}
