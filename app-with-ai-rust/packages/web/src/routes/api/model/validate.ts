/**
 * What a model document contains, and whether it can be used.
 *
 * Called before a model is accepted into a project. Someone importing a file
 * wants to know what they are about to get — how many entities, which rules,
 * which workflows — and, more importantly, to be told *now*, at the line at
 * fault, if the document is not a usable model, rather than discovering it on
 * the design page.
 *
 * This is the generator's own reader — YAML, schema, checker — so what it
 * reports is exactly what generation would.
 */

import { createFileRoute } from "@tanstack/react-router";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export interface ModelSummary {
  /** Whether the document reads as a model with no errors. */
  ok: boolean;
  entities: string[];
  relationships: number;
  rules: { name: string; entity: string }[];
  workflows: { name: string; entity: string; kind: "state machine" | "saga" }[];
  /** Every finding, at its line. */
  diagnostics: Array<{
    severity: "error" | "warning" | "info";
    line: number;
    column: number;
    code: string;
    message: string;
  }>;
}

export const Route = createFileRoute("/api/model/validate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { model?: unknown };
        const text = typeof body.model === "string" ? body.model : "";
        if (!text.trim()) {
          return json({
            ok: false,
            entities: [],
            relationships: 0,
            rules: [],
            workflows: [],
            diagnostics: [
              { severity: "error", line: 1, column: 1, code: "EMPTY", message: "The file is empty." },
            ],
          } satisfies ModelSummary);
        }

        const { readModelYaml } = await import("@appwithai/generator/model-yaml");
        const read = readModelYaml(text);
        const document = read.document;
        return json({
          ok: read.ok,
          entities: document?.entities.map((entity) => entity.name) ?? [],
          relationships: document?.relationships?.length ?? 0,
          rules: (document?.rules ?? []).map((rule) => ({ name: rule.name, entity: rule.entity })),
          workflows: [
            ...(document?.stateMachines ?? []).map((machine) => ({
              name: machine.name,
              entity: machine.entity,
              kind: "state machine" as const,
            })),
            ...(document?.sagas ?? []).map((saga) => ({
              name: saga.name,
              entity: saga.entity,
              kind: "saga" as const,
            })),
          ],
          diagnostics: read.diagnostics.map(({ severity, line, column, code, message }) => ({
            severity,
            line,
            column,
            code,
            message,
          })),
        } satisfies ModelSummary);
      },
    },
  },
});
