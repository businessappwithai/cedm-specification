/**
 * Natural language → a model document.
 *
 * A description with no model yet becomes one through a domain analysis
 * written out deterministically. A description of a change to an existing
 * model is applied by the local model and checked by the generator's reader.
 * Either way the result is YAML with its diagnostics: what comes back is
 * checked, never assumed.
 */

import {
  type ModelDiagnostic,
  readModelYaml,
  serializeModelDocument,
} from "@appwithai/generator/model-yaml";
import { domainToModelDocument } from "../model/from-domain";
import type { DomainAnalysis } from "../types";
import { analyzeDomainWithLocalModel, reviseModelWithLocalModel } from "./local-model";

export { analyzeDomainWithLocalModel, reviseModelWithLocalModel };

export interface ConversionInput {
  /** What the business does, or what to change about the current model. */
  description: string;
  /** The model as it stands; empty or absent to start one. */
  currentModel?: string;
  /** A name for a new model. */
  name?: string;
  /** How many times a revision may be corrected before its errors are returned. */
  maxAttempts?: number;
}

export interface ConversionOutput {
  model: string;
  diagnostics: ModelDiagnostic[];
  ok: boolean;
  /** Present for a new model: the analysis it was written from. */
  domainAnalysis?: DomainAnalysis;
  /** Relationships the analysis named between entities it did not declare. */
  dropped: string[];
  attempts: number;
}

export async function convertToModel(input: ConversionInput): Promise<ConversionOutput> {
  if (input.currentModel?.trim()) {
    const revision = await reviseModelWithLocalModel(
      input.description,
      input.currentModel,
      Math.max(1, input.maxAttempts ?? 3)
    );
    return { ...revision, dropped: [] };
  }

  const domainAnalysis = await analyzeDomainWithLocalModel(input.description);
  if (!domainAnalysis.entities.length)
    throw new Error("The description yielded no entities; describe what the business keeps records of.");
  const { document, dropped } = domainToModelDocument(domainAnalysis, input.name);
  const model = serializeModelDocument(document);
  const read = readModelYaml(model);
  return {
    model,
    diagnostics: read.diagnostics,
    ok: read.ok,
    domainAnalysis,
    dropped,
    attempts: 1,
  };
}
