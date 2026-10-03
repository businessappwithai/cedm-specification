// Regression: ISSUE-004 — every page with the assistant logged
// `Failed to construct 'URL': Invalid URL` and no message was sent.
// Found by /qa on 2026-09-26.
//
// CopilotKit's single-endpoint transport resolves requests with
// `new URL(runtimeUrl)` and no base, so the relative "/api/copilotkit" each
// provider was given threw on every call. The providers now take an absolute
// URL from `copilotRuntimeUrl()`, and pass `useSingleEndpoint` so the client
// stops probing `GET …/info`, which the single-endpoint runtime answers 405.

import { afterEach, describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { copilotRuntimeUrl } from "../runtime-url";

const SRC = join(import.meta.dir, "../../..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "__tests__" ? [] : sourceFiles(path);
    return name.endsWith(".tsx") ? [path] : [];
  });
}

const globals = globalThis as { window?: unknown };

afterEach(() => {
  delete globals.window;
});

describe("copilotRuntimeUrl", () => {
  test("is absolute in the browser, so new URL() without a base accepts it", () => {
    globals.window = { location: { origin: "http://localhost:8080" } };
    const url = copilotRuntimeUrl();
    expect(url).toBe("http://localhost:8080/api/copilotkit");
    expect(() => new URL(url)).not.toThrow();
  });

  test("is the bare path on the server, where nothing is fetched", () => {
    expect(copilotRuntimeUrl()).toBe("/api/copilotkit");
  });
});

describe("<CopilotKit> providers", () => {
  const providers = sourceFiles(SRC).flatMap((file) => {
    const source = readFileSync(file, "utf-8");
    return [...source.matchAll(/<CopilotKit\b[^>]*>/gs)].map((m) => ({
      file: relative(SRC, file),
      tag: m[0],
    }));
  });

  test("exist", () => {
    expect(providers.length).toBeGreaterThan(0);
  });

  test("take their runtime URL from copilotRuntimeUrl()", () => {
    expect(
      providers.filter((p) => !p.tag.includes("copilotRuntimeUrl()")).map((p) => p.file)
    ).toEqual([]);
  });

  test("use the single endpoint the runtime serves", () => {
    expect(
      providers.filter((p) => !/\buseSingleEndpoint\b/.test(p.tag)).map((p) => p.file)
    ).toEqual([]);
  });
});
