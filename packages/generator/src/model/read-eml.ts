/**
 * Read an EML document into model records.
 *
 * The composition of every EML reader, and therefore the whole of what EML
 * means to the generator: `compileModelRecords(readEmlModel(text))` is exactly
 * what generating from that text produces. The YAML model language is read into
 * the same records, which is what makes a model written in either syntax
 * compile to the same application.
 */

import { extractRuleSections, extractWorkflowSections } from "../eml";
import { readHookDirectives } from "../hooks";
import { readCategoryDirectives } from "../parsers/category.parser";
import { MermaidParser } from "../parsers/mermaid.parser";
import { readRbacDirectives } from "../rbac";
import { readReportDirectives } from "../reports";
import { readRuleSection } from "../rules";
import { parseSagas } from "../workflows/sagas";
import { readStateMachines } from "../workflows/state-machine";
import type { HookDiagramDeclaration, ModelRecords, SagaDeclaration } from "./records";

const SECTION_LEAD = /^%%(?:rule|workflow)\s/;

/**
 * `%%meta <key>:` in the document's own header.
 *
 * A section is introduced by its own run of `%%meta` lines ending in its
 * `%%rule` / `%%workflow` directive, so a `%%meta` line belongs to the document
 * only if the run it sits in does *not* lead into a section directive — and
 * nothing after the first section directive is the document's.
 */
function headerMeta(source: string, key: string): string | undefined {
  const pattern = new RegExp(`^%%meta\\s+${key}\\s*:\\s*(.+)$`);
  const lines = source.split("\n").map((raw) => raw.trim());

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!;
    if (SECTION_LEAD.test(line)) return undefined;
    const value = line.match(pattern)?.[1]?.trim();
    if (!value) continue;

    let next = index + 1;
    while (next < lines.length && lines[next]!.startsWith("%%meta ")) next++;
    if (!SECTION_LEAD.test(lines[next] ?? "")) return value;
  }
  return undefined;
}

/**
 * `%%meta description:` — the document's own.
 *
 * Taken from the first match anywhere in the document, which is how the
 * generator has always read it: a document that declares none of its own takes
 * the first description a section carries.
 */
export function modelDescription(source: string): string | undefined {
  for (const rawLine of source.split("\n")) {
    const match = rawLine.trim().match(/^%%meta\s+description\s*:\s*(.+)$/);
    const text = match?.[1]?.trim();
    if (text) return text;
  }
  return undefined;
}

/**
 * Lines a directive reader consumed, so the ones that remain can be reported.
 * Every compiled directive is here; `%%trigger` and `%%guard` are reserved by
 * the language but compiled by nothing yet, so they are deliberately absent.
 */
const COMPILED_DIRECTIVE =
  /^%%+(?:meta|hook|rbac|report|category|enum|index|entity|field|rule|workflow|step|action|decision-table)\b/;

/** A line of an EML document the records do not carry, and why. */
export interface UncarriedLine {
  line: number;
  text: string;
  reason: "uncompiled-directive" | "comment";
}

/**
 * `%%` lines the records do not carry: reserved directives nothing compiles
 * (`%%trigger`, `%%guard`) and plain comments. Banner rules are decoration and
 * a `\`-continued `%%category` line is part of its directive, so neither is
 * reported.
 */
export function uncarriedDirectiveLines(source: string): UncarriedLine[] {
  const found: UncarriedLine[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let continuing = false;

  lines.forEach((raw, index) => {
    const line = raw.trim();
    const continued = continuing;
    continuing = line.endsWith("\\") && (continued || /^%%\s*category\b/i.test(line));
    if (continued || !line.startsWith("%%")) return;
    if (COMPILED_DIRECTIVE.test(line)) return;
    if (/^%%\s*=+\s*$/.test(line) || /^%%\s*-*\s*$/.test(line)) return;

    const reserved = /^%%(?:trigger|guard)\b/.test(line);
    found.push({
      line: index + 1,
      text: line,
      reason: reserved ? "uncompiled-directive" : "comment",
    });
  });

  return found;
}

/** Lines a hook diagram carries that are really model directives read elsewhere. */
const GLOBAL_DIRECTIVE_LINE =
  /^\s*%%+(?:hook|rbac|report|category|enum|index|entity|field|step|trigger|guard)\b/;

function readHookDiagrams(source: string, sagaNames: Set<string>): HookDiagramDeclaration[] {
  return extractWorkflowSections(source)
    .filter((section) => section.kind === "hook" && !sagaNames.has(section.name))
    .map((section) => {
      const diagram = section.diagram
        .split("\n")
        .filter((line) => !GLOBAL_DIRECTIVE_LINE.test(line))
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      return {
        name: section.name,
        ...(section.title ? { title: section.title } : {}),
        entity: section.entity,
        diagram,
      };
    });
}

function readSagaDeclarations(source: string): SagaDeclaration[] {
  const titles = new Map(
    extractWorkflowSections(source)
      .filter((section) => section.title)
      .map((section) => [section.name, section.title as string])
  );

  return parseSagas(source).workflows.map((saga) => {
    const title = titles.get(saga.name);
    return {
      name: saga.name,
      ...(title ? { title } : {}),
      entity: saga.entity,
      operation: saga.operation,
      trigger: saga.trigger,
      ...(saga.description !== undefined ? { description: saga.description } : {}),
      steps: saga.steps.map((step) => ({
        id: step.nodeId,
        type: step.nodeType,
        label: step.label,
        properties: { ...step.properties },
      })),
    };
  });
}

/** Read everything an EML document declares. Nothing is compiled. */
export function readEmlModel(
  source: string,
  warn: (message: string) => void = () => {}
): ModelRecords {
  const name = headerMeta(source, "name");
  const version = headerMeta(source, "version");
  const description = modelDescription(source);
  const sagas = readSagaDeclarations(source);

  return {
    ...(name ? { name } : {}),
    ...(version ? { version } : {}),
    ...(description ? { description } : {}),
    erd: new MermaidParser().read(source),
    categories: readCategoryDirectives(source),
    rbac: readRbacDirectives(source, warn),
    hooks: readHookDirectives(source, warn),
    reports: readReportDirectives(source, warn),
    rules: extractRuleSections(source).map(readRuleSection),
    stateMachines: readStateMachines(source),
    sagas,
    hookDiagrams: readHookDiagrams(source, new Set(sagas.map((saga) => saga.name))),
  };
}
