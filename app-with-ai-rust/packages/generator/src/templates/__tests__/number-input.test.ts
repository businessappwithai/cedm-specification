/**
 * The generated `Input` adapter has to hand number fields to their callers in
 * the shape the callers read.
 *
 * Astryx's `NumberInput` reports a bare `number | null`; the adapter re-wraps
 * it as an event so the shadcn-era call sites keep working. `dynamic-form`
 * reads `e.target.valueAsNumber` for every integer and amount field, and the
 * synthesised event used to carry only `target.value` — so the read came back
 * `undefined`, which is not NaN, the form stored `undefined`, and
 * JSON.stringify dropped the field. Every number typed into a create or edit
 * form was discarded while the save reported success.
 *
 * The template is plain TSX, so this transpiles it and runs it with the Astryx
 * components stubbed out, then drives `onChange` the way Astryx does.
 *
 * Regression: ISSUE-002 — typed numbers were dropped from generated forms.
 * Found by /qa on 2026-09-26.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const TEMPLATE = path.join(
  import.meta.dirname,
  "../../../templates/tanstack-astryx-loco/frontend/src/components/ui/input.tsx.hbs"
);

type Element = { type: unknown; props: Record<string, unknown> };
type InputModule = {
  Input: (props: Record<string, unknown>) => Element;
  toNumberOrNull: (value: unknown) => number | null;
};

function loadTemplate(): InputModule {
  const { outputText } = ts.transpileModule(readFileSync(TEMPLATE, "utf-8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
    },
  });
  const NumberInput = function NumberInput() {};
  const TextInput = function TextInput() {};
  const stubs: Record<string, unknown> = {
    "@astryxdesign/core/NumberInput": { NumberInput },
    "@astryxdesign/core/TextInput": { TextInput },
  };
  const React = {
    createElement: (type: unknown, props: Record<string, unknown> | null): Element => ({
      type,
      props: props ?? {},
    }),
  };
  const module = { exports: {} as Record<string, unknown> };
  const require = (id: string) => {
    if (id in stubs) return stubs[id];
    throw new Error(`input.tsx imports ${id}, which this test does not stub`);
  };
  new Function("require", "module", "exports", "React", outputText)(
    require,
    module,
    module.exports,
    React
  );
  return module.exports as unknown as InputModule;
}

const { Input, toNumberOrNull } = loadTemplate();

/** What a caller's onChange receives when Astryx reports `next`. */
function changeEventFor(next: number | null) {
  let received: { target: { value: string; valueAsNumber: number } } | undefined;
  const element = Input({
    type: "number",
    name: "employee_count_floor",
    value: undefined,
    onChange: (e: typeof received) => {
      received = e;
    },
  });
  (element.props.onChange as (value: number | null) => void)(next);
  if (!received) throw new Error("the adapter did not call onChange");
  return received;
}

describe("Input adapter — number fields", () => {
  it("passes valueAsNumber through, as dynamic-form reads it", () => {
    const e = changeEventFor(25);
    expect(e.target.value).toBe("25");
    expect(e.target.valueAsNumber).toBe(25);
  });

  it("keeps a legitimate zero", () => {
    expect(changeEventFor(0).target.valueAsNumber).toBe(0);
  });

  it("reports a cleared field as NaN, the one value dynamic-form treats as empty", () => {
    const e = changeEventFor(null);
    expect(e.target.value).toBe("");
    expect(Number.isNaN(e.target.valueAsNumber)).toBe(true);
  });

  it("renders an empty field as empty, not as a 0 the form does not hold", () => {
    for (const empty of [undefined, null, ""]) {
      const element = Input({ type: "number", value: empty });
      expect(element.props.value).toBeNull();
    }
    expect(Input({ type: "number", value: 0 }).props.value).toBe(0);
    expect(Input({ type: "number", value: "12.5" }).props.value).toBe(12.5);
  });

  it("toNumberOrNull accepts what a form holds and nothing else", () => {
    expect(toNumberOrNull(7)).toBe(7);
    expect(toNumberOrNull(" 7 ")).toBe(7);
    expect(toNumberOrNull("abc")).toBeNull();
    expect(toNumberOrNull(Number.NaN)).toBeNull();
    expect(toNumberOrNull("   ")).toBeNull();
  });
});
