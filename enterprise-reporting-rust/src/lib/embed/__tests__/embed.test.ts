import { describe, expect, it } from "bun:test";
import { isEmbeddableRequest } from "../embed";

describe("which pages the chat may frame", () => {
  it("a report viewer opened with ?embed=1", () => {
    expect(isEmbeddableRequest("/reports/abc123/viewer", "?embed=1")).toBe(true);
  });

  it("a chart viewer opened with ?embed=1, the chart a report card shows", () => {
    expect(isEmbeddableRequest("/charts/viewer/abc123", "?embed=1")).toBe(true);
    expect(isEmbeddableRequest("/charts/viewer/abc123", "")).toBe(false);
  });

  it("not the same page opened normally", () => {
    expect(isEmbeddableRequest("/reports/abc123/viewer", "")).toBe(false);
    expect(isEmbeddableRequest("/reports/abc123/viewer", "?embed=0")).toBe(false);
  });

  it("no other page, whatever it asks for", () => {
    for (const path of [
      "/reports/abc123/editor",
      "/users",
      "/settings",
      "/sql-editor",
      "/reports",
      "/charts",
      "/charts/editor/abc123",
    ]) {
      expect(isEmbeddableRequest(path, "?embed=1")).toBe(false);
    }
  });

  it("not a path that only resembles the viewer", () => {
    expect(isEmbeddableRequest("/reports/a/b/viewer", "?embed=1")).toBe(false);
    expect(isEmbeddableRequest("/x/reports/abc/viewer", "?embed=1")).toBe(false);
    expect(isEmbeddableRequest("/charts/viewer/a/b", "?embed=1")).toBe(false);
  });
});
