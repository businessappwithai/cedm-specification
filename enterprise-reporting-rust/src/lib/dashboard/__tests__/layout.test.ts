import { describe, expect, test } from "bun:test";
import { applyLayoutEdits, isSameLayout, resolveDashboardLayout } from "../layout";

const lg = (items: object[]) => JSON.stringify({ layouts: { lg: items } });

describe("resolveDashboardLayout", () => {
  test("uses the dashboard's saved layout", () => {
    const layout = resolveDashboardLayout(lg([{ i: "a", x: 6, y: 0, w: 6, h: 4 }]), [
      { id: "a", position_config: JSON.stringify({ x: 0, y: 0, w: 2, h: 2 }) },
    ]);
    expect(layout).toEqual([{ i: "a", x: 6, y: 0, w: 6, h: 4, minW: 2, minH: 2 }]);
  });

  test("falls back to the widget's position for a widget added after the last save", () => {
    const layout = resolveDashboardLayout(lg([{ i: "a", x: 0, y: 0, w: 6, h: 4 }]), [
      { id: "a" },
      { id: "b", position_config: JSON.stringify({ x: 6, y: 0, w: 6, h: 3, minW: 3 }) },
    ]);
    expect(layout[1]).toEqual({ i: "b", x: 6, y: 0, w: 6, h: 3, minW: 3, minH: 2 });
  });

  test("accepts position_config already parsed (JSONB) as well as a string", () => {
    const [item] = resolveDashboardLayout(null, [
      { id: "a", position_config: { x: 1, y: 2, w: 3, h: 4 } },
    ]);
    expect(item).toMatchObject({ x: 1, y: 2, w: 3, h: 4 });
  });

  test("never yields 1×1: an unplaced widget gets the default size below the rest", () => {
    const layout = resolveDashboardLayout(lg([{ i: "a", x: 0, y: 0, w: 12, h: 5 }]), [
      { id: "a" },
      { id: "b", position_config: "not json" },
      { id: "c" },
    ]);
    expect(layout[1]).toEqual({ i: "b", x: 0, y: 5, w: 4, h: 4, minW: 2, minH: 2 });
    expect(layout[2]).toMatchObject({ i: "c", y: 9, w: 4, h: 4 });
  });

  test("drops saved entries for widgets that no longer exist", () => {
    const layout = resolveDashboardLayout(
      lg([
        { i: "gone", x: 0, y: 0, w: 6, h: 4 },
        { i: "a", x: 6, y: 0, w: 6, h: 4 },
      ]),
      [{ id: "a" }]
    );
    expect(layout.map((item) => item.i)).toEqual(["a"]);
  });

  test("tolerates a malformed layout_config", () => {
    expect(resolveDashboardLayout("{", [{ id: "a" }])[0]).toMatchObject({ w: 4, h: 4 });
  });
});

describe("applyLayoutEdits / isSameLayout", () => {
  const base = resolveDashboardLayout(null, [
    { id: "a", position_config: { x: 0, y: 0, w: 6, h: 4 } },
    { id: "b", position_config: { x: 6, y: 0, w: 6, h: 4 } },
  ]);

  test("applies edits by id and ignores edits for removed widgets", () => {
    const edited = applyLayoutEdits(base, [
      { i: "a", x: 0, y: 0, w: 12, h: 4 },
      { i: "removed", x: 0, y: 9, w: 2, h: 2 },
    ]);
    expect(edited.map((item) => [item.i, item.w])).toEqual([
      ["a", 12],
      ["b", 6],
    ]);
  });

  test("a layout the grid reports back unchanged is not a change", () => {
    const reported = [...base].reverse().map(({ minW: _w, minH: _h, ...item }) => item);
    expect(isSameLayout(base, reported)).toBe(true);
    expect(isSameLayout(base, applyLayoutEdits(base, [{ i: "b", x: 6, y: 0, w: 6, h: 5 }]))).toBe(
      false
    );
  });
});
