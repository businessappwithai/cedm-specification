/**
 * The conversion must produce the application the Mermaid produced.
 *
 * The fixtures are real Mermaid models from 18f5792, the last commit that read
 * them. The repository carries the YAML each became when the repository itself
 * was converted, and those have been generated from, checked and compared
 * byte for byte across both generators since — so they are the reference: a
 * stored model converted by this command must compile to exactly what its
 * checked-in YAML compiles to.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { compileModelDocument, readModelYaml } from "@appwithai/generator/model-yaml";
import { describe, expect, it } from "vitest";
import {
  type Automation,
  type AutomationKind,
  HOOK_EVENTS,
  type Loop,
  STEP_TYPES,
  TRIGGER_EVENTS,
} from "../../../automation/model";
import { automationFromYaml } from "../../../automation/yaml";
import { convertAutomation, convertModel } from "../convert";
import { parseAutomation, serializeAutomation } from "../legacy/automation.js";

const FIXTURES = path.join(__dirname, "fixtures");
const REPO = path.resolve(__dirname, "../../../../../../..");

const PAIRS: Array<[string, string]> = [
  ["crm.eml.mmd", "language/yaml/examples/crm.eml.yaml"],
  ["helpdesk.eml.mmd", "language/yaml/examples/helpdesk.eml.yaml"],
  ["minimal.eml.mmd", "language/yaml/examples/minimal.eml.yaml"],
  ["drug-discovery.eml.mmd", "examples/drug-discovery.eml.yaml"],
];

const compiled = (text: string) => {
  const read = readModelYaml(text, { check: false });
  expect(read.document, read.diagnostics.map((d) => d.message).join("\n")).toBeDefined();
  return JSON.parse(JSON.stringify(compileModelDocument(read.document!)));
};

describe("a stored Mermaid model", () => {
  for (const [fixture, reference] of PAIRS) {
    it(`${fixture} compiles to what ${reference} compiles to`, () => {
      const conversion = convertModel(readFileSync(path.join(FIXTURES, fixture), "utf8"));
      if (!conversion.ok) throw new Error(conversion.error);
      expect(compiled(conversion.yaml)).toEqual(
        compiled(readFileSync(path.join(REPO, reference), "utf8"))
      );
    });
  }

  it("keeps the author's comments on the constructs they described", () => {
    const conversion = convertModel(readFileSync(path.join(FIXTURES, "minimal.eml.mmd"), "utf8"));
    if (!conversion.ok) throw new Error(conversion.error);
    expect(conversion.yaml).toContain(
      "# EML Minimal Example — smallest complete model with all three sections."
    );
    expect(conversion.yaml).not.toContain("%%");
  });

  it("reads as a document today, with the checker's findings noted rather than fatal", () => {
    // A draft was allowed to be unfinished: a relationship to an entity that is
    // not declared checks badly but is still a model someone was writing.
    const conversion = convertModel(
      "erDiagram\n  Order {\n    uuid id PK\n  }\n  Order ||--o{ Ghost : haunts\n"
    );
    expect(conversion.ok).toBe(true);
    expect(conversion.notes.some((note) => note.startsWith("checker"))).toBe(true);
  });

  it("is refused when empty, rather than stored as a model of nothing", () => {
    expect(convertModel("  \n").ok).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */

const ENTITIES = ["Compound", "Experiment", "Sample", "Instrument", "DeviationReport"];

/** One automation of each kind per `n`, as the automations screen built them. */
function automations(count: number): Automation[] {
  let state = 424242;
  const rand = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)] as T;
  const out: Automation[] = [];
  for (let n = 1; n <= count; n++) {
    const entity = pick(ENTITIES);
    const kind = (["automation", "hook", "saga"] as const)[n % 3] as AutomationKind;
    const loop: Loop = {
      id: `l${n}`,
      condition: {
        id: `lc${n}`,
        field: `${entity.toLowerCase()}.status`,
        operator: "neq",
        value: "done",
      },
      maxPasses: String(1 + (n % 9)),
    };
    out.push({
      id: `a${n}`,
      name: `Stored ${n}`,
      kind,
      trigger: { entity, event: pick(TRIGGER_EVENTS) },
      conditions: [
        {
          id: `c${n}`,
          field: `${entity.toLowerCase()}.status`,
          operator: "eq",
          value: `state-${n}`,
        },
      ],
      loops: kind === "automation" ? [loop] : [],
      steps: STEP_TYPES.map((type, i) => ({
        id: `s${n}_${i}`,
        type,
        resultName: `r${n}_${i}`,
        props: { ruleTable: "Assay tier", entity, field: "status", value: `v${i}`, url: "u" },
        ...(kind === "automation" && i === 1 ? { loopId: loop.id } : {}),
      })),
      hooks:
        kind === "hook"
          ? [
              { id: `h${n}a`, event: pick(HOOK_EVENTS), handler: `handle${n}` },
              { id: `h${n}b`, event: "customValidate", handler: `check${n}`, field: "status" },
            ]
          : [],
      ...(kind === "saga"
        ? { sagaTrigger: n % 2 ? "rule" : "automatic", sagaOperation: "UPDATE" }
        : {}),
      status: "draft",
    } as Automation);
  }
  return out;
}

/** An automation without the ids a reader mints. */
const shape = (a: Automation) => {
  const { id: _id, ...rest } = a;
  return JSON.parse(JSON.stringify(rest, (key, value) => (key === "id" ? undefined : value)));
};

describe("a stored automation", () => {
  it("converts, for 90 automations of every kind, to exactly what the tool read from its Mermaid", () => {
    const mismatches: string[] = [];
    for (const automation of automations(90)) {
      const stored = serializeAutomation(automation);
      const conversion = convertAutomation(stored, automation.name, automation.trigger.entity);
      if (!conversion.ok) {
        mismatches.push(`${automation.name}: ${conversion.error}`);
        continue;
      }
      const read = { ...parseAutomation(stored, automation.trigger.entity), name: automation.name };
      if (!isDeepStrictEqual(shape(automationFromYaml(conversion.yaml)), shape(read)))
        mismatches.push(automation.name);
    }
    expect(mismatches).toEqual([]);
  });

  it("is refused, naming the lines, when the reader would drop part of it", () => {
    const [automation] = automations(1);
    const stored = `${serializeAutomation(automation!)}\n    X[Posted to the audit channel] --> Y{Escalate?}`;
    const conversion = convertAutomation(stored, automation!.name, automation!.trigger.entity);
    expect(conversion.ok).toBe(false);
    if (!conversion.ok)
      expect(conversion.error).toContain("X[Posted to the audit channel] --> Y{Escalate?}");
  });
});

describe("the vendored readers", () => {
  it("are the files README.md records, unedited", () => {
    const readme = readFileSync(path.join(__dirname, "../legacy/README.md"), "utf8");
    for (const file of ["eml.js", "automation.js"]) {
      const bytes = readFileSync(path.join(__dirname, "../legacy", file));
      const recorded = new RegExp(
        `\\| \`${file.replace(".", "\\.")}\` \\|[^|]+\\| \`([0-9a-f]{64})\``
      ).exec(readme)?.[1];
      expect(recorded, `${file} has no digest in README.md`).toBeDefined();
      expect(createHash("sha256").update(bytes).digest("hex"), file).toBe(recorded);
    }
  });
});
