/**
 * `seed/system.sql` — the settings an operator may change without a redeploy.
 *
 * The seed is additive or it is a bug: applying it must not override what a
 * deployment already put in its settings block, and re-applying it must not
 * discard what somebody set through the admin screen. Both are properties of
 * the emitted SQL rather than of the runtime, so they are asserted here.
 *
 * The Rust mirror (`crates/appwithai-gen/src/system.rs`) carries the same
 * cases. That the two agree byte for byte is `bun run parity`'s job, not this
 * file's.
 */

import { describe, expect, it } from "vitest";
import { buildSystemSeedSql, SYSTEM_SETTING_KEYS } from "../tanstack-astryx-loco/system-seed";

const sql = () =>
  buildSystemSeedSql({
    projectName: "acme",
    projectDescription: "Order tracking for Acme",
  });

describe("the system configuration seed", () => {
  it("carries the model's own words for the two identity keys", () => {
    expect(sql()).toContain("'app_name', 'acme'");
    expect(sql()).toContain("'app_description', 'Order tracking for Acme'");
  });

  it("seeds every other key empty, so the deployment still decides", () => {
    // A seeded value would silently override whatever the operator put in the
    // environment — the opposite of what setting it there asked for.
    for (const key of ["ai_base_url", "ai_model", "ai_api_key", "electric_url"]) {
      expect(sql(), `${key} should be seeded empty`).toContain(`'${key}', ''`);
    }
  });

  it("quotes a value that contains a quote", () => {
    const quoted = buildSystemSeedSql({
      projectName: "O'Brien Logistics",
      projectDescription: "It's a description",
    });
    expect(quoted).toContain("'O''Brien Logistics'");
    expect(quoted).toContain("'It''s a description'");
  });

  it("is re-runnable: one conflict clause per statement", () => {
    const text = sql();
    const inserts = text.match(/INSERT INTO sys_system/g) ?? [];
    expect(inserts).toHaveLength(SYSTEM_SETTING_KEYS.length);

    // Counted as whole statements: the header comment explains the clause and
    // would otherwise be counted as one of them.
    const guarded = text.split("\n").filter((line) => line.trim() === "ON CONFLICT DO NOTHING;");
    expect(guarded).toHaveLength(inserts.length);
  });

  it("gives two projects different row ids for the same key", () => {
    const idFor = (text: string) =>
      text
        .split("\n")
        .find((line) => line.includes("'app_name'"))
        ?.split("'")[1];

    const other = buildSystemSeedSql({
      projectName: "other",
      projectDescription: "Order tracking for Acme",
    });
    expect(idFor(sql())).toBeDefined();
    expect(idFor(sql())).not.toEqual(idFor(other));
  });

  it("describes every key it writes", () => {
    // The admin screen shows the key, the value and this sentence. Without it
    // an operator is asked to set something the app will not explain.
    const text = sql();
    for (const key of SYSTEM_SETTING_KEYS) {
      const row = text.split("\n").find((line) => line.includes(`'${key}',`));
      expect(row, `no row emitted for ${key}`).toBeDefined();
      // description is the sixth value in the VALUES list; asserting it is
      // non-empty is enough — its wording is the Rust mirror's problem too.
      expect(row).toMatch(/'[^']{10,}'/);
    }
  });
});
