/**
 * Every route that touches a project is guarded.
 *
 * `lib/__tests__/project-access.test.ts` proves `requireProjectAccess` decides
 * correctly. Nothing proved that routes *call* it — and that is the failure
 * that actually happens: five handlers shipped in the sibling repo's
 * automations routes with no check at all, so anyone holding a project id could
 * read, overwrite and delete another project's automations. Each handler was
 * written correctly in every other respect; the guard was simply forgotten, and
 * no test could see it.
 *
 * So this reads the route sources and counts. It is a coarse check by design:
 * a per-verb assertion needs the file's meaning, while "a route under
 * `projects/$id` has at least as many guard calls as handler verbs" needs only
 * its shape — and catches the omission on the day it is introduced rather than
 * on the day someone goes looking.
 *
 * A route that is deliberately stricter than the shared helper — membership
 * management is owner-only, which `ProjectPermission` cannot express — is
 * listed in `OWNER_ONLY` with the reason. The list is the point: adding a
 * project route means using the helper or saying here why not.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const API = path.resolve(__dirname, "..", "..");
const PROJECT_SCOPED = path.join(API, "projects", "$id");

/**
 * Routes taking a project id from the body or the query rather than the path.
 * They are just as project-scoped and just as easy to miss, so they are named
 * rather than discovered.
 */
const BY_BODY_OR_QUERY = [
  "generate.ts",
  "deploy.ts",
  path.join("mermaid", "index.ts"),
  // These two reach a database the project points at — one reads its whole
  // schema, the other executes DDL against it — and both shipped with no
  // authentication at all.
  path.join("db", "reverse-engineer.ts"),
  path.join("db", "generate-schema.ts"),
];

/**
 * Routes that guard themselves more strictly than `requireProjectAccess` can.
 * Each still authenticates and still authorises — it just does so against a
 * rule the shared helper does not model.
 */
const OWNER_ONLY: Record<string, string> = {
  "index.ts": "carries its own owner/member check plus the EDITABLE_PROJECT_COLUMNS allow-list",
  [path.join("members", "index.ts")]: "membership is owner-only; no ProjectPermission expresses that",
  [path.join("members", "$userId", "index.ts")]: "membership is owner-only, as above",
};

function walk(directory: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory)) {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) found.push(...walk(full));
    else if (entry.endsWith(".ts") && !entry.includes(".test.")) found.push(full);
  }
  return found;
}

/** Handler verbs declared in a `server.handlers` block. */
function handlerCount(source: string): number {
  return (source.match(/^\s+(GET|POST|PUT|PATCH|DELETE):\s*async/gm) ?? []).length;
}

function guardCount(source: string): number {
  return (source.match(/requireProjectAccess\(/g) ?? []).length;
}

/** An owner-only route still has to establish who is calling. */
function authenticates(source: string): boolean {
  return source.includes("getCurrentUser(");
}

describe("project-scoped API routes", () => {
  const files = [
    ...walk(PROJECT_SCOPED),
    ...BY_BODY_OR_QUERY.map((relative) => path.join(API, relative)),
  ];

  it("finds the routes it is meant to be checking", () => {
    // A rename that empties the walk would otherwise make this suite pass by
    // checking nothing at all.
    expect(files.length).toBeGreaterThanOrEqual(22);
  });

  for (const file of files) {
    const relative = path.relative(PROJECT_SCOPED, file).startsWith("..")
      ? path.relative(API, file)
      : path.relative(PROJECT_SCOPED, file);
    const source = readFileSync(file, "utf-8");
    const handlers = handlerCount(source);
    if (handlers === 0) continue;

    const exemption = OWNER_ONLY[relative];

    it(`${relative} guards all ${handlers} of its handlers`, () => {
      if (exemption) {
        expect(authenticates(source), `${relative} is exempt (${exemption}) but never reads the caller`).toBe(true);
        return;
      }
      expect(
        guardCount(source),
        `${relative} declares ${handlers} handler(s) but calls requireProjectAccess ${guardCount(source)} time(s). ` +
          "Guard each handler, or add it to OWNER_ONLY with the reason."
      ).toBeGreaterThanOrEqual(handlers);
    });
  }
});
