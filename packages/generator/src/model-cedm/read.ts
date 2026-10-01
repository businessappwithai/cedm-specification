/**
 * Reading a CEDM application model: text → validated, resolved, lowered.
 *
 * Five layers, each reported at the line and column of the CEDM text:
 *
 * 1. **YAML** — the text parses, with no duplicate keys.
 * 2. **Schema** — `language/cedm/cedm-model.schema.json`.
 * 3. **Imports** — every library entity and module it names exists.
 * 4. **Lowering** — what the CEDM model says that the application cannot
 *    generate (a deny permission, an unknown cardinality) or adds to it (a key
 *    column created for a relationship).
 * 5. **Model** — the lowered document is held to the model language's own
 *    schema and checker, the same rules a model written without CEDM meets;
 *    each finding is traced back through the lowering to the CEDM line it
 *    came from.
 */

import Ajv2020 from "ajv/dist/2020";
import { isNode, LineCounter, parseDocument } from "yaml";
import cedmSchema from "../../../../language/cedm/cedm-model.schema.json";
import {
  type CedmLibrary,
  type CedmModelDocument,
  type LoweringNote,
  lowerCedmModel,
  resolveCedmImports,
  type SourceMapping,
} from "../../../../language/cedm";
import emlSchema from "../../../../language/yaml/eml.schema.json";
import type { DocumentPath, ModelDocument } from "../model-yaml/document";
import {
  type ModelDiagnostic,
  pointerToPath,
  schemaMessage,
  significantErrors,
  validateModelValue,
} from "../model-yaml/validate";

let compiled: ReturnType<Ajv2020["compile"]> | undefined;

function cedmValidator() {
  if (!compiled) {
    const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
    ajv.addSchema(emlSchema);
    compiled = ajv.compile(cedmSchema);
  }
  return compiled;
}

/** Whether model text is a CEDM application model rather than a model document. */
export function isCedmModelText(text: string): boolean {
  return /^cedm\s*:/m.test(text);
}

/** Whether a path names a CEDM application model by its suffix. */
export function isCedmModelPath(filePath: string): boolean {
  return /\.cedm\.ya?ml$/i.test(filePath);
}

export interface ReadCedmModelOptions {
  library?: CedmLibrary;
  /** Run the model language's checker over the lowered document. Default true. */
  check?: boolean;
}

export interface ReadCedmModelResult {
  /** The CEDM model as written, once it satisfies the schema. */
  cedm?: CedmModelDocument;
  /** The model with its imports folded in. */
  resolved?: CedmModelDocument;
  /** What the generators compile: present whenever lowering ran. */
  document?: ModelDocument;
  /** Library entities the model uses. */
  libraryEntities: string[];
  diagnostics: ModelDiagnostic[];
  ok: boolean;
}

/** Validate a CEDM value against the schema, returning the findings with document paths. */
export function validateCedmValue(
  value: unknown
): Array<{ path: DocumentPath; message: string }> | undefined {
  const validate = cedmValidator();
  if (validate(value)) return undefined;
  return significantErrors(validate.errors ?? []).map((error) => {
    const { path, message } = schemaMessage(error);
    return { path: path.length ? path : pointerToPath(error.instancePath), message };
  });
}

/** Map a path in the lowered document back to the CEDM path it came from. */
function sourceOf(sources: SourceMapping[], path: DocumentPath): DocumentPath {
  let best: SourceMapping | undefined;
  for (const mapping of sources) {
    if (mapping.lowered.length > path.length) continue;
    if (!mapping.lowered.every((segment, index) => segment === path[index])) continue;
    if (!best || mapping.lowered.length > best.lowered.length) best = mapping;
  }
  if (!best) return [];
  const rest = path.slice(best.lowered.length);
  // Attribute keys are spelled the same in both languages; anything else stops
  // at the value the mapping names.
  return rest.length === 1 && typeof rest[0] === "string" ? [...best.source, ...rest] : best.source;
}

/** Map a path in the resolved model back to the model as written. */
function writtenPath(
  resolved: ReturnType<typeof resolveCedmImports>,
  path: DocumentPath
): DocumentPath {
  const [head, index, ...rest] = path;
  if (head === "entities" && typeof index === "number") {
    const entity = resolved.entityPaths[index];
    if (!entity) return [];
    return entity[0] === "entities" ? [...entity, ...rest] : entity;
  }
  const listKey =
    head === "ui" ? "categories" : head === "authorization" ? "permissions" : (head as string);
  const [listIndex, ...listRest] =
    head === "ui" || head === "authorization" ? rest : [index, ...rest];
  const offset = resolved.listOffsets[listKey];
  if (typeof listIndex === "number" && offset !== undefined) {
    if (listIndex < offset) return ["imports"];
    const prefix = head === "ui" || head === "authorization" ? [head, index] : [head];
    return [...prefix, listIndex - offset, ...listRest] as DocumentPath;
  }
  return path;
}

export function readCedmModel(
  text: string,
  options: ReadCedmModelOptions = {}
): ReadCedmModelResult {
  const diagnostics: ModelDiagnostic[] = [];
  const lineCounter = new LineCounter();
  const parsed = parseDocument(text, { lineCounter, uniqueKeys: true, prettyErrors: false });
  const position = (offset: number | undefined) => {
    const { line, col } = lineCounter.linePos(offset ?? 0);
    return { line, column: col };
  };
  const locate = (path: DocumentPath) => {
    for (let depth = path.length; depth >= 0; depth--) {
      const prefix = path.slice(0, depth);
      const node = prefix.length ? parsed.getIn(prefix, true) : parsed.contents;
      if (isNode(node) && node.range) return position(node.range[0]);
    }
    return { line: 1, column: 1 };
  };
  const fail = (): ReadCedmModelResult => ({ diagnostics, ok: false, libraryEntities: [] });

  for (const error of parsed.errors) {
    diagnostics.push({
      severity: "error",
      code: "YAML",
      message: error.message.split("\n")[0] ?? error.message,
      path: [],
      ...position(error.pos[0]),
    });
  }
  if (parsed.errors.length) return fail();

  const value: unknown = parsed.toJS({ maxAliasCount: 100 });
  const schemaErrors = validateCedmValue(value);
  if (schemaErrors) {
    for (const { path, message } of schemaErrors) {
      diagnostics.push({ severity: "error", code: "SCHEMA", message, path, ...locate(path) });
    }
    return fail();
  }
  const cedm = value as CedmModelDocument;

  const library: CedmLibrary = options.library ?? { entity: () => undefined };
  const resolved = resolveCedmImports(cedm, library);
  const lowered = lowerCedmModel(resolved.document);
  const report = (note: LoweringNote, path: DocumentPath) =>
    diagnostics.push({
      severity: note.severity,
      code: note.code,
      message: note.message,
      path,
      ...locate(path),
    });
  for (const note of resolved.notes) report(note, note.path);
  for (const note of lowered.notes) report(note, writtenPath(resolved, note.path));

  const validated = validateModelValue(lowered.document, { check: options.check });
  for (const issue of validated.issues) {
    const path = writtenPath(resolved, sourceOf(lowered.sources, issue.path));
    diagnostics.push({
      ...issue,
      message: issue.code === "SCHEMA" ? `(lowered) ${issue.message}` : issue.message,
      path,
      ...locate(path),
    });
  }

  return {
    cedm,
    resolved: resolved.document,
    document: lowered.document,
    libraryEntities: resolved.libraryEntities,
    diagnostics,
    ok: !diagnostics.some((diagnostic) => diagnostic.severity === "error"),
  };
}
