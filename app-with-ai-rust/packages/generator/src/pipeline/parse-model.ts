/**
 * Reading a model — the half of the pipeline that touches no filesystem.
 *
 * Kept separate from `generate-application.ts` so a caller that has the model
 * source in hand, rather than a path, can read it without pulling `node:fs`
 * into its bundle. A namespace import of `node:fs` at module scope fails a
 * browser build whether or not the functions using it are ever reached.
 *
 * Everything here is pure, so the CLI and the web app get the same reading of a
 * model from the same code. That is the point: they used to read it separately.
 */

import type { Entity, EntityEnum, Relationship } from "@appwithai/core/types";
import { extractRuleSections } from "../eml";
import type { StackOption } from "../generators/full-stack.generator";
import { type CompiledHook, compileHooks } from "../hooks";
import { type EntityCategory, resolveCategories } from "../parsers/category.parser";
import { MermaidParser } from "../parsers/mermaid.parser";
import { type CompiledRbac, compileRbac } from "../rbac";
import { type CompiledReport, compileReports } from "../reports";
import { type CompiledRule, compileRules } from "../rules";
import { parseSagas, type SagaWorkflow } from "../workflows/saga";
import { type CompiledWorkflow, compileWorkflows } from "../workflows/state-machine";

/** Everything a model contributes to generation. */
export interface ParsedModel {
  entities: Entity[];
  relationships: Relationship[];
  /** `%%category` directives, with a "General" default for anything unassigned. */
  categories: EntityCategory[];
  /** `%%enum` declarations bound to a column by `%%field`, with their ids. */
  enums: EntityEnum[];
  /** Multi-step processes declared by `%%workflow ... kind: saga`. */
  sagas: SagaWorkflow[];
  /** Role restrictions declared by `%%rbac`: CRUD operations and transitions. */
  rbac: CompiledRbac;
  /** Decision graphs compiled from the model's `%%rule` flowcharts. */
  rules: CompiledRule[];
  /** Lifecycle handlers named by the model's `%%hook` directives. */
  hooks: CompiledHook[];
  /** Analytical questions declared by `%%report`, with the SQL answering each. */
  reports: CompiledReport[];
  /** Status machines from `%%workflow ... kind: state` — which moves exist. */
  workflows: CompiledWorkflow[];
  /**
   * `%%meta description:` at the head of the document.
   *
   * The one sentence a model carries about the *business* rather than about
   * its own shape, and the only place an author writes down what the
   * application is for. It was parsed by the checker and dropped here, so the
   * generated manual opened on a count of record types while the model that
   * produced it said what the thing was.
   *
   * Deliberately not folded into `projectDescription`: that is a CLI flag that
   * names the generated *project*, reaches the backend templates, and is what
   * the parity gate compares. This one is the model's own words.
   */
  description?: string;
}

/**
 * `%%meta description:` — the document's own, not a saga's.
 *
 * Anchored and taken from the first match, because `%%meta` opens a saga and a
 * rules section too, and those carry their own keys. A description declared
 * below the ERD is a description of that section, not of the application.
 */
function modelDescription(source: string): string | undefined {
  for (const rawLine of source.split("\n")) {
    const match = rawLine.trim().match(/^%%meta\s+description\s*:\s*(.+)$/);
    const text = match?.[1]?.trim();
    if (text) return text;
  }
  return undefined;
}

export interface GenerationSettings {
  projectName: string;
  outputDir: string;
  projectVersion?: string;
  projectDescription?: string;
  stackOption?: StackOption;
  /** Which Postgres the generated backend targets. */
  database?: "postgres" | "neon";
  /** Backend port. The frontend defaults to this + 1. */
  port?: number;
  frontendPort?: number;
  apiBaseUrl?: string;
  enableDarkMode?: boolean;
  astryxTheme?: string;
  skipFrontend?: boolean;
  skipBackend?: boolean;
  skipTests?: boolean;
  skipCliScaffold?: boolean;
  recordsPerEntity?: number;
}

/** Defaults, in one place, so every entry point starts from the same baseline. */
export const GENERATION_DEFAULTS = {
  projectVersion: "1.0.0",
  projectDescription: "Generated application",
  stackOption: "tanstack-astryx-loco" as StackOption,
  database: "postgres" as const,
  port: 3000,
  enableDarkMode: false,
  astryxTheme: "neutral",
  recordsPerEntity: 1000,
  skipCliScaffold: false,
} as const;

/**
 * Read model source into entities, relationships, categories, enums and sagas.
 *
 * Accepts several sources so the CLI's multi-file mode (`--sys-file`,
 * `--bus-file`, `--ref-file`) and the web app's single document take the same
 * path. Categories and sagas are read from the raw text of all of them: they
 * ride on `%%` lines, which the ERD block does not contain.
 */
export function parseModel(sources: string | string[]): ParsedModel {
  const list = (Array.isArray(sources) ? sources : [sources]).filter(Boolean);
  const parser = new MermaidParser();

  const entities: Entity[] = [];
  const relationships: Relationship[] = [];
  const enums: EntityEnum[] = [];

  for (const source of list) {
    const parsed = parser.parse(source);
    entities.push(...parsed.entities);
    relationships.push(...parsed.relationships);
    enums.push(...parsed.enums);
  }

  const joined = list.join("\n");
  const entityNames = entities.map((entity) => entity.name);
  const warn = (message: string) => console.warn(`  \u26a0\ufe0f  ${message}`);

  const categories = resolveCategories(joined, entityNames);

  /*
   * Sagas are read here so the manifest can record what the model declared.
   * `LocoBackendGenerator` still parses them from `modelSource` for the seed it
   * writes — the same function over the same text, so the two cannot disagree,
   * but it is a second parse and belongs in one place once saga compilation is
   * next touched.
   */
  const { workflows: sagas } = parseSagas(joined);

  /*
   * `%%workflow ... kind: state` draws which moves a record may make. Compiled
   * before `%%rbac` because a directive may name a *transition* rather than a
   * CRUD operation — `%%rbac role:manager on Deal.close_won` — and only the
   * machines can say which edges that covers.
   */
  const workflows = compileWorkflows(joined, entityNames, warn);

  /*
   * `%%rbac` restricts CRUD operations and state transitions to named roles. A
   * target with no directive stays open, so a model that says nothing about
   * permissions generates exactly what it did before.
   */
  const rbac = compileRbac(joined, entityNames, workflows, warn);

  // `%%rule` sections are decision flowcharts, and compiling them here is what
  // carries a rule drawn in the design phase through to the application that
  // runs it. The checker has already reported any syntax problem, so a section
  // that will not compile is warned about and skipped rather than fatal: one
  // malformed rule should not stop an application from being generated.
  const rules = compileRules(extractRuleSections(joined), warn);

  // `%%hook` names the handlers the generated service runs around each CRUD
  // operation.
  const hooks = compileHooks(joined, entityNames, warn);

  // `%%report` names an analytical question and carries the SQL that answers
  // it. Compiled here so a malformed directive is reported once, at the point
  // the model is read, and so anything that is not a single read is refused
  // before it can reach a seed file.
  const reports = compileReports(joined, entityNames, warn);

  return {
    entities,
    relationships,
    categories,
    enums,
    sagas,
    rbac,
    rules,
    hooks,
    reports,
    workflows,
    description: modelDescription(joined),
  };
}
