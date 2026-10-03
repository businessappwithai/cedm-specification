/**
 * What the logger promises, held to it.
 *
 * Every case here reads the JSON the logger actually wrote rather than spying
 * on Pino. A logging layer that is asserted through its own mock passes just as
 * happily when it emits nothing at all, which is the failure mode that matters:
 * nobody notices missing logs until the night they are needed.
 */

import { Writable } from "node:stream";
import { beforeEach, describe, expect, it } from "vitest";

import { clearLoggerCache, getLogger } from "../logger";
import { findEvent, logSpec, profileFor, resolveLevel } from "../spec";

/** Collects the newline-delimited JSON Pino writes, one object per line. */
function capture(): { stream: Writable; lines: () => Array<Record<string, unknown>> } {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(String(chunk));
      callback();
    },
  });
  return {
    stream,
    lines: () =>
      chunks
        .join("")
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line) => JSON.parse(line) as Record<string, unknown>),
  };
}

const PROD = { NODE_ENV: "production" } as NodeJS.ProcessEnv;

beforeEach(() => {
  clearLoggerCache();
});

describe("the spec drives the line", () => {
  it("takes level, message and channel from the spec, not the call site", () => {
    const sink = capture();
    const log = getLogger("pipeline", { env: PROD, destination: sink.stream });

    log.event("pipeline.generation.completed", { project: "acme", files: 413, durationMs: 1200 });

    const [line] = sink.lines();
    const declared = findEvent("pipeline.generation.completed");
    expect(declared).toBeDefined();
    expect(line).toMatchObject({
      level: declared?.level,
      msg: declared?.message,
      channel: "pipeline",
      event: "pipeline.generation.completed",
      project: "acme",
      files: 413,
    });
  });

  it("emits the level names, not Pino's numbers", () => {
    const sink = capture();
    getLogger("db", { env: PROD, destination: sink.stream }).event("db.pool.opened", {
      host: "localhost",
      database: "appwithai",
      max: 10,
    });

    expect(sink.lines()[0]?.level).toBe("info");
  });

  it("writes an ISO-8601 timestamp", () => {
    const sink = capture();
    getLogger("db", { env: PROD, destination: sink.stream }).event("db.pool.opened", {
      host: "localhost",
      database: "appwithai",
      max: 10,
    });

    const time = sink.lines()[0]?.time;
    expect(typeof time).toBe("string");
    expect(new Date(String(time)).toISOString()).toBe(time);
  });

  it("covers error, warning and informational events from one catalogue", () => {
    const sink = capture();
    const auth = getLogger("auth", { env: PROD, destination: sink.stream });

    auth.event("auth.signin.succeeded", { userId: "u1" });
    auth.event("auth.signin.refused", { reason: "wrong-password" });
    auth.event("auth.request.failed", { route: "auth/login", reason: "boom" });

    expect(sink.lines().map((line) => line.level)).toEqual(["info", "warn", "error"]);
  });
});

describe("a mistake in a call site is loud, never silent", () => {
  it("reports an undeclared event id at warn and keeps the fields", () => {
    const sink = capture();
    getLogger("app", { env: PROD, destination: sink.stream }).event("app.no.such.event", {
      port: 4001,
    });

    const [line] = sink.lines();
    expect(line).toMatchObject({
      level: "warn",
      logSpecViolation: "unknown-event-id",
      event: "app.no.such.event",
      port: 4001,
    });
  });

  it("still emits when a declared field is missing, and marks the gap", () => {
    const sink = capture();
    getLogger("db", { env: PROD, destination: sink.stream }).event("db.pool.opened", {
      host: "localhost",
    });

    const [line] = sink.lines();
    expect(line?.level).toBe("info");
    expect(line?.logSpecMissingFields).toEqual(["database", "max"]);
  });
});

describe("redaction", () => {
  it("censors a credential wherever it appears in the payload", () => {
    const sink = capture();
    getLogger("auth", { env: PROD, destination: sink.stream }).event("auth.signin.refused", {
      email: "user@example.com",
      ip: "10.0.0.1",
      reason: "bad-credentials",
      password: "hunter2",
      token: "eyJhbGciOi",
    });

    const [line] = sink.lines();
    expect(line?.password).toBe(logSpec.redact.censor);
    expect(line?.token).toBe(logSpec.redact.censor);
    // The fields that make the line worth having survive.
    expect(line?.email).toBe("user@example.com");
    expect(line?.reason).toBe("bad-credentials");
    expect(JSON.stringify(line)).not.toContain("hunter2");
  });

  it("censors nested credentials", () => {
    const sink = capture();
    getLogger("auth", { env: PROD, destination: sink.stream }).event("auth.request.failed", {
      route: "auth/login",
      reason: "upstream refused",
      body: { password: "hunter2", email: "user@example.com" },
    });

    expect(JSON.stringify(sink.lines()[0])).not.toContain("hunter2");
  });
});

describe("levels resolve from the spec and the environment", () => {
  it("clamps a debug channel to info in production", () => {
    expect(resolveLevel("ai", { NODE_ENV: "production" } as NodeJS.ProcessEnv)).toBe("info");
  });

  it("gives a debug channel its detail in development", () => {
    expect(resolveLevel("ai", { NODE_ENV: "development" } as NodeJS.ProcessEnv)).toBe("debug");
  });

  it("keeps an info-only channel quiet even in development", () => {
    expect(resolveLevel("db", { NODE_ENV: "development" } as NodeJS.ProcessEnv)).toBe("info");
  });

  it("lets an operator turn one channel up without touching the rest", () => {
    const env = { NODE_ENV: "production", LOG_LEVEL_DB: "debug" } as NodeJS.ProcessEnv;
    expect(resolveLevel("db", env)).toBe("debug");
    expect(resolveLevel("auth", env)).toBe("info");
  });

  it("treats an unknown NODE_ENV as production rather than development", () => {
    const profile = profileFor("qa-sandbox");
    expect(profile).toEqual(logSpec.environments.production);
  });

  it("is silent under test, so a suite is not drowned by its own subject", () => {
    expect(resolveLevel("db", { NODE_ENV: "test" } as NodeJS.ProcessEnv)).toBe("silent");
  });

  it("actually drops a line below the resolved level", () => {
    const sink = capture();
    const log = getLogger("ai", {
      env: { NODE_ENV: "production" } as NodeJS.ProcessEnv,
      destination: sink.stream,
    });

    // debug in the spec, clamped to info by production.
    log.event("ai.model.requested", { model: "qwen", operation: "domain-analysis" });
    log.event("ai.model.failed", { model: "qwen", operation: "domain-analysis", reason: "no" });

    expect(sink.lines().map((line) => line.event)).toEqual(["ai.model.failed"]);
  });
});

describe("child loggers", () => {
  it("carries its bindings onto every line", () => {
    const sink = capture();
    const request = getLogger("pipeline", { env: PROD, destination: sink.stream }).child({
      requestId: "abc-123",
      userId: "u-1",
    });

    request.event("pipeline.generation.completed", {
      project: "acme",
      files: 17,
      durationMs: 3,
    });

    expect(sink.lines()[0]).toMatchObject({ requestId: "abc-123", userId: "u-1" });
  });
});
