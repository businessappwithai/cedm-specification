import { afterEach, describe, expect, it } from "bun:test";
import { resolve } from "node:path";
import { loadConfig } from "../../gateway/config";

const PACKAGE = resolve(import.meta.dir, "../..");
const BASE: Record<string, string> = {
  CHAT_PUBLIC_ORIGIN: "https://crm.example.com",
  CHAT_DATABASE_URL: "postgres://u:p@localhost/db",
  CHAT_AUTH_SECRET: "x".repeat(40),
  CHAT_APP_API_URL: "http://backend:3000/api",
  DEEPSEEK_API_KEY: "sk-test",
};
const saved = { ...process.env };
afterEach(() => {
  for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
  Object.assign(process.env, saved);
});
const withEnv = (env: Record<string, string | undefined>) => {
  for (const [key, value] of Object.entries({ ...BASE, ...env })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
};

describe("gateway configuration", () => {
  it("loads a complete environment, with secure cookies for an https origin", () => {
    withEnv({});
    const config = loadConfig(PACKAGE);
    expect(config.basePath).toBe("/chat");
    expect(config.secureCookies).toBe(true);
    expect(config.trustProxy).toBe(false);
  });

  it("refuses to start without an auth secret, or with a short one", () => {
    withEnv({ CHAT_AUTH_SECRET: undefined });
    expect(() => loadConfig(PACKAGE)).toThrow(/CHAT_AUTH_SECRET is required/);
    withEnv({ CHAT_AUTH_SECRET: "short" });
    expect(() => loadConfig(PACKAGE)).toThrow(/at least 32 characters/);
  });

  it("names every problem at once", () => {
    withEnv({ CHAT_DATABASE_URL: undefined, DEEPSEEK_API_KEY: undefined, CHAT_APP_API_URL: "not a url" });
    expect(() => loadConfig(PACKAGE)).toThrow(/CHAT_DATABASE_URL[\s\S]*CHAT_APP_API_URL[\s\S]*DEEPSEEK_API_KEY/);
  });
});
