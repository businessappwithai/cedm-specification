/**
 * Which requests the Rust (Loco) backend serves: exactly the method + path
 * pairs in rust/routes.json (a Rust test holds that file to the router).
 *
 * One matcher for both entry points — the Vite dev proxy (vite.config.ts)
 * and the production server (src/server.ts) — so development and production
 * route identically. `:name` in a pattern is one path segment.
 */
import table from "../../../rust/routes.json";

const matchers = (table as unknown as { routes: [string, string][] }).routes.map(
  ([method, pattern]) => ({
    method,
    re: new RegExp(`^${pattern.replace(/:[^/]+/g, "[^/]+")}/?$`),
  })
);

/** Is `METHOD /pathname` a route the Rust backend serves? */
export function isRustRoute(method: string, pathname: string): boolean {
  return matchers.some((m) => m.method === method && m.re.test(pathname));
}
