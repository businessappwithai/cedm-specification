/**
 * One Harness host per signed-in person.
 *
 * A host is a `dsh` process on a loopback port with its own `DSH_HOME`, so one
 * person's sessions, logs and settings are another directory from the next
 * person's, and a host that misbehaves takes down one conversation. The gateway
 * is the only thing that talks to it: it starts the host, trades the launch
 * token for the host's authentication cookie (which never reaches a browser),
 * proxies the person's chat to it, and stops it when they have been idle.
 *
 * Memory is the term that scales (see README, "Capacity"), so three things bound
 * it: each host's V8 heap is capped (`CHAT_HOST_HEAP_MB`), idle hosts are reaped
 * (`CHAT_HOST_IDLE_MINUTES`), and at most `CHAT_MAX_HOSTS` run at once — the
 * next person waits in a queue with a stated position rather than the machine
 * swapping.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readlink, rm, symlink, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { totalmem } from "node:os";
import { join } from "node:path";
import { randomToken } from "./crypto";
import type { GatewayConfig } from "./config";

/**
 * The largest resident memory one business host was measured at, in MiB: a
 * lone host after a turn, before any page is shared with a second
 * (`bun run load`, 2026-10-04; README, "Memory"). Its own share fell to about
 * 72 MiB from 25 hosts on. `defaultMaxHosts` takes the larger of this and 90%
 * of the heap ceiling, so with the default 256 MiB heap the ceiling is set by
 * the heap — the most one host can grow to — not by this.
 */
export const MEASURED_HOST_RSS_MB = 154;

export interface RunningHost {
  userId: string;
  port: number;
  /** `name=value` of the host's authentication cookie. */
  cookie: string;
  /** Presented by this host's tools on the internal API. */
  secret: string;
  startedAt: number;
  lastUsedAt: number;
  /** Open WebSocket streams; a host with one is never idle. */
  streams: number;
  process: ChildProcess;
}

export class CapacityError extends Error {
  constructor(readonly position: number) {
    super(`The chat is at capacity; you are number ${position} in the queue.`);
    this.name = "CapacityError";
  }
}

const PROFILE = "chat";
const LAUNCH_LINE = /dsh web: (http:\/\/127\.0\.0\.1:(\d+)\/\?token=[A-Za-z0-9_-]+)/;

export function defaultMaxHosts(heapMb: number): number {
  // Three quarters of the machine for hosts, the rest for the gateway, the
  // applications and the database; the measured RSS, not the heap cap, is
  // what a host costs.
  const perHost = Math.max(MEASURED_HOST_RSS_MB, Math.round(heapMb * 0.9));
  return Math.max(1, Math.floor((totalmem() / 2 ** 20) * 0.75 / perHost));
}

async function portIsFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}

export class HostManager {
  private readonly hosts = new Map<string, RunningHost>();
  private readonly starting = new Map<string, Promise<RunningHost>>();
  private readonly bySecret = new Map<string, string>();
  private readonly queue: string[] = [];
  private readonly waiters = new Map<string, Array<() => void>>();
  private readonly maxHosts: number;
  private readonly reaper: ReturnType<typeof setInterval>;

  constructor(private readonly config: GatewayConfig) {
    this.maxHosts = config.maxHosts > 0 ? config.maxHosts : defaultMaxHosts(config.hostHeapMb);
    this.reaper = setInterval(() => void this.reapIdle(), 60_000);
    this.reaper.unref();
  }

  get capacity(): number {
    return this.maxHosts;
  }

  get running(): number {
    return this.hosts.size + this.starting.size;
  }

  /** The person whose host presented this secret, or null. */
  userForSecret(secret: string): string | null {
    return this.bySecret.get(secret) ?? null;
  }

  host(userId: string): RunningHost | null {
    return this.hosts.get(userId) ?? null;
  }

  /** Position in the queue (1-based), or 0 when not waiting. */
  queuePosition(userId: string): number {
    return this.queue.indexOf(userId) + 1;
  }

  touch(userId: string): void {
    const host = this.hosts.get(userId);
    if (host) host.lastUsedAt = Date.now();
  }

  streamOpened(userId: string): void {
    const host = this.hosts.get(userId);
    if (host) host.streams += 1;
  }

  streamClosed(userId: string): void {
    const host = this.hosts.get(userId);
    if (host) {
      host.streams = Math.max(0, host.streams - 1);
      host.lastUsedAt = Date.now();
    }
  }

  /**
   * The person's host, started if needed. Throws {@link CapacityError} when the
   * ceiling is reached; the person stays queued and the next call after a slot
   * frees starts their host.
   */
  async ensure(userId: string): Promise<RunningHost> {
    const existing = this.hosts.get(userId);
    if (existing && existing.process.exitCode === null) {
      existing.lastUsedAt = Date.now();
      return existing;
    }
    const pending = this.starting.get(userId);
    if (pending) return pending;

    if (this.running >= this.maxHosts) {
      if (!this.queue.includes(userId)) this.queue.push(userId);
      throw new CapacityError(this.queuePosition(userId));
    }
    const head = this.queue[0];
    if (head !== undefined && head !== userId) {
      // Someone queued first; a freed slot is theirs.
      if (!this.queue.includes(userId)) this.queue.push(userId);
      throw new CapacityError(this.queuePosition(userId));
    }
    if (head === userId) this.queue.shift();

    const start = this.start(userId).finally(() => this.starting.delete(userId));
    this.starting.set(userId, start);
    return start;
  }

  /** Stop the person's host, e.g. at sign-out. */
  async stop(userId: string): Promise<void> {
    const host = this.hosts.get(userId);
    if (!host) return;
    this.forget(host);
    await this.terminate(host.process);
  }

  async stopAll(): Promise<void> {
    clearInterval(this.reaper);
    await Promise.all([...this.hosts.keys()].map((userId) => this.stop(userId)));
  }

  private forget(host: RunningHost): void {
    if (this.hosts.get(host.userId) === host) this.hosts.delete(host.userId);
    this.bySecret.delete(host.secret);
  }

  private async terminate(child: ChildProcess): Promise<void> {
    if (child.exitCode !== null || child.signalCode !== null) return;
    child.kill("SIGTERM");
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        resolve();
      }, 10_000);
      child.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  private async reapIdle(): Promise<void> {
    const cutoff = Date.now() - this.config.hostIdleMinutes * 60_000;
    for (const host of [...this.hosts.values()]) {
      if (host.streams === 0 && host.lastUsedAt < cutoff) await this.stop(host.userId);
    }
  }

  private homeFor(userId: string): string {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(userId)) throw new Error("unsafe user id for a host directory");
    return join(this.config.dataDir, "hosts", userId);
  }

  /**
   * Lay out the person's Harness home: the `chat` profile on the shipped Web
   * bundles, our plugin packages linked into its `node_modules` (Harness
   * resolves a plugin name against the profile, not the installation), and the
   * business instructions as the home-level `AGENTS.md`.
   */
  async prepareHome(userId: string): Promise<{ root: string; dshHome: string; documents: string }> {
    const root = this.homeFor(userId);
    const dshHome = join(root, "dsh");
    const profile = join(dshHome, "profiles", PROFILE);
    const documents = join(root, "documents");
    await mkdir(join(profile, "node_modules", "@appwithai"), { recursive: true });
    await mkdir(documents, { recursive: true });

    await writeFile(
      join(profile, "package.json"),
      `${JSON.stringify(
        {
          name: `dsh-profile-${PROFILE}`,
          private: true,
          dependencies: {},
          dsh: { profile: { bundles: ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app"] } },
        },
        null,
        2
      )}\n`
    );
    await writeFile(join(profile, "cordis.yml"), "# The business chat's profile root; composed from bundles and patches.\n[]\n");
    // The person's own patch layer stays empty: the business patch is passed as
    // `--patch`, after it, and nothing they can reach writes here.
    await writeFile(join(profile, "cordis.patch.yml"), "[]\n");

    for (const plugin of ["business-tools", "business-nodes"]) {
      const source = join(this.config.pluginsDir, plugin);
      if (!existsSync(source)) continue;
      const link = join(profile, "node_modules", "@appwithai", `chat-${plugin}`);
      const current = await readlink(link).catch(() => null);
      if (current !== source) {
        await rm(link, { force: true, recursive: true });
        await symlink(source, link, "dir");
      }
    }
    await copyFile(this.config.agentsFile, join(dshHome, "AGENTS.md"));
    return { root, dshHome, documents };
  }

  private async allocatePort(): Promise<number> {
    const [low, high] = this.config.hostPortRange;
    const used = new Set([...this.hosts.values()].map((host) => host.port));
    const span = high - low + 1;
    const offset = Math.floor(Math.random() * span);
    for (let i = 0; i < span; i++) {
      const port = low + ((offset + i) % span);
      if (!used.has(port) && (await portIsFree(port))) return port;
    }
    throw new Error(`no free port in CHAT_HOST_PORTS ${low}-${high}`);
  }

  private async start(userId: string): Promise<RunningHost> {
    const { dshHome, documents } = await this.prepareHome(userId);
    const port = await this.allocatePort();
    const secret = randomToken();
    const env: Record<string, string> = {
      PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin",
      HOME: documents,
      DSH_HOME: dshHome,
      DSH_TELEMETRY_DISABLED: "1",
      NODE_OPTIONS: `--max-old-space-size=${this.config.hostHeapMb}`,
      CHAT_GATEWAY_INTERNAL_URL: `http://127.0.0.1:${this.config.internalPort}`,
      CHAT_HOST_SECRET: secret,
      CHAT_SKILLS_DIR: this.config.skillsDir,
      CHAT_DOCUMENTS_DIR: documents,
      DEEPSEEK_API_KEY: this.config.deepseekApiKey,
    };
    if (this.config.deepseekBaseUrl) env.DEEPSEEK_BASE_URL = this.config.deepseekBaseUrl;
    if (this.config.deepseekModel) env.CHAT_DEEPSEEK_MODEL = this.config.deepseekModel;

    // Harness supports Node (>= 22.19), not Bun, whatever runs the gateway.
    const child = spawn(
      this.config.nodeBin,
      [this.config.dshBin, "--profile", PROFILE, "--patch", this.config.businessPatch, "--no-open", "--port", String(port)],
      { cwd: documents, env, stdio: ["ignore", "pipe", "pipe"] }
    );

    let output = "";
    const launchUrl = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error(`the chat host did not start within ${this.config.hostStartTimeoutMs} ms:\n${output.slice(-2000)}`));
      }, this.config.hostStartTimeoutMs);
      const onData = (chunk: Buffer) => {
        output += chunk.toString("utf8");
        const match = LAUNCH_LINE.exec(output);
        if (match) {
          clearTimeout(timer);
          resolve(match[1]!);
        }
      };
      child.stdout?.on("data", onData);
      child.stderr?.on("data", (chunk: Buffer) => {
        output += chunk.toString("utf8");
      });
      child.once("exit", (code, signal) => {
        clearTimeout(timer);
        reject(new Error(`the chat host exited before it was ready (code ${code}, signal ${signal}):\n${output.slice(-2000)}`));
      });
    });
    // Keep draining the pipes so a chatty host never blocks on a full buffer.
    child.stdout?.resume();
    child.stderr?.resume();

    // The launch token is good for one exchange, on `GET /`, for a cookie bound
    // to this authority. The gateway makes the exchange and keeps the cookie.
    const exchange = await fetch(launchUrl, { redirect: "manual" });
    const setCookie = exchange.headers.get("set-cookie");
    const cookie = setCookie?.split(";")[0]?.trim();
    if (exchange.status !== 303 || !cookie) {
      child.kill("SIGKILL");
      throw new Error(`the chat host refused its own launch token (HTTP ${exchange.status})`);
    }

    const host: RunningHost = {
      userId,
      port,
      cookie,
      secret,
      startedAt: Date.now(),
      lastUsedAt: Date.now(),
      streams: 0,
      process: child,
    };
    this.hosts.set(userId, host);
    this.bySecret.set(secret, userId);
    child.once("exit", () => {
      this.forget(host);
      this.release();
    });
    return host;
  }

  /** A slot freed: wake whoever is at the head of the queue. */
  private release(): void {
    const head = this.queue[0];
    if (head === undefined) return;
    for (const wake of this.waiters.get(head) ?? []) wake();
    this.waiters.delete(head);
  }

  /** Resolve when it is the person's turn to try again (for a waiting page's long poll). */
  waitForTurn(userId: string, timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, timeoutMs);
      const list = this.waiters.get(userId) ?? [];
      list.push(() => {
        clearTimeout(timer);
        resolve();
      });
      this.waiters.set(userId, list);
    });
  }
}
