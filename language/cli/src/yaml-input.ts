/**
 * Reading a YAML model (`*.eml.yaml`) — the source of truth — for the `eml` CLI.
 *
 * The CLI's commands work on the EML document model its parser builds. A YAML
 * model is read by the language's own reader (`packages/generator/src/model-yaml`)
 * and validated by it with all four layers `appwithai validate` applies: YAML
 * syntax, the JSON Schema, the full language checker, and view fidelity. Only a
 * model that passes is handed on, as its rendered Mermaid view, which is what
 * the parser reads. So a YAML model and the EML it was converted from produce
 * the same application here, as they do in both generators.
 *
 * The reader is imported on demand. It needs `yaml` and `ajv`, and the CLI
 * stays dependency-free for anyone who only ever gives it EML.
 */

import type { Diagnostic } from "./model.ts";

/** `*.eml.yaml` / `*.yaml` / `*.yml` is the YAML model language; anything else is EML. */
export function isYamlModelPath(file: string): boolean {
  return /\.ya?ml$/i.test(file);
}

export interface YamlModelInput {
  /** The model's Mermaid view — what the CLI's parser reads. Empty when not `ok`. */
  view: string;
  /** Every finding, located at the YAML line and column it concerns. */
  diagnostics: Diagnostic[];
  ok: boolean;
}

const READER_MODULE = "../../../packages/generator/src/model-yaml/index.ts";

interface ModelYamlReader {
  readModelYaml(text: string): {
    ok: boolean;
    document?: unknown;
    diagnostics: Array<{
      severity: "error" | "warning" | "info";
      code: string;
      message: string;
      line: number;
      column: number;
      hint?: string;
    }>;
  };
  renderEmlView(document: never): { text: string };
}

export async function readYamlModel(source: string): Promise<YamlModelInput> {
  let reader: ModelYamlReader;
  try {
    reader = (await import(READER_MODULE)) as ModelYamlReader;
  } catch (error) {
    throw new Error(
      "Reading a YAML model needs the repository's model-yaml reader and its dependencies " +
        `(run \`bun install\` at the repository root): ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const result = reader.readModelYaml(source);
  const diagnostics: Diagnostic[] = result.diagnostics.map((d) => ({
    severity: d.severity,
    code: d.code,
    message: `${d.column > 1 ? `col ${d.column}: ` : ""}${d.message}`,
    line: d.line,
    ...(d.hint ? { fix: d.hint } : {}),
  }));

  if (!result.ok || !result.document) return { view: "", diagnostics, ok: false };
  return {
    view: reader.renderEmlView(result.document as never).text,
    diagnostics,
    ok: true,
  };
}
