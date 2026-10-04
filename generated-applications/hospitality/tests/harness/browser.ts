/**
 * Browser lifecycle for the suites that must drive the real UI.
 *
 * Everything else in `tests/` talks to the backend over HTTP, which is the
 * right level for a contract oracle. The volume suite is different: the claim
 * it makes is about the *application* under load — the frontend's session, its
 * origin, its dev-server proxy, its grid — so it has to run inside a browser
 * that loaded the app.
 *
 * Two things this deliberately does not do:
 *
 *  - It does not bypass the login screen. The session under test is the one a
 *    user gets, cookie and bearer token included, obtained by typing into the
 *    form. A fixture that injected a token would stop testing the thing that
 *    broke most often in this project's history.
 *
 *  - It does not type 100,000 records into a form. Writes are issued by
 *    `apiFetch`, which runs `fetch` *inside the page* — same origin, same
 *    cookie, same proxy, same headers the app itself sends. That is genuinely
 *    "through the browser"; driving a form a hundred thousand times would
 *    measure Playwright's typing speed and take days.
 *
 * Generated: 2026-10-04T08:29:58.687Z
 * Project: hospitality
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawn, type Subprocess } from "bun";
import type { Browser, Page } from "playwright";
import { config } from "./config";

/** A response as seen from inside the page. */
export interface PageResponse<T = unknown> {
  status: number;
  ok: boolean;
  data: T | null;
}

export interface BrowserSession {
  browser: Browser;
  page: Page;
  /** Issue an API request from inside the page, with the app's own session. */
  apiFetch<T = unknown>(
    path: string,
    init?: { method?: string; body?: unknown; headers?: Record<string, string> }
  ): Promise<PageResponse<T>>;
  /**
   * Issue many requests from inside the page with bounded concurrency,
   * returning one round trip's worth of results rather than N.
   */
  apiBatch<T = unknown>(
    requests: Array<{ path: string; method?: string; body?: unknown }>,
    concurrency?: number
  ): Promise<Array<PageResponse<T>>>;
  close(): Promise<void>;
}

/** True when something is already serving the frontend origin. */
export async function isFrontendUp(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(config.origin, { signal: controller.signal });
    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
}

export interface ManagedFrontend {
  process: Subprocess;
  stop: () => Promise<void>;
}

/**
 * Start the Vite dev server, unless one is already listening.
 *
 * The dev server rather than a production build: its proxy is what puts the API
 * on the same origin as the app, and that is precisely the path this suite is
 * meant to exercise.
 */
export async function startFrontend(frontendDir: string): Promise<ManagedFrontend | null> {
  if (await isFrontendUp()) {
    console.log(`  ✓ Attaching to the frontend already listening on ${config.origin}`);
    return null;
  }
  if (!existsSync(join(frontendDir, "package.json"))) {
    throw new Error(`No package.json in ${frontendDir} — cannot start the frontend.`);
  }

  console.log(`  ▸ Starting frontend from ${frontendDir}…`);
  const child = spawn({
    cmd: ["bun", "run", "dev"],
    cwd: frontendDir,
    stdout: config.verbose ? "inherit" : "ignore",
    stderr: config.verbose ? "inherit" : "ignore",
    env: { ...process.env },
  });

  const deadline = Date.now() + config.serverReadyTimeoutMs;
  while (Date.now() < deadline) {
    if (await isFrontendUp()) {
      console.log("  ✓ Frontend is serving");
      return {
        process: child,
        stop: async () => {
          try {
            child.kill();
            await child.exited;
          } catch {
            // already gone
          }
        },
      };
    }
    await Bun.sleep(500);
  }

  child.kill();
  throw new Error(`Frontend at ${config.origin} was not ready within ${config.serverReadyTimeoutMs}ms.`);
}

/**
 * Fill in the login form and wait for the app to leave it.
 *
 * Retried, and not for flake tolerance. Until the page hydrates, the submit
 * button is a plain HTML button inside a form with no handler attached, so a
 * click performs a *native* GET submit — the URL picks up a `?` and the app
 * lands back on the login screen having never called the API. Nothing about the
 * DOM distinguishes a hydrated form from one that only looks hydrated, so the
 * honest test is whether the submit did anything.
 */
async function signIn(page: Page): Promise<void> {
  const attempts = 4;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    await page.goto(`${config.origin}/auth/login`, { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', config.admin.email);
    await page.fill('input[type="password"]', config.admin.password);
    await page.click('button[type="submit"]');

    try {
      // Waiting on the URL rather than a spinner keeps this independent of the
      // dashboard's markup.
      await page.waitForURL((url) => !url.pathname.startsWith("/auth/login"), {
        timeout: 15_000,
      });
      return;
    } catch (error) {
      if (attempt === attempts) {
        const visible = await page.locator("text=/failed|invalid|incorrect/i").first().textContent()
          .catch(() => null);
        throw new Error(
          `Could not sign in as ${config.admin.email} after ${attempts} attempts` +
            (visible ? ` — the page says: ${visible.trim()}` : "") +
            `\n${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }
}

/**
 * Launch a browser, load the app, and sign in through the login form.
 *
 * Chromium headless by default; set E2E_HEADED=1 to watch it work.
 */
export async function openApp(): Promise<BrowserSession> {
  // Imported here rather than at module scope so the rest of the harness stays
  // usable in a checkout where playwright was never installed.
  const { chromium } = await import("playwright");

  const browser = await chromium.launch({
    headless: process.env.E2E_HEADED !== "1",
    // CI images and dev containers often ship a Chromium already, and a
    // playwright upgrade otherwise demands a fresh several-hundred-megabyte
    // download before any test can run. Point E2E_CHROMIUM_PATH at the binary
    // to use it instead; unset, playwright resolves its own as usual.
    executablePath: process.env.E2E_CHROMIUM_PATH || undefined,
    // The volume suite keeps one page open for a long time under load; the
    // default /dev/shm in a container is too small for that.
    args: ["--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({ baseURL: config.origin });
  const page = await context.newPage();

  await signIn(page);

  const apiFetch = async <T = unknown>(
    path: string,
    init: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
  ): Promise<PageResponse<T>> =>
    page.evaluate(
      async ([target, method, body, prefix, deadlineMs, extra]) => {
        // `window` is not in this package's `lib`, and adding DOM to it would
        // change the types every other suite sees. The page has the global
        // regardless; this just names the one member we use.
        const store = (globalThis as { sessionStorage?: { getItem(key: string): string | null } })
          .sessionStorage;
        const token = store ? store.getItem("auth_token") : null;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(extra as Record<string, string>),
        };
        if (token) headers.Authorization = `Bearer ${token}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), deadlineMs as number);
        try {
          const response = await fetch(`${prefix}${target}`, {
            method: method as string,
            credentials: "include",
            headers,
            signal: controller.signal,
            body: body == null ? undefined : (body as string),
          });
          const text = await response.text();
          let parsed: unknown = null;
          try {
            parsed = JSON.parse(text);
          } catch {
            // a 204 and an error page both land here; status carries the meaning
          }
          return { status: response.status, ok: response.ok, data: parsed };
        } finally {
          clearTimeout(timer);
        }
      },
      [
        path,
        init.method ?? "GET",
        init.body == null ? null : JSON.stringify(init.body),
        config.apiPrefix,
        config.requestTimeoutMs,
        init.headers ?? {},
      ] as const
    ) as Promise<PageResponse<T>>;

  const apiBatch = async <T = unknown>(
    requests: Array<{ path: string; method?: string; body?: unknown }>,
    concurrency = 16
  ): Promise<Array<PageResponse<T>>> =>
    page.evaluate(
      async ([specs, limit, prefix, deadlineMs]) => {
        const store = (globalThis as { sessionStorage?: { getItem(key: string): string | null } })
          .sessionStorage;
        const token = store ? store.getItem("auth_token") : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const list = specs as Array<{ path: string; method?: string; body?: unknown }>;
        const results = new Array(list.length);
        let next = 0;

        // A worker pool rather than Promise.all over the whole batch: the point
        // of a batch is fewer round trips to the page, not an unbounded number
        // of open sockets. See `config.browserVolume.concurrency` for why the
        // default is what it is.
        const worker = async (): Promise<void> => {
          for (;;) {
            const index = next;
            next += 1;
            if (index >= list.length) return;
            const spec = list[index]!;
            // Every request is abortable. Without this one request that never
            // settles — a socket the browser queued behind its per-origin
            // connection limit and then lost — hangs its worker forever, and
            // `Promise.all` below never resolves. That surfaces as the whole
            // suite stopping dead partway through a phase, with a live process,
            // an idle database and nothing logged. A timeout turns it into a
            // failed request, which the caller can see and count.
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), deadlineMs as number);
            try {
              const response = await fetch(`${prefix}${spec.path}`, {
                method: spec.method ?? "GET",
                credentials: "include",
                headers,
                signal: controller.signal,
                body: spec.body == null ? undefined : JSON.stringify(spec.body),
              });
              const text = await response.text();
              let parsed: unknown = null;
              try {
                parsed = JSON.parse(text);
              } catch {
                // see apiFetch
              }
              results[index] = { status: response.status, ok: response.ok, data: parsed };
            } catch (error) {
              results[index] = {
                status: 0,
                ok: false,
                data: { message: error instanceof Error ? error.message : String(error) },
              };
            } finally {
              clearTimeout(timer);
            }
          }
        };

        await Promise.all(
          Array.from({ length: Math.min(limit as number, list.length) }, () => worker())
        );
        return results;
      },
      [requests, concurrency, config.apiPrefix, config.requestTimeoutMs] as const
    ) as Promise<Array<PageResponse<T>>>;

  return {
    browser,
    page,
    apiFetch,
    apiBatch,
    close: async () => {
      await context.close();
      await browser.close();
    },
  };
}
