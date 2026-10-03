/**
 * Storing and querying a model graph in Apache AGE.
 *
 * AGE is a Postgres extension, so the model graph lives in the same database
 * as everything else the modelling tool stores — no second service, no
 * embedding endpoint, and a project's graph is dropped in the same transaction
 * as the project if it ever needs to be.
 *
 * ## Injection
 *
 * A Cypher query reaches AGE inside `cypher('<graph>', $$ ... $$, $1)`. Three
 * parts of that cannot be parameters — the graph name, the node labels, and
 * the edge types — so **none of them may come from user input**. Here they do
 * not: the graph name is the constant below, and labels and edge types come
 * from the `NodeLabel` / `EdgeType` unions in `model-graph.ts`, which are
 * literals in this repository's own source.
 *
 * Everything that *is* derived from a model or a request — project ids, node
 * keys, every property name and value — is bound as an `agtype` parameter.
 * That is what makes an entity called `') RETURN 1 --` a node name rather than
 * a query.
 *
 * ## Connections
 *
 * `LOAD 'age'` and the `ag_catalog` search path are per-connection state, so
 * they are re-issued on every checkout rather than once at pool creation: a
 * pooled client that was created before the extension existed, or handed back
 * after a `DISCARD ALL`, otherwise fails with "function cypher(...) does not
 * exist" — a confusing error a long way from its cause.
 */

import type { GraphEdge, GraphNode, ModelGraph, NodeLabel } from "./model-graph";

/**
 * The one graph. Every node carries a `project` property instead of each
 * project getting its own graph: an AGE graph is a schema, and one schema per
 * project grows without bound, while a bound `project` predicate scopes a
 * traversal just as exactly.
 */
export const MODEL_GRAPH = "model_context";

/** The minimum a caller has to give us: something that can run SQL. */
export interface SqlClient {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

/** Prepare a connection to speak Cypher. Cheap, and required per connection. */
export async function prepareConnection(client: SqlClient): Promise<void> {
  await client.query("LOAD 'age'");
  await client.query('SET search_path = ag_catalog, "$user", public');
}

/** Create the graph if it is not there yet. Safe to call on every ingest. */
export async function ensureGraph(client: SqlClient): Promise<void> {
  await prepareConnection(client);
  const existing = await client.query("SELECT 1 FROM ag_catalog.ag_graph WHERE name = $1", [
    MODEL_GRAPH,
  ]);
  if (existing.rows.length === 0) {
    await client.query("SELECT ag_catalog.create_graph($1)", [MODEL_GRAPH]);
  }
}

/**
 * Run one Cypher statement with bound parameters.
 *
 * `columns` names what the RETURN clause yields; AGE requires the column list
 * up front because a Cypher result is not a fixed relation. Passing the wrong
 * arity is the most common mistake here and it fails loudly, which is the
 * behaviour we want.
 */
export async function cypher(
  client: SqlClient,
  query: string,
  params: Record<string, unknown> = {},
  columns: string[] = ["result"]
): Promise<Record<string, unknown>[]> {
  const returned = columns.map((name) => `${name} agtype`).join(", ");
  const sql = `SELECT * FROM cypher('${MODEL_GRAPH}', $$ ${query} $$, $1) AS (${returned})`;
  const result = await client.query(sql, [JSON.stringify(params)]);
  return result.rows;
}

/** `agtype` comes back as a JSON string, or as a bare scalar. */
export function parseAgtype(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    // A vertex/edge is rendered as `{...}::vertex`; strip the type suffix.
    const stripped = value.replace(/::(vertex|edge|path)$/, "");
    try {
      return JSON.parse(stripped);
    } catch {
      return value;
    }
  }
}

/**
 * Replace a project's graph with this one.
 *
 * Delete-then-write rather than a merge: a model is re-ingested when it is
 * saved, and an entity the author *removed* has to disappear. Merging would
 * leave it behind, and an assistant confidently describing a deleted entity is
 * worse than one that knows nothing.
 */
export async function ingestGraph(
  client: SqlClient,
  projectId: string,
  graph: ModelGraph
): Promise<{ nodes: number; edges: number }> {
  await ensureGraph(client);
  await deleteProjectGraph(client, projectId);

  // One statement per label, because a label cannot be a parameter. Batched
  // through UNWIND so a 228-node model is ten round trips rather than 228.
  const byLabel = new Map<NodeLabel, GraphNode[]>();
  for (const node of graph.nodes) {
    const bucket = byLabel.get(node.label);
    if (bucket) bucket.push(node);
    else byLabel.set(node.label, [node]);
  }

  for (const [label, nodes] of byLabel) {
    await cypher(
      client,
      `UNWIND $rows AS row
       CREATE (n:${label} {key: row.key, project: row.project, props: row.props})
       RETURN count(n)`,
      {
        rows: nodes.map((node) => ({
          key: node.key,
          project: projectId,
          props: node.properties,
        })),
      },
      ["count"]
    );
  }

  // Same for edge types. The MATCH is on `key` *and* `project`, so two projects
  // holding an entity of the same name cannot be wired to each other.
  const byType = new Map<string, GraphEdge[]>();
  for (const edge of graph.edges) {
    const bucket = byType.get(edge.type);
    if (bucket) bucket.push(edge);
    else byType.set(edge.type, [edge]);
  }

  for (const [type, edges] of byType) {
    await cypher(
      client,
      `UNWIND $rows AS row
       MATCH (a {key: row.from, project: $project}), (b {key: row.to, project: $project})
       CREATE (a)-[e:${type} {props: row.props}]->(b)
       RETURN count(e)`,
      {
        project: projectId,
        rows: edges.map((edge) => ({
          from: edge.from,
          to: edge.to,
          props: edge.properties ?? {},
        })),
      },
      ["count"]
    );
  }

  return { nodes: graph.nodes.length, edges: graph.edges.length };
}

/** Remove everything this project put in the graph. */
export async function deleteProjectGraph(client: SqlClient, projectId: string): Promise<void> {
  await prepareConnection(client);
  await cypher(
    client,
    "MATCH (n {project: $project}) DETACH DELETE n RETURN count(n)",
    { project: projectId },
    ["count"]
  );
}
