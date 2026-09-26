/**
 * The generated application, running.
 *
 * Everything up to here reads files. This module compiles the generated crate,
 * migrates and seeds a database, starts the server and hands the specs a base
 * URL and a token — because a seed row and a working screen are different
 * claims, and only the second one is the product. Most of the defects this
 * repository has shipped were invisible to a file-level assertion: a rule bound
 * to the wrong name still seeds, a column type `row_json` cannot decode still
 * returns `null`, an unguarded route still compiles.
 *
 * It runs from the main process (a vitest `globalSetup`), so the address and
 * the token reach the workers through the environment they inherit.
 */

import { execFile, spawn, type ChildProcess } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { promisify } from "node:util";
import { OUTPUT_DIR, PROJECT_NAME } from "./fixture";

const exec = promisify(execFile);

/** Where cargo keeps its artefacts. Shared, because a cold build is minutes. */
const CARGO_TARGET_DIR = process.env.CARGO_TARGET_DIR ?? "/tmp/cargo-shared";

/** The superuser the container's Postgres was set up with. */
const PG_URL = process.env.E2E_PG_URL ?? "postgres://postgres:qapass@127.0.0.1:5432";

export const DATABASE = `${PROJECT_NAME}_e2e`;
export const ADMIN = { email: "admin@admin.com", password: "admin" };

let server: ChildProcess | null = null;

export interface RunningApp {
  baseUrl: string;
  token: string;
}

/** A port nothing is listening on. Asking the kernel beats guessing. */
async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(() => resolve(port));
    });
  });
}

async function psql(sql: string): Promise<void> {
  await exec("psql", [`${PG_URL}/postgres`, "-v", "ON_ERROR_STOP=1", "-c", sql], {
    maxBuffer: 16 * 1024 * 1024,
  });
}

function backend(): string {
  return path.join(OUTPUT_DIR, "backend");
}

function cargoEnv(databaseUrl: string): NodeJS.ProcessEnv {
  return { ...process.env, CARGO_TARGET_DIR, DATABASE_URL: databaseUrl, LOCO_ENV: "development" };
}

/**
 * Compile, migrate, seed and start. Returns once `/api/me/health` answers.
 *
 * The database is dropped and recreated rather than reused. A row left behind
 * by a previous run makes a whole class of failure pass — the generated bun
 * harness documents exactly that trap for its parent-record recursion — and a
 * suite that only passes against a warm database is not a regression gate.
 */
export async function startApp(): Promise<RunningApp> {
  const databaseUrl = `${PG_URL}/${DATABASE}`;
  const env = cargoEnv(databaseUrl);

  await exec("cargo", ["build", "--bins"], { cwd: backend(), env, maxBuffer: 64 * 1024 * 1024 });

  await psql(`DROP DATABASE IF EXISTS ${DATABASE}`);
  await psql(`CREATE DATABASE ${DATABASE}`);

  for (const step of [
    ["loco", "db", "migrate"],
    ["loco", "db", "seed"],
  ]) {
    await exec("cargo", step, { cwd: backend(), env, maxBuffer: 128 * 1024 * 1024 });
  }

  const port = await freePort();
  server = spawn("cargo", ["loco", "start"], {
    cwd: backend(),
    env: { ...env, PORT: String(port) },
    stdio: "ignore",
    detached: true,
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForHealth(baseUrl);
  return { baseUrl, token: await login(baseUrl, ADMIN.email, ADMIN.password) };
}

async function waitForHealth(baseUrl: string): Promise<void> {
  const deadline = Date.now() + 120_000;
  let lastError = "never answered";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/me/health`);
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`the generated backend never became healthy: ${lastError}`);
}

/** Sign in, and fail loudly rather than handing a spec an empty token. */
export async function login(baseUrl: string, email: string, password: string): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = (await response.json()) as { token?: string };
  if (!response.ok || !body.token) {
    throw new Error(`login failed for ${email}: HTTP ${response.status}`);
  }
  return body.token;
}

export function stopApp(): void {
  if (!server?.pid) return;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    // Already gone.
  }
  server = null;
}
