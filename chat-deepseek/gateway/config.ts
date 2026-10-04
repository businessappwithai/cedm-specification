/**
 * The gateway's configuration, read once and checked before anything listens.
 *
 * A missing secret or a malformed URL stops the process with a sentence naming
 * the variable. There are no fallbacks for anything that protects someone: a
 * chat that starts with a default signing key is a chat anyone can sign in to.
 */

import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

export interface GatewayConfig {
  /** Public origin and mount, e.g. `https://crm.example.com` and `/chat`. */
  publicOrigin: string;
  basePath: string;
  /** Where the browser-facing server listens. */
  host: string;
  port: number;
  /** Loopback listener for the Harness hosts' tool calls. Never published. */
  internalPort: number;
  /** The gateway's own database (sessions, view ids), and its schema. */
  databaseUrl: string;
  databaseSchema: string;
  /** Better Auth secret; also the root of the reference and credential keys. */
  authSecret: string;
  /** The generated application's API, as the gateway reaches it, and its public mount. */
  appApiUrl: string;
  appPublicPath: string;
  /** The reporting platform's API and public mount. Optional: an application can run without it. */
  reportApiUrl: string | null;
  reportPublicPath: string;
  /** Ed25519 private key (PKCS#8 PEM) the gateway signs reporting assertions with. */
  ssoSigningKey: string | null;
  /** Node, which runs each Harness host; the Harness installation, patch, skills and instructions. */
  nodeBin: string;
  dshBin: string;
  businessPatch: string;
  pluginsDir: string;
  skillsDir: string;
  agentsFile: string;
  /** Where each person's Harness home lives. */
  dataDir: string;
  /** DeepSeek, passed to hosts only. */
  deepseekApiKey: string;
  deepseekBaseUrl: string | null;
  deepseekModel: string | null;
  /** Host lifecycle. */
  hostPortRange: [number, number];
  hostIdleMinutes: number;
  hostHeapMb: number;
  maxHosts: number;
  hostStartTimeoutMs: number;
  viewTtlSeconds: number;
  secureCookies: boolean;
  /** True behind a reverse proxy that sets X-Forwarded-For; false trusts only the socket. */
  trustProxy: boolean;
}

class ConfigError extends Error {}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new ConfigError(`${name} is required`);
  return value;
}

function optional(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function integer(name: string, fallback: number, min: number, max: number): number {
  const raw = optional(name);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ConfigError(`${name} must be an integer from ${min} to ${max}, got ${raw}`);
  }
  return value;
}

function url(name: string, value: string): string {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
    return value.replace(/\/+$/, "");
  } catch {
    throw new ConfigError(`${name} must be an http(s) URL, got ${value}`);
  }
}

function mount(name: string, value: string): string {
  if (!/^\/[A-Za-z0-9._~/-]*$/.test(value)) throw new ConfigError(`${name} must be a path like /chat, got ${value}`);
  return value === "/" ? "" : value.replace(/\/+$/, "");
}

function path(name: string, value: string, mustExist: boolean): string {
  const absolute = isAbsolute(value) ? value : resolve(process.cwd(), value);
  if (mustExist && !existsSync(absolute)) throw new ConfigError(`${name} points at ${absolute}, which does not exist`);
  return absolute;
}

/**
 * Read the configuration from the environment.
 * @param packageDir - the chat-deepseek directory, for the paths it ships.
 */
export function loadConfig(packageDir: string): GatewayConfig {
  const errors: string[] = [];
  const attempt = <T>(fn: () => T): T | undefined => {
    try {
      return fn();
    } catch (error) {
      if (error instanceof ConfigError) {
        errors.push(error.message);
        return undefined;
      }
      throw error;
    }
  };

  const authSecret = attempt(() => {
    const secret = required("CHAT_AUTH_SECRET");
    if (secret.length < 32) throw new ConfigError("CHAT_AUTH_SECRET must be at least 32 characters");
    return secret;
  });
  const portRange = attempt(() => {
    const raw = optional("CHAT_HOST_PORTS") ?? "41000-41999";
    const match = /^(\d+)-(\d+)$/.exec(raw);
    const low = Number(match?.[1]);
    const high = Number(match?.[2]);
    if (!match || low < 1024 || high > 65535 || low >= high) {
      throw new ConfigError(`CHAT_HOST_PORTS must be a range like 41000-41999, got ${raw}`);
    }
    return [low, high] as [number, number];
  });

  const config = {
    publicOrigin: attempt(() => url("CHAT_PUBLIC_ORIGIN", required("CHAT_PUBLIC_ORIGIN"))),
    basePath: attempt(() => mount("CHAT_BASE_PATH", optional("CHAT_BASE_PATH") ?? "/chat")),
    host: optional("CHAT_HOST") ?? "0.0.0.0",
    port: attempt(() => integer("CHAT_PORT", 3100, 1, 65535)),
    internalPort: attempt(() => integer("CHAT_INTERNAL_PORT", 3101, 1, 65535)),
    databaseUrl: attempt(() => required("CHAT_DATABASE_URL")),
    databaseSchema: attempt(() => {
      const schema = optional("CHAT_DATABASE_SCHEMA") ?? "chat";
      if (!/^[a-z_][a-z0-9_]{0,62}$/.test(schema)) throw new ConfigError(`CHAT_DATABASE_SCHEMA must be a lowercase identifier, got ${schema}`);
      return schema;
    }),
    authSecret,
    appApiUrl: attempt(() => url("CHAT_APP_API_URL", required("CHAT_APP_API_URL"))),
    appPublicPath: attempt(() => mount("CHAT_APP_PUBLIC_PATH", optional("CHAT_APP_PUBLIC_PATH") ?? "/app")),
    reportApiUrl: attempt(() => {
      const value = optional("CHAT_REPORT_API_URL");
      return value === null ? null : url("CHAT_REPORT_API_URL", value);
    }),
    reportPublicPath: attempt(() => mount("CHAT_REPORT_PUBLIC_PATH", optional("CHAT_REPORT_PUBLIC_PATH") ?? "/report")),
    ssoSigningKey: optional("SSO_SIGNING_KEY")?.replace(/\\n/g, "\n") ?? null,
    nodeBin: optional("CHAT_NODE_BIN") ?? "node",
    dshBin: attempt(() =>
      path("CHAT_DSH_BIN", optional("CHAT_DSH_BIN") ?? `${packageDir}/node_modules/@deepseek-ai/dsh/lib/bin.js`, true)
    ),
    businessPatch: attempt(() => path("CHAT_BUSINESS_PATCH", `${packageDir}/profile/business.patch.yml`, true)),
    pluginsDir: attempt(() => path("CHAT_PLUGINS_DIR", `${packageDir}/plugins`, true)),
    skillsDir: attempt(() => path("CHAT_SKILLS_DIR", optional("CHAT_SKILLS_DIR") ?? `${packageDir}/skills`, true)),
    agentsFile: attempt(() => path("CHAT_AGENTS_FILE", optional("CHAT_AGENTS_FILE") ?? `${packageDir}/AGENTS.md`, true)),
    dataDir: attempt(() => path("CHAT_DATA_DIR", optional("CHAT_DATA_DIR") ?? `${packageDir}/.data`, false)),
    deepseekApiKey: attempt(() => required("DEEPSEEK_API_KEY")),
    deepseekBaseUrl: attempt(() => {
      const value = optional("DEEPSEEK_BASE_URL");
      return value === null ? null : url("DEEPSEEK_BASE_URL", value);
    }),
    deepseekModel: optional("CHAT_DEEPSEEK_MODEL"),
    hostPortRange: portRange,
    hostIdleMinutes: attempt(() => integer("CHAT_HOST_IDLE_MINUTES", 30, 1, 24 * 60)),
    hostHeapMb: attempt(() => integer("CHAT_HOST_HEAP_MB", 256, 96, 8192)),
    maxHosts: attempt(() => integer("CHAT_MAX_HOSTS", 0, 0, 10000)),
    hostStartTimeoutMs: attempt(() => integer("CHAT_HOST_START_TIMEOUT_MS", 60000, 5000, 600000)),
    viewTtlSeconds: attempt(() => integer("CHAT_VIEW_TTL_SECONDS", 600, 30, 86400)),
    trustProxy: optional("CHAT_TRUST_PROXY") === "1",
    secureCookies: attempt(() => {
      const origin = optional("CHAT_PUBLIC_ORIGIN");
      return origin?.startsWith("https://") ?? false;
    }),
  };

  if (errors.length > 0) {
    throw new Error(`The chat gateway cannot start:\n  - ${errors.join("\n  - ")}`);
  }
  return config as GatewayConfig;
}
