/**
 * Server lifecycle helpers.
 *
 * The runner (`run.ts`) can start the backend itself, or attach to one that is
 * already listening. Either way the suites do not begin until /api/me/health
 * answers.
 *
 * Generated: 2026-10-01T09:31:59.422Z
 * Project: energy
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawn, type Subprocess } from "bun";
import { config } from "./config";

const HEALTH_PATH = "/api/me/health";

/**
 * How to start the backend, decided by what is actually in `backendDir`.
 *
 * These suites are the cross-stack parity oracle and must not know which stack
 * they are pointed at. A Rust backend is a cargo crate with no `package.json`
 * and no `start` script — `bun run start` there fails with "Script not found",
 * which reads like a broken app rather than a wrong command. Sniffing the
 * manifest keeps one harness honest for both.
 */
function startCommand(backendDir: string): string[] {
  if (existsSync(join(backendDir, "package.json"))) {
    return ["bun", "run", "start"];
  }
  if (existsSync(join(backendDir, "Cargo.toml"))) {
    // `cargo loco` is the alias the generated `.cargo/config.toml` defines.
    return ["cargo", "loco", "start"];
  }
  throw new Error(
    `No package.json or Cargo.toml in ${backendDir} — cannot tell how to start the backend.`
  );
}

/** Poll the health endpoint until it answers or the deadline passes. */
export async function waitForServer(
  timeoutMs: number = config.serverReadyTimeoutMs
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError = "never attempted";

  while (Date.now() < deadline) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`${config.baseUrl}${HEALTH_PATH}`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (response.ok) return;
      lastError = `status ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await Bun.sleep(500);
  }

  throw new Error(
    `Backend at ${config.baseUrl} was not ready within ${timeoutMs}ms (last: ${lastError}). ` +
      `Start it with "bun run dev" in the project root, or let "bun run test:e2e" start it for you.`
  );
}

/** True when something is already serving the health endpoint. */
export async function isServerUp(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${config.baseUrl}${HEALTH_PATH}`, { signal: controller.signal });
    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
}

export interface ManagedServer {
  process: Subprocess;
  stop: () => Promise<void>;
}

/**
 * Start the backend as a child process and wait for it to become healthy.
 * Returns null when a server is already up — we attach instead of starting a
 * second one that would fail to bind the port.
 */
export async function startServer(backendDir: string): Promise<ManagedServer | null> {
  if (await isServerUp()) {
    console.log(`  ✓ Attaching to the backend already listening on ${config.baseUrl}`);
    return null;
  }

  console.log(`  ▸ Starting backend from ${backendDir}…`);
  console.log(`    ${startCommand(backendDir).join(" ")}`);

  // stdout is discarded rather than piped: the backend logs every request, and
  // an unread pipe fills its OS buffer and blocks the server mid-run. stderr is
  // piped but actively drained below for the same reason — we keep only a
  // rolling tail, which is all a startup failure needs.
  const child = spawn({
    cmd: startCommand(backendDir),
    cwd: backendDir,
    stdout: config.verbose ? "inherit" : "ignore",
    stderr: "pipe",
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV ?? "test",
      // Bulk seeding drives thousands of writes a minute, far past the 300 a
      // minute `config/development.yaml` grants one caller. 0 switches the
      // limiter off, as `config/test.yaml` does for the Rust suites; the
      // limiter itself is covered by `tests/requests/rate_limit.rs`. The
      // client still backs off on a 429 if someone sets a budget here.
      RATE_LIMIT_MAX_PER_MINUTE: process.env.RATE_LIMIT_MAX_PER_MINUTE ?? "0",
      RATE_LIMIT_AUTH_MAX_PER_MINUTE: process.env.RATE_LIMIT_AUTH_MAX_PER_MINUTE ?? "0",
    },
  });

  let stderrTail = "";
  const drain = (async () => {
    if (!child.stderr) return;
    const reader = (child.stderr as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        stderrTail = (stderrTail + decoder.decode(value, { stream: true })).slice(-4000);
        if (config.verbose) process.stderr.write(value);
      }
    } catch {
      // stream closed with the process
    }
  })();

  const stop = async (): Promise<void> => {
    try {
      child.kill();
      await child.exited;
      await drain;
    } catch {
      // already gone
    }
  };

  try {
    await waitForServer();
  } catch (error) {
    // Surface why the server never came up rather than just the timeout.
    await stop();
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}` +
        (stderrTail ? `\n\nBackend stderr:\n${stderrTail}` : "")
    );
  }

  console.log("  ✓ Backend is healthy");
  return { process: child, stop };
}
