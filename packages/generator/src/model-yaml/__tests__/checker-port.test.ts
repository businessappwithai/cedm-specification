/**
 * The document checker against the checker it replaces.
 *
 * `language/yaml/checker.ts` reads the model document. The checker before it
 * read the document's Mermaid view, through the Mermaid parser. Before the view
 * is deleted, every rule of the new checker is held to what the old one said
 * about the same document — over every model in the corpus, and over one
 * fixture per rule, since the corpus alone exercises a handful of codes.
 *
 * Where the two differ, the difference is listed below with its reason. Nothing
 * else may differ.
 */

import { describe, expect, it } from "vitest";
import { checkSource } from "../../../../../language/checker";
import { checkModelDocument } from "../../../../../language/yaml/checker";
import type { ModelDocument } from "../../../../../language/yaml/document";
import { renderEmlView } from "../render-eml";

/** Codes only the view-reading checker raised, and why the document checker does not. */
const RETIRED: Record<string, string> = {
  EML242:
    "the saga or state machine's entity is reported once, as EML400; the view also raised it off the %%workflow line",
  EML251:
    "the rule's entity is reported once, as EML307; the view also raised it off the %%rule line",
  EML501:
    "an attribute's undeclared enum is reported once, as EML144; the view also raised it off the attribute",
  EML221:
    "an access rule's undeclared entity is reported once, as EML213; the view also read the %%rbac line as a guard",
};

/** Codes only the document checker raises, and why the view could not. */
const ADDED: Record<string, string> = {
  EML308: "a rule node declared twice; the Mermaid parser silently kept the first",
  EML309: "an edge to an undeclared node; the Mermaid parser silently created a bare node for it",
  EML429: "a transition, initial or final state missing from states; the view invented the state",
};

interface Case {
  name: string;
  change: (document: ModelDocument) => void;
  /** Codes the document checker must raise. */
  expect: string[];
  /** A known, reasoned difference in the count of one code. */
  differs?: Record<string, string>;
}

function base(): ModelDocument {
  return {
    eml: "1.0",
    name: "Orders",
    enums: [{ name: "OrderStatus", values: ["draft", "submitted", "shipped"] }],
    categories: [{ name: "Sales", entities: ["Customer", "Order"] }],
    entities: [
      {
        name: "Customer",
        help: "A buyer, kept for every order they place so their history stays in one place.",
        attributes: [
          { name: "id", type: "uuid", pk: true },
          {
            name: "full_name",
            type: "string",
            help: "Printed on invoices exactly as the customer wants.",
          },
        ],
      },
      {
        name: "Order",
        help: "One purchase, from the draft a customer builds to the shipment that closes it.",
        attributes: [
          { name: "id", type: "uuid", pk: true },
          {
            name: "customer_id",
            type: "uuid",
            fk: true,
            help: "Who placed it and receives the invoice.",
          },
          {
            name: "status",
            type: "string",
            enum: "OrderStatus",
            help: "Where the order is in its lifecycle.",
          },
          {
            name: "total",
            type: "decimal",
            optional: true,
            help: "Sum of the lines at agreed prices.",
          },
        ],
      },
      {
        name: "OrderLine",
        parent: "Order",
        help: "One product at one quantity; edited inside its order.",
        attributes: [
          { name: "id", type: "uuid", pk: true },
          { name: "order_id", type: "uuid", fk: true, help: "The order this line belongs to." },
          { name: "quantity", type: "integer", help: "Units ordered; at least one." },
        ],
      },
    ],
    relationships: [
      {
        from: "Customer",
        fromCardinality: "exactly-one",
        to: "Order",
        toCardinality: "zero-or-more",
      },
      {
        from: "Order",
        fromCardinality: "exactly-one",
        to: "OrderLine",
        toCardinality: "one-or-more",
      },
    ],
    hooks: [{ entity: "Order", event: "beforeCreate", handler: "stampOrderNumber" }],
    rbac: [
      { entity: "Order", action: "delete", roles: ["manager"] },
      { entity: "Order", action: "ship", roles: ["warehouse"] },
    ],
    triggers: [{ entity: "Order", source: "cron:0 9 * * *", handler: "remindUnshipped" }],
    reports: [{ name: "open_orders", entity: "Order", sql: "SELECT count(*) FROM bus_order" }],
    rules: [
      {
        name: "LargeOrder",
        entity: "Order",
        event: "beforeCreate",
        nodes: [
          { id: "A", label: "Order received", shape: "stadium" },
          { id: "B", label: "total > 1000", shape: "diamond" },
          { id: "C", label: "Flag for review", shape: "rect" },
          { id: "D", label: "Done", shape: "stadium" },
        ],
        edges: [
          { from: "A", to: "B" },
          { from: "B", to: "C", label: "Yes" },
          { from: "B", to: "D", label: "No" },
          { from: "C", to: "D" },
        ],
        actions: [
          {
            name: "escalate",
            type: "trigger-workflow",
            when: "total > 1000",
            props: { workflow: "Escalate" },
          },
        ],
      },
    ],
    stateMachines: [
      {
        name: "OrderLifecycle",
        entity: "Order",
        states: ["draft", "submitted", "shipped"],
        initial: "draft",
        final: ["shipped"],
        transitions: [
          { from: "draft", to: "submitted", trigger: "submit" },
          { from: "submitted", to: "shipped", trigger: "ship" },
        ],
      },
    ],
    sagas: [
      {
        name: "Escalate",
        entity: "Order",
        trigger: "rule",
        operation: "UPDATE",
        steps: [
          {
            id: "open",
            type: "CreateEntity",
            properties: { entity: "Customer", fields: '{"full_name":"review"}', as: "reviewId" },
          },
          {
            id: "mark",
            type: "UpdateEntity",
            properties: {
              entity: "Order",
              field: "status",
              value: "submitted",
              targetSource: "reviewId",
            },
          },
        ],
      },
    ],
  } as ModelDocument;
}

const order = (document: ModelDocument) => document.entities[1]!;
const machine = (document: ModelDocument) => document.stateMachines![0]!;
const rule = (document: ModelDocument) => document.rules![0]!;
const saga = (document: ModelDocument) => document.sagas![0]!;

const CASES: Case[] = [
  { name: "a well-formed model", change: () => {}, expect: [] },
  {
    name: "no name",
    change: (d) => {
      delete d.name;
    },
    expect: ["EML001"],
    differs: {
      EML001:
        "the view wrote a %%meta name: for every rule and workflow title, so a model with none of its own still read as named",
    },
  },
  {
    name: "a duplicate entity",
    change: (d) => {
      d.entities.push({ ...d.entities[0]! });
    },
    expect: ["EML101"],
    differs: {
      EML101:
        "the Mermaid parser merged a repeated entity block into the first, so the view never saw two",
    },
  },
  {
    name: "an entity with no attributes",
    change: (d) => {
      d.entities.push({ name: "Tag", help: "A label a customer can attach.", attributes: [] });
    },
    expect: ["EML102"],
    differs: {
      EML102:
        "the Mermaid parser added the generated id key before the check ran, so an entity was never empty to it",
    },
  },
  {
    name: "a camelCase column",
    change: (d) => {
      order(d).attributes.push({
        name: "shipDate",
        type: "date",
        help: "When it left the warehouse.",
      });
    },
    expect: ["EML111"],
  },
  {
    name: "a duplicate column",
    change: (d) => {
      order(d).attributes.push({ name: "total", type: "decimal", help: "Duplicated." });
    },
    expect: ["EML112"],
  },
  {
    name: "two primary keys",
    change: (d) => {
      order(d).attributes.push({ name: "code", type: "string", pk: true });
    },
    expect: ["EML113"],
  },
  {
    name: "a key beside the generated one",
    change: (d) => {
      d.entities.push({
        name: "Region",
        help: "A sales territory the warehouse ships into.",
        attributes: [{ name: "code", type: "string", pk: true }],
      });
    },
    expect: ["EML113"],
  },
  {
    name: "a foreign key without _id",
    change: (d) => {
      order(d).attributes.push({
        name: "approved_by",
        type: "uuid",
        fk: true,
        help: "Who approved it.",
      });
    },
    expect: ["EML114"],
  },
  {
    name: "a reference not marked fk",
    change: (d) => {
      order(d).attributes[1]!.fk = false;
    },
    expect: ["EML119"],
  },
  {
    name: "a managed column",
    change: (d) => {
      order(d).attributes.push({ name: "created_at", type: "datetime" });
    },
    expect: ["EML103"],
  },
  {
    name: "an unknown type",
    change: (d) => {
      order(d).attributes.push({ name: "price", type: "geometry", help: "Where it ships from." });
    },
    expect: ["EML115"],
  },
  {
    name: "an optional key",
    change: (d) => {
      order(d).attributes[0]!.optional = true;
    },
    expect: ["EML116"],
  },
  {
    name: "no primary key",
    change: (d) => {
      order(d).attributes[0]!.pk = false;
    },
    expect: ["EML117"],
  },
  {
    name: "a relationship to nothing",
    change: (d) => {
      d.relationships!.push({
        from: "Supplier",
        fromCardinality: "exactly-one",
        to: "Warehouse",
        toCardinality: "zero-or-more",
      });
    },
    expect: ["EML120", "EML121"],
  },
  {
    name: "a self-reference",
    change: (d) => {
      d.relationships!.push({
        from: "Customer",
        fromCardinality: "exactly-one",
        to: "Customer",
        toCardinality: "zero-or-more",
      });
    },
    expect: ["EML123"],
  },
  {
    name: "a duplicate relationship",
    change: (d) => {
      d.relationships!.push({ ...d.relationships![0]! });
    },
    expect: ["EML124"],
  },
  {
    name: "a many side with no key",
    change: (d) => {
      order(d).attributes[1]!.fk = false;
      order(d).attributes[1]!.name = "buyer";
    },
    expect: ["EML125"],
  },
  {
    name: "a duplicate enum",
    change: (d) => {
      d.enums!.push({ name: "OrderStatus", values: ["x"] });
    },
    expect: ["EML131"],
    differs: {
      EML131:
        "the Mermaid parser kept the first enum of a name and dropped the second before the check ran",
    },
  },
  {
    name: "a duplicate enum value",
    change: (d) => {
      d.enums![0]!.values.push("draft");
    },
    expect: ["EML133"],
  },
  {
    name: "an enum value that is not a slug",
    change: (d) => {
      d.enums![0]!.values.push("on.hold");
    },
    expect: ["EML134"],
  },
  {
    name: "an undeclared enum",
    change: (d) => {
      order(d).attributes[2]!.enum = "Nowhere";
    },
    expect: ["EML144"],
  },
  {
    name: "a non-numeric bound",
    change: (d) => {
      order(d).attributes[3]!.min = "abc";
    },
    expect: ["EML145"],
  },
  {
    name: "a status with no enum",
    change: (d) => {
      delete order(d).attributes[2]!.enum;
    },
    expect: ["EML146"],
  },
  {
    name: "an index on an undeclared column",
    change: (d) => {
      order(d).indexes = [{ columns: ["customer_id", "placed_on"] }];
    },
    expect: ["EML151"],
  },
  {
    name: "an undeclared parent",
    change: (d) => {
      d.entities[2]!.parent = "Basket";
    },
    expect: ["EML147"],
  },
  {
    name: "its own parent",
    change: (d) => {
      d.entities[2]!.parent = "OrderLine";
    },
    expect: ["EML147"],
  },
  {
    name: "a parent with no key to it",
    change: (d) => {
      d.entities[2]!.parent = "Customer";
    },
    expect: ["EML148"],
  },
  {
    name: "a line item in a category",
    change: (d) => {
      d.categories![0]!.entities!.push("OrderLine");
    },
    expect: ["EML150"],
  },
  {
    name: "an undeclared line item",
    change: (d) => {
      delete d.entities[2]!.parent;
    },
    expect: ["EML149"],
  },
  {
    name: "restated help",
    change: (d) => {
      d.entities[0]!.help = "Customer is a record in the system.";
      d.entities[0]!.attributes[1]!.help = "The full name.";
    },
    expect: ["EML151"],
  },
  {
    name: "no help",
    change: (d) => {
      delete d.entities[0]!.help;
      delete d.entities[0]!.attributes[1]!.help;
    },
    expect: ["EML152", "EML153"],
  },
  {
    name: "a hook on nothing",
    change: (d) => {
      d.hooks!.push({ entity: "Invoice", event: "afterCreate", handler: "notify" });
    },
    expect: ["EML202"],
  },
  {
    name: "a hook on an undeclared column",
    change: (d) => {
      d.hooks!.push({
        entity: "Order",
        event: "beforeUpdate",
        handler: "recalc",
        fields: ["discount"],
      });
    },
    expect: ["EML203"],
  },
  {
    name: "a duplicate hook",
    change: (d) => {
      d.hooks!.push({ ...d.hooks![0]! });
    },
    expect: ["EML204"],
  },
  {
    name: "an access rule on nothing",
    change: (d) => {
      d.rbac!.push({ entity: "Invoice", action: "read", roles: ["clerk"] });
    },
    expect: ["EML213"],
  },
  {
    name: "an access rule on no operation",
    change: (d) => {
      d.rbac!.push({ entity: "Order", action: "archive", roles: ["clerk"] });
    },
    expect: ["EML214"],
  },
  {
    name: "a cron with too few fields",
    change: (d) => {
      d.triggers![0]!.source = "cron:0 9 *";
    },
    expect: ["EML231"],
  },
  {
    name: "a trigger on nothing",
    change: (d) => {
      d.triggers![0]!.entity = "Invoice";
    },
    expect: ["EML232"],
  },
  {
    name: "a duplicate report",
    change: (d) => {
      d.reports!.push({ ...d.reports![0]! });
    },
    expect: ["EML292"],
  },
  {
    name: "a report on nothing",
    change: (d) => {
      d.reports![0]!.entity = "Invoice";
    },
    expect: ["EML295"],
  },
  {
    name: "an unknown action",
    change: (d) => {
      rule(d).actions![0]!.type = "send-fax";
    },
    expect: ["EML281"],
  },
  {
    name: "an action with no condition",
    change: (d) => {
      delete rule(d).actions![0]!.when;
    },
    expect: ["EML282"],
  },
  {
    name: "an action missing a property",
    change: (d) => {
      rule(d).actions!.push({ name: "reject", type: "validation-error", when: "total < 0" });
    },
    expect: ["EML283"],
  },
  {
    name: "an action triggering nothing",
    change: (d) => {
      rule(d).actions![0]!.props = { workflow: "Nowhere" };
    },
    expect: ["EML284", "EML286"],
  },
  {
    name: "an action with an unknown property",
    change: (d) => {
      rule(d).actions![0]!.props!.priority = "high";
    },
    expect: ["EML285"],
  },
  {
    name: "a camelCase condition",
    change: (d) => {
      rule(d).actions![0]!.when = "orderTotal > 1000";
    },
    expect: ["EML287"],
  },
  {
    name: "an unknown rule event",
    change: (d) => {
      rule(d).event = "onSave";
    },
    expect: ["EML252"],
  },
  {
    name: "a rule on nothing",
    change: (d) => {
      rule(d).entity = "Invoice";
    },
    expect: ["EML307"],
  },
  {
    name: "a rule with no start",
    change: (d) => {
      rule(d).nodes[0]!.shape = "rect";
    },
    expect: ["EML300"],
  },
  {
    name: "a rule with two starts",
    change: (d) => {
      rule(d).nodes.push({ id: "E", label: "Also start", shape: "stadium" });
      rule(d).edges.push({ from: "E", to: "B" });
    },
    expect: ["EML301"],
  },
  {
    name: "a rule with no end",
    change: (d) => {
      rule(d).nodes[3]!.shape = "rect";
    },
    expect: ["EML302"],
  },
  {
    name: "a decision that does not branch",
    change: (d) => {
      rule(d).edges.splice(2, 1);
    },
    expect: ["EML303"],
  },
  {
    name: "an unlabelled branch",
    change: (d) => {
      delete rule(d).edges[1]!.label;
    },
    expect: ["EML304"],
  },
  {
    name: "an unreachable node",
    change: (d) => {
      rule(d).nodes.push({ id: "Z", label: "Orphan", shape: "rect" });
      rule(d).edges.push({ from: "Z", to: "D" });
    },
    expect: ["EML305"],
  },
  {
    name: "a rule with no nodes",
    change: (d) => {
      rule(d).nodes = [];
      rule(d).edges = [];
    },
    expect: ["EML306", "EML300", "EML302"],
  },
  {
    name: "a duplicate rule",
    change: (d) => {
      d.rules!.push(structuredClone(rule(d)));
    },
    expect: ["EML504"],
  },
  {
    name: "a duplicate rule node",
    change: (d) => {
      rule(d).nodes.push({ id: "C", label: "Again", shape: "rect" });
    },
    expect: ["EML308"],
  },
  {
    name: "an edge to an undeclared node",
    change: (d) => {
      rule(d).edges.push({ from: "C", to: "Q" });
    },
    expect: ["EML309"],
  },
  {
    name: "a state machine on nothing",
    change: (d) => {
      machine(d).entity = "Invoice";
    },
    expect: ["EML400"],
  },
  {
    name: "a state machine with no transitions",
    change: (d) => {
      machine(d).transitions = [];
      delete machine(d).initial;
      delete machine(d).final;
    },
    expect: ["EML420"],
  },
  {
    name: "no initial state",
    change: (d) => {
      delete machine(d).initial;
    },
    expect: ["EML421"],
    differs: {
      EML423:
        "without an initial state the view reported every state unreachable; EML421 already says why",
    },
  },
  {
    name: "no final state",
    change: (d) => {
      delete machine(d).final;
    },
    expect: ["EML422"],
    differs: {
      EML424:
        "without a final state the view reported every state stranded; EML422 already says why",
    },
  },
  {
    name: "an unreachable state",
    change: (d) => {
      machine(d).states.push("cancelled");
      machine(d).transitions.push({ from: "cancelled", to: "shipped", trigger: "resume" });
      d.enums![0]!.values.push("cancelled");
    },
    expect: ["EML423"],
  },
  {
    name: "a stranded state",
    change: (d) => {
      machine(d).states.push("lost");
      machine(d).transitions.push({ from: "submitted", to: "lost", trigger: "lose" });
      d.enums![0]!.values.push("lost");
    },
    expect: ["EML424"],
  },
  {
    name: "a trigger that is not an identifier",
    change: (d) => {
      machine(d).transitions[0]!.trigger = "submit now!";
    },
    expect: ["EML425"],
  },
  {
    name: "a state missing from the enum",
    change: (d) => {
      machine(d).states.push("cancelled");
      machine(d).transitions.push({ from: "submitted", to: "cancelled", trigger: "cancel" });
      machine(d).final!.push("cancelled");
    },
    expect: ["EML426"],
  },
  {
    name: "an enum value that is no state",
    change: (d) => {
      d.enums![0]!.values.push("archived");
    },
    expect: ["EML427"],
  },
  {
    name: "states with no enum",
    change: (d) => {
      d.enums = [{ name: "Colour", values: ["red"] }];
      delete order(d).attributes[2]!.enum;
    },
    expect: ["EML428", "EML146"],
  },
  {
    name: "a transition to an undeclared state",
    change: (d) => {
      machine(d).transitions.push({ from: "submitted", to: "void", trigger: "void" });
    },
    expect: ["EML429"],
    differs: { EML424: "the view invented state void", EML426: "idem" },
  },
  {
    name: "a state machine with no status column",
    change: (d) => {
      order(d).attributes.splice(2, 1);
    },
    expect: ["EML500"],
  },
  {
    name: "a duplicate workflow name",
    change: (d) => {
      saga(d).name = "OrderLifecycle";
      rule(d).actions![0]!.props = { workflow: "OrderLifecycle" };
    },
    expect: ["EML505"],
  },
  {
    name: "an unknown step type",
    change: (d) => {
      saga(d).steps[0]!.type = "SendFax";
    },
    expect: ["EML261"],
  },
  {
    name: "a step missing a property",
    change: (d) => {
      delete saga(d).steps[1]!.properties!.field;
    },
    expect: ["EML262"],
  },
  {
    name: "a step with an unknown property",
    change: (d) => {
      saga(d).steps[1]!.properties!.colour = "red";
    },
    expect: ["EML268"],
  },
  {
    name: "a step on nothing",
    change: (d) => {
      saga(d).steps[0]!.properties!.entity = "Invoice";
    },
    expect: ["EML266"],
  },
  {
    name: "an invalid field map",
    change: (d) => {
      saga(d).steps[0]!.properties!.fields = "{status:open";
    },
    expect: ["EML267"],
  },
  {
    name: "an empty field map",
    change: (d) => {
      saga(d).steps[0]!.properties!.fields = "{}";
    },
    expect: ["EML267"],
  },
  {
    name: "an invalid decision table",
    change: (d) => {
      saga(d).steps.push({
        id: "decide",
        type: "Decision",
        properties: { decisionTable: "{nope" },
      });
    },
    expect: ["EML271"],
  },
  {
    name: "an empty decision table",
    change: (d) => {
      saga(d).steps.push({
        id: "decide",
        type: "Decision",
        properties: { decisionTable: '{"outputs":[],"rules":[]}' },
      });
    },
    expect: ["EML271"],
  },
  {
    name: "an incomplete decision row",
    change: (d) => {
      saga(d).steps.push({
        id: "decide",
        type: "Decision",
        properties: {
          decisionTable: '{"outputs":[{"id":"o1","field":"tier"}],"rules":[{"_id":"r1"}]}',
        },
      });
    },
    expect: ["EML272"],
  },
  {
    name: "a decision on an undeclared rule",
    change: (d) => {
      saga(d).steps.push({ id: "decide", type: "Decision", properties: { rule: "Nowhere" } });
    },
    expect: ["EML273"],
  },
  {
    name: "an unaimed update",
    change: (d) => {
      delete saga(d).steps[1]!.properties!.targetSource;
    },
    expect: ["EML265"],
  },
  {
    name: "a variable nothing published",
    change: (d) => {
      saga(d).steps[1]!.properties!.targetSource = "ticketId";
    },
    expect: ["EML264"],
  },
  {
    name: "a duplicate step id",
    change: (d) => {
      saga(d).steps[1]!.id = "open";
    },
    expect: ["EML270"],
  },
  {
    name: "a saga with no steps",
    change: (d) => {
      saga(d).steps = [];
    },
    expect: ["EML430"],
    differs: {
      EML430:
        "the view checker stayed silent whenever the saga's entity declared a hook, a condition left from when a saga ran on hooks",
    },
  },
  {
    name: "a saga on nothing",
    change: (d) => {
      saga(d).entity = "Invoice";
    },
    expect: ["EML400"],
  },
  {
    name: "a hook diagram with no hooks",
    change: (d) => {
      d.hookDiagrams = [
        {
          name: "CustomerHooks",
          entity: "Customer",
          diagram: "flowchart TD\n    A[Request] --> B[Response]",
        },
      ];
    },
    expect: ["EML410"],
  },
];

function viewCodes(document: ModelDocument): Map<string, number> {
  const counts = new Map<string, number>();
  for (const diagnostic of checkSource(renderEmlView(document).text).issues) {
    if (RETIRED[diagnostic.code]) continue;
    counts.set(diagnostic.code, (counts.get(diagnostic.code) ?? 0) + 1);
  }
  return counts;
}

function documentCodes(document: ModelDocument): Map<string, number> {
  const counts = new Map<string, number>();
  for (const issue of checkModelDocument(document)) {
    counts.set(issue.code, (counts.get(issue.code) ?? 0) + 1);
  }
  return counts;
}

describe("the document checker, against the view checker it replaces", () => {
  for (const testCase of CASES) {
    it(testCase.name, () => {
      const document = base();
      testCase.change(document);

      const now = documentCodes(document);
      for (const code of testCase.expect) expect(now.has(code), `${code} raised`).toBe(true);

      const before = viewCodes(document);
      const codes = new Set([...before.keys(), ...now.keys()]);
      const unexplained = [...codes]
        .filter((code) => !ADDED[code] && !testCase.differs?.[code])
        .filter((code) => (before.get(code) ?? 0) !== (now.get(code) ?? 0))
        .map((code) => `${code}: view ${before.get(code) ?? 0}, document ${now.get(code) ?? 0}`);
      expect(unexplained).toEqual([]);

      // A listed difference that no longer differs is a stale explanation.
      const stale = Object.keys(testCase.differs ?? {}).filter(
        (code) => (before.get(code) ?? 0) === (now.get(code) ?? 0)
      );
      expect(stale).toEqual([]);
    });
  }
});
