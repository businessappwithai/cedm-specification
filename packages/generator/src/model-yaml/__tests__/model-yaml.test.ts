import { describe, expect, it } from "vitest";
import { sagaOperation, sagaTrigger } from "../../workflows/sagas";
import {
  compileModelDocument,
  type ModelDocument,
  ModelYamlError,
  parseModelYaml,
  readModelYaml,
  serializeModelDocument,
} from "../index";

/** A model exercising every section of the language. */
const ORDERS = `eml: "1.0"
name: Orders
description: Taking and fulfilling customer orders.
enums:
  - name: OrderStatus
    values: [draft, submitted, shipped, cancelled]
  - name: Unused
    values: [a, b]
categories:
  - name: Sales
    icon: ShoppingCart
    entities: [Customer, Order]
entities:
  - name: Customer
    help: A person or company that buys from us.
    icon: user
    attributes:
      - { name: id, type: uuid, pk: true }
      - { name: name, type: string(120) }
      - { name: email, type: email, unique: true, help: Where order confirmations go. }
  - name: Order
    attributes:
      - { name: id, type: uuid, pk: true }
      - { name: customer_id, type: uuid, fk: true }
      - { name: status, type: string, enum: OrderStatus }
      - { name: total, type: decimal, optional: true }
    indexes:
      - columns: [customer_id, status]
  - name: OrderLine
    parent: Order
    attributes:
      - { name: id, type: uuid, pk: true }
      - { name: order_id, type: uuid, fk: true }
      - { name: quantity, type: integer }
relationships:
  - { from: Customer, fromCardinality: exactly-one, to: Order, toCardinality: zero-or-more, label: places }
  - { from: Order, fromCardinality: exactly-one, to: OrderLine, toCardinality: one-or-more }
hooks:
  - { entity: Order, event: beforeCreate, handler: stampOrderNumber }
rbac:
  - { entity: Order, action: delete, roles: [manager] }
  - { entity: Order, action: ship, roles: [warehouse, manager] }
reports:
  - name: orders_by_status
    title: Orders by status
    entity: Order
    chart: bar
    x: status
    y: count
    sql: |
      SELECT status, count(*) AS count
      FROM bus_order
      GROUP BY status
stateMachines:
  - name: OrderLifecycle
    entity: Order
    states: [draft, submitted, shipped, cancelled]
    initial: draft
    final: [shipped, cancelled]
    transitions:
      - { from: draft, to: submitted, trigger: submit }
      - { from: submitted, to: shipped, trigger: ship }
      - { from: submitted, to: cancelled, trigger: cancel }
sagas:
  - name: ShipmentHandoff
    entity: Order
    trigger: automatic
    operation: UPDATE
    steps:
      - id: mark
        type: UpdateEntity
        label: Mark as handed off
        properties: { field: status, value: shipped }
`;

describe("reading YAML model text", () => {
  it("accepts a well-formed model with no errors", () => {
    const result = readModelYaml(ORDERS);
    expect(result.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("reports YAML syntax errors with their line", () => {
    const result = readModelYaml(`eml: "1.0"\nentities:\n  - name: A\n   attributes: []\n`);
    expect(result.ok).toBe(false);
    expect(result.document).toBeUndefined();
    expect(result.diagnostics[0]).toMatchObject({ code: "YAML", severity: "error" });
    expect(result.diagnostics[0]!.line).toBeGreaterThan(1);
  });

  it("refuses duplicate keys rather than letting the last one win", () => {
    const result = readModelYaml(`eml: "1.0"\nentities: []\nentities: []\n`);
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({ code: "YAML", line: 3 });
  });

  it("locates a schema error on the offending key", () => {
    const text = [
      `eml: "1.0"`,
      "entities:",
      "  - name: A",
      "    attributes:",
      "      - { name: id, type: uuid, pk: true }",
      "      - { name: code, type: string, primary: true }",
    ].join("\n");
    const result = readModelYaml(text);
    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "SCHEMA",
        path: ["entities", 0, "attributes", 1, "primary"],
        line: 6,
      })
    );
  });

  it("names the valid pairs when a relationship pairs ends the language gives no kind", () => {
    const text = `eml: "1.0"
entities:
  - { name: A, attributes: [{ name: id, type: uuid, pk: true }] }
  - { name: B, attributes: [{ name: id, type: uuid, pk: true }] }
relationships:
  - { from: A, fromCardinality: zero-or-one, to: B, toCardinality: zero-or-more }
`;
    const result = readModelYaml(text);
    expect(result.ok).toBe(false);
    const [error] = result.diagnostics;
    expect(error).toMatchObject({ code: "SCHEMA", path: ["relationships", 0], line: 6 });
    expect(error!.message).toContain("exactly-one/zero-or-more");
  });

  it("refuses a report that is not a single read, and a chart without its axes", () => {
    const text = `eml: "1.0"
entities: [{ name: A, attributes: [{ name: id, type: uuid, pk: true }] }]
reports:
  - { name: wipe, sql: DELETE FROM bus_a }
  - { name: plot, chart: bar, x: day, sql: SELECT 1 }
`;
    const result = readModelYaml(text);
    const paths = result.diagnostics.filter((d) => d.code === "SCHEMA").map((d) => d.path);
    expect(paths).toContainEqual(["reports", 0, "sql"]);
    expect(paths).toContainEqual(["reports", 1]);
  });

  it("reports the language checker's findings against the YAML that caused them", () => {
    const text = `eml: "1.0"
name: Checked
entities:
  - name: A
    attributes:
      - { name: id, type: uuid, pk: true, optional: true }
  - name: B
    parent: Nowhere
    attributes: [{ name: id, type: uuid, pk: true }]
relationships:
  - { from: A, fromCardinality: exactly-one, to: Missing, toCardinality: zero-or-more }
`;
    const result = readModelYaml(text);
    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "EML116", path: ["entities", 0, "attributes", 0], line: 6 })
    );
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "EML147", path: ["entities", 1, "parent"], line: 8 })
    );
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "EML121", path: ["relationships", 0, "to"], line: 11 })
    );
  });
});

describe("compiling a YAML model", () => {
  const { model } = parseModelYaml(ORDERS);

  it("builds the entities, keys and constraints the attributes declare", () => {
    const customer = model.entities.find((entity) => entity.name === "Customer")!;
    expect(customer.tableName).toBe("customer");
    expect(customer.description).toBe("A person or company that buys from us.");
    expect(customer.icon).toBe("user");
    expect(customer.attributes.find((a) => a.name === "name")).toMatchObject({
      type: "string",
      maxLength: 120,
      required: true,
    });
    expect(customer.attributes.find((a) => a.name === "email")).toMatchObject({
      semanticType: "email",
      unique: true,
      description: "Where order confirmations go.",
    });
    expect(
      model.entities.find((e) => e.name === "Order")!.attributes.find((a) => a.name === "total")
    ).toMatchObject({ required: false });
  });

  it("gives only bound enums a reference id, and binds the column to it", () => {
    expect(model.enums).toEqual([
      {
        name: "OrderStatus",
        values: ["draft", "submitted", "shipped", "cancelled"],
        referenceId: 1000,
      },
    ]);
    const status = model.entities
      .find((entity) => entity.name === "Order")!
      .attributes.find((attribute) => attribute.name === "status")!;
    expect(status).toMatchObject({ enumRef: "OrderStatus", enumReferenceId: 1000 });
  });

  it("links a line item to its parent through the foreign key it declares", () => {
    const line = model.entities.find((entity) => entity.name === "OrderLine")!;
    expect(line).toMatchObject({ parentEntity: "Order", parentLinkColumn: "order_id" });
  });

  it("carries indexes, relationships and categories", () => {
    expect(model.entities.find((e) => e.name === "Order")!.indexes).toEqual([
      { columns: ["customer_id", "status"], unique: false },
    ]);
    expect(model.relationships.map((r) => [r.name, r.cardinality, r.foreignKey])).toEqual([
      ["places", "oneToMany", "customer_id"],
      ["order_orderline", "oneToMany", "order_id"],
    ]);
    expect(model.categories.map((c) => [c.name, c.entities])).toEqual([
      ["Sales", ["Customer", "Order"]],
      ["General", ["OrderLine"]],
    ]);
  });

  it("resolves an access rule naming a transition to that transition's edges", () => {
    expect(model.rbac.operations).toEqual([
      { entity: "Order", tableName: "bus_order", operation: "delete", roles: ["manager"] },
    ]);
    expect(model.rbac.transitions).toEqual([
      {
        entity: "Order",
        tableName: "bus_order",
        transition: "ship",
        edges: [{ from: "submitted", to: "shipped" }],
        roles: ["manager", "warehouse"],
      },
    ]);
  });

  it("keeps a multi-line report query as written", () => {
    expect(model.reports[0]).toMatchObject({ name: "orders_by_status", chart: "bar" });
    expect(model.reports[0]!.sql).toContain("\nGROUP BY status");
  });

  it("runs an automatic saga on the write it names", () => {
    expect(model.sagas).toEqual([
      {
        name: "ShipmentHandoff",
        entity: "Order",
        operation: "UPDATE",
        trigger: "automatic",
        description: undefined,
        steps: [
          {
            nodeId: "mark",
            nodeType: "UpdateEntity",
            label: "Mark as handed off",
            properties: { field: "status", value: "shipped" },
          },
        ],
      },
    ]);
  });

  it("compiles the state machine the document lists", () => {
    expect(model.workflows[0]).toMatchObject({
      name: "OrderLifecycle",
      tableName: "bus_order",
      initial: "draft",
      terminal: ["shipped", "cancelled"],
    });
    expect(model.workflows[0]!.states.map((state) => state.name)).toEqual([
      "draft",
      "submitted",
      "shipped",
      "cancelled",
    ]);
  });

  it("refuses to compile a model with errors, naming each one", () => {
    expect(() => parseModelYaml(`eml: "2.0"\nentities: []\n`, { source: "m.eml.yaml" })).toThrow(
      ModelYamlError
    );
    expect(() => parseModelYaml(`eml: "2.0"\nentities: []\n`, { source: "m.eml.yaml" })).toThrow(
      /m\.eml\.yaml:1:6 SCHEMA/
    );
  });
});

describe("the canonical text", () => {
  it("is stable across saves and states nothing twice", () => {
    const { document } = parseModelYaml(ORDERS);
    const once = serializeModelDocument(document);
    const twice = serializeModelDocument(parseModelYaml(once).document);
    expect(twice).toBe(once);
    expect(once.startsWith('eml: "1.0"\nname: Orders\n')).toBe(true);
  });

  it("omits what is the default: a title equal to the name, a downward direction, an automatic CREATE saga", () => {
    const document: ModelDocument = {
      eml: "1.0",
      entities: [{ name: "A", attributes: [{ name: "id", type: "uuid", pk: true }] }],
      rules: [
        {
          name: "gate",
          title: "gate",
          entity: "A",
          event: "beforeCreate",
          direction: "down",
          nodes: [{ id: "s", label: "Start", type: "start" }],
          edges: [],
        },
      ],
      sagas: [{ name: "run", entity: "A", trigger: "automatic", operation: "CREATE", steps: [] }],
    };
    const text = serializeModelDocument(document);
    expect(text).not.toMatch(/title:|direction:|trigger:|operation:/);
  });
});

describe("a state machine", () => {
  it("keeps each state in the order the document lists it, wherever the initial state falls", () => {
    const document: ModelDocument = {
      eml: "1.0",
      entities: [{ name: "Ticket", attributes: [{ name: "id", type: "uuid", pk: true }] }],
      stateMachines: [
        {
          name: "TicketFlow",
          entity: "Ticket",
          states: ["open", "triage", "closed"],
          initial: "triage",
          final: ["closed"],
          transitions: [
            { from: "open", to: "triage" },
            { from: "triage", to: "closed", trigger: "resolve" },
          ],
        },
      ],
    };
    const compiled = compileModelDocument(document);
    expect(compiled.workflows[0]!.states.map((s) => s.name)).toEqual(["open", "triage", "closed"]);
    expect(compiled.workflows[0]!.initial).toBe("triage");
  });
});

describe("a saga's trigger and operation", () => {
  const saga = (fields: {
    trigger?: "rule" | "automatic";
    operation?: "CREATE" | "UPDATE" | "DELETE" | "ALL";
  }) => {
    const document: ModelDocument = {
      eml: "1.0",
      entities: [
        {
          name: "Deal",
          attributes: [
            { name: "id", type: "uuid", pk: true },
            { name: "status", type: "string" },
          ],
        },
      ],
      sagas: [
        {
          name: "Handoff",
          entity: "Deal",
          ...fields,
          steps: [
            {
              id: "A",
              type: "UpdateEntity",
              label: "Mark",
              properties: { field: "status", value: "handed_off" },
            },
          ],
        },
      ],
    };
    return compileModelDocument(document).sagas[0]!;
  };

  it("is read from the saga's own keys", () => {
    expect(saga({ trigger: "rule", operation: "UPDATE" })).toMatchObject({
      trigger: "rule",
      operation: "UPDATE",
    });
  });

  it("defaults to what the language documents: automatic, on CREATE", () => {
    expect(saga({})).toMatchObject({ trigger: "automatic", operation: "CREATE" });
  });

  it("normalises an operation alias to the operation the runtime matches", () => {
    // The schema admits only the canonical spellings; the compiler still folds
    // the aliases the access rules accept, so a document built in code rather
    // than read from YAML compiles the same way.
    expect(sagaOperation("INSERT")).toBe("CREATE");
    expect(sagaOperation("edit")).toBe("UPDATE");
    expect(sagaOperation("*")).toBe("ALL");
    expect(sagaTrigger(undefined)).toBe("automatic");
  });
});
