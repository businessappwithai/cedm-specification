/**
 * `node:url` for the browser build. A module's own URL is an http(s) URL in a
 * browser, so `fileURLToPath` refuses it the way Node refuses a non-file URL;
 * every caller in the pipeline already catches that and falls back to
 * `process.cwd()`.
 */
export function fileURLToPath(url: string | URL): string {
  const parsed = typeof url === "string" ? new URL(url) : url;
  if (parsed.protocol !== "file:") throw new TypeError(`The URL must be of scheme file: ${parsed.href}`);
  return decodeURIComponent(parsed.pathname);
}

export function pathToFileURL(path: string): URL {
  return new URL(`file://${encodeURI(path)}`);
}

export default { fileURLToPath, pathToFileURL };
