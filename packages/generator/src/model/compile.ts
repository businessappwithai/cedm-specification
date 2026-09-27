/**
 * Compile a model's records into everything it contributes to generation.
 *
 * This is the single semantic layer of the model language: a model document
 * reaches it through `documentToRecords`, and the templates see the
 * `ParsedModel` it returns. There is one function that makes one.
 */

import type { Entity, EntityEnum, Relationship } from "@appwithai/core/types";
import { type CompiledHook, compileHookDeclarations } from "../hooks";
import { type EntityCategory, resolveCategoryDeclarations } from "./categories";
import { compileErdRecords } from "./compile-erd";
import { type CompiledRbac, compileRbacDeclarations } from "../rbac";
import { type CompiledReport, compileReportDeclarations } from "../reports";
import { type CompiledRule, compileRuleDeclarations } from "../rules";
import { compileSagaDeclarations, type SagaWorkflow } from "../workflows/sagas";
import { type CompiledWorkflow, compileStateMachineDeclarations } from "../workflows/state-machine";
import type { ModelRecords } from "./records";

/** Everything a model contributes to generation. */
export interface ParsedModel {
  entities: Entity[];
  relationships: Relationship[];
  /** Declared categories, with a "General" default for anything unassigned. */
  categories: EntityCategory[];
  /** Enums bound to a column, with their reference ids. */
  enums: EntityEnum[];
  /** Multi-step processes: the model's sagas. */
  sagas: SagaWorkflow[];
  /** Role restrictions: CRUD operations and transitions. */
  rbac: CompiledRbac;
  /** Decision graphs compiled from the model's rules. */
  rules: CompiledRule[];
  /** Lifecycle handlers the model names. */
  hooks: CompiledHook[];
  /** Analytical questions, with the SQL answering each. */
  reports: CompiledReport[];
  /** The model's state machines — which moves exist. */
  workflows: CompiledWorkflow[];
  /**
   * The model's own sentence about the *business* rather than about its own
   * shape, and the only place an author writes down what the application is
   * for. Deliberately not folded into `projectDescription`: that is a CLI flag
   * that names the generated *project*, reaches the backend templates, and is
   * what the parity gate compares. This one is the model's own words.
   */
  description?: string;
}

export interface CompileOptions {
  /** Where compile warnings go. */
  warn?: (message: string) => void;
}

export function compileModelRecords(
  records: ModelRecords,
  options: CompileOptions = {}
): ParsedModel {
  const warn = options.warn ?? (() => {});
  const { entities, relationships, enums } = compileErdRecords(records.erd);

  const entityNames = entities.map((entity) => entity.name);
  const categories = resolveCategoryDeclarations(records.categories, entityNames);
  const { workflows: sagas, diagnostics: sagaDiagnostics } = compileSagaDeclarations(records.sagas);
  for (const diagnostic of sagaDiagnostics) {
    const where = diagnostic.nodeId
      ? `${diagnostic.workflow}.${diagnostic.nodeId}`
      : diagnostic.workflow;
    warn(`saga ${where}: ${diagnostic.message}`);
  }

  /*
   * State machines are compiled before access control because an `rbac` rule
   * may name a *transition* rather than a CRUD operation, and only the machines
   * can say which edges that covers.
   */
  const workflows = compileStateMachineDeclarations(records.stateMachines, entityNames, warn);
  const rbac = compileRbacDeclarations(records.rbac, entityNames, workflows, warn);

  // A rule that will not compile is warned about and skipped rather than fatal:
  // one malformed rule should not stop an application from being generated.
  const rules = compileRuleDeclarations(records.rules, warn);
  const hooks = compileHookDeclarations(records.hooks, entityNames, warn);

  // Anything that is not a single read is refused here, before it can reach a
  // seed file.
  const reports = compileReportDeclarations(records.reports, entityNames, warn);

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
    description: records.description,
  };
}
