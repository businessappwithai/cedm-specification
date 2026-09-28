/**
 * Regression: the generators named templates that were not there.
 *
 * `tanstack-start-frontend.generator.ts` carried a list of nineteen
 * `components/ui/<name>.tsx` files to copy and **every one of them failed**.
 * The Astryx migration turned each into an adapter, so the templates are
 * `<name>.tsx.hbs` now and `astryx-frontend.generator.ts` renders all
 * twenty-six of them — the components arrived from the other generator and the
 * list had simply stopped being true. Five more entries under
 * `staticComponents` were the same.
 *
 * None of that was visible, because every copy sat inside a `try`/`catch` that
 * warned and carried on. A generation log runs to hundreds of lines, so
 * nineteen warnings per run read as noise rather than as a list that had
 * rotted.
 *
 * The dead entries are the cheap half. The expensive half is that a *live*
 * entry can go the same way: the layout copy had the same shape, and the
 * sidebar render fell back to copying a `sidebar.tsx` that does not exist — so
 * an application could have shipped with no navigation at all and reported
 * success. `renderTemplate` raises on a Handlebars syntax error too, which
 * those catches made indistinguishable from a missing file.
 *
 * This sweeps every generator's source for template paths and asserts each
 * resolves on disk. That covers the declared arrays in both generators and any
 * ad-hoc `renderTemplate` call naming a path inline, without depending on how
 * a particular list is spelled — which is the property that matters, since the
 * next list to rot will not be one this test knows about.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const HERE = dirname(fileURLToPath(import.meta.url));
const GENERATOR_ROOT = join(HERE, "..");
const TEMPLATE_ROOT = join(HERE, "../../../templates");

/**
 * The roots a generator resolves a template path against.
 *
 * Each knows its own and none of them records it anywhere a test can read, so
 * every root is tried. That leniency is deliberate: this is here to catch a
 * path that exists under *none* of them, which is the failure that happened. A
 * path resolving under the wrong root is a different bug, and the generated
 * application would not build.
 */
const TEMPLATE_ROOTS = [
  "tanstack-astryx-loco",
  "tanstack-astryx-loco/backend",
  "tanstack-astryx-loco/frontend",
  "tanstack-astryx-loco/tests",
  "common",
  "",
];

/**
 * Paths that look like a template and are not.
 *
 * `src/routeTree.gen.ts` is a line of the generated project's `.gitignore`,
 * which the generator writes as a string — TanStack Router writes that file on
 * dev and build, so the generator naming it is telling git to ignore it, not
 * declaring a template.
 *
 * An addition here needs a reason written beside it. That is the point of the
 * list being short: a new entry is a review conversation, not a habit.
 */
const NOT_TEMPLATES = new Set(["src/routeTree.gen.ts"]);

/** Generator sources, excluding tests and generated bundles. */
function generatorSources(dir: string, found: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name !== "__tests__") generatorSources(full, found);
    } else if (name.endsWith(".ts") && !name.endsWith(".generated.ts")) {
      found.push(full);
    }
  }
  return found;
}

/** Does this path resolve to a template, with or without the `.hbs` suffix? */
function resolves(templatePath: string): boolean {
  return TEMPLATE_ROOTS.some(
    (root) =>
      existsSync(join(TEMPLATE_ROOT, root, templatePath)) ||
      existsSync(join(TEMPLATE_ROOT, root, `${templatePath}.hbs`))
  );
}

/** Every quoted path in generator source matching `pattern`, with its file. */
function declaredPaths(pattern: RegExp): Array<{ file: string; path: string }> {
  const declared: Array<{ file: string; path: string }> = [];
  for (const file of generatorSources(GENERATOR_ROOT)) {
    for (const match of readFileSync(file, "utf8").matchAll(pattern)) {
      declared.push({
        file: relative(GENERATOR_ROOT, file),
        path: match[1] as string,
      });
    }
  }
  return declared;
}

describe("templates the generators declare", () => {
  it("has a template for every source path a generator copies", () => {
    // A quoted `src/…` path with a file extension: how every one of these
    // arrays spells an entry, and how an inline copy spells its argument.
    const missing = declaredPaths(
      /["'`](src\/[A-Za-z0-9_\-./$]+\.(?:ts|tsx|css|json|js|sh))["'`]/g
    )
      .filter(({ path }) => !NOT_TEMPLATES.has(path) && !resolves(path))
      .map(({ file, path }) => `${file} names ${path}`);

    // Named, not counted: the fix is to write the template, to delete the
    // entry, or — if it is not a template at all — to add it to NOT_TEMPLATES
    // with a reason.
    expect([...new Set(missing)].sort()).toEqual([]);
  });

  it("has a file for every `.hbs` template a generator renders", () => {
    // The leading character must be a word character, which is what keeps
    // prose out: a comment mentioning `.tsx.hbs` is not a declaration.
    const declared = declaredPaths(/["'`]([A-Za-z0-9_$][A-Za-z0-9_\-./$]*\.hbs)["'`]/g);

    // The sweep is only as good as its reach; a regex that silently stopped
    // matching would make this suite pass by finding nothing.
    expect(declared.length).toBeGreaterThan(100);

    const missing = declared
      .filter(({ path }) => !resolves(path))
      .map(({ file, path }) => `${file} renders ${path}`);
    expect([...new Set(missing)].sort()).toEqual([]);
  });
});
