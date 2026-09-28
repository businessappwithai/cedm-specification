/**
 * Generate the application once, then stand it up once.
 *
 * vitest runs this in the main process before any worker starts, so the
 * address and token it publishes reach every spec through the environment the
 * workers inherit. Doing it here rather than in a `beforeAll` is what keeps one
 * server serving all the specs: a per-file fixture would compile, migrate and
 * seed once per file.
 *
 * Set `E2E_SKIP_APP=1` to run only the specs that read files — useful while
 * iterating on those, and the reason every application spec checks for the
 * address rather than assuming it.
 */

import { generateOnce, OUTPUT_DIR } from "./fixture";

export default async function setup(): Promise<() => Promise<void>> {
  await generateOnce();
  // The workers must read this tree, not rebuild it underneath themselves.
  process.env.E2E_REUSE_OUTPUT = "1";
  process.env.E2E_OUTPUT_DIR = OUTPUT_DIR;

  if (process.env.E2E_SKIP_APP === "1") {
    return async () => {};
  }

  const { startApp, stopApp } = await import("./app");
  const app = await startApp();
  process.env.E2E_BASE_URL = app.baseUrl;
  process.env.E2E_TOKEN = app.token;

  return async () => {
    stopApp();
  };
}
