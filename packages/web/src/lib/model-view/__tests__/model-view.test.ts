/**
 * The model viewer's three pure layers, over the model this repository is
 * validated on: the document becomes views, a view is laid out, and the text
 * and the diagram find each other through document paths.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readModelYaml } from "@appwithai/generator/model-yaml";
import { elementAt, modelViews } from "../graph";
import { layoutView, nodeBox } from "../layout";
import { buildSourceMap } from "../source-map";

const MODEL = path.resolve(__dirname, "../../../../../../examples/drug-discovery.eml.yaml");
const text = readFileSync(MODEL, "utf-8");
const read = readModelYaml(text);
if (!read.document) throw new Error("drug-discovery.eml.yaml does not read");
const document = read.document;
const views = modelViews(document);
/** The 1-based line of the first occurrence of `needle` at or after `from`. */
const lineOf = (needle: string, from = 1) =>
  text
    .split("\n")
    .findIndex((line, index) => index + 1 >= from && line.includes(needle)) + 1;
/** The top-level `entities:` key; categories write `entities:` too, indented. */
const ENTITIES = text.split("\n").indexOf("entities:") + 1;

describe("modelViews", () => {
  it("draws one view per entity diagram, state machine, saga, rule and hook flow", () => {
    const counts = {
      entities: 1,
      stateMachine: document.stateMachines?.length ?? 0,
      saga: document.sagas?.length ?? 0,
      rule: document.rules?.length ?? 0,
      hookFlow: document.hookFlows?.length ?? 0,
    };
    for (const [kind, count] of Object.entries(counts)) {
      expect(views.filter((view) => view.kind === kind), kind).toHaveLength(count);
    }
    expect(counts.stateMachine + counts.saga + counts.rule + counts.hookFlow).toBeGreaterThan(3);
  });

  it("draws every entity with every column, and every relationship between them", () => {
    const erd = views[0];
    expect(erd?.kind).toBe("entities");
    expect(erd?.nodes.map((node) => node.label)).toEqual(document.entities.map((e) => e.name));
    const compound = erd?.nodes.find((node) => node.label === "Compound");
    expect(compound?.fields[0]).toMatchObject({ name: "id", type: "string", badges: ["PK"] });
    expect(compound?.fields.find((field) => field.name === "smiles")?.badges).toEqual(["UK"]);
    expect(erd?.edges).toHaveLength(document.relationships?.length ?? 0);
  });

  it("tags a line item with its parent and marks the relationship that owns it", () => {
    // drug-discovery declares no line item; crm does.
    const crm = readModelYaml(
      readFileSync(path.resolve(__dirname, "../../../../../../language/yaml/examples/crm.eml.yaml"), "utf-8")
    ).document;
    if (!crm) throw new Error("crm.eml.yaml does not read");
    const child = crm.entities.find((entity) => entity.parent);
    expect(child, "crm declares a line item").toBeDefined();
    const erd = modelViews(crm)[0];
    expect(erd?.nodes.find((node) => node.label === child?.name)?.tags).toContain(
      `line item of ${child?.parent}`
    );
    expect(erd?.edges.some((edge) => edge.ownership)).toBe(true);
  });

  it("draws a state machine from its initial marker through every declared transition", () => {
    const machine = views.find((view) => view.key === "stateMachine:ExperimentLifecycle");
    expect(machine?.nodes[0]?.kind).toBe("initial");
    expect(machine?.edges[0]).toMatchObject({ source: "initial", target: "state:draft" });
    const declared = document.stateMachines?.[0]?.transitions.length ?? 0;
    expect(machine?.edges).toHaveLength(declared + 1);
    expect(machine?.nodes.filter((node) => node.kind === "final").map((n) => n.label)).toEqual([
      "completed",
      "cancelled",
    ]);
  });

  it("draws a saga as its trigger, its steps in order, and its end", () => {
    const saga = views.find((view) => view.kind === "saga");
    const declared = document.sagas?.[0];
    expect(saga?.nodes.map((node) => node.kind)).toEqual([
      "saga-start",
      ...(declared?.steps.map(() => "saga-step") ?? []),
      "saga-end",
    ]);
    expect(saga?.nodes[0]?.label).toBe("rule · CREATE");
    expect(saga?.nodes[1]).toMatchObject({ label: "Stage base days", detail: "Formula" });
    expect(saga?.edges).toHaveLength((declared?.steps.length ?? 0) + 1);
  });

  it("finds the element a document path belongs to", () => {
    const erd = views[0];
    if (!erd) throw new Error("no entity view");
    expect(elementAt(erd, ["entities", 0, "attributes", 2, "type"]).node?.label).toBe("Compound");
    expect(elementAt(erd, ["relationships", 1, "label"]).edge?.id).toBe("relationship:1");
    expect(elementAt(erd, ["hooks", 0])).toEqual({ node: undefined, edge: undefined });
  });
});

describe("buildSourceMap", () => {
  const map = buildSourceMap(text);

  it("gives the lines an entity was written on, from its first key to its last value", () => {
    const range = map.rangeOf(["entities", 0]);
    expect(range?.startLine).toBe(lineOf("  - name: Compound", ENTITIES));
    const next = lineOf(`  - name: ${document.entities[1]?.name}`, ENTITIES);
    expect(range?.endLine).toBeLessThan(next);
    expect(text.slice(range?.start, range?.end)).toMatch(/^name: Compound\n/);
  });

  it("finds the deepest path on a line", () => {
    const states = lineOf("    states: [draft,");
    expect(map.pathAt(states)).toEqual(["stateMachines", 0, "states", 0]);
    const column = (text.split("\n")[states - 1]?.indexOf("submitted") ?? 0) + 1;
    expect(map.pathAt(states, column)).toEqual(["stateMachines", 0, "states", 1]);
    expect(map.pathAt(states, 5)).toEqual(["stateMachines", 0, "states"]);
    expect(map.pathAt(lineOf("  - name: Compound", ENTITIES))).toEqual(["entities", 0, "name"]);
    expect(map.pathAt(1)).toEqual([]);
  });

  it("shows a path the author left out at the nearest thing written", () => {
    const written = map.rangeOf(["entities", 0]);
    expect(map.rangeOf(["entities", 0, "softDelete"])).toEqual(written);
  });

  it("joins a click on a node to its lines and the cursor back to the node", () => {
    const machine = views.find((view) => view.kind === "stateMachine");
    if (!machine) throw new Error("no state machine view");
    const approved = machine.nodes.find((node) => node.label === "approved");
    const range = approved && map.rangeOf(approved.path);
    expect(range && text.slice(range.start, range.end)).toBe("approved");
    const transition = machine.edges[3];
    const lines = transition && map.rangeOf(transition.path);
    expect(lines && elementAt(machine, map.pathAt(lines.startLine)).edge?.id).toBe(transition?.id);
  });
});

describe("layoutView", () => {
  it("places every node of every view, at the size it is drawn", async () => {
    for (const view of views) {
      const layout = await layoutView(view);
      expect(layout.nodes).toHaveLength(view.nodes.length);
      for (const placed of layout.nodes) {
        expect(Number.isFinite(placed.x) && Number.isFinite(placed.y), view.key).toBe(true);
        expect({ width: placed.width, height: placed.height }).toEqual(nodeBox(placed.node));
      }
    }
  });

  it("lays out the same view the same way every time", async () => {
    const erd = views[0];
    if (!erd) throw new Error("no entity view");
    const [first, second] = [await layoutView(erd), await layoutView(erd)];
    expect(second).toEqual(first);
  });

  it("does not stack two entities on one another", async () => {
    const erd = views[0];
    if (!erd) throw new Error("no entity view");
    const { nodes } = await layoutView(erd);
    for (const [index, a] of nodes.entries()) {
      for (const b of nodes.slice(index + 1)) {
        const apart =
          a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
        expect(apart, `${a.node.label} overlaps ${b.node.label}`).toBe(true);
      }
    }
  });
});
