/**
 * Every seed a task embeds must exist, for every model.
 *
 * `include_str!` is a *compile-time* macro. A generator that skips emitting
 * `seed/rules.sql` because the model declares no `%%rule` produces a backend
 * that does not compile — and the parity check cannot see it, because both
 * generators emit the same nothing and their outputs still match.
 *
 * The list is read out of the generated source rather than written down here,
 * so a seed added later is covered the moment its task embeds it.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { generateApplication, parseModel } from "../../index";

/** A model with no directives at all: no rules, no sagas, no categories. */
const BARE = `erDiagram
    Widget {
        string id PK
        string name
    }
`;

describe("what the generated crate references must be emitted", () => {
  it("holds for a model that declares nothing at all", async () => {
    const out = await fs.mkdtemp("/tmp/seed-files-");
    await generateApplication({
      sources: BARE,
      model: parseModel(BARE),
      projectName: "bare",
      outputDir: out,
      skipFrontend: true,
      skipTests: true,
      skipCliScaffold: true,
    });

    const tasksDir = path.join(out, "backend", "src", "tasks");
    const taskFiles = (await fs.readdir(tasksDir)).filter((name) => name.endsWith(".rs"));

    const embedded: string[] = [];
    for (const name of taskFiles) {
      const source = await fs.readFile(path.join(tasksDir, name), "utf-8");
      for (const match of source.matchAll(/include_str!\("([^"]+)"\)/g)) {
        embedded.push(path.resolve(tasksDir, match[1] as string));
      }
    }

    // If this is empty the test proves nothing, so say so rather than pass.
    expect(embedded.length).toBeGreaterThan(0);

    for (const file of embedded) {
      const exists = await fs
        .stat(file)
        .then(() => true)
        .catch(() => false);
      expect(exists, `${path.relative(out, file)} is embedded but was not emitted`).toBe(true);
    }

    /*
     * Every migration emitted is also registered.
     *
     * `migration/src/lib.rs` lists the migrations by hand, twice — a `mod` line
     * and a `Box::new(...)` entry. A file emitted but left out of that list is
     * simply never run, and the seeds needing its tables then fail with a
     * missing-relation error that names nothing about the omission. This is the
     * Loco form of the `scaffold` array trap.
     */
    const migrationDir = path.join(out, "backend", "migration", "src");
    const emitted = (await fs.readdir(migrationDir))
      .filter((name) => name.startsWith("m") && name.endsWith(".rs"))
      .map((name) => name.replace(/\.rs$/, ""))
      .sort();
    const lib = await fs.readFile(path.join(migrationDir, "lib.rs"), "utf-8");

    expect(emitted.length).toBeGreaterThan(0);
    for (const slug of emitted) {
      expect(lib, `${slug}.rs is emitted but has no \`mod\` line`).toContain(`mod ${slug};`);
      expect(lib, `${slug} is emitted but never runs`).toContain(`Box::new(${slug}::Migration)`);
    }

    // And nothing is registered that was not emitted, which would not compile.
    for (const match of lib.matchAll(/Box::new\((m\w+)::Migration\)/g)) {
      expect(emitted, `${match[1]} is registered but was not emitted`).toContain(match[1]);
    }

    /*
     * Every module declared is also emitted.
     *
     * `src/services/mod.rs` and `src/tasks/mod.rs` list their modules by hand,
     * and a `pub mod` naming a template nobody registered in `RENDERED_FILES`
     * is a crate that does not compile. The parity gate cannot see it: both
     * generators read the same list, so both omit the same file and their
     * outputs still match — `system_config` shipped that way for exactly one
     * run of this suite. Registering it in only *one* generator is what parity
     * does catch; registering it in neither is what this does.
     */
    for (const dir of ["services", "tasks"]) {
      const modDir = path.join(out, "backend", "src", dir);
      const declared = [
        ...(await fs.readFile(path.join(modDir, "mod.rs"), "utf-8")).matchAll(/^pub mod (\w+);/gm),
      ].map((match) => match[1] as string);

      expect(declared.length, `${dir}/mod.rs declares no modules`).toBeGreaterThan(0);

      for (const name of declared) {
        const exists = await fs
          .stat(path.join(modDir, `${name}.rs`))
          .then(() => true)
          .catch(() => false);
        expect(exists, `src/${dir}/mod.rs declares ${name} but no file was emitted`).toBe(true);
      }
    }

    await fs.rm(out, { recursive: true, force: true });
  }, 120_000);
});
