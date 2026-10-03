/**
 * The two things the local model is asked to do with a model.
 *
 * - `analyzeDomainWithLocalModel` turns a description of a business into a
 *   domain analysis: entities, their attributes, how they relate, as JSON.
 *   Writing that as a model document is deterministic and happens in code
 *   (`model/from-domain.ts`).
 * - `reviseModelWithLocalModel` changes an existing model as asked. The model
 *   is YAML, so the answer is the complete revised document; it is read with
 *   the generator's own reader and, while it has errors, handed back with the
 *   diagnostics — line and message — for another attempt.
 *
 * All configuration comes from `../config`: never a hard-coded model or URL.
 * The logger records the model and the operation, never a prompt or a
 * completion — a description someone typed is their business data.
 */

import { getLogger } from "@appwithai/core/logging";
import { type ModelDiagnostic, readModelYaml } from "@appwithai/generator/model-yaml";
import OpenAI from "openai";
import { AI_API_KEY, AI_BASE_URL, AI_MODEL } from "../config";
import { type DomainAnalysis, domainAnalysisSchema } from "../types";

function localClient(): OpenAI {
  return new OpenAI({ apiKey: AI_API_KEY, baseURL: AI_BASE_URL });
}

const DOMAIN_INSTRUCTIONS = `You are an expert data modeller. From a description of a business, extract the entities it keeps records of, their attributes, and how they relate.

Respond with JSON only, in exactly this shape:
{
  "entities": [
    {
      "name": "Order",
      "description": "One customer purchase",
      "suggestedAttributes": [
        { "name": "order_number", "type": "string", "required": true, "unique": true, "description": "Printed on the invoice" },
        { "name": "total", "type": "decimal", "required": true }
      ],
      "confidence": 0.9,
      "reasoning": "Orders are named explicitly"
    }
  ],
  "relationships": [
    { "name": "places", "source": "Customer", "target": "Order", "cardinality": "oneToMany", "confidence": 0.9, "reasoning": "A customer places orders" }
  ],
  "summary": "One sentence describing the domain"
}

Rules:
- Entity names are singular nouns in PascalCase (Customer, not Customers).
- Attribute names are snake_case. Do not list id or foreign-key columns: they are derived from the entities and relationships.
- Types are one of: string, text, integer, decimal, boolean, date, datetime, json, uuid, email, url, phone.
- cardinality is one of oneToOne, oneToMany, manyToOne, manyToMany, read from source to target.
- Confidence: 1.0 stated outright, 0.8–0.9 strongly implied, 0.5–0.7 likely, below that a guess.`;

export async function analyzeDomainWithLocalModel(description: string): Promise<DomainAnalysis> {
  getLogger("ai").event("ai.model.requested", { model: AI_MODEL, operation: "domain-analysis" });
  try {
    const response = await localClient().chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: DOMAIN_INSTRUCTIONS },
        { role: "user", content: description },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 6000,
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("The model returned an empty answer.");
    const parsed = domainAnalysisSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new Error(
        `The model's domain analysis is not in the expected shape (${issue?.path.join(".") || "root"}: ${issue?.message})`
      );
    }
    return parsed.data;
  } catch (error) {
    getLogger("ai").event("ai.model.failed", {
      model: AI_MODEL,
      operation: "domain-analysis",
      reason: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

const REVISION_INSTRUCTIONS = `You maintain an application's model, written in the AppWithAI model language: a YAML document.

Top-level keys, in this order: eml ("1.0"), name, version, description, enums, categories, entities, relationships, hooks, hookFlows, rbac, triggers, reports, rules, stateMachines, sagas.
An entity is { name (PascalCase), help?, icon?, parent?, attributes: [{ name (snake_case), type, pk?, fk?, unique?, optional?, enum?, help? }], indexes? }.
A relationship is { from, fromCardinality, to, toCardinality, label? } with cardinalities exactly-one | zero-or-one | zero-or-more | one-or-more.
A foreign key is an attribute named <entity>_id (snake_case of the entity it points at) with fk: true, on the side that holds many.

Change the model as asked and change nothing else. Keep the author's comments. Reply with the complete revised YAML document and nothing else — no explanation, no code fence.`;

export interface Revision {
  /** The last document the model returned. */
  model: string;
  /** Its diagnostics; empty of errors when the revision succeeded. */
  diagnostics: ModelDiagnostic[];
  /** Whether it reads with no errors. */
  ok: boolean;
  attempts: number;
}

/** Strip a code fence a model added despite being asked not to. */
function unfenced(text: string): string {
  const fenced = text.match(/^\s*```(?:ya?ml)?\s*\n([\s\S]*?)\n```\s*$/);
  return `${(fenced?.[1] ?? text).trimEnd()}\n`;
}

export async function reviseModelWithLocalModel(
  request: string,
  currentModel: string,
  maxAttempts: number
): Promise<Revision> {
  const client = localClient();
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: REVISION_INSTRUCTIONS },
    { role: "user", content: `The model:\n\n${currentModel}\n\nThe change: ${request}` },
  ];
  let last: Revision = { model: currentModel, diagnostics: [], ok: false, attempts: 0 };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    getLogger("ai").event("ai.model.requested", { model: AI_MODEL, operation: "model-revision" });
    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages,
      temperature: 0.1,
      max_tokens: 16000,
    });
    const content = response.choices[0]?.message?.content;
    if (!content?.trim()) throw new Error("The model returned an empty answer.");

    const model = unfenced(content);
    const read = readModelYaml(model);
    last = { model, diagnostics: read.diagnostics, ok: read.ok, attempts: attempt };
    if (read.ok) return last;

    const errors = read.diagnostics
      .filter((diagnostic) => diagnostic.severity === "error")
      .slice(0, 20)
      .map((d) => `line ${d.line}:${d.column} ${d.code} ${d.message}`);
    messages.push(
      { role: "assistant", content: model },
      {
        role: "user",
        content: `That document has errors:\n${errors.join("\n")}\n\nReply with the complete corrected document.`,
      }
    );
  }
  return last;
}
