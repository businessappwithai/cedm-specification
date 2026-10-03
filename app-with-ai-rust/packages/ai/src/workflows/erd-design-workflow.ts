import type { StepParams } from "@mastra/core/workflows";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { analyzeDomain } from "../agents/domain-agent";
import { domainToModelDocument } from "../model/from-domain";
import { serializeModelDocument } from "@appwithai/generator/model-yaml";
import type {
  DomainAnalysis,
  EntityCandidate,
  RelationshipCandidate,
  WorkflowState,
} from "../types";

// Define schemas
const descriptionInputSchema = z.object({
  description: z.string(),
});

const domainAnalysisOutputSchema = z.object({
  domainAnalysis: z.unknown(),
  currentStep: z.string(),
  approvedEntities: z.array(z.unknown()).optional(),
  approvedRelationships: z.array(z.unknown()).optional(),
});

const entitiesInputSchema = z.object({
  approvedEntities: z.array(z.unknown()),
  approvedRelationships: z.array(z.unknown()),
});

const modelOutputSchema = z.object({
  /** The approved entities and relationships, as a model document's YAML. */
  modelYaml: z.string(),
  entityCount: z.number(),
  relationshipCount: z.number(),
  /** Relationships naming an entity that was not approved. */
  dropped: z.array(z.string()),
});

// Type definitions for step input data
type DescriptionInput = z.infer<typeof descriptionInputSchema>;
type EntitiesInput = z.infer<typeof entitiesInputSchema>;

// Step 1: Analyze domain description
export const analyzeDomainStep = createStep({
  id: "analyze-domain",
  inputSchema: descriptionInputSchema,
  outputSchema: domainAnalysisOutputSchema,
  execute: async ({ inputData }: { inputData: DescriptionInput }) => {
    const analysis = await analyzeDomain(inputData.description);
    return {
      domainAnalysis: analysis,
      currentStep: "entity-approval",
      approvedEntities: analysis?.entities || [],
      approvedRelationships: analysis?.relationships || [],
    };
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as unknown as StepParams<
  "analyze-domain",
  z.ZodObject<any>,
  typeof descriptionInputSchema,
  typeof domainAnalysisOutputSchema,
  z.ZodAny,
  z.ZodAny
>);

// Step 2: Write the approved entities and relationships as the model document
export const generateModelStep = createStep({
  id: "generate-model",
  inputSchema: entitiesInputSchema,
  outputSchema: modelOutputSchema,
  execute: async ({ inputData }: { inputData: EntitiesInput }) => {
    const { document, dropped } = domainToModelDocument({
      entities: inputData.approvedEntities as EntityCandidate[],
      relationships: inputData.approvedRelationships as RelationshipCandidate[],
      summary: "",
    });
    return {
      modelYaml: serializeModelDocument(document),
      entityCount: document.entities.length,
      relationshipCount: document.relationships?.length ?? 0,
      dropped,
    };
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as unknown as StepParams<
  "generate-model",
  z.ZodObject<any>,
  typeof entitiesInputSchema,
  typeof modelOutputSchema,
  z.ZodAny,
  z.ZodAny
>);

// Create the ERD design workflow with Human-in-the-loop support
export const erdDesignWorkflow = createWorkflow({
  id: "erd-design-workflow",
  inputSchema: descriptionInputSchema,
  outputSchema: domainAnalysisOutputSchema,
})
  .then(analyzeDomainStep)
  .commit();

// Export types for external use
export type { DomainAnalysis, EntityCandidate, RelationshipCandidate, WorkflowState };
