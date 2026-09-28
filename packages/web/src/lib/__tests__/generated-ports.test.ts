/**
 * The tool's port allocation matches what a generated app actually binds.
 *
 * `lib/generated-ports.ts` restates the pairing because it is imported by
 * client components and the generator is server-only. A restatement that
 * nothing checks is a copy waiting to drift, so this pins it.
 */

import { describe, expect, it } from "vitest";
import {
  DEFAULT_FRONTEND_PORT,
  DEFAULT_BACKEND_PORT,
  nextAvailableBackendPort,
  PORTS_PER_PROJECT,
} from "../generated-ports";

describe("generated-ports", () => {
  it("puts the frontend one above the backend, as the generator derives it", () => {
    // `generate-application.ts`: frontendPort ?? port + 1. The project's `port`
    // is the backend's; the screen someone opens is the one above it.
    expect(DEFAULT_FRONTEND_PORT).toBe(DEFAULT_BACKEND_PORT + 1);
  });

  it("reserves a pair per project, because each app binds two ports", () => {
    expect(PORTS_PER_PROJECT).toBe(2);
  });

  it("stays clear of the modelling tool's own ports", () => {
    // The tool serves on 3000 and Mastra on 4111; a generated app must not
    // land on either.
    expect(DEFAULT_BACKEND_PORT).toBeGreaterThan(3001);
    expect(DEFAULT_BACKEND_PORT).not.toBe(4111);
    expect(DEFAULT_FRONTEND_PORT).not.toBe(4111);
  });

  it("hands the first project the base pair", () => {
    expect(nextAvailableBackendPort([])).toBe(DEFAULT_BACKEND_PORT);
  });

  it("never hands out a port the previous project's API already holds", () => {
    // The bug this replaces: stepping by one gave the second project 4001,
    // which is the first project's frontend.
    const assigned: number[] = [];
    for (let i = 0; i < 5; i += 1) assigned.push(nextAvailableBackendPort(assigned));

    const claimed = assigned.flatMap((port) => [port, port + 1]);
    expect(new Set(claimed).size).toBe(claimed.length);
    expect(assigned).toEqual([4000, 4002, 4004, 4006, 4008]);
  });

  it("fills a gap left by a deleted project", () => {
    expect(nextAvailableBackendPort([4000, 4004])).toBe(4002);
  });

  it("ignores ports that were never set", () => {
    expect(nextAvailableBackendPort([undefined, null, 4000])).toBe(4002);
  });
});
