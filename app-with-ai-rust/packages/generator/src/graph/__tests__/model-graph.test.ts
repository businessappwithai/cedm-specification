/**
 * The shape of the model graph, checked without a database.
 *
 * The storage layer needs Postgres and Apache AGE; the translation does not,
 * and the translation is where the interesting mistakes are — a relationship
 * pointed the wrong way answers a question wrongly rather than failing, which
 * no amount of connection testing would catch.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildModelGraph, summariseModel } from "../model-graph";
import { parseModel } from "../../pipeline/parse-model";
import { rbacRoleNames } from "../../rbac";

const MODEL = path.join(import.meta.dirname, "../../../../../examples/drug-discovery.eml.mmd");
const model = parseModel(readFileSync(MODEL, "utf-8"));
const graph = buildModelGraph(model);

const nodesOf = (label: string) => graph.nodes.filter((node) => node.label === label);
const edgesOf = (type: string) => graph.edges.filter((edge) => edge.type === type);

describe("buildModelGraph", () => {
  it("carries every entity and column the model declares", () => {
    expect(nodesOf("Entity")).toHaveLength(model.entities.length);
    expect(nodesOf("Attribute")).toHaveLength(
      model.entities.reduce((total, entity) => total + entity.attributes.length, 0)
    );
  });

  it("gives every attribute an edge from its entity", () => {
    expect(edgesOf("HAS_ATTRIBUTE")).toHaveLength(nodesOf("Attribute").length);
  });

  it("keys nodes uniquely", () => {
    const keys = graph.nodes.map((node) => node.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("points every edge at a node that exists", () => {
    const keys = new Set(graph.nodes.map((node) => node.key));
    const dangling = graph.edges
      .filter((edge) => !keys.has(edge.from) || !keys.has(edge.to))
      .map((edge) => `${edge.from} -${edge.type}-> ${edge.to}`);
    expect(dangling).toEqual([]);
  });

  // ── The one that was wrong ───────────────────────────────────────────────

  /**
   * `Compound ||--o{ CompoundAlias` says a Compound *has many* aliases, and the
   * foreign key for that sits on the alias. So the thing that references
   * Compound is CompoundAlias, pointing back the other way.
   *
   * Emitting REFERENCES in the ERD's declaration direction made "what
   * references Compound?" answer nothing at all for the most-referenced entity
   * in the model — a considered-looking "no" rather than an error.
   */
  it("points REFERENCES the way the foreign key does, not the way the ERD reads", () => {
    const referencingCompound = edgesOf("REFERENCES")
      .filter((edge) => edge.to === "Entity:Compound")
      .map((edge) => edge.from.replace("Entity:", ""))
      .sort();

    // Exactly the entities that declare a `compound_id` column.
    const holders = model.entities
      .filter((entity) => entity.attributes.some((a) => a.name === "compound_id"))
      .map((entity) => entity.name)
      .sort();

    expect(holders.length).toBeGreaterThan(0);
    expect(referencingCompound).toEqual(holders);
  });

  it("keeps the ERD's own statement as HAS_MANY", () => {
    const owned = edgesOf("HAS_MANY")
      .filter((edge) => edge.from === "Entity:Compound")
      .map((edge) => edge.to.replace("Entity:", ""))
      .sort();
    expect(owned).toEqual(["CompoundAlias", "Sample", "StabilityTest"]);
  });

  it("puts no `via` on REFERENCES", () => {
    // The parser's `foreignKey` is named for the declared target, so it is the
    // right column only for `manyToOne`. Carrying it onto the inverted edge
    // would name a column that does not exist.
    for (const edge of edgesOf("REFERENCES")) {
      expect(edge.properties?.via).toBeUndefined();
    }
  });

  // ── Behaviour ────────────────────────────────────────────────────────────

  it("chains a saga's steps in order", () => {
    const saga = model.sagas[0];
    if (!saga) return;
    const steps = graph.nodes.filter(
      (node) => node.label === "Step" && node.properties.workflow === saga.name
    );
    expect(steps).toHaveLength(saga.steps.length);
    // n steps means n-1 NEXT edges: a chain, not a set.
    expect(edgesOf("NEXT")).toHaveLength(Math.max(0, saga.steps.length - 1));
  });

  it("never records `[*]` as a state a record can be in", () => {
    const states = nodesOf("State").map((node) => node.properties.name);
    expect(states).not.toContain("[*]");
    for (const edge of edgesOf("TRANSITIONS_TO")) {
      expect(edge.from).not.toContain("[*]");
      expect(edge.to).not.toContain("[*]");
    }
  });

  it("binds every declared enum to the columns that use it", () => {
    expect(nodesOf("Enum")).toHaveLength(model.enums.length);
    const used = edgesOf("USES_ENUM");
    expect(used.length).toBeGreaterThan(0);
    const enumKeys = new Set(nodesOf("Enum").map((node) => node.key));
    for (const edge of used) expect(enumKeys.has(edge.to)).toBe(true);
  });

  it("records which roles the model grants, and on what", () => {
    const declared = new Set(model.rbac.operations.flatMap((rule) => rule.roles));
    for (const rule of model.rbac.transitions) for (const r of rule.roles) declared.add(r);
    expect(nodesOf("Role").map((n) => n.properties.name).sort()).toEqual([...declared].sort());
  });
});

describe("summariseModel", () => {
  it("names the application, its entities and its processes", () => {
    const summary = summariseModel(model, "drug-discovery");
    expect(summary).toContain("drug-discovery");
    expect(summary).toContain(`${model.entities.length} entities`);
    for (const saga of model.sagas) expect(summary).toContain(saga.name);
  });

  it("names roles a model declares only through transitions", () => {
    // Every `%%rbac` in drug-discovery is a transition rule, so a summary that
    // reads `rbac.operations` alone reports no roles at all for a model with
    // four of them. `rbacRoleNames` is the one derivation and this pins the
    // summary to it.
    expect(model.rbac.operations).toHaveLength(0);
    expect(model.rbac.transitions.length).toBeGreaterThan(0);

    const summary = summariseModel(model, "drug-discovery");
    for (const role of rbacRoleNames(model.rbac)) expect(summary).toContain(role);
  });
});
