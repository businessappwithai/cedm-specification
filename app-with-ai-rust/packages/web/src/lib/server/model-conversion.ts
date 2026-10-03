/**
 * Natural language → the project's model, for the AI routes.
 *
 * `convertToModel` in `@appwithai/ai` writes a new model from a description
 * or revises the current one. When the caller names a section — the logic
 * step asks for `rules` — only that section of the revision is taken, and it
 * is spliced into the author's text: whatever else the language model changed
 * in its answer is discarded, and the author's comments elsewhere stay as they
 * were. The result is checked by the generator's reader either way.
 */

import type { ModelDiagnostic } from "@appwithai/generator/model-yaml";
import { EDITABLE_SECTIONS, type EditableSection, replaceSections } from "@/lib/model/sections";

export interface ModelConversionRequest {
  description: string;
  currentModel?: string;
  name?: string;
  section?: EditableSection;
}

export interface ModelConversionResult {
  model: string;
  diagnostics: ModelDiagnostic[];
  ok: boolean;
  dropped: string[];
  attempts: number;
}

export class ModelConversionError extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message);
    this.name = "ModelConversionError";
  }
}

export function readConversionRequest(body: unknown): ModelConversionRequest {
  const input = (body ?? {}) as Record<string, unknown>;
  if (typeof input.description !== "string" || !input.description.trim())
    throw new ModelConversionError("A description is required");
  const section = input.section;
  if (section !== undefined && !(EDITABLE_SECTIONS as readonly unknown[]).includes(section))
    throw new ModelConversionError(`"${String(section)}" is not a section that can be generated`);
  if (section && (typeof input.currentModel !== "string" || !input.currentModel.trim()))
    throw new ModelConversionError("A section is generated into an existing model; send currentModel");
  return {
    description: input.description,
    currentModel: typeof input.currentModel === "string" ? input.currentModel : undefined,
    name: typeof input.name === "string" ? input.name : undefined,
    section: section as EditableSection | undefined,
  };
}

export async function convertModel(request: ModelConversionRequest): Promise<ModelConversionResult> {
  const { convertToModel } = await import("@appwithai/ai");
  const { readModelYaml } = await import("@appwithai/generator/model-yaml");
  const maxAttempts = Number(process.env.ERD_DESIGN_AUTO_RETRY_COUNT ?? 3);

  const description = request.section
    ? `${request.description}\n\n(Change only the \`${request.section}\` section.)`
    : request.description;
  const result = await convertToModel({
    description,
    currentModel: request.currentModel,
    name: request.name,
    maxAttempts,
  });
  if (!request.section || !request.currentModel) return result;

  const revised = readModelYaml(result.model, { check: false }).document;
  if (!revised)
    return result;
  const model = replaceSections(request.currentModel, {
    [request.section]: revised[request.section] ?? [],
  });
  const read = readModelYaml(model);
  return { ...result, model, diagnostics: read.diagnostics, ok: read.ok };
}
