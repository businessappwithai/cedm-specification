/** The tools that rewrite entity files, on the text they are given. */

import { afterAll, describe, expect, mock, spyOn, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  deriveText as deriveLogic,
  executableInvariants,
} from "../derive-business-logic";
import { derive, deriveText as deriveWorkflows } from "../derive-workflows";
import { enrichText } from "../enrich-dictionary";
import { main as applyHelp } from "../help-apply";
import { cap, iconFor, kindClass, kindClasses, valueMeaning } from "../lib/dictionary";
import { itemNamed, items, openEntity } from "../lib/edit";
import { reportFailure } from "../lib/failure";
import { helpTexts, scan } from "../lib/help-shapes";
import { entityPaths, idPrefix, snake } from "../lib/library";
import { applySpans, blockEnd, indentOf, topBlockEnd, topKey } from "../lib/lines";
import { head, jsonAscii, splitWords, str } from "../lib/text";
import { parseYaml, renderDocument } from "../lib/yaml";

const temp = mkdtempSync(path.join(tmpdir(), "cedm-editing-"));
afterAll(() => rmSync(temp, { recursive: true, force: true }));

/** A minimal entity file, as an author would write one. */
const ENTITY = `entity:
  name: ServiceVisit
  kind: field_service_transaction
  ui:
    icon: wrench
  identity:
    key: serviceVisitId
    immutable: true
  attributes:
    - name: serviceVisitId
      type: uuid
      help:
        summary: The visit's identity.
        usage: Generated.
    - name: visitNumber
      type: string
    - name: startDate
      type: date
    - name: endDate
      type: date
    - name: travelCost
      type: money
    - name: discountPercent
      type: decimal
    - name: cancellationReason
      type: string
    - name: status
      type: enum
      values: [DRAFT, SCHEDULED, ON_HOLD, COMPLETED, CANCELLED]
      help:
        summary: Where the visit is.
        usage: Moved by the dispatcher.
        valueSemantics:
          DRAFT: Being planned.
  relationships:
    - name: technician
      target: Person
      cardinality: "0..1"
  help:
    summary: One visit by a technician.
    businessMeaning: The unit of field work.
specification: {version: 0.1.0, status: draft, identifier: CEDM-ENTITY-SERVICE-VISIT}
`;

describe("derive-business-logic", () => {
  test("draws a lifecycle and executable invariants, and a second run changes nothing", () => {
    const once = deriveLogic(ENTITY);
    const entity = parseYaml(once).entity;
    expect(entity.lifecycle.initial).toBe("DRAFT");
    expect(entity.lifecycle.terminal).toEqual(["COMPLETED", "CANCELLED"]);
    const rules = entity.invariants.map((i: { violatedWhen: string }) => i.violatedWhen);
    expect(rules).toContain("start_date != null and end_date != null and end_date < start_date");
    expect(rules).toContain("travel_cost != null and travel_cost < 0");
    expect(rules).toContain("discount_percent != null and (discount_percent < 0 or discount_percent > 100)");
    expect(rules).toContain('status == "CANCELLED" and cancellation_reason == null');
    expect(deriveLogic(once)).toBe(once);
    // Everything the author wrote is still there, line for line.
    for (const line of ENTITY.split("\n")) expect(once.split("\n")).toContain(line);
  });

  test("an invariant's id is the entity's prefix and a sequence", () => {
    const ids = executableInvariants(parseYaml(ENTITY).entity).map((i) => i.id);
    expect(ids[0]).toBe("SERVICE-VISIT-EXE-001");
  });

  test("a lifecycle written inline with no moves gets them, as a block", () => {
    const inline = ENTITY.replace(
      "  help:\n    summary: One visit",
      "  lifecycle: {attribute: status, states: [DRAFT, SCHEDULED, ON_HOLD, COMPLETED, CANCELLED]}\n  help:\n    summary: One visit"
    );
    const out = parseYaml(deriveLogic(inline)).entity.lifecycle;
    expect(out.transitions.length).toBeGreaterThan(0);
  });

  test("an empty terminal list is filled in place, never written twice", () => {
    const empty = ENTITY.replace(
      "  help:\n    summary: One visit",
      "  lifecycle:\n    attribute: status\n    states: [DRAFT, SCHEDULED, ON_HOLD, COMPLETED, CANCELLED]\n    terminal: []\n  help:\n    summary: One visit"
    );
    const out = deriveLogic(empty);
    expect(out.match(/ {4}terminal:/g)).toHaveLength(1);
    expect(parseYaml(out).entity.lifecycle.terminal).toEqual(["COMPLETED", "CANCELLED"]);
  });
});

describe("derive-workflows", () => {
  test("raises a task for each kind of state that needs a person, edge-triggered", () => {
    const withLifecycle = deriveLogic(ENTITY);
    const workflows = derive(parseYaml(withLifecycle).entity);
    expect(workflows.map((w) => w.name)).toEqual(["ExceptionRaised", "FollowUpRequired", "CompletionConfirmed"]);
    expect(workflows[0]?.when).toBe('status == "ON_HOLD" and status != _previous_status');
    expect(workflows[0]?.steps[0]?.properties.fields.name).toBe("Resolve service visit {{visit_number}}");
    const once = deriveWorkflows(withLifecycle);
    expect(deriveWorkflows(once)).toBe(once);
  });

  test("an entity that states its own workflows is left alone", () => {
    const authored = ENTITY.replace("  help:\n    summary: One visit", "  workflows: []\n  help:\n    summary: One visit");
    expect(deriveWorkflows(deriveLogic(authored))).toBe(deriveLogic(authored));
  });
});

describe("enrich-dictionary", () => {
  test("fills missing help and value meanings without touching what an author wrote", () => {
    const out = enrichText(ENTITY);
    const entity = parseYaml(out).entity;
    const visit = entity.attributes.find((a: { name: string }) => a.name === "visitNumber");
    expect(visit.help.summary).toBe("The visit number of the service visit: a value the business records on it.");
    expect(visit.help.requiredMeaning).toBeUndefined();
    const status = entity.attributes.find((a: { name: string }) => a.name === "status");
    expect(status.help.valueSemantics.DRAFT).toBe("Being planned.");
    expect(Object.keys(status.help.valueSemantics)).toEqual(["DRAFT", "SCHEDULED", "ON_HOLD", "COMPLETED", "CANCELLED"]);
    expect(entity.relationships[0].help.cardinalityMeaning).toBe("A service visit has at most one person in this role.");
    expect(enrichText(out)).toBe(out);
  });

  test("an entity with no ui block gets an icon chosen from its name", () => {
    const out = enrichText(ENTITY.replace("  ui:\n    icon: wrench\n", ""));
    expect(parseYaml(out).entity.ui.icon).toBe(iconFor("ServiceVisit", "field_service_transaction"));
  });
});

describe("help-apply", () => {
  test("a real batch merges cleanly in a dry run, and nothing is written", () => {
    const before = entityPaths().map((file) => readFileSync(file, "utf-8"));
    const log = spyOn(console, "log").mockImplementation(() => {});
    try {
      expect(applyHelp([path.join(import.meta.dir, "..", "help-batches", "b001.txt"), "--dry-run"])).toBe(0);
    } finally {
      log.mockRestore();
    }
    expect(entityPaths().map((file) => readFileSync(file, "utf-8"))).toEqual(before);
  });

  test("an incomplete block is refused, saying what is missing", () => {
    const batch = path.join(temp, "incomplete.txt");
    writeFileSync(batch, "@ Account\ns: Only a summary.\na notAnAttribute\ns: Says nothing.\n");
    const lines: string[] = [];
    const log = spyOn(console, "log").mockImplementation((line: string) => {
      lines.push(line);
    });
    try {
      expect(applyHelp([batch, "--dry-run"])).toBe(1);
    } finally {
      log.mockRestore();
    }
    expect(lines.join("\n")).toContain("Account.notAnAttribute: no such attribute");
  });
});

describe("editing in place", () => {
  test("a document finds its items by name, and an untouched one renders as it was read", () => {
    const file = path.join(temp, "service-visit.yaml");
    writeFileSync(file, ENTITY);
    const { document, entity } = openEntity(file);
    expect(items(entity, "attributes").length).toBe(8);
    expect(itemNamed(entity, "relationships", "technician")?.get("target")).toBe("Person");
    expect(renderDocument(document)).toBe(ENTITY);
  });
});

describe("lines", () => {
  const lines = ENTITY.split("\n");
  test("finds a top-level block and where it ends", () => {
    const at = topKey(lines, "relationships") as number;
    expect(lines[at]).toBe("  relationships:");
    expect(lines[topBlockEnd(lines, at)]).toBe("  help:");
    expect(topKey(lines, "nothing")).toBeUndefined();
    expect(indentOf("    x")).toBe(4);
    const status = lines.indexOf("      help:", lines.indexOf("    - name: status"));
    expect(lines[blockEnd(lines, status, 6)]).toBe("  relationships:");
  });

  test("spans apply last first, so earlier ones keep their places", () => {
    expect(applySpans(["a", "b", "c"], [[1, 1, ["x"]], [2, 3, ["y"]], [0, 0, ["z"]]])).toEqual(["z", "a", "x", "b", "y"]);
  });
});

describe("small pieces", () => {
  test("text helpers", () => {
    expect(str(null)).toBe("None");
    expect(str(true)).toBe("True");
    expect(str(["a"])).toBe("['a']");
    expect(splitWords("  a \n b\t")).toEqual(["a", "b"]);
    expect(head("😀😀😀", 2)).toBe("😀😀");
    expect(jsonAscii("é")).toBe('"\\u00e9"');
    expect(snake("AIModelVersion")).toBe("ai_model_version");
    expect(idPrefix("AIModelVersion")).toBe("AI-MODEL-VERSION");
  });

  test("the dictionary's rules", () => {
    expect(kindClass("sales_order_line")).toBe("line");
    expect(kindClasses(undefined)).toEqual(["entity"]);
    expect(iconFor("PurchaseInvoice", "transaction")).toBe("receipt");
    expect(valueMeaning("Account", "status", "ACTIVE")).toContain("The status of the account is active");
    expect(cap("visit")).toBe("Visit");
  });

  test("help texts carry the names their shape abstracts over", () => {
    const entity = parseYaml(ENTITY).entity;
    const texts = [...helpTexts(entity)];
    expect(texts.find((t) => t.where === "ServiceVisit.status[DRAFT]")?.own).toBe("DRAFT");
    expect(scan([entity]).rows.length).toBe(texts.length);
  });

  test("an unexpected failure is one line and exit 2", () => {
    const exit = spyOn(process, "exit").mockImplementation((() => {
      throw new Error("exited");
    }) as never);
    const error = spyOn(console, "error").mockImplementation(mock(() => {}));
    try {
      expect(() => reportFailure(new Error("x.yaml: broken\n  at line 3"))).toThrow("exited");
      const tool = process.argv[1]?.split("/").pop();
      expect(error).toHaveBeenCalledWith(`${tool}: x.yaml: broken`);
      expect(exit).toHaveBeenCalledWith(2);
    } finally {
      exit.mockRestore();
      error.mockRestore();
    }
  });
});
