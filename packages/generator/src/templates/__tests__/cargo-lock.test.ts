/**
 * The shipped `Cargo.lock` has to describe the manifest beside it.
 *
 * A generated project ships a lockfile so `cargo build` resolves the graph this
 * repository tested against rather than the crates.io index of the day — the
 * failure that motivated it was `tinyvec` 1.13.0, which arrived four levels
 * down through `sqlx-postgres` and did not compile, where nothing in
 * `Cargo.toml` names it and nothing in `Cargo.toml` can bound it.
 *
 * The cost of shipping one is that it goes stale silently. Add a dependency to
 * `Cargo.toml.hbs` and forget the lock, and `cargo build --locked` fails in the
 * user's project with a message about the lockfile needing an update — a long
 * way from the edit that caused it. This asserts the direction that matters:
 * every dependency the manifest names has an entry in the lock.
 *
 * It deliberately does not assert the reverse. A lock legitimately carries
 * hundreds of transitive packages the manifest never mentions, and it may carry
 * two versions of one crate; enumerating those would be re-implementing cargo.
 * Freshness beyond this is the refresh recipe in the lock template's header.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const BACKEND = path.join(
  import.meta.dirname,
  "../../../templates/tanstack-astryx-loco/backend"
);

const manifest = readFileSync(path.join(BACKEND, "Cargo.toml.hbs"), "utf-8");
const lock = readFileSync(path.join(BACKEND, "Cargo.lock.hbs"), "utf-8");

/** Crate names in a `[dependencies]`-style section, in declaration order. */
function manifestDependencies(source: string): string[] {
  const names: string[] = [];
  let inDeps = false;
  for (const line of source.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("[")) {
      inDeps = /^\[(dev-|build-)?dependencies\]$/.test(trimmed);
      continue;
    }
    if (!inDeps || trimmed.startsWith("#") || trimmed === "") continue;
    // `name = "1"` or `name = { version = "1", ... }`; continuation lines of a
    // multi-line table have no `=` at the top level and are skipped.
    const match = /^([A-Za-z0-9_-]+)\s*=/.exec(trimmed);
    if (match) names.push(match[1] as string);
  }
  return names;
}

/** Every package name the lock declares. */
function lockedPackages(source: string): Set<string> {
  return new Set(
    [...source.matchAll(/^name = "([^"]+)"$/gm)].map((m) => m[1] as string)
  );
}

describe("the generated Cargo.lock", () => {
  const dependencies = manifestDependencies(manifest);
  const locked = lockedPackages(lock);

  it("reads the manifest at all", () => {
    // A parse that found nothing would make every assertion below vacuous.
    expect(dependencies.length).toBeGreaterThan(10);
    expect(dependencies).toContain("loco-rs");
    expect(dependencies).toContain("sqlx");
  });

  it("has an entry for every dependency the manifest names", () => {
    // `migration` is a path dependency and appears under its own name.
    const missing = dependencies.filter((name) => !locked.has(name));
    expect(missing, `not in Cargo.lock.hbs: ${missing.join(", ")}`).toEqual([]);
  });

  it("carries the project's own package entry, templated", () => {
    expect(lock).toContain('name = "{{projectSnake}}"');
    expect(lock).toContain('version = "{{project.version}}"');
  });

  it("keeps the project name a template rather than a checked-in literal", () => {
    // The lock was taken from a generated project; leaving that project's name
    // behind would make every generated app declare a package it is not.
    expect(lock).not.toContain('name = "drugdiscovery"');
  });

  it("is a version cargo still reads", () => {
    expect(/^version = [34]$/m.test(lock)).toBe(true);
  });

  it("pins every package to a checksum, so a mirror cannot substitute one", () => {
    const registryPackages = [
      ...lock.matchAll(/^source = "registry\+[^"]+"\n(checksum = "[^"]+")?/gm),
    ];
    const unchecksummed = registryPackages.filter((m) => !m[1]);
    expect(unchecksummed).toHaveLength(0);
  });
});
