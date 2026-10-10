/** The pieces the tools are built from, each on the cases that once went wrong. */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { deflateRawSync } from "node:zlib";
import { parse } from "yaml";
import { lifecycleOf } from "../derive-business-logic";
import { parseBatch } from "../help-apply";
import { lowerWords, words } from "../lib/dictionary";
import { fillerRows, legacyShapes, shape } from "../lib/help-shapes";
import { entityPaths } from "../lib/library";
import { flowScalar, isBlockPlainSafe } from "../lib/scalar";
import { fixed, repr } from "../lib/text";
import { Wheel } from "../lib/wheel";
import { parseYaml, readDocument, renderDocument } from "../lib/yaml";
import { repairLine } from "../repair-flow-text";

describe("reading and writing YAML", () => {
  test("every entity file round-trips byte for byte, so an edit touches only its own lines", () => {
    const changed = entityPaths().filter((file) => renderDocument(readDocument(file)) !== readFileSync(file, "utf-8"));
    expect(changed).toEqual([]);
  });

  test("an unquoted ON is text, as the generators read it (YAML 1.2)", () => {
    expect(parseYaml("values: [ON, OFF, YES, NO]").values).toEqual(["ON", "OFF", "YES", "NO"]);
  });

  test("a duplicate key is refused, naming the file", () => {
    expect(() => parseYaml("a: 1\na: 2\n", "x.yaml")).toThrow(/^x\.yaml: Map keys must be unique/);
  });
});

describe("writing a scalar by hand", () => {
  test("identifiers stay plain", () => {
    for (const value of ["ACTIVE", "IN_PROGRESS", "N/A"]) expect(flowScalar(value)).toBe(value);
  });

  test("anything another reader would take for something else is quoted", () => {
    for (const value of ["ON", "no", "~", "null", "1", "01", "1.0", "2024-01-01", "1:30", "a: b", "-x", "#x", "it's", "[x]", ""]) {
      const written = flowScalar(value);
      expect(written).not.toBe(value);
      expect(parse(`[${written}]`)).toEqual([value]);
    }
  });

  test("block values may hold commas and brackets, never ': ' or ' #'", () => {
    expect(isBlockPlainSafe("Fee {{id}}, then [review]")).toBe(true);
    expect(isBlockPlainSafe("a: b")).toBe(false);
    expect(isBlockPlainSafe("a #b")).toBe(false);
    expect(isBlockPlainSafe("yes")).toBe(false);
  });
});

describe("help shapes (HELP-001)", () => {
  test("names become placeholders: entity, own name and targets", () => {
    expect(shape("The code of the sales order line.", "SalesOrderLine", "code", [])).toBe("The @ of #.");
    expect(shape("Links to the StateProvince of the address.", "Address", "region", ["StateProvince"])).toBe(
      "Links to # of #."
    );
  });

  test("a letter outside ASCII is part of a word, so a name inside one is not swapped", () => {
    expect(shape("Café menu", "Caf", null, [])).toBe("Café menu");
  });

  test("text stamped from a legacy template is filler, however few entities carry it", () => {
    const legacy = legacyShapes();
    const template = [...legacy].find((s) => s.startsWith("# is a business concept"));
    expect(template).toBeDefined();
    const text = (template as string).replace("#", "Widget");
    const rows = [{ where: "Widget", key: "businessMeaning", shape: shape(text, "Widget", null, []), value: text }];
    expect(fillerRows(rows, legacy)).toHaveLength(1);
  });
});

describe("repairing text a flow mapping split", () => {
  test("fragments are folded back into the text before them, and the line quoted", () => {
    expect(repairLine("    - {id: X-1, rule: requires customer, currency, product and tax context.}")).toBe(
      '    - {id: X-1, rule: "requires customer, currency, product and tax context."}'
    );
  });

  test("a value that is not text is written back exactly as it was spelled", () => {
    expect(repairLine("    - {id: X-2, weight: 1.0, rule: a, b, flag: true}")).toBe(
      '    - {id: X-2, weight: 1.0, rule: "a, b", flag: true}'
    );
  });

  test("words YAML 1.1 read as booleans are text", () => {
    expect(repairLine("    - {id: X-3, rule: yes, no}")).toBe('    - {id: X-3, rule: "yes, no"}');
  });

  test("an intact line is left alone, and a fragment with nothing before it is refused", () => {
    expect(repairLine('    - {id: X-4, rule: "quoted, fine"}')).toBeNull();
    expect(() => repairLine("    - {a: null}")).toThrow("fragments with no text before them");
  });
});

describe("deriving a lifecycle from status values", () => {
  test("a run, a detour and two ends", () => {
    const plan = lifecycleOf(["DRAFT", "ACTIVE", "SUSPENDED", "COMPLETED", "CANCELLED"]);
    expect(plan?.initial).toBe("DRAFT");
    expect(plan?.terminal).toEqual(["COMPLETED", "CANCELLED"]);
    expect(plan?.transitions).toContainEqual(["ACTIVE", "SUSPENDED", "suspend"]);
    expect(plan?.transitions).toContainEqual(["SUSPENDED", "ACTIVE", "resume"]);
    // A terminal state has no way out.
    expect(plan?.transitions.some(([from]) => from === "COMPLETED" || from === "CANCELLED")).toBe(false);
  });

  test("one value is not a lifecycle", () => {
    expect(lifecycleOf(["ACTIVE"])).toBeNull();
  });
});

describe("help batches", () => {
  test("entity, attribute, value and relationship lines, with continuations", () => {
    const batch = parseBatch(
      "@ Account\ns: A ledger account.\n  It holds postings.\na status\nv ACTIVE: Open.\nr parent\nn: At most one.\n"
    );
    const block = batch.get("Account");
    expect(block?.help.summary).toBe("A ledger account. It holds postings.");
    expect(block?.attrs.get("status")?.valueSemantics).toEqual({ ACTIVE: "Open." });
    expect(block?.rels.get("parent")?.cardinalityMeaning).toBe("At most one.");
  });
});

describe("text", () => {
  test("words reads names the way a person says them", () => {
    expect(words("SalesOrderLine")).toBe("Sales Order Line");
    expect(words("PARTIALLY_FILLED")).toBe("Partially Filled");
    expect(lowerWords("AIModel")).toBe("ai model");
  });

  test("fixed rounds ties to even on the exact value", () => {
    expect(fixed(0.25, 1)).toBe("0.2");
    expect(fixed(0.35, 1)).toBe("0.3"); // 0.35 is a little under, as a double
    expect(fixed(12.5, 0)).toBe("12");
    expect(fixed(13.5, 0)).toBe("14");
    expect(fixed(100, 1)).toBe("100.0");
    expect(fixed(-1.25, 1)).toBe("-1.2");
  });

  test("repr quotes the way messages always have", () => {
    expect(repr("flask")).toBe("'flask'");
    expect(repr(["A", null])).toBe("['A', None]");
    expect(repr("it's")).toBe('"it\'s"');
  });
});

describe("reading a wheel", () => {
  /** A zip archive holding `entries`, the first stored and the rest deflated. */
  function zip(entries: Record<string, string>): Buffer {
    const locals: Buffer[] = [];
    const centrals: Buffer[] = [];
    let offset = 0;
    Object.entries(entries).forEach(([name, text], index) => {
      const raw = Buffer.from(text);
      const method = index === 0 ? 0 : 8;
      const data = method === 0 ? raw : deflateRawSync(raw);
      const fileName = Buffer.from(name);
      const local = Buffer.alloc(30);
      local.writeUInt32LE(0x04034b50, 0);
      local.writeUInt16LE(method, 8);
      local.writeUInt32LE(data.length, 18);
      local.writeUInt32LE(raw.length, 22);
      local.writeUInt16LE(fileName.length, 26);
      const central = Buffer.alloc(46);
      central.writeUInt32LE(0x02014b50, 0);
      central.writeUInt16LE(method, 10);
      central.writeUInt32LE(data.length, 20);
      central.writeUInt32LE(raw.length, 24);
      central.writeUInt16LE(fileName.length, 28);
      central.writeUInt32LE(offset, 42);
      locals.push(local, fileName, data);
      centrals.push(central, fileName);
      offset += 30 + fileName.length + data.length;
    });
    const directory = Buffer.concat(centrals);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(Object.keys(entries).length, 8);
    end.writeUInt16LE(Object.keys(entries).length, 10);
    end.writeUInt32LE(directory.length, 12);
    end.writeUInt32LE(offset, 16);
    return Buffer.concat([...locals, directory, end]);
  }

  test("stored and deflated entries read back as written", () => {
    const wheel = new Wheel(zip({ "a/stored.json": '{"x": 1}', "a/deflated.json": "é".repeat(500) }));
    expect(wheel.text("a/stored.json")).toBe('{"x": 1}');
    expect(wheel.text("a/deflated.json")).toBe("é".repeat(500));
    expect(() => wheel.text("missing")).toThrow("the wheel has no missing");
  });

  test("something that is not a zip is refused", () => {
    expect(() => new Wheel(Buffer.from("not a zip at all, just text"))).toThrow("not a zip archive");
  });
});
