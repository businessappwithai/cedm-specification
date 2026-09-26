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
  eml: string
): Promise<ReindexResult> {
  if (!eml.trim()) return { indexed: false, error: "The model is empty" };

  try {
    const { parseModel } = await import("@appwithai/generator/pipeline");
    const { buildModelGraph, ingestGraph } = await import("@appwithai/generator/graph");
    const { getPool } = await import("@appwithai/core/config");

    // A dedicated connection: `LOAD 'age'` and the `ag_catalog` search path are
    // per-connection state, and a pooled client handed back may not carry them.
    const client = await getPool().connect();
    try {
      const counts = await ingestGraph(client, projectId, buildModelGraph(parseModel(eml)));
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
