/**
 * The questions an assistant asks about a model, as traversals.
 *
 * Each one is a Cypher query with an exact answer, which is the reason this
 * layer is a graph and not an embedding index. "What references Compound?" has
 * a right answer; a nearest-neighbour search over prose about the model
 * returns whatever chunks mentioned it, and is confidently wrong when the
 * model changed and the text did not.
 *
 * Every function here binds its arguments — see the injection note in
 * `age-store.ts` for why that matters and where the boundary is.
 */

import { cypher, parseAgtype, prepareConnection, type SqlClient } from "./age-store";

export interface EntitySummary {
  name: string;
  tableName?: string;
  description?: string;
}

/** Rows out of a single-column agtype result. */
function values(rows: Record<string, unknown>[], column: string): unknown[] {
  return rows.map((row) => parseAgtype(row[column]));
}

/** Every entity in the project, alphabetical. */
export async function listEntities(
  client: SqlClient,
  projectId: string
): Promise<EntitySummary[]> {
  await prepareConnection(client);
  const rows = await cypher(
    client,
    `MATCH (e:Entity {project: $project})
     RETURN e.props.name, e.props.tableName, e.props.description
     ORDER BY e.props.name`,
    { project: projectId },
    ["name", "table_name", "description"]
  );
  return rows.map((row) => ({
    name: String(parseAgtype(row.name) ?? ""),
    tableName: row.table_name ? String(parseAgtype(row.table_name)) : undefined,
    description: row.description ? String(parseAgtype(row.description)) : undefined,
  }));
}

/** The columns of one entity, with the detail that makes an answer usable. */
export async function describeEntity(
  client: SqlClient,
  projectId: string,
  entity: string
): Promise<Record<string, unknown>[]> {
  await prepareConnection(client);
  const rows = await cypher(
    client,
    `MATCH (e:Entity {project: $project})-[:HAS_ATTRIBUTE]->(a:Attribute)
     WHERE e.props.name = $entity
     RETURN a.props`,
    { project: projectId, entity },
    ["props"]
  );
  return values(rows, "props") as Record<string, unknown>[];
}

/**
 * What points *at* this entity.
 *
 * The question behind "can I safely delete this?" — and the one an embedding
 * index answers worst, because the answer is in the edges rather than in any
 * sentence about the entity.
 */
export async function referencesTo(
  client: SqlClient,
  projectId: string,
  entity: string
): Promise<Array<{ from: string; cardinality?: string }>> {
  await prepareConnection(client);
  const rows = await cypher(
    client,
    `MATCH (a:Entity {project: $project})-[r:REFERENCES]->(b:Entity {project: $project})
     WHERE b.props.name = $entity
     RETURN a.props.name, r.props.cardinality
     ORDER BY a.props.name`,
    { project: projectId, entity },
    ["from_name", "cardinality"]
  );
  return rows.map((row) => ({
    from: String(parseAgtype(row.from_name) ?? ""),
    cardinality: row.cardinality ? String(parseAgtype(row.cardinality)) : undefined,
  }));
}

/** What this entity owns — the ERD's `||--o{` statement, in its own direction. */
export async function hasMany(
  client: SqlClient,
  projectId: string,
  entity: string
): Promise<string[]> {
  await prepareConnection(client);
  const rows = await cypher(
    client,
    `MATCH (a:Entity {project: $project})-[:HAS_MANY]->(b:Entity {project: $project})
     WHERE a.props.name = $entity
     RETURN b.props.name ORDER BY b.props.name`,
    { project: projectId, entity },
    ["name"]
  );
  return rows.map((row) => String(parseAgtype(row.name) ?? ""));
}

/** What this entity points at. */
export async function referencesFrom(
  client: SqlClient,
  projectId: string,
  entity: string
): Promise<string[]> {
  await prepareConnection(client);
  const rows = await cypher(
    client,
    `MATCH (a:Entity {project: $project})-[:REFERENCES]->(b:Entity {project: $project})
     WHERE a.props.name = $entity
     RETURN b.props.name ORDER BY b.props.name`,
    { project: projectId, entity },
    ["name"]
  );
  return rows.map((row) => String(parseAgtype(row.name) ?? ""));
}

/** Rules, hooks and workflows bound to one entity. */
export async function behaviourOf(
  client: SqlClient,
  projectId: string,
  entity: string
): Promise<{ rules: unknown[]; hooks: unknown[]; workflows: unknown[] }> {
  await prepareConnection(client);
  // Sequential, not `Promise.all`: these share one client, and `pg` deprecates
  // issuing a second query while the first is in flight.
  const rules = await cypher(
      client,
    `MATCH (r:Rule {project: $project})-[:RULE_ON]->(e:Entity)
     WHERE e.props.name = $entity RETURN r.props`,
    { project: projectId, entity },
    ["props"]
  );
  const hooks = await cypher(
    client,
    `MATCH (h:Hook {project: $project})-[:HOOK_ON]->(e:Entity)
     WHERE e.props.name = $entity RETURN h.props`,
    { project: projectId, entity },
    ["props"]
  );
  const workflows = await cypher(
    client,
    `MATCH (w:Workflow {project: $project})-[:WORKFLOW_ON]->(e:Entity)
     WHERE e.props.name = $entity RETURN w.props`,
    { project: projectId, entity },
    ["props"]
  );
  return {
    rules: values(rules, "props"),
    hooks: values(hooks, "props"),
    workflows: values(workflows, "props"),
  };
}

/**
 * A workflow's steps in the order they run.
 *
 * Walked along `NEXT` rather than sorted by a position property, because the
 * order is a property of the chain and reading it that way is what catches a
 * chain that was built broken.
 */
export async function workflowSteps(
  client: SqlClient,
  projectId: string,
  workflow: string
): Promise<Record<string, unknown>[]> {
  await prepareConnection(client);
  const rows = await cypher(
    client,
    `MATCH (w:Workflow {project: $project})-[:HAS_STEP]->(s:Step)
     WHERE w.props.name = $workflow
     RETURN s.props ORDER BY s.props.position`,
    { project: projectId, workflow },
    ["props"]
  );
  return values(rows, "props") as Record<string, unknown>[];
}

/** Which states a record of this entity may move to from `from`. */
export async function legalMoves(
  client: SqlClient,
  projectId: string,
  entity: string,
  from: string
): Promise<Array<{ to: string; trigger?: string }>> {
  await prepareConnection(client);
  const rows = await cypher(
    client,
    `MATCH (a:State {project: $project})-[t:TRANSITIONS_TO]->(b:State)
     WHERE a.props.entity = $entity AND a.props.name = $from
     RETURN b.props.name, t.props.trigger`,
    { project: projectId, entity, from },
    ["to_name", "trigger"]
  );
  return rows.map((row) => ({
    to: String(parseAgtype(row.to_name) ?? ""),
    trigger: row.trigger ? String(parseAgtype(row.trigger)) : undefined,
  }));
}

/** Which roles may do what to an entity. */
export async function rolesFor(
  client: SqlClient,
  projectId: string,
  entity: string
): Promise<Array<{ role: string; operation?: string }>> {
  await prepareConnection(client);
  const rows = await cypher(
    client,
    `MATCH (r:Role {project: $project})-[m:MAY]->(e:Entity)
     WHERE e.props.name = $entity
     RETURN r.props.name, m.props.operation`,
    { project: projectId, entity },
    ["role", "operation"]
  );
  return rows.map((row) => ({
    role: String(parseAgtype(row.role) ?? ""),
    operation: row.operation ? String(parseAgtype(row.operation)) : undefined,
  }));
}

/**
 * A free-text search across the graph, for a question that names no entity.
 *
 * Substring rather than similarity: the assistant is looking for a thing the
 * author *named*, and an exact-ish match on a name is both what it wants and
 * something it can be told it did not find. A vague near-match dressed up as
 * an answer is the failure this whole layer exists to avoid.
 */
export async function search(
  client: SqlClient,
  projectId: string,
  needle: string,
  limit = 20
): Promise<Array<{ label: string; key: string; props: unknown }>> {
  await prepareConnection(client);
  const rows = await cypher(
    client,
    `MATCH (n {project: $project})
     WHERE toLower(n.key) CONTAINS toLower($needle)
     RETURN label(n), n.key, n.props
     LIMIT $limit`,
    { project: projectId, needle, limit },
    ["label", "key", "props"]
  );
  return rows.map((row) => ({
    label: String(parseAgtype(row.label) ?? ""),
    key: String(parseAgtype(row.key) ?? ""),
    props: parseAgtype(row.props),
  }));
}
