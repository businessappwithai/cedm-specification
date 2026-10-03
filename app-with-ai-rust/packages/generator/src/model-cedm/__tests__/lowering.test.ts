/**
 * What a CEDM construct compiles to — the rules `language/cedm/lower.ts` and
 * `imports.ts` apply to models written in CEDM from the start, which the
 * corpus round trip (every construct there came from a model document) does
 * not reach: paired relationships, keys created for relationships, explicit
 * reference targets, inline value lists, lifecycles with actions, invariants
 * with conditions, permissions, imports, modules and `extends`.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { declaredEntityNames, entityToBusEntity } from "@appwithai/core/types";
import { parse, stringify } from "yaml";
import { compileModelDocument } from "../../model-yaml";
import {
  type CedmModelDocument,
  createFileLibrary,
  lowerCedmModel,
  readCedmModel,
  resolveCedmImports,
} from "../index";
import { validateCedmValue } from "../read";
import { locateCedmRoot } from "../library";

const ROOT = path.resolve(__dirname, "../../../../..");
/** The CEDM specification: this repository, or the one enclosing its copy. */
const SPEC_ROOT = locateCedmRoot(ROOT) ?? ROOT;

function lower(model: Omit<CedmModelDocument, "cedm">) {
  return lowerCedmModel({ cedm: "1.0", ...model });
}

describe("relationships", () => {
  it("pairs two sides that name each other, keeps one record, and keys the to-one side", () => {
    const { document } = lower({
      entities: [
        {
          name: "SalesOrder",
          attributes: [{ name: "orderNumber", type: "string" }],
          relationships: [
            {
              name: "lines",
              target: "SalesOrderLine",
              cardinality: "1..*",
              ownership: "aggregate",
              inverse: "salesOrder",
            },
          ],
        },
        {
          name: "SalesOrderLine",
          attributes: [{ name: "quantity", type: "decimal" }],
          relationships: [
            { name: "salesOrder", target: "SalesOrder", cardinality: "1", inverse: "lines" },
          ],
        },
      ],
    });
    expect(document.relationships).toEqual([
      {
        from: "SalesOrder",
        fromCardinality: "exactly-one",
        to: "SalesOrderLine",
        toCardinality: "one-or-more",
        label: "lines",
      },
    ]);
    const line = document.entities.find((entity) => entity.name === "SalesOrderLine");
    expect(line?.parent).toBe("SalesOrder");
    expect(line?.attributes).toContainEqual({
      name: "sales_order_id",
      type: "string",
      fk: true,
      help: "The SalesOrder this SalesOrderLine refers to.",
    });
    // And the compiled child is a line item of its parent, linked on that key.
    const compiled = compileModelDocument(document);
    const child = compiled.entities.find((entity) => entity.name === "SalesOrderLine");
    expect(child?.parentEntity).toBe("SalesOrder");
    expect(child?.parentLinkColumn).toBe("sales_order_id");
  });

  it("pairs the only to-one and to-many between two entities even when neither names the other", () => {
    const { document } = lower({
      entities: [
        {
          name: "Invoice",
          relationships: [{ name: "lines", target: "InvoiceLine", cardinality: "0..*" }],
        },
        {
          name: "InvoiceLine",
          relationships: [{ name: "invoice", target: "Invoice", cardinality: "1" }],
        },
      ],
    });
    expect(document.relationships).toHaveLength(1);
  });

  it("states the target of a key whose name does not resolve to it", () => {
    const { document, notes } = lower({
      entities: [
        { name: "Location", attributes: [{ name: "name", type: "string" }] },
        {
          name: "Shipment",
          relationships: [{ name: "deliveryLocation", target: "Location", cardinality: "0..1" }],
        },
      ],
    });
    const shipment = document.entities.find((entity) => entity.name === "Shipment");
    expect(shipment?.attributes).toContainEqual({
      name: "delivery_location_id",
      type: "string",
      fk: true,
      optional: true,
      references: "Location",
      help: "The Location this Shipment refers to.",
    });
    expect(document.relationships).toEqual([
      {
        from: "Location",
        fromCardinality: "exactly-one",
        to: "Shipment",
        toCardinality: "zero-or-more",
        label: "delivery_location",
      },
    ]);
    expect(notes.map((note) => note.code)).toContain("CEDM140");
  });

  it("does not state a target the name already resolves to", () => {
    const { document } = lower({
      entities: [
        { name: "Customer", attributes: [{ name: "name", type: "string" }] },
        {
          name: "Order",
          attributes: [{ name: "customerId", type: "reference", target: "Customer" }],
          relationships: [{ name: "customer", target: "Customer", cardinality: "1" }],
        },
      ],
    });
    const order = document.entities.find((entity) => entity.name === "Order");
    expect(order?.attributes).toEqual([{ name: "customer_id", type: "string", fk: true }]);
  });

  it("keeps a self-reference's key on the qualifier the backend strips", () => {
    const { document } = lower({
      entities: [
        {
          name: "Location",
          relationships: [
            {
              name: "parentLocation",
              target: "Location",
              cardinality: "0..1",
              inverse: "childLocations",
            },
            {
              name: "childLocations",
              target: "Location",
              cardinality: "0..*",
              inverse: "parentLocation",
            },
          ],
        },
      ],
    });
    expect(document.relationships).toHaveLength(1);
    expect(document.entities[0]?.attributes).toContainEqual({
      name: "parent_location_id",
      type: "string",
      fk: true,
      optional: true,
      help: "The Location this Location refers to.",
    });
  });

  it("enforces n..* as 1..* and says so; refuses a cardinality CEDM does not define", () => {
    const { document, notes } = lower({
      entities: [
        {
          name: "Journal",
          relationships: [{ name: "lines", target: "Line", cardinality: "2..*" }],
        },
        { name: "Line" },
        { name: "Odd", relationships: [{ name: "x", target: "Line", cardinality: "3" }] },
      ],
    });
    expect(document.relationships?.[0]?.toCardinality).toBe("one-or-more");
    expect(notes.map((note) => note.code)).toEqual(expect.arrayContaining(["CEDM131", "CEDM130"]));
  });
});

describe("attributes", () => {
  it("names columns in snake_case, keys the identity as id, and publishes inline value lists", () => {
    const { document } = lower({
      entities: [
        {
          name: "Product",
          identity: { key: "productId", type: "uuid" },
          attributes: [
            { name: "productId", type: "uuid", required: true },
            { name: "sku", type: "string", maxLength: 40, unique: true },
            { name: "status", type: "enum", values: ["ACTIVE", "RETIRED"], default: "ACTIVE" },
            { name: "listPrice", type: "money", required: false },
            { name: "originCountry", type: "country_code" },
          ],
        },
      ],
    });
    expect(document.entities[0]?.attributes).toEqual([
      { name: "id", type: "uuid", pk: true },
      { name: "sku", type: "string(40)", unique: true },
      { name: "status", type: "string", enum: "ProductStatus", default: "ACTIVE" },
      { name: "list_price", type: "money", optional: true },
      { name: "origin_country", type: "string(2)" },
    ]);
    expect(document.enums).toEqual([{ name: "ProductStatus", values: ["ACTIVE", "RETIRED"] }]);
  });

  it("composes structured help into one paragraph", () => {
    const { document } = lower({
      entities: [
        {
          name: "Thing",
          help: { summary: "A thing", businessMeaning: "What the business means by it." },
          attributes: [
            { name: "code", type: "string", help: { summary: "The code.", usage: "Search" } },
          ],
        },
      ],
    });
    expect(document.entities[0]?.help).toBe("A thing. What the business means by it.");
    expect(document.entities[0]?.attributes[0]?.help).toBe("The code. Search.");
  });

  it("keeps a reference to an entity outside the model as a plain value, and says so", () => {
    const { document, notes } = lower({
      entities: [
        {
          name: "Order",
          attributes: [{ name: "currencyId", type: "reference", target: "Currency" }],
        },
      ],
    });
    expect(document.entities[0]?.attributes).toEqual([{ name: "currency_id", type: "string" }]);
    expect(notes.map((note) => note.code)).toContain("CEDM120");
  });
});

describe("what the application already provides", () => {
  it("leaves out the audit fields CEDM calls system-managed, unless told to keep one", () => {
    const { document, notes } = lower({
      entities: [
        {
          name: "Thing",
          attributes: [
            { name: "code", type: "string" },
            { name: "createdAt", type: "datetime" },
            { name: "updatedBy", type: "string", systemManaged: false },
          ],
        },
      ],
    });
    expect(document.entities[0]?.attributes.map((attribute) => attribute.name)).toEqual([
      "code",
      "updated_by",
    ]);
    expect(notes.map((note) => note.code)).toContain("CEDM141");
  });

  it("treats an optional neighbour outside the model as information, a required one as a warning", () => {
    const { notes } = lower({
      entities: [
        {
          name: "Order",
          relationships: [
            { name: "invoices", target: "Invoice", cardinality: "0..*" },
            { name: "customer", target: "Customer", cardinality: "1" },
          ],
        },
      ],
    });
    expect(notes.filter((note) => note.code === "CEDM121").map((note) => note.severity)).toEqual([
      "info",
      "warning",
    ]);
  });
});

describe("lifecycles, invariants and permissions", () => {
  it("compiles a lifecycle to a state machine whose actions are its triggers", () => {
    const { document } = lower({
      entities: [
        {
          name: "Order",
          attributes: [{ name: "status", type: "enum", values: ["DRAFT", "CONFIRMED"] }],
          lifecycle: {
            attribute: "status",
            states: ["DRAFT", "CONFIRMED"],
            initial: "DRAFT",
            terminal: ["CONFIRMED"],
            transitions: [{ from: "DRAFT", to: "CONFIRMED", action: "confirm" }],
          },
        },
      ],
      authorization: {
        permissions: [{ resource: "Order", action: "confirm", subject: "sales_manager" }],
      },
    });
    expect(document.stateMachines).toEqual([
      {
        name: "OrderLifecycle",
        entity: "Order",
        states: ["DRAFT", "CONFIRMED"],
        initial: "DRAFT",
        final: ["CONFIRMED"],
        transitions: [{ from: "DRAFT", to: "CONFIRMED", trigger: "confirm" }],
      },
    ]);
    expect(document.rbac).toEqual([
      { entity: "Order", action: "confirm", roles: ["sales_manager"] },
    ]);
  });

  it("compiles an invariant with a condition to a validation rule, and leaves prose alone", () => {
    const { document } = lower({
      entities: [
        {
          name: "Payment",
          attributes: [{ name: "amount", type: "decimal" }],
          invariants: [
            { id: "PAY-001", rule: "Amount must be positive.", violatedWhen: "amount <= 0" },
            { id: "PAY-002", rule: "Payments reconcile to their invoices." },
          ],
        },
      ],
    });
    expect(document.rules?.map((rule) => [rule.name, rule.event])).toEqual([
      ["paymentInvariantsBeforeCreate", "beforeCreate"],
      ["paymentInvariantsBeforeUpdate", "beforeUpdate"],
    ]);
    expect(document.rules?.[0]?.actions).toEqual([
      {
        name: "PAY-001",
        type: "validation-error",
        when: "amount <= 0",
        props: { message: "Amount must be positive." },
      },
    ]);
  });

  it("refuses a deny or a scoped permission rather than generating something weaker", () => {
    const { document, notes } = lower({
      entities: [{ name: "Order" }],
      authorization: {
        permissions: [
          { resource: "Order", action: "delete", subject: "clerk", effect: "deny" },
          { resource: "Order", action: "read", subject: "clerk", scope: "own" },
        ],
      },
    });
    expect(document.rbac).toBeUndefined();
    expect(notes.filter((note) => note.severity === "error").map((note) => note.code)).toEqual([
      "CEDM160",
      "CEDM161",
    ]);
  });
});

describe("the CEDM library", () => {
  const library = createFileLibrary({ root: SPEC_ROOT });

  it("every library entity satisfies the CEDM entity schema", () => {
    const directory = path.join(SPEC_ROOT, "domain", "entities");
    const failures: string[] = [];
    let checked = 0;
    for (const file of readdirSync(directory)) {
      if (!file.endsWith(".yaml") || file === "index.yaml") continue;
      const entity = (
        parse(readFileSync(path.join(directory, file), "utf-8")) as { entity?: unknown }
      )?.entity;
      if (!entity) continue;
      checked++;
      const problems = validateCedmValue({ cedm: "1.0", entities: [entity] });
      if (problems)
        failures.push(`${file}: ${problems.map((problem) => problem.message).join("; ")}`);
    }
    expect(checked).toBeGreaterThan(300);
    expect(failures).toEqual([]);
  });

  it("imports SalesOrder with what it cannot exist without, and generates a valid model", () => {
    const text = stringify({
      cedm: "1.0",
      application: { name: "Orders" },
      imports: [{ entity: "SalesOrder" }],
    });
    const read = readCedmModel(text, { library });
    const errors = read.diagnostics.filter((diagnostic) => diagnostic.severity === "error");
    expect(errors).toEqual([]);
    const names = read.document?.entities.map((entity) => entity.name) ?? [];
    expect(names[0]).toBe("SalesOrder");
    expect(names).toEqual(expect.arrayContaining(["SalesOrderLine", "Customer"]));
    expect(read.libraryEntities).toContain("SalesOrder");
    const line = read.document?.entities.find((entity) => entity.name === "SalesOrderLine");
    expect(line?.parent).toBe("SalesOrder");
  });

  it("narrows an import, and a local declaration refines it", () => {
    const resolved = resolveCedmImports(
      {
        cedm: "1.0",
        imports: [{ entity: "Currency", include: ["code"] }],
        entities: [{ name: "Currency", ui: { icon: "coins" } }],
      },
      library
    );
    const currency = resolved.document.entities?.find((entity) => entity.name === "Currency");
    expect(currency?.attributes?.map((attribute) => attribute.name)).toEqual(
      expect.arrayContaining(["code"])
    );
    expect(currency?.attributes?.length).toBeLessThanOrEqual(2);
    expect(currency?.ui?.icon).toBe("coins");
  });

  it("carries a parent's attributes into a specialisation", () => {
    const resolved = resolveCedmImports(
      { cedm: "1.0", imports: [{ entity: "Customer" }] },
      library
    );
    const customer = resolved.document.entities?.find((entity) => entity.name === "Customer");
    const partyRole = library.entity("PartyRole");
    const inherited = (partyRole?.attributes ?? [])
      .map((attribute) => attribute.name)
      .filter((name) => name !== partyRole?.identity?.key);
    for (const name of inherited) {
      expect(customer?.attributes?.map((attribute) => attribute.name)).toContain(name);
    }
  });

  it("reports an entity the library does not have", () => {
    const read = readCedmModel(stringify({ cedm: "1.0", imports: [{ entity: "NoSuchThing" }] }), {
      library,
    });
    expect(read.diagnostics.map((diagnostic) => diagnostic.code)).toContain("CEDM101");
    expect(read.ok).toBe(false);
  });
});

describe("enumeration tables", () => {
  const model: Omit<CedmModelDocument, "cedm"> = {
    application: { name: "Orders", enumerationTables: true },
    entities: [
      {
        name: "Order",
        identity: { key: "orderId", type: "uuid" },
        attributes: [
          { name: "orderId", type: "uuid", required: true },
          {
            name: "status",
            type: "enum",
            required: true,
            values: ["OPEN", "ON_HOLD"],
            help: {
              summary: "Where the order is.",
              valueSemantics: { OPEN: "Accepting changes.", ON_HOLD: "Paused by the buyer." },
              valueLabels: { ON_HOLD: "On hold" },
            },
          },
        ],
      },
    ],
  };

  it("gives a value list an entity, a category and the table flag", () => {
    const { document } = lower(model);
    const table = document.entities.find((entity) => entity.name === "OrderStatus");
    expect(table?.attributes.map((attribute) => attribute.name)).toEqual([
      "id",
      "code",
      "name",
      "description",
      "sequence",
      "is_active",
    ]);
    expect(document.enums).toEqual([
      {
        name: "OrderStatus",
        values: ["OPEN", "ON_HOLD"],
        table: true,
        labels: { ON_HOLD: "On hold" },
        descriptions: { OPEN: "Accepting changes.", ON_HOLD: "Paused by the buyer." },
      },
    ]);
    expect(document.categories?.find((category) => category.name === "Reference Data")?.entities).toEqual([
      "OrderStatus",
    ]);
  });

  it("does nothing unless the application asks", () => {
    const { document } = lower({ ...model, application: { name: "Orders" } });
    expect(document.entities.map((entity) => entity.name)).toEqual(["Order"]);
    expect(document.enums?.[0]).toEqual({ name: "OrderStatus", values: ["OPEN", "ON_HOLD"] });
  });

  it("refuses a list whose name is an entity's", () => {
    const { notes } = lower({
      ...model,
      entities: [
        ...(model.entities ?? []),
        { name: "OrderStatus", identity: { key: "id", type: "uuid" }, attributes: [{ name: "id", type: "uuid" }] },
      ],
    });
    expect(notes.some((note) => note.code === "CEDM170")).toBe(true);
  });

  it("seeds the rows and a Table reference, and no sys_ref_list rows", async () => {
    const { buildDictionarySeedSql } = await import(
      "../../generators/tanstack-astryx-loco/dictionary-seed"
    );
    const compiled = compileModelDocument(lower(model).document);
    const declared = declaredEntityNames(compiled.entities);
    const sql = buildDictionarySeedSql({
      projectName: "orders",
      entities: compiled.entities.map((entity) => entityToBusEntity(entity, declared)),
      modelEnums: compiled.enums,
    });
    expect(sql).toContain("INSERT INTO bus_order_status (id, code, name, description, sequence, is_active)");
    expect(sql).toContain("'On hold'");
    expect(sql).toContain("INSERT INTO sys_ref_table");
    const listRows = sql.split("ON CONFLICT DO NOTHING;").filter((statement) => statement.includes("INSERT INTO sys_ref_list"));
    expect(listRows.some((statement) => statement.includes("ON_HOLD"))).toBe(false);
  });
});
