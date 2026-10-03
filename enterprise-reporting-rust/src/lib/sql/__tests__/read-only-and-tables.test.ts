/**
 * The two checks that stand between a signed-in user and somebody else's data.
 *
 * Both of these were bypassable, and both bypasses were one character wide:
 *
 *   - `isReadOnlyQuery` tested only the leading keyword, so
 *     `SELECT 1 LIMIT 1; DROP TABLE users` passed as a read.
 *   - `validateQueryAccess` allowed any query whose tables it could not
 *     determine, and the extractor behind it was a regular expression — so
 *     `SELECT * FROM(hr_salaries)`, with the space removed, named no tables and
 *     was therefore permitted to read all of them.
 *
 * The cases below are those bypasses. They are written as the attack, not as
 * the implementation, so that a future rewrite of either function is still held
 * to refusing the thing that was once allowed.
 */

import { describe, expect, it } from "bun:test";
import { extractTablesStrict } from "../antlr-validator";
import { isReadOnlyQuery } from "../validator";

describe("isReadOnlyQuery", () => {
  it("accepts a single read statement", () => {
    expect(isReadOnlyQuery("SELECT * FROM hr_salaries")).toBe(true);
    expect(isReadOnlyQuery("WITH a AS (SELECT 1) SELECT * FROM a")).toBe(true);
    expect(isReadOnlyQuery("SELECT 1;")).toBe(true);
  });

  it("refuses a write", () => {
    expect(isReadOnlyQuery("DELETE FROM users")).toBe(false);
    expect(isReadOnlyQuery("UPDATE users SET is_active = false")).toBe(false);
  });

  it("refuses a write smuggled behind a leading SELECT", () => {
    expect(isReadOnlyQuery("SELECT 1; DROP TABLE users")).toBe(false);
    expect(isReadOnlyQuery("SELECT 1 LIMIT 1; DROP TABLE users")).toBe(false);
  });

  it("does not mistake a semicolon inside a string for a statement break", () => {
    expect(isReadOnlyQuery("SELECT ';' AS semicolon_in_string")).toBe(true);
    expect(isReadOnlyQuery("SELECT 'a;b' FROM t WHERE x = 'c;d'")).toBe(true);
  });

  it("strips leading comments of both kinds, in any order", () => {
    expect(isReadOnlyQuery("-- note\nSELECT 1")).toBe(true);
    expect(isReadOnlyQuery("/* note */ SELECT 1")).toBe(true);
    expect(isReadOnlyQuery("/* a */ -- b\nSELECT 1")).toBe(true);
    expect(isReadOnlyQuery("-- a\n/* b */ DROP TABLE users")).toBe(false);
  });
});

describe("extractTablesStrict", () => {
  const tablesOf = (sql: string) => {
    const result = extractTablesStrict(sql);
    return result.ok ? result.tables.slice().sort() : null;
  };

  it("finds the table in a plain select", () => {
    expect(tablesOf("SELECT * FROM hr_salaries")).toEqual(["hr_salaries"]);
    expect(tablesOf("SELECT * FROM a JOIN b ON a.id = b.id")).toEqual(["a", "b"]);
  });

  it("finds a table the old regex missed for want of a space", () => {
    expect(tablesOf("SELECT * FROM(hr_salaries)")).toEqual(["hr_salaries"]);
  });

  it("finds a table read through a subquery", () => {
    expect(tablesOf("SELECT * FROM (SELECT * FROM hr_salaries) x")).toEqual(["hr_salaries"]);
  });

  it("reports the table behind a CTE, not the alias in front of it", () => {
    expect(tablesOf("WITH a AS (SELECT * FROM hr_salaries) SELECT * FROM a")).toEqual([
      "hr_salaries",
    ]);
  });

  it("allows a statement that genuinely reads nothing", () => {
    expect(tablesOf("SELECT 1")).toEqual([]);
  });

  it("refuses what it cannot parse, rather than allowing it", () => {
    expect(extractTablesStrict("this is not sql at all !!").ok).toBe(false);
    expect(extractTablesStrict("").ok).toBe(false);
  });
});
