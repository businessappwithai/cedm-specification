/**
 * Keeping the assistant's view of a model up to date.
 *
 * The model is the source of truth and the AGE graph is a derived view of it,
 * so a save rebuilds the view rather than patching it. Every route that writes
 * a model calls `reindexProjectModel` — one place, so a new editor cannot ship
 * with the assistant quietly answering from the version before last.
 *
 * It never throws. A model someone has just written is worth keeping even when
 * the graph store is unreachable, and stale context is a worse answer rather
 * than a lost document. The failure is logged and reported in the return value
 * so a caller that wants to say something can.
 */

export interface ReindexResult {
  indexed: boolean;
  nodes?: number;
  edges?: number;
  /** Present only when indexing failed; the save itself still succeeded. */
  error?: string;
}

export async function reindexProjectModel(
  projectId: string,
  model: string
): Promise<ReindexResult> {
  if (!model.trim()) return { indexed: false, error: "The model is empty" };

  try {
    const { compileModelDocument, readModelYaml } = await import(
      "@appwithai/generator/model-yaml"
    );
    const { buildModelGraph, ingestGraph } = await import("@appwithai/generator/graph");
    const { getPool } = await import("@appwithai/core/config");

    // A draft may still carry the checker's findings; what the graph needs is
    // a document, which the schema is what guarantees.
    const read = readModelYaml(model, { check: false });
    if (!read.document) {
      const first = read.diagnostics[0];
      return {
        indexed: false,
        error: first
          ? `The model is not a valid model document (line ${first.line}: ${first.message})`
          : "The model is not a valid model document",
      };
    }
    const parsed = compileModelDocument(read.document);

    // A dedicated connection: `LOAD 'age'` and the `ag_catalog` search path are
    // per-connection state, and a pooled client handed back may not carry them.
    const client = await getPool().connect();
    try {
      const counts = await ingestGraph(client, projectId, buildModelGraph(parsed));
      return { indexed: true, ...counts };
    } finally {
      client.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn(`[model-context] ${projectId} saved but not re-indexed:`, error);
    return { indexed: false, error: message };
  }
}
